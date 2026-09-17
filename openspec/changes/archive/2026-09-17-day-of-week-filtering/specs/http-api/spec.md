# Spec Delta

## ADDED Requirements

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
