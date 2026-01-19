
import React, { useState } from 'react';
import { ActionItem, DeviationRecord } from '../types';
import { AIRecommendations } from './AIRecommendations';
import { useTheme } from '../contexts/ThemeContext';

interface ActionTableProps {
  actions: ActionItem[];
  type: 'Immediate' | 'Corrective';
  onUpdate: (actions: ActionItem[]) => void;
  deviation?: DeviationRecord;
}

const ActionTable: React.FC<ActionTableProps> = ({ actions, type, onUpdate, deviation }) => {
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const filteredActions = actions.filter(a => a.type === type);

  const addAction = () => {
    const newAction: ActionItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      description: '',
      owner: '',
      dueDate: '',
      status: 'Open'
    };
    onUpdate([...actions, newAction]);
  };

  const updateAction = (id: string, field: keyof ActionItem, value: any) => {
    onUpdate(actions.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAction = (id: string) => {
    onUpdate(actions.filter(a => a.id !== id));
  };

  const handleAIRecommendationsSelect = (items: any[]) => {
    onUpdate([...actions, ...(items as ActionItem[])]);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold ui-heading">{type} Actions</h4>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAIRecommendations(true)}
              className="ai-recommend-btn"
              disabled={!deviation}
            >
              <i className="fa-solid fa-sparkles"></i>
              <span className="hidden sm:inline">I A:M Q</span>
            </button>
            <button 
              onClick={addAction}
              className="add-btn"
            >
              <i className="fa-solid fa-plus"></i>
              <span className="hidden sm:inline">Add Action</span>
            </button>
          </div>
        </div>
        <div className="glass rounded-[24px] overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20 dark:border-white/10">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest ui-label">Description</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest ui-label w-32">Owner</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest ui-label w-32">Due Date</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest ui-label w-32">Status</th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {filteredActions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center ui-text-tertiary italic text-sm">No actions defined.</td>
                  </tr>
                ) : filteredActions.map(action => (
                  <tr key={action.id} className="hover:bg-white/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-3">
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 text-sm ui-text-primary font-medium rounded-lg bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/20 focus:bg-white/80 dark:focus:bg-white/15 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all outline-none"
                        placeholder="Enter action details..."
                        value={action.description}
                        onChange={e => updateAction(action.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 text-sm ui-text-primary rounded-lg bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/20 focus:bg-white/80 dark:focus:bg-white/15 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all outline-none"
                        placeholder="Role/Name"
                        value={action.owner}
                        onChange={e => updateAction(action.id, 'owner', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 pr-8 text-sm ui-text-primary rounded-lg bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/20 focus:bg-white/80 dark:focus:bg-white/15 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all outline-none [color-scheme:light] dark:[color-scheme:dark]"
                          value={action.dueDate || ''}
                          onChange={e => updateAction(action.id, 'dueDate', e.target.value)}
                        />
                        <i className="fa-solid fa-calendar-days absolute right-2 top-1/2 -translate-y-1/2 text-xs ui-text-tertiary pointer-events-none"></i>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        className="w-full px-3 py-2 pr-8 text-sm ui-text-primary font-bold rounded-lg bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/20 focus:bg-white/80 dark:focus:bg-white/15 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all outline-none appearance-none cursor-pointer"
                        value={action.status}
                        onChange={e => updateAction(action.id, 'status', e.target.value)}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' stroke='${isDark ? '%23cbd5e1' : '%23475569'}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1rem 1rem'
                        }}
                      >
                        <option value="Open">Open</option>
                        <option value="On Track">On Track</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => removeAction(action.id)} 
                        className="ui-icon-btn w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showAIRecommendations && deviation && (
        <AIRecommendations
          type="action"
          deviation={deviation}
          actionType={type}
          onSelect={handleAIRecommendationsSelect}
          onClose={() => setShowAIRecommendations(false)}
        />
      )}
    </>
  );
};

export default ActionTable;
