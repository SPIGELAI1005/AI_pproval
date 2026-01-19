
import React from 'react';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'creation' | 'approval' | 'upload' | 'comment';
}

const activities: ActivityItem[] = [
  { id: '1', user: 'George Neacsu', action: 'created new deviation', target: 'DAI_ET-2026-8816', time: '12m ago', type: 'creation' },
  { id: '2', user: 'System (AI)', action: 'identified high-risk RPN (150)', target: 'DAI_ET-2026-8816', time: '11m ago', type: 'comment' },
  { id: '3', user: 'Supplier Portal', action: 'uploaded Test Report.pdf', target: 'DAI_RX-2026-0122', time: '2h ago', type: 'upload' },
  { id: '4', user: 'Marcus Weber', action: 'approved technical review', target: 'DAI_RB-2025-0988', time: '4h ago', type: 'approval' },
  { id: '5', user: 'Lena Schmidt', action: 'rejected deviation', target: 'DAI_EB-2026-3102', time: 'Yesterday', type: 'approval' },
];

const ActivityFeed: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'creation': return 'fa-plus text-blue-500 bg-blue-50';
      case 'approval': return 'fa-check text-emerald-500 bg-emerald-50';
      case 'upload': return 'fa-file-arrow-up text-purple-500 bg-purple-50';
      case 'comment': return 'fa-robot text-amber-500 bg-amber-50';
      default: return 'fa-circle-dot text-slate-400 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Active Insights</h3>
        <button className="text-[10px] font-bold text-[#007aff] hover:underline">View All Logs</button>
      </div>
      <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
        {activities.map((item) => (
          <div key={item.id} className="relative flex gap-4 group">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border border-white shadow-sm z-10 shrink-0 ${getIcon(item.type)}`}>
              <i className={`fa-solid ${getIcon(item.type).split(' ')[0]} text-xs`}></i>
            </div>
            <div className="flex-1 pt-1">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-slate-900">{item.user}</span> {item.action}
                </p>
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-4">{item.time}</span>
              </div>
              <p className="text-[11px] text-[#007aff] font-black mt-0.5 group-hover:underline cursor-pointer">{item.target}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
