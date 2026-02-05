// ============================================================
// STEP 1: SENSOR FUSION & DATA SANITY CHECK
// Validates sensor readings, detects anomalies, uses last stable values
// Prevents false motor ON/OFF from sensor glitches
// ============================================================

export interface SensorReading {
  soil_moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  ph_level: number | null;
  water_level: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  pump_status?: boolean | null;
}

export interface ValidatedSensorData {
  soil_moisture: number;
  temperature: number;
  humidity: number;
  ph_level: number;
  water_level: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  pump_status: boolean;
  anomalies: SensorAnomaly[];
  isReliable: boolean;
  validationTimestamp: string;
}

export interface SensorAnomaly {
  sensor: string;
  type: 'out_of_range' | 'spike' | 'flatline' | 'null_reading';
  rawValue: number | null;
  correctedValue: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

// Acceptable sensor ranges
const SENSOR_RANGES: Record<string, { min: number; max: number; maxDelta: number }> = {
  soil_moisture:  { min: 0,   max: 100,  maxDelta: 25 },   // % - max 25% jump in 5min
  temperature:    { min: -10, max: 60,   maxDelta: 8 },    // °C - max 8°C jump in 5min
  humidity:       { min: 0,   max: 100,  maxDelta: 20 },   // % - max 20% jump
  ph_level:       { min: 0,   max: 14,   maxDelta: 2 },    // pH - max 2 unit jump
  water_level:    { min: 0,   max: 100,  maxDelta: 30 },   // % - max 30% jump (pump can drain fast)
  nitrogen:       { min: 0,   max: 500,  maxDelta: 50 },   // mg/kg
  phosphorus:     { min: 0,   max: 200,  maxDelta: 30 },   // mg/kg
  potassium:      { min: 0,   max: 500,  maxDelta: 50 },   // mg/kg
};

// Store last stable readings (in-memory for client-side)
let lastStableReadings: Record<string, number> = {};
let lastReadingTimestamp: number = 0;
let flatlineCounter: Record<string, number> = {};

/**
 * Validate a single sensor value
 */
function validateSingleSensor(
  sensorName: string,
  rawValue: number | null,
  anomalies: SensorAnomaly[]
): number {
  const range = SENSOR_RANGES[sensorName];
  if (!range) return rawValue ?? 0;

  const now = new Date().toISOString();

  // Case 1: Null reading
  if (rawValue === null || rawValue === undefined || isNaN(rawValue)) {
    const corrected = lastStableReadings[sensorName] ?? 0;
    anomalies.push({
      sensor: sensorName,
      type: 'null_reading',
      rawValue: null,
      correctedValue: corrected,
      message: `${sensorName} returned null — using last stable value (${corrected})`,
      severity: 'medium',
      timestamp: now,
    });
    return corrected;
  }

  // Case 2: Out of range
  if (rawValue < range.min || rawValue > range.max) {
    const corrected = lastStableReadings[sensorName] ?? Math.max(range.min, Math.min(range.max, rawValue));
    anomalies.push({
      sensor: sensorName,
      type: 'out_of_range',
      rawValue,
      correctedValue: corrected,
      message: `${sensorName} value ${rawValue} out of range [${range.min}-${range.max}] — using ${corrected}`,
      severity: 'high',
      timestamp: now,
    });
    return corrected;
  }

  // Case 3: Sudden spike detection
  const lastStable = lastStableReadings[sensorName];
  if (lastStable !== undefined) {
    const delta = Math.abs(rawValue - lastStable);
    const timeSinceLastReading = Date.now() - lastReadingTimestamp;
    const isRecentReading = timeSinceLastReading < 10 * 60 * 1000; // Within 10 minutes

    if (isRecentReading && delta > range.maxDelta) {
      anomalies.push({
        sensor: sensorName,
        type: 'spike',
        rawValue,
        correctedValue: lastStable,
        message: `${sensorName} jumped ${delta.toFixed(1)} units (max allowed: ${range.maxDelta}) — using last stable (${lastStable})`,
        severity: 'high',
        timestamp: now,
      });
      return lastStable;
    }
  }

  // Case 4: Flatline detection (same value 5+ times = possible sensor stuck)
  if (lastStable !== undefined && rawValue === lastStable) {
    flatlineCounter[sensorName] = (flatlineCounter[sensorName] || 0) + 1;
    if (flatlineCounter[sensorName] >= 10) {
      anomalies.push({
        sensor: sensorName,
        type: 'flatline',
        rawValue,
        correctedValue: rawValue, // Still use value but flag it
        message: `${sensorName} has been ${rawValue} for ${flatlineCounter[sensorName]} consecutive readings — possible sensor stuck`,
        severity: 'low',
        timestamp: now,
      });
    }
  } else {
    flatlineCounter[sensorName] = 0;
  }

  // Value passes all checks — update stable reading
  lastStableReadings[sensorName] = rawValue;
  return rawValue;
}

/**
 * Main validation function - validates all sensor readings at once
 * Returns corrected values + anomaly list
 */
export function validateSensorData(reading: SensorReading): ValidatedSensorData {
  const anomalies: SensorAnomaly[] = [];

  const validated: ValidatedSensorData = {
    soil_moisture: validateSingleSensor('soil_moisture', reading.soil_moisture, anomalies),
    temperature: validateSingleSensor('temperature', reading.temperature, anomalies),
    humidity: validateSingleSensor('humidity', reading.humidity, anomalies),
    ph_level: validateSingleSensor('ph_level', reading.ph_level, anomalies),
    water_level: validateSingleSensor('water_level', reading.water_level, anomalies),
    nitrogen: validateSingleSensor('nitrogen', reading.nitrogen ?? null, anomalies),
    phosphorus: validateSingleSensor('phosphorus', reading.phosphorus ?? null, anomalies),
    potassium: validateSingleSensor('potassium', reading.potassium ?? null, anomalies),
    pump_status: reading.pump_status ?? false,
    anomalies,
    isReliable: anomalies.filter(a => a.severity === 'high').length === 0,
    validationTimestamp: new Date().toISOString(),
  };

  lastReadingTimestamp = Date.now();
  return validated;
}

/**
 * Reset the validator state (useful for testing or farm switch)
 */
export function resetValidator(): void {
  lastStableReadings = {};
  lastReadingTimestamp = 0;
  flatlineCounter = {};
}

/**
 * Get current stable readings (for debug/display)
 */
export function getLastStableReadings(): Record<string, number> {
  return { ...lastStableReadings };
}

/**
 * Check if sensor data has critical anomalies that prevent irrigation decisions
 */
export function hasCriticalAnomaly(validated: ValidatedSensorData): boolean {
  return validated.anomalies.some(a => a.severity === 'high' && 
    (a.sensor === 'soil_moisture' || a.sensor === 'water_level')
  );
}
