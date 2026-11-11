import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';
import { WaterfallHistoryCardConfig, EntityConfig } from './types';
import { DEFAULTS } from './constants';

export class WaterfallHistoryCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: WaterfallHistoryCardConfig;

  public setConfig(config: WaterfallHistoryCardConfig): void {
    this._config = config;
  }

  // Global configuration change handler
  private _configValueChanged(key: string, value: any): void {
    if (!this._config || !this.hass) return;

    const newConfig = { ...this._config, [key]: value };
    fireEvent(this, 'config-changed', { config: newConfig });
  }

  // Move keyboard focus to a control that survives re-render (the list's Add button),
  // so focus is not lost to <body> when the row holding the clicked Remove button disappears
  private _focusControl(key: string): void {
    this.shadowRoot?.querySelector<HTMLElement>(`[data-focus-key="${key}"]`)?.focus();
  }

  private _isValidColor(value: string): boolean {
    return !!value && CSS.supports('color', value);
  }

  // Entity management methods
  private _addEntity(): void {
    const newConfig = { ...this._config };

    if (!newConfig.entities) {
      newConfig.entities = [];
    }

    newConfig.entities = [...newConfig.entities, { entity: '' }];
    fireEvent(this, 'config-changed', { config: newConfig });
  }

  private _removeEntity(index: number): void {
    const newConfig = { ...this._config };
    newConfig.entities = [...newConfig.entities];
    newConfig.entities.splice(index, 1);

    fireEvent(this, 'config-changed', { config: newConfig });
    this._focusControl('add-entity');
  }

  private _entityChanged(index: number, key: keyof EntityConfig, value: any): void {
    const newConfig = { ...this._config };
    newConfig.entities = [...newConfig.entities];

    // Normalize string entities to objects
    const currentEntity = newConfig.entities[index];
    const entityConfig = typeof currentEntity === 'string'
      ? { entity: currentEntity }
      : { ...currentEntity };

    // Update the specific key
    (entityConfig as any)[key] = value;
    newConfig.entities[index] = entityConfig;

    fireEvent(this, 'config-changed', { config: newConfig });
  }

  // Global threshold management
  private _addThreshold(): void {
    const newConfig = { ...this._config };

    if (!newConfig.thresholds) {
      newConfig.thresholds = [];
    }

    newConfig.thresholds = [...newConfig.thresholds, { value: 0, color: '#cccccc' }];
    fireEvent(this, 'config-changed', { config: newConfig });
  }

  private _removeThreshold(index: number): void {
    const newConfig = { ...this._config };
    if (!newConfig.thresholds) return;

    newConfig.thresholds = [...newConfig.thresholds];
    newConfig.thresholds.splice(index, 1);

    fireEvent(this, 'config-changed', { config: newConfig });
    this._focusControl('add-threshold');
  }

  private _thresholdChanged(index: number, key: 'value' | 'color', value: any): void {
    const newConfig = { ...this._config };
    if (!newConfig.thresholds) return;

    newConfig.thresholds = [...newConfig.thresholds];
    newConfig.thresholds[index] = {
      ...newConfig.thresholds[index],
      [key]: key === 'value' ? Number(value) : value
    };

    fireEvent(this, 'config-changed', { config: newConfig });
  }

  // Global state_colors management
  private _addStateColor(): void {
    const entries = Object.entries(this._config.state_colors || {});
    entries.push(['', '#cccccc']);
    this._configValueChanged('state_colors', Object.fromEntries(entries));
  }

  private _removeStateColor(index: number): void {
    const entries = Object.entries(this._config.state_colors || {});
    entries.splice(index, 1);
    this._configValueChanged('state_colors', entries.length > 0 ? Object.fromEntries(entries) : undefined);
    this._focusControl('add-state-color');
  }

  private _stateColorChanged(index: number, key: 'state' | 'color', value: string): void {
    const entries = Object.entries(this._config.state_colors || {});
    if (key === 'state') {
      entries[index] = [value, entries[index][1]];
    } else {
      entries[index] = [entries[index][0], value];
    }
    this._configValueChanged('state_colors', Object.fromEntries(entries));
  }

  // Per-entity state_colors management
  private _addEntityStateColor(entityIndex: number): void {
    const newConfig = { ...this._config };
    newConfig.entities = [...newConfig.entities];
    const currentEntity = newConfig.entities[entityIndex];
    const entityConfig = typeof currentEntity === 'string' ? { entity: currentEntity } : { ...currentEntity };
    const entries = Object.entries((entityConfig as any).state_colors || {});
    entries.push(['', '#cccccc']);
    (entityConfig as any).state_colors = Object.fromEntries(entries);
    newConfig.entities[entityIndex] = entityConfig;
    fireEvent(this, 'config-changed', { config: newConfig });
  }

  private _removeEntityStateColor(entityIndex: number, stateIndex: number): void {
    const newConfig = { ...this._config };
    newConfig.entities = [...newConfig.entities];
    const currentEntity = newConfig.entities[entityIndex];
    const entityConfig = typeof currentEntity === 'string' ? { entity: currentEntity } : { ...currentEntity };
    const entries = Object.entries((entityConfig as any).state_colors || {});
    entries.splice(stateIndex, 1);
    (entityConfig as any).state_colors = entries.length > 0 ? Object.fromEntries(entries) : undefined;
    newConfig.entities[entityIndex] = entityConfig;
    fireEvent(this, 'config-changed', { config: newConfig });
    this._focusControl(`add-entity-state-color-${entityIndex}`);
  }

  private _entityStateColorChanged(entityIndex: number, stateIndex: number, key: 'state' | 'color', value: string): void {
    const newConfig = { ...this._config };
    newConfig.entities = [...newConfig.entities];
    const currentEntity = newConfig.entities[entityIndex];
    const entityConfig = typeof currentEntity === 'string' ? { entity: currentEntity } : { ...currentEntity };
    const entries = Object.entries((entityConfig as any).state_colors || {});
    if (key === 'state') {
      entries[stateIndex] = [value, entries[stateIndex][1]];
    } else {
      entries[stateIndex] = [entries[stateIndex][0], value];
    }
    (entityConfig as any).state_colors = Object.fromEntries(entries);
    newConfig.entities[entityIndex] = entityConfig;
    fireEvent(this, 'config-changed', { config: newConfig });
  }

  // Per-entity threshold management
  private _addEntityThreshold(entityIndex: number): void {
    const newConfig = { ...this._config };
    newConfig.entities = [...newConfig.entities];

    const currentEntity = newConfig.entities[entityIndex];
    const entityConfig = typeof currentEntity === 'string'
      ? { entity: currentEntity }
      : { ...currentEntity };

    if (!entityConfig.thresholds) {
      entityConfig.thresholds = [];
    }

    entityConfig.thresholds = [...entityConfig.thresholds, { value: 0, color: '#cccccc' }];
    newConfig.entities[entityIndex] = entityConfig;

    fireEvent(this, 'config-changed', { config: newConfig });
  }

  private _removeEntityThreshold(entityIndex: number, thresholdIndex: number): void {
    const newConfig = { ...this._config };
    newConfig.entities = [...newConfig.entities];

    const currentEntity = newConfig.entities[entityIndex];
    const entityConfig = typeof currentEntity === 'string'
      ? { entity: currentEntity }
      : { ...currentEntity };

    if (!entityConfig.thresholds) return;

    entityConfig.thresholds = [...entityConfig.thresholds];
    entityConfig.thresholds.splice(thresholdIndex, 1);
    newConfig.entities[entityIndex] = entityConfig;

    fireEvent(this, 'config-changed', { config: newConfig });
    this._focusControl(`add-entity-threshold-${entityIndex}`);
  }

  private _entityThresholdChanged(entityIndex: number, thresholdIndex: number, key: 'value' | 'color', value: any): void {
    const newConfig = { ...this._config };
    newConfig.entities = [...newConfig.entities];

    const currentEntity = newConfig.entities[entityIndex];
    const entityConfig = typeof currentEntity === 'string'
      ? { entity: currentEntity }
      : { ...currentEntity };

    if (!entityConfig.thresholds) return;

    entityConfig.thresholds = [...entityConfig.thresholds];
    entityConfig.thresholds[thresholdIndex] = {
      ...entityConfig.thresholds[thresholdIndex],
      [key]: key === 'value' ? Number(value) : value
    };
    newConfig.entities[entityIndex] = entityConfig;

    fireEvent(this, 'config-changed', { config: newConfig });
  }

  // Switch row with a visible label; aria-label gives the switch its accessible name,
  // since a <label> outside ha-switch's shadow root cannot be associated with it
  private _renderToggle(label: string, checked: boolean, onChange: (checked: boolean) => void) {
    return html`
      <div class="toggle-row">
        <span>${label}</span>
        <ha-switch
          aria-label=${label}
          .checked=${checked}
          @change=${(ev: Event) => onChange((ev.target as HTMLInputElement).checked)}
        ></ha-switch>
      </div>
    `;
  }

  // Color text input with accessible name and inline error for invalid colors
  private _renderColorInput(color: string, label: string, errorId: string, onInput: (value: string) => void) {
    const invalid = !this._isValidColor(color);
    return html`
      <div>
        <input
          type="text"
          class="row-input"
          placeholder="e.g., #FF0000"
          aria-label=${label}
          aria-invalid=${invalid ? 'true' : 'false'}
          aria-describedby=${invalid ? errorId : nothing}
          .value=${color}
          @input=${(ev: Event) => onInput((ev.target as HTMLInputElement).value)}
        >
        ${invalid ? html`
          <p id=${errorId} class="error-text">
            <ha-icon icon="mdi:alert-circle" aria-hidden="true"></ha-icon>
            <span><strong>Error:</strong> ${label} is not a valid color. Use a hex code (#FF0000), a color name (red), or var(--token).</span>
          </p>
        ` : ''}
      </div>
    `;
  }

  protected render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    return html`
      <div class="card-config">
        ${this._renderBasicSettings()}
        ${this._renderDisplayOptions()}
        ${this._renderBinaryStateConfig()}
        ${this._renderGlobalThresholds()}
        ${this._renderEntities()}
      </div>
    `;
  }

  // Section 1: Basic Settings
  private _renderBasicSettings() {
    return html`
      <div class="section">
        <h3>Basic Settings</h3>

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .label=${'Card Title'}
          .value=${this._config.title || DEFAULTS.title}
          .selector=${{text: {}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('title', ev.detail.value)}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .label=${'Time Window (hours)'}
          .value=${this._config.hours || DEFAULTS.hours}
          .selector=${{number: {min: 1, max: 168, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('hours', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .label=${'Intervals'}
          .value=${this._config.intervals || DEFAULTS.intervals}
          .selector=${{number: {min: 24, max: 96, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('intervals', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .label=${'Bar Height (pixels)'}
          .value=${this._config.height || DEFAULTS.height}
          .selector=${{number: {min: 30, max: 200, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('height', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .label=${'Decimal Places'}
          .value=${this._config.digits ?? DEFAULTS.digits}
          .selector=${{number: {min: 0, max: 5, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('digits', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .selector=${{
            select: {
              options: [
                { value: 'last', label: 'Last (default) - use final value in each interval' },
                { value: 'min', label: 'Minimum - show lowest value (reveals brief dips)' },
                { value: 'max', label: 'Maximum - show highest value (reveals brief spikes/activations)' },
              ]
            }
          }}
          .value=${this._config.interval_value || DEFAULTS.interval_value}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('interval_value', ev.detail.value)}
          .label=${'Interval Value'}
        ></ha-selector>
      </div>
    `;
  }

  // Section 2: Display Options
  private _renderDisplayOptions() {
    return html`
      <div class="section">
        <h3>Display Options</h3>

        ${this._renderToggle('Show Icons', this._config.show_icons !== false, (checked) =>
          this._configValueChanged('show_icons', checked))}

        ${this._renderToggle('Show Labels', this._config.show_labels !== false, (checked) =>
          this._configValueChanged('show_labels', checked))}

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .label=${'Label Count'}
          .value=${this._config.label_count ?? DEFAULTS.label_count}
          .selector=${{number: {min: 1, max: 168, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('label_count', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .label=${'Label Format'}
          .selector=${{
            select: {
              options: [
                { value: 'relative', label: 'Relative (e.g. 24h ago, Now)' },
                { value: '24h', label: '24-hour time (e.g. 14:30)' },
                { value: '12h', label: '12-hour time (e.g. 2:30 PM)' },
              ]
            }
          }}
          .value=${this._config.label_format || DEFAULTS.label_format}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('label_format', ev.detail.value)}
        ></ha-selector>

        ${this._renderToggle('Show Current Value', this._config.show_current !== false, (checked) =>
          this._configValueChanged('show_current', checked))}

        ${this._renderToggle('Show Min/Max', this._config.show_min_max || false, (checked) =>
          this._configValueChanged('show_min_max', checked))}

        ${this._renderToggle('Compact Mode', this._config.compact || false, (checked) =>
          this._configValueChanged('compact', checked))}

        ${this._renderToggle('Inline Layout', this._config.inline_layout || false, (checked) =>
          this._configValueChanged('inline_layout', checked))}

        ${this._renderToggle('Gradient Mode', this._config.gradient || false, (checked) =>
          this._configValueChanged('gradient', checked))}

        <ha-selector
          .hass=${this.hass}
          .required=${false}
          .label=${'Cell Gap (pixels)'}
          .value=${this._config.cell_gap ?? DEFAULTS.cell_gap}
          .selector=${{number: {min: 0, max: 10, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('cell_gap', Number(ev.detail.value))}
        ></ha-selector>
      </div>
    `;
  }

  // Section 3: Binary State Configuration
  private _renderBinaryStateConfig() {
    return html`
      <ha-expansion-panel header="Binary State Configuration (Advanced)" .expanded=${false}>
        <div class="section">
          <p class="helper-text">
            Configure colors and labels for binary sensors (on/off states).
          </p>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'On State Color'}
            .value=${this._config.color_on || DEFAULTS.color_on}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('color_on', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Off State Color'}
            .value=${this._config.color_off || DEFAULTS.color_off}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('color_off', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'On State Label'}
            .value=${this._config.state_on || DEFAULTS.state_on}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('state_on', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Off State Label'}
            .value=${this._config.state_off || DEFAULTS.state_off}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('state_off', ev.detail.value)}
          ></ha-selector>

          <h4>Unknown & Unavailable States</h4>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Unknown State Color'}
            .value=${this._config.color_unknown || DEFAULTS.color_unknown}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('color_unknown', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Unknown State Label'}
            .value=${this._config.state_unknown || DEFAULTS.state_unknown}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('state_unknown', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Unavailable State Color'}
            .value=${this._config.color_unavailable || DEFAULTS.color_unavailable}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('color_unavailable', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Unavailable State Label'}
            .value=${this._config.state_unavailable || DEFAULTS.state_unavailable}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('state_unavailable', ev.detail.value)}
          ></ha-selector>

          ${this._renderGlobalStateColors()}
        </div>
      </ha-expansion-panel>
    `;
  }

  // Section 4: Global Thresholds
  private _renderGlobalThresholds() {
    const thresholds = this._config.thresholds || [];

    return html`
      <ha-expansion-panel header="Global Thresholds (Advanced)" .expanded=${false}>
        <div class="section">
          <p class="helper-text">
            Define color thresholds for numeric sensors. Colors apply when value is greater than or equal to the threshold value.
            These thresholds apply to all entities unless overridden per-entity.
          </p>

          ${thresholds.length === 0 ? html`
            <p class="info-text">No thresholds defined. Using default temperature-based thresholds.</p>
          ` : ''}

          ${thresholds.map((threshold, index) => html`
            <div class="threshold-item">
              <input
                type="number"
                class="row-input"
                aria-label="Threshold ${index + 1} value"
                .value=${String(threshold.value)}
                @change=${(ev: Event) =>
                  this._thresholdChanged(index, 'value', (ev.target as HTMLInputElement).value)}
              >
              ${this._renderColorInput(threshold.color, `Threshold ${index + 1} color`,
                `threshold-color-error-${index}`, (value) =>
                  this._thresholdChanged(index, 'color', value))}
              <ha-button appearance="plain" variant="danger" @click=${() => this._removeThreshold(index)}>
                Remove<span class="visually-hidden"> threshold ${index + 1}</span>
              </ha-button>
            </div>
          `)}

          <ha-button data-focus-key="add-threshold" @click=${this._addThreshold}>
            Add Threshold
          </ha-button>
        </div>
      </ha-expansion-panel>
    `;
  }

  // Section 5: Entity Management
  private _renderEntities() {
    const entities = this._config.entities || [];

    return html`
      <div class="section">
        <h3>Entities</h3>
        <p class="helper-text">
          Add entities to display in the card. Each entity can override global settings.
        </p>

        ${entities.length === 0 ? html`
          <p class="info-text">No entities configured. Add at least one entity.</p>
        ` : ''}

        ${entities.map((entity, index) => this._renderEntityConfig(entity, index))}

        <ha-button data-focus-key="add-entity" @click=${this._addEntity}>
          Add Entity
        </ha-button>
      </div>
    `;
  }

  private _renderEntityConfig(entity: string | EntityConfig, index: number) {
    const entityConfig = typeof entity === 'string' ? { entity } : entity;
    const entityId = entityConfig.entity;
    const displayName = entityConfig.name || entityId || `Entity ${index + 1}`;

    return html`
      <ha-expansion-panel
        header="${displayName}"
        .expanded=${false}>
        <div class="entity-config">
          <div class="entity-header-row">
            <ha-button appearance="plain" variant="danger" @click=${() => this._removeEntity(index)}>
              Remove Entity<span class="visually-hidden"> ${displayName}</span>
            </ha-button>
          </div>

          <ha-selector
            .hass=${this.hass}
            .required=${true}
            .selector=${{ entity: {} }}
            .value=${entityId}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'entity', ev.detail.value)}
            .label=${'Entity'}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Custom Name (optional)'}
            .value=${entityConfig.name || ''}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'name', ev.detail.value)}
          ></ha-selector>

          ${this._renderEntityAdvancedOptions(entityConfig, index)}
        </div>
      </ha-expansion-panel>
    `;
  }

  private _renderEntityAdvancedOptions(entityConfig: EntityConfig, index: number) {
    return html`
      <ha-expansion-panel header="Advanced Overrides (Optional)" .expanded=${false}>
        <div class="entity-overrides">
          <p class="helper-text">
            Override global settings for this entity only. Leave blank to use global values.
          </p>

          <h4>Time Window Overrides</h4>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Hours (override)'}
            .value=${entityConfig.hours || ''}
            .selector=${{number: {min: 1, max: 168, mode: 'box', step: 1}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'hours', ev.detail.value ? Number(ev.detail.value) : undefined)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Intervals (override)'}
            .value=${entityConfig.intervals || ''}
            .selector=${{number: {min: 24, max: 96, mode: 'box', step: 1}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'intervals', ev.detail.value ? Number(ev.detail.value) : undefined)}
          ></ha-selector>

          <h4>Display Overrides</h4>

          ${this._renderToggle('Show Icons (override)', entityConfig.show_icons ?? true, (checked) =>
            this._entityChanged(index, 'show_icons', checked))}

          ${this._renderToggle('Show Labels (override)', entityConfig.show_labels ?? true, (checked) =>
            this._entityChanged(index, 'show_labels', checked))}

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Label Count (override)'}
            .value=${entityConfig.label_count || ''}
            .selector=${{number: {min: 1, max: 168, mode: 'box', step: 1}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'label_count', ev.detail.value ? Number(ev.detail.value) : undefined)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Label Format (override)'}
            .selector=${{
              select: {
                options: [
                  { value: 'relative', label: 'Relative (e.g. 24h ago, Now)' },
                  { value: '24h', label: '24-hour time (e.g. 14:30)' },
                  { value: '12h', label: '12-hour time (e.g. 2:30 PM)' },
                ]
              }
            }}
            .value=${entityConfig.label_format || ''}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'label_format', ev.detail.value || undefined)}
          ></ha-selector>

          ${this._renderToggle('Show Current (override)', entityConfig.show_current ?? true, (checked) =>
            this._entityChanged(index, 'show_current', checked))}

          ${this._renderToggle('Inline Layout (override)', entityConfig.inline_layout ?? false, (checked) =>
            this._entityChanged(index, 'inline_layout', checked))}

          <h4>Styling Overrides</h4>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Custom Icon'}
            .value=${entityConfig.icon || ''}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'icon', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Custom Unit'}
            .value=${entityConfig.unit || ''}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'unit', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Decimal Places (override)'}
            .value=${entityConfig.digits ?? ''}
            .selector=${{number: {min: 0, max: 5, mode: 'box', step: 1}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'digits', ev.detail.value ? Number(ev.detail.value) : undefined)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .selector=${{
              select: {
                options: [
                  { value: 'last', label: 'Last (default)' },
                  { value: 'min', label: 'Minimum (show lowest value per interval)' },
                  { value: 'max', label: 'Maximum (show highest value per interval)' },
                ]
              }
            }}
            .value=${(entityConfig as any).interval_value || ''}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'interval_value' as any, ev.detail.value || undefined)}
            .label=${'Interval Value (override)'}
          ></ha-selector>

          <h4>Binary State Overrides</h4>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'On State Color (override)'}
            .value=${entityConfig.color_on || ''}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'color_on', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .required=${false}
            .label=${'Off State Color (override)'}
            .value=${entityConfig.color_off || ''}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'color_off', ev.detail.value)}
          ></ha-selector>

          ${this._renderEntityStateColors(entityConfig, index)}
          ${this._renderEntityThresholds(entityConfig, index)}
        </div>
      </ha-expansion-panel>
    `;
  }

  private _renderGlobalStateColors() {
    const entries = Object.entries(this._config.state_colors || {});

    return html`
      <div class="entity-thresholds">
        <h4>Multi-State Colors (Global)</h4>
        <p class="helper-text">
          Map HA state strings to colors for multi-state entities (e.g. HVAC modes).
          Add one row per state in the order they should appear. The state name must
          match the HA state value exactly (case-insensitive).
        </p>

        ${entries.length === 0 ? html`
          <p class="info-text">No state colors defined.</p>
        ` : ''}

        ${entries.map(([stateName, color], index) => html`
          <div class="threshold-item">
            <input
              type="text"
              class="row-input"
              placeholder="State name (e.g. cool)"
              aria-label="State ${index + 1} name"
              .value=${stateName}
              @change=${(ev: Event) =>
                this._stateColorChanged(index, 'state', (ev.target as HTMLInputElement).value)}
            >
            ${this._renderColorInput(color, `State ${index + 1} color`,
              `state-color-error-${index}`, (value) =>
                this._stateColorChanged(index, 'color', value))}
            <ha-button appearance="plain" variant="danger" @click=${() => this._removeStateColor(index)}>
              Remove<span class="visually-hidden"> state ${stateName || index + 1}</span>
            </ha-button>
          </div>
        `)}

        <ha-button appearance="plain" data-focus-key="add-state-color" @click=${this._addStateColor}>
          Add State Color
        </ha-button>
      </div>
    `;
  }

  private _renderEntityStateColors(entityConfig: EntityConfig, entityIndex: number) {
    const entries = Object.entries((entityConfig as any).state_colors || {});

    return html`
      <div class="entity-thresholds">
        <h4>Multi-State Colors (Per-Entity)</h4>
        <p class="helper-text">
          Map HA state strings to colors for this entity. Overrides global state colors.
          Add one row per state in the order they should appear.
        </p>

        ${entries.length === 0 ? html`
          <p class="info-text">No entity-specific state colors. Using global state colors.</p>
        ` : ''}

        ${entries.map(([stateName, color], stateIndex) => html`
          <div class="threshold-item">
            <input
              type="text"
              class="row-input"
              placeholder="State name (e.g. cool)"
              aria-label="State ${stateIndex + 1} name"
              .value=${stateName}
              @change=${(ev: Event) =>
                this._entityStateColorChanged(entityIndex, stateIndex, 'state', (ev.target as HTMLInputElement).value)}
            >
            ${this._renderColorInput(color as string, `State ${stateIndex + 1} color`,
              `entity-${entityIndex}-state-color-error-${stateIndex}`, (value) =>
                this._entityStateColorChanged(entityIndex, stateIndex, 'color', value))}
            <ha-button appearance="plain" variant="danger" @click=${() => this._removeEntityStateColor(entityIndex, stateIndex)}>
              Remove<span class="visually-hidden"> state ${stateName || stateIndex + 1}</span>
            </ha-button>
          </div>
        `)}

        <ha-button appearance="plain" data-focus-key="add-entity-state-color-${entityIndex}"
          @click=${() => this._addEntityStateColor(entityIndex)}>
          Add State Color
        </ha-button>
      </div>
    `;
  }

  private _renderEntityThresholds(entityConfig: EntityConfig, entityIndex: number) {
    const thresholds = entityConfig.thresholds || [];

    return html`
      <div class="entity-thresholds">
        <h4>Per-Entity Thresholds</h4>
        <p class="helper-text">
          Define custom thresholds for this entity only. Overrides global thresholds.
        </p>

        ${thresholds.length === 0 ? html`
          <p class="info-text">No entity-specific thresholds. Using global thresholds.</p>
        ` : ''}

        ${thresholds.map((threshold, thresholdIndex) => html`
          <div class="threshold-item">
            <input
              type="number"
              class="row-input"
              aria-label="Threshold ${thresholdIndex + 1} value"
              .value=${String(threshold.value)}
              @change=${(ev: Event) =>
                this._entityThresholdChanged(entityIndex, thresholdIndex, 'value', (ev.target as HTMLInputElement).value)}
            >
            ${this._renderColorInput(threshold.color, `Threshold ${thresholdIndex + 1} color`,
              `entity-${entityIndex}-threshold-color-error-${thresholdIndex}`, (value) =>
                this._entityThresholdChanged(entityIndex, thresholdIndex, 'color', value))}
            <ha-button appearance="plain" variant="danger" @click=${() => this._removeEntityThreshold(entityIndex, thresholdIndex)}>
              Remove<span class="visually-hidden"> threshold ${thresholdIndex + 1}</span>
            </ha-button>
          </div>
        `)}

        <ha-button appearance="plain" data-focus-key="add-entity-threshold-${entityIndex}"
          @click=${() => this._addEntityThreshold(entityIndex)}>
          Add Entity Threshold
        </ha-button>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
      }

      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .section {
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      h4 {
        margin: 16px 0 8px 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      ha-selector {
        display: block;
        margin-bottom: 12px;
        width: 100%;
      }

      ha-expansion-panel {
        display: block;
        margin-bottom: 12px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
      }

      .toggle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .toggle-row:last-child {
        border-bottom: none;
      }

      .toggle-row span {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .threshold-item {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 8px;
        margin-bottom: 8px;
        align-items: start;
      }

      /* Border uses secondary text color to meet WCAG 1.4.11 (3:1 against the background) */
      .row-input {
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
        padding: 4px 8px;
        font-size: 14px;
        border: 1px solid var(--secondary-text-color, #727272);
        border-radius: 4px;
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color);
      }

      .row-input[aria-invalid='true'] {
        border: 2px solid var(--error-color, #db4437);
      }

      /* Text stays primary color for 4.5:1; red is used only on non-text parts
         (bar, icon, input border), which need 3:1 */
      .error-text {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 12px;
        color: var(--primary-text-color);
        margin: 6px 0 0 0;
        padding: 4px 8px;
        border-left: 3px solid var(--error-color, #db4437);
      }

      .error-text ha-icon {
        flex: 0 0 auto;
        color: var(--error-color, #db4437);
        --mdc-icon-size: 16px;
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .entity-config {
        padding: 12px;
      }

      .entity-header-row {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
      }

      .entity-overrides {
        padding: 12px;
      }

      .helper-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin: 0 0 12px 0;
      }

      .info-text {
        font-size: 13px;
        color: var(--secondary-text-color);
        font-style: italic;
        margin: 8px 0;
      }

      ha-button {
        margin-top: 8px;
      }
    `;
  }
}

// Register custom element with guard to prevent duplicate registration
if (!customElements.get('waterfall-history-card-editor')) {
  customElements.define('waterfall-history-card-editor', WaterfallHistoryCardEditor);
}

declare global {
  interface HTMLElementTagNameMap {
    'waterfall-history-card-editor': WaterfallHistoryCardEditor;
  }
}
