import * as T from "three";
import { V, TAU, addMesh, ball, tube, shell } from "./specimenGeometry";
import { protonPump } from "./lysosomeDetails";

function water(g, p, s, id) {
  const o = V(...p);
  ball(g, p, [s, s, s], "#9fbac8", id);
  for (const side of [-1, 1]) {
    const h = o.clone().add(V(side * s * 0.95, s * 0.74, 0));
    tube(g, [o, h], s * 0.21, "#d3dfe0", id);
    ball(g, h.toArray(), [s * 0.57, s * 0.57, s * 0.57], "#e0e7e4", id);
  }
}
function aquaporin() {
  const g = new T.Group();
  for (const [x, z] of [
    [-0.17, -0.17],
    [0.17, -0.17],
    [-0.17, 0.17],
    [0.17, 0.17],
  ]) {
    const helices = [];
    for (let h = 0; h < 6; h++) {
      const a = (h / 6) * TAU;
      const points = Array.from({ length: 49 }, (_, i) => {
        const t = i / 48,
          q = t * TAU * 6;
        return V(
          x + 0.128 * Math.cos(a) + 0.023 * Math.cos(q),
          -0.29 + t * 0.58,
          z + 0.128 * Math.sin(a) + 0.023 * Math.sin(q),
        );
      });
      helices.push(points);
      const mesh = tube(
        g,
        points,
        0.017,
        h % 2 ? "#87aaa5" : "#a5c0b4",
        "plantAquaporin",
      );
      mesh.userData.secondaryStructure = "transmembrane-helix";
    }
    // Five connecting loops make a continuous six-pass backbone. Loops B/E
    // re-enter from opposite faces, each bearing a half helix beside the pore.
    for (let h = 0; h < 5; h++) {
      const side = h % 2 ? -1 : 1;
      const end = side > 0 ? 48 : 0;
      const start = helices[h][end],
        finish = helices[h + 1][end];
      if (h === 1 || h === 4) {
        const points = Array.from({ length: 29 }, (_, i) => {
          const t = i / 28,
            angle = t * TAU * 2.5;
          return V(
            x + side * (0.077 - t * 0.031) + 0.013 * Math.cos(angle),
            side * (0.23 - t * 0.205),
            z + 0.013 * Math.sin(angle),
          );
        });
        const half = tube(g, points, 0.013, "#c5bd8a", "plantAquaporin");
        half.userData.secondaryStructure = "reentrant-half-helix";
        tube(
          g,
          [start, V(start.x, side * 0.335, start.z), points[0]],
          0.012,
          "#a9b7a2",
          "plantAquaporin",
        );
        tube(
          g,
          [
            points.at(-1),
            V(x + side * 0.085, side * 0.14, z + side * 0.06),
            V(finish.x, side * 0.335, finish.z),
            finish,
          ],
          0.012,
          "#a9b7a2",
          "plantAquaporin",
        );
      } else {
        const mid = start.clone().lerp(finish, 0.5);
        mid.y = side * 0.345;
        tube(g, [start, mid, finish], 0.012, "#a9b7a2", "plantAquaporin");
      }
    }
    for (const y of [-0.4, 0, 0.4])
      water(g, [x, y, z], 0.021, "plantAquaporin");
  }
  g.userData.landmarks = [
    {
      zh: "每个单体有独立水通道",
      en: "One water pore per monomer",
      position: [0.17, 0.4, 0.17],
    },
    {
      zh: "两侧折入的半螺旋（示意）",
      en: "Half-helices entering from opposite faces",
      position: [-0.12, 0.06, 0.17],
    },
  ];
  return g;
}
function plasmaPump() {
  const g = new T.Group();
  for (let h = 0; h < 10; h++) {
    const a = (h / 10) * TAU,
      points = [];
    for (let i = 0; i <= 44; i++) {
      const t = i / 44,
        q = t * TAU * 5;
      points.push(
        V(
          0.19 * Math.cos(a) + 0.022 * Math.cos(q),
          -0.27 + t * 0.54,
          0.14 * Math.sin(a) + 0.022 * Math.sin(q),
        ),
      );
    }
    tube(g, points, 0.019, h % 2 ? "#b49b79" : "#cbb58c", "plasmaPump");
  }
  for (const [p, s, c] of [
    [[0.08, -0.51, 0], [0.24, 0.21, 0.22], "#beaa88"],
    [[-0.2, -0.55, 0.08], [0.16, 0.2, 0.18], "#a9957c"],
    [[0.26, -0.49, 0.08], [0.17, 0.17, 0.16], "#d1bd96"],
  ])
    ball(g, p, s, c, "plasmaPump");
  for (let j = 0; j < 7; j++)
    tube(
      g,
      Array.from({ length: 20 }, (_, i) =>
        V(
          -0.1 + 0.2 * Math.cos((i / 19) * 2.4 + j * 0.4),
          -0.52 + 0.14 * Math.sin((i / 19) * 2.4 + j * 0.4),
          0.19 + 0.012 * j,
        ),
      ),
      0.009,
      "#98896f",
      "plasmaPump",
    );
  tube(
    g,
    [
      [0.4, -0.35, 0.22],
      [0.42, 0, 0.22],
      [0.42, 0.45, 0.22],
    ],
    0.009,
    "#9db4bb",
    "plasmaPump",
  );
  const arrow = addMesh(
    g,
    new T.ConeGeometry(0.039, 0.11, 24),
    "#8daab5",
    "plasmaPump",
  );
  arrow.position.set(0.42, 0.45, 0.22);
  ball(g, [0.42, -0.17, 0.22], [0.04, 0.04, 0.04], "#9fb5c4", "plasmaPump");
  g.userData.landmarks = [
    {
      zh: "ATP供能的细胞质结构域",
      en: "Cytosolic ATP-powered domains",
      position: [-0.2, -0.55, 0.18],
    },
    {
      zh: "H⁺泵向细胞壁侧",
      en: "H+ exported toward the cell wall",
      position: [0.42, 0.45, 0.22],
    },
  ];
  return g;
}
function vacuolarPump() {
  const g = new T.Group();
  const unit = protonPump(g, "vacuolarPump");
  unit.scale.setScalar(0.85);
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    tube(
      g,
      [
        [Math.cos(a) * 0.153, -0.22, Math.sin(a) * 0.153],
        [Math.cos(a) * 0.153, 0.22, Math.sin(a) * 0.153],
      ],
      0.031,
      "#8faab0",
      "vacuolarPump",
    );
  }
  tube(
    g,
    [
      [0.48, 0.3, 0.2],
      [0.48, -0.3, 0.2],
    ],
    0.012,
    "#b8a77c",
    "vacuolarPump",
  );
  const arrow = addMesh(
    g,
    new T.ConeGeometry(0.045, 0.1, 24),
    "#b8a77c",
    "vacuolarPump",
  );
  arrow.rotation.z = Math.PI;
  arrow.position.set(0.48, -0.35, 0.2);
  g.userData.landmarks = [
    {
      zh: "V₁ · 细胞质侧ATP水解",
      en: "V₁ · Cytosolic ATP hydrolysis",
      position: [0, 0.6, 0.15],
    },
    {
      zh: "V₀ · 膜内质子转运",
      en: "V₀ · Membrane proton transport",
      position: [0.15, 0, 0.15],
    },
    {
      zh: "H⁺泵入液泡腔",
      en: "H⁺ pumped into the vacuole",
      position: [0.48, -0.35, 0.2],
    },
  ];
  return g;
}
function membranePatch(id) {
  const g = new T.Group(),
    tonoplast = id === "tonoplast",
    pumpId = tonoplast ? "vacuolarPump" : "plasmaPump";
  const footprints = [
    [-0.59, 0, 0.28],
    [0.61, 0, 0.35],
  ];
  const height = (x, z) => 0.025 * Math.sin(x * 3 + z * 2);
  for (let x = -9; x <= 9; x++)
    for (let z = -5; z <= 5; z++) {
      const px = x * 0.125,
        pz = z * 0.125;
      if (footprints.some(([cx, cz, r]) => Math.hypot(px - cx, pz - cz) < r))
        continue;
      for (const side of [-1, 1]) {
        const y = height(px, pz) + side * 0.21;
        ball(
          g,
          [px, y, pz],
          [0.048, 0.044, 0.048],
          tonoplast
            ? side > 0
              ? "#9fbcbf"
              : "#b9cad0"
            : side > 0
              ? "#a4b896"
              : "#bdc6a2",
          id,
        );
        for (const d of [-1, 1])
          tube(
            g,
            [
              [px + d * 0.022, y - side * 0.04, pz],
              [px + d * 0.025, y - side * 0.11, pz + 0.013],
              [px + d * 0.035, y - side * 0.19, pz - 0.018],
            ],
            0.0105,
            "#bbb699",
            id,
          );
      }
    }
  const pump = tonoplast ? vacuolarPump() : plasmaPump();
  if (!tonoplast) pump.scale.set(0.88, 1, 0.88);
  pump.position.set(-0.59, 0, 0);
  g.add(pump);
  const aq = aquaporin();
  // Preserve membrane-spanning height while fitting the tetramer into its footprint.
  aq.scale.set(0.68, 1, 0.68);
  aq.position.set(0.61, 0, 0);
  g.add(aq);
  g.userData.partAnchors = {
    [pumpId]: [-0.59, tonoplast ? 0.52 : -0.45, 0.1],
    plantAquaporin: [0.61, 0.15, 0.12],
  };
  g.userData.landmarks = [
    {
      zh: tonoplast ? "细胞质侧" : "细胞壁侧",
      en: tonoplast ? "Cytosolic side" : "Cell-wall side",
      position: [-1.12, 0.3, 0.54],
    },
    {
      zh: tonoplast ? "液泡腔侧" : "细胞质侧",
      en: tonoplast ? "Vacuolar lumen" : "Cytosolic side",
      position: [1.1, -0.27, 0.54],
    },
  ];
  g.rotation.set(tonoplast ? 0.48 : -0.4, -0.22, -0.07);
  return g;
}
function cellSap() {
  const g = new T.Group();
  for (let i = 0; i < 36; i++) {
    const a = i * 2.3999,
      r = 0.2 + 0.022 * i;
    const p = [
      Math.cos(a) * r,
      Math.sin(a) * r * 0.9,
      0.28 * Math.sin(i * 1.7),
    ];
    water(g, p, 0.033, "cellSap");
  }
  for (let i = 0; i < 10; i++) {
    const a = i * 2.3999,
      r = 0.52 + i * 0.052;
    ball(
      g,
      [Math.cos(a) * r, Math.sin(a) * r * 0.8, 0.27 * Math.cos(i)],
      [0.07, 0.07, 0.07],
      i % 2 ? "#ac9fc1" : "#a6bd94",
      "cellSap",
    );
  }
  for (const [x, y, z] of [
    [-0.45, -0.4, 0.48],
    [0.48, 0.35, 0.44],
  ]) {
    const points = Array.from({ length: 6 }, (_, k) =>
      V(
        x + Math.cos((k / 6) * TAU) * 0.17,
        y + Math.sin((k / 6) * TAU) * 0.14,
        z + (k % 2 ? 0.025 : -0.025),
      ),
    );
    for (let k = 0; k < 6; k++) {
      tube(g, [points[k], points[(k + 1) % 6]], 0.017, "#b2ae8d", "cellSap");
      ball(
        g,
        points[k].toArray(),
        [0.029, 0.029, 0.029],
        k === 1 ? "#c39586" : "#c3b58f",
        "cellSap",
      );
    }
  }
  g.userData.landmarks = [
    { zh: "水：溶剂", en: "Water: the solvent", position: [-0.7, 0.35, 0.25] },
    { zh: "溶解的离子", en: "Dissolved ions", position: [0.7, -0.4, 0.23] },
    {
      zh: "糖等小分子（示意）",
      en: "Sugars and other small solutes",
      position: [0.48, 0.35, 0.46],
    },
  ];
  return g;
}
export function vacuoleAssembly() {
  const g = new T.Group(),
    r = [1.4, 1.85, 1.04];
  shell(g, r, 0.035, "#88b1ba", "tonoplast", { opacity: 0.3 });
  const section = addMesh(
    g,
    new T.CircleGeometry(1, 112),
    "#bedbe0",
    "cellSap",
    { transparent: true, opacity: 0.22, depthWrite: false },
  );
  section.scale.set(r[0] * Math.sin(1.15), r[1] * Math.sin(1.15), 1);
  section.position.z = r[2] * Math.cos(1.15) - 0.018;
  section.userData.cutOnly = true;
  ball(g, [0, 0, -0.08], [1.32, 1.75, 0.88], "#b8d5db", "cellSap", {
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
  });
  for (let i = 0; i < 52; i++) {
    const a = i * 2.3999,
      z = -0.67 + (i / 51) * 0.92,
      rad = Math.sqrt(Math.max(0, 1 - (z / 0.9) ** 2));
    ball(
      g,
      [Math.cos(a) * 1.12 * rad, Math.sin(a) * 1.53 * rad, z],
      [0.024, 0.024, 0.024],
      i % 3 ? "#9fbec9" : "#b3a9c4",
      "cellSap",
    );
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU,
      p = V(1.38 * Math.cos(a) * 0.93, 1.84 * Math.sin(a) * 0.93, -0.37);
    const m = ball(
      g,
      p.toArray(),
      [0.045, 0.065, 0.05],
      "#7c9f9f",
      "tonoplast",
    );
    m.quaternion.setFromUnitVectors(
      V(0, 1, 0),
      V(p.x / 1.4, p.y / 1.85, p.z).normalize(),
    );
  }
  g.userData.partAnchors = {
    tonoplast: [-1.05, 0.75, 0.4],
    cellSap: [0.25, -0.35, 0.42],
  };
  g.userData.landmarks = [
    {
      zh: "连续的含水细胞液",
      en: "A continuous aqueous cell sap",
      position: [0.38, -0.45, 0.4],
    },
  ];
  g.rotation.set(0.1, -0.16, 0.03);
  return g;
}
export function plantCompartmentDetail(id) {
  if (id === "plantMembrane" || id === "tonoplast") return membranePatch(id);
  if (id === "vacuole") return vacuoleAssembly();
  if (id === "cellSap") return cellSap();
  if (id === "plasmaPump") {
    const g = plasmaPump();
    g.rotation.set(0.25, -0.28, 0);
    return g;
  }
  if (id === "vacuolarPump") {
    const g = vacuolarPump();
    g.rotation.set(0.2, -0.25, 0);
    return g;
  }
  if (id === "plantAquaporin") {
    const g = aquaporin();
    g.rotation.set(0.48, -0.35, 0);
    return g;
  }
  return null;
}
