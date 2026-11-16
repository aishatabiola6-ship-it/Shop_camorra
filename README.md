# VELORA — shoe brand site

A one-page site for **VELORA**, a pointed-heels brand. Everything moves as you scroll:

- **Hero:** a real nude pump (photo with the background removed) floats over the VELORA title. It turns and tilts as you scroll and as you move the mouse.
- **The Pump:** the shoe glides to the right next to its details.
- **Nude or Noir:** the black woven heel flies in to join it.
- **Editorial:** a full-width photo opens up as you scroll.
- **Lookbook:** scrolling down moves a row of photos sideways.
- **Shop:** six products with real photos, size picker and an "Add to bag" counter (demo only, no checkout).

No build step and no libraries. It's just HTML, CSS and JavaScript (`index.html`, `styles.css`, `js/main.js`).

## Run it locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Or use the VS Code "Live Server" extension. It also works as-is on GitHub Pages or Netlify.

## Customise

| What | Where |
| --- | --- |
| Product names, prices, sizes, text | `index.html` |
| How the floating shoes move per section | `POSES` / `MOBILE` in `js/main.js` |
| Colours and fonts | top of `styles.css` |
| Photos | `images/` (keep the same file names, or update `index.html`) |

## Photos

All photos come from [Unsplash](https://unsplash.com) under the Unsplash License, which allows free commercial use. Photographers are credited in the footer, and `images/credits.json` lists the source of every file. When you have your own product shoot, replace these files. Your own photos will always look more on-brand.
