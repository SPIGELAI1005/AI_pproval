
import React from 'react';

const AnalyticsCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Volume by BU Chart */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Deviation Volume per BU</h3>
        <div className="space-y-4">
          {[
            { name: 'ET - Electronics', val: 85, color: 'bg-blue-500' },
            { name: 'RB - Roof Systems', val: 62, color: 'bg-emerald-500' },
            { name: 'RX - Custom Works', val: 45, color: 'bg-purple-500' },
            { name: 'EB - E-Solutions', val: 30, color: 'bg-amber-500' },
          ].map((item) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span>{item.name}</span>
                <span>{item.val} items</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Cycle Time Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Approval Avg</p>
            <p className="text-xl font-black text-emerald-600">3.2d</p>
            <p className="text-[9px] font-bold text-slate-400 mt-1">-12% (Better)</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">R&D Delay</p>
            <p className="text-xl font-black text-red-500">5.8d</p>
            <p className="text-[9px] font-bold text-slate-400 mt-1">+5% (Slower)</p>
          </div>
          <div className="col-span-2 p-4 bg-slate-900 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase text-white/40">Throughput Target</span>
              <span className="text-[10px] font-black text-emerald-400">92%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-[92%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
