# Design System — "Summer Trail"

The portfolio is a summer hike in the Alps. Visitors start in the valley (hero),
follow a trail up the page past waypoints (projects, talks, awards) and reach the
summit (contact). Tokens live in `style.css`; the live style guide is
`design-system.html`.

---

## 0. Extracted legacy system (before this redesign)

For reference, this is what the codebase used before "Summer Trail".

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

## 1. Concept

| Hike | Site |
|---|---|
| Valley & mountain panorama | Hero |
| Yellow Swiss signpost | Section heading / CTA |
| Trail (dashed dirt path) | SVG path connecting all content |
| Waypoint | A card (project, talk, job…) |
| Altitude | Progress indicator (altimeter + marker labels) |
| Vegetation belts | Page background: meadow → forest → rock → snow |
| Cairns | Awards (compact cards) |
| Summit cross | Contact |
| Summer night | Dark mode (moon, stars) |

## 2. Colour

**Primitives** (`style.css` §1): `sky`, `snow`, `granite`, `meadow`, `pine`,
`earth`, `sun`, plus alpine flowers `--gentian`, `--alpenrose` and the
`--trail-red` of white-red-white mountain-trail markers.

**Semantic tokens** — always use these in components:

| Token | Day | Night | Use |
|---|---|---|---|
| `--bg` | `#fbfaf4` | `#0f1d18` | page |
| `--bg-sunken` | meadow-100 | `#16271f` | tags, callouts |
| `--surface` | `#fff` | `#1a2e25` | cards |
| `--text` | pine-900 | `#eef3ea` | body |
| `--text-muted` | `#4c5a52` | `#b9c7bd` | secondary text |
| `--brand` | pine-500 | `#8cc79f` | icons, kind labels |
| `--accent` | sun-500 `#f6c431` | same | signposts, bullets, focus ring |
| `--link` | `#2f6b4f` | `#a8dcb8` | links |
| `--trail` / `--trail-walked` | earth-500 / trail-red | `#a07d55` / `#ff7a6b` | path |
| `--sky-*`, `--mtn-*`, `--snowcap`, `--sun-disc` | | | landscape illustration |
| `--zone-*` (index) | | | vegetation-belt background |

Text on `--accent` uses `--accent-ink` (`#3a2c00`) for contrast.

## 3. Typography

- **Display:** Fraunces 500/700 — headings, logo. Warm, slightly hand-cut like carved trail signs.
- **Body:** Work Sans 400–700.
- **Eyebrow** (`.post-date`, `.card-kind`): 0.75–0.8rem, 600–700, uppercase, `letter-spacing: .06–.08em`.
- Scale: h1 `clamp(2.4rem, 5vw, 3.75rem)` · stage h2 `clamp(1.8rem, 3.5vw, 2.5rem)` · card h3 1.35rem · body 0.95–1rem.

## 4. Space, shape, motion

- Spacing: 4px base, `--space-1 … --space-16`.
- Radius: `--radius-sm 6` · `--radius-md 12` · `--radius-lg 20` (cards) · `--radius-pill`.
- Shadows: `--shadow-sm` resting, `--shadow-md` hover/floating.
- Easing: `--ease-trail` `cubic-bezier(.22,1,.36,1)`; cards lift 4px on hover, reveal from 24px below.
- `prefers-reduced-motion` disables all animation.

## 5. Components

| Class | Description |
|---|---|
| `.signpost` | Yellow arrow-shaped sign; optional `.time` ("1:20 h"). |
| `.blaze` | White-red-white trail marker. |
| `.stage` | Section header: title left, signpost pole on the trail, sign right. |
| `.waypoint.left/.right` | Two-column row; card on one side, `.marker` on the trail. |
| `.marker[data-alt][data-stage]` | Trail dot with altitude label; turns yellow when `.reached`. |
| `.card` / `.card.feature` / `.card.cairn` | Default, highlighted (yellow top edge), compact (awards). |
| `.card-kind` | Icon + eyebrow ("Waypoint · Work"). |
| `.tech-tag` | Pill tags. |
| `.chip`, `.social-link` | Glassy pills/buttons over the landscape. |
| `.altimeter` | Fixed progress pill: current altitude + stage. |
| `.summit` | Summit cross + contact cards. |
| `.highlight-box` | Field-note callout (subpages). |
| `footer` | Pine-green with a jagged ridge top edge. |

## 6. The trail (how it works)

`index.html` measures every `.marker` inside `#trail`, draws one smooth cubic
path through them (`.trail-bed`, `.trail-dash`, `.trail-walked`) and rebuilds on
resize. While scrolling, the walked portion and the hiker follow the point 60%
down the viewport; markers passed get `.reached`, and the altimeter interpolates
`data-alt` between markers.

**Adding a project:** copy a `.waypoint` block into the Projects stage, alternate
`left`/`right`, give the marker a `data-alt` between its neighbours and a
`data-stage` name. The trail redraws itself.

## 7. Responsive

- ≤1080px: margin decorations hidden.
- ≤820px: single column; trail runs down the left edge (x≈28px), cards to its right; altitude labels move into the altimeter.
- ≤520px: compact nav.
