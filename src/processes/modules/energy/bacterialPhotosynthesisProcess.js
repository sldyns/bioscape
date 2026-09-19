import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { energyDetails } from "./detailKit.js";
function create() {
  const k = sceneKit(),
    { group, material, ball, segment, label } = k;
  const details = energyDetails(k);
  const lipid = material("#9cb8a1"),
    tail = material("#c4d4bc"),
    psMat = material("#769d87"),
    b6 = material("#b49880"),
    antennaMat = material("#6f98b4");
  const hMat = material("#d2a45e"),
    eMat = material("#80bac6"),
    atpMat = material("#ac95b9"),
    photonMat = material("#dfbd6c", {
      emissive: "#c59736",
      emissiveIntensity: 0.3,
    });
  const lumen = material("#c5d9cc", {
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  k.mesh(new THREE.BoxGeometry(8.1, 1.48, 1.58), lumen, [0, -0.39, -0.15]);
  details.bilayer({
    length: 8.5,
    depth: 1.6,
    y: 0.4,
    holes: [
      [-2.9, 0, 0.7, 0.5],
      [-0.83, 0, 0.55, 0.5],
      [0.95, 0, 0.8, 0.6],
      [3.42, 0, 0.65, 0.48],
    ],
  });
  details.bilayer({ length: 8.5, depth: 1.6, y: -1.15 });
  // Curved rim layers preserve a closed sac silhouette around the exposed lumen.
  for (const side of [-1, 1])
    for (const delta of [-0.12, 0.12])
      for (const z of [-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78]) {
        const points = Array.from({ length: 25 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 24;
          return [
            side * (4.25 + (0.775 + delta) * Math.cos(a)),
            -0.375 + (0.775 + delta) * Math.sin(a),
            z,
          ];
        });
        k.tube(points, 0.055, lipid, group, 32);
      }
  // Cyanobacterial PSII antenna is a cytoplasmic phycobilisome, not plant LHCII.
  const psii = new THREE.Group();
  group.add(psii);
  psii.position.set(-2.9, 0.4, 0);
  for (const x of [-0.28, 0.28]) {
    details.bundle(psii, [x, 0, 0], [1.05, 0.86, 1.1], psMat, 7);
    details.fold(
      psii,
      [x, -0.36, 0.05],
      [0.62, 0.45, 0.68],
      material("#ab9c81"),
    );
  }
  // Three basal core cylinders and five tiered rods, with resolved disks and
  // central channels. Repeated disks share torus and radial-sector geometry.
  const diskGeo = new THREE.TorusGeometry(0.14, 0.046, 8, 24);
  const sectorGeo = new THREE.SphereGeometry(1, 12, 8);
  const pbsAccent = material("#91b4c5");
  function disk(parent, pos, angle) {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.rotation.z = angle;
    parent.add(g);
    const m = k.mesh(diskGeo, antennaMat, [0, 0, 0], g);
    m.rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const o = k.mesh(
        sectorGeo,
        i % 2 ? antennaMat : pbsAccent,
        [0.14 * Math.cos(a), 0, 0.14 * Math.sin(a)],
        g,
      );
      o.scale.set(0.07, 0.045, 0.07);
    }
    return g;
  }
  for (const x of [-0.32, 0, 0.32])
    for (let level = 0; level < 2; level++)
      disk(psii, [x, 0.46 + level * 0.13, 0], 0);
  for (let rod = 0; rod < 5; rod++) {
    const a = (rod - 2) * 0.48;
    for (let tier = 0; tier < 4; tier++)
      disk(
        psii,
        [
          Math.sin(a) * (0.43 + tier * 0.19),
          0.66 + Math.cos(a) * tier * 0.19,
          -0.03,
        ],
        -a,
      );
  }
  for (const x of [-1.04, -0.63]) {
    details.bundle(group, [x, 0.4, 0], [0.9, 0.96, 1], b6, 7);
    details.fold(group, [x, -0.03, -0.01], [0.6, 0.45, 0.7], b6);
  }
  const psi = new THREE.Group();
  group.add(psi);
  psi.position.set(0.95, 0.4, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const x = 0.32 * Math.cos(a),
      z = 0.32 * Math.sin(a);
    details.bundle(psi, [x, 0, z], [1, 0.85, 0.85], psMat, 7);
    details.fold(psi, [x, 0.32, z], [0.72, 0.45, 0.62], psMat);
  }
  const fd = ball([1.45, 1.1, 0.2], 0.14, material("#b59177"));
  ball([2, 1.1, 0], [0.3, 0.24, 0.24], material("#82959d"));
  const rotor = new THREE.Group();
  group.add(rotor);
  rotor.position.set(3.42, 0.4, 0);
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    ball(
      [0.26 * Math.cos(a), 0, 0.26 * Math.sin(a)],
      [0.09, 0.26, 0.09],
      b6,
      rotor,
    );
  }
  segment([0, 0, 0], [0, 0.83, 0], 0.07, atpMat, rotor);
  ball([0.13, 0.72, 0.03], [0.15, 0.17, 0.12], atpMat, rotor);
  details.synthase(group, rotor, [3.42, 0.4, 0], 1.04, 14);
  const pc = ball([-0.05, -0.2, 0.3], 0.15, antennaMat),
    pq = ball([-1.8, 0.4, 0.5], [0.16, 0.11, 0.12], eMat);
  const photonGroups = [];
  for (const x of [-2.9, 0.95]) {
    const g = new THREE.Group();
    group.add(g);
    g.position.set(x, 2.2, 0.1);
    k.tube(
      [
        [-0.13, 0.55, 0],
        [0.12, 0.4, 0],
        [-0.12, 0.25, 0],
        [0.12, 0.1, 0],
        [0, -0.1, 0],
      ],
      0.03,
      photonMat,
      g,
      20,
    );
    const arrow = k.mesh(
      new THREE.ConeGeometry(0.09, 0.17, 16),
      photonMat,
      [0, -0.15, 0],
      g,
    );
    arrow.rotation.z = Math.PI;
    photonGroups.push(g);
  }
  const path = [
    [-2.9, -0.1, 0.47],
    [-2.9, 0.4, 0.47],
    [-1.9, 0.4, 0.47],
    [-0.83, 0.4, 0.47],
    [-0.55, -0.25, 0.47],
    [0.9, -0.25, 0.47],
    [0.95, 0.55, 0.47],
    [1.45, 1.1, 0.47],
    [2, 1.1, 0.47],
  ];
  const electrons = Array.from({ length: 8 }, () =>
    ball([0, 0, 0], 0.06, eMat),
  );
  const intoLumen = Array.from({ length: 4 }, () =>
    ball([0, 0, 0], 0.08, hMat),
  );
  const waterProtons = Array.from({ length: 4 }, () =>
    ball([0, 0, 0], 0.08, hMat),
  );
  const back = Array.from({ length: 4 }, () => ball([0, 0, 0], 0.08, hMat));
  const reservoir = Array.from({ length: 18 }, (_, i) =>
    ball(
      [
        -3.8 + (i % 9) * 0.91,
        -0.54 - Math.floor(i / 9) * 0.28,
        0.02 + (i % 3) * 0.16,
      ],
      0.08,
      hMat,
    ),
  );
  const oxygen = new THREE.Group();
  group.add(oxygen);
  const oMat = material("#b98580");
  ball([-0.1, 0, 0], 0.13, oMat, oxygen);
  ball([0.1, 0, 0], 0.13, oMat, oxygen);
  const nadph = ball([2.1, 1.8, 0.2], [0.22, 0.12, 0.13], material("#b998a4"));
  const atp = Array.from({ length: 3 }, () =>
    details.adenylate(group, [0, 0, 0], 0.46),
  );
  const labels = [
    label(
      [-0.8, 2.1, 0],
      "蓝细菌 · 胞质侧",
      "Cyanobacterium · cytoplasmic side",
      2,
    ),
    label(
      [0.4, -0.86, 0.4],
      "类囊体腔 · H⁺ 积累",
      "Thylakoid lumen · H⁺ accumulation",
      2,
    ),
    label([-3.0, 1.85, 0.25], "藻胆体", "Phycobilisome", 1),
    label([-3, -0.28, 0.65], "PSII · 2 H₂O → O₂", "PSII · 2 H₂O → O₂", 2),
    label([-0.86, 0.99, 0.1], "细胞色素 b₆f", "Cytochrome b₆f", 1),
    label([0.95, 0.85, 0.5], "PSI", "PSI", 2),
    label([2.06, 1.72, 0.25], "Fd / FNR → NADPH", "Fd / FNR → NADPH", 2),
    label([3.5, 1.95, 0.25], "ATP · 胞质侧", "ATP · cytoplasmic side", 2),
    label([-1.86, 0.58, 0.6], "PQ", "PQ", 1),
    label([0.04, -0.23, 0.65], "PC / 细胞色素 c₆", "PC / cytochrome c₆", 1),
    label(
      [-3.8, -1.56, 0.1],
      "单层囊片剖面 · 无叶绿体",
      "One thylakoid sac · no chloroplast",
      1,
    ),
  ];
  const update = (progress, parameters = {}) => {
    const p = clamp(progress),
      lit = parameters.light !== "dark",
      flow = lit ? ease(p, 0.15, 0.62) : 0;
    photonGroups.forEach((g, i) => {
      g.position.y = 2.1 - 0.32 * ((p * 3 + i * 0.4) % 1);
      g.visible = lit && p > 0.08;
    });
    electrons.forEach((o, i) => {
      const u = ((p * 2 + i / 8) % 1) * 8,
        j = Math.floor(u),
        t = u - j,
        a = path[j],
        c = path[j + 1];
      o.position.set(a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2]);
      o.visible = lit && p > 0.23;
    });
    pq.position.x = -2.3 + 1.35 * ((p * 2) % 1);
    pc.position.x = -0.45 + 1.35 * ((p * 2) % 1);
    fd.position.y = 1.03 + 0.14 * Math.sin(p * Math.PI * 4);
    intoLumen.forEach((o, i) => {
      const t = (p * 3 + i / 4) % 1;
      o.position.set(-0.82, 0.95 - 1.54 * t, 0.55);
      o.visible = lit && p > 0.36;
    });
    waterProtons.forEach((o, i) => {
      const t = (p * 2 + i / 4) % 1;
      o.position.set(-2.9 + 0.45 * t, -0.15 - 0.56 * t, 0.35);
      o.visible = lit && p > 0.23;
    });
    reservoir.forEach((o, i) => {
      o.visible = i < Math.round(flow * 18);
    });
    back.forEach((o, i) => {
      const t = (p * 3 + i / 4) % 1;
      o.position.set(3.42, -0.6 + 1.72 * t, 0.39);
      o.visible = lit && p > 0.59;
    });
    rotor.rotation.y = lit ? Math.max(0, p - 0.59) * Math.PI * 12 : 0;
    oxygen.position.set(
      -3.0 - 0.68 * ease(p, 0.24, 0.68),
      -0.12 - 0.65 * ease(p, 0.24, 0.68),
      0.53,
    );
    oxygen.visible = lit && p > 0.25;
    nadph.position.set(
      2.02 + 0.34 * ease(p, 0.57, 0.85),
      1.23 + 0.5 * ease(p, 0.57, 0.85),
      0.35,
    );
    nadph.visible = lit && p > 0.58;
    atp.forEach((o, i) => {
      const t = (p * 2 + i / 3) % 1;
      o.position.set(3.43 - 0.4 * t, 1.68 + 0.48 * t, 0.15);
      o.visible = lit && p > 0.68;
    });
    labels[1].text = lit
      ? b("类囊体腔 · H⁺ 积累", "Thylakoid lumen · H⁺ accumulation")
      : b(
          "类囊体腔 · 光驱动流停止",
          "Thylakoid lumen · light-driven flow stopped",
        );
    group.userData = {
      process: "bacterialPhotosynthesis",
      species: "Synechocystis sp. PCC 6803",
      condition: lit ? "light" : "dark",
      membrane: "thylakoid",
      hasChloroplast: false,
      oxygenSource: "water at lumen-facing PSII",
      oxygenProduced: lit && p > 0.25,
      electronRoute: "H2O→PSII→PQ→b6f→PC/c6→PSI→Fd→FNR→NADPH",
      protonAccumulation: "lumen",
      protonReturn: "lumen-to-cytoplasm",
      f1Side: "cytoplasm",
      lightDrivenFlow: flow,
      nadphProduced: lit && p > 0.58,
      atpProduced: lit && p > 0.68,
      progress: p,
    };
  };
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 2.3, 12.4], target: [0, 0.25, 0] },
  };
}
export default {
  id: "bacterialPhotosynthesis",
  title: b("蓝细菌的产氧光合作用", "Oxygenic photosynthesis in cyanobacteria"),
  intro: b(
    "选取集胞藻 Synechocystis sp. PCC 6803 的类囊体，展示线性光合电子传递。ATP 合酶按该株实验推定的 c14 环绘制。蓝细菌没有叶绿体。薄囊是类囊体腔，外侧为胞质；呼吸、循环电子流及碳固定未展开，暗条件仅停止图中的光驱动反应。",
    "A thylakoid of Synechocystis sp. PCC 6803 illustrates linear photosynthetic electron transfer. ATP synthase uses the experimentally inferred c14 ring of this strain. Cyanobacteria have no chloroplasts. The sac encloses the lumen, with cytoplasm outside. Respiration, cyclic electron flow and carbon fixation are omitted; darkness stops only the light-driven reactions shown.",
  ),
  duration: 36,
  create,
  controls: [
    {
      id: "light",
      label: b("光条件", "Light condition"),
      default: "light",
      options: [
        { value: "light", label: b("有光", "Light") },
        {
          value: "dark",
          label: b("暗 · 无光驱动流", "Dark · no light-driven flow"),
        },
      ],
    },
  ],
  legend: [
    {
      color: "#6f98b4",
      text: b("藻胆体与腔内载体", "Phycobilisome and lumenal carrier"),
    },
    {
      color: "#80bac6",
      text: b("电子与质体醌", "Electrons and plastoquinone"),
    },
    { color: "#d2a45e", text: b("H⁺", "H⁺") },
    { color: "#ac95b9", text: b("ATP", "ATP") },
  ],
  stages: [
    {
      at: 0,
      title: b("类囊体形成独立腔室", "A thylakoid encloses a lumen"),
      description: b(
        "这是蓝细菌内部的类囊体囊片，不是细胞外周或叶绿体。光系统嵌在膜中，ATP 合酶的催化头朝向胞质。",
        "This sac is an internal cyanobacterial thylakoid, not the cell exterior or a chloroplast. Photosystems are embedded in its membrane; the ATP synthase head faces the cytoplasm.",
      ),
    },
    {
      at: 0.12,
      title: b("藻胆体收集光能", "Phycobilisomes collect light"),
      description: b(
        "胞质侧的藻胆体将激发能传给光系统；PSII 和 PSI 都需要光激发。图中箭头表示光能，不是电子由太阳进入膜。",
        "Cytoplasmic-side phycobilisomes transfer excitation energy to photosystems; both PSII and PSI require light excitation. Arrows represent light energy, not electrons arriving from the Sun.",
      ),
    },
    {
      at: 0.26,
      title: b(
        "水提供电子并释放氧",
        "Water supplies electrons and oxygen is released",
      ),
      description: b(
        "PSII 的腔侧放氧复合体氧化水，释放电子、氧和腔内质子。氧来自水；反应需累积多个光化学周转。",
        "The lumen-facing oxygen-evolving complex of PSII oxidizes water, supplying electrons and releasing oxygen and lumenal protons. Oxygen comes from water, after multiple photochemical turnovers.",
      ),
    },
    {
      at: 0.42,
      title: b(
        "电子传递增加腔内质子",
        "Electron transfer builds lumenal protons",
      ),
      description: b(
        "质体醌 PQ 在膜内把电子交给 b₆f，伴随质子向腔内转移。腔内的质体蓝素 PC 或细胞色素 c₆ 将电子送至 PSI。",
        "Membrane plastoquinone PQ carries electrons to b₆f, coupled to proton transfer into the lumen. Lumenal plastocyanin PC or cytochrome c₆ transfers electrons to PSI.",
      ),
    },
    {
      at: 0.59,
      title: b(
        "PSI 再次激发并生成 NADPH",
        "PSI excitation supports NADPH formation",
      ),
      description: b(
        "PSI 的光激发使电子经胞质侧铁氧还蛋白 Fd 和 FNR 还原 NADP⁺。这些还原力可用于后续碳固定等反应。",
        "Light-excited PSI sends electrons through cytoplasmic ferredoxin Fd and FNR to reduce NADP⁺. The resulting reducing power can support downstream reactions including carbon fixation.",
      ),
    },
    {
      at: 0.74,
      title: b("腔内质子回流驱动 ATP", "Lumenal proton return drives ATP"),
      description: b(
        "质子从腔内经 Fₒ 回到胞质，驱动转轴与 F₁ 催化。ATP 和 NADPH 在胞质侧生成；图中速率和粒子数不表达固定产量。",
        "Protons return from the lumen through Fₒ to the cytoplasm, driving the shaft and F₁ catalysis. ATP and NADPH are produced on the cytoplasmic side; speeds and particle counts do not encode fixed yields.",
      ),
    },
    {
      at: 0.9,
      title: b(
        "光反应与其他代谢的边界",
        "Light reactions within a broader metabolism",
      ),
      description: b(
        "暗条件没有持续的光化学电子输入，因此图示的产氧与光驱动 ATP、NADPH 合成停止。真实蓝细菌仍可呼吸；并非所有细菌都能进行这种产氧光合作用。",
        "In darkness there is no sustained photochemical electron input, so the illustrated oxygen evolution and light-driven ATP and NADPH synthesis stop. Real cyanobacteria can still respire; this oxygenic mechanism is not shared by all bacteria.",
      ),
    },
  ],
  sources: [
    {
      title: "Pogoryelov et al. 2007 · Synechocystis PCC 6803 c14 ring",
      url: "https://doi.org/10.1128/JB.00581-07",
    },
    {
      title:
        "Distribution and dynamics of electron transport complexes in cyanobacterial thylakoids",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4756276/",
    },
    {
      title:
        "Chlorophyll fluorescence analysis of cyanobacterial photosynthesis and acclimation",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC98930/",
    },
  ],
};
