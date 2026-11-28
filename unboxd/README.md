# Unboxd: gadget store website

A one-page store for phones, laptops, tablets, audio, watches and cameras. It's plain HTML, CSS and JavaScript, so there's no build step and nothing to install.

## Files

- `index.html`: the Unboxd store. It's the same as the app: splash, welcome screens, log in, home, categories, spotlight, product pages, bag, checkout and account. On computers it uses a wider layout.
- `app.html`: an identical copy, so links to /app.html keep working.
- `images/`: product photos

## Run it

Double-click `index.html` to open it in a browser.

## Put it online (free)

- **Netlify Drop**: go to app.netlify.com/drop and drag the `unboxd` folder onto the page.
- **GitHub Pages**: upload the folder to a GitHub repository, then turn on Pages in the repository settings.
- **Vercel**: import the folder as a static site.

## Common edits

All of these are inside the `<script>` near the bottom of `index.html`.

| What | Where |
| --- | --- |
| Products, prices (₦), specs, colours, photos | the `PRODUCTS` list |
| Product order on the "Featured" sort | the `FEATURED` list |
| Delivery fee and free-delivery threshold | `sums()` and `renderCart()`: `150000` and `5000` |
| Bank transfer details | `payDetail()`: replace "Your bank", "Unboxd" and "0000000000" |
| Demo account | `startDemo()` |
| Colours and fonts | the `:root` block at the top of the `<style>` (fonts: Geist) |

To add a product, copy one entry in `PRODUCTS`, give it a new `id`, put its photo in `images/` and set `img` to the file name without `.jpg`.

## What works today, and what's a demo

| Feature | Status |
| --- | --- |
| Catalogue, filters, colour and storage options, cart | Works |
| Prices in naira, delivery fee, totals | Works |
| Welcome screens (shown once on phones) | Works |
| Trade-in estimate | Works (estimates are placeholders) |
| Customer accounts, order history, log out | Saved in the customer's own browser only |
| Checkout: delivery details, order confirmation | Works |
| Pay online | **Simulated**: no money is taken |
| Bank transfer | Shows **placeholder** account details |
| Pay on delivery | Works (records the order) |
| Newsletter signup | Shows a confirmation but doesn't send emails anywhere |

## Before taking real orders

1. **Payments**: connect Paystack or Flutterwave. Their checkout opens from the "Pay online" button in `#coView`'s click handler (search for `placeOrder`). Only mark an order "Paid" after the provider confirms it.
2. **Accounts and orders**: move them to a backend such as Supabase or Firebase, so accounts work on every device, password reset emails work, and you can see orders. Right now they live in each browser's `localStorage`.
3. **Real details**: your prices, bank account, delivery policy, contact details and your own product photos.
