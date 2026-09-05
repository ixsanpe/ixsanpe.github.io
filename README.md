# ixeiasp.github.io

Personal portfolio site showcasing tech projects & initiatives.

## Structure

```
.
├── index.html             # Main page
├── style.css              # Shared styles (theme vars, nav, dark-mode toggle, footer)
├── assets/                # Images & files
├── projects/              # Project pages
└── talks/                 # Talk pages
```

## Adding a New Project

1. Copy `projects/_template.html` to `projects/your-project-name.html`.
2. Fill in the `[PLACEHOLDER]` text and image paths (comments in the file explain each section, including which blocks are optional).
3. Add a matching project card to the "Highlighted Projects" section in `index.html`, linking to your new file.

## Local Development

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`

## Deployment

Push to `main` branch. GitHub Pages auto-deploys to `https://ixeiasp.github.io`
