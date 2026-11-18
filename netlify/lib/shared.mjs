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
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const clip = (v, n = 500) => String(v == null ? "" : v).trim().slice(0, n);
export { clip };

/** Ask Flutterwave directly whether a payment really succeeded. */
export async function verifyTransaction({ transactionId, txRef }) {
  const key = (process.env.FLW_SECRET_KEY || "").trim();
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

/**
 * Load the store settings and real prices (customers can't change these in their browser).
 * 1st choice: the copies shipped with the function (netlify.toml -> included_files).
 * Backup: download them from the live site.
 */
export async function loadSite(origin) {
  const errors = [];
  const parse = (cfgText, prodText, source) => {
    const ctx = { window: {} };
    vm.runInNewContext(cfgText, ctx, { timeout: 1000 });
    vm.runInNewContext(prodText, ctx, { timeout: 1000 });
    const products = ctx.window.PRODUCTS || [];
    if (!products.length) throw new Error("no products found");
    return { config: ctx.window.STORE_CONFIG || {}, products, source };
  };

  // 1) From disk
  const dirs = new Set();
  const add = (d) => { if (d) dirs.add(d); };
  add(process.cwd());
  add(process.env.LAMBDA_TASK_ROOT);
  try {
    let d = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 6; i++) { add(d); d = path.dirname(d); }
  } catch (e) { /* import.meta not available */ }
  for (const d of dirs) {
    try {
      const c = await fs.readFile(path.join(d, "config.js"), "utf8");
      const p = await fs.readFile(path.join(d, "products.js"), "utf8");
      return parse(c, p, "disk:" + d);
    } catch (e) { /* try next */ }
  }
  errors.push("not found on disk (" + [...dirs].join(", ") + ")");

  // 2) From the live site
  const origins = [...new Set([origin, process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL].filter(Boolean))];
  for (const o of origins) {
    try {
      const [cfg, prods] = await Promise.all([fetch(o + "/config.js"), fetch(o + "/products.js")]);
      if (!cfg.ok || !prods.ok) throw new Error(`HTTP ${cfg.status}/${prods.status}`);
      return parse(await cfg.text(), await prods.text(), "web:" + o);
    } catch (e) {
      errors.push(o + " → " + (e && e.message));
    }
  }
  throw new Error(errors.join(" | "));
}

export async function loadProducts(origin) {
  return (await loadSite(origin)).products;
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

/** Send data to the Google Apps Script (adds/updates an order row, or sends an email). */
export async function sendToSheet(payload) {
  const url = (process.env.SHEET_WEBHOOK_URL || "").trim();
  if (!url) return false;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, token: (process.env.SHEET_TOKEN || "").trim() }),
      redirect: "follow"
    });
    if (!r.ok) return false;
    const body = await r.json().catch(() => null);
    return !!(body && body.ok);
  } catch (e) {
    return false;
  }
}

/** Send an email through the Google account that owns the order sheet. */
export function sendEmail({ to, subject, html, text }) {
  return sendToSheet({ action: "email", to, subject, html, text });
}

const escHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export { escHtml };

/** Wrap email content in a simple branded layout. */
export function emailLayout(config, title, innerHtml) {
  const wa = config.whatsapp ? "+" + String(config.whatsapp).replace(/^(\d{3})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4") : "";
  return `<!doctype html><html><body style="margin:0;background:#f6eef3;font-family:Arial,Helvetica,sans-serif;color:#2a1526">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="background:#140a12;border-radius:16px 16px 0 0;padding:22px;text-align:center">
      <span style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#f6e9f1">Preshy <span style="color:#ff7aa8">Emporium</span></span>
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:26px 24px;line-height:1.6;font-size:15px">
      <h2 style="margin:0 0 14px;font-family:Georgia,serif;color:#140a12">${escHtml(title)}</h2>
      ${innerHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0 14px">
      <p style="font-size:13px;color:#7a6070;margin:0">Questions? WhatsApp us on <a href="https://wa.me/${escHtml(config.whatsapp || "")}" style="color:#c2185b">${escHtml(wa)}</a>${config.tiktok ? ` · <a href="${escHtml(config.tiktok)}" style="color:#c2185b">TikTok</a>` : ""}</p>
      <p style="font-size:12px;color:#9a8090;margin:6px 0 0">For adults 18+ only. All orders are packed discreetly.</p>
    </div>
  </div></body></html>`;
}
