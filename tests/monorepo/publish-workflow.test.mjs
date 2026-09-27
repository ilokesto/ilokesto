import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("publishing is dispatch-only, guarded, and serialized", async () => {
  const workflow = await readFile(
    new URL("../../.github/workflows/publish.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /on:\n\s+workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+(push|pull_request):/m);
  assert.match(workflow, /ilokesto\/ilokesto/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /group: publish-main/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /run: pnpm release/);
  assert.match(workflow, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/);
  assert.match(workflow, /git push origin --tags/);
});
