---
name: ilokesto-docs-sync
description: Use when connecting package-owned docs to the production apps/docs workspace. Covers Fumadocs structure and direct source loading without cross-repository synchronization.
compatibility: opencode
metadata:
  language: en
  domain: docs
  mode: knowledge
---

# ilokesto-docs-sync

## Trigger

Load this skill when connecting package documentation to `apps/docs`.

## Implementer routing

- **Package collection configuration**: follow the existing `apps/docs/source.config.ts` pattern.
- **Docs structure or Fumadocs questions**: `visual-engineering` category agent or `librarian`.

## Context to read

- `apps/docs/README.md`
- `DECISIONS/004-docs-in-monorepo.md`
- `apps/docs/source.config.ts` and `apps/docs/DOCS_ARCHITECTURE.md`
- `ARCHITECTURE.md` docs section
- `packages/<name>/docs/` structure

## Must do

- Ensure each package's `docs/` folder follows the Fumadocs structure (`meta.json`, `*.mdx`, `*.ko.mdx`).
- Run `pnpm docs:test`, `pnpm docs:typecheck`, and `pnpm docs:build` locally.
- Keep package content canonical in `packages/<name>/docs/`; site code belongs in `apps/docs`.
- Production uses this monorepo directly; do not restore legacy sync. External deployment changes require approval.

## Must not do

- Do not maintain a duplicate editable package-doc tree in `apps/docs`.
- Do not include docs in npm publish tarballs (check `packages/<name>/.npmignore`).
- Do not run `npm publish` or `pnpm publish` locally.
