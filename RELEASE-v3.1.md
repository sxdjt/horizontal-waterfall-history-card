# Release v3.1.0 - Inline Layout Mode

## Overview

Version 3.1 adds a new **inline layout mode** that displays entity information more compactly by putting the entity name, graph, and current value on a single horizontal line.

## What's New

### Inline Layout Mode

Display entity name, waterfall graph, and current value on a single line:

```yaml
type: custom:waterfall-history-card
title: Temperature History
inline_layout: true
entities:
  - entity: sensor.outdoor_temperature
  - entity: sensor.indoor_temperature
```

**Visual comparison:**

**Default (stacked):**
```
[Icon] Entity Name          72.5°F
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]
24h ago                      Now
```

**Inline:**
```
[Icon] Entity Name  [━━━━━━━━━━━━━━━━━━━━━━━━]  72.5°F
```

### Features

- **Per-entity override**: Mix inline and stacked layouts in the same card
- **Compact mode support**: Works with existing `compact: true` option
- **Automatic label hiding**: Time labels are hidden in inline mode for cleaner display
- **Perfect alignment**: Text and icons vertically centered with graph
- **Fully compatible**: Works with all existing options (colors, thresholds, icons, etc.)

## Configuration

### Global inline layout

```yaml
type: custom:waterfall-history-card
title: Temperatures
inline_layout: true  # All entities use inline layout
entities:
  - sensor.outdoor_temperature
  - sensor.indoor_temperature
```

### Per-entity override

```yaml
type: custom:waterfall-history-card
title: Mixed Layout
entities:
  - entity: sensor.outdoor_temperature
    inline_layout: true   # This entity uses inline layout
  - entity: sensor.indoor_temperature
    # This uses default stacked layout
```

## Backwards Compatibility

- ✅ 100% backwards compatible with v3.0
- ✅ Defaults to `false` (stacked layout)
- ✅ Existing cards work without modification
- ✅ No breaking changes

## Files Changed

- `horizontal-waterfall-history-card.js` - Added inline layout rendering and CSS
- `README.md` - Documented new `inline_layout` option with examples
- `CLAUDE.md` - Updated version history and debugging info
- `CHANGELOG.md` - Created comprehensive changelog

## Installation

### HACS (Recommended)

HACS will automatically detect the new version. Update through the HACS interface.

### Manual

1. Download `horizontal-waterfall-history-card.js`
2. Replace the file in `config/www/`
3. Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)
4. Verify version in console: "WATERFALL-HISTORY-CARD v3.1"

## Testing

Tested with:
- ✅ Home Assistant 2024.x
- ✅ Temperature sensors (numeric values)
- ✅ Binary sensors (on/off states)
- ✅ Mixed sensor types
- ✅ Compact mode
- ✅ Per-entity overrides
- ✅ Icon display
- ✅ Custom colors and thresholds

## Next Steps

1. Commit changes to git
2. Tag release as v3.1.0
3. Push to GitHub
4. Update HACS release
5. Announce in Home Assistant community

---

**Release Date:** 2025-01-27
**Version:** 3.1.0
**Compatibility:** Home Assistant 2024.x+
