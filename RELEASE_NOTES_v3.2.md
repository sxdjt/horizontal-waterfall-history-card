# Release Notes: v3.2.0

**Release Date:** December 3, 2025

## Overview

Version 3.2 brings locale-aware time formatting and comprehensive unknown/unavailable state handling to the Waterfall History Card. This release enhances usability for international users and improves reliability when sensors go offline or report unknown states.

## What's New

### 1. Locale-Aware Time Formatting

Time labels now automatically adapt to your Home Assistant profile's locale settings.

**Features:**
- Automatic 12-hour format for US English users (e.g., "3:00 PM - 6:00 PM")
- Automatic 24-hour format for European and other locales (e.g., "15:00 - 18:00")
- Respects Home Assistant user profile settings first
- Falls back to browser locale if HA locale unavailable
- Zero configuration required

**Examples by locale:**
- US English: "3:00 PM - 6:00 PM"
- UK English: "15:00 - 18:00"
- French: "15:00 - 18:00"
- German: "15:00 - 18:00"
- Japanese: "15:00 - 18:00"

### 2. Unknown & Unavailable State Handling

Proper handling for entities that enter unknown or unavailable states.

**Features:**
- Customizable colors for unknown (default: orange) and unavailable (default: gray) states
- Customizable labels (defaults: "Unknown" and "INOP")
- Per-entity override support
- Smart state propagation prevents corrupted historical data
- Min/Max calculations automatically exclude unknown/unavailable values

**Configuration Example:**
```yaml
type: custom:waterfall-history-card
title: Sensor Monitoring
color_unknown: '#FFB300'
color_unavailable: '#B71C1C'
state_unknown: "No Data"
state_unavailable: "Offline"
entities:
  - sensor.outdoor_temperature
  - entity: sensor.critical_sensor
    state_unavailable: "FAULT"
    color_unavailable: '#FF0000'
```

## Bug Fixes

- **Issue #62**: Cards no longer break when entities become unavailable
- **Issue #63**: Time labels now respect locale settings instead of always using 24-hour format (Thanks @uSpike)
- Min/Max calculations now correctly exclude unknown and unavailable states
- Improved forward/backward fill logic prevents incorrect state propagation

## Technical Details

### Time Formatting Implementation
- Uses browser's native `Intl.DateTimeFormat` API
- Locale resolution: `hass.locale.language` → `hass.language` → browser default
- Format options: `{ hour: 'numeric', minute: '2-digit' }`
- Only applies to time ranges ≤24 hours (longer ranges use relative time)

### State Handling Implementation
- Internal sentinel values: -999 (unknown), -998 (unavailable)
- Forward fill propagates all states until next actual change
- Backward fill excludes unknown/unavailable to prevent improper historical filling
- Color and label resolution follows existing precedence chain

## Compatibility

- **100% backwards compatible** with v3.1
- All new features have sensible defaults
- Existing configurations work without modification
- No breaking changes

## Upgrade Path

### From v3.1
Simply update the card file - no configuration changes needed.

### From v3.0 or earlier
Update the card file. Binary entities will now show locale-appropriate time formats. If you prefer the old static "HH:00 - HH:00" format, there is no configuration option to revert (this is an enhancement, not a configurable feature).

## Testing

**Beta version available:**
- Filename: `horizontal-waterfall-history-card-beta.js`
- Card type: `custom:waterfall-history-card-beta`
- Test the new features without affecting your production cards

## Known Issues

None at this time.

## Acknowledgments

This release addresses community feedback and improves international user experience.

Special thanks to:
- @uSpike for requesting locale-aware time formatting (Issue #63)

## Resources

- [Full README](README.md)
- [Changelog](CHANGELOG.md)
- [GitHub Repository](https://github.com/sxdjt/horizontal-waterfall-history-card)
- [Report Issues](https://github.com/sxdjt/horizontal-waterfall-history-card/issues)
