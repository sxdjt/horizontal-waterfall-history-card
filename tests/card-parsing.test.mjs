// State parsing and attribute tracking: parseState, getTrackedAttribute,
// readTrackedValue, cacheKeyFor, currentValueIsStateIndex, getStateColors,
// isBinaryValue, isNumericReading, getMinMax, t().

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, stateObj } from './helpers/env.mjs';

const UNKNOWN = -999;
const UNAVAILABLE = -998;
const HVAC_ACTION_KEYS = ['off', 'idle', 'fan', 'drying', 'defrosting', 'preheating', 'cooling', 'heating'];

describe('parseState', () => {
  const card = makeCard();

  test('numbers pass through; booleans map to 1/0', () => {
    assert.equal(card.parseState(42.5, {}), 42.5);
    assert.equal(card.parseState(true, {}), 1);
    assert.equal(card.parseState(false, {}), 0);
  });

  test('unknown/unavailable map to sentinels, case-insensitive', () => {
    assert.equal(card.parseState('unknown', {}), UNKNOWN);
    assert.equal(card.parseState('UNKNOWN', {}), UNKNOWN);
    assert.equal(card.parseState('unavailable', {}), UNAVAILABLE);
    assert.equal(card.parseState('Unavailable', {}), UNAVAILABLE);
  });

  test('on/off map to 1/0, case-insensitive', () => {
    assert.equal(card.parseState('on', {}), 1);
    assert.equal(card.parseState('OFF', {}), 0);
  });

  test('numeric strings parse as numbers; other strings and non-values are null', () => {
    assert.equal(card.parseState('21.5', {}), 21.5);
    assert.equal(card.parseState('-3', {}), -3);
    assert.equal(card.parseState('banana', {}), null);
    assert.equal(card.parseState(undefined, {}), null);
    assert.equal(card.parseState(null, {}), null);
    assert.equal(card.parseState({ a: 1 }, {}), null);
  });

  test('per-entity state_on/state_off match custom states, case-insensitive', () => {
    const e = { entity: 'person.x', state_on: 'home', state_off: 'not_home' };
    assert.equal(card.parseState('home', e), 1);
    assert.equal(card.parseState('NOT_HOME', e), 0);
    assert.equal(card.parseState('work', e), null);
  });

  test('card-level state_on/state_off apply when the entity sets none', () => {
    const c = makeCard({ state_on: 'open', state_off: 'closed' });
    assert.equal(c.parseState('open', {}), 1);
    assert.equal(c.parseState('closed', {}), 0);
  });

  test('state_colors keys map to their index, case-insensitive, before on/off', () => {
    const e = { entity: 'climate.x', state_colors: { off: '#000000', heat: '#ff0000', cool: '#0000ff' } };
    assert.equal(card.parseState('off', e), 0);
    assert.equal(card.parseState('HEAT', e), 1);
    assert.equal(card.parseState('cool', e), 2);
  });

  test('state mode: a value missing from state_colors falls through to on/off and numbers', () => {
    const e = { entity: 'climate.x', state_colors: { heat: '#ff0000' } };
    assert.equal(card.parseState('on', e), 1);
    assert.equal(card.parseState('5', e), 5);
    assert.equal(card.parseState('dry', e), null);
  });

  test('attribute mode: a value missing from state_colors is not aliased to on/off', () => {
    const e = { entity: 'climate.x', attribute: 'hvac_action', state_colors: { heating: '#ff0000', idle: '#888888' } };
    assert.equal(card.parseState('heating', e), 0);
    assert.equal(card.parseState('off', e), null);
    assert.equal(card.parseState('7', e), 7);
  });

  test('attribute mode without a map keeps on/off handling', () => {
    const e = { entity: 'sensor.x', attribute: 'mode' };
    assert.equal(card.parseState('on', e), 1);
    assert.equal(card.parseState('off', e), 0);
  });

  test('hvac_action with no state_colors uses the built-in map', () => {
    const e = { entity: 'climate.x', attribute: 'hvac_action' };
    HVAC_ACTION_KEYS.forEach((key, i) => assert.equal(card.parseState(key, e), i, key));
  });
});

describe('getTrackedAttribute', () => {
  test('returns undefined in state mode', () => {
    assert.equal(makeCard().getTrackedAttribute({ entity: 'sensor.a' }), undefined);
  });

  test('per-entity attribute wins over card-level', () => {
    const card = makeCard({ attribute: 'card_attr' });
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: 'mine' }), 'mine');
    assert.equal(card.getTrackedAttribute({ entity: 'a.a' }), 'card_attr');
    assert.equal(card.getTrackedAttribute(undefined), 'card_attr');
  });

  test('per-entity "state" (any case, padded) opts out of the card-level attribute', () => {
    const card = makeCard({ attribute: 'hvac_action' });
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: 'state' }), undefined);
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: ' STATE ' }), undefined);
  });

  test('empty or whitespace values mean state mode; null inherits', () => {
    const card = makeCard({ attribute: 'card_attr' });
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: '' }), undefined);
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: '   ' }), undefined);
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: null }), 'card_attr');
  });

  test('card-level "state" means state mode', () => {
    assert.equal(makeCard({ attribute: 'State' }).getTrackedAttribute({ entity: 'a.a' }), undefined);
  });

  test('non-string values from YAML are coerced and trimmed, not thrown on', () => {
    const card = makeCard();
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: true }), 'true');
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: 5 }), '5');
    assert.equal(card.getTrackedAttribute({ entity: 'a.a', attribute: ' mode ' }), 'mode');
  });
});

describe('readTrackedValue', () => {
  const card = makeCard();
  const climate = stateObj('heat', { hvac_action: 'heating', temp: 21 });

  test('state mode returns the state', () => {
    assert.equal(card.readTrackedValue(climate, { entity: 'climate.x' }), 'heat');
  });

  test('attribute mode returns the attribute value (any type)', () => {
    assert.equal(card.readTrackedValue(climate, { entity: 'climate.x', attribute: 'hvac_action' }), 'heating');
    assert.equal(card.readTrackedValue(climate, { entity: 'climate.x', attribute: 'temp' }), 21);
    assert.equal(card.readTrackedValue(climate, { entity: 'climate.x', attribute: 'missing' }), undefined);
  });

  test('attribute mode returns the state when the entity is unknown/unavailable', () => {
    const e = { entity: 'climate.x', attribute: 'hvac_action' };
    assert.equal(card.readTrackedValue(stateObj('unavailable', { hvac_action: 'heating' }), e), 'unavailable');
    assert.equal(card.readTrackedValue(stateObj('Unknown', {}), e), 'Unknown');
  });

  test('a missing state object yields undefined', () => {
    assert.equal(card.readTrackedValue(undefined, { entity: 'x.x' }), undefined);
    assert.equal(card.readTrackedValue(undefined, { entity: 'x.x', attribute: 'a' }), undefined);
  });
});

describe('cacheKeyFor', () => {
  test('combines entity, tracked attribute (or "state") and start offset', () => {
    const card = makeCard({ start_offset: 0 });
    assert.equal(card.cacheKeyFor('sensor.a'), 'sensor.a_state_0');
    assert.equal(card.cacheKeyFor({ entity: 'sensor.a' }), 'sensor.a_state_0');
    assert.equal(card.cacheKeyFor({ entity: 'climate.x', attribute: 'hvac_action', start_offset: 24 }), 'climate.x_hvac_action_24');
  });

  test('string entities use the card-level offset; objects can override it', () => {
    const card = makeCard({ start_offset: 12 });
    assert.equal(card.cacheKeyFor('sensor.a'), 'sensor.a_state_12');
    assert.equal(card.cacheKeyFor({ entity: 'sensor.a' }), 'sensor.a_state_12');
    assert.equal(card.cacheKeyFor({ entity: 'sensor.a', start_offset: 0 }), 'sensor.a_state_0');
  });

  test('string and object entities both pick up the card-level attribute', () => {
    const card = makeCard({ attribute: 'hvac_action' });
    assert.equal(card.cacheKeyFor('climate.x'), 'climate.x_hvac_action_0');
    assert.equal(card.cacheKeyFor({ entity: 'climate.x' }), 'climate.x_hvac_action_0');
  });

  test('the same entity by state and by attribute gets different keys', () => {
    const card = makeCard();
    assert.notEqual(card.cacheKeyFor({ entity: 'climate.x' }), card.cacheKeyFor({ entity: 'climate.x', attribute: 'hvac_action' }));
  });
});

describe('currentValueIsStateIndex', () => {
  test('state mode without a state_colors map is index mode (lookups never happen)', () => {
    const card = makeCard({}, { 'sensor.a': stateObj('5') });
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.a' }), true);
  });

  test('state mode with a map: a numeric state not in the map is a reading', () => {
    const card = makeCard({ state_colors: { Poor: '#000001', Good: '#000002' } }, {
      'sensor.count': stateObj('2'), 'sensor.temp': stateObj(' 21.5 '), 'input_select.goal': stateObj('Good'), 'sensor.text': stateObj('Other'),
    });
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.count' }), false);
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.temp' }), false);
    assert.equal(card.currentValueIsStateIndex({ entity: 'input_select.goal' }), true);
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.text' }), true);
  });

  test('state mode with a map: a state matching a key is an index, even if numeric', () => {
    const card = makeCard({ state_colors: { 1: '#000001', 2: '#000002' } }, { 'input_select.level': stateObj('2') });
    assert.equal(card.currentValueIsStateIndex({ entity: 'input_select.level' }), true);
  });

  test('state mode with a map while unavailable: previous classification, else unit/state_class', () => {
    const card = makeCard({ state_colors: { a: '#000001' } }, {
      'sensor.u': stateObj('unavailable', { unit_of_measurement: 'W' }),
      'sensor.s': stateObj('unknown', { state_class: 'measurement' }),
      'input_select.x': stateObj('unavailable', {}),
    });
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.u' }, true), true);
    assert.equal(card.currentValueIsStateIndex({ entity: 'input_select.x' }, false), false);
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.u' }), false);
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.s' }), false);
    assert.equal(card.currentValueIsStateIndex({ entity: 'input_select.x' }), true);
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.missing' }), true);
  });

  test('attribute mode: string -> index, number/boolean -> reading', () => {
    const card = makeCard({}, { 'climate.x': stateObj('heat', { a: 'heating', n: 21, b: true }) });
    assert.equal(card.currentValueIsStateIndex({ entity: 'climate.x', attribute: 'a' }), true);
    assert.equal(card.currentValueIsStateIndex({ entity: 'climate.x', attribute: 'n' }), false);
    assert.equal(card.currentValueIsStateIndex({ entity: 'climate.x', attribute: 'b' }), false);
  });

  test('attribute mode with the attribute missing keeps the previous classification', () => {
    const card = makeCard({}, { 'climate.x': stateObj('heat', {}) });
    const e = { entity: 'climate.x', attribute: 'n' };
    assert.equal(card.currentValueIsStateIndex(e, false), false);
    assert.equal(card.currentValueIsStateIndex(e, true), true);
    assert.equal(card.currentValueIsStateIndex(e, undefined), true);
  });

  test('attribute mode while the entity is unknown/unavailable keeps the previous classification', () => {
    const card = makeCard({}, { 'climate.x': stateObj('unavailable', { n: 'stale' }), 'climate.y': stateObj('Unknown', {}) });
    const e = { entity: 'climate.x', attribute: 'n' };
    assert.equal(card.currentValueIsStateIndex(e, false), false);
    assert.equal(card.currentValueIsStateIndex(e, true), true);
    assert.equal(card.currentValueIsStateIndex(e), true);
    assert.equal(card.currentValueIsStateIndex({ entity: 'climate.y', attribute: 'n' }, false), false);
  });

  test('attribute mode with the entity missing from hass keeps the previous classification', () => {
    const card = makeCard({}, {});
    assert.equal(card.currentValueIsStateIndex({ entity: 'climate.gone', attribute: 'n' }, false), false);
    assert.equal(card.currentValueIsStateIndex({ entity: 'climate.gone', attribute: 'n' }), true);
  });

  test('attribute mode: an attribute whose value is the string "unavailable" is still a string', () => {
    const card = makeCard({}, { 'sensor.x': stateObj('on', { status: 'unavailable' }) });
    assert.equal(card.currentValueIsStateIndex({ entity: 'sensor.x', attribute: 'status' }, false), true);
  });
});

describe('getStateColors', () => {
  test('per-entity map wins over card-level map', () => {
    const card = makeCard({ state_colors: { a: '#111111' } });
    assert.deepEqual(card.getStateColors({ entity: 'x.x', state_colors: { b: '#222222' } }), { b: '#222222' });
    assert.deepEqual(card.getStateColors({ entity: 'x.x' }), { a: '#111111' });
  });

  test('hvac_action falls back to the built-in map, ordered inactive to active', () => {
    const map = makeCard().getStateColors({ entity: 'climate.x', attribute: 'hvac_action' });
    assert.deepEqual(Object.keys(map), HVAC_ACTION_KEYS);
    assert.equal(map.heating, '#EF5350');
    assert.equal(map.off, '#2d3245');
  });

  test('a configured map replaces the hvac_action defaults (not merged)', () => {
    const card = makeCard({ state_colors: { other: '#123456' } });
    assert.deepEqual(card.getStateColors({ entity: 'climate.x', attribute: 'hvac_action' }), { other: '#123456' });
  });

  test('no map and no hvac_action returns undefined', () => {
    assert.equal(makeCard().getStateColors({ entity: 'sensor.a' }), undefined);
    assert.equal(makeCard().getStateColors({ entity: 'sensor.a', attribute: 'preset_mode' }), undefined);
  });
});

describe('isBinaryValue', () => {
  const card = makeCard();
  test('only exactly 0 and 1', () => {
    assert.equal(card.isBinaryValue(0), true);
    assert.equal(card.isBinaryValue(1), true);
    for (const v of [0.5, 2, -1, null, UNKNOWN]) assert.equal(card.isBinaryValue(v), false, String(v));
  });
});

describe('isNumericReading', () => {
  test('numeric states (with or without a unit) are readings', () => {
    const card = makeCard({}, {
      'sensor.pm25': stateObj('1.0', { unit_of_measurement: 'ug/m3' }),
      'sensor.count': stateObj('0'),
    });
    assert.equal(card.isNumericReading({ entity: 'sensor.pm25' }), true);
    assert.equal(card.isNumericReading({ entity: 'sensor.count' }), true);
  });

  test('on/off and other text states are not readings', () => {
    const card = makeCard({}, { 'binary_sensor.door': stateObj('on'), 'person.x': stateObj('home'), 'sensor.blank': stateObj('  ') });
    assert.equal(card.isNumericReading({ entity: 'binary_sensor.door' }), false);
    assert.equal(card.isNumericReading({ entity: 'person.x' }), false);
    assert.equal(card.isNumericReading({ entity: 'sensor.blank' }), false);
  });

  test('per-entity binary settings opt a 0/1 sensor into binary', () => {
    const card = makeCard({}, { 'sensor.flag': stateObj('1') });
    for (const opt of [{ state_on: '1' }, { state_off: '0' }, { color_on: '#ff0000' }, { color_off: '#000000' }, { binary_colors: { on: '#fff' } }]) {
      assert.equal(card.isNumericReading({ entity: 'sensor.flag', ...opt }), false, JSON.stringify(opt));
    }
  });

  test('cleared editor colors ("") are not an opt-in', () => {
    const card = makeCard({}, { 'sensor.flag': stateObj('1') });
    assert.equal(card.isNumericReading({ entity: 'sensor.flag', color_on: '', color_off: '' }), true);
  });

  test('card-level binary colors are not an opt-in', () => {
    const card = makeCard({ color_on: '#00ff00' }, { 'sensor.pm25': stateObj('1') });
    assert.equal(card.isNumericReading({ entity: 'sensor.pm25' }), true);
  });

  test('while unavailable: a unit or state_class means numeric; otherwise binary', () => {
    const card = makeCard({}, {
      'sensor.u': stateObj('unavailable', { unit_of_measurement: 'W' }),
      'sensor.s': stateObj('unknown', { state_class: 'measurement' }),
      'binary_sensor.d': stateObj('unavailable', {}),
    });
    assert.equal(card.isNumericReading({ entity: 'sensor.u' }), true);
    assert.equal(card.isNumericReading({ entity: 'sensor.s' }), true);
    assert.equal(card.isNumericReading({ entity: 'binary_sensor.d' }), false);
    assert.equal(card.isNumericReading({ entity: 'sensor.missing' }), false);
  });

  test('attribute mode: numbers are readings, booleans and strings are not', () => {
    const card = makeCard({}, { 'sensor.t': stateObj('ok', { n: 1, b: true, s: 'on', ns: '3' }) });
    assert.equal(card.isNumericReading({ entity: 'sensor.t', attribute: 'n' }), true);
    assert.equal(card.isNumericReading({ entity: 'sensor.t', attribute: 'ns' }), true);
    assert.equal(card.isNumericReading({ entity: 'sensor.t', attribute: 'b' }), false);
    assert.equal(card.isNumericReading({ entity: 'sensor.t', attribute: 's' }), false);
    assert.equal(card.isNumericReading({ entity: 'sensor.t', attribute: 'missing' }), false);
  });

  test('attribute mode while the entity is down does not use the state unit', () => {
    const card = makeCard({}, { 'climate.x': stateObj('unavailable', { unit_of_measurement: 'C' }) });
    assert.equal(card.isNumericReading({ entity: 'climate.x', attribute: 'current_temperature' }), false);
  });
});

describe('getMinMax', () => {
  const card = makeCard();
  test('ignores null and unknown/unavailable sentinels', () => {
    assert.deepEqual(card.getMinMax([3, null, UNKNOWN, 7, UNAVAILABLE, -2]), [-2, 7]);
  });
  test('returns [0, 0] when there is no real value', () => {
    assert.deepEqual(card.getMinMax([]), [0, 0]);
    assert.deepEqual(card.getMinMax([null, UNKNOWN, UNAVAILABLE]), [0, 0]);
  });
});

describe('t (translations)', () => {
  test('English by default', () => {
    const card = makeCard();
    assert.equal(card.t('now'), 'Now');
    assert.equal(card.t('hours_ago'), 'h ago');
    assert.equal(card.t('no_data'), 'No data');
  });

  test('French when the language is fr', () => {
    const card = makeCard();
    card.language = 'fr';
    assert.equal(card.t('now'), 'Actuel');
    assert.equal(card.t('no_data'), 'Aucune donnée');
  });

  test('unknown language falls back to English; unknown key returns the key', () => {
    const card = makeCard();
    card.language = 'xx';
    assert.equal(card.t('now'), 'Now');
    assert.equal(card.t('not_a_key'), 'not_a_key');
  });
});
