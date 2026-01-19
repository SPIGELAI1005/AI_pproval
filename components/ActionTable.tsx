
import React, { useState } from 'react';
import { ActionItem, DeviationRecord } from '../types';
import { AIRecommendations } from './AIRecommendations';

interface ActionTableProps {
  actions: ActionItem[];
  type: 'Immediate' | 'Corrective';
  onUpdate: (actions: ActionItem[]) => void;
  deviation?: DeviationRecord;
}

const ActionTable: React.FC<ActionTableProps> = ({ actions, type, onUpdate, deviation }) => {
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
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
                        className="w-full apple-input bg-transparent border-none focus:ring-0 px-2 py-1 text-sm ui-text-primary font-medium"
                        placeholder="Enter action details..."
                        value={action.description}
                        onChange={e => updateAction(action.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        className="w-full apple-input bg-transparent border-none focus:ring-0 px-2 py-1 text-sm ui-text-primary"
                        placeholder="Role/Name"
                        value={action.owner}
                        onChange={e => updateAction(action.id, 'owner', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="date" 
                        className="w-full apple-input bg-transparent border-none focus:ring-0 px-2 py-1 text-sm ui-text-primary"
                        value={action.dueDate}
                        onChange={e => updateAction(action.id, 'dueDate', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        className="w-full apple-select bg-transparent border-none focus:ring-0 px-2 py-1 text-sm ui-text-primary font-bold"
                        value={action.status}
                        onChange={e => updateAction(action.id, 'status', e.target.value)}
                      >
                        <option>Open</option>
                        <option>On Track</option>
                        <option>Delayed</option>
                        <option>Closed</option>
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
