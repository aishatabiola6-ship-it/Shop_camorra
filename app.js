/* Preshy Emporium – single-page storefront (no build step needed). */
(function () {
  "use strict";

  const CFG = window.STORE_CONFIG;
  const PRODUCTS = window.PRODUCTS;
  const app = document.getElementById("app");
  const PAY_DEMO = !(CFG.flutterwave && CFG.flutterwave.publicKey);
  const TEST_MODE = PAY_DEMO || /_TEST-/.test(CFG.flutterwave.publicKey);
  const WA = CFG.whatsapp;
  const WA_DISPLAY = "+" + WA.replace(/^(\d{3})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4");
  const waLink = (text) => "https://wa.me/" + WA + (text ? "?text=" + encodeURIComponent(text) : "");

  /* ---------------- storage helpers ---------------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("pe_" + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("pe_" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    del(key) { try { localStorage.removeItem("pe_" + key); } catch (e) { /* ignore */ } }
  };

  const money = (n) => CFG.currency + n.toLocaleString("en-NG");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function toast(msg, ms) {
    const t = document.getElementById("toast");
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), ms || 2600);
  }

  async function hash(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    return "f" + h;
  }

  /* ---------------- cart ---------------- */
  // A cart key is the product id, plus "|<choice>" when the product has options (e.g. "orgasm-pen|Purple").
  const lineOf = (key, q) => {
    const i = key.indexOf("|");
    const p = findProduct(i === -1 ? key : key.slice(0, i));
    return p ? { key, p, opt: i === -1 ? "" : key.slice(i + 1), q } : null;
  };
  const optLabel = (l) => (l.opt ? ` (${l.p.options ? l.p.options.label + ": " : ""}${l.opt})` : "");
  const cart = {
    items() { return store.get("cart", {}); },
    count() { return Object.values(this.items()).reduce((a, b) => a + b, 0); },
    add(id, qty) {
      const c = this.items(); c[id] = (c[id] || 0) + (qty || 1); store.set("cart", c); updateBadge();
    },
    setQty(id, qty) {
      const c = this.items();
      if (qty <= 0) delete c[id]; else c[id] = qty;
      store.set("cart", c); updateBadge();
    },
    clear() { store.set("cart", {}); updateBadge(); },
    total() {
      return Object.entries(this.items()).reduce((sum, [key, q]) => {
        const l = lineOf(key, q); return l ? sum + l.p.price * q : sum;
      }, 0);
    }
  };

  function updateBadge() {
    const n = cart.count();
    ["cartCount", "tabCount"].forEach((id) => {
      const b = document.getElementById(id);
      if (!b) return;
      b.textContent = n;
      b.style.display = n ? "inline-flex" : "none";
    });
  }

  /* ---------------- saved (wishlist) ---------------- */
  const saved = {
    list() { return store.get("saved", []); },
    has(id) { return this.list().includes(id); },
    toggle(id) {
      const l = this.list(); const i = l.indexOf(id);
      if (i === -1) l.unshift(id); else l.splice(i, 1);
      store.set("saved", l); return i === -1;
    }
  };
  const HEART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-9.3-9.4C1.5 7.3 3.7 4 7.1 4c2 0 3.6 1.1 4.9 2.8C13.3 5.1 14.9 4 16.9 4c3.4 0 5.6 3.3 4.4 6.6C19.5 15.4 12 20 12 20z"/></svg>`;
  const heartBtn = (p) => `<button class="heart ${saved.has(p.id) ? "on" : ""}" data-heart="${p.id}" aria-label="Save ${esc(p.name)}">${HEART}</button>`;

  /* ---------------- accounts ---------------- */
  const auth = {
    users() { return store.get("users", {}); },
    saveUser(u) { const all = this.users(); all[u.email] = u; store.set("users", all); },
    current() { const e = store.get("session", null); return e ? this.users()[e] || null : null; },
    signIn(email) { store.set("session", email); updateAccountLink(); },
    signOut() { store.del("session"); updateAccountLink(); }
  };

  function updateAccountLink() {
    const u = auth.current();
    document.getElementById("accountLink").textContent = u ? "My account" : "Sign in";
  }

  // Pending verification lives in sessionStorage (one tab).
  const pending = {
    get() { try { return JSON.parse(sessionStorage.getItem("pe_pending")); } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem("pe_pending", JSON.stringify(v)); } catch (e) { /* ignore */ } },
    clear() { try { sessionStorage.removeItem("pe_pending"); } catch (e) { /* ignore */ } }
  };

  // Calls a Netlify function; returns { status, body } (status 0 = network error).
  async function callFn(name, payload) {
    try {
      const res = await fetch("/.netlify/functions/" + name, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    } catch (e) {
      return { status: 0, body: {} };
    }
  }

  async function sendCode(email, method, name) {
    // 1) Real email through the Netlify automation.
    const r = await callFn("auth-email", { action: "code", email, name });
    if (r.status === 200 && r.body.ok) {
      pending.set({ email, method, server: true, token: r.body.token, expires: r.body.expires });
      toast("Code sent to " + esc(email));
      return true;
    }
    if (r.status === 400) {
      toast("Please check the email address and try again.");
      return false;
    }
    if (r.status !== 503 && r.status !== 404 && r.status !== 0) {
      // The email system is set up but something failed – say so instead of silently using demo mode.
      toast("Sorry, we couldn't send the code right now (error " + r.status + "). Please try again in a minute or contact us on WhatsApp.", 7000);
      return false;
    }
    // 2) Email automation not set up (503) or not available (404 / offline): demo mode, show the code on screen.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    pending.set({ email, method, server: false, codeHash: await hash(code), expires: Date.now() + 10 * 60 * 1000 });
    try { sessionStorage.setItem("pe_demo_code", code); } catch (e) { /* ignore */ }
    toast("Demo mode – your code is <b>" + code + "</b>", 9000);
    return true;
  }

  async function checkCode(p, code) {
    if (Date.now() > p.expires) return "expired";
    if (p.server) {
      const r = await callFn("auth-email", { action: "verify", email: p.email, code, token: p.token, expires: p.expires });
      if (r.status === 200) return r.body.ok ? "ok" : (r.body.error === "expired" ? "expired" : "wrong");
      return "error";
    }
    return (await hash(code)) === p.codeHash ? "ok" : "wrong";
  }

  // "Welcome" email the first time, "New sign-in" email after that.
  function sendLoginEmail(email, method) {
    const u = auth.users()[email];
    if (!u) return;
    const first = !u.welcomed;
    u.welcomed = true; auth.saveUser(u);
    callFn("auth-email", { action: "login", email, name: u.name || "", method, first });
  }

  /* ---------------- product visuals ---------------- */
  function productArt(p, big) {
    const img = (p.images && p.images[0]) || p.image;
    if (img) return `<div class="art-photo ${big ? "art-big" : ""}"><img src="${esc(img)}" alt="${esc(p.name)}" class="art-img" loading="lazy" id="${big ? "mainImg" : ""}"></div>`;
    const initials = p.name.split(" ").slice(0, 2).map((w) => w[0]).join("");
    return `<div class="art ${big ? "art-big" : ""}" style="--c:${p.color}">
      <span class="art-mark">${esc(initials)}</span>
      <span class="art-cat">${esc(p.category)}</span>
    </div>`;
  }

  /* ---------------- views ---------------- */
  function viewOpening() {
    return `
    <section class="opening">
      <div class="opening-card">
        <h1 class="logo">Preshy<br><span>Emporium</span></h1>
        <p class="tagline">Pleasure, wellness &amp; intimacy – delivered discreetly.</p>
      </div>
      <div class="age-box">
        <h2>Come in, take your time 💕</h2>
        <p>Your private pleasure boutique. Everything here is discreet – from browsing to the parcel at your door. You must be <strong>18 or older</strong> to enter.</p>
        <button class="btn primary" id="enterBtn">I'm 18+ · Enter</button>
        <a class="leave" href="https://www.google.com">I'm under 18 – leave</a>
      </div>
    </section>`;
  }

  function productCard(p) {
    return `
      <article class="card">
        <a href="#/product/${p.id}" class="card-link">
          ${productArt(p)}
          <div class="card-body">
            <h3>${esc(p.name)}</h3>
            <p class="card-sub">${esc(p.category)}${p.options ? " · " + p.options.values.length + " " + esc(p.options.label.toLowerCase()) + "s" : ""}</p>
            <p class="price">${money(p.price)}</p>
          </div>
        </a>
        ${heartBtn(p)}
      </article>`;
  }

  function viewShop(params) {
    const cats = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
    const active = params.cat || "All";
    const q = (params.q || "").toLowerCase();
    const list = PRODUCTS.filter((p) =>
      (active === "All" || p.category === active) &&
      (!q || (p.name + " " + p.description + " " + p.category).toLowerCase().includes(q)));
    const me = auth.current();
    const slides = (CFG.featured || []).map((f) => ({ ...f, p: findProduct(f.id) })).filter((f) => f.p);
    const home = active === "All" && !q;
    return `
    <section class="container">
      <div class="home-head">
        <div>
          <p class="hello">${me && me.name ? "Hi " + esc(me.name.split(" ")[0]) + " ✨" : "Welcome, gorgeous ✨"}</p>
          <h1>What are you <em>in the mood</em> for?</h1>
        </div>
      </div>
      <label class="search">
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="search" type="search" placeholder="Search toys, games, lingerie…" value="${esc(params.q || "")}" aria-label="Search">
      </label>
      ${home && slides.length ? `
      <div class="hot" aria-roledescription="carousel" aria-label="Hot right now">
        <div class="hot-track" id="hotTrack">
          ${slides.map((f) => `
          <a class="banner" href="#/product/${f.p.id}" draggable="false">
            <div class="b-text">
              <span class="pill">${esc(f.tag)}</span>
              <h2>${esc(f.title)}</h2>
              <p class="b-line">${esc(f.line || "")}</p>
              <span class="b-btn">Shop now →</span>
            </div>
            <div class="b-img"><img src="${esc(f.p.images[0])}" alt="${esc(f.p.name)}" draggable="false"></div>
          </a>`).join("")}
        </div>
        ${slides.length > 1 ? `<div class="hot-dots">${slides.map((_, i) => `<button class="dot ${i === 0 ? "on" : ""}" data-dot="${i}" aria-label="Show slide ${i + 1}"></button>`).join("")}</div>` : ""}
      </div>
      <div class="promise"><span>🤫 Discreet packaging</span><span>🔒 Private checkout</span><span>💬 WhatsApp support</span></div>` : ""}
      <div class="chips">
        ${cats.map((c) => `<a class="chip ${c === active ? "on" : ""}" href="#/shop?cat=${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}
      </div>
      <div class="grid">
        ${list.length ? list.map((p, i) => productCard(p).replace('<article class="card">', `<article class="card rise" style="--d:${Math.min(i, 8) * 45}ms">`)).join("") : `<p class="muted">Nothing matches that yet – try another word.</p>`}
      </div>
    </section>`;
  }

  function viewSaved() {
    const list = saved.list().map(findProduct).filter(Boolean);
    return `
    <section class="container">
      <div class="page-title"><h1>Saved</h1><span class="muted">${list.length} item${list.length === 1 ? "" : "s"}</span></div>
      ${list.length ? `<div class="grid" style="margin-top:14px">${list.map(productCard).join("")}</div>` : `
      <div class="empty"><div class="ic">♡</div><h2>Nothing saved yet</h2>
        <p class="muted">Tap the heart on any product to save it for later.</p>
        <a class="btn primary" href="#/shop">Explore products</a></div>`}
    </section>`;
  }

  function viewProduct(id) {
    const p = findProduct(id);
    if (!p) return `<section class="container"><p>Product not found. <a href="#/shop">Back to shop</a></p></section>`;
    const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    return `
    <section class="container product">
      <div class="pdp-top">
        <a href="#/shop" class="back"><span class="icon-back">‹</span> Back</a>
        ${heartBtn(p)}
      </div>
      <div class="product-grid">
        <div class="gallery">${productArt(p, true)}
          ${p.images && p.images.length > 1 ? `<div class="thumbs">${p.images.map((src, i) =>
            `<button class="thumb-btn ${i === 0 ? "on" : ""}" data-src="${esc(src)}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
        </div>
        <div>
          <p class="eyebrow">${esc(p.category)}</p>
          <div class="title-row"><h1>${esc(p.name)}</h1><p class="price big">${money(p.price)}</p></div>
          <p class="lead">${esc(p.description)}</p>

          ${p.options ? `
          <div class="opts">
            <p class="opt-label">${esc(p.options.label)} · <strong id="optChosen">${esc(p.options.values[0])}</strong></p>
            <div class="opt-row">${p.options.values.map((v, i) =>
              `<button type="button" class="opt ${i === 0 ? "on" : ""}" data-opt="${esc(v)}">${esc(v)}</button>`).join("")}</div>
          </div>` : ""}

          <h2 class="section-title">Why you'll love it</h2>
          <ul class="features">${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>

          <h2 class="section-title">How it works</h2>
          <ol class="steps">${p.howItWorks.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
          ${p.note ? `<div class="note"><strong>Important:</strong> ${esc(p.note)}</div>` : ""}

          <div class="assure"><span>🔒 Secure payment · Flutterwave</span><span>📦 Discreet packaging</span><span>💬 Delivery info on WhatsApp</span></div>

          <div class="buy sticky">
            <div class="qty">
              <button type="button" data-step="-1" aria-label="Decrease">−</button>
              <input id="qty" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity">
              <button type="button" data-step="1" aria-label="Increase">+</button>
            </div>
            <button class="btn primary" id="addBtn" data-id="${p.id}" data-price="${p.price}">Add to bag · ${money(p.price)}</button>
          </div>
        </div>
      </div>
      ${related.length ? `
      <h2 class="section-title">You may also like</h2>
      <div class="grid">${related.map(productCard).join("")}</div>` : ""}
    </section>`;
  }

  function viewCart() {
    const items = cartLines(cart.items());
    if (!items.length) {
      return `<section class="container narrow"><div class="empty"><div class="ic">👜</div>
        <h2>Your bag is empty</h2>
        <p class="muted">Explore the shop and add as many items as you like.</p>
        <a class="btn primary" href="#/shop">Start shopping</a></div></section>`;
    }
    return `
    <section class="container narrow">
      <div class="page-title"><h1>Your bag</h1><button class="link" id="clearCart">Clear</button></div>
      <div class="cart-list">
        ${items.map(({ key, p, opt, q }) => `
        <div class="cart-row">
          <a href="#/product/${p.id}" class="thumb">${productArt(p)}</a>
          <div class="cart-info">
            <a href="#/product/${p.id}"><strong>${esc(p.name)}</strong></a>
            ${opt ? `<span class="opt-chip">${esc(p.options ? p.options.label + ": " : "")}${esc(opt)}</span>` : ""}
            <strong>${money(p.price * q)}</strong>
          </div>
          <div class="cart-right">
            <div class="qty sm">
              <button data-cart="${esc(key)}" data-step="-1" aria-label="Decrease">−</button>
              <input type="number" min="0" value="${q}" data-cartinput="${esc(key)}" aria-label="Quantity">
              <button data-cart="${esc(key)}" data-step="1" aria-label="Increase">+</button>
            </div>
            <button class="link danger" data-remove="${esc(key)}">Remove</button>
          </div>
        </div>`).join("")}
      </div>
      <div class="summary">
        <div class="row between"><span class="muted">Items</span><span>${cart.count()}</span></div>
        <div class="row between total"><span>Subtotal</span><span>${money(cart.total())}</span></div>
        <p class="muted small">Delivery fee isn't included – we'll send it to you on WhatsApp after payment.</p>
        <a class="btn primary block" href="#/checkout">Checkout · ${money(cart.total())}</a>
      </div>
    </section>`;
  }

  function cartLines(items) {
    return Object.entries(items).map(([key, q]) => lineOf(key, q)).filter(Boolean);
  }

  function viewCheckout() {
    const u = auth.current();
    if (!u) {
      store.set("after_login", "#/checkout");
      return `<section class="container narrow"><div class="empty"><div class="ic">🔐</div>
        <h2>Sign in to checkout</h2>
        <p class="muted">Create an account or sign in so we can confirm your order.</p>
        <a class="btn primary" href="#/account">Sign in</a></div></section>`;
    }
    if (store.get("paid_order", null)) { location.hash = "#/delivery"; return ""; }
    if (!cart.count()) { location.hash = "#/cart"; return ""; }
    const lines = cartLines(cart.items());
    return `
    <section class="container narrow">
      <h1>Checkout</h1>
      <p class="sec-label">Contact</p>
      <div class="info-row"><div class="ic">👤</div><div><p><strong>${esc(u.name || "Customer")}</strong></p><p class="muted">${esc(u.email)}</p></div></div>
      <p class="sec-label">Order summary</p>
      <div class="summary" style="margin-top:0">
        ${lines.map((l) => `<div class="row between line"><span>${esc(l.p.name + optLabel(l))} × ${l.q}</span><span>${money(l.p.price * l.q)}</span></div>`).join("")}
        <div class="row between total"><span>Total to pay now</span><span>${money(cart.total())}</span></div>
      </div>
      <p class="sec-label">Delivery</p>
      <div class="info-row"><div class="ic">📦</div><div><p>Delivery date &amp; fee sent to you on WhatsApp</p><p class="muted">You'll add your address right after paying · Discreet packaging</p></div></div>
      <p class="sec-label">Payment</p>
      <div class="info-row"><div class="ic">💳</div><div><p>Card, bank transfer or USSD</p><p class="muted">Processed securely by Flutterwave</p></div></div>
      <button class="btn primary block pay-btn" id="payBtn">Pay ${money(cart.total())}</button>
      <p class="muted small center-text">🔒 Secured by Flutterwave</p>
      ${PAY_DEMO ? `<p class="demo-note">Demo mode: no Flutterwave key is set in <code>config.js</code>, so payment is simulated and no money moves.</p>` : ""}
    </section>`;
  }

  function viewDelivery() {
    const o = store.get("paid_order", null);
    if (!o) { location.hash = "#/shop"; return ""; }
    const u = auth.current() || {};
    return `
    <section class="container narrow">
      <div class="success-badge">✓</div>
      <h1 class="center-text">Payment successful!</h1>
      <p class="center-text muted">We've received ${money(o.total)} · Ref: <strong>${esc(o.txRef)}</strong></p>
      <h2 class="section-title">Where should we deliver?</h2>
      <form id="deliveryForm" class="form">
        <label>Full name<input name="name" required autocomplete="name" value="${esc(u.name || "")}"></label>
        <label>WhatsApp number<input name="whatsapp" type="tel" required autocomplete="tel" placeholder="e.g. 0803 123 4567" pattern="[0-9+ ]{10,16}"></label>
        <label>Delivery address<textarea name="address" required rows="3" placeholder="House number, street, area, town/city and a nearby landmark"></textarea></label>
        <label>Anything else? (optional)<textarea name="note" rows="2" placeholder="Size, colour/design, best time to deliver…"></textarea></label>
        <button class="btn primary block" type="submit">Submit delivery details</button>
      </form>
    </section>`;
  }

  function viewOrderDone(o) {
    const msg = orderMessage(o);
    return `
    <section class="container narrow center-text">
      <div class="success-badge">✓</div>
      <h1>Thank you, ${esc(o.name.split(" ")[0])}!</h1>
      <div class="panel left-text">
        ${o.verified === false
          ? `<p class="warn">We couldn't confirm your payment automatically yet. Please tap the WhatsApp button below so we can check it for you – your order ref is <strong>${esc(o.txRef)}</strong>.</p>`
          : `<p>Your order <strong>${esc(o.txRef)}</strong> is confirmed.${o.verified ? ` <span class="verified">✓ Payment verified</span>` : ""}</p>`}
        <p>📦 Your <strong>delivery date</strong> and <strong>delivery fee</strong> will be communicated to you on WhatsApp at <strong>${esc(o.whatsapp)}</strong>.</p>
        <p class="muted small">Your parcel will be packed discreetly with no product names on it.</p>
      </div>
      <a class="btn wa block" href="${waLink(msg)}" target="_blank" rel="noopener">Send my order to Preshy on WhatsApp</a>
      <p class="muted small">Tap above so your order arrives in our WhatsApp straight away.</p>
      <p>Have a question or anything to say? Chat with us on WhatsApp:<br>
        <a href="${waLink()}" target="_blank" rel="noopener"><strong>${WA_DISPLAY}</strong></a></p>
      <a class="btn ghost" href="#/shop">Continue shopping</a>
    </section>`;
  }

  function orderMessage(o) {
    return [
      "Hello Preshy Emporium, I just paid for an order.", "",
      "Order ref: " + o.txRef,
      o.transactionId ? "Flutterwave ID: " + o.transactionId : "",
      "Name: " + o.name, "WhatsApp: " + o.whatsapp, "Address: " + o.address,
      o.note ? "Note: " + o.note : "", "",
      "Items:", ...cartLines(o.items).map((l) => `- ${l.p.name}${optLabel(l)} x${l.q} = ${money(l.p.price * l.q)}`), "",
      "Paid: " + money(o.total), "",
      "Please send me the delivery date and fee. Thank you!"
    ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  }

  function viewPolicies() {
    return `
    <section class="container narrow">
      <h1>Delivery, refunds &amp; privacy</h1>
      <div class="panel"><h3>Delivery</h3>
        <p>We deliver across Nigeria. Delivery fees depend on your location and are not included at checkout. After you pay, we'll message you on WhatsApp with your delivery date and fee.</p>
        <p>Every parcel is packed discreetly – there are no product names or store branding on the outside.</p></div>
      <div class="panel"><h3>Payments</h3>
        <p>Payments are processed securely by Flutterwave (card, bank transfer or USSD). We never see or store your card details.</p></div>
      <div class="panel"><h3>Returns &amp; refunds</h3>
        <p>For hygiene reasons, intimate products, lingerie, creams and opened items cannot be returned unless they are faulty or we sent the wrong item.</p>
        <p>If your item arrives faulty or wrong, message us on WhatsApp within 48 hours of delivery with a photo and your order reference, and we'll replace it or refund you.</p>
        <p>If we can't deliver your order, you'll receive a full refund.</p></div>
      <div class="panel"><h3>Privacy</h3>
        <p>We only use your name, WhatsApp number and address to deliver your order and contact you about it. We never share your details or tell anyone what you bought.</p></div>
      <div class="panel"><h3>Age</h3><p>All products are for adults aged 18 and over only.</p></div>
      <div class="panel"><h3>Contact</h3>
        <p>WhatsApp: <a href="${waLink()}" target="_blank" rel="noopener">${WA_DISPLAY}</a><br>Email: <a href="mailto:${esc(CFG.email)}">${esc(CFG.email)}</a></p></div>
    </section>`;
  }

  /* ----- auth views ----- */
  function viewAccount() {
    const u = auth.current();
    if (u) {
      return `<section class="container narrow">
        <h1>My account</h1>
        <div class="panel">
          <p><strong>${esc(u.name || "Customer")}</strong></p>
          <p class="muted">${esc(u.email)} · signed up with ${esc(u.provider)}</p>
          <p>${u.passwordHash ? "✓ Password set – you can log in with email &amp; password." : "No password yet."}</p>
          <a class="btn ghost" href="#/set-password">${u.passwordHash ? "Change password" : "Create a password"}</a>
          <button class="btn primary" id="signOut">Sign out</button>
        </div>
      </section>`;
    }
    return `
    <section class="container auth">
      <div class="auth-hero"><h1>Welcome 💕</h1><p>Sign in or create an account to shop and track your orders.</p></div>
      <div class="auth-buttons">
        <a class="btn social google" href="#/signin/google">
          <svg viewBox="0 0 48 48" width="20" height="20"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Continue with Google</a>
        <a class="btn social apple" href="#/signin/apple">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9C5.9 6.8 4.3 7.8 3.4 9.4c-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.7-1-2.7-4.3zM13.9 4.9c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/></svg>
          Continue with Apple</a>
        <a class="btn social email" href="#/signin/email">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
          Continue with email</a>
      </div>
      <div class="divider"><span>or</span></div>
      <a class="btn ghost block" href="#/login">Log in with email &amp; password</a>
    </section>`;
  }

  function viewSignin(method) {
    const titles = { google: "Continue with Google", apple: "Continue with Apple", email: "Continue with email" };
    const hints = {
      google: "Enter your Google (Gmail) address. We'll send a 6-digit code to confirm it's you.",
      apple: "Enter the email linked to your Apple ID.",
      email: "Enter your email address. We'll send you a 6-digit code."
    };
    if (!titles[method]) { location.hash = "#/account"; return ""; }
    return `
    <section class="container auth">
      <a href="#/account" class="back">← Back</a>
      <h1>${titles[method]}</h1>
      <p class="muted">${hints[method]}</p>
      <form id="signinForm" class="form" data-method="${method}">
        <label>Your name<input name="name" autocomplete="name" required></label>
        <label>Email<input name="email" type="email" autocomplete="email" required
          placeholder="${method === "google" ? "you@gmail.com" : method === "apple" ? "you@icloud.com" : "you@example.com"}"></label>
        <button class="btn primary block" type="submit">${method === "apple" ? "Continue" : "Send code"}</button>
      </form>
    </section>`;
  }

  function viewVerify() {
    const p = pending.get();
    if (!p) { location.hash = "#/account"; return ""; }
    return `
    <section class="container auth">
      <a href="#/account" class="back">← Back</a>
      <h1>Enter your code</h1>
      ${!p.server
        ? `<p class="demo-note">Demo mode – emails aren't switched on yet, so here is your code: <strong class="demo-code">${esc((() => { try { return sessionStorage.getItem("pe_demo_code") || ""; } catch (e) { return ""; } })())}</strong></p>`
        : `<p class="muted">We sent a 6-digit code to <strong>${esc(p.email)}</strong>. It expires in 10 minutes. Check your spam folder too.</p>`}
      <form id="verifyForm" class="form">
        <input name="code" class="code-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}" required placeholder="••••••">
        <button class="btn primary block" type="submit">Verify</button>
      </form>
      <button class="link" id="resend">Didn't get it? Resend code</button>
    </section>`;
  }

  function viewSetPassword() {
    const u = auth.current();
    if (!u) { location.hash = "#/account"; return ""; }
    const fresh = store.get("just_verified", false);
    return `
    <section class="container auth">
      <h1>${u.passwordHash ? "Change password" : "Create a password"}</h1>
      <p class="muted">${fresh ? "You're verified! " : ""}Set a password so next time you can log in with <strong>${esc(u.email)}</strong> and your password – no code needed.</p>
      <form id="passwordForm" class="form">
        <label>Password<input name="pw" type="password" minlength="6" autocomplete="new-password" required></label>
        <label>Confirm password<input name="pw2" type="password" minlength="6" autocomplete="new-password" required></label>
        <button class="btn primary block" type="submit">Save password</button>
      </form>
      <button class="link" id="skipPw">${fresh ? "Skip for now" : "Cancel"}</button>
    </section>`;
  }

  function viewLogin() {
    return `
    <section class="container auth">
      <a href="#/account" class="back">← Back</a>
      <h1>Log in</h1>
      <form id="loginForm" class="form">
        <label>Email<input name="email" type="email" autocomplete="email" required></label>
        <label>Password<input name="pw" type="password" autocomplete="current-password" required></label>
        <button class="btn primary block" type="submit">Log in</button>
      </form>
      <p class="muted small">Forgot your password or never set one? <a href="#/signin/email">Get a code by email</a> instead.</p>
    </section>`;
  }

  function viewAbout() {
    return `
    <section class="container narrow">
      <h1>About Preshy Emporium</h1>
      <p>Preshy Emporium is an adult wellness boutique. We believe everyone deserves to feel confident and informed about their pleasure, so every product comes with a clear explanation of how it works.</p>
      <div class="panel">
        <h3>Our promise</h3>
        <ul class="features">
          <li>Body-safe materials only</li>
          <li>Discreet, unbranded packaging</li>
          <li>Private, judgement-free service</li>
          <li>Delivery nationwide</li>
        </ul>
      </div>
      <div class="panel">
        <h3>Contact</h3>
        <p>WhatsApp: <a href="${waLink()}" target="_blank" rel="noopener">${WA_DISPLAY}</a></p>
        <p>Email: <a href="mailto:${esc(CFG.email)}">${esc(CFG.email)}</a></p>
        <p>TikTok: <a href="${esc(CFG.tiktok)}" target="_blank" rel="noopener">@delta_intimacyhubng</a></p>
      </div>
    </section>`;
  }

  /* ---------------- router ---------------- */
  function parse() {
    const raw = location.hash.slice(1) || "/";
    const [path, qs] = raw.split("?");
    const params = Object.fromEntries(new URLSearchParams(qs || ""));
    return { parts: path.split("/").filter(Boolean), params };
  }

  function render() {
    const verified = store.get("age_ok", false);
    const { parts, params } = parse();
    const route = parts[0] || "";

    if (!verified && route !== "") { location.hash = "#/"; return; }

    const chrome = route !== "";
    document.getElementById("topbar").classList.toggle("hidden", !chrome);
    document.getElementById("footer").classList.toggle("hidden", !chrome);
    document.getElementById("waFloat").classList.toggle("hidden", !chrome);
    // Bottom tabs on main pages; product pages get the sticky "Add to bag" bar instead.
    const tabs = chrome && ["shop", "saved", "cart", "account", "about", "policies"].includes(route);
    document.getElementById("tabbar").classList.toggle("hidden", !tabs);
    document.body.classList.toggle("with-tabs", tabs);
    document.body.classList.toggle("with-buybar", route === "product");
    document.querySelectorAll("#tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === route));

    let html;
    switch (route) {
      case "": html = verified ? (location.hash = "#/shop", "") : viewOpening(); break;
      case "shop": html = viewShop(params); break;
      case "product": html = viewProduct(parts[1]); break;
      case "cart": html = viewCart(); break;
      case "checkout": html = viewCheckout(); break;
      case "account": html = viewAccount(); break;
      case "signin": html = viewSignin(parts[1]); break;
      case "verify": html = viewVerify(); break;
      case "set-password": html = viewSetPassword(); break;
      case "login": html = viewLogin(); break;
      case "about": html = viewAbout(); break;
      case "delivery": html = viewDelivery(); break;
      case "policies": html = viewPolicies(); break;
      case "saved": html = viewSaved(); break;
      default: html = viewShop(params);
    }
    if (html === "") return;
    if (TEST_MODE && route !== "") {
      html = `<div class="test-banner">Test mode – payments are not real. Use a Flutterwave test card.</div>` + html;
    }
    if (store.get("paid_order", null) && route !== "delivery") {
      html = `<a class="pending-banner" href="#/delivery">✓ Payment received – tap here to add your delivery details</a>` + html;
    }
    clearInterval(hotTimer);
    app.innerHTML = html;
    window.scrollTo(0, 0);
    bind(route);
  }

  // "Welcome, Ada 💕" for new customers, "Welcome back, Ada 💕" for returning ones.
  function greet(email, returning) {
    const u = auth.users()[email] || {};
    const first = (u.name || "").split(" ")[0];
    return (returning ? "Welcome back" : "Welcome") + (first ? ", " + esc(first) : "") + " 💕";
  }

  function finishLogin(msg) {
    toast(msg);
    const next = store.get("after_login", null);
    store.del("after_login");
    location.hash = next || "#/shop";
  }

  /* ---------------- "hot right now" carousel ----------------
     Swipe or drag left/right; after the last slide it loops back to the first. Auto-advances every 5s. */
  let hotTimer = null, hotAbort = null;
  function setupCarousel() {
    clearInterval(hotTimer);
    if (hotAbort) hotAbort.abort();
    hotAbort = new AbortController();
    const sig = { signal: hotAbort.signal };
    const track = document.getElementById("hotTrack");
    if (!track) return;
    const real = [...track.children];
    const n = real.length;
    const dots = [...app.querySelectorAll("[data-dot]")];
    if (n < 2) return;
    // clones at both ends make the loop seamless: [last] 1 2 3 [first]
    track.insertBefore(real[n - 1].cloneNode(true), real[0]);
    track.appendChild(real[0].cloneNode(true));
    let i = 1, startX = 0, startY = 0, dx = 0, dragging = false, moved = false, horizontal = null;
    const go = (to, animate = true) => {
      i = to;
      track.style.transition = animate ? "transform .5s cubic-bezier(.22,.8,.3,1)" : "none";
      track.style.transform = `translateX(${-i * 100}%)`;
      const real = (i - 1 + n) % n;
      dots.forEach((d, k) => d.classList.toggle("on", k === real));
    };
    go(1, false);
    track.addEventListener("transitionend", () => {
      if (i === 0) go(n, false);
      if (i === n + 1) go(1, false);
    });
    const next = () => go(i + 1), prev = () => go(i - 1);
    const auto = () => { clearInterval(hotTimer); hotTimer = setInterval(() => { if (!document.hidden) next(); }, 5000); };
    track.addEventListener("pointerdown", (e) => {
      dragging = true; moved = false; horizontal = null; startX = e.clientX; startY = e.clientY; dx = 0;
      clearInterval(hotTimer);
      track.style.transition = "none";
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (horizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) horizontal = Math.abs(dx) > Math.abs(dy);
      if (!horizontal) return;
      moved = true;
      track.style.transform = `translate3d(calc(${-i * 100}% + ${dx}px), 0, 0)`;
    }, sig);
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (horizontal && dx < -40) next();
      else if (horizontal && dx > 40) prev();
      else go(i);
      auto();
    };
    window.addEventListener("pointerup", end, sig);
    window.addEventListener("pointercancel", end, sig);
    // a swipe shouldn't open the product; a tap should
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    dots.forEach((d) => d.addEventListener("click", () => { go(Number(d.dataset.dot) + 1); auto(); }));
    auto();
  }

  /* ---------------- event wiring ---------------- */
  function bind(route) {
    // Add-to-cart buttons on cards
    app.querySelectorAll("button.add").forEach((b) => b.addEventListener("click", () => {
      cart.add(b.dataset.id, 1);
      toast("👜 Added to bag · <a href='#/cart'>View</a>");
    }));

    if (route === "") {
      document.getElementById("enterBtn").addEventListener("click", () => {
        store.set("age_ok", true);
        location.hash = "#/shop";
      });
    }

    if (route === "shop") {
      setupCarousel();
      const s = document.getElementById("search");
      s.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const { params } = parse();
          const q = new URLSearchParams({ ...params, q: s.value.trim() });
          location.hash = "#/shop?" + q.toString();
        }
      });
    }

    if (route === "product") {
      app.querySelectorAll(".thumb-btn").forEach((t) => t.addEventListener("click", () => {
        document.getElementById("mainImg").src = t.dataset.src;
        app.querySelectorAll(".thumb-btn").forEach((x) => x.classList.toggle("on", x === t));
      }));
      const qty = document.getElementById("qty");
      const addBtn = document.getElementById("addBtn");
      const syncPrice = () => { addBtn.textContent = "Add to bag · " + money(Number(addBtn.dataset.price) * Math.max(1, parseInt(qty.value, 10) || 1)); };
      app.querySelectorAll(".buy [data-step]").forEach((b) => b.addEventListener("click", () => {
        qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) + parseInt(b.dataset.step, 10));
        syncPrice();
      }));
      qty.addEventListener("input", syncPrice);
      let chosen = (app.querySelector(".opt.on") || {}).dataset ? app.querySelector(".opt.on").dataset.opt : "";
      app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        chosen = b.dataset.opt;
        app.querySelectorAll(".opt").forEach((x) => x.classList.toggle("on", x === b));
        document.getElementById("optChosen").textContent = chosen;
      }));
      document.getElementById("addBtn").addEventListener("click", (e) => {
        const n = Math.max(1, parseInt(qty.value, 10) || 1);
        const p = findProduct(e.target.dataset.id);
        cart.add(p.options && chosen ? p.id + "|" + chosen : p.id, n);
        toast(`👜 ${esc(p.name)}${p.options && chosen ? " (" + esc(chosen) + ")" : ""} added to bag · <a href='#/cart'>View</a>`);
      });
    }

    if (route === "cart") {
      app.querySelectorAll("[data-cart]").forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.cart;
        cart.setQty(id, (cart.items()[id] || 0) + parseInt(b.dataset.step, 10));
        render();
      }));
      app.querySelectorAll("[data-cartinput]").forEach((i) => i.addEventListener("change", () => {
        cart.setQty(i.dataset.cartinput, Math.max(0, parseInt(i.value, 10) || 0));
        render();
      }));
      app.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => {
        cart.setQty(b.dataset.remove, 0); render();
      }));
      const clr = document.getElementById("clearCart");
      if (clr) clr.addEventListener("click", () => { cart.clear(); render(); });
    }

    if (route === "checkout") {
      const btn = document.getElementById("payBtn");
      if (btn) btn.addEventListener("click", () => {
        const u = auth.current();
        const order = {
          txRef: "PE-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
          items: cart.items(), total: cart.total(), email: u.email, createdAt: new Date().toISOString()
        };
        const paid = (resp) => {
          store.set("paid_order", { ...order, transactionId: resp && resp.transaction_id, paidAt: new Date().toISOString() });
          cart.clear();
          location.hash = "#/delivery";
        };

        if (PAY_DEMO) {
          if (confirm("DEMO MODE\n\nSimulate a successful payment of " + money(order.total) + "?")) paid({ transaction_id: "DEMO" });
          return;
        }
        if (typeof window.FlutterwaveCheckout !== "function") {
          return toast("Payment couldn't load. Check your internet and try again.");
        }
        const modal = window.FlutterwaveCheckout({
          public_key: CFG.flutterwave.publicKey,
          tx_ref: order.txRef,
          amount: order.total,
          currency: "NGN",
          payment_options: "card, banktransfer, ussd",
          customer: { email: u.email, name: u.name || "" },
          meta: { items: Object.entries(order.items).map(([id, q]) => id + " x" + q).join(", ") },
          customizations: { title: CFG.name, description: "Order " + order.txRef },
          callback: (resp) => {
            if (resp && (resp.status === "successful" || resp.status === "completed")) {
              paid(resp);
              if (modal && modal.close) modal.close();
            } else {
              toast("Payment was not completed. You have not been charged.");
            }
          },
          onclose: () => {}
        });
      });
    }

    if (route === "delivery") {
      const f = document.getElementById("deliveryForm");
      if (f) f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = f.querySelector("button[type=submit]");
        btn.disabled = true; btn.textContent = "Confirming your payment…";
        const d = Object.fromEntries(new FormData(f));
        const u = auth.current() || {};
        const o = { ...store.get("paid_order", {}), name: d.name.trim(), whatsapp: d.whatsapp.trim(),
          address: d.address.trim(), note: d.note.trim(), detailsAt: new Date().toISOString(), verified: null };

        // Send to the Netlify automation: it checks the payment with Flutterwave,
        // saves the order to Google Sheets and emails Preshy.
        if (!PAY_DEMO) {
          try {
            const res = await fetch("/.netlify/functions/submit-order", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ txRef: o.txRef, transactionId: o.transactionId, items: o.items,
                name: o.name, whatsapp: o.whatsapp, address: o.address, note: o.note, email: o.email || u.email })
            });
            if (res.ok) { const r = await res.json(); o.verified = !!r.verified; }
          } catch (err) { /* automation not reachable – WhatsApp button is the backup */ }
        }

        const orders = store.get("orders", []); orders.push(o); store.set("orders", orders);
        store.del("paid_order");
        app.innerHTML = viewOrderDone(o);
        window.scrollTo(0, 0);
      });
    }

    if (route === "account") {
      const so = document.getElementById("signOut");
      if (so) so.addEventListener("click", () => { auth.signOut(); toast("Signed out"); render(); });
    }

    if (route === "signin") {
      const f = document.getElementById("signinForm");
      if (!f) return;
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const method = f.dataset.method;
        const name = f.elements.name.value.trim();
        const email = f.elements.email.value.trim().toLowerCase();
        if (!isEmail(email)) return toast("Please enter a valid email");
        const users = auth.users();
        const existing = users[email];
        auth.saveUser({ ...(existing || {}), email, name: name || (existing && existing.name), provider: (existing && existing.provider) || method });

        if (method === "apple") {
          auth.signIn(email);
          sendLoginEmail(email, "apple");
          return finishLogin(greet(email, !!(existing && existing.welcomed)));
        }
        const btn = f.querySelector("button");
        btn.disabled = true; btn.textContent = "Sending…";
        const ok = await sendCode(email, method, name);
        btn.disabled = false; btn.textContent = "Send code";
        if (ok) location.hash = "#/verify";
      });
    }

    if (route === "verify") {
      const f = document.getElementById("verifyForm");
      if (!f) return;
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const p = pending.get();
        if (!p) return (location.hash = "#/account");
        const btn = f.querySelector("button[type=submit]");
        btn.disabled = true;
        const result = await checkCode(p, f.code.value.trim());
        btn.disabled = false;
        if (result === "expired") return toast("Code expired – tap resend for a new one");
        if (result === "wrong") return toast("That code is incorrect");
        if (result === "error") return toast("Couldn't check the code. Please try again.");
        pending.clear();
        auth.signIn(p.email);
        sendLoginEmail(p.email, p.method);
        const u = auth.current();
        if (u.passwordHash) return finishLogin(greet(p.email, true));
        store.set("just_verified", true);
        location.hash = "#/set-password";
      });
      document.getElementById("resend").addEventListener("click", () => {
        const p = pending.get();
        const u = p && auth.users()[p.email];
        if (p) sendCode(p.email, p.method, u ? u.name : "").then(() => render());
      });
    }

    if (route === "set-password") {
      const f = document.getElementById("passwordForm");
      if (!f) return;
      const done = (msg) => { store.del("just_verified"); finishLogin(msg); };
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (f.pw.value !== f.pw2.value) return toast("Passwords don't match");
        const u = auth.current();
        u.passwordHash = await hash(u.email + ":" + f.pw.value);
        auth.saveUser(u);
        done("Password saved · " + greet(u.email, false));
      });
      document.getElementById("skipPw").addEventListener("click", () => {
        if (store.get("just_verified", false)) done(greet(auth.current().email, false));
        else location.hash = "#/account";
      });
    }

    if (route === "login") {
      const f = document.getElementById("loginForm");
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = f.elements.email.value.trim().toLowerCase();
        const u = auth.users()[email];
        if (!u || !u.passwordHash) return toast("No password set for this email. Use a code instead.");
        if ((await hash(email + ":" + f.pw.value)) !== u.passwordHash) return toast("Incorrect password");
        auth.signIn(email);
        sendLoginEmail(email, "password");
        finishLogin(greet(email, true));
      });
    }
  }

  app.addEventListener("click", (e) => {
    const h = e.target.closest("[data-heart]");
    if (!h) return;
    e.preventDefault(); e.stopPropagation();
    const on = saved.toggle(h.dataset.heart);
    h.classList.toggle("on", on);
    toast(on ? "♥ Saved" : "Removed from saved");
    if (parse().parts[0] === "saved") render();
  });

  window.addEventListener("hashchange", render);
  updateBadge();
  updateAccountLink();
  render();
})();
