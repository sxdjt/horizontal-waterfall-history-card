# Changelog

## [4.0.0] - 2025-12-04

### Added
- **Visual Configuration Editor**: Comprehensive UI editor for configuring card and per-entity settings through Home Assistant's interface
  - Basic settings: title, time window, intervals, bar height, decimal places
  - Display options: icons, labels, current values, min/max, compact mode, inline layout, gradient mode
  - Binary state configuration: colors and labels for on/off states
  - Unknown/unavailable state configuration: colors and labels for error states
  - Global thresholds: define color thresholds for numeric sensors
  - Per-entity configuration: override any global setting for individual entities
  - Entity threshold configuration: define custom thresholds per entity

### Changed
- **TypeScript Build System**: Migrated from single-file JavaScript to TypeScript with Rollup
  - Improved code organization with separate files for types, constants, editor, and main card
  - Modern development tooling with TypeScript compiler and type checking
  - Minified production builds for better performance
  - Source maps for easier debugging

### Fixed
- Min/max label centering issue - labels now properly center below charts

### Technical Details
- Element name: `waterfall-history-card` (unchanged)
- Editor element: `waterfall-history-card-editor`
- Build process: TypeScript → Rollup → minified JavaScript
- Source files in `src/` directory
- Built files in `dist/` directory, copied to root for HACS compatibility

### Backwards Compatibility
- 100% backwards compatible with v3.3
- All YAML configurations work without modification
- Visual editor is optional - YAML configuration still fully supported

---

## [3.3.0] - 2025-12-03

### Added
- **Locale-Aware Time Formatting**: Time labels now automatically respect Home Assistant profile locale settings
  - Uses browser's `Intl.DateTimeFormat` API for automatic locale detection
  - Displays 12-hour format (e.g., "3:00 PM - 6:00 PM") for US English users
  - Displays 24-hour format (e.g., "15:00 - 18:00") for European and other locales
  - Falls back to browser locale if Home Assistant locale not available
  - No configuration needed - fully automatic based on user profile

### Fixed
- Issue #63: Time labels now respect locale settings instead of always using 24-hour format (Thanks @uSpike)

### Technical Details
- Locale resolution chain: `hass.locale.language` → `hass.language` → browser default
- Uses `Intl.DateTimeFormat` with options `{ hour: 'numeric', minute: '2-digit' }`
- Only applies to time ranges ≤24 hours (longer ranges use relative time)

### Backwards Compatibility
- 100% backwards compatible with v3.2
- Time formatting is fully automatic with no configuration required
- No breaking changes

---

## [3.2.0] - 2025-12-03

### Added
- **Unknown and Unavailable State Handling**: Dedicated support for entities in "unknown" or "unavailable" states
- Configurable colors for unknown states (`color_unknown`, default: orange)
- Configurable colors for unavailable states (`color_unavailable`, default: gray)
- Configurable labels for unknown states (`state_unknown`, default: "Unknown")
- Configurable labels for unavailable states (`state_unavailable`, default: "INOP")
- Per-entity override support for all unknown/unavailable configuration options

### Fixed
- Issue #62: Proper rendering of entities when they enter unknown or unavailable states
- Min/Max calculations now exclude unknown and unavailable states
- Improved forward/backward fill logic to prevent incorrect state propagation from unavailable/unknown states

### Technical Details
- Special sentinel values for internal state tracking (-999 for unknown, -998 for unavailable)
- Forward fill propagates all states including unavailable/unknown until next actual state change
- Backward fill excludes unavailable/unknown states to prevent improper historical data filling
- Unknown/unavailable states display with distinct colors and labels for better visibility

### Backwards Compatibility
- 100% backwards compatible with v3.1
- All new configuration options have sensible defaults
- Existing cards are unaffected and will use default unknown/unavailable handling
- No breaking changes

---

## [3.1.0] - 2025-01-27

### Added
- **Inline Layout Mode**: New `inline_layout` configuration option displays entity name, graph, and current value on a single line for more compact cards
- Per-entity `inline_layout` override support
- Compact mode styling for inline layout

### Technical Details
- Inline layout uses flexbox with proper vertical alignment
- Time range labels are automatically hidden in inline mode for cleaner appearance
- Text and icons vertically centered with graph using line-height matching
- Supports all existing configuration options (icons, colors, thresholds, etc.)

### Backwards Compatibility
- 100% backwards compatible with v3.0
- Defaults to `false`, so existing cards are unaffected
- No breaking changes

---

## [3.0.0] - 2024

### Added
- Built on LitElement for performance and Home Assistant standards compliance
- Binary state label customization (`state_on`, `state_off`)
- Intelligent rendering: only updates when tracked entities change
- Significant performance improvements (95%+ reduction in re-renders)

### Changed
- Binary entities now display "On"/"Off" by default instead of "0"/"1"
- Migrated from vanilla HTMLElement to LitElement

### Fixed
- Code quality issues (redundant checks, array mutation)

### Backwards Compatibility
- 100% backwards compatible with v2.x configurations
- All existing configurations work without modifications

---

## [2.2.0]

### Added
- Binary sensor color customization (`color_on`, `color_off`, `binary_colors`)
- Per-entity binary color overrides
- Improved binary value detection

---

## [2.0.0]

### Added
- Multi-entity support
- Per-entity configuration overrides

### Breaking Changes
- Changed from single `entity` to `entities` array
- See README for migration guide

---

## [1.x]

- Single entity per card
- Basic waterfall visualization
