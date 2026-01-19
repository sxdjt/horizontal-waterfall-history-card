import { LovelaceCardConfig } from 'custom-card-helpers';

// Threshold configuration for numeric sensors
export interface ThresholdConfig {
  value: number;
  color: string;
}

// Binary colors configuration (supports both object and individual properties)
export interface BinaryColorsConfig {
  on?: string;
  off?: string;
  0?: string;  // Alternative numeric format
  1?: string;
}

// State segment within an interval (for multi-state tracking)
export interface IntervalState {
  state: number | null;
  startTime: number;  // Unix timestamp in ms
  duration: number;   // Duration in ms
}

// Per-entity configuration options
export interface EntityConfig {
  // Required
  entity: string;

  // Display
  name?: string;

  // Time window overrides
  hours?: number;
  intervals?: number;
  start_offset?: number;  // Hours to offset the start time (e.g., 24 = show 24-48h ago instead of 0-24h ago)

  // Display toggles
  show_current?: boolean;
  show_labels?: boolean;
  show_min_max?: boolean;
  show_icons?: boolean;

  // Styling
  height?: number;
  unit?: string;
  icon?: string;
  digits?: number;
  compact?: boolean;
  inline_layout?: boolean;

  // Data
  min_value?: number | null;
  max_value?: number | null;
  default_value?: number | null;

  // Thresholds for numeric sensors
  thresholds?: ThresholdConfig[];
  gradient?: boolean;

  // Binary state configuration
  binary_colors?: BinaryColorsConfig;
  color_on?: string;
  color_off?: string;
  state_on?: string;
  state_off?: string;

  // Unknown and unavailable states
  color_unknown?: string;
  color_unavailable?: string;
  state_unknown?: string;
  state_unavailable?: string;
}

// Global card configuration
export interface WaterfallHistoryCardConfig extends LovelaceCardConfig {
  type: string;
  entities: (string | EntityConfig)[];  // Supports both simple string and full config object

  // Global defaults (all EntityConfig options can be set globally)
  title?: string;
  hours?: number;
  intervals?: number;
  start_offset?: number;  // Global default for start_offset
  show_current?: boolean;
  show_labels?: boolean;
  show_min_max?: boolean;
  show_icons?: boolean;
  height?: number;
  unit?: string;
  icon?: string;
  digits?: number;
  compact?: boolean;
  inline_layout?: boolean;
  min_value?: number | null;
  max_value?: number | null;
  default_value?: number | null;
  thresholds?: ThresholdConfig[];
  gradient?: boolean;
  binary_colors?: BinaryColorsConfig;
  color_on?: string;
  color_off?: string;
  state_on?: string;
  state_off?: string;
  color_unknown?: string;
  color_unavailable?: string;
  state_unknown?: string;
  state_unavailable?: string;
  card_mod?: Record<string, any>;
}

// Normalized entity config (after setConfig processing)
export interface NormalizedEntityConfig extends EntityConfig {
  entity: string;  // Always defined after normalization
}

// Processed history data structure
export interface ProcessedHistoryData {
  [entityId: string]: {
    data: Array<{
      time: Date;
      value: number | null;              // Primary/dominant state (backwards compatible)
      states?: IntervalState[];          // Multi-state data (optional, only when multiple states exist)
    }>;
    minValue: number;
    maxValue: number;
  };
}
