/* Preshy Emporium – single-page storefront (no build step needed). */
(function () {
  "use strict";

  const CFG = window.STORE_CONFIG;
  const PRODUCTS = window.PRODUCTS;
  const app = document.getElementById("app");
  const DEMO = !(CFG.emailjs.publicKey && CFG.emailjs.serviceId && CFG.emailjs.templateId);

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
      return Object.entries(this.items()).reduce((sum, [id, q]) => {
        const p = findProduct(id); return p ? sum + p.price * q : sum;
      }, 0);
    }
  };

  function updateBadge() {
    const n = cart.count();
    const b = document.getElementById("cartCount");
    b.textContent = n;
    b.style.display = n ? "inline-flex" : "none";
  }

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

  async function sendCode(email, method) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    pending.set({ email, method, codeHash: await hash(code), expires: Date.now() + 10 * 60 * 1000 });

    if (DEMO) {
      toast("Demo mode – your code is <b>" + code + "</b>", 9000);
      return true;
    }
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: CFG.emailjs.serviceId,
          template_id: CFG.emailjs.templateId,
          user_id: CFG.emailjs.publicKey,
          template_params: { to_email: email, code, store_name: CFG.name }
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toast("Code sent to " + esc(email));
      return true;
    } catch (err) {
      toast("Couldn't send the code. Please try again.");
      return false;
    }
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
      <div class="opening-glow"></div>
      <div class="opening-inner">
        <p class="eyebrow">Abraka · Delta State</p>
        <h1 class="logo">Preshy<br><span>Emporium</span></h1>
        <p class="tagline">Pleasure, wellness &amp; intimacy – delivered discreetly.</p>
        <div class="age-box">
          <p>This store sells adult products.<br>You must be <strong>18 or older</strong> to enter.</p>
          <div class="row center">
            <button class="btn primary" id="enterBtn">I'm 18+ · Enter</button>
            <a class="btn ghost" href="https://www.google.com">Leave</a>
          </div>
        </div>
      </div>
    </section>`;
  }

  function viewShop(params) {
    const cats = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
    const active = params.cat || "All";
    const q = (params.q || "").toLowerCase();
    const list = PRODUCTS.filter((p) =>
      (active === "All" || p.category === active) &&
      (!q || (p.name + " " + p.description + " " + p.category).toLowerCase().includes(q)));

    return `
    <section class="hero">
      <h1>Discover what feels good</h1>
      <p>Toys, games, wellness and more, hand-picked by Preshy. Discreet packaging, delivery around Abraka and across Nigeria.</p>
    </section>
    <section class="container">
      <div class="toolbar">
        <input id="search" type="search" placeholder="Search products…" value="${esc(params.q || "")}">
      </div>
      <div class="chips">
        ${cats.map((c) => `<a class="chip ${c === active ? "on" : ""}" href="#/shop?cat=${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}
      </div>
      <div class="grid">
        ${list.length ? list.map((p) => `
          <article class="card">
            <a href="#/product/${p.id}" class="card-link">
              ${productArt(p)}
              <div class="card-body">
                <h3>${esc(p.name)}</h3>
                <p class="price">${money(p.price)}</p>
              </div>
            </a>
            <button class="btn small primary add" data-id="${p.id}">Add to cart</button>
          </article>`).join("") : `<p class="muted">No products match your search.</p>`}
      </div>
    </section>`;
  }

  function viewProduct(id) {
    const p = findProduct(id);
    if (!p) return `<section class="container"><p>Product not found. <a href="#/shop">Back to shop</a></p></section>`;
    const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 3);
    return `
    <section class="container product">
      <a href="#/shop" class="back">← Back to shop</a>
      <div class="product-grid">
        <div>${productArt(p, true)}
          ${p.images && p.images.length > 1 ? `<div class="thumbs">${p.images.map((src, i) =>
            `<button class="thumb-btn ${i === 0 ? "on" : ""}" data-src="${esc(src)}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
        </div>
        <div>
          <p class="eyebrow">${esc(p.category)}</p>
          <h1>${esc(p.name)}</h1>
          <p class="price big">${money(p.price)}</p>

          <h2 class="section-title">Description</h2>
          <p>${esc(p.description)}</p>
          <ul class="features">${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>

          <h2 class="section-title">How it works</h2>
          <ol class="steps">${p.howItWorks.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
          ${p.note ? `<div class="note"><strong>Important:</strong> ${esc(p.note)}</div>` : ""}

          <div class="buy">
            <div class="qty">
              <button type="button" data-step="-1" aria-label="Decrease">−</button>
              <input id="qty" type="number" min="1" value="1" inputmode="numeric">
              <button type="button" data-step="1" aria-label="Increase">+</button>
            </div>
            <button class="btn primary" id="addBtn" data-id="${p.id}">Add to cart</button>
          </div>
          <p class="muted small">Packed discreetly · Pay on delivery or transfer</p>
        </div>
      </div>
      ${related.length ? `
      <h2 class="section-title">You may also like</h2>
      <div class="grid">${related.map((r) => `
        <article class="card"><a href="#/product/${r.id}" class="card-link">${productArt(r)}
          <div class="card-body"><h3>${esc(r.name)}</h3><p class="price">${money(r.price)}</p></div></a>
          <button class="btn small primary add" data-id="${r.id}">Add to cart</button></article>`).join("")}
      </div>` : ""}
    </section>`;
  }

  function viewCart() {
    const items = Object.entries(cart.items()).map(([id, q]) => ({ p: findProduct(id), q })).filter((x) => x.p);
    if (!items.length) {
      return `<section class="container narrow center-text">
        <h1>Your cart is empty</h1>
        <p class="muted">Explore the shop and add as many items as you like.</p>
        <a class="btn primary" href="#/shop">Start shopping</a></section>`;
    }
    return `
    <section class="container narrow">
      <h1>Your cart</h1>
      <div class="cart-list">
        ${items.map(({ p, q }) => `
        <div class="cart-row">
          <a href="#/product/${p.id}" class="thumb">${productArt(p)}</a>
          <div class="cart-info">
            <a href="#/product/${p.id}"><strong>${esc(p.name)}</strong></a>
            <span class="muted">${money(p.price)} each</span>
            <div class="qty sm">
              <button data-cart="${p.id}" data-step="-1" aria-label="Decrease">−</button>
              <input type="number" min="0" value="${q}" data-cartinput="${p.id}">
              <button data-cart="${p.id}" data-step="1" aria-label="Increase">+</button>
            </div>
          </div>
          <div class="cart-right">
            <strong>${money(p.price * q)}</strong>
            <button class="link danger" data-remove="${p.id}">Remove</button>
          </div>
        </div>`).join("")}
      </div>
      <div class="summary">
        <div class="row between"><span>Items</span><span>${cart.count()}</span></div>
        <div class="row between total"><span>Total</span><span>${money(cart.total())}</span></div>
        <p class="muted small">Delivery fee is confirmed when Preshy contacts you.</p>
        <a class="btn primary block" href="#/checkout">Checkout</a>
        <button class="link" id="clearCart">Clear cart</button>
      </div>
    </section>`;
  }

  function viewCheckout() {
    const u = auth.current();
    if (!u) {
      store.set("after_login", "#/checkout");
      return `<section class="container narrow center-text">
        <h1>Sign in to checkout</h1>
        <p class="muted">Create an account or sign in so we can confirm your order.</p>
        <a class="btn primary" href="#/account">Sign in</a></section>`;
    }
    if (!cart.count()) { location.hash = "#/cart"; return ""; }
    return `
    <section class="container narrow">
      <h1>Checkout</h1>
      <form id="checkoutForm" class="form">
        <label>Full name<input name="name" required value="${esc(u.name || "")}"></label>
        <label>Phone / WhatsApp<input name="phone" type="tel" required placeholder="080..."></label>
        <label>Delivery address<textarea name="address" required rows="3" placeholder="Street, area, town (e.g. Abraka)"></textarea></label>
        <label>Payment
          <select name="payment">
            <option>Pay on delivery (Abraka only)</option>
            <option>Bank transfer</option>
          </select>
        </label>
        <label>Note (optional)<textarea name="note" rows="2"></textarea></label>
        <div class="summary">
          <div class="row between total"><span>Total (${cart.count()} items)</span><span>${money(cart.total())}</span></div>
        </div>
        <button class="btn primary block" type="submit">Place order</button>
        <p class="muted small">Your email app will open with the order details addressed to ${esc(CFG.email)} – just press send.</p>
      </form>
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
      <h1>Welcome</h1>
      <p class="muted">Sign in to save your cart and checkout faster.</p>
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
      ${DEMO ? `<p class="demo-note">Demo mode: verification codes appear on screen until email sending is set up in <code>config.js</code>.</p>` : ""}
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
      <p class="muted">We sent a 6-digit code to <strong>${esc(p.email)}</strong>. It expires in 10 minutes.</p>
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
      <p>Preshy Emporium is an adult wellness boutique based in <strong>Abraka, Delta State</strong>. We believe everyone deserves to feel confident and informed about their pleasure, so every product comes with a clear explanation of how it works.</p>
      <div class="panel">
        <h3>Our promise</h3>
        <ul class="features">
          <li>Body-safe materials only</li>
          <li>Discreet, unbranded packaging</li>
          <li>Private, judgement-free service</li>
          <li>Delivery in Abraka and nationwide</li>
        </ul>
      </div>
      <div class="panel">
        <h3>Contact</h3>
        <p>Email: <a href="mailto:${esc(CFG.email)}">${esc(CFG.email)}</a></p>
        <p>Location: ${esc(CFG.location)}</p>
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
      default: html = viewShop(params);
    }
    if (html === "") return;
    app.innerHTML = html;
    window.scrollTo(0, 0);
    bind(route);
  }

  function finishLogin(msg) {
    toast(msg);
    const next = store.get("after_login", null);
    store.del("after_login");
    location.hash = next || "#/shop";
  }

  /* ---------------- event wiring ---------------- */
  function bind(route) {
    // Add-to-cart buttons on cards
    app.querySelectorAll(".add").forEach((b) => b.addEventListener("click", () => {
      cart.add(b.dataset.id, 1);
      toast("Added to cart · <a href='#/cart'>View cart</a>");
    }));

    if (route === "") {
      document.getElementById("enterBtn").addEventListener("click", () => {
        store.set("age_ok", true);
        location.hash = "#/shop";
      });
    }

    if (route === "shop") {
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
      app.querySelectorAll(".buy [data-step]").forEach((b) => b.addEventListener("click", () => {
        qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) + parseInt(b.dataset.step, 10));
      }));
      document.getElementById("addBtn").addEventListener("click", (e) => {
        const n = Math.max(1, parseInt(qty.value, 10) || 1);
        cart.add(e.target.dataset.id, n);
        toast(n + " added to cart · <a href='#/cart'>View cart</a>");
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
      const f = document.getElementById("checkoutForm");
      if (f) f.addEventListener("submit", (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(f));
        const u = auth.current();
        const lines = Object.entries(cart.items()).map(([id, q]) => {
          const p = findProduct(id); return p ? `- ${p.name} x${q} = ${money(p.price * q)}` : "";
        }).filter(Boolean);
        const body = [
          "New order from the Preshy Emporium website", "",
          "Name: " + d.name, "Phone: " + d.phone, "Email: " + u.email,
          "Address: " + d.address, "Payment: " + d.payment, d.note ? "Note: " + d.note : "", "",
          "Items:", ...lines, "", "Total: " + money(cart.total())
        ].join("\n");
        const orders = store.get("orders", []);
        orders.push({ at: new Date().toISOString(), email: u.email, items: cart.items(), total: cart.total() });
        store.set("orders", orders);
        location.href = "mailto:" + CFG.email + "?subject=" + encodeURIComponent("New order – " + d.name) +
          "&body=" + encodeURIComponent(body);
        cart.clear();
        app.innerHTML = `<section class="container narrow center-text">
          <h1>Thank you, ${esc(d.name.split(" ")[0])}!</h1>
          <p>Your order email has been prepared – please press <strong>send</strong> in your email app.</p>
          <p class="muted">Preshy will contact you on ${esc(d.phone)} to confirm delivery.</p>
          <a class="btn primary" href="#/shop">Continue shopping</a></section>`;
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
          return finishLogin("Signed in with Apple");
        }
        const btn = f.querySelector("button");
        btn.disabled = true; btn.textContent = "Sending…";
        const ok = await sendCode(email, method);
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
        if (Date.now() > p.expires) return toast("Code expired – tap resend for a new one");
        if ((await hash(f.code.value.trim())) !== p.codeHash) return toast("That code is incorrect");
        pending.clear();
        auth.signIn(p.email);
        const u = auth.current();
        if (u.passwordHash) return finishLogin("You're signed in");
        store.set("just_verified", true);
        location.hash = "#/set-password";
      });
      document.getElementById("resend").addEventListener("click", () => {
        const p = pending.get(); if (p) sendCode(p.email, p.method);
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
        done("Password saved – you're signed in");
      });
      document.getElementById("skipPw").addEventListener("click", () => {
        if (store.get("just_verified", false)) done("You're signed in");
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
        finishLogin("Welcome back, " + esc(u.name || ""));
      });
    }
  }

  window.addEventListener("hashchange", render);
  updateBadge();
  updateAccountLink();
  render();
})();
