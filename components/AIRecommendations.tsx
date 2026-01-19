import React, { useState } from 'react';
import { RiskItem, ActionItem, DeviationRecord } from '../types';

interface AIRecommendationsProps {
  type: 'risk' | 'action';
  deviation: DeviationRecord;
  onSelect: (items: RiskItem[] | ActionItem[]) => void;
  onClose: () => void;
  source?: 'Supplier' | 'Webasto';
  actionType?: 'Immediate' | 'Corrective';
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  type,
  deviation,
  onSelect,
  onClose,
  source,
  actionType
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate AI API call - in production, this would call AIService
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (type === 'risk') {
        // Mock risk recommendations based on deviation data
        const mockRisks = [
          {
            id: 'rec-1',
            source: source || 'Supplier',
            description: `Potential dimensional non-conformity affecting ${deviation.masterData.materialNo || 'material'} assembly tolerance`,
            s: 7,
            o: 6,
            d: 5,
            rpn: 210,
            reasoning: 'High severity due to potential assembly impact. Moderate occurrence based on supplier history.'
          },
          {
            id: 'rec-2',
            source: source || 'Webasto',
            description: 'Quality control detection gap in incoming inspection process',
            s: 5,
            o: 4,
            d: 6,
            rpn: 120,
            reasoning: 'Detection score reflects current inspection capability limitations.'
          },
          {
            id: 'rec-3',
            source: source || 'Supplier',
            description: `Supply chain disruption risk for ${deviation.masterData.plant || 'affected plant'} production line`,
            s: 6,
            o: 5,
            d: 4,
            rpn: 120,
            reasoning: 'Based on deviation duration and material criticality.'
          }
        ];
        setRecommendations(mockRisks);
      } else {
        // Mock action recommendations
        const mockActions = [
          {
            id: 'rec-1',
            type: actionType || 'Immediate',
            description: 'Implement 100% incoming inspection for affected material batch',
            owner: 'Quality Engineer',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Open',
            reasoning: 'Immediate containment required to prevent non-conforming parts from entering production.'
          },
          {
            id: 'rec-2',
            type: actionType || 'Corrective',
            description: 'Review and update supplier quality agreement with enhanced dimensional requirements',
            owner: 'Supplier Quality Manager',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Open',
            reasoning: 'Long-term corrective action to prevent recurrence.'
          },
          {
            id: 'rec-3',
            type: actionType || 'Immediate',
            description: 'Conduct root cause analysis with supplier within 48 hours',
            owner: 'ASQE',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Open',
            reasoning: 'Urgent investigation needed to identify root cause.'
          }
        ];
        setRecommendations(mockActions);
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRecommendations();
  }, []);

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  const handleAddSelected = () => {
    const items = recommendations
      .filter((_, index) => selected.has(index))
      .map((rec, index) => {
        if (type === 'risk') {
          return {
            id: Math.random().toString(36).substr(2, 9),
            source: rec.source,
            description: rec.description,
            severity: rec.s,
            occurrence: rec.o,
            detection: rec.d,
            rpn: rec.s * rec.o * rec.d
          } as RiskItem;
        } else {
          return {
            id: Math.random().toString(36).substr(2, 9),
            type: rec.type,
            description: rec.description,
            owner: rec.owner,
            dueDate: rec.dueDate,
            status: rec.status
          } as ActionItem;
        }
      });
    
    if (items.length > 0) {
      onSelect(items);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="glass glass-highlight rounded-[32px] p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.3)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007aff] to-[#60a5fa] flex items-center justify-center">
              <i className="fa-solid fa-sparkles text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-lg font-extrabold ui-heading">AI Recommendations</h3>
              <p className="text-xs ui-text-secondary">
                {type === 'risk' ? `${source || 'Supplier'} Risks` : `${actionType || 'Immediate'} Actions`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ui-icon-btn w-10 h-10 flex items-center justify-center"
          >
            <i className="fa-solid fa-times text-sm"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#007aff]/20 border-t-[#007aff] rounded-full animate-spin mb-4"></div>
              <p className="text-sm ui-text-secondary">Analyzing deviation and generating recommendations...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm ui-text-tertiary">No recommendations available.</p>
            </div>
          ) : (
            recommendations.map((rec, index) => (
              <div
                key={rec.id}
                onClick={() => toggleSelection(index)}
                className={`glass rounded-[20px] p-4 cursor-pointer transition-all ${
                  selected.has(index)
                    ? 'ring-2 ring-[#007aff] bg-[#007aff]/10 dark:bg-[#007aff]/20'
                    : 'hover:bg-white/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    selected.has(index)
                      ? 'border-[#007aff] bg-[#007aff]'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {selected.has(index) && (
                      <i className="fa-solid fa-check text-white text-[10px]"></i>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold ui-text-primary mb-2">{rec.description}</p>
                    {type === 'risk' ? (
                      <div className="flex items-center gap-4 text-xs ui-text-secondary mb-2">
                        <span><strong>S:</strong> {rec.s}</span>
                        <span><strong>O:</strong> {rec.o}</span>
                        <span><strong>D:</strong> {rec.d}</span>
                        <span className={`font-bold ${rec.rpn >= 125 ? 'text-red-500 dark:text-red-400' : ''}`}>
                          <strong>RPN:</strong> {rec.rpn}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-xs ui-text-secondary mb-2">
                        <span><strong>Owner:</strong> {rec.owner}</span>
                        <span><strong>Due:</strong> {rec.dueDate}</span>
                      </div>
                    )}
                    <p className="text-xs ui-text-tertiary italic">{rec.reasoning}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10 dark:border-white/5">
          <button
            onClick={onClose}
            className="apple-btn-secondary px-6 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSelected}
            disabled={selected.size === 0}
            className="apple-btn-primary px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            Add Selected ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
};
