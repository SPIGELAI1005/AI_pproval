import React, { useMemo, useState } from 'react';
import { DeviationRecord } from '../types';
import { CAPAService } from '../services/capaService';

interface EightDGeneratorProps {
  deviation: DeviationRecord;
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EightDGenerator({ deviation }: EightDGeneratorProps) {
  const capaService = useMemo(() => new CAPAService(), []);
  const [isOpen, setIsOpen] = useState(false);
  const report = useMemo(() => capaService.generate8DFromSDA(deviation), [capaService, deviation]);
  const markdown = useMemo(() => capaService.toMarkdown(report), [capaService, report]);
  const json = useMemo(() => JSON.stringify(report, null, 2), [report]);

  return (
    <>
      <div className="glass glass-highlight rounded-[24px] p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <div>
                <h4 className="text-sm font-extrabold ui-heading">One‑Click 8D / CAPA</h4>
                <p className="text-[10px] font-medium ui-text-secondary">
                  Auto-map this deviation into an 8D structure for supplier CAPA workflow.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                D1–D8 structured
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/15">
                Local generation (no backend)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              className="footer-pill footer-pill-muted flex items-center gap-2"
              onClick={() => {
                navigator.clipboard.writeText(markdown);
                alert('8D copied (Markdown).');
              }}
            >
              <i className="fa-solid fa-copy"></i>
              Copy
            </button>
            <button
              className="footer-pill footer-pill-muted flex items-center gap-2"
              onClick={() => downloadTextFile(`8D_${deviation.id}.md`, markdown, 'text/markdown')}
            >
              <i className="fa-solid fa-download"></i>
              Export .md
            </button>
            <button
              className="footer-pill footer-pill-primary flex items-center gap-2"
              onClick={() => setIsOpen(true)}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Preview 8D
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="glass glass-highlight rounded-[32px] p-6 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.3)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.7)]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-extrabold ui-heading">8D Report Preview</h3>
                <p className="text-xs ui-text-secondary">{deviation.id} • Generated from current form state</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="footer-pill footer-pill-muted flex items-center gap-2"
                  onClick={() => downloadTextFile(`8D_${deviation.id}.json`, json, 'application/json')}
                >
                  <i className="fa-solid fa-code"></i>
                  Export JSON
                </button>
                <button
                  className="ui-icon-btn w-10 h-10 flex items-center justify-center"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4">
              <div className="glass rounded-[24px] p-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(report.meta).map(([k, v]) =>
                    v ? (
                      <span
                        key={k}
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/15"
                      >
                        {k}: {String(v)}
                      </span>
                    ) : null
                  )}
                </div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap ui-text-secondary leading-relaxed">
                  {markdown}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 dark:border-white/5 flex justify-between gap-3">
              <button className="footer-pill footer-pill-muted" onClick={() => setIsOpen(false)}>
                Close
              </button>
              <button
                className="footer-pill footer-pill-primary flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(json);
                  alert('8D copied (JSON).');
                }}
              >
                <i className="fa-solid fa-copy"></i>
                Copy JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

