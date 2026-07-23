import { describe, expect, it } from 'vitest';
import type { Deal } from '../core/deal.js';
import { run } from './index.js';

const sample: Deal = {
  title: '2-for-1 burgers',
  venue: 'The Grill House',
  discount: '2-for-1 on all burgers',
  location: 'https://maps.example/grill',
  days: ['Mon', 'Tue'],
};

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, io: { out: (t: string) => out.push(t), err: (t: string) => err.push(t) } };
}

describe('run', () => {
  it('prints the deals and returns 0 on success (4.2)', () => {
    const { out, err, io } = capture();

    const code = run({ list: () => [sample], ...io });

    expect(code).toBe(0);
    expect(out.join('\n')).toContain('2-for-1 burgers');
    expect(err).toEqual([]);
  });

  it('fails loudly on a core error: message to err, nothing to out, non-zero code', () => {
    const { out, err, io } = capture();

    const code = run({
      list: () => {
        throw new Error('Deals file at data/deals.json is invalid');
      },
      ...io,
    });

    expect(code).not.toBe(0);
    expect(err.join('\n')).toContain('Deals file at data/deals.json is invalid');
    expect(out).toEqual([]);
  });
});
