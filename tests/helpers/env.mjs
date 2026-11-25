// Test environment for the built card.
//
// The tests load dist/horizontal-waterfall-history-card.js (the exact file
// Home Assistant loads) in plain Node. The bundle needs a handful of browser
// globals at import time; the minimal stand-ins below provide only what the
// card and Lit touch. Elements are never connected to a document, so Lit
// never performs a real render: tests call render() and inspect the returned
// TemplateResult with ./template.mjs instead.
//
// `npm test` rebuilds dist first (pretest), so the tests always cover the
// current source.

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Fixed timezone so clock-time labels and bucket boundaries are deterministic.
process.env.TZ = 'UTC';

const registry = new Map();
const whenDefinedWaiters = new Map();

class FakeClassList {
  constructor() { this._set = new Set(); }
  add(c) { this._set.add(c); }
  remove(c) { this._set.delete(c); }
  contains(c) { return this._set.has(c); }
}

class FakeStyle {
  constructor() { this._props = {}; }
  setProperty(name, value) { this._props[name] = value; }
  getPropertyValue(name) { return this._props[name] ?? ''; }
}

class FakeHTMLElement {
  constructor() {
    this.classList = new FakeClassList();
    this.style = new FakeStyle();
    this.dispatchedEvents = [];
    this.shadowRoot = null;
    this.isConnected = false;
  }
  dispatchEvent(event) { this.dispatchedEvents.push(event); return true; }
  setAttribute() {}
  removeAttribute() {}
  hasAttribute() { return false; }
  attachShadow() { throw new Error('attachShadow is not available in the test environment'); }
}

globalThis.window = globalThis;
globalThis.HTMLElement = FakeHTMLElement;
globalThis.Element = class {};
globalThis.Document = class {};
globalThis.ShadowRoot = class {};
globalThis.CSSStyleSheet = class { replaceSync() {} };
globalThis.requestAnimationFrame = (cb) => { cb(0); return 0; };
globalThis.document = {
  createTreeWalker: () => ({}),
  createComment: () => ({}),
  importNode: () => ({}),
  createElement: (tag) => {
    const cls = registry.get(tag);
    return cls ? new cls() : { tagName: tag.toUpperCase() };
  },
};
globalThis.customElements = {
  define(name, cls) {
    if (registry.has(name)) throw new Error(`${name} already defined`);
    registry.set(name, cls);
    (whenDefinedWaiters.get(name) || []).forEach((resolve) => resolve(cls));
    whenDefinedWaiters.delete(name);
  },
  get(name) { return registry.get(name); },
  whenDefined(name) {
    if (registry.has(name)) return Promise.resolve(registry.get(name));
    return new Promise((resolve) => {
      const list = whenDefinedWaiters.get(name) || [];
      list.push(resolve);
      whenDefinedWaiters.set(name, list);
    });
  },
};

// CSS.supports('color', value) stand-in for the editor's color validation.
// Accepts the formats the editor's error message advertises: hex (3, 4, 6, 8
// digits), rgb()/rgba()/hsl()/hsla(), var(--token), and a set of named colors.
const NAMED_COLORS = new Set([
  'red', 'green', 'blue', 'black', 'white', 'gray', 'grey', 'orange', 'yellow',
  'purple', 'pink', 'brown', 'cyan', 'magenta', 'transparent', 'currentcolor',
]);
globalThis.CSS = {
  supports(property, value) {
    if (property !== 'color' || typeof value !== 'string') return false;
    const v = value.trim().toLowerCase();
    return /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(v)
      || /^(rgb|rgba|hsl|hsla)\([^()]*\)$/.test(v)
      || /^var\(--[\w-]+\)$/.test(v)
      || NAMED_COLORS.has(v);
  },
};

// Silence the card's console banner and expected error logs during tests.
const originalInfo = console.info;
console.info = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('WATERFALL-HISTORY-CARD')) return;
  originalInfo(...args);
};

const here = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.resolve(here, '../../dist/horizontal-waterfall-history-card.js');
const bundle = await import(pathToFileURL(bundlePath).href);

export const WaterfallHistoryCard = bundle.WaterfallHistoryCard;
export const WaterfallHistoryCardEditor = registry.get('waterfall-history-card-editor');
export const definedElements = registry;

if (!WaterfallHistoryCard || !WaterfallHistoryCardEditor) {
  throw new Error('Card or editor class not found in the bundle');
}

// Defaults the card ships with (src/constants.ts). Duplicated here on purpose:
// a test that reads them from the source would not catch an accidental change.
export const DEFAULT_COLORS = {
  numeric: ['#5b8fce', '#52a870', '#d4894a', '#c85c4a'],
  on: '#4a9eff',
  off: '#2d3245',
  unknown: '#FF9800',
  unavailable: '#9E9E9E',
};

// A fixed "now" for time-dependent tests: 2026-01-15 12:00:00 UTC.
export const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
export const HOUR = 60 * 60 * 1000;

export function stateObj(state, attributes = {}, extra = {}) {
  return { state, attributes, last_changed: extra.last_changed, last_updated: extra.last_updated };
}

export function makeHass(states = {}, overrides = {}) {
  const calls = [];
  const hass = {
    states,
    language: 'en',
    locale: { language: 'en-US' },
    callApi: async (method, url) => {
      calls.push({ method, url });
      return overrides.history ? overrides.history(url) : [[]];
    },
    ...overrides.hass,
  };
  hass.apiCalls = calls;
  return hass;
}

// A card with config applied and hass set. setConfig() runs exactly as HA
// would call it, so the stored config carries the card's own defaults.
export function makeCard(config = {}, states = {}, hassOverrides = {}) {
  const card = new WaterfallHistoryCard();
  card.setConfig({ type: 'custom:waterfall-history-card', entities: [], ...config });
  card.hass = makeHass(states, hassOverrides);
  return card;
}

// An editor with config and hass set. config-changed events are captured on
// editor.dispatchedEvents; lastConfig() returns the most recent one.
export function makeEditor(config = { type: 'custom:waterfall-history-card', entities: [] }, hass = makeHass()) {
  const editor = new WaterfallHistoryCardEditor();
  editor.setConfig(config);
  editor.hass = hass;
  return editor;
}

export function lastConfig(editor) {
  const events = editor.dispatchedEvents.filter((e) => e.type === 'config-changed');
  return events.length ? events[events.length - 1].detail.config : undefined;
}

// History point as the HA history API returns it (minimal_response omits
// attributes; attribute mode includes them).
export function point(state, timeMs, attributes) {
  const iso = new Date(timeMs).toISOString();
  const p = { state, last_changed: iso, last_updated: iso };
  if (attributes) p.attributes = attributes;
  return p;
}
