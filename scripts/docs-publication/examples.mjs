import { createRequire } from 'node:module';
import path from 'node:path';
import { PACKAGE_NAMES } from './catalog.mjs';
import { equal, gitEntries, gitFiles, invariant } from './io.mjs';

const require = createRequire(new URL('../../apps/docs/package.json', import.meta.url));
const ts = require('typescript');
const SHARED = new Set([
  'apps/docs/components/demos/demo-frame',
  'apps/docs/components/landings/landing-shell',
  'apps/docs/components/landings/landing-packages',
]);
const EXTENSIONS = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];

export function importSpecifiers(source, filename = 'example.tsx') {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  invariant(ast.parseDiagnostics.length === 0, `cannot parse example ${filename}`);
  const imports = [];
  const add = (node) => {
    invariant(node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)), `nonliteral executable import in ${filename}`);
    imports.push({ value: node.text, start: node.getStart(ast) + 1, end: node.getEnd() - 1 });
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) add(node.moduleSpecifier);
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) add(node.moduleReference.expression);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) add(node.argument.literal);
    else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) add(node.arguments[0]);
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return imports;
}
function appPath(specifier, sourcePath) {
  if (specifier.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), specifier));
  if (specifier.startsWith('@/')) return `apps/docs/${specifier.slice(2)}`;
  return null;
}
function shared(target) {
  return SHARED.has(target.replace(/\.[jt]sx?$/, '')) || target.endsWith('.css');
}
function resolveLocal(target, paths) {
  invariant(target.startsWith('apps/docs/'), `example import escapes docs app: ${target}`);
  const resolved = EXTENSIONS.map((extension) => `${target}${extension}`).find((candidate) => paths.has(candidate));
  invariant(resolved, `unresolved frozen helper: ${target}`);
  return resolved;
}
export function exampleOutputPath(sourcePath) {
  if (/^apps\/docs\/components\/(demos\/(?:[^/]+-demo\.tsx|fetcher-copy\.ts)|landings\/store-landing\.tsx)$/.test(sourcePath)) return path.posix.basename(sourcePath);
  return `_source/${sourcePath}`;
}
export function collectExamples(root, commit, name) {
  const entries = gitEntries(root, commit, ['apps/docs']);
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const all = gitFiles(root, entries.filter((entry) => /\.[jt]sx?$/.test(entry.path)));
  const queue = [`apps/docs/components/demos/${name}-demo.tsx`];
  if (name === 'fetcher') queue.push('apps/docs/components/demos/fetcher-copy.ts');
  if (name === 'store') queue.push('apps/docs/components/landings/store-landing.tsx');
  const files = new Map();
  while (queue.length) {
    const sourcePath = queue.shift();
    if (files.has(sourcePath)) continue;
    invariant(all.has(sourcePath), `missing example source ${sourcePath}`);
    const bytes = all.get(sourcePath);
    files.set(sourcePath, bytes);
    for (const specifier of importSpecifiers(bytes.toString('utf8'), sourcePath)) {
      const target = appPath(specifier.value, sourcePath);
      if (target && !shared(target)) queue.push(resolveLocal(target, byPath));
    }
  }
  return { files, entries: [...files.keys()].sort().map((file) => byPath.get(file)) };
}
export function rewriteExampleImports(source, sourcePath, frozenPaths) {
  const replacements = importSpecifiers(source, sourcePath).map((specifier) => {
    let value = specifier.value;
    const packageMatch = /^@ilokesto\/([^/]+)(\/.*)?$/.exec(value);
    if (packageMatch) {
      invariant(PACKAGE_NAMES.includes(packageMatch[1]), `unrecognized example package ${value}`);
      value = `@ilokesto/released-${packageMatch[1]}${packageMatch[2] ?? ''}`;
    } else {
      const target = appPath(value, sourcePath);
      if (target && shared(target)) value = `@/${target.slice('apps/docs/'.length)}`;
      else if (target) {
        const resolved = resolveLocal(target, frozenPaths);
        value = path.posix.relative(path.posix.dirname(exampleOutputPath(sourcePath)), exampleOutputPath(resolved)).replace(/\.[jt]sx?$/, '');
        if (!value.startsWith('.')) value = `./${value}`;
      }
    }
    return { ...specifier, value };
  });
  let output = source;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) output = output.slice(0, replacement.start) + replacement.value + output.slice(replacement.end);
  // Reparse the generated file, rather than trusting string-offset edits.
  equal(importSpecifiers(output, sourcePath).length, replacements.length, 'generated import count');
  return output;
}

export function adaptInstallations(document, packages) {
  const pin = (line) => line.replace(/@ilokesto\/([a-z][a-z0-9-]*)(?:@[^\s`'";,]+)?/g, (original, name) => {
    const selected = packages[name];
    invariant(selected, `installation references inactive package ${name}`);
    return `@ilokesto/${name}@${selected.version}`;
  });
  let fence = null;
  return document.split(/(?<=\n)/).map((line) => {
    const marker = /^\s*(`{3,}|~{3,})([^\r\n]*)/.exec(line);
    if (marker) {
      if (!fence) fence = { marker: marker[1][0], length: marker[1].length, language: marker[2].trim().split(/\s/)[0] };
      else if (marker[1][0] === fence.marker && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return line;
    }
    if (fence?.language === 'package-install') return pin(line);
    if (fence && ['', 'sh', 'shell', 'bash', 'zsh', 'console', 'terminal'].includes(fence.language) && /^\s*(?:\$\s*)?(?:npm\s+(?:install|i)|pnpm\s+(?:add|install)|yarn\s+add|bun\s+(?:add|install))\s/.test(line)) return pin(line);
    return line;
  }).join('');
}
