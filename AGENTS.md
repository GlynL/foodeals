# foodeals — agent guidance

Curated food-deals aggregator. Domain vocabulary lives in `CONTEXT.md`; use its
terms in code, tests and docs.

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

- Decisions that shape the code are ADRs in `docs/adr/`; read the relevant ones
  before changing the core, the data file or a surface's contract.
- Core at `src/core/`; surfaces at `src/cli/` (`npm run cli`) and `src/http/`
  (`npm start`, listens on `PORT`, default 3000). Surfaces import the core,
  never the reverse (ADR 0001).

## Conventions

- Validation is strict and loud: throw a clear, actionable error; never skip bad data.
- Every behaviour has a test. Tests are the behaviour spec: there is no separate
  spec document, so a behaviour change starts with its test.
- UK British English in docs and messages.
- Comments explain only what the code and naming can't (edge cases, workarounds,
  guaranteed formats, non-obvious domain facts) — never narrate the obvious.

## Keeping this current

- This file, `CONTEXT.md` and `docs/adr/` are hand-maintained — nothing syncs
  them from code. Update them when a durable fact or convention
  changes, as a step within the change that introduced it.
- Edit `AGENTS.md` only; `CLAUDE.md` is a symlink to it.
- Prune as much as you add.
