// Fallback paths for a config that has not been through setConfig.
//
// setConfig normalizes string entities to objects and fills every default,
// but the card's methods also guard against a raw config (string entities,
// missing hours/start_offset/state labels/digits/...). These tests set the
// config directly to cover those guards.

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { WaterfallHistoryCard, makeHass, stateObj, point, NOW, HOUR, DEFAULT_COLORS } from './helpers/env.mjs';
import { elements } from './helpers/template.mjs';

beforeEach(() => mock.timers.enable({ apis: ['Date'], now: NOW }));
afterEach(() => { mock.timers.reset(); mock.restoreAll(); });

function rawCard(config, states = {}, hassOverrides = {}) {
  const card = new WaterfallHistoryCard();
  card.hass = makeHass(states, hassOverrides);
  card.config = { entities: [], ...config };
  return card;
}

const states = {
  'sensor.a': stateObj('2.345', { unit_of_measurement: 'W' }),
  'binary_sensor.d': stateObj('on'),
};

describe('raw config: string entities', () => {
  test('_entitiesChanged compares string entities by id', () => {
    const card = rawCard({ entities: ['sensor.a'] }, states);
    assert.equal(card._entitiesChanged(makeHass({ ...states }), card.hass), false);
    assert.equal(card._entitiesChanged(makeHass({ 'sensor.a': stateObj('9') }), card.hass), true);
  });

  test('_checkHistoryRefresh uses the card hours/intervals for string entities and objects without them', () => {
    const card = rawCard({ hours: 4, intervals: 4, entities: ['sensor.a', { entity: 'binary_sensor.d' }] }, states);
    const update = mock.method(card, 'updateCard', async () => {});
    card._lastHistoryFetch = { 'sensor.a_state_0': NOW - 0.1 * HOUR, 'binary_sensor.d_state_0': NOW - 0.1 * HOUR };
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 0);
    card._lastHistoryFetch['sensor.a_state_0'] = NOW - 0.6 * HOUR;
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 1);
  });

  test('a negative start_offset uses the normal refresh interval, not the offset one', () => {
    const card = rawCard({ hours: 4, intervals: 4, entities: [{ entity: 'sensor.a', start_offset: -1 }] }, states);
    const update = mock.method(card, 'updateCard', async () => {});
    card._lastHistoryFetch = { 'sensor.a_state_-1': NOW - 0.6 * HOUR };
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 1);
  });

  test('_checkHistoryRefresh refreshes offset entities four times less often', () => {
    const card = rawCard({ hours: 4, intervals: 4, entities: [{ entity: 'sensor.a', start_offset: 24 }] }, states);
    const update = mock.method(card, 'updateCard', async () => {});
    card._lastHistoryFetch = { 'sensor.a_state_24': NOW - 1.9 * HOUR };
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 0);
    card._lastHistoryFetch['sensor.a_state_24'] = NOW - 2.1 * HOUR;
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 1);
  });

  test('updateCard applies the card-level start_offset to string entities', async () => {
    const card = rawCard({ hours: 4, intervals: 4, start_offset: 24, entities: ['sensor.a'] }, states);
    await card.updateCard();
    assert.ok(card.hass.apiCalls[0].url.includes(`end_time=${new Date(NOW - 24 * HOUR).toISOString()}`));
    assert.ok('sensor.a_state_24' in card.processedHistories);
  });

  test('updateCard fetches and caches string entities and objects without start_offset', async () => {
    const card = rawCard({ hours: 4, intervals: 4, entities: ['sensor.a', { entity: 'binary_sensor.d' }] }, states, {
      history: () => [[point('5', NOW - 3.5 * HOUR)]],
    });
    await card.updateCard();
    assert.equal(card.hass.apiCalls.length, 2);
    assert.deepEqual(card.processedHistories['sensor.a_state_0'].data.map((r) => r.value), [5, 5, 5, 5]);
    assert.ok('binary_sensor.d_state_0' in card.processedHistories);
  });

  test('updateCard skips string entities fetched within the refresh interval', async () => {
    const card = rawCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, states);
    card._lastHistoryFetch = { 'sensor.a_state_0': NOW - 0.1 * HOUR };
    await card.updateCard();
    assert.equal(card.hass.apiCalls.length, 0);
  });

  test('_renderEntity accepts a string entity and falls back to the default label settings', () => {
    const card = rawCard({ hours: 24, intervals: 24, show_labels: true, show_icons: true, show_current: true }, states);
    const els = elements(card._renderEntity('sensor.a'));
    const labelsAt = els.findIndex((el) => el.attrs.class === 'labels');
    assert.deepEqual(els.slice(labelsAt + 1, labelsAt + 3).map((el) => el.text), ['24h ago', 'Now']);
    assert.ok(els.some((el) => el.attrs.class === 'current-value' && el.text === '2.3W'));
  });
});

describe('raw config: missing defaults', () => {
  test('cacheKeyFor treats a missing start_offset as 0', () => {
    assert.equal(rawCard({}).cacheKeyFor('sensor.a'), 'sensor.a_state_0');
    assert.equal(rawCard({}).cacheKeyFor({ entity: 'sensor.a' }), 'sensor.a_state_0');
  });

  test('parseState without state_on/state_off still maps on/off and numbers', () => {
    const card = rawCard({}, states);
    assert.equal(card.parseState('on', {}), 1);
    assert.equal(card.parseState('home', {}), null);
    assert.equal(card.parseState('3', {}), 3);
  });

  test('displayState falls back to the default labels and digits', () => {
    const card = rawCard({}, states);
    assert.equal(card.displayState(1, { entity: 'binary_sensor.d' }), 'On');
    assert.equal(card.displayState(0, { entity: 'binary_sensor.d' }), 'Off');
    assert.equal(card.displayState(2.345, { entity: 'sensor.a' }), '2.3W');
  });

  test('getColorForValue without gradient uses step thresholds', () => {
    const card = rawCard({}, states);
    assert.equal(card.getColorForValue(75, { entity: 'sensor.a' }), DEFAULT_COLORS.numeric[1]);
  });

  test('processHistoryData without interval_value uses last', () => {
    const card = rawCard({ hours: 4 }, states);
    const start = NOW - 4 * HOUR;
    const rows = card.processHistoryData([point('9', start + 0.2 * HOUR), point('1', start + 0.4 * HOUR)], 4, HOUR, { entity: 'sensor.a' }, 0);
    assert.equal(rows[0].value, 1);
  });
});
