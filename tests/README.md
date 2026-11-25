# Tests

Run with `npm test`. It rebuilds `dist/` (rollup only, no audit gate), then runs every `*.test.mjs` file here with Node's built-in test runner. There are no test dependencies; Node 20.11 or newer is required (for `mock.timers` with `Date`).

## How it works

The tests load `dist/horizontal-waterfall-history-card.js`, the same file Home Assistant loads, in plain Node. `helpers/env.mjs` provides the few browser globals the bundle touches (`HTMLElement`, `customElements`, `CSS.supports`, `requestAnimationFrame`), captures the card and editor classes, and builds fixtures (`makeCard`, `makeEditor`, `makeHass`, `stateObj`, `point`). Elements are never attached to a document, so Lit never renders to a DOM.

Instead, tests call `render()` and inspect the returned Lit template with `helpers/template.mjs`:

- `toHTML(t)` and `visibleText(t)` for assertions on what the card shows.
- `elements(t)`, `find`, `findAll`, `selector(t, label)`, `toggle(t, label)` and `button(t, text)` to locate a control and call its bound handler, e.g. `selector(t, 'Card Title').attrs['@value-changed']({ detail: { value: 'X' } })`.

Time-dependent tests freeze `Date` at `NOW` (2026-01-15 12:00 UTC) with `mock.timers`, and the timezone is fixed to UTC.

## Coverage

Coverage is reported against `src/` through the bundle's source maps:

```bash
npm test && NODE_OPTIONS=--enable-source-maps node --test --experimental-test-coverage tests/
```

Every function in `src/waterfall-history-card.ts` and `src/editor.ts` is covered. The line percentages under-report, because comments, declarations and the CSS template literals map as uncovered.

## Files

| File | Covers |
|------|--------|
| `card-config.test.mjs` | `setConfig` defaults and normalization, host classes and CSS variables, `getStubConfig`, `getConfigElement`, sizing, element and card picker registration |
| `card-parsing.test.mjs` | `parseState`, attribute tracking, cache keys, index vs reading mode, `state_colors` lookup, `isNumericReading`, `getMinMax`, translations |
| `card-colors.test.mjs` | `getColorForValue` (special states, `state_colors`, thresholds, binary, gradient), binary color precedence, `interpolateColor`, `hexToRgb`, `getUnit`, `displayState` |
| `card-history.test.mjs` | `processHistoryData` (bucketing, fill, `interval_value`, attribute mode), `updateCard` (API URLs, caching, refresh interval, backfill, errors, pruning), refresh checks, `shouldUpdate`, `updated`, card-mod, column width sync |
| `card-render.test.mjs` | Entity header (name, icon, current value), bars and tooltips, time labels, min/max, inline layout, `getTimeLabel`, more-info click |
| `editor.test.mjs` | Every editor handler, every control's wiring to its config key, and the accessibility checks from `docs/card-compatibility-guide.md` (A1, A2, A3, A6, A7, Part 1) |

## Known issues

Record a known bug as a test with the `todo` option, describing the intended behavior. It runs and reports as `todo` without failing the suite. When a fix lands, remove the `todo` option so the test guards against regressions.

There are no open `todo` tests.
