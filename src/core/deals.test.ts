import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { listDeals, loadDeals } from './deals.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string): string => join(here, '__fixtures__', name);

describe('loadDeals', () => {
  it('returns every deal with all fields (6.1)', () => {
    const deals = loadDeals(fixture('valid.json'));

    expect(deals).toHaveLength(3);
    expect(deals[0]).toEqual({
      title: '2-for-1 burgers',
      venue: 'The Grill House',
      discount: '2-for-1',
      location: 'https://www.google.com/maps/search/?api=1&query=The+Grill+House',
      days: ['Mon', 'Wed'],
    });
  });

  it('returns an empty result for an empty catalogue, with no error (6.2)', () => {
    expect(loadDeals(fixture('empty.json'))).toEqual([]);
  });

  it('aborts with a clear error when a required field is missing (6.3)', () => {
    expect(() => loadDeals(fixture('missing-venue.json'))).toThrow(/venue/);
  });

  it('aborts with a clear error on an unrecognised day (6.4)', () => {
    expect(() => loadDeals(fixture('invalid-day.json'))).toThrow(/Funday/);
  });

  it('aborts with a clear parse error on malformed JSON (6.5)', () => {
    expect(() => loadDeals(fixture('malformed.json'))).toThrow(/not valid JSON/i);
  });

  it('returns deals for every day regardless of the current day (6.6)', () => {
    const deals = loadDeals(fixture('valid.json'));
    const days = new Set(deals.flatMap((deal) => deal.days));

    expect(deals).toHaveLength(3);
    expect(days).toContain('Mon');
    expect(days).toContain('Sun');
  });

  it('rejects an unknown/mis-typed field, naming it', () => {
    expect(() => loadDeals(fixture('unknown-field.json'))).toThrow(/notes/);
  });

  it('reports every problem in one error when multiple entries are invalid', () => {
    let message = '';
    try {
      loadDeals(fixture('multi-error.json'));
    } catch (err) {
      message = (err as Error).message;
    }

    expect(message).toMatch(/titel/); // unknown field on deal 0
    expect(message).toMatch(/must not be empty/); // empty venue on deal 1
    expect(message).toMatch(/Funday/); // bad day on deal 1
    expect(message).toMatch(/Pizza/); // deal 1 located by title

    const problems = message.split('\n').filter((line) => line.trim().startsWith('- '));
    expect(problems.length).toBeGreaterThan(1);
  });
});

describe('listDeals', () => {
  it('loads the default deals file without error', () => {
    const deals = listDeals();
    expect(deals.length).toBeGreaterThan(0);
  });
});
