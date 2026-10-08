import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readWorkspace, selectPlan } from "../../scripts/ci-plan.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const script = fileURLToPath(new URL("../../scripts/ci-plan.mjs", import.meta.url));
const workspace = (name, dependencies = [], scripts = { build: "build" }, path = `packages/${name}`) =>
  ({ name, path, dependencies, scripts });
const graph = [
  workspace("a"),
  workspace("bridge", ["a"], {}),
  workspace("b", ["bridge"], { typecheck: "check" }),
  workspace("c", ["a"], { test: "test" }),
  workspace("docs", ["b", "c"], { build: "build" }, "apps/docs"),
  workspace("example", ["b"], { build: "build" }, "packages/b/examples/demo"),
  workspace("other"),
];
const allRunnable = ["a", "b", "c", "docs", "example", "other"];

test("selectPlan: dependency through a non-runnable workspace -> includes transitive consumers", () => {
  const plan = selectPlan(graph, ["packages/a/src/index.ts"]);

  assert.deepEqual(plan, { full: false, packages: ["a", "b", "c", "docs", "example"] });
});

test("selectPlan: nested example change -> longest workspace path owns the file", () => {
  const plan = selectPlan(graph, ["packages/b/examples/demo/src/main.ts"]);

  assert.deepEqual(plan, { full: false, packages: ["example"] });
});

test("selectPlan: mixed and duplicate paths -> sorted union without prerequisite tests", () => {
  const paths = ["packages/c/test/test.ts", "packages/b/config.ts", "packages/c/test/test.ts"];

  const plan = selectPlan([...graph].reverse(), paths);

  assert.deepEqual(plan, { full: false, packages: ["b", "c", "docs", "example"] });
});

test("selectPlan: dependency cycle -> terminates and includes every affected runnable workspace", () => {
  const cycle = [
    workspace("c", ["b"]),
    workspace("b", ["a"], {}),
    workspace("a", ["c"], { test: "test" }),
  ];

  const plan = selectPlan(cycle, ["packages/a/index.ts"]);

  assert.deepEqual(plan, { full: false, packages: ["a", "c"] });
});

test("selectPlan: explicit full with no paths -> selects all runnable workspaces", () => {
  const plan = selectPlan(graph, [], { forceFull: true });

  assert.deepEqual(plan, { full: true, packages: allRunnable });
});

for (const path of [
  "package.json",
  "packages/a/package.json",
  "packages/deleted/package.json",
  "packages/b/examples/demo/package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".github/workflows/ci.yml",
  "scripts/ci-plan.mjs",
  "tests/monorepo/ci-plan.test.mjs",
  ".changeset/config.json",
  ".npmrc",
  "new-root-file.md",
  "packages/unknown/src/index.ts",
  "packages/a-similar/src/index.ts",
  "docs-publication/manifest.json",
]) {
  test(`selectPlan: shared or unknown input ${path} -> full verification`, () => {
    const plan = selectPlan(graph, [path]);

    assert.deepEqual(plan, { full: true, packages: allRunnable });
  });
}

for (const path of ["packages/a/docs/en/index.mdx", "packages/a/README.md", "packages/a/README.ko.md"]) {
  test(`selectPlan: package documentation ${path} -> docs consumers only`, () => {
    const withDocsConsumer = [...graph, workspace("site-preview", ["docs"])];

    const plan = selectPlan(withDocsConsumer, [path]);

    assert.deepEqual(plan, { full: false, packages: ["docs", "site-preview"] });
  });
}

test("selectPlan: docs and source change together -> preserves both affected selections", () => {
  const plan = selectPlan(graph, ["packages/a/docs/en/index.mdx", "packages/c/src/index.ts"]);

  assert.deepEqual(plan, { full: false, packages: ["c", "docs"] });
});

test("selectPlan: documentation consumer missing -> falls back to full verification", () => {
  const plan = selectPlan([workspace("a")], ["packages/a/README.md"]);

  assert.deepEqual(plan, { full: true, packages: ["a"] });
});

test("selectPlan: known root prose and changesets only -> no package checks", () => {
  const paths = [
    ".changeset/quiet-foxes.md",
    "README.md",
    "AGENTS.md",
    "ARCHITECTURE.md",
    "PACKAGES.md",
    "COMMANDS.md",
    "DECISIONS/004-docs-in-monorepo.md",
  ];

  const plan = selectPlan(graph, paths);

  assert.deepEqual(plan, { full: false, packages: [] });
});

test("selectPlan: empty diff -> no package checks", () => {
  const plan = selectPlan(graph, []);

  assert.deepEqual(plan, { full: false, packages: [] });
});

const actual = await readWorkspace(root);
const formExamples = [
  "@ilokesto/form-react-array-register-example",
  "@ilokesto/form-react-validation-flow-example",
  "@ilokesto/form-solid-login-example",
  "@ilokesto/form-svelte-login-example",
  "@ilokesto/form-vue-login-example",
];

test("readWorkspace: repository manifests -> excludes root and published aliases", () => {
  const docsRuntime = actual.find(({ name }) => name === "@ilokesto/docs-runtime");
  const modal = actual.find(({ name }) => name === "@ilokesto/modal");

  assert.deepEqual(docsRuntime, {
    name: "@ilokesto/docs-runtime",
    path: "docs-publication/runtime",
    dependencies: [],
    scripts: {},
  });
  assert.deepEqual(modal.dependencies, ["@ilokesto/overlay"]);
  assert.equal(actual.some(({ name }) => name === "ilokesto"), false);
  assert.deepEqual(actual.map(({ name }) => name), actual.map(({ name }) => name).sort());
});

for (const [path, packages] of [
  ["packages/modal/src/index.ts", ["@ilokesto/docs", "@ilokesto/modal"]],
  ["packages/overlay/src/index.ts", ["@ilokesto/docs", "@ilokesto/modal", "@ilokesto/overlay", "@ilokesto/toast"]],
  ["packages/toast/src/index.ts", ["@ilokesto/docs", "@ilokesto/toast"]],
  ["packages/form/src/index.ts", ["@ilokesto/docs", "@ilokesto/form", ...formExamples]],
  ["packages/store/src/index.ts", [
    "@ilokesto/docs", "@ilokesto/form", ...formExamples, "@ilokesto/modal",
    "@ilokesto/overlay", "@ilokesto/state", "@ilokesto/store", "@ilokesto/toast",
  ]],
  ["apps/docs/app/page.tsx", ["@ilokesto/docs"]],
  ["docs-publication/runtime/.generated/store/store-demo.tsx", ["@ilokesto/docs"]],
  ["packages/form/examples/vue-login-form/src/App.vue", ["@ilokesto/form-vue-login-example"]],
  ["packages/store/docs/en/index.mdx", ["@ilokesto/docs"]],
]) {
  test(`selectPlan: actual workspace ${path} -> exact runnable dependency closure`, () => {
    const plan = selectPlan(actual, [path]);

    assert.deepEqual(plan, { full: false, packages: [...packages].sort() });
  });
}

const writeFixtureFile = async (directory, path, content) => {
  const target = join(directory, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
};

const createFixture = async (t, manifests) => {
  const directory = await mkdtemp(join(tmpdir(), "ilokesto-ci-plan-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFixtureFile(directory, "package.json", JSON.stringify({
    name: "fixture",
    private: true,
    packageManager: "pnpm@10.17.1",
  }));
  await writeFixtureFile(directory, "pnpm-workspace.yaml", "packages:\n  - packages/*\n  - '!packages/excluded'\n");
  for (const [path, manifest] of Object.entries(manifests)) {
    await writeFixtureFile(directory, `${path}/package.json`, JSON.stringify({
      version: "1.0.0",
      ...manifest,
    }));
  }
  return directory;
};

test("readWorkspace: workspace names, aliases and paths in every dependency field -> normalized graph", async (t) => {
  const directory = await createFixture(t, {
    "packages/a": { name: "@fixture/a" },
    "packages/b": { name: "b" },
    "packages/excluded": { name: "excluded" },
    "packages/consumer": {
      name: "consumer",
      scripts: { test: "node --test" },
      dependencies: { "@fixture/a": "workspace:^1.0.0", published: "npm:b@1.0.0" },
      devDependencies: { scopedAlias: "workspace:@fixture/a@*", b: "1.0.0" },
      optionalDependencies: { pathAlias: "workspace:../b" },
      peerDependencies: { plainAlias: "workspace:b@^", duplicate: "workspace:../a" },
    },
  });

  const workspaces = await readWorkspace(directory);

  assert.deepEqual(workspaces, [
    { name: "@fixture/a", path: "packages/a", dependencies: [], scripts: {} },
    { name: "b", path: "packages/b", dependencies: [], scripts: {} },
    {
      name: "consumer",
      path: "packages/consumer",
      dependencies: ["@fixture/a", "b"],
      scripts: { test: "node --test" },
    },
  ]);
});

test("readWorkspace: missing workspace dependency -> fails instead of losing an edge", async (t) => {
  const directory = await createFixture(t, {
    "packages/a": { name: "a", dependencies: { missing: "workspace:*" } },
  });

  await assert.rejects(readWorkspace(directory));
});

const git = (directory, ...args) => execFileSync("git", args, {
  cwd: directory,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const commitFixture = (directory) => {
  git(directory, "add", "packages");
  git(directory, "-c", "user.name=CI Test", "-c", "user.email=ci-test@example.invalid",
    "-c", "commit.gpgsign=false", "commit", "-qm", "fixture");
  return git(directory, "rev-parse", "HEAD").trim();
};

const createGitFixture = async (t) => {
  const directory = await createFixture(t, {
    "packages/a": { name: "a", scripts: { build: "build" } },
    "packages/b": { name: "b", scripts: { test: "test" } },
    "packages/deleted": { name: "deleted", scripts: { typecheck: "check" } },
  });
  await writeFixtureFile(directory, "packages/a/old name\nfile.ts", "export const value = 1;\n");
  git(directory, "init", "-q");
  git(directory, "add", ".");
  const base = commitFixture(directory);
  return { directory, base };
};

const runCli = (directory, values = {}) => {
  const env = { ...process.env, GITHUB_OUTPUT: join(directory, "github-output") };
  for (const name of ["CI_BASE_SHA", "CI_HEAD_SHA", "CI_FORCE_FULL"]) {
    delete env[name];
  }
  return spawnSync(process.execPath, [script], {
    cwd: directory,
    env: { ...env, ...values },
    encoding: "utf8",
  });
};

const readOutputs = async (directory) => Object.fromEntries(
  (await readFile(join(directory, "github-output"), "utf8")).trim().split("\n").map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), JSON.parse(line.slice(separator + 1))];
  }),
);

test("CLI: renamed file with whitespace -> selects both endpoint workspaces and emits matrix", async (t) => {
  const { directory, base } = await createGitFixture(t);
  await rename(join(directory, "packages/a/old name\nfile.ts"), join(directory, "packages/b/new name\nfile.ts"));
  const head = commitFixture(directory);

  const result = runCli(directory, { CI_BASE_SHA: base, CI_HEAD_SHA: head });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await readOutputs(directory), {
    full: false,
    has_packages: true,
    matrix: { include: [{ package: "a" }, { package: "b" }] },
  });
  assert.notEqual(result.stdout.trim(), "");
});

test("CLI: deleted source file -> selects the previous owner", async (t) => {
  const { directory, base } = await createGitFixture(t);
  await rm(join(directory, "packages/a/old name\nfile.ts"));
  const head = commitFixture(directory);

  const result = runCli(directory, { CI_BASE_SHA: base, CI_HEAD_SHA: head });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await readOutputs(directory), {
    full: false,
    has_packages: true,
    matrix: { include: [{ package: "a" }] },
  });
});

test("CLI: deleted workspace manifest -> full plan despite absent current workspace", async (t) => {
  const { directory, base } = await createGitFixture(t);
  await rm(join(directory, "packages/deleted"), { recursive: true });
  const head = commitFixture(directory);

  const result = runCli(directory, { CI_BASE_SHA: base, CI_HEAD_SHA: head });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await readOutputs(directory), {
    full: true,
    has_packages: true,
    matrix: { include: [{ package: "a" }, { package: "b" }] },
  });
});

test("CLI: base advances separately -> compares head to merge base", async (t) => {
  const { directory, base } = await createGitFixture(t);
  await writeFixtureFile(directory, "packages/a/change.ts", "export {};\n");
  const head = commitFixture(directory);
  git(directory, "checkout", "-qb", "advanced-base", base);
  await writeFixtureFile(directory, "packages/b/base-only.ts", "export {};\n");
  const advancedBase = commitFixture(directory);
  git(directory, "checkout", "-q", head);

  const result = runCli(directory, { CI_BASE_SHA: advancedBase, CI_HEAD_SHA: head });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await readOutputs(directory), {
    full: false,
    has_packages: true,
    matrix: { include: [{ package: "a" }] },
  });
});

test("CLI: equal valid refs -> emits an empty include matrix", async (t) => {
  const { directory, base } = await createGitFixture(t);

  const result = runCli(directory, { CI_BASE_SHA: base, CI_HEAD_SHA: base });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await readOutputs(directory), {
    full: false,
    has_packages: false,
    matrix: { include: [] },
  });
});

test("CLI: force full without Git refs -> emits all runnable workspaces", async (t) => {
  const directory = await createFixture(t, {
    "packages/a": { name: "a", scripts: { build: "build" } },
    "packages/passive": { name: "passive" },
  });

  const result = runCli(directory, { CI_FORCE_FULL: "true" });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await readOutputs(directory), {
    full: true,
    has_packages: true,
    matrix: { include: [{ package: "a" }] },
  });
});

for (const values of [
  {},
  { CI_HEAD_SHA: "HEAD" },
  { CI_BASE_SHA: "HEAD" },
  { CI_BASE_SHA: "not-a-ref", CI_HEAD_SHA: "HEAD" },
  { CI_BASE_SHA: "HEAD", CI_HEAD_SHA: "not-a-ref" },
  { CI_BASE_SHA: "HEAD", CI_HEAD_SHA: "HEAD", CI_FORCE_FULL: "yes" },
]) {
  test(`CLI: invalid inputs ${JSON.stringify(values)} -> fails without publishing outputs`, async (t) => {
    const { directory } = await createGitFixture(t);

    const result = runCli(directory, values);

    assert.notEqual(result.status, 0);
    await assert.rejects(readFile(join(directory, "github-output")), { code: "ENOENT" });
  });
}
