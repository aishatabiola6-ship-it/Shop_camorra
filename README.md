# Strut

Strut is a showcase shoe store: heels, flats, boots and sneakers. Customers sign in or browse as a guest, pick a style, colour and size, and check out with delivery fees by state. Payment is simulated (no money is charged), and every order can also be sent on WhatsApp.

Plain HTML, no build step. Open `index.html` in a browser to preview.

## Editing

Everything you will usually change is at the top of the `<script>` in `index.html`:

- `EMAIL`: the Google Apps Script web app URL for real emails
- `SHOP`: shop name, WhatsApp number, Instagram and TikTok links
- `DELIVERY`: delivery zones, fees, days and which states belong to each zone
- `SIZES`: the EU sizes offered
- `PRODUCTS`: each shoe's name, category, price, colours, photos and description

Photos live in `img/`.

## Accounts and emails

Customers create an account with their name and email, confirm it with a 6-digit code, then set a password. Next time they sign in with email and password, and "Forgot password?" resets it with a new code. Passwords are salted and hashed (PBKDF2) before they are saved; the plain password is never stored.

This is a showcase, so accounts live in the visitor's own browser, and every email (code, welcome, sign-in, order confirmation) lands in the in-site inbox (Account → Inbox) with a pop-up notification.

To send real emails from Gmail, follow [email/SETUP.md](email/SETUP.md): paste `email/strut-email.gs` into Google Apps Script, deploy it as a web app and put its URL in `EMAIL.scriptUrl`.

Real accounts that work across devices need a backend (for example Firebase or Supabase); the browser-only version is fine for a demo.
