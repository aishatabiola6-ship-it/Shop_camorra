# Blush

A makeup store, separate from Strut: lips, cheeks, eyes, face, sets and brushes from Dior, YSL, Huda Beauty, Charlotte Tilbury, Rare Beauty and more. Customers browse as a guest or sign in, pick a shade, and check out with delivery fees by state. Payment is simulated (no money is charged), and every order can also be sent on WhatsApp.

Everything for this site lives in this `blush/` folder, so it can move to its own repository or domain as it is.

Plain HTML, no build step. Open `index.html` in a browser to preview.

## Editing

- `products.js`: every product's name, category (`cat`), price, shades, photos and description. Tabs are categories and the filter chips are brands.
- Top of the `<script>` in `index.html`:
  - `SHOP`: shop name, WhatsApp number, Instagram and TikTok links
  - `EMAIL`: the Google Apps Script web app URL for real emails
  - `DELIVERY`: delivery zones, fees, days and states
- Photos live in `img/` (small copies for emails and order lists in `img/thumb/`).

## Accounts and emails

Accounts, bag, orders and inbox are saved in the visitor's browser and are separate from Strut's.

Until `EMAIL.scriptUrl` is filled in, emails (sign-up and sign-in codes, welcome, order confirmation) only appear in the on-site inbox (Account → Inbox). To send real emails from Gmail, follow [email/SETUP.md](email/SETUP.md) with `email/blush-email.gs`.
