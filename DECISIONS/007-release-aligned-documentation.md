# Release-aligned public documentation

## Decision

The Store-only pilot in decision 006 is replaced by a complete publication
manifest for all eight packages. Normal public routes use frozen, verified
release documentation and npm runtimes. Explicit package `/next` routes retain
main-tracking authoring and workspace examples. The approved industrial design
and bilingual public route shapes remain unchanged.

## Boundaries

- `packages/<name>/docs` remains the authoring source. Immutable revision
  archives live under `docs-publication/releases`, outside the documentation app.
- Package versions are independent. A publication entry names its npm release,
  original release commit, corrected docs commit, revision and receipt hash.
- Registry observations are not active publication pointers. A moving dist-tag
  cannot relabel an existing snapshot.
- API-bearing example code and helpers are frozen too. Only API-neutral
  presentation/CSS is shared with the current app; a transitive-import guard
  enforces that boundary.
- The private runtime workspace and committed lock/closure use real npm
  artifacts, not same-version workspace packages. Installed file hashes and
  React/Overlay instance identity are checked before build.
- Public search, LLM, Markdown and OG use released content. Explicit development
  surfaces are separate and noindexed. No missing release page falls back to main.

## Publication control

Capture is not promotion. Capture validates registry and Git source evidence and
creates a candidate. Promotion requires complete immutable snapshots, a matching
runtime closure and compare-and-swap of the previous active manifest.
Production changes continue through the existing protected-main CI/PR gate and
Vercel deployment connection. No npm release or cross-repository synchronization
is added by this change.

Builds are self-contained after dependency installation: receipt hashes and
archived inventories are checked without relying on a shallow checkout's Git
history. Git objects are required while capturing new revisions, not while
rendering an already-approved publication.

## Initial trust and limits

The eight current artifacts were audited against publish checkout `ecd9709…`,
annotated tags, original tarball SRI, manifest/README bytes and distribution
comparisons. They do not expose npm source attestations. This is explicitly
operational evidence, not a claim of cryptographic commit provenance. Original
release prose is retained alongside corrected revision `fc8bd47…`.

Historical browsing is not introduced. Old immutable inputs remain available
for integrity tests and rollback. Rollback switches the retained previous
Vercel deployment without rebuilding or changing npm. The maintenance procedure
is in `docs-publication/README.md`.
