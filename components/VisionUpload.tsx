import React, { useMemo, useState } from 'react';
import { DeviationRecord, RiskItem } from '../types';
import { VisionAnalysis, VisionService } from '../services/visionService';

interface VisionUploadProps {
  deviation: DeviationRecord;
  onAddRisks: (risks: RiskItem[]) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function VisionUpload({ deviation, onAddRisks }: VisionUploadProps) {
  const visionService = useMemo(() => new VisionService(), []);
  const [photo, setPhoto] = useState<File | null>(null);
  const [drawing, setDrawing] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [drawingUrl, setDrawingUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handlePhoto(file: File | null) {
    setPhoto(file);
    setAnalysis(null);
    if (!file) return setPhotoUrl(null);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function handleDrawing(file: File | null) {
    setDrawing(file);
    setAnalysis(null);
    if (!file) return setDrawingUrl(null);
    setDrawingUrl(URL.createObjectURL(file));
  }

  async function runAnalysis() {
    if (!photo) return;
    setIsLoading(true);
    try {
      const result = await visionService.analyzeDeviationImage(photo, drawing, deviation);
      setAnalysis(result);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glass glass-highlight rounded-[24px] p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-white shadow-lg shadow-black/10">
              <i className="fa-solid fa-camera"></i>
            </div>
            <div>
              <h4 className="text-sm font-extrabold ui-heading">Vision Verification (Photo vs Drawing)</h4>
              <p className="text-[10px] font-medium ui-text-secondary">
                Upload a deviation photo and the technical drawing; the system will suggest findings and FMEA risks.
              </p>
            </div>
          </div>
        </div>

        <button
          className="footer-pill footer-pill-primary flex items-center gap-2"
          onClick={runAnalysis}
          disabled={!photo || isLoading}
          title={!photo ? 'Upload a photo to run vision verification' : 'Run vision verification'}
        >
          {isLoading ? (
            <>
              <i className="fa-solid fa-circle-notch animate-spin"></i>
              Running…
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Run Vision
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-[20px] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black ui-label">Deviation Photo</p>
            <label className="footer-pill footer-pill-muted cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handlePhoto(e.target.files?.[0] ?? null)}
              />
              <i className="fa-solid fa-upload mr-2"></i>
              Upload
            </label>
          </div>
          <div className="rounded-[18px] border border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/20 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Deviation photo" className="w-full h-48 object-cover" />
            ) : (
              <div className="h-48 flex items-center justify-center text-xs ui-text-tertiary">
                Photo preview
              </div>
            )}
          </div>
          {photo && (
            <p className="mt-3 text-[10px] ui-text-secondary font-medium">
              {photo.name} • {formatBytes(photo.size)}
            </p>
          )}
        </div>

        <div className="glass rounded-[20px] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black ui-label">Technical Drawing (optional)</p>
            <label className="footer-pill footer-pill-muted cursor-pointer">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={e => handleDrawing(e.target.files?.[0] ?? null)}
              />
              <i className="fa-solid fa-upload mr-2"></i>
              Upload
            </label>
          </div>
          <div className="rounded-[18px] border border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/20 overflow-hidden">
            {drawing ? (
              drawing.type === 'application/pdf' ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2 ui-text-secondary">
                  <i className="fa-solid fa-file-pdf text-3xl text-red-500"></i>
                  <p className="text-xs font-bold">{drawing.name}</p>
                  <p className="text-[10px] ui-text-tertiary">{formatBytes(drawing.size)}</p>
                </div>
              ) : drawingUrl ? (
                <img src={drawingUrl} alt="Technical drawing" className="w-full h-48 object-cover" />
              ) : (
                <div className="h-48 flex items-center justify-center text-xs ui-text-tertiary">Drawing preview</div>
              )
            ) : (
              <div className="h-48 flex items-center justify-center text-xs ui-text-tertiary">
                Drawing preview
              </div>
            )}
          </div>
        </div>
      </div>

      {analysis && (
        <div className="mt-6 space-y-4">
          <div className="glass rounded-[20px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h5 className="text-[10px] font-black ui-label">Vision Summary</h5>
                <p className="mt-2 text-sm ui-text-primary font-semibold leading-relaxed">{analysis.summary}</p>
              </div>
              <div className="px-3 py-2 rounded-full border bg-amber-200/60 dark:bg-amber-900/25 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-300 text-[10px] font-black uppercase">
                Severity: {analysis.suggestedSeverity.severity}/10
              </div>
            </div>
            <p className="mt-2 text-[10px] ui-text-secondary">{analysis.suggestedSeverity.rationale}</p>
          </div>

          {analysis.findings.length > 0 && (
            <div className="glass rounded-[20px] p-5">
              <h5 className="text-[10px] font-black ui-label mb-3">Findings</h5>
              <div className="space-y-3">
                {analysis.findings.map((f, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/20">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold ui-text-primary">{f.title}</p>
                      <span className="text-[10px] font-black ui-text-tertiary">
                        {Math.round(f.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] ui-text-secondary leading-relaxed">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-[20px] p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h5 className="text-[10px] font-black ui-label">Suggested FMEA Risks</h5>
              <button
                className="footer-pill footer-pill-primary"
                disabled={analysis.suggestedRisks.length === 0}
                onClick={() => {
                  const mapped: RiskItem[] = analysis.suggestedRisks.map(r => ({
                    id: Math.random().toString(36).slice(2),
                    source: r.source,
                    description: r.description,
                    severity: r.severity,
                    occurrence: r.occurrence,
                    detection: r.detection,
                    rpn: r.rpn,
                  }));
                  onAddRisks(mapped);
                  alert(`Added ${mapped.length} risk(s) to the Risks tab.`);
                }}
              >
                Add to Risks
              </button>
            </div>

            {analysis.suggestedRisks.length === 0 ? (
              <p className="text-sm ui-text-tertiary italic">No risks suggested.</p>
            ) : (
              <div className="space-y-3">
                {analysis.suggestedRisks.map((r, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/20">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/15">
                        {r.source}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-full ${r.rpn >= 125 ? 'bg-red-200 text-red-950 dark:bg-red-900/25 dark:text-red-300' : 'bg-slate-200 text-slate-900 dark:bg-slate-800/60 dark:text-slate-300'}`}>
                        RPN {r.rpn}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold ui-text-primary">{r.description}</p>
                    <p className="mt-1 text-[10px] ui-text-secondary">
                      S {r.severity} • O {r.occurrence} • D {r.detection}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

