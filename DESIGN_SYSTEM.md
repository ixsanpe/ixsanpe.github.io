# Design System — "Topo"

The portfolio is a mountain route rendered like a GPS / topographic map. An
animated contour map opens the page; a sticky route HUD (stage, elevation,
distance, elevation profile) tracks your progress while a signal-orange route
line draws itself through every project, talk and award up to the summit
(contact). Technical and calm: paper or night background, monospace data
labels, tight grotesk headlines with one italic serif accent.

Tokens: `style.css` · contour engine: `topo.js` · style guide: `design-system.html`.

> History: v1 "Summer Trail" (cartoon landscape) and v2 "Alpine Botanical"
> (line-art plants) were explored and replaced by this more technical direction.

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

1. **Map, not illustration.** Mountains appear as data: contours, coordinates, elevation.
2. **One signal colour.** Orange (`--accent`) marks only the route, live status and key emphasis.
3. **Movement with purpose.** Everything that moves tells you where you are (route, HUD, counters) or responds to you (contours under the cursor, card spotlight).
4. **Respect the reader.** `prefers-reduced-motion` stops all animation; content is readable with JS off.

## 2. Colour

| Token | Day | Night | Use |
|---|---|---|---|
| `--bg` | `#f4f3ee` paper | `#0b100d` | page |
| `--surface` / `--surface-2` | `#fbfaf7` / `#ecebe4` | `#111814` / `#17201b` | cards / tags |
| `--text` | `#0e1611` | `#e9ede6` | headings, body |
| `--text-muted` / `--text-subtle` | `#4b5650` / `#7a837d` | `#a3ada6` / `#6f7a73` | paragraphs / labels |
| `--border` | `#dcdbd2` | `#222d27` | hairlines |
| `--brand` | forest `#1f4d3a` | moss `#8fd1a8` | status dots |
| `--accent` / `--route` | signal `#d9481f` | `#ff6a3d` | route, live, italic accents |
| `--accent-ink` | `#b5370f` | `#ff8a63` | accent on small text (AA) |
| `--contour` + `--contour-alpha` | forest @ .16 | moss @ .11 | canvas contour lines (rgb triplet) |
| `--grid` | ink @ 5% | paper @ 4% | map grid |

## 3. Typography

- **Headlines:** Inter Tight 600, tracking −0.025 to −0.045em.
- **Accent:** Instrument Serif *italic* (`.serif`), one or two words per heading, in `--accent`.
- **Data / labels:** JetBrains Mono 400–500, uppercase, 0.68–0.82rem (`.mono`, `.eyebrow`, buttons, tags, HUD readouts).
- Scale: hero h1 `clamp(3rem, 7.4vw, 6.6rem)` · stage h2 `clamp(2.2rem, 4.4vw, 3.6rem)` · card h3 1.45rem · body ~1rem.

## 4. Shape, space, motion

- Radius: `--radius-sm` 8 (buttons, tags) · `--radius-md` 12 (images) · `--radius-lg` 18 (cards).
- Markers are 45° diamonds (summits on a map); reached markers fill orange.
- Spacing: `--space-1 … --space-24` (4px base).
- Easing: `--ease` `cubic-bezier(.22,1,.36,1)`.
- Motion inventory: contour morph + cursor peak (`topo.js`, ~30 fps, paused off-screen) · staggered hero entrance · typed role rotator · count-up stats · word-by-word heading reveal · card fade-up and pointer spotlight · stack marquee (pauses on hover) · scroll-drawn route with pulsing tip · live HUD.

## 5. Components

| Class | Description |
|---|---|
| `canvas[data-topo]` | Animated contour map. `data-summit="x,y"` (0–1), `data-scale`, `data-levels`. |
| `.map-label` | Corner coordinates / sheet info. |
| `.status` / `.status.live` | Pill with dot; `live` pulses orange (in-progress work). |
| `.btn` / `.btn.primary` | Mono uppercase buttons; primary is ink, turns orange on hover. |
| `.stats` / `.metrics` + `[data-count]` | Big numbers with mono captions; count up on view. |
| `.marquee` | Scrolling tech-stack band. |
| `.hud` | Sticky route panel: stage, elevation, distance, profile, stage links. Bottom bar on mobile. |
| `.stage` + `.marker[data-alt][data-stage][data-sec]` | Section header on the route. |
| `.wp` > `.card` | Waypoint card; `.card.project.wip` adds hatch for ongoing work. |
| `.tech-tag` | Mono tag. |
| `.log` | Dated list (recognition). |
| `.read-more` | Mono link with orange underline. |

## 6. The route

`index.html` reads every `.marker` in `#trail`, draws one path through them and
samples it. On scroll, the point 55% down the viewport sets the drawn length,
the tip, reached markers, the active nav item and the HUD (altitude is
interpolated between `data-alt` values; the profile is built from the same stops).

**Adding a project:** copy a `.wp` block in Stage 02 with a `.marker`
(`data-alt` between its neighbours, `data-stage` = short name, `data-sec="work"`)
and a `.card.project`. Use `.status.live` + `.wip` for work in progress.

## 7. Responsive

- ≤1000px: nav links hidden, single column, portrait above the name, HUD becomes a fixed bottom bar with a progress line.
- ≤480px: map labels hidden.
