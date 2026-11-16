import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createShoe, COLORWAYS } from './shoe.js';

const BRAND = 'VELORA';
const canvas = document.getElementById('scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environment = envMap;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0.25, 8);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xfff4ea, 0x2a1a18, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffd2b0, 1.6);
rim.position.set(-4, 2, -3);
scene.add(rim);

// rig (position/scale from scroll) > spinner (rotation) > shoe
const rig = new THREE.Group();
const spinner = new THREE.Group();
rig.add(spinner);
scene.add(rig);
const { shoe, materials } = createShoe(BRAND);
spinner.add(shoe);

// soft contact shadow that stays flat under the shoe
const shadowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(30,10,12,0.55)');
  grd.addColorStop(0.5, 'rgba(30,10,12,0.18)');
  grd.addColorStop(1, 'rgba(30,10,12,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 1.3),
  new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -0.95;
rig.add(shadow);

// ---------- Scroll choreography ----------
// One pose per section. x/y in world units, r* in radians, s = scale, sh = shadow opacity.
const TAU = Math.PI * 2;
const POSES = {
  hero:        { x: 0,    y: -0.25, z: 0, rx: 0.32, ry: -0.65,          rz: 0.04,  s: 1.25, sh: 1 },
  craft:       { x: 1.55, y: -0.1,  z: 0, rx: 0.06, ry: TAU,            rz: 0,     s: 1.3,  sh: 1 },
  detail:      { x: -1.35, y: -0.55, z: 0, rx: 0.7, ry: TAU + 0.5,      rz: -0.12, s: 2.1,  sh: 0 },
  colours:     { x: 0.95, y: -0.15, z: 0, rx: 0.22, ry: 2 * TAU - 0.6,  rz: 0.02,  s: 1.25, sh: 1 },
  coloursEnd:  { x: 0.95, y: -0.15, z: 0, rx: 0.22, ry: 3 * TAU - 0.6,  rz: 0.02,  s: 1.25, sh: 1 },
  collection:  { x: 0,    y: 3.4,   z: 0, rx: 0.9,  ry: 3 * TAU + 0.6,  rz: 0.3,   s: 0.9,  sh: 0 },
};
const MOBILE_POSES = {
  hero:        { x: 0,    y: 0.05,  s: 0.78 },
  craft:       { x: 0,    y: 0.75,  s: 0.72 },
  detail:      { x: -0.2, y: 0.85,  s: 1.15 },
  colours:     { x: 0,    y: 0.55,  s: 0.72 },
  coloursEnd:  { x: 0,    y: 0.55,  s: 0.72 },
  collection:  { x: 0,    y: 3.6,   s: 0.6 },
};
const KEYS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'sh'];
let keyframes = [];
let isMobile = false;
const coloursSection = document.getElementById('colours');

function poseFor(name) {
  const p = { ...POSES[name] };
  if (isMobile) Object.assign(p, MOBILE_POSES[name]);
  return p;
}

function layout() {
  const w = window.innerWidth, h = window.innerHeight;
  isMobile = w < 820;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  keyframes = [];
  document.querySelectorAll('[data-pose]').forEach((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const name = el.dataset.pose;
    keyframes.push({ at: top, pose: poseFor(name) });
    if (POSES[name + 'End']) keyframes.push({ at: top + el.offsetHeight - h, pose: poseFor(name + 'End') });
  });
  keyframes.sort((a, b) => a.at - b.at);
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function targetPose(y) {
  if (y <= keyframes[0].at) return keyframes[0].pose;
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i], b = keyframes[i + 1];
    if (y < b.at) {
      const t = ease(clamp((y - a.at) / Math.max(1, b.at - a.at), 0, 1));
      const out = {};
      KEYS.forEach((k) => (out[k] = a.pose[k] + (b.pose[k] - a.pose[k]) * t));
      return out;
    }
  }
  return keyframes[keyframes.length - 1].pose;
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- Colourways ----------
const colourTargets = COLORWAYS.map((c) => ({
  upper: new THREE.Color(c.hex), sheen: new THREE.Color(c.sheen), lining: new THREE.Color(c.lining),
  bg: new THREE.Color(c.bg), ink: new THREE.Color(c.ink),
}));
let activeColour = 0;
const bgNow = new THREE.Color(COLORWAYS[0].bg);
const inkNow = new THREE.Color(COLORWAYS[0].ink);
const root = document.documentElement;
const swatches = [...document.querySelectorAll('.swatch')];
const colourName = document.getElementById('colour-name');
const colourIndex = document.getElementById('colour-index');

function setColour(i) {
  if (i === activeColour) return;
  activeColour = i;
  swatches.forEach((s, k) => s.setAttribute('aria-pressed', String(k === i)));
  colourName.textContent = COLORWAYS[i].name;
  colourName.classList.remove('swap');
  void colourName.offsetWidth;
  colourName.classList.add('swap');
  colourIndex.textContent = String(i + 1).padStart(2, '0');
}

swatches.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    // scroll to the slice of the pinned section that shows this colour
    const top = coloursSection.getBoundingClientRect().top + window.scrollY;
    const span = coloursSection.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * ((i + 0.5) / COLORWAYS.length), behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

function updateColourFromScroll(y) {
  const top = coloursSection.getBoundingClientRect().top + y;
  const span = coloursSection.offsetHeight - window.innerHeight;
  if (y < top - window.innerHeight * 0.5) return setColour(0);
  const p = clamp((y - top) / span, 0, 0.9999);
  setColour(Math.floor(p * COLORWAYS.length));
}

// ---------- Product thumbnails rendered from the same 3D model ----------
function renderThumbnails() {
  const size = 640;
  const thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  thumbRenderer.setSize(size, size, false);
  thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  thumbRenderer.outputColorSpace = THREE.SRGBColorSpace;
  const tScene = new THREE.Scene();
  tScene.environment = new THREE.PMREMGenerator(thumbRenderer).fromScene(new RoomEnvironment(thumbRenderer), 0.04).texture;
  tScene.add(new THREE.HemisphereLight(0xfff4ea, 0x2a1a18, 0.6));
  const k = key.clone(); tScene.add(k);
  const r = rim.clone(); tScene.add(r);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  cam.position.set(0, 0.6, 6);
  cam.lookAt(0, 0, 0);
  const holder = new THREE.Group();
  holder.rotation.set(0.38, -0.75, 0.05);
  tScene.add(holder);
  spinner.remove(shoe);
  holder.add(shoe);
  document.querySelectorAll('[data-thumb]').forEach((img) => {
    const t = colourTargets[Number(img.dataset.thumb)];
    materials.upper.color.copy(t.upper);
    materials.upper.sheenColor.copy(t.sheen);
    materials.lining.color.copy(t.lining);
    thumbRenderer.render(tScene, cam);
    img.src = thumbRenderer.domElement.toDataURL('image/png');
  });
  holder.remove(shoe);
  spinner.add(shoe);
  const t0 = colourTargets[0];
  materials.upper.color.copy(t0.upper);
  materials.upper.sheenColor.copy(t0.sheen);
  materials.lining.color.copy(t0.lining);
  thumbRenderer.dispose();
  thumbRenderer.forceContextLoss();
}

// ---------- Pointer parallax ----------
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

// ---------- Loop ----------
const current = { ...POSES.hero };
const clock = new THREE.Clock();
let first = true;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  const y = window.scrollY;
  const target = targetPose(y);
  const k = first || reduceMotion ? 1 : 1 - Math.exp(-dt * 5.5);
  first = false;
  KEYS.forEach((key) => (current[key] += (target[key] - current[key]) * k));

  pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 3));
  pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 3));

  const bob = reduceMotion ? 0 : Math.sin(time * 1.1) * 0.06;
  rig.position.set(current.x, current.y + bob, current.z);
  rig.scale.setScalar(current.s);
  spinner.rotation.set(
    current.rx + pointer.y * 0.12 + (reduceMotion ? 0 : Math.sin(time * 0.7) * 0.03),
    current.ry + pointer.x * 0.25,
    current.rz
  );
  shadow.position.y = -0.95 - bob / current.s;
  shadow.material.opacity = clamp(current.sh, 0, 1) * (1 - bob * 2);

  updateColourFromScroll(y);
  const t = colourTargets[activeColour];
  const ck = 1 - Math.exp(-dt * 4);
  materials.upper.color.lerp(t.upper, ck);
  materials.upper.sheenColor.lerp(t.sheen, ck);
  materials.lining.color.lerp(t.lining, ck);
  bgNow.lerp(t.bg, ck);
  inkNow.lerp(t.ink, ck);
  root.style.setProperty('--bg', '#' + bgNow.getHexString());
  root.style.setProperty('--accent', '#' + inkNow.getHexString());

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- UI bits ----------
function initUI() {
  // reveal-on-scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.isIntersecting && e.target.classList.add('in'));
  }, { threshold: 0.25 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // size chips (one group per card)
  document.querySelectorAll('.sizes').forEach((group) => {
    group.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      group.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
  });

  // bag counter
  const count = document.getElementById('bag-count');
  const toast = document.getElementById('toast');
  let n = 0, toastTimer;
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
      count.parentElement.classList.remove('bump'); void count.offsetWidth; count.parentElement.classList.add('bump');
      showToast(`Added ${card.dataset.name}, size ${size.textContent}`);
    });
  });
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  document.getElementById('newsletter').addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.reset();
    showToast("You're on the list ✨");
  });

  // nav shadow after hero
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

  // scroll progress
  const bar = document.querySelector('.progress span');
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  }, { passive: true });
}

async function start() {
  try { await document.fonts.ready; } catch (_) { /* fonts optional */ }
  layout();
  renderThumbnails();
  initUI();
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  requestAnimationFrame(frame);
  document.body.classList.add('ready');
}
start();
