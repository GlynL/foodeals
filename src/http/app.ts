import Fastify from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import { DaySchema, DealsSchema } from '../core/deal.js';
import { listDeals } from '../core/deals.js';

export function buildApp() {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.get(
    '/deals',
    {
      schema: {
        querystring: z.object({ day: DaySchema.optional() }),
        response: { 200: DealsSchema },
      },
    },
    async (request) => listDeals(request.query.day),
  );

  app.setErrorHandler((error, _request, reply) => {
    // A bad `day` query value: report it to the client, not as a server error.
    if (hasZodFastifySchemaValidationErrors(error)) {
      reply.status(400).send({ error: error.validation.map((issue) => issue.message).join(', ') });
      return;
    }

    // listDeals() throws a single, detailed message on any bad-data problem
    // (unreadable file, invalid JSON, failed validation) — an ops issue, not a
    // client one, so respond generically rather than leaking file paths/schema detail.
    app.log.error(error);
    reply.status(500).send({ error: 'Internal server error' });
  });

  return app;
}
