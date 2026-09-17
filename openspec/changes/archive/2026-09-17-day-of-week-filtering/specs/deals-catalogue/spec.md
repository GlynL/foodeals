# Spec Delta

## MODIFIED Requirements

### Requirement: List all deals

The system SHALL provide the ability to load `data/deals.json` and return deals.
When no day filter is given, every deal is returned in file order, with no
filtering, sorting, or searching applied. When a day filter is given, only deals
whose `days` list includes that day are returned. A day filter SHALL be one of the
recognised day names; an unrecognised value SHALL be rejected with a clear error,
with no deals returned, rather than treated as no match.

#### Scenario: Return every deal

- **WHEN** deals are listed with no day filter and `data/deals.json` contains three valid deals
- **THEN** all three deals are returned, each with its `title`, `venue`, `discount`, `location`, and `days`

#### Scenario: Empty catalogue

- **WHEN** deals are listed and `data/deals.json` contains no deals
- **THEN** an empty result is returned and no error is raised

#### Scenario: Days do not filter results

- **WHEN** deals are listed with no day filter and the catalogue contains deals valid on different days
- **THEN** deals for every day are returned regardless of the current day

#### Scenario: Filtering by day narrows the result

- **WHEN** deals are listed with a day filter of `Wed` and the catalogue contains deals valid on different days
- **THEN** only deals whose `days` list includes `Wed` are returned

#### Scenario: A day with no matching deals returns an empty result

- **WHEN** deals are listed with a day filter that is a recognised day name but no deal is valid on it
- **THEN** an empty result is returned and no error is raised

#### Scenario: An unrecognised day filter is rejected

- **WHEN** deals are listed with a day filter that is not one of the recognised day names
- **THEN** a clear error identifying the invalid value is raised
- **AND** no deals are returned
