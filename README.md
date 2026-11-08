# ixsanpe.github.io

Personal portfolio of Ixeia Sánchez Périz — Senior SWE in Data & AI Systems.

## Structure

```
.
├── index.html             # Main page: hero, about, experience, portfolio, recognition, contact
├── style.css              # Design tokens (dark + light) and shared components
├── botanicals.js          # Line-art generator (ferns, leaf, edelweiss, pine, ridge)
├── system.css / system.js # Interactive 3D portfolio ("the system" of projects)
├── DESIGN_SYSTEM.md       # Design system spec (incl. the extracted legacy system)
├── assets/                # Images
├── projects/              # Project detail pages (+ _template.html)
├── talks/                 # Talk pages
└── tools/                 # Source for generated media (e.g. tools/sailor-video)
```

## Adding a project

1. Add an entry to `PARTS` in `system.js` (title, status, description, tags, links).
2. Add a block for it in `MODULES` (position on the scene + its boxes) and its id to `TOUR`.
3. Optional: for a full write-up, copy `projects/_template.html` to `projects/your-project.html`, fill in the `[PLACEHOLDER]`s, and link it from the `PARTS` entry.

See `DESIGN_SYSTEM.md` §8 for details.

## Updating experience

Edit the `.timeline` (roles) and `.cv-side` (education, skills) blocks in the Experience section of `index.html`.

## Local development

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`.

## Deployment

Push to `main`. GitHub Pages deploys to `https://ixsanpe.github.io`.
