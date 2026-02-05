 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface ActivityLog {
   id: string;
   farm_id: string | null;
   event_type: string;
   message: string;
   severity: string | null;
   created_at: string;
 }
 
 export interface FormattedActivity {
   id: string;
   type: "ai" | "irrigation" | "system" | "alert";
   message: string;
   details?: string;
   timestamp: string;
 }
 
 function formatTimestamp(date: string): string {
   const now = new Date();
   const logDate = new Date(date);
   const diffMs = now.getTime() - logDate.getTime();
   const diffMins = Math.floor(diffMs / 60000);
   const diffHours = Math.floor(diffMs / 3600000);
   const diffDays = Math.floor(diffMs / 86400000);
 
   if (diffMins < 1) return "Just now";
   if (diffMins < 60) return `${diffMins} min ago`;
   if (diffHours < 24) return `${diffHours} hours ago`;
   return `${diffDays} days ago`;
 }
 
 function mapEventType(type: string): "ai" | "irrigation" | "system" | "alert" {
   switch (type.toLowerCase()) {
     case "ai":
     case "recommendation":
       return "ai";
     case "irrigation":
     case "watering":
       return "irrigation";
     case "alert":
     case "warning":
     case "error":
       return "alert";
     default:
       return "system";
   }
 }
 
 export function useActivityLogs(farmId: string | null) {
   const [logs, setLogs] = useState<FormattedActivity[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchLogs = useCallback(async () => {
     if (!farmId) {
       setLogs([]);
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error: fetchError } = await supabase
         .from("activity_logs")
         .select("*")
         .eq("farm_id", farmId)
         .order("created_at", { ascending: false })
         .limit(10);
 
       if (fetchError) throw fetchError;
 
       const formatted: FormattedActivity[] = (data || []).map(log => ({
         id: log.id,
         type: mapEventType(log.event_type),
         message: log.message,
         details: log.severity !== "info" ? log.severity : undefined,
         timestamp: formatTimestamp(log.created_at),
       }));
 
       setLogs(formatted);
     } catch (err) {
       console.error("Error fetching activity logs:", err);
       setError(err instanceof Error ? err.message : "Failed to fetch logs");
     } finally {
       setIsLoading(false);
     }
   }, [farmId]);
 
   // Subscribe to realtime updates
   useEffect(() => {
     if (!farmId) return;
 
     fetchLogs();
 
     const channel = supabase
       .channel(`activity_logs_${farmId}`)
       .on(
         "postgres_changes",
         {
           event: "INSERT",
           schema: "public",
           table: "activity_logs",
           filter: `farm_id=eq.${farmId}`,
         },
         (payload) => {
           const newLog = payload.new as ActivityLog;
           const formatted: FormattedActivity = {
             id: newLog.id,
             type: mapEventType(newLog.event_type),
             message: newLog.message,
             details: newLog.severity !== "info" ? newLog.severity : undefined,
             timestamp: formatTimestamp(newLog.created_at),
           };
           setLogs(prev => [formatted, ...prev.slice(0, 9)]);
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [farmId, fetchLogs]);
 
   return {
     logs,
     isLoading,
     error,
     refetch: fetchLogs,
   };
 }