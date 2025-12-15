# Beta Testing Guide - v4.1.0-beta

Testing for Issue #65 - Binary Entity State Tracking

## What's New in Beta

### Binary Entity State Tracking

For binary entities (binary_sensor, switch, light, input_boolean), the card uses a special algorithm to ensure brief state changes aren't lost.

**How It Works:**
Each interval displays the **last state that differs from the interval's starting state**. This ensures transient events are captured even if they only last seconds.

**Examples:**
- Door **Closed** → Opens for 2 minutes → **Closed** again → Shows **"Open"**
- Light **On** → Turns off briefly → **On** again → Shows **"Off"**
- Sensor **Off** → Goes **On** → Then **Unavailable** → Shows **"Unavailable"**

**Why This Matters:**
With a 30-minute interval, a door opened for just 1 minute would normally be missed. The beta captures and displays this brief event.

**Applies To:** binary_sensor, switch, light, and input_boolean domains
**Note:** Continuous sensors (temperature, humidity, etc.) use standard sampling

### Inline Layout Space Optimization
- Entity name: 100px (from 120px)
- Current value: 50px (from 60px)
- ~8% more graph space

## Installation

**Download:**
```
https://github.com/sxdjt/horizontal-waterfall-history-card/raw/main/dist/horizontal-waterfall-history-card-beta.js
```

**Add Resource:**
1. Settings → Dashboards → Resources
2. Add `/local/horizontal-waterfall-history-card-beta.js` as JavaScript Module

**Test Configuration:**
```yaml
type: custom:waterfall-history-card-beta
title: "Beta Test"
hours: 24
intervals: 48
entities:
  - switch.office_lamp
  - binary_sensor.front_door
  - sensor.temperature
```

## What to Test

1. **Brief state changes** - Toggle a switch/light briefly, verify it shows in the interval
2. **Returns to starting state** - Start On → Off briefly → On again, should show "Off"
3. **Non-binary sensors** - Temperature/humidity should work like production
4. **Stable states** - No changes should look identical to production

## Reporting Issues

Report at: https://github.com/sxdjt/horizontal-waterfall-history-card/issues/65

Include:
- Entity type and domain
- Expected vs actual behavior
- Configuration YAML
- Browser console errors (F12)
