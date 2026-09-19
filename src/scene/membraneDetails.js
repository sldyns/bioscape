import * as THREE from "three";
const TAU = Math.PI * 2;
// Build-local sharing preserves the surface tessellation while avoiding a new
// material and sphere buffer for each lipid. A finished model owns its buffers.
const resources = new WeakMap();
function resourceSet(g) {
  if (!resources.has(g))
    resources.set(g, { materials: new Map(), sphere: null });
  return resources.get(g);
}
function material(color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.52,
    metalness: 0.01,
    clearcoat: 0.16,
    side: THREE.DoubleSide,
  });
}
function add(g, geometry, color, id) {
  const { materials } = resourceSet(g);
  if (!materials.has(color)) materials.set(color, material(color));
  const m = new THREE.Mesh(geometry, materials.get(color));
  m.userData.hitId = id;
  g.add(m);
  return m;
}
function bead(g, p, r, color, id, scale = [1, 1, 1]) {
  const shared = resourceSet(g);
  shared.sphere ||= new THREE.SphereGeometry(1, 20, 14);
  const m = add(g, shared.sphere, color, id);
  m.position.set(...p);
  m.scale.set(...scale.map((value) => value * r));
  return m;
}
function strand(g, p, r, color, id) {
  return add(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(p.map((v) => new THREE.Vector3(...v))),
      Math.max(16, p.length * 3),
      r,
      8,
      false,
    ),
    color,
    id,
  );
}
const wave = (x, z) => 0.035 * Math.sin(x * 1.8) + 0.024 * Math.cos(z * 2.5);
function lipidPatch(g, withProteins) {
  const tails = new Map();
  for (const sign of [-1, 1])
    for (let tail = 0; tail < 2; tail++) {
      const dx = (tail - 0.5) * 0.054,
        kink = tail ? 0.028 : 0;
      const points = [
        [dx, sign * 0.29, 0],
        [dx, sign * 0.22, 0.006],
        [dx + kink, sign * 0.13, 0.018],
        [dx + kink, sign * 0.01, 0.012],
      ];
      tails.set(
        `${sign}:${tail}`,
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(
            points.map((p) => new THREE.Vector3(...p)),
          ),
          16,
          0.0125,
          8,
          false,
        ),
      );
    }
  for (let i = -12; i <= 12; i++)
    for (let j = -6; j <= 6; j++) {
      const x = i * 0.142 + (j % 2) * 0.071,
        z = j * 0.142;
      if (
        withProteins &&
        ((x + 0.57) ** 2 + (z + 0.05) ** 2 < 0.3 ** 2 ||
          (x - 0.67) ** 2 + (z - 0.08) ** 2 < 0.23 ** 2)
      )
        continue;
      const w = wave(x, z);
      for (const sign of [-1, 1]) {
        bead(
          g,
          [x, sign * 0.34 + w, z],
          0.065,
          sign > 0 ? "#9fbba8" : "#88a99b",
          "bilayer",
        );
        for (let tail = 0; tail < 2; tail++) {
          const m = add(g, tails.get(`${sign}:${tail}`), "#c0ba96", "bilayer");
          m.position.set(x, w, z);
        }
      }
    }
}
function channel(g, origin = [0, 0, 0], id = "membraneProteins") {
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU,
      p = [];
    for (let j = 0; j <= 100; j++) {
      const t = j / 100,
        r = 0.205 + 0.04 * Math.cos(t * TAU);
      p.push([
        origin[0] + Math.cos(a) * r + 0.03 * Math.cos(t * TAU * 7),
        origin[1] - 0.49 + t * 0.98,
        origin[2] + Math.sin(a) * r + 0.03 * Math.sin(t * TAU * 7),
      ]);
    }
    strand(g, p, 0.028, k % 2 ? "#6f9896" : "#89aeaa", id);
    bead(
      g,
      [
        origin[0] + Math.cos(a) * 0.22,
        origin[1] + 0.48,
        origin[2] + Math.sin(a) * 0.22,
      ],
      0.085,
      "#91b5ae",
      id,
      [1, 0.8, 1],
    );
  }
}
function receptor(g, origin, id = "membraneProteins") {
  for (const sign of [-1, 1]) {
    const x = origin[0] + sign * 0.065,
      z = origin[2],
      p = [];
    for (let j = 0; j <= 80; j++) {
      const t = j / 80;
      p.push([
        x + 0.028 * Math.cos(t * TAU * 6),
        -0.45 + t * 0.92,
        z + 0.028 * Math.sin(t * TAU * 6),
      ]);
    }
    strand(g, p, 0.031, "#829eae", id);
    bead(g, [x + sign * 0.08, 0.53, z], 0.16, "#98acba", id, [0.78, 1.2, 0.9]);
    strand(
      g,
      [
        [x, -0.45, z],
        [x + sign * 0.11, -0.57, z + 0.03],
        [x + sign * 0.05, -0.65, z + 0.08],
      ],
      0.026,
      "#94aabc",
      id,
    );
  }
}
function glycan(g, origin, scale = 1) {
  const paths = [
    [
      [0, 0, 0],
      [0, 0.18, 0],
      [0.04, 0.35, 0.015],
    ],
    [
      [0.04, 0.35, 0.015],
      [-0.14, 0.52, 0.01],
      [-0.19, 0.7, 0.035],
    ],
    [
      [0.04, 0.35, 0.015],
      [0.2, 0.51, -0.015],
      [0.27, 0.69, -0.03],
    ],
    [
      [0.2, 0.51, -0.015],
      [0.38, 0.56, 0.055],
    ],
  ];
  paths.forEach((path, i) => {
    const pts = path.map((p) => p.map((v, j) => origin[j] + v * scale));
    strand(g, pts, 0.021 * scale, "#b4af8b", "glycans");
    pts
      .slice(i ? 1 : 0)
      .forEach((p, k) =>
        bead(
          g,
          p,
          0.052 * scale,
          ["#c6b889", "#b4bd94", "#a6b7bf"][(i + k) % 3],
          "glycans",
        ),
      );
  });
}
export function membraneDetail(id) {
  if (!["membrane", "bilayer", "membraneProteins", "glycans"].includes(id))
    return null;
  const g = new THREE.Group();
  if (id === "membrane" || id === "bilayer") lipidPatch(g, id === "membrane");
  if (id === "membrane") {
    channel(g, [-0.57, 0, -0.05]);
    receptor(g, [0.67, 0, 0.08]);
    glycan(g, [0.66, 0.66, 0.08], 0.9);
    glycan(g, [-1.35, 0.39, 0.15], 0.75);
  }
  if (id === "membraneProteins") channel(g);
  if (id === "glycans") {
    glycan(g, [0, -0.55, 0], 1.5);
    strand(
      g,
      [
        [0, -0.8, 0],
        [0, -0.55, 0],
      ],
      0.038,
      "#91a8ac",
      "glycans",
    );
  }
  g.rotation.set(0.3, -0.24, -0.035);
  g.userData.landmarks =
    id === "membrane" || id === "bilayer"
      ? [
          {
            zh: "细胞外侧",
            en: "Extracellular side",
            position: [-1.45, 0.58, -0.45],
          },
          {
            zh: "细胞质侧",
            en: "Cytosolic side",
            position: [1.45, -0.58, 0.45],
          },
          ...(id === "bilayer"
            ? [
                {
                  zh: "亲水头部",
                  en: "Hydrophilic heads",
                  position: [1.5, 0.34, 0.84],
                },
                {
                  zh: "疏水尾部",
                  en: "Hydrophobic tails",
                  position: [-1.5, 0, 0.84],
                },
              ]
            : []),
        ]
      : id === "membraneProteins"
        ? [
            {
              zh: "跨膜区",
              en: "Transmembrane region",
              position: [0.24, 0, 0],
            },
            {
              zh: "中央通路（示意）",
              en: "Central pathway (schematic)",
              position: [0, 0.49, 0],
            },
          ]
        : [];
  return g;
}
