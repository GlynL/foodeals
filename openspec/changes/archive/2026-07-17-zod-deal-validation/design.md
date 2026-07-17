## Context

The `deals-catalogue` core currently validates deals with hand-rolled checks in `src/core/deals.ts`, and defines the `Deal` type as a separate hand-written interface in `src/core/deal.ts`. The archived change's design (decision 6) chose hand-rolled checks to stay dependency-light, but explicitly flagged `zod` as "a fine choice and easy to adopt later". That time is now: we want to reject unknown fields and report all problems at once, both of which zod does naturally, while removing the risk that the `Deal` type and the validation drift apart.

## Goals / Non-Goals

**Goals:**
- Validate deals with a single zod schema.
- Derive the `Deal` type from that schema (`z.infer`) so type and validation are one definition.
- Reject unknown fields on a deal.
- Report every validation problem in one error, each located by deal index/title and field.
- Preserve all other observable behaviour and the public API shape.

**Non-Goals:**
- Changing the deal fields, the day-name convention, or the file as source of truth.
- Adding a surface, add/remove/edit, or filtering.
- Aggregating the JSON parse error together with schema errors (a malformed file can't be schema-checked, so it stays a separate, earlier failure).

## Decisions

**1. zod schema is the source of truth for both type and validation.** Define `DealSchema` in `deal.ts` and export `type Deal = z.infer<typeof DealSchema>`, replacing the hand-written interface. Rationale: eliminates drift between the type and the checks. *Alternative:* keep the interface and a parallel schema — rejected as the exact duplication we're trying to remove.

**2. `.strict()` to reject unknown fields.** The object schema uses `.strict()` so any key outside the five recognised fields fails. Rationale: catches mis-typed field names in a hand-edited file, which is squarely the strict-and-loud intent. *Alternative:* `.passthrough()`/default (ignore extras) — rejected because a silently-ignored `titel` is exactly the bug we want to surface.

**3. `safeParse` + aggregate all issues.** Use `DealsSchema.safeParse(json)`; on failure, map over `error.issues` and throw one `Error` whose message lists every problem, one per line. A small helper turns each `ZodIssue` into `index N ("title") → "field": message` using the parsed JSON to look up the title. Rationale: one run surfaces every problem in a hand-edited file; the `index ("title")` locator matches the current error style. *Alternative:* throw on the first issue only — rejected as the friendliness gain is the point of the change.

**4. Custom, friendly messages.** Field schemas carry explicit messages (e.g. `min(1, 'must not be empty')`, `nonempty('must list at least one day')`) so errors read as well as the current hand-rolled ones rather than zod's verbose defaults. Rationale: preserve readability for the operator.

**5. JSON parsing stays separate.** `readFileSync` + `JSON.parse` are unchanged; zod validates the already-parsed value. A malformed file fails at `JSON.parse` before any schema check, keeping that error clear and distinct. Rationale: zod does not parse JSON text, and a syntactically broken file has no structure to schema-check.

**6. `days` via `z.array(z.enum(DAYS)).nonempty()`.** `DAYS` stays the single canonical list; `z.enum` reuses it for both validation and the `Day` literal type. Rationale: no second list of day names to maintain.

## Risks / Trade-offs

- **New runtime dependency (zod)** → Accepted; the project no longer aims to be dependency-free, and zod is small, well-tested, and standard for this job.
- **`z.enum` with a `readonly` tuple** → If TypeScript objects to passing `DAYS` (declared `as const`) to `z.enum`, resolve at implementation time (e.g. a non-readonly copy or the supported spread form); does not affect the design.
- **Error message format changes slightly** → Tests assert on substrings (the offending field/day/title), not exact whole-string matches, so friendly-message wording can evolve without brittle tests.

## Open Questions

- None.
