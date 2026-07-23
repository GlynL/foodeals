## ADDED Requirements

### Requirement: Print all deals to standard output

The CLI SHALL print every deal returned by the core to standard output as one
block per deal, preceded by a header stating how many deals there are. Each
block SHALL show the deal's `title` and `venue` on a heading line, then its
`discount`, its `days` (comma-separated in list order), and its `location` URL.
On success the CLI SHALL exit with status 0.

#### Scenario: Every deal is printed

- **WHEN** the CLI is run and the catalogue contains deals
- **THEN** each deal's title, venue, discount, days, and location are written to standard output
- **AND** the command exits with status 0

#### Scenario: A count header precedes the deals

- **WHEN** the CLI prints a catalogue of N deals
- **THEN** the output begins with a header stating that there are N deals

### Requirement: Deals come solely from the core

The CLI SHALL obtain deals only by calling the core's list operation; it SHALL
NOT read or parse the data file itself, nor re-validate or reshape deal data. It
SHALL print exactly the deals the core returns, in the order the core returns
them.

#### Scenario: The CLI reflects the core's result

- **WHEN** the core returns a list of deals
- **THEN** the CLI prints exactly those deals, in the order the core returned them, with no additions, removals, or reordering

### Requirement: An empty catalogue is reported, not treated as an error

When the core returns no deals, the CLI SHALL write a clear message stating there
are no deals to standard output and SHALL exit with status 0.

#### Scenario: Empty catalogue

- **WHEN** the CLI is run and the catalogue contains no deals
- **THEN** a clear "no deals" message is written to standard output
- **AND** the command exits with status 0

### Requirement: Load and validation errors fail loudly

The CLI SHALL add no validation of its own. When loading deals through the core
throws (an unreadable file, malformed JSON, or an invalid deal), the CLI SHALL
write the thrown error's message to standard error, write no deal output to
standard output, and exit with a non-zero status. The message reported SHALL be
the core's, not one of the CLI's own devising.

#### Scenario: Invalid data aborts with a non-zero exit

- **WHEN** the CLI is run and loading deals throws (for example, a deal is missing a required field)
- **THEN** the error message is written to standard error
- **AND** no deal output is written to standard output
- **AND** the command exits with a non-zero status

#### Scenario: Malformed JSON fails loudly

- **WHEN** the CLI is run and `data/deals.json` is not valid JSON
- **THEN** the parse error is written to standard error
- **AND** the command exits with a non-zero status

#### Scenario: The reported error is the core's

- **WHEN** loading deals through the core throws
- **THEN** the CLI reports that error's message rather than substituting a message of its own
