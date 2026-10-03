# Fastify for the HTTP surface, bridged to the zod schemas

The HTTP surface uses Fastify with `fastify-type-provider-zod`, so the core's zod schemas serve directly as route querystring and response schemas. A bare `node:http` server would mean hand-rolling routing, validation and serialisation for what is becoming the main discovery surface. Fastify is confined to `src/http/`, so the core and CLI don't depend on it.
