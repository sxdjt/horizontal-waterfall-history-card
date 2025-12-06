# Beta Testing Guide - v4.1.0-beta

Multi-State Interval Tracking - Testing for Issue #65

<img width="518" height="205" alt="Screenshot 2025-12-05 at 19 30 57" src="https://github.com/user-attachments/assets/e0d794de-4f0b-4f14-8fa5-37e34df41fd7" />

## Quick Install

### Download Beta File

**Direct Download:**
```
https://github.com/sxdjt/horizontal-waterfall-history-card/raw/main/dist/horizontal-waterfall-history-card-beta.js
```

**Or via command line:**
```bash
cd /path/to/homeassistant/config/www/
wget https://github.com/sxdjt/horizontal-waterfall-history-card/raw/main/dist/horizontal-waterfall-history-card-beta.js
```

### Add Resource in Home Assistant

1. Settings → Dashboards → Resources
2. Add Resource
   - URL: `/local/horizontal-waterfall-history-card-beta.js`
   - Resource type: JavaScript Module
3. Save

### Basic Configuration

```yaml
type: custom:waterfall-history-card-beta
title: "Beta Test - Multi-State"
hours: 24
intervals: 48
entities:
  - binary_sensor.front_door
  - sensor.temperature
```

## What's New in Beta

### Multi-State Interval Tracking
- Captures ALL state changes per interval (not just the last one)
- No more lost data for brief events

### Split-Bar Visualization
- Intervals with multiple states show as proportional segments
- Each segment colored by its state
- Even 1-second changes are visible

### Duration Tooltips
- Hover over any segment to see state and duration
- Format: "5s", "10m", "2h 15m"

## Side-by-Side Comparison

Test production vs beta to see the difference:

```yaml
type: vertical-stack
cards:
  - type: custom:waterfall-history-card
    title: "Production v4.0"
    entities:
      - binary_sensor.front_door

  - type: custom:waterfall-history-card-beta
    title: "Beta v4.1.0 - Multi-State"
    entities:
      - binary_sensor.front_door
```

## Test Scenarios

### 1. Brief Binary State (Issue #65)
**Setup:** Use a door/window sensor

**Actions:**
1. Open door for 1-2 minutes
2. Close door
3. Wait for interval to complete (e.g., 30 min interval)

**Expected in Beta:**
- Thin segment showing "open" color visible in the interval
- Tooltip shows duration (e.g., "2m")

**Expected in Production:**
- May not show the brief open state at all

### 2. Rapid State Changes
**Setup:** Use a motion sensor or binary sensor that toggles frequently

**Actions:**
1. Trigger sensor multiple times in one interval
2. Example: 5 on/off cycles in 30 minutes

**Expected in Beta:**
- Multiple colored segments in one bar
- Each segment proportional to duration
- Hover shows individual durations

**Expected in Production:**
- Only shows last state in the interval

### 3. Temperature Spike
**Setup:** Use temperature sensor with thresholds

**Actions:**
1. Watch for brief temperature threshold crossing
2. Example: temp briefly goes above 80°F then drops

**Expected in Beta:**
- Color change visible for spike duration
- Split bar shows both colors proportionally

**Expected in Production:**
- May miss brief threshold crossing

### 4. Single State (Backwards Compatibility)
**Setup:** Any entity with stable state

**Actions:**
1. Observe intervals with only one state
2. Compare visual appearance

**Expected:**
- Beta should look IDENTICAL to production
- No visual regression for normal use

## What to Report

### Success Criteria
- [ ] Brief state changes are now visible
- [ ] Split bars display correctly
- [ ] Tooltips show accurate durations
- [ ] Proportional widths look correct
- [ ] Single-state intervals identical to v4.0
- [ ] No performance issues

### Issues to Report
- [ ] Missing state changes
- [ ] Incorrect proportions
- [ ] Wrong colors
- [ ] Tooltip errors
- [ ] Visual glitches
- [ ] Performance problems
- [ ] Browser console errors

## Known Differences

**This is a BETA version:**
- Element name: `waterfall-history-card-beta` (not `waterfall-history-card`)
- Runs alongside production version
- Some TypeScript warnings during build (non-critical)

**Backwards Compatible:**
- All v4.0 configuration options work
- No breaking changes
- No new required settings

## Reporting Issues

Report issues at: https://github.com/sxdjt/horizontal-waterfall-history-card/issues/65

**Include:**
1. Entity type (binary_sensor, sensor, etc.)
2. Screenshot of production vs beta comparison
3. Configuration YAML
4. Browser console errors (F12)
5. Expected vs actual behavior

## Technical Details

**New Algorithm:**
- Stores all state changes with timestamps
- Calculates duration for each state segment
- Renders proportional split bars

**Performance:**
- ~5-10ms additional processing per entity
- Minimal memory impact (~10KB for 100 states)
- Efficient Lit rendering with virtual DOM

**Browser Support:**
- Same as v4.0 (modern browsers with ES6+)

## Uninstall Beta

To remove beta and return to production:

1. Remove beta resource from Home Assistant
2. Change card type back to `custom:waterfall-history-card`
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

## Build from Source (Optional)

For developers who want to modify:

```bash
git clone https://github.com/sxdjt/horizontal-waterfall-history-card
cd horizontal-waterfall-history-card
npm install
npm run build:beta
```

Output: `dist/horizontal-waterfall-history-card-beta.js`
