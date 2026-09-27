import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { stringify } from "yaml";
import { inspectRuntimeClosure, verifyInstalledReleaseFiles, verifyRuntimeClosure } from "../../scripts/docs-runtime.mjs";
import { verifyPresentationBoundary } from "../../scripts/docs-presentation.mjs";

const json = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value));
};

test("shared presentation rejects transitive workspace API imports", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "docs-presentation-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = path.join(root, "apps/docs/components/demos");
  await mkdir(directory, { recursive: true });
  const landings = path.join(root, "apps/docs/components/landings");
  await mkdir(landings, { recursive: true });
  await writeFile(path.join(landings, "landing-shell.tsx"), "export const shell = 1;");
  await writeFile(path.join(landings, "landing-packages.ts"), "export const packages = [];");
  await writeFile(path.join(directory, "demo-frame.tsx"), "import './helper';\nexport const frame = 1;");
  await writeFile(path.join(directory, "helper.ts"), "import { Store } from '@ilokesto/store';\nexport { Store };");
  await assert.rejects(verifyPresentationBoundary(root), /Shared presentation imports package API/);
});

test("installed package mutation is rejected even when the locked version is unchanged", async (t) => {
  const input = await fixture(t);
  const closure = await inspectRuntimeClosure(input);
  const source = "export const value = 1;\n";
  const digest = value => createHash("sha256").update(value).digest("hex");
  const receipt = JSON.stringify({
    registry: {
      integrity: closure.nodes[closure.roots.store].integrity,
      files: [{ path: "index.js", bytes: Buffer.byteLength(source), sha256: digest(source) }],
    },
  });
  const snapshot = "docs-publication/releases/store/2.0.0/r1";
  await mkdir(path.join(input.rootDir, snapshot), { recursive: true });
  await writeFile(path.join(input.rootDir, snapshot, "receipt.json"), receipt);
  const packages = { store: { ...input.packages.store, snapshot, receiptSha256: digest(receipt) } };
  const target = path.join(input.directories["@ilokesto/store"], "index.js");
  await writeFile(target, source.replace("1", "2"));
  await assert.rejects(
    verifyInstalledReleaseFiles({ rootDir: input.rootDir, packages, closure }),
    /Published npm payload changed/,
  );
});

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "docs-runtime-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const versions = {
    store: "2.0.0", state: "2.0.0", form: "2.0.0", overlay: "2.0.0",
    modal: "2.0.0", toast: "2.0.0", fetcher: "1.0.0", utilinent: "1.2.0",
  };
  const packages = Object.fromEntries(Object.entries(versions).map(([name, version]) =>
    [name, { name: `@ilokesto/${name}`, version }]));
  const nodes = Object.fromEntries(Object.values(packages).map(p => [p.name, {
    ...p, dependencies: {},
  }]));
  for (const [name, version] of Object.entries({
    react: "19.2.8", "react-dom": "19.2.8", ky: "1.14.3", immer: "11.1.8", scheduler: "0.27.0",
  })) nodes[name] = { name, version, dependencies: {} };
  for (const name of ["state", "form", "overlay", "toast"]) {
    nodes[`@ilokesto/${name}`].dependencies["@ilokesto/store"] = "2.0.0";
  }
  for (const name of ["modal", "toast"]) nodes[`@ilokesto/${name}`].dependencies["@ilokesto/overlay"] = "2.0.0";
  for (const name of ["state", "form", "overlay", "modal", "toast", "utilinent"]) {
    nodes[`@ilokesto/${name}`].peerDependencies = { react: "19.2.8" };
  }
  nodes["@ilokesto/form"].dependencies.immer = "11.1.8";
  nodes["@ilokesto/fetcher"].peerDependencies = { ky: "1.14.3" };
  nodes["react-dom"].dependencies = { react: "19.2.8", scheduler: "0.27.0" };
  const directories = {};
  const lock = { importers: { "docs-publication/runtime": { dependencies: {} } }, packages: {}, snapshots: {} };
  for (const node of Object.values(nodes)) {
    const id = `${node.name}@${node.version}`;
    const directory = path.join(root, "node_modules/.pnpm", node.name.replace("/", "+"), "node_modules", node.name);
    directories[node.name] = directory;
    await json(path.join(directory, "package.json"), node);
    const publicPath = path.join(root, "node_modules", node.name);
    await mkdir(path.dirname(publicPath), { recursive: true });
    await symlink(directory, publicPath);
    lock.packages[id] = { resolution: { integrity: "sha512-Zml4dHVyZQ==" } };
    lock.snapshots[id] = { dependencies: { ...node.dependencies, ...node.peerDependencies } };
  }
  const dependencies = {};
  const runtime = path.join(root, "docs-publication/runtime");
  for (const [name, release] of Object.entries(packages)) {
    const alias = `@ilokesto/released-${name}`;
    dependencies[alias] = `npm:${release.name}@${release.version}`;
    lock.importers["docs-publication/runtime"].dependencies[alias] = {
      specifier: dependencies[alias], version: `${release.name}@${release.version}`,
    };
    const target = path.join(runtime, "node_modules", alias);
    await mkdir(path.dirname(target), { recursive: true });
    await symlink(directories[release.name], target);
  }
  for (const name of ["react", "react-dom", "ky"]) {
    dependencies[name] = nodes[name].version;
    lock.importers["docs-publication/runtime"].dependencies[name] = {
      specifier: nodes[name].version, version: nodes[name].version,
    };
  }
  await json(path.join(runtime, "package.json"), { private: true, dependencies });
  await json(path.join(root, "apps/docs/package.json"), { private: true });
  await writeFile(path.join(root, "pnpm-lock.yaml"), stringify(lock));
  return { rootDir: root, packages, lock, directories };
}

test("released runtime resolves import-only registry packages and a shared React context", async (t) => {
  const input = await fixture(t);
  const result = await inspectRuntimeClosure(input);
  assert.equal(Object.keys(result.nodes).length, 13);
  assert.equal(result.roots.store, "@ilokesto/store@2.0.0");
  assert.equal(result.nodes[result.roots.modal].dependencies["@ilokesto/overlay"], result.roots.overlay);
});

test("a transitive workspace dependency is rejected even with the same version", async (t) => {
  const input = await fixture(t);
  const workspace = path.join(input.rootDir, "packages/store");
  await json(path.join(workspace, "package.json"), { name: "@ilokesto/store", version: "2.0.0" });
  const link = path.join(input.rootDir, "node_modules/@ilokesto/store");
  await rm(link);
  await symlink(workspace, link);
  await assert.rejects(inspectRuntimeClosure(input), /escaped the registry install/);
});

test("matching React versions in different physical instances are rejected", async (t) => {
  const input = await fixture(t);
  const duplicate = path.join(input.rootDir, "node_modules/react-duplicate");
  await json(path.join(duplicate, "package.json"), { name: "react", version: "19.2.8" });
  const appLink = path.join(input.rootDir, "apps/docs/node_modules/react");
  await mkdir(path.dirname(appLink), { recursive: true });
  await symlink(duplicate, appLink);
  await assert.rejects(inspectRuntimeClosure(input), /duplicate react/);
});

test("a locked transitive integrity change requires explicit closure promotion", async (t) => {
  const input = await fixture(t);
  await json(
    path.join(input.rootDir, "docs-publication/runtime/closure.json"),
    await inspectRuntimeClosure(input),
  );
  input.lock.packages["ky@1.14.3"].resolution.integrity = "sha512-Y2hhbmdlZA==";
  await writeFile(path.join(input.rootDir, "pnpm-lock.yaml"), stringify(input.lock));
  await assert.rejects(verifyRuntimeClosure(input), /runtime closure changed/);
});
