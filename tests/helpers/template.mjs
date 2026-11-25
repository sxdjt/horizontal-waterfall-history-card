// Inspect Lit TemplateResults without a DOM.
//
// render() in the card and editor returns TemplateResult objects
// ({ strings, values }). These helpers turn them into:
//   - toHTML(t): an HTML-like string (bindings rendered as text) for
//     assertions on visible output;
//   - elements(t): every element in document order, with its static and bound
//     attributes ({ tag, attrs, text }), so tests can find a control by its
//     label and call its event handler (e.g. attrs['@value-changed']).

const MARK = '\u0000';
const placeholder = (i) => `${MARK}${i}${MARK}`;
const PLACEHOLDER_RE = new RegExp(`${MARK}(\\d+)${MARK}`, 'g');
const SINGLE_PLACEHOLDER_RE = new RegExp(`^${MARK}(\\d+)${MARK}$`);

export function isTemplate(v) {
  return v !== null && typeof v === 'object' && Array.isArray(v.strings) && Array.isArray(v.values);
}

function joined(t) {
  return t.strings.reduce((acc, s, i) => acc + s + (i < t.values.length ? placeholder(i) : ''), '');
}

function textOf(v) {
  if (v === null || v === undefined || typeof v === 'symbol' || typeof v === 'function') return '';
  if (Array.isArray(v)) return v.map(textOf).join('');
  if (isTemplate(v)) return toHTML(v);
  if (typeof v === 'object') return '';
  return String(v);
}

export function toHTML(t) {
  if (Array.isArray(t)) return t.map(toHTML).join('');
  if (!isTemplate(t)) return textOf(t);
  return joined(t).replace(PLACEHOLDER_RE, (_, i) => textOf(t.values[Number(i)]));
}

// Visible text: tags removed, whitespace collapsed.
export function visibleText(t) {
  return toHTML(t).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const TAG_RE = /<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTR_RE = /([.@?]?[\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function resolveAttr(raw, values) {
  if (raw === undefined) return '';
  const single = raw.match(SINGLE_PLACEHOLDER_RE);
  if (single) return values[Number(single[1])];
  return raw.replace(PLACEHOLDER_RE, (_, i) => textOf(values[Number(i)]));
}

export function elements(t, out = []) {
  if (Array.isArray(t)) { t.forEach((x) => elements(x, out)); return out; }
  if (!isTemplate(t)) return out;
  const src = joined(t);
  let cursor = 0;
  const visitText = (text) => {
    // Template/array values in text positions are child content: recurse so
    // their elements appear in document order.
    for (const m of text.matchAll(PLACEHOLDER_RE)) {
      const v = t.values[Number(m[1])];
      if (isTemplate(v) || Array.isArray(v)) elements(v, out);
    }
  };
  for (const m of src.matchAll(TAG_RE)) {
    visitText(src.slice(cursor, m.index));
    cursor = m.index + m[0].length;
    const attrs = {};
    for (const a of m[2].matchAll(ATTR_RE)) {
      const raw = a[2] ?? a[3] ?? a[4];
      attrs[a[1]] = resolveAttr(raw, t.values);
    }
    const nextTag = src.indexOf('<', cursor);
    const rawText = src.slice(cursor, nextTag === -1 ? undefined : nextTag);
    const text = rawText.replace(PLACEHOLDER_RE, (_, i) => textOf(t.values[Number(i)])).replace(/\s+/g, ' ').trim();
    out.push({ tag: m[1].toLowerCase(), attrs, text });
  }
  visitText(src.slice(cursor));
  return out;
}

export function findAll(t, tag, predicate = () => true) {
  return elements(t).filter((el) => el.tag === tag && predicate(el));
}

export function find(t, tag, predicate = () => true) {
  const found = findAll(t, tag, predicate);
  if (found.length === 0) throw new Error(`No <${tag}> matched`);
  return found[0];
}

// ha-selector controls are identified by their .label binding.
export function selector(t, label) {
  return find(t, 'ha-selector', (el) => el.attrs['.label'] === label);
}

// ha-switch controls are identified by their aria-label.
export function toggle(t, label) {
  return find(t, 'ha-switch', (el) => el.attrs['aria-label'] === label);
}

// ha-button controls are identified by their visible text (before any
// visually hidden suffix).
export function button(t, text) {
  return find(t, 'ha-button', (el) => el.text === text);
}
