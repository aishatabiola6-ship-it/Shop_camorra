// ============================================================
// Shop Camorra — flavour-scroll page
// To add a shade: add a <section id="..."> in index.html,
// a palette in styles.css, and an entry in SHADES below.
// ============================================================

// ------------------------------------------------------------
// Placeholder ingredient art (inline SVG). Swap these for real
// transparent PNGs later, e.g. '<img src="assets/fragola/strawberry.png">'
// ------------------------------------------------------------
const dots = (pts, r, fill) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");

const ART = {
    strawberry: `<svg viewBox="0 0 100 110"><path d="M50 30 C80 22 98 44 90 70 C82 94 62 108 50 108 C38 108 18 94 10 70 C2 44 20 22 50 30Z" fill="#e8355a"/><g fill="#ffd36b">${[[34,50],[50,46],[66,50],[28,66],[44,64],[58,64],[72,66],[38,80],[52,82],[64,80],[48,96]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="2" ry="3"/>`).join("")}</g><path d="M50 32 L34 18 L46 24 L50 8 L54 24 L66 18 Z" fill="#5f9a3a"/><ellipse cx="30" cy="50" rx="6" ry="10" fill="#fff" opacity=".35"/></svg>`,
    strawberryHalf: `<svg viewBox="0 0 100 100"><path d="M50 8 C82 8 96 36 88 62 C80 86 62 96 50 96 C38 96 20 86 12 62 C4 36 18 8 50 8Z" fill="#e8355a"/><path d="M50 18 C74 18 84 40 78 60 C72 78 60 86 50 86 C40 86 28 78 22 60 C16 40 26 18 50 18Z" fill="#ff98a8"/><path d="M50 22 C56 40 56 64 50 80 C44 64 44 40 50 22Z" fill="#fff" opacity=".7"/></svg>`,
    raspberry: `<svg viewBox="0 0 100 110"><path d="M50 22 L36 10 M50 22 L64 10 M50 22 L50 4" stroke="#5f9a3a" stroke-width="5" stroke-linecap="round"/>${dots([[50,36],[36,44],[64,44],[50,52],[28,60],[72,60],[42,66],[58,66],[34,80],[66,80],[50,82],[42,96],[58,96]], 11, "#b8234f")}<g opacity=".35">${dots([[46,32],[32,40],[60,40],[46,48],[24,56],[38,62]], 3, "#fff")}</g></svg>`,
    raspberrySmall: `<svg viewBox="0 0 60 60">${dots([[30,16],[18,26],[42,26],[30,34],[22,44],[38,44]], 9, "#c43a64")}</svg>`,
    peach: `<svg viewBox="0 0 100 100"><circle cx="50" cy="56" r="40" fill="#f9a27c"/><circle cx="62" cy="60" r="30" fill="#f7885f" opacity=".6"/><path d="M50 18 C40 40 40 74 50 96" stroke="#e0704c" stroke-width="3" fill="none"/><path d="M50 18 C58 6 76 4 86 10 C76 20 62 22 50 18Z" fill="#6f9a3a"/><ellipse cx="32" cy="44" rx="7" ry="11" fill="#fff" opacity=".35"/></svg>`,
    peachSlice: `<svg viewBox="0 0 100 60"><path d="M4 8 A46 46 0 0 0 96 8 Z" fill="#f7885f"/><path d="M12 8 A38 38 0 0 0 88 8 Z" fill="#ffc49a"/><ellipse cx="50" cy="12" rx="10" ry="6" fill="#b8563a"/></svg>`,
    caramel: `<svg viewBox="0 0 100 100"><path d="M50 8 L90 28 L50 48 L10 28Z" fill="#e0a36a"/><path d="M10 28 L50 48 L50 92 L10 72Z" fill="#b8743c"/><path d="M90 28 L50 48 L50 92 L90 72Z" fill="#9a5a2a"/><path d="M28 22 L50 14" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></svg>`,
    vanilla: `<svg viewBox="0 0 40 160"><path d="M20 4 C30 40 30 120 18 156 C12 120 10 40 20 4Z" fill="#4a2a1c"/><path d="M20 12 C24 50 24 110 18 148" stroke="#6e4430" stroke-width="2" fill="none"/></svg>`,
    sparkle: (c) => `<svg viewBox="0 0 100 100"><path d="M50 2 C54 38 62 46 98 50 C62 54 54 62 50 98 C46 62 38 54 2 50 C38 46 46 38 50 2Z" fill="${c}"/></svg>`,
    bubble: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff" fill-opacity=".35" stroke="#b9c3d6" stroke-width="3"/><path d="M26 38 A28 28 0 0 1 44 22" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`,
    leaf: (c = "#6f9a3a") => `<svg viewBox="0 0 100 60"><path d="M4 30 C30 -4 76 -4 96 30 C76 64 30 64 4 30Z" fill="${c}"/><path d="M4 30 L96 30" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></svg>`,
    drop: (c) => `<svg viewBox="0 0 60 80"><path d="M30 2 C30 2 4 38 4 52 A26 26 0 0 0 56 52 C56 38 30 2 30 2Z" fill="${c}"/><ellipse cx="20" cy="50" rx="5" ry="9" fill="#fff" opacity=".45"/></svg>`,
    flower: (petal = "#fff6dc", mid = "#e8a028") => `<svg viewBox="0 0 100 100"><g fill="${petal}"><circle cx="50" cy="22" r="18"/><circle cx="78" cy="50" r="18"/><circle cx="50" cy="78" r="18"/><circle cx="22" cy="50" r="18"/></g><circle cx="50" cy="50" r="14" fill="${mid}"/></svg>`,
};

// ------------------------------------------------------------
// Packaging drawings. type: "squeeze" | "frosted" | "dome"
// ------------------------------------------------------------
function packaging(id, p) {
    const shine = `<linearGradient id="shine-${id}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff" stop-opacity=".55"/><stop offset=".42" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>`;
    const chrome = `<linearGradient id="chrome-${id}" x1="0" x2="1"><stop offset="0" stop-color="#8a8a8e"/><stop offset=".2" stop-color="#f7f7f9"/><stop offset=".45" stop-color="#b9b9be"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#76767b"/></linearGradient>`;
    const S = `url(#shine-${id})`, C = `url(#chrome-${id})`;
    const label = (y) => `<text class="pkg-label" x="60" y="${y}" transform="rotate(90 60 ${y})" text-anchor="middle" fill="${p.label}">camorra</text>`;
    let body = "";

    if (p.type === "squeeze") {
        body = `<rect x="14" y="6" width="92" height="34" rx="4" fill="${p.crimp}"/>
            <g stroke="#000" stroke-opacity=".12" stroke-width="2"><line x1="14" y1="16" x2="106" y2="16"/><line x1="14" y1="24" x2="106" y2="24"/><line x1="14" y1="32" x2="106" y2="32"/></g>
            <path d="M16 40 H104 L98 320 H22 Z" fill="${p.body}"/>
            <rect x="22" y="318" width="76" height="96" rx="10" fill="${p.cap}"/>
            <path d="M16 40 H104 L98 320 H22 Z" fill="${S}"/>
            <rect x="22" y="318" width="76" height="96" rx="10" fill="${S}"/>${label(180)}`;
    } else if (p.type === "frosted") {
        body = `<rect x="24" y="4" width="72" height="150" rx="12" fill="${p.cap}"/>
            <rect x="24" y="4" width="72" height="150" rx="12" fill="${S}"/>
            <rect x="16" y="150" width="88" height="262" rx="18" fill="${p.body}"/>
            <rect x="16" y="150" width="88" height="262" rx="18" fill="#fff" opacity=".18"/>
            <rect x="16" y="150" width="88" height="262" rx="18" fill="${S}"/>${label(282)}`;
    } else {
        body = `<path d="M26 150 V60 A34 34 0 0 1 94 60 V150 Z" fill="${C}"/>
            <rect x="20" y="148" width="80" height="22" rx="4" fill="${C}"/>
            <path d="M18 170 H102 V360 A42 42 0 0 1 18 360 Z" fill="#fff" opacity=".6"/>
            <path d="M28 178 H92 V356 A32 32 0 0 1 28 356 Z" fill="${p.body}"/>
            <path d="M18 170 H102 V360 A42 42 0 0 1 18 360 Z" fill="${S}"/>${label(290)}`;
    }
    return `<svg class="pkg" data-pkg="${id}" viewBox="0 0 120 420" xmlns="http://www.w3.org/2000/svg"><defs>${shine}${chrome}</defs>${body}</svg>`;
}

// ------------------------------------------------------------
// One entry per shade: its packaging and its 6–8 floating ingredients.
// size = % of viewport width, x/y = position in the section,
// speed = 0.2–0.6 × scroll. Small → slow + blurred, big → fast + sharp.
// ------------------------------------------------------------
const SHADES = {
    cristallo: {
        pkg: { type: "dome", body: "#e9e4ec", label: "#8a90a6" },
        floaters: [
            { art: ART.bubble, size: 12, x: 58, y: 14, speed: 0.55 },
            { art: ART.sparkle("#c9d2e4"), size: 8, x: 80, y: 62, speed: 0.48 },
            { art: ART.drop("#d6deec"), size: 6, x: 46, y: 72, speed: 0.42 },
            { art: ART.sparkle("#dfe4ef"), size: 3, x: 70, y: 30, speed: 0.22 },
            { art: ART.bubble, size: 4, x: 88, y: 16, speed: 0.25, mobileHide: true },
            { art: ART.sparkle("#c9d2e4"), size: 3, x: 52, y: 48, speed: 0.2, mobileHide: true },
            { art: ART.bubble, size: 5, x: 92, y: 86, speed: 0.3 },
        ],
    },
    fragola: {
        pkg: { type: "squeeze", crimp: "#e04f86", body: "#f478a8", cap: "#fbf7f2", label: "#fff" },
        floaters: [
            { art: ART.strawberry, size: 14, x: 58, y: 12, speed: 0.55 },
            { art: ART.strawberryHalf, size: 10, x: 80, y: 62, speed: 0.48 },
            { art: ART.leaf(), size: 8, x: 46, y: 72, speed: 0.4 },
            { art: ART.drop("#f478a8"), size: 4, x: 70, y: 30, speed: 0.25 },
            { art: ART.strawberry, size: 5, x: 88, y: 16, speed: 0.22, mobileHide: true },
            { art: ART.flower("#ffd6e2", "#f478a8"), size: 4, x: 52, y: 48, speed: 0.2, mobileHide: true },
            { art: ART.strawberryHalf, size: 4, x: 92, y: 86, speed: 0.3 },
        ],
    },
    pesca: {
        pkg: { type: "squeeze", crimp: "#ec8a66", body: "#f9a986", cap: "#fbf7f2", label: "#fff" },
        floaters: [
            { art: ART.peach, size: 13, x: 60, y: 14, speed: 0.55 },
            { art: ART.peachSlice, size: 10, x: 80, y: 66, speed: 0.46 },
            { art: ART.leaf(), size: 8, x: 46, y: 74, speed: 0.42 },
            { art: ART.drop("#f9a986"), size: 4, x: 72, y: 32, speed: 0.24 },
            { art: ART.flower("#ffe6d6", "#f7885f"), size: 4, x: 88, y: 18, speed: 0.22, mobileHide: true },
            { art: ART.peach, size: 4, x: 52, y: 50, speed: 0.2, mobileHide: true },
            { art: ART.peachSlice, size: 4, x: 92, y: 88, speed: 0.3 },
        ],
    },
    caramello: {
        pkg: { type: "frosted", cap: "#efe5d4", body: "#a8684c", label: "#f6ebe0" },
        floaters: [
            { art: ART.caramel, size: 12, x: 60, y: 60, speed: 0.55 },
            { art: ART.vanilla, size: 5, x: 86, y: 6, speed: 0.5 },
            { art: ART.drop("#b8743c"), size: 6, x: 48, y: 18, speed: 0.42 },
            { art: ART.flower("#fbf3e4", "#e0b46a"), size: 4, x: 74, y: 30, speed: 0.24 },
            { art: ART.caramel, size: 3, x: 92, y: 70, speed: 0.2, mobileHide: true },
            { art: ART.flower("#fbf3e4", "#e0b46a"), size: 5, x: 52, y: 84, speed: 0.3, mobileHide: true },
            { art: ART.drop("#d69a62"), size: 3, x: 70, y: 88, speed: 0.22 },
            { art: ART.caramel, size: 4, x: 40, y: 6, speed: 0.26 },
        ],
    },
    malva: {
        pkg: { type: "frosted", cap: "#efe5d4", body: "#a86a86", label: "#f8eaf0" },
        floaters: [
            { art: ART.flower("#d9a7c0", "#8a4a6a"), size: 12, x: 60, y: 12, speed: 0.55 },
            { art: ART.leaf("#c98aa8"), size: 9, x: 80, y: 64, speed: 0.46 },
            { art: ART.drop("#a86a86"), size: 6, x: 46, y: 72, speed: 0.42 },
            { art: ART.flower("#e8c6d6", "#a86a86"), size: 4, x: 74, y: 30, speed: 0.24 },
            { art: ART.leaf("#d9a7c0"), size: 4, x: 88, y: 18, speed: 0.22, mobileHide: true },
            { art: ART.drop("#c98aa8"), size: 3, x: 52, y: 48, speed: 0.2, mobileHide: true },
            { art: ART.flower("#d9a7c0", "#8a4a6a"), size: 5, x: 92, y: 86, speed: 0.3 },
        ],
    },
    lampone: {
        pkg: { type: "dome", body: "#9e2a50", label: "#fff" },
        floaters: [
            { art: ART.raspberry, size: 14, x: 62, y: 14, speed: 0.55 },
            { art: ART.raspberry, size: 9, x: 82, y: 64, speed: 0.46 },
            { art: ART.leaf("#557a2e"), size: 9, x: 46, y: 72, speed: 0.42 },
            { art: ART.raspberrySmall, size: 4, x: 86, y: 26, speed: 0.22 },
            { art: ART.drop("#9e2a50"), size: 3, x: 54, y: 46, speed: 0.2, mobileHide: true },
            { art: ART.raspberrySmall, size: 3, x: 72, y: 90, speed: 0.25, mobileHide: true },
            { art: ART.drop("#c43a64"), size: 4, x: 94, y: 48, speed: 0.3 },
        ],
    },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

// ---------- Draw packaging ----------
const tube = document.querySelector(".tube");
tube.innerHTML = Object.entries(SHADES).map(([id, s]) => packaging(id, s.pkg)).join("");

// ---------- Build floaters ----------
document.querySelectorAll(".floaters").forEach((wrap) => {
    const isHero = wrap.parentElement.classList.contains("hero");
    const list = (SHADES[wrap.dataset.set] || {}).floaters || [];
    // The hero gets a lighter scatter of the first shade
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

// ---------- Steps 3 & 4: switch shade when a section crosses mid-screen ----------
const navLinks = document.querySelectorAll(".nav-links a");
const pkgs = tube.querySelectorAll(".pkg");

function setFlavour(id, sectionId) {
    root.dataset.flavour = id;
    pkgs.forEach((p) => p.classList.toggle("active", p.dataset.pkg === id));
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${sectionId}`));
}

const sections = document.querySelectorAll("#hero, " + Object.keys(SHADES).map((id) => `#${id}`).join(", "));
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const t = entry.target;
            setFlavour(t.id === "hero" ? t.dataset.flavourSection : t.id, t.id);
        });
    },
    { rootMargin: "-50% 0px -50% 0px" }
);
sections.forEach((s) => observer.observe(s));
setFlavour(root.dataset.flavour, "hero");

// ---------- Steps 6 & 7: parallax at 0.2–0.6 × scroll ----------
const floaters = [...document.querySelectorAll(".floater")];
let ticking = false;

function render() {
    ticking = false;
    const vh = window.innerHeight;

    floaters.forEach((el) => {
        const rect = el.closest("section").getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > vh * 2) return; // off-screen, skip
        const offset = -rect.top * parseFloat(el.dataset.speed);
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) rotate(${el.dataset.rot}deg)`;
    });

    // The product tilts and bobs gently as you scroll
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
