# Waterfall History Card for Home Assistant

This card shows a sensors historical data with "now" on the right side of the graph and the historical data trailing off to the left.

<img width="600" alt="A simple example of card usage" src="https://github.com/user-attachments/assets/2384a7bf-8d94-4620-abf3-b19b513d3862" />

It makes a very nice, compact info card:

![451294731-7d77fbf2-1f22-41f0-982e-91644621c40e](https://github.com/user-attachments/assets/d72927a6-7fcc-4699-8818-dd315cf76439)


It works very well on mobile devices for a compact view of your current state and history.

<img height="500" alt="Screenshot of card usage on a mobile device" src="https://github.com/user-attachments/assets/42bb7783-a192-493f-8e4b-fd480c8164a2" />

## Installation

### HACS 

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=horizontal-waterfall-history-card)

**Manual Installation**

[GitHub repo](https://github.com/sxdjt/horizontal-waterfall-history-card)

1. Copy `horizontal-waterfall-history-card.js` to `/config/www/horizontal-waterfall-history-card/`

   e.g. ```git clone https://github.com/sxdjt/horizontal-waterfall-history-card/ /config/www```

2. Add resource in Settings > Dashboards > 3-dot-menu > Resources:
   ```
   URL: /local/horizontal-waterfall-history-card/horizontal-waterfall-history-card.js
   Type: JavaScript Module
   ```
## Configuration

### Basic 
```yaml
type: custom:waterfall-history-card
entity: sensor.living_room_temperature
```

### Full Configuration Example
```yaml
type: custom:waterfall-history-card
entity: sensor.living_room_temperature
title: "Temperature History"
hours: 24
intervals: 48
columns: 12
compact: false
gradient: false
height: 60
max_value: 85
min_value: 60
show_current: true
show_labels: true
show_min_max: false
unit: "°F"
digits: 1
icon: "mdi:thermometer"
thresholds:
  - value: 60
    color: "#4FC3F7" # cold
  - value: 70
    color: "#81C784" # cool
  - value: 80
    color: "#FFB74D" # warm
  - value: 100
    color: "#FF8A65" # hot
```

#### Styling with Card-mod
You can use [card-mod](https://github.com/thomasloven/lovelace-card-mod) for additional styling:
```yaml
type: custom:horizontal-waterfall-history-card
entity: sensor.temperature
card_mod:
  style: |
    :host {
      --card-background-color: rgba(0,0,0,0.1);
      border: 2px solid var(--primary-color);
    }
```

## Configuration Options

| Option | Type | Description | Default Value | Required |
| ----- | ----- | ----- | ----- | ----- |
| `entity` | `string` | The Home Assistant entity | (None) | **Yes** |
| `columns` | `number` | A hint for Home Assistant's Lovelace grid layout, indicating the preferred width in columns. | `12` | No |
| `compact` | `boolean` | If `true`, the card will use a more compact visual style with smaller fonts and reduced margins. | `false` | No |
| `digits` | `number` | The number of decimal places to display for sensor values (current, min, max, and bar tooltips). | `1` | No |
| `gradient` | `boolean` | If `true`, colors will smoothly interpolate between defined `thresholds`. If `false`, colors will snap to the defined threshold color. | `false` | No |
| `height` | `number` | The height of the waterfall display area in pixels. | `60` | No |
| `hours` | `number` | The number of hours of historical data to display. | `24` | No |
| `icon` | `string` | Icon to display in the card header | Entity default | No |
| `intervals` | `number` | The number of vertical bars (segments) to divide the historical period into. More intervals mean more granular display. | `48` | No |
| `max_value` | `number` | The maximum value for the color scale. If `null`, the maximum value from the data will be used. | `null` | No |
| `min_value` | `number` | The minimum value for the color scale. If `null`, the minimum value from the data will be used. | `null` | No |
| `show_current` | `boolean` | If `true`, the current sensor value will be displayed in the header. | `true` | No |
| `show_labels` | `boolean` | If `true`, time labels ("Xh ago" and "Now") will be displayed below the waterfall. | `true` | No |
| `show_min_max` | `boolean` | If `true`, the minimum and maximum values observed in the displayed history will be shown. | `false` | No |
| `thresholds` | `array` | An array of objects, each with a `value` and `color` property. These define the points at which the bar colors change. | See detailed section | No |
| `title` | `string` | The title displayed at the top of the card. | `History` | No |
| `unit` | `string` or `null` | Overrides the unit of measurement retrieved from the entity's attributes. | `null` | No |

### Thresholds

| Threshold | Color     |
|-----------|-----------|
| 60        | `#4FC3F7` |
| 70        | `#81C784` |
| 80        | `#FFB74D` |
| 100       | `#FF8A65` |

