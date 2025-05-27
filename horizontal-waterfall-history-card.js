/**
 * HorizontalWaterfallHistoryCard - A custom Home Assistant card for horizontal waterfall visualization of entity history.
 * @author sxdjt
 * @version 0.3
 */

class HorizontalWaterfallHistoryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    /** @type {Record<string, Record<string, string>>} */
    this.translations = {
      en: {
        history: 'Horizontal Waterfall History',
        error_loading_data: 'Error loading historical data',
        min_label: 'Min',
        max_label: 'Max',
        hours_ago: 'h ago',
        minutes_ago: 'm ago',
        now: 'Now',
      },
      fr: {
        history: 'Historique en cascade horizontal',
        error_loading_data: 'Erreur lors du chargement des données historiques',
        min_label: 'Min',
        max_label: 'Max',
        hours_ago: 'h',
        minutes_ago: 'min',
        now: 'Maintenant',
      }
    };

    this.language = 'en'; // Default language (can be overridden by Home Assistant)
  }

  t(key) {
    return (this.translations[this.language] && this.translations[this.language][key]) || this.translations.en[key] || key;
  }

  escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error(this.t('error_loading_data'));
    }
    this.config = {
      entity: config.entity,
      title: config.title || this.t('history'),
      hours: config.hours || 24,
      intervals: config.intervals || 48,
      height: config.height || 60,
      min_value: config.min_value || null,
      max_value: config.max_value || null,
      thresholds: Array.isArray(config.thresholds) && config.thresholds.length
        ? config.thresholds
        : [
            { value: 60, color: '#4FC3F7' },
            { value: 70, color: '#81C784' },
            { value: 80, color: '#FFB74D' },
            { value: 100, color: '#FF8A65' }
          ],
      gradient: !!config.gradient,
      show_current: config.show_current !== false,
      show_labels: config.show_labels !== false,
      show_min_max: config.show_min_max || false,
      unit: config.unit || null
    };
    // Validate thresholds
    if (!Array.isArray(this.config.thresholds) || !this.config.thresholds.every(t => typeof t.value === "number" && typeof t.color === "string")) {
      throw new Error("Invalid thresholds configuration.");
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (hass.language) {
      this.language = hass.language.split('-')[0];
    }
    this.updateCard();
  }

  async updateCard() {
    if (!this._hass || !this.config) return;

    const entity = this._hass.states[this.config.entity];
    if (!entity) return;

    const endTime = new Date();
    const startTime = new Date(endTime - this.config.hours * 60 * 60 * 1000);

    try {
      const history = await this._hass.callApi('GET',
        `history/period/${startTime.toISOString()}?filter_entity_id=${encodeURIComponent(this.config.entity)}&end_time=${endTime.toISOString()}`
      );
      if (history && history[0]) {
        this.renderCard(history[0], entity);
      } else {
        this.renderCard([], entity); // Handle no history
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      this.renderError();
    }
  }

  renderCard(historyData, currentEntity) {
    const current = parseFloat(currentEntity.state);
    const intervals = this.config.intervals;
    const timeStep = (this.config.hours * 60 * 60 * 1000) / intervals;

    const processedData = this.processHistoryData(historyData, intervals, timeStep);
    processedData.push(current);

    const minValForScale = this.config.min_value ?? Math.min(...processedData.filter(v => v !== null));
    const maxValForScale = this.config.max_value ?? Math.max(...processedData.filter(v => v !== null));

    const actualMin = Math.min(...processedData.filter(v => v !== null));
    const actualMax = Math.max(...processedData.filter(v => v !== null));

    // Clear shadowRoot and build content safely
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(this.createStyles());

    const card = document.createElement('div');
    card.className = "card-content";
    card.appendChild(this.createHeader(current));
    card.appendChild(this.createWaterfall(processedData, intervals));
    if (this.config.show_labels) card.appendChild(this.createLabels());
    if (this.config.show_min_max) card.appendChild(this.createMinMaxLabel(actualMin, actualMax));
    this.shadowRoot.appendChild(card);

    // Set pointer cursor and click event
    this.shadowRoot.host.style.cursor = 'pointer';
    this.shadowRoot.host.addEventListener('click', () => this.openMoreInfo(), { once: true });
  }

  createHeader(current) {
    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('span');
    title.textContent = this.config.title;
    header.appendChild(title);

    if (this.config.show_current) {
      const currentValue = document.createElement('span');
      currentValue.className = 'current-value';
      currentValue.textContent = `${current}${this.unit}`;
      header.appendChild(currentValue);
    }
    return header;
  }

  createWaterfall(processedData, intervals) {
    const container = document.createElement('div');
    container.className = 'waterfall-container';
    container.style.height = `${this.config.height}px`;

    processedData.forEach((value, index) => {
      const bar = document.createElement('div');
      bar.className = 'bar-segment';
      bar.style.backgroundColor = this.getColorForValue(value);
      bar.title = value !== null
        ? `${this.escapeHtml(value.toFixed(1))}${this.escapeHtml(this.unit)} - ${this.escapeHtml(this.getTimeLabel(index, intervals))}`
        : this.t('error_loading_data');
      container.appendChild(bar);
    });

    const gradientOverlay = document.createElement('div');
    gradientOverlay.className = 'gradient-overlay';
    container.appendChild(gradientOverlay);

    return container;
  }

  createLabels() {
    const labels = document.createElement('div');
    labels.className = 'labels';
    const left = document.createElement('span');
    left.className = 'time-label';
    left.textContent = `${this.config.hours}${this.t('hours_ago')}`;
    const right = document.createElement('span');
    right.className = 'time-label';
    right.textContent = this.t('now');
    labels.appendChild(left);
    labels.appendChild(right);
    return labels;
  }

  createMinMaxLabel(actualMin, actualMax) {
    const label = document.createElement('div');
    label.className = 'min-max-label';
    label.textContent = `${this.t('min_label')}: ${actualMin.toFixed(1)}${this.unit} - ${this.t('max_label')}: ${actualMax.toFixed(1)}${this.unit}`;
    return label;
  }

  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        background: var(--card-background-color, white);
        border-radius: var(--border-radius, 4px);
        box-shadow: var(--box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        padding: 16px;
        font-family: var(--primary-font-family, sans-serif);
        cursor: pointer;
      }
      .card-header {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
        color: var(--primary-text-color, black);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .current-value {
        font-size: 18px;
        font-weight: bold;
        color: var(--primary-text-color, black);
      }
      .waterfall-container {
        position: relative;
        height: ${this.config.height}px;
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        margin: 8px 0;
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
      .bar-segment:hover {
        opacity: 0.8;
        transform: scaleY(1.05);
      }
      .labels {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--secondary-text-color, gray);
        margin-top: 4px;
      }
      .time-label {
        opacity: 0.7;
      }
      .min-max-label {
        font-size: 11px;
        color: var(--secondary-text-color, gray);
        margin-top: 4px;
        text-align: center;
      }
      .gradient-overlay {
        position: absolute;
        top: 0;
        right: 0;
        width: 20px;
        height: 100%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.3));
        pointer-events: none;
      }
    `;
    return style;
  }

  processHistoryData(historyData, intervals, timeStep) {
    const processed = new Array(intervals).fill(null);
    const now = Date.now();
    const startTime = now - (this.config.hours * 60 * 60 * 1000);

    historyData.forEach(point => {
      const pointTime = new Date(point.last_changed || point.last_updated).getTime();
      const timeDiff = pointTime - startTime;

      if (timeDiff >= 0) {
        const bucketIndex = Math.floor(timeDiff / timeStep);
        if (bucketIndex >= 0 && bucketIndex < intervals) {
          const value = parseFloat(point.state);
          if (!isNaN(value)) {
            processed[bucketIndex] = value;
          }
        }
      }
    });

    for (let i = 1; i < processed.length; i++) {
      if (processed[i] === null && processed[i - 1] !== null) {
        processed[i] = processed[i - 1];
      }
    }

    return processed;
  }

  getColorForValue(value) {
    if (value === null) return '#666666';

    const thresholds = this.config.thresholds;
    if (!thresholds || thresholds.length === 0) return '#666666';

    if (!this.config.gradient) {
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (value >= thresholds[i].value) {
          return thresholds[i].color;
        }
      }
      return thresholds[0].color;
    }

    for (let i = 0; i < thresholds.length - 1; i++) {
      const current = thresholds[i];
      const next = thresholds[i + 1];
      if (value >= current.value && value <= next.value) {
        const factor = (value - current.value) / (next.value - current.value);
        return this.interpolateColor(current.color, next.color, factor);
      }
    }
    if (value < thresholds[0].value) {
      return thresholds[0].color;
    }
    return thresholds[thresholds.length - 1].color;
  }

  get unit() {
    const entity = this._hass?.states?.[this.config.entity];
    return this.config.unit ?? entity?.attributes?.unit_of_measurement ?? '';
  }

  interpolateColor(color1, color2, factor) {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    const result = {
      r: Math.round(c1.r + (c2.r - c1.r) * factor),
      g: Math.round(c1.g + (c2.g - c1.g) * factor),
      b: Math.round(c1.b + (c2.b - c1.b) * factor),
    };
    return `rgb(${result.r}, ${result.g}, ${result.b})`;
  }

  hexToRgb(hex) {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? {
      r: parseInt(res[1], 16),
      g: parseInt(res[2], 16),
      b: parseInt(res[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  getTimeLabel(index, totalIntervals) {
    const hoursAgo = (this.config.hours * (totalIntervals - index)) / totalIntervals;
    if (hoursAgo < 1) {
      return `${Math.round(hoursAgo * 60)}${this.t('minutes_ago')}`;
    }
    return `${hoursAgo.toFixed(1)}${this.t('hours_ago')}`;
  }

  openMoreInfo() {
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this.config.entity }
    });
    this.dispatchEvent(event);
  }

  renderError() {
    this.shadowRoot.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        background: var(--card-background-color, white);
        border-radius: var(--border-radius, 4px);
        box-shadow: var(--box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        padding: 16px;
        font-family: var(--primary-font-family, sans-serif);
      }
      .error {
        color: var(--error-color, red);
        text-align: center;
      }
    `;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = this.t('error_loading_data');
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(errorDiv);
  }

  getCardSize() {
    return 2;
  }

  static getConfigElement() {
    return document.createElement('horizontal-waterfall-history-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'sensor.temperature',
      title: 'Horizontal Waterfall History',
      hours: 24,
      intervals: 48,
      show_min_max: true,
      gradient: false,
      thresholds: [
        { value: 60, color: '#4FC3F7' },
        { value: 70, color: '#81C784' },
        { value: 80, color: '#FFB74D' },
        { value: 100, color: '#FF8A65' }
      ]
    };
  }
}

customElements.define('waterfall-history-card', HorizontalWaterfallHistoryCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'waterfall-history-card',
  name: 'Horizontal Waterfall History Card',
  description: 'A horizontal waterfall display for historical sensor data'
});

console.info(
  `%c HORIZONTAL-WATERFALL-HISTORY-CARD %c v0.3 `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);
