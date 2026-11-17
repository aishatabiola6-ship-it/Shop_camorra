# n8n setup — Camorra Hair emails, Telegram alerts and order sheet

The workflow `camorra-hair-workflow.json` does four things:

| When | What happens |
|---|---|
| A customer signs up with email | **Welcome email** to the customer (Gmail) |
| A customer pays for an order | **Order confirmation email** to the customer (Gmail) |
| | **Telegram message** to the owner with the order details |
| | **New row** in the Google Sheet `Orders` tab |
| | *(optional, off by default)* the same alert to the owner's Gmail |

## 1. Import the workflow

1. Open n8n (n8n Cloud, or self-hosted).
2. **Workflows → ⋯ → Import from file…** and choose `camorra-hair-workflow.json`.

## 2. Connect Gmail (customer emails)

1. Open **Welcome Email** → **Credential** → **Create new** → sign in with the business Gmail.
2. Open **Order Confirmation Email** and pick the same credential.

Free Gmail can send about 500 emails a day. When the brand grows, switch these two nodes to a
branded sender (Brevo, Resend, Mailgun) so emails come from `hello@yourbrand.com`.

## 3. Connect Telegram (owner alerts) — recommended

1. In Telegram, message **@BotFather** → `/newbot` → give it a name → copy the **bot token**.
2. Open your new bot and press **Start** (send it any message).
3. Get your chat ID: message **@userinfobot** and copy the number it replies with.
4. In n8n open **Notify Owner (Telegram)** → **Credential** → **Create new** → paste the bot token.
5. Replace `PASTE_YOUR_TELEGRAM_CHAT_ID` with your chat ID.

Prefer email for the owner too? Enable **Notify Owner (Gmail) — optional** (right-click → Activate)
and replace `PASTE_OWNER_EMAIL`.

## 4. Connect Google Sheets (order log)

1. Create a Google Sheet with a tab named **Orders** and this header row in row 1:

   `Date | Order ID | Customer | Email | Items | Units | Subtotal | Delivery fee | Total | Delivery | Payment | Status`

2. In n8n open **Log Order to Google Sheet** → **Credential** → **Create new** → sign in with Google.
3. Replace `PASTE_YOUR_GOOGLE_SHEET_URL` with the sheet's URL.

## 5. Turn it on and connect the app

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
   email, place an order, and check your inbox, Telegram and the sheet.

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
  "payment": "Card", "delivery": "Express · Today 3–6 PM"
}
```

## Before real customers use it

- The app's payment is a demo. For real money, connect **Paystack** or **Flutterwave**, and send
  the order to n8n from their "payment successful" webhook instead of from the browser, so an
  order email only goes out after the money has really arrived.
- Apple and Google sign-in in the app are demos and send no sign-up email. Real social sign-in
  needs Firebase Auth or Supabase Auth.
- The app must be hosted on a real website (GitHub Pages, Netlify, Vercel) for the webhooks to work.
