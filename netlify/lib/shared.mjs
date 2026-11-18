/*
 * Shared helpers for the order automation (runs on Netlify, never in the browser).
 *
 * Environment variables (Netlify -> Project configuration -> Environment variables):
 *   FLW_SECRET_KEY     Flutterwave SECRET key (FLWSECK_TEST-... or FLWSECK-...)
 *   FLW_WEBHOOK_HASH   Any secret phrase; the same text goes in Flutterwave -> Settings -> Webhooks -> Secret hash
 *   SHEET_WEBHOOK_URL  The Google Apps Script web-app URL (see automation/SETUP.md)
 *   SHEET_TOKEN        Any secret phrase; the same text goes in the Apps Script TOKEN line
 */
import vm from "node:vm";

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const clip = (v, n = 500) => String(v == null ? "" : v).trim().slice(0, n);
export { clip };

/** Ask Flutterwave directly whether a payment really succeeded. */
export async function verifyTransaction({ transactionId, txRef }) {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) return { configured: false };
  const byId = transactionId && /^\d+$/.test(String(transactionId));
  if (!byId && !txRef) return { configured: true, ok: false, reason: "no payment reference" };
  const url = byId
    ? `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`
    : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    const body = await r.json().catch(() => ({}));
    const d = body && body.data;
    if (!r.ok || !d) return { configured: true, ok: false, reason: (body && body.message) || "payment not found" };
    return { configured: true, ok: d.status === "successful", data: d, reason: d.status !== "successful" ? "payment status: " + d.status : "" };
  } catch (e) {
    return { configured: true, ok: false, reason: "could not reach Flutterwave" };
  }
}

/** Load the real prices from the deployed products.js (so customers can't change prices in their browser). */
export async function loadProducts(origin) {
  const r = await fetch(origin + "/products.js");
  if (!r.ok) throw new Error("could not load products");
  const ctx = { window: {} };
  vm.runInNewContext(await r.text(), ctx, { timeout: 1000 });
  return ctx.window.PRODUCTS || [];
}

/** Work out the order total from product ids and quantities. */
export function priceOrder(products, items) {
  const lines = [];
  let total = 0;
  for (const [id, qty] of Object.entries(items || {})) {
    const p = products.find((x) => x.id === id);
    const q = Math.floor(Number(qty));
    if (!p || !(q >= 1 && q <= 1000)) continue;
    total += p.price * q;
    lines.push(`${p.name} x${q} = ₦${(p.price * q).toLocaleString("en-NG")}`);
  }
  return { total, lines };
}

/** Turn 0803... into 234803... for wa.me links. */
export function waNumber(n) {
  let d = String(n || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "234" + d.slice(1);
  return d;
}

/** Send a row to the Google Sheet (the Apps Script adds or updates it by order ref, and emails Preshy). */
export async function sendToSheet(payload) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return false;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, token: process.env.SHEET_TOKEN || "" }),
      redirect: "follow"
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}
