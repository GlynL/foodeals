## Context

This is the first change in a greenfield learning project for the OpenSpec spec-driven workflow. The product is a curated food-deals aggregator whose deals are maintained by hand.

The guiding architectural idea (established during exploration) is that A→B→C — a CLI, then an HTTP API, then a web app — are three **front doors onto one core**, not three apps. This change builds only the core: the deal data model and the ability to list all deals from a hand-edited JSON file. Future changes add surfaces and discovery features on top without changing the core.

Constraints:
- Language/runtime: **TypeScript on Node**.
- Store: a single hand-edited JSON file, `data/deals.json`.
- Validation must be strict and loud (see specs) because the file is hand-edited.

## Goals / Non-Goals

**Goals:**
- Define a `Deal` type with the five fields: `title`, `venue`, `discount`, `location`, `days`.
- Provide a core function to load `data/deals.json`, validate strictly, and return all deals.
- Keep the core free of any I/O surface concern (no CLI parsing, no HTTP) so surfaces can be layered later.
- Fail loudly with actionable error messages on any malformed input.

**Non-Goals:**
- Any delivery surface (CLI, HTTP API, web) — later changes.
- Add / remove / edit behaviours — hand-editing the file covers this for now.
- Filtering, sorting, searching (including day-of-week filtering) — later.
- Structured discounts — `discount` stays free text.
- A database or any persistence beyond the flat file.

## Decisions

**1. Core/surface separation.** The core is a plain module exporting a `listDeals()` function (and the `Deal` type). It knows nothing about how it is invoked. Rationale: the whole A→B→C plan is cheap only if surfaces reuse the core unchanged. *Alternative considered:* bundling load logic into a CLI entry point — rejected because the B (API) step would then require re-implementing or extracting the logic.

**2. File location and shape.** Deals live in `data/deals.json` as a top-level array, each item an object of the five fields. Rationale: a flat array is the simplest shape a human can hand-edit, and matches "return all deals". *Alternative considered:* keyed-by-id object — rejected as unnecessary ceremony while there are no update/delete features.

**3. JSON parsing via the built-in `JSON.parse`.** Rationale: JSON parsing ships with Node, so this adds no runtime dependency, and `JSON.parse` throws on malformed input, which we surface directly. *Alternative considered:* YAML via `js-yaml` — YAML is friendlier to hand-edit, but it pulls in a dependency; for a small file, one fewer dependency wins. Trade-off accepted: JSON is fussier to hand-edit (commas, quoting).

**4. Strict validation with clear errors.** After parsing, validate each deal: all five fields present and non-empty; `days` a non-empty list; every day one of a fixed set of recognised names. On the first violation, throw an error naming the offending deal (by index and/or title) and the specific problem. Rationale: the spec requires loud rejection, not silent skipping; a hand-editor needs the typo pinpointed. *Alternative considered:* collecting and reporting all errors at once — reasonable, but deferred to keep this first change small; failing on the first error is acceptable.

**5. Day representation.** Recognised day names are a fixed set (e.g. `Mon, Tue, Wed, Thu, Fri, Sat, Sun`). Rationale: a closed set makes validation meaningful and prepares the ground for day-of-week filtering in a later change. Exact casing/spelling convention is settled in tasks.

**6. Validation approach.** Validation is written as explicit checks in the core rather than pulling in a schema library. Rationale: the model is tiny, and hand-rolled checks keep the learning project dependency-light and the error messages fully under our control. *Alternative considered:* a schema validator (e.g. zod) — a fine choice and easy to adopt later, but more than this first change needs.

## Risks / Trade-offs

- **Fail-on-first-error hides later mistakes** → The operator fixes one typo, re-runs, and finds the next. Acceptable for a small hand-edited file; batch reporting can be added later.
- **Free-text `discount` cannot be sorted or filtered by amount** → Accepted deliberately; `days` is the intended future filter axis, not discount.
- **No schema versioning in the file** → Acceptable while greenfield; if the schema changes later, a version field or migration can be introduced in that change.
- **Hand-editing JSON is error-prone (trailing commas, unquoted keys)** → Mitigated by strict validation and clear parse errors, which is the whole point of the loud-rejection requirement. If hand-editing becomes painful, YAML can be reconsidered in a later change.

## Open Questions

- Exact day-name convention (three-letter `Mon` vs full `Monday`, case sensitivity) — to be settled when writing tasks; does not affect the architecture.
