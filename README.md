# Waterfall History Card for Home Assistant

![GitHub Release](https://img.shields.io/github/v/release/sxdjt/horizontal-waterfall-history-card?style=for-the-badge)
[![AI Assisted](https://img.shields.io/badge/AI-Claude%20Code-AAAAAA.svg?style=for-the-badge)](https://claude.ai/code)
![GitHub License](https://img.shields.io/github/license/sxdjt/horizontal-waterfall-history-card?style=for-the-badge)

## What does this card do?

- **Horizontal waterfall charts** - visualize entity history as a sequence of colored bar segments.
- **Customizable time window** - choose how many hours to show and how many intervals to split into.
- **Threshold-based colors** - colors automatically adapt to value thresholds (configurable).
- **Binary entities** - custom on/off colors and labels (e.g. "Open"/"Closed", "Unlocked"/"Locked") for binary sensors, switches, locks and other two-state entities.
- **Multi-state sensor support** - map any set of HA state strings to distinct colors (e.g. HVAC modes: cool, heat, fan_only, off).
- **Attribute tracking** - chart an entity attribute instead of the state (e.g. `hvac_action: heating|idle` on climate entities).
- **Unknown/unavailable state handling** - entities in unknown or unavailable states display with customizable colors and labels instead of errors.
- **Entity icons** - show icons next to entity names; toggle globally or per-entity.
- **Compact mode** - shrink fonts and spacing for tighter dashboards.
- **Inline layout mode** - display entity name, graph, and current value on a single line.
- **Short duration event detection** - with `interval_value: max`, a cell shows a brief state change (e.g. a door opened and closed within it) that the default `last` would hide. See [How Each Interval Is Represented](#how-each-interval-is-represented-interval_value).
- **Per-entity overrides** - customize hours, intervals, labels, icons, colors, state labels, and display options per entity.
- **More-info on click** - click an entity to open its Home Assistant more-info dialog.

<img  height="600" alt="Card" src="https://github.com/user-attachments/assets/d6a1f295-16be-461d-b332-b9c07b04f37e" />

---

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=horizontal-waterfall-history-card)

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

For doors, switches and other binary entities, see [Binary State Label Customization](#binary-state-label-customization).

---

## Configuration

The card has a visual editor (dashboard -> Edit card). A few options are YAML-only:

- Card level: `binary_colors`, `card_mod`, `icon`, `start_offset`, `unit`
- Per entity: `binary_colors`, `gradient`, `show_min_max`, `start_offset`, `state_on`/`state_off`, and the unknown/unavailable colors and labels

### Card-Level Options

| Option           | Type      | Default     | Description                                                                 |
|------------------|-----------|-------------|-----------------------------------------------------------------------------|
| `entities`       | `array`   | **required**| List of entity objects to display (see per-entity options below).           |
| `attribute`      | `string`  | -           | Track an entity attribute instead of the state (global default), e.g. `hvac_action`. Pair with `state_colors` to color the attribute's values. An entity can track its state instead with `attribute: state` (case-insensitive). See [Tracking an Attribute](#tracking-an-attribute). |
| `binary_colors`  | `object`  | -           | Alternative way to set binary colors: `{on: '#color', off: '#color'}`.      |
| `card_mod`       | `object`  | -           | card-mod configuration for advanced styling. See [Styling: CSS Variables](#styling-css-variables). |
| `cell_gap`       | `number`  | `1`         | Gap in pixels between bar segments. Set to `0` to disable gaps (useful for e-ink/high-contrast themes). |
| `color_off`      | `string`  | `#2d3245`   | Color for binary sensors in "off" state (global default).                   |
| `color_on`       | `string`  | `#4a9eff`   | Color for binary sensors in "on" state (global default).                    |
| `color_unavailable` | `string` | `#9E9E9E` | Color for entities in "unavailable" state (gray).                           |
| `color_unknown`  | `string`  | `#FF9800`   | Color for entities in "unknown" state (orange).                             |
| `compact`        | `boolean` | `false`     | Use smaller font sizes and spacing.                                         |
| `digits`         | `number`  | `1`         | Number of decimal places for numeric values.                                |
| `gradient`       | `boolean` | `false`     | Use gradient interpolation between thresholds.                              |
| `height`         | `number`  | `60`        | Height in pixels of each entity's waterfall chart.                          |
| `hours`          | `number`  | `24`        | Time range in hours to show history.                                        |
| `icon`           | `string`  | entity/domain default | Override the icon shown next to entity names (e.g. `mdi:power-cycle`). Falls back to the entity's own icon, then a domain default. Can be overridden per entity. |
| `inline_layout`  | `boolean` | `false`     | Display name, graph, and value on a single line. Time labels are hidden in this layout. |
| `interval_value` | `string`  | `"last"`    | How to represent each bucket: `last` (final value), `min` (lowest value), `max` (highest value). |
| `intervals`      | `number`  | `48`        | Number of intervals (bars) to divide the history into.                      |
| `label_count`    | `number`  | `1`         | Number of label segments. `1` = start + end only; `2` = start + midpoint + end; max = `hours`. |
| `label_format`   | `string`  | `"relative"`| Format for the time labels under the bar: `relative` (e.g. `24h ago`, `Now`), `24h` (e.g. `14:30`), `12h` (e.g. `2:30 PM`). Does not affect the hover tooltip, which always shows clock times. |
| `show_current`   | `boolean` | `true`      | Show the current value next to the entity name.                             |
| `show_icons`     | `boolean` | `true`      | Show entity icons globally. Can be overridden per entity.                   |
| `show_labels`    | `boolean` | `true`      | Show time labels under the bar.                                             |
| `show_min_max`   | `boolean` | `false`     | Show min/max values under the chart.                                        |
| `start_offset`   | `number`  | `0`         | Hours to offset the time window (e.g., 24 = show 24-48h ago instead of 0-24h). |
| `state_colors`   | `object`  | -           | Map HA state strings to colors for multi-state entities (e.g. HVAC modes). Keys are state names, values are colors. Applies to every entity unless the entity sets its own `state_colors`. List order ranks the states lowest to highest for `interval_value: min`/`max`. Overrides binary on/off logic when present. |
| `state_off`      | `string`  | `"Off"`     | Matches the HA state string for "off" and sets the display label (global default). E.g. `"not_home"` for a person entity. |
| `state_on`       | `string`  | `"On"`      | Matches the HA state string for "on" and sets the display label (global default). E.g. `"home"` for a person entity.  |
| `state_unavailable` | `string` | `"INOP"`  | Label to display for entities in "unavailable" state.                       |
| `state_unknown`  | `string`  | `"Unknown"` | Label to display for entities in "unknown" state.                           |
| `thresholds`     | `array`   | see below   | Color thresholds for numeric sensors.                                       |
| `title`          | `string`  | `"History"` | Card title shown at the top.                                                |
| `unit`           | `string`  | auto        | Override unit of measurement.                                               |

---

### Per-Entity Options

Each item in `entities:` can be either a bare entity ID string, or an object with these fields:

| Option           | Type      | Default             | Description                                                         |
|------------------|-----------|---------------------|---------------------------------------------------------------------|
| `entity`         | `string`  | **required**        | The entity ID (e.g., `sensor.living_room_temp`).                    |
| `attribute`      | `string`  | Inherits from card  | Track this attribute instead of the state for this entity (e.g. `hvac_action`). Set to `state` (case-insensitive) to track the state, opting out of a card-level `attribute`. |
| `binary_colors`  | `object`  | Inherits from card  | Alternative: `{on: '#color', off: '#color'}` for this entity.       |
| `color_off`      | `string`  | Inherits from card  | Color for this binary entity's "off" state.                         |
| `color_on`       | `string`  | Inherits from card  | Color for this binary entity's "on" state.                          |
| `color_unavailable` | `string` | Inherits from card | Color for this entity when in "unavailable" state.       |
| `color_unknown`  | `string`  | Inherits from card  | Color for this entity when in "unknown" state.            |
| `digits`         | `number`  | Inherits from card  | Override decimal places for this entity.                            |
| `gradient`       | `boolean` | Inherits from card  | Use gradient interpolation between thresholds for this entity.      |
| `hours`          | `number`  | Inherits from card  | Override the number of hours shown for this entity.                 |
| `icon`           | `string`  | Inherits from card  | Override the icon for this entity (e.g. `mdi:power-cycle`). Takes precedence over the card-level `icon`, the entity's own icon, and the domain default. |
| `inline_layout`  | `boolean` | Inherits from card  | Use inline layout for this entity.                        |
| `interval_value` | `string`  | Inherits from card  | How to represent each bucket: `last`, `min`, or `max`.              |
| `intervals`      | `number`  | Inherits from card  | Override the number of intervals (bars) for this entity.            |
| `label_count`    | `number`  | Inherits from card  | Override label segment count for this entity.                       |
| `label_format`   | `string`  | Inherits from card  | Override label format: `relative`, `24h`, or `12h`.                |
| `name`           | `string`  | Friendly name / ID  | Override the display name.                                          |
| `show_current`   | `boolean` | Inherits from card  | Show/hide current value just for this entity.                       |
| `show_icons`     | `boolean` | Inherits from card  | Show/hide the icon for just this entity (overrides global setting). |
| `show_labels`    | `boolean` | Inherits from card  | Show/hide labels just for this entity.                              |
| `show_min_max`   | `boolean` | Inherits from card  | Show/hide min/max just for this entity.                             |
| `start_offset`   | `number`  | Inherits from card  | Hours to offset the time window for this entity.                    |
| `state_colors`   | `object`  | Inherits from card  | Map HA state strings to colors for this entity. Overrides global `state_colors`. |
| `state_off`      | `string`  | Inherits from card  | Matches the HA state string for "off" and sets the display label for this entity. |
| `state_on`       | `string`  | Inherits from card  | Matches the HA state string for "on" and sets the display label for this entity.  |
| `state_unavailable` | `string` | Inherits from card | Label to display when this entity is "unavailable".      |
| `state_unknown`  | `string`  | Inherits from card  | Label to display when this entity is "unknown".           |
| `thresholds`     | `array`   | Inherits from card  | Override color thresholds for this entity.                          |
| `unit`           | `string`  | Inherits from card  | Override unit of measurement for this entity.                       |

---

## Styling: CSS Variables

The card's typography is driven by CSS custom properties. Set them in your theme, in a `card_mod` block, or anywhere else that cascades into the card. No `!important` is needed. Every variable is optional; unset variables keep the defaults below.

### Typography

| Variable                                | Default                  | Applies to                                  |
|-----------------------------------------|--------------------------|---------------------------------------------|
| `--waterfall-entity-name-color`          | `--primary-text-color`   | Entity names, both layouts.                 |
| `--waterfall-entity-name-font-size`      | `11px` (`10px` compact)  | Entity names, both layouts.                 |
| `--waterfall-entity-name-font-weight`    | `500`                    | Entity names, both layouts.                 |
| `--waterfall-entity-name-letter-spacing` | `0.07em`                 | Entity names, both layouts.                 |
| `--waterfall-entity-name-text-transform` | `uppercase`              | Entity names, both layouts.                 |
| `--waterfall-header-color`               | `--secondary-text-color` | The card title.                             |
| `--waterfall-header-font-size`           | `11px` (`10px` compact)  | The card title.                             |
| `--waterfall-header-font-weight`         | `600`                    | The card title.                             |
| `--waterfall-header-letter-spacing`      | `0.10em`                 | The card title.                             |
| `--waterfall-header-text-transform`      | `uppercase`              | The card title.                             |
| `--waterfall-labels-color`               | `--primary-text-color`   | Time labels under the bar.                  |
| `--waterfall-labels-font-size`           | `9.5px`                  | Time labels under the bar.                  |
| `--waterfall-labels-letter-spacing`      | `0.04em`                 | Time labels under the bar.                  |
| `--waterfall-min-max-color`              | `--primary-text-color`   | The min/max label.                          |
| `--waterfall-min-max-font-size`          | `10px`                   | The min/max label.                          |
| `--waterfall-min-max-letter-spacing`     | `0.03em`                 | The min/max label.                          |
| `--waterfall-value-color`                | inherits entity name     | The current-value readout.                  |
| `--waterfall-value-font-size`            | inherits entity name     | The current-value readout.                  |
| `--waterfall-value-font-weight`          | inherits entity name     | The current-value readout.                  |
| `--waterfall-value-letter-spacing`       | inherits entity name     | The current-value readout.                  |
| `--waterfall-value-text-transform`       | inherits entity name     | The current-value readout.                  |

The `--waterfall-value-*` variables fall back to their `--waterfall-entity-name-*` counterparts, so setting the entity-name variable alone restyles names and values together. Set a `--waterfall-value-*` variable only when you want the readout to differ from the name.

### Matching the Home Assistant UI

The card ships with a deliberately compact, small-caps label style. If you would rather it blend into the surrounding dashboard, point the variables at Home Assistant's own typography tokens:

```yaml
# In your theme
waterfall-header-font-size: var(--ha-font-size-l)
waterfall-header-font-weight: var(--ha-font-weight-normal)
waterfall-header-letter-spacing: normal
waterfall-header-text-transform: none
waterfall-header-color: var(--primary-text-color)
waterfall-entity-name-font-size: var(--ha-font-size-m)
waterfall-entity-name-font-weight: var(--ha-font-weight-normal)
waterfall-entity-name-letter-spacing: normal
waterfall-entity-name-text-transform: none
```

Because a theme cascades everywhere, this restyles every waterfall card at once. To restyle a single card instead, put the same declarations in a `card_mod` block under `:host { ... }`.

> **Note the `--` prefix.** Theme files omit it (Home Assistant adds it for you), but inside `card_mod` you must write it yourself. Also check the key is `card_mod` with an underscore; `card-mod:` is silently ignored.

```yaml
card_mod:
  style: |
    :host {
      --waterfall-entity-name-text-transform: none;
    }
```

### Internal variables

The card sets `--header-font-size`, `--entity-name-font-size`, `--labels-margin-top`, `--waterfall-height` and `--waterfall-cell-gap` as inline styles from the `compact`, `height` and `cell_gap` options, so a theme cannot override them. Use the `--waterfall-*` variables above instead.

---

## How Each Interval Is Represented: `interval_value`

The time range is split into `intervals` equal buckets; when a bucket holds several changes, `interval_value` picks which value it shows:

| Value  | Behavior                                         | Use case                                              |
|--------|--------------------------------------------------|-------------------------------------------------------|
| `last` | Last recorded state in the bucket (default)      | General use; shows where the entity ended up          |
| `min`  | Lowest value recorded in the bucket              | Detecting brief dips (e.g., latency spike to 0)       |
| `max`  | Highest value recorded in the bucket             | Detecting brief activations (e.g., door briefly opened) |

Binary sensors count on as 1 and off as 0, so `max` shows a bucket as on if the entity was on at any point in it:

| Activity in bucket          | `last` | `min` | `max` |
|-----------------------------|--------|-------|-------|
| Closed → Open → Closed      | Off    | Off   | **On**  |
| Open → Closed → Open        | On     | **Off** | On  |
| Closed the whole time       | Off    | Off   | Off   |

Set globally or per-entity:

```yaml
# Detect any brief door opening within each bucket
- entity: binary_sensor.front_door
  interval_value: max
  state_on: "Open"
  state_off: "Closed"

# Detect any brief latency drop to zero
- entity: sensor.wan_latency
  interval_value: min
```

---

## Examples

### Per-Entity Overrides

Any per-entity option overrides the card-level value for that entity:

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

### Historical Comparison with Start Offset

Compare today's data with yesterday's data by using `start_offset`:

```yaml
type: custom:waterfall-history-card
title: Temperature Comparison
hours: 24
entities:
  # Today's temperature (default, no offset)
  - entity: sensor.outdoor_temperature
    name: Today
  # Yesterday's temperature (24 hour offset)
  - entity: sensor.outdoor_temperature
    name: Yesterday
    start_offset: 24
```

### Inline Column Widths with card-mod

In inline layout, widen the name and value columns so names aren't truncated:

```yaml
type: custom:waterfall-history-card
title: Temperature History
inline_layout: true
entities:
  - sensor.outdoor_temperature
  - sensor.indoor_temperature
card_mod:
  style: |
    .entity-inline-container .entity-inline-name {
      width: 120px !important;
    }
    .entity-inline-container .entity-inline-value {
      width: 60px !important;
    }
```

### HVAC Multi-State Sensor

```yaml
type: custom:waterfall-history-card
title: HVAC History
state_colors:
  'off': '#2d3245'
  auto: '#9E9E9E'
  cool: '#4FC3F7'
  heat: '#EF5350'
  fan_only: '#66BB6A'
entities:
  - climate.living_room
  - climate.bedroom
```

State names must match the HA state values exactly (case-insensitive). A card-level `state_colors` applies to every entity; an entity's own `state_colors` replaces it for that entity. Entities with numeric states, such as temperature sensors on the same card, keep their numeric values and thresholds. List order matters only for `interval_value: min` / `max`, where the first state is the lowest and the last is the highest. Use the default `last` for HVAC modes, since they have no natural ranking.

### Ranked States with `interval_value: max`

```yaml
type: custom:waterfall-history-card
title: Daily Goals
hours: 336
intervals: 14
interval_value: max
state_colors:
  Poor: '#e45e65'
  Reasonable: '#e0b400'
  Good: '#0da035'
  Exceeded: '#039BE5'
entities:
  - entity: input_select.exercise_quality
    name: Exercise
  - entity: input_select.daily_steps_quality
    name: Steps
```

Because the states are listed worst to best, `interval_value: max` shows the best state reached in each cell. Each cell is a rolling window ending at the current time, not a calendar day.

### Tracking an Attribute

By default the card charts the entity's state. Set `attribute` to chart one of the entity's attributes instead - for example, a climate entity's state is the HVAC mode (`heat`, `cool`, `off`), while `hvac_action` tells you what it is actually doing right now (`heating`, `idle`, `cooling`).

The attribute's string value is matched against `state_colors` (case-insensitive) exactly like a state, so all the multi-state behavior above applies.

IMPORTANT: a string value with no color in `state_colors` renders as an empty cell. If the bar is blank, the attribute's values are missing from `state_colors`. Check the exact values in Developer Tools -> States. `hvac_action` is the one exception: it has built-in colors (see below).

#### Example 1: what the thermostat is doing (`hvac_action`, no colors needed)

```yaml
type: custom:waterfall-history-card
title: Heating and Cooling
hours: 24
interval_value: max
attribute: hvac_action
entities:
  - entity: climate.home
```

`attribute` set at the card level applies to every entity. With no `state_colors`, these built-in colors are used:

| `hvac_action` | Color     |
|---------------|-----------|
| `off`         | `#2d3245` |
| `idle`        | `#9E9E9E` |
| `fan`         | `#66BB6A` |
| `drying`      | `#FFB74D` |
| `defrosting`  | `#B39DDB` |
| `preheating`  | `#FF8A65` |
| `cooling`     | `#4FC3F7` |
| `heating`     | `#EF5350` |

The table runs from inactive to active, which is the ranking `interval_value: min`/`max` uses. `interval_value: max` (as above) colors a cell red if the heat ran at any point in it, even briefly.

#### Example 2: your own `hvac_action` colors

```yaml
type: custom:waterfall-history-card
title: Bathroom Heating
entities:
  - entity: climate.koupelna
    attribute: hvac_action
    state_colors:
      'off': '#2d3245'
      idle: '#2d3245'
      heating: '#EF5350'
```

Your `state_colors` replaces the built-in colors entirely; they are not merged. List every value you want to see. Here `cooling` or `fan` would render as empty cells. Quote `'off'`: unquoted, YAML may read it as a boolean.

#### Example 3: any other attribute (`state_colors` required)

Only `hvac_action` has built-in colors. For any other text attribute, map each value it can take. This charts an ecobee's `preset_mode`:

```yaml
type: custom:waterfall-history-card
title: Thermostat Preset
entities:
  - entity: climate.home
    attribute: preset_mode
    state_colors:
      sleep: '#5C6BC0'
      home: '#66BB6A'
      away: '#FFB74D'
      away_indefinitely: '#9E9E9E'
```

#### Notes

- The built-in `hvac_action` colors apply only when neither the entity nor the card sets `state_colors`. A card-level `state_colors` meant for other entities also replaces them, so give the `hvac_action` entity its own `state_colors` in that case.
- In the visual editor, clearing an entity's attribute field inherits the card-level value. Enter `state` to track the state instead.
- Attribute mode fetches full history with attributes on every refresh. A long `hours` window on a frequently updating entity (e.g. a climate entity reporting `current_temperature` every few seconds) can mean thousands of rows per request.
- Numeric attributes (e.g. `current_temperature`) use `thresholds` like a sensor, and boolean attributes (e.g. `some_flag: true`) use the on/off colors. Neither is matched against `state_colors`.
- Numeric attribute values show no unit, because the entity's `unit_of_measurement` describes its state, not the attribute. Set `unit` to display one.
- If the entity itself becomes `unknown`/`unavailable`, that still wins, even in attribute mode.
- History is fetched per (entity, attribute, time offset) combination, so the same entity can be charted twice in one card, once by state and once by attribute.

---

## Binary State Label Customization

Labels and colors can be set for the whole card and overridden per entity:

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

Binary colors resolve in this order: per-entity `binary_colors`, per-entity `color_on`/`color_off`, card-level `binary_colors`, card-level `color_on`/`color_off`, then the defaults in the options table. The first level that sets either color supplies both: a per-entity `color_on` alone pairs with the default off color, not the card-level `color_off`.

Any `thresholds` setting, at card or entity level, replaces on/off colors entirely, because on and off are colored as the values 1 and 0. A card-level temperature scale will therefore also color a door sensor on the same card, and per-entity `color_on`/`color_off` will not change that. Give the binary entity its own `thresholds` instead:

```yaml
- entity: binary_sensor.front_door
  thresholds:
    - value: 0
      color: '#2d3245'
    - value: 1
      color: '#4a9eff'
```

A sensor with a numeric state (e.g. `1.0`) is shown as a number, even when it reads exactly 0 or 1. If a sensor reports `0`/`1` to mean off/on, set a per-entity `color_on`/`color_off`, `binary_colors` or `state_on`/`state_off` to show it as binary.

### Custom State Matching for Non-Binary Entities

Entities like `person` or `device_tracker` use state strings other than `on`/`off`. Use `state_on` and `state_off` to tell the card which HA state values map to on/off. The same values are used as the display labels.

```yaml
type: custom:waterfall-history-card
title: Presence History
hours: 12
entities:
  - entity: person.jane
    state_on: "home"
    state_off: "not_home"
    color_on: "#4CAF50"
    color_off: "#9E9E9E"
```

Note: check the exact state values your entity uses in Developer Tools -> States. For example, `person.*` uses `home` and `not_home`; `device_tracker.*` may use `home` and `not_home` or zone names.

---

## Supported Color Formats

All standard CSS color formats are supported:
- **Hex**: `#FF0000` or `#F00`
- **HSL**: `hsl(0, 100%, 50%)`
- **Named**: `red`, `blue`, `green`, etc.
- **RGB**: `rgb(255, 0, 0)`
- **RGBA**: `rgba(255, 0, 0, 0.5)`

NOTE: with `gradient: true`, threshold and on/off colors must be 6-digit hex (`#FF0000`). Blending treats any other format, including 3-digit hex, as black, so cells come out black or darkened.

---

## Thresholds and Gradient

Numeric values are colored by `thresholds`, a list of `value`/`color` pairs ordered from lowest to highest value. Each color applies from its `value` up to the next threshold, and values below the first threshold use the first color.

With `gradient: true`, each color is exact at its `value` and blends toward the next, so with the defaults below a reading of 75 is halfway between green and amber. Values below the first threshold or above the last use that end's color. Gradient colors must be 6-digit hex (see [Supported Color Formats](#supported-color-formats)).

Thresholds also override on/off colors on binary entities; see [Binary State Label Customization](#binary-state-label-customization).

### Defaults

If no `thresholds` are set, the card uses these. They assume a temperature in Fahrenheit; set your own `thresholds` for Celsius or any other kind of sensor.
| Value range     | Color     | Description  |
|-----------------|-----------|--------------|
| below 70        | `#5b8fce` | Cold (blue)  |
| 70 to under 80  | `#52a870` | Cool (green) |
| 80 to under 100 | `#d4894a` | Warm (amber) |
| 100 and above   | `#c85c4a` | Hot (red)    |

### Example: US National Weather Service Temperature Scale

This scale also works well with `gradient: true`, since every color is 6-digit hex.

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

## Contributing

Issues and pull requests welcome on [GitHub](https://github.com/sxdjt/horizontal-waterfall-history-card)!

## License

MIT License - see LICENSE file for details
