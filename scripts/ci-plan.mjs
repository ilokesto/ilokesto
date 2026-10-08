import { execFileSync } from "node:child_process";
import { appendFile, readFile, realpath } from "node:fs/promises";
import { basename, join, posix, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const readWorkspace = async (root) => {
  const directory = await realpath(root);
  const projects = JSON.parse(
    execFileSync("pnpm", ["list", "-r", "--depth", "-1", "--json"], {
      cwd: directory,
      encoding: "utf8",
    }),
  ).filter((project) => resolve(project.path) !== directory);
  const workspaces = await Promise.all(
    projects.map(async (project) => {
      const manifest = JSON.parse(
        await readFile(join(project.path, "package.json"), "utf8"),
      );
      return {
        name: manifest.name,
        path: relative(directory, project.path).split(sep).join("/"),
        manifest,
      };
    }),
  );
  const names = new Set(workspaces.map(({ name }) => name));
  const namesByPath = new Map(
    workspaces.map(({ name, path }) => [path, name]),
  );

  return workspaces.map(({ name, path, manifest }) => {
    const dependencies = new Set();
    for (const field of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      for (const [dependency, version] of Object.entries(manifest[field] ?? {})) {
        if (!version.startsWith("workspace:")) {
          continue;
        }
        const specifier = version.slice("workspace:".length);
        const aliasSeparator = specifier.lastIndexOf("@");
        const target = specifier.startsWith(".")
          ? namesByPath.get(posix.join(path, specifier))
          : aliasSeparator > 0
            ? specifier.slice(0, aliasSeparator)
            : dependency;
        if (!names.has(target)) {
          throw new Error(`Unresolved workspace dependency: ${name} -> ${version}`);
        }
        dependencies.add(target);
      }
    }
    return {
      name,
      path,
      dependencies: [...dependencies].sort(),
      scripts: manifest.scripts ?? {},
    };
  }).sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
};

const rootProse = new Set([
  "AGENTS.md",
  "ARCHITECTURE.md",
  "COMMANDS.md",
  "PACKAGES.md",
  "README.md",
]);

export const selectPlan = (workspaces, changedPaths, { forceFull = false } = {}) => {
  const runnable = workspaces
    .filter(({ scripts }) => ["build", "typecheck", "test"].some((script) => scripts[script]))
    .map(({ name }) => name)
    .sort();
  const fullPlan = { full: true, packages: runnable };
  if (forceFull) {
    return fullPlan;
  }

  const owners = [...workspaces].sort((left, right) => right.path.length - left.path.length);
  const docs = workspaces.find(({ path }) => path === "apps/docs");
  const affected = new Set();
  for (const path of changedPaths) {
    if (basename(path) === "package.json") {
      return fullPlan;
    }
    if (
      rootProse.has(path) ||
      /^\.changeset\/[^/]+\.md$/.test(path) ||
      /^DECISIONS\/[^/]+\.md$/.test(path)
    ) {
      continue;
    }
    const owner = owners.find((workspace) => path.startsWith(`${workspace.path}/`));
    if (!owner) {
      return fullPlan;
    }
    const localPath = path.slice(owner.path.length + 1);
    if (
      owner.path.startsWith("packages/") &&
      (localPath.startsWith("docs/") || /^README(?:\.[^/]+)?\.md$/i.test(localPath))
    ) {
      if (!docs) {
        return fullPlan;
      }
      affected.add(docs.name);
    } else {
      affected.add(owner.name);
    }
  }

  const dependents = new Map(workspaces.map(({ name }) => [name, []]));
  for (const workspace of workspaces) {
    for (const dependency of workspace.dependencies) {
      dependents.get(dependency)?.push(workspace.name);
    }
  }
  for (const name of affected) {
    for (const dependent of dependents.get(name) ?? []) {
      affected.add(dependent);
    }
  }
  return { full: false, packages: runnable.filter((name) => affected.has(name)) };
};

const main = async () => {
  const forceFull = process.env.CI_FORCE_FULL ?? "false";
  if (forceFull !== "true" && forceFull !== "false") {
    throw new Error("CI_FORCE_FULL must be true or false");
  }
  const root = process.cwd();
  let changedPaths = [];
  if (forceFull !== "true") {
    const base = process.env.CI_BASE_SHA;
    const head = process.env.CI_HEAD_SHA;
    if (!base || !head) {
      throw new Error("CI_BASE_SHA and CI_HEAD_SHA are required");
    }
    const commits = [base, head].map((ref) =>
      execFileSync("git", ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
    );
    changedPaths = execFileSync(
      "git",
      ["diff", "--name-only", "-z", "--no-renames", `${commits[0]}...${commits[1]}`, "--"],
      { cwd: root, encoding: "utf8" },
    ).split("\0").filter(Boolean);
  }
  const plan = selectPlan(await readWorkspace(root), changedPaths, {
    forceFull: forceFull === "true",
  });
  const matrix = { include: plan.packages.map((name) => ({ package: name })) };
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `full=${plan.full}\nhas_packages=${plan.packages.length > 0}\nmatrix=${JSON.stringify(matrix)}\n`,
    );
  }
  process.stdout.write(
    `CI plan: ${plan.full ? "full" : "selective"}; packages: ${plan.packages.join(", ") || "(none)"}\n`,
  );
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
