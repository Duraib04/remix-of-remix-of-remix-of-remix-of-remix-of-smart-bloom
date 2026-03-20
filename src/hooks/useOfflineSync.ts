import { useState, useEffect, useCallback } from "react";

interface PendingSyncItem {
  id: string;
  table: string;
  action: 'insert' | 'update';
  data: Record<string, unknown>;
  timestamp: number;
}

const PENDING_SYNC_KEY = 'farmwise_pending_sync';
const OFFLINE_CACHE_PREFIX = 'farmwise_cache_';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending count
    const pending = getPendingItems();
    setPendingCount(pending.length);

    const lastSync = localStorage.getItem('farmwise_last_sync');
    if (lastSync) setLastSyncTime(lastSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPendingItems = (): PendingSyncItem[] => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const addPendingItem = useCallback((item: Omit<PendingSyncItem, 'id' | 'timestamp'>) => {
    const pending = getPendingItems();
    pending.push({
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    setPendingCount(pending.length);
  }, []);

  const syncPendingData = useCallback(async () => {
    const pending = getPendingItems();
    if (pending.length === 0) return;

    const { supabase } = await import("@/integrations/supabase/client");
    const synced: string[] = [];

    for (const item of pending) {
      try {
        if (item.action === 'insert') {
          const { error } = await supabase.from(item.table as any).insert(item.data as any);
          if (!error) synced.push(item.id);
        } else if (item.action === 'update') {
          const { id, ...updates } = item.data;
          const { error } = await supabase.from(item.table as any).update(updates as any).eq('id', id as string);
          if (!error) synced.push(item.id);
        }
      } catch (err) {
        console.warn('Sync failed for item:', item.id, err);
      }
    }

    // Remove synced items
    const remaining = pending.filter(p => !synced.includes(p.id));
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));
    setPendingCount(remaining.length);

    if (synced.length > 0) {
      const now = new Date().toLocaleTimeString();
      localStorage.setItem('farmwise_last_sync', now);
      setLastSyncTime(now);
    }
  }, []);

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
