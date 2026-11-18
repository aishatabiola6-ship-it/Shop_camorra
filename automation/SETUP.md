# Order automation – setup guide

When a customer pays and submits their delivery details, the site will:

1. **Check the payment directly with Flutterwave** (right amount, right order, really successful).
2. **Save the order to a Google Sheet** – one row per order.
3. **Email Preshy** at egwuenuprecious18@gmail.com with the order and a one-tap link to WhatsApp the customer.

If a customer pays but closes the page before giving their details, Flutterwave still tells the site,
and the payment appears in the sheet as **"PAID – waiting for delivery details"**.

Setup takes about 20 minutes and is done once. Do it **logged in to Preshy's Google account**.

---

## Part A – Google Sheet (about 10 min)

1. Go to **sheets.new**. Name the sheet **Preshy Emporium Orders**.
2. Click **Extensions → Apps Script**. A code editor opens.
3. Delete everything in the editor. Open
   [`automation/google-apps-script.gs`](./google-apps-script.gs) on GitHub, click **Raw**, copy all of it and paste it into the editor.
4. On the line `const TOKEN = "PASTE-YOUR-SECRET-PHRASE-HERE";` replace the text between the quotes with a long secret
   phrase that only you know, e.g. `mango-velvet-river-2026-blue`. **Write it down – you'll need it in Part C.**
5. Click the 💾 **Save** icon.
6. In the toolbar's function drop-down choose **setup**, then click **▶ Run**.
   Google asks for permission: **Review permissions → choose the account → Advanced → Go to (project name) → Allow**.
   (It says "unsafe" only because you wrote the script yourself and Google hasn't reviewed it.)
7. Click **Deploy → New deployment**. Click the ⚙️ next to "Select type" and choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, then copy the **Web app URL** (it ends in `/exec`). **You'll need it in Part C.**

> If you ever edit the script later: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**
> (the URL stays the same).

## Part B – Flutterwave (about 5 min)

Make sure the dashboard is in **Test mode** for now.

1. **Settings → API Keys** → copy the **Secret key** (starts with `FLWSECK_TEST-`).
   Never paste this into the website files, GitHub, WhatsApp or chat – only into Netlify (Part C).
2. **Settings → Webhooks**:
   - URL: `https://preshy-emporium.netlify.app/.netlify/functions/flutterwave-webhook`
   - Secret hash: make up another secret phrase (different from the sheet one), e.g. `rose-lipstick-9311`. **Write it down.**
   - Save.

## Part C – Netlify (about 5 min)

1. Open your project on **app.netlify.com → Project configuration → Environment variables → Add a variable**.
2. Add these four (name exactly as written, all scopes):

   | Key | Value |
   |---|---|
   | `FLW_SECRET_KEY` | the Flutterwave secret key from Part B step 1 (tick **Contains secret values**) |
   | `FLW_WEBHOOK_HASH` | the webhook secret hash from Part B step 2 |
   | `SHEET_WEBHOOK_URL` | the Web app URL from Part A step 7 |
   | `SHEET_TOKEN` | the secret phrase from Part A step 4 |

3. Go to **Deploys → Trigger deploy → Deploy project** so the new settings take effect.

## Part D – Test it

1. Open https://preshy-emporium.netlify.app, add something to the cart, sign in, and pay with a
   **Flutterwave test card** (from Flutterwave's docs, search "Flutterwave test cards").
2. Fill in the delivery details. The thank-you page should show **✓ Payment verified**.
3. Check the **Orders** tab in the Google Sheet and the email inbox.

## Going live (real money)

1. Finish Flutterwave's business verification.
2. Switch the dashboard to **Live mode** and:
   - send the **live public key** (`FLWPUBK-...`) to put in `config.js`,
   - in Netlify replace `FLW_SECRET_KEY` with the **live secret key** (`FLWSECK-...`),
   - set the same webhook URL and secret hash under **Settings → Webhooks** in Live mode.
3. Trigger a new deploy on Netlify.

## Daily routine for Preshy

- You get an email for each paid order. Rows marked **PAID ✓ – arrange delivery** are safe to send.
- Tap the **wa.me** link in the email (or the "Reply on WhatsApp" column) to send the customer the delivery date and fee.
- Rows marked **⚠ CHECK PAYMENT** could not be verified – look up the order ref in Flutterwave before sending anything.
- Rows marked **PAID – waiting for delivery details** were paid but the customer didn't finish – email them
  (their email is in the row) to ask for their address.
