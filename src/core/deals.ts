import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DAYS, type Day, type Deal } from './deal.js';

// Resolved against the current working directory, so callers must run from the project root.
export const DEFAULT_DEALS_PATH = resolve('data/deals.json');

const REQUIRED_TEXT_FIELDS = ['title', 'venue', 'discount', 'location'] as const;

export function loadDeals(filePath: string = DEFAULT_DEALS_PATH): Deal[] {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read deals file at ${filePath}: ${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Deals file at ${filePath} is not valid JSON: ${(err as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Deals file at ${filePath} must contain a JSON array of deals, but found ${typeName(parsed)}.`,
    );
  }

  return parsed.map((entry, index) => validateDeal(entry, index));
}

export function listDeals(): Deal[] {
  return loadDeals();
}

function validateDeal(entry: unknown, index: number): Deal {
  const where = describeDeal(entry, index);

  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    throw new Error(`Deal at ${where} must be an object, but found ${typeName(entry)}.`);
  }

  const record = entry as Record<string, unknown>;

  for (const field of REQUIRED_TEXT_FIELDS) {
    const value = record[field];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Deal at ${where} is missing a non-empty "${field}".`);
    }
  }

  const days = record.days;
  if (!Array.isArray(days) || days.length === 0) {
    throw new Error(`Deal at ${where} must have a non-empty "days" list.`);
  }
  for (const day of days) {
    if (typeof day !== 'string' || !(DAYS as readonly string[]).includes(day)) {
      throw new Error(
        `Deal at ${where} has an unrecognised day ${JSON.stringify(day)}. ` +
          `Recognised days are: ${DAYS.join(', ')}.`,
      );
    }
  }

  return {
    title: record.title as string,
    venue: record.venue as string,
    discount: record.discount as string,
    location: record.location as string,
    days: days as Day[],
  };
}

function describeDeal(entry: unknown, index: number): string {
  if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
    const title = (entry as Record<string, unknown>).title;
    if (typeof title === 'string' && title.trim() !== '') {
      return `index ${index} ("${title}")`;
    }
  }
  return `index ${index}`;
}

function typeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return `a ${typeof value}`;
}
