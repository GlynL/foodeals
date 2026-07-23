# foodeals

A curated food-deals aggregator. Deals are hand-maintained in a single JSON file
and read for discovery. This is a learning project for the OpenSpec workflow.

The project is built as one surface-free **core** (the deal model plus
load/validate/list logic) with **surfaces** layered on top. The first surface is
a command-line tool that lists the catalogue.

## Prerequisites

- Node.js (developed on v22) and npm.

## Install

```bash
npm install
```

## Run the CLI

The CLI is TypeScript, so build it once, then run it:

```bash
npm run build   # compiles src/ to dist/ via tsconfig.build.json
npm run cli     # runs node dist/cli/index.js
```

Run it from the **project root** - the CLI reads `data/deals.json` relative to
the current working directory.

Output is one block per deal under a count header:

```
4 deals

2-for-1 burgers - The Grill House
  2-for-1 on all burgers
  Mon, Tue
  https://www.google.com/maps/search/?api=1&query=The+Grill+House

Half-price pizza - Napoli
  50% off mains
  Wed
  https://www.google.com/maps/search/?api=1&query=Napoli+Pizzeria
```

An empty catalogue prints `No deals found.` and exits 0. If the data file is
missing, malformed, or contains an invalid deal, the CLI writes the error to
standard error and exits non-zero, printing no deals.

## Edit the deals

`data/deals.json` is the sole source of truth. Edit it by hand; changes take
effect the next time the CLI is run. Each deal has this shape:

```json
{
  "title": "2-for-1 burgers",
  "venue": "The Grill House",
  "discount": "2-for-1 on all burgers",
  "location": "https://www.google.com/maps/search/?api=1&query=The+Grill+House",
  "days": ["Mon", "Tue"]
}
```

All fields are required. `days` must be a non-empty list drawn from `Mon`, `Tue`,
`Wed`, `Thu`, `Fri`, `Sat`, `Sun`. Validation is strict: an unknown or mis-typed
field, an empty value, or an unrecognised day is rejected with a clear error.

## Develop

```bash
npm test          # run the test suite (vitest); includes a build-and-run smoke test
npm run test:watch
npm run typecheck  # tsc --noEmit
npm run build
```

See `AGENTS.md` for architecture and conventions, and `ROADMAP.md` for what's next.
