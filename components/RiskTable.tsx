
import React from 'react';
import { RiskItem } from '../types';
import { FIELD_DESCRIPTIONS } from '../constants';

interface RiskTableProps {
  risks: RiskItem[];
  onUpdate: (risks: RiskItem[]) => void;
}

const InfoIcon = ({ text }: { text: string }) => (
  <div className="relative group/info inline-block align-middle ml-1.5">
    <i className="fa-solid fa-circle-info text-[10px] text-slate-300 hover:text-[#007aff] transition-colors cursor-help"></i>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-white rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-slate-100 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[100] pointer-events-none text-left">
      <div className="text-[10px] font-bold text-slate-800 leading-relaxed mb-1 uppercase tracking-widest border-b border-slate-50 pb-2">Information</div>
      <p className="text-[10px] font-medium text-slate-500 leading-relaxed normal-case">
        {text}
      </p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
    </div>
  </div>
);

const RiskTable: React.FC<RiskTableProps> = ({ risks, onUpdate }) => {
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
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-slate-700">{source} Risks</h4>
          <button 
            type="button"
            onClick={() => addRisk(source)}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1 border border-slate-300 transition-colors"
          >
            <i className="fa-solid fa-plus"></i> Add Risk
          </button>
        </div>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 w-16 text-center">S</th>
                <th className="px-3 py-2 w-16 text-center">O</th>
                <th className="px-3 py-2 w-16 text-center">D</th>
                <th className="px-3 py-2 w-24 text-center">
                  RPN <InfoIcon text={FIELD_DESCRIPTIONS.rpn} />
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-slate-400 italic">No risks identified.</td>
                </tr>
              ) : filtered.map(risk => (
                <tr key={risk.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2">
                    <input 
                      type="text" 
                      value={risk.description}
                      onChange={(e) => updateItem(risk.id, 'description', e.target.value)}
                      placeholder="Identify specific risk..."
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-webasto-blue rounded px-1 py-0.5 text-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input 
                      type="number" min="1" max="10"
                      value={risk.severity}
                      onChange={(e) => updateItem(risk.id, 'severity', parseInt(e.target.value))}
                      className="w-12 text-center border-none bg-slate-100 rounded focus:ring-1 focus:ring-webasto-blue"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input 
                      type="number" min="1" max="10"
                      value={risk.occurrence}
                      onChange={(e) => updateItem(risk.id, 'occurrence', parseInt(e.target.value))}
                      className="w-12 text-center border-none bg-slate-100 rounded focus:ring-1 focus:ring-webasto-blue"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input 
                      type="number" min="1" max="10"
                      value={risk.detection}
                      onChange={(e) => updateItem(risk.id, 'detection', parseInt(e.target.value))}
                      className="w-12 text-center border-none bg-slate-100 rounded focus:ring-1 focus:ring-webasto-blue"
                    />
                  </td>
                  <td className={`px-3 py-2 text-center font-bold ${risk.rpn > 100 ? 'text-red-600' : 'text-slate-600'}`}>
                    {risk.rpn}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => removeRisk(risk.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 mb-4">
        <i className="fa-solid fa-circle-info mr-2"></i>
        FMEA Scoring: <strong>S</strong>everity, <strong>O</strong>ccurrence, <strong>D</strong>etection (1-10). <strong>RPN</strong> = S x O x D.
      </div>
      {renderSection('Supplier')}
      {renderSection('Webasto')}
    </div>
  );
};

export default RiskTable;
