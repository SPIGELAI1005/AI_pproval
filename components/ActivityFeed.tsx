
import React from 'react';

interface ActivityFeedProps {
  deviationType?: 'Supplier' | 'Customer';
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'creation' | 'approval' | 'upload' | 'comment' | 'rejection';
}

const supplierActivities: ActivityItem[] = [
  { id: '1', user: 'George Neacsu', action: 'created new deviation', target: 'DAI_ET-2026-8816', time: '12m ago', type: 'creation' },
  { id: '2', user: 'I A:M Q', action: 'identified high-risk RPN (150)', target: 'DAI_ET-2026-8816', time: '11m ago', type: 'comment' },
  { id: '3', user: 'Supplier Portal', action: 'uploaded Test Report.pdf', target: 'DAI_RX-2026-0122', time: '2h ago', type: 'upload' },
  { id: '4', user: 'Marcus Weber', action: 'approved technical review', target: 'DAI_RB-2025-0988', time: '4h ago', type: 'approval' },
  { id: '5', user: 'Lena Schmidt', action: 'rejected deviation', target: 'DAI_EB-2026-3102', time: 'Yesterday', type: 'rejection' },
];

const customerActivities: ActivityItem[] = [
  { id: '1', user: 'George Neacsu', action: 'created new customer deviation', target: 'DAI_CUST-2026-8816', time: '12m ago', type: 'creation' },
  { id: '2', user: 'I A:M Q', action: 'identified high-risk RPN (155) for BMW Group', target: 'DAI_CUST-2026-8816', time: '11m ago', type: 'comment' },
  { id: '3', user: 'BMW Quality Portal', action: 'uploaded Customer Specification.pdf', target: 'DAI_CUST-2026-0122', time: '2h ago', type: 'upload' },
  { id: '4', user: 'Marcus Weber', action: 'approved customer deviation review', target: 'DAI_CUST-2025-0988', time: '4h ago', type: 'approval' },
  { id: '5', user: 'Lena Schmidt', action: 'rejected customer deviation', target: 'DAI_CUST-2026-3102', time: 'Yesterday', type: 'rejection' },
];

const ActivityFeed: React.FC<ActivityFeedProps> = ({ deviationType = 'Supplier' }) => {
  const activities = deviationType === 'Customer' ? customerActivities : supplierActivities;
  const getIcon = (type: string, user?: string) => {
    switch (type) {
      case 'creation':
        return { icon: 'fa-plus', chip: 'text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/25 border-blue-300 dark:border-blue-800', mirror: false };
      case 'approval':
        return { icon: 'fa-check', chip: 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/25 border-emerald-300 dark:border-emerald-800', mirror: false };
      case 'upload':
        return { icon: 'fa-file-arrow-up', chip: 'text-purple-700 dark:text-purple-300 bg-white dark:bg-purple-900/25 border-purple-300 dark:border-purple-800', mirror: false };
      case 'comment':
        // Use I A:M Q icon (mirrored chat bubble) for I A:M Q user
        if (user === 'I A:M Q') {
          return { icon: 'fa-comment-dots', chip: 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/25 border-emerald-300 dark:border-emerald-800', mirror: true };
        }
        return { icon: 'fa-robot', chip: 'text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-900/25 border-amber-300 dark:border-amber-800', mirror: false };
      case 'rejection':
        return { icon: 'fa-circle-xmark', chip: 'text-red-700 dark:text-red-300 bg-white dark:bg-red-900/25 border-red-300 dark:border-red-800', mirror: false };
      default:
        return { icon: 'fa-circle-dot', chip: 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/60 border-slate-400 dark:border-slate-700', mirror: false };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold ui-heading">Active Insights</h3>
        <button className="text-[10px] font-black uppercase tracking-widest text-[#007aff] hover:underline">View Logs</button>
      </div>
      <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200/60 dark:before:bg-white/10">
        {activities.map((item) => (
          <div key={item.id} className="relative flex gap-4 group">
            {(() => {
              const meta = getIcon(item.type, item.user);
              return (
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border shadow-sm z-10 shrink-0 backdrop-blur-xl ${meta.chip} group-hover:scale-105 transition-transform`}>
                  <i className={`fa-solid ${meta.icon} text-xs ${meta.mirror ? 'scale-x-[-1]' : ''}`}></i>
                </div>
              );
            })()}
            <div className="flex-1 pt-1">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold ui-text-secondary">
                  <span className="ui-text-primary">{item.user}</span> {item.action}
                </p>
                <span className="text-[10px] ui-text-tertiary font-medium whitespace-nowrap ml-4">{item.time}</span>
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
