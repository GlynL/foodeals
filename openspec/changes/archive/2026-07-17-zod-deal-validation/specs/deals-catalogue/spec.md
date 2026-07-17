## MODIFIED Requirements

### Requirement: Strict validation rejects loudly

When loading deals, the system SHALL validate the file strictly and abort loudly with a clear error if any deal is malformed. It SHALL NOT silently skip or drop invalid entries.

A deal SHALL contain exactly the recognised fields (`title`, `venue`, `discount`, `location`, `days`) and no others; any unknown or mis-typed field SHALL be rejected. When more than one problem is present, the system SHALL report every problem together in a single error rather than only the first. Each reported problem SHALL be located clearly enough for the operator to fix it, identifying the offending deal (by index, and by title where available) and the field concerned.

#### Scenario: Missing required field aborts the load

- **WHEN** deals are listed and any deal is missing a required field (for example, `venue`)
- **THEN** loading aborts with a clear error identifying the offending deal and the missing field
- **AND** no deals are returned

#### Scenario: Invalid day name aborts the load

- **WHEN** deals are listed and any deal's `days` list contains an unrecognised day name
- **THEN** loading aborts with a clear error identifying the offending deal and the invalid day
- **AND** no deals are returned

#### Scenario: Unknown field aborts the load

- **WHEN** deals are listed and any deal contains a field that is not one of `title`, `venue`, `discount`, `location`, `days` (for example a mis-typed `titel`)
- **THEN** loading aborts with a clear error identifying the offending deal and the unknown field
- **AND** no deals are returned

#### Scenario: All problems are reported together

- **WHEN** deals are listed and the file contains more than one invalid deal or field
- **THEN** loading aborts with a single error listing every problem, each located by deal index (and title where available) and the field concerned
- **AND** no deals are returned

#### Scenario: Malformed JSON aborts the load

- **WHEN** deals are listed and `data/deals.json` is not valid JSON
- **THEN** loading aborts with a clear error describing the parse failure
- **AND** no deals are returned
