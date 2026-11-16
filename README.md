# Shop Camorra — two pages

| Page | Folder | What it is |
| --- | --- | --- |
| **VELORA** (womenswear heels) | `index.html` | Scroll-driven shoe site with real photography |
| **CAMORRA — Try the Look** (menswear) | `try-the-look/` | Drag carousel of looks, "In this look" list, clothes rail and spinning product view |

The two pages link to each other in their menus.

## Open and publish in VS Code

1. Open this folder in VS Code (**File → Open Folder…**).
2. Install the **Live Server** extension, then click **Go Live** in the bottom bar.
   - VELORA opens at `http://127.0.0.1:5500/`
   - Try the Look opens at `http://127.0.0.1:5500/try-the-look/`
3. To publish, push to GitHub and turn on **Settings → Pages** (branch: your branch, folder: `/root`).
   Both pages go live together, at `/` and `/try-the-look/`. Netlify works too: drag the folder onto app.netlify.com/drop.

There's no build step and nothing to install. Each page is plain HTML, CSS and JavaScript.

---

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

---

# CAMORRA — Try the Look

- **Try the Look:** drag (or swipe, or use the arrow keys) through six full-body looks. The look in the middle is sharp, and the ones beside it blur and shrink. The **In this look** panel lists each piece with its price.
- **Open a look:** tap the middle model. The other looks fade away and you can add single pieces or the full look to your bag.
- **Off the rail:** garments hang on a rail that drifts and loops forever. Drag it, then tap a piece to open it.
- **Product view:** the garment turns in 3D (drag it to spin), with sizes and "Add to bag".

Edit looks, pieces, prices and garments in the `LOOKS` and `GARMENTS` lists at the top of `try-the-look/app.js`.
Photos are in `try-the-look/images/`. They're cut-out PNG/WebP files with transparent backgrounds, and `credits.json` lists where each one came from.
The bag is a demo counter. There's no checkout.
