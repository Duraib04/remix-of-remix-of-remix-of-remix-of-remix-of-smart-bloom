// Hook to fetch LIVE ESP32 sensor data from the `smart_bloom_data` table in Supabase
// This table is populated directly by the ESP32 hardware (no farm_id required)

import { useState, useEffect, useCallback } from "react";
import { sensorSupabase } from "@/integrations/supabase/client";

export interface SmartBloomReading {
  id: number;
  temperature: number | null;
  humidity: number | null;
  soil: number | null;        // soil moisture (0–1023 raw from ESP32, mapped to 0–100%)
  raining: boolean | null;
  pump: boolean | null;
  created_at: string;
}

export interface LiveAggregatedData {
  soilMoisture: number;       // 0–100 %
  temperature: number;        // °C
  humidity: number;           // %
  raining: boolean;
  pumpStatus: boolean;
  lastUpdate: string | null;
}

export interface LiveChartPoint {
  time: string;
  moisture: number;
  optimal: number;
}

// Map raw ESP32 analog soil value (0–1023) to percentage (0–100)
// ESP32 capacitive sensor: lower value = wetter soil
function mapSoilToPercent(raw: number | null): number {
  if (raw === null || raw === undefined) return 0;
  // If data is already 0-100, return as-is
  if (raw <= 100) return Math.max(0, Math.min(100, raw));
  // Map 1023 (dry) → 0%, 0 (wet) → 100%
  const percent = ((1023 - raw) / 1023) * 100;
  return Math.round(Math.max(0, Math.min(100, percent)));
}

export function useLiveSensorData() {
  const [latestReading, setLatestReading] = useState<SmartBloomReading | null>(null);
  const [readings, setReadings] = useState<SmartBloomReading[]>([]);
  const [aggregatedData, setAggregatedData] = useState<LiveAggregatedData>({
    soilMoisture: 0,
    temperature: 0,
    humidity: 0,
    raining: false,
    pumpStatus: false,
    lastUpdate: null,
  });
  const [chartData, setChartData] = useState<LiveChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Map a raw reading to aggregated dashboard data
  const mapToAggregated = useCallback((reading: SmartBloomReading): LiveAggregatedData => ({
    soilMoisture: mapSoilToPercent(reading.soil),
    temperature: reading.temperature ?? 0,
    humidity: reading.humidity ?? 0,
    raining: reading.raining ?? false,
    pumpStatus: reading.pump ?? false,
    lastUpdate: reading.created_at,
  }), []);

  // Build chart data from an array of readings (oldest → newest)
  const buildChartData = useCallback((data: SmartBloomReading[]): LiveChartPoint[] => {
    return [...data].reverse().map((r) => {
      const date = new Date(r.created_at);
      return {
        time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        moisture: mapSoilToPercent(r.soil),
        optimal: 70,
      };
    });
  }, []);

  // Fetch latest readings from smart_bloom_data
  // Note: This table is created by ESP32 and may not exist in the Supabase types
  const fetchReadings = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await sensorSupabase
        .from("smart_bloom_data")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        // Table might not exist - this is expected if ESP32 hasn't created it
        console.log("smart_bloom_data table not available:", fetchError.message);
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setReadings(data as SmartBloomReading[]);
        setLatestReading(data[0] as SmartBloomReading);
        setAggregatedData(mapToAggregated(data[0] as SmartBloomReading));
        setChartData(buildChartData((data as SmartBloomReading[]).slice(0, 24)));
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error("Error fetching smart_bloom_data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch live sensor data");
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [mapToAggregated, buildChartData]);

  // Subscribe to realtime inserts & poll on interval
  useEffect(() => {
    fetchReadings();

    // Realtime subscription for new rows
    const channel = sensorSupabase
      .channel("smart_bloom_live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "smart_bloom_data",
        },
        (payload) => {
          console.log("📡 Live ESP32 data:", payload.new);
          const newReading = payload.new as SmartBloomReading;
          setLatestReading(newReading);
          setAggregatedData(mapToAggregated(newReading));
          setReadings((prev) => {
            const updated = [newReading, ...prev.slice(0, 49)];
            setChartData(buildChartData(updated.slice(0, 24)));
            return updated;
          });
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        console.log("Supabase realtime status:", status);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        }
      });

    // Also poll every 30s as a fallback
    const pollInterval = setInterval(fetchReadings, 30_000);

    return () => {
      sensorSupabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchReadings, mapToAggregated, buildChartData]);

  // Toggle pump status (write back to the latest row or insert a command)
  const togglePump = useCallback(async (on: boolean) => {
    try {
      // Insert a new command row — ESP32 can poll the latest `pump` value
      const { error: insertError } = await sensorSupabase
        .from("smart_bloom_data")
        .insert({
          temperature: latestReading?.temperature ?? 0,
          humidity: latestReading?.humidity ?? 0,
          soil: latestReading?.soil ?? 0,
          raining: latestReading?.raining ?? false,
          pump: on,
        });

      if (insertError) throw insertError;
      setAggregatedData((prev) => ({ ...prev, pumpStatus: on }));
    } catch (err) {
      console.error("Error toggling pump:", err);
    }
  }, [latestReading]);

  return {
    latestReading,
    readings,
    aggregatedData,
    chartData,
    isLoading,
    error,
    isConnected,
    refetch: fetchReadings,
    togglePump,
  };
}
