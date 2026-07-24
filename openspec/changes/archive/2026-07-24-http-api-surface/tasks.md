## 1. Dependencies

- [x] 1.1 Add `fastify` and `fastify-type-provider-zod` to `package.json`

## 2. HTTP surface

- [x] 2.1 Create `src/http/app.ts`: build a Fastify instance with the zod type
      provider configured, register `GET /health` and `GET /deals`
- [x] 2.2 `GET /deals` calls `listDeals()` from the core and returns the
      result, with a response schema built from `DealsSchema`
- [x] 2.3 `GET /health` returns `200` with no dependency on the data file
- [x] 2.4 Add an error handler that maps any thrown error to `500` with a
      generic JSON body (e.g. `{"error": "..."}`), without leaking the
      detailed message
- [x] 2.5 Create `src/http/index.ts`: entry point that reads `PORT` from
      env (default `3000`) and starts the app from `src/http/app.ts`

## 3. Build & scripts

- [x] 3.1 Confirm `tsconfig.build.json` includes `src/http/` in its build
      output (so `dist/http/index.js` exists after `npm run build`)
- [x] 3.2 Add/update `package.json` scripts so the HTTP surface can be run
      (e.g. a `start` or `serve` script running `node dist/http/index.js`)

## 4. Tests

- [x] 4.1 Unit test `GET /deals` happy path via `app.inject()`
- [x] 4.2 Unit test `GET /deals` → `500` when `listDeals()` throws, asserting
      the generic body and that no internal detail leaks
- [x] 4.3 Unit test `GET /health` returns `200`
- [x] 4.4 e2e test that boots the real server process and hits `GET /deals`
      and `GET /health` over HTTP, mirroring `src/cli/cli.e2e.test.ts`

## 5. Docs

- [x] 5.1 Update `AGENTS.md`: replace the "No framework yet" stack fact and
      note the HTTP surface alongside the CLI in the architecture section
- [x] 5.2 Update `ROADMAP.md`: move "HTTP API surface (B)" from Next to Done
