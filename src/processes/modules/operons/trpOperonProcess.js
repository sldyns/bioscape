import {
  trackMaterials,
  duplex,
  nucleotideDetail,
  polymeraseBody,
  regulatorDomains,
  ribosomeDetail,
  helix,
  materialInventory,
} from "./structuralDetails.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

const model = {
  id: "trpOperon",
  title: b(
    "色氨酸操纵子：抑制与衰减",
    "Trp operon: repression and attenuation",
  ),
  duration: 36,
  intro: b(
    "大肠杆菌的两级调控：游离色氨酸激活 TrpR 抑制起始；已起始 RNA 的命运取决于带色氨酸的 tRNA 是否足够。下方放大一条已起始的 trpL RNA，即使启动子受抑制也单独展示它，以区分两级控制。所有结构在胞质中，长度与时间不按比例。“严重匮乏”特指足以耗低带色氨酸 tRNA 的强烈饥饿；轻度降低游离色氨酸并不必然导致核糖体停滞。充电受限指 tRNAᵀʳᵖ 氨酰化不足。",
    "Two levels of regulation in E. coli: free tryptophan activates TrpR to repress initiation; the fate of an initiated RNA depends on available charged tRNAᵀʳᵖ. The lower view enlarges one initiated trpL RNA, even when initiation is repressed, to distinguish the two controls. All structures are cytoplasmic; sizes and timing are schematic. The severely depleted condition means starvation strong enough to limit charged tRNA; a modest decrease in free tryptophan need not stall ribosomes. Limited charging means insufficient aminoacylation of tRNAᵀʳᵖ.",
  ),
  controls: [
    {
      id: "tryptophan",
      label: b("胞内游离色氨酸", "Intracellular free tryptophan"),
      default: "low",
      options: [
        {
          value: "low",
          label: b(
            "严重匮乏（带 Trp 的 tRNA 不足）",
            "Severely depleted (charged tRNA limiting)",
          ),
        },
        { value: "high", label: b("充足", "High") },
      ],
    },
    {
      id: "charging",
      label: b("tRNAᵀʳᵖ 充电能力", "tRNAᵀʳᵖ charging capacity"),
      default: "normal",
      options: [
        { value: "normal", label: b("正常", "Normal") },
        { value: "limited", label: b("受限", "Limited") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("两种不同的传感器", "Two different sensors"),
      description: b(
        "TrpR 感知游离色氨酸；翻译先导肽的核糖体间接感知带色氨酸的 tRNA。不是所有细菌都采用大肠杆菌的这一机制。",
        "TrpR senses free tryptophan; the ribosome translating the leader peptide indirectly senses charged tRNAᵀʳᵖ. Not all bacteria use this E. coli mechanism.",
      ),
    },
    {
      at: 0.14,
      title: b("辅阻遏物与起始", "Corepressor and initiation"),
      description: b(
        "色氨酸作为辅阻遏物结合 TrpR，使它结合操纵序列并降低新转录的起始。下方仍跟踪一条已经起始的 RNA，不能据此推断大量表达。",
        "Tryptophan acts as a corepressor: it binds TrpR, enabling operator binding and reducing new initiation. Below, we still follow one already initiated RNA; this does not imply abundant expression.",
      ),
    },
    {
      at: 0.31,
      title: b("翻译两个连续 UGG", "Translate two adjacent UGG codons"),
      description: b(
        "转录与翻译相偶联。先导肽区域 1 含两个连续的色氨酸密码子，读取它们需要带色氨酸的 tRNAᵀʳᵖ。",
        "Transcription and translation are coupled. Region 1 of the leader encodes two adjacent tryptophan codons; reading them requires charged tRNAᵀʳᵖ.",
      ),
    },
    {
      at: 0.49,
      title: b("停滞还是前进", "Stall or advance"),
      description: b(
        "带色氨酸 tRNA 不足时核糖体停在区域 1，区域 2 可与 3 配对。充足时核糖体前进并遮挡区域 2。充电受限可在游离色氨酸充足时仍引起停滞。",
        "When charged tRNA is scarce, the ribosome stalls in region 1, freeing region 2 to pair with 3. When abundant, it advances and occludes region 2. Limited charging can cause stalling even when free tryptophan is high.",
      ),
    },
    {
      at: 0.66,
      title: b("互斥的 RNA 发夹", "Alternative RNA hairpins"),
      description: b(
        "2:3 反终止发夹阻止 3:4 终止发夹形成；区域 2 被遮挡时，3:4 发夹与其后的富 U 序列促成内在终止。",
        "The 2:3 antiterminator prevents formation of the 3:4 terminator. When region 2 is occluded, the 3:4 hairpin and following U-rich tract promote intrinsic termination.",
      ),
    },
    {
      at: 0.87,
      title: b("读穿或提前终止", "Readthrough or early termination"),
      description: b(
        "停滞条件下，已起始的聚合酶读穿衰减子，进入 trpEDCBA；带色氨酸 tRNA 充足时多在先导区终止。TrpR 仍独立限制起始频率。",
        "Under stalling conditions, the initiated polymerase reads through the attenuator toward trpEDCBA. With abundant charged tRNA, termination in the leader is favored. TrpR independently constrains initiation frequency.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Yanofsky et al. (1984): Repression is relieved before attenuation as tryptophan starvation becomes increasingly severe",
      url: "https://pubmed.ncbi.nlm.nih.gov/6233264/",
    },
    {
      title: "NCBI Bookshelf — Transcription in Prokaryotes",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9850/",
    },
    {
      title: "NCBI Bookshelf — Genetics (Medical Microbiology)",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK7908/",
    },
  ],
  create({ rootId = "bacterium" } = {}) {
    const k = trackMaterials(sceneKit()),
      { group } = k,
      dna = k.material("#849aa0"),
      pale = k.material("#c0cdc9"),
      trp = k.material("#c8a35f"),
      rep = k.material("#ab899d"),
      rib = k.material("#89a696"),
      polmat = k.material("#7e94ac"),
      colors = ["#bca569", "#719cac", "#ad869d", "#91a87d"].map((c) =>
        k.material(c),
      );
    const detailedDNA = duplex(k, { y: 1.17, radius: 0.19 });
    const box = new THREE.BoxGeometry(1, 1, 1),
      operator = k.mesh(box, rep, [-3.1, 1.17, -0.02]);
    operator.scale.set(0.9, 0.11, 0.12);
    operator.position.z = -0.26;
    const structural = k.mesh(box, rib, [3.2, 1.17, -0.02]);
    structural.scale.set(2, 0.11, 0.12);
    structural.position.z = -0.26;
    const repressor = new THREE.Group();
    group.add(repressor);
    k.ball([-0.2, 0, 0], [0.3, 0.33, 0.27], rep, repressor);
    k.ball([0.2, 0, 0], [0.3, 0.33, 0.27], rep, repressor);
    regulatorDomains(k, repressor, rep, "trpR");
    const freeTrp = [
      k.ball([-0.22, 0.2, 0.26], 0.09, trp, repressor),
      k.ball([0.22, 0.2, 0.26], 0.09, trp, repressor),
    ];
    const ribosome = new THREE.Group();
    group.add(ribosome);
    k.ball([0, 0.16, 0.1], [0.48, 0.27, 0.29], rib, ribosome);
    k.ball([0, -0.12, 0.1], [0.37, 0.2, 0.25], rib, ribosome);
    ribosomeDetail(k, ribosome, rib);
    const tRNA = new THREE.Group();
    group.add(tRNA);
    k.segment([0, 0, 0], [0, 0.48, 0], 0.045, trp, tRNA);
    k.segment([0, 0.48, 0], [0.25, 0.48, 0], 0.045, trp, tRNA);
    k.tube(
      [
        [0, 0.12, 0],
        [-0.16, 0.2, 0.04],
        [-0.18, 0.34, 0.02],
        [0, 0.39, 0],
        [0.15, 0.32, 0],
        [0.06, 0.24, 0],
      ],
      0.027,
      trp,
      tRNA,
      32,
    );
    helix(k, tRNA, [0, 0.25, 0], rep, {
      length: 0.35,
      radius: 0.036,
      turns: 3,
    });
    const amino = k.ball([0.25, 0.49, 0], 0.09, rep, tRNA);
    amino.name = "Charged tRNA tryptophan";
    const polymerase = new THREE.Group();
    group.add(polymerase);
    polymeraseBody(k, polymerase, polmat, 0.76);
    // Two mutually exclusive complete fold geometries. Region identity is conserved by color.
    const branches = {};
    const paths = {
      antiterminator: [
        [
          [-4, -1.18, 0],
          [-3.5, -1.18, 0],
          [-2.65, -1.18, 0],
        ],
        [
          [-2.65, -1.18, 0],
          [-1.65, -1.18, 0],
          [-1.65, -2.25, 0],
          [-1.4, -2.48, 0],
        ],
        [
          [-1.4, -2.48, 0],
          [-1.12, -2.25, 0],
          [-1.12, -1.18, 0],
          [0.65, -1.18, 0],
        ],
        [
          [0.65, -1.18, 0],
          [1.5, -1.25, 0],
          [2.5, -1.18, 0],
        ],
      ],
      terminator: [
        [
          [-4, -1.18, 0],
          [-3.5, -1.18, 0],
          [-2.65, -1.18, 0],
        ],
        [
          [-2.65, -1.18, 0],
          [-2, -1.18, 0],
          [-0.65, -1.18, 0],
        ],
        [
          [-0.65, -1.18, 0],
          [0.35, -1.18, 0],
          [0.35, -2.25, 0],
          [0.62, -2.48, 0],
        ],
        [
          [0.62, -2.48, 0],
          [0.9, -2.25, 0],
          [0.9, -1.18, 0],
          [2.5, -1.18, 0],
        ],
      ],
    };
    for (const name of Object.keys(paths)) {
      const g = new THREE.Group();
      g.name = `trp leader RNA ${name}`;
      group.add(g);
      const strands = paths[name].map((points, i) =>
        k.tube(points, 0.052, colors[i], g, 44),
      );
      const pairs = [];
      for (let j = 0; j < 6; j++) {
        const x = name === "antiterminator" ? -1.65 : 0.35;
        pairs.push(
          k.segment(
            [x, -1.42 - j * 0.13, 0],
            [x + 0.53, -1.42 - j * 0.13, 0],
            0.021,
            pale,
            g,
          ),
        );
      }
      const nucleotideDetails = strands.map((m) =>
        nucleotideDetail(k, m, { spacing: 0.1 }),
      );
      branches[name] = { group: g, strands, pairs, nucleotideDetails };
    }
    const extension = k.tube(
      [
        [2.5, -1.18, 0],
        [3, -1.25, 0],
        [3.7, -1.05, 0],
        [4.3, -1.18, 0],
      ],
      0.052,
      colors[3],
    );
    extension.name = "trp structural gene RNA extension";
    const extensionDetail = nucleotideDetail(k, extension, { spacing: 0.1 });
    const urich = [];
    for (let i = 0; i < 6; i++)
      urich.push(k.ball([1.55 + i * 0.14, -1.18, 0.035], 0.065, trp));
    const codons = [
      k.mesh(box, trp, [-3.65, -1.18, 0.03]),
      k.mesh(box, trp, [-3.33, -1.18, 0.03]),
    ];
    codons.forEach((m) => m.scale.set(0.21, 0.16, 0.1));
    const labels = [
      k.label([-3.1, 2.6, 0], "TrpR", "TrpR", 2),
      k.label([-3.1, 0.65, 0], "启动子 / 操纵序列", "Promoter / operator", 2),
      k.label([3.2, 0.65, 0], "trpEDCBA", "trpEDCBA", 2),
      k.label([-3.7, -1.85, 0], "1：UGG UGG", "1: UGG UGG", 2),
      k.label([-2.1, -0.6, 0], "2", "2", 1),
      k.label([-0.3, -0.6, 0], "3", "3", 1),
      k.label([2.3, -0.65, 0], "4", "4", 1),
      k.label([-0.9, -2.95, 0], "2:3 反终止发夹", "2:3 antiterminator", 2),
      k.label([-3.6, -0.45, 0.2], "核糖体停滞", "Stalled ribosome", 2),
      k.label([1.9, -1.85, 0], "富 U 序列", "U-rich tract", 1),
      k.label(
        [0.1, 2.1, 0],
        "已起始的 RNA 聚合酶",
        "Already initiated RNA polymerase",
        1,
      ),
      k.label([-4.25, -1.5, 0], "5′", "5′", 1),
      k.label([4.2, -1.75, 0], "延伸 3′ 端", "Growing 3′ end", 1),
      k.label([-0.4, 3, 0], "起始抑制弱", "Weak initiation repression", 2),
      k.label([-4.4, 1.68, 0], "5′ / 3′", "5′ / 3′", 1),
      k.label([4.4, 1.68, 0], "3′ / 5′", "3′ / 5′", 1),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        high = parameters.tryptophan === "high",
        charging = parameters.charging !== "limited",
        charged = high && charging,
        stall = !charged,
        fold = p >= 0.63;
      const binding = high ? ease(p, 0.07, 0.27) : 0;
      repressor.position.set(-3.1, 2.13 - 0.57 * binding, 0);
      repressor.rotation.z = (1 - binding) * 0.15;
      freeTrp.forEach((m) => (m.visible = high && p >= 0.08));
      const ribX = -3.48 + (charged ? 1.58 * ease(p, 0.4, 0.61) : 0);
      ribosome.position.set(ribX, -1.1, 0.12);
      ribosome.visible = p >= 0.3;
      tRNA.visible = p >= 0.32 && p < 0.62;
      tRNA.position.set(
        ribX + 0.07,
        -0.56 + 0.7 * (1 - ease(p, 0.32, 0.47)),
        0.2,
      );
      amino.visible = charged;
      const selected = stall ? "antiterminator" : "terminator";
      for (const [name, branch] of Object.entries(branches)) {
        branch.group.visible = name === selected && p > 0.22;
        branch.strands.forEach((m, i) => {
          const t = ease(p, 0.22 + i * 0.095, 0.34 + i * 0.095);
          m.geometry.setDrawRange(
            0,
            Math.floor((m.geometry.index.count * t) / 6) * 6,
          );
        });
        branch.pairs.forEach((m) => (m.visible = fold));
      }
      // Hairpin display is an expanded RNA conformation; its base pairs form only at the decision.
      extension.visible = stall && p >= 0.78;
      extension.geometry.setDrawRange(
        0,
        Math.floor((extension.geometry.index.count * ease(p, 0.78, 0.98)) / 6) *
          6,
      );
      urich.forEach((m) => (m.visible = !stall && p >= 0.61));
      codons.forEach((m) => (m.visible = p > 0.26));
      const polX =
        -1.75 +
        3.2 * ease(p, 0.14, 0.67) +
        (stall ? 2.75 * ease(p, 0.76, 0.97) : 0);
      polymerase.position.set(
        polX,
        1.44 + (!stall ? 0.9 * ease(p, 0.81, 0.95) : 0),
        0.14,
      );
      polymerase.visible = stall || p < 0.96;
      detailedDNA.update(polX, polymerase.visible && p > 0.2 ? 1 : 0);
      Object.values(branches).forEach((branch) =>
        branch.nucleotideDetails.forEach((d) => d.update()),
      );
      extensionDetail.update();
      labels[0].position[1] = repressor.position.y + 0.6;
      labels[3].active = p > 0.26;
      labels[4].active = p > 0.35;
      labels[5].active = p > 0.45;
      labels[6].active = p > 0.56;
      labels[7].active = fold;
      labels[7].position[0] = stall ? -1.4 : 0.65;
      labels[7].text = stall
        ? b("2:3 反终止发夹", "2:3 antiterminator")
        : b("3:4 终止发夹", "3:4 terminator");
      labels[8].position[0] = ribX;
      labels[8].active = p >= 0.3;
      labels[8].text =
        p < 0.49
          ? b("先导肽翻译", "Leader translation")
          : stall
            ? b("区域 1 停滞", "Stalled in region 1")
            : b("遮挡区域 2", "Region 2 occluded");
      labels[9].active = !stall && p >= 0.61;
      labels[10].position[0] = polX;
      labels[10].active = polymerase.visible;
      labels[11].active = p > 0.22;
      labels[12].active = p >= 0.78;
      labels[12].position[0] = stall ? 4.2 : 2.5;
      labels[12].text = stall
        ? b("读穿 → 3′", "Readthrough → 3′")
        : b("先导 RNA 释放", "Leader RNA released");
      labels[13].text = high
        ? b("TrpR：减少起始", "TrpR: reduced initiation")
        : b("TrpR：抑制解除", "TrpR: repression relieved");
      group.userData = {
        rootId,
        species: "Escherichia coli",
        compartment: "cytoplasm",
        freeTryptophan: high ? "high" : "low",
        tryptophanScenario: high
          ? "sufficient-free-tryptophan"
          : "severe-starvation-limiting-charged-tRNA",
        chargingCapacity: charging ? "normal" : "limited",
        chargedTrpTRNA: charged ? "sufficient" : "scarce",
        trpRBound: binding > 0.95,
        ribosomeStalled: stall && p >= 0.49,
        ribosomeRegion: p < 0.49 ? 1 : stall ? 1 : 2,
        hairpin: fold ? (stall ? "2:3" : "3:4") : null,
        attenuation: fold && !stall,
        readthrough: stall && p >= 0.87,
        transcriptConditionalOnInitiation: true,
        synthesisDirection: "5-prime-to-3-prime",
        rnaPolymeraseReleased: !stall && p >= 0.96,
      };
    }
    update(0);
    return {
      group,
      materials: k.materialInventory(),
      update,
      labels,
      camera: { position: [0, 0.5, 12], target: [0, 0, 0] },
    };
  },
};
export default model;
