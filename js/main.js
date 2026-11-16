// VELORA — scroll-driven motion for real product photography.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- Floating shoes ----------
  // One pose per section. x/y in vw/vh from screen centre, r = tilt, ry = turn (deg), s = scale, o = opacity.
  const POSES = {
    nude: {
      hero:  { x: 3,   y: -2,  r: -9,  ry: 0,   s: 0.8,  o: 1 },
      craft: { x: 21,  y: 2,   r: 5,   ry: -22, s: 0.92, o: 1 },
      pair:  { x: -24, y: -12, r: -14, ry: 18,  s: 0.58, o: 1 },
      gone:  { x: -32, y: -95, r: -38, ry: 35,  s: 0.5,  o: 0 },
    },
    noir: {
      hero:  { x: 62,  y: 25,  r: 22,  ry: -35, s: 0.6,  o: 0 },
      craft: { x: 58,  y: 12,  r: 16,  ry: -30, s: 0.6,  o: 0 },
      pair:  { x: 24,  y: -9,  r: 7,   ry: -16, s: 0.62, o: 1 },
      gone:  { x: 32,  y: -95, r: 38,  ry: -35, s: 0.5,  o: 0 },
    },
  };
  const MOBILE = {
    nude: {
      hero:  { x: 0,   y: 0,   s: 1 },
      craft: { x: 0,   y: -20, s: 0.85 },
      pair:  { x: -22, y: -20, s: 0.55 },
      gone:  { x: -20, y: -95, s: 0.4 },
    },
    noir: {
      hero:  { x: 70,  y: 0,   s: 0.5 },
      craft: { x: 70,  y: -20, s: 0.5 },
      pair:  { x: 22,  y: -10, s: 0.55 },
      gone:  { x: 20,  y: -95, s: 0.4 },
    },
  };
  const KEYS = ['x', 'y', 'r', 'ry', 's', 'o'];
  const floaters = {
    nude: document.getElementById('shoe-nude'),
    noir: document.getElementById('shoe-noir'),
  };
  const state = { nude: { ...POSES.nude.hero }, noir: { ...POSES.noir.hero } };
  let keyframes = [];
  let mobile = false;

  const lookbook = document.getElementById('lookbook');
  const track = lookbook.querySelector('.track');
  const looks = [...track.children];
  const edFrame = document.querySelector('.ed-frame');
  const edImg = edFrame.querySelector('img');

  function pose(id, name) {
    const p = { ...POSES[id][name] };
    if (mobile) Object.assign(p, MOBILE[id][name]);
    return p;
  }

  function layout() {
    mobile = window.innerWidth < 820;
    // pinned horizontal lookbook: give the section enough height to scroll the whole track
    const extra = Math.max(0, track.scrollWidth - window.innerWidth + 2 * parseFloat(getComputedStyle(track).paddingLeft || 0));
    lookbook.style.height = `${window.innerHeight + extra}px`;

    keyframes = [];
    document.querySelectorAll('[data-pose]').forEach((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const name = el.dataset.pose;
      // reach the pose a little before the section fills the screen, so the shoe is in place as text arrives
      keyframes.push({ at: Math.max(0, top - window.innerHeight * 0.15), name });
    });
    keyframes.sort((a, b) => a.at - b.at);
  }

  function target(id, y) {
    const k = keyframes;
    if (y <= k[0].at) return pose(id, k[0].name);
    for (let i = 0; i < k.length - 1; i++) {
      if (y < k[i + 1].at) {
        const a = pose(id, k[i].name), b = pose(id, k[i + 1].name);
        const t = ease(clamp((y - k[i].at) / Math.max(1, k[i + 1].at - k[i].at), 0, 1));
        const out = {};
        KEYS.forEach((key) => (out[key] = a[key] + (b[key] - a[key]) * t));
        return out;
      }
    }
    return pose(id, k[k.length - 1].name);
  }

  // ---------- Pointer parallax ----------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // ---------- Loop ----------
  let last = performance.now();
  let first = true;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const k = first || reduceMotion ? 1 : 1 - Math.exp(-dt * 6);
    first = false;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    for (const id of ['nude', 'noir']) {
      const t = target(id, y);
      const s = state[id];
      KEYS.forEach((key) => (s[key] += (t[key] - s[key]) * k));
      const el = floaters[id];
      el.style.opacity = s.o.toFixed(3);
      el.style.visibility = s.o < 0.01 ? 'hidden' : 'visible';
      el.style.transform =
        `translate(-50%, -50%) translate3d(${s.x}vw, ${s.y}vh, 0) perspective(1400px) ` +
        `rotateY(${s.ry + pointer.x * 10}deg) rotateX(${pointer.y * -6}deg) rotateZ(${s.r}deg) scale(${s.s})`;
    }

    // editorial: frame opens up and the photo drifts as it passes
    const er = edFrame.getBoundingClientRect();
    const ep = clamp(1 - er.top / vh, 0, 1); // 0 when frame top hits bottom of screen, 1 when it reaches top
    const inset = reduceMotion ? 0 : (1 - ease(ep)) * 14;
    edFrame.style.clipPath = `inset(${inset}% ${inset * 1.4}% ${inset}% ${inset * 1.4}% round ${inset * 2}px)`;
    if (!reduceMotion) edImg.style.transform = `translateY(${(er.top / vh) * -8}%) scale(1.15)`;

    // lookbook: vertical scroll drives the track sideways
    const lr = lookbook.getBoundingClientRect();
    const span = lookbook.offsetHeight - vh;
    const lp = clamp(-lr.top / Math.max(1, span), 0, 1);
    const maxX = Math.max(0, track.scrollWidth - window.innerWidth);
    track.style.transform = `translate3d(${-lp * maxX}px, 0, 0)`;
    if (!reduceMotion) {
      const mid = window.innerWidth / 2;
      looks.forEach((fig) => {
        const b = fig.getBoundingClientRect();
        const d = clamp(Math.abs(b.left + b.width / 2 - mid) / window.innerWidth, 0, 1);
        fig.style.setProperty('--focus', (1 - d).toFixed(3));
      });
    }

    requestAnimationFrame(frame);
  }

  // ---------- UI ----------
  function initUI() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && e.target.classList.add('in'));
    }, { threshold: 0.2 });
    document.querySelectorAll('.reveal, .card').forEach((el) => io.observe(el));

    document.querySelectorAll('.sizes').forEach((group) => {
      group.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        group.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
    });

    const count = document.getElementById('bag-count');
    const toast = document.getElementById('toast');
    let n = 0, timer;
    const showToast = (msg) => {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove('show'), 2200);
    };
    document.querySelectorAll('.add-to-bag').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.card');
        const size = card.querySelector('.sizes [aria-pressed="true"]');
        if (!size) {
          card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
          return showToast('Pick a size first');
        }
        n++;
        count.textContent = n;
        const bag = count.parentElement;
        bag.classList.remove('bump'); void bag.offsetWidth; bag.classList.add('bump');
        showToast(`Added ${card.dataset.name}, size ${size.textContent}`);
      });
    });

    document.getElementById('newsletter').addEventListener('submit', (e) => {
      e.preventDefault();
      e.target.reset();
      showToast("You're on the list ✨");
    });

    const nav = document.querySelector('.nav');
    const bar = document.querySelector('.progress span');
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function start() {
    layout();
    initUI();
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    document.querySelectorAll('img').forEach((img) => img.complete || img.addEventListener('load', layout, { once: true }));
    requestAnimationFrame(frame);
    document.body.classList.add('ready');
  }

  const heroImg = floaters.nude.querySelector('img');
  if (heroImg.complete) start();
  else {
    heroImg.addEventListener('load', start, { once: true });
    heroImg.addEventListener('error', start, { once: true });
  }
})();
