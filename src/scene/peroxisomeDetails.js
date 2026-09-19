import * as THREE from "three";
import { splitSection, implicitMembrane } from "./implicitMembrane";
import contours from "./data/peroxisome-contours.json";
const TAU = Math.PI * 2,
  V = (...p) => new THREE.Vector3(...p);
function mesh(g, geo, color, id, cap = false) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.52,
      clearcoat: 0.14,
      side: THREE.DoubleSide,
    }),
  );
  m.userData = { hitId: id, cap };
  g.add(m);
  return m;
}
function ball(g, p, s, color, id, cap = false) {
  const m = mesh(g, new THREE.SphereGeometry(1, 24, 18), color, id, cap);
  m.position.set(...p);
  m.scale.set(...s);
  return m;
}
function rod(g, a, b, r, color, id, cap = false) {
  const d = V(...b).sub(V(...a)),
    m = mesh(
      g,
      new THREE.CylinderGeometry(r, r, d.length(), 10),
      color,
      id,
      cap,
    );
  m.position.copy(V(...a)).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  return m;
}
// Coarse envelopes derived from short C-alpha segments, not solvent surfaces.
function enzymeGlyph(kind) {
  const g = new THREE.Group(),
    colors =
      kind === "catalase"
        ? ["#7f9f8b", "#b3c4a6", "#8eacaa", "#c5ba91"]
        : ["#a89e73", "#c8bc91"];
  contours[kind].chains.forEach((samples, i) => {
    const [outer, unused] = implicitMembrane(samples, [1.15, 1.15, 1.15], 64);
    unused.dispose();
    mesh(g, outer, colors[i], "oxidativeEnzymes");
  });
  g.scale.setScalar(0.36);
  return g;
}
function transporter(g, position, id, cap = false, scale = 1) {
  const unit = new THREE.Group();
  unit.position.copy(position);
  unit.scale.setScalar(scale);
  g.add(unit);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    rod(
      unit,
      [Math.cos(a) * 0.105, -0.095, Math.sin(a) * 0.105],
      [Math.cos(a) * 0.105, 0.095, Math.sin(a) * 0.105],
      0.041,
      "#839e95",
      id,
      cap,
    );
  }
  for (const side of [-1, 1])
    ball(
      unit,
      [side * 0.07, 0.16, 0],
      [0.085, 0.09, 0.095],
      "#9fae9d",
      id,
      cap,
    );
  return unit;
}
function membraneRim(g, deform) {
  // Match both deformed leaflets at the section plane; keep the matrix cavity open.
  const sectionZ = 0.3,
    loops = [1, 0.94].map((radius) => {
      const points = [];
      for (let i = 0; i < 160; i++) {
        const angle = (i / 160) * TAU;
        let lo = 0,
          hi = Math.PI / 2;
        for (let k = 0; k < 28; k++) {
          const latitude = (lo + hi) / 2,
            p = deform(
              V(
                Math.cos(angle) * Math.cos(latitude),
                Math.sin(angle) * Math.cos(latitude),
                Math.sin(latitude),
              ).multiplyScalar(radius),
            );
          if (p.z > sectionZ) hi = latitude;
          else lo = latitude;
        }
        const latitude = (lo + hi) / 2,
          p = deform(
            V(
              Math.cos(angle) * Math.cos(latitude),
              Math.sin(angle) * Math.cos(latitude),
              Math.sin(latitude),
            ).multiplyScalar(radius),
          );
        points.push(new THREE.Vector2(p.x, p.y));
      }
      return points;
    }),
    shape = new THREE.Shape(loops[0]);
  shape.holes.push(new THREE.Path(loops[1].reverse()));
  const rim = mesh(
    g,
    new THREE.ShapeGeometry(shape),
    "#bdc8a9",
    "peroxisomalMembrane",
  );
  rim.position.z = sectionZ;
}
export function peroxisomeAssembly() {
  const g = new THREE.Group(),
    id = "peroxisomalMembrane";
  const deform = (p) => {
    const n = p.clone().normalize(),
      r = 1 + 0.025 * Math.sin(n.x * 4) * n.y;
    p.multiplyScalar(r);
    p.y *= 1.06;
    p.z *= 0.94;
    return p;
  };
  for (const [radius, color] of [
    [1, "#94ab94"],
    [0.94, "#ced8bc"],
  ]) {
    const geo = new THREE.SphereGeometry(radius, 112, 72),
      pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const p = deform(V().fromBufferAttribute(pos, i));
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    geo.computeVertexNormals();
    splitSection(geo, (p) => p[2] - 0.3).forEach((piece, cap) =>
      mesh(g, piece, color, id, !!cap),
    );
  }
  membraneRim(g, deform);
  for (let i = 0; i < 780; i++) {
    const z = 1 - (2 * (i + 0.5)) / 780,
      a = i * 2.399963,
      r = Math.sqrt(1 - z * z),
      n = V(Math.cos(a) * r, Math.sin(a) * r, z);
    for (const [radius, color] of [
      [1.008, "#b8cbb0"],
      [0.934, "#d2ddc1"],
    ]) {
      const p = deform(n.clone().multiplyScalar(radius));
      ball(g, p.toArray(), [0.014, 0.014, 0.014], color, id, p.z > 0.3);
    }
    if (Math.abs(deform(n.clone()).z - 0.3) < 0.035)
      rod(
        g,
        deform(n.clone().multiplyScalar(0.947)).toArray(),
        deform(n.clone().multiplyScalar(0.99)).toArray(),
        0.005,
        "#a8b498",
        id,
        z * 0.94 > 0.3,
      );
  }
  for (const n of [
    V(-0.84, 0.5, -0.3).normalize(),
    V(0.72, -0.64, -0.28).normalize(),
  ]) {
    const t = transporter(g, deform(n.clone()), id, false, 0.4);
    t.quaternion.setFromUnitVectors(V(0, 1, 0), n);
  }
  const templates = {
    catalase: enzymeGlyph("catalase"),
    oxidase: enzymeGlyph("oxidase"),
  };
  const placements = [
    ["catalase", -0.37, 0.3, 0.16, 0.72, 0.1],
    ["oxidase", 0.36, 0.28, 0.08, 0.81, -0.4],
    ["catalase", 0.33, -0.33, 0.05, 0.7, 0.5],
    ["oxidase", -0.33, -0.32, 0.12, 0.72, 0.5],
    ["catalase", 0, 0.03, -0.5, 0.67, 0.7],
  ];
  for (const [kind, x, y, z, s, a] of placements) {
    const unit = templates[kind].clone(true);
    unit.position.set(x, y, z);
    unit.scale.multiplyScalar(s);
    unit.rotation.set(0.12, a, a * 0.4);
    g.add(unit);
  }
  g.userData.partAnchors = {
    peroxisomalMembrane: [-0.86, 0.22, 0.3],
    oxidativeEnzymes: [-0.37, 0.3, 0.16],
  };
  g.userData.landmarks = [
    {
      zh: "代谢酶所在的基质",
      en: "Enzyme-containing matrix",
      position: [0, -0.66, -0.2],
    },
  ];
  return g;
}
function membranePatch() {
  const g = new THREE.Group(),
    id = "peroxisomalMembrane";
  for (let i = -9; i <= 9; i++)
    for (let j = -6; j <= 6; j++) {
      const x = i * 0.12,
        z = j * 0.12,
        y = 0.07 * (x * x + z * z);
      if (Math.hypot(x - 0.28, z) < 0.2) continue;
      for (const side of [-1, 1]) {
        ball(
          g,
          [x, y + side * 0.065, z],
          [0.027, 0.027, 0.027],
          side > 0 ? "#aabea4" : "#cbd7b7",
          id,
        );
        for (const dx of [-0.013, 0.013])
          rod(
            g,
            [x + dx, y + side * 0.04, z],
            [x + dx * 0.7, y + side * 0.003, z + 0.012],
            0.008,
            "#b5be9b",
            id,
          );
      }
    }
  transporter(g, V(0.28, 0, 0), id, false, 1.1);
  g.userData.landmarks = [
    { zh: "细胞质侧", en: "Cytosolic face", position: [-0.65, 0.18, -0.32] },
    {
      zh: "过氧化物酶体基质侧",
      en: "Peroxisomal matrix face",
      position: [-0.6, -0.15, 0.35],
    },
    {
      zh: "膜运输蛋白示意",
      en: "Transport protein schematic",
      position: [0.28, 0.2, 0],
    },
  ];
  g.rotation.set(0.32, -0.24, -0.06);
  return g;
}
export function peroxisomeDetail(id) {
  if (id === "peroxisome") {
    const g = peroxisomeAssembly();
    g.rotation.set(0.1, -0.13, -0.05);
    return g;
  }
  if (id === "peroxisomalMembrane") return membranePatch();
  return null;
}
