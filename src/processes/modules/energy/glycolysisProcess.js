import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { energyDetails } from "./detailKit.js";

function create() {
  const k = sceneKit(),
    { group, material, ball, segment, label } = k;
  const details = energyDetails(k);
  const carbonMat = material("#799f9a"),
    bondMat = material("#b3c6bf"),
    phosphateMat = material("#d5a760");
  const enzymeMat = material("#8a9fb8");
  const pocketMat = material("#70879f");
  const nucleotideMat = material("#aa93b8"),
    nadMat = material("#ca8f7b");
  // Open-chain carbon accounting, intentionally not an atomic structural formula.
  const carbons = Array.from({ length: 6 }, () =>
    ball([0, 0, 0], 0.135, carbonMat),
  );
  carbons.forEach((o, i) => {
    o.name = `carbon-${i}`;
  });
  const bonds = Array.from({ length: 5 }, () => k.mesh(k.cylinder, bondMat));
  const vector = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  const positions = Array.from({ length: 6 }, () => new THREE.Vector3());
  const substrateP = Array.from({ length: 2 }, () =>
    details.phosphate(group, [0, 0, 0], 0.78),
  );
  const addedP = Array.from({ length: 2 }, () =>
    details.phosphate(group, [0, 0, 0], 0.78),
  );
  const investmentP = Array.from({ length: 2 }, () =>
    details.phosphate(group, [0, 0, 0], 0.78),
  );
  const nad = Array.from({ length: 2 }, () => {
    const g = new THREE.Group();
    group.add(g);
    g.name = "NAD-dinucleotide-schematic";
    details.nucleotide(g, [-0.18, 0, 0], 0.43);
    const points = Array.from({ length: 6 }, (_, i) => [
      0.2 + 0.115 * Math.cos((i * Math.PI) / 3),
      0.115 * Math.sin((i * Math.PI) / 3),
      0,
    ]);
    for (let i = 0; i < 6; i++) {
      segment(points[i], points[(i + 1) % 6], 0.023, nadMat, g);
      ball(points[i], 0.033, nadMat, g);
    }
    segment([-0.12, -0.15, 0], [0.13, -0.12, 0], 0.022, bondMat, g);
    details.phosphate(g, [-0.04, -0.15, 0], 0.32);
    details.phosphate(g, [0.06, -0.15, 0], 0.32);
    return g;
  });
  const phosphateLinks = Array.from({ length: 4 }, () =>
    k.mesh(k.cylinder, bondMat),
  );
  phosphateLinks.forEach((o, i) => {
    o.name = `substrate-phosphate-bond-${i}`;
  });
  substrateP.forEach((o, i) => {
    o.name = `inherited-phosphate-${i}`;
  });
  addedP.forEach((o, i) => {
    o.name = `oxidation-phosphate-${i}`;
  });
  investmentP.forEach((o, i) => {
    o.name = `investment-phosphate-${i}`;
  });
  const migrated = new THREE.Vector3();
  const enzymeLobes = [];
  for (const side of [-1, 1]) {
    const x = side * 1.65;
    const enzyme = new THREE.Group();
    group.add(enzyme);
    enzyme.position.set(x, -0.25, -0.3);
    const left = details.fold(
      enzyme,
      [-0.58, 0, 0],
      [0.85, 1.4, 1.15],
      enzymeMat,
    );
    const right = details.fold(
      enzyme,
      [0.58, 0, 0],
      [0.85, 1.4, 1.15],
      enzymeMat,
    );
    right.rotation.y = 0.25;
    left.rotation.y = -0.25;
    // The open-front substrate cleft has a structured hinge and two facing
    // catalytic ridges; no translucent shell obscures phosphate transfer.
    k.tube(
      [
        [-0.4, -0.5, 0],
        [-0.18, -0.65, -0.15],
        [0.16, -0.64, -0.15],
        [0.4, -0.5, 0],
      ],
      0.07,
      pocketMat,
      enzyme,
      24,
    );
    for (const side of [-1, 1]) {
      details.helix(
        enzyme,
        [side * 0.3, -0.08, 0.12],
        0.58,
        pocketMat,
        side * 0.2,
      );
      for (let i = 0; i < 3; i++)
        segment(
          [side * 0.22, -0.22 + i * 0.17, 0.18],
          [side * 0.1, -0.17 + i * 0.17, 0.12],
          0.023,
          phosphateMat,
          enzyme,
        );
    }
    enzymeLobes.push({ left, right });
    // Nucleotide binding pockets adjacent to the substrate cleft.
    for (const y of [-0.2, -1.6]) {
      const core = details.nucleotide(group, [side * 3.35, y, 0], 0.68);
      core.rotation.z = side * 0.35;
      for (let j = 0; j < 2; j++)
        details.phosphate(group, [side * (3.05 - j * 0.21), y, 0], 0.44);
    }
    details.nucleotide(group, [side * 3.5, 2, 0], 0.68);
    for (let j = 0; j < 2; j++)
      details.phosphate(group, [side * (3.2 - j * 0.21), 2, 0], 0.44);
  }
  // Soft spatial markers distinguish cytosolic reaction stations without inventing a conduit.
  const slabMat = material("#c8d2c8", {
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const plane = k.mesh(
    new THREE.BoxGeometry(8.2, 0.06, 2.3),
    slabMat,
    [0, -2.7, -0.4],
  );
  plane.rotation.x = 0.08;
  const labels = [
    label(
      [0, 2.7, 0],
      "胞质溶胶 · 六碳骨架示意",
      "Cytosol · six-carbon bookkeeping",
      2,
    ),
    label([0, 2.25, 0], "葡萄糖 · 6 C", "Glucose · 6 C", 2),
    label([-3.4, 2.4, 0], "投入 ATP", "ATP invested", 1),
    label([3.4, 2.4, 0], "投入 ATP", "ATP invested", 1),
    label([-1.65, 0.68, 0], "三碳中间体", "Three-carbon intermediate", 2),
    label([1.65, 0.68, 0], "三碳中间体", "Three-carbon intermediate", 2),
    label(
      [0, -0.45, 0.3],
      "磷酸基团转移 · 放大示意",
      "Phosphate transfer · enlarged schematic",
      1,
    ),
    label([-3.5, 0.22, 0], "ADP → ATP", "ADP → ATP", 2),
    label([3.5, 0.22, 0], "ADP → ATP", "ADP → ATP", 2),
    label([-3.5, -1.27, 0], "第二次 ADP → ATP", "Second ADP → ATP", 1),
    label([3.5, -1.27, 0], "第二次 ADP → ATP", "Second ADP → ATP", 1),
    label(
      [0, -2.78, 0.4],
      "每葡萄糖：净 2 ATP · 2 NADH · 2 丙酮酸",
      "Per glucose: net 2 ATP · 2 NADH · 2 pyruvate",
      2,
    ),
    label([-2.55, 1.13, 0.2], "NAD⁺ → NADH", "NAD⁺ → NADH", 1),
    label([2.55, 1.13, 0.2], "NAD⁺ → NADH", "NAD⁺ → NADH", 1),
  ];
  const update = (progress) => {
    const p = clamp(progress),
      split = ease(p, 0.25, 0.4),
      descend = ease(p, 0.38, 0.56),
      finish = ease(p, 0.77, 0.97);
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1,
        local = i % 3;
      const initialX = (i - 2.5) * 0.42,
        initialY = 1.7 + (i % 2) * 0.11;
      const splitX = side * 1.65 + (local - 1) * 0.29;
      const splitY = 1.22 + (local % 2) * 0.11;
      positions[i].set(
        initialX + (splitX - initialX) * split,
        initialY + (splitY - initialY) * split - 1.5 * descend - 1.55 * finish,
        (local - 1) * 0.05 * split,
      );
      carbons[i].position.copy(positions[i]);
    }
    for (let i = 0; i < 5; i++) {
      const a = positions[i],
        c = positions[i + 1],
        o = bonds[i];
      o.position.copy(a).add(c).multiplyScalar(0.5);
      vector.copy(c).sub(a);
      o.scale.set(0.038, vector.length(), 0.038);
      o.quaternion.setFromUnitVectors(up, vector.normalize());
      o.visible = i !== 2 || split < 0.25;
    }
    const invest = ease(p, 0.06, 0.24),
      oxidize = ease(p, 0.43, 0.55),
      first = ease(p, 0.58, 0.71),
      rearrange = ease(p, 0.715, 0.75),
      second = ease(p, 0.78, 0.91);
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1,
        end = positions[i ? 5 : 0],
        other = positions[i ? 3 : 2],
        middle = positions[i ? 4 : 1];
      // Net 3-PG -> 2-PG position change. The enzyme-bound intermediate is
      // omitted: detach during rearrangement rather than sliding a covalent
      // bond along the carbon chain. This is group bookkeeping, not atom tracing.
      migrated.copy(end).lerp(middle, rearrange);
      const sx = migrated.x + side * 0.25 * (1 - rearrange),
        sy =
          migrated.y +
          0.13 +
          0.15 * rearrange +
          0.15 * Math.sin(Math.PI * rearrange);
      investmentP[i].position.set(
        side * 2.73 + (sx - side * 2.73) * invest,
        2 + (sy - 2) * invest,
        0.1,
      );
      investmentP[i].visible = p < 0.24;
      substrateP[i].position.set(
        sx + (side * 2.59 - sx) * second,
        sy + (-1.6 - sy) * second,
        0.12,
      );
      substrateP[i].visible = p >= 0.24;
      const ax = other.x - side * 0.24,
        ay = other.y + 0.15;
      const ox = side * 2.65 + (ax - side * 2.65) * oxidize,
        oy = 0.8 + (ay - 0.8) * oxidize;
      addedP[i].position.set(
        ox + (side * 2.59 - ox) * first,
        oy + (-0.2 - oy) * first,
        0.15,
      );
      addedP[i].visible = p > 0.42;
      for (let which = 0; which < 2; which++) {
        const carbon = which ? other : p >= 0.75 ? middle : end,
          phosphate = which ? addedP[i] : substrateP[i],
          link = phosphateLinks[i * 2 + which];
        link.position.copy(carbon).add(phosphate.position).multiplyScalar(0.5);
        vector.copy(phosphate.position).sub(carbon);
        link.scale.set(0.025, Math.max(0.001, vector.length()), 0.025);
        link.quaternion.setFromUnitVectors(up, vector.normalize());
        link.visible = which
          ? p > 0.54 && p <= 0.58
          : p >= 0.24 && p <= 0.78 && !(p > 0.715 && p < 0.75);
      }
      nad[i].position.set(
        side * (1.5 + 0.95 * oxidize),
        0.7 + 0.3 * oxidize,
        0.25,
      );
      nad[i].visible = p > 0.42;
      const close = Math.sin(Math.PI * ease(p, 0.54, 0.74));
      enzymeLobes[i].left.position.x = -0.58 + 0.12 * close;
      enzymeLobes[i].right.position.x = 0.58 - 0.12 * close;
    }
    labels[1].text =
      p < 0.24
        ? b("葡萄糖 → 己糖二磷酸 · 6 C", "Glucose → hexose bisphosphate · 6 C")
        : b("裂解并异构化 → 2 × GAP", "Cleavage and isomerization → 2 × GAP");
    labels[1].active = p < 0.43;
    for (const i of [4, 5]) {
      labels[i].text =
        p >= 0.91
          ? b("丙酮酸 · 3 C", "Pyruvate · 3 C")
          : p > 0.78
            ? b("PEP → 丙酮酸 · 3 C", "PEP → pyruvate · 3 C")
            : p > 0.75
              ? b("PEP · 3 C", "PEP · 3 C")
              : p > 0.71
                ? b("3-PG → 2-PG", "3-PG → 2-PG")
                : p > 0.55
                  ? b("1,3-BPG → 3-PG", "1,3-BPG → 3-PG")
                  : b("GAP · 3 C", "GAP · 3 C");
      labels[i].position[1] = positions[i === 4 ? 1 : 4].y + 0.6;
      labels[i].active = p > 0.28;
    }
    labels[6].text =
      p > 0.71 && p <= 0.77
        ? b(
            "变位与脱水 · 磷酸移至 C2",
            "Rearrangement and dehydration · phosphate at C2",
          )
        : p > 0.77
          ? b("丙酮酸激酶 · 第二次转移", "Pyruvate kinase · second transfer")
          : b(
              "磷酸甘油酸激酶 · 第一次转移",
              "Phosphoglycerate kinase · first transfer",
            );
    labels[6].active = p > 0.54;
    labels[11].active = p > 0.89;
    for (const i of [7, 8]) labels[i].active = p > 0.52;
    for (const i of [9, 10]) labels[i].active = p > 0.76;
    for (const i of [12, 13]) labels[i].active = p > 0.43;
    group.userData = {
      process: "glycolysis",
      compartment: "cytosol",
      carbonCount: 6,
      carbonProducts: split > 0.99 ? [3, 3] : [6],
      atpInvested: p >= 0.24 ? 2 : p > 0.06 ? 1 : 0,
      atpProduced: p >= 0.91 ? 4 : p >= 0.71 ? 2 : 0,
      netATP: p >= 0.91 ? 2 : null,
      nadhProduced: p >= 0.55 ? 2 : 0,
      pyruvateProduced: p >= 0.97 ? 2 : 0,
      directOxygenRequirement: false,
      phosphateTransfers: [first, second],
      progress: p,
    };
  };
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 1.5, 11.5], target: [0, 0, 0] },
  };
}

export default {
  id: "glycolysis",
  title: b("糖酵解：碳与磷酸的去向", "Glycolysis: carbon & phosphate"),
  intro: b(
    "在胞质溶胶中追踪一个葡萄糖的六个碳。六个球表示碳记账；双路与酶口袋是反应步骤的空间排布，不表示固定的多酶复合体或原子结构。植物另有质体糖酵解，此处只展示胞质通路。",
    "Track the six carbons of one glucose in the cytosol. Spheres track carbon; paired branches and enzyme clefts spatially organize reaction steps, not a fixed multienzyme assembly or atomic structure. Plants also have plastid glycolysis; only the cytosolic route is shown.",
  ),
  duration: 34,
  legend: [
    { color: "#799f9a", text: b("碳骨架", "Carbon skeleton") },
    { color: "#d5a760", text: b("磷酸基团", "Phosphate groups") },
    { color: "#aa93b8", text: b("腺嘌呤核苷酸", "Adenine nucleotides") },
    { color: "#ca8f7b", text: b("NAD⁺ / NADH", "NAD⁺ / NADH") },
  ],
  stages: [
    {
      at: 0,
      title: b("六碳底物", "Six-carbon substrate"),
      description: b(
        "葡萄糖进入十步反应序列。碳骨架简化为六个相连的球；这条通路不直接消耗氧。",
        "Glucose enters a ten-reaction sequence. Six joined spheres simplify its carbon skeleton; this pathway does not directly consume oxygen.",
      ),
    },
    {
      at: 0.08,
      title: b("先投入两个 ATP", "Invest two ATP"),
      description: b(
        "己糖激酶和磷酸果糖激酶各消耗一个 ATP，经过异构化等步骤形成果糖-1,6-二磷酸。两个磷酸基团加入六碳底物。",
        "Hexokinase and phosphofructokinase each use one ATP. With intervening isomerization, the pathway forms fructose 1,6-bisphosphate with two added phosphate groups.",
      ),
    },
    {
      at: 0.27,
      title: b("六碳变为两个三碳", "Six carbons become two trioses"),
      description: b(
        "醛缩酶产生 GAP 与 DHAP；磷酸丙糖异构酶将 DHAP 转为 GAP。此后每个反应对一个葡萄糖发生两次。",
        "Aldolase produces GAP and DHAP; triose phosphate isomerase converts DHAP to GAP. Each subsequent reaction occurs twice per glucose.",
      ),
    },
    {
      at: 0.44,
      title: b("氧化并接入无机磷酸", "Oxidation and inorganic phosphate"),
      description: b(
        "GAP 脱氢酶将两个 GAP 氧化，生成两个 NADH，并分别接入无机磷酸，形成两个 1,3-二磷酸甘油酸。此处不再投入 ATP。",
        "GAP dehydrogenase oxidizes both GAP molecules, producing two NADH and incorporating inorganic phosphate to form two 1,3-bisphosphoglycerates, without spending additional ATP.",
      ),
    },
    {
      at: 0.58,
      title: b("第一次底物水平磷酸化", "First substrate-level phosphorylation"),
      description: b(
        "磷酸甘油酸激酶将高转移势的磷酸基团直接交给 ADP。两路各生成一个 ATP，得到两个 3-磷酸甘油酸。酶的两叶示意底物结合与闭合。",
        "Phosphoglycerate kinase directly transfers a high-transfer-potential phosphate to ADP. Each branch makes one ATP and one 3-phosphoglycerate. The two enzyme lobes illustrate binding and closure.",
      ),
    },
    {
      at: 0.78,
      title: b("再生成两个 ATP", "Produce two more ATP"),
      description: b(
        "变位反应使磷酸由末端 C3 改接中间 C2，再脱水形成 PEP；丙酮酸激酶将其磷酸交给 ADP。再次生成两个 ATP，并得到两个三碳丙酮酸；六个碳全部保留。",
        "Rearrangement shifts the phosphate position from terminal C3 to middle C2; dehydration then forms PEP; pyruvate kinase transfers its phosphate to ADP. This makes two more ATP and two three-carbon pyruvates, retaining all six carbons.",
      ),
    },
    {
      at: 0.93,
      title: b("净收益与继续运行", "Net yield and continued flux"),
      description: b(
        "每个葡萄糖生成四个 ATP、投入两个，净得两个 ATP，以及两个 NADH 和两个丙酮酸。NADH 必须在其他反应中再氧化，补回 NAD⁺，通路才能持续。",
        "Per glucose, four ATP are produced and two invested: net two ATP, plus two NADH and two pyruvate. Other reactions must reoxidize NADH to replenish NAD⁺ for continued glycolysis.",
      ),
    },
  ],
  create,
  sources: [
    {
      title: "IUBMB EC 5.4.2.11 · Phosphoglycerate mutase",
      url: "https://iubmb.qmul.ac.uk/enzyme/EC5/4/2/11.html",
    },
    {
      title: "IUBMB EC 4.2.1.11 · Enolase",
      url: "https://iubmb.qmul.ac.uk/enzyme/EC4/2/1/11.html",
    },
    {
      title: "NCBI Bookshelf · How Cells Obtain Energy from Food",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26882/",
    },
    {
      title: "Glycolysis · pathway and reaction energetics",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8091952/",
    },
  ],
};
