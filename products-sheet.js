/*
 * Reads the product list from a Google Sheet (published as CSV).
 * Used by the website (browser) and by the order checker (Netlify function),
 * so prices always match on both sides.
 *
 * Sheet columns (row 1 = headings, any order):
 *   id | name | category | price | in_stock | option_name | options | description |
 *   features | how_it_works | note | photos
 *   - features / how_it_works / options / photos: separate items with  |  (or a new line, or commas for options/photos)
 *   - in_stock: Yes / No (empty = Yes)
 *   - photos: images/xxx.jpg, or any image link, or a Google Drive share link (file must be shared "Anyone with the link")
 */
(function (g) {
  function parseCsv(text) {
    const rows = []; let row = [], cell = "", q = false;
    text = String(text).replace(/^﻿/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => String(x).trim() !== ""));
  }

  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const list = (s, alsoComma) => String(s || "").split(alsoComma ? /\s*(?:\||\n|,)\s*/ : /\s*(?:\||\n)\s*/).map((x) => x.trim()).filter(Boolean);
  const yes = (s) => !/^(no|n|false|0|sold ?out|out of stock)$/i.test(String(s || "").trim());

  // Google Drive share links -> direct image links
  function photo(u) {
    u = String(u).trim();
    const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
    return m ? "https://lh3.googleusercontent.com/d/" + m[1] : u;
  }

  const COLORS = ["#e0457b", "#9c2a56", "#7b1fa2", "#3f51b5", "#c62828", "#ef6c00", "#00838f", "#5d4037"];

  function parseProductsCsv(text) {
    const rows = parseCsv(text);
    if (rows.length < 2) return [];
    const head = rows[0].map((h) => String(h).trim().toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, ""));
    const col = (r, ...names) => { for (const n of names) { const i = head.indexOf(n); if (i !== -1 && r[i] != null) return String(r[i]).trim(); } return ""; };
    const out = [], seen = new Set();
    rows.slice(1).forEach((r, k) => {
      const name = col(r, "name", "product_name", "product");
      const price = Number(col(r, "price", "price_naira").replace(/[^\d.]/g, ""));
      if (!name || !(price > 0)) return; // skip incomplete rows
      let id = slug(col(r, "id") || name) || "item-" + (k + 1);
      while (seen.has(id)) id += "-2";
      seen.add(id);
      const opts = list(col(r, "options", "colours", "colors", "sizes"), true);
      const p = {
        id, name, price,
        category: col(r, "category") || "Other",
        color: COLORS[k % COLORS.length],
        images: list(col(r, "photos", "images", "photo", "image"), true).map(photo),
        description: col(r, "description"),
        features: list(col(r, "features", "why_you_ll_love_it", "highlights")),
        howItWorks: list(col(r, "how_it_works", "how_to_use", "steps")),
        inStock: yes(col(r, "in_stock", "stock", "available"))
      };
      const note = col(r, "note", "important");
      if (note) p.note = note;
      if (opts.length) p.options = { label: col(r, "option_name", "option_label") || "Option", values: opts };
      out.push(p);
    });
    return out;
  }

  g.parseProductsCsv = parseProductsCsv;
})(typeof window !== "undefined" ? window : globalThis);
