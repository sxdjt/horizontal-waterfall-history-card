// Card configuration and static API: setConfig, getStubConfig,
// getConfigElement, getCardSize, getGridOptions, element/picker registration.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  WaterfallHistoryCard, WaterfallHistoryCardEditor, definedElements, DEFAULT_COLORS, makeCard,
} from './helpers/env.mjs';

describe('registration', () => {
  test('defines the card and editor custom elements', () => {
    assert.equal(definedElements.get('waterfall-history-card'), WaterfallHistoryCard);
    assert.equal(definedElements.get('waterfall-history-card-editor'), WaterfallHistoryCardEditor);
  });

  test('registers once with the HA card picker, with preview enabled', () => {
    const entries = window.customCards.filter((c) => c.type === 'waterfall-history-card');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].preview, true);
    assert.equal(entries[0].name, 'Waterfall History Card');
  });
});

describe('getStubConfig', () => {
  test('picks the first sensor entity when hass is given', () => {
    const hass = { states: { 'light.a': {}, 'sensor.b': {}, 'sensor.c': {} } };
    assert.deepEqual(WaterfallHistoryCard.getStubConfig(hass), {
      title: 'History', hours: 24, entities: ['sensor.b'],
    });
  });

  test('returns no entities when there is no sensor or no hass', () => {
    assert.deepEqual(WaterfallHistoryCard.getStubConfig({ states: { 'light.a': {} } }).entities, []);
    assert.deepEqual(WaterfallHistoryCard.getStubConfig().entities, []);
  });
});

describe('getConfigElement', () => {
  test('returns a waterfall-history-card-editor element', async () => {
    const el = await WaterfallHistoryCard.getConfigElement();
    assert.ok(el instanceof WaterfallHistoryCardEditor);
  });
});

describe('setConfig defaults', () => {
  const card = makeCard({ entities: ['sensor.a'] });
  const c = card.config;
  const expected = {
    title: 'History', hours: 24, intervals: 48, start_offset: 0, height: 60,
    gradient: false, show_current: true, show_labels: true, label_count: 1,
    label_format: 'relative', show_min_max: false, show_icons: true, compact: false,
    inline_layout: false, digits: 1, state_on: 'On', state_off: 'Off',
    color_unknown: DEFAULT_COLORS.unknown, color_unavailable: DEFAULT_COLORS.unavailable,
    state_unknown: 'Unknown', state_unavailable: 'INOP', interval_value: 'last', cell_gap: 1,
  };
  for (const [key, value] of Object.entries(expected)) {
    test(`${key} defaults to ${JSON.stringify(value)}`, () => assert.equal(c[key], value));
  }

  test('optional colors, maps and overrides default to undefined', () => {
    for (const key of ['thresholds', 'unit', 'icon', 'binary_colors', 'state_colors', 'attribute', 'color_on', 'color_off']) {
      assert.equal(c[key], undefined, key);
    }
  });

  test('min_value, max_value and default_value default to null; card_mod to {}', () => {
    assert.equal(c.min_value, null);
    assert.equal(c.max_value, null);
    assert.equal(c.default_value, null);
    assert.deepEqual(c.card_mod, {});
  });

  test('type is set to the card type', () => assert.equal(c.type, 'custom:waterfall-history-card'));
});

describe('setConfig values', () => {
  test('keeps explicit values', () => {
    const c = makeCard({
      title: 'T', hours: 12, intervals: 24, start_offset: 6, height: 80, gradient: true,
      show_current: false, show_labels: false, label_count: 3, label_format: '12h',
      show_min_max: true, show_icons: false, compact: true, inline_layout: true, digits: 0,
      unit: 'W', icon: 'mdi:x', state_on: 'Open', state_off: 'Closed', interval_value: 'max',
      cell_gap: 0, color_on: '#111111', color_off: '#222222', attribute: 'hvac_action',
      state_colors: { a: '#000000' }, thresholds: [{ value: 1, color: '#123456' }],
    }).config;
    assert.equal(c.title, 'T');
    assert.equal(c.hours, 12);
    assert.equal(c.intervals, 24);
    assert.equal(c.start_offset, 6);
    assert.equal(c.height, 80);
    assert.equal(c.gradient, true);
    assert.equal(c.show_current, false);
    assert.equal(c.show_labels, false);
    assert.equal(c.label_count, 3);
    assert.equal(c.label_format, '12h');
    assert.equal(c.show_min_max, true);
    assert.equal(c.show_icons, false);
    assert.equal(c.compact, true);
    assert.equal(c.inline_layout, true);
    assert.equal(c.digits, 0);
    assert.equal(c.unit, 'W');
    assert.equal(c.icon, 'mdi:x');
    assert.equal(c.state_on, 'Open');
    assert.equal(c.state_off, 'Closed');
    assert.equal(c.interval_value, 'max');
    assert.equal(c.cell_gap, 0);
    assert.equal(c.color_on, '#111111');
    assert.equal(c.color_off, '#222222');
    assert.equal(c.attribute, 'hvac_action');
    assert.deepEqual(c.state_colors, { a: '#000000' });
    assert.deepEqual(c.thresholds, [{ value: 1, color: '#123456' }]);
  });

  test('digits: 0 and label_count must be numbers to apply', () => {
    assert.equal(makeCard({ digits: 0 }).config.digits, 0);
    assert.equal(makeCard({ digits: '2' }).config.digits, 1);
    assert.equal(makeCard({ label_count: '4' }).config.label_count, 1);
  });

  test('unit: "" is kept (suppresses the unit)', () => {
    assert.equal(makeCard({ unit: '' }).config.unit, '');
  });

  test('normalizes string entities to objects and keeps object entities as-is', () => {
    const obj = { entity: 'sensor.b', name: 'B' };
    const c = makeCard({ entities: ['sensor.a', obj] }).config;
    assert.deepEqual(c.entities, [{ entity: 'sensor.a' }, obj]);
    assert.equal(c.entities[1], obj);
  });

  test('missing or non-array entities becomes [] (auto-entities first render)', () => {
    const card = new WaterfallHistoryCard();
    card.setConfig({ type: 'custom:waterfall-history-card' });
    assert.deepEqual(card.config.entities, []);
    card.setConfig({ type: 'custom:waterfall-history-card', entities: 'sensor.a' });
    assert.deepEqual(card.config.entities, []);
  });
});

describe('setConfig host styling', () => {
  test('normal mode sets size variables and no compact class', () => {
    const card = makeCard({ height: 90, cell_gap: 3 });
    assert.equal(card.classList.contains('compact'), false);
    assert.equal(card.style.getPropertyValue('--header-font-size'), '11px');
    assert.equal(card.style.getPropertyValue('--entity-name-font-size'), '11px');
    assert.equal(card.style.getPropertyValue('--labels-margin-top'), '5px');
    assert.equal(card.style.getPropertyValue('--waterfall-height'), '90px');
    assert.equal(card.style.getPropertyValue('--waterfall-cell-gap'), '3px');
  });

  test('compact mode adds the class and smaller sizes; turning it off removes the class', () => {
    const card = makeCard({ compact: true });
    assert.equal(card.classList.contains('compact'), true);
    assert.equal(card.style.getPropertyValue('--header-font-size'), '10px');
    assert.equal(card.style.getPropertyValue('--entity-name-font-size'), '10px');
    assert.equal(card.style.getPropertyValue('--labels-margin-top'), '2px');
    card.setConfig({ type: 'custom:waterfall-history-card', entities: [] });
    assert.equal(card.classList.contains('compact'), false);
  });

  test('cell_gap: 0 is applied as 0px', () => {
    assert.equal(makeCard({ cell_gap: 0 }).style.getPropertyValue('--waterfall-cell-gap'), '0px');
  });
});

describe('sizing', () => {
  test('getCardSize is 2 per entity, minimum 2', () => {
    assert.equal(makeCard({ entities: ['a.a', 'b.b', 'c.c'] }).getCardSize(), 6);
    assert.equal(makeCard({ entities: [] }).getCardSize(), 2);
  });

  test('getGridOptions returns the sections-view grid', () => {
    assert.deepEqual(makeCard().getGridOptions(), { rows: 3, columns: 12, min_rows: 2, min_columns: 6 });
  });
});
