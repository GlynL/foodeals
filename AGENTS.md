# foodeals — agent guidance

Curated food-deals aggregator.

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

- Core at `src/core/`; surfaces at `src/cli/` (`npm run cli`) and `src/http/`
  (`npm start`, listens on `PORT`, default 3000). Surfaces import the core,
  never the reverse (ADR 0001).

## Conventions

- Validation is strict and loud: throw a clear, actionable error; never skip bad data.
- Every behaviour has a test. Tests are the lasting behaviour spec; `.scratch/`
  specs are working documents for a change.
- UK British English in docs and messages.
- Comments explain only what the code and naming can't (edge cases, workarounds,
  guaranteed formats, non-obvious domain facts) — never narrate the obvious.

## Keeping this current

- This file, `CONTEXT.md` and `docs/adr/` are hand-maintained — nothing syncs
  them from code. Update them when a durable fact or convention
  changes, as a step within the change that introduced it.
- Edit `AGENTS.md` only; `CLAUDE.md` is a symlink to it.
- Prune as much as you add.

## Agent skills

### Issue tracker

Local markdown under `.scratch/<feature>/`, committed with the repo. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five default roles (`needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`), recorded as a `Status:` line. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the root. See
`docs/agents/domain.md`.
