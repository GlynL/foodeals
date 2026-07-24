import { execFileSync } from 'node:child_process';
import { type ChildProcess, spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = 3999;

describe('foodeals HTTP server', () => {
  let server: ChildProcess;

  beforeAll(async () => {
    execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });

    server = spawn('node', ['dist/http/index.js'], {
      cwd: root,
      env: { ...process.env, PORT: String(port) },
      stdio: 'ignore',
    });

    await waitForServer();
  }, 60_000);

  afterAll(() => {
    server.kill();
  });

  async function waitForServer(): Promise<void> {
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) return;
      } catch {
        // server not listening yet
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('server did not start in time');
  }

  it('serves the catalogue over GET /deals', async () => {
    const response = await fetch(`http://localhost:${port}/deals`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('serves GET /health', async () => {
    const response = await fetch(`http://localhost:${port}/health`);

    expect(response.status).toBe(200);
  });
});
