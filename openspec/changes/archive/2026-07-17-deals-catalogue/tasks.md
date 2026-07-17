## 1. Project setup

- [x] 1.1 Initialise a TypeScript/Node project (`package.json`, `tsconfig.json`) with a test runner
- [x] 1.2 Create the source layout separating the core module from any future surface

## 2. Deal model

- [x] 2.1 Define the `Deal` type: `title`, `venue`, `discount`, `location`, `days`
- [x] 2.2 Define the recognised day-name set and settle the casing/spelling convention (per design open question)

## 3. Load and list

- [x] 3.1 Implement reading `data/deals.json` from disk
- [x] 3.2 Parse the file with the built-in `JSON.parse`, surfacing parse failures as clear errors
- [x] 3.3 Implement `listDeals()` returning every parsed deal (no filtering/sorting)
- [x] 3.4 Return an empty result (no error) when the file contains no deals

## 4. Strict validation

- [x] 4.1 Validate that every deal has all five fields present and non-empty
- [x] 4.2 Validate that `days` is a non-empty list and every entry is a recognised day name
- [x] 4.3 On the first violation, throw a clear error identifying the offending deal (index/title) and the specific problem; return no deals
- [x] 4.4 Ensure malformed JSON aborts loudly with a descriptive parse error

## 5. Seed data

- [x] 5.1 Create `data/deals.json` with a few example deals covering different days

## 6. Tests

- [x] 6.1 Test: a file with valid deals returns them all with every field
- [x] 6.2 Test: an empty catalogue returns an empty result without error
- [x] 6.3 Test: a missing required field aborts with a clear error
- [x] 6.4 Test: an invalid day name aborts with a clear error
- [x] 6.5 Test: malformed JSON aborts with a clear parse error
- [x] 6.6 Test: deals for all days are returned regardless of current day (days do not filter)
