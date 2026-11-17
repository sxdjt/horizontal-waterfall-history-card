// Prebuild security gate: fail on high/critical npm audit advisories,
// except those explicitly allowlisted below.
//
// Only allowlist advisories that have no patched version AND only affect
// dev/build tooling. Remove entries once a fix is released.
import { spawnSync } from 'node:child_process';

const FAIL_SEVERITIES = new Set(['high', 'critical']);

const ALLOWLIST = {
  // picomatch ReDoS via repeated extglobs. Affects all versions <= 4.0.7
  // (latest); no fix released. Pulled in by rollup plugins and
  // typescript-eslint at build/lint time only, never shipped in the card.
  'GHSA-fc5q-39xc-vjpf': 'picomatch ReDoS, no patched version (added 2026-11-17)',
};

const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8' });

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error('audit-gate: could not parse npm audit output');
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

// Collect unique advisories (the "via" entries that are objects, not package names)
const advisories = new Map();
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via !== 'object') continue;
    const id = via.url?.split('/').pop() ?? String(via.source);
    advisories.set(id, via);
  }
}

const blocking = [];
const allowed = [];
for (const [id, adv] of advisories) {
  if (!FAIL_SEVERITIES.has(adv.severity)) continue;
  (id in ALLOWLIST ? allowed : blocking).push({ id, adv });
}

for (const { id, adv } of allowed) {
  console.warn(`audit-gate: allowlisted ${adv.severity} ${id} (${adv.name}): ${ALLOWLIST[id]}`);
}

for (const id of Object.keys(ALLOWLIST)) {
  if (!advisories.has(id)) {
    console.warn(`audit-gate: ${id} no longer reported; remove it from the allowlist`);
  }
}

if (blocking.length > 0) {
  for (const { id, adv } of blocking) {
    console.error(`audit-gate: ${adv.severity} ${id} (${adv.name} ${adv.range}): ${adv.title}`);
  }
  console.error(`audit-gate: ${blocking.length} blocking advisory(ies). Run "npm audit" for details.`);
  process.exit(1);
}

console.log('audit-gate: passed');
