import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  PACKAGE_NAMES, RELEASE_COMMIT, adaptInstallations, buildSnapshot, collectExamples, currentManifestHash,
  generatePublication, hash, importSpecifiers, inventory, promotePublication,
  releaseEntry, rewriteExampleImports, tarFiles, validateManifest, verifyDocsRevision,
  verifyPublication, verifySnapshot, writeImmutableSnapshot,
} from '../../scripts/docs-publication.mjs';
import { diskFiles, git, gitText, json } from '../../scripts/docs-publication/io.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const docsCommit = 'fc8bd4755137b75767284dbe84a0774185dfbdde';
const candidate = JSON.parse(await readFile(path.join(rootDir, 'docs-publication/candidate.json'), 'utf8'));

async function fixture(t, { active = true } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'docs-publication-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  // Read-only access to the repository's existing objects, never its working files.
  const gitDir = gitText(rootDir, ['rev-parse', '--absolute-git-dir']);
  await writeFile(path.join(root, '.git'), `gitdir: ${gitDir}\n`);
  await mkdir(path.join(root, 'docs-publication'));
  await cp(path.join(rootDir, 'docs-publication/releases'), path.join(root, 'docs-publication/releases'), { recursive: true });
  await writeFile(path.join(root, 'docs-publication/candidate.json'), json(candidate));
  if (active) await writeFile(path.join(root, 'docs-publication/active.json'), json(candidate));
  return root;
}
async function mutateJson(file, action) {
  const value = JSON.parse(await readFile(file, 'utf8'));
  action(value);
  await writeFile(file, json(value));
}

test('all eight complete immutable snapshots verify against committed sources and exact npm artifacts', async () => {
  const verified = await verifyPublication({ rootDir, manifestPath: 'docs-publication/candidate.json' });
  assert.deepEqual([...verified.snapshots.keys()], PACKAGE_NAMES);
  let mdxCount = 0;
  for (const [name, snapshot] of verified.snapshots) {
    const entry = snapshot.entry;
    assert.equal(entry.docsCommit, candidate.packages[name].docsCommit);
    assert.equal(entry.releaseCommit, RELEASE_COMMIT);
    assert.equal(snapshot.receipt.schemaVersion, 2);
    assert.equal(snapshot.receipt.exampleSource.commit, entry.docsCommit);
    assert.equal(snapshot.receipt.runtimeSource.commit, RELEASE_COMMIT);
    assert.equal(snapshot.receipt.registry.gitHead, null);
    assert.equal(snapshot.receipt.registry.attestations, null);
    assert.equal(snapshot.receipt.provenance.kind, 'operational-evidence-not-cryptographic-source-provenance');
    const tarball = snapshot.files.get('npm/package.tgz');
    const shipped = tarFiles(tarball);
    assert.deepEqual(inventory(shipped), snapshot.receipt.registry.files);
    for (const readme of ['README.md', 'README.ko.md']) assert.deepEqual(shipped.get(readme), snapshot.files.get(`release/${readme}`));
    for (const [file, bytes] of snapshot.files) {
      if (file.startsWith('revision/docs/') && file.endsWith('.mdx')) mdxCount++;
      if (file.startsWith('release/') || file.startsWith('revision/')) {
        const [label, ...suffix] = file.split('/');
        const source = label === 'release' ? RELEASE_COMMIT : entry.docsCommit;
        assert.deepEqual(bytes, git(rootDir, ['show', `${source}:packages/${name}/${suffix.join('/')}`]));
      }
    }
  }
  assert.equal(mdxCount, 338);
});

test('the retained schema 1 archive still verifies with release-commit examples', async () => {
  const receiptBytes = await readFile(path.join(rootDir, 'docs-publication/releases/store/2.0.0/r1/receipt.json'));
  const receipt = JSON.parse(receiptBytes);
  const entry = { ...receipt.package, receiptSha256: hash(receiptBytes) };

  const snapshot = await verifySnapshot({ rootDir, entry });

  assert.equal(snapshot.receipt.schemaVersion, 1);
  assert.equal(snapshot.receipt.exampleSource.commit, RELEASE_COMMIT);
  assert.equal(snapshot.receipt.docsRevision.commit, docsCommit);
});

test('new snapshots freeze revised examples and transitive helpers while retaining released runtime bytes', async (t) => {
  const root = await fixture(t);
  const original = await verifySnapshot({ rootDir: root, entry: candidate.packages.state });
  // An independent object database/index keeps fixture commits out of the repository.
  await rm(path.join(root, '.git'));
  git(root, ['init', '--quiet']);
  const commonDir = gitText(rootDir, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  await writeFile(path.join(root, '.git/objects/info/alternates'), `${commonDir}/objects\n`);
  git(root, ['read-tree', docsCommit]);
  const sourcePath = 'apps/docs/components/demos/state-demo.tsx';
  const helperPath = 'apps/docs/components/demos/revision-helper.ts';
  const leafPath = 'apps/docs/components/demos/revision-leaf.ts';
  const sources = new Map([
    [sourcePath, "import { create } from '@ilokesto/state/react';\nimport { initial } from './revision-helper';\nexport const demo = create(initial);\n"],
    [helperPath, "export { initial } from './revision-leaf';\n"],
    [leafPath, 'export const initial = 7;\n'],
  ]);
  await mkdir(path.dirname(path.join(root, sourcePath)), { recursive: true });
  for (const [file, source] of sources) await writeFile(path.join(root, file), source);
  git(root, ['add', '--', ...sources.keys()]);
  const tree = gitText(root, ['write-tree']);
  const revisionCommit = git(root, ['commit-tree', tree, '-p', docsCommit, '-m', 'Revise example fixture'], {
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Publication Test', GIT_AUTHOR_EMAIL: 'publication@example.test',
      GIT_COMMITTER_NAME: 'Publication Test', GIT_COMMITTER_EMAIL: 'publication@example.test',
      GIT_AUTHOR_DATE: '2026-10-08T00:00:00Z', GIT_COMMITTER_DATE: '2026-10-08T00:00:00Z',
    },
  }).toString().trim();
  verifyDocsRevision({ rootDir: root, releaseCommit: RELEASE_COMMIT, docsCommit: revisionCommit, packageNames: ['state'] });
  for (const file of sources.keys()) await writeFile(path.join(root, file), 'uncommitted source must not be captured');
  const identity = releaseEntry('state', RELEASE_COMMIT, revisionCommit, candidate.packages.state.revision + 1);

  const built = buildSnapshot({
    rootDir: root, entry: identity,
    tarball: original.files.get('npm/package.tgz'),
    report: original.files.get('provenance/release-provenance.md'),
  });

  assert.equal(built.receipt.schemaVersion, 2);
  assert.equal(built.receipt.exampleSource.commit, revisionCommit);
  assert.deepEqual(built.receipt.exampleSource.files.map((file) => file.path), [...sources.keys()].sort());
  for (const [file, source] of sources) assert.equal(built.files.get(`examples/${file}`).toString(), source);
  assert.notDeepEqual(built.files.get(`examples/${sourcePath}`), original.files.get(`examples/${sourcePath}`));
  assert.deepEqual(built.receipt.runtimeSource, original.receipt.runtimeSource);
  assert.deepEqual(built.receipt.releaseSource, original.receipt.releaseSource);
  assert.deepEqual(built.receipt.registry, original.receipt.registry);
  assert.deepEqual(built.files.get('npm/package.tgz'), original.files.get('npm/package.tgz'));

  const entry = { ...identity, receiptSha256: hash(built.files.get('receipt.json')) };
  const base = path.join(root, entry.snapshot);
  await writeImmutableSnapshot(base, built.files);
  const manifest = structuredClone(candidate);
  manifest.packages.state = entry;
  await writeFile(path.join(root, 'docs-publication/active.json'), json(manifest));
  await rm(path.join(root, '.git'), { recursive: true });
  await generatePublication({ rootDir: root });
  const generated = await readFile(path.join(root, 'docs-publication/runtime/.generated/state/state-demo.tsx'), 'utf8');
  assert.deepEqual(importSpecifiers(generated).map((specifier) => specifier.value), [
    '@ilokesto/released-state/react', './_source/apps/docs/components/demos/revision-helper',
  ]);
  assert.equal(await readFile(path.join(root, 'docs-publication/runtime/.generated/state/_source', leafPath), 'utf8'), sources.get(leafPath));

  const receiptPath = path.join(base, 'receipt.json');
  for (const [change, expected] of [
    [(receipt) => { receipt.package.docsCommit = docsCommit; }, /receipt identity/],
    [(receipt) => { receipt.schemaVersion = 3; }, /receipt schema/],
    [(receipt) => { receipt.schemaVersion = 1; }, /example source commit/],
    [(receipt) => { receipt.exampleSource.commit = RELEASE_COMMIT; }, /example source commit/],
    [(receipt) => { receipt.runtimeSource.commit = revisionCommit; }, /runtime source commit/],
    [(receipt) => { receipt.exampleSource.files.pop(); }, /example source inventory/],
    [(receipt) => { receipt.exampleSource.files[0].blob = '0'.repeat(40); }, /example source blob/],
    [(receipt) => { receipt.exampleSource.files[0].mode = '120000'; }, /example source mode/],
  ]) {
    const receipt = structuredClone(built.receipt);
    change(receipt);
    const bytes = Buffer.from(json(receipt));
    await writeFile(receiptPath, bytes);
    await assert.rejects(verifySnapshot({ rootDir: root, entry: { ...entry, receiptSha256: hash(bytes) } }), expected);
  }
  await writeFile(receiptPath, built.files.get('receipt.json'));
  await writeFile(path.join(base, 'examples', leafPath), 'export const initial = 99;\n');
  await assert.rejects(verifySnapshot({ rootDir: root, entry }), /snapshot file inventory/);
  const forged = structuredClone(built.receipt);
  const changedFiles = await diskFiles(base);
  changedFiles.delete('receipt.json');
  forged.files = inventory(changedFiles);
  const forgedBytes = Buffer.from(json(forged));
  await writeFile(receiptPath, forgedBytes);
  await assert.rejects(verifySnapshot({ rootDir: root, entry: { ...entry, receiptSha256: hash(forgedBytes) } }), /example source blob/);
  await writeFile(path.join(base, 'examples', leafPath), sources.get(leafPath));
  await writeFile(receiptPath, built.files.get('receipt.json'));
  await verifySnapshot({ rootDir: root, entry });
});

test('identity validation rejects partial packages, missing fields, bad channels and unsafe paths', () => {
  assert.equal(validateManifest(candidate), candidate);
  for (const change of [
    (manifest) => { delete manifest.packages.toast; },
    (manifest) => { delete manifest.packages.store.docsCommit; },
    (manifest) => { manifest.packages.store.name = '@ilokesto/state'; },
    (manifest) => { manifest.packages.fetcher.channel = 'latest'; },
    (manifest) => { manifest.packages.store.version = '1.1.2'; },
    (manifest) => { manifest.packages.store.snapshot = '../escape'; },
    (manifest) => { manifest.packages.store.revision = 0; },
    (manifest) => { manifest.packages.store.releaseCommit = docsCommit; },
    (manifest) => { manifest.packages.store.extra = true; },
  ]) {
    const changed = structuredClone(candidate);
    change(changed);
    assert.throws(() => validateManifest(changed), /Docs publication:/);
  }
  assert.throws(() => verifyDocsRevision({ rootDir, releaseCommit: RELEASE_COMMIT, docsCommit: 'HEAD' }), /explicit full commit/);
  assert.deepEqual(verifyDocsRevision({ rootDir, releaseCommit: RELEASE_COMMIT, docsCommit }), { releaseCommit: RELEASE_COMMIT, docsCommit });
});

test('verification distinguishes payload mutation, receipt forgery, tarball mutation and extra paths', async (t) => {
  const root = await fixture(t);
  const entry = candidate.packages.store;
  const base = path.join(root, entry.snapshot);
  for (const file of ['revision/docs/index.mdx', 'release/README.md', 'examples/apps/docs/components/demos/store-demo.tsx', 'npm/package.tgz']) {
    const absolute = path.join(base, file);
    const original = await readFile(absolute);
    const changed = Buffer.from(original);
    changed[changed.length - 1] ^= 1;
    await writeFile(absolute, changed);
    await assert.rejects(verifySnapshot({ rootDir: root, entry }), /snapshot file inventory|tarball SRI/);
    await writeFile(absolute, original);
  }
  const receiptPath = path.join(base, 'receipt.json');
  const originalReceipt = await readFile(receiptPath);
  await mutateJson(receiptPath, (receipt) => { receipt.docsRevision.commit = RELEASE_COMMIT; });
  await assert.rejects(verifySnapshot({ rootDir: root, entry }), /snapshot receipt SHA-256/);
  await writeFile(receiptPath, originalReceipt);
  await writeFile(path.join(base, 'extra.txt'), 'not in inventory');
  await assert.rejects(verifySnapshot({ rootDir: root, entry }), /snapshot file inventory/);
  await rm(path.join(base, 'extra.txt'));
  await symlink('release/README.md', path.join(base, 'unexpected-link'));
  await assert.rejects(verifySnapshot({ rootDir: root, entry }), /not a regular file/);
});

test('generation is independent of current working docs/examples and replaces only current output folders', async (t) => {
  const root = await fixture(t);
  await rm(path.join(root, '.git'));
  const historical = path.join(root, 'docs-publication/.generated/store-1.1.2/sentinel');
  await mkdir(path.dirname(historical), { recursive: true });
  await writeFile(historical, 'historical');
  await generatePublication({ rootDir: root });
  const firstDocs = inventory(await diskFiles(path.join(root, 'docs-publication/.generated')));
  const firstExamples = inventory(await diskFiles(path.join(root, 'docs-publication/runtime/.generated')));
  for (const file of ['packages/store/docs/index.mdx', 'apps/docs/components/demos/fetcher-copy.ts', 'apps/docs/components/landings/store-landing.tsx']) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), 'uncommitted current-main mutation');
  }
  await writeFile(path.join(root, 'docs-publication/.generated/store/docs/stale.mdx'), 'stale');
  await writeFile(path.join(root, 'docs-publication/runtime/.generated/store/stale.ts'), 'stale');
  await generatePublication({ rootDir: root });
  assert.deepEqual(inventory(await diskFiles(path.join(root, 'docs-publication/.generated'))), firstDocs);
  assert.deepEqual(inventory(await diskFiles(path.join(root, 'docs-publication/runtime/.generated'))), firstExamples);
  assert.equal(await readFile(historical, 'utf8'), 'historical');
  for (const name of PACKAGE_NAMES) {
    const snapshot = path.join(root, candidate.packages[name].snapshot);
    for (const [file, source] of await diskFiles(path.join(snapshot, 'revision/docs'))) {
      const generated = await readFile(path.join(root, 'docs-publication/.generated', name, 'docs', file), 'utf8');
      assert.equal(generated, file.endsWith('.mdx') ? adaptInstallations(source.toString(), candidate.packages) : source.toString());
    }
  }
  const landing = await readFile(path.join(root, 'docs-publication/runtime/.generated/store/store-landing.tsx'), 'utf8');
  const imports = importSpecifiers(landing).map((entry) => entry.value);
  assert.ok(imports.includes('./store-demo'));
  const storeDemo = await readFile(path.join(root, 'docs-publication/runtime/.generated/store/store-demo.tsx'), 'utf8');
  assert.ok(importSpecifiers(storeDemo).some((entry) => entry.value === '@ilokesto/released-store'));
  assert.ok(imports.includes('@/components/landings/landing-shell'));
  assert.ok(imports.includes('@/components/landings/store-landing.module.css'));
  const fetcher = await readFile(path.join(root, 'docs-publication/runtime/.generated/fetcher/fetcher-demo.tsx'), 'utf8');
  assert.ok(importSpecifiers(fetcher).some((entry) => entry.value === './fetcher-copy'));
});

test('parsed import rewriting preserves displayed code, comments, strings and local helpers', () => {
  const source = [
    "import { create } from '@ilokesto/state/react';",
    "export { Store } from '@ilokesto/store';",
    "import type { T } from '@ilokesto/form';",
    "import { helper } from './helper';",
    "import { DemoFrame } from './demo-frame';",
    "const dynamic = import('@ilokesto/fetcher/openapi');",
    "const common = require('@ilokesto/modal');",
    "type StoreType = import('@ilokesto/store').Store;",
    "const displayed = `import { Store } from '@ilokesto/store';`;",
    "const string = '@ilokesto/state/react';",
    "// import { Store } from '@ilokesto/store';",
    "const jsx = <code>{`'@ilokesto/store'`}</code>;",
  ].join('\n');
  const sourcePath = 'apps/docs/components/demos/store-demo.tsx';
  const frozen = new Set([sourcePath, 'apps/docs/components/demos/helper.ts']);
  const rewritten = rewriteExampleImports(source, sourcePath, frozen);
  assert.deepEqual(importSpecifiers(rewritten).map((entry) => entry.value), [
    '@ilokesto/released-state/react', '@ilokesto/released-store', '@ilokesto/released-form',
    './_source/apps/docs/components/demos/helper', '@/components/demos/demo-frame',
    '@ilokesto/released-fetcher/openapi', '@ilokesto/released-modal', '@ilokesto/released-store',
  ]);
  assert.equal(rewritten.split('\n').slice(-4).join('\n'), source.split('\n').slice(-4).join('\n'));
  assert.throws(() => rewriteExampleImports('const x = import(variable);', sourcePath, frozen), /nonliteral executable import/);
  assert.throws(() => rewriteExampleImports("import x from './missing';", sourcePath, frozen), /unresolved frozen helper/);
  assert.throws(() => rewriteExampleImports("import x from '@ilokesto/unknown';", sourcePath, frozen), /unrecognized example package/);
  const fetcher = collectExamples(rootDir, RELEASE_COMMIT, 'fetcher');
  assert.deepEqual([...fetcher.files.keys()].sort(), ['apps/docs/components/demos/fetcher-copy.ts', 'apps/docs/components/demos/fetcher-demo.tsx']);
});

test('installation adaptation pins only package-install fences and shell install commands', () => {
  const document = [
    '```package-install', '@ilokesto/fetcher@beta ky @ilokesto/store', '```',
    '```bash', 'pnpm add @ilokesto/state@next react', '$ npm install @ilokesto/form@^1',
    'yarn add @ilokesto/modal', 'bun add @ilokesto/toast@latest', 'echo @ilokesto/store', '```',
    '```ts', "import { Store } from '@ilokesto/store';", "const command = 'pnpm add @ilokesto/store';", '```',
    '`@ilokesto/store`',
  ].join('\n');
  const adapted = adaptInstallations(document, candidate.packages);
  assert.deepEqual(adapted.split('\n').slice(0, 10), [
    '```package-install', '@ilokesto/fetcher@1.0.0 ky @ilokesto/store@2.0.0', '```',
    '```bash', 'pnpm add @ilokesto/state@2.0.0 react', '$ npm install @ilokesto/form@2.0.0',
    'yarn add @ilokesto/modal@2.0.0', 'bun add @ilokesto/toast@2.0.0', 'echo @ilokesto/store', '```',
  ]);
  assert.equal(adapted.split('\n').slice(10).join('\n'), document.split('\n').slice(10).join('\n'));
  assert.equal(adaptInstallations(adapted, candidate.packages), adapted);
});

test('immutable writes are idempotent but never overwrite differing payloads', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'docs-immutable-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = path.join(root, 'snapshot');
  const files = new Map([['docs/index.mdx', Buffer.from('original')]]);
  await writeImmutableSnapshot(target, files);
  await writeImmutableSnapshot(target, files);
  await assert.rejects(writeImmutableSnapshot(target, new Map([['docs/index.mdx', Buffer.from('changed')]])), /refusing overwrite/);
  assert.equal(await readFile(path.join(target, 'docs/index.mdx'), 'utf8'), 'original');
});

test('promotion requires a complete verified candidate and compare-and-swap of active bytes', async (t) => {
  const root = await fixture(t, { active: false });
  assert.equal(await currentManifestHash(root), 'none');
  await assert.rejects(promotePublication({ rootDir: root }), /requires --expected-current/);
  const candidatePath = path.join(root, 'docs-publication/candidate.json');
  await mutateJson(candidatePath, (manifest) => { delete manifest.packages.toast; });
  await assert.rejects(promotePublication({ rootDir: root, expectedCurrent: 'none' }), /complete package inventory/);
  assert.equal(await currentManifestHash(root), 'none');
  await writeFile(candidatePath, json(candidate));
  const promoted = await promotePublication({ rootDir: root, expectedCurrent: 'none' });
  assert.equal(promoted.hash, hash(await readFile(candidatePath)));
  await assert.rejects(promotePublication({ rootDir: root, expectedCurrent: 'none' }), /stale promotion/);
  await writeFile(path.join(root, 'docs-publication/active.json'), `${json(candidate)}\n`);
  await assert.rejects(promotePublication({ rootDir: root, expectedCurrent: promoted.hash }), /stale promotion/);
  const expected = await currentManifestHash(root);
  await promotePublication({ rootDir: root, expectedCurrent: expected });
  const snapshotFile = path.join(root, candidate.packages.store.snapshot, 'revision/docs/index.mdx');
  await writeFile(snapshotFile, 'corrupted');
  const before = await currentManifestHash(root);
  await assert.rejects(promotePublication({ rootDir: root, expectedCurrent: before }), /snapshot file inventory/);
  assert.equal(await currentManifestHash(root), before);
});

test('the verify CLI exercises the real candidate without changing active', () => {
  const result = execFileSync(process.execPath, ['scripts/docs-publication.mjs', 'verify', '--manifest', 'docs-publication/candidate.json'], { cwd: rootDir, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(result), { packages: PACKAGE_NAMES, verified: true });
});
