# ilokesto docs architecture guide

This document is the single source of truth for how official ilokesto package docs should be structured.

It exists to keep `store`, `state`, `utilinent`, and future package docs coherent as the package family grows.

Preserved from `ilokesto/docs` at `559cad3eb3d602f7a23734e2fece26b8bb88fbdc`.
In this workspace, edit package documentation in `packages/<package>/docs`;
`apps/docs` consumes those sources directly.

## 1. Core principle

The docs are package-first.

Each package should feel self-contained, but readers should still be able to predict the rhythm of a new section before they read it.

The goal is not to force every package into the same tree. The goal is to make every package feel like it belongs to the same family.

## 2. Default package rhythm

Every new package docs section should evaluate this baseline shape first:

1. `index`
2. `quick-start`
3. `mental-model` or an equivalent concept page
4. main guides and/or reference pages
5. optional sections only if the package truly needs them
6. advanced or internal notes only when they are meaningful

Packages do not need every optional section. They should only add structure when the content volume justifies it.

## 3. Landing page contract

Every package `index` page should try to answer these questions quickly:

- What is this package?
- What does it give me?
- What does it intentionally not do?
- What is the shortest useful example?
- Where should I go next?

An index page is not just an introduction. It is a routing page.

## 4. Page type meanings

### `index`

Use for package positioning and onward routing.

### `quick-start`

Use for the shortest successful path from install to a working example.

### `mental-model`

Use for the conceptual frame behind the API. Explain why the package looks the way it does.

### Reference pages

Use for exact API surfaces, behavior rules, or lower-level contracts.

### Guide pages

Use for usage patterns, decisions, and practical composition.

### Advanced / internals pages

Use for implementation-backed details that matter for power users or maintainers.

## 5. Category and mapping rules

### Prefer categories for

- Introduction
- Reference
- Guides
- Advanced
- Internals

These are reader-facing sections.

### Prefer mapping-style groups only when

- the subtree really has multiple sibling topics,
- readers are likely to browse inside that subtree,
- and the extra hierarchy reduces confusion rather than adding it.

Good examples:

- middleware families
- utility families
- integration families

Do not create a mapping when there is only one child page or when the nesting only repeats the same label.

## 6. Naming rules

Common page types should stay predictable across packages when they mean the same thing.

Preferred names:

- Introduction
- Quick Start
- Mental Model
- Reference
- Guides
- Advanced
- Implementation Notes

Domain-specific buckets are allowed after the intro pages when they fit the package better than generic buckets.

## 7. Cross-link rules

Cross-links should answer the reader's next natural question, not create a dense web of links everywhere.

Good patterns:

- `index` -> `quick-start`
- `index` -> `mental-model`
- `quick-start` -> key next concept page
- API page -> the guide or reference page that explains the important caveat
- deep-dive page -> the overview page it belongs to

Avoid linking for the sake of completeness alone.

## 8. Korean / English parity rules

- Korean pages must not be placeholders that redirect readers back to English.
- UI-facing labels should be Korean-only in Korean docs.
- API names stay in English.
- Concept labels should stay internally consistent within and across packages when they refer to the same kind of page.

English and Korean pages do not have to be word-for-word mirrors, but they should offer the same practical value.

## 9. When to add optional sections

Optional sections like `middleware`, `utilities`, `integrations`, or `extensibility` are justified only when:

- the package actually has that surface,
- it contains multiple distinct topics,
- and collapsing it into one page would make navigation worse.

## 10. Future scaling rule

As long as the package family remains small, keep the top-level docs structure package-first.

Only consider a larger product shell or top-level regrouping when:

- the package count grows significantly,
- framework-specific docs multiply,
- or readers repeatedly struggle to distinguish overview, guide, and reference content.

Until then, prefer consistency over hierarchy.

## 11. Quick checklist for new package docs

Before shipping a new package section, check:

- Does the landing page explain the package boundary?
- Is there a real quick-start path?
- Is there a concept page if the API shape needs one?
- Are guide pages separate from strict reference pages?
- Are optional sections justified by content volume?
- Do the onward links point to the next likely reader question?
- Are English and Korean pages both complete?
