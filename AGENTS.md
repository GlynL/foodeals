# foodeals — agent guidance

Curated food-deals aggregator. Learning project for the OpenSpec workflow.

## Stack

- TypeScript on Node. Fastify for the HTTP surface; no other framework.
- Tests run on vitest with no build. Surfaces run from a `tsc` build
  (`npm run build` → `dist/`, config in `tsconfig.build.json`); root `tsconfig`
  stays `noEmit` for `typecheck`.
- Pinned to TypeScript 6.x: `typescript-eslint` doesn't yet support TS 7's
  peer range. Revisit once it does.
- ESLint (flat config, `eslint.config.js`) + Prettier. `npm run lint`,
  `npm run format` / `format:check`. A husky pre-commit hook runs
  `lint-staged` (ESLint `--fix` + Prettier) on staged files.

## Architecture

- **Core stays surface-free.** Deal model + load/validate/list logic live in the
  core and must not import CLI/HTTP/web concerns. Surfaces call the core.
  Enforced by an ESLint `import-x/no-restricted-paths` rule (`eslint.config.js`).
- Data source of truth: a hand-edited JSON file (`data/deals.json`).
- Surfaces (CLI → HTTP API → web) are added as later changes and reuse the core
  unchanged. The CLI is the first surface, at `src/cli/` (run: `npm run cli`).
  The HTTP API is the second, at `src/http/` (run: `npm start`, listens on
  `PORT`, default 3000). Both import the core, never the reverse.

## Conventions

- Validation is strict and loud: throw a clear, actionable error; never skip bad data.
- Every behaviour has a test.
- UK British English in docs and messages.
- Comments explain only what the code and naming can't (edge cases, workarounds,
  guaranteed formats, non-obvious domain facts) — never narrate the obvious.

## Workflow

- Spec-driven via OpenSpec. Changes live in `openspec/changes/`.
- Implement by working through a change's `tasks.md`; run `/opsx:apply`.
- Config, tooling, and guidance chores don't need an OpenSpec change — only
  changes to a capability's behaviour do.

## Keeping this current

- This file and `openspec/config.yaml` (`context:`) are hand-maintained —
  nothing syncs them from code. Update them when a durable fact or convention
  changes, as a step within the change that introduced it.
- Edit `AGENTS.md` only; `CLAUDE.md` is a symlink to it.
- Prune as much as you add.
