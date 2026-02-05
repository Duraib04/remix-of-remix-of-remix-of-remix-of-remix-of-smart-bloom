import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, IndianRupee, Clock, Sprout, BarChart3, Leaf, AlertTriangle } from 'lucide-react';

interface CropData {
  name: string;
  nameKey: string;
  costPerAcre: {
    seed: number;
    fertiliser: number;
    labour: number;
    water: number;
    pest: number;
  };
  yieldPerAcre: number; // quintals
  marketPricePerQuintal: number;
  daysToMaturity: number;
  bestSeason: string;
}

const CROPS: CropData[] = [
  {
    name: 'Rice (Paddy)',
    nameKey: 'rice',
    costPerAcre: { seed: 1200, fertiliser: 3500, labour: 8000, water: 4000, pest: 2000 },
    yieldPerAcre: 25,
    marketPricePerQuintal: 2183,
    daysToMaturity: 120,
    bestSeason: 'June - July (Kharif)',
  },
  {
    name: 'Wheat',
    nameKey: 'wheat',
    costPerAcre: { seed: 1500, fertiliser: 3000, labour: 6000, water: 3500, pest: 1500 },
    yieldPerAcre: 20,
    marketPricePerQuintal: 2275,
    daysToMaturity: 150,
    bestSeason: 'November - December (Rabi)',
  },
  {
    name: 'Cotton',
    nameKey: 'cotton',
    costPerAcre: { seed: 2000, fertiliser: 4000, labour: 10000, water: 5000, pest: 4000 },
    yieldPerAcre: 8,
    marketPricePerQuintal: 6620,
    daysToMaturity: 180,
    bestSeason: 'April - May',
  },
  {
    name: 'Sugarcane',
    nameKey: 'sugarcane',
    costPerAcre: { seed: 5000, fertiliser: 5000, labour: 12000, water: 8000, pest: 3000 },
    yieldPerAcre: 350,
    marketPricePerQuintal: 315,
    daysToMaturity: 360,
    bestSeason: 'January - March',
  },
  {
    name: 'Tomato',
    nameKey: 'tomato',
    costPerAcre: { seed: 3000, fertiliser: 4500, labour: 15000, water: 5000, pest: 5000 },
    yieldPerAcre: 100,
    marketPricePerQuintal: 1500,
    daysToMaturity: 75,
    bestSeason: 'Year-round',
  },
  {
    name: 'Onion',
    nameKey: 'onion',
    costPerAcre: { seed: 4000, fertiliser: 3500, labour: 12000, water: 4000, pest: 2500 },
    yieldPerAcre: 80,
    marketPricePerQuintal: 1800,
    daysToMaturity: 120,
    bestSeason: 'October - December',
  },
];

interface AnalysisResult {
  crop: CropData;
  acres: number;
  totalCostPerAcre: number;
  totalInvestment: number;
  totalYield: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  roi: number;
  monthsToHarvest: number;
  isViable: boolean;
}

export function CropEconomicsAnalyzer() {
  const { t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [landSize, setLandSize] = useState<string>('1');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeEconomics = () => {
    setError(null);
    const acres = parseFloat(landSize);
    if (!selectedCrop || isNaN(acres) || acres <= 0) {
      setError(t.invalidInput);
      return;
    }

    const crop = CROPS.find(c => c.nameKey === selectedCrop);
    if (!crop) {
      setError(t.failedAnalysis);
      return;
    }

    const totalCostPerAcre = Object.values(crop.costPerAcre).reduce((a, b) => a + b, 0);
    const totalInvestment = totalCostPerAcre * acres;
    const totalYield = crop.yieldPerAcre * acres;
    const revenue = totalYield * crop.marketPricePerQuintal;
    const profit = revenue - totalInvestment;
    const profitMargin = (profit / revenue) * 100;
    const roi = (profit / totalInvestment) * 100;
    const monthsToHarvest = Math.round((crop.daysToMaturity / 30) * 10) / 10;

    setResult({
      crop,
      acres,
      totalCostPerAcre,
      totalInvestment,
      totalYield,
      revenue,
      profit,
      profitMargin,
      roi,
      monthsToHarvest,
      isViable: profit > 0 && roi > 15,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <BarChart3 className="h-5 w-5" />
          {t.cropEconomics}
        </CardTitle>
        <CardDescription>{t.costBreakdownDetails}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger>
              <SelectValue placeholder={t.selectCrop} />
            </SelectTrigger>
            <SelectContent>
              {CROPS.map(crop => (
                <SelectItem key={crop.nameKey} value={crop.nameKey}>
                  {crop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            min="0.1"
            step="0.5"
            value={landSize}
            onChange={e => setLandSize(e.target.value)}
            placeholder={t.landSize}
          />

          <Button onClick={analyzeEconomics} className="bg-green-600 hover:bg-green-700 text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t.analyzeEconomics}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="text-xs text-muted-foreground">{t.totalInvestment}</div>
                <div className="text-lg font-bold text-red-600">{formatCurrency(result.totalInvestment)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="text-xs text-muted-foreground">{t.projectedEarnings}</div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(result.revenue)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="text-xs text-muted-foreground">{t.profitMargin}</div>
                <div className={`text-lg font-bold ${result.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.profitMargin.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="text-xs text-muted-foreground">{t.roi}</div>
                <div className={`text-lg font-bold ${result.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.roi.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Viability Badge */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t.investmentViability}:</span>
              <Badge variant={result.isViable ? 'default' : 'destructive'} className={result.isViable ? 'bg-green-600' : ''}>
                {result.isViable ? t.viableCrop : t.notViable}
              </Badge>
            </div>

            {/* Timeline & Market */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  {t.timelineToHarvest}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.daysToMaturity}</span>
                    <span className="font-medium">{result.crop.daysToMaturity} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.seedToHarvest}</span>
                    <span className="font-medium">{result.monthsToHarvest} {t.months}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.bestPlantingTime}</span>
                    <span className="font-medium">{result.crop.bestSeason}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <IndianRupee className="h-4 w-4 text-blue-500" />
                  {t.marketOutlook}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.currentPrice}</span>
                    <span className="font-medium">{formatCurrency(result.crop.marketPricePerQuintal)}{t.perUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.expectedYield}</span>
                    <span className="font-medium">{result.totalYield} {t.quintals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.revenuePerAcre}</span>
                    <span className="font-medium">{formatCurrency(result.revenue / result.acres)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Leaf className="h-4 w-4 text-green-500" />
                {t.costBreakdown}
              </h4>
              <div className="space-y-2">
                {[
                  { label: t.seedCost, value: result.crop.costPerAcre.seed },
                  { label: t.fertiliserCost, value: result.crop.costPerAcre.fertiliser },
                  { label: t.labourCost, value: result.crop.costPerAcre.labour },
                  { label: t.waterManagement, value: result.crop.costPerAcre.water },
                  { label: t.pestControl, value: result.crop.costPerAcre.pest },
                ].map((item, idx) => {
                  const percentage = (item.value / result.totalCostPerAcre) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{formatCurrency(item.value * result.acres)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-green-200 dark:border-green-800">
                  <span>{t.totalCost}</span>
                  <span className="text-red-600">{formatCurrency(result.totalInvestment)}</span>
                </div>
              </div>
            </div>

            {/* Final Summary */}
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 border border-green-300 dark:border-green-700">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sprout className="h-4 w-4 text-green-600" />
                {t.economicsSummary}
              </h4>
              <div className="text-sm space-y-1 text-green-800 dark:text-green-200">
                <p>• {t.willNeed}: {formatCurrency(result.totalInvestment)}</p>
                <p>• {t.expectedIncome}: {formatCurrency(result.revenue)}</p>
                <p className={result.profit > 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                  • {t.profitAfterCosts}: {formatCurrency(result.profit)}
                </p>
                <p>• {t.timeTillHarvest}: {result.monthsToHarvest} {t.months}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
