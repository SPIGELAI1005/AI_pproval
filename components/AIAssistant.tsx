
import React from 'react';
import { AIResponse, AICheckResult, DeviationRecord } from '../types';
import { FIELD_DESCRIPTIONS } from '../constants';

interface AIAssistantProps {
  data: AIResponse | null;
  loading: boolean;
  onAnalyze: () => void;
  redactionMode: boolean;
  setRedactionMode: (val: boolean) => void;
  deviation: DeviationRecord;
}

const InfoIcon = ({ text }: { text: string }) => (
  <div className="relative group/info ml-1.5 inline-block align-middle">
    <i className="fa-solid fa-circle-info text-[10px] ui-text-tertiary hover:text-[#007aff] transition-colors cursor-help"></i>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[100] pointer-events-none">
      <div className="text-[10px] font-bold ui-text-primary leading-relaxed mb-1 uppercase tracking-widest border-b border-slate-50 dark:border-slate-700 pb-2">Information</div>
      <p className="text-[10px] font-medium ui-text-secondary leading-relaxed">
        {text}
      </p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-slate-800"></div>
    </div>
  </div>
);

const AIAssistant: React.FC<AIAssistantProps> = ({ data, loading, onAnalyze, redactionMode, setRedactionMode, deviation }) => {
  const getRPNColor = (rpn: number) => {
    if (rpn >= 125) return 'bg-red-500 text-white';
    if (rpn >= 60) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  const getRPNLabel = (rpn: number) => {
    if (rpn >= 125) return 'High Risk';
    if (rpn >= 60) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className="flex flex-col h-full glass glass-highlight spotlight rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden hover-lift">
      {/* Premium Header */}
      <div className="p-8 border-b border-white/40 dark:border-white/10 bg-gradient-to-tr from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/8 dark:to-transparent shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/40 relative group/icon">
               <i className="fa-solid fa-sparkles text-[10px] absolute top-1.5 right-1.5 opacity-60 group-hover/icon:opacity-100 transition-opacity text-white"></i>
               <i className="fa-solid fa-comment-dots text-lg scale-x-[-1]"></i>
            </div>
            <div>
              <h3 className="text-lg font-extrabold ui-heading tracking-tighter transition-colors">I&nbsp;&nbsp;A:M&nbsp;&nbsp;Q</h3>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest transition-colors">Intelligence Layer</p>
            </div>
          </div>
          <button 
            onClick={onAnalyze}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              loading 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 text-white hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-emerald-400 dark:hover:to-emerald-500 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/40'
            }`}
          >
            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Run Scan'}
          </button>
        </div>

        {/* Safety Toggle - Enhanced with Intelligent Redaction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300/80 dark:border-slate-700/80 transition-colors shadow-sm">
             <div className="flex items-center">
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">Intelligent Redaction</span>
                <InfoIcon text={FIELD_DESCRIPTIONS.anonymize + " Automatically detects and masks PII (names, emails, phones, supplier codes) before AI processing."} />
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={redactionMode} onChange={e => setRedactionMode(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 shadow-inner"></div>
             </label>
          </div>
          {redactionMode && (
            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 transition-colors shadow-sm">
              <i className="fa-solid fa-shield-check text-emerald-600 dark:text-emerald-400 text-sm transition-colors"></i>
              <div className="flex-1">
                <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest transition-colors">Auto-PII Detection Active</p>
                <p className="text-[9px] font-medium text-emerald-600/90 dark:text-emerald-300/90 mt-0.5 transition-colors">Names, emails, phones, and supplier codes will be automatically masked</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-white/30 dark:bg-slate-900/30 no-scrollbar">
        {!data && !loading && (
          <div className="text-center py-20 space-y-4">
            <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-[20px] border-2 border-slate-300 dark:border-slate-600 mx-auto flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-md">
               <i className="fa-solid fa-fingerprint text-3xl"></i>
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Ready for Verification</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium px-10 leading-relaxed">AI analyzes logic, risks, and improvements using Webasto quality standards.</p>
            </div>
          </div>
        )}

        {loading && <div className="space-y-6">{[1,2,3].map(i => <SkeletonItem key={i} />)}</div>}

        {data && (
          <>
            {/* Compliance Score */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-[28px] shadow-sm transition-colors">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200">IATF 16949 Compliance</h5>
                    <InfoIcon text={FIELD_DESCRIPTIONS.iatfScore} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors ${data.iatfScore > 80 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>
                    SCORE: {data.iatfScore}%
                  </span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden transition-colors">
                  <div className={`h-full transition-all duration-1000 ${data.iatfScore > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${data.iatfScore}%` }}></div>
               </div>
            </div>

            {/* Logic Checks */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200">Consistency Checks</h5>
              <div className="space-y-3">
                {data.checks.map((check, i) => (
                  <div key={i} className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] ${
                    check.severity === 'blocking' 
                      ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/60' 
                      : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/60'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                       <i className={`fa-solid ${check.severity === 'blocking' ? 'fa-circle-xmark text-red-600 dark:text-red-400' : 'fa-triangle-exclamation text-amber-600 dark:text-amber-400'} text-sm transition-colors`}></i>
                       <span className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-100">{check.field}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-3">{check.message}</p>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 transition-colors">
                      Recommendation: {check.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities Section */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200">Opportunity Recommendations</h5>
              <div className="space-y-4">
                {data.opportunities.map((opp, i) => (
                  <div key={i} className="p-5 rounded-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#007aff] bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg">
                        {opp.category}
                      </span>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{Math.round(opp.confidence * 100)}% CONFIDENCE</span>
                    </div>
                    <h6 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-[#007aff] transition-colors">{opp.description}</h6>
                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-600 pl-3">
                      Benefit: {opp.benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Identified Risks */}
            <div className="space-y-4">
               <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200">AI Identified Risks</h5>
               <div className="space-y-6">
                  {data.riskSuggestions.map((risk, i) => {
                    const rpn = risk.s * risk.o * risk.d;
                    return (
                      <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all group">
                         <div className="flex justify-between items-start mb-4">
                            <span className="bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-200 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">
                               {risk.source}
                            </span>
                            <div className={`flex flex-col items-end gap-1 px-3 py-1.5 rounded-xl ${getRPNColor(rpn)}`}>
                               <span className="text-[9px] font-black uppercase tracking-tighter opacity-80">{getRPNLabel(rpn)}</span>
                               <span className="text-xs font-black">RPN {rpn}</span>
                            </div>
                         </div>
                         <h6 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight mb-4 group-hover:text-[#007aff] transition-colors">
                            {risk.description}
                         </h6>
                         <div className="grid grid-cols-3 gap-3 mb-5">
                            <MetricBox label="Severity" value={risk.s} />
                            <MetricBox label="Occurrence" value={risk.o} />
                            <MetricBox label="Detection" value={risk.d} />
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center gap-2 mb-1.5">
                               <i className="fa-solid fa-brain text-[10px] text-emerald-600 dark:text-emerald-400 transition-colors"></i>
                               <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">AI Reasoning</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-relaxed italic">
                               {risk.reasoning}
                            </p>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* Report Draft */}
            <div className="space-y-4">
               <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200">SAP D2 Draft</h5>
               <div className="bg-slate-900 rounded-[24px] p-6 shadow-2xl relative group">
                  <pre className="text-[10px] font-mono text-emerald-400/90 whitespace-pre-wrap leading-relaxed">{data.summary.sapDraft}</pre>
                  <button 
                    onClick={() => navigator.clipboard.writeText(data.summary.sapDraft)}
                    className="absolute top-4 right-4 h-8 w-8 bg-white/10 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  >
                    <i className="fa-solid fa-copy text-xs"></i>
                  </button>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MetricBox = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2 rounded-xl flex flex-col items-center justify-center shadow-sm transition-colors">
    <span className="text-[8px] font-black text-slate-600 dark:text-slate-300 mb-0.5">{label}</span>
    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{value}</span>
  </div>
);

const SkeletonItem = () => (
  <div className="bg-white/40 h-32 w-full rounded-3xl animate-pulse border border-white"></div>
);

export default AIAssistant;
