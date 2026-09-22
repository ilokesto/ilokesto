# Official documentation in the monorepo

## Decision

The official Next.js/Fumadocs site lives in `apps/docs` as the private
`@ilokesto/docs` workspace. Package documentation remains canonical in
`packages/<name>/docs`. Do not maintain a second editable copy in the site.

This supersedes the separate documentation repository boundary in decision 002.
The playground remains outside this workspace. Package versions and npm release
order are unchanged; private workspaces are neither versioned nor tagged by
Changesets.

## Local validation

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm docs:build
pnpm docs:typecheck
pnpm docs:test
pnpm docs:start
```

Validate English and Korean package pages, navigation, search, and machine-readable
documentation before switching production. Preserve existing public URLs.

## Production deployment

Production switched to the monorepo on 2026-09-22 after explicit approval and
preview verification. The existing Vercel `docs` project in
`jeong-jinhos-projects` retains both public domains:

- `ilokesto.ayden94.com`
- `docs-omega-roan-17.vercel.app`

Vercel project settings:

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root directory | `apps/docs` |
| Source files outside root directory | Enabled |
| Skip unaffected projects | Disabled; package MDX lives outside `apps/docs` |
| Node.js | `22.x` |
| Install command | `cd ../.. && pnpm install --frozen-lockfile` |
| Build command | `cd ../.. && pnpm docs:build` |
| Output directory | Framework default; no static export |

Both commands start independently in `apps/docs`. The workspace root pins pnpm
and owns the lockfile. Changes to `packages/*/docs` must trigger site builds even
though those files are outside the application directory.

The Vercel GitHub app must have access to `ilokesto/ilokesto`, and the project's
Git connection must use that repository with production branch `main`.
Project settings and GitHub app repository access are external configuration;
inspect them before changing deployment behavior.

## Verification and retirement

The transition verified all 318 canonical English/Korean document routes,
including every one of the old site's 274 routes. Both languages passed home
navigation, search, Markdown, and Open Graph image checks. `/llms.txt` and
`/llms-full.txt` remained available without redirects.

The first verified monorepo production deployment is
`dpl_2HiWCL1JBqb2Mg1GcvEP6kBzDkVc`, built from commit
`7e4c5380aa9585ae038bb9faae106f99f771c708` with Node.js 22.
The legacy deployment `dpl_BsfgXmrTTz9nvR2U89uf22Agat88` remains available for
rollback; do not delete it as part of repository cleanup.

Cross-repository documentation-sync workflows are retired. Remove the unused
`DOCS_SYNC_TOKEN` repository secret and delete `ilokesto/docs` only after the
monorepo production deployment is verified and its Git connection is established.
The old repository's documentation architecture guide is preserved in
`apps/docs/DOCS_ARCHITECTURE.md`; its open sync PRs contain only documentation
already retained in the monorepo's source or history.

Do not publish the documentation application to npm.
