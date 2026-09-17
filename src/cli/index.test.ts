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

    const code = run({ list: () => [sample], ...io }, []);

    expect(code).toBe(0);
    expect(out.join('\n')).toContain('2-for-1 burgers');
    expect(err).toEqual([]);
  });

  it('fails loudly on a core error: message to err, nothing to out, non-zero code', () => {
    const { out, err, io } = capture();

    const code = run(
      {
        list: () => {
          throw new Error('Deals file at data/deals.json is invalid');
        },
        ...io,
      },
      [],
    );

    expect(code).not.toBe(0);
    expect(err.join('\n')).toContain('Deals file at data/deals.json is invalid');
    expect(out).toEqual([]);
  });

  it('passes a valid --day value through to list() and prints the narrowed result', () => {
    const { out, err, io } = capture();
    let receivedDay: string | undefined;

    const code = run(
      {
        list: (day) => {
          receivedDay = day;
          return [sample];
        },
        ...io,
      },
      ['--day', 'Wed'],
    );

    expect(receivedDay).toBe('Wed');
    expect(code).toBe(0);
    expect(out.join('\n')).toContain('2-for-1 burgers');
    expect(err).toEqual([]);
  });

  it('rejects an unrecognised --day value without calling list()', () => {
    const { out, err, io } = capture();
    let listCalled = false;

    const code = run(
      {
        list: () => {
          listCalled = true;
          return [sample];
        },
        ...io,
      },
      ['--day', 'Funday'],
    );

    expect(listCalled).toBe(false);
    expect(code).not.toBe(0);
    expect(err.join('\n')).toContain('Funday');
    expect(out).toEqual([]);
  });

  it('rejects --day given with no value, without calling list()', () => {
    const { out, err, io } = capture();
    let listCalled = false;

    const code = run(
      {
        list: () => {
          listCalled = true;
          return [sample];
        },
        ...io,
      },
      ['--day'],
    );

    expect(listCalled).toBe(false);
    expect(code).not.toBe(0);
    expect(err.join('\n')).toMatch(/--day/);
    expect(out).toEqual([]);
  });

  it('accepts --day=Wed (equals-sign form) and passes the day through', () => {
    const { out, err, io } = capture();
    let receivedDay: string | undefined;

    const code = run(
      {
        list: (day) => {
          receivedDay = day;
          return [sample];
        },
        ...io,
      },
      ['--day=Wed'],
    );

    expect(receivedDay).toBe('Wed');
    expect(code).toBe(0);
    expect(out.join('\n')).toContain('2-for-1 burgers');
    expect(err).toEqual([]);
  });

  it('rejects --day= with no value after the equals sign, without calling list()', () => {
    const { out, err, io } = capture();
    let listCalled = false;

    const code = run(
      {
        list: () => {
          listCalled = true;
          return [sample];
        },
        ...io,
      },
      ['--day='],
    );

    expect(listCalled).toBe(false);
    expect(code).not.toBe(0);
    expect(err.join('\n')).toMatch(/--day/);
    expect(out).toEqual([]);
  });

  it('calls list() with no day when --day is omitted', () => {
    const { io } = capture();
    let receivedDay: string | undefined = 'not called';

    run(
      {
        list: (day) => {
          receivedDay = day;
          return [sample];
        },
        ...io,
      },
      [],
    );

    expect(receivedDay).toBeUndefined();
  });

  it('uses the first value when --day is given more than once', () => {
    const { io } = capture();
    let receivedDay: string | undefined;

    run(
      {
        list: (day) => {
          receivedDay = day;
          return [sample];
        },
        ...io,
      },
      ['--day', 'Wed', '--day', 'Fri'],
    );

    expect(receivedDay).toBe('Wed');
  });
});
