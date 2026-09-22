---
name: ilokesto-docs-governance
description: Use when reviewing package documentation structure and the production apps/docs workspace. Covers Fumadocs layout, bilingual README rules, and direct package content loading.
compatibility: opencode
metadata:
  language: en
  domain: docs
  mode: knowledge
---

# ilokesto Docs Governance

This skill captures the documentation rules that `ilokesto-docs-release-reviewer` and `/docs-sync-check` enforce.

## Docs Live With Source

- Each package keeps documentation in `packages/<name>/docs/`.
- The private `apps/docs` workspace consumes package originals. Site-wide changes belong there.
- Production uses the `apps/docs` workspace directly; cross-repository sync is retired. See `DECISIONS/004-docs-in-monorepo.md`.
- Follow `apps/docs/DOCS_ARCHITECTURE.md` for page types, naming, navigation, and bilingual content requirements.
- Package docs are excluded from npm publish tarballs via `packages/<name>/.npmignore`.

## Fumadocs Structure

Each `packages/<name>/docs/` folder should follow:

```text
docs/
├── meta.json
├── index.mdx
├── index.ko.mdx
└── ...topic files...
```

- `meta.json` declares page metadata and navigation order.
- `*.mdx` is the English source; `*.ko.mdx` is the Korean translation.
- Both languages must stay in sync for consumer-facing packages.

## Bilingual README

- Each package has `README.md` (English) and `README.ko.md` (Korean).
- The two must stay in sync for public API, examples, and migration notes.
- README is the canonical documentation until a separate docs site covers a topic.

## Site Validation and Deployment

- Run `pnpm docs:test`, `pnpm docs:typecheck`, and `pnpm docs:build` from the root.
- Validate English and Korean routes, search, and package navigation.
- Do not edit generated content or maintain duplicate package MDX inside the app.
- Preserve the existing public URLs and verify the production deployment before changing its domain or repository connection.

## Docs Sync Checklist

- [ ] `packages/<name>/docs/` follows Fumadocs structure.
- [ ] `meta.json` exists and declares navigation.
- [ ] English and Korean MDX files are in sync.
- [ ] `packages/<name>/.npmignore` excludes `docs/`.
- [ ] Site changes live in `apps/docs`; package content remains in `packages/<name>/docs`.
