import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('foodeals built binary', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  }, 60_000);

  it('prints the catalogue and exits 0 (4.3)', () => {
    // execFileSync throws on a non-zero exit, so reaching the assertions proves exit 0.
    const output = execFileSync('node', ['dist/cli/index.js'], { cwd: root, encoding: 'utf8' });

    expect(output).toMatch(/\d+ deals?/);
    expect(output).toContain('https');
  });
});
