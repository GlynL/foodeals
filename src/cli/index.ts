#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { listDeals } from '../core/deals.js';
import { DaySchema, type Day, type Deal } from '../core/deal.js';
import { formatDeals } from './render.js';

export interface CliIo {
  list: (day?: Day) => Deal[];
  out: (text: string) => void;
  err: (text: string) => void;
}

// Returns the raw value for `--day` (from either `--day <value>` or
// `--day=<value>`), undefined if the flag is absent, or null if given with no
// value.
function parseDayFlag(argv: string[]): string | undefined | null {
  const equalsForm = argv.find((arg) => arg.startsWith('--day='));
  if (equalsForm !== undefined) {
    const value = equalsForm.slice('--day='.length);
    return value === '' ? null : value;
  }

  const index = argv.indexOf('--day');
  if (index === -1) return undefined;
  return argv[index + 1] ?? null;
}

export function run({ list, out, err }: CliIo, argv: string[]): number {
  const rawDay = parseDayFlag(argv);
  let day: Day | undefined;
  if (rawDay === null) {
    err('--day requires a value');
    return 1;
  }
  if (rawDay !== undefined) {
    const result = DaySchema.safeParse(rawDay);
    if (!result.success) {
      err(`Invalid --day value ${JSON.stringify(rawDay)}: ${result.error.issues[0]?.message}`);
      return 1;
    }
    day = result.data;
  }

  let deals: Deal[];
  try {
    deals = list(day);
  } catch (error) {
    err(error instanceof Error ? error.message : String(error));
    return 1;
  }

  out(formatDeals(deals));
  return 0;
}

// True only when this module is the process entry point, so importing it from a
// test does not trigger the process.exit below.
function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  process.exit(
    run(
      {
        list: listDeals,
        out: (text) => process.stdout.write(`${text}\n`),
        err: (text) => process.stderr.write(`${text}\n`),
      },
      process.argv.slice(2),
    ),
  );
}
