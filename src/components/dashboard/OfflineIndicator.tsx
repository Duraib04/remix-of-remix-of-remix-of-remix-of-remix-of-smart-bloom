import { Wifi, WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  onSync: () => void;
}

export function OfflineIndicator({ isOnline, pendingCount, lastSyncTime, onSync }: OfflineIndicatorProps) {
  const { t } = useLanguage();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      isOnline
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }`}>
      {isOnline ? (
        <>
          <RefreshCw className="h-3 w-3 cursor-pointer hover:animate-spin" onClick={onSync} />
          <span>{pendingCount} {t.pendingSync || "pending sync"}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>{t.offlineMode || "Offline mode"}</span>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
              {pendingCount}
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
