/*
 * Called by the website when the customer submits their delivery details after paying.
 * 1. Recalculates the order total from the real prices.
 * 2. Asks Flutterwave whether the payment really succeeded for the right amount.
 * 3. Saves the order to the Google Sheet and emails Preshy.
 * 4. Emails the customer an order confirmation (only when the payment is verified).
 */
import { json, clip, verifyTransaction, loadSite, priceOrder, waNumber, sendToSheet, sendEmail, emailLayout, escHtml } from "../lib/shared.mjs";

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

  let products = [], config = {};
  try { ({ products, config } = await loadSite(new URL(req.url).origin)); }
  catch (e) { /* keep defaults */ }
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

  const customerEmail = order.email || (v.ok && v.data.customer ? v.data.customer.email : "");
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
    email: customerEmail,
    flwId: v.ok ? v.data.id : order.transactionId,
    verified,
    notify: true
  });

  let customerEmailed = false;
  if (verified && customerEmail) {
    customerEmailed = await sendEmail(orderConfirmation(config, order, customerEmail, lines, v.data.amount));
  }

  return json(200, { ok: true, verified, saved, customerEmailed, problem: verified ? "" : problem });
};

function orderConfirmation(config, order, to, lines, paid) {
  const store = config.name || "Preshy Emporium";
  const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");
  const rows = lines.map((l) => {
    const [item, amount] = l.split(" = ");
    return `<tr><td style="padding:8px 0;border-bottom:1px solid #f0e4ea">${escHtml(item)}</td><td style="padding:8px 0;border-bottom:1px solid #f0e4ea;text-align:right;white-space:nowrap">${escHtml(amount)}</td></tr>`;
  }).join("");
  return {
    to,
    subject: `Order confirmed – ${order.ref} | ${store}`,
    text: [
      `Hi ${order.name.split(" ")[0]}, thank you for your order!`, "",
      `Order ref: ${order.ref}`, ...lines, `Paid: ${naira(paid)}`, "",
      `Delivery to: ${order.address}`, "",
      `Your delivery date and delivery fee will be sent to you on WhatsApp at ${order.whatsapp}.`,
      config.whatsapp ? `Questions? WhatsApp us: https://wa.me/${config.whatsapp}` : ""
    ].join("\n"),
    html: emailLayout(config, "Thank you for your order!", `
      <p>Hi ${escHtml(order.name.split(" ")[0])},</p>
      <p>We've received your payment and your order is confirmed.</p>
      <p style="margin:0 0 6px"><strong>Order ref:</strong> ${escHtml(order.ref)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 6px">${rows}
        <tr><td style="padding:10px 0;font-weight:bold">Paid</td><td style="padding:10px 0;text-align:right;font-weight:bold">${escHtml(naira(paid))}</td></tr>
      </table>
      <p style="margin:14px 0 4px"><strong>Delivery to:</strong><br>${escHtml(order.address)}</p>
      <p style="background:#f6eef3;border-radius:10px;padding:12px 14px;margin:18px 0">📦 Your <strong>delivery date</strong> and <strong>delivery fee</strong> will be sent to you on WhatsApp at <strong>${escHtml(order.whatsapp)}</strong>.</p>
      <p style="color:#7a6070">Your parcel will be packed discreetly with no product names on it.</p>`)
  };
}
