# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Home Assistant custom Lovelace card** that displays entity history as horizontal waterfall charts. Built on LitElement, it's a single-file Web Component with no build process, minimal dependencies (Lit from CDN), and no test suite.

**Key characteristics:**
- Single JavaScript file (`horizontal-waterfall-history-card.js`)
- LitElement-based Web Component with Shadow DOM
- Imports Lit from CDN (https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js)
- Direct installation via HACS or manual copy to Home Assistant
- No transpilation, bundling, or build steps required
- Version 3.1 (current) - adds inline layout mode
- Version 3.0 (released 2024) - major performance upgrade from v2.x

## Architecture

### LitElement Web Component Structure (v3.0)

The entire card is implemented in `horizontal-waterfall-history-card.js` (~688 lines):

```javascript
import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class WaterfallHistoryCard extends LitElement {
  static properties = { /* Reactive properties */ }
  static styles = css`/* Static styles */`

  constructor() { /* Initialization */ }
  setConfig(config) { /* Configuration parsing */ }
  shouldUpdate(changedProps) { /* Update optimization */ }
  updated(changedProps) { /* Post-render lifecycle */ }
  render() { /* Lit html template */ }
  _renderEntity(entityConfig) { /* Per-entity rendering */ }
  // Data processing and utility methods
}
customElements.define('waterfall-history-card', WaterfallHistoryCard);
```

### Core Component Responsibilities

1. **Configuration Processing** (`setConfig()`)
   - Merges global card-level settings with per-entity overrides
   - Handles both simple string entity IDs and full entity config objects
   - Default thresholds for numeric sensors (60/70/80/100°F) and binary sensors (0/1)

2. **Home Assistant Integration** (Reactive `hass` property)
   - Receives `hass` object from Home Assistant frontend as reactive property
   - Uses `shouldUpdate()` to check if tracked entities changed
   - Fetches historical data via `hass.callApi()` REST API
   - Implements intelligent refresh interval based on time window and intervals

3. **Data Processing** (`processHistoryData()`)
   - Divides time window into configurable intervals (default 48)
   - Maps historical state changes to time buckets
   - Forward/backward fill for missing data points

4. **Color Logic** (`getColorForValue()`, `getBinaryColors()`)
   - **Numeric sensors**: Threshold-based coloring (e.g., temperature ranges)
   - **Binary sensors**: Dual-color system with precedence: per-entity → global → defaults
   - Supports both `color_on`/`color_off` and `binary_colors: {on, off}` syntax

5. **Rendering** (`render()` and `_renderEntity()`)
   - Uses Lit's `html` tagged template for efficient virtual DOM
   - Static styles defined in `static styles` CSS property
   - Event handlers attached via Lit's `@click` syntax
   - Separate `_renderEntity()` method for per-entity rendering

### Configuration System

The card uses a **two-level configuration hierarchy**:

```yaml
# Global defaults
type: custom:waterfall-history-card
title: "My Card"
hours: 24
intervals: 48
show_icons: true
color_on: '#EEEEEE'
color_off: '#636363'

# Per-entity overrides
entities:
  - entity: sensor.temp
    hours: 12              # Overrides global
    show_labels: false     # Overrides global
```

**Precedence**: Per-entity config → Card-level config → Hardcoded defaults

### State Parsing and Binary Detection

- `parseState()` converts Home Assistant states to numbers:
  - `"on"` → `1`, `"off"` → `0`
  - Numeric strings → `parseFloat()`
  - Everything else → `null`

- `isBinaryValue()` detects binary entities:
  - Returns `true` for values `0`, `1`, `true`, `false`
  - Used to automatically apply binary color schemes

### Icon System

- Uses Material Design Icons (MDI) via Home Assistant's icon registry
- Falls back to hardcoded domain defaults (`DEFAULT_DOMAIN_ICONS`)
- Icon display controlled by global `show_icons` and per-entity overrides

## Common Development Tasks

### Testing Changes

**No automated tests exist.** Test by:

1. Edit `horizontal-waterfall-history-card.js` directly
2. Copy to Home Assistant: `config/www/horizontal-waterfall-history-card.js`
3. Hard refresh browser (Ctrl+F5 / Cmd+Shift+R) to bust cache
4. Check browser console (F12) for errors

**Debugging tips:**
- Check `console.info()` version log on page load (should show v3.1)
- Use browser DevTools to inspect Shadow DOM
- Verify `hass` object in console: `document.querySelector('waterfall-history-card').hass`
- Check reactive properties: `document.querySelector('waterfall-history-card').config`
- Monitor performance with Chrome DevTools Performance tab

### Adding New Configuration Options

Follow existing patterns:

1. **Add to `setConfig()`** in `globalConfig` object
2. **Use in `render()`** or relevant method with fallback: `entityConfig.option ?? this.config.option ?? default`
3. **Document in README.md** under "Card-level options" or "Per-entity options"

Example:
```javascript
// In setConfig():
globalConfig = {
  // ...existing options...
  new_option: config.new_option || 'default',
};

// In usage:
const value = entityConfig.new_option ?? this.config.new_option;
```

### Modifying Color Logic

Color logic lives in three methods:

- `getColorForValue()`: Main entry point, routes to numeric thresholds or binary colors
- `getBinaryColors()`: Resolves binary color precedence (entity → global → default)
- `interpolateColor()` + `hexToRgb()`: Gradient support (rarely used)

**Binary color precedence chain:**
1. `entityConfig.binary_colors` object
2. `entityConfig.color_on` / `entityConfig.color_off`
3. `this.config.binary_colors` object
4. `this.config.color_on` / `this.config.color_off`
5. `threshold_default_boolean` constants

### Styling Changes

All styles are in the `render()` method's template literal:

```javascript
<style>
  :host { /* Shadow DOM host styles */ }
  .entity-container { /* ... */ }
</style>
```

**Compact mode**: Controlled by `.compact` class added conditionally to container

## Home Assistant Integration

### WebSocket API Usage

Historical data fetched via:
```javascript
this._hass.callWS({
  type: 'history/history_during_period',
  start_time: new Date(startTime).toISOString(),
  end_time: new Date(Date.now()).toISOString(),
  entity_ids: [entityId],
  minimal_response: true
})
```

**Caching:** Last fetch timestamp stored in `this._lastHistoryFetch[entityId]` to limit API calls to once per 15 minutes.

### State Access

Current entity state: `this._hass.states[entityId]`

Attributes: `this._hass.states[entityId].attributes.unit_of_measurement`

### More Info Dialog

Clicking entity containers dispatches Home Assistant's standard event:
```javascript
new CustomEvent('hass-more-info', {
  bubbles: true,
  composed: true,
  detail: { entityId }
})
```

## Installation and Distribution

### HACS Integration

`hacs.json` configuration:
- `"content_in_root": false` - file is in repo root
- `"filename": "horizontal-waterfall-history-card.js"` - exact filename
- `"render_readme": true` - show README in HACS UI

### Manual Installation

Users copy `horizontal-waterfall-history-card.js` to `config/www/` and add to Lovelace resources:
```yaml
url: /local/horizontal-waterfall-history-card.js
type: module
```

## Version History & Breaking Changes

### v3.1 (Current)
- **NOT a breaking change** - 100% backwards compatible with v3.0
- Added inline layout mode (`inline_layout`)
- Display entity name, graph, and current value on a single line
- Per-entity inline layout overrides
- Compact mode support for inline layout

### v3.0
- **NOT a breaking change** - 100% backwards compatible with v2.x
- Migrated from vanilla HTMLElement to LitElement
- Added binary state label customization (`state_on`, `state_off`)
- Significant performance improvements through intelligent update logic
- Binary entities now display "On"/"Off" by default instead of "0"/"1"

### v2.0
- **BREAKING CHANGE** - Introduced multi-entity support
- Changed from single `entity` to `entities` array
- Added per-entity configuration overrides

**Old (v1.x):**
```yaml
entity: sensor.temp  # Single entity
```

**New (v2.0+):**
```yaml
entities:           # Array of entities
  - entity: sensor.temp
```

When making breaking changes, increment major version and document migration path in README.

## Code Conventions

- **LitElement framework** - Imported from CDN, no npm build required
- **Lit html templates** - Tagged template literals for efficient rendering
- **Static CSS** - Defined once in `static styles`, parsed at load time
- **ES6 classes and modern JavaScript** - No transpilation needed
- **Shadow DOM encapsulation** - Styles don't leak to/from Home Assistant
- **Reactive properties** - Defined in `static properties` for automatic updates
- **Lifecycle methods** - `shouldUpdate()`, `updated()`, `render()` for optimized rendering
- **Minimal comments** - Code is largely self-documenting, comments added for complex logic
- **Internationalization** - `this.translations` object supports multiple languages (currently EN/FR)

## Version Identification

Version logged to console in `console.info()` call at bottom of file. Update this when releasing new versions. Current: v3.1
