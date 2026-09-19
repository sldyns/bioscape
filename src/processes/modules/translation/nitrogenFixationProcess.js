import {
  THREE,
  sceneKit,
  clamp,
  ease,
  phase,
  bilingual as b,
} from "../../kit.js";

import {
  cutawayLobe,
  helix,
  sheet,
  cubane,
  pCluster,
  feMoCofactor,
  ferredoxinFold,
} from "./molecularDetails.js";

function create({ rootId = "bacterium" } = {}) {
  const k = sceneKit(),
    { group } = k;
  const moMat = k.material("#879ea7", {
      side: THREE.DoubleSide,
    }),
    betaMat = k.material("#a3b8ab", {
      side: THREE.DoubleSide,
    });
  const iron = k.material("#b18762"),
    sulfur = k.material("#ccb776");
  const nitrogen = k.material("#7f9dbd"),
    hydrogen = k.material("#e0ddd0"),
    oxygen = k.material("#bf8a80");
  const moFe = new THREE.Group();
  group.add(moFe);
  moFe.position.set(0.9, 0, 0);
  for (const side of [-1, 1]) {
    const alphaSurface = cutawayLobe(
      k,
      moFe,
      [side * 0.8, 0.64, -0.18],
      [0.94, 0.91, 0.75],
      moMat,
      side,
    );
    alphaSurface.name = side < 0 ? "alpha-domain-left" : "alpha-domain-right";
    const betaSurface = cutawayLobe(
      k,
      moFe,
      [side * 0.83, -0.75, -0.21],
      [0.98, 0.84, 0.7],
      betaMat,
      side + 1,
    );
    betaSurface.name = side < 0 ? "beta-domain-left" : "beta-domain-right";
    for (const y of [0.65, -0.76]) {
      sheet(
        k,
        moFe,
        [side * 1.09, y, 0.01],
        0.62,
        0.94,
        5,
        k.material(y > 0 ? "#668d9e" : "#7e9e8c", { side: THREE.DoubleSide }),
      );
      for (let j = 0; j < 3; j++)
        helix(
          k,
          moFe,
          [side * (0.45 + j * 0.27), y - 0.43, -0.01],
          [side * (0.51 + j * 0.27), y + 0.41, -0.02],
          0.092,
          3.8,
          k.material(y > 0 ? "#b6c7cd" : "#b9cdbb"),
          0.031,
        );
    }
  }
  // Distinct cluster topology: [4Fe–4S], fused [8Fe–7S], and [7Fe–9S–Mo–C].
  pCluster(k, moFe, [-0.9, 0.04, 0.49], 0.108, iron, sulfur);
  const leftFeMo = feMoCofactor(k, moFe, [-0.8, 0.64, 0.05], 0.8);
  leftFeMo.name = "FeMo-alpha-left";
  pCluster(k, moFe, [0.92, -0.08, 0.13], 0.08, iron, sulfur);
  const rightFeMo = feMoCofactor(k, moFe, [0.8, 0.64, 0.05], 0.8);
  rightFeMo.name = "FeMo-alpha-right";
  // Alpha-domain pocket rims are continuous parts of each schematic domain.
  // They are not claimed residue-level metal ligands.
  for (const side of [-1, 1])
    k.tube(
      [
        [side * 0.8 - 0.46, 0.94, 0.15],
        [side * 0.8 - 0.48, 0.59, 0.13],
        [side * 0.8 - 0.31, 0.28, 0.1],
      ],
      0.042,
      k.material("#9ba8a1"),
      moFe,
      30,
    );
  const fe = new THREE.Group();
  group.add(fe);
  for (const y of [-0.43, 0.43]) {
    cutawayLobe(
      k,
      fe,
      [-0.32, y, -0.12],
      [0.66, 0.48, 0.52],
      k.material("#a794b1", { side: THREE.DoubleSide }),
      y,
    );
    sheet(
      k,
      fe,
      [-0.46, y, 0.16],
      0.55,
      0.52,
      4,
      k.material("#89769e", { side: THREE.DoubleSide }),
    );
    for (let j = 0; j < 2; j++)
      helix(
        k,
        fe,
        [-0.78 + j * 0.64, y - 0.22, 0.23],
        [-0.7 + j * 0.59, y + 0.23, 0.23],
        0.066,
        2.6,
        k.material("#cabbd2"),
        0.027,
      );
  }
  cubane(k, fe, [0.16, 0, 0.39], 0.13, iron, sulfur);
  const atps = [];
  for (const y of [-0.48, 0.48]) {
    const g = new THREE.Group();
    fe.add(g);
    g.position.set(-0.44, y, 0.47);
    k.ball([-0.22, 0, 0], [0.12, 0.15, 0.07], k.material("#96afa8"), g);
    const phosphates = [];
    for (let j = 0; j < 3; j++)
      phosphates.push(k.ball([-0.06 + j * 0.13, 0, 0], 0.068, sulfur, g));
    atps.push({ g, phosphates });
  }
  const freePi = [
    k.ball([0, 0, 0], 0.068, sulfur),
    k.ball([0, 0, 0], 0.068, sulfur),
  ];
  const donor = new THREE.Group();
  group.add(donor);
  donor.position.set(-3.92, -1.6, 0.15);
  ferredoxinFold(
    k,
    donor,
    [0, 0, 0],
    0.66,
    k.material("#86a49b", { side: THREE.DoubleSide }),
  );
  cubane(k, donor, [0.08, 0.05, 0.31], 0.08, iron, sulfur);
  const electron = k.ball(
    [0, 0, 0],
    0.095,
    k.material("#e4c577", { emissive: "#af8135", emissiveIntensity: 0.35 }),
  );
  const relay = k.ball(
    [0, 0, 0],
    0.095,
    k.material("#e4c577", { emissive: "#af8135", emissiveIntensity: 0.35 }),
  );
  const substrate = new THREE.Group();
  group.add(substrate);
  for (const x of [-0.17, 0.17]) k.ball([x, 0, 0], 0.17, nitrogen, substrate);
  for (const y of [-0.06, 0, 0.06])
    k.segment([-0.12, y, 0.025], [0.12, y, 0.025], 0.017, nitrogen, substrate);
  const ammonia = [];
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group();
    group.add(g);
    k.ball([0, 0, 0], 0.19, nitrogen, g);
    for (let h = 0; h < 3; h++) {
      const a = (h * Math.PI * 2) / 3;
      const end = [0.31 * Math.cos(a), 0.31 * Math.sin(a), 0.16];
      k.ball(end, 0.09, hydrogen, g);
      k.segment([0, 0, 0], end, 0.035, hydrogen, g);
    }
    ammonia.push(g);
  }
  const h2 = new THREE.Group();
  group.add(h2);
  k.ball([-0.1, 0, 0], 0.095, hydrogen, h2);
  k.ball([0.1, 0, 0], 0.095, hydrogen, h2);
  k.segment([-0.1, 0, 0], [0.1, 0, 0], 0.026, hydrogen, h2);
  const protons = Array.from({ length: 3 }, (_, i) =>
    k.ball([1.6 + i * 0.45, 2.38, 0.12], 0.057, hydrogen),
  );
  const o2s = Array.from({ length: 3 }, (_, i) => {
    const g = new THREE.Group();
    group.add(g);
    k.ball([-0.1, 0, 0], 0.11, oxygen, g);
    k.ball([0.1, 0, 0], 0.11, oxygen, g);
    k.segment([-0.1, 0, 0], [0.1, 0, 0], 0.03, oxygen, g);
    return g;
  });
  const damage = k.ring([0.89, 0.6, 0.73], 0.55, 0.035, oxygen);
  damage.visible = false;
  const labels = [
    k.label([1.3, -2, 0.2], "MoFe 蛋白 · α₂β₂", "MoFe protein · α₂β₂", 2),
    k.label(
      [-2.2, 1.52, 0.3],
      "Fe 蛋白 · 电子供体",
      "Fe protein · electron donor",
      2,
    ),
    k.label([0.1, 1.24, 0.65], "α 内 FeMo 辅因子", "FeMo inside α", 2),
    k.label(
      [-0.14, -0.48, 0.72],
      "P 簇 · 电子中继",
      "P cluster · electron relay",
      1,
    ),
    k.label(
      [-4, -2.3, 0.3],
      "还原型铁氧还蛋白／黄素氧还蛋白",
      "Reduced ferredoxin / flavodoxin",
      1,
    ),
    k.label(
      [-2.62, -1.1, 0.65],
      "2 ATP → 2 ADP + 2 Pi／轮",
      "2 ATP → 2 ADP + 2 Pi / round",
      2,
    ),
    k.label([2.5, 2.55, 0.1], "N₂ 与质子供给", "N₂ and proton supply", 1),
    k.label([3.3, 0.5, 0.2], "2 NH₃", "2 NH₃", 2),
    k.label([2.28, -1.35, 0.2], "H₂ 副产物", "H₂ coproduct", 1),
    k.label(
      [0, 3.04, 0],
      "维涅兰德固氮菌 · 细胞质",
      "Azotobacter vinelandii · cytosol",
      1,
    ),
    k.label(
      [1, 1.92, 0.2],
      "氧暴露：氮酶失活",
      "Oxygen exposure: nitrogenase inactive",
      2,
    ),
  ];
  labels.push(
    k.label(
      [2.23, 1.57, 0.2],
      "α 亚基 · 每个含一个 FeMo",
      "α subunits · one FeMo each",
      1,
    ),
  );
  labels.push(
    k.label(
      [2.38, -1.58, 0.2],
      "β 亚基 · P 簇在 α/β 界面",
      "β subunits · P at α/β interface",
      1,
    ),
  );
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      exposed = parameters.oxygen === "exposed",
      blocked = exposed && p >= 0.19;
    const run = phase(p, 0.16, 0.78) * 8,
      cycle = Math.min(7, Math.floor(run)),
      q = run >= 8 ? 1 : run - Math.floor(run),
      dock = ease(q, 0, 0.24) * (1 - ease(q, 0.72, 0.98));
    const active = p >= 0.16 && p < 0.78 && !blocked;
    fe.position.set(
      blocked ? -2.95 : -2.95 + 1.15 * (active ? dock : 0),
      0,
      0.08,
    );
    fe.rotation.z = blocked ? -0.08 : 0;
    const hydrolyzed = q > 0.57 && active;
    for (let i = 0; i < atps.length; i++) {
      atps[i].phosphates[2].visible = !hydrolyzed;
      atps[i].g.position.x = -0.44 - (active ? 0.22 * ease(q, 0.76, 1) : 0);
      freePi[i].visible = hydrolyzed;
      freePi[i].position.set(
        fe.position.x + 0.15 + 0.6 * ease(q, 0.57, 0.95),
        (i ? 1 : -1) * (0.48 + 0.7 * ease(q, 0.57, 0.95)),
        0.6,
      );
    }
    // The catalytic P-cluster transfer precedes Fe-protein replenishment.
    relay.visible = active && q >= 0.25 && q < 0.43;
    const pr = phase(q, 0.25, 0.43);
    relay.position.set(0.1 * pr, 0.04 + 0.6 * pr, 0.49 - 0.44 * pr);
    electron.visible = active && ((q >= 0.43 && q < 0.55) || q < 0.13);
    const er = phase(q, 0.43, 0.55);
    electron.position.set(
      fe.position.x + 0.16 + (0 - fe.position.x - 0.16) * er,
      0.04,
      0.62,
    );
    if (active && q < 0.13) {
      const re = phase(q, 0, 0.13);
      electron.position.set(
        -3.84 + (fe.position.x + 0.16 + 3.84) * re,
        -1.55 * (1 - re),
        0.6,
      );
    }
    const product = blocked ? 0 : ease(p, 0.8, 0.98);
    substrate.visible = p < 0.81 || blocked;
    substrate.position.set(
      2.75 - 2.45 * ease(p, 0.02, 0.15),
      1.65 - 0.81 * ease(p, 0.02, 0.15),
      0.72 - 0.44 * ease(p, 0.02, 0.15),
    );
    substrate.scale.setScalar(blocked ? 1 : 1 - 0.35 * ease(p, 0.52, 0.78));
    ammonia.forEach((g, i) => {
      g.visible = !blocked && p >= 0.8;
      g.position.set(
        0.1 + 3.35 * product,
        0.64 + (i ? -0.6 : 0.6) * product,
        0.72,
      );
      g.scale.setScalar(0.6 + 0.4 * product);
    });
    h2.visible = !blocked && p >= 0.8;
    h2.position.set(0.1 + 2.2 * product, 0.64 - 1.72 * product, 0.6);
    protons.forEach((o, i) => {
      o.visible = active;
      o.position.set(
        1.5 + i * 0.38,
        0.9 + 1.25 * (1 - ((q + i / 3) % 1)),
        0.65,
      );
    });
    o2s.forEach((o, i) => {
      o.visible = exposed;
      o.position.set(
        1.8 + i * 0.6 - (0.7 + i * 0.3) * ease(p, 0.02, 0.2),
        2.35 - i * 0.45 - 0.7 * ease(p, 0.02, 0.2),
        0.75,
      );
    });
    damage.visible = blocked;
    damage.scale.setScalar(1 + 0.07 * Math.sin(p * 8));
    moMat.color.set(blocked ? "#ac9690" : "#879ea7");
    betaMat.color.set(blocked ? "#b6a69b" : "#a3b8ab");
    labels[7].active = !blocked && p >= 0.8;
    labels[8].active = labels[7].active;
    labels[10].active = blocked;
    labels[6].active = p < 0.8;
    labels[1].position[0] = fe.position.x;
    group.userData = {
      process: "nitrogenFixation",
      rootId,
      species: "Azotobacter vinelandii",
      enzyme: "Mo nitrogenase",
      compartment: "cytosol",
      condition: exposed
        ? "unprotected oxygen exposure"
        : "oxygen-protected enzyme",
      oxygenSensitive: true,
      allBacteriaFixNitrogen: false,
      structuralDetail:
        "alpha/beta MoFe subunits, Fe-protein nucleotide clefts, distinct cubane P-cluster and FeMo cofactor",
      electronTransferRounds: blocked ? 0 : Math.min(8, Math.floor(run)),
      minimumATPperN2: 16,
      minimumElectronsPerN2: 8,
      productsReleased: !blocked && p >= 0.98,
      ammoniaMolecules: !blocked && p >= 0.98 ? 2 : 0,
      hydrogenCoproduct: !blocked && p >= 0.98,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 2.25, 11], target: [-0.35, 0.15, 0] },
  };
}
export default {
  id: "nitrogenFixation",
  title: b("氮酶固氮", "Nitrogenase fixation"),
  duration: 36,
  intro: b(
    "维涅兰德固氮菌（Azotobacter vinelandii）细胞质中的钼氮酶。只放大一个催化半部的供电子循环；金属簇展示简化连接拓扑，并非原子坐标重建。该菌可在有氧环境生活，但必须保护氧敏感氮酶，并非所有细菌都能固氮。",
    "Molybdenum nitrogenase in the cytosol of Azotobacter vinelandii. Electron delivery to one catalytic half is enlarged; metal clusters show simplified connectivity, not an atomic-coordinate reconstruction. This bacterium lives aerobically but must protect its oxygen-sensitive nitrogenase. Nitrogen fixation is not universal among bacteria.",
  ),
  controls: [
    {
      id: "oxygen",
      label: b("酶的氧暴露", "Oxygen at the enzyme"),
      default: "protected",
      options: [
        { value: "protected", label: b("受到氧保护", "Oxygen protected") },
        {
          value: "exposed",
          label: b("无保护氧暴露", "Unprotected oxygen exposure"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b(
        "保护氮酶并提供底物",
        "Protect nitrogenase and supply substrate",
      ),
      description: b(
        "N₂ 是底物，ATP 与低电势电子来自细胞代谢。本菌可通过呼吸等方式保护氮酶；“受到氧保护”不等于整株细胞处于无氧环境。",
        "N₂ is the substrate; cellular metabolism supplies ATP and low-potential electrons. Respiration and other mechanisms protect this enzyme; oxygen protection does not mean the whole bacterium is anaerobic.",
      ),
    },
    {
      at: 0.16,
      title: b("Fe 蛋白携 ATP 对接", "ATP-loaded Fe protein docks"),
      description: b(
        "还原型 Fe 蛋白带有一个 [4Fe–4S] 簇和两个 ATP 结合位点，暂时对接 MoFe 蛋白。无保护氧暴露分支停止有效催化，不再生成产物。",
        "Reduced Fe protein has one [4Fe–4S] cluster and two ATP-binding sites and transiently docks to MoFe protein. Unprotected oxygen exposure stops productive catalysis and prevents product formation.",
      ),
    },
    {
      at: 0.3,
      title: b("簇间电子转移", "Electron transfer between clusters"),
      description: b(
        "P 簇先向 FeMo 辅因子传递电子，随后 Fe 蛋白补充 P 簇。光点仅表示电子传递方向；并非可见颗粒，也不代表完整原子级反应路径。",
        "The P cluster first transfers an electron toward FeMo cofactor, then Fe protein replenishes the P cluster. Light points indicate electron flow, not visible particles or a complete atomistic reaction pathway.",
      ),
    },
    {
      at: 0.46,
      title: b("ATP 水解与多轮回收", "ATP hydrolysis and repeated recycling"),
      description: b(
        "电子转移后发生 ATP 水解与磷酸释放，Fe 蛋白解离并重新还原、装载 ATP。画面压缩八轮单电子供给；实际 ATP 消耗及放氢量可能更高。",
        "Electron transfer is followed by ATP hydrolysis, phosphate release and Fe-protein dissociation, reduction and ATP reloading. Eight single-electron rounds are compressed here; actual ATP use and H₂ production may be higher.",
      ),
    },
    {
      at: 0.66,
      title: b("累积还原当量", "Accumulate reducing equivalents"),
      description: b(
        "最低总计量为 N₂ + 8 e⁻ + 8 H⁺ + 16 ATP → 2 NH₃ + H₂ + 16 ADP + 16 Pi。中间的含氮与金属氢化物状态未逐一描画。",
        "The limiting net balance is N₂ + 8 e⁻ + 8 H⁺ + 16 ATP → 2 NH₃ + H₂ + 16 ADP + 16 Pi. Individual nitrogen-containing and metal-hydride intermediates are not depicted.",
      ),
    },
    {
      at: 0.83,
      title: b("氨与氢气释放", "Ammonia and hydrogen emerge"),
      description: b(
        "受保护分支显示两个 NH₃ 与 H₂ 副产物。生理 pH 下游离氨主要质子化为 NH₄⁺；随后进入氮同化途径，而不是直接形成蛋白质。氧暴露分支保持失活。",
        "The protected branch shows two NH₃ molecules and an H₂ coproduct. At physiological pH, free ammonia is mainly protonated to NH₄⁺ and enters nitrogen-assimilation pathways, not protein directly. The exposed branch remains inactive.",
      ),
    },
  ],
  legend: [
    { color: "#879ea7", text: b("MoFe 蛋白", "MoFe protein") },
    { color: "#a794b1", text: b("Fe 蛋白", "Fe protein") },
    { color: "#b18762", text: b("金属簇定位示意", "Metal-cluster icons") },
    { color: "#7f9dbd", text: b("氮原子", "Nitrogen atoms") },
    { color: "#bf8a80", text: b("氧分子", "Oxygen molecules") },
  ],
  sources: [
    {
      title: "RCSB 3U7Q · A. vinelandii MoFe protein",
      url: "https://www.rcsb.org/structure/3U7Q",
    },
    {
      title:
        "Ligand binding to the FeMo-cofactor: structures of CO-bound and reactivated nitrogenase",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4205161/",
    },
    {
      title:
        "Transcriptional Profiling of Nitrogen Fixation in Azotobacter vinelandii",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3165507/",
    },
    {
      title:
        "Electron transfer precedes ATP hydrolysis during nitrogenase catalysis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3799366/",
    },
    {
      title: "Control of electron transfer in nitrogenase",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6324847/",
    },
    {
      title: "A low-potential terminal oxidase associated with nitrogenase",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6579470/",
    },
  ],
  create,
};
