
import { GoogleGenAI, Type } from "@google/genai";
import { DeviationRecord, AIResponse } from "../types";
import { RedactionService } from "./redactionService";

export class GeminiService {
  private ai: GoogleGenAI;
  private redactionService: RedactionService;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.redactionService = new RedactionService();
  }

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

    const prompt = `
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

    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
          },
          required: ['checks', 'riskSuggestions', 'opportunities', 'similarCases', 'iatfScore', 'summary']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }
}
