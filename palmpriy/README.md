# Palmpriy: website redesign concept

A pitch concept for palmpriyworld.com. Plain HTML, no build step: open `index.html` in a browser.

## What changed compared with the current site
- **A hero that sells**: the Dual Body Oil sits up front with a clear message and two buttons (shop / book the studio). The current site opens straight into a product grid.
- **Two businesses, kept separate**: Body Care and Palmpriy Studio each get their own section instead of sharing one filtered product list.
- **Real product page**: explains both sides of the bottle (La Coco + Golden), how to use it, ingredients and delivery.
- **Studio booking**: tap a space, pick a date, start time and hours. The total updates as you choose (10% off for 3+ hours, closed Sundays).
- **One bag for both**: oils and studio bookings go in the same bag, and checkout sends the whole order to WhatsApp.
- **Gifting** (from the current site's Gift Now / Gift Me): send the oil or a studio gift card with the recipient's name, phone and a note. It goes into the bag and the WhatsApp order.
- **NGN / USD switch** in the header (rate set in `SHOP.usdRate`). Checkout always shows the naira total.
- **Their real logo and welcome line** ("where your glow is our priority…") carried over.
- **Reels section** ("Glow in the wild"): three campaign clips (`img/reel-*.mp4`) that play while on screen, swipe sideways on phones, and have a tap-to-unmute button.
- **Real photography**: product gallery with thumbnails, a "See the glow" lookbook with the looping video and campaign shots, and the studio's wave-mirror hallway.
- **Meet our founder**: the CEO's portrait with the brand promise as her quote. Founder: Priscilla Ajoke Ojo (@its.priscy), with links to her Instagram, Priscy Luxe Bags (@priscyluxe) and Priscyscloset (@priscyscloset__).
- **Brand story, ritual guide, newsletter and a cleaner footer** with tap-to-call, email and WhatsApp links.

## Editing
At the bottom of `index.html`: `SHOP` (WhatsApp number, USD rate), `GIFTS` (gift options), `PRODUCT` and `SPACES` (names, prices, photos, descriptions).
Photos in `img/` are the brand's own product, campaign and studio shots (resized for web). Casa coco, Floral walkway, Sahara and Cocoon are still cropped from screenshots, so swap in their originals before going live. `img/glow.mp4` is a 7-second muted loop made from the brand's video.
