import { proteinPocket, wallAnatomy, materialInventory } from "./anatomy.js";
import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";
function create() {
  const k = sceneKit(),
    { group } = k;
  const carbon = k.material("#719b95"),
    oxygen = k.material("#bd8e80"),
    bondMat = k.material("#a5b1ac");
  const enzymeMat = k.material("#c7b69c", {
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const cofactorMat = k.material("#8b8eb4"),
    hydrogenMat = k.material("#d0b478"),
    atpMat = k.material("#c09b5e");
  // Flattened cytosolic compartment, bounded by a yeast cell wall silhouette.
  const cell = k.ball(
    [0, 0, -0.9],
    [4.25, 2.55, 0.7],
    k.material("#d4c8ac", {
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    }),
  );
  const outline = k.ring([0, 0, -0.65], 1, 0.013, k.material("#b9ae93"));
  outline.scale.set(4.25, 2.55, 1);
  const pdc = new THREE.Group(),
    adh = new THREE.Group();
  group.add(pdc, adh);
  pdc.position.set(0.0, 0, -0.22);
  adh.position.set(2.0, 0, -0.22);
  wallAnatomy(k, cell);
  proteinPocket(k, pdc, "#baa888");
  proteinPocket(k, adh, "#acb4a3");
  const carbons = Array.from({ length: 6 }, () =>
    k.ball([0, 0, 0], 0.16, carbon),
  );
  const bonds = Array.from({ length: 6 }, () =>
    k.segment([0, 0, 0], [1, 0, 0], 0.04, bondMat),
  );
  carbons.forEach((c, i) => {
    c.name = `fermentation-carbon-${i}`;
  });
  bonds.forEach((b, i) => {
    b.name = `fermentation-carbon-bond-${i}`;
  });
  const co2O = Array.from({ length: 4 }, () => k.ball([0, 0, 0], 0.12, oxygen));
  const co2B = Array.from({ length: 4 }, () =>
    k.segment([0, 0, 0], [1, 0, 0], 0.025, bondMat),
  );
  const redoxBadge = Array.from({ length: 2 }, () =>
    k.ball([0, 0, 0], [0.19, 0.11, 0.12], oxygen),
  );
  const carbonylBonds = Array.from({ length: 4 }, () =>
    k.segment([0, 0, 0], [1, 0, 0], 0.025, bondMat),
  );
  const hydroxylH = Array.from({ length: 2 }, () =>
    k.ball([0, 0, 0], 0.068, hydrogenMat),
  );
  const hydroxylBonds = Array.from({ length: 2 }, () =>
    k.segment([0, 0, 0], [1, 0, 0], 0.022, bondMat),
  );
  const tempBondA = new THREE.Vector3(),
    tempBondB = new THREE.Vector3();
  const nad = Array.from({ length: 2 }, () => {
    const g = new THREE.Group();
    group.add(g);
    for (const cx of [-0.15, 0.17])
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2,
          b = ((i + 1) / 6) * Math.PI * 2;
        k.segment(
          [cx + 0.105 * Math.cos(a), 0.105 * Math.sin(a), 0],
          [cx + 0.105 * Math.cos(b), 0.105 * Math.sin(b), 0],
          0.016,
          cofactorMat,
          g,
        );
        k.ball(
          [cx + 0.105 * Math.cos(a), 0.105 * Math.sin(a), 0],
          0.027,
          cofactorMat,
          g,
        );
      }
    k.tube(
      [
        [-0.045, -0.03, 0],
        [0, -0.105, 0],
        [0.075, -0.03, 0],
      ],
      0.018,
      cofactorMat,
      g,
      16,
    );
    const hyd = k.ball([0, 0.16, 0], 0.065, hydrogenMat, g);
    return { g, hyd };
  });
  const atp = Array.from({ length: 2 }, (_, i) => {
    const g = new THREE.Group();
    group.add(g);
    g.position.set(-2.55 + i * 0.53, -1.47, 0.12);
    for (let j = 0; j < 3; j++) k.ball([j * 0.09, 0, 0], 0.07, atpMat, g);
    return g;
  });
  const environmentalOxygen = Array.from({ length: 3 }, (_, i) => {
    const g = new THREE.Group();
    group.add(g);
    g.position.set(2.9 + i * 0.33, 1.68, 0.05);
    k.ball([-0.06, 0, 0], 0.075, oxygen, g);
    k.ball([0.06, 0, 0], 0.075, oxygen, g);
    return g;
  });
  const pts = Array.from({ length: 6 }, () => new THREE.Vector3()),
    direction = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  const setBond = (mesh, a, b) => {
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    direction.copy(b).sub(a);
    mesh.scale.set(0.034, Math.max(direction.length(), 0.0001), 0.034);
    mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  };
  const loop = k.tube(
    [
      [2.3, 1.3, 0],
      [1.6, 2.0, 0],
      [-0.8, 2.0, 0],
      [-2.7, 1.25, 0],
    ],
    0.018,
    k.material("#a5a4be"),
  );
  const labels = [
    k.label([-2.5, 0.1, 0.7], "葡萄糖 · 6 碳", "Glucose · 6 carbons", 10),
    k.label(
      [-0.9, 1.22, 0.6],
      "2 丙酮酸 · 各 3 碳",
      "2 pyruvate · 3 C each",
      10,
    ),
    k.label([0.4, -1.3, 0.5], "丙酮酸脱羧酶", "Pyruvate decarboxylase", 8),
    k.label([2, -1.3, 0.5], "乙醇脱氢酶", "Alcohol dehydrogenase", 8),
    k.label([1, 1.1, 0.5], "2 乙醛 · 各 2 碳", "2 acetaldehyde · 2 C each", 10),
    k.label([2.7, 1.1, 0.5], "2 乙醇 · 各 2 碳", "2 ethanol · 2 C each", 10),
    k.label([0.7, -2, 0.3], "2 CO₂", "2 CO₂", 9),
    k.label([-2.15, -1.9, 0.2], "糖酵解净产 2 ATP", "Glycolysis: net 2 ATP", 9),
    k.label(
      [-0.35, 2.25, 0],
      "NAD⁺ 再生并返回糖酵解",
      "NAD⁺ recycled to glycolysis",
      10,
    ),
    k.label([-2.9, 2.15, 0], "酿酒酵母 · 胞质", "S. cerevisiae · cytosol", 7),
    k.label([3.3, 2.08, 0], "有氧 + 高糖", "O₂ + high glucose", 8),
    k.label([2.15, 0.25, 0.6], "NADH → NAD⁺", "NADH → NAD⁺", 9),
  ];
  function update(raw, parameters = {}) {
    const p = clamp(raw),
      glycolysis = ease(p, 0.08, 0.3),
      entry = ease(p, 0.32, 0.45),
      decarb = ease(p, 0.43, 0.58),
      reduction = ease(p, 0.64, 0.79),
      exit = ease(p, 0.8, 0.92),
      recycle = ease(p, 0.78, 1);
    const aerobic = parameters.condition === "aerobic";
    for (let lane = 0; lane < 2; lane++)
      for (let j = 0; j < 3; j++) {
        const i = lane * 3 + j;
        // Open-chain carbon bookkeeping, with no fictitious C6-C1 bond.
        const gx = -3.18 + i * 0.25,
          gy = i % 2 ? 0.12 : -0.12;
        const px =
          -1.62 +
          j * 0.36 +
          entry * 0.8 +
          (j > 0 ? reduction * 1.45 + exit * 0.48 : decarb * 0.9);
        const py =
          (lane === 0 ? 0.62 : -0.62) +
          (j === 0 ? decarb * (lane === 0 ? 0.88 : -0.88) : 0);
        pts[i].set(
          THREE.MathUtils.lerp(gx, px, glycolysis),
          THREE.MathUtils.lerp(gy, py, glycolysis),
          0.12,
        );
        carbons[i].position.copy(pts[i]);
        carbons[i].material = carbon;
      }
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      setBond(bonds[i], pts[i], pts[next]);
      bonds[i].visible =
        i < 5 &&
        (glycolysis < 0.05 ||
          (i === 0 || i === 3 ? decarb < 0.96 : i === 1 || i === 4));
    }
    for (let lane = 0; lane < 2; lane++) {
      const base = pts[lane * 3];
      for (let side = 0; side < 2; side++) {
        const i = lane * 2 + side,
          o = co2O[i];
        o.visible = co2B[i].visible = glycolysis > 0.98;
        o.position.copy(base);
        o.position.x +=
          (side === 0 ? -1 : 1) * 0.27 * decarb - 0.19 * (1 - decarb);
        o.position.y += (side === 0 ? -1 : 1) * 0.23 * (1 - decarb);
        setBond(co2B[i], base, o.position);
      }
      const b = redoxBadge[lane];
      b.visible = glycolysis > 0.98;
      b.position.copy(pts[lane * 3 + 1]);
      b.position.y += 0.32;
      b.scale.setScalar(0.12);
      for (let j = 0; j < 2; j++) {
        const bond = carbonylBonds[lane * 2 + j];
        bond.visible = b.visible && (j === 0 || reduction < 0.8);
        tempBondA.copy(pts[lane * 3 + 1]);
        tempBondB.copy(b.position);
        tempBondA.x += j === 0 ? -0.027 : 0.027;
        tempBondB.x += j === 0 ? -0.027 : 0.027;
        setBond(bond, tempBondA, tempBondB);
        bond.scale.x = bond.scale.z = 0.021;
      }
      hydroxylH[lane].visible = hydroxylBonds[lane].visible = reduction > 0.8;
      hydroxylH[lane].position.copy(b.position);
      hydroxylH[lane].position.x += 0.18;
      hydroxylH[lane].position.y += 0.08;
      setBond(hydroxylBonds[lane], b.position, hydroxylH[lane].position);
      const h = nad[lane];
      h.g.visible = p > 0.2;
      const toAdh = ease(p, 0.29, 0.63);
      h.g.position.set(
        THREE.MathUtils.lerp(-2.2, 2.08, toAdh) - 4.55 * recycle,
        (lane === 0 ? 1.15 : -1.15) * (1 - recycle) +
          (1.85 * Math.sin(Math.PI * recycle) + 0.5) * recycle,
        0.35,
      );
      h.hyd.visible = reduction < 0.8;
      atp[lane].visible = p > 0.27;
      atp[lane].scale.setScalar(0.8 + 0.2 * glycolysis);
    }
    environmentalOxygen.forEach((o) => {
      o.visible = aerobic;
    });
    loop.visible = p > 0.64;
    labels[0].active = p < 0.21;
    labels[1].active = p >= 0.21 && p < 0.49;
    labels[4].active = p >= 0.49 && p < 0.72;
    labels[5].active = p >= 0.72;
    labels[6].active = p > 0.47;
    labels[7].active = p > 0.27;
    labels[8].active = p > 0.76;
    labels[10].active = aerobic;
    labels[11].active = p > 0.56 && p < 0.87;
    group.userData = {
      species: "Saccharomyces cerevisiae",
      process: "alcoholicFermentation",
      progress: p,
      compartment: "cytosol",
      condition: aerobic ? "high-glucose-aerobic" : "high-glucose-anaerobic",
      fermentationActive: true,
      oxygenShutsOffFermentation: false,
      carbonCount: 6,
      ethanolCarbonCount: p > 0.79 ? 4 : 0,
      carbonDioxideCarbonCount: p > 0.58 ? 2 : 0,
      atpSource: "glycolysis",
      netGlycolyticATP: p > 0.3 ? 2 : 0,
      fermentationStepATP: 0,
      nadRegenerated: p >= 0.79,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    materials: materialInventory(group, [
      carbon,
      oxygen,
      bondMat,
      enzymeMat,
      cofactorMat,
      hydrogenMat,
      atpMat,
    ]),
    camera: { position: [0, 1.1, 11.5], target: [0, 0, 0] },
  };
}
export default {
  id: "yeastFermentation",
  title: B("酵母酒精发酵", "Yeast alcoholic fermentation"),
  duration: 30,
  intro: B(
    "酿酒酵母胞质中的碳去向与辅酶循环。圆球表示碳骨架，氧基团与 C=O → C–OH 的键变化另作标注；并非完整原子结构。多结构域酶口袋及螺旋/折叠为示意而非原子重建，反应时间非真实比例。两种条件都供应高糖：有氧时也可发酵（Crabtree 效应），呼吸支路未展开。",
    "Carbon fate and cofactor recycling in the S. cerevisiae cytosol. Spheres track carbon skeletons; Oxygen groups and the C=O to C–OH bond change are annotated, but these are not complete atomic structures. Multidomain enzyme pockets, helices and sheets are schematic rather than atomic reconstructions; timing is not to scale. Both conditions provide abundant glucose: aerobic fermentation can persist through the Crabtree effect. The respiratory branch is not expanded.",
  ),
  controls: [
    {
      id: "condition",
      label: B("高糖条件下的氧气", "Oxygen under high glucose"),
      default: "anaerobic",
      options: [
        {
          value: "anaerobic",
          label: B("无氧 · 高糖", "Anaerobic · high glucose"),
        },
        { value: "aerobic", label: B("有氧 · 高糖", "Aerobic · high glucose") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("胞质中的葡萄糖", "Glucose in the cytosol"),
      description: B(
        "一个六碳葡萄糖进入糖酵解。绿色球用开放碳链追踪六个碳；省略氢、氧及糖环化，保留碳骨架的连接次序。",
        "One six-carbon glucose enters glycolysis. An open carbon chain tracks its six carbons; hydrogen, oxygen and sugar cyclization are omitted while carbon connectivity is retained.",
      ),
    },
    {
      at: 0.19,
      title: B("糖酵解提供 ATP 与 NADH", "Glycolysis supplies ATP and NADH"),
      description: B(
        "经多个未逐一展示的步骤，一个葡萄糖转为两个三碳丙酮酸，净生成 2 ATP 并将 2 NAD⁺ 还原为 NADH。这里的 ATP 来自糖酵解。",
        "Through multiple steps not individually expanded, one glucose yields two three-carbon pyruvates, net 2 ATP, and reduction of 2 NAD⁺ to NADH. ATP shown here comes from glycolysis.",
      ),
    },
    {
      at: 0.4,
      title: B("脱羧：三碳变两碳", "Decarboxylation: three carbons to two"),
      description: B(
        "丙酮酸脱羧酶使每个丙酮酸释放一个 CO₂，留下一个两碳乙醛。此步不产生 ATP；CO₂ 是脱羧产物，不是氧气直接燃烧葡萄糖的结果。",
        "Pyruvate decarboxylase releases one CO₂ from each pyruvate, leaving two-carbon acetaldehyde. This step makes no ATP; the CO₂ is a decarboxylation product, not a result of direct burning by oxygen.",
      ),
    },
    {
      at: 0.6,
      title: B("乙醛还原为乙醇", "Reduce acetaldehyde to ethanol"),
      description: B(
        "乙醇脱氢酶用 NADH 提供的还原力将乙醛变为乙醇，并再生 NAD⁺。紫色辅酶失去金色标记，表示还原当量的转移，并非完整分子结构。",
        "Alcohol dehydrogenase uses reducing equivalents from NADH to reduce acetaldehyde to ethanol, regenerating NAD⁺. Loss of the gold mark on the purple cofactor symbolizes reducing-equivalent transfer, not a full molecular structure.",
      ),
    },
    {
      at: 0.8,
      title: B("NAD⁺ 使糖酵解可继续", "NAD⁺ allows glycolysis to continue"),
      description: B(
        "再生的 NAD⁺ 返回糖酵解。一个葡萄糖的六个碳最终分布于两个乙醇与两个 CO₂；从丙酮酸到乙醇的步骤本身不再增加 ATP。",
        "Regenerated NAD⁺ returns to glycolysis. The six glucose carbons are distributed among two ethanol and two CO₂ molecules. Conversion of pyruvate to ethanol adds no further ATP.",
      ),
    },
    {
      at: 0.93,
      title: B("氧气不是唯一开关", "Oxygen is not the only switch"),
      description: B(
        "高糖的酿酒酵母在有氧条件下仍可同时发酵和呼吸，这称为 Crabtree 效应。切换氧气条件可看到环境氧分子出现，发酵仍继续；真实通量还受菌株和培养条件影响。",
        "With abundant glucose, S. cerevisiae can ferment while also respiring in oxygen: the Crabtree effect. Changing the oxygen condition adds environmental O₂ while fermentation continues. Actual flux depends on strain and culture conditions.",
      ),
    },
  ],
  legend: [
    { color: "#719b95", text: B("示意碳骨架", "Schematic carbon skeleton") },
    {
      color: "#bd8e80",
      text: B("CO₂ / 氧与还原反应标记", "CO₂ / oxygen and reduction markers"),
    },
    { color: "#8b8eb4", text: B("NADH / NAD⁺", "NADH / NAD⁺") },
    { color: "#c09b5e", text: B("糖酵解的 ATP", "ATP from glycolysis") },
  ],
  sources: [
    {
      title: "ChEBI:4167 D-glucopyranose structure",
      url: "https://www.ebi.ac.uk/chebi/CHEBI:4167",
    },
    {
      title:
        "Stoichiometry and compartmentation of NADH metabolism in Saccharomyces cerevisiae",
      url: "https://academic.oup.com/femsre/article/25/1/15/606015",
    },
    {
      title: "Why, when, and how did yeast evolve alcoholic fermentation?",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4262006/",
    },
  ],
  create,
};
