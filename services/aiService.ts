/**
 * AI Service - Provider-Agnostic AI Integration
 * Supports multiple AI providers based on API key configuration
 */

import { DeviationRecord, AIResponse } from "../types";
import { RedactionService } from "./redactionService";

export type AIProvider = 'auto' | 'gemini' | 'openai' | 'anthropic' | 'custom';

export interface AIConfig {
  apiKey: string;
  provider?: AIProvider;
  model?: string;
  baseURL?: string;
}

export class AIService {
  private redactionService: RedactionService;
  private config: AIConfig;
  private provider: AIProvider;

  constructor(config?: Partial<AIConfig>) {
    this.redactionService = new RedactionService();
    
    // Get API key from environment or config
    const apiKey = config?.apiKey || 
                   process.env.AI_API_KEY || 
                   process.env.API_KEY || 
                   process.env.GEMINI_API_KEY || 
                   process.env.OPENAI_API_KEY ||
                   process.env.ANTHROPIC_API_KEY ||
                   '';
    
    if (!apiKey) {
      throw new Error('AI API key is required. Set AI_API_KEY, API_KEY, or provider-specific key in environment variables.');
    }

    // Detect provider from API key format or explicit config
    this.provider = config?.provider || this.detectProvider(apiKey);
    
    this.config = {
      apiKey,
      provider: this.provider,
      model: config?.model || this.getDefaultModel(this.provider),
      baseURL: config?.baseURL,
    };
  }

  /**
   * Detect AI provider from API key format
   */
  private detectProvider(apiKey: string): AIProvider {
    // Check for explicit provider in environment
    if (process.env.AI_PROVIDER) {
      return process.env.AI_PROVIDER as AIProvider;
    }

    // Detect by API key format
    if (apiKey.startsWith('sk-') && apiKey.length > 40) {
      // OpenAI format
      return 'openai';
    } else if (apiKey.startsWith('sk-ant-')) {
      // Anthropic format
      return 'anthropic';
    } else if (apiKey.length > 30 && !apiKey.includes('-')) {
      // Gemini format (long alphanumeric)
      return 'gemini';
    }
    
    // Default to auto-detect
    return 'auto';
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: AIProvider): string {
    const defaults: Record<AIProvider, string> = {
      'auto': 'auto',
      'gemini': 'gemini-3-pro-preview',
      'openai': 'gpt-4-turbo-preview',
      'anthropic': 'claude-3-opus-20240229',
      'custom': 'default',
    };
    return defaults[provider] || 'auto';
  }

  /**
   * Analyze deviation using configured AI provider
   */
  async analyzeDeviation(record: DeviationRecord, redactionMode: boolean): Promise<AIResponse> {
    let preparedData = JSON.parse(JSON.stringify(record));
    
    // Enhanced intelligent redaction
    if (redactionMode) {
      const redactionResult = await this.redactionService.redactData(
        preparedData,
        'automatic'
      );
      preparedData = redactionResult.redactedData;
      
      // Log redaction for audit trail (in production, store this)
      if (redactionResult.redactionLog.length > 0) {
        console.log('[Redaction] PII detected and masked:', redactionResult.redactionLog);
      }
    }

    // Route to appropriate provider implementation
    switch (this.provider) {
      case 'gemini':
        return this.analyzeWithGemini(preparedData);
      case 'openai':
        return this.analyzeWithOpenAI(preparedData);
      case 'anthropic':
        return this.analyzeWithAnthropic(preparedData);
      default:
        // Try Gemini first (most common), fallback to OpenAI
        try {
          return await this.analyzeWithGemini(preparedData);
        } catch (e) {
          console.warn('Gemini failed, trying OpenAI...', e);
          return await this.analyzeWithOpenAI(preparedData);
        }
    }
  }

  /**
   * Analyze with Gemini (if @google/genai is available)
   */
  private async analyzeWithGemini(preparedData: any): Promise<AIResponse> {
    try {
      // Dynamic import to avoid errors if package not installed
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });

      const prompt = this.buildAnalysisPrompt(preparedData);

      const response = await ai.models.generateContent({
        model: this.config.model || "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: this.getResponseSchema(Type),
            required: ['checks', 'riskSuggestions', 'opportunities', 'similarCases', 'iatfScore', 'summary']
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze with OpenAI
   */
  private async analyzeWithOpenAI(preparedData: any): Promise<AIResponse> {
    const prompt = this.buildAnalysisPrompt(preparedData);
    const schema = this.getOpenAISchema();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a Senior Quality Architect & Lead Auditor (IATF 16949) at Webasto. Respond only with valid JSON matching the provided schema.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_schema', json_schema: { schema, strict: true } },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze with Anthropic Claude
   */
  private async analyzeWithAnthropic(preparedData: any): Promise<AIResponse> {
    const prompt = this.buildAnalysisPrompt(preparedData);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `You are a Senior Quality Architect & Lead Auditor (IATF 16949) at Webasto. Analyze this Supplier Deviation Approval (SDA) record and provide a multi-dimensional intelligence report in valid JSON format.\n\n${prompt}\n\nRespond with ONLY valid JSON matching the expected schema.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      return JSON.parse(content || '{}');
    } catch (error) {
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(preparedData: any): string {
    return `
      You are a Senior Quality Architect & Lead Auditor (IATF 16949) at Webasto. 
      Analyze this Supplier Deviation Approval (SDA) record and provide a multi-dimensional intelligence report.
      
      Tasks:
      1. Completeness & Logical Consistency: Scan all fields.
      2. Risk Identification: Propose FMEA risks (S/O/D) with technical reasoning.
      3. Opportunities: Suggest cost, quality, or process improvements based on the deviation.
      4. Similarity Search: Simulate searching the Webasto database. Return 2-3 hypothetical similar past cases with similarity scores.
      5. IATF 16949 Compliance: Score the record (0-100) based on audit requirements (documentation, containment, corrective actions).
      6. Executives Summary & Artifacts (SAP Draft, Email).

      SDA Data:
      ${JSON.stringify(preparedData)}
    `;
  }

  /**
   * Get response schema for Gemini
   */
  private getResponseSchema(Type: any): any {
    return {
      checks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, enum: ['blocking', 'warning'] },
            field: { type: Type.STRING },
            message: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          },
          required: ['severity', 'field', 'message', 'suggestion']
        }
      },
      riskSuggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING, enum: ['Supplier', 'Webasto'] },
            description: { type: Type.STRING },
            s: { type: Type.NUMBER },
            o: { type: Type.NUMBER },
            d: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ['source', 'description', 's', 'o', 'd', 'reasoning']
        }
      },
      opportunities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['quality', 'delivery', 'cost', 'compliance'] },
            description: { type: Type.STRING },
            benefit: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ['category', 'description', 'benefit', 'confidence']
        }
      },
      similarCases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            similarity: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ['id', 'similarity', 'reason']
        }
      },
      iatfScore: { type: Type.NUMBER },
      summary: {
        type: Type.OBJECT,
        properties: {
          executive: { type: Type.ARRAY, items: { type: Type.STRING } },
          sapDraft: { type: Type.STRING },
          email: { type: Type.STRING }
        },
        required: ['executive', 'sapDraft', 'email']
      }
    };
  }

  /**
   * Get OpenAI JSON schema format
   */
  private getOpenAISchema(): any {
    return {
      type: 'object',
      properties: {
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['blocking', 'warning'] },
              field: { type: 'string' },
              message: { type: 'string' },
              suggestion: { type: 'string' }
            },
            required: ['severity', 'field', 'message', 'suggestion']
          }
        },
        riskSuggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', enum: ['Supplier', 'Webasto'] },
              description: { type: 'string' },
              s: { type: 'number' },
              o: { type: 'number' },
              d: { type: 'number' },
              reasoning: { type: 'string' }
            },
            required: ['source', 'description', 's', 'o', 'd', 'reasoning']
          }
        },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['quality', 'delivery', 'cost', 'compliance'] },
              description: { type: 'string' },
              benefit: { type: 'string' },
              confidence: { type: 'number' }
            },
            required: ['category', 'description', 'benefit', 'confidence']
          }
        },
        similarCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              similarity: { type: 'number' },
              reason: { type: 'string' }
            },
            required: ['id', 'similarity', 'reason']
          }
        },
        iatfScore: { type: 'number' },
        summary: {
          type: 'object',
          properties: {
            executive: { type: 'array', items: { type: 'string' } },
            sapDraft: { type: 'string' },
            email: { type: 'string' }
          },
          required: ['executive', 'sapDraft', 'email']
        }
      },
      required: ['checks', 'riskSuggestions', 'opportunities', 'similarCases', 'iatfScore', 'summary']
    };
  }
}
