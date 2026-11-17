// ------------------------------------------------------------
// Placeholder ingredient art (inline SVG). Swap these for real
// transparent PNGs later, e.g. <img src="assets/ciliegia/cherry.png">
// ------------------------------------------------------------
const ART = {
    cherry: `<svg viewBox="0 0 100 110"><path d="M50 8 C46 30 34 46 28 62 M50 8 C56 32 66 46 72 60" stroke="#4f6b2a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M50 8 C62 2 76 6 82 14 C70 18 58 16 50 8Z" fill="#6f9a3a"/><circle cx="28" cy="78" r="22" fill="#a3122e"/><circle cx="72" cy="76" r="22" fill="#c2183a"/><circle cx="21" cy="70" r="5" fill="#fff" opacity=".5"/><circle cx="65" cy="68" r="5" fill="#fff" opacity=".5"/></svg>`,
    cherryHalf: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#8f0f28"/><circle cx="50" cy="50" r="36" fill="#d0304e"/><ellipse cx="50" cy="52" rx="12" ry="15" fill="#f2c9a6"/></svg>`,
    leaf: (c = "#6f9a3a") => `<svg viewBox="0 0 100 60"><path d="M4 30 C30 -4 76 -4 96 30 C76 64 30 64 4 30Z" fill="${c}"/><path d="M4 30 L96 30" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></svg>`,
    drop: (c) => `<svg viewBox="0 0 60 80"><path d="M30 2 C30 2 4 38 4 52 A26 26 0 0 0 56 52 C56 38 30 2 30 2Z" fill="${c}"/><ellipse cx="20" cy="50" rx="5" ry="9" fill="#fff" opacity=".45"/></svg>`,
    honeycomb: `<svg viewBox="0 0 120 104"><g fill="#e8a028" stroke="#b97510" stroke-width="3"><path d="M30 2 L58 2 L72 26 L58 50 L30 50 L16 26Z"/><path d="M72 28 L100 28 L114 52 L100 76 L72 76 L58 52Z"/><path d="M30 54 L58 54 L72 78 L58 102 L30 102 L16 78Z"/></g></svg>`,
    dipper: `<svg viewBox="0 0 60 160"><rect x="26" y="0" width="8" height="90" rx="4" fill="#b5875a"/><g fill="#c99a68"><rect x="10" y="88" width="40" height="12" rx="6"/><rect x="12" y="104" width="36" height="12" rx="6"/><rect x="14" y="120" width="32" height="12" rx="6"/><rect x="18" y="136" width="24" height="12" rx="6"/></g><path d="M30 148 C30 150 26 158 30 160 C34 158 30 150 30 148Z" fill="#e8a028"/></svg>`,
    flower: `<svg viewBox="0 0 100 100"><g fill="#fff6dc"><circle cx="50" cy="22" r="18"/><circle cx="78" cy="50" r="18"/><circle cx="50" cy="78" r="18"/><circle cx="22" cy="50" r="18"/></g><circle cx="50" cy="50" r="14" fill="#e8a028"/></svg>`,
    blackberry: `<svg viewBox="0 0 100 110"><path d="M50 4 L50 22" stroke="#4f6b2a" stroke-width="4" stroke-linecap="round"/><path d="M50 18 L34 10 M50 18 L66 10" stroke="#6f9a3a" stroke-width="5" stroke-linecap="round"/><g fill="#3d1450">${[[50,34],[36,44],[64,44],[50,52],[30,62],[70,62],[44,68],[58,68],[38,84],[62,84],[50,96],[50,80]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="11"/>`).join("")}</g><g fill="#fff" opacity=".35">${[[46,30],[32,40],[60,40],[46,48],[26,58]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3"/>`).join("")}</g></svg>`,
    berrySmall: `<svg viewBox="0 0 60 60"><g fill="#5a1f6e">${[[30,16],[18,26],[42,26],[30,34],[22,44],[38,44]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9"/>`).join("")}</g></svg>`,
};

// 6–8 ingredients per flavour. size = % of viewport width,
// x/y = position inside the section, speed = 0.2–0.6 × scroll.
// Small → slow + blurred (far away). Big → fast + sharp (close up).
const SETS = {
    ciliegia: [
        { art: ART.cherry, size: 16, x: 58, y: 12, speed: 0.55 },
        { art: ART.cherryHalf, size: 10, x: 80, y: 62, speed: 0.48 },
        { art: ART.leaf(), size: 9, x: 44, y: 70, speed: 0.4 },
        { art: ART.drop("#c2183a"), size: 4, x: 70, y: 30, speed: 0.25 },
        { art: ART.cherry, size: 5, x: 88, y: 18, speed: 0.22, mobileHide: true },
        { art: ART.drop("#e04060"), size: 3, x: 52, y: 48, speed: 0.2, mobileHide: true },
        { art: ART.cherryHalf, size: 4, x: 92, y: 86, speed: 0.3 },
    ],
    miele: [
        { art: ART.honeycomb, size: 15, x: 60, y: 60, speed: 0.55 },
        { art: ART.dipper, size: 7, x: 86, y: 6, speed: 0.5 },
        { art: ART.drop("#e8a028"), size: 6, x: 48, y: 18, speed: 0.42 },
        { art: ART.flower, size: 4, x: 74, y: 30, speed: 0.24 },
        { art: ART.drop("#f2b84a"), size: 3, x: 92, y: 70, speed: 0.2, mobileHide: true },
        { art: ART.flower, size: 5, x: 52, y: 84, speed: 0.3, mobileHide: true },
        { art: ART.leaf("#9bb24a"), size: 4, x: 70, y: 88, speed: 0.22 },
        { art: ART.honeycomb, size: 4, x: 40, y: 6, speed: 0.26 },
    ],
    mora: [
        { art: ART.blackberry, size: 15, x: 62, y: 14, speed: 0.55 },
        { art: ART.blackberry, size: 9, x: 82, y: 64, speed: 0.46 },
        { art: ART.leaf("#557a2e"), size: 10, x: 46, y: 72, speed: 0.42 },
        { art: ART.berrySmall, size: 4, x: 86, y: 26, speed: 0.22 },
        { art: ART.drop("#6e2478"), size: 3, x: 54, y: 46, speed: 0.2, mobileHide: true },
        { art: ART.berrySmall, size: 3, x: 72, y: 90, speed: 0.25, mobileHide: true },
        { art: ART.drop("#8a3aa0"), size: 4, x: 94, y: 48, speed: 0.3 },
    ],
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Build floaters ----------
document.querySelectorAll(".floaters").forEach((wrap) => {
    const isHero = wrap.parentElement.classList.contains("hero");
    const list = SETS[wrap.dataset.set] || [];
    // The hero gets a lighter scatter of the first flavour
    (isHero ? list.slice(0, 4) : list).forEach((item) => {
        const el = document.createElement("div");
        el.className = "floater " + (item.speed >= 0.4 ? "near" : "far");
        if (item.mobileHide) el.classList.add("mobile-hide");
        el.style.width = `clamp(${Math.max(item.size * 4, 18)}px, ${item.size}vw, ${item.size * 18}px)`;
        el.style.left = `${item.x}%`;
        el.style.top = `${item.y}%`;
        el.dataset.speed = item.speed;
        el.dataset.rot = (Math.random() * 40 - 20).toFixed(1);
        el.innerHTML = item.art;
        wrap.appendChild(el);
    });
});

// ---------- Steps 3 & 4: switch flavour when a section crosses mid-screen ----------
const root = document.documentElement;
const navLinks = document.querySelectorAll(".nav-links a");

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const flavour = entry.target.id === "hero" ? entry.target.dataset.flavourSection : entry.target.id;
            root.dataset.flavour = flavour;
            navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
        });
    },
    { rootMargin: "-50% 0px -50% 0px" }
);
document.querySelectorAll("#hero, #ciliegia, #miele, #mora").forEach((s) => observer.observe(s));

// ---------- Steps 6 & 7: parallax at 0.2–0.6 × scroll ----------
const floaters = [...document.querySelectorAll(".floater")];
const tube = document.querySelector(".tube");
let ticking = false;

function render() {
    ticking = false;
    const vh = window.innerHeight;

    floaters.forEach((el) => {
        const section = el.closest("section");
        const rect = section.getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > vh * 2) return; // off-screen, skip
        const offset = -rect.top * parseFloat(el.dataset.speed);
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) rotate(${el.dataset.rot}deg)`;
    });

    // The tube tilts and bobs gently as you scroll
    const y = window.scrollY;
    const tilt = Math.sin(y / 600) * 14;
    const bob = Math.sin(y / 400) * 12;
    tube.style.transform = `translateY(${bob.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`;
}

if (!reduceMotion) {
    window.addEventListener("scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }, { passive: true });
    window.addEventListener("resize", render);
    render();
}

// ---------- Add to bag ----------
const bagCount = document.querySelector(".bag-count");
let count = 0;
document.querySelectorAll(".add").forEach((btn) => {
    btn.addEventListener("click", () => {
        count += 1;
        bagCount.textContent = count;
        bagCount.classList.add("bump");
        setTimeout(() => bagCount.classList.remove("bump"), 200);
        btn.classList.remove("added");
        void btn.offsetWidth; // restart animation
        btn.classList.add("added");
    });
});
