import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('./audit.mjs', import.meta.url));
const business = {
  name: 'Example Workshop',
  address: '100 Example Street',
  phone: '+1 202-555-0101',
};
const matching = {
  source: 'Directory A',
  name: '  EXAMPLE WORKSHOP ',
  address: '100   Example Street',
  phone: '001 202 555 0101',
};

function runAudit(t, data, prefix = '') {
  const dir = mkdtempSync(join(tmpdir(), 'nap-audit-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'listings.json');
  writeFileSync(path, prefix + JSON.stringify(data), 'utf8');
  const result = spawnSync(process.execPath, [cli, path], { encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}

test('matching listings exit 0 after normalization', (t) => {
  const result = runAudit(t, { business, listings: [matching] });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { listingsChecked: 1, findings: [] });
});

test('mismatches and missing fields exit 1', (t) => {
  const result = runAudit(t, {
    business,
    listings: [{ source: 'Directory B', name: business.name, address: '200 Example Street' }],
  });
  assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    listingsChecked: 1,
    findings: [
      { source: 'Directory B', field: 'address', status: 'mismatch',
        expected: business.address, actual: '200 Example Street' },
      { source: 'Directory B', field: 'phone', status: 'missing',
        expected: business.phone, actual: '' },
    ],
  });
});

test('accepts UTF-8 JSON with a byte order mark', (t) => {
  const result = runAudit(t, { business, listings: [matching] }, '\uFEFF');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).findings, []);
});

test('invalid input exits 2 and reports the error on stderr', (t) => {
  const result = runAudit(t, { business, listings: [] });
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /listings must be a non-empty array/);
});
