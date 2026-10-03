# The catalogue is a hand-edited JSON file, read on every load

The catalogue lives in `data/deals.json`, a top-level array the operator edits by hand; there is no database and no write API. Every load re-reads and re-validates the file, with no caching, so an edit takes effect on the next CLI run or HTTP request without a restart.

## Considered Options

- **YAML**: friendlier to hand-edit, but adds a dependency. JSON's fussiness (commas, quoting) is mitigated by strict validation with clear errors.
- **Caching the parsed catalogue in the HTTP server**: rejected while the file is small; it would break "edit the file, see the change". Revisit if the catalogue or traffic grows.
- **A database or write endpoints**: deferred until a surface needs to write deals.
