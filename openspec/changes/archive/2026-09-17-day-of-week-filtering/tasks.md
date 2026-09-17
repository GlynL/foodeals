# Tasks

## 1. Core: day filtering

- [x] 1.1 Export `DaySchema` from `src/core/deal.ts`, factored out of the inline day-enum validator currently on the `days` field, and use it there so existing behaviour is unchanged; verify existing deal-validation tests still pass (`npm test`)
- [x] 1.2 Add `listDeals(day?: Day): Deal[]` to `src/core/deals.ts`, filtering the loaded deals to those where `deal.days.includes(day)` when `day` is given
- [x] 1.3 Add unit tests in `src/core/deals.test.ts`: `listDeals()` stays unfiltered, `listDeals('Wed')` narrows to matching deals from `data/deals.json`, a valid day with no matches returns `[]`, and `DaySchema` rejects an unrecognised value — verify via `npm test`

## 2. CLI: `--day` flag

- [x] 2.1 Change `run`'s signature (`src/cli/index.ts`) to accept `argv: string[]` alongside `CliIo`; update `CliIo.list` to `(day?: Day) => Deal[]`
- [x] 2.2 Parse `--day <value>` from `argv`; validate it with `DaySchema`; on failure write a clear message to `err` and return a non-zero code without calling `list`; on success call `list(day)`
- [x] 2.3 Update the direct-invocation entry point to pass `process.argv.slice(2)` through to `run`
- [x] 2.4 Add tests in `src/cli/index.test.ts`: `--day Wed` passes the day through and narrows output; `--day Funday` writes an error to `err`, writes nothing to `out`, returns non-zero, and `list` is not called; an omitted flag keeps the existing unfiltered behaviour — verify via `npm test`
- [x] 2.5 Update `src/cli/cli.e2e.test.ts` to cover `--day` against the built CLI and real `data/deals.json`, for both a valid and an invalid day — verify via `npm run test:e2e`

## 3. HTTP: `?day=` query parameter

- [x] 3.1 Add a Zod querystring schema `{ day: DaySchema.optional() }` to `GET /deals` in `src/http/app.ts`; update the handler to call `listDeals(request.query.day)`
- [x] 3.2 Fix `setErrorHandler` to check `hasZodFastifySchemaValidationErrors(error)` (from `fastify-type-provider-zod`) first and respond `400` with the validation message, falling through to the existing generic `500` + `app.log.error` path for every other error
- [x] 3.3 Add tests in `src/http/app.test.ts`: `?day=Wed` narrows the JSON body; `?day=Funday` returns `400` with a JSON body describing the invalid value and confirms `listDeals` is not called; an omitted `day` keeps the existing unfiltered `200` behaviour; the existing 500-on-core-throw test still passes — verify via `npm test`
- [x] 3.4 Update `src/http/http.e2e.test.ts` to cover `?day=` against the real running app, for both a valid and an invalid day — verify via `npm run test:e2e`

## 4. Wrap-up

- [x] 4.1 Run `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, and `npm run test:e2e`, and confirm all pass
- [x] 4.2 Move "Day-of-week filtering" from `ROADMAP.md`'s "Later" section to "Done", summarising what shipped
