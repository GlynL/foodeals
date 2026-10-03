import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('foodeals built binary', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  }, 60_000);

  it('prints the catalogue and exits 0', () => {
    // execFileSync throws on a non-zero exit, so reaching the assertions proves exit 0.
    const output = execFileSync('node', ['dist/cli/index.js'], { cwd: root, encoding: 'utf8' });

    expect(output).toMatch(/\d+ deals?/);
    expect(output).toContain('https');
  });

  it('narrows the catalogue with --day', () => {
    const output = execFileSync('node', ['dist/cli/index.js', '--day', 'Wed'], {
      cwd: root,
      encoding: 'utf8',
    });

    // Runs against the live catalogue, so check every printed deal's days line
    // (third line of each block, after the count header) rather than titles.
    const blocks = output.trim().split('\n\n').slice(1);
    expect(blocks.every((block) => block.split('\n')[2]?.includes('Wed'))).toBe(true);
  });

  it('fails loudly on an unrecognised --day value', () => {
    expect(() =>
      execFileSync('node', ['dist/cli/index.js', '--day', 'Funday'], {
        cwd: root,
        encoding: 'utf8',
      }),
    ).toThrow();
  });
});
