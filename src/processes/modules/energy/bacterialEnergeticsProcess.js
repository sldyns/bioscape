import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { energyDetails } from "./detailKit.js";

function create() {
  const k = sceneKit(),
    { group, material, ball, segment, label } = k;
  const details = energyDetails(k);
  const lipid = material("#a4b9ab"),
    tail = material("#d1d7c6"),
    blue = material("#788ea8"),
    rust = material("#ba927d"),
    green = material("#72988b");
  const proton = material("#d2a15c", {
      emissive: "#805317",
      emissiveIntensity: 0.15,
    }),
    electron = material("#74aebd"),
    atp = material("#ac94b7");
  const curve = (x) => -0.075 * x * x;
  details.bilayer({
    length: 8.5,
    depth: 1.55,
    curve,
    holes: [
      [-2.35, 0, 0.8, 0.5],
      [0.65, 0, 0.65, 0.5],
      [3.1, 0, 0.6, 0.45],
    ],
  });
  // Same lattice as the surrounding bilayer: fill precisely the NDH-I cutout
  // when the selected enzyme is peripheral NDH-II, on both membrane leaflets.
  const ndh2Lipids = details.bilayer({
    length: 8.5,
    depth: 1.55,
    curve,
    include: (x, z) => ((x + 2.35) / 0.8) ** 2 + (z / 0.5) ** 2 < 1,
  });
  ndh2Lipids.name = "NDH-II-continuous-bilayer-patch";
  const wallMat = material("#c2bcb0", {
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 32; i++) {
      const x = -4 + i * 0.25,
        y = curve(x) + 1.32;
      segment(
        [x, y, -1 + j * 0.45],
        [x + 0.19, curve(x + 0.19) + 1.32, -1 + j * 0.45],
        0.034,
        wallMat,
      );
    }
  for (let i = 0; i < 16; i++) {
    const x = -3.9 + i * 0.5;
    segment(
      [x, curve(x) + 1.32, -1],
      [x, curve(x) + 1.32, -0.1],
      0.025,
      wallMat,
    );
  }
  const entry = new THREE.Group();
  entry.position.set(-2.35, curve(-2.35), 0);
  group.add(entry);
  const ndh1 = new THREE.Group(),
    ndh2 = new THREE.Group();
  entry.add(ndh1, ndh2);
  ndh1.name = "transmembrane-NDH-I";
  ndh2.name = "cytoplasmic-peripheral-NDH-II";
  details.bundle(ndh1, [-0.25, 0, 0], [1.2, 0.9, 1.1], blue, 7);
  details.bundle(ndh1, [0.28, 0, 0], [0.9, 0.85, 0.9], green, 5);
  details.fold(ndh1, [-0.28, -0.64, 0], [0.9, 1.15, 0.8], blue);
  details.fold(ndh1, [-0.4, -1.02, 0.03], [0.85, 0.55, 0.8], green);
  details.fold(ndh2, [0, -0.4, 0], [0.95, 0.65, 0.8], green);
  const oxidase = new THREE.Group();
  oxidase.position.set(0.65, curve(0.65), 0);
  group.add(oxidase);
  const bo = new THREE.Group(),
    bd = new THREE.Group();
  oxidase.add(bo, bd);
  details.bundle(bo, [-0.13, 0, 0], [1.25, 1.1, 1.05], rust, 9);
  details.bundle(bo, [0.34, 0, -0.05], [0.62, 0.9, 0.7], blue, 4);
  details.fold(bo, [-0.1, 0.42, -0.05], [0.7, 0.45, 0.7], rust);
  for (const x of [-0.27, 0.27])
    details.bundle(bd, [x, 0.01, 0], [0.96, 1.13, 1.1], green, 7);
  details.fold(bd, [0, 0.45, -0.07], [1.2, 0.45, 0.8], green);
  // Three exposed heme-like rings distinguish the bd branch; positions schematic.
  for (let i = 0; i < 3; i++) {
    const r = k.ring(
      [-0.24 + i * 0.24, 0.18 + (i % 2) * 0.12, 0.33],
      0.09,
      0.019,
      rust,
      bd,
    );
    r.rotation.y = 0.1;
  }
  const synthase = new THREE.Group();
  synthase.position.set(3.1, curve(3.1), 0);
  group.add(synthase);
  const rotor = new THREE.Group();
  synthase.add(rotor);
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    ball(
      [0.27 * Math.cos(a), 0, 0.27 * Math.sin(a)],
      [0.095, 0.26, 0.095],
      rust,
      rotor,
    );
  }
  segment([0, 0, 0], [0, -1.16, 0], 0.08, atp, rotor);
  ball([0.12, -1.03, 0.07], [0.15, 0.18, 0.1], atp, rotor);
  details.synthase(synthase, rotor, [0, 0, 0], -1.28, 10);
  const quinone = ball([-1, curve(-1), 0.47], [0.18, 0.11, 0.13], electron);
  const eflow = Array.from({ length: 7 }, () =>
    ball([0, 0, 0], 0.065, electron),
  );
  const pumped = Array.from({ length: 6 }, () =>
    ball([0, 0, 0], 0.087, proton),
  );
  const released = Array.from({ length: 3 }, () =>
    ball([0, 0, 0], 0.087, proton),
  );
  const consumed = Array.from({ length: 3 }, () =>
    ball([0, 0, 0], 0.087, proton),
  );
  const back = Array.from({ length: 4 }, () => ball([0, 0, 0], 0.087, proton));
  const products = Array.from({ length: 3 }, () =>
    details.adenylate(group, [0, 0, 0], 0.46),
  );
  const reservoir = Array.from({ length: 14 }, (_, i) => {
    const x = -3.75 + (i % 7) * 1.07;
    return ball(
      [x, curve(x) + 0.58 + Math.floor(i / 7) * 0.3, 0.1],
      0.08,
      proton,
    );
  });
  const oxygen = new THREE.Group();
  group.add(oxygen);
  ball([-0.1, 0, 0], 0.13, material("#ba8480"), oxygen);
  ball([0.1, 0, 0], 0.13, material("#ba8480"), oxygen);
  const water = ball([0.9, -0.5, 0.58], 0.13, material("#9bbaca"));
  const pumpArrows = new THREE.Group();
  group.add(pumpArrows);
  for (const x of [-2.08, 1.02]) {
    const y = curve(x);
    segment([x, y - 0.6, 0.5], [x, y + 0.72, 0.5], 0.015, proton, pumpArrows);
    const a = k.mesh(
      new THREE.ConeGeometry(0.09, 0.18, 16),
      proton,
      [x, y + 0.72, 0.5],
      pumpArrows,
    );
  }
  const labels = [
    label([-0.4, 1.62, 0], "大肠杆菌 · 周质侧", "E. coli · periplasm", 2),
    label([-1.4, -2.35, 0], "细胞质", "Cytoplasm", 2),
    label([-4, -0.65, 0.4], "质膜", "Plasma membrane", 2),
    label([-2.7, -1.78, 0.2], "NDH-I · 泵 H⁺", "NDH-I · proton pump", 2),
    label([0.65, -0.9, 0.3], "bo₃ · 还原氧", "bo₃ · oxygen reduction", 2),
    label(
      [3.1, -2.57, 0.3],
      "F₁ · ATP 生成于胞质侧",
      "F₁ · ATP on cytoplasmic side",
      2,
    ),
    label([-1, 0.35, 0.55], "Q / QH₂", "Q / QH₂", 1),
    label(
      [1.4, 0.6, 0.4],
      "QH₂ 向周质释放 H⁺",
      "QH₂ releases H⁺ to periplasm",
      1,
    ),
    label(
      [0.3, -1.55, 0.4],
      "胞质 H⁺ 用于生成水",
      "Cytoplasmic H⁺ used to make water",
      1,
    ),
    label([3.2, 0.25, 0.4], "H⁺ 回流", "H⁺ return", 1),
    label(
      [-3.65, 0.95, -0.2],
      "肽聚糖 · 背景定位",
      "Peptidoglycan · context",
      0,
    ),
  ];
  const update = (progress, parameters = {}) => {
    const p = clamp(progress),
      alternative = parameters.route === "ndh2-bd",
      on = p > 0.14;
    ndh1.visible = !alternative;
    ndh2.visible = alternative;
    ndh2Lipids.visible = alternative;
    bo.visible = !alternative;
    bd.visible = alternative;
    pumpArrows.visible = !alternative && p > 0.35;
    labels[3].text = alternative
      ? b("NDH-II · 不泵 H⁺", "NDH-II · no proton pumping")
      : b("NDH-I · 泵 H⁺", "NDH-I · proton pump");
    labels[4].text = alternative
      ? b("bd-I · 电荷分离，不泵 H⁺", "bd-I · charge separation, no pump")
      : b("bo₃ · 泵 H⁺ 并还原氧", "bo₃ · proton pump and O₂ reduction");
    const qx = -1.6 + 1.85 * ((p * 2) % 1);
    quinone.position.set(qx, curve(qx), 0.48);
    eflow.forEach((o, i) => {
      const t = (p * 2 + i / 7) % 1,
        x = -2.4 + 3.1 * t;
      o.position.set(x, curve(x) - 0.48 * (1 - ease(t, 0, 0.25)), 0.49);
      o.visible = on;
    });
    pumped.forEach((o, i) => {
      const x = i < 3 ? -2.08 : 1.02,
        t = (p * 3 + (i % 3) / 3) % 1;
      o.position.set(x, curve(x) - 0.65 + 1.45 * t, 0.52);
      o.visible = !alternative && p > 0.32;
    });
    released.forEach((o, i) => {
      const t = (p * 3 + i / 3) % 1;
      o.position.set(0.45 + 0.55 * t, 0.13 + 0.65 * t, 0.44);
      o.visible = p > 0.36;
    });
    consumed.forEach((o, i) => {
      const t = (p * 3 + i / 3) % 1;
      o.position.set(0.5, -1.25 + 1.32 * t, 0.57);
      o.visible = p > 0.43;
    });
    const activity = ease(p, 0.5, 0.78),
      factor = alternative ? 0.48 : 1;
    back.forEach((o, i) => {
      const t = (p * 2 + i / 4) % 1;
      o.position.set(3.08, curve(3.1) + 0.65 - 1.65 * t, 0.38);
      o.visible = p > 0.58 && (i < 2 || !alternative);
    });
    products.forEach((o, i) => {
      const t = (p * (alternative ? 1 : 2) + i / 3) % 1;
      o.position.set(3.12 - 0.9 * t, curve(3.1) - 1.55 - 0.25 * t, 0.35);
      o.visible = p > 0.68;
    });
    reservoir.forEach((o, i) => {
      o.visible = i < Math.round(ease(p, 0.3, 0.6) * (alternative ? 6 : 14));
    });
    rotor.rotation.y = Math.max(0, p - 0.58) * 12 * Math.PI * factor;
    oxygen.position.set(1.6 - 0.8 * ease(p, 0.35, 0.6), -0.4, 0.68);
    oxygen.visible = p > 0.24 && p < 0.62;
    water.visible = p > 0.57;
    group.userData = {
      process: "bacterialEnergetics",
      species: "Escherichia coli",
      membrane: "plasma membrane",
      outerSide: "periplasm",
      f1Side: "cytoplasm",
      route: alternative ? "NDH-II→Q→bd-I" : "NDH-I→Q→bo3",
      ndhPumps: !alternative,
      oxidasePumps: !alternative,
      quinolProtonRelease: "periplasm",
      chemicalProtonSource: "cytoplasm",
      protonReturn: "periplasm-to-cytoplasm",
      terminalAcceptor: "oxygen",
      atpYield: "route-dependent; no fixed ATP-per-glucose value",
      activity,
      progress: p,
    };
  };
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 2.1, 11.8], target: [0, -0.35, 0] },
  };
}
export default {
  id: "bacterialEnergetics",
  title: b("细菌质膜上的呼吸", "Respiration at the bacterial membrane"),
  intro: b(
    "选取大肠杆菌的两种有氧呼吸支路。弯曲质膜上方是周质，下方是细胞质；肽聚糖仅作定位，外膜未展开。切换支路会改变酶和质子流；粒子数量与转速均为定性示意。",
    "Two aerobic respiratory branches of Escherichia coli. Periplasm lies above the curved plasma membrane and cytoplasm below; peptidoglycan provides context, while the outer membrane is omitted. Switching branches changes enzymes and proton flow; particle counts and speeds are qualitative.",
  ),
  duration: 34,
  create,
  controls: [
    {
      id: "route",
      label: b("电子传递支路", "Electron-transfer branch"),
      default: "ndh1-bo",
      options: [
        { value: "ndh1-bo", label: b("NDH-I → bo₃", "NDH-I → bo₃") },
        { value: "ndh2-bd", label: b("NDH-II → bd-I", "NDH-II → bd-I") },
      ],
    },
  ],
  legend: [
    { color: "#74aebd", text: b("电子与泛醌", "Electrons and ubiquinone") },
    { color: "#d2a15c", text: b("H⁺", "H⁺") },
    { color: "#ac94b7", text: b("ATP 与转轴", "ATP and rotor shaft") },
  ],
  stages: [
    {
      at: 0,
      title: b(
        "质膜形成能量边界",
        "The plasma membrane is the energy boundary",
      ),
      description: b(
        "大肠杆菌没有线粒体。其呼吸酶位于质膜，ATP 合酶的 F₁ 头朝向细胞质。",
        "E. coli has no mitochondria. Respiratory enzymes occupy its plasma membrane, with the F₁ head of ATP synthase facing the cytoplasm.",
      ),
    },
    {
      at: 0.16,
      title: b("从 NADH 到泛醌", "From NADH to ubiquinone"),
      description: b(
        "NADH 脱氢酶将电子交给 Q。NDH-I 同时泵出质子，NDH-II 不泵质子；两者都可为膜内 Q 池供电子。",
        "NADH dehydrogenase transfers electrons to Q. NDH-I pumps protons, while NDH-II does not; both can supply electrons to the membrane Q pool.",
      ),
    },
    {
      at: 0.33,
      title: b(
        "末端氧化酶有不同机制",
        "Terminal oxidases use different mechanisms",
      ),
      description: b(
        "bo₃ 主动泵质子。bd-I 不泵质子，但 QH₂ 在周质侧释放质子、氧还原消耗胞质侧质子，仍形成跨膜电荷分离。",
        "bo₃ actively pumps protons. bd-I does not, yet quinol releases protons toward the periplasm and oxygen reduction uses cytoplasmic protons, producing transmembrane charge separation.",
      ),
    },
    {
      at: 0.5,
      title: b("氧还原生成水", "Oxygen is reduced to water"),
      description: b(
        "电子经选定的醌氧化酶流向氧。所示支路不经过线粒体式的 III—细胞色素 c—IV 链。",
        "Electrons reach oxygen through the selected quinol oxidase. These branches do not use a mitochondrial III–cytochrome c–IV sequence.",
      ),
    },
    {
      at: 0.66,
      title: b("质子回流与 ATP", "Proton return and ATP"),
      description: b(
        "质子由周质经 Fₒ 回到细胞质，驱动转子和中央轴。固定的 F₁ 催化头通过构象变化合成 ATP。",
        "Protons return from periplasm through Fₒ to the cytoplasm, rotating the rotor and shaft. Conformational changes in the stationary F₁ head synthesize ATP.",
      ),
    },
    {
      at: 0.86,
      title: b("产量依赖所用支路", "Yield depends on the branch"),
      description: b(
        "不同入口与氧化酶保留的电化学能不同，不能为所有细菌指定统一的每葡萄糖 ATP 数。本图只展示两条有氧支路，不代表全部呼吸或发酵途径。",
        "Different entry enzymes and oxidases conserve different amounts of electrochemical energy; there is no universal bacterial ATP yield per glucose. Only two aerobic branches are shown, not the full range of respiration or fermentation.",
      ),
    },
  ],
  sources: [
    {
      title: "E. coli NDH-II is peripheral membrane-bound · PMID 23089137",
      url: "https://pubmed.ncbi.nlm.nih.gov/23089137/",
    },
    {
      title: "E. coli ATP synthase c10 motor · PDB 6OQR",
      url: "https://www.rcsb.org/structure/6OQR",
    },
    {
      title:
        "Borisov et al. · Proton-motive force in the E. coli respiratory chain",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3198357/",
    },
    {
      title: "Energetic efficiency of E. coli respiratory-chain mutants",
      url: "https://pubmed.ncbi.nlm.nih.gov/8491720/",
    },
  ],
};
