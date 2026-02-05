// ============================================================
// STEP 3: SMART IRRIGATION RISK SCORE (IRS)
// Weighted formula replacing basic threshold logic
// IRS = 0.4×SoilDryness + 0.2×TempStress + 0.2×HumidityStress
//       + 0.1×CropSensitivity + 0.1×WeatherFactor
// ============================================================

import type { ValidatedSensorData } from './sensorValidator';
import type { ContextAnalysis, WeatherContext } from './contextAnalyzer';
import { getCropSensitivity, getFieldCapacity } from './contextAnalyzer';

export interface IRSResult {
  score: number;                  // 0-100, the Irrigation Risk Score
  riskLevel: 'safe' | 'monitor' | 'caution' | 'critical';
  shouldIrrigate: boolean;
  confidence: number;             // 40-95%
  factors: IRSFactors;
  reasoning: string[];
  recommendedAction: string;
  recommendedDuration: number;    // minutes
  recommendedWaterVolume: number; // liters
  optimalTime: string;
  ledStatus: 'green' | 'yellow' | 'red' | 'red_blink';
  buzzerPattern: 'off' | 'short_beep' | 'medium_beep' | 'continuous' | 'beep_beep';
}

export interface IRSFactors {
  soilDryness: { value: number; weight: number; weighted: number };
  tempStress: { value: number; weight: number; weighted: number };
  humidityStress: { value: number; weight: number; weighted: number };
  cropSensitivity: { value: number; weight: number; weighted: number };
  weatherFactor: { value: number; weight: number; weighted: number };
}

// Default weights — can be adjusted by learning system
const DEFAULT_WEIGHTS = {
  soilDryness: 0.40,
  tempStress: 0.20,
  humidityStress: 0.20,
  cropSensitivity: 0.10,
  weatherFactor: 0.10,
};

/**
 * Calculate Soil Dryness factor (0-100)
 * 0 = fully saturated, 100 = completely dry
 */
function calculateSoilDryness(moisture: number, fieldCapacity: number): number {
  if (fieldCapacity <= 0) return 50;
  const ratio = moisture / fieldCapacity;
  // If above capacity, dryness = 0
  if (ratio >= 1) return 0;
  // If at 0%, dryness = 100
  if (ratio <= 0) return 100;
  // Scale: 0% of capacity = 100 dryness, 100% of capacity = 0 dryness
  return Math.round((1 - ratio) * 100);
}

/**
 * Calculate Temperature Stress factor (0-100)
 * Higher temperatures = higher stress = more irrigation needed
 */
function calculateTempStress(temperature: number): number {
  if (temperature <= 15) return 0;       // No stress under 15°C
  if (temperature <= 25) return 15;      // Minimal stress
  if (temperature <= 30) return 30;      // Moderate
  if (temperature <= 35) return 55;      // High
  if (temperature <= 40) return 80;      // Very high
  return 100;                             // Extreme stress above 40°C
}

/**
 * Calculate Humidity Stress factor (0-100)
 * Lower humidity = higher stress = more water loss via evaporation
 */
function calculateHumidityStress(humidity: number): number {
  if (humidity >= 80) return 5;     // Very humid, low stress
  if (humidity >= 60) return 20;    // Normal
  if (humidity >= 40) return 45;    // Moderate stress
  if (humidity >= 25) return 70;    // High stress
  return 95;                         // Very low humidity = extreme stress
}

/**
 * Calculate Weather Factor (0-100)
 * 0 = rain coming (no irrigation needed), 100 = dry forecast
 */
function calculateWeatherFactor(rainProbability: number, isRaining: boolean): number {
  if (isRaining) return 0;
  if (rainProbability >= 80) return 5;
  if (rainProbability >= 60) return 15;
  if (rainProbability >= 40) return 35;
  if (rainProbability >= 20) return 60;
  return 85; // No rain expected = high factor
}

/**
 * Calculate the full Irrigation Risk Score
 */
export function calculateIRS(
  sensorData: ValidatedSensorData,
  weather: WeatherContext,
  context: ContextAnalysis,
  cropType: string | null | undefined,
  soilType: string | null | undefined,
  customWeights?: Partial<typeof DEFAULT_WEIGHTS>
): IRSResult {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };
  const fieldCapacity = getFieldCapacity(soilType);
  const reasoning: string[] = [];

  // Calculate individual factors
  const soilDrynessValue = calculateSoilDryness(sensorData.soil_moisture, fieldCapacity);
  const tempStressValue = calculateTempStress(sensorData.temperature);
  const humidityStressValue = calculateHumidityStress(sensorData.humidity);
  const cropSensitivityValue = getCropSensitivity(cropType);
  const weatherFactorValue = calculateWeatherFactor(weather.rainProbability, weather.isRaining || false);

  // Calculate weighted contributions
  const factors: IRSFactors = {
    soilDryness: {
      value: soilDrynessValue,
      weight: weights.soilDryness,
      weighted: Math.round(soilDrynessValue * weights.soilDryness),
    },
    tempStress: {
      value: tempStressValue,
      weight: weights.tempStress,
      weighted: Math.round(tempStressValue * weights.tempStress),
    },
    humidityStress: {
      value: humidityStressValue,
      weight: weights.humidityStress,
      weighted: Math.round(humidityStressValue * weights.humidityStress),
    },
    cropSensitivity: {
      value: cropSensitivityValue,
      weight: weights.cropSensitivity,
      weighted: Math.round(cropSensitivityValue * weights.cropSensitivity),
    },
    weatherFactor: {
      value: weatherFactorValue,
      weight: weights.weatherFactor,
      weighted: Math.round(weatherFactorValue * weights.weatherFactor),
    },
  };

  // Sum weighted factors = IRS
  const rawScore = 
    factors.soilDryness.weighted +
    factors.tempStress.weighted +
    factors.humidityStress.weighted +
    factors.cropSensitivity.weighted +
    factors.weatherFactor.weighted;

  // Apply context modifiers
  let contextModifier = 0;
  
  if (context.rainDelayRecommended) {
    contextModifier -= 15;
    reasoning.push(`Rain expected (${weather.rainProbability}%) — delaying irrigation`);
  }
  if (!context.isOptimalTime && rawScore < 70) {
    contextModifier -= 5;
    reasoning.push(`Not optimal time (${context.optimalTimeWindow}) — minor delay advised`);
  }
  if (context.timeSinceLastIrrigation < 4 && rawScore < 80) {
    contextModifier -= 10;
    reasoning.push(`Recently irrigated (${context.timeSinceLastIrrigation.toFixed(1)}h ago)`);
  }
  if (context.seasonFactor > 1.2) {
    contextModifier += 5;
    reasoning.push('Summer season — increased water demand');
  }

  // Sensor reliability penalty
  if (!sensorData.isReliable) {
    contextModifier -= 10;
    reasoning.push('Sensor anomaly detected — reduced confidence');
  }

  const score = Math.max(0, Math.min(100, rawScore + contextModifier));

  // Determine risk level and decision
  let riskLevel: IRSResult['riskLevel'];
  let shouldIrrigate: boolean;
  let recommendedAction: string;
  let ledStatus: IRSResult['ledStatus'];
  let buzzerPattern: IRSResult['buzzerPattern'];

  if (score < 40) {
    riskLevel = 'safe';
    shouldIrrigate = false;
    recommendedAction = 'No irrigation needed — soil moisture adequate';
    ledStatus = 'green';
    buzzerPattern = 'off';
    reasoning.push(`IRS ${score} (Safe) — no action required`);
  } else if (score < 60) {
    riskLevel = 'monitor';
    shouldIrrigate = false;
    recommendedAction = 'Monitor conditions — irrigation may be needed soon';
    ledStatus = 'yellow';
    buzzerPattern = 'short_beep';
    reasoning.push(`IRS ${score} (Monitor) — keep watching`);
  } else if (score < 70) {
    riskLevel = 'caution';
    shouldIrrigate = !context.rainDelayRecommended; // Only irrigate if no rain coming
    recommendedAction = context.rainDelayRecommended 
      ? 'Rain expected — hold irrigation' 
      : 'Consider irrigation within 2 hours';
    ledStatus = 'yellow';
    buzzerPattern = 'medium_beep';
    reasoning.push(`IRS ${score} (Caution) — ${context.rainDelayRecommended ? 'delayed for rain' : 'irrigation recommended'}`);
  } else {
    riskLevel = 'critical';
    shouldIrrigate = true;
    recommendedAction = 'Immediate irrigation required';
    ledStatus = 'red';
    buzzerPattern = 'continuous';
    reasoning.push(`IRS ${score} (Critical) — irrigate now`);
  }

  // Handle sensor fault state
  if (sensorData.anomalies.some(a => a.severity === 'high')) {
    ledStatus = 'red_blink';
    buzzerPattern = 'beep_beep';
    reasoning.push('⚠ Sensor fault detected — maintenance recommended');
  }

  // Calculate irrigation duration based on moisture deficit
  const moistureDeficit = Math.max(0, fieldCapacity - sensorData.soil_moisture);
  const duration = shouldIrrigate ? Math.ceil((moistureDeficit / 10) * 5 + 5) : 0;
  const waterVolume = duration * 2; // ~2 liters per minute

  // Determine optimal time
  let optimalTime: string;
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 8) {
    optimalTime = 'Now (morning window)';
  } else if (hour >= 18 && hour <= 20) {
    optimalTime = 'Now (evening window)';
  } else if (score >= 70) {
    optimalTime = 'Now (urgent)';
  } else {
    optimalTime = hour < 18 ? 'Evening (6-8 PM)' : 'Tomorrow morning (5-7 AM)';
  }

  // Calculate confidence based on data quality + score clarity
  const dataQualityBonus = sensorData.isReliable ? 15 : -10;
  const scoreClarityBonus = Math.abs(score - 50) / 2; // Closer to 0 or 100 = higher confidence
  const confidence = Math.min(95, Math.max(40, 55 + dataQualityBonus + scoreClarityBonus));

  return {
    score: Math.round(score),
    riskLevel,
    shouldIrrigate,
    confidence: Math.round(confidence),
    factors,
    reasoning,
    recommendedAction,
    recommendedDuration: duration,
    recommendedWaterVolume: waterVolume,
    optimalTime,
    ledStatus,
    buzzerPattern,
  };
}

/**
 * Get a human-readable recommendation text
 */
export function getIRSRecommendationText(irs: IRSResult): string {
  if (irs.score < 40) {
    return `Your farm is in good condition. No irrigation needed. Confidence: ${irs.confidence}%`;
  } else if (irs.score < 60) {
    return `Conditions are changing. Monitor your farm and prepare for irrigation. Confidence: ${irs.confidence}%`;
  } else if (irs.score < 70) {
    return irs.shouldIrrigate
      ? `Consider irrigating for ${irs.recommendedDuration} minutes. ${irs.optimalTime}. Confidence: ${irs.confidence}%`
      : `Irrigation may be needed but rain is expected. Wait and monitor. Confidence: ${irs.confidence}%`;
  } else {
    return `Urgent: Irrigate for ${irs.recommendedDuration} minutes (${irs.recommendedWaterVolume}L). ${irs.optimalTime}. Confidence: ${irs.confidence}%`;
  }
}

/**
 * Get risk level color for UI display
 */
export function getIRSColor(riskLevel: IRSResult['riskLevel']): string {
  switch (riskLevel) {
    case 'safe': return '#22c55e';      // Green
    case 'monitor': return '#eab308';   // Yellow
    case 'caution': return '#f97316';   // Orange
    case 'critical': return '#ef4444';  // Red
  }
}
