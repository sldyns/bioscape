import * as THREE from "three";
import { TAU, V, mesh, tube, rod, wall } from "./structuralGeometry";
const colors = ["#c4a165", "#dbc390", "#bda876"];
// B and C omit their near-side arcs and use the preceding tubule's wall.
export function tripletAssembly({
  length = 1.6,
  r = 0.14,
  id = "triplets",
  distal = false,
  beads = false,
} = {}) {
  const g = new THREE.Group(),
    step = r * 1.6,
    halfArc = Math.acos(0.8),
    beadGeometry = beads ? new THREE.SphereGeometry(1, 24, 16) : null;
  for (let k = 0; k < 3; k++) {
    const start = k ? -Math.PI + halfArc : 0,
      end = k ? Math.PI - halfArc : TAU,
      L = distal && k === 2 ? length * 0.73 : length,
      y = distal && k === 2 ? -(length - L) / 2 : 0,
      cx = k * step;
    const w = wall(g, r, r * 0.16, L, start, end, colors[k], id);
    w.position.set(cx, y, 0);
    const lanes = k ? 10 : 13;
    for (let p = 0; p < lanes; p++) {
      const a = start + ((end - start) * (p + 0.5)) / lanes,
        x = cx + Math.cos(a) * (r + 0.002),
        z = -Math.sin(a) * (r + 0.002);
      if (beads)
        for (let j = 0; j < 18; j++) {
          const m = mesh(g, beadGeometry, j % 2 ? colors[k] : "#e3d2ad", id);
          m.position.set(x, y + ((j - 8.5) * L) / 18, z);
          m.scale.set(r * 0.2, L / 37, r * 0.2);
          m.userData.protofilament = p;
        }
      else
        rod(g, [x, y - L / 2, z], [x, y + L / 2, z], r * 0.085, colors[k], id);
    }
  }
  g.userData.triplet = {
    completeA: 13,
    partialB: 10,
    partialC: 10,
    sharedWalls: true,
  };
  return g;
}
function centriole(id, mother = false) {
  const g = new THREE.Group(),
    radius = 0.55,
    tilt = 0.9,
    template = tripletAssembly({ length: 1.8, r: 0.115, id, distal: true });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU,
      t = template.clone(true);
    t.position.set(Math.cos(a) * radius, 0, -Math.sin(a) * radius);
    t.rotation.y = a + tilt;
    g.add(t);
    if (mother) {
      const x = Math.cos(a),
        z = -Math.sin(a);
      tube(
        g,
        [
          // Root the appendage in the outer A wall, never across its lumen.
          [x * 0.681, 0.58, z * 0.681],
          [x * 0.74, 0.65, z * 0.74],
          [x * 0.83, 0.53, z * 0.83],
        ],
        0.032,
        "#cbb788",
        id,
        32,
      );
    }
  }
  // A-C links represent lateral reinforcement, without a permanent cartwheel claim.
  for (const y of [-0.54, -0.3])
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU,
        b = ((i + 1) / 9) * TAU,
        tubuleRadius = 0.115,
        cOffset = 2 * tubuleRadius * 1.6,
        cCenter = V(
          Math.cos(a) * radius + Math.cos(a + tilt) * cOffset,
          y,
          -Math.sin(a) * radius - Math.sin(a + tilt) * cOffset,
        ),
        nextA = V(Math.cos(b) * radius, y, -Math.sin(b) * radius),
        direction = nextA.clone().sub(cCenter).normalize(),
        start = cCenter.clone().addScaledVector(direction, tubuleRadius),
        end = nextA.clone().addScaledVector(direction, -tubuleRadius),
        middle = start.clone().lerp(end, 0.5);
      // Attach to the facing C/A walls, leaving both lumens open.
      middle.y += 0.035;
      tube(g, [start, middle, end], 0.019, "#bba875", id, 28);
    }
  return g;
}
export function centriolePair(id = "centrioles") {
  const g = new THREE.Group(),
    a = centriole(id, true),
    b = centriole(id, false);
  a.position.set(-0.62, 0.2, -0.15);
  b.position.set(1.12, -0.79, 0.18);
  b.rotation.z = -Math.PI / 2;
  b.scale.setScalar(0.85);
  g.add(a, b);
  return g;
}
export function pcmAssembly() {
  const g = new THREE.Group(),
    id = "pcm";
  for (let i = 0; i < 18; i++) {
    const phase = i * 2.399963,
      points = [];
    for (let j = 0; j <= 32; j++) {
      const t = j / 32,
        a = phase + t * 2.1;
      points.push([
        0.16 + Math.cos(a) * (1.15 + 0.17 * Math.sin(i * 1.7 + t * 4)),
        0.15 + Math.sin(a) * (1.15 + 0.14 * Math.cos(i + t * 3)),
        Math.sin(phase * 0.7) * 0.72 - 0.2 + 0.1 * Math.sin(t * 7 + i),
      ]);
    }
    tube(g, points, 0.013, i % 2 ? "#b2baa5" : "#c3c6b0", id, 64);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.32,
      origin = V(0.15 + Math.cos(a) * 1.13, Math.sin(a) * 1.1, -0.32),
      axis = V(Math.cos(a), Math.sin(a), 0.1).normalize(),
      unit = new THREE.Group();
    unit.position.copy(origin);
    unit.quaternion.setFromUnitVectors(V(0, 1, 0), axis);
    g.add(unit);
    const pts = [];
    for (let k = 0; k <= 64; k++) {
      const b = (k / 64) * TAU;
      pts.push([Math.cos(b) * 0.105, 0, Math.sin(b) * 0.105]);
    }
    tube(unit, pts, 0.023, "#9aab9d", id, 80);
    wall(unit, 0.088, 0.025, 0.55, 0, TAU, "#91aaa5", id).position.y = 0.29;
  }
  return g;
}
export function centrosomeAssembly() {
  const g = new THREE.Group();
  g.add(centriolePair(), pcmAssembly());
  g.userData.partAnchors = {
    centrioles: [-0.65, 0.82, 0.4],
    pcm: [1.25, 0.6, -0.3],
  };
  return g;
}
export function centrosomeDetail(id) {
  if (id === "centrosome") {
    const g = centrosomeAssembly();
    g.rotation.set(0.48, -0.3, -0.12);
    return g;
  }
  if (id === "centrioles") {
    const g = centriolePair("triplets");
    g.rotation.set(0.56, -0.28, -0.15);
    g.userData.landmarks = [
      {
        zh: "九组三联体围成筒壁",
        en: "Nine triplets form the cylinder",
        position: [-0.72, 0.96, 0.38],
      },
      {
        zh: "母中心粒的附属结构示意",
        en: "Mother centriole appendages",
        position: [-0.62, 0.84, 0.65],
      },
    ];
    return g;
  }
  if (id === "triplets") {
    const g = tripletAssembly({ length: 1.65, r: 0.25, beads: true });
    g.position.x = -0.4;
    g.rotation.set(0.78, -0.13, -0.2);
    g.userData.landmarks = [
      {
        zh: "A 管 · 完整管壁",
        en: "A tubule · Complete wall",
        position: [0, 0.86, 0],
      },
      {
        zh: "B 管 · 共享 A 管壁",
        en: "B tubule · Shares A wall",
        position: [0.4, 0.86, 0],
      },
      {
        zh: "C 管 · 共享 B 管壁",
        en: "C tubule · Shares B wall",
        position: [0.8, 0.86, 0],
      },
    ];
    return g;
  }
  if (id === "pcm") {
    const g = pcmAssembly();
    g.rotation.set(0.28, -0.18, -0.08);
    g.userData.landmarks = [
      {
        zh: "非膜性蛋白支架",
        en: "Non-membranous scaffold",
        position: [-0.75, 0.4, 0.2],
      },
      {
        zh: "成核模板与微管短段",
        en: "Nucleation template and microtubule",
        position: [1.35, 0.4, -0.2],
      },
    ];
    return g;
  }
  return null;
}
