# http-api Specification

## Purpose

Define the HTTP surface for the food-deals catalogue: a Fastify-based server
exposing the catalogue over `GET /deals` by calling the core's `listDeals()`
unchanged, plus a dependency-free `GET /health` liveness check. The surface
adds no filtering, parsing, or reshaping of its own; it is a thin layer over
the core, and it maps any load failure to a generic `500` response rather than
leaking internal detail.

## Requirements

### Requirement: List deals over HTTP

The HTTP surface SHALL expose a `GET /deals` route that calls the core's
`listDeals()` unchanged and returns the result as a JSON array shaped by the
existing deal schema. The route SHALL add no filtering, parsing, or
reshaping of its own.

#### Scenario: Deals are returned as JSON

- **WHEN** a client sends `GET /deals` and the catalogue loads successfully
- **THEN** the response has status `200`
- **AND** the response body is a JSON array of deals matching the core's `Deal` shape

### Requirement: Report catalogue load failures as a server error

When `listDeals()` throws (unreadable file, invalid JSON, or failed schema
validation), the HTTP surface SHALL respond with status `500` and a generic
JSON error body. It SHALL NOT expose the detailed internal error message
(file paths, schema issue detail) in the response body.

#### Scenario: A broken data file yields a 500

- **WHEN** a client sends `GET /deals` and `listDeals()` throws
- **THEN** the response has status `500`
- **AND** the response body is a JSON object with a generic error message
- **AND** the response body does not contain the underlying file path or validation detail

### Requirement: Liveness check

The HTTP surface SHALL expose a `GET /health` route that responds
successfully without depending on the deals data file, so it can confirm the
process is up independently of data validity.

#### Scenario: Health check succeeds regardless of data state

- **WHEN** a client sends `GET /health`
- **THEN** the response has status `200`
- **AND** the response does not read or validate `data/deals.json`

### Requirement: Listen on a configurable port

The HTTP surface SHALL listen on the port given by the `PORT` environment
variable, defaulting to `3000` when unset.

#### Scenario: Default port

- **WHEN** the HTTP surface starts with no `PORT` environment variable set
- **THEN** it listens on port `3000`

#### Scenario: Configured port

- **WHEN** the HTTP surface starts with `PORT` set to a value
- **THEN** it listens on that port instead of the default

### Requirement: Filter deals by day via query parameter

The HTTP surface SHALL accept an optional `day` query parameter on `GET /deals`.
When given a recognised day name, the response body SHALL contain only deals valid
on that day. When the parameter is omitted, the existing unfiltered behaviour
applies.

#### Scenario: The day query parameter narrows the response

- **WHEN** a client sends `GET /deals?day=Wed` and the catalogue loads successfully
- **THEN** the response has status `200`
- **AND** the response body contains only deals whose `days` list includes `Wed`

#### Scenario: Omitting the day parameter keeps the full catalogue

- **WHEN** a client sends `GET /deals` with no `day` parameter
- **THEN** the response body contains every deal the core returns, unfiltered

### Requirement: An invalid day query value is rejected

The HTTP surface SHALL validate the `day` query parameter before calling the core.
When present but not a recognised day name, the surface SHALL respond `400` with a
JSON body describing the invalid value, distinct from the existing generic `500`
used for catalogue load failures, and SHALL NOT call the core's list operation.

#### Scenario: An unrecognised day value yields a 400

- **WHEN** a client sends `GET /deals?day=Funday`
- **THEN** the response has status `400`
- **AND** the response body is a JSON object describing the invalid value
- **AND** the core's list operation is not called
</content>
