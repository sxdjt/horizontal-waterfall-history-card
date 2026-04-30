import { ThresholdConfig } from './types';

// Special state values for unknown and unavailable states
export const UNKNOWN_STATE = -999;
export const UNAVAILABLE_STATE = -998;

// Default thresholds for numeric sensors (temperature-based)
export const DEFAULT_THRESHOLDS_NUMERIC: ThresholdConfig[] = [
  { value: 60, color: '#5b8fce' },  // cold - precise blue
  { value: 70, color: '#52a870' },  // cool - measured green
  { value: 80, color: '#d4894a' },  // warm - amber
  { value: 100, color: '#c85c4a' }  // hot - alert
];

// Default thresholds for binary sensors
export const DEFAULT_THRESHOLDS_BOOLEAN: ThresholdConfig[] = [
  { value: 0, color: '#2d3245' },  // off - dark recessed
  { value: 1, color: '#4a9eff' },  // on - electric blue
];

// Default icons by domain
export const DEFAULT_DOMAIN_ICONS: Record<string, string> = {
  sensor: "mdi:gauge",
  binary_sensor: "mdi:eye",
  switch: "mdi:toggle-switch",
  light: "mdi:lightbulb",
  climate: "mdi:thermostat",
  lock: "mdi:lock",
  cover: "mdi:window-shutter",
  media_player: "mdi:play-circle",
  person: "mdi:account",
  device_tracker: "mdi:map-marker",
};

// Translations for UI text
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    history: 'History',
    error_loading_data: 'Error loading historical data',
    min_label: 'Min',
    max_label: 'Max',
    hours_ago: 'h ago',
    minutes_ago: 'm ago',
    now: 'Now',
  },
  fr: {
    history: 'Historique',
    error_loading_data: 'Erreur lors du chargement des données historiques',
    min_label: 'Min',
    max_label: 'Max',
    hours_ago: 'h',
    minutes_ago: 'min',
    now: 'Actuel',
  }
};

// Default configuration values
export const DEFAULTS = {
  title: 'History',
  hours: 24,
  intervals: 48,
  start_offset: 0,  // No offset by default (show recent history ending at "now")
  height: 60,
  show_current: true,
  show_labels: true,
  show_min_max: false,
  show_icons: true,
  digits: 1,
  compact: false,
  inline_layout: false,
  gradient: false,
  state_on: 'On',
  state_off: 'Off',
  state_unknown: 'Unknown',
  state_unavailable: 'INOP',
  color_on: '#4a9eff',
  color_off: '#2d3245',
  color_unknown: '#FF9800',  // Orange
  color_unavailable: '#9E9E9E',  // Gray
  interval_value: 'last' as 'last' | 'min' | 'max',
};
