# Validation is all-or-nothing and reports every problem

If any deal in the catalogue is malformed, loading fails outright: no deals are returned, and invalid entries are never skipped. The error lists every problem at once, each located by deal index (and title where available) and field, and unknown fields are rejected so a mis-typed `titel` can't be silently ignored. Because the file is hand-edited, a loud, complete error is the operator's only feedback; skipping bad deals would hide typos and serve a partial catalogue.

## Consequences

One bad deal takes the whole catalogue down: the CLI exits non-zero and the HTTP API returns `500` for `GET /deals`. That is deliberate; don't "fix" it by filtering out bad entries.
