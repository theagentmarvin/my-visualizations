BIM ItemsFinder — Minimal demo

This project provides a minimal ItemsFinder-like viewer that loads fragment models (glTF/glb) and offers search/highlight functionality. It's intended to be run locally and is ready to publish to GitHub Pages.

Run locally (simple):

```bash
cd /home/marvin/.openclaw/workspace/viz-deploy/projects/bim-itemsfinder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Files added:
- `index.html` — UI shell (already present, updated to use local assets)
- `assets/app.js` — viewer app (Three.js + GLTFLoader via CDN)
- `assets/style.css` — basic styling

To publish to GitHub Pages: push this repository (or this folder) to a branch configured for GitHub Pages; `index.html` and `assets/` are sufficient.

Notes:
- This is a minimal reimplementation to reproduce the viewer and fragment-loading behaviour from the tutorial. Replace the sample model URLs in `assets/app.js` with your fragment model URLs from ThatOpen to match the original tutorial exactly.
- If you want IFC/ThatOpen-specific fragment loading, I can integrate the ThatOpen engine or web-ifc loaders next (requires the original fragment endpoints or local fragment files).
