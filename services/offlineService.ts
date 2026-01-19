import { DeviationRecord } from '../types';

const DB_NAME = 'AI_PPROVAL_DB';
const DB_VERSION = 1;
const STORE_DEVIATIONS = 'deviations';
const STORE_QUEUE = 'sync_queue';

interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: DeviationRecord | Partial<DeviationRecord>;
  timestamp: string;
  retries: number;
}

/**
 * OfflineService manages offline data storage and synchronization
 * using IndexedDB for local storage and Background Sync API for sync.
 */
export class OfflineService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineService] Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineService] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create deviations store
        if (!db.objectStoreNames.contains(STORE_DEVIATIONS)) {
          const deviationStore = db.createObjectStore(STORE_DEVIATIONS, { keyPath: 'id' });
          deviationStore.createIndex('status', 'status', { unique: false });
          deviationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save deviation offline
   */
  async saveOffline(deviation: DeviationRecord): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_DEVIATIONS], 'readwrite');
      const store = transaction.objectStore(STORE_DEVIATIONS);

      const deviationWithTimestamp = {
        ...deviation,
        timestamp: new Date().toISOString(),
        offline: true,
      };

      const request = store.put(deviationWithTimestamp);

      request.onsuccess = () => {
        console.log('[OfflineService] Deviation saved offline:', deviation.id);
        resolve();
      };

      request.onerror = () => {
        console.error('[OfflineService] Failed to save offline');
        reject(request.error);
      };
    });
  }

  /**
   * Get all offline deviations
   */
  async getOfflineDeviations(): Promise<DeviationRecord[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_DEVIATIONS], 'readonly');
      const store = transaction.objectStore(STORE_DEVIATIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const deviations = request.result.map((d: any) => {
          const { timestamp, offline, ...deviation } = d;
          return deviation;
        });
        resolve(deviations);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Queue an action for sync when online
   */
  async queueAction(
    type: 'create' | 'update' | 'delete',
    data: DeviationRecord | Partial<DeviationRecord>
  ): Promise<void> {
    await this.ensureInitialized();

    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORE_QUEUE);
      const request = store.add(action);

      request.onsuccess = () => {
        console.log('[OfflineService] Action queued for sync:', action.id);
        
        // Register background sync if available
        if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
          (navigator.serviceWorker.ready as Promise<ServiceWorkerRegistration>).then((registration: any) => {
            registration.sync.register('sync-deviations').catch((err: Error) => {
              console.warn('[OfflineService] Background sync not available:', err);
            });
          });
        }
        
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get queued actions
   */
  async getQueuedActions(): Promise<QueuedAction[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_QUEUE], 'readonly');
      const store = transaction.objectStore(STORE_QUEUE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Sync queued actions when online
   */
  async syncWhenOnline(): Promise<{ success: number; failed: number }> {
    if (!navigator.onLine) {
      console.log('[OfflineService] Still offline, skipping sync');
      return { success: 0, failed: 0 };
    }

    await this.ensureInitialized();
    const queuedActions = await this.getQueuedActions();

    if (queuedActions.length === 0) {
      console.log('[OfflineService] No queued actions to sync');
      return { success: 0, failed: 0 };
    }

    console.log(`[OfflineService] Syncing ${queuedActions.length} queued actions...`);

    let success = 0;
    let failed = 0;

    for (const action of queuedActions) {
      try {
        // In production, this would make actual API calls
        // For now, we'll simulate success
        await this.simulateSyncAction(action);
        
        // Remove from queue on success
        await this.removeQueuedAction(action.id);
        success++;
      } catch (error) {
        console.error('[OfflineService] Failed to sync action:', action.id, error);
        action.retries++;
        
        // Remove if too many retries
        if (action.retries >= 3) {
          await this.removeQueuedAction(action.id);
          failed++;
        } else {
          // Update retry count
          await this.updateQueuedAction(action);
        }
      }
    }

    console.log(`[OfflineService] Sync complete: ${success} succeeded, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Remove queued action
   */
  private async removeQueuedAction(actionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORE_QUEUE);
      const request = store.delete(actionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update queued action
   */
  private async updateQueuedAction(action: QueuedAction): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORE_QUEUE);
      const request = store.put(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Simulate sync action (replace with real API call in production)
   */
  private async simulateSyncAction(action: QueuedAction): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In production, this would be:
    // if (action.type === 'create') {
    //   await fetch('/api/deviations', { method: 'POST', body: JSON.stringify(action.data) });
    // } else if (action.type === 'update') {
    //   await fetch(`/api/deviations/${action.data.id}`, { method: 'PUT', body: JSON.stringify(action.data) });
    // } else if (action.type === 'delete') {
    //   await fetch(`/api/deviations/${action.data.id}`, { method: 'DELETE' });
    // }
    
    console.log(`[OfflineService] Simulated sync: ${action.type}`, action.data);
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Ensure IndexedDB is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  /**
   * Clear all offline data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_DEVIATIONS, STORE_QUEUE], 'readwrite');
      
      transaction.objectStore(STORE_DEVIATIONS).clear();
      transaction.objectStore(STORE_QUEUE).clear();

      transaction.oncomplete = () => {
        console.log('[OfflineService] All offline data cleared');
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }
}
