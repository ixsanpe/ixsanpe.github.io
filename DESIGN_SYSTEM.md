# Design System — "Alpine Botanical" (v2.1)

The portfolio is a quiet walk up a mountain. A single fine line draws itself as you scroll and
links every section, from the intro to contact. The look is editorial and calm: cream paper, sage & sand
organic shapes, fine burgundy line-art of alpine plants, and a neutral sans-serif (Inter).

Tokens live in `style.css`, the line art in `botanicals.js`, the live style
guide in `design-system.html`.

> History: v1 "Summer Trail" (cartoon landscape) felt too playful; v3 "Topo"
> (animated contour map, mono type) felt too long and busy. v2.1 keeps the
> botanical look with neutral type, a shorter page and no hiking copy — the
> trail is purely visual.

---

## 0. Extracted legacy system (before this redesign)

For reference, this is what the codebase used before the redesign.

| Token | Light | Dark |
|---|---|---|
| `--primary-color` | `#7b9ab8` dusty blue | `#6b8fb0` |
| `--secondary-color` | `#5d7a99` | `#7a9fc0` |
| `--accent-color` | `#9ab5ce` | `#b8a8d8` lavender |
| `--text-dark` | `#2d3748` | `#e2e8f0` |
| `--text-light` | `#4a5568` | `#cbd5e0` |
| `--bg-light` | `#f0f4f8` | `#1a202c` |
| `--bg-white` | `#ffffff` | `#2d3748` |
| `--border-color` | `#cbd5e0` | `#4a5568` |
| Links (hard-coded) | `#8b7aa8` / hover `#7a6997` | `#e0d4f7` / `#f0e8ff` |

- **Type:** system sans stack only; h1 3rem, section h2 2.5rem centered, card h3 1.25–1.5rem.
- **Shape:** 12px radius cards, 8px buttons/images, 50% avatars.
- **Elevation:** `0 10px 25px rgba(0,0,0,.1)` on hover, cards lift `translateY(-5px)`.
- **Layout:** 1200px container, 4rem section padding, single 768px breakpoint.
- **Components:** fixed nav, gradient hero, about/project/talk/contact cards, bullet award list, tech-tag pills, dark-mode toggle, footer.
- **Issues found:** link colours hard-coded per page, many inline styles, no type scale or spacing scale.

The legacy variable names are kept as **aliases** of the new semantic tokens so
existing subpages keep working.

---

## 1. Principles

1. **Paper, not screen.** Warm cream backgrounds, no drop shadows, no gradients.
2. **One line.** The trail is the only strong line on the page; everything else is soft shape.
3. **Organic, not cute.** Blobs and botanicals are decoration in the margins, never behind body text.
4. **The hike is implied.** No hiking copy; the line, pins and plants carry the theme.

## 2. Colour

| Token | Day | Night | Use |
|---|---|---|---|
| `--bg` | cream-100 `#f1ece4` | `#161d19` | page |
| `--surface` | cream-50 `#f8f5ef` | `#1f2923` | cards |
| `--text` | forest-900 `#1f2d24` | `#ece6dc` | headings, body |
| `--text-muted` | `#56635a` | `#b4b2a8` | paragraphs |
| `--text-subtle` | `#7d877f` | `#8c8f86` | eyebrows, meta |
| `--accent` / `--line` / `--link` | wine-700 `#6b1f2a` | rose `#d9a29b` | trail, line art, links, accent word |
| `--shape-sage` | sage-300 `#b9c7b4` | `#34473a` | blobs, reached pins |
| `--shape-sand` | sand-300 `#dcc3b1` | `#4a3a32` | blobs, pins |
| `--border` | `#ddd5c8` | `#2f3b33` | hairlines |

Primitives: `--cream-*`, `--sage-*`, `--sand-*`, `--forest-*`, `--wine-*`.

## 3. Typography

- **One family:** Inter. Headings 500 with tight tracking (−0.03em; hero −0.045em); body 300–400; UI 500.
- **Accent:** one word in `--accent` colour (no italics), e.g. the surname in the hero.
- **Eyebrow** (`.eyebrow`, `.post-date`, `.card h4`): 0.7rem, 500, uppercase, `letter-spacing: .16–.18em`, `--text-subtle`.
- Scale: hero h1 `clamp(2.8rem, 6.4vw, 5.4rem)` · section h2 `clamp(2.1rem, 4vw, 3rem)` · card h3 1.45rem · body ~1rem.
- **Copy:** plain and professional; the mountain theme lives in visuals only.

## 4. Shape, space, motion

- Radius: cards `--radius-lg` 28px, images `--radius-md` 14px, pills `--radius-pill`.
- Blobs: `--blob-a/b/c` are organic `border-radius` values used on `.blob`, the portrait and pins.
- Spacing: `--space-1 … --space-24` (4px base); sections breathe with 6rem stage padding.
- Motion: `--ease` `cubic-bezier(.22,1,.36,1)`. Trail draws with scroll, cards fade up 28px, links lengthen on hover. `prefers-reduced-motion` turns it all off.

## 5. Components

| Class | Description |
|---|---|
| `.blob` / `.blob.sand` / `.blob.soft` | Organic background shapes. |
| `svg.botanical[data-kind]` | Line art drawn by `botanicals.js`: `fern`, `leaf`, `edelweiss`, `pine`, `ridge`. Options via `data-opts` JSON, `data-seed`, `data-stroke`. |
| `.stage` | Section header: dot pin, number eyebrow, h2. |
| `.waypoint.left/.right` + `.pin` | Card on one side, numbered sand pebble on the trail; pebble turns sage when reached. |
| `.card` / `.feature` / `.compact` | Default, with a corner blob, and smaller (recognition). |
| `.text-links` | Uppercase underlined links (hero socials). |
| `.read-more` | Uppercase accent link with arrow. |
| `.tech-tag` | Hairline pill. |
| `.contact-list` | Large rows with meta on the right ("Get in touch"). |
| `.chip` / `.chip.live` | Small status pill; `live` pulses (work in progress). |
| `.log` | Year + one-line list (recognition). |

## 6. The trail

`index.html` collects every `.marker` inside `#trail` and draws one path through
them: vertical S-curves when pins are aligned, wide horizontal swings when they
alternate sides (like a hand-drawn journey line). A faint dotted copy shows the
route ahead; the solid line and its tip follow the point 62% down the viewport.

**Adding a project:** copy a `.waypoint` in the Projects stage, alternate
`left`/`right`, renumber the pins. The trail redraws itself.

## 7. Responsive

- ≤1100px: margin blobs and botanicals hidden.
- ≤860px: nav links hidden, portrait above the name, single column; the trail runs down the left edge with pins at x≈24px.
