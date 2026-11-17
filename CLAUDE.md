# Shop Camorra — demo apps for social posts

This repo holds clickable app/website **demos** that the owner records into short videos for
TikTok/Instagram to attract clients (brands who want an app or website built). They are
prototypes: no backend, no real payments, no real sign-in, no real rider GPS.

## What's here

| Path | What it is |
|---|---|
| `index.html` | Front door: redirects to the wig store in `wigs/` (keeps `?flags` and `#hash`) |
| `lipgloss/` | Scrolling lip gloss landing page (`index.html`, `styles.css`, `script.js`; colours melt per shade, parallax, no WebGL) |
| `app/index.html` | Lip gloss shopping app in a phone frame + live code panel. Login (Apple/Google/email code), shade swatches, Drop / On-lips views, Glossy/Shimmer, bag, checkout |
| `app/videos/` | Rendered gloss-drop clips (`drop-<shade>[-shimmer].mp4`), made by `app/drop-studio.html`. Placeholders until real footage |
| `app/drop-studio.html` | Renders the gloss-drop clips frame by frame (particle liquid + SVG gooey/specular filter) |
| `wigs/index.html` | **Camorra Hair** wig shop app (concept brand). Login, masonry feed, product photo/video view, length/lace/density/install options, bag, checkout. After payment, **Track Order is the only screen**: rider moves on a map with live ETA until delivered |
| `wigs/img/` | Wig photos `w1.jpg`–`w8.jpg` (placeholders from the owner's inspiration; replace with owned/licensed photos before public posts) |
| `tools/record-demo.js` | Records an app's auto-play demo to MP4 |
| `wigs/vid/` | Six real wig video units (`v1`–`v6`, mp4 + poster jpg); photo units stay photos |
| `n8n/` | n8n workflow (welcome email, order email, Telegram alert, Google Sheet row) + `SETUP.md` |

Each app is one self-contained HTML file (inline CSS + JS, Google Fonts only). No build step.

## Running

- Open with a static server (VS Code **Live Server**, or `npx serve .`).
- URL flags (also work as `#demo`, `#dark`, `#demo-dark`):
  - `?demo` — plays the whole flow automatically (for screen recording)
  - `?big` — scales the phone up to fill the window (crisp recordings)
  - `?dark` — black theme (default is blush pink)
  - `?backend` / `#backend` (wig app) — split screen: FRONT END phone + BACK END panel (n8n canvas nodes light up, owner's Telegram, Google Sheet rows), driven by `notify()` via `BE.event()`; adapts to portrait (TikTok) and landscape. Combine: `?demo&full&backend`
  - `?demo&full` / `#demo-full` (wig app) — full automation demo: email code arrives as a mail notification, order, Flutterwave payment sheet (lookalike), order-confirmation email, live tracking
- On a real phone (< 500px wide) the app goes fullscreen without the phone frame.

## Recording post videos

```
npm i -D playwright && npx playwright install chromium   # once; also needs ffmpeg
node tools/record-demo.js wigs vertical     # 1080x1920 for TikTok/Reels  -> out/
node tools/record-demo.js wigs landscape    # 1920x1080, phone + code panel
```

The demo script lives at the bottom of each app (`async function demo()`); it taps through the
flow with visible tap circles and sets `body.demo-done` when finished. Edit its steps/timings
to change what the video shows. In the wig app, tracking speed is `PHASE` (demo vs normal).

The posted video also had a caption hook, step captions and a "DM me to build yours" end card,
composited with ffmpeg overlays on the vertical recording.

## Editing pointers

- Wig products, prices (₦), lace/density options: `const WIGS`, `LACE`, `DENSITY` in `wigs/index.html`
- Lip gloss shades: `const SHADES` in `app/index.html` (and palettes in `lipgloss/styles.css` for the landing page)
- Theme colours: the CSS variables on `body` / `body.dark` at the top of each app
- The code panel shows the real source between `// <code-view>` and `// </code-view>`

## n8n automations (wig app)

`const N8N = { signup, order }` near the top of `wigs/index.html` holds the webhook URLs (empty =
off). `notify()` posts a `signup` event after the email-code sign-in and an `order` event in
`placeOrder()`. Nothing is sent in `?demo` mode. Checkout collects the customer's name and email.
Payments: `const FLUTTERWAVE = { publicKey }` (empty = simulated payment, as in the demo).
With a key, Pay opens Flutterwave Inline (card / bank transfer / USSD, NGN); on success the order
event carries `txRef` + `transactionId`, and n8n verifies the transaction with Flutterwave's API
(secret key lives only in n8n) before emailing, alerting and logging.
Setup steps and payload shapes: `n8n/SETUP.md`.

## Notes for posts

- Present the wig app as a **concept** ("Concept app for Camorra Hair · designed & built by …").
- Don't use other sellers' watermarked photos or other creators' videos in public posts.
