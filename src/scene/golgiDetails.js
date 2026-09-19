import * as THREE from "three";
import { implicitMembrane, splitSection } from "./implicitMembrane";
const TAU = Math.PI * 2,
  V = (x, y, z) => new THREE.Vector3(x, y, z);
const materialsByGroup = new WeakMap();
function mesh(g, geo, color, id, cap = false) {
  let materials = materialsByGroup.get(g);
  if (!materials) materialsByGroup.set(g, (materials = new Map()));
  const key = color.isColor ? color.getHexString() : color;
  if (!materials.has(key))
    materials.set(
      key,
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.51,
        clearcoat: 0.12,
        side: THREE.DoubleSide,
      }),
    );
  const m = new THREE.Mesh(geo, materials.get(key));
  m.userData = { hitId: id, cap };
  g.add(m);
  return m;
}
function ball(g, p, r, color, id, cap = false, sharedGeometry = null) {
  const m = mesh(
    g,
    sharedGeometry || new THREE.SphereGeometry(r, 12, 8),
    color,
    id,
    cap,
  );
  if (sharedGeometry) m.scale.setScalar(r);
  m.position.copy(p);
  return m;
}
function tube(g, points, r, color, id, cap = false) {
  return mesh(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      192,
      r,
      10,
      false,
    ),
    color,
    id,
    cap,
  );
}
const bowl = (x) => 0.16 * x * x;
function cisternaGeometry(bud = true) {
  const samples = [];
  // One flattened sac, with a swollen rim and a lumen continuous into the bud.
  for (let x = -1.14; x <= 1.14; x += 0.045)
    for (let z = -0.49; z <= 0.49; z += 0.045) {
      const r = Math.hypot(x / 1.14, z / 0.49);
      if (r > 1) continue;
      const h = 0.055 + 0.025 * Math.exp(-(((r - 0.91) / 0.16) ** 2));
      samples.push({
        p: [x, bowl(x) + 0.018 * Math.sin(z * 5 + x * 2), z],
        r: [0.14, h, 0.12],
      });
    }
  if (bud)
    for (let i = 0; i <= 36; i++) {
      const x = 1.16 + (i / 36) * 0.22;
      samples.push({
        p: [x, bowl(1.16) + (0.055 * i) / 36, 0],
        r: [0.105, 0.058, 0.058],
      });
    }
  if (bud)
    samples.push({ p: [1.49, bowl(1.16) + 0.055, 0], r: [0.19, 0.17, 0.17] });
  return implicitMembrane(samples, [2.05, 0.62, 0.78], 112).map((geo) =>
    splitSection(geo, (p) => p[2] - 0.015),
  );
}
function cisterna(g, pieces, k, count) {
  const group = new THREE.Group();
  group.position.set(-0.045 * k, (k - (count - 1) / 2) * 0.29, 0);
  group.scale.set(1 - 0.027 * k, 1, 1 - 0.025 * k);
  group.rotation.y = 0.1 * Math.sin(k * 1.7);
  g.add(group);
  const outer = new THREE.Color("#be8e84").lerp(
    new THREE.Color("#e3b7a2"),
    count === 1 ? 0.5 : k / (count - 1),
  );
  pieces.forEach((halves, i) =>
    halves.forEach((geo, cap) =>
      mesh(group, geo.clone(), i ? "#d9b29c" : outer, "golgiCisternae", !!cap),
    ),
  );
}
function cargoModel(g, scale = 1, center = V(0, 0, 0), id = "cargo") {
  // A few folded soluble cargo molecules; no particular protein is implied.
  for (let k = 0; k < 7; k++) {
    const a = k * 2.399,
      p = center
        .clone()
        .add(
          V(
            Math.cos(a) * (0.2 + k * 0.035),
            Math.sin(a) * (0.2 + k * 0.035),
            0.1 * Math.sin(k * 2),
          ).multiplyScalar(scale),
        );
    const points = [];
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * TAU * 2.3;
      points.push(
        p
          .clone()
          .add(
            V(
              Math.sin(t + k * 0.3) * (0.09 + k * 0.003),
              Math.cos(t * (1.6 + k * 0.04)) * 0.075,
              Math.sin(t * 0.7 + k * 0.4) * 0.07,
            ).multiplyScalar(scale),
          ),
      );
    }
    tube(g, points, 0.018 * scale, k % 2 ? "#879fa0" : "#b6a074", id);
  }
}
export function vesicleAssembly({
  membraneOnly = false,
  cargoOnly = false,
  small = false,
} = {}) {
  const g = new THREE.Group();
  if (!cargoOnly) {
    // Reuse identical primitive buffers until the final material/hit-ID batching.
    const headGeometry = new THREE.SphereGeometry(1, 12, 8),
      tailGeometry = new THREE.CylinderGeometry(0.006, 0.006, 1, 6),
      sectionZ = 0.28;
    for (const [r, c] of [
      [1, "#d5a18f"],
      [0.92, "#e8c8b0"],
    ]) {
      const geo = new THREE.SphereGeometry(r, 72, 48);
      splitSection(geo, (p) => p[2] - 0.28).forEach((part, cap) =>
        mesh(g, part, c, "vesicleMembrane", !!cap),
      );
    }
    // Each leaflet has its own heads and two tails pointing toward the core.
    // Clip molecular detail at the same physical plane as both membrane faces.
    if (!small)
      for (let i = 0; i < 1100; i++) {
        const z = 1 - (2 * (i + 0.5)) / 1100,
          a = i * 2.399963,
          r = Math.sqrt(1 - z * z),
          n = V(Math.cos(a) * r, Math.sin(a) * r, z);
        for (const radius of [1.008, 0.915]) {
          const p = n.clone().multiplyScalar(radius),
            color = radius > 1 ? "#edc4ae" : "#f0d7c0";
          if (Math.abs(p.z - sectionZ) < 0.018) {
            const geo = headGeometry.clone().scale(0.018, 0.018, 0.018);
            geo.translate(p.x, p.y, p.z);
            splitSection(geo, (point) => point[2] - sectionZ).forEach(
              (piece, cap) => mesh(g, piece, color, "vesicleMembrane", !!cap),
            );
          } else
            ball(
              g,
              p,
              0.018,
              color,
              "vesicleMembrane",
              p.z > sectionZ,
              headGeometry,
            );
        }
        if (Math.abs(z - sectionZ) < 0.075 || membraneOnly) {
          const tangent = V(-n.y, n.x, 0).normalize().multiplyScalar(0.011);
          for (const [head, core] of [
            [0.993, 0.963],
            [0.932, 0.957],
          ])
            for (const sign of [-1, 1]) {
              const p = n
                  .clone()
                  .multiplyScalar(head)
                  .addScaledVector(tangent, sign),
                q = n
                  .clone()
                  .multiplyScalar(core)
                  .addScaledVector(tangent, sign),
                d = q.clone().sub(p),
                center = p.clone().lerp(q, 0.5),
                rotation = new THREE.Quaternion().setFromUnitVectors(
                  V(0, 1, 0),
                  d.clone().normalize(),
                );
              if (Math.abs(center.z - sectionZ) < d.length() / 2 + 0.006) {
                const geo = tailGeometry.clone().scale(1, d.length(), 1);
                geo
                  .applyQuaternion(rotation)
                  .translate(center.x, center.y, center.z);
                splitSection(geo, (point) => point[2] - sectionZ).forEach(
                  (piece, cap) =>
                    mesh(g, piece, "#c39781", "vesicleMembrane", !!cap),
                );
              } else {
                const m = mesh(
                  g,
                  tailGeometry,
                  "#c39781",
                  "vesicleMembrane",
                  center.z > sectionZ,
                );
                m.scale.y = d.length();
                m.position.copy(center);
                m.quaternion.copy(rotation);
              }
            }
        }
      }
    if (small) {
      headGeometry.dispose();
      tailGeometry.dispose();
    }
    // Low-profile transmembrane proteins, without a universal vesicle coat.
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU,
        n = V(Math.cos(a) * 0.96, Math.sin(a) * 0.96, -0.28).normalize();
      const m = ball(
        g,
        n.clone().multiplyScalar(0.965),
        0.065,
        "#829da0",
        "vesicleMembrane",
      );
      m.scale.set(0.7, 1.3, 0.8);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), n);
    }
  }
  if (!membraneOnly) cargoModel(g, 1);
  g.userData.landmarks = membraneOnly
    ? [
        { zh: "朝向细胞质", en: "Cytosolic face", position: [-0.75, -0.67, 0] },
        {
          zh: "朝向囊泡腔",
          en: "Lumen-facing leaflet",
          position: [0.65, 0.6, -0.21],
        },
        { zh: "膜蛋白", en: "Membrane protein", position: [0.96, 0, -0.28] },
      ]
    : cargoOnly
      ? []
      : [{ zh: "囊泡腔", en: "Vesicle lumen", position: [0.2, -0.65, -0.2] }];
  return g;
}
export function golgiAssembly({ single = false, vesicles = true } = {}) {
  const g = new THREE.Group(),
    pieces = cisternaGeometry(),
    plain = single ? null : cisternaGeometry(false),
    count = single ? 1 : 5;
  for (let k = 0; k < count; k++)
    cisterna(g, single || k === 0 || k === 3 ? pieces : plain, k, count);
  pieces.flat().forEach((x) => x.dispose());
  plain?.flat().forEach((x) => x.dispose());
  if (vesicles && !single)
    for (const [x, y, z, s] of [
      [-1.65, 0.9, 0.04, 0.14],
      [-1.5, 0.58, -0.15, 0.11],
      [1.98, -0.68, 0.04, 0.15],
      [1.88, -0.96, -0.12, 0.12],
      [1.5, -1.05, 0.18, 0.13],
    ]) {
      const v = vesicleAssembly({ small: true });
      v.position.set(x, y, z);
      v.scale.setScalar(s);
      v.traverse((o) => {
        if (o.isMesh) o.userData.hitId = "vesicles";
      });
      g.add(v);
    }
  if (!single)
    g.userData.partAnchors = {
      vesicles: [1.98, -0.68, 0.04],
      golgiCisternae: [0, 0, 0.015],
    };
  g.userData.landmarks = single
    ? [
        { zh: "膜囊腔", en: "Cisternal lumen", position: [0, 0.015, -0.04] },
        { zh: "出芽颈部", en: "Budding neck", position: [1.29, 0.24, 0] },
      ]
    : [
        {
          zh: "顺面 · 接收",
          en: "Cis face · Receiving",
          position: [-0.5, 0.65, -0.08],
        },
        {
          zh: "反面 · 分拣",
          en: "Trans face · Sorting",
          position: [0.7, -0.47, 0],
        },
      ];
  return g;
}
export function golgiDetail(id) {
  if (
    ![
      "golgi",
      "golgiCisternae",
      "vesicles",
      "vesicleMembrane",
      "cargo",
    ].includes(id)
  )
    return null;
  const g = ["golgi", "golgiCisternae"].includes(id)
    ? golgiAssembly({ single: id === "golgiCisternae" })
    : vesicleAssembly({
        membraneOnly: id === "vesicleMembrane",
        cargoOnly: id === "cargo",
      });
  g.rotation.set(0.23, -0.2, -0.06);
  return g;
}
