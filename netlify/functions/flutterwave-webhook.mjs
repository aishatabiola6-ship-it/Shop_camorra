/*
 * Flutterwave calls this address every time a payment completes – even if the customer
 * closes the page before giving their delivery details. It records the payment in the
 * Google Sheet so Preshy never misses a paid order.
 *
 * Webhook URL to paste in Flutterwave:  https://<your-site>.netlify.app/.netlify/functions/flutterwave-webhook
 * Secret hash in Flutterwave must equal FLW_WEBHOOK_HASH in Netlify.
 *
 * Accepts both Flutterwave styles:
 *   - "verif-hash" header that equals the secret hash (classic v3 webhooks)
 *   - "flutterwave-signature" header = base64 HMAC-SHA256 of the body using the secret hash (newer webhooks)
 */
import crypto from "node:crypto";
import { verifyTransaction, sendToSheet } from "../lib/shared.mjs";

const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function authorised(req, raw, hash) {
  const verif = (req.headers.get("verif-hash") || "").trim();
  if (verif) return same(verif, hash) ? "ok" : "verif-hash header does not match FLW_WEBHOOK_HASH";
  const sig = (req.headers.get("flutterwave-signature") || "").trim();
  if (sig) {
    const mac = crypto.createHmac("sha256", hash).update(raw);
    const b64 = mac.digest("base64");
    const hex = crypto.createHmac("sha256", hash).update(raw).digest("hex");
    return same(sig, b64) || same(sig.toLowerCase(), hex) ? "ok" : "flutterwave-signature does not match FLW_WEBHOOK_HASH";
  }
  return "no verif-hash or flutterwave-signature header";
}

export default async (req) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 }); // e.g. someone opening the URL in a browser
  const hash = (process.env.FLW_WEBHOOK_HASH || "").trim();
  if (!hash) { console.error("[webhook] FLW_WEBHOOK_HASH is not set in Netlify"); return new Response("not configured", { status: 401 }); }

  const raw = await req.text();
  const why = authorised(req, raw, hash);
  if (why !== "ok") {
    console.error("[webhook] REJECTED:", why);
    return new Response("unauthorized", { status: 401 });
  }

  let body = null;
  try { body = JSON.parse(raw); } catch (e) { /* ignore */ }
  const d = body && body.data;
  const id = d && (d.id || d.transaction_id);
  if (!id) { console.log("[webhook] accepted, nothing to record (event:", body && (body.event || body.type), ")"); return new Response("ok", { status: 200 }); }

  // Never trust the webhook body alone – confirm with Flutterwave.
  const v = await verifyTransaction({ transactionId: id, txRef: d.tx_ref || d.reference });
  if (v.ok) {
    const t = v.data;
    await sendToSheet({
      ref: t.tx_ref,
      status: "PAID – waiting for delivery details",
      amount: Number(t.amount).toLocaleString("en-NG"),
      items: (t.meta && t.meta.items) || "",
      name: t.customer ? t.customer.name : "",
      email: t.customer ? t.customer.email : "",
      flwId: t.id,
      verified: true,
      onlyFillEmpty: true // never overwrite details the customer already sent
    });
    console.log("[webhook] recorded payment", t.tx_ref);
  } else {
    console.log("[webhook] accepted, payment not successful:", v.reason);
  }
  // Always 200 once authorised, so Flutterwave doesn't keep retrying.
  return new Response("ok", { status: 200 });
};
