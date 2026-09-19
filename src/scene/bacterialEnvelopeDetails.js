import * as T from "three";
import { V, TAU, addMesh, ball, tube } from "./specimenGeometry";

function lipid(g, x, z, y, side, id, color = "#a3b9ac") {
  ball(g, [x, y + side * 0.105, z], [0.037, 0.035, 0.037], color, id);
  for (const dx of [-0.015, 0.015])
    tube(
      g,
      [
        [x + dx, y + side * 0.078, z],
        [x + dx, y + side * 0.034, z + 0.012],
        [x + dx * 1.6, y + side * 0.008, z - 0.01],
      ],
      0.008,
      "#bbbc97",
      id,
    );
}
export function lpsMolecule(g = new T.Group(), p = [0, 0, 0], scale = 1) {
  const unit = new T.Group();
  g.add(unit);
  unit.position.set(...p);
  unit.scale.setScalar(scale);
  // Lipid A: disaccharide anchor with six illustrative acyl chains (E. coli example).
  for (const side of [-1, 1]) {
    ball(unit, [side * 0.055, 0.09, 0], [0.06, 0.037, 0.045], "#9faf8b", "lps");
    ball(
      unit,
      [side * 0.117, 0.11, 0],
      [0.022, 0.022, 0.022],
      "#b6a3bb",
      "lps",
    );
    for (let k = 0; k < 3; k++)
      tube(
        unit,
        [
          [side * 0.055 + (k - 1) * 0.031, 0.071, 0],
          [side * 0.058 + (k - 1) * 0.029, -0.02, 0.03 * (k - 1)],
          [side * 0.058 + (k - 1) * 0.04, -0.095, 0.019 * (k - 1)],
        ],
        0.009,
        "#b3b690",
        "lps",
      );
  }
  tube(
    unit,
    [
      [-0.055, 0.09, 0],
      [0.055, 0.09, 0],
    ],
    0.014,
    "#9dac86",
    "lps",
  );
  const core = [
    [0, 0.15, 0],
    [0.015, 0.22, 0.006],
    [-0.023, 0.29, 0.01],
    [0.017, 0.36, 0.008],
  ];
  tube(unit, core, 0.012, "#b5b394", "lps");
  core.forEach((p, i) =>
    ball(unit, p, [0.027, 0.024, 0.024], i % 2 ? "#bdb08d" : "#9db29b", "lps"),
  );
  for (const [y, side] of [
    [0.22, 1],
    [0.29, -1],
  ]) {
    tube(
      unit,
      [
        [0, y, 0],
        [side * 0.063, y + 0.03, 0],
      ],
      0.009,
      "#b5b394",
      "lps",
    );
    ball(
      unit,
      [side * 0.063, y + 0.03, 0],
      [0.024, 0.024, 0.024],
      "#b6a4af",
      "lps",
    );
  }
  // The core and O-antigen are one connected polysaccharide; preserve the
  // connecting glycosidic segment in both the molecule and membrane views.
  const oAntigenStart = V(0.017, 0.4, 0.023);
  tube(unit, [core.at(-1), oAntigenStart], 0.01, "#acae89", "lps");
  for (let i = 0; i < 7; i++) {
    const a = V(
        0.017 + 0.027 * Math.sin(i * 1.3),
        0.4 + i * 0.065,
        0.023 * Math.cos(i),
      ),
      b = V(
        0.017 + 0.027 * Math.sin((i + 1) * 1.3),
        0.4 + (i + 1) * 0.065,
        0.023 * Math.cos(i + 1),
      );
    tube(unit, [a, b], 0.01, "#acae89", "lps");
    ball(
      unit,
      a.toArray(),
      [0.023, 0.023, 0.023],
      i % 2 ? "#c1ba97" : "#aab59b",
      "lps",
    );
  }
  unit.userData.landmarks = [
    {
      zh: "脂质A · 膜内锚点",
      en: "Lipid A · Membrane anchor",
      position: [0, 0.07, 0],
    },
    { zh: "核心寡糖", en: "Core oligosaccharide", position: [0.06, 0.27, 0] },
    {
      zh: "O抗原链（可变）",
      en: "Variable O-antigen chain",
      position: [0, 0.69, 0],
    },
  ];
  return unit;
}
export function porin() {
  const g = new T.Group();
  for (let c = 0; c < 3; c++) {
    const a = (c * TAU) / 3,
      cx = Math.cos(a) * 0.21,
      cz = Math.sin(a) * 0.21;
    for (let j = 0; j < 16; j++) {
      const points = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12,
          b = ((j + 0.7 * t) / 16) * TAU;
        points.push(
          V(cx + 0.17 * Math.cos(b), -0.16 + t * 0.32, cz + 0.17 * Math.sin(b)),
        );
      }
      tube(g, points, 0.016, j % 2 ? "#789e99" : "#9ab6a7", "porin");
      if (j < 15) {
        const top = j % 2 === 0,
          q = points[top ? points.length - 1 : 0],
          b = ((j + 1 + (top ? 0.7 : 0)) / 16) * TAU,
          y = top ? 0.16 : -0.16;
        tube(
          g,
          [
            q,
            V(
              cx + 0.19 * Math.cos(b),
              y + (top ? 0.04 : -0.04),
              cz + 0.19 * Math.sin(b),
            ),
            V(cx + 0.17 * Math.cos(b), y, cz + 0.17 * Math.sin(b)),
          ],
          0.01,
          "#b0bba0",
          "porin",
        );
      }
    }
    tube(
      g,
      [
        [cx + 0.13, 0.04, cz],
        [cx + 0.035, 0, cz + 0.06],
        [cx - 0.04, -0.01, cz + 0.02],
        [cx - 0.1, 0.02, cz - 0.1],
      ],
      0.024,
      "#b9b48a",
      "porin",
    );
  }
  g.userData.landmarks = [
    {
      zh: "三聚体 · 每个桶独立成孔",
      en: "Trimer · One pore per barrel",
      position: [0.21, 0.18, 0],
    },
    {
      zh: "内折环使通道变窄",
      en: "Inward loop narrows the pore",
      position: [0.21, 0, 0.025],
    },
  ];
  g.rotation.set(0.5, -0.2, 0);
  return g;
}
// These selected stems are outside the illustrative cross-link columns (1/5/9).
const lipoproteinSites = [
  [0, 3],
  [0, 7],
  [0, 11],
  [3, 3],
  [3, 7],
  [3, 11],
  [1, 11],
  [2, 11],
];
function peptideStem(row, i) {
  const x = (i - 5.5) * 0.18,
    z = (row - 2) * 0.36;
  return Array.from({ length: 4 }, (_, k) =>
    V(
      x + 0.045 + 0.023 * Math.sin(k * 1.8),
      0.045 + 0.017 * Math.sin(k),
      z + 0.072 + k * 0.054,
    ),
  );
}
export function peptidoglycanPatch({ lipoproteinBound = false } = {}) {
  const g = new T.Group(),
    stems = new Map();
  for (let row = 0; row < 5; row++)
    for (let i = 0; i < 12; i++) {
      const x = (i - 5.5) * 0.18,
        z = (row - 2) * 0.36,
        nam = i % 2 === 1;
      const pts = Array.from({ length: 6 }, (_, k) =>
        V(
          x + 0.059 * Math.cos((k * TAU) / 6),
          0.009 * (k % 2),
          z + 0.051 * Math.sin((k * TAU) / 6),
        ),
      );
      tube(
        g,
        [...pts, pts[0]],
        0.012,
        nam ? "#b9a079" : "#d1c194",
        "peptidoglycan",
      );
      if (i < 11)
        tube(
          g,
          [
            [x + 0.061, 0, z],
            [x + 0.119, 0, z],
          ],
          0.012,
          "#c3b08a",
          "peptidoglycan",
        );
      if (nam) {
        const stem = peptideStem(row, i);
        // Braun Lpp attachment replaces terminal D-Ala4 with its lysine link
        // at mesoDAP3; preserve the generic tetrapeptides in the standalone view.
        // Primary source: https://pmc.ncbi.nlm.nih.gov/articles/PMC1913343/
        if (
          lipoproteinBound &&
          lipoproteinSites.some(([r, column]) => r === row && column === i)
        )
          stem.pop();
        tube(
          g,
          [V(x, 0.01, z + 0.047), ...stem],
          0.01,
          "#98aba1",
          "peptidoglycan",
        );
        stem.forEach((p, k) =>
          ball(
            g,
            p.toArray(),
            [0.022, 0.022, 0.022],
            k === 2 ? "#899f9c" : "#bbc4ae",
            "peptidoglycan",
          ),
        );
        stems.set(`${row}:${i}`, stem);
      }
    }
  for (let row = 0; row < 4; row++)
    for (let i = 1; i < 12; i += 4) {
      const a = stems.get(`${row}:${i}`)[2],
        b = stems.get(`${row + 1}:${i}`)[3];
      tube(
        g,
        [
          a,
          a
            .clone()
            .lerp(b, 0.5)
            .add(V(0.065, 0.06, 0)),
          b,
        ],
        0.012,
        "#829f96",
        "peptidoglycan",
      );
    }
  g.userData.landmarks = [
    {
      zh: "交替的NAG与NAM糖链",
      en: "Alternating NAG–NAM glycan",
      position: [-0.7, 0, -0.72],
    },
    {
      zh: "短肽只连在NAM上",
      en: "Peptide stems attach to NAM",
      position: [0.15, 0.06, 0.2],
    },
    {
      zh: "相邻糖链间的肽交联",
      en: "Peptide cross-link between glycans",
      position: [-0.09, 0.09, 0.55],
    },
  ];
  g.rotation.set(0.44, -0.18, -0.08);
  return g;
}
export function bacterialATPase() {
  const g = new T.Group();
  for (let k = 0; k < 10; k++) {
    const a = (k * TAU) / 10;
    tube(
      g,
      [
        [0.16 * Math.cos(a), -0.14, 0.16 * Math.sin(a)],
        [0.16 * Math.cos(a), 0.13, 0.16 * Math.sin(a)],
      ],
      0.035,
      "#a2b5a6",
      "bacterialATPase",
    );
  }
  // F₀ also includes the stationary a-subunit beside the rotating c-ring.
  // Keep its membrane-spanning body distinct from the peripheral stalk.
  ball(g, [0.245, 0, 0], [0.09, 0.155, 0.13], "#88a8a1", "bacterialATPase");
  tube(
    g,
    [
      [0, 0, 0],
      [0, -0.52, 0],
    ],
    0.035,
    "#b0aa87",
    "bacterialATPase",
  );
  for (let k = 0; k < 6; k++) {
    const a = (k * TAU) / 6;
    ball(
      g,
      [0.18 * Math.cos(a), -0.56, 0.18 * Math.sin(a)],
      [0.11, 0.16, 0.12],
      k % 2 ? "#abbdaf" : "#c1bb98",
      "bacterialATPase",
    );
  }
  tube(
    g,
    [
      [0.23, 0.06, 0],
      [0.3, -0.22, 0.05],
      [0.25, -0.65, 0.03],
    ],
    0.027,
    "#bab58e",
    "bacterialATPase",
  );
  g.userData.landmarks = [
    {
      zh: "F₁头部朝向细胞质",
      en: "F₁ head faces cytoplasm",
      position: [0.17, -0.6, 0.12],
    },
    {
      zh: "F₀位于细胞膜内",
      en: "F₀ lies in the membrane",
      position: [0.16, 0, 0.06],
    },
  ];
  return g;
}
export function bacterialMembranePatch(outer = false) {
  const g = new T.Group(),
    id = outer ? "bacterialOuter" : "bacterialMembrane";
  for (let i = -8; i <= 8; i++)
    for (let j = -5; j <= 5; j++) {
      const x = i * 0.115,
        z = j * 0.115;
      const proteinFootprint = outer
        ? Math.hypot(x, z) < 0.43
        : Math.hypot(x, z) < 0.23 ||
          Math.hypot((x - 0.245) / 0.125, z / 0.16) < 1;
      if (proteinFootprint) continue;
      lipid(g, x, z, 0, -1, id, "#b4c4af");
      if (outer) {
        if (i % 2 === 0 && j % 2 === 0) {
          // Align lipid-A headgroups with the extracellular bilayer surface.
          // Uniformly scaling around y=0 previously buried them toward the
          // bilayer midplane and left their acyl chains visually detached.
          const scale = 0.62,
            headgroupY = 0.105 - 0.09 * scale;
          lpsMolecule(g, [x, headgroupY, z], scale);
        }
      } else lipid(g, x, z, 0, 1, id, "#95b2a7");
    }
  const protein = outer ? porin() : bacterialATPase();
  protein.rotation.set(0, 0, 0);
  g.add(protein);
  g.userData.partAnchors = outer
    ? { lps: [-0.69, 0.31, 0.46], porin: [0.2, 0.17, 0.1] }
    : { bacterialATPase: [0.18, -0.58, 0.1] };
  g.userData.landmarks = [
    {
      zh: outer ? "胞外侧 · LPS外层" : "周质侧",
      en: outer ? "Extracellular · LPS leaflet" : "Periplasmic face",
      position: [-0.91, 0.16, 0.5],
    },
    {
      zh: outer ? "周质侧 · 磷脂内层" : "细胞质侧",
      en: outer ? "Periplasmic · Phospholipid leaflet" : "Cytoplasmic face",
      position: [0.92, -0.15, 0.5],
    },
  ];
  g.rotation.set(outer ? 0.46 : -0.4, -0.23, -0.03);
  return g;
}
export function envelopePatch() {
  const g = new T.Group();
  const outer = bacterialMembranePatch(true);
  outer.rotation.set(0, 0, 0);
  outer.position.y = 0.3;
  outer.traverse((o) => {
    if (o.isMesh) o.userData.hitId = "bacterialOuter";
  });
  g.add(outer);
  const pg = peptidoglycanPatch({ lipoproteinBound: true });
  pg.rotation.set(0, 0, 0);
  pg.scale.setScalar(0.83);
  pg.position.y = 0.075;
  g.add(pg);
  const inner = bacterialMembranePatch(false);
  inner.rotation.set(0, 0, 0);
  inner.position.y = -0.3;
  inner.traverse((o) => {
    if (o.isMesh) o.userData.hitId = "bacterialMembrane";
  });
  g.add(inner);
  // The periplasm is an aqueous compartment, not an exploded-view air gap.
  const periplasm = addMesh(
    g,
    new T.BoxGeometry(1.92, 0.39, 1.22),
    "#afc7c4",
    "bacterialEnvelope",
    { transparent: true, opacity: 0.13, depthWrite: false },
  );
  periplasm.userData.assembledOnly = true;
  periplasm.userData.nonInteractive = true;
  // Selected outer-membrane lipoprotein attachments; not inner-membrane pillars.
  // Anchor to real membrane headgroups and the third residue of NAM peptide
  // stems. Approximate planar endpoints previously stopped in the periplasm.
  for (const [row, i] of lipoproteinSites) {
    const pgAnchor = peptideStem(row, i)[2].multiply(pg.scale).add(pg.position),
      membraneAnchor = V(
        Math.round(pgAnchor.x / 0.115) * 0.115,
        outer.position.y - 0.105,
        Math.round(pgAnchor.z / 0.115) * 0.115,
      );
    const link = tube(
      g,
      [membraneAnchor, pgAnchor],
      0.014,
      "#9ba98f",
      "bacterialOuter",
    );
    link.userData.assembledOnly = true;
  }
  g.userData.partAnchors = {
    bacterialOuter: [-0.7, 0.44, 0.45],
    peptidoglycan: [-0.78, 0.075, 0.48],
    bacterialMembrane: [-0.7, -0.3, 0.47],
  };
  g.userData.landmarks = [
    {
      zh: "周质 · 含肽聚糖的水相空间",
      en: "Periplasm · Aqueous space containing peptidoglycan",
      position: [0.73, -0.08, 0.4],
    },
  ];
  g.rotation.set(0.14, -0.4, -0.08);
  return g;
}
export function bacterialEnvelopeDetail(id) {
  if (id === "bacterialEnvelope") return envelopePatch();
  if (id === "bacterialOuter") return bacterialMembranePatch(true);
  if (id === "bacterialMembrane") return bacterialMembranePatch();
  if (id === "peptidoglycan") return peptidoglycanPatch();
  if (id === "lps") {
    const g = new T.Group();
    lpsMolecule(g);
    g.userData.landmarks = g.children[0].userData.landmarks;
    g.rotation.set(0.1, -0.25, -0.12);
    return g;
  }
  if (id === "porin") return porin();
  if (id === "bacterialATPase") return bacterialATPase();
  return null;
}
