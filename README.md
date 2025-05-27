# Waterfall History Card for Home Assistant

This card shows a sensors historical data with "now" on the right side of the graph and the historical data trailing off to the left.

<img width="504" alt="Screenshot 2025-05-26 at 21 41 21" src="https://github.com/user-attachments/assets/4e253d41-f208-4a29-b5ea-8b4b2513ef80" />

## Installation

1. Copy `horizontal-waterfall-history-card.js` to `/config/www/horizontal-waterfall-history-card/`

   e.g. ```git clone https://github.com/sxdjt/horizontal-waterfall-history-card/ /config/www```

3. Add resource in Settings > Dashboards > 3-dot-menu > Resources:
   ```
   URL: /local/horizontal-waterfall-history-card/horizontal-waterfall-history-card.js
   Type: JavaScript Module
   ```
## Basic Configuration

```yaml
type: custom:horizontal-waterfall-history-card
entity: sensor.living_room_temperature
```

## Full Configuration Options

```yaml
type: custom:horizontal-waterfall-history-card
entity: sensor.living_room_temperature
title: "Temperature History"
hours: 24
intervals: 48
height: 60
min_value: 60
max_value: 85
thresholds:
  - value: 60
    color: "#4FC3F7"
  - value: 70
    color: "#81C784"
  - value: 80
    color: "#FFB74D"
  - value: 100
    color: "#FF8A65"
gradient: false
show_current: true
show_labels: true
show_min_max: false
unit: "°F"
```

## Styling with Card-mod

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

## Troubleshooting

- **No data showing**: Check that the entity exists and has historical data
- **Card not loading**: Verify the resource is added correctly and Home Assistant restarted
- **Colors not working**: Ensure threshold values are appropriate for your sensor range
- **Performance issues**: Reduce `intervals` for longer time periods 

## Disclaimers

1. AI was used to assist in the creation of this code.
2. I am not a developer, but I thrash around a bit and occasionally come up with something useful.
