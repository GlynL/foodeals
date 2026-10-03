# One surface-free core, many thin surfaces

The CLI, the HTTP API and the planned web app are front doors onto one core, not three apps. The core owns the deal model and load/validate/list logic and imports nothing from any surface; surfaces call it unchanged and add only transport concerns (argument parsing, status codes, output formatting). We chose this so each new surface is cheap: bundling load logic into the first surface would have meant extracting or re-implementing it for the second. The boundary is enforced by the `import-x/no-restricted-paths` ESLint rule.
