# foodeals — roadmap

Rough plan for what's next. Each item becomes an OpenSpec change when picked up
(propose → apply → sync → archive). Order is a guide, not a commitment.

The through-line: one surface-free core, with surfaces added on top over time
and discovery features grown without changing the core.

## Done

- **deals-catalogue** — deal model + load/validate/list from `data/deals.json`.
- **zod-deal-validation** — zod schema, reject unknown fields, report all errors.
- **cli-surface ("A")** — `foodeals` command prints the catalogue via `listDeals()`,
  core unchanged. First surface; added the `tsc` build step.
- **http-api-surface ("B")** — Fastify exposes `GET /deals` and `GET /health`
  over HTTP, reusing `listDeals()` unchanged. Unblocks the deployment pattern
  in `docs/deployment.md`.
- **Lint tooling** — ESLint (flat config) + Prettier, with the core→surface
  import boundary enforced via `import-x/no-restricted-paths`. Pre-commit hook
  (husky + lint-staged) runs both on staged files.
- **Dockerise the app** — `Dockerfile`, `.dockerignore`, `.env.example`, per
  `docs/deployment.md`'s template. Verified locally with `docker build`/`run`.

## Next

## Later

- **Day-of-week filtering** — "what's on today?" / filter by a given day. First use
  of the `days` field for discovery.
- **Web surface ("C")** — browse deals in a browser.
- **Write behaviours** — add / remove / edit deals, once a surface needs to write
  without hand-editing the JSON file.
- **More discovery** — filter by venue or area, sorting.

## Ideas / maybe

- Wire `lint`, `format:check`, `typecheck`, `test`, and `test:e2e` into a CI
  workflow (`.github/workflows/ci.yml`) on push/PR to `main` — no CI exists yet.
- Add `docker-compose.yml` and `.github/workflows/deploy.yml` (build → push to
  GHCR → SSH deploy, per `docs/deployment.md`'s template) once the box is
  provisioned and the repo secrets (`SSH_HOST`, `SSH_USER`, `SSH_KEY`) exist —
  no point wiring up routing/deploy for a box that doesn't exist yet.

- Fix silent error logging in the HTTP surface: `buildApp()` (`src/http/app.ts`)
  builds Fastify with no `logger` option, so `app.log.error()` in the 500
  handler is currently a no-op — found while docker-testing a broken-data-file
  500 and seeing nothing in `docker logs`.
