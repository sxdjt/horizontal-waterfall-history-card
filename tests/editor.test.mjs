// Visual editor: config handlers, render wiring, and the accessibility
// checks from docs/card-compatibility-guide.md (A1-A3, A6, A7).

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WaterfallHistoryCardEditor, makeEditor, makeHass, lastConfig } from './helpers/env.mjs';
import { toHTML, visibleText, findAll, find, selector, toggle, button } from './helpers/template.mjs';

const BASE = { type: 'custom:waterfall-history-card', entities: [] };
const cfg = (extra = {}) => ({ ...BASE, ...extra });
const changed = (editor) => editor.dispatchedEvents.filter((e) => e.type === 'config-changed');

// Fake shadow root that records focus requests (A6).
function trackFocus(editor) {
  const focused = [];
  editor.shadowRoot = {
    querySelector: (sel) => ({ focus: () => focused.push(sel) }),
  };
  return focused;
}

describe('setConfig and render guard', () => {
  test('setConfig stores the config as given', () => {
    const editor = new WaterfallHistoryCardEditor();
    const c = cfg({ title: 'X' });
    editor.setConfig(c);
    assert.equal(editor._config, c);
  });

  test('render is empty without config or hass', () => {
    const editor = new WaterfallHistoryCardEditor();
    editor.setConfig(cfg());
    assert.equal(toHTML(editor.render()).trim(), '');
    assert.ok(toHTML(makeEditor().render()).includes('card-config'));
  });
});

describe('_configValueChanged', () => {
  test('fires config-changed with the key merged in, bubbling and composed', () => {
    const editor = makeEditor(cfg({ title: 'A', hours: 24 }));
    editor._configValueChanged('title', 'B');
    const [event] = changed(editor);
    assert.deepEqual(event.detail.config, cfg({ title: 'B', hours: 24 }));
    assert.equal(event.bubbles, true);
    assert.equal(event.composed, true);
  });

  test('does nothing without hass', () => {
    const editor = makeEditor(cfg());
    editor.hass = undefined;
    editor._configValueChanged('title', 'B');
    assert.equal(changed(editor).length, 0);
  });

  test('does not mutate the current config', () => {
    const c = cfg({ title: 'A' });
    makeEditor(c)._configValueChanged('title', 'B');
    assert.equal(c.title, 'A');
  });
});

describe('_isValidColor', () => {
  const editor = makeEditor();
  test('empty is invalid; valid CSS colors pass; junk fails', () => {
    assert.equal(editor._isValidColor(''), false);
    for (const v of ['#fff', '#ff000080', 'red', 'rgb(1, 2, 3)', 'var(--primary-color)']) assert.equal(editor._isValidColor(v), true, v);
    assert.equal(editor._isValidColor('#ff'), false);
    assert.equal(editor._isValidColor('notacolor'), false);
  });
});

describe('_focusControl', () => {
  test('focuses the element with the matching data-focus-key', () => {
    const editor = makeEditor();
    const focused = trackFocus(editor);
    editor._focusControl('add-threshold');
    assert.deepEqual(focused, ['[data-focus-key="add-threshold"]']);
  });

  test('is safe without a shadow root', () => {
    assert.doesNotThrow(() => makeEditor()._focusControl('x'));
  });
});

describe('entity handlers', () => {
  test('_addEntity appends an empty entity, creating the list if needed', () => {
    const editor = makeEditor({ type: 'x' });
    editor._addEntity();
    assert.deepEqual(lastConfig(editor).entities, [{ entity: '' }]);
    const e2 = makeEditor(cfg({ entities: ['sensor.a'] }));
    e2._addEntity();
    assert.deepEqual(lastConfig(e2).entities, ['sensor.a', { entity: '' }]);
  });

  test('_removeEntity removes by index and moves focus to Add Entity', () => {
    const editor = makeEditor(cfg({ entities: ['sensor.a', 'sensor.b', 'sensor.c'] }));
    const focused = trackFocus(editor);
    editor._removeEntity(1);
    assert.deepEqual(lastConfig(editor).entities, ['sensor.a', 'sensor.c']);
    assert.deepEqual(focused, ['[data-focus-key="add-entity"]']);
  });

  test('_entityChanged normalizes string entities and sets the key', () => {
    const c = cfg({ entities: ['sensor.a', { entity: 'sensor.b', name: 'B' }] });
    const editor = makeEditor(c);
    editor._entityChanged(0, 'hours', 6);
    assert.deepEqual(lastConfig(editor).entities[0], { entity: 'sensor.a', hours: 6 });
    editor._entityChanged(1, 'name', 'Bee');
    assert.deepEqual(lastConfig(editor).entities[1], { entity: 'sensor.b', name: 'Bee' });
    assert.deepEqual(c.entities[1], { entity: 'sensor.b', name: 'B' });
  });
});

describe('global threshold handlers', () => {
  test('_addThreshold appends a default row, creating the list if needed', () => {
    const editor = makeEditor(cfg());
    editor._addThreshold();
    assert.deepEqual(lastConfig(editor).thresholds, [{ value: 0, color: '#cccccc' }]);
  });

  test('_removeThreshold removes by index and focuses Add Threshold; no-op without thresholds', () => {
    const editor = makeEditor(cfg({ thresholds: [{ value: 1, color: '#111111' }, { value: 2, color: '#222222' }] }));
    const focused = trackFocus(editor);
    editor._removeThreshold(0);
    assert.deepEqual(lastConfig(editor).thresholds, [{ value: 2, color: '#222222' }]);
    assert.deepEqual(focused, ['[data-focus-key="add-threshold"]']);
    const empty = makeEditor(cfg());
    empty._removeThreshold(0);
    assert.equal(changed(empty).length, 0);
  });

  test('_thresholdChanged converts value to a number and keeps color as text; no-op without thresholds', () => {
    const editor = makeEditor(cfg({ thresholds: [{ value: 1, color: '#111111' }] }));
    editor._thresholdChanged(0, 'value', '42.5');
    assert.deepEqual(lastConfig(editor).thresholds, [{ value: 42.5, color: '#111111' }]);
    editor._thresholdChanged(0, 'color', 'red');
    assert.deepEqual(lastConfig(editor).thresholds, [{ value: 1, color: 'red' }]);
    const empty = makeEditor(cfg());
    empty._thresholdChanged(0, 'value', '1');
    assert.equal(changed(empty).length, 0);
  });
});

describe('global state color handlers', () => {
  test('_addStateColor appends an empty-named row, keeping order', () => {
    const editor = makeEditor(cfg({ state_colors: { heat: '#ff0000' } }));
    editor._addStateColor();
    assert.deepEqual(Object.entries(lastConfig(editor).state_colors), [['heat', '#ff0000'], ['', '#cccccc']]);
  });

  test('_removeStateColor removes by index; removing the last row clears the map', () => {
    const editor = makeEditor(cfg({ state_colors: { heat: '#ff0000', cool: '#0000ff' } }));
    const focused = trackFocus(editor);
    editor._removeStateColor(0);
    assert.deepEqual(lastConfig(editor).state_colors, { cool: '#0000ff' });
    assert.deepEqual(focused, ['[data-focus-key="add-state-color"]']);
    const single = makeEditor(cfg({ state_colors: { heat: '#ff0000' } }));
    single._removeStateColor(0);
    assert.equal(lastConfig(single).state_colors, undefined);
  });

  test('_stateColorChanged renames a state in place or changes its color', () => {
    const editor = makeEditor(cfg({ state_colors: { heat: '#ff0000', cool: '#0000ff' } }));
    editor._stateColorChanged(0, 'state', 'heating');
    assert.deepEqual(Object.entries(lastConfig(editor).state_colors), [['heating', '#ff0000'], ['cool', '#0000ff']]);
    editor._stateColorChanged(1, 'color', '#00ffff');
    assert.deepEqual(lastConfig(editor).state_colors, { heat: '#ff0000', cool: '#00ffff' });
  });
});

describe('per-entity state color handlers', () => {
  test('_addEntityStateColor appends a row, normalizing string entities', () => {
    const editor = makeEditor(cfg({ entities: ['climate.x'] }));
    editor._addEntityStateColor(0);
    assert.deepEqual(lastConfig(editor).entities[0], { entity: 'climate.x', state_colors: { '': '#cccccc' } });
  });

  test('_removeEntityStateColor removes by index; last row clears the map; focuses that entity Add', () => {
    const editor = makeEditor(cfg({ entities: [{ entity: 'climate.x', state_colors: { a: '#000001', b: '#000002' } }] }));
    const focused = trackFocus(editor);
    editor._removeEntityStateColor(0, 1);
    assert.deepEqual(lastConfig(editor).entities[0].state_colors, { a: '#000001' });
    assert.deepEqual(focused, ['[data-focus-key="add-entity-state-color-0"]']);
    const single = makeEditor(cfg({ entities: [{ entity: 'climate.x', state_colors: { a: '#000001' } }] }));
    single._removeEntityStateColor(0, 0);
    assert.equal(lastConfig(single).entities[0].state_colors, undefined);
  });

  test('_entityStateColorChanged renames or recolors one row', () => {
    const editor = makeEditor(cfg({ entities: [{ entity: 'climate.x', state_colors: { a: '#000001' } }] }));
    editor._entityStateColorChanged(0, 0, 'state', 'z');
    assert.deepEqual(lastConfig(editor).entities[0].state_colors, { z: '#000001' });
    editor._entityStateColorChanged(0, 0, 'color', '#999999');
    assert.deepEqual(lastConfig(editor).entities[0].state_colors, { a: '#999999' });
  });
});

describe('per-entity threshold handlers', () => {
  test('_addEntityThreshold appends a default row, normalizing string entities', () => {
    const editor = makeEditor(cfg({ entities: ['sensor.a'] }));
    editor._addEntityThreshold(0);
    assert.deepEqual(lastConfig(editor).entities[0], { entity: 'sensor.a', thresholds: [{ value: 0, color: '#cccccc' }] });
  });

  test('_removeEntityThreshold removes by index and focuses that entity Add; no-op without thresholds', () => {
    const editor = makeEditor(cfg({ entities: [{ entity: 'sensor.a', thresholds: [{ value: 1, color: '#111111' }, { value: 2, color: '#222222' }] }] }));
    const focused = trackFocus(editor);
    editor._removeEntityThreshold(0, 0);
    assert.deepEqual(lastConfig(editor).entities[0].thresholds, [{ value: 2, color: '#222222' }]);
    assert.deepEqual(focused, ['[data-focus-key="add-entity-threshold-0"]']);
    const empty = makeEditor(cfg({ entities: ['sensor.a'] }));
    empty._removeEntityThreshold(0, 0);
    assert.equal(changed(empty).length, 0);
  });

  test('_entityThresholdChanged converts value to a number; no-op without thresholds', () => {
    const editor = makeEditor(cfg({ entities: [{ entity: 'sensor.a', thresholds: [{ value: 1, color: '#111111' }] }] }));
    editor._entityThresholdChanged(0, 0, 'value', '7');
    assert.deepEqual(lastConfig(editor).entities[0].thresholds, [{ value: 7, color: '#111111' }]);
    editor._entityThresholdChanged(0, 0, 'color', 'blue');
    assert.deepEqual(lastConfig(editor).entities[0].thresholds, [{ value: 1, color: 'blue' }]);
    const empty = makeEditor(cfg({ entities: ['sensor.a'] }));
    empty._entityThresholdChanged(0, 0, 'value', '1');
    assert.equal(changed(empty).length, 0);
  });
});

describe('card-level controls are wired to the right keys', () => {
  const selectors = [
    ['Card Title', 'title', 'Temps', 'Temps'],
    ['Time Window (hours)', 'hours', '12', 12],
    ['Intervals', 'intervals', '36', 36],
    ['Bar Height (pixels)', 'height', '80', 80],
    ['Decimal Places', 'digits', '0', 0],
    ['Interval Value', 'interval_value', 'max', 'max'],
    ['Track Attribute (optional)', 'attribute', 'hvac_action', 'hvac_action'],
    ['Track Attribute (optional)', 'attribute', '', undefined],
    ['Label Count', 'label_count', '3', 3],
    ['Label Format', 'label_format', '12h', '12h'],
    ['Cell Gap (pixels)', 'cell_gap', '0', 0],
    ['On State Label', 'state_on', 'Open', 'Open'],
    ['Off State Label', 'state_off', 'Closed', 'Closed'],
    ['Unknown State Label', 'state_unknown', '?', '?'],
    ['Unavailable State Label', 'state_unavailable', 'Down', 'Down'],
    ['On State Color', 'color_on', '#ff0000', '#ff0000'],
    ['Off State Color', 'color_off', '#000000', '#000000'],
    ['Unknown State Color', 'color_unknown', 'orange', 'orange'],
    ['Unavailable State Color', 'color_unavailable', 'gray', 'gray'],
  ];
  for (const [label, key, input, expected] of selectors) {
    test(`"${label}" sets ${key} to ${JSON.stringify(expected)}`, () => {
      const editor = makeEditor(cfg());
      selector(editor.render(), label).attrs['@value-changed']({ detail: { value: input } });
      assert.equal(lastConfig(editor)[key], expected);
    });
  }

  const toggles = [
    ['Show Title', 'show_title'], ['Show Icons', 'show_icons'], ['Show Labels', 'show_labels'], ['Show Current Value', 'show_current'],
    ['Show Min/Max', 'show_min_max'], ['Compact Mode', 'compact'], ['Inline Layout', 'inline_layout'],
    ['Gradient Mode', 'gradient'],
  ];
  for (const [label, key] of toggles) {
    test(`"${label}" switch sets ${key}`, () => {
      const editor = makeEditor(cfg());
      toggle(editor.render(), label).attrs['@change']({ target: { checked: false } });
      assert.equal(lastConfig(editor)[key], false);
    });
  }

  test('switches reflect the config, with the card defaults when unset', () => {
    const t = makeEditor(cfg({ show_icons: false, compact: true })).render();
    assert.equal(toggle(t, 'Show Icons').attrs['.checked'], false);
    assert.equal(toggle(t, 'Compact Mode').attrs['.checked'], true);
    assert.equal(toggle(t, 'Show Labels').attrs['.checked'], true);
    assert.equal(toggle(t, 'Show Title').attrs['.checked'], true);
    assert.equal(toggle(makeEditor(cfg({ show_title: false })).render(), 'Show Title').attrs['.checked'], false);
    assert.equal(toggle(t, 'Show Min/Max').attrs['.checked'], false);
  });

  test('fields show the card defaults when unset', () => {
    const t = makeEditor(cfg()).render();
    assert.equal(selector(t, 'Card Title').attrs['.value'], 'History');
    assert.equal(selector(t, 'Time Window (hours)').attrs['.value'], 24);
    assert.equal(selector(t, 'Intervals').attrs['.value'], 48);
    assert.equal(selector(t, 'Bar Height (pixels)').attrs['.value'], 60);
    assert.equal(selector(t, 'Decimal Places').attrs['.value'], 1);
    assert.equal(selector(t, 'Interval Value').attrs['.value'], 'last');
    assert.equal(selector(t, 'Label Count').attrs['.value'], 1);
    assert.equal(selector(t, 'Label Format').attrs['.value'], 'relative');
    assert.equal(selector(t, 'Cell Gap (pixels)').attrs['.value'], 1);
    assert.equal(selector(t, 'On State Color').attrs['.value'], '#4a9eff');
    assert.equal(selector(t, 'Off State Color').attrs['.value'], '#2d3245');
    assert.equal(selector(t, 'Unavailable State Label').attrs['.value'], 'INOP');
  });

  test("an empty title shows as empty, not the default", () => {
    assert.equal(selector(makeEditor(cfg({ title: '' })).render(), 'Card Title').attrs['.value'], '');
  });

  test('hours, intervals and label count accept any value of 1 or more (no maximum)', () => {
    const t = makeEditor(cfg({ hours: 336, intervals: 14, entities: ['sensor.a'] })).render();
    for (const label of ['Time Window (hours)', 'Intervals', 'Label Count', 'Hours (override)', 'Intervals (override)', 'Label Count (override)']) {
      assert.deepEqual(selector(t, label).attrs['.selector'], { number: { min: 1, mode: 'box', step: 1 } }, label);
    }
    // The README's Daily Goals example (hours: 336, intervals: 14) shows as configured.
    assert.equal(selector(t, 'Time Window (hours)').attrs['.value'], 336);
    assert.equal(selector(t, 'Intervals').attrs['.value'], 14);
  });

  test('bar height, decimal places and cell gap keep their ranges', () => {
    const t = makeEditor(cfg()).render();
    assert.deepEqual(selector(t, 'Bar Height (pixels)').attrs['.selector'].number, { min: 30, max: 200, mode: 'box', step: 1 });
    assert.deepEqual(selector(t, 'Decimal Places').attrs['.selector'].number, { min: 0, max: 5, mode: 'box', step: 1 });
    assert.deepEqual(selector(t, 'Cell Gap (pixels)').attrs['.selector'].number, { min: 0, max: 10, mode: 'box', step: 1 });
  });

  test('digits 0 is shown as 0, not the default', () => {
    assert.equal(selector(makeEditor(cfg({ digits: 0 })).render(), 'Decimal Places').attrs['.value'], 0);
  });
});

describe('threshold and state color rows', () => {
  test('no thresholds shows the default-thresholds note', () => {
    assert.match(visibleText(makeEditor(cfg()).render()), /No thresholds defined\. Using default temperature-based thresholds\./);
  });

  test('threshold rows: value input, color input and Remove are wired by index', () => {
    const editor = makeEditor(cfg({ thresholds: [{ value: 1, color: '#111111' }, { value: 2, color: '#222222' }] }));
    const t = editor.render();
    const inputs = findAll(t, 'input', (el) => el.attrs.type === 'number');
    assert.deepEqual(inputs.map((el) => el.attrs['aria-label']), ['Threshold 1 value', 'Threshold 2 value']);
    inputs[1].attrs['@change']({ target: { value: '9' } });
    assert.deepEqual(lastConfig(editor).thresholds[1], { value: 9, color: '#222222' });
    find(t, 'input', (el) => el.attrs['aria-label'] === 'Threshold 1 color').attrs['@input']({ target: { value: '#abcdef' } });
    assert.equal(lastConfig(editor).thresholds[0].color, '#abcdef');
    findAll(t, 'ha-button', (el) => el.text === 'Remove')[1].attrs['@click']();
    assert.deepEqual(lastConfig(editor).thresholds, [{ value: 1, color: '#111111' }]);
    button(t, 'Add Threshold').attrs['@click'].call(editor);
    assert.equal(lastConfig(editor).thresholds.length, 3);
  });

  test('global state color rows are wired by index', () => {
    const editor = makeEditor(cfg({ state_colors: { heat: '#ff0000' } }));
    const t = editor.render();
    find(t, 'input', (el) => el.attrs['aria-label'] === 'State 1 name').attrs['@change']({ target: { value: 'heating' } });
    assert.deepEqual(lastConfig(editor).state_colors, { heating: '#ff0000' });
    find(t, 'input', (el) => el.attrs['aria-label'] === 'State 1 color').attrs['@input']({ target: { value: 'red' } });
    assert.deepEqual(lastConfig(editor).state_colors, { heat: 'red' });
    button(t, 'Add State Color').attrs['@click'].call(editor);
    assert.equal(Object.keys(lastConfig(editor).state_colors).length, 2);
    button(t, 'Remove').attrs['@click']();
    assert.equal(lastConfig(editor).state_colors, undefined);
  });

  test('no state colors shows a note', () => {
    assert.match(visibleText(makeEditor(cfg()).render()), /No state colors defined\./);
  });
});

describe('entity panels', () => {
  test('no entities shows a note; Add Entity is wired', () => {
    const editor = makeEditor(cfg());
    const t = editor.render();
    assert.match(visibleText(t), /No entities configured\. Add at least one entity\./);
    button(t, 'Add Entity').attrs['@click'].call(editor);
    assert.deepEqual(lastConfig(editor).entities, [{ entity: '' }]);
  });

  test('panel header: name, then entity id, then "Entity N"', () => {
    const t = makeEditor(cfg({ entities: [{ entity: 'sensor.a', name: 'A' }, 'sensor.b', { entity: '' }] })).render();
    const headers = findAll(t, 'ha-expansion-panel').map((el) => el.attrs.header).filter((h) => !/Advanced|Configuration|Thresholds/.test(h));
    assert.deepEqual(headers, ['A', 'sensor.b', 'Entity 3']);
  });

  const entitySelectors = [
    ['Entity', 'entity', 'sensor.new', 'sensor.new'],
    ['Custom Name (optional)', 'name', 'N', 'N'],
    ['Hours (override)', 'hours', '6', 6],
    ['Hours (override)', 'hours', '', undefined],
    ['Intervals (override)', 'intervals', '24', 24],
    ['Intervals (override)', 'intervals', '', undefined],
    ['Label Count (override)', 'label_count', '2', 2],
    ['Label Count (override)', 'label_count', '', undefined],
    ['Label Format (override)', 'label_format', '24h', '24h'],
    ['Label Format (override)', 'label_format', '', undefined],
    ['Custom Icon', 'icon', 'mdi:x', 'mdi:x'],
    ['Custom Unit', 'unit', 'W', 'W'],
    ['Decimal Places (override)', 'digits', '3', 3],
    ['Decimal Places (override)', 'digits', '', undefined],
    ['Interval Value (override)', 'interval_value', 'min', 'min'],
    ['Interval Value (override)', 'interval_value', '', undefined],
    ['Track Attribute (override)', 'attribute', 'state', 'state'],
    ['Track Attribute (override)', 'attribute', '', undefined],
    ['On State Color (override)', 'color_on', '#ff0000', '#ff0000'],
    ['Off State Color (override)', 'color_off', '', ''],
  ];
  for (const [label, key, input, expected] of entitySelectors) {
    test(`entity "${label}" sets ${key} to ${JSON.stringify(expected)}`, () => {
      const editor = makeEditor(cfg({ entities: ['sensor.a'] }));
      selector(editor.render(), label).attrs['@value-changed']({ detail: { value: input } });
      assert.equal(lastConfig(editor).entities[0][key], expected);
    });
  }

  test('entity "Decimal Places (override)" can be set to 0; empty, null or cleared inherits', () => {
    for (const [input, expected] of [[0, 0], ['0', 0], [2, 2], ['', undefined], [null, undefined], [undefined, undefined]]) {
      const editor = makeEditor(cfg({ entities: ['sensor.a'] }));
      selector(editor.render(), 'Decimal Places (override)').attrs['@value-changed']({ detail: { value: input } });
      assert.equal(lastConfig(editor).entities[0].digits, expected, JSON.stringify(input));
    }
  });

  test('entity Decimal Places 0 is shown as 0, not blank', () => {
    const t = makeEditor(cfg({ entities: [{ entity: 'sensor.a', digits: 0 }] })).render();
    assert.equal(selector(t, 'Decimal Places (override)').attrs['.value'], 0);
  });

  const entityToggles = [
    ['Show Icons (override)', 'show_icons', true], ['Show Labels (override)', 'show_labels', true],
    ['Show Current (override)', 'show_current', true], ['Inline Layout (override)', 'inline_layout', false],
  ];
  for (const [label, key, unsetDefault] of entityToggles) {
    test(`entity "${label}" switch sets ${key} and defaults to ${unsetDefault}`, () => {
      const editor = makeEditor(cfg({ entities: ['sensor.a'] }));
      const sw = toggle(editor.render(), label);
      assert.equal(sw.attrs['.checked'], unsetDefault);
      sw.attrs['@change']({ target: { checked: !unsetDefault } });
      assert.equal(lastConfig(editor).entities[0][key], !unsetDefault);
    });
  }

  test('Remove Entity is wired to that entity', () => {
    const editor = makeEditor(cfg({ entities: ['sensor.a', 'sensor.b'] }));
    findAll(editor.render(), 'ha-button', (el) => el.text === 'Remove Entity')[0].attrs['@click']();
    assert.deepEqual(lastConfig(editor).entities, ['sensor.b']);
  });

  test('per-entity state color and threshold rows are wired to that entity', () => {
    const editor = makeEditor(cfg({ entities: ['sensor.a', { entity: 'climate.x', state_colors: { heat: '#ff0000' }, thresholds: [{ value: 5, color: '#555555' }] }] }));
    const t = editor.render();
    find(t, 'input', (el) => el.attrs['aria-label'] === 'State 1 name').attrs['@change']({ target: { value: 'cool' } });
    assert.deepEqual(lastConfig(editor).entities[1].state_colors, { cool: '#ff0000' });
    find(t, 'input', (el) => el.attrs['aria-label'] === 'State 1 color').attrs['@input']({ target: { value: '#00ff00' } });
    assert.deepEqual(lastConfig(editor).entities[1].state_colors, { heat: '#00ff00' });
    find(t, 'input', (el) => el.attrs['aria-label'] === 'Threshold 1 value').attrs['@change']({ target: { value: '8' } });
    assert.deepEqual(lastConfig(editor).entities[1].thresholds, [{ value: 8, color: '#555555' }]);
    find(t, 'input', (el) => el.attrs['aria-label'] === 'Threshold 1 color').attrs['@input']({ target: { value: '#666666' } });
    assert.deepEqual(lastConfig(editor).entities[1].thresholds, [{ value: 5, color: '#666666' }]);
    const removes = findAll(t, 'ha-button', (el) => el.text === 'Remove');
    removes[0].attrs['@click']();
    assert.equal(lastConfig(editor).entities[1].state_colors, undefined);
    removes[1].attrs['@click']();
    assert.deepEqual(lastConfig(editor).entities[1].thresholds, []);
    findAll(t, 'ha-button', (el) => el.text === 'Add Entity Threshold')[1].attrs['@click']();
    assert.deepEqual(lastConfig(editor).entities[1].thresholds, [{ value: 5, color: '#555555' }, { value: 0, color: '#cccccc' }]);
    findAll(t, 'ha-button', (el) => el.text === 'Add State Color').at(-1).attrs['@click']();
    assert.deepEqual(lastConfig(editor).entities[1].state_colors, { heat: '#ff0000', '': '#cccccc' });
  });

  test('per-entity notes show when the entity has no own colors or thresholds', () => {
    const text = visibleText(makeEditor(cfg({ entities: ['sensor.a'] })).render());
    assert.match(text, /No entity-specific state colors\. Using global state colors\./);
    assert.match(text, /No entity-specific thresholds\. Using global thresholds\./);
  });
});

describe('accessibility (docs/card-compatibility-guide.md)', () => {
  const full = () => makeEditor(cfg({
    thresholds: [{ value: 1, color: '#111111' }],
    state_colors: { heat: '#ff0000' },
    entities: [{ entity: 'climate.x', state_colors: { cool: '#0000ff' }, thresholds: [{ value: 2, color: '#222222' }] }],
  })).render();

  test('A1: every switch has an aria-label and the same visually hidden slotted text', () => {
    const t = full();
    const html = toHTML(t);
    const switches = findAll(t, 'ha-switch');
    assert.ok(switches.length >= 11);
    for (const sw of switches) {
      const label = sw.attrs['aria-label'];
      assert.ok(label, 'switch without aria-label');
      assert.ok(html.includes(`<span class="visually-hidden">${label}</span></ha-switch>`), label);
    }
  });

  test('A1: every raw input has an aria-label', () => {
    for (const input of findAll(full(), 'input')) assert.ok(input.attrs['aria-label'], JSON.stringify(input.attrs));
  });

  test('A2: every Remove button has a distinct visually hidden suffix', () => {
    const html = toHTML(full());
    const suffixes = [...html.matchAll(/Remove(?: Entity)?<span class="visually-hidden">([^<]*)<\/span>/g)].map((m) => m[1].trim());
    assert.deepEqual(suffixes, ['state heat', 'threshold 1', 'climate.x', 'state cool', 'threshold 1']);
    assert.equal((html.match(/>\s*Remove/g) || []).length, suffixes.length);
  });

  test('A3: every ha-selector sets required explicitly; only Entity is required', () => {
    const selectors = findAll(full(), 'ha-selector');
    assert.ok(selectors.length > 20);
    for (const s of selectors) assert.equal(typeof s.attrs['.required'], 'boolean', s.attrs['.label']);
    assert.deepEqual(selectors.filter((s) => s.attrs['.required']).map((s) => s.attrs['.label']), ['Entity']);
  });

  test('A6: Add buttons carry the focus keys that Remove handlers target', () => {
    const keys = findAll(full(), 'ha-button').map((b) => b.attrs['data-focus-key']).filter(Boolean);
    assert.deepEqual(keys.sort(), ['add-entity', 'add-entity-state-color-0', 'add-entity-threshold-0', 'add-state-color', 'add-threshold']);
  });

  test('A7: an invalid color field shows an error in an always-present live region', () => {
    const editor = makeEditor(cfg({ color_on: 'notacolor' }));
    const t = editor._renderColorField('On State Color', 'notacolor', () => {});
    const region = find(t, 'div', (el) => el.attrs.class === 'error-text');
    assert.equal(region.attrs['aria-live'], 'polite');
    assert.match(visibleText(t), /Error: On State Color is not a valid color\. Use a hex code \(#FF0000\), a color name \(red\), or var\(--token\)\./);
    const ok = editor._renderColorField('On State Color', '#ff0000', () => {});
    assert.equal(find(ok, 'div', (el) => el.attrs.class === 'error-text').attrs['aria-live'], 'polite');
    assert.doesNotMatch(visibleText(ok), /Error/);
    assert.doesNotMatch(visibleText(editor._renderColorField('X', '', () => {})), /Error/, 'blank is not an error');
  });

  test('A7: an invalid raw color input is marked invalid and described by its error', () => {
    const editor = makeEditor();
    const bad = editor._renderColorInput('#ff', 'Threshold 1 color', 'err-1', () => {});
    const input = find(bad, 'input');
    assert.equal(input.attrs['aria-invalid'], 'true');
    assert.equal(input.attrs['aria-describedby'], 'err-1');
    assert.equal(find(bad, 'p').attrs.id, 'err-1');
    assert.match(visibleText(bad), /Error: Threshold 1 color is not a valid color/);
    const good = find(editor._renderColorInput('#ffffff', 'Threshold 1 color', 'err-1', () => {}), 'input');
    assert.equal(good.attrs['aria-invalid'], 'false');
    assert.equal(typeof good.attrs['aria-describedby'], 'symbol', 'aria-describedby is removed (nothing)');
  });

  test('error and helper text use theme text color; the error bar uses the error color', () => {
    const css = WaterfallHistoryCardEditor.styles.cssText;
    assert.match(css, /\.visually-hidden\s*\{/);
    assert.match(css, /\.error-text\s*\{[^}]*color: var\(--primary-text-color\)/);
    assert.match(css, /\.error-text\s*\{[^}]*border-left: 3px solid var\(--error-color/);
  });

  test('no deprecated components (Part 1)', () => {
    const html = toHTML(full());
    assert.doesNotMatch(html, /<ha-textfield|<mwc-button/);
  });
});

describe('_renderToggle', () => {
  test('renders a labeled switch that reports its checked state', () => {
    const editor = makeEditor(cfg({}), makeHass());
    let got;
    const t = editor._renderToggle('Thing', true, (checked) => { got = checked; });
    const sw = find(t, 'ha-switch');
    assert.equal(sw.attrs['.checked'], true);
    assert.equal(find(t, 'span').text, 'Thing');
    sw.attrs['@change']({ target: { checked: false } });
    assert.equal(got, false);
  });
});
