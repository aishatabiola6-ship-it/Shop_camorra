/*
 * Setup checker – open https://<your-site>.netlify.app/.netlify/functions/check-setup
 * Shows which parts of the automation are working. Never shows the secret values.
 */
import crypto from "node:crypto";
import { loadSite, callScript, emailLayout } from "../lib/shared.mjs";

const escape = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

/** Optional test email: the form below posts the secret phrase + an address. */
async function testEmail(req, config) {
  if (req.method !== "POST") return "";
  const form = new URLSearchParams(await req.text());
  const phrase = (form.get("phrase") || "").trim();
  const to = (form.get("to") || "").trim();
  const token = (process.env.SHEET_TOKEN || "").trim();
  if (!token || !phrase || !same(phrase, token)) return `<div class="row"><span class="bad">❌</span> Test email not sent – the secret phrase is wrong.</div>`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return `<div class="row"><span class="bad">❌</span> Test email not sent – that email address doesn't look right.</div>`;
  const r = await callScript({
    action: "email", to,
    subject: "Test email from Preshy Emporium",
    text: "If you can read this, customer emails are working.",
    html: emailLayout(config, "Test email", "<p>If you can read this, customer emails (sign-in codes and order confirmations) are working. 🎉</p>")
  });
  return r.ok
    ? `<div class="row"><span class="ok">✅</span> Test email sent to ${escape(to)}. Check the inbox <b>and spam</b> in the next minute. If it's not there, also look in the <b>Sent</b> folder of the Google account that runs the script.</div>`
    : `<div class="row"><span class="bad">❌</span> Google could not send the test email.<div class="help">Error from Google: ${escape(r.error)}</div></div>`;
}

export default async (req) => {
  const env = (k) => !!(process.env[k] && process.env[k].trim());
  const rows = [];
  const add = (ok, label, help = "") => rows.push({ ok, label, help });

  // 1. Netlify environment variables
  add(env("SHEET_WEBHOOK_URL"), "Netlify has SHEET_WEBHOOK_URL", "Add it in Netlify → Environment variables, then redeploy.");
  add(env("SHEET_TOKEN"), "Netlify has SHEET_TOKEN", "Add it in Netlify → Environment variables, then redeploy.");
  add(env("FLW_SECRET_KEY"), "Netlify has FLW_SECRET_KEY", "Add it in Netlify → Environment variables, then redeploy.");
  add(env("FLW_WEBHOOK_HASH"), "Netlify has FLW_WEBHOOK_HASH", "Add it in Netlify → Environment variables, then redeploy.");

  const url = (process.env.SHEET_WEBHOOK_URL || "").trim();
  if (url) {
    add(/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url), "SHEET_WEBHOOK_URL looks like a Google Web app URL (…/exec)",
      "It should start with https://script.google.com/macros/s/ and end with /exec – copy it again from Deploy → Manage deployments.");
  }

  // 2. Google Apps Script
  if (url && env("SHEET_TOKEN")) {
    let reply = null, text = "";
    try {
      const r = await fetch(url, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "ping", token: process.env.SHEET_TOKEN.trim() }), redirect: "follow"
      });
      text = await r.text();
      try { reply = JSON.parse(text); } catch (e) { reply = null; }
    } catch (e) { text = String(e); }

    if (!reply) {
      add(false, "Google script answers", /accounts\.google|ServiceLogin|sign in/i.test(text)
        ? "Google asked for a login – in Apps Script go to Deploy → Manage deployments → ✏️ and set 'Who has access' to Anyone, then Deploy."
        : "No answer from the script – check the URL, and that you clicked Deploy (not just Save).");
    } else {
      add(true, "Google script answers");
      if (!reply.version) {
        add(false, "Google script is the latest version",
          "The OLD script is still running. Paste the new code, put your TOKEN back, Save, then Deploy → Manage deployments → ✏️ → Version: New version → Deploy.");
      } else {
        add(true, "Google script is the latest version (v" + reply.version + ")");
        add(reply.ok === true, "Secret phrase matches (script TOKEN = Netlify SHEET_TOKEN)",
          "The TOKEN line in the script and SHEET_TOKEN in Netlify must be exactly the same (no spaces, same capitals). Fix one, then redeploy that side.");
        if (reply.ok) add(reply.quota > 0, "Gmail can still send emails today (" + reply.quota + " left)", "Daily Gmail limit reached – emails resume tomorrow.");
      }
    }
  }

  // 3. Flutterwave secret key
  if (env("FLW_SECRET_KEY")) {
    const key = process.env.FLW_SECRET_KEY.trim();
    add(/^FLWSECK(_TEST)?-/.test(key), "FLW_SECRET_KEY looks like a Flutterwave secret key", "It should start with FLWSECK_TEST- (test) or FLWSECK- (live). Don't use the public or encryption key.");
    try {
      const r = await fetch("https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=setup-check", { headers: { Authorization: "Bearer " + key } });
      add(r.status !== 401, "Flutterwave accepts the secret key", "Flutterwave rejected the key – copy the Secret key again from Settings → API Keys.");
    } catch (e) {
      add(false, "Flutterwave accepts the secret key", "Could not reach Flutterwave right now – try again in a minute.");
    }
  }

  // 4. Site files
  let siteConfig = {};
  try {
    const { config, products, source } = await loadSite(new URL(req.url).origin);
    siteConfig = config;
    add(products.length > 0, `Prices &amp; settings load (${products.length} products, from ${source.startsWith("disk") ? "function files" : "website"})`);
    add(/^FLWPUBK/.test((config.flutterwave && config.flutterwave.publicKey) || ""), "Flutterwave public key is on the website");
  } catch (e) {
    add(false, "Prices &amp; settings load", "Could not read config.js / products.js. Send a screenshot of this line to your developer. Details: "
      + String(e && e.message).replace(/[<>&]/g, "").slice(0, 400));
  }

  const allOk = rows.every((r) => r.ok);
  const testResult = await testEmail(req, siteConfig);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Setup check</title><style>
body{font-family:system-ui,Arial,sans-serif;background:#140a12;color:#f6e9f1;margin:0;padding:20px 16px}
.box{max-width:640px;margin:0 auto}h1{font-size:1.4rem}.row{background:#2a1526;border:1px solid #3d2238;border-radius:12px;padding:12px 14px;margin:10px 0}
.ok{color:#5fe39a}.bad{color:#ff8a8a}.help{color:#e8c07a;font-size:.92rem;margin-top:6px}.sum{padding:14px;border-radius:12px;font-weight:600}
</style></head><body><div class="box"><h1>Preshy Emporium – setup check</h1>
<div class="sum" style="background:${allOk ? "#1e5e3a" : "#5e1e2a"}">${allOk ? "✅ Everything is set up correctly." : "⚠️ Something needs fixing – see the red lines below (fix the first one first)."}</div>
${rows.map((r) => `<div class="row"><span class="${r.ok ? "ok" : "bad"}">${r.ok ? "✅" : "❌"}</span> ${r.label}${!r.ok && r.help ? `<div class="help">${r.help}</div>` : ""}</div>`).join("")}
<h2 style="font-size:1.1rem;margin-top:28px">Send a test email</h2>
${testResult}
<form method="POST" class="row" style="display:flex;flex-direction:column;gap:10px">
  <label>Your secret phrase (the same as SHEET_TOKEN)<br><input name="phrase" type="password" required style="width:100%;padding:10px;border-radius:8px;border:1px solid #3d2238;background:#1e0f1b;color:#f6e9f1"></label>
  <label>Send the test to this email<br><input name="to" type="email" required style="width:100%;padding:10px;border-radius:8px;border:1px solid #3d2238;background:#1e0f1b;color:#f6e9f1"></label>
  <button style="padding:12px;border:0;border-radius:999px;background:#e0457b;color:#fff;font-weight:600;font-size:1rem">Send test email</button>
</form>
<p style="color:#b99aae;font-size:.85rem">Checked ${new Date().toUTCString()}. No secret values are shown on this page.</p></div></body></html>`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
};
