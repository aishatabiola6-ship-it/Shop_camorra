/*
 * Sign-in emails for customers.
 *   action "code"   – email a 6-digit code (valid 10 minutes) and return a signed token
 *   action "verify" – check the code the customer typed against that token
 *   action "login"  – email a "Welcome" (first time) or "New sign-in" notice
 *
 * The code itself is never sent back to the browser – only an HMAC signature of it,
 * so it can't be read from the page. Uses SHEET_TOKEN as the signing secret.
 */
import crypto from "node:crypto";
import { json, clip, loadSite, sendEmail, emailLayout, escHtml } from "../lib/shared.mjs";

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const sign = (email, code, expires) =>
  crypto.createHmac("sha256", (process.env.SHEET_TOKEN || "").trim()).update(`${email}|${code}|${expires}`).digest("hex");
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Any unexpected crash is logged (Netlify -> Logs -> Functions -> auth-email) instead of failing silently.
export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error("[auth-email] CRASH:", e && e.stack ? e.stack : e);
    return json(500, { ok: false, error: "server_error" });
  }
};

async function handle(req) {
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });
  if (!(process.env.SHEET_WEBHOOK_URL || "").trim() || !(process.env.SHEET_TOKEN || "").trim()) return json(503, { ok: false, error: "not_configured" });

  let b;
  try { b = await req.json(); } catch (e) { return json(400, { ok: false, error: "bad_request" }); }
  const action = clip(b.action, 10);
  const email = clip(b.email, 120).toLowerCase();
  const name = clip(b.name, 80);
  if (!isEmail(email)) return json(400, { ok: false, error: "bad_email" });

  if (action === "verify") {
    const code = clip(b.code, 6);
    const expires = Number(b.expires) || 0;
    const token = clip(b.token, 64);
    if (!/^\d{6}$/.test(code) || !token) return json(200, { ok: false, error: "wrong_code" });
    if (Date.now() > expires) return json(200, { ok: false, error: "expired" });
    return json(200, same(sign(email, code, expires), token) ? { ok: true } : { ok: false, error: "wrong_code" });
  }

  let config = {};
  try { config = (await loadSite(new URL(req.url).origin)).config; } catch (e) { /* use defaults */ }
  const store = config.name || "Preshy Emporium";
  const hi = name ? `Hi ${escHtml(name.split(" ")[0])},` : "Hi,";

  if (action === "code") {
    const code = String(crypto.randomInt(100000, 1000000));
    const expires = Date.now() + 10 * 60 * 1000;
    const sent = await sendEmail({
      to: email,
      subject: `${code} is your ${store} sign-in code`,
      text: `Your ${store} sign-in code is ${code}. It expires in 10 minutes. If you didn't ask for this, you can ignore this email.`,
      html: emailLayout(config, "Your sign-in code", `
        <p>${hi}</p>
        <p>Use this code to sign in to ${escHtml(store)}:</p>
        <p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#c2185b;margin:18px 0">${code}</p>
        <p style="color:#7a6070">It expires in 10 minutes. If you didn't ask for this code, you can safely ignore this email.</p>`)
    });
    console.log(`[auth-email] code for ${email.replace(/^(.).*(@.*)$/, "$1***$2")}: ${sent ? "sent" : "FAILED (see [sheet] line above)"}`);
    if (!sent) return json(502, { ok: false, error: "send_failed" });
    return json(200, { ok: true, token: sign(email, code, expires), expires });
  }

  if (action === "login") {
    const first = b.first === true;
    const method = { google: "Google", apple: "Apple", email: "email code", password: "email & password" }[clip(b.method, 10)] || "your account";
    const when = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" });
    const site = new URL(req.url).origin;
    const sent = await sendEmail({
      to: email,
      subject: first ? `Welcome to ${store}!` : `New sign-in to your ${store} account`,
      text: first
        ? `Welcome to ${store}! Your account is ready. Shop now: ${site}`
        : `You signed in to ${store} on ${when} (Lagos time) using ${method}. If this wasn't you, please contact us on WhatsApp.`,
      html: first
        ? emailLayout(config, `Welcome to ${store}!`, `
            <p>${hi}</p>
            <p>Your account is ready. Explore our toys, games, lingerie and wellness products – every product page explains exactly how it works.</p>
            <ul style="padding-left:18px;color:#4a3344">
              <li>Discreet packaging, no product names on the parcel</li>
              <li>Secure payment with Flutterwave</li>
              <li>Delivery date and fee sent to you on WhatsApp</li>
            </ul>
            <p style="margin:22px 0"><a href="${escHtml(site)}" style="background:#e0457b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">Start shopping</a></p>`)
        : emailLayout(config, "New sign-in to your account", `
            <p>${hi}</p>
            <p>You just signed in to your ${escHtml(store)} account.</p>
            <p style="background:#f6eef3;border-radius:10px;padding:12px 14px">
              <strong>When:</strong> ${escHtml(when)} (Lagos time)<br><strong>How:</strong> ${escHtml(method)}</p>
            <p style="color:#7a6070">If this was you, there's nothing to do. If it wasn't, please message us on WhatsApp straight away.</p>`)
    });
    return json(sent ? 200 : 502, { ok: sent });
  }

  return json(400, { ok: false, error: "unknown_action" });
}
