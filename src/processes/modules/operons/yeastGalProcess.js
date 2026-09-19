import {
  trackMaterials,
  nascentBridge,
  duplex,
  nucleotideDetail,
  polymeraseBody,
  nuclearRim,
  helix,
  materialInventory,
} from "./structuralDetails.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
const model = {
  id: "yeastGal",
  title: b(
    "酵母 GAL：解除激活域抑制",
    "Yeast GAL: release the activation domain",
  ),
  duration: 34,
  intro: b(
    "酿酒酵母核内 GAL1 启动子的局部模型。Gal4 已结合 DNA；Gal80 遮挡其激活域。展示核内 Gal3 与半乳糖、ATP 的调控，省略核质穿梭和反馈。GAL 基因不是细菌式操纵子。葡萄糖通过多层机制抑制 GAL；此处单独突出 Mig1–Cyc8/Tup1，并假定 Gal3 可接触半乳糖。",
    "A local nuclear GAL1 promoter in Saccharomyces cerevisiae. Gal4 is already DNA-bound; Gal80 masks its activation domain. This view shows nuclear Gal3 sensing galactose and ATP, omitting shuttling and feedback. GAL genes are not a bacterial operon. Glucose repression has multiple layers; this view highlights Mig1–Cyc8/Tup1 and assumes galactose is accessible to Gal3.",
  ),
  controls: [
    {
      id: "galactose",
      label: b("半乳糖", "Galactose"),
      default: "present",
      options: [
        { value: "present", label: b("有", "Present") },
        { value: "absent", label: b("无", "Absent") },
      ],
    },
    {
      id: "glucose",
      label: b("葡萄糖", "Glucose"),
      default: "low",
      options: [
        { value: "low", label: b("低", "Low") },
        { value: "high", label: b("高", "High") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("DNA 上的待命激活子", "An activator poised on DNA"),
      description: b(
        "Gal4 二聚体结合 UAS；Gal80 覆盖其转录激活域。DNA 结合与激活转录是两个不同步骤。",
        "A Gal4 dimer occupies its UAS. Gal80 masks its transcriptional activation domain. DNA occupancy and transcriptional activation are different steps.",
      ),
    },
    {
      at: 0.17,
      title: b("Gal3 感知半乳糖与 ATP", "Gal3 senses galactose and ATP"),
      description: b(
        "半乳糖和 ATP 结合 Gal3，稳定可与 Gal80 结合的闭合构象。Gal3 是感知蛋白，不是将半乳糖磷酸化的主要酶。",
        "Galactose and ATP stabilize a closed Gal3 conformation capable of binding Gal80. Gal3 is a sensor, not the main galactose-phosphorylating enzyme.",
      ),
    },
    {
      at: 0.37,
      title: b("Gal80 抑制被解除", "Relieve Gal80 inhibition"),
      description: b(
        "激活的 Gal3 与 Gal80 相互作用，使 Gal4 激活域可用。图中用 Gal80 离开激活域表示抑制解除，不把核质运输作为必需步骤。无半乳糖时遮挡保留。",
        "Activated Gal3 interacts with Gal80, making the Gal4 activation domain available. Moving Gal80 away represents relief of inhibition without requiring nuclear transport. Without galactose, masking persists.",
      ),
    },
    {
      at: 0.56,
      title: b(
        "葡萄糖提供另一层抑制",
        "Glucose supplies another repression layer",
      ),
      description: b(
        "高葡萄糖下 Mig1 与 Cyc8–Tup1 参与 GAL1 抑制。即使局部 Gal80 抑制解除，葡萄糖也能使 GAL 表达保持低水平；此处省略 GAL4 表达和糖运输调控。",
        "At high glucose, Mig1 and Cyc8–Tup1 contribute to GAL1 repression. Glucose can maintain low GAL expression despite local relief of Gal80 inhibition. GAL4 expression and sugar transport regulation are omitted.",
      ),
    },
    {
      at: 0.73,
      title: b("募集转录机器", "Recruit transcription machinery"),
      description: b(
        "有半乳糖、低葡萄糖时，暴露的 Gal4 激活域可促进共激活因子和 RNA 聚合酶 II 的募集。新 RNA 在核内以 5′→3′ 合成。",
        "With galactose and low glucose, the exposed Gal4 activation domain promotes coactivator and RNA polymerase II recruitment. New RNA is synthesized 5′→3′ in the nucleus.",
      ),
    },
    {
      at: 0.92,
      title: b("比较调控结果", "Compare regulatory outcomes"),
      description: b(
        "有半乳糖且低葡萄糖时显示诱导转录；其他组合显示受抑制的代表状态。没有画出 RNA 不代表绝对零表达。蛋白质翻译不在这个核内视图中。",
        "Induced transcription is shown with galactose and low glucose; other combinations show representative repressed states. No drawn RNA does not mean absolutely zero expression. Protein translation is outside this nuclear view.",
      ),
    },
  ],
  sources: [
    {
      title:
        "The Gal3p transducer interacts with Gal80p in its ligand-induced closed conformation (2012)",
      url: "https://pubmed.ncbi.nlm.nih.gov/22302941/",
    },
    {
      title:
        "Interplay of a ligand sensor and an enzyme in controlling GAL genes (2012)",
      url: "https://pubmed.ncbi.nlm.nih.gov/22210830/",
    },
    {
      title: "Control of yeast GAL genes by MIG1 repressor (1991)",
      url: "https://pubmed.ncbi.nlm.nih.gov/1915298/",
    },
  ],
  create({ rootId = "yeast" } = {}) {
    const k = trackMaterials(sceneKit()),
      { group } = k,
      dna = k.material("#849aa0"),
      green = k.material("#84a18e"),
      plum = k.material("#ad89a5"),
      gold = k.material("#c5a267"),
      blue = k.material("#819caf"),
      salmon = k.material("#c48f7c"),
      pale = k.material("#c9d3cc");
    nuclearRim(k);
    const detailedDNA = duplex(k, {
      x0: -3.5,
      x1: 3.55,
      y: -0.72,
      radius: 0.19,
      count: 58,
    });
    const box = new THREE.BoxGeometry(1, 1, 1);
    const uas = k.mesh(box, green, [-1.8, -0.73, 0]);
    uas.scale.set(0.85, 0.12, 0.12);
    uas.position.z = -0.25;
    const promoter = k.mesh(box, gold, [0.65, -0.73, 0]);
    promoter.scale.set(0.65, 0.12, 0.12);
    promoter.position.z = -0.25;
    const gene = k.mesh(box, blue, [2.2, -0.73, 0]);
    gene.scale.set(1.7, 0.12, 0.12);
    gene.position.z = -0.25;
    const gal4 = new THREE.Group();
    group.add(gal4);
    gal4.position.set(-1.8, -0.5, 0);
    for (const x of [-0.23, 0.23]) {
      k.ball([x, 0, 0.1], [0.2, 0.22, 0.19], green, gal4);
      k.segment([x, 0.06, 0.1], [x * 0.3, 0.73, 0.1], 0.07, green, gal4);
    }
    k.ball([0, 0.84, 0.1], [0.36, 0.18, 0.22], green, gal4);
    for (const x of [-0.23, 0.23]) {
      helix(k, gal4, [x * 0.5, 0.41, 0.16], green, {
        length: 0.62,
        radius: 0.055,
        turns: 5,
        rotation: x > 0 ? 0.18 : -0.18,
      });
      for (const z of [-0.045, 0.045]) k.ball([x, z, 0.25], 0.04, gold, gal4);
    }
    const gal80 = k.ball([-1.8, 0.57, 0.16], [0.47, 0.3, 0.27], plum);
    for (let i = 0; i < 4; i++)
      helix(k, gal80, [(i - 1.5) * 0.33, 0, 0.75], plum, {
        length: 1.35,
        radius: 0.1,
        turns: 4,
        rotation: 0.2,
      });
    const gal3 = new THREE.Group();
    group.add(gal3);
    const halves = [
      k.ball([-0.3, 0, 0], [0.31, 0.39, 0.28], blue, gal3),
      k.ball([0.3, 0, 0], [0.31, 0.39, 0.28], blue, gal3),
    ];
    halves.forEach((h, j) => {
      for (let i = 0; i < 3; i++)
        helix(k, h, [(i - 1) * 0.37, 0, 0.75], blue, {
          length: 1.35,
          radius: 0.09,
          turns: 4,
          rotation: j ? 0.2 : -0.2,
        });
    });
    const sugar = k.mesh(
        new THREE.IcosahedronGeometry(0.12, 0),
        gold,
        [0, 0.12, 0.24],
        gal3,
      ),
      atp = k.ball([0, -0.15, 0.23], 0.085, salmon, gal3);
    const mig1 = k.ball([-0.1, 1.65, 0.1], [0.25, 0.32, 0.23], plum),
      corepressor = new THREE.Group();
    group.add(corepressor);
    for (let i = 0; i < 4; i++)
      k.ball(
        [((i % 2) - 0.5) * 0.24, Math.floor(i / 2) * 0.22, 0],
        0.2,
        plum,
        corepressor,
      );
    for (let i = 0; i < 4; i++) {
      const r = k.ring(
        [((i % 2) - 0.5) * 0.24, Math.floor(i / 2) * 0.22, 0.16],
        0.12,
        0.027,
        gold,
        corepressor,
      );
      r.scale.set(1, 0.8, 1);
    }
    helix(k, mig1, [0, 0, 0.85], plum, {
      length: 1.25,
      radius: 0.15,
      turns: 3,
    });
    const mediator = k.ring([-0.65, 0.45, 0.05], 0.36, 0.11, gold);
    mediator.scale.set(1.3, 0.65, 1);
    const polymerase = new THREE.Group();
    group.add(polymerase);
    polymeraseBody(k, polymerase, blue, 0.8, "polII");
    const rna = k.tube(
      Array.from({ length: 40 }, (_, i) => [
        0.6 + i * 0.065,
        -1.4 + 0.12 * Math.sin(i * 0.42),
        0.15,
      ]),
      0.047,
      salmon,
      group,
      72,
    );
    const rnaDetail = nucleotideDetail(k, rna);
    const bridge = nascentBridge(k, salmon);
    const labels = [
      k.label([-1.8, -1.3, 0], "UAS · Gal4", "UAS · Gal4", 2),
      k.label([0.65, -1.3, 0], "启动子", "Promoter", 1),
      k.label([2.25, -1.3, 0], "GAL1", "GAL1", 2),
      k.label(
        [-1.8, 1.15, 0],
        "Gal80 遮挡激活域",
        "Gal80 masks activation domain",
        2,
      ),
      k.label(
        [1.6, 2.35, 0],
        "Gal3 · 半乳糖 · ATP",
        "Gal3 · galactose · ATP",
        2,
      ),
      k.label([-0.05, 2.55, 0], "Mig1–Cyc8/Tup1", "Mig1–Cyc8/Tup1", 1),
      k.label([-0.65, 0.95, 0], "共激活因子", "Coactivator", 1),
      k.label([1.55, -2.0, 0], "核内 RNA：5′ → 3′", "Nuclear RNA: 5′ → 3′", 2),
      k.label([-3.3, 1.5, 0], "核内局部", "Nuclear detail", 1),
      k.label([-0.3, -2.55, 0], "Gal80 抑制", "Gal80 repression", 2),
      k.label([-3.5, -0.25, 0], "5′ / 3′", "5′ / 3′", 1),
      k.label([3.5, -0.25, 0], "3′ / 5′", "3′ / 5′", 1),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        gal = parameters.galactose !== "absent",
        glucose = parameters.glucose === "high",
        induced = gal && !glucose,
        ligand = gal ? ease(p, 0.15, 0.3) : 0,
        release = gal ? ease(p, 0.35, 0.55) : 0;
      halves[0].position.x = -0.34 + 0.15 * ligand;
      halves[1].position.x = 0.34 - 0.15 * ligand;
      sugar.visible = gal && p > 0.15;
      atp.visible = gal && p > 0.15;
      gal80.position.set(-1.8 + 1.85 * release, 0.57 + 0.92 * release, 0.16);
      gal3.position.set(
        1.65 - 1.1 * ease(p, 0.28, 0.51) * (gal ? 1 : 0),
        1.7,
        0,
      );
      gal3.rotation.z = -0.25 * ligand;
      mig1.visible = glucose;
      corepressor.visible = glucose;
      const repress = ease(p, 0.53, 0.69);
      mig1.position.set(-0.12, 1.65 - 1.95 * repress, 0.17);
      corepressor.position.set(0.21, 1.8 - 1.73 * repress, 0.08);
      mediator.visible = induced && p > 0.67;
      polymerase.visible = induced && p > 0.71 && p < 0.97;
      polymerase.position.set(0.65 + 2.55 * ease(p, 0.72, 0.96), -0.38, 0.16);
      rna.visible = induced && p > 0.72;
      rna.geometry.setDrawRange(
        0,
        Math.floor((rna.geometry.index.count * ease(p, 0.72, 0.97)) / 6) * 6,
      );
      detailedDNA.update(polymerase.position.x, polymerase.visible ? 1 : 0);
      rnaDetail.update();
      bridge.update(
        rna.geometry.parameters.path,
        ease(p, 0.72, 0.97),
        polymerase,
        polymerase.visible,
      );
      labels[3].position[0] = gal80.position.x;
      labels[3].position[1] = gal80.position.y + 0.52;
      labels[3].text =
        release > 0.9
          ? b("Gal3–Gal80 复合体", "Gal3–Gal80 complex")
          : b("Gal80 遮挡激活域", "Gal80 masks activation domain");
      labels[4].position[0] = gal3.position.x;
      labels[4].text = gal
        ? b("Gal3 · 半乳糖 · ATP", "Gal3 · galactose · ATP")
        : b("Gal3：无诱导物", "Gal3: no inducer");
      labels[5].active = glucose;
      labels[5].position[1] = corepressor.position.y + 0.7;
      labels[6].active = mediator.visible;
      labels[7].active = rna.visible;
      labels[9].active = p > 0.57;
      labels[9].text = glucose
        ? b("葡萄糖抑制", "Glucose repression")
        : gal
          ? b("Gal4 激活域可用", "Gal4 activation domain available")
          : b("Gal80 抑制", "Gal80 repression");
      group.userData = {
        rootId,
        species: "Saccharomyces cerevisiae",
        compartment: "nucleus",
        galactose: gal ? "present" : "absent",
        glucose: glucose ? "high" : "low",
        gal4DNABound: true,
        gal3LigandsBound: ligand > 0.95,
        gal80InhibitionRelieved: release > 0.95,
        mig1Repression: glucose && repress > 0.95,
        transcription:
          induced && p > 0.72 ? "induced" : "repressed-representative",
        bacterialOperon: false,
        synthesisDirection: "5-prime-to-3-prime",
      };
    }
    update(0);
    return {
      group,
      materials: k.materialInventory(),
      update,
      labels,
      camera: { position: [0, 0.5, 11.5], target: [0, 0, 0] },
    };
  },
};
export default model;
