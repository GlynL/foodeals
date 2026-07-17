## Why

The deal file is hand-edited, so validation is the safety net. Two gaps make that net leakier than it should be: a mis-typed field name (e.g. `titel`) currently slips through silently because we only check for *expected* fields, and when several entries are wrong the operator has to fix them one at a time because loading stops at the first error. Adopting `zod` closes both gaps and, as a bonus, lets the `Deal` type and its validation be a single definition that cannot drift.

## What Changes

- **Reject unknown fields.** A deal with a mis-typed or extra key (e.g. `titel`, or a stray `notes`) is now rejected loudly, catching a common hand-editing typo the current validation misses.
- **Report all problems at once.** When multiple deals/fields are invalid, loading aborts with a single error listing every problem (each located by deal index and title where available, plus the offending field), instead of failing on only the first.
- Adopt **zod** as the validation library and derive the `Deal` type from the schema via `z.infer`, so the type and validation are one source of truth.
- Preserve all other behaviour: reads `data/deals.json`, parses with `JSON.parse`, returns every deal with no filtering/sorting, returns an empty result for an empty catalogue, and aborts with a clear parse error on malformed JSON.

Out of scope: the deal fields themselves, the day-name convention (`Mon`…`Sun`), the JSON file as source of truth, and the absence of any surface. No add/remove/edit, no filtering.

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `deals-catalogue`: the "Strict validation rejects loudly" requirement is strengthened — it now also rejects unknown fields and reports every validation problem in one error rather than only the first.

## Impact

- **Code**: `src/core/deal.ts` (schema + inferred `Deal` type, replacing the hand-written interface) and `src/core/deals.ts` (validation via `zod` `safeParse`, aggregated error formatting). `listDeals`/`loadDeals` signatures unchanged.
- **Dependency**: adds `zod` as a runtime dependency.
- **Tests**: `src/core/deals.test.ts` gains cases for unknown-field rejection and multi-error reporting; existing cases remain valid.
- **Callers**: none affected — the public API (`loadDeals`, `listDeals`, `Deal`) is unchanged in shape.
