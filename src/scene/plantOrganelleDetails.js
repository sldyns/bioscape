import * as T from "three";
import { V, TAU, ball, tube, setHit } from "./specimenGeometry";
import { implicitMembrane, splitSection } from "./implicitMembrane";
import { addMesh } from "./specimenGeometry";
import { nucleusAssembly } from "./nucleusAssembly";
import { rawMitochondrion } from "./mitochondriaDetails";
import { ribosomeBody } from "./ribosomeDetails";
import { golgiAssembly } from "./golgiDetails";
import { duplex } from "./plantStromaDetails";

export function plantNucleus() {
  const g = nucleusAssembly();
  // Shape varies by cell state; the peripheral nucleus is mildly flattened here.
  g.scale.set(1, 0.92, 0.78);
  g.userData.landmarks = [
    {
      zh: "核被膜内侧的支持网络（示意）",
      en: "Inner-envelope support network (schematic)",
      position: [-0.69, -0.35, 0.32],
    },
  ];
  return g;
}
export function plantMitochondrion() {
  const g = rawMitochondrion({ includeDNA: false });
  g.traverse((o) => {
    if (o.isMesh)
      o.userData.hitId = ["cristae", "atpSynthase"].includes(o.userData.hitId)
        ? "mitoInner"
        : o.userData.hitId === "matrix"
          ? "plantMatrix"
          : o.userData.hitId;
  });
  duplex(
    g,
    Array.from({ length: 36 }, (_, i) => {
      const t = (i / 35) * TAU * 1.3;
      return V(
        0.08 + 0.09 * Math.sin(t),
        -0.29 + 0.034 * Math.cos(t),
        0.06 + 0.019 * Math.sin(t * 1.7),
      );
    }),
    "plantMatrix",
    0.005,
  );
  g.userData.partAnchors = {
    mitoOuter: [-0.26, 0.38, 0],
    mitoInner: [0.22, 0, 0.04],
    plantMatrix: [0.1, -0.29, 0.06],
  };
  g.userData.landmarks = [
    { zh: "膜间隙", en: "Intermembrane space", position: [-0.244, 0, 0] },
  ];
  return g;
}
export function plantER({ ribosomes = true } = {}) {
  const g = new T.Group(),
    samples = [{ p: [-0.72, 0, 0], r: [0.63, 0.68, 0.08] }];
  const junctions = [
    [-0.42, -0.42, 0],
    [0.2, -0.63, 0.03],
    [0.87, -0.45, 0.02],
    [1.25, 0.1, 0.04],
    [0.65, 0.59, 0],
    [-0.07, 0.57, 0.02],
    [0.13, 0.03, 0.04],
    [0.74, 0.06, 0.02],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
    [0, 6],
    [5, 6],
    [6, 7],
    [7, 2],
    [7, 4],
  ];
  for (const [a, b] of edges)
    for (let i = 0; i <= 32; i++) {
      const t = i / 32,
        p = junctions[a].map((v, k) => v + (junctions[b][k] - v) * t);
      p[2] += 0.025 * Math.sin(t * Math.PI);
      samples.push({ p, r: [0.067, 0.067, 0.056] });
    }
  for (const [layer, geo] of implicitMembrane(
    samples,
    [1.5, 0.87, 0.22],
    112,
    250000,
  ).entries())
    for (const [cap, part] of splitSection(geo, (p) => p[2] - 0.012).entries())
      addMesh(
        g,
        part,
        layer ? "#c7b8d0" : "#aa98b8",
        "plantCisternae",
      ).userData.cap = Boolean(cap);
  if (ribosomes) {
    const template = ribosomeBody({ detail: false });
    for (let i = 0; i < 22; i++) {
      const a = i * 2.3999,
        r = Math.sqrt((i + 0.5) / 22),
        x = -0.72 + Math.cos(a) * 0.52 * r,
        y = Math.sin(a) * 0.55 * r,
        z = 0.082 * Math.sqrt(Math.max(0.1, 1 - r * r * 0.75));
      const rbo = setHit(template.clone(true), "plantRibosome");
      rbo.position.set(x, y, z + 0.035);
      rbo.scale.setScalar(0.042);
      rbo.rotation.set(0.1, i * 0.6, 0);
      g.add(rbo);
    }
  }
  g.userData.partAnchors = {
    plantCisternae: [0.75, 0.08, 0.06],
    plantRibosome: [-0.75, 0.32, 0.11],
  };
  g.userData.landmarks = [
    {
      zh: "相通的膜囊与管网",
      en: "Connected cisterna and tubules",
      position: [-0.33, -0.41, 0.04],
    },
    {
      zh: "多边形网眼是细胞质",
      en: "Polygonal openings contain cytosol",
      position: [0.4, 0.26, 0.04],
    },
  ];
  g.rotation.set(0.24, -0.22, -0.09);
  return g;
}
function plantMatrix() {
  const g = new T.Group();
  // Multilobed enzyme silhouettes, water, and a local DNA segment are distinct.
  for (let j = 0; j < 6; j++) {
    const a = j * 2.3999,
      x = Math.cos(a) * (0.48 + j * 0.035),
      y = Math.sin(a) * (0.48 + j * 0.035),
      z = 0.15 * Math.sin(j);
    for (let k = 0; k < 4; k++)
      ball(
        g,
        [
          x + 0.09 * Math.cos((k * TAU) / 4),
          y + 0.07 * Math.sin((k * TAU) / 4),
          z,
        ],
        [0.115, 0.085, 0.08],
        k % 2 ? "#b6ad8a" : "#9aa98e",
        "plantMatrix",
      );
  }
  duplex(
    g,
    Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      return V(
        -0.46 + t * 0.92,
        0.16 * Math.sin(t * TAU),
        0.35 + 0.07 * Math.cos(t * Math.PI),
      );
    }),
    "plantMatrix",
    0.019,
  );
  for (let i = 0; i < 25; i++) {
    const a = i * 2.3999;
    ball(
      g,
      [Math.cos(a) * 0.8, Math.sin(a) * 0.7, 0.14 * Math.sin(i)],
      [0.02, 0.02, 0.02],
      "#a8bcc5",
      "plantMatrix",
    );
  }
  g.userData.landmarks = [
    {
      zh: "代谢酶轮廓",
      en: "Metabolic enzyme silhouettes",
      position: [0.49, 0, 0],
    },
    {
      zh: "DNA片段 · 非完整基因组",
      en: "DNA segment · Not a full genome",
      position: [0.15, 0.1, 0.42],
    },
    {
      zh: "水和小分子标记",
      en: "Water and small-solute markers",
      position: [0.8, 0, 0],
    },
  ];
  return g;
}
export function plantOrganelleDetail(id) {
  if (id === "plantNucleus") return plantNucleus();
  if (id === "plantMitochondria") return plantMitochondrion();
  if (id === "plantMatrix") return plantMatrix();
  if (id === "plantER") return plantER();
  if (id === "plantCisternae") {
    const g = plantER({ ribosomes: false }),
      landmarks = g.userData.landmarks;
    setHit(g, id);
    g.userData.landmarks = landmarks;
    return g;
  }
  if (id === "plantGolgi") {
    const g = golgiAssembly();
    g.userData.landmarks = [
      ...(g.userData.landmarks || []),
      {
        zh: "植物细胞中的一个高尔基堆叠",
        en: "One Golgi stack in a plant cell",
        position: [0, 0.45, 0.25],
      },
    ];
    return g;
  }
  return null;
}
