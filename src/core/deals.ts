import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DealsSchema, type Deal } from './deal.js';

// Resolved against the current working directory, so callers must run from the project root.
export const DEFAULT_DEALS_PATH = resolve('data/deals.json');

export function loadDeals(filePath: string = DEFAULT_DEALS_PATH): Deal[] {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read deals file at ${filePath}: ${(err as Error).message}`, {
      cause: err,
    });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Deals file at ${filePath} is not valid JSON: ${(err as Error).message}`, {
      cause: err,
    });
  }

  const result = DealsSchema.safeParse(json);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  - ${locate(issue, json)}`).join('\n');
    throw new Error(`Deals file at ${filePath} is invalid:\n${lines}`);
  }
  return result.data;
}

export function listDeals(): Deal[] {
  return loadDeals();
}

// Formats one issue as: index N ("title") → "field": message
function locate(
  issue: { readonly path: ReadonlyArray<PropertyKey>; readonly message: string },
  json: unknown,
): string {
  const index = typeof issue.path[0] === 'number' ? issue.path[0] : undefined;
  const field = issue.path.slice(1).join('.');

  let where = index === undefined ? 'top level' : `index ${index}`;
  if (index !== undefined && Array.isArray(json)) {
    const title = (json[index] as Record<string, unknown> | undefined)?.title;
    if (typeof title === 'string' && title.trim() !== '') {
      where += ` ("${title}")`;
    }
  }

  return field ? `${where} → "${field}": ${issue.message}` : `${where}: ${issue.message}`;
}
