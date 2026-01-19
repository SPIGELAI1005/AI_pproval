import React, { useState } from 'react';
import { DeviationRecord } from '../types';
import { AdaptiveCardsService } from '../services/adaptiveCardsService';

interface AdaptiveCardPreviewProps {
  deviation: DeviationRecord;
  approver: string;
  stepId: string;
  onSend?: (platform: 'teams' | 'slack') => Promise<void>;
}

export default function AdaptiveCardPreview({
  deviation,
  approver,
  stepId,
  onSend,
}: AdaptiveCardPreviewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'teams' | 'slack'>('teams');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const service = new AdaptiveCardsService();
  const preview = service.getCardPreview(deviation, selectedPlatform);

  const handleSend = async () => {
    if (onSend) {
      setSending(true);
      try {
        await onSend(selectedPlatform);
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      } catch (error) {
        console.error('Failed to send card:', error);
      } finally {
        setSending(false);
      }
    } else {
      // Fallback: use service directly
      setSending(true);
      try {
        if (selectedPlatform === 'teams') {
          await service.sendToTeams(deviation, approver, stepId);
        } else {
          await service.sendToSlack(deviation, approver, stepId, '#approvals');
        }
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      } catch (error) {
        console.error('Failed to send card:', error);
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div className="glass rounded-[32px] border border-white/50 p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-500 dark:to-purple-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <i className="fa-solid fa-comments text-lg"></i>
          </div>
          <div>
            <h3 className="text-lg font-extrabold ui-heading">Interactive Adaptive Card</h3>
            <p className="text-[10px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest">Teams / Slack Integration</p>
          </div>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="mb-6">
        <label className="text-xs font-black ui-label uppercase tracking-widest mb-3 block">Select Platform</label>
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedPlatform('teams')}
            className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
              selectedPlatform === 'teams'
                ? 'bg-blue-500 text-white border-blue-600 dark:border-blue-400 shadow-lg shadow-blue-500/30'
                : 'bg-white/40 dark:bg-slate-800/40 border-white/50 dark:border-white/10 ui-text-primary hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <i className="fa-brands fa-microsoft text-lg"></i>
              <span className="text-xs font-black">Microsoft Teams</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedPlatform('slack')}
            className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
              selectedPlatform === 'slack'
                ? 'bg-purple-500 text-white border-purple-600 dark:border-purple-400 shadow-lg shadow-purple-500/30'
                : 'bg-white/40 dark:bg-slate-800/40 border-white/50 dark:border-white/10 ui-text-primary hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <i className="fa-brands fa-slack text-lg"></i>
              <span className="text-xs font-black">Slack</span>
            </div>
          </button>
        </div>
      </div>

      {/* Card Preview */}
      <div className="mb-6 p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/50 dark:border-white/10">
        <div className="mb-4">
          <h4 className="text-sm font-black ui-heading mb-2">{preview.title}</h4>
          <p className="text-xs ui-text-secondary">{preview.summary}</p>
        </div>

        {/* Visual Preview */}
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center gap-2 mb-3">
              <i className={`fa-brands ${selectedPlatform === 'teams' ? 'fa-microsoft' : 'fa-slack'} text-lg`}></i>
              <span className="text-sm font-black ui-heading">Approval Request</span>
            </div>
            <div className="space-y-2 text-xs">
              <div><strong>Deviation ID:</strong> {deviation.id}</div>
              <div><strong>Material:</strong> {deviation.masterData.materialNo || 'N/A'}</div>
              <div><strong>Supplier:</strong> {deviation.masterData.supplierName || 'N/A'}</div>
              <div><strong>Status:</strong> {deviation.status}</div>
              {deviation.risks.length > 0 && (
                <div>
                  <strong>Highest RPN:</strong>{' '}
                  {Math.max(...deviation.risks.map(r => r.rpn))}
                  {Math.max(...deviation.risks.map(r => r.rpn)) >= 125 && ' 🔴 Critical'}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Preview */}
          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-black opacity-75 cursor-not-allowed"
            >
              ✅ Approve
            </button>
            <button
              disabled
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-xs font-black opacity-75 cursor-not-allowed"
            >
              ❌ Reject
            </button>
          </div>
        </div>
      </div>

      {/* Send Button */}
      <div className="flex items-center justify-between pt-4 border-t border-white/20 dark:border-white/10">
        <div className="text-xs ui-text-secondary">
          <strong>Recipient:</strong> {approver}
        </div>
        <button
          onClick={handleSend}
          disabled={sending || sent}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            sent
              ? 'bg-emerald-500 text-white'
              : sending
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              : selectedPlatform === 'teams'
              ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 text-white shadow-lg shadow-blue-500/30'
              : 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-500 dark:hover:bg-purple-400 text-white shadow-lg shadow-purple-500/30'
          }`}
        >
          {sending ? (
            <>
              <i className="fa-solid fa-circle-notch animate-spin mr-2"></i>
              Sending...
            </>
          ) : sent ? (
            <>
              <i className="fa-solid fa-check mr-2"></i>
              Sent!
            </>
          ) : (
            <>
              <i className="fa-solid fa-paper-plane mr-2"></i>
              Send to {selectedPlatform === 'teams' ? 'Teams' : 'Slack'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
