# TODO

- [ ] **Review focus points.** The "Focus" card in the About section of `index.html`.
- [ ] **Review skills and classify them by topic.** The Skills tags in the Experience sidebar (`.cv-side` in `index.html`) are one flat list; group them, e.g. languages & data, ML & training, infra & cloud, LLM systems. Update the JSON-LD `knowsAbout` and the Skills line in `llms.txt` to match.
- [ ] **Fix "← Back to Portfolio" footer link.** It goes to the top of the homepage (`../index.html`) instead of the Portfolio section. Change it to `../index.html#portfolio` in:
  - `projects/sailor-llm.html`
  - `projects/fitness-rag.html`
  - `projects/_template.html`
