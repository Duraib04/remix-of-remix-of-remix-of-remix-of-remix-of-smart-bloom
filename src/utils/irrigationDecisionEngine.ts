// ============================================================
// STEP 4: HYBRID DECISION ENGINE
// Combines IRS score + manual override + auto/manual mode
// Logs decisions for learning system (Step 8)
// ============================================================

import { validateSensorData, hasCriticalAnomaly } from './sensorValidator';
import { analyzeContext } from './contextAnalyzer';
import { calculateIRS, getIRSRecommendationText } from './irsCalculator';
import type { SensorReading, ValidatedSensorData } from './sensorValidator';
import type { WeatherContext, FarmContext, ContextAnalysis } from './contextAnalyzer';
import type { IRSResult } from './irsCalculator';

export interface IrrigationDecision {
  // IRS Data
  irsScore: number;
  riskLevel: 'safe' | 'monitor' | 'caution' | 'critical';
  shouldIrrigate: boolean;
  confidence: number;
  
  // Decision Details
  source: 'auto_irs' | 'manual_override' | 'safety_block';
  mode: 'auto' | 'manual';
  reasoning: string[];
  recommendationText: string;
  recommendedDuration: number;
  recommendedWaterVolume: number;
  optimalTime: string;
  
  // Hardware Feedback (Step 5)
  ledStatus: 'green' | 'yellow' | 'red' | 'red_blink';
  buzzerPattern: 'off' | 'short_beep' | 'medium_beep' | 'continuous' | 'beep_beep';
  
  // Sensor Health
  sensorReliable: boolean;
  anomalyCount: number;
  anomalySummary: string[];
  
  // Context Flags
  contextFlags: Array<{ type: string; message: string; severity: string; action: string }>;
  
  // Factor Breakdown (for UI display)
  factors: {
    soilDryness: { value: number; weighted: number };
    tempStress: { value: number; weighted: number };
    humidityStress: { value: number; weighted: number };
    cropSensitivity: { value: number; weighted: number };
    weatherFactor: { value: number; weighted: number };
  };

  // Learning data
  timestamp: string;
  wasOverridden: boolean;
  overrideAction?: 'started' | 'stopped';
}

export interface DecisionInput {
  rawSensorData: SensorReading;
  weather: WeatherContext;
  farm: FarmContext;
  currentMode: 'auto' | 'manual';
  manualOverride?: { active: boolean; action: 'started' | 'stopped' };
  customWeights?: Record<string, number>;
}

/**
 * The main decision engine
 * Processes: Sensor Validation → Context Analysis → IRS Calculation → Decision
 */
export function makeIrrigationDecision(input: DecisionInput): IrrigationDecision {
  const { rawSensorData, weather, farm, currentMode, manualOverride, customWeights } = input;

  // STEP 1: Validate sensor data
  const validatedData = validateSensorData(rawSensorData);

  // STEP 2: Analyze context
  const context = analyzeContext(validatedData, weather, farm);

  // STEP 3: Calculate IRS
  const irs = calculateIRS(
    validatedData,
    weather,
    context,
    farm.cropType,
    farm.soilType,
    customWeights
  );

  // STEP 4: Make decision based on mode + overrides
  let finalDecision: IrrigationDecision;

  // Case A: Manual Override — follow user
  if (manualOverride?.active) {
    const userWantsIrrigation = manualOverride.action === 'started';
    const reasoning = [...irs.reasoning];
    reasoning.push(`⚡ Manual override: User ${userWantsIrrigation ? 'started' : 'stopped'} irrigation`);
    
    if (userWantsIrrigation && irs.riskLevel === 'safe') {
      reasoning.push('Note: IRS says irrigation not needed — decision logged for learning');
    } else if (!userWantsIrrigation && irs.riskLevel === 'critical') {
      reasoning.push('Note: IRS says urgent irrigation needed — decision logged for learning');
    }

    finalDecision = buildDecision(validatedData, irs, context, {
      shouldIrrigate: userWantsIrrigation,
      source: 'manual_override',
      mode: 'manual',
      reasoning,
      wasOverridden: true,
      overrideAction: manualOverride.action,
    });
  }
  // Case B: Safety block — sensor fault on critical sensors
  else if (hasCriticalAnomaly(validatedData)) {
    const reasoning = [...irs.reasoning];
    reasoning.push('🛑 Safety block: Critical sensor anomaly detected — irrigation blocked');
    reasoning.push('Check soil moisture sensor and water level sensor');

    finalDecision = buildDecision(validatedData, irs, context, {
      shouldIrrigate: false,
      source: 'safety_block',
      mode: currentMode,
      reasoning,
      wasOverridden: false,
    });
    // Override LED/buzzer for safety
    finalDecision.ledStatus = 'red_blink';
    finalDecision.buzzerPattern = 'beep_beep';
  }
  // Case C: Auto mode — follow IRS
  else if (currentMode === 'auto') {
    finalDecision = buildDecision(validatedData, irs, context, {
      shouldIrrigate: irs.shouldIrrigate,
      source: 'auto_irs',
      mode: 'auto',
      reasoning: irs.reasoning,
      wasOverridden: false,
    });
  }
  // Case D: Manual mode — show recommendation, don't act
  else {
    const reasoning = [...irs.reasoning];
    reasoning.push('Manual mode active — showing recommendation only');
    
    finalDecision = buildDecision(validatedData, irs, context, {
      shouldIrrigate: false, // Don't auto-act in manual mode
      source: 'auto_irs',
      mode: 'manual',
      reasoning,
      wasOverridden: false,
    });
  }

  return finalDecision;
}

/**
 * Build the final decision object
 */
function buildDecision(
  validated: ValidatedSensorData,
  irs: IRSResult,
  context: ContextAnalysis,
  overrides: {
    shouldIrrigate: boolean;
    source: IrrigationDecision['source'];
    mode: 'auto' | 'manual';
    reasoning: string[];
    wasOverridden: boolean;
    overrideAction?: 'started' | 'stopped';
  }
): IrrigationDecision {
  return {
    irsScore: irs.score,
    riskLevel: irs.riskLevel,
    shouldIrrigate: overrides.shouldIrrigate,
    confidence: irs.confidence,
    source: overrides.source,
    mode: overrides.mode,
    reasoning: overrides.reasoning,
    recommendationText: getIRSRecommendationText(irs),
    recommendedDuration: irs.recommendedDuration,
    recommendedWaterVolume: irs.recommendedWaterVolume,
    optimalTime: irs.optimalTime,
    ledStatus: irs.ledStatus,
    buzzerPattern: irs.buzzerPattern,
    sensorReliable: validated.isReliable,
    anomalyCount: validated.anomalies.length,
    anomalySummary: validated.anomalies.map(a => a.message),
    contextFlags: context.contextFlags,
    factors: {
      soilDryness: { value: irs.factors.soilDryness.value, weighted: irs.factors.soilDryness.weighted },
      tempStress: { value: irs.factors.tempStress.value, weighted: irs.factors.tempStress.weighted },
      humidityStress: { value: irs.factors.humidityStress.value, weighted: irs.factors.humidityStress.weighted },
      cropSensitivity: { value: irs.factors.cropSensitivity.value, weighted: irs.factors.cropSensitivity.weighted },
      weatherFactor: { value: irs.factors.weatherFactor.value, weighted: irs.factors.weatherFactor.weighted },
    },
    timestamp: new Date().toISOString(),
    wasOverridden: overrides.wasOverridden,
    overrideAction: overrides.overrideAction,
  };
}

/**
 * Generate a voice-friendly summary of the decision
 */
export function getVoiceSummary(decision: IrrigationDecision): string {
  const riskText = {
    safe: 'safe',
    monitor: 'needs monitoring',
    caution: 'needs attention',
    critical: 'critical',
  };

  let summary = `Your farm condition is ${riskText[decision.riskLevel]}. `;
  summary += `Irrigation Risk Score is ${decision.irsScore} out of 100. `;

  if (decision.shouldIrrigate) {
    summary += `I recommend irrigating for ${decision.recommendedDuration} minutes. `;
  } else {
    summary += 'No irrigation is needed right now. ';
  }

  if (decision.contextFlags.length > 0) {
    const criticalFlags = decision.contextFlags.filter(f => f.severity === 'critical');
    if (criticalFlags.length > 0) {
      summary += criticalFlags[0].message + '. ';
    }
  }

  if (!decision.sensorReliable) {
    summary += 'Warning: Some sensor readings are unreliable. ';
  }

  summary += `Confidence: ${decision.confidence} percent.`;
  return summary;
}
