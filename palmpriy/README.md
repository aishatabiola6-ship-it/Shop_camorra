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
- **Brand story, ritual guide, newsletter and a cleaner footer** with tap-to-call, email and WhatsApp links.

## Editing
At the bottom of `index.html`: `SHOP` (WhatsApp number, USD rate), `GIFTS` (gift options), `PRODUCT` and `SPACES` (names, prices, photos, descriptions).
Photos in `img/` are cropped from screenshots of the current site. Swap in the original high-resolution files before going live.
