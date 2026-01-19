/**
 * Multi-Lingual Technical Translation Service
 * Uses AI with high-context window to translate technical deviations
 * while maintaining technical nuances that standard translators miss.
 */

import { DeviationRecord } from "../types";

export type SupportedLanguage = 'English' | 'Deutsch' | '日本語';

export interface TranslationResult {
  translatedRecord: DeviationRecord;
  confidence: number;
  technicalTermsPreserved: string[];
  untranslatableTerms: string[];
}

export class TranslationService {
  private apiKey: string;
  private provider: string;
  private technicalGlossary: Map<string, Map<SupportedLanguage, string>>;

  constructor() {
    // Get API key from environment (supports multiple providers)
    this.apiKey = (typeof process !== 'undefined' && process.env?.AI_API_KEY) ||
                  (typeof process !== 'undefined' && process.env?.API_KEY) ||
                  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                  (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) ||
                  (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) ||
                  '';
    
    if (!this.apiKey) {
      console.warn('TranslationService: AI API key not found. Translation features will be disabled.');
      this.provider = 'none';
      this.technicalGlossary = this.initializeGlossary();
      return;
    }

    // Detect provider
    this.provider = (typeof process !== 'undefined' && process.env?.AI_PROVIDER) || this.detectProvider(this.apiKey);
    this.technicalGlossary = this.initializeGlossary();
  }

  /**
   * Detect AI provider from API key format
   */
  private detectProvider(apiKey: string): string {
    if (apiKey.startsWith('sk-') && apiKey.length > 40) {
      return 'openai';
    } else if (apiKey.startsWith('sk-ant-')) {
      return 'anthropic';
    } else {
      return 'gemini'; // Default
    }
  }

  /**
   * Initialize technical glossary with Webasto-specific terms
   */
  private initializeGlossary(): Map<string, Map<SupportedLanguage, string>> {
    const glossary = new Map<string, Map<SupportedLanguage, string>>();

    // Technical terms that must be preserved or translated consistently
    const terms = [
      {
        key: 'PPAP',
        translations: { English: 'PPAP', Deutsch: 'PPAP', 日本語: 'PPAP' }
      },
      {
        key: 'EMPB',
        translations: { English: 'EMPB', Deutsch: 'EMPB', 日本語: 'EMPB' }
      },
      {
        key: 'FMEA',
        translations: { English: 'FMEA', Deutsch: 'FMEA', 日本語: 'FMEA' }
      },
      {
        key: 'RPN',
        translations: { English: 'RPN', Deutsch: 'RPN', 日本語: 'RPN' }
      },
      {
        key: 'IATF 16949',
        translations: { English: 'IATF 16949', Deutsch: 'IATF 16949', 日本語: 'IATF 16949' }
      },
      {
        key: 'SDA',
        translations: { English: 'SDA', Deutsch: 'SDA', 日本語: 'SDA' }
      },
      {
        key: 'CAPA',
        translations: { English: 'CAPA', Deutsch: 'CAPA', 日本語: 'CAPA' }
      },
      {
        key: '8D',
        translations: { English: '8D', Deutsch: '8D', 日本語: '8D' }
      },
      // Dimensional terms
      {
        key: 'dimensional deviation',
        translations: { 
          English: 'dimensional deviation', 
          Deutsch: 'Maßabweichung', 
          日本語: '寸法偏差' 
        }
      },
      {
        key: 'functional deviation',
        translations: { 
          English: 'functional deviation', 
          Deutsch: 'Funktionsabweichung', 
          日本語: '機能偏差' 
        }
      },
      // Quality terms
      {
        key: 'non-conformity',
        translations: { 
          English: 'non-conformity', 
          Deutsch: 'Nichtkonformität', 
          日本語: '不適合' 
        }
      },
      {
        key: 'corrective action',
        translations: { 
          English: 'corrective action', 
          Deutsch: 'Korrekturmaßnahme', 
          日本語: '是正処置' 
        }
      },
    ];

    for (const term of terms) {
      glossary.set(term.key, new Map(Object.entries(term.translations) as [SupportedLanguage, string][]));
    }

    return glossary;
  }

  /**
   * Add custom technical term to glossary
   */
  addTechnicalTerm(key: string, translations: Partial<Record<SupportedLanguage, string>>): void {
    const termMap = new Map<SupportedLanguage, string>();
    for (const [lang, translation] of Object.entries(translations)) {
      termMap.set(lang as SupportedLanguage, translation);
    }
    this.technicalGlossary.set(key, termMap);
  }

  /**
   * Translate a deviation record to target language
   */
  async translateDeviation(
    deviation: DeviationRecord,
    targetLanguage: SupportedLanguage
  ): Promise<TranslationResult> {
    // Don't translate if already in target language
    if (deviation.classification.language === targetLanguage) {
      return {
        translatedRecord: deviation,
        confidence: 1.0,
        technicalTermsPreserved: [],
        untranslatableTerms: [],
      };
    }

    // Check if API key is available
    if (!this.apiKey || this.provider === 'none') {
      throw new Error('Translation service is not available. Please configure an AI API key in environment variables.');
    }

    // Build glossary context for AI
    const glossaryContext = this.buildGlossaryContext(targetLanguage);

    // Prepare translation prompt with technical context
    const prompt = this.buildTranslationPrompt(deviation, targetLanguage, glossaryContext);

    try {
      let result: any;
      
      if (this.provider === 'openai') {
        result = await this.translateWithOpenAI(prompt);
      } else if (this.provider === 'anthropic') {
        result = await this.translateWithAnthropic(prompt);
      } else {
        // Default to Gemini
        result = await this.translateWithGemini(prompt);
      }
      
      return {
        translatedRecord: {
          ...result.translatedRecord,
          classification: {
            ...result.translatedRecord.classification,
            language: targetLanguage,
          }
        } as DeviationRecord,
        confidence: result.confidence || 0.8,
        technicalTermsPreserved: result.technicalTermsPreserved || [],
        untranslatableTerms: result.untranslatableTerms || [],
      };
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return original with language updated
      return {
        translatedRecord: {
          ...deviation,
          classification: {
            ...deviation.classification,
            language: targetLanguage,
          }
        },
        confidence: 0.0,
        technicalTermsPreserved: [],
        untranslatableTerms: [],
      };
    }
  }

  /**
   * Translate text in real-time (for form fields)
   */
  async translateText(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    context?: string
  ): Promise<string> {
    if (sourceLanguage === targetLanguage || !text.trim()) {
      return text;
    }

    const glossaryContext = this.buildGlossaryContext(targetLanguage);
    const prompt = `
You are a technical translator specializing in automotive quality management and manufacturing terminology.

Translate the following text from ${sourceLanguage} to ${targetLanguage}, maintaining all technical accuracy and terminology.

${context ? `Context: ${context}\n` : ''}

Technical Glossary (use these exact translations):
${glossaryContext}

Text to translate:
${text}

Return ONLY the translated text, maintaining technical terms from the glossary exactly as specified.
`;

    try {
      if (this.provider === 'openai') {
        return await this.translateTextWithOpenAI(text, sourceLanguage, targetLanguage, context);
      } else if (this.provider === 'anthropic') {
        return await this.translateTextWithAnthropic(text, sourceLanguage, targetLanguage, context);
      } else {
        return await this.translateTextWithGemini(text, sourceLanguage, targetLanguage, context);
      }
    } catch (error) {
      console.error('Real-time translation error:', error);
      return text; // Return original on error
    }
  }

  /**
   * Translate with Gemini
   */
  private async translateWithGemini(prompt: string): Promise<any> {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              translatedRecord: { type: "object" },
              confidence: { type: "number" },
              technicalTermsPreserved: { type: "array", items: { type: "string" } },
              untranslatableTerms: { type: "array", items: { type: "string" } }
            },
            required: ["translatedRecord", "confidence", "technicalTermsPreserved", "untranslatableTerms"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      throw new Error(`Gemini translation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Translate with OpenAI
   */
  private async translateWithOpenAI(prompt: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a technical translator. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content || '{}');
  }

  /**
   * Translate with Anthropic
   */
  private async translateWithAnthropic(prompt: string): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{ role: 'user', content: `${prompt}\n\nRespond with ONLY valid JSON.` }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);
    const data = await response.json();
    return JSON.parse(data.content[0].text || '{}');
  }

  /**
   * Translate text with Gemini
   */
  private async translateTextWithGemini(text: string, sourceLanguage: SupportedLanguage, targetLanguage: SupportedLanguage, context?: string): Promise<string> {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const glossaryContext = this.buildGlossaryContext(targetLanguage);
    const prompt = `
You are a technical translator specializing in automotive quality management systems (IATF 16949) and manufacturing terminology.

Translate the following text from ${sourceLanguage} to ${targetLanguage}, maintaining all technical accuracy and terminology.

${context ? `Context: ${context}\n` : ''}

Technical Glossary (use these exact translations):
${glossaryContext}

Text to translate:
${text}

Return ONLY the translated text, maintaining technical terms from the glossary exactly as specified.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    return response.text || text;
  }

  /**
   * Translate text with OpenAI
   */
  private async translateTextWithOpenAI(text: string, sourceLanguage: SupportedLanguage, targetLanguage: SupportedLanguage, context?: string): Promise<string> {
    const glossaryContext = this.buildGlossaryContext(targetLanguage);
    const prompt = `
Translate from ${sourceLanguage} to ${targetLanguage}, maintaining technical accuracy.

${context ? `Context: ${context}\n` : ''}

Technical Glossary:
${glossaryContext}

Text: ${text}

Return ONLY the translated text.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a technical translator. Return only the translated text.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content || text;
  }

  /**
   * Translate text with Anthropic
   */
  private async translateTextWithAnthropic(text: string, sourceLanguage: SupportedLanguage, targetLanguage: SupportedLanguage, context?: string): Promise<string> {
    const glossaryContext = this.buildGlossaryContext(targetLanguage);
    const prompt = `
Translate from ${sourceLanguage} to ${targetLanguage}, maintaining technical accuracy.

${context ? `Context: ${context}\n` : ''}

Technical Glossary:
${glossaryContext}

Text: ${text}

Return ONLY the translated text.
`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);
    const data = await response.json();
    return data.content[0].text || text;
  }

  /**
   * Build glossary context string for AI prompt
   */
  private buildGlossaryContext(targetLanguage: SupportedLanguage): string {
    const context: string[] = [];
    for (const [key, translations] of this.technicalGlossary.entries()) {
      const translation = translations.get(targetLanguage);
      if (translation) {
        context.push(`- "${key}" → "${translation}"`);
      }
    }
    return context.join('\n');
  }

  /**
   * Build comprehensive translation prompt
   */
  private buildTranslationPrompt(
    deviation: DeviationRecord,
    targetLanguage: SupportedLanguage,
    glossaryContext: string
  ): string {
    return `
You are a Senior Technical Translator specializing in automotive quality management systems (IATF 16949) and manufacturing terminology.

Translate this Supplier Deviation Approval (SDA) record from ${deviation.classification.language} to ${targetLanguage}.

CRITICAL REQUIREMENTS:
1. Maintain ALL technical accuracy - this is a legal quality document
2. Preserve all technical terms from the glossary exactly as specified
3. Keep all data structures, IDs, and codes unchanged
4. Maintain professional tone appropriate for quality management documentation
5. Preserve measurement units, part numbers, and technical specifications exactly
6. Translate only user-facing text fields, not system fields

TECHNICAL GLOSSARY (use these exact translations):
${glossaryContext}

TRANSLATION RULES:
- Part numbers, material codes, and IDs: DO NOT TRANSLATE
- Technical specifications: Translate descriptions but preserve measurements
- Risk assessments: Translate explanations but preserve numeric values
- Approval roles: Translate role names appropriately
- Dates and numbers: Keep in original format

SDA Record to Translate:
${JSON.stringify(deviation, null, 2)}

Return the complete translated deviation record as JSON, maintaining the exact same structure.
`;
  }
}
