/**
 * Conflict Alert Component
 * Displays similarity conflict alerts to prevent inconsistent quality decisions
 */

import React from 'react';
import { ConflictAlert as ConflictAlertType } from '../services/conflictDetectionService';

interface ConflictAlertProps {
  conflict: ConflictAlertType;
  onDismiss?: () => void;
  onViewDetails?: (deviationId: string) => void;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({ 
  conflict, 
  onDismiss,
  onViewDetails 
}) => {
  const isBlocking = conflict.severity === 'blocking';

  return (
    <div className={`p-6 rounded-[24px] border-2 transition-all ${
      isBlocking 
        ? 'bg-red-50 border-red-200 shadow-lg shadow-red-500/10' 
        : 'bg-amber-50 border-amber-200 shadow-md shadow-amber-500/10'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
            isBlocking ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            <i className={`fa-solid ${isBlocking ? 'fa-ban' : 'fa-triangle-exclamation'}`}></i>
          </div>
          <div>
            <h4 className={`text-sm font-extrabold ${
              isBlocking ? 'text-red-700' : 'text-amber-700'
            }`}>
              {isBlocking ? 'BLOCKING CONFLICT' : 'SIMILARITY WARNING'}
            </h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
              Similarity: {Math.round(conflict.similarity * 100)}%
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="h-8 w-8 rounded-lg bg-white/60 hover:bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
          >
            <i className="fa-solid fa-times text-xs"></i>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-white/60 rounded-xl border border-white">
          <p className="text-xs font-bold text-slate-800 mb-2">{conflict.reason}</p>
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="font-black text-slate-400 uppercase tracking-widest">Material</span>
              <p className="font-bold text-slate-700 mt-0.5">{conflict.materialNo}</p>
            </div>
            <div>
              <span className="font-black text-slate-400 uppercase tracking-widest">Plant</span>
              <p className="font-bold text-slate-700 mt-0.5">{conflict.plant}</p>
            </div>
            <div>
              <span className="font-black text-slate-400 uppercase tracking-widest">Previous Decision</span>
              <p className={`font-bold mt-0.5 ${
                conflict.previousDecision === 'Rejected' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {conflict.previousDecision}
              </p>
            </div>
            <div>
              <span className="font-black text-slate-400 uppercase tracking-widest">Date</span>
              <p className="font-bold text-slate-700 mt-0.5">
                {new Date(conflict.decisionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {conflict.deviationDescription && (
          <div className="p-3 bg-white/40 rounded-lg border border-white/60">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Historical Deviation Description
            </p>
            <p className="text-xs font-medium text-slate-600 italic">
              {conflict.deviationDescription}
            </p>
          </div>
        )}

        <div className={`p-4 rounded-xl border ${
          isBlocking 
            ? 'bg-red-100 border-red-300' 
            : 'bg-amber-100 border-amber-300'
        }`}>
          <div className="flex items-start gap-2">
            <i className={`fa-solid fa-lightbulb text-sm mt-0.5 ${
              isBlocking ? 'text-red-600' : 'text-amber-600'
            }`}></i>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-700">
                Recommendation
              </p>
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                {conflict.recommendation}
              </p>
            </div>
          </div>
        </div>

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(conflict.similarDeviationId)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-[#007aff] hover:text-[#007aff] transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-eye"></i>
            <span>View Historical Deviation Details</span>
          </button>
        )}
      </div>
    </div>
  );
};

interface ConflictAlertsPanelProps {
  conflicts: ConflictAlertType[];
  onDismiss?: (index: number) => void;
  onViewDetails?: (deviationId: string) => void;
}

export const ConflictAlertsPanel: React.FC<ConflictAlertsPanelProps> = ({
  conflicts,
  onDismiss,
  onViewDetails,
}) => {
  if (conflicts.length === 0) {
    return null;
  }

  const blockingConflicts = conflicts.filter(c => c.severity === 'blocking');
  const warnings = conflicts.filter(c => c.severity === 'warning');

  return (
    <div className="space-y-4">
      {blockingConflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-ban text-red-500"></i>
            <h3 className="text-sm font-extrabold text-red-700">
              Blocking Conflicts ({blockingConflicts.length})
            </h3>
          </div>
          {blockingConflicts.map((conflict, index) => (
            <ConflictAlert
              key={`blocking-${index}`}
              conflict={conflict}
              onDismiss={onDismiss ? () => onDismiss(conflicts.indexOf(conflict)) : undefined}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
            <h3 className="text-sm font-extrabold text-amber-700">
              Warnings ({warnings.length})
            </h3>
          </div>
          {warnings.map((conflict, index) => (
            <ConflictAlert
              key={`warning-${index}`}
              conflict={conflict}
              onDismiss={onDismiss ? () => onDismiss(conflicts.indexOf(conflict)) : undefined}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
