/**
 * Multi-Lingual Technical Translation Service
 * Uses Gemini's high-context window to translate technical deviations
 * while maintaining technical nuances that standard translators miss.
 */

import { GoogleGenAI } from "@google/genai";
import { DeviationRecord } from "../types";

export type SupportedLanguage = 'English' | 'Deutsch' | '日本語';

export interface TranslationResult {
  translatedRecord: DeviationRecord;
  confidence: number;
  technicalTermsPreserved: string[];
  untranslatableTerms: string[];
}

export class TranslationService {
  private ai: GoogleGenAI;
  private technicalGlossary: Map<string, Map<SupportedLanguage, string>>;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
    this.technicalGlossary = this.initializeGlossary();
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

    // Build glossary context for AI
    const glossaryContext = this.buildGlossaryContext(targetLanguage);

    // Prepare translation prompt with technical context
    const prompt = this.buildTranslationPrompt(deviation, targetLanguage, glossaryContext);

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              translatedRecord: {
                type: "object",
                description: "Complete translated deviation record maintaining all structure"
              },
              confidence: {
                type: "number",
                description: "Translation confidence score 0-1"
              },
              technicalTermsPreserved: {
                type: "array",
                items: { type: "string" },
                description: "List of technical terms that were preserved"
              },
              untranslatableTerms: {
                type: "array",
                items: { type: "string" },
                description: "Terms that could not be translated"
              }
            },
            required: ["translatedRecord", "confidence", "technicalTermsPreserved", "untranslatableTerms"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
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
      const response = await this.ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
      });

      return response.text || text;
    } catch (error) {
      console.error('Real-time translation error:', error);
      return text; // Return original on error
    }
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
