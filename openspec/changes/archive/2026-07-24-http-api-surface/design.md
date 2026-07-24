## Context

foodeals is core + a CLI today; both run once and exit. `docs/deployment.md`
already documents a deployment pattern (Docker + Traefik + GitHub Actions) but
explicitly parks it pending an HTTP surface that stays up and listens on a
port — it even names the expected entry point (`dist/http/index.js`, port
`3000`) and the `PORT` env var. This design fills that gap: a new surface
alongside the CLI, importing the core unchanged.

## Goals / Non-Goals

**Goals:**
- Expose the existing catalogue over HTTP without touching `src/core/`.
- Match the entry point, port, and env var already assumed by
  `docs/deployment.md`.
- Fail the same way the CLI does: any core throw is a loud, generic failure —
  here, a `500`.

**Non-Goals:**
- No query/filter parameters on `GET /deals` (day-of-week filtering etc. is a
  separate, later roadmap item).
- No caching of `loadDeals()` — every request re-reads and re-validates
  `data/deals.json`, same as today, so hand-edits are picked up without a
  restart.
- No write endpoints (`POST`/`PUT`/`DELETE`) — the data source stays
  hand-edited JSON for now.
- No auth, rate limiting, or CORS handling — not needed for a single public
  read route.

## Decisions

**Framework: Fastify.** AGENTS.md currently states "no framework yet" as a
stack fact, but a bare `node:http` server would mean hand-rolling routing,
JSON serialization, and validation wiring for what is about to become the
project's primary discovery surface (roadmap: HTTP now, web later, more
filtering to come). Fastify's built-in JSON-Schema-based validation and
serialization pairs directly with the project's existing zod schemas via
`fastify-type-provider-zod`, at low overhead. This updates the "no framework
yet" stack fact in AGENTS.md as part of this change.

**zod → Fastify bridge: `fastify-type-provider-zod`.** Lets `DealsSchema`
be passed directly as a route's response schema, giving Fastify's
fast-json-stringify serializer the shape and giving the route accurate
TypeScript types. This is *not* revalidation — `loadDeals()` already validates
on load via zod; the response schema only describes shape for serialization
and typing.

**Routes: `GET /deals` and `GET /health`.**
- `GET /deals` calls `listDeals()` unchanged and returns the array, shaped by
  `DealsSchema`.
- `GET /health` is a static liveness check (no dependency on the data file),
  useful for manual checks and any future orchestration, even though the
  current Traefik setup in `docs/deployment.md` doesn't probe one yet.

**Error mapping: throw → 500 + generic JSON body.** `loadDeals()`'s only
failure mode is "the whole data file is bad" (unreadable, invalid JSON, or
fails validation) — an operator/data problem, not a client error. This mirrors
the CLI's existing treatment (print the message, exit non-zero): here, log
server-side and respond `500 {"error": "..."}` without leaking the detailed
multi-line validation message to the client.

**No caching.** Re-reading per request keeps behaviour identical to the CLI's
single read, just invoked repeatedly, and preserves "hand-edited JSON is the
live source of truth" — an edit takes effect on the next request with no
restart.

**Port/entry point: `PORT` env var (default 3000), `src/http/index.ts` →
`dist/http/index.js`.** These are not free choices — `docs/deployment.md`'s
Dockerfile `EXPOSE`/`CMD` and Traefik label already commit to them.

**Testing: `app.inject()` + a real e2e boot.** `app.inject()` covers both
routes' happy paths and the `listDeals()`-throws → 500 case without opening a
real socket. A separate e2e test boots the actual server process and hits it
over HTTP, mirroring `src/cli/cli.e2e.test.ts`'s pattern of exercising the real
entry point.

## Risks / Trade-offs

- **Fastify is a new dependency** on a project that had none beyond zod →
  Mitigation: scoped to `src/http/`; core and CLI are unaffected, so the
  import boundary still holds and this can be swapped later without touching
  either.
- **Re-reading the file every request** is wasteful at scale → Mitigation:
  acceptable at foodeals' current size (a hand-edited JSON file); revisit if
  the catalogue or request volume grows.
- **Generic 500 body hides the specific validation error from clients** →
  Mitigation: intentional (avoids leaking internal file paths/schema detail
  over HTTP); the detailed message is still available server-side via logs.
