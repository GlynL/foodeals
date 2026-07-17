# deals-catalogue Specification

## Purpose

Define the deal data model and the core load/validate/list behaviour for the
curated food-deals catalogue. Deals are held in a single hand-edited JSON file
that is treated as the sole source of truth, loaded strictly, and returned in
full to callers.

## Requirements

### Requirement: Deal data model

A deal SHALL consist of the following fields, all of which are required:

- `title`: free text naming the deal (e.g. "2-for-1 burgers").
- `venue`: free text naming the place offering the deal (e.g. "The Grill House").
- `discount`: free text describing the offer (e.g. "50% off mains", "2-for-1"). This field SHALL NOT be structured, because discounts share no common shape.
- `location`: a Google Maps URL for the venue.
- `days`: a non-empty list of days-of-week on which the deal is valid. Each entry SHALL be one of the recognised day names. Deals are recurring by day-of-week; they do not carry start or end dates.

#### Scenario: A fully specified deal is valid

- **WHEN** a deal has a non-empty `title`, `venue`, `discount`, and `location`, and a non-empty `days` list where every entry is a recognised day name
- **THEN** the deal is considered valid

#### Scenario: Days are recurring, not date-bound

- **WHEN** a deal specifies `days` of `[Mon, Wed, Fri]`
- **THEN** the deal is understood to recur on those days with no expiry date

### Requirement: Deals are stored in a hand-edited JSON file

The system SHALL treat a single JSON file at `data/deals.json` as the sole source of truth for deals. Deals SHALL be added, removed, or edited by hand-editing this file; no programmatic write behaviour is provided in this version.

#### Scenario: The file is the source of truth

- **WHEN** the operator edits `data/deals.json` to add or remove a deal
- **THEN** the change takes effect the next time deals are loaded, with no other step required

### Requirement: List all deals

The system SHALL provide the ability to load `data/deals.json` and return every deal it contains. No filtering, sorting, or searching is applied; all deals are returned. The `days` field SHALL be loaded and returned but SHALL NOT be used to filter results in this version.

#### Scenario: Return every deal

- **WHEN** deals are listed and `data/deals.json` contains three valid deals
- **THEN** all three deals are returned, each with its `title`, `venue`, `discount`, `location`, and `days`

#### Scenario: Empty catalogue

- **WHEN** deals are listed and `data/deals.json` contains no deals
- **THEN** an empty result is returned and no error is raised

#### Scenario: Days do not filter results

- **WHEN** deals are listed and the catalogue contains deals valid on different days
- **THEN** deals for every day are returned regardless of the current day

### Requirement: Strict validation rejects loudly

When loading deals, the system SHALL validate the file strictly and abort loudly with a clear error if any deal is malformed. It SHALL NOT silently skip or drop invalid entries. The error SHALL identify the problem clearly enough for the operator to locate and fix the offending entry.

#### Scenario: Missing required field aborts the load

- **WHEN** deals are listed and any deal is missing a required field (for example, `venue`)
- **THEN** loading aborts with a clear error identifying the missing field
- **AND** no deals are returned

#### Scenario: Invalid day name aborts the load

- **WHEN** deals are listed and any deal's `days` list contains an unrecognised day name
- **THEN** loading aborts with a clear error identifying the invalid day
- **AND** no deals are returned

#### Scenario: Malformed JSON aborts the load

- **WHEN** deals are listed and `data/deals.json` is not valid JSON
- **THEN** loading aborts with a clear error describing the parse failure
- **AND** no deals are returned
