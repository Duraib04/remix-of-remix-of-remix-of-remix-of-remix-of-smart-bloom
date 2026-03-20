import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, IndianRupee, Calendar, BarChart3, AlertTriangle, CheckCircle, Clock, RefreshCw, Wifi, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useMarketPrices, type CropPrice } from '@/hooks/useMarketPrices';
interface MonthlyPrice {
  month: string;
  price: number;
  year: number;
}

interface CropMarketData {
  nameKey: string;
  name: string;
  unit: string;
  currentMSP: number;
  historicalPrices: MonthlyPrice[];
  seasonalPattern: { month: string; avgPrice: number; demand: 'low' | 'medium' | 'high' }[];
  storageCostPerMonth: number; // ₹ per quintal per month
  spoilageRatePerMonth: number; // % loss per month
}

const MARKET_DATA: CropMarketData[] = [
  {
    nameKey: 'rice',
    name: 'Rice (Paddy)',
    unit: 'quintal',
    currentMSP: 2300,
    storageCostPerMonth: 25,
    spoilageRatePerMonth: 0.5,
    historicalPrices: [
      { month: 'Jan 2025', price: 2350, year: 2025 }, { month: 'Feb 2025', price: 2400, year: 2025 },
      { month: 'Mar 2025', price: 2500, year: 2025 }, { month: 'Apr 2025', price: 2550, year: 2025 },
      { month: 'May 2025', price: 2650, year: 2025 }, { month: 'Jun 2025', price: 2600, year: 2025 },
      { month: 'Jul 2025', price: 2450, year: 2025 }, { month: 'Aug 2025', price: 2300, year: 2025 },
      { month: 'Sep 2025', price: 2200, year: 2025 }, { month: 'Oct 2025', price: 2150, year: 2025 },
      { month: 'Nov 2025', price: 2250, year: 2025 }, { month: 'Dec 2025', price: 2380, year: 2025 },
      { month: 'Jan 2026', price: 2420, year: 2026 }, { month: 'Feb 2026', price: 2480, year: 2026 },
    ],
    seasonalPattern: [
      { month: 'Jan', avgPrice: 2380, demand: 'medium' }, { month: 'Feb', avgPrice: 2440, demand: 'medium' },
      { month: 'Mar', avgPrice: 2520, demand: 'high' }, { month: 'Apr', avgPrice: 2560, demand: 'high' },
      { month: 'May', avgPrice: 2640, demand: 'high' }, { month: 'Jun', avgPrice: 2580, demand: 'medium' },
      { month: 'Jul', avgPrice: 2430, demand: 'medium' }, { month: 'Aug', avgPrice: 2280, demand: 'low' },
      { month: 'Sep', avgPrice: 2180, demand: 'low' }, { month: 'Oct', avgPrice: 2140, demand: 'low' },
      { month: 'Nov', avgPrice: 2240, demand: 'medium' }, { month: 'Dec', avgPrice: 2370, demand: 'medium' },
    ],
  },
  {
    nameKey: 'wheat',
    name: 'Wheat',
    unit: 'quintal',
    currentMSP: 2275,
    storageCostPerMonth: 20,
    spoilageRatePerMonth: 0.3,
    historicalPrices: [
      { month: 'Jan 2025', price: 2300, year: 2025 }, { month: 'Feb 2025', price: 2250, year: 2025 },
      { month: 'Mar 2025', price: 2200, year: 2025 }, { month: 'Apr 2025', price: 2150, year: 2025 },
      { month: 'May 2025', price: 2350, year: 2025 }, { month: 'Jun 2025', price: 2500, year: 2025 },
      { month: 'Jul 2025', price: 2600, year: 2025 }, { month: 'Aug 2025', price: 2650, year: 2025 },
      { month: 'Sep 2025', price: 2700, year: 2025 }, { month: 'Oct 2025', price: 2600, year: 2025 },
      { month: 'Nov 2025', price: 2450, year: 2025 }, { month: 'Dec 2025', price: 2350, year: 2025 },
      { month: 'Jan 2026', price: 2320, year: 2026 }, { month: 'Feb 2026', price: 2280, year: 2026 },
    ],
    seasonalPattern: [
      { month: 'Jan', avgPrice: 2310, demand: 'medium' }, { month: 'Feb', avgPrice: 2260, demand: 'low' },
      { month: 'Mar', avgPrice: 2210, demand: 'low' }, { month: 'Apr', avgPrice: 2160, demand: 'low' },
      { month: 'May', avgPrice: 2360, demand: 'medium' }, { month: 'Jun', avgPrice: 2510, demand: 'high' },
      { month: 'Jul', avgPrice: 2610, demand: 'high' }, { month: 'Aug', avgPrice: 2660, demand: 'high' },
      { month: 'Sep', avgPrice: 2710, demand: 'high' }, { month: 'Oct', avgPrice: 2610, demand: 'medium' },
      { month: 'Nov', avgPrice: 2460, demand: 'medium' }, { month: 'Dec', avgPrice: 2360, demand: 'medium' },
    ],
  },
  {
    nameKey: 'cotton',
    name: 'Cotton',
    unit: 'quintal',
    currentMSP: 6620,
    storageCostPerMonth: 40,
    spoilageRatePerMonth: 0.2,
    historicalPrices: [
      { month: 'Jan 2025', price: 6800, year: 2025 }, { month: 'Feb 2025', price: 7000, year: 2025 },
      { month: 'Mar 2025', price: 7200, year: 2025 }, { month: 'Apr 2025', price: 7400, year: 2025 },
      { month: 'May 2025', price: 7100, year: 2025 }, { month: 'Jun 2025', price: 6900, year: 2025 },
      { month: 'Jul 2025', price: 6700, year: 2025 }, { month: 'Aug 2025', price: 6500, year: 2025 },
      { month: 'Sep 2025', price: 6400, year: 2025 }, { month: 'Oct 2025', price: 6300, year: 2025 },
      { month: 'Nov 2025', price: 6600, year: 2025 }, { month: 'Dec 2025', price: 6750, year: 2025 },
      { month: 'Jan 2026', price: 6850, year: 2026 }, { month: 'Feb 2026', price: 7050, year: 2026 },
    ],
    seasonalPattern: [
      { month: 'Jan', avgPrice: 6820, demand: 'medium' }, { month: 'Feb', avgPrice: 7020, demand: 'high' },
      { month: 'Mar', avgPrice: 7220, demand: 'high' }, { month: 'Apr', avgPrice: 7420, demand: 'high' },
      { month: 'May', avgPrice: 7120, demand: 'medium' }, { month: 'Jun', avgPrice: 6920, demand: 'medium' },
      { month: 'Jul', avgPrice: 6720, demand: 'low' }, { month: 'Aug', avgPrice: 6520, demand: 'low' },
      { month: 'Sep', avgPrice: 6420, demand: 'low' }, { month: 'Oct', avgPrice: 6320, demand: 'low' },
      { month: 'Nov', avgPrice: 6620, demand: 'medium' }, { month: 'Dec', avgPrice: 6770, demand: 'medium' },
    ],
  },
  {
    nameKey: 'tomato',
    name: 'Tomato',
    unit: 'quintal',
    currentMSP: 0,
    storageCostPerMonth: 80,
    spoilageRatePerMonth: 8,
    historicalPrices: [
      { month: 'Jan 2025', price: 1200, year: 2025 }, { month: 'Feb 2025', price: 1000, year: 2025 },
      { month: 'Mar 2025', price: 800, year: 2025 }, { month: 'Apr 2025', price: 1500, year: 2025 },
      { month: 'May 2025', price: 2500, year: 2025 }, { month: 'Jun 2025', price: 3500, year: 2025 },
      { month: 'Jul 2025', price: 4000, year: 2025 }, { month: 'Aug 2025', price: 2800, year: 2025 },
      { month: 'Sep 2025', price: 1800, year: 2025 }, { month: 'Oct 2025', price: 1200, year: 2025 },
      { month: 'Nov 2025', price: 900, year: 2025 }, { month: 'Dec 2025', price: 1100, year: 2025 },
      { month: 'Jan 2026', price: 1250, year: 2026 }, { month: 'Feb 2026', price: 1050, year: 2026 },
    ],
    seasonalPattern: [
      { month: 'Jan', avgPrice: 1220, demand: 'medium' }, { month: 'Feb', avgPrice: 1020, demand: 'low' },
      { month: 'Mar', avgPrice: 820, demand: 'low' }, { month: 'Apr', avgPrice: 1520, demand: 'medium' },
      { month: 'May', avgPrice: 2520, demand: 'high' }, { month: 'Jun', avgPrice: 3520, demand: 'high' },
      { month: 'Jul', avgPrice: 4020, demand: 'high' }, { month: 'Aug', avgPrice: 2820, demand: 'high' },
      { month: 'Sep', avgPrice: 1820, demand: 'medium' }, { month: 'Oct', avgPrice: 1220, demand: 'low' },
      { month: 'Nov', avgPrice: 920, demand: 'low' }, { month: 'Dec', avgPrice: 1120, demand: 'medium' },
    ],
  },
  {
    nameKey: 'onion',
    name: 'Onion',
    unit: 'quintal',
    currentMSP: 0,
    storageCostPerMonth: 50,
    spoilageRatePerMonth: 5,
    historicalPrices: [
      { month: 'Jan 2025', price: 1500, year: 2025 }, { month: 'Feb 2025', price: 1800, year: 2025 },
      { month: 'Mar 2025', price: 2200, year: 2025 }, { month: 'Apr 2025', price: 2800, year: 2025 },
      { month: 'May 2025', price: 3200, year: 2025 }, { month: 'Jun 2025', price: 3500, year: 2025 },
      { month: 'Jul 2025', price: 3000, year: 2025 }, { month: 'Aug 2025', price: 2500, year: 2025 },
      { month: 'Sep 2025', price: 2000, year: 2025 }, { month: 'Oct 2025', price: 1600, year: 2025 },
      { month: 'Nov 2025', price: 1400, year: 2025 }, { month: 'Dec 2025', price: 1450, year: 2025 },
      { month: 'Jan 2026', price: 1550, year: 2026 }, { month: 'Feb 2026', price: 1850, year: 2026 },
    ],
    seasonalPattern: [
      { month: 'Jan', avgPrice: 1520, demand: 'low' }, { month: 'Feb', avgPrice: 1820, demand: 'medium' },
      { month: 'Mar', avgPrice: 2220, demand: 'medium' }, { month: 'Apr', avgPrice: 2820, demand: 'high' },
      { month: 'May', avgPrice: 3220, demand: 'high' }, { month: 'Jun', avgPrice: 3520, demand: 'high' },
      { month: 'Jul', avgPrice: 3020, demand: 'high' }, { month: 'Aug', avgPrice: 2520, demand: 'medium' },
      { month: 'Sep', avgPrice: 2020, demand: 'medium' }, { month: 'Oct', avgPrice: 1620, demand: 'low' },
      { month: 'Nov', avgPrice: 1420, demand: 'low' }, { month: 'Dec', avgPrice: 1470, demand: 'low' },
    ],
  },
];

interface PredictionResult {
  crop: CropMarketData;
  currentPrice: number;
  bestMonth: { month: string; price: number; demand: string };
  worstMonth: { month: string; price: number };
  sellNowRevenue: number;
  sellBestRevenue: number;
  storageCost: number;
  spoilageLoss: number;
  netGainFromWaiting: number;
  recommendation: 'sell_now' | 'hold' | 'wait_peak';
  priceChange12m: number;
  monthsToWait: number;
  quintals: number;
}

export function HarvestProfitPredictor() {
  const { t, language } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [quintals, setQuintals] = useState<string>('10');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const { data: liveMarketData, isLoading: pricesLoading, error: pricesError, fetchPrices } = useMarketPrices();

  // Fetch live prices on mount
  useEffect(() => {
    fetchPrices(['rice', 'wheat', 'cotton', 'tomato', 'onion'], language);
  }, []);

  const currentMonthIndex = new Date().getMonth(); // 0-based
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const analyze = () => {
    const crop = MARKET_DATA.find(c => c.nameKey === selectedCrop);
    const qty = parseFloat(quintals);
    if (!crop || isNaN(qty) || qty <= 0) return;

    // Use live price if available, otherwise fallback to historical
    const livePrice = liveMarketData?.prices?.find(p => p.crop.toLowerCase() === selectedCrop);
    const currentPrice = livePrice?.currentPrice || crop.historicalPrices[crop.historicalPrices.length - 1].price;
    const prices12mAgo = crop.historicalPrices[0].price;
    const priceChange12m = ((currentPrice - prices12mAgo) / prices12mAgo) * 100;

    // Find best month to sell (from seasonal pattern, looking forward)
    const futureMonths = [];
    for (let i = 0; i < 6; i++) {
      const idx = (currentMonthIndex + i) % 12;
      futureMonths.push({ ...crop.seasonalPattern[idx], monthsAway: i });
    }

    const bestFuture = futureMonths.reduce((a, b) => a.avgPrice > b.avgPrice ? a : b);
    const worstFuture = futureMonths.reduce((a, b) => a.avgPrice < b.avgPrice ? a : b);

    const monthsToWait = bestFuture.monthsAway;
    const storageCost = crop.storageCostPerMonth * qty * monthsToWait;
    const spoilagePercent = crop.spoilageRatePerMonth * monthsToWait;
    const effectiveQty = qty * (1 - spoilagePercent / 100);
    const spoilageLoss = (qty - effectiveQty) * bestFuture.avgPrice;

    const sellNowRevenue = currentPrice * qty;
    const sellBestRevenue = bestFuture.avgPrice * effectiveQty - storageCost;
    const netGainFromWaiting = sellBestRevenue - sellNowRevenue;

    let recommendation: 'sell_now' | 'hold' | 'wait_peak' = 'hold';
    if (netGainFromWaiting <= 0 || monthsToWait === 0) {
      recommendation = 'sell_now';
    } else if (netGainFromWaiting > sellNowRevenue * 0.1) {
      recommendation = 'wait_peak';
    } else {
      recommendation = 'hold';
    }

    setPrediction({
      crop,
      currentPrice,
      bestMonth: { month: bestFuture.month, price: bestFuture.avgPrice, demand: bestFuture.demand },
      worstMonth: { month: worstFuture.month, price: worstFuture.avgPrice },
      sellNowRevenue,
      sellBestRevenue,
      storageCost,
      spoilageLoss,
      netGainFromWaiting,
      recommendation,
      priceChange12m,
      monthsToWait,
      quintals: qty,
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const chartData = useMemo(() => {
    if (!prediction) return [];
    return prediction.crop.historicalPrices.map(p => ({
      month: p.month.replace(' 2025', "'25").replace(' 2026', "'26"),
      price: p.price,
      msp: prediction.crop.currentMSP || undefined,
    }));
  }, [prediction]);

  const seasonalData = useMemo(() => {
    if (!prediction) return [];
    return prediction.crop.seasonalPattern.map((s, i) => ({
      month: s.month,
      avgPrice: s.avgPrice,
      demand: s.demand,
      isCurrent: i === currentMonthIndex,
      isBest: s.month === prediction.bestMonth.month,
    }));
  }, [prediction, currentMonthIndex]);

  const demandColor = (d: string) => {
    if (d === 'high') return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (d === 'medium') return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const recommendationConfig = {
    sell_now: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700' },
    hold: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700' },
    wait_peak: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700' },
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <BarChart3 className="h-5 w-5" />
          {t.harvestPredictor}
        </CardTitle>
        <CardDescription>{t.harvestPredictorDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger>
              <SelectValue placeholder={t.selectCrop} />
            </SelectTrigger>
            <SelectContent>
              {MARKET_DATA.map(c => (
                <SelectItem key={c.nameKey} value={c.nameKey}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={quintals}
              onChange={e => setQuintals(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t.quintals}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">{t.quintals}</span>
          </div>

          <Button onClick={analyze} className="bg-amber-600 hover:bg-amber-700 text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t.predictProfit}
          </Button>
        </div>

        {/* Live Market Prices Section */}
        {pricesLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          </div>
        )}

        {liveMarketData && !pricesLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-green-500" />
                {t.livePrices}
              </h4>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => fetchPrices(undefined, language)}>
                <RefreshCw className="h-3 w-3" />
                {t.refreshPrices}
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {liveMarketData.prices.map((p) => {
                const weekDelta = ((p.currentPrice - p.weekAgoPrice) / p.weekAgoPrice * 100);
                return (
                  <div
                    key={p.crop}
                    className={`rounded-lg p-2.5 border text-center cursor-pointer transition-all hover:shadow-md ${
                      selectedCrop === p.crop ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                    onClick={() => setSelectedCrop(p.crop)}
                  >
                    <div className="text-xs font-medium capitalize">{p.crop}</div>
                    <div className="text-sm font-bold mt-0.5">₹{p.currentPrice.toLocaleString('en-IN')}</div>
                    <div className={`text-[10px] flex items-center justify-center gap-0.5 ${weekDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {weekDelta >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {weekDelta >= 0 ? '+' : ''}{weekDelta.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
            {liveMarketData.marketSummary && (
              <p className="text-xs text-muted-foreground italic">{liveMarketData.marketSummary}</p>
            )}
          </div>
        )}

        {pricesError && (
          <p className="text-xs text-destructive">{pricesError}</p>
        )}

        {prediction && (
          <div className="space-y-4 animate-fade-in">
            {/* Live Mandi Data for Selected Crop */}
            {liveMarketData && (() => {
              const livePrice = liveMarketData.prices.find(p => p.crop.toLowerCase() === prediction.crop.nameKey);
              if (!livePrice) return null;
              return (
                <div className="bg-card rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-semibold">{t.topMandis}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{livePrice.forecast}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {livePrice.topMandis?.map((m, i) => (
                      <div key={i} className="flex-shrink-0 text-center px-3 py-1.5 rounded bg-muted text-xs">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-muted-foreground">{m.state}</div>
                        <div className="font-bold">₹{m.price.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Recommendation Banner */}
            {(() => {
              const config = recommendationConfig[prediction.recommendation];
              const RecIcon = config.icon;
              return (
                <div className={`rounded-lg p-4 border ${config.bg}`}>
                  <div className="flex items-start gap-3">
                    <RecIcon className={`h-6 w-6 mt-0.5 ${config.color}`} />
                    <div>
                      <h4 className={`font-bold text-lg ${config.color}`}>
                        {prediction.recommendation === 'sell_now' && t.sellNowRec}
                        {prediction.recommendation === 'hold' && t.holdRec}
                        {prediction.recommendation === 'wait_peak' && t.waitPeakRec}
                      </h4>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {prediction.recommendation === 'sell_now' && t.sellNowReason}
                        {prediction.recommendation === 'hold' && `${t.holdReason} ${prediction.bestMonth.month}`}
                        {prediction.recommendation === 'wait_peak' && `${t.waitPeakReason} ${prediction.bestMonth.month}. ${t.extraProfit}: ${formatCurrency(prediction.netGainFromWaiting)}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-muted-foreground">{t.currentMarketPrice}</div>
                <div className="text-lg font-bold">{formatCurrency(prediction.currentPrice)}</div>
                <div className="text-xs text-muted-foreground">/{t.quintals}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-muted-foreground">{t.sellNowValue}</div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(prediction.sellNowRevenue)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-muted-foreground">{t.peakPrice}</div>
                <div className="text-lg font-bold text-blue-600">{formatCurrency(prediction.bestMonth.price)}</div>
                <div className="text-xs text-muted-foreground">{prediction.bestMonth.month}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-muted-foreground">{t.priceChange12m}</div>
                <div className={`text-lg font-bold flex items-center gap-1 ${prediction.priceChange12m >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {prediction.priceChange12m >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {prediction.priceChange12m.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Price Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-semibold mb-3">{t.priceTrend}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), t.marketPrice]} />
                  {chartData[0]?.msp && <ReferenceLine y={chartData[0].msp} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="MSP" />}
                  <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="url(#priceGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Seasonal Demand Calendar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-semibold mb-3">{t.seasonalDemand}</h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
                {seasonalData.map((s, i) => (
                  <div
                    key={i}
                    className={`text-center p-2 rounded-lg border text-xs transition-all ${
                      s.isBest ? 'ring-2 ring-green-500 border-green-400' :
                      s.isCurrent ? 'ring-2 ring-amber-500 border-amber-400' :
                      'border-border'
                    }`}
                  >
                    <div className="font-semibold">{s.month}</div>
                    <div className="text-[10px] mt-1">₹{(s.avgPrice / 1000).toFixed(1)}k</div>
                    <Badge variant="outline" className={`text-[9px] mt-1 px-1 py-0 ${demandColor(s.demand)}`}>
                      {s.demand === 'high' ? '🔥' : s.demand === 'medium' ? '📊' : '📉'}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-amber-500 inline-block" /> {t.currentMonth}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-green-500 inline-block" /> {t.bestSellMonth}</span>
              </div>
            </div>

            {/* Holding Cost Analysis */}
            {prediction.monthsToWait > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    {t.holdingCosts}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.storageCost}</span>
                      <span className="font-medium text-red-600">{formatCurrency(prediction.storageCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.spoilageLoss}</span>
                      <span className="font-medium text-red-600">{formatCurrency(prediction.spoilageLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.waitMonths}</span>
                      <span className="font-medium">{prediction.monthsToWait} {t.months}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <IndianRupee className="h-4 w-4 text-green-500" />
                    {t.profitComparison}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.sellNowValue}</span>
                      <span className="font-medium">{formatCurrency(prediction.sellNowRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.sellAtPeak}</span>
                      <span className="font-medium">{formatCurrency(prediction.sellBestRevenue)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-amber-200 dark:border-amber-800">
                      <span className="font-semibold">{t.netGain}</span>
                      <span className={`font-bold ${prediction.netGainFromWaiting > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {prediction.netGainFromWaiting > 0 ? '+' : ''}{formatCurrency(prediction.netGainFromWaiting)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for perishables */}
            {prediction.crop.spoilageRatePerMonth > 3 && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 dark:bg-amber-950/30 p-3 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {t.perishableWarning}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
