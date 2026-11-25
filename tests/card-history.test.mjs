// History processing and the update lifecycle: processHistoryData,
// updateCard, _checkHistoryRefresh, shouldUpdate, _entitiesChanged, updated,
// _syncInlineColumnWidths, _syncColumnWidth.

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, makeHass, stateObj, point, NOW, HOUR } from './helpers/env.mjs';

const UNKNOWN = -999;
const UNAVAILABLE = -998;

beforeEach(() => mock.timers.enable({ apis: ['Date'], now: NOW }));
afterEach(() => { mock.timers.reset(); mock.restoreAll(); });

// 4-hour window, 4 buckets of 1 hour: bucket i covers [START + i h, START + (i+1) h).
const START = NOW - 4 * HOUR;
const at = (hours) => START + hours * HOUR;
const values = (rows) => rows.map((r) => r.value);

function bucket(points, entity = { entity: 'sensor.a' }, config = {}, offset = 0) {
  const card = makeCard({ hours: 4, intervals: 4, ...config });
  return card.processHistoryData(points, 4, HOUR, entity, offset);
}

describe('processHistoryData: bucketing', () => {
  test('returns one row per bucket with its start time', () => {
    const rows = bucket([point('1', at(0.5))]);
    assert.equal(rows.length, 4);
    rows.forEach((r, i) => assert.equal(r.time.getTime(), at(i)));
  });

  test('last mode keeps the last value recorded in each bucket', () => {
    const rows = bucket([point('10', at(0.1)), point('20', at(0.9)), point('30', at(2.5))]);
    assert.deepEqual(values(rows), [20, 20, 30, 30]);
  });

  test('forward fills empty buckets with the carried-over state', () => {
    assert.deepEqual(values(bucket([point('5', at(1.2))])), [null, 5, 5, 5]);
  });

  test('leading buckets before the first recorded state stay null (no backward fill)', () => {
    assert.deepEqual(values(bucket([point('5', at(3.5))])), [null, null, null, 5]);
  });

  test('a point before the window sets the initial state for bucket 0', () => {
    assert.deepEqual(values(bucket([point('7', at(-2))])), [7, 7, 7, 7]);
    assert.deepEqual(values(bucket([point('7', at(-2)), point('9', at(2.5))])), [7, 7, 9, 9]);
  });

  test('a change inside bucket 0 wins over the initial state in last mode', () => {
    assert.deepEqual(values(bucket([point('7', at(-2)), point('9', at(0.5))])), [9, 9, 9, 9]);
  });

  test('points at or after the window end are ignored', () => {
    assert.deepEqual(values(bucket([point('1', at(0.5)), point('99', at(4))])), [1, 1, 1, 1]);
  });

  test('unknown/unavailable are kept and forward filled', () => {
    const rows = bucket([point('5', at(0.5)), point('unavailable', at(1.5)), point('unknown', at(3.5))]);
    assert.deepEqual(values(rows), [5, UNAVAILABLE, UNAVAILABLE, UNKNOWN]);
  });

  test('binary states map to 1/0', () => {
    const rows = bucket([point('off', at(-1)), point('on', at(1.5))], { entity: 'binary_sensor.d' });
    assert.deepEqual(values(rows), [0, 1, 1, 1]);
  });

  test('state_colors states map to their index', () => {
    const e = { entity: 'climate.x', state_colors: { off: '#000000', heat: '#ff0000' } };
    assert.deepEqual(values(bucket([point('off', at(-1)), point('heat', at(2.2))], e)), [0, 0, 1, 1]);
  });

  test('uses the per-entity hours for the window', () => {
    const card = makeCard({ hours: 24 });
    const rows = card.processHistoryData([point('3', NOW - 1.5 * HOUR)], 2, HOUR, { entity: 'sensor.a', hours: 2 }, 0);
    assert.deepEqual(values(rows), [3, 3]);
    assert.equal(rows[0].time.getTime(), NOW - 2 * HOUR);
  });

  test('start_offset shifts the window back', () => {
    const offsetStart = NOW - 24 * HOUR - 4 * HOUR;
    const rows = bucket([point('4', offsetStart + 2.5 * HOUR), point('99', NOW - HOUR)], { entity: 'sensor.a' }, {}, 24);
    assert.deepEqual(values(rows), [null, null, 4, 4]);
    assert.equal(rows[0].time.getTime(), offsetStart);
  });

  test('default_value pre-fills buckets and replaces forward fill', () => {
    // Documents current behavior of the undocumented default_value option:
    // buckets without a recorded change keep the default instead of carrying
    // the previous state forward.
    const rows = bucket([point('5', at(0.5))], { entity: 'sensor.a' }, { default_value: 0 });
    assert.deepEqual(values(rows), [5, 0, 0, 0]);
  });
});

describe('processHistoryData: min/max', () => {
  test('max keeps a brief activation; last hides it', () => {
    const pts = [point('off', at(-1)), point('on', at(1.2)), point('off', at(1.4))];
    assert.deepEqual(values(bucket(pts, { entity: 'binary_sensor.d' })), [0, 0, 0, 0]);
    assert.deepEqual(values(bucket(pts, { entity: 'binary_sensor.d', interval_value: 'max' })), [0, 1, 0, 0]);
  });

  test('min keeps a brief dip', () => {
    const pts = [point('50', at(-1)), point('0', at(2.1)), point('50', at(2.2))];
    assert.deepEqual(values(bucket(pts, { entity: 'sensor.l', interval_value: 'min' })), [50, 50, 0, 50]);
  });

  test('card-level interval_value applies; per-entity overrides it', () => {
    const pts = [point('off', at(-1)), point('on', at(1.2)), point('off', at(1.4))];
    assert.deepEqual(values(bucket(pts, { entity: 'binary_sensor.d' }, { interval_value: 'max' })), [0, 1, 0, 0]);
    assert.deepEqual(values(bucket(pts, { entity: 'binary_sensor.d', interval_value: 'last' }, { interval_value: 'max' })), [0, 0, 0, 0]);
  });

  test('a later, more extreme value in the same bucket replaces the earlier one', () => {
    const pts = [point('50', at(-1)), point('40', at(1.1)), point('10', at(1.2)), point('30', at(1.3))];
    assert.deepEqual(values(bucket(pts, { entity: 'sensor.l', interval_value: 'min' })), [50, 10, 30, 30]);
    const up = [point('50', at(-1)), point('60', at(1.1)), point('95', at(1.2)), point('70', at(1.3))];
    assert.deepEqual(values(bucket(up, { entity: 'sensor.l', interval_value: 'max' })), [50, 95, 70, 70]);
  });

  test('the initial state counts toward bucket 0', () => {
    const pts = [point('on', at(-1)), point('off', at(0.5))];
    assert.deepEqual(values(bucket(pts, { entity: 'binary_sensor.d', interval_value: 'max' })), [1, 0, 0, 0]);
    const dip = [point('off', at(-1)), point('on', at(0.5))];
    assert.deepEqual(values(bucket(dip, { entity: 'binary_sensor.d', interval_value: 'min' })), [0, 1, 1, 1]);
  });

  test('empty buckets carry the last raw state, not the neighbor extreme', () => {
    const pts = [point('10', at(-1)), point('90', at(0.2)), point('20', at(0.4))];
    assert.deepEqual(values(bucket(pts, { entity: 'sensor.a', interval_value: 'max' })), [90, 20, 20, 20]);
  });

  test('unknown/unavailable are excluded from extremes but kept when alone', () => {
    const pts = [point('5', at(0.2)), point('unavailable', at(0.5)), point('unknown', at(2.5))];
    assert.deepEqual(values(bucket(pts, { entity: 'sensor.a', interval_value: 'max' })), [5, UNAVAILABLE, UNKNOWN, UNKNOWN]);
  });
});

describe('processHistoryData: attribute mode', () => {
  test('reads the attribute and buckets by last_updated', () => {
    const p1 = { state: 'heat', last_changed: new Date(at(-5)).toISOString(), last_updated: new Date(at(0.5)).toISOString(), attributes: { hvac_action: 'idle' } };
    const p2 = { state: 'heat', last_changed: new Date(at(-5)).toISOString(), last_updated: new Date(at(2.5)).toISOString(), attributes: { hvac_action: 'heating' } };
    const rows = bucket([p1, p2], { entity: 'climate.x', attribute: 'hvac_action' });
    assert.deepEqual(values(rows), [1, 1, 7, 7]);
  });

  test('state mode buckets by last_changed', () => {
    const p = { state: '5', last_changed: new Date(at(0.5)).toISOString(), last_updated: new Date(at(3.5)).toISOString() };
    assert.deepEqual(values(bucket([p])), [5, 5, 5, 5]);
  });

  test('falls back to last_changed when last_updated is missing', () => {
    const p = { state: 'heat', last_changed: new Date(at(1.5)).toISOString(), attributes: { hvac_action: 'heating' } };
    assert.deepEqual(values(bucket([p], { entity: 'climate.x', attribute: 'hvac_action' })), [null, 7, 7, 7]);
  });
});

describe('updateCard', () => {
  test('state mode requests significant changes with minimal response', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, { 'sensor.a': stateObj('1') });
    await card.updateCard();
    assert.equal(card.hass.apiCalls.length, 1);
    const { method, url } = card.hass.apiCalls[0];
    assert.equal(method, 'GET');
    assert.equal(url, `history/period/${new Date(START).toISOString()}?filter_entity_id=sensor.a&end_time=${new Date(NOW).toISOString()}&significant_changes_only=1&minimal_response&no_attributes`);
  });

  test('attribute mode requests all changes with attributes', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: [{ entity: 'climate.x', attribute: 'hvac_action' }] }, { 'climate.x': stateObj('heat') });
    await card.updateCard();
    assert.match(card.hass.apiCalls[0].url, /&significant_changes_only=0$/);
    assert.doesNotMatch(card.hass.apiCalls[0].url, /no_attributes|minimal_response/);
  });

  test('start_offset shifts the requested window', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: [{ entity: 'sensor.a', start_offset: 24 }] }, { 'sensor.a': stateObj('1') });
    await card.updateCard();
    const end = NOW - 24 * HOUR;
    assert.ok(card.hass.apiCalls[0].url.includes(`history/period/${new Date(end - 4 * HOUR).toISOString()}?`));
    assert.ok(card.hass.apiCalls[0].url.includes(`end_time=${new Date(end).toISOString()}`));
  });

  test('stores processed history and the fetch time under the cache key', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, { 'sensor.a': stateObj('3') }, {
      history: () => [[point('3', at(0.5))]],
    });
    await card.updateCard();
    const entry = card.processedHistories['sensor.a_state_0'];
    assert.deepEqual(values(entry.data), [3, 3, 3, 3]);
    assert.equal(entry.stateIndex, true);
    assert.equal(card._lastHistoryFetch['sensor.a_state_0'], NOW);
  });

  test('records reading mode for a numeric attribute', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: [{ entity: 'climate.x', attribute: 't' }] }, { 'climate.x': stateObj('heat', { t: 21 }) }, {
      history: () => [[{ ...point('heat', at(0.5)), attributes: { t: 21 } }]],
    });
    await card.updateCard();
    assert.equal(card.processedHistories['climate.x_t_0'].stateIndex, false);
  });

  test('a refresh while the entity is unavailable keeps reading mode for a numeric attribute', async () => {
    const states = { 'climate.x': stateObj('heat', { t: 1 }) };
    const pts = [{ ...point('heat', at(0.5)), attributes: { t: 1 } }];
    const card = makeCard({ hours: 4, intervals: 4, state_colors: { a: '#000001', b: '#000002' }, entities: [{ entity: 'climate.x', attribute: 't' }] }, states, {
      history: () => [pts],
    });
    await card.updateCard();
    assert.equal(card.processedHistories['climate.x_t_0'].stateIndex, false);
    states['climate.x'] = stateObj('unavailable', {});
    pts.push(point('unavailable', at(3.5)));
    mock.timers.tick(HOUR);
    await card.updateCard();
    const entry = card.processedHistories['climate.x_t_0'];
    assert.equal(entry.stateIndex, false);
    // Readings of 1 keep their numeric color instead of the map's second entry.
    assert.notEqual(card.getColorForValue(entry.data[0].value, { entity: 'climate.x', attribute: 't' }, entry.stateIndex), '#000002');
  });

  test('does not refetch within the refresh interval (half a bucket)', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, { 'sensor.a': stateObj('1') });
    await card.updateCard();
    mock.timers.tick(0.4 * HOUR);
    await card.updateCard();
    assert.equal(card.hass.apiCalls.length, 1);
    mock.timers.tick(0.2 * HOUR);
    await card.updateCard();
    assert.equal(card.hass.apiCalls.length, 2);
  });

  test('offset entities refresh four times less often', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: [{ entity: 'sensor.a', start_offset: 24 }] }, { 'sensor.a': stateObj('1') });
    await card.updateCard();
    mock.timers.tick(1.9 * HOUR);
    await card.updateCard();
    assert.equal(card.hass.apiCalls.length, 1);
    mock.timers.tick(0.2 * HOUR);
    await card.updateCard();
    assert.equal(card.hass.apiCalls.length, 2);
  });

  test('empty history with no cache backfills every bucket with the current value', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, { 'sensor.a': stateObj('8') });
    await card.updateCard();
    assert.deepEqual(values(card.processedHistories['sensor.a_state_0'].data), [8, 8, 8, 8]);
  });

  test('empty history in attribute mode backfills with the current attribute value', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: [{ entity: 'climate.x', attribute: 'hvac_action' }] }, { 'climate.x': stateObj('heat', { hvac_action: 'heating' }) });
    await card.updateCard();
    assert.deepEqual(values(card.processedHistories['climate.x_hvac_action_0'].data), [7, 7, 7, 7]);
  });

  test('empty history with no current state backfills with null', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.gone'] }, {});
    await card.updateCard();
    assert.deepEqual(values(card.processedHistories['sensor.gone_state_0'].data), [null, null, null, null]);
  });

  test('empty history keeps an existing cache (protects brief events)', async () => {
    let history = [[point('on', at(1.5))]];
    const card = makeCard({ hours: 4, intervals: 4, entities: ['binary_sensor.d'] }, { 'binary_sensor.d': stateObj('off') }, {
      history: () => history,
    });
    await card.updateCard();
    const before = card.processedHistories['binary_sensor.d_state_0'];
    history = [[]];
    mock.timers.tick(HOUR);
    await card.updateCard();
    assert.deepEqual(card.processedHistories['binary_sensor.d_state_0'], before);
  });

  test('an API error is logged and treated as no data', async () => {
    const errors = mock.method(console, 'error', () => {});
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, { 'sensor.a': stateObj('2') }, {
      history: () => { throw new Error('boom'); },
    });
    await card.updateCard();
    assert.equal(errors.mock.callCount(), 1);
    assert.match(String(errors.mock.calls[0].arguments[0]), /sensor\.a/);
    assert.deepEqual(values(card.processedHistories['sensor.a_state_0'].data), [2, 2, 2, 2]);
    assert.equal(card._lastHistoryFetch['sensor.a_state_0'], undefined);
  });

  test('prunes cache entries no longer in the config', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, { 'sensor.a': stateObj('1') });
    card.processedHistories = { 'sensor.old_state_0': { data: [] } };
    card._lastHistoryFetch = { 'sensor.old_state_0': 1 };
    await card.updateCard();
    assert.deepEqual(Object.keys(card.processedHistories), ['sensor.a_state_0']);
    assert.deepEqual(Object.keys(card._lastHistoryFetch), ['sensor.a_state_0']);
  });

  test('the same entity by state and by attribute is fetched and cached separately', async () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: [{ entity: 'climate.x' }, { entity: 'climate.x', attribute: 'hvac_action' }] }, { 'climate.x': stateObj('heat', { hvac_action: 'idle' }) });
    await card.updateCard();
    assert.equal(card.hass.apiCalls.length, 2);
    assert.deepEqual(Object.keys(card.processedHistories).sort(), ['climate.x_hvac_action_0', 'climate.x_state_0']);
  });

  test('does nothing without hass', async () => {
    const card = makeCard({ entities: ['sensor.a'] });
    card.hass = undefined;
    await card.updateCard();
    assert.deepEqual(card.processedHistories, {});
  });
});

describe('_checkHistoryRefresh', () => {
  test('calls updateCard when an entity has never been fetched or is stale', () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, { 'sensor.a': stateObj('1') });
    const update = mock.method(card, 'updateCard', async () => {});
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 1);
    card._lastHistoryFetch['sensor.a_state_0'] = NOW - 0.6 * HOUR;
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 2);
  });

  test('skips updateCard when every entity is fresh', () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.a'] }, { 'sensor.a': stateObj('1') });
    card._lastHistoryFetch['sensor.a_state_0'] = NOW - 0.1 * HOUR;
    const update = mock.method(card, 'updateCard', async () => {});
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 0);
  });

  test('does nothing without hass', () => {
    const card = makeCard({ entities: ['sensor.a'] });
    card.hass = undefined;
    const update = mock.method(card, 'updateCard', async () => {});
    card._checkHistoryRefresh();
    assert.equal(update.mock.callCount(), 0);
  });
});

describe('shouldUpdate and _entitiesChanged', () => {
  const states = { 'sensor.a': stateObj('1'), 'sensor.other': stateObj('x') };

  test('false without hass', () => {
    const card = makeCard({ entities: ['sensor.a'] });
    card.hass = undefined;
    assert.equal(card.shouldUpdate(new Map([['config', {}]])), false);
  });

  test('true when config changed or on the first hass', () => {
    const card = makeCard({ entities: ['sensor.a'] }, states);
    assert.equal(card.shouldUpdate(new Map([['config', {}]])), true);
    assert.equal(card.shouldUpdate(new Map([['hass', undefined]])), true);
  });

  test('hass change: true only when a tracked entity state object changed', () => {
    const card = makeCard({ entities: ['sensor.a'] }, states);
    const old = makeHass({ ...states });
    assert.equal(card.shouldUpdate(new Map([['hass', old]])), false);
    old.states['sensor.other'] = stateObj('y');
    assert.equal(card.shouldUpdate(new Map([['hass', old]])), false);
    old.states['sensor.a'] = stateObj('2');
    assert.equal(card.shouldUpdate(new Map([['hass', old]])), true);
  });

  test('true when processedHistories or anything else changed', () => {
    const card = makeCard({ entities: ['sensor.a'] }, states);
    assert.equal(card.shouldUpdate(new Map([['processedHistories', {}]])), true);
    assert.equal(card.shouldUpdate(new Map()), true);
  });

  test('_entitiesChanged is true when either hass is missing', () => {
    const card = makeCard({ entities: ['sensor.a'] }, states);
    assert.equal(card._entitiesChanged(undefined, card.hass), true);
    assert.equal(card._entitiesChanged(card.hass, undefined), true);
  });
});

describe('updated', () => {
  test('first hass: sets the language and fetches history', () => {
    const card = makeCard({ entities: ['sensor.a'] }, { 'sensor.a': stateObj('1') }, { hass: { language: 'fr-FR' } });
    const update = mock.method(card, 'updateCard', async () => {});
    card.updated(new Map([['hass', undefined]]));
    assert.equal(card.language, 'fr');
    assert.ok(update.mock.callCount() >= 1);
  });

  test('later hass with a changed entity requests a re-render and checks refresh', () => {
    const states = { 'sensor.a': stateObj('1') };
    const card = makeCard({ entities: ['sensor.a'] }, states);
    const request = mock.method(card, 'requestUpdate', () => {});
    const check = mock.method(card, '_checkHistoryRefresh', () => {});
    card.updated(new Map([['hass', makeHass({ 'sensor.a': stateObj('0') })]]));
    assert.equal(request.mock.callCount(), 1);
    assert.equal(check.mock.callCount(), 1);
  });

  test('syncs inline column widths on every update', () => {
    const card = makeCard({ entities: [] });
    const sync = mock.method(card, '_syncColumnWidth', () => {});
    card.updated(new Map());
    assert.deepEqual(sync.mock.calls.map((c) => c.arguments[0]), ['.entity-inline-name', '.entity-inline-value']);
  });

  test('applies card-mod once when it is defined', async () => {
    const applied = [];
    customElements.define('card-mod', class { static applyToElement(...args) { applied.push(args); } });
    const cardModConfig = { style: ':host { color: red; }' };
    const card = makeCard({ entities: [], card_mod: cardModConfig });
    // Cards from earlier tests are also waiting on card-mod; count only this one.
    const forCard = () => applied.filter((args) => args[0] === card);
    card.updated(new Map());
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(forCard().length, 1);
    assert.equal(forCard()[0][1], 'card');
    assert.deepEqual(forCard()[0][2], cardModConfig);
    assert.equal(card._cardModApplied, true);
    card.updated(new Map());
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(forCard().length, 1);
  });
});

describe('updated: card-mod unavailable', () => {
  test('a rejected card-mod lookup is ignored', async () => {
    const card = makeCard({ entities: [], card_mod: { style: 'x' } });
    mock.method(customElements, 'whenDefined', () => Promise.reject(new Error('no card-mod')));
    const rejections = [];
    const onRejection = (err) => rejections.push(err);
    process.on('unhandledRejection', onRejection);
    card.updated(new Map());
    await new Promise((resolve) => setImmediate(resolve));
    process.off('unhandledRejection', onRejection);
    assert.deepEqual(rejections, []);
    assert.equal(card._cardModApplied, false);
  });
});

describe('_syncColumnWidth', () => {
  const fakeEl = (w) => ({ offsetWidth: w, style: { width: '' } });

  test('sets every matching element to the widest width', () => {
    const els = [fakeEl(40), fakeEl(75), fakeEl(60)];
    const card = makeCard();
    card.shadowRoot = { querySelectorAll: () => els };
    card._syncColumnWidth('.entity-inline-name');
    assert.deepEqual(els.map((e) => e.style.width), ['75px', '75px', '75px']);
  });

  test('leaves widths auto when nothing has a width', () => {
    const els = [fakeEl(0), fakeEl(0)];
    const card = makeCard();
    card.shadowRoot = { querySelectorAll: () => els };
    card._syncColumnWidth('.x');
    assert.deepEqual(els.map((e) => e.style.width), ['auto', 'auto']);
  });

  test('does nothing without a shadow root or matches', () => {
    const card = makeCard();
    assert.doesNotThrow(() => card._syncColumnWidth('.x'));
    card.shadowRoot = { querySelectorAll: () => [] };
    assert.doesNotThrow(() => card._syncColumnWidth('.x'));
  });
});
