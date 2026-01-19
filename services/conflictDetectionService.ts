/**
 * Conflict Detection Service
 * Detects similarity conflicts with historical deviations to prevent
 * inconsistent quality decisions across Webasto plants.
 */

import { DeviationRecord, WorkflowStatus } from "../types";
import { AIService } from "./aiService";

export interface ConflictAlert {
  severity: 'blocking' | 'warning';
  similarDeviationId: string;
  plant: string;
  previousDecision: 'Approved' | 'Rejected';
  decisionDate: string;
  similarity: number; // 0-1
  reason: string;
  recommendation: string;
  materialNo: string;
  supplierName: string;
  deviationDescription: string;
}

export interface ConflictCheckResult {
  conflicts: ConflictAlert[];
  hasBlockingConflicts: boolean;
  hasWarnings: boolean;
  checkedAt: string;
}

export class ConflictDetectionService {
  private aiService: AIService;
  private historicalDeviations: DeviationRecord[] = [];

  constructor() {
    this.aiService = new AIService();
    // In production, this would fetch from a database/API
    this.loadHistoricalDeviations();
  }

  /**
   * Load historical deviations (mock data for now)
   * In production, this would fetch from a backend API
   */
  private loadHistoricalDeviations(): void {
    // Mock historical data - in production, fetch from API
    this.historicalDeviations = [
      {
        id: 'DAI_ET-2025-1105',
        status: WorkflowStatus.Rejected,
        classification: {
          language: 'English',
          bu: 'ET' as any,
          trigger: '0030 Dimensional deviation' as any,
          duration: '≤ 3 months & prior to handover' as any,
        },
        masterData: {
          requestDate: '2025-11-12',
          requestor: 'John Doe',
          department: 'Quality Engineering',
          materialNo: '882-103-X',
          changeLevel: '',
          furtherMaterials: false,
          description: 'Housing dimensional deviation exceeding tolerance',
          supplierIdent: 'SUP-1234',
          supplierName: 'Bosch Global',
          plant: 'Arad',
          projectTitle: 'Project Alpha',
          expirationDate: '',
          customerInformed: false,
          customerReleaseNecessary: false,
          productSafetyRelevant: false,
          attachments: [],
        },
        details: {
          specification: 'Dimension 4.5 +/- 0.1mm',
          deviation: 'Actual dimension: 4.8mm - exceeds tolerance',
        },
        risks: [],
        actions: [],
        stock: { useExisting: false },
        approvals: [],
        extensions: [],
      },
      {
        id: 'DAI_RB-2025-0988',
        status: WorkflowStatus.Approved,
        classification: {
          language: 'English',
          bu: 'RB' as any,
          trigger: '0050 Software faulty' as any,
          duration: '> 3 months ≤ 9 months & prior to handover' as any,
        },
        masterData: {
          requestDate: '2025-10-05',
          requestor: 'Jane Smith',
          department: 'Quality Engineering',
          materialNo: 'RB-X102-S',
          changeLevel: '',
          furtherMaterials: false,
          description: 'Software logic mismatch in control unit',
          supplierIdent: 'SUP-5678',
          supplierName: 'Continental AG',
          plant: 'Neubrandenburg',
          projectTitle: 'Project Beta',
          expirationDate: '',
          customerInformed: false,
          customerReleaseNecessary: false,
          productSafetyRelevant: false,
          attachments: [],
        },
        details: {
          specification: 'Software version 2.1 required',
          deviation: 'Supplier provided version 2.0 with known bug',
        },
        risks: [],
        actions: [],
        stock: { useExisting: false },
        approvals: [],
        extensions: [],
      },
    ];
  }

  /**
   * Check for similarity conflicts in real-time
   */
  async checkSimilarityConflicts(
    deviation: Partial<DeviationRecord>
  ): Promise<ConflictCheckResult> {
    // Only check if we have enough data
    if (!deviation.masterData?.materialNo && !deviation.details?.deviation) {
      return {
        conflicts: [],
        hasBlockingConflicts: false,
        hasWarnings: false,
        checkedAt: new Date().toISOString(),
      };
    }

    const conflicts: ConflictAlert[] = [];

    // Filter historical deviations that might be similar
    const candidateDeviations = this.historicalDeviations.filter(hist => {
      // Match on material number or similar description
      const materialMatch = hist.masterData.materialNo === deviation.masterData?.materialNo;
      const supplierMatch = hist.masterData.supplierName === deviation.masterData?.supplierName;
      const triggerMatch = hist.classification.trigger === deviation.classification?.trigger;
      
      return materialMatch || (supplierMatch && triggerMatch);
    });

    // Use AI to check similarity and detect conflicts
    for (const historical of candidateDeviations) {
      // Skip if same plant (not a conflict)
      if (historical.masterData.plant === deviation.masterData?.plant) {
        continue;
      }

      // Only flag rejected deviations as conflicts (prevent approving what was rejected elsewhere)
      if (historical.status === WorkflowStatus.Rejected) {
        const similarity = await this.calculateSimilarity(deviation, historical);
        
        if (similarity > 0.7) {
          // High similarity with rejected deviation = blocking conflict
          conflicts.push({
            severity: 'blocking',
            similarDeviationId: historical.id,
            plant: historical.masterData.plant,
            previousDecision: 'Rejected',
            decisionDate: historical.masterData.requestDate,
            similarity,
            reason: `A similar deviation for material ${historical.masterData.materialNo} was REJECTED at ${historical.masterData.plant} plant.`,
            recommendation: `Review the rejection reason from ${historical.masterData.plant}. Consider escalating to Global Quality Lead if this deviation is truly different.`,
            materialNo: historical.masterData.materialNo,
            supplierName: historical.masterData.supplierName,
            deviationDescription: historical.details.deviation,
          });
        } else if (similarity > 0.5) {
          // Medium similarity = warning
          conflicts.push({
            severity: 'warning',
            similarDeviationId: historical.id,
            plant: historical.masterData.plant,
            previousDecision: 'Rejected',
            decisionDate: historical.masterData.requestDate,
            similarity,
            reason: `A potentially similar deviation for material ${historical.masterData.materialNo} was REJECTED at ${historical.masterData.plant} plant.`,
            recommendation: `Review the historical case to ensure consistency in quality decisions.`,
            materialNo: historical.masterData.materialNo,
            supplierName: historical.masterData.supplierName,
            deviationDescription: historical.details.deviation,
          });
        }
      } else if (historical.status === WorkflowStatus.Approved) {
        // Check for approved deviations with similar issues - might indicate a pattern
        const similarity = await this.calculateSimilarity(deviation, historical);
        
        if (similarity > 0.8 && deviation.masterData?.materialNo === historical.masterData.materialNo) {
          // Same material, very similar issue, but was approved elsewhere
          conflicts.push({
            severity: 'warning',
            similarDeviationId: historical.id,
            plant: historical.masterData.plant,
            previousDecision: 'Approved',
            decisionDate: historical.masterData.requestDate,
            similarity,
            reason: `A similar deviation for the same material was APPROVED at ${historical.masterData.plant} plant.`,
            recommendation: `Review the approval conditions to ensure consistency. This may indicate a systemic issue.`,
            materialNo: historical.masterData.materialNo,
            supplierName: historical.masterData.supplierName,
            deviationDescription: historical.details.deviation,
          });
        }
      }
    }

    return {
      conflicts,
      hasBlockingConflicts: conflicts.some(c => c.severity === 'blocking'),
      hasWarnings: conflicts.some(c => c.severity === 'warning'),
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate similarity between two deviations using AI
   */
  private async calculateSimilarity(
    current: Partial<DeviationRecord>,
    historical: DeviationRecord
  ): Promise<number> {
    // Extract key fields for comparison
    const currentKey = {
      materialNo: current.masterData?.materialNo || '',
      supplierName: current.masterData?.supplierName || '',
      trigger: current.classification?.trigger || '',
      deviation: current.details?.deviation || '',
      specification: current.details?.specification || '',
    };

    const historicalKey = {
      materialNo: historical.masterData.materialNo,
      supplierName: historical.masterData.supplierName,
      trigger: historical.classification.trigger,
      deviation: historical.details.deviation,
      specification: historical.details.specification,
    };

    // Use AI to calculate semantic similarity
    try {
      const prompt = `
You are a quality management expert. Calculate the similarity score (0-1) between these two deviation records.

Current Deviation:
- Material: ${currentKey.materialNo}
- Supplier: ${currentKey.supplierName}
- Trigger: ${currentKey.trigger}
- Deviation: ${currentKey.deviation}
- Specification: ${currentKey.specification}

Historical Deviation:
- Material: ${historicalKey.materialNo}
- Supplier: ${historicalKey.supplierName}
- Trigger: ${historicalKey.trigger}
- Deviation: ${historicalKey.deviation}
- Specification: ${historicalKey.specification}

Consider:
1. Same material number = high weight
2. Same supplier = medium weight
3. Same trigger code = medium weight
4. Similar deviation description = high weight
5. Same specification issue = high weight

Return ONLY a JSON object with a "similarity" field (number 0-1).
Example: {"similarity": 0.85}
`;

      const apiKey = process.env.AI_API_KEY || process.env.API_KEY || '';
      const provider = process.env.AI_PROVIDER || 'auto';

      let similarity = 0.5; // Default

      if (provider === 'openai' || apiKey.startsWith('sk-')) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: 'You are a similarity calculator. Return only valid JSON.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const result = JSON.parse(data.choices[0].message.content || '{"similarity": 0.5}');
          similarity = result.similarity || 0.5;
        }
      } else {
        // Fallback: Simple rule-based similarity
        similarity = this.calculateRuleBasedSimilarity(currentKey, historicalKey);
      }

      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      console.error('Similarity calculation error:', error);
      // Fallback to rule-based
      return this.calculateRuleBasedSimilarity(currentKey, historicalKey);
    }
  }

  /**
   * Rule-based similarity calculation (fallback)
   */
  private calculateRuleBasedSimilarity(
    current: any,
    historical: any
  ): number {
    let score = 0;
    let weight = 0;

    // Material number match (high weight)
    if (current.materialNo && historical.materialNo) {
      if (current.materialNo === historical.materialNo) {
        score += 0.4;
      }
      weight += 0.4;
    }

    // Supplier match (medium weight)
    if (current.supplierName && historical.supplierName) {
      if (current.supplierName.toLowerCase() === historical.supplierName.toLowerCase()) {
        score += 0.2;
      }
      weight += 0.2;
    }

    // Trigger match (medium weight)
    if (current.trigger && historical.trigger) {
      if (current.trigger === historical.trigger) {
        score += 0.2;
      }
      weight += 0.2;
    }

    // Deviation description similarity (high weight)
    if (current.deviation && historical.deviation) {
      const currentLower = current.deviation.toLowerCase();
      const historicalLower = historical.deviation.toLowerCase();
      
      // Simple keyword matching
      const currentWords = new Set(currentLower.split(/\s+/));
      const historicalWords = new Set(historicalLower.split(/\s+/));
      const commonWords = [...currentWords].filter(w => historicalWords.has(w) && w.length > 3);
      const similarity = commonWords.length / Math.max(currentWords.size, historicalWords.size);
      score += similarity * 0.2;
      weight += 0.2;
    }

    return weight > 0 ? score / weight : 0;
  }

  /**
   * Add historical deviation (for testing or API integration)
   */
  addHistoricalDeviation(deviation: DeviationRecord): void {
    this.historicalDeviations.push(deviation);
  }

  /**
   * Clear historical deviations (for testing)
   */
  clearHistoricalDeviations(): void {
    this.historicalDeviations = [];
  }
}
