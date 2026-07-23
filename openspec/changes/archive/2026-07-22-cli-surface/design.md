## Context

The `deals-catalogue` core exposes `listDeals(): Deal[]` (and `loadDeals(path)`)
in `src/core/`, kept deliberately free of any surface concern. Until now the only
consumer has been the test suite. This change adds the first delivery surface: a
CLI that lists the catalogue. It is the first real test of the project's central
bet - that a surface can sit on top of the core and reuse it unchanged.

Two facts shape the design. First, there is no build step today: the root
`tsconfig` is `noEmit`, tests run through vitest, and `typecheck` is
`tsc --noEmit`, so nothing has ever emitted JavaScript. A library consumed only
by vitest does not need to; a runnable command does. Second, the core already
writes relative imports with `.js` extensions (`./deal.js`), which is exactly the
NodeNext convention `tsc` emit expects - so a build needs no source changes.

## Goals / Non-Goals

**Goals:**
- A `foodeals` command that prints every deal the core returns, in a readable
  block-per-deal form under a count header.
- Fail loudly on any core load/validation error: message to stderr, non-zero
  exit, no partial output, no CLI-side validation.
- Report an empty catalogue clearly and exit 0.
- Leave `src/core/` untouched; the CLI is an ordinary consumer of the core.
- Establish a build that is the path to a deployable command later.

**Non-Goals:**
- Any flags or arguments: filtering, sorting, day-of-week, or choosing a data file.
- Output formats other than human-readable text.
- Any write behaviour (add/remove/edit).
- Fixing the core's cwd coupling (see Risks); the CLI runs from the project root.

## Decisions

**1. Build with `tsc` emit, not a runner or `.ts` imports.** Add
`tsconfig.build.json` that extends the root config, sets `outDir: dist`,
`rootDir: src`, turns emit on, and excludes `**/*.test.ts` and `__fixtures__`.
The package gains a `build` script (`tsc -p tsconfig.build.json`), a `cli` script
(`node dist/cli/index.js`), and a `foodeals` `bin` pointing at the built entry;
`dist/` is git-ignored. The root `tsconfig` stays `noEmit` so `typecheck` is
unchanged. *Rationale:* the core's `.js`-extension imports already emit cleanly
(verified: `tsc` preserves the specifier string verbatim), and a build is the
honest path to a deployable command. *Alternatives:* a `tsx` runner - rejected as
an extra dependency that still leaves no deployable artefact; switching the
codebase to `.ts`-extension imports for flagless `node` - rejected because it
edits the core and `allowImportingTsExtensions` requires `noEmit`, foreclosing the
very build we want.

**2. Pure formatter + thin shell with injected IO.** Split the CLI into a pure
`formatDeals(deals: Deal[]): string` and a thin `run(io): number` that calls the
core's list function, writes to the provided out/err streams, and returns an exit
code. `src/cli/index.ts` is the only part that touches the real `process` and
calls `process.exit`. *Rationale:* matches the project's "every behaviour has a
test" and "keep logic pure" conventions - the formatter and the run logic are
unit-testable without spawning a process or stubbing `process.exit`.
*Alternative:* one function that lists, prints, and exits - rejected as awkward to
test for stderr/exit behaviour.

**3. Fail loud by routing the core's throw, adding nothing.** `run` calls the
core inside a try/catch; on throw it writes `err.message` to the error stream and
returns a non-zero code, having written no deal output. The CLI performs no
validation itself, so the message the operator sees is the core's. *Rationale:*
the strict-and-loud contract already lives in the core; the surface must not
soften or duplicate it.

**4. Output shape: block per deal under a count header.** A header line stating
the count, then one block per deal: `title - venue` heading, then `discount`,
`days` joined by ", ", then the `location` URL. *Rationale:* the location URL is
too long to read on a single line, so a block form is clearer than one line per
deal. The empty catalogue prints a single "no deals" line and exits 0.

**5. Tests: unit-first, one end-to-end smoke.** Unit tests import the CLI source
directly through vitest (no build needed) to cover the formatter, the empty
message, and the loud-failure/exit behaviour via injected IO and an injected
throwing list function. One end-to-end smoke test builds and runs the `dist`
binary as a child process to prove the build and `bin` wiring actually work.
*Rationale:* unit tests keep the fast loop build-free; the smoke test is the only
thing that exercises the real emitted artefact. *Alternatives:* unit-only -
rejected as it never proves the build; e2e-only - rejected as slow and poor at
covering formatting detail.

## Risks / Trade-offs

- **"Did you rebuild?" staleness** → The smoke test runs `build` before invoking
  the binary (or depends on it), and unit tests need no build at all, so the
  common loop is never fooled by a stale `dist/`.
- **Shebang preservation on TypeScript 7** → The entry needs a
  `#!/usr/bin/env node` line to be executable as a `bin`. `tsc` has historically
  preserved a leading shebang; confirm the project's TypeScript 7 emit keeps it at
  implementation time, and if not, prepend it in the build step.
- **Core cwd coupling** → `listDeals()` resolves `data/deals.json` against
  `process.cwd()`, so the command only works when run from the project root. Out
  of scope to fix here; documented as a known constraint.
- **`process.exit` in tests** → Avoided by testing `run()` (which returns a code)
  rather than `index.ts`; only the untested-by-unit entry calls `process.exit`.

## Open Questions

- None. (Shebang preservation is a small implementation-time check, noted above.)
