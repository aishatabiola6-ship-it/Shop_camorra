# VELORA — 3D shoe brand site

A one-page site for **VELORA**, a heels brand. Its first style is the **Sienna Slingback**: a pointed-toe slingback with a gold buckle.

- The shoe is a real-time 3D model built entirely in code with three.js (`js/shoe.js`). There is no model file to download.
- As you scroll, the shoe turns and moves through each section: hero → silhouette → buckle close-up → colours → shop.
- The Colours section stays pinned while you scroll. The shoe makes a full turn and changes between Merlot, Cacao, Sable and Noir. You can also click a swatch.
- The product photos in the shop are rendered live from the same 3D model.

## Run it locally

ES modules need a web server (opening `index.html` directly from disk won't work):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

It also works as-is on GitHub Pages, Netlify, or Vercel (static hosting, no build step).

## Customise

| What | Where |
| --- | --- |
| Brand name | `BRAND` in `js/main.js` and the text in `index.html` |
| Colourways | `COLORWAYS` in `js/shoe.js` (and the swatches in `index.html`) |
| Scroll poses (position/rotation/scale per section) | `POSES` / `MOBILE_POSES` in `js/main.js` |
| Shoe shape (toe, heel height, strap) | constants at the top of `js/shoe.js` |
| Prices, sizes, copy | `index.html` |

three.js r160 is vendored in `vendor/three` (MIT licence).
