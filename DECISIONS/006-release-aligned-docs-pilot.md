# Release-aligned documentation: Store pilot

## Status and scope

The user selected current npm versions as the initial documentation baseline.
This first increment is a local, opt-in Store pilot, not a production switch.
It publishes no package, changes no release workflow, and does not claim that
the other seven package documentation sets are release-aligned.

## Publication inputs

`docs-publication/registry-baseline.json` records exact registry versions,
dist-tags, tarball integrity, publication times and available gitHead values for
all eight packages. A registry observation is not documentation approval; absent
gitHead values remain null rather than being guessed from main.

The observation is timestamped and refreshable. During this implementation,
another authorized publication moved six packages to 2.0.0, Fetcher beta to
1.0.0, and Utilinent to 1.2.0. The inventory reflects those versions.
`pilot-release.json` separately retains Store 1.1.2 as the immutable isolation
pilot; it does not label that historical artifact as the current latest release.
Production rollout must start from the then-current verified registry baseline.

Store 1.1.2 shipped only a bilingual README corpus. The complete five-file npm
payload is retained byte-for-byte with a receipt and file hashes. Its runtime
has no dependencies. The published counter imports that frozen runtime
directly, not the workspace package. Runtime tests distinguish 1.1.2's fail-fast
listener behavior from the current 2.0 behavior.

The read-only archive survives repository history rewrites and requires no
registry request during a build. Generation validates identity, inventory and
hashes first and fails rather than selecting current-main content.

## Source and routing boundary

Author current docs in `packages/<name>/docs` as before. The historical npm
payload is not a second editable documentation tree. Renderer adaptation lives
outside it and only adds metadata, version-pinned installation commands and
site language links. Generated MDX is ignored and lives outside `apps/docs`.

The opt-in build switch is `NEXT_PUBLIC_STORE_DOCS_PILOT=1`. With it:

- unversioned Store entry/quick-start URLs use the verified release corpus;
- Store's current canonical docs move under the explicit `/store/next` prefix;
- other packages remain visibly development-only in this pilot;
- the default discovery source contains only published Store pages;
- development search/LLM sources are separate; explicit next HTML, Markdown and
  OG output is noindexed;
- a channel switch preserves a matching page, or returns to that channel's
  index when the old release has no counterpart;
- a main-only Store guide is not silently served as a released page.

Without the switch, current routes, runtime imports and discovery remain
main-tracking. Build and test both modes before integration. This leaves the
existing production deployment policy untouched.

## Follow-up work before production rollout

1. Verify and snapshot all eight current-baseline documentation corpora,
   including Store 2.0.0; retain the 1.1.2 isolation proof as historical input.
2. Freeze their runtime dependency closures; Store's dependency-free artifact
   does not prove that older Form/Overlay/Modal/Toast can use workspace peers.
3. Generalize the Store pilot resolver into a complete per-package publication
   manifest once those inputs are verified.
4. Add publication receipts, registry-confirmed promotion, document revisions,
   serialization/retry/rollback behavior and controlled production deployment.
5. Connect documentation promotion to confirmed package publication. The initial
   audit found missing npm-publish wiring; a separate authorized task subsequently
   added the dispatch-only workflow in PR #98 and published the new versions.
   This pilot neither changes nor invokes that workflow.

No historical versions are fabricated from current docs. An archive selector
can be added after verified snapshots exist.
