# Spec Delta

## ADDED Requirements

### Requirement: Filter output by day

The CLI SHALL accept an optional `--day <name>` flag. When given a recognised day
name, the CLI SHALL obtain and print only deals valid on that day, by passing the
day to the core's list operation. When the flag is omitted, the CLI's existing
unfiltered behaviour applies.

#### Scenario: The day flag narrows the output

- **WHEN** the CLI is run with `--day Wed` and the catalogue contains deals valid on different days
- **THEN** only deals valid on `Wed` are printed, under a header stating how many there are

#### Scenario: Omitting the day flag keeps the full catalogue

- **WHEN** the CLI is run with no `--day` flag
- **THEN** every deal the core returns is printed, unfiltered

### Requirement: An invalid day flag fails loudly

The CLI SHALL validate `--day`'s value itself, before calling the core. When the
value is not a recognised day name, or the flag is given with no value following
it, the CLI SHALL write a clear error to standard error, write no deal output to
standard output, and exit with a non-zero status, without calling the core's list
operation.

#### Scenario: An unrecognised day value aborts without calling the core

- **WHEN** the CLI is run with `--day Funday`
- **THEN** a clear error naming the invalid value is written to standard error
- **AND** no deal output is written to standard output
- **AND** the command exits with a non-zero status
- **AND** the core's list operation is not called

#### Scenario: A day flag with no value aborts without calling the core

- **WHEN** the CLI is run with `--day` and no value following it
- **THEN** a clear error is written to standard error
- **AND** no deal output is written to standard output
- **AND** the command exits with a non-zero status
- **AND** the core's list operation is not called
