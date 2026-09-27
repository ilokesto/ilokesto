# Versioned documentation publication inputs

This directory stores immutable release inputs separately from current package documentation.

## Active publication

`active.json` selects one exact npm version and documentation revision per
package. The initial production selection is Store, State, Form, Overlay,
Modal and Toast 2.0.0; Fetcher 1.0.0 on the beta channel; Utilinent 1.2.0.
Fetcher latest still points to 1.0.0-beta.1: installation output is pinned to
1.0.0 rather than silently following latest.

Each `releases/<package>/<version>/r<revision>` archive contains the original
release corpus, a separately identified corrected documentation revision,
frozen API-bearing examples/helpers, original npm tarball and a receipt.
`active.json` pins the receipt SHA-256; the receipt pins every archived file.
The 338-page bilingual corpus comes from the actual publication checkout
`ecd9709b76d1976ec86865314e85b916f220c818`, with corrected release framing at
`fc8bd4755137b75767284dbe84a0774185dfbdde`.

These npm versions have registry signatures but no npm gitHead/source
attestation. Workflow records, annotated tags, manifest/README matching and
distribution comparisons support the source association. The receipts retain
that limitation and the observed State publication timestamp anomaly; they
do not claim cryptographic source provenance.

Public MDX and executable example files are generated outside `apps/docs`.
Only installation commands and parsed executable import specifiers are adapted;
displayed code strings are preserved. Missing or modified inputs fail closed.
Builds verify checked-in bytes and do not need Git history or registry access
after a frozen dependency install.

The private `runtime` workspace installs exact npm aliases. Its committed
closure records the executed React dependency graph, including shared
React/ReactDOM, ky and icons. Verification rejects workspace package paths,
peer-instance splits, lock drift, modified installed npm files and package API
imports through shared presentation components. Optional non-React adapters are
not part of this example environment.

## Review and promote

Promotion is explicit, never a side effect of a main-branch documentation edit.

1. Verify a newly published version, its source commit, tarball and documented
   API. Append a reviewed `name@version` trust record to `RELEASE_CATALOG` in
   `scripts/docs-publication/catalog.mjs`; retain old records. Packages may use
   different release commits. Pin the evidence report hash and preserve any
   provenance limitations.
2. Commit canonical documentation corrections. The selected package's runtime
   source, manifest and build files must match its release commit. If current
   main has incompatible source changes, prepare the docs revision on that
   release's source instead of copying newer APIs into old documentation.
3. Capture a candidate with explicit immutable inputs:

   ```sh
   pnpm docs:publication:capture --package store \
     --release-commit <full-release-commit> \
     --docs-commit <full-docs-revision-commit> --revision <next-revision> \
     --provenance-report <reviewed-evidence-report>
   ```

   Capture verifies exact npm metadata/SRI and annotated tag identity, archives
   Git objects, and refuses to overwrite different bytes at an existing
   revision. It changes `candidate.json`, not `active.json`.
4. Update runtime npm aliases and the pnpm lockfile to the reviewed candidate.
   Record and verify its dependency closure explicitly:

   ```sh
   pnpm install --no-frozen-lockfile
   node scripts/docs-runtime.mjs record docs-publication/candidate.json
   node scripts/docs-runtime.mjs verify docs-publication/candidate.json
   node scripts/docs-publication.mjs status
   pnpm docs:publication:promote --expected-current <activeHash>
   ```

   Promotion verifies the candidate and runtime before replacing the active
   manifest. A publication lock and expected-current hash reject concurrent or
   stale updates. `none` is valid only for an initial bootstrap. If a process
   crashes while holding `.publication.lock`, establish that no capture or
   promotion is running before removing that stale local lock.
5. Run `pnpm docs:typecheck`, `pnpm docs:build`, `pnpm docs:test`,
   `pnpm test:monorepo`, and real bilingual browser checks. Review the active
   manifest, snapshots, runtime receipt, aliases and lockfile as one change.
   Commit through the protected-main PR/required-verify gate. Only a merged,
   verified commit is eligible for the existing Vercel production deployment.

The tools never invoke npm publishing. A package release alone does not update
public docs. Current authoring stays under `packages/<name>/docs` and is visible
under `/en|ko/<name>/next` until a documentation publication is approved.

## Rollback

Record the previous and candidate Vercel deployment IDs with each rollout.
If production verification fails, use Vercel's rollback/promote operation to
restore the retained previous successful deployment, then verify the official
domain again. This switches the complete already-built document/runtime set
without rebuilding against newer dependencies or changing npm.

For a source-controlled rollback, select the previous complete manifest and its
matching runtime aliases, closure and lockfile in a reviewed PR. Do not mutate
or delete old snapshots, mix a previous manifest with a newer dependency graph,
or change production domains/repository linkage.

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
