import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // e2e specs build and spawn the binary; run them with `npm run test:e2e`.
    exclude: [...configDefaults.exclude, '**/*.e2e.test.ts'],
  },
});
