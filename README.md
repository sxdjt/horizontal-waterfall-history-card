# Waterfall History Card for Home Assistant

**‼️ BREAKING CHANGE ‼️**

**v2.0 is a breaking change.**  It introduces multi-entity support to the card.  Previously configured cards will no longer work as expected.  You must update your old cards to use this new version.

## What does this card do?

- **Horizontal waterfall charts** — visualize entity history as a sequence of colored bar segments.
- **Customizable time window** — choose how many hours to show and how many intervals to split into.
- **Threshold-based colors** — colors automatically adapt to value thresholds (configurable).
-  🚀 **Binary sensor color customization** — customize on/off colors for binary sensors, switches, and other binary entities.
- **Entity icons** — show icons next to entity names; toggle globally or per-entity.
- **Compact mode** — shrink fonts and spacing for tighter dashboards.
- **Per-entity overrides** — customize hours, intervals, labels, icons, colors, and display options per entity.


<img width="476" height="380" alt="Sample card data" src="https://github.com/user-attachments/assets/8bcc7253-d042-43e2-8d68-30bf7b667b91" />

Using ```compact``` mode, it works very well on mobile devices.

## ‼️ Breaking change example

**Old Configuration (v1.x):**
```yaml
type: custom:waterfall-history-card
entity: sensor.outdoor_temperature
title: Outside
```

**New Configuration (v2.0+):**
```yaml
type: custom:waterfall-history-card
title: Temperatures
entities:
  - entity: sensor.outdoor_temperature
    name: Outside
  - entity: sensor.indoor_temperature
    name: Inside
```

## Installation

### HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=horizontal-waterfall-history-card)

### Manual Installation

[GitHub repo](https://github.com/sxdjt/horizontal-waterfall-history-card)

## Configuration

### Card-level options

| Option           | Type      | Default     | Description                                                                 |
|------------------|-----------|-------------|-----------------------------------------------------------------------------|
| `title`          | `string`  | `"History"` | Card title shown at the top.                                                |
| `entities`       | `array`   | **required**| List of entity objects to display (see per-entity options below).           |
| `hours`          | `number`  | `24`        | Time range in hours to show history.                                        |
| `intervals`      | `number`  | `48`        | Number of intervals (bars) to divide the history into.                      |
| `height`         | `number`  | `60`        | Height in pixels of each entity's waterfall chart.                          |
| `show_labels`    | `boolean` | `true`      | Show the "X hours ago" / "now" labels under the bar.                        |
| `show_min_max`   | `boolean` | `true`      | Show min/max values under the chart.                                        |
| `show_current`   | `boolean` | `true`      | Show the current value next to the entity name.                             |
| `show_icons`     | `boolean` | `true`      | Show entity icons globally. Can be overridden per entity.                   |
| `compact`        | `boolean` | `false`     | Use smaller font sizes and spacing.                                         |
| `color_on`       | `string`  | `#EEEEEE`   | Color for binary sensors in "on" state (global default).                    |
| `color_off`      | `string`  | `#636363`   | Color for binary sensors in "off" state (global default).                   |
| `binary_colors`  | `object`  | see below   | Alternative way to set binary colors: `{on: '#color', off: '#color'}`.     |

---

### Per-entity options

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
| `color_on`       | `string`  | Inherits from card  | Color for this binary entity's "on" state.                          |
| `color_off`      | `string`  | Inherits from card  | Color for this binary entity's "off" state.                         |
| `binary_colors`  | `object`  | Inherits from card  | Alternative: `{on: '#color', off: '#color'}` for this entity.       |

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
    show_icons: false   # hide icon for this entity only
  - entity: sensor.kitchen_temp
    hours: 6            # custom history window
```

### Binary Sensors with Custom Colors (Global)

```yaml
type: custom:waterfall-history-card
title: Motion Sensors
color_on: '#4CAF50'     # Green when motion detected
color_off: '#424242'    # Dark gray when clear
entities:
  - binary_sensor.living_room_motion
  - binary_sensor.bedroom_motion
  - binary_sensor.kitchen_motion
```

### Binary Sensors with Object Notation

```yaml
type: custom:waterfall-history-card
title: Security
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
    color_on: '#FF1744'    # Bright red for leak
    color_off: '#00C853'   # Bright green for no leak
  
  # Door sensor with custom colors
  - entity: binary_sensor.front_door
    binary_colors:
      on: '#FFD700'   # Gold when open
      off: '#263238'  # Dark when closed
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

## Binary Sensor Color Customization

### Supported Binary Entities

Binary color customization works with any entity that has on/off or 0/1 states:
- `binary_sensor.*` (motion, door, window, etc.)
- `switch.*`
- `light.*` (on/off states only)
- `lock.*`
- `cover.*` (open/closed)
- `input_boolean.*`

### Configuration Methods

**Method 1: Simple key-value (recommended for most use cases)**
```yaml
color_on: '#00FF00'
color_off: '#FF0000'
```

**Method 2: Object notation**
```yaml
binary_colors:
  on: '#00FF00'
  off: '#FF0000'
```

Both methods work at the global card level or per-entity level.

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

## Styling with Card-mod

You can use [card-mod](https://github.com/thomasloven/lovelace-card-mod) for additional styling.

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

For binary sensors (on/off), the card uses these default colors if none are specified:

| State | Color     | Description       |
|-------|-----------|-------------------|
| Off/0 | `#636363` | Dark gray         |
| On/1  | `#EEEEEE` | Light gray        |

These can be overridden globally or per-entity using `color_on`/`color_off` or `binary_colors`.

---

## Troubleshooting

### Binary colors not applying?
- Ensure the entity state is truly binary (0/1, on/off)
- Check the entity domain is supported (binary_sensor, switch, light, etc.)
- Clear browser cache after updating the card

### Entity not showing?
- Verify the entity ID is correct
- Check that the entity exists in Home Assistant
- Look for errors in the browser console (F12)

### Colors look wrong?
- Verify color format (must be valid CSS color)
- Check color precedence - per-entity overrides global
- For numeric sensors, use `thresholds` instead of `binary_colors`

---

## Version History

### v2.2.0
- ✨ Added binary sensor color customization (`color_on`, `color_off`, `binary_colors`)
- ✨ Per-entity binary color overrides
- 🐛 Improved binary value detection

### v2.0
- ✨ Multi-entity support
- ✨ Per-entity configuration overrides
- ⚠️ Breaking change from v1.x

---

## Contributing

Issues and pull requests welcome on [GitHub](https://github.com/sxdjt/horizontal-waterfall-history-card)!

## License

MIT License - see LICENSE file for details
