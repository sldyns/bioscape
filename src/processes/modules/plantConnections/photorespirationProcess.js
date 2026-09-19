import { THREE, sceneKit, bilingual as b, clamp, ease } from "../../kit.js";
import { anatomy } from "./anatomy.js";

function create() {
  const k = sceneKit(),
    { group, material, mesh, ball, tube, segment, label } = k;
  const detail = anatomy(k);
  const green = material("#749b77"),
    rose = material("#b18d87"),
    amber = material("#c6ad76");
  const carbonMat = material("#8f6f59"),
    bondMat = material("#bcaa90"),
    phosphateMat = material("#b79d5e");
  detail.chloroplast(group, [-2.55, 0.6, 0], [1.58, 1.45, 0.88]);
  detail.envelope(group, [0.1, -1.48, 0], [1.08, 0.98, 0.84], "#d3c6a1", {
    double: false,
    name: "peroxisome",
  });
  detail.mitochondrion(group, [2.55, 0.58, 0], [1.45, 1.08, 0.78]);
  detail.protein(
    group,
    [-0.25, -1.56, -0.07],
    0.45,
    "#b8a16b",
    "catalase-tetramer",
    4,
  );
  detail.protein(
    group,
    [0.46, -1.93, -0.1],
    0.31,
    "#a99970",
    "hydroxypyruvate-reductase",
    2,
  );
  detail.protein(
    group,
    [0.22, -0.96, -0.05],
    0.28,
    "#b1a47f",
    "glycolate-oxidase",
    4,
  );
  const rubisco = detail.protein(
    group,
    [-3.2, 1.23, -0.03],
    0.35,
    "#859876",
    "Rubisco-large-subunit-ring",
    8,
  );
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ball(
      [Math.cos(a) * 0.35, Math.sin(a) * 0.28, 0.16],
      0.065,
      material("#b3c3a0"),
      rubisco,
    );
  }
  // Distinct GDC component bodies plus a tethered H-protein carrier are a schematic complex.
  const gdc = detail.protein(
    group,
    [2.31, 0.87, -0.04],
    0.36,
    "#a07987",
    "GDC-P-protein",
    2,
  );
  detail.protein(
    group,
    [2.81, 0.99, -0.08],
    0.25,
    "#b0919e",
    "GDC-T-protein",
    2,
  );
  detail.protein(
    group,
    [2.75, 0.6, -0.04],
    0.22,
    "#a5929e",
    "GDC-L-protein",
    2,
  );
  ball([2.43, 0.61, 0.07], 0.075, material("#ceb8a2"));
  tube(
    [
      [2.43, 0.61, 0.07],
      [2.56, 0.72, 0.1],
      [2.66, 0.78, 0.06],
    ],
    0.018,
    material("#b49b8c"),
  );
  const kinase = detail.protein(
    group,
    [-2.17, 1.09, -0.04],
    0.42,
    "#8c9d87",
    "glycerate-kinase-binding-cleft",
    2,
  );
  const kinaseMaterials = [];
  kinase.traverse((o) => {
    if (o.material && !kinaseMaterials.includes(o.material))
      kinaseMaterials.push(o.material);
  });
  // Paired pores mark envelope transport without implying free permeation of the bilayers.
  for (const y of [0.14, 0.56])
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ball(
        [-1.19 + 0.045 * Math.cos(a), y + 0.07 * Math.sin(a), 0.15],
        [0.06, 0.09, 0.1],
        material("#92a685"),
      );
    }
  const atoms = [];
  for (let i = 0; i < 4; i++) {
    const atom = ball([0, 0, 0.44], 0.135, carbonMat);
    atom.userData = { element: "C", trackedCarbon: i };
    atoms.push(atom);
  }
  const bonds = [];
  for (let i = 0; i < 3; i++) bonds.push(mesh(k.cylinder, bondMat));
  const co2O = [ball([0, 0, 0], 0.09, rose), ball([0, 0, 0], 0.09, rose)];
  const ammonia = ball([2.65, 0.58, 0.5], 0.13, material("#859fb2"));
  const donor = new THREE.Group();
  group.add(donor);
  donor.position.set(-3.3, 1, 0.38);
  ball([-0.16, 0, 0], [0.17, 0.11, 0.1], material("#8f98a7"), donor);
  for (let i = 0; i < 2; i++) ball([i * 0.13, 0, 0], 0.07, phosphateMat, donor);
  const phosphate = ball([-3.02, 1, 0.38], 0.08, phosphateMat);
  // Keyframes encode only a tracked 4-carbon pool, with no disappearing carbon.
  const coordinates = [
    [
      0,
      [-2.65, 0.78, 0.44],
      [-2.37, 0.78, 0.44],
      [-2.65, 0.34, 0.44],
      [-2.37, 0.34, 0.44],
    ],
    [
      0.16,
      [-1.75, 0.58, 0.38],
      [-1.47, 0.58, 0.38],
      [-1.76, 0.19, 0.38],
      [-1.48, 0.19, 0.38],
    ],
    [
      0.32,
      [0.04, -1.18, 0.45],
      [0.32, -1.18, 0.45],
      [0.04, -1.65, 0.45],
      [0.32, -1.65, 0.45],
    ],
    [
      0.46,
      [2.22, 0.77, 0.46],
      [2.5, 0.77, 0.46],
      [2.22, 0.31, 0.46],
      [2.5, 0.31, 0.46],
    ],
    [
      0.59,
      [2.27, 0.35, 0.48],
      [2.55, 0.35, 0.48],
      [2.83, 0.35, 0.48],
      [2.78, 1.15, 0.45],
    ],
    [
      0.69,
      [0.02, -1.3, 0.45],
      [0.3, -1.3, 0.45],
      [0.58, -1.3, 0.45],
      [3.62, 1.81, 0.45],
    ],
    [
      0.83,
      [-2.54, 0.58, 0.44],
      [-2.26, 0.58, 0.44],
      [-1.98, 0.58, 0.44],
      [3.87, 2.2, 0.45],
    ],
    [
      1,
      [-2.54, 0.85, 0.44],
      [-2.26, 0.85, 0.44],
      [-1.98, 0.85, 0.44],
      [3.87, 2.2, 0.45],
    ],
  ];
  const a = new THREE.Vector3(),
    d = new THREE.Vector3(),
    axis = new THREE.Vector3(0, 1, 0);
  const setBond = (o, i, j) => {
    a.copy(atoms[i].position);
    d.copy(atoms[j].position).sub(a);
    o.position.copy(a).addScaledVector(d, 0.5);
    o.scale.set(0.038, d.length(), 0.038);
    o.quaternion.setFromUnitVectors(axis, d.normalize());
  };
  const labels = [
    label([-2.65, 2.24, 0.1], "叶绿体 · 基质", "Chloroplast · stroma", 3),
    label([0.12, -2.7, 0.15], "过氧化物酶体", "Peroxisome", 3),
    label([2.65, -0.75, 0.1], "线粒体 · 基质", "Mitochondrion · matrix", 3),
    label([-2.38, 0.12, 0.9], "2 × 2C 碳骨架", "2 × 2C carbon skeletons", 2),
    label(
      [2.5, 1.65, 0.5],
      "2 甘氨酸 → 丝氨酸 + CO₂ + NH₃",
      "2 glycine → serine + CO₂ + NH₃",
      2,
    ),
    label([3.75, 2.48, 0.5], "1C 以 CO₂ 释放", "1C released as CO₂", 2),
    label(
      [-2.48, 1.15, 0.7],
      "GLYK：甘油酸 → 3-PGA",
      "GLYK: glycerate → 3-PGA",
      2,
    ),
    label(
      [0, 2.65, 0.2],
      "4C = 3C 回收 + 1C 释放",
      "4C = 3C recovered + 1C released",
      3,
    ),
  ];
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      functional = parameters.glyk !== "absent";
    const q = !functional && p > 0.83 ? 0.83 : p;
    let key = 0;
    while (key < coordinates.length - 2 && q > coordinates[key + 1][0]) key++;
    const begin = coordinates[key],
      end = coordinates[key + 1],
      t = ease(q, begin[0], end[0]);
    for (let i = 0; i < 4; i++)
      for (let dim = 0; dim < 3; dim++)
        atoms[i].position.setComponent(
          dim,
          begin[i + 1][dim] + (end[i + 1][dim] - begin[i + 1][dim]) * t,
        );
    setBond(bonds[0], 0, 1);
    setBond(bonds[1], 2, 3);
    setBond(bonds[2], 1, 2);
    bonds[1].visible = p < 0.53;
    bonds[2].visible = p >= 0.53;
    for (let i = 0; i < 2; i++) {
      co2O[i].visible = p >= 0.53;
      co2O[i].position.copy(atoms[3].position);
      co2O[i].position.x += (i === 0 ? -1 : 1) * 0.22;
    }
    ammonia.visible = p >= 0.53;
    ammonia.position.set(
      2.74 - 0.8 * ease(p, 0.54, 0.7),
      0.65 + 1.15 * ease(p, 0.54, 0.7),
      0.58,
    );
    const transfer = functional ? ease(p, 0.85, 0.97) : 0;
    phosphate.position.set(
      -3.02 + 1.17 * transfer,
      1 + 0.03 * transfer,
      0.38 + 0.06 * transfer,
    );
    kinase.scale.setScalar(0.42);
    kinaseMaterials.forEach((mat) =>
      mat.color.set(functional ? "#8c9d87" : "#afa9a1"),
    );
    labels[3].active = p < 0.44;
    labels[4].active = p >= 0.43 && p < 0.72;
    labels[5].active = p >= 0.55;
    labels[6].active = p >= 0.78;
    labels[7].active = p >= 0.6;
    labels[6].text = functional
      ? b("GLYK：甘油酸 → 3-PGA", "GLYK: glycerate → 3-PGA")
      : b("缺失 GLYK：甘油酸滞留", "GLYK absent: glycerate remains");
    group.userData = {
      process: "photorespiration",
      structuralDetail:
        "double envelopes with cut rims; thylakoid lumina and stromal lamellae; crista necks; multi-domain enzymes",
      species: "Arabidopsis thaliana",
      scope:
        "4 carbons from two 2-phosphoglycolates; other two 3-PGA products omitted",
      trackedCarbonAtoms: 4,
      carbonConserved: true,
      carbonReleased: p >= 0.59 ? 1 : 0,
      carbonRetained: p >= 0.59 ? 3 : 4,
      carbonReturnedToCalvin: functional && p >= 0.97 ? 3 : 0,
      glyk: functional ? "active" : "absent",
      terminalMetabolite:
        p >= 0.97 && functional
          ? "3-PGA"
          : p >= 0.83
            ? "glycerate"
            : "intermediate",
      mainRoute: [
        "chloroplast",
        "peroxisome",
        "mitochondrion",
        "peroxisome",
        "chloroplast",
      ],
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 2.3, 11.8], target: [0, 0, 0] },
  };
}
export default {
  id: "photorespiration",
  title: b("光呼吸的三细胞器碳回收", "Photorespiratory carbon recovery"),
  duration: 36,
  intro: b(
    "拟南芥绿色叶肉细胞的主要 C₂ 回收途径。跟踪两次 Rubisco 氧合产生的两份 2-磷酸乙醇酸，共 4 个碳；同时形成的两份 3-PGA 不在跟踪池内。棕色球只代表碳骨架，酶、转运及辅因子作适度简化；胞质旁路未绘出。",
    "The main C₂ salvage route in an Arabidopsis green mesophyll cell. Four carbons are tracked from two 2-phosphoglycolates produced by two Rubisco oxygenations; the two accompanying 3-PGA molecules are outside this tracked pool. Brown spheres represent carbon skeletons only; enzymes, transport, and cofactors are simplified. Cytosolic bypasses are omitted.",
  ),
  controls: [
    {
      id: "glyk",
      label: b("末步甘油酸激酶", "Final glycerate kinase step"),
      default: "active",
      options: [
        { value: "active", label: b("GLYK 正常", "GLYK active") },
        { value: "absent", label: b("GLYK 缺失", "GLYK absent") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b(
        "氧合产生待回收的 2C 产物",
        "Oxygenation creates a 2C salvage substrate",
      ),
      description: b(
        "每次 Rubisco 氧合产生一份 3-PGA 和一份 2-磷酸乙醇酸。本模型从两份 2C 产物开始，先在叶绿体脱去磷酸。",
        "Each Rubisco oxygenation yields one 3-PGA and one 2-phosphoglycolate. This model begins with two 2C products, dephosphorylated in the chloroplast.",
      ),
    },
    {
      at: 0.17,
      title: b("乙醇酸进入过氧化物酶体", "Glycolate reaches the peroxisome"),
      description: b(
        "乙醇酸被氧化成乙醛酸，再经氨基转移形成甘氨酸；副产 H₂O₂ 由过氧化氢酶处理。两个碳骨架均保留。",
        "Glycolate is oxidized to glyoxylate and transaminated to glycine; catalase handles the H₂O₂ by-product. Both 2C skeletons remain intact.",
      ),
    },
    {
      at: 0.36,
      title: b("两份甘氨酸进入线粒体", "Two glycines enter the mitochondrion"),
      description: b(
        "甘氨酸通过膜转运到线粒体基质，接近甘氨酸脱羧酶复合体和丝氨酸羟甲基转移酶。",
        "Membrane transport brings glycine into the mitochondrial matrix for glycine decarboxylase and serine hydroxymethyltransferase.",
      ),
    },
    {
      at: 0.51,
      title: b("4C 分为 3C 与 1C", "Four carbons become three plus one"),
      description: b(
        "两份甘氨酸净形成一份 3C 丝氨酸，释放一份 CO₂ 和氨。氨需重新同化；所需氮循环和还原力未逐项绘出。",
        "Two glycines yield one 3C serine, one CO₂, and ammonia overall. Ammonia must be reassimilated; the nitrogen cycle and reducing equivalents are not drawn in full.",
      ),
    },
    {
      at: 0.65,
      title: b("丝氨酸返回过氧化物酶体", "Serine returns to the peroxisome"),
      description: b(
        "经氨基转移与羟基丙酮酸还原形成甘油酸。三个保留的碳继续一起移动。",
        "Transamination and hydroxypyruvate reduction produce glycerate. The three retained carbons continue together.",
      ),
    },
    {
      at: 0.8,
      title: b(
        "返回叶绿体并消耗 ATP",
        "Return to the chloroplast and consume ATP",
      ),
      description: b(
        "甘油酸进入叶绿体，GLYK 消耗 ATP 将其磷酸化为 3-PGA。缺失 GLYK 时最后转化受阻，甘油酸不能按此途径补回循环。",
        "Glycerate enters the chloroplast, where GLYK uses ATP to produce 3-PGA. Without GLYK, this final conversion fails and glycerate cannot replenish the cycle by this route.",
      ),
    },
    {
      at: 0.96,
      title: b("碳守恒与回收代价", "Carbon balance and salvage cost"),
      description: b(
        "正常情况下，跟踪的 4C 中 3C 回到 Calvin 循环，1C 作为 CO₂ 释放。该途径是耗能回收，不是额外的固碳或 ATP 生成过程。",
        "Normally, 3 of the tracked 4 carbons return to the Calvin cycle and 1 is released as CO₂. This is energy-consuming salvage, not additional carbon fixation or ATP generation.",
      ),
    },
  ],
  sources: [
    {
      title:
        "PLGG1 is required for photorespiration and chloroplast glycolate/glycerate transport (2013)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3581909/",
    },
    {
      title:
        "D-glycerate 3-kinase completes the Arabidopsis photorespiratory cycle (2005)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1182498/",
    },
  ],
  create,
};
