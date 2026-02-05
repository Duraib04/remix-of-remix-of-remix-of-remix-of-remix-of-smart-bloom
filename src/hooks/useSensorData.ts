 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface SensorReading {
   id: string;
   farm_id: string | null;
   soil_moisture: number | null;
   temperature: number | null;
   humidity: number | null;
   ph_level: number | null;
   nitrogen: number | null;
   phosphorus: number | null;
   potassium: number | null;
   water_level: number | null;
   pump_status: boolean | null;
   created_at: string;
 }
 
 interface AggregatedData {
   soilMoisture: number;
   temperature: number;
   humidity: number;
   phLevel: number;
   nitrogen: number;
   phosphorus: number;
   potassium: number;
   waterLevel: number;
   pumpStatus: boolean;
   lastUpdate: string | null;
 }
 
 interface MoistureChartData {
   time: string;
   moisture: number;
   optimal: number;
 }
 
 export function useSensorData(farmId: string | null) {
   const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
   const [readings, setReadings] = useState<SensorReading[]>([]);
   const [aggregatedData, setAggregatedData] = useState<AggregatedData>({
     soilMoisture: 0,
     temperature: 0,
     humidity: 0,
     phLevel: 0,
     nitrogen: 0,
     phosphorus: 0,
     potassium: 0,
     waterLevel: 0,
     pumpStatus: false,
     lastUpdate: null,
   });
   const [chartData, setChartData] = useState<MoistureChartData[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Fetch latest readings
   const fetchReadings = useCallback(async () => {
     if (!farmId) {
       setIsLoading(false);
       return;
     }
 
     try {
       // Fetch last 24 readings for chart
       const { data, error: fetchError } = await supabase
         .from("sensor_readings")
         .select("*")
         .eq("farm_id", farmId)
         .order("created_at", { ascending: false })
         .limit(24);
 
       if (fetchError) throw fetchError;
 
       if (data && data.length > 0) {
         setReadings(data);
         setLatestReading(data[0]);
         
         // Aggregate latest reading
         const latest = data[0];
         setAggregatedData({
           soilMoisture: latest.soil_moisture ?? 0,
           temperature: latest.temperature ?? 0,
           humidity: latest.humidity ?? 0,
           phLevel: latest.ph_level ?? 0,
           nitrogen: latest.nitrogen ?? 0,
           phosphorus: latest.phosphorus ?? 0,
           potassium: latest.potassium ?? 0,
           waterLevel: latest.water_level ?? 0,
           pumpStatus: latest.pump_status ?? false,
           lastUpdate: latest.created_at,
         });
 
         // Build chart data (reverse to show oldest first)
         const chartPoints = data.reverse().map((reading, index) => {
           const date = new Date(reading.created_at);
           return {
             time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
             moisture: reading.soil_moisture ?? 0,
             optimal: 70,
           };
         });
         setChartData(chartPoints);
       }
     } catch (err) {
       console.error("Error fetching sensor readings:", err);
       setError(err instanceof Error ? err.message : "Failed to fetch readings");
     } finally {
       setIsLoading(false);
     }
   }, [farmId]);
 
   // Subscribe to realtime updates
   useEffect(() => {
     if (!farmId) return;
 
     fetchReadings();
 
     const channel = supabase
       .channel(`sensor_readings_${farmId}`)
       .on(
         "postgres_changes",
         {
           event: "INSERT",
           schema: "public",
           table: "sensor_readings",
           filter: `farm_id=eq.${farmId}`,
         },
         (payload) => {
           console.log("New sensor reading:", payload.new);
           const newReading = payload.new as SensorReading;
           setLatestReading(newReading);
           setReadings(prev => [newReading, ...prev.slice(0, 23)]);
           
           setAggregatedData({
             soilMoisture: newReading.soil_moisture ?? 0,
             temperature: newReading.temperature ?? 0,
             humidity: newReading.humidity ?? 0,
             phLevel: newReading.ph_level ?? 0,
             nitrogen: newReading.nitrogen ?? 0,
             phosphorus: newReading.phosphorus ?? 0,
             potassium: newReading.potassium ?? 0,
             waterLevel: newReading.water_level ?? 0,
             pumpStatus: newReading.pump_status ?? false,
             lastUpdate: newReading.created_at,
           });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [farmId, fetchReadings]);
 
   return {
     latestReading,
     readings,
     aggregatedData,
     chartData,
     isLoading,
     error,
     refetch: fetchReadings,
   };
 }