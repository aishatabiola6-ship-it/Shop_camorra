# n8n setup — Camorra Hair payments, emails, Telegram alerts and order sheet

How an order flows:

1. The customer taps **Pay** → Flutterwave's secure checkout opens (card, bank transfer or USSD, in ₦).
2. Flutterwave says the payment went through → the app sends the order to n8n.
3. n8n **asks Flutterwave to confirm** the payment (status successful, currency NGN, amount at
   least the order total, same reference).
4. Confirmed → customer email + Telegram alert + Google Sheet row.
   Not confirmed → a ⚠️ Telegram warning to the owner and nothing else.

| When | What happens |
|---|---|
| A customer signs up with email | **Welcome email** to the customer (Gmail) |
| A paid order is confirmed by Flutterwave | **Order confirmation email** to the customer (Gmail) |
| | **Telegram message** to the owner with the order details |
| | **New row** in the Google Sheet `Orders` tab |
| | *(optional, off by default)* the same alert to the owner's Gmail |
| A payment can't be confirmed | **⚠️ Telegram warning** to the owner: don't ship yet |

## 1. Import the workflow

1. Open n8n (n8n Cloud, or self-hosted).
2. **Workflows → ⋯ → Import from file…** and choose `camorra-hair-workflow.json`.

## 2. Connect Flutterwave (payments)

1. Sign up at **flutterwave.com** and open **Settings → API keys**. Start with **Test mode** keys.
2. **Public key** (`FLWPUBK_TEST-…`) goes in the app, in `wigs/index.html`:

   ```js
   const FLUTTERWAVE = { publicKey: "FLWPUBK_TEST-xxxxxxxx-X" };
   ```

   The public key is safe to put in the app.
3. **Secret key** (`FLWSECK_TEST-…`) stays in n8n only. Never put it in the app.
   In n8n open **Verify Payment (Flutterwave)** → **Credential** → **Create new** (Header Auth):
   - Name: `Authorization`
   - Value: `Bearer FLWSECK_TEST-xxxxxxxx-X`
4. Test with Flutterwave's test cards (listed in their docs under "Testing"). When everything
   works, switch both keys to the **live** ones.

Until a public key is set, the app's Pay button simulates payment (that's what the demo uses).

## 3. Connect Gmail (customer emails)

1. Open **Welcome Email** → **Credential** → **Create new** → sign in with the business Gmail.
2. Open **Order Confirmation Email** and pick the same credential.

Free Gmail can send about 500 emails a day. When the brand grows, switch these two nodes to a
branded sender (Brevo, Resend, Mailgun) so emails come from `hello@yourbrand.com`.

## 4. Connect Telegram (owner alerts) — recommended

1. In Telegram, message **@BotFather** → `/newbot` → give it a name → copy the **bot token**.
2. Open your new bot and press **Start** (send it any message).
3. Get your chat ID: message **@userinfobot** and copy the number it replies with.
4. In n8n open **Notify Owner (Telegram)** → **Credential** → **Create new** → paste the bot token.
5. Replace `PASTE_YOUR_TELEGRAM_CHAT_ID` with your chat ID in **both** Telegram nodes
   (**Notify Owner (Telegram)** and **Warn Owner: Payment Not Verified**).

Prefer email for the owner too? Enable **Notify Owner (Gmail) — optional** (right-click → Activate)
and replace `PASTE_OWNER_EMAIL`.

## 5. Connect Google Sheets (order log)

1. Create a Google Sheet with a tab named **Orders** and this header row in row 1:

   `Date | Order ID | Customer | Email | Items | Units | Subtotal | Delivery fee | Total | Paid | Delivery | Payment | Flutterwave ref | Transaction ID | Status`

2. In n8n open **Log Order to Google Sheet** → **Credential** → **Create new** → sign in with Google.
3. Replace `PASTE_YOUR_GOOGLE_SHEET_URL` with the sheet's URL.

## 6. Turn it on and connect the app

1. Click **Active** (top right) to switch the workflow on.
2. Open **Sign-up Webhook** → copy the **Production URL**. Do the same for **Order Webhook**.
3. In `wigs/index.html`, paste them into:

   ```js
   const N8N = {
       signup: "https://YOUR-N8N/webhook/camorra-hair-signup",
       order: "https://YOUR-N8N/webhook/camorra-hair-order",
   };
   ```

4. Test: open the app (not in `?demo` mode, which never sends anything), sign up with your own
   email, pay with a Flutterwave test card, and check your inbox, Telegram and the sheet.

## What the app sends

Sign-up (`POST …/camorra-hair-signup`):

```json
{ "event": "signup", "ts": "2026-11-17T09:54:51Z", "name": "Ada", "email": "ada@example.com" }
```

Order (`POST …/camorra-hair-order`):

```json
{
  "event": "order", "ts": "2026-11-17T09:54:56Z", "orderId": "CH-20481",
  "name": "Ada Obi", "email": "ada@example.com",
  "itemsText": "Kinky Curly Bob · 14\" · 13x4 Frontal · 180% × 1 — ₦210,000",
  "units": 1, "subtotal": 210000, "deliveryFee": 5000, "total": 215000, "totalText": "₦215,000",
  "payment": "Bank transfer", "delivery": "Express · Today 3–6 PM",
  "txRef": "CH-1794909851622", "transactionId": 4815162342
}
```

## Before real customers use it

- n8n checks every payment with Flutterwave before anything goes out, so a fake "paid" message
  from a browser can't trigger an order email. It checks the amount against the total the app
  sent; glance at the **Paid** column against the items for anything unusual.
- If a customer closes the page right after paying, the app can't tell n8n. To catch those too,
  add Flutterwave's own webhook (Settings → Webhooks) pointing at a second n8n webhook later.
- Apple and Google sign-in in the app are demos and send no sign-up email. Real social sign-in
  needs Firebase Auth or Supabase Auth.
- The app must be hosted on a real website (GitHub Pages, Netlify, Vercel) for the webhooks to work.
