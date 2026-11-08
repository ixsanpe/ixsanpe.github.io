#!/usr/bin/env python3
"""Check that the human view and the agent views of the site say the same thing.

The site keeps its content in four places (see README, "Humans and LLM agents"):
  1. PARTS in system.js          - the interactive portfolio
  2. .sys-static in index.html   - the plain-HTML portfolio list
  3. llms.txt                    - the Markdown summary for LLM tools
  4. JSON-LD in index.html       - schema.org Person data

This script fails (exit 1) when they drift apart:
  - every page in projects/ and talks/ is linked from system.js, .sys-static and llms.txt
  - every external link in system.js also appears in .sys-static and llms.txt
  - every link to this site in llms.txt or .sys-static points to a file that exists
  - every role in the Experience timeline appears in llms.txt
  - the JSON-LD parses and its jobTitle matches the current (first) role

Standard library only. Run from anywhere:  python3 tools/check_site_sync.py
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://ixsanpe.github.io/"

errors = []


def fail(msg):
    errors.append(msg)


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


index = read("index.html")
system_js = read("system.js")
llms = read("llms.txt")

m = re.search(r'<div class="sys-static">(.*?)\n            </div>\n        </section>', index, re.S)
if not m:
    sys.exit("check_site_sync: could not find the .sys-static block in index.html")
static = m.group(1)

static_links = set(re.findall(r'href="([^"#]+)"', static))
js_links = set(re.findall(r"\[\s*'([^']+)'\s*,", system_js)) | set(re.findall(r'href="([^"#$]+)"', system_js))
llms_links = set(re.findall(r"\]\((https?://[^)\s]+)\)", llms))
llms_local = {u[len(SITE):] for u in llms_links if u.startswith(SITE)}

# 1. every detail page is linked from all three views
pages = sorted(
    p.relative_to(ROOT).as_posix()
    for folder in ("projects", "talks")
    for p in (ROOT / folder).glob("*.html")
    if not p.name.startswith("_")
)
for page in pages:
    if page not in js_links:
        fail(f"{page} is not linked from system.js (PARTS)")
    if page not in static_links:
        fail(f"{page} is not linked from the .sys-static list in index.html")
    if page not in llms_local:
        fail(f"{page} is not linked from llms.txt (as {SITE}{page})")

# 2. external links in the interactive view also exist in the agent views
for url in sorted(u for u in js_links if u.startswith("http")):
    if url not in static_links:
        fail(f"{url} is in system.js but not in the .sys-static list")
    if url not in llms_links:
        fail(f"{url} is in system.js but not in llms.txt")

# 3. no dead links to this site
for path in sorted(llms_local | {u for u in static_links if not u.startswith(("http", "mailto:"))}):
    if path and not (ROOT / path).is_file():
        fail(f"link to {path} points to a file that does not exist")

# 4. experience roles appear in llms.txt
roles = [html.unescape(r).strip() for r in re.findall(r'<div class="what">\s*<h3>(.*?)</h3>', index, re.S)]
if not roles:
    fail("found no roles in the Experience timeline of index.html")
for role in roles:
    if role not in llms:
        fail(f'role "{role}" is in the Experience timeline but not in llms.txt')

# 5. JSON-LD is valid and current
ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', index, re.S)
if not ld:
    fail("no JSON-LD block in index.html")
else:
    try:
        person = json.loads(ld.group(1))
    except json.JSONDecodeError as e:
        fail(f"JSON-LD in index.html is not valid JSON: {e}")
    else:
        if roles and person.get("jobTitle") != roles[0]:
            fail(f'JSON-LD jobTitle "{person.get("jobTitle")}" does not match the current role "{roles[0]}"')

if errors:
    print("Site content is out of sync:\n")
    for e in errors:
        print(f"  - {e}")
    print("\nSee README.md, 'Humans and LLM agents', for where each piece lives.")
    sys.exit(1)

print(f"Site content in sync: {len(pages)} pages, {len(roles)} roles, JSON-LD ok.")
