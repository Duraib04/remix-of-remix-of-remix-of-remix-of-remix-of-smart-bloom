// ============================================================
// STEP 6: EVENT-DRIVEN CLOUD SYNC
// Only uploads data when something significant changes
// Reduces data cost, power, and network dependency
// ============================================================

import type { IrrigationDecision } from './irrigationDecisionEngine';
import type { ValidatedSensorData } from './sensorValidator';

interface SyncState {
  lastSyncedData: Record<string, number>;
  lastSyncTime: number;
  lastIRSScore: number;
  syncCount: number;
}

// Thresholds for significant change (to trigger cloud sync)
const CHANGE_THRESHOLDS: Record<string, number> = {
  soil_moisture: 5,    // 5% change
  temperature: 2,       // 2°C change
  humidity: 5,          // 5% change
  ph_level: 0.5,        // 0.5 pH units
  water_level: 10,      // 10% change
};

const IRS_CHANGE_THRESHOLD = 10;          // 10-point IRS change
const MAX_SYNC_INTERVAL = 60 * 60 * 1000; // Force sync every 1 hour (ms)
const MIN_SYNC_INTERVAL = 30 * 1000;       // Min 30 seconds between syncs

let syncState: SyncState = {
  lastSyncedData: {},
  lastSyncTime: 0,
  lastIRSScore: -1,
  syncCount: 0,
};

export interface SyncDecision {
  shouldSync: boolean;
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  changedFields: string[];
}

/**
 * Determine if sensor data should be uploaded to cloud
 */
export function shouldSyncToCloud(
  sensorData: ValidatedSensorData,
  decision: IrrigationDecision
): SyncDecision {
  const now = Date.now();
  const timeSinceLastSync = now - syncState.lastSyncTime;
  const changedFields: string[] = [];

  // Rule 1: Force sync if too long since last sync
  if (timeSinceLastSync > MAX_SYNC_INTERVAL) {
    return {
      shouldSync: true,
      reason: 'Periodic sync (1 hour interval)',
      priority: 'low',
      changedFields: ['periodic'],
    };
  }

  // Rule 2: Don't sync too frequently
  if (timeSinceLastSync < MIN_SYNC_INTERVAL) {
    return {
      shouldSync: false,
      reason: 'Throttled — too soon since last sync',
      priority: 'low',
      changedFields: [],
    };
  }

  // Rule 3: Significant sensor value change
  const sensorChecks: Record<string, number> = {
    soil_moisture: sensorData.soil_moisture,
    temperature: sensorData.temperature,
    humidity: sensorData.humidity,
    ph_level: sensorData.ph_level,
    water_level: sensorData.water_level,
  };

  for (const [key, value] of Object.entries(sensorChecks)) {
    const lastValue = syncState.lastSyncedData[key];
    const threshold = CHANGE_THRESHOLDS[key] || 5;
    if (lastValue === undefined || Math.abs(value - lastValue) > threshold) {
      changedFields.push(key);
    }
  }

  if (changedFields.length > 0) {
    return {
      shouldSync: true,
      reason: `Significant change in: ${changedFields.join(', ')}`,
      priority: changedFields.includes('soil_moisture') ? 'high' : 'normal',
      changedFields,
    };
  }

  // Rule 4: IRS score changed significantly
  if (syncState.lastIRSScore >= 0) {
    const irsDelta = Math.abs(decision.irsScore - syncState.lastIRSScore);
    if (irsDelta >= IRS_CHANGE_THRESHOLD) {
      return {
        shouldSync: true,
        reason: `IRS changed by ${irsDelta} points (${syncState.lastIRSScore} → ${decision.irsScore})`,
        priority: decision.riskLevel === 'critical' ? 'critical' : 'high',
        changedFields: ['irs_score'],
      };
    }
  }

  // Rule 5: Irrigation event happened
  if (decision.shouldIrrigate || decision.wasOverridden) {
    return {
      shouldSync: true,
      reason: decision.wasOverridden ? 'Manual override event' : 'Irrigation triggered',
      priority: 'critical',
      changedFields: ['irrigation_event'],
    };
  }

  // Rule 6: Alert/anomaly generated
  if (decision.anomalyCount > 0) {
    return {
      shouldSync: true,
      reason: `${decision.anomalyCount} sensor anomaly detected`,
      priority: 'high',
      changedFields: ['anomaly'],
    };
  }

  // Rule 7: Critical context flag
  if (decision.contextFlags.some(f => f.severity === 'critical')) {
    return {
      shouldSync: true,
      reason: 'Critical context alert',
      priority: 'critical',
      changedFields: ['context_alert'],
    };
  }

  // No significant changes
  return {
    shouldSync: false,
    reason: 'No significant changes detected',
    priority: 'low',
    changedFields: [],
  };
}

/**
 * Mark data as synced (call after successful cloud upload)
 */
export function markSynced(sensorData: ValidatedSensorData, irsScore: number): void {
  syncState = {
    lastSyncedData: {
      soil_moisture: sensorData.soil_moisture,
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      ph_level: sensorData.ph_level,
      water_level: sensorData.water_level,
    },
    lastSyncTime: Date.now(),
    lastIRSScore: irsScore,
    syncCount: syncState.syncCount + 1,
  };
}

/**
 * Get sync statistics
 */
export function getSyncStats(): {
  totalSyncs: number;
  lastSyncAgo: string;
  estimatedSavings: string;
} {
  const sinceLast = Date.now() - syncState.lastSyncTime;
  const minutesAgo = Math.round(sinceLast / 60000);

  return {
    totalSyncs: syncState.syncCount,
    lastSyncAgo: syncState.lastSyncTime === 0 ? 'Never' : `${minutesAgo} min ago`,
    estimatedSavings: `~${Math.max(0, 60 - syncState.syncCount)}% fewer uploads than continuous mode`,
  };
}

/**
 * Reset sync state (for testing or farm switch)
 */
export function resetSyncState(): void {
  syncState = {
    lastSyncedData: {},
    lastSyncTime: 0,
    lastIRSScore: -1,
    syncCount: 0,
  };
}
