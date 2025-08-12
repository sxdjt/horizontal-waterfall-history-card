# Waterfall History Card for Home Assistant

**‼️ BREAKING CHANGE ‼️**

**v2.0 is a breaking change.**  It introduces multi-entity support to the card.  Previously configured cards will no longer work as expected.  You must update your old cards to use this new version.

## What does this card do?

This card shows a sensors historical data with "now" on the right side of the graph and the historical data trailing off to the left.

<img width="476" height="380" alt="Sample card data" src="https://github.com/user-attachments/assets/8bcc7253-d042-43e2-8d68-30bf7b667b91" />

Using ```compact``` mode, it works very well on mobile devices.

## ‼️ Breaking change example

**Old Configuration (v1.x):**
```yaml
type: custom:waterfall-history-card
entity: sensor.outdoor_temperature
title: Outside
```

**New Configuration (v2.0):**
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

### Example
```yaml
type: custom:waterfall-history-card
title: Environmental Overview
hours: 24             # Global default: show 24 hours of history
show_min_max: true    # Global default: show min/max values

entities:
  # This entity uses the global 24-hour setting
  - entity: sensor.office_temperature
    name: Office Temp (24h)

  # This entity overrides the time span to 12 hours and hides the min/max labels
  - entity: sensor.living_room_humidity
    name: Living Room Humidity (12h)
    hours: 12
    show_min_max: false

  # This entity shows 3 days of history
  - entity: sensor.co2_sensor
    name: CO2 Levels (Last 3 Days)
    hours: 72

  # This entity is a simple binary sensor
  - entity: binary_sensor.front_door
    name: Front Door
```

### Options

| Option                   | Type             | Default                        | Scope         | Description                                                                                                                                                                 |
| ------------------------ | ---------------- | ------------------------------ | ------------- | -------------------- |
| `title`                  | string           | `"History"` (localized)        | Global        | Card title text.                                            
| `entities`               | array            | **Required**                   | Global        | List of entities or entity config objects to display.|
| `entity`                 | string           | —                              | Entity        | Entity ID (required in entity configs).|
| `compact`                | boolean          | `false`                        | Global        | Compact style — smaller fonts/margins.|
| `default_value`          | number or null   | `null`                         | Global/Entity | Fallback value for missing data points.|
| `digits`                 | number           | `1`                            | Global/Entity | Decimal places to show for numeric values.|
| `gradient`               | boolean          | `false`                        | Global/Entity | Whether to interpolate colors smoothly between thresholds.|
| `height`                 | number           | `60`                           | Global        | Height of the waterfall chart in pixels.|
| `hours`                  | number           | `24`                           | Global/Entity | Number of hours of history to display.|
| `icon`                   | string or null   | `null`                         | Global        | Override icon in the card header.|
| `intervals`              | number           | `48`                           | Global/Entity | Number of history segments (bars).|
| `max_value`              | number or null   | `null`                         | Global        | Maximum value for color scaling. If null, calculated from data.|
| `min_value`              | number or null   | `null`                         | Global        | Minimum value for color scaling. If null, calculated from data.|
| `name`                   | string           | Entity friendly name           | Entity        | Display name for the entity.|
| `show_current`           | boolean          | `true`                         | Global/Entity | Show the current entity value next to its name.|
| `show_labels`            | boolean          | `true`                         | Global/Entity | Show time labels (“x h ago”, “Now”) under the chart.|
| `show_min_max`           | boolean          | `false`                        | Global/Entity | Show min/max values below the chart.|
| `thresholds`             | array of objects | `null` (defaults to built-ins) | Global/Entity | Value/color pairs for bar coloring. Falls back to `threshold_default_number` or `threshold_default_boolean`.|
| `unit`                   | string or null   | `null`                         | Global/Entity | Override unit of measurement (otherwise from entity attributes).|
| *(per-entity overrides)* | —                | —                              | Entity        | Any of the following can override global: `hours`, `intervals`, `thresholds`, `gradient`, `show_current`, `show_labels`, `show_min_max`, `unit`, `default_value`, `digits`. |

### Styling with Card-mod

You can use [card-mod](https://github.com/thomasloven/lovelace-card-mod) for additional styling.

### Default thresholds

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

### Default Thresholds

Temperatures in F.

| Threshold | Color     |
|-----------|-----------|
| 60        | `#4FC3F7` |
| 70        | `#81C784` |
| 80        | `#FFB74D` |
| 100       | `#FF8A65` |

