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

| Option         | Type            | Default Value | Description                                                                             | Required |
| -------------- | --------------- | ------------- | --------------------------------------------------------------------------------------- | -------- |
| entity         | string          | —             | The Home Assistant entity                                                               | **Yes**  |
| title          | string          | 'History'     | The title displayed at the top of the card                                              | No       |
| columns        | number          | 12            | Preferred width in columns (for Lovelace grid layout)                                   | No       |
| compact        | boolean         | false         | If true, uses a more compact visual style                                               | No       |
| default_value  | number or null  | null          | Value to use if no data is available for a segment                                      | No       |
| digits         | number          | 1             | Decimal places to display for sensor values                                             | No       |
| gradient       | boolean         | false         | If true, colors interpolate smoothly between thresholds                                 | No       |
| height         | number          | 60            | Height of the waterfall display area in pixels                                          | No       |
| hours          | number          | 24            | Number of hours of historical data to display                                           | No       |
| icon           | string or null  | null          | Icon to display in the card header (entity attribute used if null)                      | No       |
| intervals      | number          | 48            | Number of vertical bars (segments) for history                                          | No       |
| max_value      | number or null  | null          | Maximum value for color scale (auto if null)                                            | No       |
| min_value      | number or null  | null          | Minimum value for color scale (auto if null)                                            | No       |
| show_current   | boolean         | true          | If true, displays the current sensor value in the header                                | No       |
| show_labels    | boolean         | true          | If true, displays time labels below the waterfall                                       | No       |
| show_min_max   | boolean         | false         | If true, shows the minimum and maximum observed values                                  | No       |
| thresholds     | array           | See below     | Value/color pairs for color thresholds                                                  | No       |
| unit           | string or null  | null          | Overrides the unit of measurement (entity attribute used if null)                       | No       |

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

### Thresholds

| Threshold | Color     |
|-----------|-----------|
| 60        | `#4FC3F7` |
| 70        | `#81C784` |
| 80        | `#FFB74D` |
| 100       | `#FF8A65` |

