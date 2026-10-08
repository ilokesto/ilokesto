import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { parse } from "yaml";

const readWorkflow = (name) =>
  readFile(new URL(`../../.github/workflows/${name}`, import.meta.url), "utf8");

test("verification is read-only and runs only for PRs or guarded dispatches", async () => {
  const workflow = await readWorkflow("ci.yml");

  assert.match(workflow, /pull_request:\n\s+branches:\n\s+- main/);
  assert.match(workflow, /workflow_dispatch:\n\s+inputs:/);
  assert.match(workflow, /expected_head_sha:[\s\S]*required: true/);
  assert.match(workflow, /release_pr_number:[\s\S]*required: true/);
  assert.doesNotMatch(workflow, /^\s+push:/m);
  assert.match(workflow, /permissions:\n\s+contents: read\n\s+pull-requests: read/);
  assert.doesNotMatch(workflow, /contents: write|actions: write|id-token: write/);
  assert.match(workflow, /name: verify/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/changeset-release\/main'/);
});

test("release dispatch validation precedes checkout and binds the exact PR head", async () => {
  const workflow = await readWorkflow("ci.yml");
  const validation = workflow.indexOf("name: Validate release dispatch");
  const checkout = workflow.indexOf("name: Checkout repository");

  assert.ok(validation >= 0);
  assert.ok(checkout > validation);
  assert.match(workflow, /GITHUB_SHA.*EXPECTED_HEAD_SHA/);
  assert.match(workflow, /\.base\.ref, \.head\.ref, \.head\.repo\.full_name, \.head\.sha/);
  assert.match(workflow, /git\/ref\/heads\/changeset-release\/main/);
  assert.match(workflow, /ref: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.expected_head_sha \|\| github\.sha \}\}/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /persist-credentials: false/);
});

test("changeset status receives a local main base ref", async () => {
  const workflow = await readWorkflow("ci.yml");
  const prepareBase = workflow.indexOf("name: Prepare changeset base branch");
  const changesetStatus = workflow.indexOf("name: Check changesets");

  assert.ok(prepareBase >= 0);
  assert.ok(changesetStatus > prepareBase);
  assert.match(workflow, /git branch --force main origin\/main/);
});

test("changeset status is required only for ordinary pull requests", async () => {
  const workflow = await readWorkflow("ci.yml");

  assert.match(
    workflow,
    /- name: Check changesets\n\s+if: github\.event_name == 'pull_request' && github\.head_ref != 'changeset-release\/main'\n\s+run: pnpm changeset:status/,
  );
});

test("verification plans use the PR base and head while releases force the full path", async () => {
  const { jobs } = parse(await readWorkflow("ci.yml"));
  const selection = jobs.plan.steps.find((step) => step.id === "affected");

  assert.equal(selection.run, "node scripts/ci-plan.mjs");
  assert.equal(selection.env.CI_BASE_SHA, "${{ github.event.pull_request.base.sha }}");
  assert.equal(selection.env.CI_HEAD_SHA, "${{ github.event.pull_request.head.sha }}");
  assert.equal(
    selection.env.CI_FORCE_FULL,
    "${{ github.event_name == 'workflow_dispatch' || github.head_ref == 'changeset-release/main' }}",
  );
  assert.deepEqual(jobs.plan.outputs, {
    full: "${{ steps.affected.outputs.full }}",
    has_packages: "${{ steps.affected.outputs.has_packages }}",
    matrix: "${{ steps.affected.outputs.matrix }}",
  });
  assert.equal(jobs.full.needs, "plan");
  assert.equal(jobs.packages.needs, "plan");
  assert.equal(jobs.full.if, "needs.plan.outputs.full == 'true'");
  assert.equal(
    jobs.packages.if,
    "needs.plan.outputs.full == 'false' && needs.plan.outputs.has_packages == 'true'",
  );
  assert.equal(jobs.packages.strategy.matrix, "${{ fromJSON(needs.plan.outputs.matrix) }}");
  assert.equal(jobs.packages.strategy["fail-fast"], false);
});

test("selected jobs build prerequisites but check only the selected package", async () => {
  const { jobs } = parse(await readWorkflow("ci.yml"));
  const runs = jobs.packages.steps.map((step) => step.run).filter(Boolean);

  assert.ok(runs.includes('pnpm --filter "$PACKAGE..." --if-present run build'));
  assert.ok(runs.includes('pnpm --filter "$PACKAGE" --if-present run typecheck'));
  assert.ok(runs.includes('pnpm --filter "$PACKAGE" --if-present run test'));
  assert.equal(jobs.packages.env.PACKAGE, "${{ matrix.package }}");
  assert.ok(!runs.includes("pnpm test"));
  assert.ok(!runs.includes("pnpm build"));
  assert.ok(!runs.includes("pnpm typecheck"));
});

test("selected docs tests install their own Chromium before launching browser fixtures", async () => {
  const { jobs } = parse(await readWorkflow("ci.yml"));
  const steps = jobs.packages.steps;
  const install = steps.findIndex((step) =>
    step.run === "pnpm --filter @ilokesto/docs exec playwright install --with-deps chromium",
  );
  const tests = steps.findIndex((step) =>
    step.run === 'pnpm --filter "$PACKAGE" --if-present run test',
  );

  assert.ok(install >= 0, "the isolated docs runner needs its own browser installation");
  assert.ok(install < tests, "docs fixtures launch Chromium in the package test command");
  assert.equal(steps[install].if, "matrix.package == '@ilokesto/docs'");
});

test("full and selected verification preserve every specialized package check", async () => {
  const { jobs } = parse(await readWorkflow("ci.yml"));
  const checks = [
    ["form", "test:pack"],
    ["state", "test:typecheck"],
    ["modal", "exec playwright install --with-deps chromium"],
    ["modal", "test:pack"],
    ["modal", "test:e2e"],
    ["modal", "test:a11y"],
    ["fetcher", "test:dist"],
  ];

  for (const [name, command] of checks) {
    const run = `pnpm --filter @ilokesto/${name} ${command}`;
    assert.ok(jobs.full.steps.some((step) => step.run === run), run);
    const selected = jobs.packages.steps.find((step) => step.run === run);
    assert.equal(selected?.if, `matrix.package == '@ilokesto/${name}'`, run);
  }
  for (const run of ["pnpm build", "pnpm test:monorepo", "pnpm typecheck", "pnpm test"]) {
    assert.ok(jobs.full.steps.some((step) => step.run === run), run);
  }
  for (const job of Object.values(jobs)) {
    assert.notEqual(job["continue-on-error"], true);
    for (const step of job.steps) {
      assert.notEqual(step["continue-on-error"], true);
    }
  }
});

test("required verify always aggregates planning and both execution paths without checkout", async () => {
  const { jobs } = parse(await readWorkflow("ci.yml"));

  assert.equal(jobs.verify.name, "verify");
  assert.equal(jobs.verify.if, "always()");
  assert.deepEqual(jobs.verify.needs, ["plan", "full", "packages"]);
  assert.deepEqual(jobs.verify.permissions, {});
  assert.equal(jobs.verify.steps.length, 1);
  assert.deepEqual(jobs.verify.steps[0].env, {
    PLAN_RESULT: "${{ needs.plan.result }}",
    FULL_SELECTED: "${{ needs.plan.outputs.full }}",
    HAS_PACKAGES: "${{ needs.plan.outputs.has_packages }}",
    FULL_RESULT: "${{ needs.full.result }}",
    PACKAGES_RESULT: "${{ needs.packages.result }}",
  });
});

for (const [full, hasPackages, fullResult, packagesResult] of [
  ["true", "true", "success", "skipped"],
  ["true", "false", "success", "skipped"],
  ["false", "true", "skipped", "success"],
  ["false", "false", "skipped", "skipped"],
]) {
  test(`verify gate accepts only the expected results for full=${full}, packages=${hasPackages}`, async () => {
    const { jobs } = parse(await readWorkflow("ci.yml"));
    const gate = jobs.verify.steps[0].run;
    const outcomes = ["success", "failure", "cancelled", "skipped", ""];

    for (const actualFull of outcomes) {
      for (const actualPackages of outcomes) {
        const result = spawnSync("bash", ["-c", gate], {
          env: {
            ...process.env,
            PLAN_RESULT: "success",
            FULL_SELECTED: full,
            HAS_PACKAGES: hasPackages,
            FULL_RESULT: actualFull,
            PACKAGES_RESULT: actualPackages,
          },
          encoding: "utf8",
        });
        assert.equal(
          result.status === 0,
          actualFull === fullResult && actualPackages === packagesResult,
          `${actualFull}/${actualPackages}: ${result.stderr}`,
        );
      }
    }
  });
}

test("verify gate rejects failed planning and missing or malformed plan outputs", async () => {
  const { jobs } = parse(await readWorkflow("ci.yml"));
  const gate = jobs.verify.steps[0].run;
  const valid = {
    PLAN_RESULT: "success",
    FULL_SELECTED: "false",
    HAS_PACKAGES: "false",
    FULL_RESULT: "skipped",
    PACKAGES_RESULT: "skipped",
  };
  const invalid = [
    ...["failure", "cancelled", "skipped", ""].map((result) => ({ PLAN_RESULT: result })),
    { FULL_SELECTED: "" },
    { FULL_SELECTED: "invalid" },
    { HAS_PACKAGES: "" },
    { HAS_PACKAGES: "invalid" },
  ];

  for (const overrides of invalid) {
    const result = spawnSync("bash", ["-c", gate], {
      env: { ...process.env, ...valid, ...overrides },
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0, JSON.stringify(overrides));
  }
});
