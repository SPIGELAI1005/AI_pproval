import React, { useState, useEffect } from 'react';
import { OfflineService } from '../services/offlineService';

interface OfflineIndicatorProps {
  onSyncComplete?: (result: { success: number; failed: number }) => void;
}

export default function OfflineIndicator({ onSyncComplete }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const offlineService = React.useMemo(() => new OfflineService(), []);

  useEffect(() => {
    // Initialize offline service
    offlineService.initialize().then(() => {
      updateQueuedCount();
    });

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      handleSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check queued actions periodically
    const interval = setInterval(() => {
      if (isOnline) {
        updateQueuedCount();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, offlineService]);

  const updateQueuedCount = async () => {
    try {
      const actions = await offlineService.getQueuedActions();
      setQueuedActions(actions.length);
    } catch (error) {
      console.error('Failed to get queued actions:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    try {
      const result = await offlineService.syncWhenOnline();
      setLastSync(new Date());
      await updateQueuedCount();
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && queuedActions === 0 && !lastSync) {
    return null; // Don't show indicator when online and nothing to sync
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 glass rounded-2xl border shadow-xl p-4 transition-all ${
        isOnline
          ? queuedActions > 0
            ? 'border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-900/20'
            : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-900/20'
          : 'border-red-200 dark:border-red-800 bg-red-50/90 dark:bg-red-900/20'
      }`}
    >
      <div className="flex items-center gap-3">
        {!isOnline ? (
          <>
            <div className="h-8 w-8 bg-red-500 rounded-xl flex items-center justify-center text-white">
              <i className="fa-solid fa-wifi-slash text-sm"></i>
            </div>
            <div>
              <div className="text-xs font-black ui-heading">Offline Mode</div>
              <div className="text-[10px] ui-text-secondary">Changes will sync when online</div>
            </div>
          </>
        ) : queuedActions > 0 ? (
          <>
            <div className="h-8 w-8 bg-amber-500 rounded-xl flex items-center justify-center text-white">
              <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="text-xs font-black ui-heading">
                {queuedActions} action{queuedActions !== 1 ? 's' : ''} pending sync
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline mt-0.5 disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync now'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="h-8 w-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
              <i className="fa-solid fa-wifi text-sm"></i>
            </div>
            <div>
              <div className="text-xs font-black ui-heading">Online</div>
              {lastSync && (
                <div className="text-[10px] ui-text-secondary">
                  Synced {lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
