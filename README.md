# Waterfall History Card for Home Assistant

This card shows a sensors historical data with "now" on the right side of the graph and the historical data trailing off to the left.

<img width="1063" alt="Screenshot 2025-05-27 at 15 57 43" src="https://github.com/user-attachments/assets/2384a7bf-8d94-4620-abf3-b19b513d3862" />

## Installation

1. Copy `horizontal-waterfall-history-card.js` to `/config/www/horizontal-waterfall-history-card/`

   e.g. ```git clone https://github.com/sxdjt/horizontal-waterfall-history-card/ /config/www```

3. Add resource in Settings > Dashboards > 3-dot-menu > Resources:
   ```
   URL: /local/horizontal-waterfall-history-card/horizontal-waterfall-history-card.js
   Type: JavaScript Module
   ```
#### Basic Configuration
```yaml
type: custom:horizontal-waterfall-history-card
entity: sensor.living_room_temperature
```

#### Full Configuration Example
```yaml
type: custom:horizontal-waterfall-history-card
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

### Default Values
| Key            | Value                          |
|----------------|--------------------------------|
| `title`        | "History" (or translated equivalent) |
| `hours`        | 24                             |
| `intervals`    | 48                             |
| `columns`      | 12                             |
| `compact`      | false                          |
| `gradient`     | false                          |
| `height`       | 60                             |
| `min_value`    | none (auto-calculated if not set) |
| `max_value`    | none (auto-calculated if not set) |
| `show_current` | true                           |
| `show_labels`  | true                           |
| `show_min_max` | false                          |
| `unit`         | none (auto-detect if not set)  |

### Thresholds

| Threshold | Color     |
|-----------|-----------|
| 60        | `#4FC3F7` |
| 70        | `#81C784` |
| 80        | `#FFB74D` |
| 100       | `#FF8A65` |

