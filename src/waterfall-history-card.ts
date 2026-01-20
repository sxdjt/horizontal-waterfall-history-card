/* Last modified: 19-Jan-2026 10:30 */
import { LitElement, html, css, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import {
  WaterfallHistoryCardConfig,
  EntityConfig,
  NormalizedEntityConfig,
  ThresholdConfig,
  ProcessedHistoryData
} from './types';
import {
  UNKNOWN_STATE,
  UNAVAILABLE_STATE,
  DEFAULT_THRESHOLDS_NUMERIC,
  DEFAULT_THRESHOLDS_BOOLEAN,
  DEFAULT_DOMAIN_ICONS,
  TRANSLATIONS,
  DEFAULTS
} from './constants';

export class WaterfallHistoryCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: WaterfallHistoryCardConfig;
  @state() private processedHistories: ProcessedHistoryData = {};

  private _lastHistoryFetch: Record<string, number> = {};
  private _historyRefreshInterval = 15 * 60 * 1000; // 15 minutes by default
  private _cardModApplied = false;
  private language = 'en';
  private translations = TRANSLATIONS;

  static styles = css`
    :host {
      padding: 16px;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      box-shadow: var(--ha-card-box-shadow, none);
      box-sizing: border-box;
      border-radius: var(--ha-card-border-radius, 12px);
      border-width: var(--ha-card-border-width, 1px);
      border-style: solid;
      border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
      color: var(--primary-text-color);
      display: block;
      position: relative;
    }

    .card-header {
      font-size: var(--header-font-size, 16px);
      font-weight: 500;
      padding-bottom: 8px;
      color: var(--primary-text-color, black);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .entity-container {
      margin-bottom: 16px;
      cursor: pointer;
    }

    .entity-container:last-child {
      margin-bottom: 0;
    }

    .entity-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .entity-icon {
      width: 20px;
      height: 20px;
    }

    .entity-name {
      font-size: var(--entity-name-font-size, 14px);
      font-weight: 500;
    }

    .current-value {
      margin-left: auto;
      font-size: var(--current-value-font-size, 18px);
      font-weight: bold;
    }

    .waterfall-container {
      position: relative;
      height: var(--waterfall-height, 60px);
      border-radius: 2px;
      overflow: hidden;
      display: flex;
    }

    .bar-segment {
      flex: 1;
      height: 100%;
      transition: all 0.3s ease;
      border-right: 1px solid rgba(255,255,255,0.2);
    }

    .bar-segment:last-child {
      border-right: none;
    }

    .labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--secondary-text-color, gray);
      margin-top: var(--labels-margin-top, 4px);
    }

    .min-max-label {
      display: block;
      width: 100%;
      font-size: 11px;
      color: var(--secondary-text-color, gray);
      text-align: center;
    }

    .error {
      color: var(--error-color, red);
    }

    /* Compact mode overrides */
    :host(.compact) .card-header {
      font-size: 12px;
    }

    :host(.compact) .entity-name {
      font-size: 12px;
    }

    :host(.compact) .current-value {
      font-size: 12px;
    }

    :host(.compact) .labels {
      margin-top: 0px;
    }

    /* Inline layout styles */
    .entity-inline-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .entity-inline-container .entity-inline-name {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
      flex-shrink: 0;
    }

    .entity-inline-container .entity-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: block;
    }

    .entity-inline-container .entity-name {
      font-size: var(--entity-name-font-size, 14px);
      font-weight: 500;
      white-space: nowrap;
      line-height: var(--waterfall-height, 60px);
    }

    .entity-inline-container .entity-inline-graph {
      flex: 1;
      min-width: 0;
    }

    .entity-inline-container .waterfall-container {
      margin-bottom: 0;
    }

    .entity-inline-container .labels {
      display: none;
    }

    .entity-inline-container .entity-inline-value {
      min-width: 60px;
      flex-shrink: 0;
      text-align: right;
      font-size: var(--current-value-font-size, 18px);
      font-weight: bold;
      white-space: nowrap;
      line-height: var(--waterfall-height, 60px);
    }

    /* Compact mode for inline layout */
    :host(.compact) .entity-inline-container {
      margin-bottom: 8px;
    }

    :host(.compact) .entity-inline-container .entity-icon {
      width: 16px;
      height: 16px;
    }

    :host(.compact) .entity-inline-container .entity-name {
      font-size: 12px;
    }

    :host(.compact) .entity-inline-container .entity-inline-value {
      font-size: 12px;
    }
  `;

  constructor() {
    super();
    this.config = {} as WaterfallHistoryCardConfig;
    this.processedHistories = {};
  }

  // Enable visual configuration editor
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('waterfall-history-card-editor') as LovelaceCardEditor;
  }

  // Provide default stub configuration
  public static getStubConfig(): Partial<WaterfallHistoryCardConfig> {
    return {
      title: 'History',
      hours: 24,
      entities: [],
    };
  }

  setConfig(config: WaterfallHistoryCardConfig): void {
    if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error('Please define a list of entities.');
    }

    const globalConfig: Partial<WaterfallHistoryCardConfig> = {
      title: config.title || 'History',
      hours: config.hours || DEFAULTS.hours,
      intervals: config.intervals || DEFAULTS.intervals,
      start_offset: config.start_offset ?? DEFAULTS.start_offset,
      height: config.height || DEFAULTS.height,
      min_value: config.min_value || null,
      max_value: config.max_value || null,
      thresholds: config.thresholds || null,
      gradient: config.gradient || DEFAULTS.gradient,
      show_current: config.show_current !== false,
      show_labels: config.show_labels !== false,
      show_min_max: config.show_min_max || DEFAULTS.show_min_max,
      show_icons: config.show_icons !== false,
      unit: config.unit || null,
      icon: config.icon || null,
      compact: config.compact || DEFAULTS.compact,
      inline_layout: config.inline_layout || DEFAULTS.inline_layout,
      default_value: config.default_value ?? null,
      digits: typeof config.digits === 'number' ? config.digits : DEFAULTS.digits,
      card_mod: config.card_mod || {},
      binary_colors: config.binary_colors || null,
      color_on: config.color_on || null,
      color_off: config.color_off || null,
      state_on: config.state_on || DEFAULTS.state_on,
      state_off: config.state_off || DEFAULTS.state_off,
      color_unknown: config.color_unknown || DEFAULTS.color_unknown,
      color_unavailable: config.color_unavailable || DEFAULTS.color_unavailable,
      state_unknown: config.state_unknown || DEFAULTS.state_unknown,
      state_unavailable: config.state_unavailable || DEFAULTS.state_unavailable,
    };

    this.config = {
      type: 'custom:waterfall-history-card',
      ...globalConfig,
      entities: config.entities.map(entityConfig => {
        if (typeof entityConfig === 'string') {
          return { entity: entityConfig };
        }
        return entityConfig;
      }),
    } as WaterfallHistoryCardConfig;

    // Apply compact class to host
    if (this.config.compact) {
      this.classList.add('compact');
    } else {
      this.classList.remove('compact');
    }

    // Set CSS custom properties for dynamic values
    this.style.setProperty('--header-font-size', this.config.compact ? '12px' : '16px');
    this.style.setProperty('--entity-name-font-size', this.config.compact ? '12px' : '14px');
    this.style.setProperty('--current-value-font-size', this.config.compact ? '12px' : '18px');
    this.style.setProperty('--waterfall-height', `${this.config.height}px`);
    this.style.setProperty('--labels-margin-top', this.config.compact ? '0px' : '4px');
  }

  shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config || !this.hass) {
      return false;
    }

    // Always update if config changed
    if (changedProps.has('config')) {
      return true;
    }

    // Check if any of our tracked entities changed
    if (changedProps.has('hass')) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      if (!oldHass) {
        return true; // First render
      }

      // Check if any tracked entity state changed
      return this._entitiesChanged(oldHass, this.hass);
    }

    // Update if processed histories changed
    if (changedProps.has('processedHistories')) {
      return true;
    }

    return true;
  }

  private _entitiesChanged(oldHass: HomeAssistant, newHass: HomeAssistant): boolean {
    if (!oldHass || !newHass) return true;

    return this.config.entities.some(entityConfig => {
      const entityId = typeof entityConfig === 'string' ? entityConfig : entityConfig.entity;
      return oldHass.states[entityId] !== newHass.states[entityId];
    });
  }

  updated(changedProps: PropertyValues): void {
    if (changedProps.has('hass')) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;

      // Update language if changed
      if (this.hass?.language) {
        this.language = this.hass.language.split('-')[0];
      }

      // Fetch history on first render or when entities need updates
      if (!oldHass) {
        this.updateCard();
      } else if (this._entitiesChanged(oldHass, this.hass)) {
        // Only update current values, not full history fetch
        this.requestUpdate();
      }

      // Check if we need to refresh history data
      this._checkHistoryRefresh();
    }

    // Apply card-mod once
    if (!this._cardModApplied && this.config?.card_mod) {
      customElements.whenDefined("card-mod").then(() => {
        const cardMod = customElements.get("card-mod") as any;
        if (cardMod?.applyToElement) {
          cardMod.applyToElement(this, "card", this.config.card_mod);
          this._cardModApplied = true;
        }
      }).catch(() => {
        // card-mod not available, ignore
      });
    }
  }

  private _checkHistoryRefresh(): void {
    if (!this.hass || !this.config) return;

    const now = Date.now();
    const entitiesToUpdate = this.config.entities.filter(entityConfig => {
      const entityId = typeof entityConfig === 'string' ? entityConfig : entityConfig.entity;
      const hours = typeof entityConfig !== 'string' ? (entityConfig.hours ?? this.config.hours) : this.config.hours;
      const intervals = typeof entityConfig !== 'string' ? (entityConfig.intervals ?? this.config.intervals) : this.config.intervals;
      const startOffset = typeof entityConfig !== 'string' ? (entityConfig.start_offset ?? this.config.start_offset ?? 0) : (this.config.start_offset ?? 0);

      // Use composite key to support same entity with different offsets
      const cacheKey = `${entityId}_${startOffset}`;

      // For offset data (historical), use longer refresh interval since it doesn't change as frequently
      const baseRefreshInterval = ((hours! / intervals!) * 60 * 60 * 1000) / 2;
      const refreshInterval = startOffset && startOffset > 0 ? baseRefreshInterval * 4 : baseRefreshInterval;

      return !this._lastHistoryFetch[cacheKey] || (now - this._lastHistoryFetch[cacheKey] > refreshInterval);
    });

    if (entitiesToUpdate.length > 0) {
      this.updateCard();
    }
  }

  private async updateCard(): Promise<void> {
    if (!this.hass || !this.config) return;

    const now = Date.now();

    const entitiesToUpdate = this.config.entities.filter(entityConfig => {
      const entityId = typeof entityConfig === 'string' ? entityConfig : entityConfig.entity;
      const hours = typeof entityConfig !== 'string' ? (entityConfig.hours ?? this.config.hours) : this.config.hours;
      const intervals = typeof entityConfig !== 'string' ? (entityConfig.intervals ?? this.config.intervals) : this.config.intervals;
      const startOffset = typeof entityConfig !== 'string' ? (entityConfig.start_offset ?? this.config.start_offset ?? 0) : (this.config.start_offset ?? 0);

      // Use composite key to support same entity with different offsets
      const cacheKey = `${entityId}_${startOffset}`;

      const baseRefreshInterval = ((hours! / intervals!) * 60 * 60 * 1000) / 2;
      const refreshInterval = startOffset && startOffset > 0 ? baseRefreshInterval * 4 : baseRefreshInterval;

      return !this._lastHistoryFetch[cacheKey] || (now - this._lastHistoryFetch[cacheKey] > refreshInterval);
    });

    if (entitiesToUpdate.length === 0) {
      return;
    }

    const historyPromises = entitiesToUpdate.map(async (entityConfig) => {
      const entityObj = typeof entityConfig === 'string' ? { entity: entityConfig } : entityConfig;
      const entityId = entityObj.entity;
      const hours = entityObj.hours ?? this.config.hours!;
      const startOffset = entityObj.start_offset ?? this.config.start_offset ?? 0;

      // Use composite key to support same entity with different offsets
      const cacheKey = `${entityId}_${startOffset}`;

      // Calculate time window with offset
      // endTime is now shifted back by start_offset hours
      const endTime = new Date(Date.now() - startOffset * 60 * 60 * 1000);
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

      try {
        const history = await this.hass!.callApi('GET',
          `history/period/${startTime.toISOString()}?filter_entity_id=${entityId}&end_time=${endTime.toISOString()}&significant_changes_only=1&minimal_response&no_attributes`
        );
        this._lastHistoryFetch[cacheKey] = now;
        return { entityId, history: history[0], entityConfig: entityObj, startOffset, cacheKey };
      } catch (error) {
        console.error(`Error fetching history for ${entityId}:`, error);
        return { entityId, history: null, entityConfig: entityObj, startOffset, cacheKey };
      }
    });

    const results = await Promise.all(historyPromises);

    const processedHistories: ProcessedHistoryData = { ...this.processedHistories };
    results.forEach(({ entityId, history, entityConfig, startOffset, cacheKey }) => {
      if (history) {
        const intervals = entityConfig.intervals ?? this.config.intervals!;
        const hours = entityConfig.hours ?? this.config.hours!;
        const timeStep = (hours * 60 * 60 * 1000) / intervals;
        processedHistories[cacheKey] = {
          data: this.processHistoryData(history, intervals, timeStep, entityConfig, startOffset),
          minValue: 0,
          maxValue: 100
        };
      }
    });
    this.processedHistories = processedHistories;
  }

  private processHistoryData(
    historyData: any[],
    intervals: number,
    timeStep: number,
    entityConfig: EntityConfig,
    startOffset: number = 0
  ): Array<{time: Date; value: number | null}> {
    const defaultValue = entityConfig.default_value ?? this.config.default_value;
    const processed: (number | null)[] = new Array(intervals).fill(defaultValue);
    const hours = entityConfig.hours ?? this.config.hours!;

    // Calculate start time with offset - endTime is (now - offset), startTime is (endTime - hours)
    const endTime = Date.now() - (startOffset * 60 * 60 * 1000);
    const startTime = endTime - (hours * 60 * 60 * 1000);

    if (historyData) {
      historyData.forEach(point => {
        const pointTime = new Date(point.last_changed || point.last_updated).getTime();
        const timeDiff = pointTime - startTime;
        if (timeDiff >= 0) {
          const bucketIndex = Math.floor(timeDiff / timeStep);
          if (bucketIndex >= 0 && bucketIndex < intervals) {
            processed[bucketIndex] = this.parseState(point.state);
          }
        }
      });
    }

    // Forward fill - Propagate all states (including unavailable/unknown) until next actual state change
    for (let i = 1; i < processed.length; i++) {
      if (processed[i] === null && processed[i - 1] !== null) {
        processed[i] = processed[i - 1];
      }
    }
    // Backward fill - Don't fill FROM unavailable/unknown states
    // Also don't overwrite unavailable/unknown states with normal states
    for (let i = processed.length - 2; i >= 0; i--) {
      if (processed[i] === null &&
          processed[i + 1] !== null &&
          processed[i + 1] !== UNKNOWN_STATE &&
          processed[i + 1] !== UNAVAILABLE_STATE) {
        processed[i] = processed[i + 1];
      }
    }

    return processed.map((value, index) => ({
      time: new Date(startTime + index * timeStep),
      value
    }));
  }

  private getMinMax(data: (number | null)[]): [number, number] {
    let min = Infinity;
    let max = -Infinity;
    data.forEach(d => {
      // Skip null and special sentinel values (unavailable/unknown)
      if (d === null || d === UNKNOWN_STATE || d === UNAVAILABLE_STATE) return;
      if (d > max) max = d;
      if (d < min) min = d;
    });

    // Handle edge case where all values are null/unknown/unavailable
    if (min === Infinity || max === -Infinity) {
      return [0, 0];
    }

    return [min, max];
  }

  private parseState(state: any): number | null {
    if (typeof state === 'number') return state;
    if (typeof state === 'string') {
      const lowerState = state.toLowerCase();
      if (lowerState === 'unknown') return UNKNOWN_STATE;
      if (lowerState === 'unavailable') return UNAVAILABLE_STATE;
      if (lowerState === 'off') return 0;
      if (lowerState === 'on') return 1;
      const casted = parseFloat(state);
      if (!Number.isNaN(casted)) return casted;
    }
    return null;
  }

  private displayState(state: number | null, entityConfig: EntityConfig): string {
    // Handle special states first
    if (state === UNKNOWN_STATE) {
      return entityConfig.state_unknown ?? this.config.state_unknown ?? DEFAULTS.state_unknown;
    }
    if (state === UNAVAILABLE_STATE) {
      return entityConfig.state_unavailable ?? this.config.state_unavailable ?? DEFAULTS.state_unavailable;
    }

    // Check if this is a binary value (0, 1, true, false)
    if (this.isBinaryValue(state)) {
      const stateOn = entityConfig.state_on ?? this.config.state_on ?? DEFAULTS.state_on;
      const stateOff = entityConfig.state_off ?? this.config.state_off ?? DEFAULTS.state_off;
      return (state === 1 || state === true) ? stateOn : stateOff;
    }

    // Numeric values
    if (typeof state === 'number') {
      const digits = entityConfig.digits ?? this.config.digits ?? DEFAULTS.digits;
      return state.toFixed(digits) + this.getUnit(entityConfig);
    }

    // Fallback
    return (state ?? 'N/A') + this.getUnit(entityConfig);
  }

  private isBinaryValue(value: number | null): boolean {
    return value === 0 || value === 1;
  }

  private getBinaryColors(entityConfig: EntityConfig): ThresholdConfig[] {
    // Per-entity binary_colors object
    if (entityConfig.binary_colors) {
      return [
        { value: 0, color: entityConfig.binary_colors.off || entityConfig.binary_colors[0] || DEFAULTS.color_off },
        { value: 1, color: entityConfig.binary_colors.on || entityConfig.binary_colors[1] || DEFAULTS.color_on }
      ];
    }

    // Per-entity color_on/color_off
    if (entityConfig.color_on || entityConfig.color_off) {
      return [
        { value: 0, color: entityConfig.color_off || DEFAULTS.color_off },
        { value: 1, color: entityConfig.color_on || DEFAULTS.color_on }
      ];
    }

    // Global binary_colors object
    if (this.config.binary_colors) {
      return [
        { value: 0, color: this.config.binary_colors.off || this.config.binary_colors[0] || DEFAULTS.color_off },
        { value: 1, color: this.config.binary_colors.on || this.config.binary_colors[1] || DEFAULTS.color_on }
      ];
    }

    // Global color_on/color_off
    if (this.config.color_on || this.config.color_off) {
      return [
        { value: 0, color: this.config.color_off || DEFAULTS.color_off },
        { value: 1, color: this.config.color_on || DEFAULTS.color_on }
      ];
    }

    // Default fallback
    return DEFAULT_THRESHOLDS_BOOLEAN;
  }

  private getColorForValue(value: number | null, entityConfig: EntityConfig): string {
    if (value === null || isNaN(value)) return '#666666';

    // Handle special states first
    if (value === UNKNOWN_STATE) {
      return entityConfig.color_unknown ?? this.config.color_unknown ?? DEFAULTS.color_unknown;
    }
    if (value === UNAVAILABLE_STATE) {
      return entityConfig.color_unavailable ?? this.config.color_unavailable ?? DEFAULTS.color_unavailable;
    }

    let thresholds = entityConfig.thresholds ?? this.config.thresholds;

    // Check if this is a binary value and apply binary colors
    if (!thresholds && this.isBinaryValue(value)) {
      thresholds = this.getBinaryColors(entityConfig);
    } else if (!thresholds) {
      thresholds = DEFAULT_THRESHOLDS_NUMERIC;
    }

    const gradient = entityConfig.gradient ?? this.config.gradient ?? DEFAULTS.gradient;
    if (!gradient) {
      let color = thresholds[0].color;
      for (const t of thresholds) {
        if (value >= t.value) {
          color = t.color;
        }
      }
      return color;
    }

    // Gradient mode
    for (let i = 0; i < thresholds.length - 1; i++) {
      const current = thresholds[i];
      const next = thresholds[i + 1];
      if (value >= current.value && value <= next.value) {
        const factor = (next.value - current.value === 0) ? 0 : (value - current.value) / (next.value - current.value);
        return this.interpolateColor(current.color, next.color, factor);
      }
    }
    return value < thresholds[0].value ? thresholds[0].color : thresholds[thresholds.length - 1].color;
  }

  private getUnit(entityConfig: EntityConfig): string {
    const entity = this.hass.states[entityConfig.entity];
    return entityConfig.unit ?? this.config.unit ?? entity?.attributes?.unit_of_measurement ?? '';
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? { r: parseInt(res[1], 16), g: parseInt(res[2], 16), b: parseInt(res[3], 16) } : { r: 0, g: 0, b: 0 };
  }

  private getTimeLabel(index: number, totalIntervals: number, hours: number, startOffset: number = 0): string {
    // Calculate hours ago from "now", accounting for offset
    // With offset=0: rightmost bar is "now" (0h ago), leftmost is "hours" ago
    // With offset=24: rightmost bar is "24h ago", leftmost is "24+hours" ago
    const intervalHoursAgo = (hours * (totalIntervals - index)) / totalIntervals;
    const actualHoursAgo = intervalHoursAgo + startOffset;

    if (hours <= 24) {
      // Show actual timestamps
      const date = new Date(Date.now() - actualHoursAgo * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + (hours / totalIntervals) * 60 * 60 * 1000);

      const locale = this.hass?.locale?.language || this.hass?.language || undefined;
      const timeFormatter = new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit'
      });
      return `${timeFormatter.format(date)} - ${timeFormatter.format(nextDate)}`;
    }
    if (actualHoursAgo < 1) {
      return `${Math.round(actualHoursAgo * 60)}${this.t('minutes_ago')}`;
    }
    return `${actualHoursAgo.toFixed(1)}${this.t('hours_ago')}`;
  }

  private _handleEntityClick(entityId: string, e: Event): void {
    e.stopPropagation();
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId }
    });
    this.dispatchEvent(event);
  }

  private t(key: string): string {
    return (this.translations[this.language]?.[key]) || this.translations.en[key] || key;
  }

  protected render() {
    if (!this.config || !this.hass) {
      return html``;
    }

    return html`
      <div class="card-header">
        <span>${this.config.title}</span>
      </div>
      ${this.config.entities.map(entityConfig => this._renderEntity(entityConfig))}
    `;
  }

  private _renderEntity(entityConfig: string | EntityConfig) {
    const entityObj: EntityConfig = typeof entityConfig === 'string' ? { entity: entityConfig } : entityConfig;
    const entityId = entityObj.entity;
    const entity = this.hass.states[entityId];

    if (!entity) {
      return html`<div class="error">Entity not found: ${entityId}</div>`;
    }

    const name = entityObj.name || entity.attributes.friendly_name || entityId;

    // Resolve icon
    let icon = entity.attributes?.icon;
    if (!icon) {
      const domain = entityId.split('.')[0];
      icon = DEFAULT_DOMAIN_ICONS[domain] || 'mdi:bookmark';
    }

    // Check if icon should be shown
    const showIcons = entityObj.show_icons !== undefined ? entityObj.show_icons : this.config.show_icons;

    // Get offset for this entity
    const startOffset = entityObj.start_offset ?? this.config.start_offset ?? 0;

    // Use composite key to support same entity with different offsets
    const cacheKey = `${entityId}_${startOffset}`;

    // Get history data using composite key
    const historyData = this.processedHistories[cacheKey]?.data || [];

    // For offset entities, don't append current state (it's historical data)
    // For non-offset entities, append current state as the last bar
    const history = startOffset > 0
      ? historyData.map(d => d.value)
      : [...historyData.map(d => d.value), this.parseState(entity.state)];

    const [actualMin, actualMax] = this.getMinMax(history);

    const showLabels = entityObj.show_labels ?? this.config.show_labels;
    const showMinMax = entityObj.show_min_max ?? this.config.show_min_max;
    const showCurrent = entityObj.show_current ?? this.config.show_current;
    const hours = entityObj.hours ?? this.config.hours!;
    const intervals = entityObj.intervals ?? this.config.intervals!;
    const current = this.parseState(entity.state);
    const inlineLayout = entityObj.inline_layout ?? this.config.inline_layout;

    // Calculate label text based on offset
    const startLabelHours = hours + startOffset;
    const endLabelHours = startOffset;
    const startLabel = `${startLabelHours}${this.t('hours_ago')}`;
    const endLabel = startOffset > 0 ? `${endLabelHours}${this.t('hours_ago')}` : this.t('now');

    // Render waterfall bars
    const waterfallBars = html`
      ${history.map((value, index) => {
        const isLast = index === history.length - 1;
        const color = this.getColorForValue(value, entityObj);
        const title = `${this.getTimeLabel(index, intervals, hours, startOffset)} : ${value !== null ? this.displayState(value, entityObj) : this.t('error_loading_data')}`;
        return html`
          <div
            class="bar-segment ${isLast ? 'last-bar' : ''}"
            style="background-color: ${color};"
            title=${title}>
          </div>
        `;
      })}
    `;

    // Inline layout
    if (inlineLayout) {
      return html`
        <div class="entity-inline-container" @click=${(e: Event) => this._handleEntityClick(entityId, e)}>
          <div class="entity-inline-name">
            ${showIcons ? html`<ha-icon class="entity-icon" .icon=${icon}></ha-icon>` : ''}
            <span class="entity-name">${name}</span>
          </div>
          <div class="entity-inline-graph">
            <div class="waterfall-container">
              ${waterfallBars}
            </div>
            ${showLabels ? html`
              <div class="labels">
                <span>${startLabel}</span>
                <span>${endLabel}</span>
              </div>
            ` : ''}
          </div>
          ${showCurrent ? html`<div class="entity-inline-value">${this.displayState(current, entityObj)}</div>` : ''}
        </div>
        ${showMinMax ? html`
          <div class="min-max-label">
            ${this.t('min_label')}: ${this.displayState(actualMin, entityObj)} / ${this.t('max_label')}: ${this.displayState(actualMax, entityObj)}
          </div>
        ` : ''}
      `;
    }

    // Default layout
    return html`
      <div class="entity-container" @click=${(e: Event) => this._handleEntityClick(entityId, e)}>
        <div class="entity-header">
          ${showIcons ? html`<ha-icon class="entity-icon" .icon=${icon}></ha-icon>` : ''}
          <span class="entity-name">${name}</span>
          ${showCurrent ? html`<span class="current-value">${this.displayState(current, entityObj)}</span>` : ''}
        </div>
        <div class="waterfall-container">
          ${waterfallBars}
        </div>
        ${showLabels ? html`
          <div class="labels">
            <span>${startLabel}</span>
            <span>${endLabel}</span>
          </div>
        ` : ''}
        ${showMinMax ? html`
          <div class="min-max-label">
            ${this.t('min_label')}: ${this.displayState(actualMin, entityObj)} / ${this.t('max_label')}: ${this.displayState(actualMax, entityObj)}
          </div>
        ` : ''}
      </div>
    `;
  }

  getCardSize(): number {
    return this.config?.entities?.length * 2 || 2;
  }
}

// Register custom element with guard to prevent duplicate registration
if (!customElements.get('waterfall-history-card')) {
  customElements.define('waterfall-history-card', WaterfallHistoryCard);
}

declare global {
  interface HTMLElementTagNameMap {
    'waterfall-history-card': WaterfallHistoryCard;
  }
}

// Register with Home Assistant card picker
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'waterfall-history-card',
  name: 'Waterfall History Card',
  description: 'A horizontal waterfall display for historical sensor data with visual editor'
});

console.info(
  `%c WATERFALL-HISTORY-CARD %c v4.2.1 `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight; bold; background: dimgray'
);
