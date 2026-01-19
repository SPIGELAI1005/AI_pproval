
import React from 'react';
import { ActionItem } from '../types';

interface ActionTableProps {
  actions: ActionItem[];
  type: 'Immediate' | 'Corrective';
  onUpdate: (actions: ActionItem[]) => void;
}

const ActionTable: React.FC<ActionTableProps> = ({ actions, type, onUpdate }) => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-700">{type} Actions</h4>
        <button 
          onClick={addAction}
          className="text-[10px] font-black uppercase tracking-widest text-[#007aff] hover:underline"
        >
          + Add Action
        </button>
      </div>
      <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white/50">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Description</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 w-32">Owner</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 w-32">Due Date</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 w-32">Status</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredActions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No actions defined.</td>
              </tr>
            ) : filteredActions.map(action => (
              <tr key={action.id}>
                <td className="px-4 py-2">
                  <input 
                    type="text" 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
                    placeholder="Enter action details..."
                    value={action.description}
                    onChange={e => updateAction(action.id, 'description', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input 
                    type="text" 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-600"
                    placeholder="Role/Name"
                    value={action.owner}
                    onChange={e => updateAction(action.id, 'owner', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input 
                    type="date" 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-600"
                    value={action.dueDate}
                    onChange={e => updateAction(action.id, 'dueDate', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <select 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-600 font-bold"
                    value={action.status}
                    onChange={e => updateAction(action.id, 'status', e.target.value)}
                  >
                    <option>Open</option>
                    <option>On Track</option>
                    <option>Delayed</option>
                    <option>Closed</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => removeAction(action.id)} className="text-slate-300 hover:text-red-500">
                    <i className="fa-solid fa-trash-can"></i>
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

export default ActionTable;
