import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

const UNKNOWN_STATE = -999;
const UNAVAILABLE_STATE = -998;
const threshold_default_number = [
  { value: 60, color: '#4FC3F7' },  // cold
  { value: 70, color: '#81C784' },  // cool
  { value: 80, color: '#FFB74D' },  // warm
  { value: 100, color: '#FF8A65' }  // hot
];
const threshold_default_boolean = [
  { value: 0, color: '#636363' },  // off
  { value: 1, color: '#EEEEEE' },  // on
];

class WaterfallHistoryCard extends LitElement {
  static properties = {
    hass: { type: Object },
    config: { type: Object },
    processedHistories: { state: true }
  };

  DEFAULT_DOMAIN_ICONS = {
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
    this.config = {};
    this.processedHistories = {};
    this._lastHistoryFetch = {};
    this._historyRefreshInterval = 15 * 60 * 1000; // 15min by default
    this._cardModApplied = false;

    this.translations = {
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

    this.language = 'en';
    this.t = (key) => (this.translations[this.language]?.[key]) || this.translations.en[key] || key;
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error('Please define a list of entities.');
    }

    const globalConfig = {
      title: config.title || this.t('history'),
      hours: config.hours || 24,
      intervals: config.intervals || 48,
      height: config.height || 60,
      min_value: config.min_value || null,
      max_value: config.max_value || null,
      thresholds: config.thresholds || null,
      gradient: config.gradient || false,
      show_current: config.show_current !== false,
      show_labels: config.show_labels !== false,
      show_min_max: config.show_min_max || false,
      show_icons: config.show_icons !== false,
      unit: config.unit || null,
      icon: config.icon || null,
      compact: config.compact || false,
      inline_layout: config.inline_layout || false,
      default_value: config.default_value ?? null,
      digits: typeof config.digits === 'number' ? config.digits : 1,
      card_mod: config.card_mod || {},
      binary_colors: config.binary_colors || null,
      color_on: config.color_on || null,
      color_off: config.color_off || null,
      state_on: config.state_on || 'On',
      state_off: config.state_off || 'Off',
      color_unknown: config.color_unknown || '#FF9800',
      color_unavailable: config.color_unavailable || '#9E9E9E',
      state_unknown: config.state_unknown || 'Unknown',
      state_unavailable: config.state_unavailable || 'INOP',
    };

    this.config = {
      ...globalConfig,
      entities: config.entities.map(entityConfig => {
        if (typeof entityConfig === 'string') {
          return { entity: entityConfig };
        }
        return entityConfig;
      }),
    };

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

  shouldUpdate(changedProps) {
    if (!this.config || !this.hass) {
      return false;
    }

    // Always update if config changed
    if (changedProps.has('config')) {
      return true;
    }

    // Check if any of our tracked entities changed
    if (changedProps.has('hass')) {
      const oldHass = changedProps.get('hass');
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

  _entitiesChanged(oldHass, newHass) {
    if (!oldHass || !newHass) return true;

    return this.config.entities.some(entityConfig => {
      const entityId = entityConfig.entity;
      return oldHass.states[entityId] !== newHass.states[entityId];
    });
  }

  updated(changedProps) {
    if (changedProps.has('hass')) {
      const oldHass = changedProps.get('hass');

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
      customElements.whenDefined("card-mod").then((cardMod) => {
        cardMod.applyToElement(this, "card", this.config.card_mod);
        this._cardModApplied = true;
      }).catch(() => {
        // card-mod not available, ignore
      });
    }
  }

  _checkHistoryRefresh() {
    if (!this.hass || !this.config) return;

    const now = Date.now();
    const entitiesToUpdate = this.config.entities.filter(entityConfig => {
      const entityId = entityConfig.entity;
      const hours = entityConfig.hours ?? this.config.hours;
      const intervals = entityConfig.intervals ?? this.config.intervals;
      const refreshInterval = ((hours / intervals) * 60 * 60 * 1000) / 2;
      return !this._lastHistoryFetch[entityId] || (now - this._lastHistoryFetch[entityId] > refreshInterval);
    });

    if (entitiesToUpdate.length > 0) {
      this.updateCard();
    }
  }

  async updateCard() {
    if (!this.hass || !this.config) return;

    const now = Date.now();

    const entitiesToUpdate = this.config.entities.filter(entityConfig => {
      const entityId = entityConfig.entity;
      const hours = entityConfig.hours ?? this.config.hours;
      const intervals = entityConfig.intervals ?? this.config.intervals;
      const refreshInterval = ((hours / intervals) * 60 * 60 * 1000) / 2;
      return !this._lastHistoryFetch[entityId] || (now - this._lastHistoryFetch[entityId] > refreshInterval);
    });

    if (entitiesToUpdate.length === 0) {
      return;
    }

    const historyPromises = entitiesToUpdate.map(async (entityConfig) => {
      const entityId = entityConfig.entity;
      const hours = entityConfig.hours ?? this.config.hours;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

      try {
        const history = await this.hass.callApi('GET',
          `history/period/${startTime.toISOString()}?filter_entity_id=${entityId}&end_time=${endTime.toISOString()}&significant_changes_only=1&minimal_response&no_attributes&skip_initial_state`
        );
        this._lastHistoryFetch[entityId] = now;
        return { entityId, history: history[0], entityConfig };
      } catch (error) {
        console.error(`Error fetching history for ${entityId}:`, error);
        return { entityId, history: null, entityConfig };
      }
    });

    const results = await Promise.all(historyPromises);

    const processedHistories = { ...this.processedHistories };
    results.forEach(({ entityId, history, entityConfig }) => {
      if (history) {
        const intervals = entityConfig.intervals ?? this.config.intervals;
        const hours = entityConfig.hours ?? this.config.hours;
        const timeStep = (hours * 60 * 60 * 1000) / intervals;
        processedHistories[entityId] = this.processHistoryData(history, intervals, timeStep, entityConfig);
      }
    });
    this.processedHistories = processedHistories;
  }

  processHistoryData(historyData, intervals, timeStep, entityConfig) {
    const defaultValue = entityConfig.default_value ?? this.config.default_value;
    const processed = new Array(intervals).fill(defaultValue);
    const hours = entityConfig.hours ?? this.config.hours;
    const startTime = Date.now() - (hours * 60 * 60 * 1000);

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

    return processed;
  }

  getMinMax(data) {
    let min = Infinity;
    let max = -Infinity;
    data.forEach(d => {
      // Skip null and special sentinel values (unavailable/unknown)
      if (d === null || d === UNKNOWN_STATE || d === UNAVAILABLE_STATE) return;
      if (d > max) max = d;
      if (d < min) min = d;
    });
    return [min, max];
  }

  parseState(state) {
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

  displayState(state, entityConfig) {
    // Handle special states first
    if (state === UNKNOWN_STATE) {
      return entityConfig.state_unknown ?? this.config.state_unknown;
    }
    if (state === UNAVAILABLE_STATE) {
      return entityConfig.state_unavailable ?? this.config.state_unavailable;
    }

    // Check if this is a binary value (0, 1, true, false)
    if (this.isBinaryValue(state)) {
      const stateOn = entityConfig.state_on ?? this.config.state_on;
      const stateOff = entityConfig.state_off ?? this.config.state_off;
      return (state === 1 || state === true) ? stateOn : stateOff;
    }

    // Numeric values
    if (typeof state === 'number') {
      const digits = entityConfig.digits ?? this.config.digits;
      return state.toFixed(digits) + this.getUnit(entityConfig);
    }

    // Fallback
    return (state ?? 'N/A') + this.getUnit(entityConfig);
  }

  isBinaryValue(value) {
    return value === 0 || value === 1 || value === true || value === false;
  }

  getBinaryColors(entityConfig) {
    // Per-entity binary_colors object
    if (entityConfig.binary_colors) {
      return [
        { value: 0, color: entityConfig.binary_colors.off || entityConfig.binary_colors[0] || '#636363' },
        { value: 1, color: entityConfig.binary_colors.on || entityConfig.binary_colors[1] || '#EEEEEE' }
      ];
    }

    // Per-entity color_on/color_off
    if (entityConfig.color_on || entityConfig.color_off) {
      return [
        { value: 0, color: entityConfig.color_off || '#636363' },
        { value: 1, color: entityConfig.color_on || '#EEEEEE' }
      ];
    }

    // Global binary_colors object
    if (this.config.binary_colors) {
      return [
        { value: 0, color: this.config.binary_colors.off || this.config.binary_colors[0] || '#636363' },
        { value: 1, color: this.config.binary_colors.on || this.config.binary_colors[1] || '#EEEEEE' }
      ];
    }

    // Global color_on/color_off
    if (this.config.color_on || this.config.color_off) {
      return [
        { value: 0, color: this.config.color_off || '#636363' },
        { value: 1, color: this.config.color_on || '#EEEEEE' }
      ];
    }

    // Default fallback
    return threshold_default_boolean;
  }

  getColorForValue(value, entityConfig) {
    if (value === null || isNaN(value)) return '#666666';

    // Handle special states first
    if (value === UNKNOWN_STATE) {
      return entityConfig.color_unknown ?? this.config.color_unknown;
    }
    if (value === UNAVAILABLE_STATE) {
      return entityConfig.color_unavailable ?? this.config.color_unavailable;
    }

    let thresholds = entityConfig.thresholds ?? this.config.thresholds;

    // Check if this is a binary value and apply binary colors
    if (!thresholds && this.isBinaryValue(value)) {
      thresholds = this.getBinaryColors(entityConfig);
    } else if (!thresholds) {
      thresholds = threshold_default_number;
    }

    if (typeof value === 'boolean') value = value ? 1 : 0;

    const gradient = entityConfig.gradient ?? this.config.gradient;
    if (!gradient) {
      let color = thresholds[0].color;
      for (const t of thresholds) {
        if (value >= t.value) {
          color = t.color;
        }
      }
      return color;
    }

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

  getUnit(entityConfig) {
    const entity = this.hass.states[entityConfig.entity];
    return entityConfig.unit ?? this.config.unit ?? entity?.attributes?.unit_of_measurement ?? '';
  }

  interpolateColor(color1, color2, factor) {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  hexToRgb(hex) {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? { r: parseInt(res[1], 16), g: parseInt(res[2], 16), b: parseInt(res[3], 16) } : { r: 0, g: 0, b: 0 };
  }

  getTimeLabel(index, totalIntervals, hours) {
    const hoursAgo = (hours * (totalIntervals - index)) / totalIntervals;
    if (hours <= 24) {
      const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + (hours / totalIntervals) * 60 * 60 * 1000);
      return `${date.getHours()}:00 - ${nextDate.getHours()}:00`;
    }
    if (hoursAgo < 1) {
      return `${Math.round(hoursAgo * 60)}${this.t('minutes_ago')}`;
    }
    return `${hoursAgo.toFixed(1)}${this.t('hours_ago')}`;
  }

  _handleEntityClick(entityId, e) {
    e.stopPropagation();
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId }
    });
    this.dispatchEvent(event);
  }

  render() {
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

  _renderEntity(entityConfig) {
    const entityId = entityConfig.entity;
    const entity = this.hass.states[entityId];

    if (!entity) {
      return html`<div class="error">Entity not found: ${entityId}</div>`;
    }

    const name = entityConfig.name || entity.attributes.friendly_name || entityId;

    // Resolve icon
    let icon = entity.attributes?.icon;
    if (!icon) {
      const domain = entityId.split('.')[0];
      icon = this.DEFAULT_DOMAIN_ICONS[domain] || 'mdi:bookmark';
    }

    // Check if icon should be shown
    const showIcons = entityConfig.show_icons !== undefined ? entityConfig.show_icons : this.config.show_icons;

    // Fixed: Use immutable array spreading
    const history = [...(this.processedHistories[entityId] || []), this.parseState(entity.state)];

    const [actualMin, actualMax] = this.getMinMax(history);

    const showLabels = entityConfig.show_labels ?? this.config.show_labels;
    const showMinMax = entityConfig.show_min_max ?? this.config.show_min_max;
    const showCurrent = entityConfig.show_current ?? this.config.show_current;
    const hours = entityConfig.hours ?? this.config.hours;
    const intervals = entityConfig.intervals ?? this.config.intervals;
    const current = this.parseState(entity.state);
    const inlineLayout = entityConfig.inline_layout ?? this.config.inline_layout;

    // Render waterfall bars
    const waterfallBars = html`
      ${history.map((value, index) => {
        const isLast = index === history.length - 1;
        const color = this.getColorForValue(value, entityConfig);
        const title = `${this.getTimeLabel(index, intervals, hours)} : ${value !== null ? this.displayState(value, entityConfig) : this.t('error_loading_data')}`;
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
        <div class="entity-inline-container" @click=${(e) => this._handleEntityClick(entityId, e)}>
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
                <span>${hours}${this.t('hours_ago')}</span>
                <span>${this.t('now')}</span>
              </div>
            ` : ''}
          </div>
          ${showCurrent ? html`<div class="entity-inline-value">${this.displayState(current, entityConfig)}</div>` : ''}
        </div>
        ${showMinMax ? html`
          <div class="min-max-label">
            ${this.t('min_label')}: ${this.displayState(actualMin, entityConfig)} / ${this.t('max_label')}: ${this.displayState(actualMax, entityConfig)}
          </div>
        ` : ''}
      `;
    }

    // Default layout
    return html`
      <div class="entity-container" @click=${(e) => this._handleEntityClick(entityId, e)}>
        <div class="entity-header">
          ${showIcons ? html`<ha-icon class="entity-icon" .icon=${icon}></ha-icon>` : ''}
          <span class="entity-name">${name}</span>
          ${showCurrent ? html`<span class="current-value">${this.displayState(current, entityConfig)}</span>` : ''}
        </div>
        <div class="waterfall-container">
          ${waterfallBars}
        </div>
        ${showLabels ? html`
          <div class="labels">
            <span>${hours}${this.t('hours_ago')}</span>
            <span>${this.t('now')}</span>
          </div>
        ` : ''}
        ${showMinMax ? html`
          <div class="min-max-label">
            ${this.t('min_label')}: ${this.displayState(actualMin, entityConfig)} / ${this.t('max_label')}: ${this.displayState(actualMax, entityConfig)}
          </div>
        ` : ''}
      </div>
    `;
  }

  getCardSize() {
    return this.config?.entities?.length * 2 || 2;
  }

  static getStubConfig() {
    return {
      title: 'Temperature History',
      hours: 24,
      show_min_max: true,
      entities: [
        {
          entity: 'sensor.outdoor_temperature',
          name: 'Outside',
          show_min_max: false,
        },
        {
          entity: 'sensor.indoor_temperature',
          name: 'Inside (48h)',
          hours: 48,
          show_labels: false,
        },
        {
          entity: 'sensor.attic_temperature',
          name: 'Attic',
        },
      ],
    };
  }
}

customElements.define('waterfall-history-card', WaterfallHistoryCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'waterfall-history-card',
  name: 'Waterfall History Card',
  description: 'A horizontal waterfall display for historical sensor data'
});

console.info(
  `%c WATERFALL-HISTORY-CARD %c v3.2 `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight; bold; background: dimgray'
);
