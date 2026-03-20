import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MandiInfo {
  name: string;
  state: string;
  price: number;
}

export interface CropPrice {
  crop: string;
  currentPrice: number;
  msp: number;
  weekAgoPrice: number;
  monthAgoPrice: number;
  trend: 'up' | 'down' | 'stable';
  priceRange: { min: number; max: number };
  topMandis: MandiInfo[];
  forecast: string;
  lastUpdated: string;
}

export interface MarketData {
  prices: CropPrice[];
  marketSummary: string;
}

const CACHE_KEY = 'farmwise_market_prices';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function useMarketPrices() {
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async (crops?: string[], language?: string) => {
    setIsLoading(true);
    setError(null);

    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setData(cachedData);
          setIsLoading(false);
          return cachedData;
        }
      }
    } catch {}

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('market-prices', {
        body: { crops, language }
      });

      if (fnError) throw fnError;
      if (result.error) throw new Error(result.error);

      setData(result);

      // Cache the result
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch {}

      return result as MarketData;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch prices";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchPrices };
}
