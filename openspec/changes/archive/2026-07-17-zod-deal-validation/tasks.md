## 1. Dependency

- [x] 1.1 Add `zod` as a runtime dependency

## 2. Schema and type

- [x] 2.1 Define `DealSchema` in `src/core/deal.ts`: `.strict()` object with `title`/`venue`/`discount`/`location` as trimmed non-empty strings and `days` as `z.array(z.enum(DAYS)).nonempty()`, with friendly custom messages
- [x] 2.2 Export `DealsSchema` (array of `DealSchema`) and replace the hand-written `Deal` interface with `type Deal = z.infer<typeof DealSchema>`
- [x] 2.3 Keep `DAYS`/`Day` as the single canonical day list, reused by `z.enum`

## 3. Loader

- [x] 3.1 In `src/core/deals.ts`, keep `readFileSync` + `JSON.parse` (with the existing clear parse-error handling)
- [x] 3.2 Validate the parsed value with `DealsSchema.safeParse`
- [x] 3.3 Add a helper that formats one `ZodIssue` as `index N ("title") → "field": message`, using the parsed JSON to look up the title
- [x] 3.4 On failure, throw a single error listing every issue (one per line); on success, return `result.data`
- [x] 3.5 Remove the now-unused hand-rolled validation (`validateDeal`, `describeDeal`, `typeName`, `REQUIRED_TEXT_FIELDS`)

## 4. Tests

- [x] 4.1 Update existing tests to the new error wording (assert on substrings, not whole strings)
- [x] 4.2 Test: a deal with an unknown/mis-typed field aborts with an error naming that field
- [x] 4.3 Test: a file with multiple invalid deals/fields reports every problem in one error
- [x] 4.4 Confirm unchanged behaviour still holds: valid deals returned in full, empty catalogue returns `[]`, missing field aborts, invalid day aborts, malformed JSON aborts
- [x] 4.5 Add a fixture with several distinct errors for the multi-error test

## 5. Verify

- [x] 5.1 `npm run typecheck` and `npm test` both pass
