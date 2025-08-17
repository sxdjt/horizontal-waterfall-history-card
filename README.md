# Waterfall History Card for Home Assistant

**‼️ BREAKING CHANGE ‼️**

**v2.0 is a breaking change.**  It introduces multi-entity support to the card.  Previously configured cards will no longer work as expected.  You must update your old cards to use this new version.

## What does this card do?

- **Horizontal waterfall charts** — visualize entity history as a sequence of colored bar segments.
- **Customizable time window** — choose how many hours to show and how many intervals to split into.
- **Threshold-based colors** — colors automatically adapt to value thresholds (configurable).
- **Entity icons** — show icons next to entity names; toggle globally or per-entity.
- **Compact mode** — shrink fonts and spacing for tighter dashboards.
- **Per-entity overrides** — customize hours, intervals, labels, icons, and display options per entity.


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

### Card-level options

| Option        | Type      | Default | Description                                                                 |
|---------------|-----------|---------|-----------------------------------------------------------------------------|
| `title`       | `string`  | `"History"` | Card title shown at the top.                                            |
| `entities`    | `array`   | **required** | List of entity objects to display (see per-entity options below).      |
| `hours`       | `number`  | `24`    | Time range in hours to show history.                                        |
| `intervals`   | `number`  | `48`    | Number of intervals (bars) to divide the history into.                      |
| `height`      | `number`  | `60`    | Height in pixels of each entity’s waterfall chart.                          |
| `show_labels` | `boolean` | `true`  | Show the “X hours ago” / “now” labels under the bar.                        |
| `show_min_max`| `boolean` | `true`  | Show min/max values under the chart.                                        |
| `show_current`| `boolean` | `true`  | Show the current value next to the entity name.                             |
| `show_icons`  | `boolean` | `true`  | Show entity icons globally. Can be overridden per entity.                   |
| `compact`     | `boolean` | `false` | Use smaller font sizes and spacing.                                         |

---

### Per-entity options

Each item in `entities:` can be either a bare entity ID string, or an object with these fields:

| Option         | Type      | Default             | Description                                                         |
|----------------|-----------|---------------------|---------------------------------------------------------------------|
| `entity`       | `string`  | **required**        | The entity ID (e.g., `sensor.living_room_temp`).                    |
| `name`         | `string`  | Friendly name / ID  | Override the display name.                                          |
| `hours`        | `number`  | Inherits from card  | Override the number of hours shown for this entity.                 |
| `intervals`    | `number`  | Inherits from card  | Override the number of intervals (bars) for this entity.            |
| `show_labels`  | `boolean` | Inherits from card  | Show/hide labels just for this entity.                              |
| `show_min_max` | `boolean` | Inherits from card  | Show/hide min/max just for this entity.                             |
| `show_current` | `boolean` | Inherits from card  | Show/hide current value just for this entity.                       |
| `show_icons`   | `boolean` | Inherits from card  | Show/hide the icon for just this entity (overrides global setting). |

---
### Example

```yaml
type: custom:horizontal-waterfall-history-card
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

