import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

test('documentation workflows do not write to the retired docs repository', async () => {
  const directory = new URL('../../.github/workflows/', import.meta.url);
  const workflows = (await readdir(directory)).filter((name) => /\.ya?ml$/.test(name));

  for (const name of workflows) {
    const workflow = await readFile(new URL(name, directory), 'utf8');
    assert.doesNotMatch(workflow, /repository:\s*ilokesto\/docs\b/, name);
    assert.doesNotMatch(workflow, /uses:\s*\.\/\.github\/workflows\/_sync-docs\.yml/, name);
  }
});
