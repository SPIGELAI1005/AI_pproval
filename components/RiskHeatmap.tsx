import React, { useState, useEffect } from 'react';
import { AnalyticsService, HeatmapData, RiskTrend } from '../services/analyticsService';

export default function RiskHeatmap() {
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
          service.generateRiskHeatmap(timeframe),
          service.identifyAtRiskSuppliers(),
        ]);
        setHeatmapData(heatmap);
        setAtRiskSuppliers(atRisk);
      } catch (error) {
        console.error('Failed to load heatmap data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [timeframe]);

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
              <h3 className="text-lg font-extrabold ui-heading">Material Risk Heatmap</h3>
              <p className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest">Supplier × Component Group Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['3m', '6m', '12m'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  timeframe === tf
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${heatmapData.componentGroups.length}, minmax(80px, 1fr))` }}>
              {/* Header row */}
              <div className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <span className="text-[9px] font-black ui-label uppercase">Supplier / Component</span>
              </div>
              {heatmapData.componentGroups.map(cg => (
                <div key={cg} className="p-2 text-center border border-white/20 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[9px] font-black ui-text-primary break-words">{cg}</span>
                </div>
              ))}

              {/* Data rows */}
              {heatmapData.suppliers.map((supplier, rowIdx) => (
                <React.Fragment key={supplier}>
                  <div className="sticky left-0 z-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-2 border border-white/20 flex items-center">
                    <span className="text-[9px] font-bold ui-text-primary truncate">{supplier}</span>
                  </div>
                  {heatmapData.matrix[rowIdx].map((cell, colIdx) => (
                    <div
                      key={`${supplier}-${cell.componentGroup}`}
                      onClick={() => setSelectedCell({ supplier, componentGroup: cell.componentGroup })}
                      className={`p-3 rounded-lg border border-white/20 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                        selectedCell?.supplier === supplier && selectedCell?.componentGroup === cell.componentGroup
                          ? 'ring-2 ring-blue-500 ring-offset-2'
                          : ''
                      } ${getCellColor(cell.rpn, cell.riskLevel)} ${getCellIntensity(cell.rpn)}`}
                      title={`${supplier} × ${cell.componentGroup}: RPN ${cell.rpn}, ${cell.deviationCount} deviations`}
                    >
                      <div className="text-center">
                        <div className="text-xs font-black text-white mb-1">{cell.rpn || '-'}</div>
                        {cell.deviationCount > 0 && (
                          <div className="text-[8px] font-bold text-white/80">{cell.deviationCount}</div>
                        )}
                        {cell.trend === 'increasing' && (
                          <i className="fa-solid fa-arrow-trend-up text-[8px] text-white/90"></i>
                        )}
                        {cell.trend === 'decreasing' && (
                          <i className="fa-solid fa-arrow-trend-down text-[8px] text-white/90"></i>
                        )}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black ui-label uppercase">Risk Level:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-emerald-400"></div>
                <span className="text-[9px] font-bold ui-text-secondary">Low (&lt;50)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-yellow-400"></div>
                <span className="text-[9px] font-bold ui-text-secondary">Medium (50-79)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-500"></div>
                <span className="text-[9px] font-bold ui-text-secondary">High (80-124)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-[9px] font-bold ui-text-secondary">Critical (≥125)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] ui-text-tertiary">
            <i className="fa-solid fa-info-circle"></i>
            <span>Click cells for details • Numbers show RPN / Deviation count</span>
          </div>
        </div>

        {/* Selected Cell Details */}
        {selectedCellData && selectedCellData.rpn > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-black ui-heading mb-1">
                  {selectedCellData.supplier} × {selectedCellData.componentGroup}
                </h4>
                <p className="text-xs ui-text-secondary">
                  {selectedCellData.deviationCount} deviation{selectedCellData.deviationCount !== 1 ? 's' : ''} in last {timeframe}
                </p>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                selectedCellData.riskLevel === 'critical' ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400' :
                selectedCellData.riskLevel === 'high' ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400' :
                selectedCellData.riskLevel === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/25 text-yellow-600 dark:text-yellow-400' :
                'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400'
              }`}>
                {selectedCellData.riskLevel.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-[9px] font-black ui-label uppercase">Average RPN</span>
                <div className="text-lg font-extrabold ui-text-primary mt-1">{selectedCellData.rpn}</div>
              </div>
              <div>
                <span className="text-[9px] font-black ui-label uppercase">Trend</span>
                <div className="flex items-center gap-2 mt-1">
                  {selectedCellData.trend === 'increasing' && (
                    <>
                      <i className="fa-solid fa-arrow-trend-up text-red-500"></i>
                      <span className="text-sm font-bold text-red-500">Increasing</span>
                    </>
                  )}
                  {selectedCellData.trend === 'decreasing' && (
                    <>
                      <i className="fa-solid fa-arrow-trend-down text-emerald-500"></i>
                      <span className="text-sm font-bold text-emerald-500">Decreasing</span>
                    </>
                  )}
                  {selectedCellData.trend === 'stable' && (
                    <>
                      <i className="fa-solid fa-minus text-slate-400"></i>
                      <span className="text-sm font-bold ui-text-secondary">Stable</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black ui-label uppercase">Deviations</span>
                <div className="text-lg font-extrabold ui-text-primary mt-1">{selectedCellData.deviationCount}</div>
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
              <h3 className="text-lg font-extrabold ui-heading">At-Risk Suppliers</h3>
              <p className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest">Requiring Immediate Attention</p>
            </div>
          </div>
          <div className="space-y-4">
            {atRiskSuppliers.slice(0, 5).map((supplier) => (
              <div
                key={supplier.supplierId}
                className="p-5 bg-gradient-to-r from-red-50/50 to-amber-50/50 dark:from-red-900/10 dark:to-amber-900/10 rounded-2xl border border-red-100/50 dark:border-red-800/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-black ui-heading mb-1">{supplier.supplierName}</h4>
                    <p className="text-xs ui-text-secondary">{supplier.recommendation}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-extrabold text-red-600 dark:text-red-400 mb-1">
                      RPN {supplier.currentRPN}
                    </div>
                    <div className={`text-[10px] font-black px-2 py-1 rounded-full ${
                      supplier.trend === 'deteriorating' ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400' :
                      'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {supplier.trendPercentage > 0 ? '+' : ''}{supplier.trendPercentage}% {supplier.trend}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="ui-text-tertiary">Avg RPN: </span>
                    <span className="font-bold ui-text-primary">{supplier.averageRPN}</span>
                  </div>
                  <div>
                    <span className="ui-text-tertiary">Risk Level: </span>
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
