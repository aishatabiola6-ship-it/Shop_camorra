// Blush: set a new password after the customer proves they own the email
// with the 6-digit code sent by the Blush Gmail script (blush/email/blush-email.gs).
import { createClient } from "jsr:@supabase/supabase-js@2";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxpVXCfOyEansZkx_SV5rZzim54_HSqs2vmhBuvfE8_okSFlcGvyEUXfJQ8jQfRcCvB/exec";
const ALLOWED = ["https://blush-site.pages.dev", "https://aishatabiola6-ship-it.github.io"];

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const cors = {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ ok: false, error: "method" }, 405);

  let body: { email?: string; code?: string; password?: string } = {};
  try { body = await req.json(); } catch { return reply({ ok: false, error: "bad_json" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  const password = String(body.password || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || email.length > 120) return reply({ ok: false, error: "bad_email" }, 400);
  if (!/^\d{6}$/.test(code)) return reply({ ok: false, error: "bad_code" }, 400);
  if (password.length < 8 || password.length > 72 || !/\d/.test(password) || !/[a-z]/i.test(password)) return reply({ ok: false, error: "weak_password" }, 400);

  // 1. The Gmail script checks (and uses up) the code it emailed
  let v: { ok?: boolean; error?: string } = {};
  try {
    const r = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "verify", email, code }) });
    v = await r.json();
  } catch { return reply({ ok: false, error: "code_check_failed" }, 502); }
  if (!v.ok) return reply({ ok: false, error: v.error || "bad_code" }, 400);

  // 2. Set the new password on that account
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return reply({ ok: false, error: "lookup_failed" }, 500);
    const user = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (user) {
      const { error: e2 } = await admin.auth.admin.updateUserById(user.id, { password });
      return e2 ? reply({ ok: false, error: "update_failed" }, 500) : reply({ ok: true });
    }
    if (data.users.length < 1000) break;
  }
  return reply({ ok: false, error: "no_account" }, 404);
});
