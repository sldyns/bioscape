import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";

import {
  helix,
  betaSheet,
  kinaseFold,
  membraneWall,
  rearShell,
  chromatinFiber,
  poreComplex,
  materialInventory,
} from "./structuralKit.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  group.name = "Mammalian PDGFR–Ras–ERK membrane-to-nucleus model";
  const membrane = k.material("#9cb8b0"),
    tail = k.material("#aab8a8");
  for (let i = 0; i < 33; i++)
    for (const side of [-1, 1]) {
      const x = -3.6 + i * 0.225;
      k.ball([x, 1.5 + side * 0.16, 0], [0.105, 0.08, 0.2], membrane);
      k.segment([x, 1.5 + side * 0.11, 0], [x + 0.045, 1.5, 0], 0.022, tail);
    }
  membraneWall(
    k,
    group,
    Array.from({ length: 65 }, (_, i) => [-3.7 + (i * 7.4) / 64, 1.5, 0]),
    k.material("#a8b9ad"),
    { thickness: 0.26, depth: 0.19 },
  );
  const recMat = k.material("#638f98"),
    phosphateMat = k.material("#d5a453");
  const receptors = [],
    phosphates = [];
  for (let i = 0; i < 2; i++) {
    const r = new THREE.Group();
    group.add(r);
    receptors.push(r);
    k.segment([0, 1.18, 0], [0, 1.84, 0], 0.07, recMat, r);
    helix(
      k,
      r,
      [0, 1.51, 0.22],
      0.45,
      0.064,
      k.material("#94b6bc"),
      5,
      "y",
      0.023,
    );
    for (let d = 0; d < 5; d++) {
      const domain = new THREE.Group();
      r.add(domain);
      domain.position.set(0.07 * Math.sin(d), 1.83 + d * 0.15, 0.03);
      k.ball(
        [0, 0, 0],
        [0.15, 0.11, 0.12],
        d % 2 ? recMat : k.material("#7ca0aa"),
        domain,
      );
      betaSheet(k, domain, [0, 0, 0.13], 0.16, k.material("#bad1cf"), 3);
    }
    const catalytic = kinaseFold(k, r, recMat, 0.85);
    catalytic.position.set(0, 0.72, 0.03);
    k.ball([0.15, 0.57, -0.02], [0.18, 0.21, 0.17], recMat, r);
    k.ball([0, 0.75, 0], [0.22, 0.29, 0.18], recMat, r);
    k.tube(
      [
        [0, 0.7, 0],
        [0.14, 0.46, 0.04],
        [0.04, 0.21, 0.02],
      ],
      0.047,
      recMat,
      r,
    );
    for (let j = 0; j < 2; j++)
      phosphates.push(
        k.ball([0.14, 0.43 - j * 0.18, 0.16], 0.065, phosphateMat, r),
      );
  }
  const ligand = new THREE.Group();
  group.add(ligand);
  k.ball([-0.17, 0, 0], [0.25, 0.16, 0.18], k.material("#c2947a"), ligand);
  k.ball([0.17, 0, 0], [0.25, 0.16, 0.18], k.material("#c2947a"), ligand);
  const adaptor = new THREE.Group();
  group.add(adaptor);
  k.mesh(
    new THREE.BoxGeometry(0.3, 0.17, 0.22),
    k.material("#a19aa8"),
    [0, 0, 0],
    adaptor,
  );
  k.ball([0.55, 0.4, 0], [0.34, 0.24, 0.23], k.material("#8d849b"), adaptor);
  k.segment([0.1, 0, 0], [0.4, 0.3, 0], 0.045, k.material("#8d849b"), adaptor);
  const rasMat = k.material("#748c89");
  const ras = k.ball([-0.52, 1.01, 0], [0.27, 0.2, 0.2], rasMat);
  ras.name = "Ras-GTPase";
  adaptor.name = "Grb2-SOS";
  k.segment([-0.52, 1.21, 0], [-0.52, 1.36, 0], 0.04, rasMat);
  const nucleotide = k.ball([-0.31, 1.02, 0.14], 0.08, phosphateMat);
  const gdp = k.ball([-0.31, 1.02, 0.14], 0.08, k.material("#a8b5a1"));
  gdp.name = "Ras-GDP";
  const enzymes = [];
  for (const [name, color, x, y] of [
    ["Raf", "#9b8caa", 0.1, 0.05],
    ["MEK", "#9ca989", 1, -0.55],
    ["ERK", "#bd9c7e", 0.9, -1.55],
  ]) {
    const e = new THREE.Group();
    group.add(e);
    e.name = name;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    k.ball([-0.13, 0.05, 0], [0.26, 0.21, 0.23], mat, e);
    k.ball([0.14, -0.06, 0.01], [0.2, 0.28, 0.2], mat, e);
    kinaseFold(k, e, mat, 1.15);
    const badge = k.ball([0, 0.25, 0.12], 0.065, phosphateMat, e);
    enzymes.push({ e, mat, base: new THREE.Color(color), badge, x, y });
  }
  const nucleusMat = k.material("#afb0c3", {
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  // An open cutaway shell lets the nuclear side and pore remain visible.
  const nucleus = k.mesh(
    new THREE.SphereGeometry(
      1,
      40,
      24,
      0,
      Math.PI * 2,
      0.2,
      Math.PI - 0.2,
    ).rotateZ(Math.PI / 2),
    nucleusMat,
    [2.65, -1.5, -0.12],
  );
  nucleus.scale.set(1.1, 1.2, 0.7);
  const rim = k.ring([2.65, -1.5, 0.05], 1.08, 0.045, k.material("#999caf"));
  rim.scale.y = 1.1;
  const pore = k.ring([1.59, -1.38, 0.12], 0.18, 0.048, k.material("#7f8e9c"));
  pore.rotation.y = Math.PI / 2;
  for (let i = 0; i < 2; i++)
    k.tube(
      Array.from({ length: 18 }, (_, j) => [
        2.12 + j * 0.055,
        -1.6 + 0.14 * Math.sin(j * 0.7 + i * Math.PI),
        0.1 + i * 0.09,
      ]),
      0.035,
      k.material("#8a87a7"),
    );
  const tf = k.mesh(
    new THREE.BoxGeometry(0.22, 0.25, 0.2),
    k.material("#a2ae90"),
    [2.37, -1.22, 0.1],
  );
  const tfMark = k.ball([2.37, -1.04, 0.19], 0.075, phosphateMat);
  const transcript = k.tube(
    [
      [2.5, -1.65, 0.15],
      [2.65, -1.9, 0.2],
      [2.92, -1.75, 0.24],
      [3.11, -1.95, 0.22],
    ],
    0.04,
    k.material("#b88773"),
  );
  transcript.geometry.translate(-2.5, 1.65, -0.15);
  transcript.position.set(2.5, -1.65, 0.15);
  const rear = rearShell(
    k,
    group,
    [2.65, -1.5, -0.12],
    [1.08, 1.18, 0.69],
    "#b6b1c6",
    0.65,
  );
  const innerRear = rearShell(
    k,
    group,
    [2.65, -1.5, -0.12],
    [1.015, 1.115, 0.62],
    "#cbc4d2",
    0.36,
  );
  const doubleRim = k.ring(
    [2.65, -1.5, 0.045],
    1.02,
    0.019,
    k.material("#bab2c5"),
  );
  doubleRim.scale.y = 1.105;
  const nuclearPore = poreComplex(k, group, [1.59, -1.38, 0.12], 0.19);
  nuclearPore.rotation.y = Math.PI / 2;
  chromatinFiber(
    k,
    group,
    Array.from({ length: 18 }, (_, i) => [
      2.58 + 0.62 * Math.cos(i * 0.65),
      -1.63 + 0.67 * Math.sin(i * 0.65),
      -0.03 + 0.05 * Math.sin(i),
    ]),
    0.035,
  );
  // A small promoter helix at the active factor retains visible paired strands.
  for (let i = 0; i < 13; i++)
    k.segment(
      [2.13 + i * 0.068, -1.6 + 0.12 * Math.sin(i * 0.74), 0.11],
      [2.13 + i * 0.068, -1.6 - 0.12 * Math.sin(i * 0.74), 0.22],
      0.012,
      k.material("#c4b8cc"),
    );
  betaSheet(k, adaptor, [0, 0.02, 0.14], 0.19, k.material("#c4bdcd"), 3);
  helix(
    k,
    adaptor,
    [0.56, 0.39, 0.22],
    0.4,
    0.06,
    k.material("#b4a8bd"),
    4,
    "x",
    0.019,
  );
  // Small GTPase: one nucleotide-binding domain and two switch loops, not kinase lobes.
  for (const y of [-0.15, 0.15])
    k.tube(
      [
        [-0.6, 1 + y, 0.16],
        [-0.49, 1 + y * 0.45, 0.21],
        [-0.34, 1 + y * 0.6, 0.17],
      ],
      0.018,
      k.material("#c4c0b8"),
    );
  nucleotide.name = "Ras-nucleotide";
  const sosContact = k.ball(
    [0.65, 0.53, 0.015],
    0.08,
    k.material("#b4a8bd"),
    adaptor,
  );
  sosContact.name = "SOS-catalytic-contact";
  k.segment(
    [0.55, 0.4, 0.015],
    [0.65, 0.53, 0.015],
    0.047,
    k.material("#b4a8bd"),
    adaptor,
  );
  const activeColor = new THREE.Color("#d4a15b");
  const labels = [
    k.label([-2.9, 2.9, 0], "细胞外 · PDGF", "Extracellular · PDGF", 2),
    k.label([-3.2, 1.1, 0], "胞质侧", "Cytosolic side", 2),
    k.label([-1.8, 2.35, 0], "PDGF 受体", "PDGF receptor", 2),
    k.label([-0.32, 1.02, 0.3], "膜锚定 Ras", "Membrane-anchored Ras", 2),
    k.label([-0.1, -0.48, 0.15], "Raf", "Raf"),
    k.label([1.05, -0.9, 0.15], "MEK", "MEK"),
    k.label([0.6, -2.05, 0.15], "ERK", "ERK"),
    k.label([2.67, -2.91, 0], "细胞核", "Nucleus", 2),
    k.label([-1.65, -0.1, 0.2], "Grb2–SOS", "Grb2–SOS"),
  ];
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      ligandPresent = parameters.condition !== "noLigand";
    const functional = parameters.condition !== "kinaseInactive";
    const bind = ligandPresent ? ease(p, 0.02, 0.23) : 0,
      on = ligandPresent && functional;
    receptors[0].position.x = -2.55 + 0.63 * bind;
    receptors[1].position.x = -0.75 - 0.63 * bind;
    ligand.visible = ligandPresent;
    ligand.position.set(-1.65, 3.05 - 0.72 * bind, 0);
    phosphates.forEach((m) => (m.visible = on && p >= 0.27));
    const dock = on ? ease(p, 0.28, 0.42) : 0;
    adaptor.position.set(-1.1 - 0.18 * dock, -0.65 + 0.98 * dock, 0.06);
    rasMat.color.set(on && p >= 0.43 ? "#d4a15b" : "#748c89");
    const exchange = on ? ease(p, 0.415, 0.43) : 0;
    gdp.visible = exchange < 0.99;
    gdp.position.set(-0.31 + 0.35 * exchange, 1.02 - 0.35 * exchange, 0.14);
    nucleotide.visible = on && p >= 0.42;
    const gtpArrival = on ? ease(p, 0.42, 0.43) : 0;
    nucleotide.position.set(
      -0.1 - 0.21 * gtpArrival,
      0.7 + 0.32 * gtpArrival,
      0.14,
    );
    enzymes.forEach((e, i) => {
      e.e.position.set(e.x, e.y, 0);
      e.e.rotation.z = 0;
      e.mat.color
        .copy(e.base)
        .lerp(activeColor, on ? ease(p, 0.47 + i * 0.12, 0.53 + i * 0.12) : 0);
      e.badge.visible = on && p >= 0.52 + i * 0.12;
    });
    const rafDock = on ? ease(p, 0.43, 0.51) : 0;
    enzymes[0].e.position.set(0.1 - 0.57 * rafDock, 0.05 + 0.56 * rafDock, 0);
    const erkImport = on ? ease(p, 0.78, 0.9) : 0;
    enzymes[2].e.position.set(
      0.9 + 1.19 * erkImport,
      -1.55 + 0.17 * erkImport,
      0.08,
    );
    tfMark.visible = on && p >= 0.91;
    tf.scale.y = 1 + (on ? ease(p, 0.9, 0.94) * 0.18 : 0);
    transcript.visible = on && p >= 0.94;
    transcript.scale.setScalar(Math.max(0.001, ease(p, 0.93, 1)));
    labels[6].position[0] = 0.6 + 1.2 * erkImport;
    labels[8].active = p >= 0.25;
    group.userData = {
      mechanism: "PDGFR–Grb2–SOS–Ras–Raf–MEK–ERK",
      organism: "mammalian",
      condition: parameters.condition || "ligand",
      ligandSide: "extracellular",
      rasMembraneAnchored: true,
      receptorDimerized: bind > 0.98,
      receptorPhosphorylated: on && p >= 0.27,
      rasActive: on && p >= 0.43,
      erkNuclear: on && p >= 0.9,
      transcriptionalResponse: on && p >= 0.94,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    science: { ras, adaptor, sosContact, nucleotide },
    materials: materialInventory(group),
    camera: { position: [0, 1.4, 11.6], target: [0, 0, 0] },
  };
}
export default {
  id: "signalTransduction",
  title: B("RTK–Ras–MAPK 信号", "RTK–Ras–MAPK signaling"),
  duration: 32,
  intro: B(
    "哺乳动物 PDGF 受体的简化路线：配体在细胞外结合，胞质激酶级联把信息传到细胞核。比较无配体和受体激酶失活；形状与时间不按比例，其他分支与反馈省略。",
    "A simplified mammalian PDGF-receptor pathway: extracellular binding initiates a cytosolic kinase relay to the nucleus. Compare absent ligand and inactive receptor kinase. Shapes and timing are schematic; other branches and feedback are omitted.",
  ),
  controls: [
    {
      id: "condition",
      label: B("受体条件", "Receptor condition"),
      default: "ligand",
      options: [
        {
          value: "ligand",
          label: B("PDGF + 功能受体", "PDGF + functional receptor"),
        },
        { value: "noLigand", label: B("无 PDGF", "No PDGF") },
        {
          value: "kinaseInactive",
          label: B("受体激酶失活", "Inactive receptor kinase"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("胞外识别", "Extracellular recognition"),
      description: B(
        "PDGF 二聚体靠近跨膜受体；配体不穿过脂质双层。无配体条件下，模型停留在未激活状态。",
        "Dimeric PDGF approaches transmembrane receptors without crossing the lipid bilayer. Without ligand, this model remains inactive.",
      ),
    },
    {
      at: 0.23,
      title: B("二聚与磷酸化", "Dimerization and phosphorylation"),
      description: B(
        "配体促使受体靠拢，胞质激酶在受体尾部形成磷酸化位点。激酶失活时仍可结合配体，但不建立下游对接位点。",
        "Ligand brings receptors together; cytosolic kinases phosphorylate receptor tails. Kinase-inactive receptors can bind ligand but do not establish downstream docking sites.",
      ),
    },
    {
      at: 0.36,
      title: B("连接到膜上的 Ras", "Coupling to membrane-bound Ras"),
      description: B(
        "Grb2 衔接蛋白招募 SOS；SOS 促进 Ras 释放 GDP 并结合 GTP。Ras 始终锚定在细胞膜内侧。",
        "Grb2 recruits SOS, which promotes GDP release and GTP binding by Ras. Ras remains anchored to the inner face of the plasma membrane.",
      ),
    },
    {
      at: 0.51,
      title: B("Raf → MEK → ERK", "Raf → MEK → ERK"),
      description: B(
        "活化 Ras 招募并激活 Raf，随后依次激活 MEK 和 ERK。金色小标记示意磷酸化，不代表实际磷酸数目。",
        "Active Ras recruits and activates Raf, followed by MEK and ERK activation. Gold markers indicate phosphorylation, not exact phosphate counts.",
      ),
    },
    {
      at: 0.78,
      title: B("ERK 进入细胞核", "ERK enters the nucleus"),
      description: B(
        "活化 ERK 可通过核孔进入细胞核并调节转录因子；这条路线不会让胞外配体进入细胞核。",
        "Active ERK can enter through nuclear pores and regulate transcription factors; the extracellular ligand remains outside the cell.",
      ),
    },
    {
      at: 0.93,
      title: B("调节基因表达", "Regulating gene expression"),
      description: B(
        "核内靶蛋白的磷酸化可改变即时早期基因表达。结果取决于细胞类型与信号时程，不等同于必然发生细胞分裂。",
        "Phosphorylation of nuclear targets can alter immediate-early gene expression. Outcomes depend on cell type and signal duration and do not guarantee cell division.",
      ),
    },
  ],
  sources: [
    {
      title: "Ras-SOS exchange complex (PDB 1BKD)",
      url: "https://www.rcsb.org/structure/1BKD",
    },
    {
      title: "Nucleosome core particle (PDB 1AOI)",
      url: "https://www.rcsb.org/structure/1AOI",
    },
    {
      title:
        "Molecular Biology of the Cell — Signaling through Enzyme-Linked Cell-Surface Receptors",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26822/",
    },
  ],
  create,
};
