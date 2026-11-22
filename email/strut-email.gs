/**
 * Strut email sender (Google Apps Script)
 *
 * Sends Strut's emails from the Gmail account that deploys this script:
 *   - 6-digit sign-up / password-reset codes (generated and checked here, never sent to the browser)
 *   - "Welcome to Strut" after an account is created
 *   - "Welcome back" after each sign-in
 *   - "Order confirmed" after checkout
 *
 * Setup: see email/SETUP.md. Paste this whole file into script.google.com,
 * run `setup` once, then Deploy -> New deployment -> Web app (Execute as: Me, Access: Anyone).
 *
 * The emails are built here from fixed templates; the website can only fill in names,
 * order lines and amounts. Everything it sends is escaped and length-limited, and each
 * address and the whole script are rate-limited, so the URL can't be used to send
 * arbitrary mail from your account.
 */

const SENDER_NAME = "Strut";
const SITE_URL = "https://aishatabiola6-ship-it.github.io/Shop_camorra/";
const WHATSAPP = "2349125837823";
const DAILY_LIMIT = 90;           // Gmail allows ~100/day on a normal account

function setup() {
  // Running this once makes Google ask for permission to send email as you.
  MailApp.getRemainingDailyQuota();
  Logger.log("Ready. Emails left today: " + MailApp.getRemainingDailyQuota());
}

function doGet() {
  return json({ ok: true, service: "strut-email" });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (err) { return json({ ok: false, error: "bad_json" }); }
  const action = String(body.action || "");
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || email.length > 120) return json({ ok: false, error: "bad_email" });

  try {
    if (action === "code")    return sendCode(email, clean(body.name, 60), body.purpose === "reset" ? "reset" : "signup");
    if (action === "verify")  return verifyCode(email, String(body.code || ""));
    if (action === "welcome") return sendWelcome(email, clean(body.name, 60));
    if (action === "signin")  return sendSignIn(email, clean(body.name, 60));
    if (action === "order")   return sendOrder(email, body.order || {});
    return json({ ok: false, error: "bad_action" });
  } catch (err) {
    return json({ ok: false, error: "send_failed" });
  }
}

/* ---------- codes ---------- */

function sendCode(email, name, purpose) {
  if (!allow("code:" + email, 1, 30) || !allow("codeh:" + email, 6, 3600)) return json({ ok: false, error: "too_many" });
  const code = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  CacheService.getScriptCache().put("c:" + email, JSON.stringify({ code: code, tries: 0 }), 600);
  const what = purpose === "reset" ? "reset your password" : "confirm your email";
  send(email, "Your Strut code: " + code,
    h("Your code") +
    p((name ? "Hi " + esc(firstName(name)) + ", use" : "Use") + " this code to " + what + ":") +
    '<div style="font-size:34px;letter-spacing:10px;font-weight:600;text-align:center;background:#f6f0e8;border-radius:14px;padding:18px 0 18px 10px;margin:8px 0 18px;color:#1b1714">' + code + "</div>" +
    p("It expires in 10 minutes. If you didn't ask for this, you can ignore this email."));
  return json({ ok: true, expires: Date.now() + 600000 });
}

function verifyCode(email, code) {
  const cache = CacheService.getScriptCache();
  const raw = cache.get("c:" + email);
  if (!raw) return json({ ok: false, error: "expired" });
  const rec = JSON.parse(raw);
  if (rec.tries >= 5) { cache.remove("c:" + email); return json({ ok: false, error: "too_many" }); }
  if (code.replace(/\D/g, "") !== rec.code) {
    rec.tries++; cache.put("c:" + email, JSON.stringify(rec), 600);
    return json({ ok: false, error: "wrong" });
  }
  cache.remove("c:" + email);
  cache.put("v:" + email, "1", 1800);            // allows one welcome email for this address
  return json({ ok: true });
}

/* ---------- welcome / sign-in ---------- */

function sendWelcome(email, name) {
  const cache = CacheService.getScriptCache();
  if (!cache.get("v:" + email)) return json({ ok: false, error: "not_verified" });
  cache.remove("v:" + email);
  const n = esc(firstName(name) || "there");
  send(email, "Welcome to Strut, " + (firstName(name) || "friend"),
    '<img src="' + SITE_URL + 'img/email-welcome.jpg" width="472" alt="Heels, flats, sneakers and boots at Strut" style="display:block;width:100%;max-width:472px;height:auto;border-radius:12px;margin:0 0 20px">' +
    h("Welcome, " + n + ".") +
    p("Your Strut account is ready. We pick every pair by hand, so you'll only find shoes we'd wear ourselves.") +
    box("<b>With your account you can:</b><br>· Check out faster with your saved address<br>· Track your orders in one place<br>· Request a pair you've seen elsewhere") +
    btn("Start shopping", SITE_URL + "#shop") +
    p("See you soon,<br>The Strut team"));
  return json({ ok: true });
}

function sendSignIn(email, name) {
  if (!allow("signin:" + email, 1, 600)) return json({ ok: true, skipped: true });
  const when = Utilities.formatDate(new Date(), "Africa/Lagos", "EEEE d MMMM, HH:mm");
  send(email, "Welcome back, " + (firstName(name) || "friend"),
    h("Welcome back, " + esc(firstName(name) || "there") + ".") +
    p("You signed in to Strut on " + when + ".") +
    btn("See what's new", SITE_URL + "#shop") +
    p("Wasn't you? Reset your password from the sign-in page straight away."));
  return json({ ok: true });
}

/* ---------- order ---------- */

function sendOrder(email, o) {
  if (!allow("order:" + email, 5, 3600)) return json({ ok: false, error: "too_many" });
  const items = (Array.isArray(o.items) ? o.items : []).slice(0, 12);
  const rows = items.map(function (l) {
    const img = /^[a-z0-9-]{1,40}\.jpg$/.test(String(l.img || "")) ? SITE_URL + "img/thumb/" + l.img : "";
    return '<tr>' + (img ? '<td style="padding:8px 12px 8px 0;border-bottom:1px solid #ddd0bf;width:64px"><img src="' + img + '" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border-radius:10px"></td>' : '<td style="border-bottom:1px solid #ddd0bf"></td>') +
      '<td style="padding:8px 0;border-bottom:1px solid #ddd0bf">' + esc(clean(l.name, 60)) +
      '<br><span style="color:#6f655c;font-size:13px">' + esc(clean(l.detail, 80)) + "</span></td>" +
      '<td style="padding:8px 0;border-bottom:1px solid #ddd0bf;text-align:right;white-space:nowrap">' + esc(clean(l.price, 20)) + "</td></tr>";
  }).join("");
  const line = function (a, b, bold) {
    return '<tr><td></td><td style="padding:7px 0;' + (bold ? "font-weight:600" : "border-bottom:1px solid #ddd0bf") + '">' + a +
      '</td><td style="padding:7px 0;text-align:right;' + (bold ? "font-weight:600" : "border-bottom:1px solid #ddd0bf") + '">' + b + "</td></tr>";
  };
  const no = esc(clean(o.no, 20));
  const name = firstName(clean(o.name, 60)) || "there";
  let body =
    h("Thank you, " + esc(name) + ".") +
    p("Your order <b>#" + no + "</b> is confirmed and being packed with love.") +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:6px 0 16px">' + rows +
    line("Subtotal", esc(clean(o.sub, 20))) +
    line("Delivery (" + esc(clean(o.ship, 20)) + ")", esc(clean(o.fee, 20))) +
    line("Total", esc(clean(o.total, 20)), true) + "</table>";
  if (o.note) body += box("<b>Gift note</b><br><i>“" + esc(clean(o.note, 200)) + "”</i><br>We'll write this on a card in your parcel.");
  body += box(esc(clean(o.payText, 240)));
  body += p("<b>" + esc(clean(o.whereLabel, 20)) + ":</b> " + esc(clean(o.where, 160)) + "<br>Estimated: " + esc(clean(o.eta, 60)));
  send(email, "Order confirmed #" + clean(o.no, 20), body);
  return json({ ok: true });
}

/* ---------- helpers ---------- */

function send(to, subject, inner) {
  if (MailApp.getRemainingDailyQuota() < 1 || !allow("daily", DAILY_LIMIT, 86400)) throw new Error("quota");
  const html =
    '<div style="background:#f6f0e8;padding:24px 12px;font-family:Helvetica,Arial,sans-serif;color:#1b1714">' +
    '<div style="max-width:520px;margin:0 auto;background:#fffaf3;border-radius:18px;overflow:hidden">' +
    '<div style="background:#1b1714;color:#fff;text-align:center;padding:22px;font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:34px;letter-spacing:-1px">Strut<span style="color:#c9a76c">.</span></div>' +
    '<div style="padding:26px 24px 8px;font-size:15px;line-height:1.6">' + inner + "</div>" +
    '<div style="padding:16px 24px 24px;font-size:12px;color:#6f655c;border-top:1px solid #ddd0bf">You\'re receiving this because you used Strut. Questions? Reply to this email or message us on <a href="https://wa.me/' + WHATSAPP + '" style="color:#1f7a4d">WhatsApp</a>.</div>' +
    "</div></div>";
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: html, name: SENDER_NAME });
}

function allow(key, max, seconds) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const cache = CacheService.getScriptCache();
    const n = Number(cache.get("rl:" + key) || 0);
    if (n >= max) return false;
    cache.put("rl:" + key, String(n + 1), seconds);
    return true;
  } finally { lock.releaseLock(); }
}

const h = function (t) { return '<h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 10px">' + t + "</h1>"; };
const p = function (t) { return '<p style="margin:0 0 14px;color:#4b433c">' + t + "</p>"; };
const box = function (t) { return '<div style="background:#f6f0e8;border-radius:12px;padding:12px 14px;font-size:14px;margin:0 0 14px">' + t + "</div>"; };
const btn = function (t, url) { return '<a href="' + url + '" style="display:inline-block;background:#1b1714;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:4px 0 16px">' + t + "</a>"; };
function clean(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max); }
function firstName(n) { return String(n || "").trim().split(/\s+/)[0]; }
function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
