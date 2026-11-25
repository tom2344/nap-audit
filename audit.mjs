import { readFileSync } from 'node:fs';

const fields = ['name', 'address', 'phone'];

function normalize(field, value) {
  if (field === 'phone') return value.replace(/\D/gu, '').replace(/^00/u, '');
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/gu, ' ');
}

function validateEntry(entry, label, required) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error(`${label} must be an object.`);
  }
  for (const field of fields) {
    const value = entry[field];
    if ((!required && value == null) || (typeof value === 'string' &&
      (!required || normalize(field, value)))) continue;
    throw new Error(`${label}.${field} must be ${required ? 'a non-empty string' : 'a string or null'}.`);
  }
}

function audit(input) {
  validateEntry(input?.business, 'business', true);
  if (!Array.isArray(input.listings) || input.listings.length === 0) {
    throw new Error('listings must be a non-empty array.');
  }
  const findings = [];
  for (const [index, listing] of input.listings.entries()) {
    const label = `listings[${index}]`;
    validateEntry(listing, label, false);
    if (typeof listing.source !== 'string' || !listing.source.trim()) {
      throw new Error(`${label}.source must be a non-empty string.`);
    }
    for (const field of fields) {
      const expected = input.business[field];
      const actual = listing[field] ?? '';
      const observed = normalize(field, actual);
      if (observed !== normalize(field, expected)) {
        findings.push({ source: listing.source, field,
          status: observed ? 'mismatch' : 'missing', expected, actual });
      }
    }
  }
  return { listingsChecked: input.listings.length, findings };
}

try {
  const [filename, ...extra] = process.argv.slice(2);
  if (!filename || extra.length) throw new Error('Usage: node audit.mjs <listings.json>');
  const report = audit(JSON.parse(readFileSync(filename, 'utf8')));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.findings.length ? 1 : 0;
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
