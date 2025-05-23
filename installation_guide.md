# Waterfall History Card Installation

## Installation

### Option 1: HACS (Recommended)
1. Add this repository to HACS as a custom repository
2. Search for "Waterfall History Card" in HACS Frontend
3. Install and restart Home Assistant

### Option 2: Manual Installation
1. Copy `waterfall-history-card.js` to `/config/www/waterfall-history-card/`
2. Add resource in Configuration > Lovelace Dashboards > Resources:
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
hours: 24                    # Time range (default: 24)
intervals: 48                # Number of segments (default: 48)
height: 60                   # Card height in pixels (default: 60)
min_value: 60               # Force minimum value (optional)
max_value: 85               # Force maximum value (optional)
unit: "°F"                  # Unit display (default: °F)
show_current: true          # Show current value (default: true)
show_labels: true           # Show time labels (default: true)

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
- **Performance issues**: Reduce `intervals` for longer time periods (e.g., use 48 intervals for 7 days instead of 168)