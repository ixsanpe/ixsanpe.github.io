# ixsanpe.github.io

Personal portfolio of Ixeia Sánchez Périz — Senior SWE in Data & AI Systems.

## Structure

```
.
├── index.html             # Main page: hero, about, experience, portfolio, recognition, contact
├── style.css              # Design tokens (dark + light) and shared components
├── botanicals.js          # Line-art generator (ferns, leaf, edelweiss, pine, ridge)
├── system.css / system.js # Interactive 3D portfolio ("the system" of projects)
├── llms.txt               # Plain-text summary of the site for LLM agents (llmstxt.org)
├── DESIGN_SYSTEM.md       # Design system spec (incl. the extracted legacy system)
├── assets/                # Images
├── projects/              # Project detail pages (+ _template.html)
├── talks/                 # Talk pages
└── tools/                 # Generated-media sources (tools/sailor-video) and check_site_sync.py
```

## Adding a project

1. Add an entry to `PARTS` in `system.js` (title, status, description, tags, links).
2. Add a block for it in `MODULES` (position on the scene + its boxes) and its id to `TOUR`.
3. Optional: for a full write-up, copy `projects/_template.html` to `projects/your-project.html`, fill in the `[PLACEHOLDER]`s, and link it from the `PARTS` entry.
4. Add the project to the plain-HTML list (`.sys-static`) in the Portfolio section of `index.html`, and to `llms.txt`.

See `DESIGN_SYSTEM.md` §8 for details.

## Humans and LLM agents

The site has one set of content, written for both kinds of reader:

- **Interactive view** (`system.js`): what people see in a browser.
- **Plain-HTML list** (`.sys-static` in `index.html`): the same projects as static HTML with real links. It shows when JavaScript is off, and scrapers and LLM agents read it. `system.css` hides it once the `js` class is set on `<html>`.
- **`llms.txt`**: a Markdown summary at the site root (experience, projects, talks, contact) for LLM tools.
- **JSON-LD** (`<head>` of `index.html`): schema.org `Person` data such as job title, employer and profile links.

When you change experience or projects, update all four. Then check they agree:

```bash
python3 tools/check_site_sync.py
```

The same check runs in GitHub Actions on every pull request and push to `main` (`.github/workflows/check-site-sync.yml`). It fails if:

- a page in `projects/` or `talks/` isn't linked from `system.js`, the plain-HTML list and `llms.txt`
- an external link in `system.js` (code, video) is missing from the plain-HTML list or `llms.txt`
- `llms.txt` or the plain-HTML list links to a file that doesn't exist
- a role in the Experience timeline is missing from `llms.txt`
- the JSON-LD isn't valid, or its `jobTitle` doesn't match the current role

It checks links and role names, not wording, so read `llms.txt` over when you rewrite a description.

## Updating experience

Edit the `.timeline` (roles) and `.cv-side` (education, skills) blocks in the Experience section of `index.html`.

## Local development

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`.

## Deployment

Push to `main`. GitHub Pages deploys to `https://ixsanpe.github.io`.
