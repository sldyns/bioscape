import { ribosomeBody } from "./ribosomeDetails";
import * as THREE from "three";
import { implicitMembrane, splitSection } from "./implicitMembrane";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
const TAU = Math.PI * 2,
  V = (x, y, z) => new THREE.Vector3(x, y, z);
function add(g, geometry, color, id, cap = false) {
  const m = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.55,
      clearcoat: 0.12,
      side: THREE.DoubleSide,
    }),
  );
  m.userData = { hitId: id, cap };
  g.add(m);
  return m;
}
const roughRadius = (a) =>
  1.35 + 0.06 * Math.sin(a * 2) + 0.035 * Math.cos(a * 5);
const layerRadius = (a, k) =>
  roughRadius(a) + 0.045 * Math.sin(a * 3 + k * 0.85);
const wave = (x, y) => 0.027 * Math.sin(x * 2.5 + y * 1.7);
function roughSamples(layers) {
  const samples = [];
  for (let k = 0; k < layers; k++)
    for (let i = 0; i <= 220; i++) {
      const a = 0.36 + k * 0.075 + (i / 220) * (5.34 - k * 0.1),
        r = layerRadius(a, k),
        x = Math.cos(a) * r,
        y = Math.sin(a) * r * 0.87;
      samples.push({
        p: [x, y, (k - (layers - 1) / 2) * 0.27 + wave(x, y)],
        r: [
          0.25 + 0.035 * Math.sin(a * 2.7 + k),
          0.25 + 0.025 * Math.cos(a * 3 + k),
          0.072,
        ],
      });
    }
  // Broad openings between neighboring sheets share the same implicit lumen.
  for (let k = 0; k < layers - 1; k++)
    for (const a of [2.25, 3.8])
      for (let j = 0; j <= 30; j++) {
        const r =
            layerRadius(a, k) +
            ((layerRadius(a, k + 1) - layerRadius(a, k)) * j) / 30,
          x = Math.cos(a) * r,
          y = Math.sin(a) * r * 0.87;
        samples.push({
          p: [
            x,
            y,
            (k - (layers - 1) / 2) * 0.27 + (j / 30) * 0.27 + wave(x, y),
          ],
          r: [0.085, 0.085, 0.085],
        });
      }
  return samples;
}
export function roughAssembly({ layers = 3, ribosomes = true } = {}) {
  const g = new THREE.Group(),
    half = [1.85, 1.7, Math.max(0.65, ((layers - 1) / 2) * 0.27 + 0.2)];
  const section = (p) => {
    const a = Math.atan2(p[1] / 0.87, p[0]),
      radial = Math.hypot(p[0], p[1] / 0.87) - roughRadius(a);
    const h = p[2] - wave(p[0], p[1]),
      offset = ((layers - 1) / 2) * 0.27,
      nearest = Math.max(
        0,
        Math.min(layers - 1, Math.round((h + offset) / 0.27)),
      ),
      center = nearest * 0.27 - offset;
    return Math.min(h - center, radial);
  };
  const surfaces = implicitMembrane(roughSamples(layers), half, 108);
  surfaces.forEach((geo, i) =>
    splitSection(geo, section).forEach((piece, cap) =>
      add(g, piece, i ? "#c6b8d3" : "#a294ba", "erCisternae", !!cap),
    ),
  );
  const ribosomeTemplate = ribosomes ? ribosomeBody({ detail: false }) : null;
  if (ribosomes)
    for (let k = 0; k < layers; k++)
      for (let j = 0; j < 42; j++) {
        const a = 0.49 + (j / 41) * 4.95 + 0.018 * Math.sin(j * 2.4),
          r = layerRadius(a, k) - 0.095 + 0.065 * Math.sin(j * 2.399),
          x = Math.cos(a) * r,
          y = Math.sin(a) * r * 0.87,
          z = (k - (layers - 1) / 2) * 0.27 + wave(x, y) + 0.105;
        const unit = ribosomeTemplate.clone(true);
        unit.scale.setScalar(0.043);
        unit.rotation.x = Math.PI / 2;
        unit.position.set(x, y, z);
        unit.traverse((o) => {
          if (o.isMesh) o.userData.hitId = "boundRibosomes";
        });
        g.add(unit);
      }
  return g;
}
function smoothSamples() {
  const vertices = new Map(),
    edges = new Map(),
    samples = [];
  for (let q = -1; q <= 1; q++)
    for (let r = -1; r <= 1; r++) {
      if (Math.abs(q + r) > 1) continue;
      const center = V(Math.sqrt(3) * 0.4 * (q + r / 2), 0.6 * r, 0),
        keys = [];
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 6 + (k * Math.PI) / 3,
          x = center.x + 0.4 * Math.cos(a),
          y = center.y + 0.4 * Math.sin(a),
          key = x.toFixed(3) + "," + y.toFixed(3);
        if (!vertices.has(key))
          vertices.set(key, {
            p: V(
              x + 0.045 * Math.sin(x * 4 + y * 2),
              y + 0.045 * Math.cos(x * 3 - y * 4),
              0.025 * Math.sin(x * 3 + y * 2),
            ),
            degree: 0,
          });
        keys.push(key);
      }
      for (let k = 0; k < 6; k++) {
        const pair = [keys[k], keys[(k + 1) % 6]].sort(),
          key = pair.join("|");
        if (!edges.has(key)) {
          edges.set(key, pair);
          pair.forEach((id) => vertices.get(id).degree++);
        }
      }
    }
  for (const [a, b] of edges.values()) {
    const p = vertices.get(a).p,
      q = vertices.get(b).p,
      mid = p.clone().lerp(q, 0.5);
    mid.x += 0.018 * Math.sin(p.y * 9);
    mid.y += 0.024 * Math.cos(q.x * 7);
    const curve = new THREE.CatmullRomCurve3([p, mid, q]);
    for (const v of curve.getPoints(32))
      samples.push({ p: v.toArray(), r: [0.074, 0.074, 0.074] });
  }
  const junction = [...vertices.values()].find(
    (v) => v.degree === 3 && v.p.x > 0.2 && v.p.y > 0,
  ).p;
  return { samples, junction };
}
export function smoothAssembly({ junctionOnly = false } = {}) {
  const g = new THREE.Group();
  let samples, junction;
  if (junctionOnly) {
    samples = [];
    junction = V(0, 0, 0);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU + 0.18,
        curve = new THREE.CatmullRomCurve3([
          V(0, 0, 0),
          V(Math.cos(a + 0.09) * 0.46, Math.sin(a + 0.09) * 0.46, 0),
          V(Math.cos(a) * 1.06, Math.sin(a) * 1.06, 0),
        ]);
      for (const v of curve.getPoints(52))
        samples.push({ p: v.toArray(), r: [0.14, 0.14, 0.14] });
    }
  } else ({ samples, junction } = smoothSamples());
  implicitMembrane(
    samples,
    junctionOnly ? [1.25, 1.25, 0.3] : [1.3, 1.2, 0.25],
    106,
  ).forEach((geometry, i) => {
    let geo = geometry;
    if (junctionOnly) {
      const halves = splitSection(geo, (p) => Math.hypot(p[0], p[1]) - 0.84);
      geo = halves[0];
      halves[1].dispose();
    }
    splitSection(geo, (p) => p[2]).forEach((piece, cap) =>
      add(g, piece, i ? "#bfdbdc" : "#83adb5", "erTubules", !!cap),
    );
  });
  g.userData.landmarks = junctionOnly
    ? [
        { zh: "相通的管腔", en: "Continuous lumen", position: [0, 0, -0.035] },
        {
          zh: "管壁 · 一张膜",
          en: "Wall · One membrane",
          position: [0.49, 0.27, 0],
        },
        { zh: "人为截取的端面", en: "Cropped end", position: [-0.53, 0.65, 0] },
      ]
    : [
        {
          zh: "三向分支",
          en: "Three-way junction",
          position: junction.toArray(),
        },
      ];
  return g;
}
export function mergeER(g) {
  g.updateMatrixWorld(true);
  const bins = new Map();
  g.traverse((o) => {
    if (!o.isMesh) return;
    const key =
      o.userData.hitId + o.material.color.getHexString() + !!o.userData.cap;
    if (!bins.has(key))
      bins.set(key, {
        id: o.userData.hitId,
        color: o.material.color.clone(),
        cap: !!o.userData.cap,
        geos: [],
      });
    bins.get(key).geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
  });
  const result = new THREE.Group();
  for (const b of bins.values()) {
    add(result, mergeGeometries(b.geos), b.color, b.id, b.cap);
    b.geos.forEach((x) => x.dispose());
  }
  g.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  return result;
}
export function erDetail(id) {
  if (!["roughER", "erCisternae", "smoothER", "erTubules"].includes(id))
    return null;
  const g = ["roughER", "erCisternae"].includes(id)
    ? roughAssembly({
        layers: id === "erCisternae" ? 1 : 3,
        ribosomes: id === "roughER",
      })
    : smoothAssembly({ junctionOnly: id === "erTubules" });
  g.rotation.set(0.48, -0.18, -0.1);
  if (id === "erCisternae")
    g.userData.landmarks = [
      { zh: "内质网腔", en: "ER lumen", position: [-1.48, 0.08, 0] },
      { zh: "细胞质侧", en: "Cytosolic side", position: [0.06, 1.06, 0.08] },
    ];

  return g;
}
