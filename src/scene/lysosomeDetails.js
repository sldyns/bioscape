import * as THREE from "three";
import { splitSection } from "./implicitMembrane";
import cathepsin from "./data/cathepsin-1lya.json";
const TAU = Math.PI * 2,
  V = (x, y, z) => new THREE.Vector3(x, y, z);
function mesh(g, geometry, color, id, cap = false) {
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
function ball(g, p, r, color, id, cap = false) {
  const m = mesh(g, new THREE.SphereGeometry(r, 16, 12), color, id, cap);
  m.position.copy(p);
  return m;
}
function tube(g, points, r, color, id, cap = false, segments = 64) {
  return mesh(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      segments,
      r,
      12,
      false,
    ),
    color,
    id,
    cap,
  );
}
function rod(g, a, b, r, color, id, cap = false) {
  const d = b.clone().sub(a),
    m = mesh(
      g,
      new THREE.CylinderGeometry(r, r, d.length(), 8),
      color,
      id,
      cap,
    );
  m.position.copy(a).lerp(b, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  return m;
}
const shellRadius = (n) =>
  1 + 0.035 * n.x * n.y + 0.022 * Math.sin(n.z * 4) * n.x;
function membraneRim(g) {
  // Close only the exposed thickness of the single bilayer, leaving its lumen open.
  const sectionZ = 0.28,
    loops = [1, 0.935].map((radius) => {
      const points = [];
      for (let i = 0; i < 160; i++) {
        const angle = (i / 160) * TAU;
        let lo = 0,
          hi = 1.1;
        for (let k = 0; k < 28; k++) {
          const r = (lo + hi) / 2,
            p = V(r * Math.cos(angle), r * Math.sin(angle), sectionZ),
            length = p.length();
          if (length > radius * shellRadius(p.divideScalar(length))) hi = r;
          else lo = r;
        }
        const r = (lo + hi) / 2;
        points.push(
          new THREE.Vector2(r * Math.cos(angle), r * Math.sin(angle)),
        );
      }
      return points;
    }),
    shape = new THREE.Shape(loops[0]);
  shape.holes.push(new THREE.Path(loops[1].reverse()));
  const rim = mesh(
    g,
    new THREE.ShapeGeometry(shape),
    "#b6c6af",
    "lysosomalMembrane",
  );
  rim.position.z = sectionZ;
}
function glycan(g, origin, axis, id, scale = 1, cap = false) {
  const unit = new THREE.Group();
  unit.position.copy(origin);
  unit.quaternion.setFromUnitVectors(V(0, 1, 0), axis);
  unit.scale.setScalar(scale);
  g.add(unit);
  rod(unit, V(0, -0.025, 0), V(0, 0.1, 0), 0.017, "#849c97", id, cap);
  ball(unit, V(0, 0.11, 0), 0.034, "#8da59a", id, cap);
  for (const side of [-1, 1]) {
    tube(
      unit,
      [V(0, 0.1, 0), V(side * 0.06, 0.16, 0.018), V(side * 0.085, 0.2, 0)],
      0.009,
      "#b5bc9b",
      id,
      cap,
      24,
    );
    for (const [x, y] of [
      [0.06, 0.16],
      [0.085, 0.2],
    ])
      ball(unit, V(side * x, y, 0), 0.02, "#c3c7a5", id, cap);
  }
}
export function protonPump(g, id = "lysosomalPump") {
  const unit = new THREE.Group();
  g.add(unit);
  const ring = mesh(
    unit,
    new THREE.TorusGeometry(0.18, 0.05, 14, 64),
    "#7f9da6",
    id,
  );
  ring.rotation.x = Math.PI / 2;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    rod(
      unit,
      V(Math.cos(a) * 0.18, -0.1, Math.sin(a) * 0.18),
      V(Math.cos(a) * 0.18, 0.11, Math.sin(a) * 0.18),
      0.037,
      "#8faab0",
      id,
    );
  }
  rod(unit, V(0, 0.05, 0), V(0, 0.62, 0), 0.036, "#bda986", id);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU,
      m = ball(
        unit,
        V(Math.cos(a) * 0.22, 0.64, Math.sin(a) * 0.22),
        0.155,
        k % 2 ? "#b4beb7" : "#94aaa5",
        id,
      );
    m.scale.set(0.8, 1.35, 0.9);
  }
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.35;
    tube(
      unit,
      [
        V(Math.cos(a) * 0.26, 0.04, Math.sin(a) * 0.26),
        V(Math.cos(a) * 0.33, 0.35, Math.sin(a) * 0.33),
        V(Math.cos(a) * 0.3, 0.66, Math.sin(a) * 0.3),
      ],
      0.019,
      "#c5b693",
      id,
      false,
      64,
    );
  }
  return unit;
}
export function cathepsinModel() {
  const g = new THREE.Group(),
    records = Object.values(cathepsin.chains).flat(),
    bounds = new THREE.Box3();
  records.forEach((r) => bounds.expandByPoint(V(...r.slice(2))));
  const center = bounds.getCenter(V()),
    size = bounds.getSize(V()),
    scale = 1.8 / Math.max(size.x, size.y, size.z);
  const ends = {};
  for (const [chain, rows] of Object.entries(cathepsin.chains)) {
    let points = [],
      previous = null;
    const flush = () => {
      if (points.length > 1)
        tube(
          g,
          points,
          0.034,
          chain === "A" ? "#93b4a5" : "#6e9c97",
          "hydrolases",
          false,
          (points.length - 1) * 4,
        );
    };
    for (const row of rows) {
      const raw = V(...row.slice(2)),
        p = raw.clone().sub(center).multiplyScalar(scale);
      if (
        previous &&
        (row[0] !== previous.seq + 1 || raw.distanceTo(previous.raw) > 6)
      ) {
        flush();
        points = [];
      }
      points.push(p);
      previous = { seq: row[0], raw };
      if (!ends[chain] || p.z > ends[chain].z) ends[chain] = p;
    }
    flush();
  }
  g.userData.landmarks = [
    {
      zh: "成熟酶的轻链",
      en: "Mature light chain",
      position: ends.A.toArray(),
    },
    {
      zh: "成熟酶的重链",
      en: "Mature heavy chain",
      position: ends.B.toArray(),
    },
  ];
  return g;
}
function recycleMaterial(g) {
  // Different substrates are kept visually distinct from catalytic enzymes.
  for (const [p, s] of [
    [[-0.3, -0.22, 0.18], 0.18],
    [[0.05, -0.38, 0.04], 0.13],
  ]) {
    const geo = new THREE.SphereGeometry(s, 48, 32);
    splitSection(geo, (v) => v[2] - 0.035).forEach((piece, i) => {
      if (i) {
        piece.dispose();
        return;
      }
      const m = mesh(g, piece, "#cfbba1", "recycling");
      m.position.set(...p);
    });
    const inner = new THREE.SphereGeometry(s * 0.88, 48, 32);
    splitSection(inner, (v) => v[2] - 0.035).forEach((piece, i) => {
      if (i) {
        piece.dispose();
        return;
      }
      const m = mesh(g, piece, "#ded1b8", "recycling");
      m.position.set(...p);
    });
  }
  const protein = [];
  for (let j = 0; j <= 64; j++) {
    const t = (j / 64) * TAU * 1.8;
    protein.push(
      V(
        0.2 + 0.15 * Math.sin(t),
        -0.15 + 0.11 * Math.cos(t * 1.7),
        0.17 + 0.055 * Math.sin(t * 2.1),
      ),
    );
  }
  tube(g, protein, 0.022, "#c6ab87", "recycling", false, 128);
  for (let k = 0; k < 5; k++)
    ball(
      g,
      V(0.02 + k * 0.083, -0.48 + 0.025 * Math.sin(k * 1.7), 0.14),
      0.024,
      k % 2 ? "#c7b68f" : "#d4c39b",
      "recycling",
    );
}
export function lysosomeAssembly() {
  const g = new THREE.Group();
  for (const [radius, color] of [
    [1, "#86aaa1"],
    [0.935, "#cad9c6"],
  ]) {
    const geo = new THREE.SphereGeometry(radius, 112, 72),
      pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const p = V(pos.getX(i), pos.getY(i), pos.getZ(i)),
        r = shellRadius(p.clone().normalize());
      pos.setXYZ(i, p.x * r, p.y * r, p.z * r);
    }
    geo.computeVertexNormals();
    splitSection(geo, (p) => p[2] - 0.28).forEach((piece, cap) =>
      mesh(g, piece, color, "lysosomalMembrane", !!cap),
    );
  }
  membraneRim(g);
  for (let i = 0; i < 900; i++) {
    const z = 1 - (2 * (i + 0.5)) / 900,
      a = i * 2.399963,
      r = Math.sqrt(1 - z * z),
      n = V(Math.cos(a) * r, Math.sin(a) * r, z),
      rad = shellRadius(n),
      cap = z * rad > 0.28;
    for (const [s, c] of [
      [1.008, "#b4cbc0"],
      [0.93, "#d5dfc8"],
    ])
      ball(
        g,
        n.clone().multiplyScalar(rad * s),
        0.014,
        c,
        "lysosomalMembrane",
        cap,
      );
    if (Math.abs(z * rad - 0.28) < 0.035)
      rod(
        g,
        n.clone().multiplyScalar(rad * 0.944),
        n.clone().multiplyScalar(rad * 0.99),
        0.005,
        "#a2b49b",
        "lysosomalMembrane",
        cap,
      );
  }
  for (let k = 0; k < 18; k++) {
    const z = -0.8 + (k / 17) * 1.45,
      a = k * 2.399963,
      r = Math.sqrt(1 - z * z),
      n = V(Math.cos(a) * r, Math.sin(a) * r, z);
    glycan(
      g,
      n.clone().multiplyScalar(shellRadius(n) * 0.93),
      n.clone().negate(),
      "lysosomalMembrane",
      0.7,
      z > 0.28,
    );
  }
  for (const n of [
    V(-0.87, 0.38, -0.3).normalize(),
    V(0.8, 0.48, -0.35).normalize(),
    V(0.14, -0.91, -0.39).normalize(),
  ]) {
    const p = protonPump(g, "lysosomalMembrane");
    p.position.copy(n).multiplyScalar(shellRadius(n));
    p.quaternion.setFromUnitVectors(V(0, 1, 0), n);
    p.scale.setScalar(0.23);
  }
  const enzyme = cathepsinModel();
  for (const [x, y, z, s, angle] of [
    [-0.34, 0.32, 0.1, 0.13, 0.4],
    [0.2, 0.38, 0.0, 0.12, -0.7],
    [0.44, -0.08, -0.04, 0.11, 0.5],
    [-0.5, -0.02, -0.1, 0.12, 1.7],
    [0.14, 0.03, -0.3, 0.12, 2.1],
    [-0.14, -0.54, -0.18, 0.1, -1.4],
  ]) {
    const e = enzyme.clone(true);
    e.position.set(x, y, z);
    e.scale.setScalar(s);
    e.rotation.set(0.2, angle, -0.3);
    g.add(e);
  }
  recycleMaterial(g);
  g.userData.partAnchors = {
    lysosomalMembrane: [-0.82, 0.15, 0.28],
    hydrolases: [0.2, 0.38, 0],
    recycling: [0.2, -0.15, 0.17],
  };
  g.userData.landmarks = [
    {
      zh: "酸性内腔 · 约 pH 5",
      en: "Acidic lumen · About pH 5",
      position: [0.0, 0.65, -0.2],
    },
  ];
  return g;
}
function membranePatch(pumpOnly = false) {
  const g = new THREE.Group();
  for (let i = -9; i <= 9; i++)
    for (let j = -6; j <= 6; j++) {
      const x = i * 0.12,
        z = j * 0.12;
      if (Math.hypot(x, z) < 0.26 || (pumpOnly && Math.hypot(x, z) > 0.48))
        continue;
      const y = 0.06 * (x * x + z * z);
      for (const side of [-1, 1]) {
        ball(
          g,
          V(x, y + side * 0.065, z),
          0.027,
          side > 0 ? "#a8c3b5" : "#cfdbc4",
          "lysosomalMembrane",
        );
        for (const dx of [-0.012, 0.012])
          rod(
            g,
            V(x + dx, y + side * 0.04, z),
            V(x + dx * 0.7, y + side * 0.003, z + 0.012),
            0.008,
            "#a5b59d",
            "lysosomalMembrane",
          );
      }
    }
  if (!pumpOnly)
    for (const [x, z] of [
      [-0.7, 0.3],
      [0.68, 0.35],
      [-0.58, -0.4],
      [0.58, -0.42],
    ])
      glycan(
        g,
        V(x, 0.06 * (x * x + z * z) - 0.065, z),
        V(0, -1, 0),
        "lysosomalMembrane",
        1.8,
      );
  if (pumpOnly)
    g.traverse((o) => {
      if (o.isMesh) {
        o.material.transparent = true;
        o.material.opacity = 0.3;
        o.material.depthWrite = false;
      }
    });
  protonPump(g);
  if (pumpOnly) {
    // A direction cue beside the pump, not a path through its central shaft.
    rod(
      g,
      V(0.58, 0.22, 0.24),
      V(0.58, -0.51, 0.24),
      0.012,
      "#bfab78",
      "lysosomalPump",
    );
    const cone = mesh(
      g,
      new THREE.ConeGeometry(0.052, 0.12, 20),
      "#bfab78",
      "lysosomalPump",
    );
    cone.rotation.z = Math.PI;
    cone.position.set(0.58, -0.57, 0.24);
  }
  g.userData.landmarks = pumpOnly
    ? [
        {
          zh: "V₁ · 细胞质侧",
          en: "V₁ · Cytosolic side",
          position: [0.0, 0.7, 0],
        },
        {
          zh: "V₀ · 膜内部分",
          en: "V₀ · In the membrane",
          position: [0.18, 0, 0],
        },
        {
          zh: "H⁺ 泵入内腔",
          en: "H⁺ pumped into lumen",
          position: [0.58, -0.5, 0.24],
        },
      ]
    : [
        { zh: "细胞质侧", en: "Cytosolic face", position: [-0.7, 0.18, -0.35] },
        {
          zh: "朝向内腔的糖链",
          en: "Lumen-facing glycans",
          position: [-0.7, -0.44, 0.3],
        },
      ];
  if (pumpOnly)
    g.traverse((o) => {
      if (o.isMesh) o.userData.hitId = "lysosomalPump";
    });
  g.rotation.set(0.3, -0.22, -0.04);
  return g;
}
export function lysosomeDetail(id) {
  if (id === "lysosome") {
    const g = lysosomeAssembly();
    g.rotation.set(0.12, -0.16, -0.04);
    return g;
  }
  if (id === "lysosomalMembrane") return membranePatch();
  if (id === "lysosomalPump") return membranePatch(true);
  if (id === "hydrolases") {
    const g = cathepsinModel();
    g.rotation.set(0.12, -0.32, -0.1);
    return g;
  }
  if (id === "recycling") {
    const g = new THREE.Group();
    recycleMaterial(g);
    g.rotation.set(0.18, -0.2, -0.1);
    g.userData.landmarks = [
      {
        zh: "待降解的膜片",
        en: "Membrane fragments",
        position: [-0.3, -0.22, 0.22],
      },
      {
        zh: "蛋白质片段",
        en: "Protein fragment",
        position: [0.2, -0.12, 0.22],
      },
    ];
    return g;
  }
  return null;
}
