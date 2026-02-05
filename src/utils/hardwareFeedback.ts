// ============================================================
// STEP 5: MULTI-LEVEL HARDWARE FEEDBACK SYSTEM
// Controls LED + Buzzer states on ESP32
// Maps IRS risk levels to physical indicators
// ============================================================

import type { IrrigationDecision } from './irrigationDecisionEngine';

export type LEDStatus = 'green' | 'yellow' | 'red' | 'red_blink';
export type BuzzerPattern = 'off' | 'short_beep' | 'medium_beep' | 'continuous' | 'beep_beep';

export interface HardwareFeedbackState {
  led: LEDStatus;
  buzzer: BuzzerPattern;
  label: string;
  description: string;
  color: string;
  icon: 'check' | 'alert' | 'critical' | 'error';
  animate: boolean;
}

/**
 * Map IRS decision to hardware feedback state
 */
export function getHardwareFeedback(decision: IrrigationDecision): HardwareFeedbackState {
  // Sensor fault overrides everything
  if (decision.ledStatus === 'red_blink') {
    return {
      led: 'red_blink',
      buzzer: 'beep_beep',
      label: 'Sensor Fault',
      description: 'Sensor reading unreliable — check hardware',
      color: '#ef4444',
      icon: 'error',
      animate: true,
    };
  }

  switch (decision.riskLevel) {
    case 'safe':
      return {
        led: 'green',
        buzzer: 'off',
        label: 'All Good',
        description: 'Farm conditions are healthy. No action needed.',
        color: '#22c55e',
        icon: 'check',
        animate: false,
      };

    case 'monitor':
      return {
        led: 'yellow',
        buzzer: 'short_beep',
        label: 'Monitor',
        description: 'Conditions changing. Keep an eye on your farm.',
        color: '#eab308',
        icon: 'alert',
        animate: false,
      };

    case 'caution':
      return {
        led: 'yellow',
        buzzer: 'medium_beep',
        label: 'Caution',
        description: decision.shouldIrrigate
          ? 'Irrigation recommended within 2 hours.'
          : 'Rain expected — holding irrigation.',
        color: '#f97316',
        icon: 'alert',
        animate: true,
      };

    case 'critical':
      return {
        led: 'red',
        buzzer: 'continuous',
        label: 'Critical',
        description: 'Immediate irrigation required!',
        color: '#ef4444',
        icon: 'critical',
        animate: true,
      };

    default:
      return {
        led: 'green',
        buzzer: 'off',
        label: 'Unknown',
        description: 'Unable to determine status.',
        color: '#6b7280',
        icon: 'check',
        animate: false,
      };
  }
}

/**
 * Generate ESP32-compatible feedback command payload
 * This would be sent to the ESP32 via HTTP/MQTT
 */
export function generateESP32Command(feedback: HardwareFeedbackState): {
  led_pin: number;
  led_state: string;
  buzzer_pin: number;
  buzzer_pattern: string;
  relay_state: boolean;
} {
  const ledPatterns: Record<LEDStatus, string> = {
    green: 'SOLID_GREEN',
    yellow: 'SOLID_YELLOW',
    red: 'SOLID_RED',
    red_blink: 'BLINK_RED_500MS',
  };

  const buzzerPatterns: Record<BuzzerPattern, string> = {
    off: 'OFF',
    short_beep: 'BEEP_2SEC',
    medium_beep: 'BEEP_5SEC',
    continuous: 'BEEP_10SEC',
    beep_beep: 'PATTERN_SOS',
  };

  return {
    led_pin: 2,      // Default ESP32 LED pin
    led_state: ledPatterns[feedback.led],
    buzzer_pin: 4,   // Common buzzer pin
    buzzer_pattern: buzzerPatterns[feedback.buzzer],
    relay_state: feedback.led === 'red' || feedback.label === 'Critical',
  };
}

/**
 * Map LED status to CSS classes for the dashboard
 */
export function getLEDCSSClasses(led: LEDStatus): string {
  switch (led) {
    case 'green':
      return 'bg-green-500 shadow-green-500/50';
    case 'yellow':
      return 'bg-yellow-500 shadow-yellow-500/50';
    case 'red':
      return 'bg-red-500 shadow-red-500/50';
    case 'red_blink':
      return 'bg-red-500 shadow-red-500/50 animate-pulse';
  }
}

/**
 * Map buzzer pattern to a descriptive text
 */
export function getBuzzerText(buzzer: BuzzerPattern): string {
  switch (buzzer) {
    case 'off': return 'Silent';
    case 'short_beep': return 'Short beep (2s)';
    case 'medium_beep': return 'Medium beep (5s)';
    case 'continuous': return 'Continuous alarm (10s)';
    case 'beep_beep': return 'SOS pattern (sensor fault)';
  }
}
