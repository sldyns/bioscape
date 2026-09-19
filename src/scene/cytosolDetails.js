import * as THREE from "three";
import data from "./data/cytosolic-enzyme-1hti.json";
import { V, mesh, ball, rod } from "./structuralGeometry";
function enzyme() {
  const g = new THREE.Group(),
    bounds = new THREE.Box3();
  Object.values(data.chains)
    .flat()
    .forEach((row) => bounds.expandByPoint(V(...row.slice(2))));
  const center = bounds.getCenter(V()),
    size = bounds.getSize(V()),
    scale = 2.5 / Math.max(size.x, size.y, size.z),
    centroids = {};
  for (const [chain, rows] of Object.entries(data.chains)) {
    let points = [],
      previous = null;
    const centroid = V();
    const flush = () => {
      if (points.length > 1)
        mesh(
          g,
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            4 * (points.length - 1),
            0.027,
            12,
            false,
          ),
          chain === "A" ? "#99b0a0" : "#c1bb91",
          "cytosolicEnzyme",
        );
    };
    for (const row of rows) {
      const raw = V(...row.slice(2)),
        p = raw.clone().sub(center).multiplyScalar(scale);
      centroid.add(p);
      if (
        previous &&
        (row[0] !== previous.seq + 1 || raw.distanceTo(previous.raw) > 6)
      ) {
        flush();
        points = [];
      }
      points.push(p);
      previous = { seq: row[0], raw };
    }
    flush();
    centroids[chain] = centroid.divideScalar(rows.length);
  }
  g.userData.landmarks = Object.entries(centroids).map(([chain, position]) => ({
    zh: `亚基 ${chain} · 同源二聚体`,
    en: `Subunit ${chain} · Homodimer`,
    position: position.toArray(),
  }));
  return g;
}
function water(g, position, scale = 1) {
  const unit = new THREE.Group();
  unit.position.set(...position);
  unit.scale.setScalar(scale);
  g.add(unit);
  ball(unit, [0, 0, 0], [0.15, 0.15, 0.15], "#a6b9c7", "waterIons");
  const a = THREE.MathUtils.degToRad(104.5 / 2);
  for (const side of [-1, 1]) {
    const p = [side * Math.sin(a) * 0.27, Math.cos(a) * 0.27, 0];
    rod(unit, [0, 0, 0], p, 0.026, "#c4cdd2", "waterIons");
    ball(unit, p, [0.092, 0.092, 0.092], "#e4e8e6", "waterIons");
  }
  return unit;
}
function ionsAndWater() {
  const g = new THREE.Group();
  water(g, [-0.65, 0.18, 0], 1.25);
  ball(g, [0.65, 0.65, 0], [0.18, 0.18, 0.18], "#b6ad90", "waterIons");
  ball(g, [0.75, -0.05, 0], [0.14, 0.14, 0.14], "#a5b6bc", "waterIons");
  ball(g, [0.55, -0.72, 0], [0.21, 0.21, 0.21], "#b1bfa5", "waterIons");
  g.userData.landmarks = [
    {
      zh: "H₂O · 弯曲的水分子",
      en: "H₂O · Bent water molecule",
      position: [-0.65, 0.18, 0],
    },
    { zh: "K⁺ · 钾离子", en: "K⁺ · Potassium ion", position: [0.65, 0.65, 0] },
    { zh: "Na⁺ · 钠离子", en: "Na⁺ · Sodium ion", position: [0.75, -0.05, 0] },
    {
      zh: "Cl⁻ · 氯离子",
      en: "Cl⁻ · Chloride ion",
      position: [0.55, -0.72, 0],
    },
  ];
  return g;
}
export function cytosolDetail(id) {
  if (id === "cytosolicEnzyme") {
    const g = enzyme();
    g.rotation.set(0.2, -0.3, -0.14);
    return g;
  }
  if (id === "waterIons") return ionsAndWater();
  if (id === "cytosol") {
    const g = new THREE.Group(),
      template = enzyme();
    const placements = [
      [-0.8, 0.44, 0.12, 0.24, 0.2],
      [0.56, 0.6, -0.4, 0.25, -0.6],
      [0.74, -0.48, 0.23, 0.26, 0.4],
      [-0.58, -0.69, -0.13, 0.23, 0.8],
      [0.0, -0.07, -0.8, 0.21, 1.4],
    ];
    for (const [x, y, z, s, a] of placements) {
      const m = template.clone(true);
      m.position.set(x, y, z);
      m.scale.setScalar(s);
      m.rotation.set(0.2, a, a * 0.35);
      g.add(m);
    }
    const waters = [
      [-1.12, -0.12, 0.3],
      [-0.1, 0.75, 0.18],
      [0.2, -0.52, 0.54],
      [1.1, 0.22, -0.1],
      [-0.12, -1.0, 0.12],
      [-0.57, 0.99, -0.1],
      [-0.74, -0.2, -0.55],
      [0.42, 0.13, 0.3],
      [0.96, -0.1, -0.6],
      [0.25, -0.82, -0.45],
    ];
    waters.forEach((p, i) => {
      const w = water(g, p, 0.22);
      w.rotation.set(i * 0.4, i * 0.7, i * 0.2);
    });
    for (const [p, c] of [
      [[0.2, 0.95, -0.2], "#b6ad90"],
      [[-0.4, -0.19, 0.35], "#a5b6bc"],
      [[0.87, -0.92, 0.1], "#b1bfa5"],
      [[-1.03, 0.82, 0.1], "#b6ad90"],
    ])
      ball(g, p, [0.035, 0.035, 0.035], c, "waterIons");
    g.userData.partAnchors = {
      cytosolicEnzyme: [-0.8, 0.44, 0.12],
      waterIons: [0.42, 0.13, 0.3],
    };
    g.rotation.set(0.12, -0.1, -0.04);
    return g;
  }
  return null;
}
