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
- **Deploy pipeline** — `docker-compose.yml` (Traefik labels) and
  `.github/workflows/deploy.yml` (build → push to GHCR → SSH deploy), per
  `docs/deployment.md`'s templates. Serving at `foodeals.glynlewington.com`;
  the box setup log lives in `docs/deployment-progress.md`. Deploys are
  serialised (`concurrency`) and skipped for docs-only pushes (`paths-ignore`).

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
  Nothing gates the deploy workflow, so a red test still ships.
- Have the deploy job create `/opt/projects/foodeals` and write its `.env` from a
  repository variable (`vars.PORT`), passed via `ssh-action`'s `envs:`. Removes
  the one manual per-project box step and makes the droplet rebuildable without
  reconstructing config by hand. Worth proving here before folding it into
  `docs/deployment.md` as the default.
- Move `SSH_HOST` / `SSH_USER` / `SSH_KEY` from repository secrets to an
  `environment: production` in the deploy job, so only that job can read them.
  Worth doing when `ci.yml` lands, since a second workflow would otherwise
  inherit access to the deploy key for no reason. Needs the private key to hand
  (GitHub won't reveal an existing secret), so it means a fresh keypair.
- Fix silent error logging in the HTTP surface: `buildApp()` (`src/http/app.ts`)
  builds Fastify with no `logger` option, so `app.log.error()` in the 500
  handler is currently a no-op — found while docker-testing a broken-data-file
  500 and seeing nothing in `docker logs`.
