import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface PendingSyncItem {
  id: string;
  table: string;
  action: 'insert' | 'update';
  data: Record<string, unknown>;
  timestamp: number;
  retries?: number;
  lastError?: string;
}

const PENDING_SYNC_KEY = 'farmwise_pending_sync';
const OFFLINE_CACHE_PREFIX = 'farmwise_cache_';
const MAX_RETRIES = 5;
const PERIODIC_SYNC_MS = 30_000; // retry every 30s while online

// ---- Module-level helpers (shared across hook instances) ----
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const getPendingItems = (): PendingSyncItem[] => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
  } catch {
    return [];
  }
};

const setPendingItems = (items: PendingSyncItem[]) => {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(items));
  notify();
};

export const queueOfflineWrite = (item: Omit<PendingSyncItem, 'id' | 'timestamp'>) => {
  const pending = getPendingItems();
  pending.push({
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
  });
  setPendingItems(pending);
};

let syncInFlight = false;
const syncAll = async (): Promise<{ synced: number; failed: number }> => {
  if (syncInFlight) return { synced: 0, failed: 0 };
  syncInFlight = true;
  try {
    const pending = getPendingItems();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    const { supabase } = await import("@/integrations/supabase/client");
    const remaining: PendingSyncItem[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of pending) {
      try {
        let error: unknown = null;
        if (item.action === 'insert') {
          const res = await supabase.from(item.table as never).insert(item.data as never);
          error = res.error;
        } else if (item.action === 'update') {
          const { id, ...updates } = item.data;
          const res = await supabase
            .from(item.table as never)
            .update(updates as never)
            .eq('id', id as string);
          error = res.error;
        }

        if (error) throw error;
        syncedCount++;
      } catch (err) {
        const retries = (item.retries ?? 0) + 1;
        const message = err instanceof Error ? err.message : String(err);
        if (retries < MAX_RETRIES) {
          remaining.push({ ...item, retries, lastError: message });
        }
        // else: drop the item after MAX_RETRIES to avoid endless queue
        failedCount++;
        console.warn(`Sync failed (retry ${retries}/${MAX_RETRIES}):`, item.table, message);
      }
    }

    setPendingItems(remaining);

    if (syncedCount > 0) {
      const now = new Date().toLocaleTimeString();
      localStorage.setItem('farmwise_last_sync', now);
    }

    return { synced: syncedCount, failed: failedCount };
  } finally {
    syncInFlight = false;
  }
};

// ---- Hook ----
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getPendingItems().length);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem('farmwise_last_sync')
  );
  const intervalRef = useRef<number | null>(null);

  const refreshState = useCallback(() => {
    setPendingCount(getPendingItems().length);
    setLastSyncTime(localStorage.getItem('farmwise_last_sync'));
  }, []);

  const runSync = useCallback(async (showToast = false) => {
    if (!navigator.onLine) return;
    const before = getPendingItems().length;
    if (before === 0) return;
    const { synced, failed } = await syncAll();
    refreshState();
    if (showToast && synced > 0) {
      toast.success(`Synced ${synced} offline change${synced > 1 ? 's' : ''}`);
    }
    if (showToast && failed > 0 && synced === 0) {
      toast.error(`Failed to sync ${failed} item${failed > 1 ? 's' : ''}. Will retry.`);
    }
  }, [refreshState]);

  useEffect(() => {
    listeners.add(refreshState);

    const handleOnline = () => {
      setIsOnline(true);
      toast.info("Back online — syncing your data…");
      runSync(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Actions will be saved and synced later.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync attempt if there's pending data and we're online
    if (navigator.onLine && getPendingItems().length > 0) {
      runSync(true);
    }

    // Periodic background retry
    intervalRef.current = window.setInterval(() => {
      if (navigator.onLine && getPendingItems().length > 0) {
        runSync(false);
      }
    }, PERIODIC_SYNC_MS);

    return () => {
      listeners.delete(refreshState);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [refreshState, runSync]);

  const addPendingItem = useCallback((item: Omit<PendingSyncItem, 'id' | 'timestamp'>) => {
    queueOfflineWrite(item);
    refreshState();
  }, [refreshState]);

  const syncPendingData = useCallback(() => runSync(true), [runSync]);

  // Cache data for offline use
  const cacheData = useCallback((key: string, data: unknown) => {
    try {
      localStorage.setItem(OFFLINE_CACHE_PREFIX + key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Cache storage failed:', e);
    }
  }, []);

  const getCachedData = useCallback(<T>(key: string, maxAge?: number): T | null => {
    try {
      const raw = localStorage.getItem(OFFLINE_CACHE_PREFIX + key);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (maxAge && Date.now() - timestamp > maxAge) return null;
      return data as T;
    } catch {
      return null;
    }
  }, []);

  return {
    isOnline,
    pendingCount,
    lastSyncTime,
    addPendingItem,
    syncPendingData,
    cacheData,
    getCachedData,
  };
}
