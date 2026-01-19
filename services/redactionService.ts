/**
 * Intelligent Redaction Service
 * Automatically detects and masks PII (Personally Identifiable Information)
 * before data leaves the Webasto firewall for AI processing.
 * Ensures GDPR and corporate data sovereignty compliance.
 */

export interface PIIMatch {
  type: 'name' | 'email' | 'phone' | 'partNumber' | 'supplierCode' | 'custom';
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  pattern?: string;
}

export interface RedactionResult {
  redactedData: any;
  detectedPII: PIIMatch[];
  redactionLog: {
    field: string;
    originalValue: string;
    redactedValue: string;
    piiTypes: string[];
  }[];
}

export class RedactionService {
  // PII Detection Patterns
  private readonly piiPatterns: Map<string, RegExp> = new Map([
    // Email addresses
    ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
    
    // Phone numbers (international formats)
    ['phone', /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g],
    
    // Supplier part numbers (common patterns: alphanumeric codes)
    ['partNumber', /\b[A-Z]{2,4}[-]?\d{3,6}[A-Z]?\b/g],
    
    // Supplier codes (Webasto-specific patterns)
    ['supplierCode', /\bSUP[-]?\d{4,6}\b/gi],
  ]);

  // Common name patterns (context-aware)
  private readonly namePatterns: RegExp[] = [
    /\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g, // Titles + names
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g, // First Last (Middle)
  ];

  // Custom patterns for Webasto-specific data
  private customPatterns: Map<string, RegExp> = new Map();

  /**
   * Add custom redaction pattern (e.g., for proprietary supplier codes)
   */
  addCustomPattern(name: string, pattern: RegExp): void {
    this.customPatterns.set(name, pattern);
  }

  /**
   * Detect PII in a text string
   */
  async detectPII(text: string): Promise<PIIMatch[]> {
    const matches: PIIMatch[] = [];

    // Check standard patterns
    for (const [type, pattern] of this.piiPatterns.entries()) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type: type as PIIMatch['type'],
          value: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.9,
          pattern: pattern.source,
        });
      }
    }

    // Check name patterns (lower confidence, context-dependent)
    for (const pattern of this.namePatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Filter out common false positives (common words, technical terms)
        const value = match[0];
        if (!this.isFalsePositive(value)) {
          matches.push({
            type: 'name',
            value,
            startIndex: match.index,
            endIndex: match.index + value.length,
            confidence: 0.7, // Lower confidence for names
            pattern: pattern.source,
          });
        }
      }
    }

    // Check custom patterns
    for (const [name, pattern] of this.customPatterns.entries()) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type: 'custom',
          value: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.8,
          pattern: pattern.source,
        });
      }
    }

    // Remove overlapping matches (keep highest confidence)
    return this.deduplicateMatches(matches);
  }

  /**
   * Redact PII from a data structure (recursive)
   */
  async redactData(
    data: any,
    mode: 'automatic' | 'manual' = 'automatic',
    path: string = '',
    log: RedactionResult['redactionLog'] = []
  ): Promise<RedactionResult> {
    const detectedPII: PIIMatch[] = [];
    let redactedData: any;

    if (typeof data === 'string') {
      // Detect PII in string
      const matches = await this.detectPII(data);
      detectedPII.push(...matches);

      // Redact if automatic mode or if PII detected
      if (mode === 'automatic' && matches.length > 0) {
        let redactedText = data;
        // Sort matches by start index (reverse) to avoid index shifting issues
        const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);
        
        for (const match of sortedMatches) {
          const replacement = this.getRedactionPlaceholder(match.type);
          redactedText = 
            redactedText.slice(0, match.startIndex) + 
            replacement + 
            redactedText.slice(match.endIndex);
        }

        if (redactedText !== data) {
          log.push({
            field: path,
            originalValue: data,
            redactedValue: redactedText,
            piiTypes: [...new Set(matches.map(m => m.type))],
          });
        }

        redactedData = redactedText;
      } else {
        redactedData = data;
      }
    } else if (Array.isArray(data)) {
      // Recursively process array
      const redactedArray: any[] = [];
      for (let i = 0; i < data.length; i++) {
        const result = await this.redactData(data[i], mode, `${path}[${i}]`, log);
        redactedArray.push(result.redactedData);
        detectedPII.push(...result.detectedPII);
      }
      redactedData = redactedArray;
    } else if (data !== null && typeof data === 'object') {
      // Recursively process object
      const redactedObject: any = {};
      for (const [key, value] of Object.entries(data)) {
        const newPath = path ? `${path}.${key}` : key;
        
        // Skip known safe fields (optional optimization)
        if (this.isKnownSafeField(key)) {
          redactedObject[key] = value;
          continue;
        }

        const result = await this.redactData(value, mode, newPath, log);
        redactedObject[key] = result.redactedData;
        detectedPII.push(...result.detectedPII);
      }
      redactedData = redactedObject;
    } else {
      // Primitive types (number, boolean, null, undefined)
      redactedData = data;
    }

    return {
      redactedData,
      detectedPII,
      redactionLog: log,
    };
  }

  /**
   * Get redaction placeholder based on PII type
   */
  private getRedactionPlaceholder(type: PIIMatch['type']): string {
    const placeholders: Record<PIIMatch['type'], string> = {
      name: '[REDACTED_NAME]',
      email: '[REDACTED_EMAIL]',
      phone: '[REDACTED_PHONE]',
      partNumber: '[REDACTED_PART]',
      supplierCode: '[REDACTED_SUPPLIER_CODE]',
      custom: '[REDACTED]',
    };
    return placeholders[type] || '[REDACTED]';
  }

  /**
   * Check if a potential name match is a false positive
   */
  private isFalsePositive(text: string): boolean {
    const falsePositives = [
      // Common technical terms
      'Material No', 'Part Number', 'Serial Number',
      'Quality Engineer', 'Project Manager', 'R&D Director',
      'Business Unit', 'Plant Director',
      // Common words that match name patterns
      'Webasto', 'Supplier', 'Customer', 'Approval',
    ];
    return falsePositives.some(fp => text.toLowerCase().includes(fp.toLowerCase()));
  }

  /**
   * Remove overlapping matches, keeping highest confidence
   */
  private deduplicateMatches(matches: PIIMatch[]): PIIMatch[] {
    if (matches.length === 0) return [];

    // Sort by confidence (descending)
    const sorted = [...matches].sort((a, b) => b.confidence - a.confidence);
    const result: PIIMatch[] = [];
    const usedIndices = new Set<number>();

    for (const match of sorted) {
      // Check if this match overlaps with any already added match
      const overlaps = result.some(existing => {
        return !(
          match.endIndex <= existing.startIndex ||
          match.startIndex >= existing.endIndex
        );
      });

      if (!overlaps) {
        result.push(match);
      }
    }

    // Sort result by start index
    return result.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Check if a field is known to be safe (optimization)
   */
  private isKnownSafeField(field: string): boolean {
    const safeFields = [
      'id', 'status', 'rpn', 'severity', 'occurrence', 'detection',
      'iatfScore', 'similarity', 'confidence',
    ];
    return safeFields.includes(field.toLowerCase());
  }

  /**
   * Quick redaction for simple string (synchronous)
   */
  redactString(text: string, detectedPII: PIIMatch[]): string {
    if (detectedPII.length === 0) return text;

    let redacted = text;
    const sortedMatches = [...detectedPII].sort((a, b) => b.startIndex - a.startIndex);

    for (const match of sortedMatches) {
      const replacement = this.getRedactionPlaceholder(match.type);
      redacted = 
        redacted.slice(0, match.startIndex) + 
        replacement + 
        redacted.slice(match.endIndex);
    }

    return redacted;
  }
}
