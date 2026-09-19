import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { energyDetails } from "./detailKit.js";

const stages = [
  {
    at: 0,
    title: b("内膜两侧", "Two sides of the inner membrane"),
    description: b(
      "上方为膜间隙，下方为基质。内膜分隔两侧；这些反应在呼吸时相互耦联，分段展示不是全细胞的先后时间表。",
      "The intermembrane space is above and the matrix below. These processes operate together during respiration; the chapters are a guided view, not a whole-cell timetable.",
    ),
  },
  {
    at: 0.16,
    title: b("还原当量供电子", "Reducing equivalents supply electrons"),
    description: b(
      "基质中的三羧酸循环等反应提供 NADH；琥珀酸脱氢酶也是复合体 II。电子汇入膜内的泛醌 Q；复合体 II 不泵质子。",
      "Matrix reactions including the TCA cycle supply NADH; succinate dehydrogenase is also complex II. Electrons enter the membrane ubiquinone pool Q; complex II does not pump protons.",
    ),
  },
  {
    at: 0.33,
    title: b("电子传递与泵出质子", "Electron transfer drives proton export"),
    description: b(
      "经典通路中 I、III、IV 将质子由基质转移至膜间隙。Q 在膜内传递电子，细胞色素 c 在膜间隙侧将电子送至 IV。",
      "In the canonical route, I, III and IV move protons from matrix to intermembrane space. Q carries electrons within the membrane; cytochrome c transfers them to IV on the intermembrane-space side.",
    ),
  },
  {
    at: 0.5,
    title: b("氧是末端电子受体", "Oxygen accepts the electrons"),
    description: b(
      "复合体 IV 用电子和基质侧的质子将氧还原为水。电子不穿过 ATP 合酶；质子电化学梯度把呼吸链与 ATP 合成联系起来。",
      "Complex IV reduces oxygen to water using electrons and matrix-side protons. Electrons do not pass through ATP synthase; the proton electrochemical gradient couples the chain to ATP production.",
    ),
  },
  {
    at: 0.67,
    title: b("回流驱动旋转", "Return flow drives rotation"),
    description: b(
      "质子经 Fo 从膜间隙回到基质，驱动转子和中央轴旋转。基质侧 F1 的催化头由定子固定，通过构象变化生成 ATP。",
      "Protons return from the intermembrane space to the matrix through Fo, driving the rotor and central shaft. The stator holds the matrix-facing F1 head while conformational changes make ATP.",
    ),
  },
  {
    at: 0.86,
    title: b("耦联与解耦", "Coupling and uncoupling"),
    description: b(
      "选择质子泄漏可看到跨膜梯度被消耗、ATP 合成减弱，而供氧和底物充足时电子传递仍可继续。图中粒子数和转速不代表计量或真实速率。",
      "With proton leak selected, the gradient dissipates and ATP synthesis weakens while electron transfer can continue if oxygen and substrates remain available. Particle counts and rotation rates are illustrative, not stoichiometric or kinetic measurements.",
    ),
  },
];

function create({ rootId = "cell" } = {}) {
  const k = sceneKit(),
    { group, material, ball, segment, ring, label } = k;
  const details = energyDetails(k);
  const yeast = rootId === "yeast";
  const lipid = material("#a7bcb1"),
    tails = material("#d2dacf");
  const protein = material("#687e95"),
    copper = material("#bc9180"),
    teal = material("#729c94");
  const hmat = material("#d9a45d", {
    emissive: "#6d4114",
    emissiveIntensity: 0.18,
  });
  const electronMat = material("#81baca", {
    emissive: "#32748c",
    emissiveIntensity: 0.3,
  });
  const atpMat = material("#b49fc2"),
    pale = material("#dad2c8");
  details.bilayer({
    length: 9,
    depth: 1.65,
    holes: [
      ...(!yeast ? [[-3.25, 0, 0.64, 0.54]] : []),
      [-1.8, -0.18, 0.4, 0.4],
      [-0.2, 0, 0.67, 0.52],
      [1.5, 0, 0.55, 0.48],
      [3.15, 0, 0.65, 0.49],
    ],
  });
  const ci = new THREE.Group();
  group.add(ci);
  ci.position.x = -3.25;
  ci.name = yeast ? "matrix-peripheral-Ndi1" : "transmembrane-complex-I";
  if (yeast) {
    details.fold(ci, [0, -0.4, 0], [0.83, 0.61, 0.8], protein);
  } else {
    details.bundle(ci, [-0.27, 0, 0], [1.3, 1, 1.05], protein, 7);
    details.bundle(ci, [0.3, 0, 0], [0.85, 0.9, 0.9], teal, 5);
    details.fold(ci, [-0.24, -0.65, -0.06], [0.9, 1.1, 0.86], protein);
    details.fold(ci, [-0.32, -1.08, 0.04], [0.8, 0.52, 0.75], teal);
    const centers = material("#baa989");
    for (let i = 0; i < 5; i++)
      ball([-0.33 + i * 0.07, -1.05 + i * 0.2, 0.35], 0.055, centers, ci);
  }
  details.fold(group, [-1.8, -0.55, -0.1], [0.7, 0.88, 0.75], teal);
  details.bundle(group, [-1.8, -0.05, -0.1], [0.8, 0.65, 0.8], teal, 4);
  for (const x of [-0.45, 0.08]) {
    details.bundle(group, [x, 0, 0], [0.87, 1.12, 1], copper, 7);
    details.fold(group, [x, 0.53, -0.03], [0.67, 0.6, 0.8], copper);
  }
  details.bundle(group, [1.35, 0, 0], [0.9, 1.1, 0.95], teal, 7);
  details.bundle(group, [1.74, 0, -0.03], [0.56, 0.95, 0.75], protein, 4);
  // Exposed cofactor pockets make the terminal oxidase distinct from complex III.
  for (const y of [-0.12, 0.15]) {
    const heme = ring([1.5, y, 0.32], 0.11, 0.022, copper);
    heme.rotation.y = 0.2;
  }
  const rotor = new THREE.Group();
  rotor.position.set(3.15, 0, 0);
  group.add(rotor);
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    ball(
      [Math.cos(a) * 0.31, 0, Math.sin(a) * 0.31],
      [0.1, 0.32, 0.1],
      copper,
      rotor,
    );
  }
  segment([0, 0, 0], [0, -1.27, 0], 0.08, atpMat, rotor);
  ball([0.17, -1.2, 0], [0.17, 0.2, 0.12], atpMat, rotor);
  details.synthase(
    group,
    rotor,
    [3.15, 0, 0],
    -1.48,
    yeast ? 10 : rootId === "cell" ? 8 : null,
  );
  const leak = new THREE.Group();
  group.add(leak);
  leak.position.set(4.25, 0, 0);
  const leakRing = ring([0, 0, 0], 0.2, 0.04, hmat, leak);
  leakRing.rotation.x = Math.PI / 2;
  segment([0, 0.3, 0], [0, -0.3, 0], 0.045, hmat, leak);
  // Direction arrows have a real membrane-side meaning, not a generic pathway tube.
  const coneGeo = new THREE.ConeGeometry(0.12, 0.22, 18);
  for (const x of yeast ? [-0.2, 1.5] : [-3.25, -0.2, 1.5]) {
    segment([x + 0.32, -0.8, 0.6], [x + 0.32, 0.85, 0.6], 0.018, hmat);
    k.mesh(coneGeo, hmat, [x + 0.32, 0.86, 0.6]);
  }
  segment([2.7, 0.85, 0.55], [2.7, -0.8, 0.55], 0.018, hmat);
  const down = k.mesh(coneGeo, hmat, [2.7, -0.85, 0.55]);
  down.rotation.z = Math.PI;
  // TCA context occupies the matrix, apart from the membrane machinery.
  const tca = new THREE.Group();
  group.add(tca);
  tca.position.set(-3.2, -2.12, -0.1);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ball([Math.cos(a) * 0.47, Math.sin(a) * 0.3, 0], 0.12, pale, tca);
  }
  const supply = ball([-3.2, -1.8, 0.15], 0.13, electronMat);
  const q = ball([-1.45, 0, 0.55], [0.16, 0.11, 0.12], electronMat);
  const cytc = ball([0.68, 0.85, 0], 0.19, copper);
  const electronPath = [
    [-3.3, -0.9, 0.5],
    [-3.25, 0, 0.5],
    [-1.2, 0, 0.5],
    [-0.2, 0, 0.5],
    [-0.1, 0.8, 0.5],
    [0.8, 0.8, 0.5],
    [1.5, 0.43, 0.5],
    [1.5, -0.7, 0.5],
  ];
  const electrons = Array.from({ length: 7 }, () =>
    ball([0, 0, 0], 0.065, electronMat),
  );
  const pumpXs = yeast ? [-0.2, 1.5] : [-3.25, -0.2, 1.5];
  const pumps = Array.from({ length: pumpXs.length * 3 }, () =>
    ball([0, 0, 0], 0.085, hmat),
  );
  const reservoir = Array.from({ length: 16 }, (_, i) =>
    ball(
      [
        -3.9 + (i % 8) * 0.99,
        1.2 + Math.floor(i / 8) * 0.37,
        -0.25 + (i % 3) * 0.2,
      ],
      0.085,
      hmat,
    ),
  );
  const returning = Array.from({ length: 4 }, () =>
    ball([0, 0, 0], 0.085, hmat),
  );
  const leaking = Array.from({ length: 4 }, () => ball([0, 0, 0], 0.085, hmat));
  const atp = Array.from({ length: 3 }, () =>
    details.adenylate(group, [0, 0, 0], 0.46),
  );
  const water = ball([1.5, -1.05, 0], 0.16, material("#92b2c8"));
  const labels = [
    label(
      [-2.6, 2.0, 0],
      "膜间隙 · H⁺ 积累",
      "Intermembrane space · H⁺ accumulation",
      2,
    ),
    label([-0.3, -2.3, 0], "线粒体基质", "Mitochondrial matrix", 2),
    label([-4.3, 0.35, 0.4], "内膜", "Inner membrane", 1),
    label(
      [-3.3, -1.48, 0.3],
      yeast ? "Ndi1 · 不泵 H⁺" : "I · NADH 入口",
      yeast ? "Ndi1 · no H⁺ pumping" : "I · NADH entry",
      2,
    ),
    label([-1.8, -0.9, 0.3], "II · 不泵 H⁺", "II · no H⁺ pumping", 1),
    label([-0.2, -0.83, 0.4], "III", "III", 1),
    label([1.5, -0.82, 0.4], "IV · O₂ → H₂O", "IV · O₂ → H₂O", 2),
    label([3.15, -2.15, 0.3], "F₁ · ADP + Pi → ATP", "F₁ · ADP + Pi → ATP", 2),
    label([3.2, 0.58, 0.2], "Fₒ · 质子回流", "Fₒ · proton return", 2),
    label(
      [-3.2, -2.65, 0],
      "TCA 等反应 → NADH",
      "TCA and other reactions → NADH",
      1,
    ),
    label([-0.95, 0.31, 0.7], "Q", "Q", 1),
    label([0.65, 1.13, 0], "细胞色素 c", "Cytochrome c", 1),
    label([4.3, -1.1, 0], "质子泄漏", "Proton leak", 1),
  ];
  const update = (progress, parameters = {}) => {
    const p = clamp(progress),
      uncoupled = parameters.coupling === "leak";
    const flow = ease(p, 0.08, 0.35),
      leakOn = uncoupled ? ease(p, 0.35, 0.6) : 0;
    leak.visible = uncoupled;
    labels[12].active = uncoupled;
    const gradient = flow * (1 - 0.9 * leakOn),
      synthesis = ease(p, 0.55, 0.8) * (1 - leakOn);
    supply.position.set(-3.2, -2 + 0.9 * ((p * 3) % 1), 0.2);
    supply.visible = p > 0.1;
    q.position.x = -1.6 + 1.15 * ((p * 3) % 1);
    cytc.position.x = 0.3 + 1.03 * ((p * 3) % 1);
    for (let i = 0; i < electrons.length; i++) {
      const u = ((p * 2 + i / 7) % 1) * 7,
        j = Math.floor(u),
        t = u - j,
        a = electronPath[j],
        c = electronPath[j + 1];
      electrons[i].position.set(
        a[0] + (c[0] - a[0]) * t,
        a[1] + (c[1] - a[1]) * t,
        a[2],
      );
      electrons[i].visible = p > 0.16;
    }
    pumps.forEach((o, i) => {
      const t = (p * 3 + (i % 3) / 3) % 1;
      o.position.set(pumpXs[Math.floor(i / 3)] + 0.32, -0.8 + 1.75 * t, 0.6);
      o.visible = p > 0.3;
    });
    reservoir.forEach((o, i) => {
      o.visible = i < Math.round(3 + 13 * gradient);
    });
    returning.forEach((o, i) => {
      const t = (p * 3 + i / 4) % 1;
      o.position.set(3.1, 0.95 - 2.05 * t, 0.44);
      o.visible = synthesis > 0.04;
    });
    leaking.forEach((o, i) => {
      const t = (p * 4 + i / 4) % 1;
      o.position.set(4.25, 0.95 - 1.9 * t, 0.12);
      o.visible = leakOn > 0.1;
    });
    const motorTime = Math.max(0, p - 0.55);
    rotor.rotation.y =
      12 *
      Math.PI *
      (uncoupled ? 0.025 * (1 - Math.exp(-30 * motorTime)) : motorTime);
    atp.forEach((o, i) => {
      const t = (p * 2 + i / 3) % 1;
      o.position.set(3.15 - 0.9 * t, -1.8 - 0.4 * t, 0.3);
      o.visible = synthesis > 0.2;
    });
    water.visible = p > 0.48;
    water.scale.setScalar(0.12 + 0.05 * ease(p, 0.48, 0.7));
    group.userData = {
      process: "respiration",
      rootId,
      condition: uncoupled ? "proton-leak" : "coupled",
      protonPumpDirection: "matrix-to-intermembrane-space",
      atpProtonDirection: "intermembrane-space-to-matrix",
      f1Side: "matrix",
      nadhEntry: yeast ? "Ndi1-no-proton-pumping" : "complex-I",
      complexIIPumpsProtons: false,
      gradient,
      atpSynthesis: synthesis,
      rotorAngle: rotor.rotation.y,
      electronAcceptor: "oxygen",
      progress: p,
    };
  };
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 2.3, 11.7], target: [0, -0.35, 0] },
  };
}

export default {
  id: "respiration",
  title: b("呼吸链与 ATP 合成", "Respiratory chain & ATP synthesis"),
  intro: b(
    "在线粒体内膜剖面追踪电子、质子与旋转催化。展示经典细胞色素通路；植物及部分原生生物的替代支路未展开。",
    "Trace electrons, protons and rotary catalysis across the mitochondrial inner membrane. The canonical cytochrome route is shown; alternative branches in plants and some protists are omitted.",
  ),
  duration: 36,
  stages,
  create,
  legend: [
    {
      color: "#81baca",
      text: b("电子与电子载体", "Electrons and electron carriers"),
    },
    { color: "#d9a45d", text: b("质子 H⁺", "Protons H⁺") },
    { color: "#b49fc2", text: b("ATP 与转轴", "ATP and rotor shaft") },
  ],
  controls: [
    {
      id: "coupling",
      label: b("内膜耦联", "Inner-membrane coupling"),
      default: "coupled",
      options: [
        { value: "coupled", label: b("正常耦联", "Coupled") },
        { value: "leak", label: b("质子泄漏", "Proton leak") },
      ],
    },
  ],
  contexts: {
    cell: {
      intro: b(
        "以哺乳动物呼吸链为例：ATP 合酶 c 环采用牛心线粒体已测得的 8 亚基计量。蛋白形状和运动为机制示意；粒子数不表示 ATP 产量。",
        "A mammalian respiratory-chain example uses the measured eight-subunit c ring of bovine-heart mitochondrial ATP synthase. Protein shapes and motions illustrate mechanism; particle counts do not encode ATP yield.",
      ),
    },
    plant: {
      intro: b(
        "以拟南芥线粒体的经典细胞色素通路说明耦联；替代支路未展开。ATP 合酶的膜内 c 环以连续轮廓表示，不指认未核实的亚基数；它不是叶绿体的 c14 环。",
        "The canonical cytochrome route of Arabidopsis mitochondria illustrates coupling; alternative branches are omitted. The membrane c ring is a continuous contour without an unverified subunit count; it is not the chloroplast c14 ring.",
      ),
    },
    paramecium: {
      intro: b(
        "以草履虫 Paramecium tetraurelia 线粒体说明呼吸耦联；替代支路未展开。已有低分辨率结构未直接测定 c 亚基数，此处以连续轮廓保留 c 环与转轴，不把拟合模板当成测量。",
        "Paramecium tetraurelia mitochondria illustrate respiratory coupling; alternative branches are omitted. Available low-resolution structures do not directly determine the c-subunit count, so a continuous c-ring contour and shaft are shown without treating a fitted template as a measurement.",
      ),
    },
    yeast: {
      intro: b(
        "酿酒酵母 ATP 合酶采用已测得的 c10 环。其呼吸链没有复合体 I：基质侧 Ndi1 将电子交给 Q，但不泵质子。模型相应替换入口并移除该处泵流。",
        "S. cerevisiae ATP synthase uses its measured c10 ring. Its respiratory chain lacks complex I: matrix-facing Ndi1 transfers electrons to Q without pumping protons. The model replaces that entry point and removes its proton pumping.",
      ),
      stages: stages.map((s, i) =>
        i === 2
          ? {
              ...s,
              description: b(
                "酿酒酵母的 Ndi1 不泵质子；III 和 IV 建立跨膜质子梯度。Q 在膜内移动，细胞色素 c 位于膜间隙侧。",
                "In S. cerevisiae, Ndi1 does not pump protons; III and IV build the gradient. Q moves within the membrane, and cytochrome c is on the intermembrane-space side.",
              ),
            }
          : s,
      ),
    },
  },
  sources: [
    {
      title: "Paramecium ATP synthase dimer · 26 Å map EMD-3441",
      url: "https://www.ebi.ac.uk/emdb/EMD-3441",
    },
    {
      title: "Bovine mitochondrial ATP synthase c8 ring · PDB 2XND",
      url: "https://www.rcsb.org/structure/2XND",
    },
    {
      title: "Yeast mitochondrial ATP synthase c10 ring · PDB 3U2F",
      url: "https://www.rcsb.org/structure/3U2F",
    },
    {
      title:
        "Plant mitochondrial ATP synthase subtomogram averages · Blum et al. 2025",
      url: "https://doi.org/10.1107/S2052252525006220",
    },
    {
      title:
        "Paramecium mitochondrial ATP synthase architecture · Mühleip et al. 2016",
      url: "https://doi.org/10.1073/pnas.1525430113",
    },
    {
      title: "NCBI Bookshelf · The Mitochondrion",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26894/",
    },
    {
      title: "Structure and mechanism of respiratory III–IV supercomplexes",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8361435/",
    },
    {
      title: "Structure of the yeast NADH dehydrogenase Ndi1",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3458368/",
    },
  ],
};
