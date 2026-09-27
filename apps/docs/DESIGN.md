# Documentation design

## Existing system

Use the existing Fumadocs neutral theme, Tailwind utilities, package color
metadata, and ilokesto logo. The site supports light and dark themes. Do not
introduce a second theme or font system.

## Reader journey

Home explains the whole toolbox, groups all eight packages by user task,
shows how the packages relate, and explains the two adjacent package choices.
Each package exposes separate introduction and quick-start links.
Package indexes are the hands-on entry point: each offers a working example
using that package, its corresponding code, and onward documentation links.
Package documentation remains package-first; the overall homepage does not
privilege one package with its own interactive or static API tutorial.

## Tokens and typography

- Surfaces and text: `fd-background`, `fd-card`, `fd-accent`, `fd-foreground`,
  `fd-muted-foreground`, `fd-border`, and `fd-primary`.
- Focus: `fd-ring`; visible keyboard rings are required.
- Package accents: existing `packageMetadata` colors, never new brand colors.
- Code: neutral-950 background, neutral-200 foreground, fuchsia-300 keywords,
  emerald-300 strings, amber-300 numbers.
- Body: the application's inherited font, `text-sm` or `text-base`, generous
  line height. Code uses the inherited monospace stack.
- Display: responsive 4xl/5xl/6xl headline; section headings 3xl/4xl;
  balanced headings and Korean `break-keep`.

## Layout and primitives

- Content is centered in `max-w-7xl` with responsive 5/8/10-unit gutters.
- Hero stacks on small screens and becomes a two-column grid on large screens.
- Package cards use the same description, accent, and two-link anatomy.
- Card grids use one, two, then up to three columns according to available width.
- Borders are neutral; tonal backgrounds distinguish hover states.
- Section spacing uses the Tailwind 16/20/24 scale. Rounded surfaces use the
  existing 2xl/3xl scale.
- The document owns vertical scrolling; code blocks own horizontal overflow.

## Interactive package examples

- Reuse a shared `DemoFrame`: localized title/instructions, live controls and
  result, then the code for that interaction. At wide article widths these
  areas may sit side by side; mobile uses one column.
- Use the existing Fumadocs tokens and package accent, not stock photographs or
  a new brand. Numeric examples use tabular figures and a clear result area.
- Controls have at least 44px target height, visible focus rings, disabled
  states, and associated input labels. Announce results with an appropriate
  live region; validation errors are attached to their fields.
- Every example is resettable or reversible, scoped to its mounted instance,
  and cleans up subscriptions, requests, overlays, and timers on unmount.
- Actual package APIs drive the interaction. Code shown beside an example must
  describe the same operation; presentation-only markup may be omitted.
- HTTP examples use a same-origin demonstration endpoint with deterministic
  success/error responses, clearly labeled as demo data. No external account,
  third-party availability, or real user data is required.
- Load package demo code only where needed. Static documentation and the
  ecosystem overview must not eagerly execute all eight packages.

## Interaction and accessibility

Use native links and buttons. Preserve a single page H1 and ordered heading
levels. Mark decorative icons as hidden from assistive technology. Do not
turn a multi-link card into a nested link.

Motion is limited to hover color/opacity feedback; no decorative animation.
Check keyboard focus, theme switching, and language navigation in addition
to pointer use. Korean explanatory labels are localized; API names remain
unchanged.

## Verification

Review English and Korean at mobile, tablet, and desktop widths. Check the
hero, complete package groups, comparison section, code scrolling, and all
navigation controls. Retain rendered screenshots and route-test evidence
under the task's local `.omo/evidence` directory.

## Accepted constraints

This change retains Fumadocs' shared navigation and documentation components.
It does not redesign package APIs, release channels, or deployment behavior.
