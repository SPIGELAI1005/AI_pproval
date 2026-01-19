import React, { useState, useEffect } from 'react';
import { DeviationRecord } from '../types';
import { PredictionService, ApprovalPrediction, BottleneckAnalysis } from '../services/predictionService';

interface ApprovalTimelineProps {
  deviation: DeviationRecord;
  compact?: boolean;
}

export default function ApprovalTimeline({ deviation, compact = false }: ApprovalTimelineProps) {
  const [prediction, setPrediction] = useState<ApprovalPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrediction() {
      setLoading(true);
      setError(null);
      try {
        const service = new PredictionService();
        const result = await service.predictApprovalTimeline(deviation);
        setPrediction(result);
      } catch (err) {
        console.error('Prediction error:', err);
        setError('Failed to load prediction');
      } finally {
        setLoading(false);
      }
    }

    loadPrediction();
  }, [deviation]);

  if (loading) {
    return (
      <div className={`glass rounded-[24px] border border-white/50 p-6 ${compact ? '' : 'shadow-xl'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-clock text-blue-500 dark:text-blue-400 animate-pulse"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black ui-heading">Approval Timeline</h3>
            <p className="text-[10px] ui-text-tertiary">Calculating prediction...</p>
          </div>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className={`glass rounded-[24px] border border-white/50 p-6 ${compact ? '' : 'shadow-xl'}`}>
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
          <p className="text-xs ui-text-secondary">{error || 'Unable to generate prediction'}</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const expectedDate = new Date(prediction.expectedCompletionDate);
  const daysUntil = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (compact) {
    return (
      <div className="glass glass-highlight rounded-[16px] border border-white/50 dark:border-white/10 px-4 py-2.5 shadow-lg backdrop-blur-xl w-full">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-400 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0">
            <i className="fa-solid fa-clock text-[10px]"></i>
          </div>
          <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div>
                <div className="text-[10px] font-black ui-heading leading-tight whitespace-nowrap">Expected Approval</div>
                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium ui-text-tertiary uppercase tracking-widest whitespace-nowrap">Timeline Prediction</div>
                  {deviation.masterData.productSafetyRelevant && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 uppercase whitespace-nowrap">
                      <i className="fa-solid fa-shield-halved mr-1"></i>Safety
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs font-extrabold ui-text-primary whitespace-nowrap">
                {expectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                daysUntil <= 3 ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30' :
                daysUntil <= 7 ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/30' :
                'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30'
              }`}>
                {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
              </span>
              {prediction.bottlenecks.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-exclamation-triangle text-amber-500 dark:text-amber-400 text-[10px]"></i>
                  <span className="text-[9px] font-bold ui-text-secondary whitespace-nowrap">
                    {prediction.bottlenecks.length} bottleneck{prediction.bottlenecks.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <i className="fa-solid fa-clock text-lg"></i>
          </div>
          <div>
            <h3 className="text-lg font-extrabold ui-heading">Approval Timeline</h3>
            <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">Predictive Analysis</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold ui-text-secondary mb-1">Confidence</div>
          <div className="text-lg font-extrabold text-blue-500 dark:text-blue-400">{prediction.confidence}%</div>
        </div>
      </div>

      {/* Expected Completion */}
      <div className="mb-6 p-5 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 dark:from-blue-900/10 dark:to-emerald-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black ui-label uppercase tracking-widest">Expected Completion</span>
            {deviation.masterData.productSafetyRelevant && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 uppercase flex items-center gap-1">
                <i className="fa-solid fa-shield-halved text-[8px]"></i>
                Product Safety Review Required
              </span>
            )}
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full ${
            daysUntil <= 3 ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400' :
            daysUntil <= 7 ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400' :
            'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400'
          }`}>
            {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="text-xl font-extrabold ui-text-primary mb-1">
          {expectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="text-xs font-medium ui-text-secondary">
          Estimated {prediction.estimatedDays} business days from submission
          {deviation.masterData.productSafetyRelevant && (
            <span className="ml-2 text-red-600 dark:text-red-400 font-bold">
              • Includes Product Safety Officer approval step
            </span>
          )}
        </div>
      </div>

      {/* Step-by-step Timeline */}
      <div className="space-y-4 mb-6">
        <h4 className="text-xs font-black ui-label uppercase tracking-widest mb-3">Step-by-Step Prediction</h4>
        {prediction.stepPredictions.map((step, idx) => {
          const stepDate = new Date(step.expectedDate);
          const isCompleted = deviation.approvals.find(s => s.id === step.stepId)?.status === 'Approved';
          const isPending = deviation.approvals.find(s => s.id === step.stepId)?.status === 'Pending';
          
          return (
            <div key={step.stepId} className="flex items-start gap-4 p-4 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-white/50 dark:border-white/10">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                isCompleted ? 'bg-emerald-500 text-white' :
                isPending ? 'bg-blue-500 text-white' :
                'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {isCompleted ? <i className="fa-solid fa-check"></i> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold ui-text-primary">{step.role}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    step.riskLevel === 'high' ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400' :
                    step.riskLevel === 'medium' ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400' :
                    'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {step.expectedDays} {step.expectedDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="text-[10px] font-medium ui-text-secondary">
                  Expected: {stepDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {step.historicalAvgDays && (
                    <span className="ml-2 opacity-60">
                      (avg: {step.historicalAvgDays} days)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottleneck Warnings */}
      {prediction.bottlenecks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black ui-label uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-exclamation-triangle text-amber-500"></i>
            Bottleneck Warnings
          </h4>
          {prediction.bottlenecks.map((bottleneck, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                bottleneck.severity === 'critical'
                  ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                  : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
                  bottleneck.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  <i className="fa-solid fa-exclamation text-xs"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold ui-text-primary">{bottleneck.role}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                      bottleneck.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400'
                    }`}>
                      {bottleneck.severity}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium ui-text-secondary mb-2">{bottleneck.message}</p>
                  {bottleneck.suggestedDelegates && bottleneck.suggestedDelegates.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <div className="text-[9px] font-black ui-label uppercase tracking-widest mb-1">Suggested Delegates:</div>
                      <div className="flex flex-wrap gap-2">
                        {bottleneck.suggestedDelegates.map((delegate, dIdx) => (
                          <span
                            key={dIdx}
                            className="text-[9px] font-bold px-2 py-1 bg-white/60 dark:bg-slate-700/60 rounded-lg ui-text-primary border border-white/40 dark:border-slate-600/40"
                          >
                            {delegate}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
