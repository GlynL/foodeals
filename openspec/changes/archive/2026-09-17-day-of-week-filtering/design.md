# Design

## Context

`listDeals()` (`src/core/deals.ts`) currently takes no arguments and returns
`loadDeals()` unchanged. Both surfaces call it directly: the CLI prints whatever
it returns (`src/cli/index.ts`), and the HTTP surface serves it verbatim from
`GET /deals` (`src/http/app.ts`). The day-name enum used for validating a deal's
`days` field is currently inlined in `DealSchema` (`src/core/deal.ts`) rather than
exported on its own. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**

- One core filtering behaviour, reused unchanged by both surfaces (matches the
  project's core/surface split).
- Reject an unrecognised day value loudly, at the surface boundary, before the
  core or the data file is touched.
- Keep the core's public contract typed: it accepts an already-validated `Day`,
  never a raw string.

**Non-Goals:**

- No "today" convenience (e.g. `--today`, `?day=today`). Explicit day only —
  deterministic, no server-clock/timezone dependency. Can be layered on later by
  having a caller resolve today's day name and pass it through the same param.
- No filtering by venue, area, or multiple days at once — out of scope, tracked
  separately on the roadmap ("More discovery").
- No change to `data/deals.json` or `DealSchema`'s validation of stored `days`
  values — this is a read-side filter only.

## Decisions

**Factor out `DaySchema` from `DealSchema`.** The `days` field already validates
each entry with `z.enum(DAYS, ...)` inline. Exporting that as `DaySchema` from
`src/core/deal.ts` gives both surfaces one canonical validator for a raw `day`
input (CLI flag value, query string value), instead of each surface duplicating
the day-name list or writing its own check. Alternative considered: let each
surface check membership in `DAYS` by hand — rejected, since it would drift from
the core's own definition of a valid day and duplicate error-message wording.

**Core validates nothing at the boundary; surfaces do.** `listDeals(day?: Day)`
takes a `Day`, not a `string`. Callers (the two surfaces) run `DaySchema.safeParse`
on the raw value themselves before calling in. This keeps `loadDeals`/`listDeals`
surface-free (per CLAUDE.md's core/surface boundary) and keeps invalid-input
handling — CLI exit codes, HTTP status codes — where it belongs: in the surface
that knows what "invalid" means for its transport.

**Filter after load, not during schema validation.** `listDeals` calls
`loadDeals()` (unchanged, full strict validation of every stored deal) then
`.filter()`s the result when `day` is given. Filtering is unrelated to whether the
stored data is well-formed, so it stays a separate step after `loadDeals` returns.

**HTTP error handler gains a validation-vs-core branch.** Fastify (via
`fastify-type-provider-zod`) throws a request-validation error carrying
`error.validation` when the `day` query value fails its schema. The current
`setErrorHandler` treats every thrown error identically (generic `500`), which
would misreport a bad `day` value as a server error. The handler needs to check
for a validation error first (`hasZodFastifySchemaValidationErrors`, exported by
`fastify-type-provider-zod`) and respond `400` with the validation message,
falling through to the existing generic-`500`-and-log path otherwise. Core/data
errors keep their current opaque handling — this only adds a branch ahead of it,
it doesn't change what happens for a broken data file.

**CLI parses `--day` by hand.** No argv-parsing dependency exists in the project
and the surface is a single optional flag, so a small manual scan of `argv` for
`--day <value>` is proportionate. Introducing a parsing library for one flag
would be disproportionate (YAGNI).

## Risks / Trade-offs

- **`listDeals()`'s signature changes** (no args → optional `day`) → both call
  sites are in this repo and updated in the same change; no external consumers
  exist yet (no web surface, no published package), so this is safe now but
  would need a deprecation path once a third surface or external consumer exists.
- **Duplicated "parse and reject a raw day value" logic across CLI and HTTP** →
  mitigated by both calling the same exported `DaySchema`; the duplication is
  just the surface-specific plumbing (argv scan vs. Fastify querystring schema),
  not the validation rule itself.
