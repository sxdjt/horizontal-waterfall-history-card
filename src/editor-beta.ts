import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';
import { WaterfallHistoryCardConfig, EntityConfig, ThresholdConfig } from './types';
import { DEFAULTS } from './constants';

@customElement('waterfall-history-card-editor-beta')
export class WaterfallHistoryCardEditorBeta extends LitElement implements LovelaceCardEditor {
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

        <ha-textfield
          label="Card Title"
          .value=${this._config.title || DEFAULTS.title}
          @input=${(ev: Event) =>
            this._configValueChanged('title', (ev.target as HTMLInputElement).value)}
        ></ha-textfield>

        <ha-textfield
          label="Time Window (hours)"
          type="number"
          min="1"
          max="168"
          .value=${this._config.hours || DEFAULTS.hours}
          @input=${(ev: Event) =>
            this._configValueChanged('hours', Number((ev.target as HTMLInputElement).value))}
          helper-text="How many hours of history to display (1-168)"
        ></ha-textfield>

        <ha-textfield
          label="Intervals"
          type="number"
          min="24"
          max="96"
          .value=${this._config.intervals || DEFAULTS.intervals}
          @input=${(ev: Event) =>
            this._configValueChanged('intervals', Number((ev.target as HTMLInputElement).value))}
          helper-text="Number of segments in the waterfall (24-96)"
        ></ha-textfield>

        <ha-textfield
          label="Bar Height (pixels)"
          type="number"
          min="30"
          max="200"
          .value=${this._config.height || DEFAULTS.height}
          @input=${(ev: Event) =>
            this._configValueChanged('height', Number((ev.target as HTMLInputElement).value))}
          helper-text="Height of each waterfall bar in pixels"
        ></ha-textfield>

        <ha-textfield
          label="Decimal Places"
          type="number"
          min="0"
          max="5"
          .value=${this._config.digits ?? DEFAULTS.digits}
          @input=${(ev: Event) =>
            this._configValueChanged('digits', Number((ev.target as HTMLInputElement).value))}
          helper-text="Number of decimal places for numeric values (0-5)"
        ></ha-textfield>
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

          <ha-textfield
            label="On State Color"
            .value=${this._config.color_on || DEFAULTS.color_on}
            @input=${(ev: Event) =>
              this._configValueChanged('color_on', (ev.target as HTMLInputElement).value)}
            helper-text="Color when state is ON (e.g., #EEEEEE or white)"
          ></ha-textfield>

          <ha-textfield
            label="Off State Color"
            .value=${this._config.color_off || DEFAULTS.color_off}
            @input=${(ev: Event) =>
              this._configValueChanged('color_off', (ev.target as HTMLInputElement).value)}
            helper-text="Color when state is OFF (e.g., #636363 or gray)"
          ></ha-textfield>

          <ha-textfield
            label="On State Label"
            .value=${this._config.state_on || DEFAULTS.state_on}
            @input=${(ev: Event) =>
              this._configValueChanged('state_on', (ev.target as HTMLInputElement).value)}
            helper-text="Text to display for ON state (default: On)"
          ></ha-textfield>

          <ha-textfield
            label="Off State Label"
            .value=${this._config.state_off || DEFAULTS.state_off}
            @input=${(ev: Event) =>
              this._configValueChanged('state_off', (ev.target as HTMLInputElement).value)}
            helper-text="Text to display for OFF state (default: Off)"
          ></ha-textfield>

          <h4>Unknown & Unavailable States</h4>

          <ha-textfield
            label="Unknown State Color"
            .value=${this._config.color_unknown || DEFAULTS.color_unknown}
            @input=${(ev: Event) =>
              this._configValueChanged('color_unknown', (ev.target as HTMLInputElement).value)}
            helper-text="Color for unknown states (default: #FF9800 orange)"
          ></ha-textfield>

          <ha-textfield
            label="Unknown State Label"
            .value=${this._config.state_unknown || DEFAULTS.state_unknown}
            @input=${(ev: Event) =>
              this._configValueChanged('state_unknown', (ev.target as HTMLInputElement).value)}
            helper-text="Text to display for unknown state (default: Unknown)"
          ></ha-textfield>

          <ha-textfield
            label="Unavailable State Color"
            .value=${this._config.color_unavailable || DEFAULTS.color_unavailable}
            @input=${(ev: Event) =>
              this._configValueChanged('color_unavailable', (ev.target as HTMLInputElement).value)}
            helper-text="Color for unavailable states (default: #9E9E9E gray)"
          ></ha-textfield>

          <ha-textfield
            label="Unavailable State Label"
            .value=${this._config.state_unavailable || DEFAULTS.state_unavailable}
            @input=${(ev: Event) =>
              this._configValueChanged('state_unavailable', (ev.target as HTMLInputElement).value)}
            helper-text="Text to display for unavailable state (default: INOP)"
          ></ha-textfield>
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
              <ha-textfield
                label="Threshold Value"
                type="number"
                .value=${threshold.value}
                @input=${(ev: Event) =>
                  this._thresholdChanged(index, 'value', (ev.target as HTMLInputElement).value)}
              ></ha-textfield>

              <ha-textfield
                label="Color"
                .value=${threshold.color}
                @input=${(ev: Event) =>
                  this._thresholdChanged(index, 'color', (ev.target as HTMLInputElement).value)}
                helper-text="e.g., #FF0000 or red"
              ></ha-textfield>

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

          <ha-textfield
            label="Custom Name (optional)"
            .value=${entityConfig.name || ''}
            @input=${(ev: Event) =>
              this._entityChanged(index, 'name', (ev.target as HTMLInputElement).value)}
            helper-text="Leave blank to use entity's friendly name"
          ></ha-textfield>

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

          <ha-textfield
            label="Hours (override)"
            type="number"
            min="1"
            max="168"
            .value=${entityConfig.hours || ''}
            @input=${(ev: Event) =>
              this._entityChanged(index, 'hours', (ev.target as HTMLInputElement).value ? Number((ev.target as HTMLInputElement).value) : undefined)}
            helper-text="Leave blank to use global value"
          ></ha-textfield>

          <ha-textfield
            label="Intervals (override)"
            type="number"
            min="24"
            max="96"
            .value=${entityConfig.intervals || ''}
            @input=${(ev: Event) =>
              this._entityChanged(index, 'intervals', (ev.target as HTMLInputElement).value ? Number((ev.target as HTMLInputElement).value) : undefined)}
            helper-text="Leave blank to use global value"
          ></ha-textfield>

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

          <ha-textfield
            label="Custom Icon"
            .value=${entityConfig.icon || ''}
            @input=${(ev: Event) =>
              this._entityChanged(index, 'icon', (ev.target as HTMLInputElement).value)}
            helper-text="e.g., mdi:thermometer"
          ></ha-textfield>

          <ha-textfield
            label="Custom Unit"
            .value=${entityConfig.unit || ''}
            @input=${(ev: Event) =>
              this._entityChanged(index, 'unit', (ev.target as HTMLInputElement).value)}
            helper-text="Override unit of measurement (e.g., °F)"
          ></ha-textfield>

          <ha-textfield
            label="Decimal Places (override)"
            type="number"
            min="0"
            max="5"
            .value=${entityConfig.digits ?? ''}
            @input=${(ev: Event) =>
              this._entityChanged(index, 'digits', (ev.target as HTMLInputElement).value ? Number((ev.target as HTMLInputElement).value) : undefined)}
            helper-text="Leave blank to use global value"
          ></ha-textfield>

          <h4>Binary State Overrides</h4>

          <ha-textfield
            label="On State Color (override)"
            .value=${entityConfig.color_on || ''}
            @input=${(ev: Event) =>
              this._entityChanged(index, 'color_on', (ev.target as HTMLInputElement).value)}
            helper-text="Leave blank to use global value"
          ></ha-textfield>

          <ha-textfield
            label="Off State Color (override)"
            .value=${entityConfig.color_off || ''}
            @input=${(ev: Event) =>
              this._entityChanged(index, 'color_off', (ev.target as HTMLInputElement).value)}
            helper-text="Leave blank to use global value"
          ></ha-textfield>

          ${this._renderEntityThresholds(entityConfig, index)}
        </div>
      </ha-expansion-panel>
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
            <ha-textfield
              label="Threshold Value"
              type="number"
              .value=${threshold.value}
              @input=${(ev: Event) =>
                this._entityThresholdChanged(entityIndex, thresholdIndex, 'value', (ev.target as HTMLInputElement).value)}
            ></ha-textfield>

            <ha-textfield
              label="Color"
              .value=${threshold.color}
              @input=${(ev: Event) =>
                this._entityThresholdChanged(entityIndex, thresholdIndex, 'color', (ev.target as HTMLInputElement).value)}
              helper-text="e.g., #FF0000 or red"
            ></ha-textfield>

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

      ha-textfield,
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

declare global {
  interface HTMLElementTagNameMap {
    'waterfall-history-card-editor-beta': WaterfallHistoryCardEditorBeta;
  }
}
