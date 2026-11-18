/*
 * Flutterwave calls this address every time a payment completes – even if the customer
 * closes the page before giving their delivery details. It records the payment in the
 * Google Sheet so Preshy never misses a paid order.
 *
 * Webhook URL to paste in Flutterwave:  https://<your-site>.netlify.app/.netlify/functions/flutterwave-webhook
 */
import { verifyTransaction, sendToSheet } from "../lib/shared.mjs";

export default async (req) => {
  const hash = (process.env.FLW_WEBHOOK_HASH || "").trim();
  if (!hash || (req.headers.get("verif-hash") || "").trim() !== hash) {
    return new Response("unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const d = body && body.data;
  if (!d || !d.id) return new Response("ignored", { status: 200 });

  // Never trust the webhook body alone – confirm with Flutterwave.
  const v = await verifyTransaction({ transactionId: d.id });
  if (v.ok) {
    const t = v.data;
    await sendToSheet({
      ref: t.tx_ref,
      status: "PAID – waiting for delivery details",
      amount: t.amount,
      items: (t.meta && t.meta.items) || "",
      name: t.customer ? t.customer.name : "",
      email: t.customer ? t.customer.email : "",
      flwId: t.id,
      verified: true,
      onlyFillEmpty: true // never overwrite details the customer already sent
    });
  }
  return new Response("ok", { status: 200 });
};
