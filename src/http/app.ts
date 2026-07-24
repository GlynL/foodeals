import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { DealsSchema } from '../core/deal.js';
import { listDeals } from '../core/deals.js';

export function buildApp() {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.get('/deals', { schema: { response: { 200: DealsSchema } } }, async () => listDeals());

  // listDeals() throws a single, detailed message on any bad-data problem
  // (unreadable file, invalid JSON, failed validation) — an ops issue, not a
  // client one, so respond generically rather than leaking file paths/schema detail.
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.status(500).send({ error: 'Internal server error' });
  });

  return app;
}
