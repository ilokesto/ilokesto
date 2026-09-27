# Versioned documentation publication inputs

This directory stores immutable release inputs separately from current package documentation.

## Store 1.1.2

`docs-publication/snapshots/store/1.1.2/package` is the complete five-file npm payload for `@ilokesto/store@1.1.2`. Do not edit, format, or rebuild files in that directory. `receipt.json` records the npm provenance, expected payload inventory, byte counts, and SHA-256 hashes. The immutable pilot identity is independently pinned in `pilot-release.json`.

`registry-baseline.json` is a separately refreshable, timestamped observation of current npm channels. It is not an active publication manifest. New npm versions must not change the identity or label of an existing snapshot. Store 1.1.2 was current when the pilot started; concurrent publication has since moved Store's latest channel to 2.0.0. The older artifact remains the explicit isolation pilot, not a claim to be latest.

Verify the pilot identity, receipt, package identity, inventory, and hashes, then generate renderer inputs with:

```bash
node scripts/store-docs-snapshot.mjs
```

The command fails instead of falling back to current-main docs when any identity or payload check differs. On success it replaces `docs-publication/.generated/store-1.1.2` with deterministic files:

- `index.mdx` and `index.ko.mdx`: release metadata and a link to the frozen quick start;
- `quick-start.mdx` and `quick-start.ko.mdx`: renderer adaptations of the shipped READMEs;
- `meta.json`: navigation order.

Renderer adaptation leaves the snapshot untouched. It adds frontmatter, rewrites only the README language links for site routing, and pins installation commands to `@ilokesto/store@1.1.2`; package import specifiers remain unchanged. No separate historical guide corpus or documentation assets existed in this release, so current-main package docs must not be copied into the generated release pages.

The script also exports `verifyStoreDocsSnapshot({ rootDir })` and `materializeStoreDocsSnapshot({ rootDir })` for tooling and isolated tests.
