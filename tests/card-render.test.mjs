// Card rendering: render, _renderEntity, getTimeLabel, _handleEntityClick.

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, stateObj, NOW, HOUR, DEFAULT_COLORS } from './helpers/env.mjs';
import { toHTML, visibleText, elements, findAll, find } from './helpers/template.mjs';

beforeEach(() => mock.timers.enable({ apis: ['Date'], now: NOW }));
afterEach(() => { mock.timers.reset(); mock.restoreAll(); });

const temp = { 'sensor.temp': stateObj('72', { unit_of_measurement: '°F', friendly_name: 'Living Room' }) };
const norm = (s) => s.replace(/\s/g, ' ');

function rows(card, key, vals) {
  card.processedHistories = { ...card.processedHistories, [key]: { data: vals.map((value, i) => ({ time: new Date(i), value })), stateIndex: true } };
}
const bars = (t) => findAll(t, 'div', (el) => String(el.attrs.class).includes('bar-segment'));
const barColor = (el) => /background-color: ([^;]+);/.exec(el.attrs.style)[1];
const labels = (t) => {
  const labelDiv = elements(t).findIndex((el) => el.tag === 'div' && el.attrs.class === 'labels');
  if (labelDiv === -1) return null;
  const out = [];
  for (const el of elements(t).slice(labelDiv + 1)) {
    if (el.tag !== 'span') break;
    out.push(el.text);
  }
  return out;
};

describe('render', () => {
  test('renders nothing without hass', () => {
    const card = makeCard({ entities: ['sensor.temp'] }, temp);
    card.hass = undefined;
    assert.equal(toHTML(card.render()).trim(), '');
  });

  test('shows the title and one block per entity', () => {
    const card = makeCard({ title: 'Temps', entities: ['sensor.temp', 'sensor.temp'] }, temp);
    const t = card.render();
    assert.ok(visibleText(t).startsWith('Temps'));
    assert.equal(findAll(t, 'div', (el) => el.attrs.class === 'entity-container').length, 2);
  });

  test("title '' hides the header; the default title shows it", () => {
    const hidden = makeCard({ title: '', entities: ['sensor.temp'] }, temp).render();
    assert.equal(findAll(hidden, 'div', (el) => el.attrs.class === 'card-header').length, 0);
    assert.equal(findAll(hidden, 'div', (el) => el.attrs.class === 'entity-container').length, 1);
    const shown = makeCard({ entities: ['sensor.temp'] }, temp).render();
    assert.equal(find(shown, 'div', (el) => el.attrs.class === 'card-header').tag, 'div');
    assert.ok(visibleText(shown).startsWith('History'));
  });

  test('show_title: false hides the header even with a title', () => {
    const t = makeCard({ title: 'Temps', show_title: false, entities: ['sensor.temp'] }, temp).render();
    assert.equal(findAll(t, 'div', (el) => el.attrs.class === 'card-header').length, 0);
    assert.ok(!visibleText(t).includes('Temps'));
    assert.equal(findAll(t, 'div', (el) => el.attrs.class === 'entity-container').length, 1);
  });

  test('a missing entity shows a text error with a decorative icon', () => {
    const card = makeCard({ entities: ['sensor.nope'] }, {});
    const t = card.render();
    assert.match(visibleText(t), /Error: Entity not found: sensor\.nope/);
    assert.equal(find(t, 'div', (el) => el.attrs.class === 'error').tag, 'div');
    assert.equal(find(t, 'ha-icon').attrs['aria-hidden'], 'true');
  });
});

describe('entity header', () => {
  test('name: configured name, then friendly_name, then the entity id', () => {
    const named = makeCard({ entities: [{ entity: 'sensor.temp', name: 'Custom' }] }, temp);
    assert.equal(find(named.render(), 'button').text, 'Custom');
    assert.equal(find(makeCard({ entities: ['sensor.temp'] }, temp).render(), 'button').text, 'Living Room');
    const bare = makeCard({ entities: ['sensor.x'] }, { 'sensor.x': stateObj('1') });
    assert.equal(find(bare.render(), 'button').text, 'sensor.x');
  });

  test('the name is a button announcing a dialog', () => {
    const btn = find(makeCard({ entities: ['sensor.temp'] }, temp).render(), 'button');
    assert.equal(btn.attrs.type, 'button');
    assert.equal(btn.attrs['aria-haspopup'], 'dialog');
  });

  test('icon precedence: entity icon, card icon, entity attribute, domain default, mdi:bookmark', () => {
    const icon = (card) => find(card.render(), 'ha-icon').attrs['.icon'];
    const st = { 'sensor.temp': stateObj('1', { icon: 'mdi:attr' }), 'light.l': stateObj('on'), 'foo.bar': stateObj('1') };
    assert.equal(icon(makeCard({ icon: 'mdi:card', entities: [{ entity: 'sensor.temp', icon: 'mdi:own' }] }, st)), 'mdi:own');
    assert.equal(icon(makeCard({ icon: 'mdi:card', entities: ['sensor.temp'] }, st)), 'mdi:card');
    assert.equal(icon(makeCard({ entities: ['sensor.temp'] }, st)), 'mdi:attr');
    assert.equal(icon(makeCard({ entities: ['light.l'] }, st)), 'mdi:lightbulb');
    assert.equal(icon(makeCard({ entities: ['foo.bar'] }, st)), 'mdi:bookmark');
  });

  test('show_icons: card-level off hides icons; per-entity overrides either way', () => {
    assert.equal(findAll(makeCard({ show_icons: false, entities: ['sensor.temp'] }, temp).render(), 'ha-icon').length, 0);
    assert.equal(findAll(makeCard({ show_icons: false, entities: [{ entity: 'sensor.temp', show_icons: true }] }, temp).render(), 'ha-icon').length, 1);
    assert.equal(findAll(makeCard({ entities: [{ entity: 'sensor.temp', show_icons: false }] }, temp).render(), 'ha-icon').length, 0);
  });

  test('current value shows with its unit; show_current hides it', () => {
    const shown = makeCard({ entities: ['sensor.temp'] }, temp).render();
    assert.equal(find(shown, 'span', (el) => el.attrs.class === 'current-value').text, '72.0°F');
    assert.equal(findAll(makeCard({ show_current: false, entities: ['sensor.temp'] }, temp).render(), 'span', (el) => el.attrs.class === 'current-value').length, 0);
    assert.equal(findAll(makeCard({ entities: [{ entity: 'sensor.temp', show_current: false }] }, temp).render(), 'span', (el) => el.attrs.class === 'current-value').length, 0);
  });

  test('current value of a tracked attribute', () => {
    const card = makeCard({ entities: [{ entity: 'climate.x', attribute: 'hvac_action' }] }, { 'climate.x': stateObj('heat', { hvac_action: 'heating' }) });
    assert.equal(find(card.render(), 'span', (el) => el.attrs.class === 'current-value').text, 'heating');
  });
});

describe('bars', () => {
  test('history buckets plus the current value as the last bar', () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.temp'] }, temp);
    rows(card, 'sensor.temp_state_0', [50, 75, 85, null]);
    const b = bars(card.render());
    assert.equal(b.length, 5);
    assert.deepEqual(b.map(barColor), [DEFAULT_COLORS.numeric[0], DEFAULT_COLORS.numeric[1], DEFAULT_COLORS.numeric[2], 'transparent', DEFAULT_COLORS.numeric[1]]);
    assert.ok(String(b[4].attrs.class).includes('last-bar'));
    assert.ok(!String(b[0].attrs.class).includes('last-bar'));
  });

  test('offset entities show only history (no current value bar)', () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: [{ entity: 'sensor.temp', start_offset: 24 }] }, temp);
    rows(card, 'sensor.temp_state_24', [50, 50, 50, 50]);
    assert.equal(bars(card.render()).length, 4);
  });

  test('without processed history only the current value bar renders', () => {
    assert.equal(bars(makeCard({ entities: ['sensor.temp'] }, temp).render()).length, 1);
  });

  test('bar tooltips show the time range and the value, or No data', () => {
    const card = makeCard({ hours: 4, intervals: 4, entities: ['sensor.temp'] }, temp);
    rows(card, 'sensor.temp_state_0', [null, 70, 70, 70]);
    const b = bars(card.render());
    assert.equal(norm(b[0].attrs.title), '8:00 AM - 9:00 AM : No data');
    assert.equal(norm(b[1].attrs.title), '9:00 AM - 10:00 AM : 70.0°F');
  });

  test('stored reading mode (numeric attribute) is used for colors and labels', () => {
    const card = makeCard({ hours: 4, intervals: 4, state_colors: { a: '#000001', b: '#000002' }, entities: [{ entity: 'climate.x', attribute: 't' }] }, { 'climate.x': stateObj('heat', { t: 1 }) });
    card.processedHistories = { 'climate.x_t_0': { data: [1, 1, 1, 1].map((value) => ({ time: new Date(0), value })), stateIndex: false } };
    const b = bars(card.render());
    assert.notEqual(barColor(b[0]), '#000002');
    assert.equal(norm(b[0].attrs.title).split(' : ')[1], '1.0');
  });

  // A card-level state_colors map applies to every entity, but a numeric
  // sensor's integer readings must not be colored and labeled as map entries.
  const goals = { Poor: '#e45e65', Good: '#0da035', Great: '#039BE5' };

  test('a numeric sensor ignores a card-level state_colors map (before history loads)', () => {
    const card = makeCard({ hours: 4, intervals: 4, state_colors: goals, entities: ['sensor.count'] }, { 'sensor.count': stateObj('2', { unit_of_measurement: 'items' }) });
    const t = card.render();
    const b = bars(t);
    assert.equal(barColor(b[b.length - 1]), DEFAULT_COLORS.numeric[0]);
    assert.equal(find(t, 'span', (el) => el.attrs.class === 'current-value').text, '2.0items');
  });

  test('a numeric sensor ignores a card-level state_colors map (with history)', async () => {
    const card = makeCard({ hours: 4, intervals: 4, state_colors: goals, entities: ['sensor.count', 'input_select.goal'] }, {
      'sensor.count': stateObj('2', { unit_of_measurement: 'items' }),
      'input_select.goal': stateObj('Great'),
    }, { history: (url) => url.includes('sensor.count') ? [[{ state: '1', last_changed: new Date(NOW - 3.5 * HOUR).toISOString() }]] : [[{ state: 'Good', last_changed: new Date(NOW - 3.5 * HOUR).toISOString() }]] });
    await card.updateCard();
    const t = card.render();
    const [countBars, goalBars] = [bars(t).slice(0, 5), bars(t).slice(5)];
    assert.deepEqual(countBars.map(barColor), Array(5).fill(DEFAULT_COLORS.numeric[0]));
    assert.equal(norm(countBars[0].attrs.title).split(' : ')[1], '1.0items');
    assert.deepEqual(goalBars.map(barColor), ['#0da035', '#0da035', '#0da035', '#0da035', '#039BE5']);
    assert.deepEqual(findAll(t, 'span', (el) => el.attrs.class === 'current-value').map((el) => el.text), ['2.0items', 'Great']);
  });

  test('a map with numeric keys still colors matching numeric states', () => {
    const card = makeCard({ state_colors: { 1: '#000001', 2: '#000002' }, entities: ['input_select.level'] }, { 'input_select.level': stateObj('2') });
    const t = card.render();
    assert.equal(barColor(bars(t).at(-1)), '#000002');
    assert.equal(find(t, 'span', (el) => el.attrs.class === 'current-value').text, '2');
  });
});

describe('time labels', () => {
  const labelsFor = (config) => labels(makeCard({ entities: ['sensor.temp'], ...config }, temp).render());

  test('relative: start and Now by default', () => {
    assert.deepEqual(labelsFor({ hours: 24 }), ['24h ago', 'Now']);
  });

  test('label_count adds evenly spaced labels', () => {
    assert.deepEqual(labelsFor({ hours: 24, label_count: 2 }), ['24h ago', '12h ago', 'Now']);
    assert.deepEqual(labelsFor({ hours: 24, label_count: 4 }), ['24h ago', '18h ago', '12h ago', '6h ago', 'Now']);
  });

  test('label_count is capped at hours and floored at 1', () => {
    assert.equal(labelsFor({ hours: 2, label_count: 10 }).length, 3);
    assert.equal(labelsFor({ hours: 24, label_count: 0 }).length, 2);
  });

  test('offset windows label hours ago, never Now', () => {
    assert.deepEqual(labelsFor({ hours: 24, start_offset: 24 }), ['48h ago', '24h ago']);
  });

  test('24h and 12h formats show clock times', () => {
    const fmt24 = labelsFor({ hours: 4, label_format: '24h' });
    const fmt12 = labelsFor({ hours: 4, label_format: '12h' });
    const opts24 = { hour: '2-digit', minute: '2-digit', hour12: false };
    const opts12 = { hour: 'numeric', minute: '2-digit', hour12: true };
    assert.deepEqual(fmt24, [new Date(NOW - 4 * HOUR).toLocaleTimeString([], opts24), new Date(NOW).toLocaleTimeString([], opts24)]);
    assert.deepEqual(fmt12, [new Date(NOW - 4 * HOUR).toLocaleTimeString([], opts12), new Date(NOW).toLocaleTimeString([], opts12)]);
    assert.match(fmt24[0], /^\d{2}:\d{2}$/);
  });

  test('per-entity label settings override the card', () => {
    assert.deepEqual(labels(makeCard({ hours: 24, entities: [{ entity: 'sensor.temp', label_count: 2 }] }, temp).render()), ['24h ago', '12h ago', 'Now']);
  });

  test('show_labels false hides labels (card-level and per-entity)', () => {
    assert.equal(labelsFor({ show_labels: false }), null);
    assert.equal(labels(makeCard({ entities: [{ entity: 'sensor.temp', show_labels: false }] }, temp).render()), null);
  });

  test('labels are translated', () => {
    const card = makeCard({ hours: 24, entities: ['sensor.temp'] }, temp);
    card.language = 'fr';
    assert.deepEqual(labels(card.render()), ['24h', 'Actuel']);
  });
});

describe('min/max', () => {
  test('hidden by default; shows the range over history and the current value', () => {
    assert.ok(!visibleText(makeCard({ entities: ['sensor.temp'] }, temp).render()).includes('Min:'));
    const card = makeCard({ hours: 4, intervals: 4, show_min_max: true, entities: ['sensor.temp'] }, temp);
    rows(card, 'sensor.temp_state_0', [60, null, 90, 65]);
    assert.match(visibleText(card.render()), /Min: 60\.0°F \/ Max: 90\.0°F/);
  });

  test('per-entity show_min_max', () => {
    assert.match(visibleText(makeCard({ entities: [{ entity: 'sensor.temp', show_min_max: true }] }, temp).render()), /Min: 72\.0°F \/ Max: 72\.0°F/);
  });
});

describe('inline layout', () => {
  test('renders name, graph and value on one row', () => {
    const t = makeCard({ inline_layout: true, entities: ['sensor.temp'] }, temp).render();
    assert.equal(findAll(t, 'div', (el) => el.attrs.class === 'entity-inline-container').length, 1);
    assert.equal(find(t, 'div', (el) => el.attrs.class === 'entity-inline-value').text, '72.0°F');
    assert.equal(findAll(t, 'div', (el) => el.attrs.class === 'entity-container').length, 0);
  });

  test('per-entity inline_layout; min/max and labels render (labels are hidden by CSS)', () => {
    const t = makeCard({ show_min_max: true, entities: [{ entity: 'sensor.temp', inline_layout: true }] }, temp).render();
    assert.equal(findAll(t, 'div', (el) => el.attrs.class === 'entity-inline-container').length, 1);
    assert.ok(labels(t));
    assert.match(visibleText(t), /Min: 72\.0°F/);
  });

  test('inline layout honors show_icons, show_labels and show_current off', () => {
    const t = makeCard({ inline_layout: true, show_icons: false, show_labels: false, show_current: false, entities: ['sensor.temp'] }, temp).render();
    assert.equal(findAll(t, 'ha-icon').length, 0);
    assert.equal(labels(t), null);
    assert.equal(findAll(t, 'div', (el) => el.attrs.class === 'entity-inline-value').length, 0);
    assert.equal(find(t, 'button').text, 'Living Room');
  });

  test('the stylesheet hides time labels in inline rows', () => {
    const css = makeCard().constructor.styles.cssText;
    assert.match(css, /\.entity-inline-container \.labels\s*\{\s*display: none;/);
  });
});

describe('getTimeLabel', () => {
  test('shows the cell start and end clock times', () => {
    const card = makeCard({}, temp);
    assert.equal(norm(card.getTimeLabel(0, 4, 4, 0)), '8:00 AM - 9:00 AM');
    assert.equal(norm(card.getTimeLabel(3, 4, 4, 0)), '11:00 AM - 12:00 PM');
  });

  test('adds the weekday once the span passes 24 hours', () => {
    const card = makeCard({}, temp);
    assert.equal(norm(card.getTimeLabel(0, 48, 48, 0)), 'Tue 12:00 PM - 1:00 PM');
    assert.equal(norm(card.getTimeLabel(0, 4, 4, 24)), 'Wed 8:00 AM - 9:00 AM');
  });

  test('falls back to hass.language, then the runtime default locale', () => {
    const lang = makeCard({}, temp, { hass: { locale: undefined, language: 'de' } });
    assert.equal(norm(lang.getTimeLabel(0, 4, 4, 0)), '8:00 - 9:00');
    const none = makeCard({}, temp, { hass: { locale: undefined, language: undefined } });
    const fmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
    assert.equal(none.getTimeLabel(0, 4, 4, 0), `${fmt.format(new Date(NOW - 4 * HOUR))} - ${fmt.format(new Date(NOW - 3 * HOUR))}`);
  });

  test('uses the HA locale', () => {
    const card = makeCard({}, temp, { hass: { locale: { language: 'de-DE' } } });
    assert.equal(norm(card.getTimeLabel(0, 4, 4, 0)), '8:00 - 9:00');
  });
});

describe('_handleEntityClick', () => {
  test('stops propagation and fires hass-more-info for the entity', () => {
    const card = makeCard({ entities: ['sensor.temp'] }, temp);
    let stopped = false;
    card._handleEntityClick('sensor.temp', { stopPropagation: () => { stopped = true; } });
    assert.equal(stopped, true);
    const event = card.dispatchedEvents.at(-1);
    assert.equal(event.type, 'hass-more-info');
    assert.deepEqual(event.detail, { entityId: 'sensor.temp' });
    assert.equal(event.bubbles, true);
    assert.equal(event.composed, true);
  });

  test('both layouts wire the click to the entity', () => {
    for (const inline_layout of [false, true]) {
      const card = makeCard({ inline_layout, entities: ['sensor.temp'] }, temp);
      const container = find(card.render(), 'div', (el) => /entity(-inline)?-container/.test(el.attrs.class));
      container.attrs['@click']({ stopPropagation() {} });
      assert.deepEqual(card.dispatchedEvents.at(-1).detail, { entityId: 'sensor.temp' }, `inline_layout: ${inline_layout}`);
    }
  });
});
