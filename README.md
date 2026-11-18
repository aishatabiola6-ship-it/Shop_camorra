# Preshy Emporium

Discreet adult wellness storefront for Preshy Emporium, Abraka, Delta State.
Contact: egwuenuprecious18@gmail.com

A static website (plain HTML/CSS/JS, no build step). You can host it for free on GitHub Pages, Netlify or Vercel.

## What it does
- **Opening page** with an 18+ age check
- **Shop** with categories and search
- **Product page** shows the description, features, and a step-by-step **How it works** section
- **Cart**: add any number of items, change quantities, remove items; the cart stays saved in the browser
- **Sign in** with Google, Apple or email
  - Google / email: a 6-digit code is sent, then the customer can **create a password**
  - Next time they can **log in with email + password**
- **Checkout with Flutterwave** (card, bank transfer, USSD). After paying, the customer enters their name,
  WhatsApp number and delivery address, and is told their delivery date and fee will come by WhatsApp.
  A button sends the full order to the shop's WhatsApp (+234 813 328 4978) with one tap.
- Floating WhatsApp chat button on every page, and a Delivery / Refunds / Privacy page

## Editing
- Products, prices and "how it works" steps: `products.js`. Photos go in `images/` and are listed in each product's `images` field (first photo = shop thumbnail)
- Store name, email, location, WhatsApp, TikTok and Flutterwave public key: `config.js`

## Turning on Flutterwave payments
1. Create a Flutterwave business account at https://flutterwave.com and complete the business verification (KYC).
2. In the dashboard go to Settings -> API Keys and copy the **public** key.
3. Paste it into `config.js` -> `flutterwave.publicKey`. Use the TEST key first and do a test payment, then switch to the LIVE key.
4. Never put the secret key in the website files.

Until a key is added, checkout runs in demo mode (payment is simulated).

## Order automation (Netlify Functions + Google Sheets)
After payment the site checks the payment with Flutterwave, saves the order to a Google Sheet and emails the shop.
Code: `netlify/functions/`, `automation/google-apps-script.gs`. Setup steps: **[automation/SETUP.md](automation/SETUP.md)**.

## Customer emails
Sign-in codes, welcome / new sign-in notices and order confirmations are sent by the Netlify automation
through the Google Sheet script (no extra email service needed). Until it's set up, sign-in codes are
shown on screen (demo mode). See [automation/SETUP.md](automation/SETUP.md).

## Notes for going fully live
- Accounts are stored in each customer's browser (`localStorage`). To share accounts across devices and connect the real
  Google/Apple sign-in pop-ups, move auth to a backend such as Firebase Authentication. Apple sign-in requires an
  Apple Developer account.
- For card payments, add Paystack or Flutterwave at checkout.
