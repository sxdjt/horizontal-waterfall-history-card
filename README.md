# Waterfall History Card for Home Assistant

This card shows a sensors historical data with "now" on the right side of the graph and the historical data trailing off to the left.

<img width="495" alt="Screenshot 2025-05-23 at 21 16 25" src="https://github.com/user-attachments/assets/174db2a0-1cac-49b8-8ec3-f0ceaf4e804c" />


## Installation

1. Copy `waterfall-history-card.js` to `/config/www/waterfall-history-card/`
2. Add resource in Configuration > Dashboards > Resources:
   ```
   URL: /local/waterfall-history-card/waterfall-history-card.js
   Type: JavaScript Module
   ```

## Basic Configuration

```yaml
type: custom:waterfall-history-card
entity: sensor.living_room_temperature
title: "House Temperature"
```

## Full Configuration Options

```yaml
type: custom:waterfall-history-card
entity: sensor.living_room_temperature
title: "Temperature History" 
hours: 24                   # Time range in hours (default: 24)
intervals: 48               # Number of segments to show (default: 48)
height: 60                  # Card height in pixels (default: 60)
min_value: 60               # Force minimum value (optional)
max_value: 85               # Force maximum value (optional)
unit: "°F"                  # Unit display (default: °F)
show_current: true          # Show current value (default: true)
show_labels: true           # Show time labels (default: true)
show_min_max: true          # Show the MIN and MAX values (default: true)


# Color thresholds
thresholds:
  cold: 65                  # Below this = cold color
  cool: 72                  # Below this = cool color  
  warm: 78                  # Below this = warm color
                            # Above warm = hot color

# Custom colors (hex or CSS color names)
colors:
  cold: "#4FC3F7"          # Light blue
  cool: "#81C784"          # Light green
  warm: "#FFB74D"          # Orange
  hot: "#FF8A65"           # Red-orange
```

## Example Configurations

### Humidity Card
```yaml
type: custom:waterfall-history-card
entity: sensor.humidity
title: "Humidity History"
unit: "%"
thresholds:
  cold: 30    # Dry
  cool: 45    # Normal
  warm: 60    # Humid
colors:
  cold: "#FFB74D"    # Orange (dry)
  cool: "#81C784"    # Green (good)
  warm: "#4FC3F7"    # Blue (humid)
  hot: "#FF5722"     # Red (too humid)
```

### Power Usage Card
```yaml
type: custom:waterfall-history-card
entity: sensor.power_consumption
title: "Power Usage"
unit: "W"
hours: 12
intervals: 72
thresholds:
  cold: 100
  cool: 500
  warm: 1000
colors:
  cold: "#4CAF50"    # Green (low)
  cool: "#FFC107"    # Yellow (medium)
  warm: "#FF9800"    # Orange (high)
  hot: "#F44336"     # Red (very high)
```

### 7-Day View
```yaml
type: custom:waterfall-history-card
entity: sensor.outdoor_temperature
title: "Weekly Temperature"
hours: 168      # 7 days
intervals: 168  # One segment per hour
height: 80
```

## Styling with Card-mod

```yaml
type: custom:waterfall-history-card
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

1. This was created using Claude.ai.
2. I am not a developer, but I thrash around a bit and occasionally come up with something useful.
