/**
 * Preshy Emporium – order sheet + email alerts.
 *
 * Paste this whole file into Extensions -> Apps Script of your Google Sheet.
 * Follow automation/SETUP.md for the exact steps.
 */

// 1) Make up a long secret phrase and put it here AND in Netlify as SHEET_TOKEN.
const TOKEN = "PASTE-YOUR-SECRET-PHRASE-HERE";

// 2) Where new-order emails go.
const OWNER_EMAIL = "egwuenuprecious18@gmail.com";

const SHEET_NAME = "Orders";
const HEADERS = ["Date", "Order ref", "Status", "Amount paid (₦)", "Order total (₦)", "Items",
  "Customer name", "WhatsApp", "Reply on WhatsApp", "Delivery address", "Note", "Email",
  "Flutterwave ID", "Payment verified"];
const KEYS = [null, "ref", "status", "amount", "expected", "items",
  "name", "whatsapp", "waLink", "address", "note", "email",
  "flwId", "verified"];

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: "bad json" }); }
  if (!d || d.token !== TOKEN || !d.ref) return out({ ok: false, error: "unauthorized" });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getSheet();
    const last = sh.getLastRow();
    const refs = last > 1 ? sh.getRange(2, 2, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const idx = refs.indexOf(String(d.ref));

    if (idx === -1) {
      sh.appendRow(HEADERS.map((h, i) => (i === 0 ? new Date() : cell(KEYS[i], d[KEYS[i]]))));
    } else {
      const row = idx + 2;
      const range = sh.getRange(row, 1, 1, HEADERS.length);
      const cur = range.getValues()[0];
      KEYS.forEach((k, i) => {
        if (!k) return;
        const v = cell(k, d[k]);
        if (v === "") return;                       // never wipe existing info
        if (d.onlyFillEmpty && cur[i] !== "") return; // webhook only fills gaps
        cur[i] = v;
      });
      range.setValues([cur]);
    }
  } finally {
    lock.releaseLock();
  }

  if (d.notify) {
    const ok = d.verified === true;
    const subject = (ok ? "✅ New paid order " : "⚠️ Order to check ") + d.ref + " – " + (d.name || "");
    const body = [
      ok ? "A new order has been PAID and verified with Flutterwave." :
           "An order came in but the payment could NOT be verified automatically. Check Flutterwave before sending.",
      "",
      "Status: " + (d.status || ""),
      "Order ref: " + d.ref,
      "Amount paid: ₦" + (d.amount || "?") + "   (order total ₦" + (d.expected || "?") + ")",
      "",
      "Items:", d.items || "", "",
      "Name: " + (d.name || ""),
      "WhatsApp: " + (d.whatsapp || ""),
      "Address: " + (d.address || ""),
      d.note ? "Note: " + d.note : "",
      "",
      "Message the customer about the delivery date and fee:",
      d.waLink || "",
      "",
      "All orders: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    ].join("\n");
    MailApp.sendEmail(OWNER_EMAIL, subject, body);
  }
  return out({ ok: true });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function val(v) {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return v == null ? "" : String(v);
}

// Keep phone numbers as text so Sheets doesn't drop the leading 0.
function cell(key, v) {
  const s = val(v);
  return key === "whatsapp" && s ? "'" + s : s;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the editor to create the Orders tab and approve email permission. */
function setup() {
  getSheet();
  MailApp.getRemainingDailyQuota();
}
