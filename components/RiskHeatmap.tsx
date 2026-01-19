import React, { useState, useEffect } from 'react';
import { AnalyticsService, HeatmapData, RiskTrend } from '../services/analyticsService';

interface RiskHeatmapProps {
  deviationType?: 'Supplier' | 'Customer';
}

export default function RiskHeatmap({ deviationType = 'Supplier' }: RiskHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [atRiskSuppliers, setAtRiskSuppliers] = useState<RiskTrend[]>([]);
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m'>('12m');
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ supplier: string; componentGroup: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const service = new AnalyticsService();
        const [heatmap, atRisk] = await Promise.all([
          service.generateRiskHeatmap(timeframe, deviationType),
          deviationType === 'Customer' 
            ? service.identifyAtRiskCustomers()
            : service.identifyAtRiskSuppliers(),
        ]);
        setHeatmapData(heatmap);
        setAtRiskSuppliers(atRisk);
      } catch (error) {
        console.error('Failed to load heatmap data:', error);
        setHeatmapData(null);
        setAtRiskSuppliers([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [timeframe, deviationType]);

  const getCellColor = (rpn: number, riskLevel: string) => {
    if (riskLevel === 'critical' || rpn >= 125) {
      return 'bg-red-500 dark:bg-red-600';
    }
    if (riskLevel === 'high' || rpn >= 80) {
      return 'bg-amber-500 dark:bg-amber-600';
    }
    if (riskLevel === 'medium' || rpn >= 50) {
      return 'bg-yellow-400 dark:bg-yellow-500';
    }
    return 'bg-emerald-400 dark:bg-emerald-500';
  };

  const getCellIntensity = (rpn: number) => {
    if (rpn === 0) return 'opacity-20';
    if (rpn >= 125) return 'opacity-100';
    if (rpn >= 80) return 'opacity-90';
    if (rpn >= 50) return 'opacity-70';
    return 'opacity-50';
  };

  if (loading) {
    return (
      <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fa-solid fa-circle-notch animate-spin text-2xl text-blue-500 mb-4"></i>
            <p className="text-sm ui-text-secondary">Loading risk heatmap...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    return (
      <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl">
        <p className="text-sm ui-text-secondary">No data available</p>
      </div>
    );
  }

  const selectedCellData = selectedCell
    ? heatmapData.matrix
        .flat()
        .find(c => c.supplier === selectedCell.supplier && c.componentGroup === selectedCell.componentGroup)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <i className="fa-solid fa-fire text-lg"></i>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold ui-heading mb-1">Material Risk Heatmap</h3>
              <p className="text-xs font-black text-red-500 dark:text-red-400 uppercase tracking-wider">{deviationType === 'Customer' ? 'Customer' : 'Supplier'} × Component Group Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['3m', '6m', '12m'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                  timeframe === tf
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 border-2 border-blue-600 dark:border-blue-400'
                    : 'bg-white/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md active:scale-95'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto overflow-y-visible -mx-2 px-2">
          <div className="inline-block min-w-full">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `140px repeat(${heatmapData.componentGroups.length}, minmax(100px, 1fr))` }}>
              {/* Header row */}
              <div className="sticky left-0 z-20 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md rounded-lg p-4 border border-white/40 dark:border-white/10 shadow-md">
                <span className="text-[11px] font-black ui-label uppercase tracking-wider">{deviationType === 'Customer' ? 'Customer' : 'Supplier'} / Component</span>
              </div>
              {heatmapData.componentGroups.map(cg => (
                <div key={cg} className="p-4 text-center border border-white/40 dark:border-white/10 rounded-lg bg-slate-50/90 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm">
                  <span className="text-xs font-bold ui-text-primary break-words leading-snug">{cg}</span>
                </div>
              ))}

              {/* Data rows */}
              {heatmapData.suppliers.map((supplier, rowIdx) => (
                <React.Fragment key={supplier}>
                  <div className="sticky left-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg p-4 border border-white/40 dark:border-white/10 shadow-md flex items-center">
                    <span className="text-xs font-bold ui-text-primary truncate leading-tight">{supplier}</span>
                  </div>
                  {heatmapData.matrix[rowIdx].map((cell, colIdx) => (
                    <div
                      key={`${supplier}-${cell.componentGroup}`}
                      onClick={() => setSelectedCell({ supplier, componentGroup: cell.componentGroup })}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl hover:z-10 relative ${
                        selectedCell?.supplier === supplier && selectedCell?.componentGroup === cell.componentGroup
                          ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl scale-[1.02] z-10 border-blue-400 dark:border-blue-500'
                          : 'border-white/40 dark:border-white/20'
                      } ${getCellColor(cell.rpn, cell.riskLevel)} ${getCellIntensity(cell.rpn)}`}
                      title={`${supplier} × ${cell.componentGroup}: RPN ${cell.rpn}, ${cell.deviationCount} deviations`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-black text-white mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{cell.rpn || '-'}</div>
                        {cell.deviationCount > 0 && (
                          <div className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] mb-1.5">{cell.deviationCount} dev{cell.deviationCount !== 1 ? 's' : ''}</div>
                        )}
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {cell.trend === 'increasing' && (
                            <i className="fa-solid fa-arrow-trend-up text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"></i>
                          )}
                          {cell.trend === 'decreasing' && (
                            <i className="fa-solid fa-arrow-trend-down text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"></i>
                          )}
                          {cell.trend === 'stable' && (
                            <i className="fa-solid fa-minus text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"></i>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-5 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-white/40 dark:border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <span className="text-xs font-black ui-label uppercase tracking-wider">Risk Level:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-400 shadow-sm"></div>
                  <span className="text-xs font-bold ui-text-primary">Low (&lt;50)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-yellow-400 shadow-sm"></div>
                  <span className="text-xs font-bold ui-text-primary">Medium (50-79)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-amber-500 shadow-sm"></div>
                  <span className="text-xs font-bold ui-text-primary">High (80-124)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-red-500 shadow-sm"></div>
                  <span className="text-xs font-bold ui-text-primary">Critical (≥125)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs ui-text-secondary">
              <i className="fa-solid fa-info-circle"></i>
              <span className="font-medium">Click cells for details • Numbers show RPN / Deviation count</span>
            </div>
          </div>
        </div>

        {/* Selected Cell Details */}
        {selectedCellData && selectedCellData.rpn > 0 && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50/60 to-purple-50/60 dark:from-blue-900/15 dark:to-purple-900/15 rounded-2xl border-2 border-blue-200/50 dark:border-blue-700/30 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-black ui-heading mb-2">
                  {selectedCellData.supplier} × {selectedCellData.componentGroup}
                </h4>
                <p className="text-sm font-medium ui-text-secondary">
                  {selectedCellData.deviationCount} deviation{selectedCellData.deviationCount !== 1 ? 's' : ''} in last {timeframe}
                </p>
              </div>
              <span className={`text-xs font-black px-4 py-2 rounded-full ${
                selectedCellData.riskLevel === 'critical' ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400' :
                selectedCellData.riskLevel === 'high' ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400' :
                selectedCellData.riskLevel === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/25 text-yellow-600 dark:text-yellow-400' :
                'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400'
              }`}>
                {selectedCellData.riskLevel.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <span className="text-xs font-black ui-label uppercase tracking-wider">Average RPN</span>
                <div className="text-2xl font-extrabold ui-text-primary mt-2">{selectedCellData.rpn}</div>
              </div>
              <div>
                <span className="text-xs font-black ui-label uppercase tracking-wider">Trend</span>
                <div className="flex items-center gap-2 mt-2">
                  {selectedCellData.trend === 'increasing' && (
                    <>
                      <i className="fa-solid fa-arrow-trend-up text-lg text-red-500"></i>
                      <span className="text-base font-bold text-red-500">Increasing</span>
                    </>
                  )}
                  {selectedCellData.trend === 'decreasing' && (
                    <>
                      <i className="fa-solid fa-arrow-trend-down text-lg text-emerald-500"></i>
                      <span className="text-base font-bold text-emerald-500">Decreasing</span>
                    </>
                  )}
                  {selectedCellData.trend === 'stable' && (
                    <>
                      <i className="fa-solid fa-minus text-base text-slate-400"></i>
                      <span className="text-base font-bold ui-text-secondary">Stable</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-black ui-label uppercase tracking-wider">Deviations</span>
                <div className="text-2xl font-extrabold ui-text-primary mt-2">{selectedCellData.deviationCount}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* At-Risk Suppliers */}
      {atRiskSuppliers.length > 0 && (
        <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <i className="fa-solid fa-exclamation-triangle text-lg"></i>
            </div>
            <div>
              <h3 className="text-xl font-extrabold ui-heading mb-1">At-Risk {deviationType === 'Customer' ? 'Customers' : 'Suppliers'}</h3>
              <p className="text-xs font-black text-red-500 dark:text-red-400 uppercase tracking-wider">Requiring Immediate Attention</p>
            </div>
          </div>
          <div className="space-y-4">
            {atRiskSuppliers.slice(0, 5).map((supplier) => (
              <div
                key={supplier.supplierId}
                className="p-5 bg-gradient-to-r from-red-50/50 to-amber-50/50 dark:from-red-900/10 dark:to-amber-900/10 rounded-2xl border border-red-100/50 dark:border-red-800/30"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-base font-black ui-heading mb-2">{supplier.supplierName}</h4>
                    <p className="text-sm font-medium ui-text-secondary leading-relaxed">{supplier.recommendation}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xl font-extrabold text-red-600 dark:text-red-400 mb-2">
                      RPN {supplier.currentRPN}
                    </div>
                    <div className={`text-xs font-black px-3 py-1.5 rounded-full ${
                      supplier.trend === 'deteriorating' ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400' :
                      'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {supplier.trendPercentage > 0 ? '+' : ''}{supplier.trendPercentage}% {supplier.trend}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="ui-text-secondary font-medium">Avg RPN: </span>
                    <span className="font-bold ui-text-primary">{supplier.averageRPN}</span>
                  </div>
                  <div>
                    <span className="ui-text-secondary font-medium">Risk Level: </span>
                    <span className={`font-bold ${
                      supplier.riskLevel === 'critical' ? 'text-red-600 dark:text-red-400' :
                      supplier.riskLevel === 'high' ? 'text-amber-600 dark:text-amber-400' :
                      'text-slate-600 dark:text-slate-400'
                    }`}>
                      {supplier.riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
