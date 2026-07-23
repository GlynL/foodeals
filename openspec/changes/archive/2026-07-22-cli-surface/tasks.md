## 1. Build setup

- [x] 1.1 Add `tsconfig.build.json` extending the root config: `outDir: "dist"`, `rootDir: "src"`, emit on (`noEmit: false`), excluding `**/*.test.ts` and `src/core/__fixtures__`
- [x] 1.2 Add to `package.json`: a `build` script (`tsc -p tsconfig.build.json`), a `cli` script (`node dist/cli/index.js`), and a `foodeals` `bin` pointing at `dist/cli/index.js`
- [x] 1.3 Add `dist/` to `.gitignore`

## 2. Pure formatter

- [x] 2.1 Add `src/cli/render.ts` with `formatDeals(deals: Deal[]): string` - a count header followed by one block per deal: `title - venue` heading, then `discount`, then `days` joined by ", " (in list order), then the `location` URL
- [x] 2.2 When the list is empty, return a single clear "no deals" message instead of a header and blocks

## 3. Shell

- [x] 3.1 Add `src/cli/index.ts` with a testable `run(io)` that takes an injected list function and out/err write streams, formats the deals via `formatDeals`, writes them to `out`, and returns exit code 0
- [x] 3.2 In `run`, wrap the list call in try/catch: on throw, write the error's message to `err`, write no deal output to `out`, and return a non-zero exit code (the message is the core's; the CLI adds no validation)
- [x] 3.3 Add the entry that binds the real `process` (stdout/stderr and the core's `listDeals`), calls `run`, and `process.exit`s with its return code; include a `#!/usr/bin/env node` shebang

## 4. Tests

- [x] 4.1 Formatter tests (`src/cli/render.test.ts`): every field is present, the count header is correct, deal order is preserved, and the empty catalogue yields the "no deals" message
- [x] 4.2 Shell tests (`src/cli/index.test.ts`) via injected IO: a successful list writes the formatted output to `out` and returns 0; an injected throwing list writes the error to `err`, writes nothing to `out`, and returns a non-zero code
- [x] 4.3 End-to-end smoke test: build, then spawn the `dist` binary as a child process and assert it prints the deals and exits 0
- [x] 4.4 Confirm nothing under `src/core/` changed

## 5. Verify

- [x] 5.1 `npm run typecheck` and `npm test` pass
- [x] 5.2 `npm run build` succeeds; confirm the shebang is preserved in `dist/cli/index.js` and the binary runs from the project root (add the shebang in the build step if TypeScript 7 does not preserve it)

## 6. Docs

- [x] 6.1 Move **CLI surface ("A")** from `Next` to `Done` in `ROADMAP.md`
- [x] 6.2 Record the durable facts in `AGENTS.md` (the build step now exists; `src/cli/` is the first surface and imports the core, never the reverse), pruning as much as added
