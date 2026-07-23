## Why

The core can load, validate, and list deals, but there is no way to see them
without writing code. A command-line surface is the smallest useful way to view
the catalogue, and it is the first test of the project's central bet: that a
delivery surface can sit on top of the core and reuse it unchanged. If the CLI
can be built by calling `listDeals()` as-is, the core/surface separation holds.

## What Changes

- **Add a CLI command** (`foodeals`) that calls the core's `listDeals()` and
  prints every deal to stdout as a readable block per deal: a `title - venue`
  heading followed by discount, days, and the location URL, under a count header.
- **Fail loudly on load/validation errors.** If the core throws (unreadable file,
  malformed JSON, invalid deal), the CLI writes the error to stderr and exits
  non-zero, printing no partial deal output. It adds no validation of its own.
- **Handle the empty catalogue** with a clear "no deals" message and a zero exit,
  since an empty catalogue is not an error.
- **Add a build step.** The root `tsconfig` stays `noEmit` (so `typecheck` is
  unchanged); a new `tsconfig.build.json` emits to `dist/`, and the package gains
  a `foodeals` `bin` pointing at the compiled entry plus a `build` script. This
  is the path to a deployable command later, and the core's `.js`-extension
  imports already emit cleanly with no source changes.
- The **core is not modified.** The CLI imports and calls it as an ordinary
  consumer; no core file changes to accommodate the surface.

Out of scope: any flags or arguments (filtering, sorting, day-of-week, choosing a
data file), output formats beyond human-readable text, and any write behaviour.
Those are later roadmap items.

## Capabilities

### New Capabilities

- `cli`: a command-line surface that lists the catalogue by calling the core
  unchanged, printing deals to stdout and failing loudly to stderr on error.

### Modified Capabilities

<!-- None. The core (deals-catalogue) is reused unchanged. -->

## Impact

- **Code**: a new CLI entry point under `src/cli/` (a pure formatter plus a thin
  shell that wires stdout/stderr/exit). No changes to `src/core/`.
- **Packaging**: `tsconfig.build.json` (emit to `dist/`), a `build` script and a
  `cli` script in `package.json`, a `foodeals` `bin` entry, and `dist/` added to
  `.gitignore`.
- **Dependencies**: none added. `typescript` is already a devDependency; there is
  no runtime dependency and no separate runner.
- **Tests**: unit tests for the pure formatter and the shell's loud-failure and
  empty-catalogue behaviour (via injected IO), plus one end-to-end smoke test that
  runs the built `dist` binary to prove the build and `bin` wiring work.
- **Core/surface boundary**: this is the first surface, so it establishes the
  pattern later surfaces (HTTP, web) follow - surface calls core, never the reverse.
