import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPublishedStoreCounter } from '../lib/published-store.ts';
import { Store } from '../../../docs-publication/snapshots/store/1.1.2/package/dist/index.js';
import { scopeStoreNextLink, getStoreDocsChannel, storePilotEnabled, publishedStore } from '../lib/store-publication.ts';

test('the live published counter factory constructs the frozen npm Store', () => {
  const counter = createPublishedStoreCounter();
  assert.equal(counter.constructor, Store);
  assert.equal(publishedStore.version, '1.1.2');
  const sentinel = new Error('published listener failure');
  let secondListenerRan = false;
  counter.subscribe(() => { throw sentinel; });
  counter.subscribe(() => { secondListenerRan = true; });
  assert.throws(() => counter.setState({ count: 1 }), error => error === sentinel);
  assert.equal(secondListenerRan, false);
});

test('development links stay scoped without rewriting external destinations', () => {
  assert.equal(scopeStoreNextLink('/en/store/quick-start#install'), '/en/store/next/quick-start#install');
  assert.equal(scopeStoreNextLink('/ko/store?x=1'), '/ko/store/next?x=1');
  assert.equal(scopeStoreNextLink('/en/store/next/reference/store'), '/en/store/next/reference/store');
  assert.equal(scopeStoreNextLink('https://example.com/en/store'), 'https://example.com/en/store');
  assert.equal(scopeStoreNextLink('../reference/store'), '../reference/store');
  assert.equal(getStoreDocsChannel(['store']), storePilotEnabled ? 'released' : undefined);
  assert.equal(getStoreDocsChannel(['store', 'next']), storePilotEnabled ? 'next' : undefined);
});
