// CAMORRA — Try the Look. Drag carousel, look detail, clothes rail and spinning product view.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const naira = (n) => '₦' + n.toLocaleString('en-NG');

  // ---------- Data ----------
  // crop = [x, y, w, h] in % of the model photo, used to show each piece in the "In this look" list.
  const LOOKS = [
    { img: 'm2', name: 'Everyday', pieces: [
      { name: 'Pocket Tee — Black', price: 15000, crop: [10, 14, 80, 30] },
      { name: 'Slim Jeans — Indigo', price: 28000, crop: [12, 44, 76, 40] },
      { name: 'Leather Loafer', price: 46000, crop: [5, 88, 90, 12] },
    ] },
    { img: 'm6', name: 'Soft Grey', pieces: [
      { name: 'Rib Mock Neck — Grey', price: 22000, crop: [8, 10, 84, 34] },
      { name: 'Track Pant — Ivory', price: 24000, crop: [12, 44, 76, 42] },
      { name: 'Trail Runner', price: 45000, crop: [6, 88, 90, 12] },
    ] },
    { img: 'm1', name: 'Studio Day', pieces: [
      { name: 'Boxy Tee — Black', price: 18500, crop: [6, 12, 88, 32] },
      { name: 'Nylon Short — Black', price: 16000, crop: [10, 42, 80, 22] },
      { name: 'Court Sneaker', price: 42000, crop: [6, 85, 90, 15] },
    ] },
    { img: 'm3', name: 'Off Duty', pieces: [
      { name: 'Oversized Tee — Black', price: 20000, crop: [10, 10, 82, 32] },
      { name: 'Wide Trouser — Black', price: 26000, crop: [8, 40, 84, 46] },
      { name: 'Retro Runner', price: 38000, crop: [4, 86, 92, 14] },
    ] },
    { img: 'm4', name: 'Cold Front', pieces: [
      { name: 'Gloss Puffer — Black', price: 75000, crop: [4, 10, 92, 38] },
      { name: 'Straight Jean — Black', price: 27000, crop: [14, 46, 72, 40] },
      { name: 'Work Boot', price: 48000, crop: [8, 87, 86, 13] },
    ] },
    { img: 'm7', name: 'Night Shift', pieces: [
      { name: 'Leather Vest — Brown', price: 52000, crop: [8, 13, 84, 34] },
      { name: 'Wide Trouser — Black', price: 26000, crop: [10, 46, 80, 44] },
      { name: 'Chain Necklace', price: 9000, crop: [28, 12, 44, 14] },
    ] },
  ];
  const GARMENTS = [
    { img: 'tee-white', name: 'Essential Tee — White', price: 12000, h: 230, desc: 'Heavyweight cotton jersey with a clean crew neck. Cut straight, sits just below the hip.' },
    { img: 'jeans', name: 'Straight Jean — Indigo', price: 27000, h: 380, desc: 'Rigid indigo denim, mid rise, straight leg. Breaks in with you.' },
    { img: 'bomber', name: 'Bomber — Rust', price: 45000, h: 270, desc: 'Light nylon bomber with ribbed cuffs and a utility sleeve pocket.' },
    { img: 'tee-blue', name: 'Slub Tee — Sky', price: 13500, h: 215, desc: 'Textured slub cotton in washed sky blue. Rolled sleeves, relaxed fit.' },
    { img: 'brown', name: 'Chunky Knit — Cocoa', price: 29000, h: 260, desc: 'Soft brushed knit in deep cocoa, dropped shoulders and a boxy body.' },
    { img: 'denim', name: 'Trucker Jacket — Light Wash', price: 38000, h: 300, desc: 'Classic light-wash trucker with a fleece collar and chest flap pockets.' },
    { img: 'lilac', name: 'Fisherman Knit — Lilac', price: 29000, h: 280, desc: 'Chunky rib fisherman knit with a high neck. Warm without the weight.' },
  ];
  const START = 2;

  const $ = (s, el = document) => el.querySelector(s);
  const body = document.body;
  const looksEl = $('.looks');
  const stage = $('#stage');
  const cursor = $('.cursor');
  const piecesEl = $('#pieces');

  // ---------- Bag + toast ----------
  let bag = 0, toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function addToBag(n, label) {
    bag += n;
    const b = $('#bag-count'); b.textContent = bag;
    const btn = b.parentElement; btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    toast(label);
  }

  // ---------- Looks carousel ----------
  const models = LOOKS.map((look, i) => {
    const el = document.createElement('div');
    el.className = 'model';
    el.innerHTML = `<img src="images/${look.img}.webp" alt="Look ${i + 1}: ${look.name}" draggable="false">`;
    stage.insertBefore(el, cursor);
    return el;
  });
  $('#count-all').textContent = String(LOOKS.length).padStart(2, '0');

  let pos = START, target = START, vel = 0;
  let active = -1;
  let open = false;
  let mobile = false;

  const spacing = () => (mobile ? Math.min(window.innerWidth * 0.42, 210) : Math.min(stage.clientWidth * 0.19, 300));

  function setActive(i) {
    if (i === active) return;
    active = i;
    const look = LOOKS[i];
    $('#count-now').textContent = String(i + 1).padStart(2, '0');
    $('#look-num').textContent = `Look ${String(i + 1).padStart(2, '0')}`;
    $('#look-name').textContent = look.name;
    $('#look-total').textContent = naira(look.pieces.reduce((s, p) => s + p.price, 0));
    piecesEl.innerHTML = '';
    look.pieces.forEach((p) => {
      const [x, y, w, h] = p.crop;
      const li = document.createElement('li');
      li.className = 'piece';
      // background-size/position so the crop box fills the thumbnail
      const bs = `${(100 / w) * 100}% ${(100 / h) * 100}%`;
      const bp = `${(x / (100 - w || 1)) * 100}% ${(y / (100 - h || 1)) * 100}%`;
      li.innerHTML = `<div class="crop" style="background-image:url(images/${look.img}.webp);background-size:${bs};background-position:${bp}"></div>
        <div><h4>${p.name}</h4><p>${naira(p.price)}</p><button class="add" type="button">Add</button></div>`;
      li.querySelector('.add').addEventListener('click', () => addToBag(1, `Added ${p.name}`));
      piecesEl.appendChild(li);
    });
  }

  function go(i) { target = clamp(Math.round(i), 0, LOOKS.length - 1); }

  function openLook(i) {
    go(i);
    open = true;
    body.classList.add('open');
    cursor.classList.remove('on');
  }
  function closeLook() {
    open = false;
    body.classList.remove('open');
  }
  $('.back').addEventListener('click', closeLook);
  $('#prev').addEventListener('click', () => go(target - 1));
  $('#next').addEventListener('click', () => go(target + 1));
  $('#add-look').addEventListener('click', () => {
    const look = LOOKS[active];
    addToBag(look.pieces.length, `Added the full "${look.name}" look`);
  });
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { go(target + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { go(target - 1); e.preventDefault(); }
    if (e.key === 'Enter') openLook(target);
    if (e.key === 'Escape') closeLook();
  });

  // drag
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, start: pos, last: e.clientX, t: performance.now(), moved: 0 };
    stage.setPointerCapture(e.pointerId);
    cursor.classList.add('press');
  });
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    cursor.style.left = `${e.clientX - r.left}px`;
    cursor.style.top = `${e.clientY - r.top}px`;
    if (!open) {
      cursor.classList.add('on');
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const hit = under && under.closest('.model');
      const onCenter = hit && models.indexOf(hit) === Math.round(pos);
      cursor.classList.toggle('view', !!onCenter && !drag);
      cursor.firstElementChild.textContent = onCenter && !drag ? 'View' : 'Drag';
    }
    if (!drag || open) return;
    const now = performance.now();
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    vel = -(e.clientX - drag.last) / Math.max(1, now - drag.t) / spacing() * 16;
    drag.last = e.clientX; drag.t = now;
    let p = drag.start - dx / spacing();
    if (p < 0) p *= 0.35; // rubber band at the ends
    if (p > LOOKS.length - 1) p = LOOKS.length - 1 + (p - LOOKS.length + 1) * 0.35;
    pos = target = p;
  });
  const endDrag = (e) => {
    if (!drag) return;
    cursor.classList.remove('press');
    const click = drag.moved < 6;
    drag = null;
    if (open) return;
    if (click) {
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const hit = under && under.closest('.model');
      if (hit) {
        const i = models.indexOf(hit);
        if (i === Math.round(pos)) openLook(i); else go(i);
      }
      return;
    }
    go(pos + clamp(vel * 6, -2.5, 2.5));
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', () => cursor.classList.remove('on'));
  // trackpad horizontal swipes
  let wheelLock = 0;
  stage.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || open) return;
    e.preventDefault();
    const now = performance.now();
    if (now - wheelLock < 350 || Math.abs(e.deltaX) < 8) return;
    wheelLock = now;
    go(target + Math.sign(e.deltaX));
  }, { passive: false });

  function renderLooks(dt) {
    if (!drag) {
      const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 9);
      pos += (target - pos) * k;
      if (Math.abs(target - pos) < 0.0005) pos = target;
    }
    setActive(clamp(Math.round(pos), 0, LOOKS.length - 1));
    const sp = spacing();
    const openShift = open ? (mobile ? 0 : -stage.clientWidth * 0.14) : 0;
    models.forEach((el, i) => {
      const d = i - pos;
      const a = Math.abs(d);
      // far models bunch up a little
      const x = Math.sign(d) * sp * (a < 1 ? a : 1 + (a - 1) * 0.78);
      let s = 1 - Math.min(a, 3) * 0.1;
      let blur = Math.min(a, 3) * (mobile ? 1.6 : 2.6);
      let o = clamp(1 - Math.max(0, a - 2.3) * 0.9, 0, 1) * (1 - Math.min(a, 1) * 0.12);
      if (open) {
        const isActive = i === active;
        o = isActive ? 1 : 0;
        s = isActive ? 1.06 : 0.9;
        blur = isActive ? 0 : 8;
      }
      el.style.transform = `translateX(calc(-50% + ${x + (open ? openShift : 0)}px)) scale(${s})`;
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
      el.style.opacity = o.toFixed(3);
      el.style.zIndex = String(100 - Math.round(a * 10));
      el.style.pointerEvents = o < 0.05 ? 'none' : 'auto';
    });
  }

  // ---------- Clothes rail ----------
  const railWrap = $('#rail-wrap');
  const rail = $('#rail');
  const hanger = `<svg class="hook" viewBox="0 0 140 46" aria-hidden="true"><path d="M70 4c-6 0-9 4-9 8 0 3 2 5 5 6l4 2v6L6 42c-4 2-3 4 1 4h126c4 0 5-2 1-4L70 26" fill="none" stroke="#7b7a76" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // three copies of the collection so the rail can loop forever
  const railItems = [...GARMENTS, ...GARMENTS, ...GARMENTS].map((g, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'item';
    el.setAttribute('role', 'listitem');
    el.setAttribute('aria-label', `${g.name}, ${naira(g.price)}`);
    el.innerHTML = `<div class="swing">${hanger}<img class="garment" src="images/${g.img}.webp" alt="" draggable="false"></div>
      <span class="tag"><b>${naira(g.price)}</b>${g.name.split(' — ')[0]}</span>`;
    el.dataset.g = String(i % GARMENTS.length);
    rail.appendChild(el);
    return el;
  });

  let railX = 0, railVel = -0.25, railDrag = null, railHover = false;
  const gap = () => (mobile ? 22 : 34);
  let railLayout = [];
  let loopW = 0;

  function layoutRail() {
    const scale = mobile ? 0.78 : 1;
    let x = 0;
    railLayout = railItems.map((el) => {
      const g = GARMENTS[+el.dataset.g];
      const img = el.querySelector('.garment');
      const ar = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0.8;
      const w = Math.max(90, g.h * scale * ar);
      el.style.setProperty('--w', `${w}px`);
      const out = { el, x, w };
      x += w + gap();
      return out;
    });
    loopW = x / 3;
  }

  railWrap.addEventListener('pointerdown', (e) => {
    railDrag = { x: e.clientX, start: railX, last: e.clientX, t: performance.now(), moved: 0 };
    railWrap.setPointerCapture(e.pointerId);
    railWrap.classList.add('dragging');
  });
  railWrap.addEventListener('pointermove', (e) => {
    if (!railDrag) return;
    const now = performance.now();
    const dx = e.clientX - railDrag.x;
    railDrag.moved = Math.max(railDrag.moved, Math.abs(dx));
    railVel = (e.clientX - railDrag.last) / Math.max(1, now - railDrag.t) * 16;
    railDrag.last = e.clientX; railDrag.t = now;
    railX = railDrag.start + dx;
  });
  const railEnd = (e) => {
    if (!railDrag) return;
    railWrap.classList.remove('dragging');
    const click = railDrag.moved < 6;
    railDrag = null;
    if (click) {
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const item = hit && hit.closest('.item');
      if (item) openProduct(+item.dataset.g);
    }
  };
  railWrap.addEventListener('pointerup', railEnd);
  railWrap.addEventListener('pointercancel', railEnd);
  railWrap.addEventListener('pointerenter', () => (railHover = true));
  railWrap.addEventListener('pointerleave', () => (railHover = false));
  railWrap.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    railX -= e.deltaX;
    railVel = 0;
  }, { passive: false });
  rail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.item');
      if (item) { e.preventDefault(); openProduct(+item.dataset.g); }
    }
  });
  rail.addEventListener('focusin', (e) => {
    // keep a keyboard-focused garment on screen
    const item = e.target.closest('.item');
    const L = item && railLayout.find((r) => r.el === item);
    if (!L) return;
    const screenX = ((L.x + railX) % (loopW * 3) + loopW * 3) % (loopW * 3) - loopW;
    if (screenX < 40 || screenX > window.innerWidth - L.w - 40) railX += window.innerWidth / 2 - (screenX + L.w / 2);
  });

  function renderRail(dt) {
    if (!railDrag) {
      const idle = reduceMotion || railHover || !pv.hidden ? 0 : -0.35;
      railVel += (idle - railVel) * (1 - Math.exp(-dt * 2.2));
      railX += railVel * dt * 60;
    }
    const total = loopW * 3;
    railLayout.forEach(({ el, x }) => {
      // wrap each garment around so the rail never ends
      let sx = ((x + railX) % total + total) % total - loopW;
      el.style.transform = `translate3d(${sx}px,0,0) rotate(${clamp(-railVel * 0.4, -6, 6)}deg)`;
    });
  }

  // ---------- Product view ----------
  const pv = $('#pv');
  const spinner = $('#spinner');
  const pvStage = $('#pv-stage');
  let pvItem = null, spin = 0, spinVel = 0, spinDrag = null, lastFocus = null;

  function openProduct(i) {
    const g = GARMENTS[i];
    pvItem = g;
    lastFocus = document.activeElement;
    const src = `images/${g.img}.webp`;
    spinner.querySelectorAll('img').forEach((im) => (im.src = src));
    spinner.querySelector('.front').alt = g.name;
    const img = railItems[i].querySelector('.garment');
    spinner.style.setProperty('--ar', img.naturalWidth ? img.naturalWidth / img.naturalHeight : 0.8);
    $('#pv-name').textContent = g.name;
    $('#pv-price').textContent = naira(g.price);
    $('#pv-desc').textContent = g.desc;
    $('#pv-sizes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    spin = -40; spinVel = 2.2;
    pv.hidden = false;
    requestAnimationFrame(() => pv.classList.add('show'));
    document.documentElement.style.overflow = 'hidden';
    $('.pv-close').focus();
  }
  function closeProduct() {
    pv.classList.remove('show');
    document.documentElement.style.overflow = '';
    setTimeout(() => { pv.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $('.pv-close').addEventListener('click', closeProduct);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pv.hidden) closeProduct(); });
  $('#pv-sizes').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $('#pv-sizes').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  $('#pv-add').addEventListener('click', () => {
    const size = $('#pv-sizes [aria-pressed="true"]');
    if (!size) {
      const s = $('#pv-sizes'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
      return toast('Pick a size first');
    }
    addToBag(1, `Added ${pvItem.name}, size ${size.textContent}`);
  });
  pvStage.addEventListener('pointerdown', (e) => {
    spinDrag = { x: e.clientX, last: e.clientX, t: performance.now() };
    pvStage.setPointerCapture(e.pointerId);
    pvStage.classList.add('dragging');
  });
  pvStage.addEventListener('pointermove', (e) => {
    if (!spinDrag) return;
    const now = performance.now();
    const dx = e.clientX - spinDrag.last;
    spin += dx * 0.6;
    spinVel = dx * 0.6 / Math.max(1, now - spinDrag.t) * 16;
    spinDrag.last = e.clientX; spinDrag.t = now;
  });
  const spinEnd = () => { spinDrag = null; pvStage.classList.remove('dragging'); };
  pvStage.addEventListener('pointerup', spinEnd);
  pvStage.addEventListener('pointercancel', spinEnd);

  function renderProduct(dt) {
    if (pv.hidden) return;
    if (!spinDrag) {
      const idle = reduceMotion ? 0 : 0.9;
      spinVel += (idle - spinVel) * (1 - Math.exp(-dt * 1.5));
      spin += spinVel * dt * 60;
    }
    spinner.style.transform = `rotateY(${spin}deg)`;
  }

  // ---------- Loop / layout ----------
  function layout() {
    mobile = window.innerWidth < 820;
    layoutRail();
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    renderLooks(dt);
    renderRail(dt);
    renderProduct(dt);
    requestAnimationFrame(frame);
  }

  // credits from images/credits.json
  fetch('images/credits.json').then((r) => r.json()).then((c) => {
    const seen = new Set();
    $('#credits').innerHTML = Object.values(c).filter((p) => !seen.has(p.user) && seen.add(p.user))
      .map((p) => `<a href="https://unsplash.com/@${p.user}?utm_source=camorra&amp;utm_medium=referral">${p.name}</a>`).join(', ');
  }).catch(() => {});

  layout();
  window.addEventListener('resize', layout);
  railItems.forEach((el) => {
    const img = el.querySelector('.garment');
    if (!img.complete) img.addEventListener('load', layoutRail, { once: true });
  });
  setActive(START);
  requestAnimationFrame(frame);
})();
