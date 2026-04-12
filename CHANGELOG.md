# Changelog

## [4.4.0] - 2026-04-12

### Added
- **Custom state matching for non-binary entities**: `state_on` and `state_off` now match against the raw HA state string in addition to serving as display labels. This enables tracking of entities like `person.*` (states: `home`/`not_home`), `device_tracker.*`, `cover.*`, `alarm_control_panel.*`, and any other entity whose states are not `on`/`off`.

### Fixed
- Sections view sizing: added `getGridOptions()` and `height: 100%` so the card renders correctly in HA dashboard sections layout.

---

## [4.3.0] - 2026-04-06

### Added
- **Interval Value Mode** (`interval_value`): New option to control which value represents each time bucket when multiple state changes occur within it
  - `last` (default) - final recorded value in the bucket (prior behavior, no breaking change)
  - `min` - lowest value in the bucket; reveals brief dips (e.g., latency dropping to 0, brief signal loss)
  - `max` - highest value in the bucket; reveals brief spikes and transient activations (e.g., a door that opened and closed within one bucket)
  - Configurable globally or per-entity
  - Available in the visual editor under Basic Settings (global) and entity Advanced Overrides (per-entity)

### Fixed
- Issue #71: Short-lived state changes within a time bucket were silently overwritten by the final value in that bucket. With `interval_value: min` or `interval_value: max`, brief but meaningful events are now visible.
- HA 2026.4 compatibility: binary sensor history going blank after first refresh cycle.
  - Root cause: HA 2026.4 returns an empty array `[]` from the history API for entities that have not changed recently, rather than an initial state point. An empty array is truthy in JS, so the card ran `processHistoryData([])`, produced all-null buckets, and blanked the chart.
  - Fix: three-way response handling in `updateCard()`:
    1. Non-empty response - process normally (no behavior change)
    2. Empty response + no cache (first load for a stable entity) - backfill all buckets with current state so stable sensors show a solid bar instead of blank
    3. Empty response + cache exists (refresh) - preserve cached data; critical for `interval_value: max/min` users where brief events must survive refresh cycles

### Changed
- Dependency updates; TypeScript 6 compatibility fixes

### Notes
- `interval_value: last` is 100% backwards compatible; default behavior is unchanged
- Special sentinel values (unknown/unavailable) are excluded from min/max comparison

---

## [4.3.0-beta.2] - 2026-04-03

### Added
- `interval_value` option documented in README with usage guide, behavior table, and per-entity examples

### Fixed
- Build banner no longer includes a "Last changed" timestamp

### Changed
- Dependency updates; TypeScript 6 compatibility fixes

---

## [4.3.0-beta.1] - 2026-03-12

### Added
- `interval_value` option (`last` / `min` / `max`) to control bucket value representation

### Fixed
- Issue #71: Short-lived state changes within a time bucket were silently overwritten

---

## [4.2.0] - 2026-01-18

### Added
- **Start Offset Feature**: New `start_offset` option to view historical time windows
  - Set `start_offset: 24` to view data from 24-48 hours ago instead of 0-24 hours ago
  - Configurable both globally and per-entity
  - Allows displaying the same entity multiple times with different time offsets
  - Useful for comparing today's data with yesterday's data side-by-side
  - Time labels automatically adjust to show correct ranges (e.g., "48h ago" to "24h ago")
  - Historical (offset) data uses longer refresh intervals since it changes less frequently

### Technical Details
- Composite cache keys (`entityId_startOffset`) support same entity with different offsets
- Offset entities don't append current state (they display historical data only)
- Refresh interval for offset data is 4x longer than real-time data

### Backwards Compatibility
- 100% backwards compatible with v4.1 and earlier
- Default `start_offset: 0` maintains existing behavior
- No breaking changes

---

## [4.1.1-beta] - 2025-12-24

### Fixed
- Issue #67: Zero values now properly captured in Min/Max calculations
  - Removed `skip_initial_state` parameter from history API call
  - Initial state at beginning of time window is now included
  - Added safety checks for edge cases where all values are null/unavailable

BETA RELEASE: Testing fix for GitHub issue #67 before production release.

## [4.1.0-beta] - 2025-12-14

### Added
- **Last Different State for Binary Entities**: State changes are now captured reliably
  - Shows the last state that differs from the interval's starting state
  - Captures transient events like doors briefly opened, lights toggled, or motion briefly detected
  - Example: Closed→Open→Closed shows "Open" (last different from starting Closed)
  - Example: Open→Closed→Open shows "Closed" (last different from starting Open)
  - Example: Closed→Open→Closed→Inop shows "Inop" (last different from starting Closed)
  - Simple, clear visualization without split bars
  - Applies to binary_sensor, switch, light, and input_boolean domains

### Changed
- "Last different state" algorithm for binary entities replaces multi-state tracking
- Continuous sensors (temperature, humidity, etc.) use simple last-value sampling
- Binary entity detection based on domain: binary_sensor, switch, light, or input_boolean
- **Inline Layout Space Optimization**: Reduced fixed width allocations to maximize graph display
  - Entity name section: 120px to 100px (17% reduction)
  - Current value section: 60px to 50px (17% reduction)
  - Results in approximately 8% more space for waterfall charts
  - Long entity names gracefully truncate with text-overflow: ellipsis
- **Customizable Spacing via card-mod**: Users can adjust horizontal spacing to suit their needs
  - Override entity name width to prevent truncation or save space
  - Override current value width to accommodate longer values or save space
  - See documentation for card-mod syntax examples

### Fixed
- **Issue #65**: Brief state changes now visible for binary entities using "last different state" algorithm
- Data loss when multiple state changes occur within single interval

### Technical Details
- Beta version available as `waterfall-history-card-beta`
- Binary entity detection: checks domain (binary_sensor, switch, light, or input_boolean)
- Last different state: shows last state that differs from interval's starting state
- Works with custom state labels (state_on/state_off can be any text)
- Simpler implementation: no split bars, no IntervalState tracking, no duration calculations
- Backwards compatible: Non-binary entities render identically to v4.0
- Build command: `npm run build:beta`

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
