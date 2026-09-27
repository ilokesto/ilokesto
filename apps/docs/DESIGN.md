# Documentation design

## Existing system

Use the existing Fumadocs neutral theme, Tailwind utilities, package color
metadata, and ilokesto logo. The site supports light and dark themes. Do not
introduce a second theme or font system.

## Reader journey

Home explains the toolbox, demonstrates a small real API, groups all eight
packages by user task, and explains the two adjacent package choices.
Each package exposes separate introduction and quick-start links.
Package documentation remains package-first.

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
