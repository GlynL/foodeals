#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { listDeals } from '../core/deals.js';
import type { Deal } from '../core/deal.js';
import { formatDeals } from './render.js';

export interface CliIo {
  list: () => Deal[];
  out: (text: string) => void;
  err: (text: string) => void;
}

export function run({ list, out, err }: CliIo): number {
  let deals: Deal[];
  try {
    deals = list();
  } catch (error) {
    err((error as Error).message);
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
    run({
      list: listDeals,
      out: (text) => process.stdout.write(`${text}\n`),
      err: (text) => process.stderr.write(`${text}\n`),
    }),
  );
}
