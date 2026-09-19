import * as THREE from "three";
const TAU = Math.PI * 2,
  V = (x, y, z) => new THREE.Vector3(x, y, z);
function add(g, geo, color, id) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.62,
      clearcoat: 0.12,
      side: THREE.DoubleSide,
    }),
  );
  m.userData.hitId = id;
  g.add(m);
  return m;
}
function ball(g, p, s, color, id) {
  const m = add(g, new THREE.SphereGeometry(1, 24, 16), color, id);
  m.position.set(...p);
  m.scale.set(...s);
  return m;
}
function tube(g, points, r, color, id) {
  return add(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        points.map((p) => (p.isVector3 ? p : V(...p))),
      ),
      Math.max(32, points.length * 2),
      r,
      8,
      false,
    ),
    color,
    id,
  );
}
function ring(g, r, y, t, color) {
  const pts = [];
  for (let i = 0; i <= 80; i++)
    pts.push([Math.cos((i / 80) * TAU) * r, y, Math.sin((i / 80) * TAU) * r]);
  tube(g, pts, t, color, "nuclearPores");
}
export function poreComplex() {
  const g = new THREE.Group(),
    id = "nuclearPores";
  // Eight repeated spokes support the cytoplasmic, inner and nuclear rings.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    for (const y of [-0.28, 0, 0.28]) {
      const m = ball(
        g,
        [Math.cos(a) * 0.7, y, Math.sin(a) * 0.7],
        [0.22, 0.115, 0.18],
        y === 0 ? "#9c8fb7" : "#b49dc5",
        id,
      );
      m.rotation.y = -a;
      tube(
        g,
        [
          [Math.cos(a) * 0.49, y, Math.sin(a) * 0.49],
          [Math.cos(a) * 0.72, y, Math.sin(a) * 0.72],
          [Math.cos(a) * 0.89, y, Math.sin(a) * 0.89],
        ],
        0.055,
        "#c6b3d3",
        id,
      );
    }
    tube(
      g,
      [
        [Math.cos(a) * 0.72, -0.29, Math.sin(a) * 0.72],
        [Math.cos(a) * 0.79, 0, Math.sin(a) * 0.79],
        [Math.cos(a) * 0.72, 0.29, Math.sin(a) * 0.72],
      ],
      0.062,
      "#a28bb9",
      id,
    );
    tube(
      g,
      [
        [Math.cos(a) * 0.72, 0.34, Math.sin(a) * 0.72],
        [Math.cos(a + 0.09) * 0.84, 0.6, Math.sin(a + 0.09) * 0.84],
        [
          Math.cos(a + 0.18) * 0.99,
          0.83 + (i % 3) * 0.055,
          Math.sin(a + 0.18) * 0.99,
        ],
      ],
      0.024,
      "#c5b5d0",
      id,
    );
    tube(
      g,
      [
        [Math.cos(a) * 0.7, -0.34, Math.sin(a) * 0.7],
        [Math.cos(a) * 0.5, -0.73, Math.sin(a) * 0.5],
        [Math.cos(a) * 0.29, -1.02, Math.sin(a) * 0.29],
      ],
      0.022,
      "#a891bc",
      id,
    );
    // Flexible FG-rich domains indicate a selective barrier, not an empty lumen.
    const pts = [];
    for (let j = 0; j <= 24; j++) {
      const t = j / 24,
        r = 0.52 * (1 - t) + 0.055;
      pts.push([
        Math.cos(a + t * 2.3) * r,
        Math.sin(t * TAU + i) * 0.11,
        Math.sin(a + t * 2.3) * r,
      ]);
    }
    tube(g, pts, 0.012, "#c8a9be", id);
  }
  ring(g, 0.72, 0.28, 0.042, "#b29cc6");
  ring(g, 0.72, -0.28, 0.042, "#b29cc6");
  ring(g, 0.29, -1.02, 0.025, "#a891bc");
  g.rotation.set(0.6, -0.12, 0);
  g.userData.landmarks = [
    {
      zh: "细胞质侧纤丝",
      en: "Cytoplasmic filaments",
      position: [0.9, 0.82, 0],
    },
    { zh: "选择性屏障", en: "Selective barrier", position: [0, 0, 0] },
    {
      zh: "核篮 · 核质侧",
      en: "Nuclear basket",
      position: [0.25, -0.94, 0.05],
    },
  ];
  return g;
}
export function nucleolarBody() {
  const g = new THREE.Group(),
    id = "nucleolus";
  // Exposed volume is a molecular condensate; no enclosing membrane is drawn.
  const field = new THREE.SphereGeometry(
    1,
    64,
    40,
    0,
    TAU,
    0.97,
    Math.PI - 0.97,
  );
  field.rotateX(Math.PI / 2);
  const body = add(g, field, "#b19bbc", id);
  body.scale.set(1, 0.88, 0.83);
  const capGeo = new THREE.SphereGeometry(1, 64, 28, 0, TAU, 0, 0.97);
  capGeo.rotateX(Math.PI / 2);
  const cap = add(g, capGeo, "#b19bbc", id);
  cap.scale.copy(body.scale);
  cap.userData.cap = true;
  const centers = [
    [-0.35, 0.26, 0.29],
    [0.34, 0.1, 0.3],
    [-0.08, -0.36, 0.32],
  ];
  for (const [cx, cy, cz] of centers) {
    ball(g, [cx, cy, cz], [0.145, 0.13, 0.13], "#ded2de", id);
    for (let k = 0; k < 11; k++) {
      const points = [];
      for (let j = 0; j <= 60; j++) {
        const a = (j / 60) * TAU,
          r = 0.195 + 0.018 * Math.sin(a * 3 + k);
        points.push([
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r * 0.88,
          cz + (k - 5) * 0.014 + 0.014 * Math.sin(a * 4 + k),
        ]);
      }
      tube(g, points, 0.012, k % 2 ? "#987aab" : "#a789b6", id);
    }
  }
  for (let i = 0; i < 530; i++) {
    const z = 1 - (2 * (i + 0.5)) / 530,
      a = i * Math.PI * (3 - Math.sqrt(5)),
      r = Math.sqrt(1 - z * z);
    const p = [Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.82, z * 0.77];
    const grain = ball(
      g,
      p,
      [0.028, 0.024, 0.027],
      i % 3 ? "#c4afd0" : "#a990b8",
      id,
    );
    grain.userData.cap = z > 0.58;
  }
  // Granules also occupy the exposed interior, outside fibrillar domains.
  for (let i = 0; i < 200; i++) {
    const a = i * 2.3999,
      r = 0.78 * Math.sqrt((i + 0.5) / 200),
      x = Math.cos(a) * r,
      y = Math.sin(a) * r * 0.84;
    if (centers.some(([cx, cy]) => Math.hypot(x - cx, y - cy) < 0.26)) continue;
    ball(
      g,
      [x, y, 0.28 + 0.06 * Math.sin(i * 1.7)],
      [0.025, 0.022, 0.025],
      i % 2 ? "#c4afce" : "#ae94ba",
      id,
    );
  }
  g.userData.landmarks = [
    { zh: "纤维中心", en: "Fibrillar center", position: centers[0] },
    {
      zh: "致密纤维组分",
      en: "Dense fibrillar component",
      position: [0.51, 0.1, 0.3],
    },
    { zh: "颗粒组分", en: "Granular component", position: [0.05, 0.57, 0.27] },
  ];
  return g;
}
