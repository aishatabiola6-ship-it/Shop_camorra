// Procedural pointed-toe slingback heel, built entirely from code (no model file).
// Units: 1 unit ≈ 10 cm. Toe points to +X, up is +Y, width is Z.
import * as THREE from 'three';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

export const COLORWAYS = [
  { id: 'merlot', name: 'Merlot', hex: '#5a0a1c', sheen: '#9c3448', lining: '#3d0914', bg: '#efe3e1', ink: '#3a0712' },
  { id: 'cacao',  name: 'Cacao',  hex: '#2e1915', sheen: '#6e4a40', lining: '#21110d', bg: '#ebe3dc', ink: '#2a1813' },
  { id: 'sable',  name: 'Sable',  hex: '#a8835f', sheen: '#d9bc9a', lining: '#8d6b4b', bg: '#f3ece3', ink: '#5a3f27' },
  { id: 'noir',   name: 'Noir',   hex: '#121010', sheen: '#4a4444', lining: '#3a0c16', bg: '#e8e6e3', ink: '#151313' },
];

const HALF = 1.2;          // half shoe length
const LEN = HALF * 2;
const HEEL_H = 0.74;       // heel height (~7.5 cm)
const SOLE_T = 0.045;      // sole thickness

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

// Half-width of the sole outline along the length (forefoot keys; heel is an ellipse).
const W_KEYS = [
  [-0.95, 0.28], [-0.7, 0.262], [-0.45, 0.24], [-0.15, 0.275], [0.15, 0.355],
  [0.38, 0.395], [0.58, 0.368], [0.8, 0.275], [0.98, 0.155], [1.1, 0.068], [1.2, 0],
];
function width(x) {
  if (x <= -HALF || x >= HALF) return 0;
  if (x < -0.95) { const k = (x + 0.95) / 0.25; return 0.28 * Math.sqrt(Math.max(0, 1 - k * k)); }
  const n = W_KEYS.length;
  let i = 0;
  while (i < n - 2 && x > W_KEYS[i + 1][0]) i++;
  const t = (x - W_KEYS[i][0]) / (W_KEYS[i + 1][0] - W_KEYS[i][0]);
  const p0 = W_KEYS[Math.max(i - 1, 0)][1], p1 = W_KEYS[i][1], p2 = W_KEYS[i + 1][1], p3 = W_KEYS[Math.min(i + 2, n - 1)][1];
  const v = 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  return Math.max(0, v);
}

// Height of the sole's underside: high at the heel seat, flat at the ball, slight toe spring.
function soleY(x) {
  const t = clamp((0.42 - x) / 1.34, 0, 1);
  return HEEL_H * t * t * (3 - 2 * t) + 0.035 * smooth(0.8, 1.2, x);
}

// ---- Upper (vamp) surface -------------------------------------------------
const CENTER_END = 0.24;   // where the throat line sits on top of the foot
const SIDE_END = -0.46;    // how far back the vamp reaches along the sides
const xEnd = (v) => SIDE_END + (CENTER_END - SIDE_END) * Math.pow(Math.sin(Math.PI * v), 0.55);
const vampH = (x) => { const d = clamp((HALF - x) / LEN, 0, 1); return 0.6 * Math.pow(Math.min(d / 0.55, 1.15), 0.8); };

function surf(x, v, target = new THREE.Vector3()) {
  const w = width(x) * 1.015;
  const a = Math.PI * v;
  return target.set(x, soleY(x) + SOLE_T * 0.5 + vampH(x) * Math.sin(a), -w * Math.cos(a));
}
function surfNormal(x, v) {
  const e = 1e-3;
  const p = surf(x, v);
  const px = surf(x + e, v).sub(p);
  const pv = surf(x, v + e).sub(p);
  return new THREE.Vector3().crossVectors(pv, px).normalize();
}

// A thin rectangular strap swept along a list of centre points.
// normals[i] is the direction the strap's face points (thickness axis).
function strapGeometry(centers, normals, width, thick) {
  const pos = [];
  const idx = [];
  const T = new THREE.Vector3(), W = new THREE.Vector3(), N = new THREE.Vector3();
  const n = centers.length;
  for (let i = 0; i < n; i++) {
    const a = centers[Math.max(i - 1, 0)], b = centers[Math.min(i + 1, n - 1)];
    T.subVectors(b, a).normalize();
    W.crossVectors(normals[i], T).normalize();
    N.crossVectors(T, W).normalize();
    const c = centers[i];
    const hw = width / 2, ht = thick / 2;
    for (const [sw, sn] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
      pos.push(c.x + W.x * hw * sw + N.x * ht * sn, c.y + W.y * hw * sw + N.y * ht * sn, c.z + W.z * hw * sw + N.z * ht * sn);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < 4; k++) {
      const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = (i + 1) * 4 + k, d = (i + 1) * 4 + ((k + 1) % 4);
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buckleGeometry(w, h, bar) {
  const s = new THREE.Shape();
  const r = Math.min(w, h) * 0.12;
  const hw = w / 2, hh = h / 2;
  s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r); s.quadraticCurveTo(hw, hh, hw - r, hh); s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r); s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  const iw = hw - bar, ih = hh - bar;
  const hole = new THREE.Path();
  hole.moveTo(-iw, -ih); hole.lineTo(-iw, ih); hole.lineTo(iw, ih); hole.lineTo(iw, -ih); hole.lineTo(-iw, -ih);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: bar * 0.6, bevelEnabled: true, bevelThickness: bar * 0.25, bevelSize: bar * 0.22, bevelSegments: 3, curveSegments: 6 });
  g.center();
  return g;
}

function placeOnBasis(mesh, pos, xAxis, yAxis, zAxis) {
  const m = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  mesh.quaternion.setFromRotationMatrix(m);
  mesh.position.copy(pos);
}

function labelTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f3c9d3';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#2a0a12';
  ctx.font = 'italic 600 92px "Bodoni Moda", Didot, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 118);
  ctx.font = '600 22px Manrope, Arial, sans-serif';
  ctx.fillText('L A G O S  ·  E S T .  2 0 2 6', 256, 196);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createShoe(brand = 'VELORA') {
  const cw = COLORWAYS[0];
  const materials = {
    upper: new THREE.MeshPhysicalMaterial({
      color: cw.hex, roughness: 0.72, sheen: 0.45, sheenRoughness: 0.55, sheenColor: new THREE.Color(cw.sheen),
      side: THREE.DoubleSide,
    }),
    lining: new THREE.MeshStandardMaterial({ color: cw.lining, roughness: 0.85, side: THREE.DoubleSide }),
    sole: new THREE.MeshStandardMaterial({ color: '#1b1210', roughness: 0.55, side: THREE.DoubleSide }),
    gold: new THREE.MeshStandardMaterial({ color: '#e0bb72', metalness: 1, roughness: 0.2 }),
    tip: new THREE.MeshStandardMaterial({ color: '#0d0b0b', roughness: 0.7 }),
    label: new THREE.MeshStandardMaterial({ map: labelTexture(brand), roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -2 }),
  };

  const shoe = new THREE.Group();
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; shoe.add(m); return m; };

  // Insole (top of the footbed)
  add(new ParametricGeometry((u, v, t) => {
    const x = -HALF * Math.cos(Math.PI * u);
    const z = 2 * v - 1;
    t.set(x, soleY(x) + SOLE_T - 0.008 * (1 - z * z), z * width(x) * 0.985);
  }, 160, 18), materials.lining);

  // Outsole
  add(new ParametricGeometry((u, v, t) => {
    const x = -HALF * Math.cos(Math.PI * u);
    t.set(x, soleY(x), (2 * v - 1) * width(x));
  }, 160, 12), materials.sole);

  // Sole edge
  add(new ParametricGeometry((u, v, t) => {
    const right = u > 0.5;
    const s = right ? 2 - 2 * u : 2 * u;
    const x = -HALF * Math.cos(Math.PI * s);
    t.set(x, soleY(x) + v * SOLE_T, (right ? 1 : -1) * width(x));
  }, 320, 2), materials.sole);

  // Brand label on the heel of the insole
  add(new ParametricGeometry((u, v, t) => {
    const x = -1.07 + u * 0.36;
    const z = (0.5 - v) * 0.2;
    const zz = z / Math.max(width(x) * 0.985, 1e-3);
    t.set(x, soleY(x) + SOLE_T - 0.008 * (1 - zz * zz) + 0.003, z);
  }, 24, 6), materials.label);

  // Vamp: outer shell + inner lining
  const vampFn = (u, v, t) => {
    const xe = xEnd(v);
    const x = HALF - (HALF - xe) * (1 - Math.cos(Math.PI * u / 2));
    surf(x, v, t);
  };
  const vampGeo = new ParametricGeometry(vampFn, 110, 72);
  add(vampGeo, materials.upper);
  const liningGeo = new ParametricGeometry((u, v, t) => {
    vampFn(u, v, t);
    t.y -= 0.006;
    t.z *= 0.985;
  }, 110, 72);
  add(liningGeo, materials.lining);

  // Binding along the throat line
  const topline = [];
  for (let i = 0; i <= 120; i++) { const v = i / 120; topline.push(surf(xEnd(v), v)); }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(topline), 200, 0.013, 8, false), materials.upper);

  // Strap across the vamp
  const bandX = (v) => xEnd(v) + 0.12;
  const bandC = [], bandN = [];
  for (let i = 0; i <= 90; i++) {
    const v = 0.015 + (i / 90) * 0.97;
    const n = surfNormal(bandX(v), v);
    bandC.push(surf(bandX(v), v).addScaledVector(n, 0.01));
    bandN.push(n);
  }
  add(strapGeometry(bandC, bandN, 0.075, 0.016), materials.upper);

  // Signature gold buckle on the vamp strap
  {
    const v = 0.74;
    const x = bandX(v);
    const n = surfNormal(x, v);
    const p = surf(x, v);
    const tan = surf(bandX(v + 0.01), v + 0.01).sub(p).normalize();
    const w = new THREE.Vector3().crossVectors(n, tan).normalize();
    const t2 = new THREE.Vector3().crossVectors(w, n).normalize();
    const buckle = add(buckleGeometry(0.19, 0.105, 0.022), materials.gold);
    placeOnBasis(buckle, p.clone().addScaledVector(n, 0.03), t2, w, n);
    // small keeper loop next to the buckle
    const keeper = add(new THREE.BoxGeometry(0.03, 0.09, 0.02), materials.upper);
    placeOnBasis(keeper, p.clone().addScaledVector(t2, -0.13).addScaledVector(n, 0.024), t2, w, n);
  }

  // Slingback strap around the heel
  const ins = (x) => soleY(x) + SOLE_T;
  const strapPts = [
    new THREE.Vector3(-0.43, ins(-0.43) + 0.03, -width(-0.43) * 1.02),
    new THREE.Vector3(-0.6, ins(-0.6) + 0.14, -0.27),
    new THREE.Vector3(-0.86, ins(-1) + 0.25, -0.275),
    new THREE.Vector3(-1.08, ins(-1) + 0.29, -0.21),
    new THREE.Vector3(-1.19, ins(-1) + 0.3, 0),
    new THREE.Vector3(-1.08, ins(-1) + 0.29, 0.21),
    new THREE.Vector3(-0.86, ins(-1) + 0.25, 0.275),
    new THREE.Vector3(-0.6, ins(-0.6) + 0.14, 0.27),
    new THREE.Vector3(-0.43, ins(-0.43) + 0.03, width(-0.43) * 1.02),
  ];
  const strapCurve = new THREE.CatmullRomCurve3(strapPts, false, 'centripetal');
  const sc = strapCurve.getSpacedPoints(160);
  const sn = sc.map((p) => new THREE.Vector3(Math.min(0, p.x + 0.75) * 1.6, 0, p.z).normalize());
  add(strapGeometry(sc, sn, 0.06, 0.016), materials.upper);

  // Little gold buckle on the slingback
  {
    const i = 112;
    const p = sc[i];
    const tan = sc[i + 1].clone().sub(sc[i - 1]).normalize();
    const n = sn[i].clone();
    const w = new THREE.Vector3().crossVectors(n, tan).normalize();
    const t2 = new THREE.Vector3().crossVectors(w, n).normalize();
    const b = add(buckleGeometry(0.075, 0.085, 0.012), materials.gold);
    placeOnBasis(b, p.clone().addScaledVector(n, 0.014), t2, w, n);
  }

  // Heel: slim flared stiletto
  const heel = new THREE.Group();
  const prof = [
    [0.03, -1], [0.035, -0.975], [0.031, -0.93], [0.033, -0.7], [0.045, -0.45],
    [0.07, -0.24], [0.1, -0.09], [0.118, -0.02], [0.12, 0],
  ].map(([r, y]) => new THREE.Vector2(r, y * HEEL_H));
  const heelGeo = new THREE.LatheGeometry(prof, 48);
  heelGeo.scale(1, 1, 1.3);
  const heelMesh = new THREE.Mesh(heelGeo, materials.upper);
  heelMesh.castShadow = true;
  heel.add(heelMesh);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.032, 0.035, 24), materials.tip);
  cap.scale.z = 1.3;
  cap.position.y = -HEEL_H + 0.012;
  heel.add(cap);
  heel.position.set(-0.98, soleY(-0.98) + 0.002, 0);
  heel.rotation.z = 0.09;
  shoe.add(heel);

  // Centre the model around the origin
  const box = new THREE.Box3().setFromObject(shoe);
  const center = box.getCenter(new THREE.Vector3());
  shoe.children.forEach((c) => c.position.sub(center));

  return { shoe, materials };
}
