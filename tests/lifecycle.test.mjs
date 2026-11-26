// Lifecycle and fetch ordering, in HA's order: setConfig, hass, then HA calls
// setConfig again on the live card when an edit is saved (hui-card
// _updateElement). Found by the 2026-11 card review sweep (B12, B13).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, makeHass, stateObj } from './helpers/env.mjs';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const STATES = { 'sensor.a': stateObj('5'), 'sensor.b': stateObj('7') };

// First render as Lit runs it: updated() with the first hass.
async function firstRender(config) {
  const card = makeCard({ entities: ['sensor.a'], hours: 24, intervals: 48, ...config }, STATES);
  card.updated(new Map([['hass', undefined]]));
  await settle();
  return card;
}

test('WF1: a saved edit refetches with the new entities, hours and intervals', { todo: true }, async () => {
  const card = await firstRender({});
  const before = card.hass.apiCalls.length;
  const old = card.config;
  card.setConfig({ type: 'custom:waterfall-history-card', entities: ['sensor.a', 'sensor.b'], hours: 12, intervals: 24 });
  card.updated(new Map([['config', old]]));
  await settle();
  const urls = card.hass.apiCalls.slice(before).map((c) => c.url);
  assert.equal(urls.length, 2, 'both entities fetched without waiting for a state change');
  assert.equal(card.processedHistories['sensor.a_state_0'].data.length, 24, 'the new interval count');
  assert.ok(card.processedHistories['sensor.b_state_0']);
});

test('WF2: the first render fetches each entity once', { todo: true }, async () => {
  const card = await firstRender({});
  assert.equal(card.hass.apiCalls.length, 1);
});

test('WF3: an older fetch that resolves last does not overwrite the newer data', { todo: true }, async () => {
  const releases = [];
  const card = makeCard({ entities: ['sensor.a'], hours: 2, intervals: 2 }, STATES, {
    history: () => new Promise((resolve) => releases.push(resolve)),
  });
  const first = card.updateCard();
  card._lastHistoryFetch = {};               // a refresh falls due while the first is out
  const second = card.updateCard();
  const point = (state) => [[{ state, last_changed: new Date(Date.now() - 1000).toISOString() }]];
  releases[1](point('2'));
  await second;
  releases[0](point('1'));
  await first;
  const values = card.processedHistories['sensor.a_state_0'].data.map((b) => b.value).filter((v) => v !== null);
  assert.ok(values.length > 0);
  assert.ok(values.every((v) => v === 2), `shows ${[...new Set(values)]}`);
});
