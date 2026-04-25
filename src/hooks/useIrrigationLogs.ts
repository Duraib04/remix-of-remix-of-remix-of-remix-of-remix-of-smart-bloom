  import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { queueOfflineWrite } from "./useOfflineSync";
 import { toast } from "sonner";
 
 interface IrrigationLog {
   id: string;
   farm_id: string | null;
   action: string;
   duration_minutes: number | null;
   water_used_liters: number | null;
   triggered_by: string | null;
   created_at: string;
 }
 
 interface EfficiencyData {
   currentEfficiency: number;
   waterSaved: number;
   weeklyData: Array<{
     day: string;
     used: number;
     saved: number;
   }>;
 }
 
 export function useIrrigationLogs(farmId: string | null) {
   const [logs, setLogs] = useState<IrrigationLog[]>([]);
   const [efficiencyData, setEfficiencyData] = useState<EfficiencyData>({
     currentEfficiency: 0,
     waterSaved: 0,
     weeklyData: [],
   });
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchLogs = useCallback(async () => {
     if (!farmId) {
       setIsLoading(false);
       return;
     }
 
     try {
       // Fetch last 7 days of irrigation logs
       const sevenDaysAgo = new Date();
       sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
 
       const { data, error: fetchError } = await supabase
         .from("irrigation_logs")
         .select("*")
         .eq("farm_id", farmId)
         .gte("created_at", sevenDaysAgo.toISOString())
         .order("created_at", { ascending: false });
 
       if (fetchError) throw fetchError;
 
       setLogs(data || []);
 
       // Calculate efficiency data
       if (data && data.length > 0) {
         const totalUsed = data.reduce((sum, log) => sum + (log.water_used_liters || 0), 0);
         const aiTriggered = data.filter(log => log.triggered_by === "ai");
         const manualTriggered = data.filter(log => log.triggered_by === "manual");
         
         // Estimate savings based on AI vs manual
         const aiEfficiency = aiTriggered.length / data.length;
         const estimatedSavings = Math.round(totalUsed * 0.25); // Assume 25% savings
         
         // Group by day
         const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
         const weeklyMap = new Map<string, { used: number; saved: number }>();
         
         data.forEach(log => {
           const date = new Date(log.created_at);
           const dayName = dayNames[date.getDay()];
           const existing = weeklyMap.get(dayName) || { used: 0, saved: 0 };
           existing.used += log.water_used_liters || 0;
           if (log.triggered_by === "ai") {
             existing.saved += Math.round((log.water_used_liters || 0) * 0.2);
           }
           weeklyMap.set(dayName, existing);
         });
 
         const weeklyData = dayNames.map(day => ({
           day,
           used: weeklyMap.get(day)?.used || 0,
           saved: weeklyMap.get(day)?.saved || 0,
         }));
 
         setEfficiencyData({
           currentEfficiency: Math.round(aiEfficiency * 100) || 0,
           waterSaved: estimatedSavings,
           weeklyData,
         });
       }
     } catch (err) {
       console.error("Error fetching irrigation logs:", err);
       setError(err instanceof Error ? err.message : "Failed to fetch logs");
     } finally {
       setIsLoading(false);
     }
   }, [farmId]);
 
   // Log irrigation action
   const logIrrigation = useCallback(async (
     action: string,
     durationMinutes?: number,
     waterUsedLiters?: number,
     triggeredBy: "manual" | "ai" | "scheduled" = "manual"
   ) => {
     if (!farmId) return;
 
      try {
       const payload = {
         farm_id: farmId,
         action,
         duration_minutes: durationMinutes,
         water_used_liters: waterUsedLiters,
         triggered_by: triggeredBy,
       };

       // Offline path: queue and return optimistically
       if (!navigator.onLine) {
         queueOfflineWrite({ table: "irrigation_logs", action: "insert", data: payload });
         toast.info("Saved offline — will sync when online");
         return;
       }

       const { error: insertError } = await supabase
         .from("irrigation_logs")
         .insert(payload);

       if (insertError) throw insertError;
       fetchLogs();
     } catch (err) {
       console.error("Error logging irrigation:", err);
       // Network failure fallback → queue for later sync
       queueOfflineWrite({
         table: "irrigation_logs",
         action: "insert",
         data: {
           farm_id: farmId,
           action,
           duration_minutes: durationMinutes,
           water_used_liters: waterUsedLiters,
           triggered_by: triggeredBy,
         },
       });
       toast.warning("Network issue — saved offline, will sync later");
     }
   }, [farmId, fetchLogs]);
 
   useEffect(() => {
     fetchLogs();
   }, [fetchLogs]);
 
   return {
     logs,
     efficiencyData,
     isLoading,
     error,
     logIrrigation,
     refetch: fetchLogs,
   };
 }