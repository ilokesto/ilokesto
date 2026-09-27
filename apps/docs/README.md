# Official ilokesto documentation

This private Next.js 16 / Fumadocs application was imported from
`ilokesto/docs` at `559cad3eb3d602f7a23734e2fece26b8bb88fbdc`.
It is part of the root pnpm workspace, not an independently installed project.

## Development

Use Node.js 22 and the root pinned pnpm version:

```sh
pnpm install --frozen-lockfile
pnpm docs:dev
```

Open `http://localhost:3000/en` or `/ko`. All eight package sections use
`/<language>/<package>` without a `/docs` prefix.

## Content

Follow [the documentation architecture guide](./DOCS_ARCHITECTURE.md) for
page types, navigation, naming, and English/Korean parity.

Edit `packages/<package>/docs`, not this application. `source.config.ts`
defines a direct Fumadocs collection for each package. `lib/source.ts`
prefixes collection paths with the package name to preserve public URLs.
English `.mdx` and Korean `.ko.mdx` pages share their package metadata.
Fumadocs watches these source directories during development.

Package index routes use the illustration-led presentation in
`components/landings`, with original assets in `public/illustrations`.
Each index links to its quick-start document in the standard documentation
layout. The canonical package MDX remains the source for metadata, search,
Markdown and full documentation content; it is not copied into the app.

Interactive implementations live in `components/demos` and import the real
workspace packages. Each is loaded separately in the browser. `DemoFrame`
provides the floating controls and core-code panel; Store has a compact
counter-specific composition. JavaScript-free visitors retain the index
overview and documentation link, and full examples in the detailed docs.

`pnpm docs:dev` and `pnpm docs:typecheck` prepare the package distributions.
`pnpm docs:build` builds the documentation and its workspace dependencies in
dependency order, including on Vercel. If you edit package source while the
documentation dev server is running, run `pnpm docs:prepare` to refresh the
distributions used by demos.

Site layout, search, localization, and route handlers live here. There is
no copied or generated package-content directory to edit or synchronize.

## Verification

### Opt-in Store publication pilot

The ordinary commands retain the existing main-tracking site. The pilot freezes
only Store at the verified npm `1.1.2` artifact:

```sh
pnpm docs:build:store-pilot
pnpm docs:test:store-pilot
pnpm docs:start
```

Store 1.1.2 was current at pilot startup. A concurrent npm publication has since
moved Store to 2.0.0. The timestamped registry inventory is refreshed separately;
the older pilot remains fixed to prove isolation. The first production rollout
must use the then-current verified inventory, not promote this pilot unchanged.

Or run `pnpm docs:dev:store-pilot` while editing. The
`NEXT_PUBLIC_STORE_DOCS_PILOT=1` switch is compiled into the pilot build; the
server does not need it at startup. Normal and pilot builds share `.next`, so
stop an existing server before rebuilding and always pair a build with its
matching test command. Run `pnpm docs:build` to restore the ordinary build.

In pilot mode:

- `/en/store` and `/ko/store` use the frozen runtime and release READMEs.
- `/en/store/next` and `/ko/store/next` track current workspace docs/runtime.
- The matching `quick-start` pages expose the two sources separately.
- Default search and LLM exports contain only the verified Store corpus.
  `/api/search/next` and `/llms-next.txt` expose development sources.
- Explicit next Markdown/OG routes remain available and carry `noindex`;
  development HTML also carries robots metadata.
- Other packages still track main and are identified as development content.

The original README bytes and runtime are under `docs-publication/snapshots`.
The verifier runs before docs install/build/dev/typecheck, rejects modified or
mismatched inputs, and generates renderer files outside the app. No current
Store guides are backfilled into the `1.1.2` snapshot. See
[`docs-publication/README.md`](../../docs-publication/README.md) and
[`DECISIONS/006-release-aligned-docs-pilot.md`](../../DECISIONS/006-release-aligned-docs-pilot.md).

This is not a production cutover. Do not enable the pilot switch in production;
current-baseline snapshots (including Store 2.0.0), complete dependency closures,
and documentation promotion automation are not implemented.

### Ordinary site checks

```sh
pnpm docs:build
pnpm docs:typecheck
pnpm --filter @ilokesto/docs exec playwright install chromium
pnpm docs:test
pnpm docs:start
```

The build requires network access for the existing Google Inter font.
The root build, typecheck, and test commands also include this application.
The HTTP regression tests start an isolated production server, so build before
running them. They also exercise the interactive examples in Chromium.
The existing CI browser installation covers this dependency.
Run root typecheck and tests sequentially: some existing package
tests rebuild shared distribution files.

Machine-readable routes include `/llms.txt`, `/llms-full.txt`, and
`/llms.mdx/docs/<language>/<package>/<page>/content.md`.
Open Graph images use `/og/docs/<language>/<package>/<page>/image.webp`.
For a package index, omit `<page>`.

## Deployment

The application is private and excluded from npm releases. The existing Vercel
`docs` project serves `https://ilokesto.ayden94.com` from this workspace.
Its root directory is `apps/docs`, with source files outside that directory
enabled and Node.js 22 selected. From the application directory, Vercel runs:

```sh
cd ../.. && pnpm install --frozen-lockfile
cd ../.. && pnpm docs:build
```

The install and build commands run independently from the application directory.
Keep the root lockfile and package documentation available to both.
Do not configure a static-export output directory or restore the legacy
cross-repository sync workflows. See
[`DECISIONS/004-docs-in-monorepo.md`](../../DECISIONS/004-docs-in-monorepo.md)
for deployment configuration and rollback information.
