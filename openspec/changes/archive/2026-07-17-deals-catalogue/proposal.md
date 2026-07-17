## Why

We want a curated aggregator of food deals with its own repository of deals that the operator maintains by hand. Before adding any user-facing surface (CLI, API, web) or any discovery features (filtering, sorting), we need a stable, well-defined core: a place to keep deals and a way to read them all back. Getting the data contract right first means every future surface can be layered on without reworking the core.

## What Changes

- Introduce a **hand-edited JSON data file** (`data/deals.json`) as the single source of truth for deals.
- Define the **deal schema**: `title`, `venue`, `discount` (free text), `location` (Google Maps URL), and `days` (recurring days-of-week the deal is valid).
- Add a single behaviour: **list all deals** — load the file, validate it strictly, and return every deal.
- **Strict, loud validation**: any malformed or missing field aborts the load with a clear error rather than silently skipping bad entries. The file is hand-edited, so typos must surface immediately.
- Treat `days` as **stored-but-unused** in this change: it is validated and returned, but not yet used for filtering.

Out of scope for this change (deliberately deferred to future changes):
- Any delivery surface (CLI, HTTP API, web app).
- Add / remove / edit behaviours — in v1 these are simply hand-edits to the JSON file, not features.
- Filtering (including by day-of-week), sorting, and search.
- Structured discounts — `discount` stays free text because deals like "50% off" and "2-for-1" share no common structure.

## Capabilities

### New Capabilities

- `deals-catalogue`: Defines the deal data model and the JSON file that stores deals, and provides the ability to load and list all deals with strict validation.

### Modified Capabilities

<!-- None — this is the first capability in the project. -->

## Impact

- **New data file**: `data/deals.json` (the source of truth; hand-edited).
- **New core module**: logic to load, validate, and list deals. Kept deliberately separate from any delivery surface so that future CLI/API/web changes reuse it unchanged.
- **No new runtime dependency**: parsing uses the built-in `JSON.parse`.
- No existing code, APIs, or systems are affected (greenfield project).
