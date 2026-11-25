// Color resolution and value display: getColorForValue, getBinaryColors,
// interpolateColor, hexToRgb, getUnit, displayState.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, stateObj, DEFAULT_COLORS } from './helpers/env.mjs';

const UNKNOWN = -999;
const UNAVAILABLE = -998;
const [BLUE, GREEN, AMBER, RED] = DEFAULT_COLORS.numeric;

const sensorStates = {
  'sensor.temp': stateObj('72', { unit_of_measurement: '°F' }),
  'binary_sensor.door': stateObj('off'),
  'sensor.pm25': stateObj('1', { unit_of_measurement: 'ug/m3' }),
};

describe('getColorForValue: special values', () => {
  const card = makeCard({}, sensorStates);
  const e = { entity: 'sensor.temp' };

  test('null and NaN render transparent (no data)', () => {
    assert.equal(card.getColorForValue(null, e), 'transparent');
    assert.equal(card.getColorForValue(NaN, e), 'transparent');
  });

  test('unknown/unavailable use the default colors', () => {
    assert.equal(card.getColorForValue(UNKNOWN, e), DEFAULT_COLORS.unknown);
    assert.equal(card.getColorForValue(UNAVAILABLE, e), DEFAULT_COLORS.unavailable);
  });

  test('card-level and per-entity unknown/unavailable colors; entity wins', () => {
    const c = makeCard({ color_unknown: '#111111', color_unavailable: '#222222' }, sensorStates);
    assert.equal(c.getColorForValue(UNKNOWN, e), '#111111');
    assert.equal(c.getColorForValue(UNAVAILABLE, e), '#222222');
    const own = { ...e, color_unknown: '#333333', color_unavailable: '#444444' };
    assert.equal(c.getColorForValue(UNKNOWN, own), '#333333');
    assert.equal(c.getColorForValue(UNAVAILABLE, own), '#444444');
  });

  test('unknown/unavailable win over thresholds and state_colors', () => {
    const own = { ...e, thresholds: [{ value: -1000, color: '#000000' }], state_colors: { a: '#000000' } };
    assert.equal(card.getColorForValue(UNKNOWN, own), DEFAULT_COLORS.unknown);
  });
});

describe('getColorForValue: state_colors', () => {
  const card = makeCard({}, { 'climate.x': stateObj('heat', { temp: 21 }) });
  const e = { entity: 'climate.x', state_colors: { off: '#000001', heat: '#000002', cool: '' } };

  test('integer values index into the map in index mode', () => {
    assert.equal(card.getColorForValue(0, e), '#000001');
    assert.equal(card.getColorForValue(1, e, true), '#000002');
  });

  test('an empty color in the map falls back to #666666', () => {
    assert.equal(card.getColorForValue(2, e), '#666666');
  });

  test('reading mode (allowStateIndex false, numeric attribute) ignores the map', () => {
    assert.equal(card.getColorForValue(1, { ...e, attribute: 'temp' }, false), BLUE);
  });

  test('out-of-range or fractional values fall through to thresholds', () => {
    assert.equal(card.getColorForValue(5, e), BLUE);
    assert.equal(card.getColorForValue(0.5, e), BLUE);
  });

  test('hvac_action default colors apply with no configured map', () => {
    const hvac = { entity: 'climate.x', attribute: 'hvac_action' };
    assert.equal(card.getColorForValue(7, hvac), '#EF5350');
    assert.equal(card.getColorForValue(6, hvac), '#4FC3F7');
  });
});

describe('getColorForValue: thresholds (step mode)', () => {
  const card = makeCard({}, sensorStates);
  const e = { entity: 'sensor.temp' };

  test('default numeric thresholds: each color from its value up to the next', () => {
    assert.equal(card.getColorForValue(40, e), BLUE);
    assert.equal(card.getColorForValue(60, e), BLUE);
    assert.equal(card.getColorForValue(69.9, e), BLUE);
    assert.equal(card.getColorForValue(70, e), GREEN);
    assert.equal(card.getColorForValue(85, e), AMBER);
    assert.equal(card.getColorForValue(100, e), RED);
    assert.equal(card.getColorForValue(250, e), RED);
  });

  test('custom thresholds; per-entity wins over card-level', () => {
    const c = makeCard({ thresholds: [{ value: 0, color: '#000000' }, { value: 10, color: '#ffffff' }] }, sensorStates);
    assert.equal(c.getColorForValue(5, e), '#000000');
    assert.equal(c.getColorForValue(10, e), '#ffffff');
    const own = { ...e, thresholds: [{ value: 0, color: '#aaaaaa' }] };
    assert.equal(c.getColorForValue(50, own), '#aaaaaa');
  });

  test('values below the first threshold use the first color', () => {
    const c = makeCard({ thresholds: [{ value: 10, color: '#000010' }, { value: 20, color: '#000020' }] }, sensorStates);
    assert.equal(c.getColorForValue(-5, e), '#000010');
  });
});

describe('getColorForValue: binary', () => {
  test('binary entity 0/1 use the default on/off colors', () => {
    const card = makeCard({}, sensorStates);
    const e = { entity: 'binary_sensor.door' };
    assert.equal(card.getColorForValue(0, e), DEFAULT_COLORS.off);
    assert.equal(card.getColorForValue(1, e), DEFAULT_COLORS.on);
  });

  test('a numeric sensor reading exactly 0 or 1 keeps the numeric thresholds', () => {
    const card = makeCard({}, sensorStates);
    assert.equal(card.getColorForValue(1, { entity: 'sensor.pm25' }), BLUE);
    assert.equal(card.getColorForValue(0, { entity: 'sensor.pm25' }), BLUE);
  });

  test('a 0/1 sensor with a per-entity color opts back into binary colors', () => {
    const card = makeCard({}, sensorStates);
    assert.equal(card.getColorForValue(1, { entity: 'sensor.pm25', color_on: '#ff0000' }), '#ff0000');
    assert.equal(card.getColorForValue(0, { entity: 'sensor.pm25', color_on: '#ff0000' }), DEFAULT_COLORS.off);
  });

  test('any thresholds replace binary colors, even per-entity color_on/color_off', () => {
    const card = makeCard({ thresholds: [{ value: 0, color: '#000000' }, { value: 1, color: '#010101' }] }, sensorStates);
    const e = { entity: 'binary_sensor.door', color_on: '#ff0000', color_off: '#00ff00' };
    assert.equal(card.getColorForValue(1, e), '#010101');
    assert.equal(card.getColorForValue(0, e), '#000000');
  });
});

describe('getColorForValue: gradient', () => {
  const card = makeCard({}, sensorStates);
  const e = { entity: 'sensor.temp', gradient: true };

  test('blends between neighboring thresholds', () => {
    // Halfway between #52a870 (70) and #d4894a (80).
    assert.equal(card.getColorForValue(75, e), 'rgb(147, 153, 93)');
  });

  test('is exact at a threshold value', () => {
    assert.equal(card.getColorForValue(70, e), 'rgb(82, 168, 112)');
    assert.equal(card.getColorForValue(60, e), 'rgb(91, 143, 206)');
  });

  test('below the first or above the last threshold uses that end color', () => {
    assert.equal(card.getColorForValue(10, e), BLUE);
    assert.equal(card.getColorForValue(500, e), RED);
  });

  test('card-level gradient applies; per-entity false turns it off', () => {
    const c = makeCard({ gradient: true }, sensorStates);
    assert.equal(c.getColorForValue(75, { entity: 'sensor.temp' }), 'rgb(147, 153, 93)');
    assert.equal(c.getColorForValue(75, { entity: 'sensor.temp', gradient: false }), GREEN);
  });

  test('non-hex colors blend as black', () => {
    const c = makeCard({ gradient: true, thresholds: [{ value: 0, color: 'red' }, { value: 10, color: '#F00' }] }, sensorStates);
    assert.equal(c.getColorForValue(5, { entity: 'sensor.temp' }), 'rgb(0, 0, 0)');
  });

  test('two thresholds with the same value do not divide by zero', () => {
    const c = makeCard({ gradient: true, thresholds: [{ value: 5, color: '#000000' }, { value: 5, color: '#ffffff' }] }, sensorStates);
    assert.equal(c.getColorForValue(5, { entity: 'sensor.temp' }), 'rgb(0, 0, 0)');
  });

  test('gradient also blends binary on/off colors (exact at 0 and 1)', () => {
    const c = makeCard({ gradient: true }, sensorStates);
    assert.equal(c.getColorForValue(1, { entity: 'binary_sensor.door' }), 'rgb(74, 158, 255)');
  });
});

describe('getBinaryColors precedence', () => {
  const pair = (t) => [t[0].color, t[1].color];

  test('defaults when nothing is set', () => {
    assert.deepEqual(pair(makeCard().getBinaryColors({ entity: 'x.x' })), [DEFAULT_COLORS.off, DEFAULT_COLORS.on]);
  });

  test('per-entity binary_colors beats per-entity color_on/off and card-level settings', () => {
    const card = makeCard({ binary_colors: { on: '#c1c1c1', off: '#c0c0c0' }, color_on: '#d1d1d1' });
    const e = { entity: 'x.x', binary_colors: { on: '#e1e1e1', off: '#e0e0e0' }, color_on: '#f1f1f1' };
    assert.deepEqual(pair(card.getBinaryColors(e)), ['#e0e0e0', '#e1e1e1']);
  });

  test('per-entity color_on/off beats card-level settings', () => {
    const card = makeCard({ binary_colors: { on: '#c1c1c1', off: '#c0c0c0' } });
    assert.deepEqual(pair(card.getBinaryColors({ entity: 'x.x', color_on: '#f1f1f1', color_off: '#f0f0f0' })), ['#f0f0f0', '#f1f1f1']);
  });

  test('card-level binary_colors beats card-level color_on/off', () => {
    const card = makeCard({ binary_colors: { on: '#c1c1c1', off: '#c0c0c0' }, color_on: '#d1d1d1', color_off: '#d0d0d0' });
    assert.deepEqual(pair(card.getBinaryColors({ entity: 'x.x' })), ['#c0c0c0', '#c1c1c1']);
  });

  test('card-level color_on/off apply when nothing else is set', () => {
    const card = makeCard({ color_on: '#d1d1d1', color_off: '#d0d0d0' });
    assert.deepEqual(pair(card.getBinaryColors({ entity: 'x.x' })), ['#d0d0d0', '#d1d1d1']);
  });

  test('the first level that sets either color supplies both; the missing one is the default', () => {
    const card = makeCard({ color_off: '#d0d0d0' });
    assert.deepEqual(pair(card.getBinaryColors({ entity: 'x.x', color_on: '#f1f1f1' })), [DEFAULT_COLORS.off, '#f1f1f1']);
    assert.deepEqual(pair(card.getBinaryColors({ entity: 'x.x', binary_colors: { on: '#e1e1e1' } })), [DEFAULT_COLORS.off, '#e1e1e1']);
  });

  test('binary_colors accepts 0/1 keys', () => {
    assert.deepEqual(pair(makeCard().getBinaryColors({ entity: 'x.x', binary_colors: { 0: '#000000', 1: '#111111' } })), ['#000000', '#111111']);
  });
});

describe('interpolateColor and hexToRgb', () => {
  const card = makeCard();
  test('hexToRgb parses 6-digit hex with or without #, case-insensitive', () => {
    assert.deepEqual(card.hexToRgb('#ff8000'), { r: 255, g: 128, b: 0 });
    assert.deepEqual(card.hexToRgb('FF8000'), { r: 255, g: 128, b: 0 });
  });
  test('hexToRgb returns black for anything else', () => {
    for (const v of ['#f80', 'red', 'rgb(1,2,3)', '#ff800080', '']) {
      assert.deepEqual(card.hexToRgb(v), { r: 0, g: 0, b: 0 }, v);
    }
  });
  test('interpolateColor blends by factor and rounds', () => {
    assert.equal(card.interpolateColor('#000000', '#ffffff', 0), 'rgb(0, 0, 0)');
    assert.equal(card.interpolateColor('#000000', '#ffffff', 1), 'rgb(255, 255, 255)');
    assert.equal(card.interpolateColor('#000000', '#ffffff', 0.5), 'rgb(128, 128, 128)');
  });
});

describe('getUnit', () => {
  const card = makeCard({}, sensorStates);
  test('state mode uses unit_of_measurement', () => {
    assert.equal(card.getUnit({ entity: 'sensor.temp' }), '°F');
    assert.equal(card.getUnit({ entity: 'binary_sensor.door' }), '');
    assert.equal(card.getUnit({ entity: 'sensor.missing' }), '');
  });
  test('unit override: entity beats card; "" suppresses the unit', () => {
    const c = makeCard({ unit: 'K' }, sensorStates);
    assert.equal(c.getUnit({ entity: 'sensor.temp' }), 'K');
    assert.equal(c.getUnit({ entity: 'sensor.temp', unit: 'C' }), 'C');
    assert.equal(c.getUnit({ entity: 'sensor.temp', unit: '' }), '');
  });
  test('reading mode (numeric attribute) shows no unit unless configured', () => {
    assert.equal(card.getUnit({ entity: 'sensor.temp', attribute: 'x' }, false), '');
    assert.equal(card.getUnit({ entity: 'sensor.temp', attribute: 'x', unit: 'C' }, false), 'C');
  });
  test('reading mode for a numeric state keeps the state unit', () => {
    assert.equal(card.getUnit({ entity: 'sensor.temp' }, false), '°F');
  });
});

describe('displayState', () => {
  const card = makeCard({}, sensorStates);

  test('unknown/unavailable labels: default, card-level, per-entity', () => {
    const e = { entity: 'sensor.temp' };
    assert.equal(card.displayState(UNKNOWN, e), 'Unknown');
    assert.equal(card.displayState(UNAVAILABLE, e), 'INOP');
    const c = makeCard({ state_unknown: '?', state_unavailable: 'Down' }, sensorStates);
    assert.equal(c.displayState(UNKNOWN, e), '?');
    assert.equal(c.displayState(UNAVAILABLE, { ...e, state_unavailable: 'Gone' }), 'Gone');
  });

  test('state_colors index shows the state name in index mode only', () => {
    const e = { entity: 'climate.x', state_colors: { off: '#000000', heat: '#ff0000' } };
    assert.equal(card.displayState(1, e), 'heat');
    // Reading mode: a numeric attribute, shown as a number.
    const c = makeCard({}, { 'climate.x': stateObj('heat', { temp: 21 }) });
    assert.equal(c.displayState(1, { ...e, attribute: 'temp' }, false), '1.0');
  });

  test('binary entities show On/Off, or the configured labels', () => {
    assert.equal(card.displayState(1, { entity: 'binary_sensor.door' }), 'On');
    assert.equal(card.displayState(0, { entity: 'binary_sensor.door' }), 'Off');
    assert.equal(card.displayState(1, { entity: 'binary_sensor.door', state_on: 'Open' }), 'Open');
    const c = makeCard({ state_on: 'Yes', state_off: 'No' }, sensorStates);
    assert.equal(c.displayState(0, { entity: 'binary_sensor.door' }), 'No');
  });

  test('a numeric sensor reading 0 or 1 shows the number with its unit', () => {
    assert.equal(card.displayState(1, { entity: 'sensor.pm25' }), '1.0ug/m3');
    assert.equal(card.displayState(0, { entity: 'sensor.pm25' }), '0.0ug/m3');
  });

  test('with thresholds configured, 0/1 always show as numbers', () => {
    const e = { entity: 'binary_sensor.door', thresholds: [{ value: 0, color: '#000000' }] };
    assert.equal(card.displayState(1, e), '1.0');
  });

  test('numbers use digits (card-level, per-entity) and the unit', () => {
    assert.equal(card.displayState(72.456, { entity: 'sensor.temp' }), '72.5°F');
    assert.equal(card.displayState(72.456, { entity: 'sensor.temp', digits: 2 }), '72.46°F');
    assert.equal(makeCard({ digits: 0 }, sensorStates).displayState(72.456, { entity: 'sensor.temp' }), '72°F');
  });

  test('null shows N/A with the unit', () => {
    assert.equal(card.displayState(null, { entity: 'sensor.temp' }), 'N/A°F');
  });
});
