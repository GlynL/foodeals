import { buildApp, resolvePort } from './app.js';

const port = resolvePort(process.env);

buildApp()
  .listen({ port, host: '0.0.0.0' })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
