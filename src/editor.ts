import { LitElement, html, css } from 'lit';
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
          .label=${'Card Title'}
          .value=${this._config.title || DEFAULTS.title}
          .selector=${{text: {}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('title', ev.detail.value)}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .label=${'Time Window (hours)'}
          .value=${this._config.hours || DEFAULTS.hours}
          .selector=${{number: {min: 1, max: 168, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('hours', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .label=${'Intervals'}
          .value=${this._config.intervals || DEFAULTS.intervals}
          .selector=${{number: {min: 24, max: 96, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('intervals', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .label=${'Bar Height (pixels)'}
          .value=${this._config.height || DEFAULTS.height}
          .selector=${{number: {min: 30, max: 200, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('height', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .label=${'Decimal Places'}
          .value=${this._config.digits ?? DEFAULTS.digits}
          .selector=${{number: {min: 0, max: 5, mode: 'box', step: 1}}}
          @value-changed=${(ev: CustomEvent) =>
            this._configValueChanged('digits', Number(ev.detail.value))}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
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

        <div class="toggle-row">
          <label>Show Icons</label>
          <ha-switch
            .checked=${this._config.show_icons !== false}
            @change=${(ev: Event) =>
              this._configValueChanged('show_icons', (ev.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>

        <div class="toggle-row">
          <label>Show Labels</label>
          <ha-switch
            .checked=${this._config.show_labels !== false}
            @change=${(ev: Event) =>
              this._configValueChanged('show_labels', (ev.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>

        <div class="toggle-row">
          <label>Show Current Value</label>
          <ha-switch
            .checked=${this._config.show_current !== false}
            @change=${(ev: Event) =>
              this._configValueChanged('show_current', (ev.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>

        <div class="toggle-row">
          <label>Show Min/Max</label>
          <ha-switch
            .checked=${this._config.show_min_max || false}
            @change=${(ev: Event) =>
              this._configValueChanged('show_min_max', (ev.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>

        <div class="toggle-row">
          <label>Compact Mode</label>
          <ha-switch
            .checked=${this._config.compact || false}
            @change=${(ev: Event) =>
              this._configValueChanged('compact', (ev.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>

        <div class="toggle-row">
          <label>Inline Layout</label>
          <ha-switch
            .checked=${this._config.inline_layout || false}
            @change=${(ev: Event) =>
              this._configValueChanged('inline_layout', (ev.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>

        <div class="toggle-row">
          <label>Gradient Mode</label>
          <ha-switch
            .checked=${this._config.gradient || false}
            @change=${(ev: Event) =>
              this._configValueChanged('gradient', (ev.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>

        <ha-selector
          .hass=${this.hass}
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
            .label=${'On State Color'}
            .value=${this._config.color_on || DEFAULTS.color_on}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('color_on', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${'Off State Color'}
            .value=${this._config.color_off || DEFAULTS.color_off}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('color_off', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${'On State Label'}
            .value=${this._config.state_on || DEFAULTS.state_on}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('state_on', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${'Off State Label'}
            .value=${this._config.state_off || DEFAULTS.state_off}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('state_off', ev.detail.value)}
          ></ha-selector>

          <h4>Unknown & Unavailable States</h4>

          <ha-selector
            .hass=${this.hass}
            .label=${'Unknown State Color'}
            .value=${this._config.color_unknown || DEFAULTS.color_unknown}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('color_unknown', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${'Unknown State Label'}
            .value=${this._config.state_unknown || DEFAULTS.state_unknown}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('state_unknown', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${'Unavailable State Color'}
            .value=${this._config.color_unavailable || DEFAULTS.color_unavailable}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._configValueChanged('color_unavailable', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
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
                .value=${String(threshold.value)}
                style="flex:1;padding:4px 8px;font-size:14px;border:1px solid var(--divider-color,#e0e0e0);border-radius:4px;background:var(--card-background-color,#fff);color:var(--primary-text-color);"
                @change=${(ev: Event) =>
                  this._thresholdChanged(index, 'value', (ev.target as HTMLInputElement).value)}
              >
              <input
                type="text"
                placeholder="e.g., #FF0000"
                .value=${threshold.color}
                style="flex:1;padding:4px 8px;font-size:14px;border:1px solid var(--divider-color,#e0e0e0);border-radius:4px;background:var(--card-background-color,#fff);color:var(--primary-text-color);"
                @input=${(ev: Event) =>
                  this._thresholdChanged(index, 'color', (ev.target as HTMLInputElement).value)}
              >
              <mwc-button @click=${() => this._removeThreshold(index)}>
                Remove
              </mwc-button>
            </div>
          `)}

          <mwc-button raised @click=${this._addThreshold}>
            Add Threshold
          </mwc-button>
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

        <mwc-button raised @click=${this._addEntity}>
          Add Entity
        </mwc-button>
      </div>
    `;
  }

  private _renderEntityConfig(entity: string | EntityConfig, index: number) {
    const entityConfig = typeof entity === 'string' ? { entity } : entity;
    const entityId = entityConfig.entity;

    return html`
      <ha-expansion-panel
        header="${entityConfig.name || entityId || `Entity ${index + 1}`}"
        .expanded=${false}>
        <div class="entity-config">
          <div class="entity-header-row">
            <mwc-button @click=${() => this._removeEntity(index)}>
              Remove Entity
            </mwc-button>
          </div>

          <ha-selector
            .hass=${this.hass}
            .selector=${{ entity: {} }}
            .value=${entityId}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'entity', ev.detail.value)}
            .label=${'Entity'}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
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
            .label=${'Hours (override)'}
            .value=${entityConfig.hours || ''}
            .selector=${{number: {min: 1, max: 168, mode: 'box', step: 1}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'hours', ev.detail.value ? Number(ev.detail.value) : undefined)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${'Intervals (override)'}
            .value=${entityConfig.intervals || ''}
            .selector=${{number: {min: 24, max: 96, mode: 'box', step: 1}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'intervals', ev.detail.value ? Number(ev.detail.value) : undefined)}
          ></ha-selector>

          <h4>Display Overrides</h4>

          <div class="toggle-row">
            <label>Show Icons (override)</label>
            <ha-switch
              .checked=${entityConfig.show_icons ?? true}
              @change=${(ev: Event) =>
                this._entityChanged(index, 'show_icons', (ev.target as HTMLInputElement).checked)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <label>Show Labels (override)</label>
            <ha-switch
              .checked=${entityConfig.show_labels ?? true}
              @change=${(ev: Event) =>
                this._entityChanged(index, 'show_labels', (ev.target as HTMLInputElement).checked)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <label>Show Current (override)</label>
            <ha-switch
              .checked=${entityConfig.show_current ?? true}
              @change=${(ev: Event) =>
                this._entityChanged(index, 'show_current', (ev.target as HTMLInputElement).checked)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <label>Inline Layout (override)</label>
            <ha-switch
              .checked=${entityConfig.inline_layout ?? false}
              @change=${(ev: Event) =>
                this._entityChanged(index, 'inline_layout', (ev.target as HTMLInputElement).checked)}
            ></ha-switch>
          </div>

          <h4>Styling Overrides</h4>

          <ha-selector
            .hass=${this.hass}
            .label=${'Custom Icon'}
            .value=${entityConfig.icon || ''}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'icon', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${'Custom Unit'}
            .value=${entityConfig.unit || ''}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'unit', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${'Decimal Places (override)'}
            .value=${entityConfig.digits ?? ''}
            .selector=${{number: {min: 0, max: 5, mode: 'box', step: 1}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'digits', ev.detail.value ? Number(ev.detail.value) : undefined)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
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
            .label=${'On State Color (override)'}
            .value=${entityConfig.color_on || ''}
            .selector=${{text: {}}}
            @value-changed=${(ev: CustomEvent) =>
              this._entityChanged(index, 'color_on', ev.detail.value)}
          ></ha-selector>

          <ha-selector
            .hass=${this.hass}
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
              placeholder="State name (e.g. cool)"
              .value=${stateName}
              style="flex:1;padding:4px 8px;font-size:14px;border:1px solid var(--divider-color,#e0e0e0);border-radius:4px;background:var(--card-background-color,#fff);color:var(--primary-text-color);"
              @change=${(ev: Event) =>
                this._stateColorChanged(index, 'state', (ev.target as HTMLInputElement).value)}
            >
            <input
              type="text"
              placeholder="e.g., #FF0000"
              .value=${color}
              style="flex:1;padding:4px 8px;font-size:14px;border:1px solid var(--divider-color,#e0e0e0);border-radius:4px;background:var(--card-background-color,#fff);color:var(--primary-text-color);"
              @input=${(ev: Event) =>
                this._stateColorChanged(index, 'color', (ev.target as HTMLInputElement).value)}
            >
            <mwc-button @click=${() => this._removeStateColor(index)}>
              Remove
            </mwc-button>
          </div>
        `)}

        <mwc-button @click=${this._addStateColor}>
          Add State Color
        </mwc-button>
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
              placeholder="State name (e.g. cool)"
              .value=${stateName}
              style="flex:1;padding:4px 8px;font-size:14px;border:1px solid var(--divider-color,#e0e0e0);border-radius:4px;background:var(--card-background-color,#fff);color:var(--primary-text-color);"
              @change=${(ev: Event) =>
                this._entityStateColorChanged(entityIndex, stateIndex, 'state', (ev.target as HTMLInputElement).value)}
            >
            <input
              type="text"
              placeholder="e.g., #FF0000"
              .value=${color as string}
              style="flex:1;padding:4px 8px;font-size:14px;border:1px solid var(--divider-color,#e0e0e0);border-radius:4px;background:var(--card-background-color,#fff);color:var(--primary-text-color);"
              @input=${(ev: Event) =>
                this._entityStateColorChanged(entityIndex, stateIndex, 'color', (ev.target as HTMLInputElement).value)}
            >
            <mwc-button @click=${() => this._removeEntityStateColor(entityIndex, stateIndex)}>
              Remove
            </mwc-button>
          </div>
        `)}

        <mwc-button @click=${() => this._addEntityStateColor(entityIndex)}>
          Add State Color
        </mwc-button>
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
              .value=${String(threshold.value)}
              style="flex:1;padding:4px 8px;font-size:14px;border:1px solid var(--divider-color,#e0e0e0);border-radius:4px;background:var(--card-background-color,#fff);color:var(--primary-text-color);"
              @change=${(ev: Event) =>
                this._entityThresholdChanged(entityIndex, thresholdIndex, 'value', (ev.target as HTMLInputElement).value)}
            >
            <input
              type="text"
              placeholder="e.g., #FF0000"
              .value=${threshold.color}
              style="flex:1;padding:4px 8px;font-size:14px;border:1px solid var(--divider-color,#e0e0e0);border-radius:4px;background:var(--card-background-color,#fff);color:var(--primary-text-color);"
              @input=${(ev: Event) =>
                this._entityThresholdChanged(entityIndex, thresholdIndex, 'color', (ev.target as HTMLInputElement).value)}
            >
            <mwc-button @click=${() => this._removeEntityThreshold(entityIndex, thresholdIndex)}>
              Remove
            </mwc-button>
          </div>
        `)}

        <mwc-button @click=${() => this._addEntityThreshold(entityIndex)}>
          Add Entity Threshold
        </mwc-button>
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

      .toggle-row label {
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

      mwc-button {
        margin-top: 8px;
      }

      mwc-button[raised] {
        --mdc-theme-primary: var(--primary-color);
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
