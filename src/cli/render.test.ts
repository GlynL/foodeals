import { describe, expect, it } from 'vitest';
import type { Deal } from '../core/deal.js';
import { formatDeals } from './render.js';

const deal = (over: Partial<Deal> = {}): Deal => ({
  title: 'Half-price pizza',
  venue: 'Napoli',
  discount: '50% off mains',
  location: 'https://maps.example/napoli',
  days: ['Wed'],
  ...over,
});

describe('formatDeals', () => {
  it('includes every field of a deal (4.1)', () => {
    const out = formatDeals([deal()]);

    expect(out).toContain('Half-price pizza');
    expect(out).toContain('Napoli');
    expect(out).toContain('50% off mains');
    expect(out).toContain('Wed');
    expect(out).toContain('https://maps.example/napoli');
  });

  it('begins with a count header, pluralised', () => {
    expect(formatDeals([deal(), deal()]).split('\n')[0]).toBe('2 deals');
  });

  it('uses the singular for a single deal', () => {
    expect(formatDeals([deal()]).split('\n')[0]).toBe('1 deal');
  });

  it('joins days in list order', () => {
    expect(formatDeals([deal({ days: ['Mon', 'Tue', 'Wed'] })])).toContain('Mon, Tue, Wed');
  });

  it('preserves deal order', () => {
    const out = formatDeals([deal({ title: 'First' }), deal({ title: 'Second' })]);

    expect(out.indexOf('First')).toBeLessThan(out.indexOf('Second'));
  });

  it('reports an empty catalogue with a clear message', () => {
    expect(formatDeals([])).toBe('No deals found.');
  });
});
