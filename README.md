# Waterfall History Card for Home Assistant

## v4.0 - Visual Editor & TypeScript

### What's New in v4.0

- **Visual Configuration Editor** - Configure your card through Home Assistant's UI editor
- **Bug Fix:** - Fixed min/max label centering issue

<img width="520" height="156" alt="Screenshot 2025-11-27 at 00 15 34" src="https://github.com/user-attachments/assets/434b5431-e7b5-43a6-9f45-480d14026e82" />

## What does this card do?

- **Horizontal waterfall charts** - visualize entity history as a sequence of colored bar segments.
- **Customizable time window** - choose how many hours to show and how many intervals to split into.
- **Threshold-based colors** - colors automatically adapt to value thresholds (configurable).
- **Binary sensor customization** - customize on/off colors and state labels for binary sensors, switches, and other binary entities.
- **Binary state labels** - display "On"/"Off", "Open"/"Closed", "Unlocked"/"Locked" instead of numeric values.
- **Unknown/unavailable state handling** - entities in unknown or unavailable states display with customizable colors and labels instead of errors.
- **Entity icons** - show icons next to entity names; toggle globally or per-entity.
- **Compact mode** - shrink fonts and spacing for tighter dashboards.
- **Inline layout mode** - display entity name, graph, and current value on a single line.
- **Per-entity overrides** - customize hours, intervals, labels, icons, colors, state labels, and display options per entity.

<img width="476" height="380" alt="Sample card data" src="https://github.com/user-attachments/assets/8bcc7253-d042-43e2-8d68-30bf7b667b91" />

---

## Installation

### HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=horizontal-waterfall-history-card)

### Manual Installation

1. Download `horizontal-waterfall-history-card.js` from the [GitHub repo](https://github.com/sxdjt/horizontal-waterfall-history-card)
2. Copy to `config/www/` in your Home Assistant directory
3. Add to Lovelace resources:

---

## Quick Start

### Basic Configuration

```yaml
type: custom:waterfall-history-card
title: Room Temperatures
entities:
  - entity: sensor.outdoor_temperature
    name: Outside
  - entity: sensor.indoor_temperature
    name: Inside
```

### Binary Sensors with State Labels

```yaml
type: custom:waterfall-history-card
title: Doors & Windows
state_on: "Open"
state_off: "Closed"
color_on: '#FFC107'
color_off: '#4CAF50'
entities:
  - binary_sensor.front_door
  - binary_sensor.back_door
  - binary_sensor.garage_door
```

---

## Configuration

### Card-Level Options

| Option           | Type      | Default     | Description                                                                 |
|------------------|-----------|-------------|-----------------------------------------------------------------------------|
| `title`          | `string`  | `"History"` | Card title shown at the top.                                                |
| `entities`       | `array`   | **required**| List of entity objects to display (see per-entity options below).           |
| `hours`          | `number`  | `24`        | Time range in hours to show history.                                        |
| `intervals`      | `number`  | `48`        | Number of intervals (bars) to divide the history into.                      |
| `height`         | `number`  | `60`        | Height in pixels of each entity's waterfall chart.                          |
| `show_labels`    | `boolean` | `true`      | Show the "X hours ago" / "now" labels under the bar.                        |
| `show_min_max`   | `boolean` | `false`     | Show min/max values under the chart.                                        |
| `show_current`   | `boolean` | `true`      | Show the current value next to the entity name.                             |
| `show_icons`     | `boolean` | `true`      | Show entity icons globally. Can be overridden per entity.                   |
| `compact`        | `boolean` | `false`     | Use smaller font sizes and spacing.                                         |
| `inline_layout`  | `boolean` | `false`     | Display name, graph, and value on a single line.                            |
| `color_on`       | `string`  | `#EEEEEE`   | Color for binary sensors in "on" state (global default).                    |
| `color_off`      | `string`  | `#636363`   | Color for binary sensors in "off" state (global default).                   |
| `binary_colors`  | `object`  | -           | Alternative way to set binary colors: `{on: '#color', off: '#color'}`.      |
| `state_on`       | `string`  | `"On"`      | Label to display for binary "on" state (global default).                    |
| `state_off`      | `string`  | `"Off"`     | Label to display for binary "off" state (global default).                   |
| `color_unknown`  | `string`  | `#FF9800`   | Color for entities in "unknown" state (orange).                             |
| `color_unavailable` | `string` | `#9E9E9E` | Color for entities in "unavailable" state (gray).                           |
| `state_unknown`  | `string`  | `"Unknown"` | Label to display for entities in "unknown" state.                           |
| `state_unavailable` | `string` | `"INOP"`  | Label to display for entities in "unavailable" state.                       |
| `thresholds`     | `array`   | see below   | Color thresholds for numeric sensors.                                       |
| `gradient`       | `boolean` | `false`     | Use gradient interpolation between thresholds.                              |
| `digits`         | `number`  | `1`         | Number of decimal places for numeric values.                                |
| `unit`           | `string`  | auto        | Override unit of measurement.                                               |
| `card_mod`       | `object`  | -           | card-mod configuration for advanced styling.                                |

---

### Per-Entity Options

Each item in `entities:` can be either a bare entity ID string, or an object with these fields:

| Option           | Type      | Default             | Description                                                         |
|------------------|-----------|---------------------|---------------------------------------------------------------------|
| `entity`         | `string`  | **required**        | The entity ID (e.g., `sensor.living_room_temp`).                    |
| `name`           | `string`  | Friendly name / ID  | Override the display name.                                          |
| `hours`          | `number`  | Inherits from card  | Override the number of hours shown for this entity.                 |
| `intervals`      | `number`  | Inherits from card  | Override the number of intervals (bars) for this entity.            |
| `show_labels`    | `boolean` | Inherits from card  | Show/hide labels just for this entity.                              |
| `show_min_max`   | `boolean` | Inherits from card  | Show/hide min/max just for this entity.                             |
| `show_current`   | `boolean` | Inherits from card  | Show/hide current value just for this entity.                       |
| `show_icons`     | `boolean` | Inherits from card  | Show/hide the icon for just this entity (overrides global setting). |
| `inline_layout`  | `boolean` | Inherits from card  | Use inline layout for this entity.                        |
| `color_on`       | `string`  | Inherits from card  | Color for this binary entity's "on" state.                          |
| `color_off`      | `string`  | Inherits from card  | Color for this binary entity's "off" state.                         |
| `binary_colors`  | `object`  | Inherits from card  | Alternative: `{on: '#color', off: '#color'}` for this entity.       |
| `state_on`       | `string`  | Inherits from card  | Label to display for this binary entity's "on" state.               |
| `state_off`      | `string`  | Inherits from card  | Label to display for this binary entity's "off" state.              |
| `color_unknown`  | `string`  | Inherits from card  | Color for this entity when in "unknown" state.            |
| `color_unavailable` | `string` | Inherits from card | Color for this entity when in "unavailable" state.       |
| `state_unknown`  | `string`  | Inherits from card  | Label to display when this entity is "unknown".           |
| `state_unavailable` | `string` | Inherits from card | Label to display when this entity is "unavailable".      |
| `thresholds`     | `array`   | Inherits from card  | Override color thresholds for this entity.                          |
| `digits`         | `number`  | Inherits from card  | Override decimal places for this entity.                            |
| `unit`           | `string`  | Inherits from card  | Override unit of measurement for this entity.                       |

---

## Time Formatting

### Automatic Locale Support

The card automatically formats time labels based on your Home Assistant profile locale settings using the browser's `Intl.DateTimeFormat` API.

**How it works:**
- Respects your Home Assistant user profile language/locale settings first
- Falls back to browser locale if HA locale not available
- Automatically displays times in your regional format

**Examples by locale:**
- **US English (en-US)**: "3:00 PM - 6:00 PM"
- **UK English (en-GB)**: "15:00 - 18:00"
- **French (fr-FR)**: "15:00 - 18:00"
- **German (de-DE)**: "15:00 - 18:00"
- **Spanish (es-ES)**: "15:00 - 18:00"
- **Japanese (ja-JP)**: "15:00 - 18:00"

**Configuration:**
No configuration needed - time formatting is fully automatic based on your Home Assistant profile settings.

**Fallback behavior:**
For time ranges greater than 24 hours, the card displays relative time (e.g., "12.5h ago") instead of absolute times.

---

## Examples

### Basic Multi-Entity Temperature Card

```yaml
type: custom:waterfall-history-card
title: Room Temperatures
hours: 12
intervals: 24
entities:
  - entity: sensor.living_room_temp
    name: Living Room
    show_icons: false
  - entity: sensor.kitchen_temp
    hours: 6
```

### Inline Layout

Display entity name, graph, and value on a single line for a more compact view:

```yaml
type: custom:waterfall-history-card
title: Temperature History
inline_layout: true
entities:
  - entity: sensor.outdoor_temperature
    name: Outside
  - entity: sensor.indoor_temperature
    name: Inside
  - entity: sensor.basement_temperature
    name: Basement
```

Mix inline and stacked layouts:

```yaml
type: custom:waterfall-history-card
title: Temperature History
entities:
  # Inline layout for these
  - entity: sensor.outdoor_temperature
    name: Outside
    inline_layout: true
  - entity: sensor.indoor_temperature
    name: Inside
    inline_layout: true
  # Default stacked layout
  - entity: sensor.attic_temperature
    name: Attic
```

### Unknown & Unavailable State Handling

Customize how entities display when they're in "unknown" or "unavailable" states:

```yaml
type: custom:waterfall-history-card
title: Sensor Monitoring
# Global defaults for all entities
color_unknown: '#FFA726'       # Orange for unknown
color_unavailable: '#78909C'   # Blue-gray for unavailable
state_unknown: "No Data"
state_unavailable: "Offline"
entities:
  - sensor.outdoor_temperature
  - sensor.indoor_temperature

  # Custom labels for critical sensor
  - entity: sensor.water_heater_temp
    name: Water Heater
    state_unavailable: "SENSOR FAULT"
    color_unavailable: '#FF1744'  # Red for fault
```

Per-entity overrides for different sensor types:

```yaml
type: custom:waterfall-history-card
title: IoT Device Status
entities:
  # WiFi sensor - custom unavailable state
  - entity: sensor.wifi_signal
    name: WiFi Sensor
    state_unavailable: "Disconnected"
    color_unavailable: '#FF5722'

  # Battery sensor - warn when unknown
  - entity: sensor.battery_level
    name: Battery Monitor
    state_unknown: "Check Battery"
    color_unknown: '#FFB300'

  # Default handling for others
  - sensor.room_temperature
```

### Binary Sensors with Custom State Labels

```yaml
type: custom:waterfall-history-card
title: Home Security
# Global state labels
state_on: "Alert"
state_off: "Normal"
entities:
  # Uses global labels ("Alert" / "Normal")
  - binary_sensor.motion_living_room

  # Custom labels for door
  - entity: binary_sensor.front_door
    name: Front Door
    state_on: "Open"
    state_off: "Closed"
    color_on: '#FFC107'
    color_off: '#4CAF50'

  # Custom labels for lock
  - entity: lock.front_door
    name: Door Lock
    state_on: "Unlocked"
    state_off: "Locked"
    color_on: '#FF5722'
    color_off: '#4CAF50'
```

### Doors & Windows with Custom Labels

```yaml
type: custom:waterfall-history-card
title: Doors & Windows
hours: 24
state_on: "Open"
state_off: "Closed"
color_on: '#FFC107'
color_off: '#4CAF50'
entities:
  - binary_sensor.front_door
  - binary_sensor.back_door
  - binary_sensor.window_living_room
  - binary_sensor.garage_door
```

### Binary Sensors with Object Notation

```yaml
type: custom:waterfall-history-card
title: Security Status
binary_colors:
  on: '#F44336'   # Red = triggered
  off: '#4CAF50'  # Green = safe
entities:
  - binary_sensor.front_door
  - binary_sensor.back_door
  - binary_sensor.window_sensor
```

### Per-Entity Color Overrides

```yaml
type: custom:waterfall-history-card
title: Home Status
# Global defaults for binary entities
color_on: '#66BB6A'
color_off: '#90A4AE'
entities:
  # Uses global colors
  - binary_sensor.motion_living_room

  # Critical sensor - custom red/green
  - entity: binary_sensor.water_leak
    name: Water Leak Detector
    color_on: '#FF1744'
    color_off: '#00C853'
    state_on: "LEAK!"
    state_off: "Dry"

  # Door sensor with custom colors
  - entity: binary_sensor.front_door
    binary_colors:
      on: '#FFD700'   # Gold when open
      off: '#263238'  # Dark when closed
    state_on: "Open"
    state_off: "Closed"
```

### Mixed Sensor Types

```yaml
type: custom:waterfall-history-card
title: Kitchen Dashboard
# Binary colors for switches/binary sensors
color_on: '#FFC107'
color_off: '#37474F'
# Numeric thresholds for temperature
thresholds:
  - value: 60
    color: '#4FC3F7'
  - value: 70
    color: '#81C784'
  - value: 80
    color: '#FFB74D'
  - value: 100
    color: '#FF8A65'
entities:
  - sensor.kitchen_temperature      # Uses thresholds
  - binary_sensor.motion_kitchen    # Uses binary_colors
  - switch.kitchen_light            # Uses binary_colors
```

---

## Binary State Label Customization

### Overview

Binary entities (switches, lights, locks, binary sensors) now display meaningful text labels instead of numeric values.

**Default behavior:** Binary entities display as "On" / "Off" 

### Common Use Cases

| Entity Type | state_on | state_off |
|-------------|----------|-----------|
| Doors/Windows | "Open" | "Closed" |
| Locks | "Unlocked" | "Locked" |
| Motion Sensors | "Motion" | "Clear" |
| Presence | "Home" | "Away" |
| Occupancy | "Occupied" | "Vacant" |
| Leak Sensors | "Leak!" | "Dry" |
| Contact Sensors | "Contact" | "No Contact" |

### Global State Labels

Set default labels for all binary entities:

```yaml
type: custom:waterfall-history-card
title: Home Status
state_on: "Active"
state_off: "Inactive"
entities:
  - binary_sensor.motion_living_room
  - switch.kitchen_light
```

### Per-Entity State Labels

Override labels for specific entities:

```yaml
type: custom:waterfall-history-card
title: Security
entities:
  - entity: binary_sensor.front_door
    state_on: "Open"
    state_off: "Closed"
  - entity: lock.front_door
    state_on: "Unlocked"
    state_off: "Locked"
```

### Supported Binary Entity Types

State labels work with any entity that has binary states (0/1, on/off, true/false):

- `binary_sensor.*` (motion, door, window, etc.)
- `switch.*`
- `light.*` (on/off only)
- `lock.*`
- `cover.*` (open/closed)
- `input_boolean.*`

---

## Unknown & Unavailable State Customization

### Overview

Entities can enter "unknown" or "unavailable" states for various reasons:
- Network connectivity issues
- Sensor failures or battery depletion
- Integration errors or API timeouts
- Home Assistant restarts before entity initialization
- Device reboots or firmware updates

### Default Behavior

| State | Color | Hex | Label | When It Happens |
|-------|-------|-----|-------|-----------------|
| Unknown | Orange | `#FF9800` | "Unknown" | Entity state cannot be determined |
| Unavailable | Gray | `#9E9E9E` | "INOP" | Entity is offline or not responding |

### Common Use Cases

| Sensor Type | state_unavailable | color_unavailable |
|-------------|-------------------|-------------------|
| WiFi/Network Sensors | "Disconnected" | `#FF5722` (red) |
| Battery Sensors | "Dead Battery" | `#F44336` (red) |
| IoT Devices | "Offline" | `#757575` (gray) |
| Critical Sensors | "FAULT" | `#D32F2F` (dark red) |
| Temperature Sensors | "Sensor Error" | `#FF9800` (orange) |

### Global State Labels

Set default labels for all entities:

```yaml
type: custom:waterfall-history-card
title: Device Monitoring
color_unknown: '#FFB300'
color_unavailable: '#B71C1C'
state_unknown: "No Data"
state_unavailable: "Device Offline"
entities:
  - sensor.outdoor_temperature
  - sensor.indoor_temperature
  - sensor.garage_temperature
```

### Per-Entity State Labels

Override labels for specific entities:

```yaml
type: custom:waterfall-history-card
title: Critical Monitoring
entities:
  - entity: sensor.water_leak_detector
    state_unavailable: "SENSOR FAULT"
    color_unavailable: '#FF0000'

  - entity: sensor.smoke_detector
    state_unknown: "CHECK SENSOR"
    color_unknown: '#FF9800'

  - entity: sensor.freezer_temp
    state_unavailable: "POWER FAILURE"
    color_unavailable: '#D32F2F'
```

### Smart State Propagation

- **Forward Fill**: Propagates all states (including unknown/unavailable) forward until the next state change
- **Backward Fill**: Excludes unknown/unavailable states to prevent incorrect historical data filling
- **Min/Max Calculations**: Automatically excludes unknown/unavailable values from min/max calculations

---

## Binary Sensor Color Customization

### Supported Binary Entities

Binary color customization works with any entity that has on/off or 0/1 states:
- `binary_sensor.*` (motion, door, window, etc.)
- `switch.*`
- `light.*` (on/off states only)
- `lock.*`
- `cover.*` (open/closed)
- `input_boolean.*`

### Color Precedence

When multiple color configurations exist, the card uses this priority:

1. Per-entity `binary_colors` or `color_on`/`color_off`
2. Global `binary_colors` or `color_on`/`color_off`
3. Default colors (`#636363` off, `#EEEEEE` on)

### Supported Color Formats

All standard CSS color formats are supported:
- **Hex**: `#FF0000` or `#F00`
- **RGB**: `rgb(255, 0, 0)`
- **RGBA**: `rgba(255, 0, 0, 0.5)`
- **Named**: `red`, `blue`, `green`, etc.
- **HSL**: `hsl(0, 100%, 50%)`

---

## Default Thresholds (Numeric Sensors)

For numeric sensors (like temperature), the card uses these default thresholds if none are specified:

```yaml
thresholds:
  - value: 60
    color: "#4FC3F7"
  - value: 70
    color: "#81C784"
  - value: 80
    color: "#FFB74D"
  - value: 100
    color: "#FF8A65"
```

Temperatures in Fahrenheit.

| Threshold | Color     | Description |
|-----------|-----------|-------------|
| 60        | `#4FC3F7` | Cold (blue) |
| 70        | `#81C784` | Cool (green)|
| 80        | `#FFB74D` | Warm (orange)|
| 100       | `#FF8A65` | Hot (red)   |

---

## Default Colors (Binary Sensors)

For binary sensors (on/off), the card uses these default colors and labels if none are specified:

| State | Color     | Label | Description       |
|-------|-----------|-------|-------------------|
| Off/0 | `#636363` | "Off" | Dark gray         |
| On/1  | `#EEEEEE` | "On"  | Light gray        |

These can be overridden globally or per-entity using `color_on`/`color_off` and `state_on`/`state_off`.

---

## Default Colors (Unknown & Unavailable States)

For entities in unknown or unavailable states, v3.2 uses these default colors and labels:

| State | Color     | Label | Description       |
|-------|-----------|-------|-------------------|
| Unknown | `#FF9800` | "Unknown" | Orange            |
| Unavailable | `#9E9E9E` | "INOP" | Gray             |

These can be overridden globally or per-entity using `color_unknown`/`color_unavailable` and `state_unknown`/`state_unavailable`.

---

## US National Weather Service Temperature Color Scale

```yaml
type: custom:waterfall-history-card
title: NWS Color Temp Sensors
thresholds:
  - value: 0
    color: "#9370DB"
  - value: 10
    color: "#4169E1"
  - value: 20
    color: "#00BFFF"
  - value: 30
    color: "#00FFFF"
  - value: 40
    color: "#32CD32"
  - value: 50
    color: "#ADFF2F"
  - value: 60
    color: "#FFD700"
  - value: 70
    color: "#FFA500"
  - value: 80
    color: "#FF4500"
  - value: 90
    color: "#FF0000"
  - value: 100
    color: "#8B0000"
  - value: 110
    color: "#800000"
entities:
  - entity: sensor.outside_temp
```

---

## Troubleshooting

### Binary colors not applying?
- Ensure the entity state is truly binary (0/1, on/off)
- Check the entity domain is supported (binary_sensor, switch, light, etc.)
- Clear browser cache after updating the card (Ctrl+F5 / Cmd+Shift+R)

### Binary state labels not showing?
- Ensure entity has binary states (0, 1, on, off)
- Check configuration spelling of `state_on` and `state_off`

### Colors look wrong?
- Verify color format (must be valid CSS color)
- Check color precedence - per-entity overrides global
- For numeric sensors, use `thresholds` instead of `binary_colors`

### Performance issues?
- Try reducing `intervals` if displaying many entities

### Unknown/unavailable states showing incorrectly?
- Check entity actually has "unknown" or "unavailable" state in Developer Tools
- Ensure color format is valid CSS (hex, rgb, rgba, named)
- Clear browser cache after updating (Ctrl+F5 / Cmd+Shift+R)

---

## Advanced: Combining Colors and Labels

State labels work seamlessly with binary color customization:

```yaml
type: custom:waterfall-history-card
title: Garage & Doors
# Visual colors
color_on: '#F44336'    # Red when open
color_off: '#4CAF50'   # Green when closed
# Text labels
state_on: "Open"
state_off: "Closed"
entities:
  - binary_sensor.garage_door
  - binary_sensor.front_door
  - binary_sensor.back_door
```

**Result:**
- When open: Shows "Open" text in red (#F44336)
- When closed: Shows "Closed" text in green (#4CAF50)

---

## Contributing

Issues and pull requests welcome on [GitHub](https://github.com/sxdjt/horizontal-waterfall-history-card)!

## License

MIT License - see LICENSE file for details
