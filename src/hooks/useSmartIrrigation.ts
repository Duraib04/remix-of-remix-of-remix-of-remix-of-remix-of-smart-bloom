// ============================================================
// useSmartIrrigation Hook
// Integrates all 8 steps into a single reactive hook
// Steps: Validate → Context → IRS → Decision → Feedback → Sync → Learn
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateSensorData, resetValidator } from '@/utils/sensorValidator';
import { analyzeContext } from '@/utils/contextAnalyzer';
import { calculateIRS } from '@/utils/irsCalculator';
import { makeIrrigationDecision, getVoiceSummary } from '@/utils/irrigationDecisionEngine';
import { getHardwareFeedback } from '@/utils/hardwareFeedback';
import { shouldSyncToCloud, markSynced } from '@/utils/eventSync';
import type { IrrigationDecision, DecisionInput } from '@/utils/irrigationDecisionEngine';
import type { ValidatedSensorData } from '@/utils/sensorValidator';
import type { ContextAnalysis, WeatherContext, FarmContext } from '@/utils/contextAnalyzer';
import type { HardwareFeedbackState } from '@/utils/hardwareFeedback';
import type { SyncDecision } from '@/utils/eventSync';

export interface SmartIrrigationState {
  // Current decision
  decision: IrrigationDecision | null;
  
  // Sub-system states
  validatedData: ValidatedSensorData | null;
  context: ContextAnalysis | null;
  hardwareFeedback: HardwareFeedbackState | null;
  syncStatus: SyncDecision | null;
  
  // Learning data
  decisionHistory: IrrigationDecision[];
  overrideCount: number;
  
  // Voice summary
  voiceSummary: string;
  
  // Status
  isProcessing: boolean;
  lastProcessedAt: string | null;
  error: string | null;
}

interface UseSmartIrrigationInput {
  farmId: string | null;
  sensorData: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
    phLevel: number;
    waterLevel: number;
    pumpStatus: boolean;
  };
  weather: {
    temperature: number;
    humidity: number;
    rainProbability: number;
  };
  soilType: string | null;
  cropType?: string | null;
  irrigationMode: 'auto' | 'manual';
}

export function useSmartIrrigation(input?: UseSmartIrrigationInput) {
  const { 
    farmId = null, 
    sensorData = { soilMoisture: 0, temperature: 0, humidity: 0, phLevel: 0, waterLevel: 0, pumpStatus: false },
    weather = { temperature: 0, humidity: 0, rainProbability: 0 },
    soilType = null,
    cropType = null,
    irrigationMode = 'auto'
  } = input || {};

  const [state, setState] = useState<SmartIrrigationState>({
    decision: null,
    validatedData: null,
    context: null,
    hardwareFeedback: null,
    syncStatus: null,
    decisionHistory: [],
    overrideCount: 0,
    voiceSummary: '',
    isProcessing: false,
    lastProcessedAt: null,
    error: null,
  });

  const previousDecisionRef = useRef<IrrigationDecision | null>(null);
  const processCountRef = useRef(0);

  /**
   * Run the full decision pipeline
   */
  const processDecision = useCallback(() => {
    if (!farmId) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Build input for decision engine
      const decisionInput: DecisionInput = {
        rawSensorData: {
          soil_moisture: sensorData.soilMoisture,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          ph_level: sensorData.phLevel,
          water_level: sensorData.waterLevel,
          pump_status: sensorData.pumpStatus,
        },
        weather: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          rainProbability: weather.rainProbability,
        },
        farm: {
          soilType,
          cropType,
          lastIrrigationTime: null, // Could come from irrigation logs
        },
        currentMode: irrigationMode,
      };

      // Run the engine (Steps 1-4 internally)
      const decision = makeIrrigationDecision(decisionInput);

      // Step 5: Get hardware feedback
      const hardwareFeedback = getHardwareFeedback(decision);

      // Step 6: Check if cloud sync needed
      const validated = validateSensorData(decisionInput.rawSensorData);
      const syncStatus = shouldSyncToCloud(validated, decision);

      // If sync needed, mark as synced
      if (syncStatus.shouldSync) {
        markSynced(validated, decision.irsScore);
      }

      // Store for learning (Step 8)
      const history = [...(previousDecisionRef.current ? [previousDecisionRef.current] : [])];
      if (history.length > 50) history.shift(); // Keep last 50

      // Generate voice summary
      const voiceSummary = getVoiceSummary(decision);

      previousDecisionRef.current = decision;
      processCountRef.current++;

      setState(prev => ({
        ...prev,
        decision,
        validatedData: validated,
        context: null, // Context is generated inside the engine
        hardwareFeedback,
        syncStatus,
        decisionHistory: [...prev.decisionHistory.slice(-49), decision],
        voiceSummary,
        isProcessing: false,
        lastProcessedAt: new Date().toISOString(),
      }));

    } catch (err) {
      console.error('Smart irrigation processing error:', err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err instanceof Error ? err.message : 'Processing failed',
      }));
    }
  }, [farmId, sensorData, weather, soilType, cropType, irrigationMode]);

  /**
   * Handle manual override (user presses irrigation button)
   */
  const handleManualOverride = useCallback((action: 'started' | 'stopped') => {
    if (!farmId) return;

    const decisionInput: DecisionInput = {
      rawSensorData: {
        soil_moisture: sensorData.soilMoisture,
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        ph_level: sensorData.phLevel,
        water_level: sensorData.waterLevel,
        pump_status: sensorData.pumpStatus,
      },
      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainProbability: weather.rainProbability,
      },
      farm: {
        soilType,
        cropType,
      },
      currentMode: 'manual',
      manualOverride: { active: true, action },
    };

    const decision = makeIrrigationDecision(decisionInput);
    const hardwareFeedback = getHardwareFeedback(decision);

    // Log override for learning (Step 8)
    logDecisionForLearning(decision);

    setState(prev => ({
      ...prev,
      decision,
      hardwareFeedback,
      overrideCount: prev.overrideCount + 1,
      decisionHistory: [...prev.decisionHistory.slice(-49), decision],
      voiceSummary: getVoiceSummary(decision),
      lastProcessedAt: new Date().toISOString(),
    }));
  }, [farmId, sensorData, weather, soilType, cropType]);

  /**
   * Step 8: Log decision for learning system
   */
  const logDecisionForLearning = useCallback(async (decision: IrrigationDecision) => {
    if (!farmId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('ai_decisions').insert({
        farm_id: farmId,
        user_id: user.id,
        decision_type: 'irrigation',
        input_data: {
          sensorData: {
            soil_moisture: sensorData.soilMoisture,
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
          },
          weather,
          irsScore: decision.irsScore,
          riskLevel: decision.riskLevel,
        },
        output_data: {
          shouldIrrigate: decision.shouldIrrigate,
          source: decision.source,
          wasOverridden: decision.wasOverridden,
          overrideAction: decision.overrideAction,
          factors: decision.factors,
          reasoning: decision.reasoning,
        },
        confidence_score: decision.confidence,
        was_followed: !decision.wasOverridden,
      });
    } catch (err) {
      console.error('Failed to log decision for learning:', err);
    }
  }, [farmId, sensorData, weather]);

  /**
   * Get learning insights from past decisions
   */
  const getLearningInsights = useCallback(() => {
    const history = state.decisionHistory;
    if (history.length < 5) return null;

    const overrides = history.filter(d => d.wasOverridden);
    const overrideRate = (overrides.length / history.length) * 100;

    const avgIRS = history.reduce((sum, d) => sum + d.irsScore, 0) / history.length;

    // Analyze "when does the user override?"
    const overridePatterns: string[] = [];
    const overrideWhenSafe = overrides.filter(d => d.riskLevel === 'safe').length;
    const overrideWhenCritical = overrides.filter(d => d.riskLevel === 'critical').length;

    if (overrideWhenSafe > 2) {
      overridePatterns.push('User often irrigates when IRS says safe — may need more sensitive soil monitoring');
    }
    if (overrideWhenCritical > 2) {
      overridePatterns.push('User often skips irrigation when IRS says critical — rain or external knowledge?');
    }

    return {
      totalDecisions: history.length,
      overrideRate: Math.round(overrideRate),
      averageIRS: Math.round(avgIRS),
      patterns: overridePatterns,
      recommendation: overrideRate > 30 
        ? 'System is adjusting based on your farming patterns'
        : 'AI recommendations align well with your decisions',
    };
  }, [state.decisionHistory]);

  // Auto-process when sensor data changes
  useEffect(() => {
    if (farmId && sensorData.soilMoisture > 0) {
      processDecision();
    }
  }, [farmId, sensorData.soilMoisture, sensorData.temperature, weather.rainProbability, irrigationMode]);

  // Reset validator when farm changes
  useEffect(() => {
    resetValidator();
  }, [farmId]);

  return {
    ...state,
    processDecision,
    handleManualOverride,
    getLearningInsights,
    processCount: processCountRef.current,
  };
}
