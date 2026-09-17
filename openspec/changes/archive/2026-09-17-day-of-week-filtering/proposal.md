# Proposal

## Why

The catalogue stores a `days` field on every deal but nothing uses it: `listDeals()`
always returns everything, so there's no way to ask "what's on today?" or "what's on
Wednesday?" without reading the whole list. This is the roadmap's next discovery
feature and the first real use of `days`.

## What Changes

- The core's `listDeals()` gains an optional day filter: given a recognised day name,
  it returns only deals whose `days` list includes that day; given nothing, behaviour
  is unchanged (all deals, unfiltered).
- An unrecognised day name passed as a filter is rejected with a clear error, not
  treated as "no matches" — consistent with the project's existing strict validation.
- The CLI gains a `--day <name>` flag that filters via the core; an invalid value is
  reported to standard error with a non-zero exit, without calling the core.
- The HTTP API gains a `?day=<name>` query parameter on `GET /deals`; an invalid value
  responds `400` with a clear message instead of the current generic `500`.
- **BREAKING (internal only)**: `listDeals()`'s signature changes from no arguments to
  an optional `day` parameter. No external consumers exist outside this repo's two
  surfaces, both updated in this change.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `deals-catalogue`: "List all deals" changes from always-unfiltered to optionally
  filterable by a single recognised day name, with an unrecognised day rejected as an
  error.
- `cli`: adds a `--day` flag that filters the printed catalogue by day, and adds
  loud rejection of an unrecognised day value.
- `http-api`: adds a `day` query parameter on `GET /deals` that filters the returned
  catalogue, and adds a `400` response for an invalid `day` value (distinct from the
  existing generic `500` for catalogue load failures).

## Impact

- `src/core/deal.ts`, `src/core/deals.ts` — new exported `DaySchema`, `listDeals(day?)`.
- `src/cli/index.ts` — argv parsing for `--day`, updated `CliIo.list` signature.
- `src/http/app.ts` — querystring schema on `GET /deals`, error handler distinguishes
  validation errors (400) from core errors (500).
- Tests across `src/core/deals.test.ts`, `src/cli/index.test.ts`, `src/cli/cli.e2e.test.ts`,
  `src/http/app.test.ts`, `src/http/http.e2e.test.ts`.
- No changes to `data/deals.json` or its schema — `days` was already validated and
  stored; this only adds a read-side filter.
