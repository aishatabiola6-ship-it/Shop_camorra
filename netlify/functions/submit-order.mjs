/*
 * Called by the website when the customer submits their delivery details after paying.
 * 1. Recalculates the order total from the real prices.
 * 2. Asks Flutterwave whether the payment really succeeded for the right amount.
 * 3. Saves the order to the Google Sheet and emails Preshy.
 */
import { json, clip, verifyTransaction, loadProducts, priceOrder, waNumber, sendToSheet } from "../lib/shared.mjs";

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  let b;
  try { b = await req.json(); } catch (e) { return json(400, { ok: false, error: "bad_request" }); }

  const order = {
    ref: clip(b.txRef, 60),
    transactionId: clip(b.transactionId, 30),
    name: clip(b.name, 120),
    whatsapp: clip(b.whatsapp, 30),
    address: clip(b.address, 500),
    note: clip(b.note, 500),
    email: clip(b.email, 120)
  };
  if (!order.ref || !order.name || !order.whatsapp || !order.address) {
    return json(400, { ok: false, error: "missing_fields" });
  }

  const v = await verifyTransaction({ transactionId: order.transactionId, txRef: order.ref });
  if (!v.configured) return json(503, { ok: false, error: "not_configured" });

  let products;
  try { products = await loadProducts(new URL(req.url).origin); }
  catch (e) { products = []; }
  const { total, lines } = priceOrder(products, b.items);

  let verified = false;
  let problem = v.reason || "";
  if (v.ok) {
    const d = v.data;
    if (d.tx_ref !== order.ref) problem = "payment reference does not match";
    else if (d.currency !== "NGN") problem = "wrong currency: " + d.currency;
    else if (!(total > 0)) problem = "could not work out order total";
    else if (Number(d.amount) < total) problem = `paid ₦${d.amount} but order total is ₦${total}`;
    else verified = true;
  }

  const saved = await sendToSheet({
    ref: order.ref,
    status: verified ? "PAID ✓ – arrange delivery" : "⚠ CHECK PAYMENT – " + problem,
    amount: v.ok ? v.data.amount : "",
    expected: total,
    items: lines.join("\n"),
    name: order.name,
    whatsapp: order.whatsapp,
    waLink: "https://wa.me/" + waNumber(order.whatsapp),
    address: order.address,
    note: order.note,
    email: order.email || (v.ok && v.data.customer ? v.data.customer.email : ""),
    flwId: v.ok ? v.data.id : order.transactionId,
    verified,
    notify: true
  });

  return json(200, { ok: true, verified, saved, problem: verified ? "" : problem });
};
