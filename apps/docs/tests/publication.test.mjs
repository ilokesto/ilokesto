import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveInstalledPackage } from '../../../scripts/docs-runtime.mjs';
import { scopeDevelopmentLink, getDocsChannel, publishedPackages } from '../lib/publication.ts';

test('the selected npm Store executes its published aggregate-delivery contract', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const installed = await resolveInstalledPackage('@ilokesto/released-store', path.join(root, 'docs-publication/runtime'));
  assert.equal(installed.manifest.version, publishedPackages.store.version);
  assert.ok(!installed.directory.startsWith(path.join(root, 'packages')));
  const { Store } = await import(pathToFileURL(path.join(installed.directory, 'dist/index.js')).href);
  const counter = new Store({ count: 0 });
  const sentinel = new Error('published listener failure');
  let secondListenerRan = false;
  counter.subscribe(() => { throw sentinel; });
  counter.subscribe(() => { secondListenerRan = true; });
  assert.throws(() => counter.setState({ count: 1 }),
    error => error instanceof AggregateError && error.errors.includes(sentinel));
  assert.equal(secondListenerRan, true);
});

test('the selected npm State restores and saves through its explicit persist lifecycle', async (t) => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const installed = await resolveInstalledPackage('@ilokesto/released-state', path.join(root, 'docs-publication/runtime'));
  assert.equal(installed.manifest.version, publishedPackages.state.version);
  assert.ok(!installed.directory.startsWith(path.join(root, 'packages')));
  const { dispose, persist } = await import(pathToFileURL(path.join(installed.directory, 'dist/middleware/index.js')).href);
  const { pipe } = await import(pathToFileURL(path.join(installed.directory, 'dist/utils/index.js')).href);
  const records = new Map([['counter', { state: 7, version: 0 }]]);
  let reads = 0;
  const store = pipe.use(persist({
    key: 'counter',
    storage: () => ({
      getItem: async (key) => { reads++; return records.get(key) ?? null; },
      setItem: async (key, value) => { records.set(key, value); },
      removeItem: async (key) => { records.delete(key); },
    }),
    decode: (value) => typeof value === 'number' ? value : null,
  })).create(0);
  t.after(() => dispose(store));
  assert.equal(reads, 0);
  assert.equal(store.persist.getStatus().hydration, 'idle');

  await store.persist.rehydrate();
  assert.equal(store.getState(), 7);
  assert.equal(reads, 1);
  store.setState(8);
  await store.persist.flush();

  assert.deepEqual(records.get('counter'), { state: 8, version: 0 });
  assert.equal(store.persist.getStatus().pending, false);
  await store.persist.clearStorage();
  assert.equal(records.has('counter'), false);
  assert.equal(store.getState(), 8);
});

test('development links stay scoped without rewriting external destinations', () => {
  for (const name of Object.keys(publishedPackages)) {
    assert.equal(scopeDevelopmentLink(`/en/${name}/quick-start#install`), `/en/${name}/next/quick-start#install`);
    assert.equal(scopeDevelopmentLink(`/ko/${name}?x=1`), `/ko/${name}/next?x=1`);
    assert.equal(scopeDevelopmentLink(`/en/${name}/next/quick-start`), `/en/${name}/next/quick-start`);
    assert.equal(getDocsChannel([name]), 'released');
    assert.equal(getDocsChannel([name, 'next']), 'next');
  }
  assert.equal(scopeDevelopmentLink('https://example.com/en/store'), 'https://example.com/en/store');
  assert.equal(scopeDevelopmentLink('../reference/store'), '../reference/store');
  assert.equal(scopeDevelopmentLink('/en/unknown'), '/en/unknown');
});
