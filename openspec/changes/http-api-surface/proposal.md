## Why

foodeals is currently core + a CLI; both run and exit. The planned deployment
pattern (see `docs/deployment.md`) needs a container that stays up and listens
on a port, so foodeals cannot be deployed until it has an HTTP surface. This is
the "HTTP API surface (B)" item on the roadmap and the last piece blocking
deployment.

## What Changes

- Add a Fastify-based HTTP surface at `src/http/`, building to `dist/http/index.js`.
- Add `GET /deals`, returning the catalogue from the core's `listDeals()`
  unchanged, shaped by the existing `DealsSchema`/`Deal` types via
  `fastify-type-provider-zod`.
- Add `GET /health`, a dependency-free liveness check.
- Map any throw from `listDeals()` (unreadable file, invalid JSON, failed
  validation) to a `500` response with a generic JSON error body.
- Listen on the `PORT` env var (default `3000`), matching `.env.example`, the
  Dockerfile `EXPOSE`, and the Traefik label documented in `docs/deployment.md`.
- Update build/package scripts so `dist/http/index.js` is a valid, runnable
  entry point.

## Capabilities

### New Capabilities
- `http-api`: HTTP surface exposing the deals catalogue over `GET /deals` and
  a liveness check over `GET /health`, reusing the core's `listDeals()`
  unchanged.

### Modified Capabilities
- none — `deals-catalogue` and `cli` behaviour are unchanged; this only adds a
  new surface on top of the existing core.

## Impact

- New code: `src/http/` (Fastify app, entry point), corresponding tests.
- New dependencies: `fastify`, `fastify-type-provider-zod`.
- Build: `package.json` scripts and `tsconfig.build.json` need to produce and
  run `dist/http/index.js`.
- No changes to `src/core/` or `src/cli/`.
- Unblocks `docs/deployment.md`'s deployment pattern, which was explicitly
  waiting on this surface.
