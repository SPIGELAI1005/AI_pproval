
import React, { useState } from 'react';
import { RiskItem, DeviationRecord } from '../types';
import { FIELD_DESCRIPTIONS } from '../constants';
import { AIRecommendations } from './AIRecommendations';

interface RiskTableProps {
  risks: RiskItem[];
  onUpdate: (risks: RiskItem[]) => void;
  deviation?: DeviationRecord;
}

const InfoIcon = ({ text }: { text: string }) => (
  <div className="relative group/info inline-block align-middle ml-1.5">
    <i className="fa-solid fa-circle-info text-[10px] ui-text-tertiary hover:text-[#007aff] transition-colors cursor-help"></i>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 glass rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[100] pointer-events-none text-left">
      <div className="text-[10px] font-bold ui-heading leading-relaxed mb-1 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">Information</div>
      <p className="text-[10px] font-medium ui-text-secondary leading-relaxed normal-case">
        {text}
      </p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-slate-800"></div>
    </div>
  </div>
);

const RiskTable: React.FC<RiskTableProps> = ({ risks, onUpdate, deviation }) => {
  const [showAIRecommendations, setShowAIRecommendations] = useState<{ source: 'Supplier' | 'Webasto' } | null>(null);
  const addRisk = (source: 'Supplier' | 'Webasto') => {
    const newRisk: RiskItem = {
      id: Math.random().toString(36).substr(2, 9),
      source,
      description: '',
      severity: 5,
      occurrence: 5,
      detection: 5,
      rpn: 125
    };
    onUpdate([...risks, newRisk]);
  };

  const removeRisk = (id: string) => {
    onUpdate(risks.filter(r => r.id !== id));
  };

  const updateItem = (id: string, field: keyof RiskItem, value: any) => {
    onUpdate(risks.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        if (['severity', 'occurrence', 'detection'].includes(field)) {
          updated.rpn = updated.severity * updated.occurrence * updated.detection;
        }
        return updated;
      }
      return r;
    }));
  };

  const renderSection = (source: 'Supplier' | 'Webasto') => {
    const filtered = risks.filter(r => r.source === source);
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold ui-heading">{source} Risks</h4>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setShowAIRecommendations({ source })}
              className="ai-recommend-btn"
              disabled={!deviation}
            >
              <i className="fa-solid fa-sparkles"></i>
              <span className="hidden sm:inline">I A:M Q</span>
            </button>
            <button 
              type="button"
              onClick={() => addRisk(source)}
              className="add-btn"
            >
              <i className="fa-solid fa-plus"></i>
              <span className="hidden sm:inline">Add Risk</span>
            </button>
          </div>
        </div>
        <div className="glass rounded-[24px] overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20 dark:border-white/10">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest ui-label">Description</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest ui-label w-20 text-center">S</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest ui-label w-20 text-center">O</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest ui-label w-20 text-center">D</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest ui-label w-24 text-center">
                    RPN <InfoIcon text={FIELD_DESCRIPTIONS.rpn} />
                  </th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center ui-text-tertiary italic text-sm">No risks identified.</td>
                  </tr>
                ) : filtered.map(risk => (
                  <tr key={risk.id} className="hover:bg-white/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-3">
                      <input 
                        type="text" 
                        value={risk.description}
                        onChange={(e) => updateItem(risk.id, 'description', e.target.value)}
                        placeholder="Identify specific risk..."
                        className="w-full apple-input bg-transparent border-none focus:ring-0 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" min="1" max="10"
                        value={risk.severity}
                        onChange={(e) => updateItem(risk.id, 'severity', parseInt(e.target.value))}
                        className="w-20 apple-input text-center text-sm font-bold ui-text-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" min="1" max="10"
                        value={risk.occurrence}
                        onChange={(e) => updateItem(risk.id, 'occurrence', parseInt(e.target.value))}
                        className="w-20 apple-input text-center text-sm font-bold ui-text-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" min="1" max="10"
                        value={risk.detection}
                        onChange={(e) => updateItem(risk.id, 'detection', parseInt(e.target.value))}
                        className="w-20 apple-input text-center text-sm font-bold ui-text-primary"
                      />
                    </td>
                    <td className={`px-4 py-3 text-center font-extrabold text-base ${risk.rpn >= 125 ? 'text-red-500 dark:text-red-400' : 'ui-text-primary'}`}>
                      {risk.rpn}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => removeRisk(risk.id)} 
                        className="ui-icon-btn w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const handleAIRecommendationsSelect = (items: any[]) => {
    onUpdate([...risks, ...(items as RiskItem[])]);
  };

  return (
    <>
      <div className="space-y-6">
        {renderSection('Supplier')}
        {renderSection('Webasto')}
        <div className="glass glass-highlight p-6 rounded-[24px] mt-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#007aff] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#007aff] flex items-center justify-center shadow-lg shadow-[#007aff]/20">
              <i className="fa-solid fa-circle-info text-white text-lg"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-black ui-heading uppercase tracking-wider mb-2">FMEA Scoring Guide</h5>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs ui-text-secondary">
                <span className="flex items-center gap-1.5">
                  <strong className="ui-text-primary font-bold text-sm">S</strong>
                  <span className="text-[10px] ui-text-tertiary">= Severity</span>
                </span>
                <span className="text-[10px] ui-text-tertiary">•</span>
                <span className="flex items-center gap-1.5">
                  <strong className="ui-text-primary font-bold text-sm">O</strong>
                  <span className="text-[10px] ui-text-tertiary">= Occurrence</span>
                </span>
                <span className="text-[10px] ui-text-tertiary">•</span>
                <span className="flex items-center gap-1.5">
                  <strong className="ui-text-primary font-bold text-sm">D</strong>
                  <span className="text-[10px] ui-text-tertiary">= Detection</span>
                </span>
                <span className="text-[10px] ui-text-tertiary ml-1">(Scale: 1-10)</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 dark:border-white/5">
                <p className="text-xs ui-text-secondary">
                  <strong className="ui-text-primary font-bold">RPN</strong> (Risk Priority Number) = <strong className="ui-text-primary">S</strong> × <strong className="ui-text-primary">O</strong> × <strong className="ui-text-primary">D</strong>
                  <span className="ml-2 px-2 py-0.5 rounded bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold">
                    Critical: RPN ≥ 125
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showAIRecommendations && deviation && (
        <AIRecommendations
          type="risk"
          deviation={deviation}
          source={showAIRecommendations.source}
          onSelect={handleAIRecommendationsSelect}
          onClose={() => setShowAIRecommendations(null)}
        />
      )}
    </>
  );
};

export default RiskTable;
