# Palmpriy: website redesign concept

A pitch concept for palmpriyworld.com. Plain HTML, no build step: open `index.html` in a browser.

The page is hidden from search engines by a `noindex` tag in `index.html` while it is a pitch. Remove that line once Palmpriy approves it.

## What changed compared with the current site
- **A hero that sells**: the Dual Body Oil sits up front with a clear message and two buttons (shop / book the studio). The current site opens straight into a product grid.
- **Two businesses, kept separate**: Body Care and Palmpriy Studio each get their own section instead of sharing one filtered product list.
- **Swipeable product photos**: the current photo is big in front with the others peeking behind; swipe on phones, arrows on desktop, plus dots and thumbnails.
- **Real product page**: explains both sides of the bottle (La Coco + Golden), how to use it, ingredients and delivery.
- **Studio booking**: tap a space, pick a date, start time and hours. The total updates as you choose (10% off for 3+ hours, closed Sundays).
- **One bag for both**: oils and studio bookings go in the same bag, and checkout sends the whole order to WhatsApp.
- **Gifting** (from the current site's Gift Now / Gift Me): send the oil or a studio gift card with the recipient's name, phone and a note. It goes into the bag and the WhatsApp order.
- **NGN / USD switch** in the header (rate set in `SHOP.usdRate`). Checkout always shows the naira total.
- **Their real logo and welcome line** ("where your glow is our priority…") carried over.
- **Reels section** ("Glow in the wild"): three campaign clips (`img/reel-*.mp4`) that play while on screen, swipe sideways on phones, and have a tap-to-unmute button.
- **Real photography**: product gallery with thumbnails, a "See the glow" lookbook with the looping video and campaign shots, and the studio's wave-mirror hallway.
- **Meet our founder**: the CEO's portrait with the brand promise as her quote. Founder: Priscilla Ajoke Ojo (@its.priscy), with links to her Instagram, Priscy Luxe Bags (@priscyluxe) and Priscyscloset (@priscyscloset__).
- **Glow list signup** with a campaign portrait.
- **Checkout like their current site**: delivery details, Lagos delivery areas with fees, and pay by transfer or card. The order goes to WhatsApp with everything filled in; Palmpriy replies with account details or a Paystack link. Bank details are not printed on the page because Paystack transfer accounts are created per order.
- **Gift Me** (from their menu): fans send Palmpriy a money gift. Quick amounts ₦1,000 to ₦10,000 or a custom amount (minimum ₦100), name, email and a note; it goes to WhatsApp for payment details. Their current Gift Me shows "Unable to start payment".
- **Brand story, ritual guide, newsletter and a cleaner footer** with tap-to-call, email and WhatsApp links.

## Editing
At the bottom of `index.html`: `DELIVERY` (delivery areas and fees, copied from the current checkout; add the rest of their list), `SHOP` (WhatsApp number, USD rate), `GIFTS` (gift options), `PRODUCT` and `SPACES` (names, prices, photos, descriptions).
Photos in `img/` are the brand's own product, campaign and studio shots (resized for web). Casa coco, Floral walkway, Sahara and Cocoon are still cropped from screenshots, so swap in their originals before going live. `img/glow.mp4` is a 7-second muted loop made from the brand's video.

## Deploying on Cloudflare
Live preview: https://prime.aishatabiola6.workers.dev

`wrangler.jsonc` serves this folder as a static site on Cloudflare Workers (worker name `prime`; if you rename the Worker in Cloudflare, change `name` here to match). In the Worker's **Settings → Build**, set the branch to `claude/intelligent-euler-y9juzz`, the root directory to `palmpriy`, leave the build command empty, and keep the deploy command as `npx wrangler deploy`. `.assetsignore` keeps the config and README off the live site.
