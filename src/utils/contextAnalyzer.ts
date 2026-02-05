// ============================================================
// STEP 2: CONTEXT AWARENESS ENGINE
// Understands the "situation" not just values
// Factors: rain, time, crop type, soil recovery, season
// ============================================================

import type { ValidatedSensorData } from './sensorValidator';

export interface WeatherContext {
  temperature: number;
  humidity: number;
  rainProbability: number;
  isRaining?: boolean;
  windSpeed?: number;
}

export interface FarmContext {
  soilType: string | null;
  cropType?: string | null;
  lastIrrigationTime?: string | null;
  irrigationHistory?: Array<{ timestamp: string; duration: number; triggeredBy: string }>;
}

export interface ContextAnalysis {
  isRainExpected: boolean;
  rainDelayRecommended: boolean;
  optimalTimeWindow: 'morning' | 'evening' | 'midday' | 'night';
  isOptimalTime: boolean;
  cropWaterDemand: 'low' | 'medium' | 'high' | 'very_high';
  soilRecoveryRate: number;        // mm moisture loss per hour
  fieldCapacity: number;           // max water holding %
  evapotranspirationRate: number;  // mm/day water loss
  seasonFactor: number;            // multiplier 0.5 (winter) to 1.5 (summer)
  timeSinceLastIrrigation: number; // hours
  contextFlags: ContextFlag[];
  overallContextScore: number;     // 0-100, higher = more irrigation needed
}

export interface ContextFlag {
  type: 'rain_delay' | 'heat_stress' | 'frost_risk' | 'wind_advisory' | 'recent_irrigation' | 'crop_critical' | 'dry_spell' | 'waterlogging_risk';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  action: string;
}

// Crop water demand database (liters/day per sq meter)
const CROP_WATER_DEMAND: Record<string, { demand: 'low' | 'medium' | 'high' | 'very_high'; sensitivity: number }> = {
  rice:        { demand: 'very_high', sensitivity: 85 },
  paddy:       { demand: 'very_high', sensitivity: 85 },
  sugarcane:   { demand: 'very_high', sensitivity: 80 },
  cotton:      { demand: 'high',      sensitivity: 65 },
  wheat:       { demand: 'medium',    sensitivity: 60 },
  maize:       { demand: 'high',      sensitivity: 70 },
  corn:        { demand: 'high',      sensitivity: 70 },
  tomato:      { demand: 'high',      sensitivity: 75 },
  onion:       { demand: 'medium',    sensitivity: 55 },
  groundnut:   { demand: 'medium',    sensitivity: 60 },
  turmeric:    { demand: 'high',      sensitivity: 70 },
  banana:      { demand: 'very_high', sensitivity: 80 },
  coconut:     { demand: 'medium',    sensitivity: 50 },
  millet:      { demand: 'low',       sensitivity: 40 },
  ragi:        { demand: 'low',       sensitivity: 35 },
  sorghum:     { demand: 'low',       sensitivity: 40 },
  pulses:      { demand: 'medium',    sensitivity: 55 },
  vegetables:  { demand: 'high',      sensitivity: 70 },
  default:     { demand: 'medium',    sensitivity: 60 },
};

// Soil field capacity and recovery rates
const SOIL_PROPERTIES: Record<string, { fieldCapacity: number; recoveryRate: number; drainageRate: number }> = {
  clay:      { fieldCapacity: 40, recoveryRate: 0.8,  drainageRate: 0.3 },
  sandy:     { fieldCapacity: 15, recoveryRate: 3.5,  drainageRate: 5.0 },
  loamy:     { fieldCapacity: 30, recoveryRate: 1.5,  drainageRate: 1.5 },
  silt:      { fieldCapacity: 35, recoveryRate: 1.2,  drainageRate: 1.0 },
  peat:      { fieldCapacity: 60, recoveryRate: 0.5,  drainageRate: 0.4 },
  chalky:    { fieldCapacity: 20, recoveryRate: 2.5,  drainageRate: 3.0 },
  black:     { fieldCapacity: 45, recoveryRate: 0.7,  drainageRate: 0.5 },
  red:       { fieldCapacity: 25, recoveryRate: 2.0,  drainageRate: 2.0 },
  alluvial:  { fieldCapacity: 35, recoveryRate: 1.3,  drainageRate: 1.5 },
};

/**
 * Get the current season based on month (Indian agricultural seasons)
 */
function getCurrentSeason(): { name: string; factor: number } {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return { name: 'summer', factor: 1.4 };       // Mar-May: High water need
  if (month >= 6 && month <= 9) return { name: 'monsoon', factor: 0.6 };      // Jun-Sep: Rain helps
  if (month >= 10 && month <= 11) return { name: 'post_monsoon', factor: 0.9 }; // Oct-Nov
  return { name: 'winter', factor: 0.7 };                                      // Dec-Feb: Low water need
}

/**
 * Get optimal time window for irrigation
 */
function getOptimalTimeWindow(): { window: 'morning' | 'evening' | 'midday' | 'night'; isOptimal: boolean } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 8) return { window: 'morning', isOptimal: true };
  if (hour >= 18 && hour <= 20) return { window: 'evening', isOptimal: true };
  if (hour >= 9 && hour <= 17) return { window: 'midday', isOptimal: false };
  return { window: 'night', isOptimal: false };
}

/**
 * Calculate simplified evapotranspiration rate (Hargreaves method)
 */
function calculateET(temperature: number, humidity: number, seasonFactor: number): number {
  const tempRange = Math.max(5, temperature * 0.3);
  const baseET = 0.0023 * (temperature + 17.8) * Math.sqrt(tempRange) * 0.408;
  const humidityMod = 1 - (humidity / 200); // Higher humidity = less ET
  return Math.max(0, baseET * humidityMod * seasonFactor);
}

/**
 * Calculate hours since last irrigation
 */
function getTimeSinceIrrigation(lastIrrigationTime: string | null | undefined): number {
  if (!lastIrrigationTime) return 999; // No record = very long ago
  const diff = Date.now() - new Date(lastIrrigationTime).getTime();
  return Math.max(0, diff / (1000 * 60 * 60)); // hours
}

/**
 * Main context analysis function
 */
export function analyzeContext(
  sensorData: ValidatedSensorData,
  weather: WeatherContext,
  farm: FarmContext
): ContextAnalysis {
  const flags: ContextFlag[] = [];
  const season = getCurrentSeason();
  const timeWindow = getOptimalTimeWindow();
  const soilProps = SOIL_PROPERTIES[farm.soilType?.toLowerCase() || 'loamy'] || SOIL_PROPERTIES.loamy;
  const cropInfo = CROP_WATER_DEMAND[farm.cropType?.toLowerCase() || 'default'] || CROP_WATER_DEMAND.default;
  const et = calculateET(sensorData.temperature, sensorData.humidity, season.factor);
  const timeSinceIrrigation = getTimeSinceIrrigation(farm.lastIrrigationTime);

  let contextScore = 50; // Start neutral

  // --- RAIN ANALYSIS ---
  const isRainExpected = weather.rainProbability > 50;
  const rainDelayRecommended = weather.rainProbability > 60 && sensorData.soil_moisture > soilProps.fieldCapacity * 0.4;
  
  if (weather.rainProbability > 70) {
    flags.push({
      type: 'rain_delay',
      message: `Rain probability ${weather.rainProbability}% — delay irrigation`,
      severity: 'warning',
      action: 'Delay irrigation for 6-12 hours',
    });
    contextScore -= 25;
  } else if (weather.rainProbability > 50) {
    flags.push({
      type: 'rain_delay',
      message: `Possible rain (${weather.rainProbability}%) — consider delaying`,
      severity: 'info',
      action: 'Monitor weather before irrigating',
    });
    contextScore -= 10;
  }

  if (weather.isRaining) {
    flags.push({
      type: 'rain_delay',
      message: 'Currently raining — irrigation not needed',
      severity: 'critical',
      action: 'Stop all irrigation immediately',
    });
    contextScore -= 40;
  }

  // --- TEMPERATURE STRESS ---
  if (sensorData.temperature > 40) {
    flags.push({
      type: 'heat_stress',
      message: `Extreme heat (${sensorData.temperature}°C) — crops under severe stress`,
      severity: 'critical',
      action: 'Immediate irrigation needed, preferably evening',
    });
    contextScore += 25;
  } else if (sensorData.temperature > 35) {
    flags.push({
      type: 'heat_stress',
      message: `High temperature (${sensorData.temperature}°C) — increased water demand`,
      severity: 'warning',
      action: 'Increase irrigation frequency',
    });
    contextScore += 15;
  }

  if (sensorData.temperature < 5) {
    flags.push({
      type: 'frost_risk',
      message: `Low temperature (${sensorData.temperature}°C) — frost risk`,
      severity: 'warning',
      action: 'Reduce irrigation to prevent frost damage',
    });
    contextScore -= 15;
  }

  // --- WIND ADVISORY ---
  if (weather.windSpeed && weather.windSpeed > 25) {
    flags.push({
      type: 'wind_advisory',
      message: `High wind (${weather.windSpeed} km/h) — sprinkler irrigation inefficient`,
      severity: 'info',
      action: 'Use drip irrigation or delay sprinklers',
    });
    contextScore += 5; // Slight increase due to higher evaporation
  }

  // --- RECENT IRRIGATION CHECK ---
  if (timeSinceIrrigation < 4) {
    flags.push({
      type: 'recent_irrigation',
      message: `Irrigated ${timeSinceIrrigation.toFixed(1)} hours ago — soil still absorbing`,
      severity: 'info',
      action: 'Wait at least 4 hours between irrigations',
    });
    contextScore -= 20;
  }

  // --- SOIL MOISTURE ANALYSIS ---
  const moistureRatio = sensorData.soil_moisture / soilProps.fieldCapacity;
  
  if (moistureRatio > 1.2) {
    flags.push({
      type: 'waterlogging_risk',
      message: `Soil oversaturated (${sensorData.soil_moisture}% vs ${soilProps.fieldCapacity}% capacity)`,
      severity: 'warning',
      action: 'Stop irrigation — risk of waterlogging and root rot',
    });
    contextScore -= 30;
  } else if (moistureRatio < 0.3) {
    flags.push({
      type: 'dry_spell',
      message: `Soil critically dry (${sensorData.soil_moisture}% vs ${soilProps.fieldCapacity}% capacity)`,
      severity: 'critical',
      action: 'Urgent irrigation required',
    });
    contextScore += 30;
  }

  // --- CROP SENSITIVITY ---
  if (cropInfo.sensitivity > 70 && moistureRatio < 0.5) {
    flags.push({
      type: 'crop_critical',
      message: `${farm.cropType || 'Current crop'} is water-sensitive — moisture dangerously low`,
      severity: 'critical',
      action: 'Irrigate within the next 2 hours',
    });
    contextScore += 20;
  }

  // --- TIME PENALTY/BONUS ---
  if (!timeWindow.isOptimal) {
    contextScore -= 5; // Small penalty for non-optimal time
  } else {
    contextScore += 5;
  }

  // Clamp score
  const overallContextScore = Math.max(0, Math.min(100, contextScore));

  return {
    isRainExpected,
    rainDelayRecommended,
    optimalTimeWindow: timeWindow.window,
    isOptimalTime: timeWindow.isOptimal,
    cropWaterDemand: cropInfo.demand,
    soilRecoveryRate: soilProps.recoveryRate,
    fieldCapacity: soilProps.fieldCapacity,
    evapotranspirationRate: et,
    seasonFactor: season.factor,
    timeSinceLastIrrigation: timeSinceIrrigation,
    contextFlags: flags,
    overallContextScore,
  };
}

/**
 * Get crop sensitivity value (0-100) for IRS calculation
 */
export function getCropSensitivity(cropType: string | null | undefined): number {
  if (!cropType) return 60;
  return (CROP_WATER_DEMAND[cropType.toLowerCase()] || CROP_WATER_DEMAND.default).sensitivity;
}

/**
 * Get soil field capacity for a soil type
 */
export function getFieldCapacity(soilType: string | null | undefined): number {
  if (!soilType) return 30;
  return (SOIL_PROPERTIES[soilType.toLowerCase()] || SOIL_PROPERTIES.loamy).fieldCapacity;
}
