# Release Notes: v3.3.0

**Release Date:** December 3, 2025

## Overview

Version 3.3 brings automatic locale-aware time formatting to the Waterfall History Card. Time labels now respect your Home Assistant profile settings, displaying in 12-hour format for US English users and 24-hour format for European and other locales.

## What's New

### Locale-Aware Time Formatting

Time labels now automatically adapt to your Home Assistant profile's locale settings.

**Features:**
- Automatic 12-hour format for US English users (e.g., "3:00 PM - 6:00 PM")
- Automatic 24-hour format for European and other locales (e.g., "15:00 - 18:00")
- Respects Home Assistant user profile settings first
- Falls back to browser locale if HA locale unavailable
- Zero configuration required

**Examples by locale:**
- **US English (en-US)**: "3:00 PM - 6:00 PM"
- **UK English (en-GB)**: "15:00 - 18:00"
- **French (fr-FR)**: "15:00 - 18:00"
- **German (de-DE)**: "15:00 - 18:00"
- **Spanish (es-ES)**: "15:00 - 18:00"
- **Japanese (ja-JP)**: "15:00 - 18:00"

## Bug Fixes

- **Issue #63**: Time labels now respect locale settings instead of always using 24-hour format (Thanks @uSpike)

## Technical Details

### Time Formatting Implementation
- Uses browser's native `Intl.DateTimeFormat` API
- Locale resolution chain: `hass.locale.language` → `hass.language` → browser default
- Format options: `{ hour: 'numeric', minute: '2-digit' }`
- Only applies to time ranges ≤24 hours (longer ranges use relative time like "12.5h ago")

## Compatibility

- **100% backwards compatible** with v3.2
- All features work automatically with no configuration
- No breaking changes

## Upgrade Path

### From v3.2
Simply update the card file - no configuration changes needed. Time labels will automatically adapt to your locale.

### From v3.1 or earlier
Update the card file. You'll immediately see locale-appropriate time formats based on your Home Assistant profile settings.

## Configuration

**No configuration needed!** Time formatting is fully automatic.

The card uses your Home Assistant user profile locale settings. To change time format:
1. Go to your Home Assistant user profile
2. Change your language/locale setting
3. Refresh the dashboard - time labels will update automatically

## Known Issues

None at this time.

## Acknowledgments

Special thanks to:
- **@uSpike** for requesting locale-aware time formatting (Issue #63)

## Resources

- [Full README](README.md)
- [Changelog](CHANGELOG.md)
- [GitHub Repository](https://github.com/sxdjt/horizontal-waterfall-history-card)
- [Report Issues](https://github.com/sxdjt/horizontal-waterfall-history-card/issues)
