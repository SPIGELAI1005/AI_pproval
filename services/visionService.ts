import { DeviationRecord, RiskItem } from '../types';

export interface VisionFinding {
  title: string;
  detail: string;
  confidence: number; // 0..1
}

export interface VisionAnalysis {
  summary: string;
  findings: VisionFinding[];
  suggestedRisks: Array<Pick<RiskItem, 'source' | 'description' | 'severity' | 'occurrence' | 'detection' | 'rpn'>>;
  suggestedSeverity: { severity: number; rationale: string };
}

function detectProvider(apiKey: string): 'openai' | 'anthropic' | 'gemini' | 'unknown' {
  if (!apiKey) return 'unknown';
  if (process.env.AI_PROVIDER) return process.env.AI_PROVIDER as any;
  if (apiKey.startsWith('sk-') && apiKey.length > 40) return 'openai';
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.length > 30 && !apiKey.includes('-')) return 'gemini';
  return 'unknown';
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function fallbackAnalysis(deviation: DeviationRecord): VisionAnalysis {
  const trigger = String(deviation.classification.trigger);
  const material = deviation.masterData.materialNo || 'unknown material';

  return {
    summary:
      'Vision verification is available when using a vision-capable AI provider/model. A safe local fallback was used (no image inference).',
    findings: [
      {
        title: 'Evidence attached',
        detail: 'Photo and drawing were captured for audit trail. Enable a vision-capable provider to get visual non-conformity detection.',
        confidence: 0.6,
      },
      {
        title: 'Manual verification recommended',
        detail: `Verify the deviation against the latest drawing revision for ${material} (trigger: ${trigger}).`,
        confidence: 0.7,
      },
    ],
    suggestedRisks: [
      {
        source: 'Webasto',
        description: 'Potential detection gap: deviation may not be caught by current incoming inspection sampling plan.',
        severity: 6,
        occurrence: 4,
        detection: 6,
        rpn: 144,
      },
    ],
    suggestedSeverity: {
      severity: 6,
      rationale: 'Default severity suggestion based on limited context. Enable vision analysis for a more precise estimate.',
    },
  };
}

export class VisionService {
  async analyzeDeviationImage(
    imageFile: File,
    technicalDrawing: File | null,
    deviationContext: DeviationRecord
  ): Promise<VisionAnalysis> {
    const apiKey =
      process.env.AI_API_KEY ||
      process.env.API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      '';

    const provider = detectProvider(apiKey);

    // Only OpenAI is implemented here for true vision analysis (client-side). Others fall back safely.
    if (provider !== 'openai') return fallbackAnalysis(deviationContext);

    try {
      const photoUrl = await fileToDataUrl(imageFile);
      const drawingUrl = technicalDrawing ? await fileToDataUrl(technicalDrawing) : null;

      const system =
        'You are a Senior Quality Engineer (IATF 16949) at Webasto. Analyze the deviation photo against the technical drawing and return ONLY valid JSON.';

      const userText = `
Return JSON with:
{
  "summary": string,
  "findings": [{"title": string, "detail": string, "confidence": number}],
  "suggestedSeverity": {"severity": number, "rationale": string},
  "suggestedRisks": [{"source":"Supplier"|"Webasto","description":string,"severity":number,"occurrence":number,"detection":number}]
}

Context (SDA):
${JSON.stringify({
  id: deviationContext.id,
  classification: deviationContext.classification,
  masterData: {
    plant: deviationContext.masterData.plant,
    supplierName: deviationContext.masterData.supplierName,
    materialNo: deviationContext.masterData.materialNo,
    productSafetyRelevant: deviationContext.masterData.productSafetyRelevant,
  },
  details: deviationContext.details,
})}
      `.trim();

      const content: any[] = [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: photoUrl } },
      ];
      if (drawingUrl) content.push({ type: 'image_url', image_url: { url: drawingUrl } });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // Use a vision-capable model; can be overridden via AI_MODEL env if desired
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) return fallbackAnalysis(deviationContext);

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) return fallbackAnalysis(deviationContext);

      const parsed = JSON.parse(raw) as Omit<VisionAnalysis, 'suggestedRisks'> & {
        suggestedRisks: Array<Omit<RiskItem, 'id' | 'rpn'> & { source: 'Supplier' | 'Webasto' }>;
      };

      const risks = (parsed.suggestedRisks || []).map(r => ({
        source: r.source,
        description: r.description,
        severity: Number(r.severity) || 5,
        occurrence: Number(r.occurrence) || 5,
        detection: Number(r.detection) || 5,
        rpn: (Number(r.severity) || 5) * (Number(r.occurrence) || 5) * (Number(r.detection) || 5),
      }));

      return {
        summary: parsed.summary || 'Vision analysis completed.',
        findings: parsed.findings || [],
        suggestedSeverity: parsed.suggestedSeverity || { severity: 5, rationale: 'No rationale provided.' },
        suggestedRisks: risks,
      };
    } catch {
      return fallbackAnalysis(deviationContext);
    }
  }
}

