# Counsellor Directory usability test

Two static prototypes of the same counsellor directory, used to compare two ways of setting preferences:

- **Prototype A** (`modal/`): preferences open in a modal. Full screen on phones.
- **Prototype B** (`sidebar/`): preferences sit in a sidebar. A slide-in drawer on phones.

Both use the same fictional counsellors (`Counsellor 01`–`24`), preferences, defaults, validation and a simple demo ranking (`shared/matching.js`). There is no backend, no network call, no analytics and no storage. Use **Reset session** or refresh the page to start again.

## Run locally

```bash
python3 -m http.server 8100 --bind 127.0.0.1
```

Open http://127.0.0.1:8100/.

## GitHub Pages

Published site (after Pages is enabled on the repo):

**https://jess0131.github.io/counsellor-filter-public-test/**

Start at `index.html` (landing with desktop, mobile, and French links). Prototype URLs:

| Entry | URL |
| --- | --- |
| Landing | `/` or `/index.html` |
| Prototype A (modal) | `/modal/` |
| Prototype B (sidebar) | `/sidebar/` |

Query params used in testing: `viewport=desktop` or `viewport=mobile`, `lang=fr`, `from=desktop|mobile|french`.

### Enable Pages (repo owner)

One-time setup in [repository Pages settings](https://github.com/Jess0131/counsellor-filter-public-test/settings/pages):

**Option A — branch (simplest)**  
Source: **Deploy from a branch** → branch **main**, folder **/ (root)** → Save.

**Option B — GitHub Actions**  
Source: **GitHub Actions**, then push to `main` (workflow `.github/workflows/pages.yml` deploys the static files).

The repo includes `.nojekyll` so paths like `/modal/` work on Pages.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Landing page with links to both prototypes |
| `modal/` | Prototype A |
| `sidebar/` | Prototype B |
| `shared/data.js` | Fictional counsellors, categories, options and start state |
| `shared/matching.js` | Simulated ranking used by B (A has the same rules in `modal/app.js`) |
| `shared/styles.css`, `shared/compact.css` | Shared styles and the mobile layout |
| `shared/fonts/` | Inter, under the SIL Open Font License 1.1 (`OFL.txt`) |

## Licences

Inter is © The Inter Project Authors, licensed under the SIL Open Font License 1.1. See `shared/fonts/OFL.txt`.
