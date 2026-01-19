
import React from 'react';

interface AnalyticsChartsProps {
  deviationType?: 'Supplier' | 'Customer';
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ deviationType = 'Supplier' }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Volume by BU Chart */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold ui-heading">{deviationType === 'Customer' ? 'Customer Deviation Volume' : 'Deviation Volume per BU'}</h3>
          <span className="text-[10px] font-black uppercase tracking-widest ui-text-tertiary">Last 30 days</span>
        </div>
        <div className="space-y-4">
          {(deviationType === 'Customer' ? [
            { name: 'BMW Group', val: 95, color: 'bg-blue-500' },
            { name: 'Mercedes-Benz', val: 78, color: 'bg-emerald-500' },
            { name: 'Volkswagen AG', val: 65, color: 'bg-purple-500' },
            { name: 'Audi AG', val: 52, color: 'bg-amber-500' },
            { name: 'Porsche AG', val: 38, color: 'bg-red-500' },
            { name: 'Opel Automobile', val: 28, color: 'bg-indigo-500' },
          ] : [
            { name: 'ET - Electronics', val: 85, color: 'bg-blue-500' },
            { name: 'RB - Roof Systems', val: 62, color: 'bg-emerald-500' },
            { name: 'RX - Custom Works', val: 45, color: 'bg-purple-500' },
            { name: 'EB - E-Solutions', val: 30, color: 'bg-amber-500' },
          ]).map((item) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold ui-text-secondary">
                <span className="ui-text-primary">{item.name}</span>
                <span className="ui-text-tertiary">{item.val} items</span>
              </div>
              <div className="h-2 w-full bg-slate-100/70 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                  style={{ width: `${item.val}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Efficiency */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold ui-heading">Cycle Time Distribution</h3>
          <span className="text-[10px] font-black uppercase tracking-widest ui-text-tertiary">Rolling avg</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 glass rounded-[24px] text-center">
            <p className="text-[10px] font-black ui-label mb-1">Approval Avg</p>
            <p className="text-xl font-black text-emerald-600">3.2d</p>
            <p className="text-[9px] font-bold ui-text-tertiary mt-1">-12% (Better)</p>
          </div>
          <div className="p-5 glass rounded-[24px] text-center">
            <p className="text-[10px] font-black ui-label mb-1">R&D Delay</p>
            <p className="text-xl font-black text-red-500">5.8d</p>
            <p className="text-[9px] font-bold ui-text-tertiary mt-1">+5% (Slower)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
