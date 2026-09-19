import {
  trackMaterials,
  nascentBridge,
  duplex,
  nucleotideDetail,
  polymeraseBody,
  regulatorDomains,
  helix,
  materialInventory,
} from "./structuralDetails.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

const model = {
  id: "lacOperon",
  title: b("乳糖操纵子：双重控制", "Lac operon: two inputs"),
  duration: 32,
  intro: b(
    "大肠杆菌胞质中的经典 lac 调控。分别改变乳糖与葡萄糖，观察异乳糖解除 LacI 抑制，以及低葡萄糖时 CAP–cAMP 对起始的促进。条带与转录本数只表示定性差异；省略辅助操纵序列、DNA 环化与葡萄糖的诱导物排斥，假定有乳糖时能形成足够异乳糖。",
    "Classical lac regulation in the E. coli cytoplasm. Change lactose and glucose independently to compare allolactose relief of LacI repression with CAP–cAMP activation at low glucose. Transcript counts are qualitative. Auxiliary operators, DNA looping and glucose-dependent inducer exclusion are omitted; available lactose is assumed to yield sufficient allolactose.",
  ),
  controls: [
    {
      id: "lactose",
      label: b("乳糖", "Lactose"),
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
      title: b("两个独立信号", "Two independent signals"),
      description: b(
        "从左到右依次为 CAP 位点、启动子、主要操纵序列 O1 和 lacZYA。两条 DNA 链反向平行。",
        "From left to right: CAP site, promoter, primary operator O1, and lacZYA. The DNA strands are antiparallel.",
      ),
    },
    {
      at: 0.16,
      title: b("诱导物是异乳糖", "Allolactose is the inducer"),
      description: b(
        "少量已有的 β-半乳糖苷酶将部分乳糖转为异乳糖。异乳糖结合 LacI，使其对操纵序列的亲和力降低。无乳糖时 LacI 保持结合。",
        "Pre-existing β-galactosidase converts some lactose into allolactose. Allolactose binds LacI and lowers its operator affinity. Without lactose, LacI remains bound.",
      ),
    },
    {
      at: 0.36,
      title: b("葡萄糖调节 CAP", "Glucose regulates CAP"),
      description: b(
        "低葡萄糖通常伴随较高 cAMP；CAP–cAMP 二聚体结合上游 DNA。高葡萄糖时此激活作用较弱。",
        "Low glucose generally accompanies higher cAMP; the CAP–cAMP dimer binds upstream DNA. This activation is weak at high glucose.",
      ),
    },
    {
      at: 0.53,
      title: b("启动子整合两个输入", "The promoter integrates both inputs"),
      description: b(
        "LacI 占据 O1 时起始受到强烈抑制；解除抑制后 CAP–cAMP 可促进 RNA 聚合酶起始。没有 CAP 激活时仍可有较低转录。",
        "LacI occupancy strongly represses initiation. Once repression is relieved, CAP–cAMP promotes RNA polymerase initiation. Lower transcription remains possible without CAP activation.",
      ),
    },
    {
      at: 0.72,
      title: b("转录 lacZYA", "Transcribe lacZYA"),
      description: b(
        "聚合酶沿模板 3′→5′ 移动，RNA 从 5′→3′ 延伸。同一转录本包含三个结构基因；示意条带不是测量数据。",
        "Polymerase reads the template 3′→5′ and extends RNA 5′→3′. One transcript contains all three structural genes; schematic strands are not measurements.",
      ),
    },
    {
      at: 0.92,
      title: b("比较定性输出", "Compare qualitative outputs"),
      description: b(
        "有乳糖、低葡萄糖：较强；有乳糖、高葡萄糖：较低；无乳糖：强抑制但不是绝对零表达。图中未逐一展示被抑制条件下罕见的漏转录。",
        "Lactose present with low glucose: stronger; lactose present with high glucose: lower; no lactose: strongly repressed, not absolutely zero. Rare leaky transcription in repressed conditions is not individually drawn.",
      ),
    },
  ],
  sources: [
    {
      title: "NCBI Bookshelf — How Genetic Switches Work",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26872/",
    },
    {
      title: "NCBI Bookshelf — Transcription in Prokaryotes",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9850/",
    },
  ],
  create({ rootId = "bacterium" } = {}) {
    const k = trackMaterials(sceneKit()),
      { group } = k;
    const dna = k.material("#7c939a"),
      pair = k.material("#bccbc8"),
      purple = k.material("#a588a7"),
      green = k.material("#769b87"),
      gold = k.material("#c8a265"),
      rna = k.material("#ca947c"),
      blue = k.material("#7792ab");
    const detailedDNA = duplex(k, { y: -0.5, radius: 0.2 });
    const box = new THREE.BoxGeometry(1, 1, 1);
    for (const [x, w, mat] of [
      [-3.15, 0.7, green],
      [-2.05, 0.8, gold],
      [-1.1, 0.65, purple],
      [0.45, 1.8, blue],
      [2.1, 1.15, green],
      [3.4, 1.1, gold],
    ]) {
      const m = k.mesh(box, mat, [x, -0.51, -0.04]);
      m.scale.set(w, 0.12, 0.12);
      m.position.z = -0.27;
    }
    const repressor = new THREE.Group();
    group.add(repressor);
    for (let i = 0; i < 4; i++)
      k.ball(
        [((i % 2) - 0.5) * 0.48, Math.floor(i / 2) * 0.32, 0],
        [0.34, 0.29, 0.27],
        purple,
        repressor,
      );
    regulatorDomains(k, repressor, purple, "lacI");
    const ligands = [
      k.ball([-0.23, 0.34, 0.28], 0.095, gold, repressor),
      k.ball([0.23, 0.34, 0.28], 0.095, gold, repressor),
    ];
    const cap = new THREE.Group();
    group.add(cap);
    k.ball([-0.22, 0, 0], [0.31, 0.38, 0.3], green, cap);
    k.ball([0.22, 0, 0], [0.31, 0.38, 0.3], green, cap);
    regulatorDomains(k, cap, green, "cap");
    const camp = [
      k.ball([-0.3, 0.22, 0.26], 0.085, gold, cap),
      k.ball([0.3, 0.22, 0.26], 0.085, gold, cap),
    ];
    const lactose = new THREE.Group();
    group.add(lactose);
    k.ball([-0.13, 0, 0], 0.12, gold, lactose);
    k.ball([0.13, 0, 0], 0.12, gold, lactose);
    k.segment([-0.13, 0, 0], [0.13, 0, 0], 0.045, gold, lactose);
    const beta = k.ball([-0.5, 2.1, 0], [0.45, 0.32, 0.27], blue);
    const polymerases = Array.from({ length: 3 }, () => {
      const g = new THREE.Group();
      group.add(g);
      polymeraseBody(k, g, blue, 0.75);
      return g;
    });
    const transcriptionBubbles = polymerases.map(() => ({ x: 0, opening: 0 }));
    const transcripts = Array.from({ length: 3 }, (_, j) => {
      const m = k.tube(
        Array.from({ length: 36 }, (_, i) => [
          -0.8 + i * 0.129,
          -1.5 - j * 0.36 + 0.09 * Math.sin(i * 0.6),
          0.18,
        ]),
        0.043,
        rna,
        group,
        72,
      );
      return m;
    });
    const bridges = transcripts.map(() => nascentBridge(k, rna));
    const rnaDetails = transcripts.map((m) => nucleotideDetail(k, m));
    for (let i = 0; i < 4; i++)
      helix(k, beta, [(i - 1.5) * 0.2, 0.1, 0.55], blue, {
        length: 0.55,
        radius: 0.06,
        rotation: 0.25,
      });
    const arrow = k.mesh(
      new THREE.ConeGeometry(0.12, 0.3, 12),
      rna,
      [4.03, -1.5, 0.18],
    );
    arrow.rotation.z = -Math.PI / 2;
    const labels = [
      k.label([-3.15, -1.03, 0], "CAP 位点", "CAP site", 2),
      k.label([-2.08, -1.03, 0], "启动子", "Promoter", 2),
      k.label([-1.05, -1.03, 0], "O1", "O1", 2),
      k.label([0.45, -1.02, 0], "lacZ", "lacZ", 1),
      k.label([2.1, -1.02, 0], "lacY", "lacY", 1),
      k.label([3.4, -1.02, 0], "lacA", "lacA", 1),
      k.label([-1.1, 1.3, 0], "LacI", "LacI", 2),
      k.label([-3.15, 1.4, 0], "CAP–cAMP", "CAP–cAMP", 2),
      k.label([-0.5, 2.7, 0], "β-半乳糖苷酶", "β-galactosidase", 1),
      k.label([1.2, 2.5, 0], "乳糖 → 异乳糖", "Lactose → allolactose", 2),
      k.label([1.45, -2.9, 0], "RNA：5′ → 3′", "RNA: 5′ → 3′", 2),
      k.label([-4.4, 0.05, 0], "5′ / 3′", "5′ / 3′", 1),
      k.label([4.4, 0.05, 0], "3′ / 5′", "3′ / 5′", 1),
      k.label([1.4, 1.3, 0], "较强转录", "Stronger transcription", 2),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        hasLactose = parameters.lactose !== "absent",
        lowGlucose = parameters.glucose !== "high";
      const induction = hasLactose ? ease(p, 0.17, 0.39) : 0,
        activation = lowGlucose ? ease(p, 0.34, 0.51) : 0;
      repressor.position.set(
        -1.1 + 1.75 * induction,
        0.04 + 1.4 * induction,
        0,
      );
      repressor.rotation.z = induction * 0.38;
      ligands.forEach((m) => (m.visible = hasLactose && p >= 0.25));
      cap.position.set(-3.15, 0.9 - 0.84 * activation, 0);
      camp.forEach((m) => (m.visible = lowGlucose && p > 0.33));
      lactose.visible = hasLactose && p < 0.29;
      lactose.position.set(-2.0 + 1.45 * ease(p, 0.03, 0.23), 2.1, 0);
      lactose.rotation.z = hasLactose ? ease(p, 0.2, 0.3) : 0;
      beta.visible = p < 0.4;
      const count = hasLactose ? (lowGlucose ? 3 : 1) : 0;
      polymerases.forEach((m, i) => {
        const t = ease(p, 0.53 + i * 0.075, 0.87 + i * 0.04);
        m.visible = i < count && p >= 0.53 + i * 0.075 && t < 1;
        m.position.set(-1.8 + 5.7 * t, -0.33, 0.22);
        transcriptionBubbles[i].x = m.position.x;
        transcriptionBubbles[i].opening = m.visible ? 1 : 0;
        transcripts[i].visible = i < count && t > 0;
        transcripts[i].geometry.setDrawRange(
          0,
          Math.floor((transcripts[i].geometry.index.count * t) / 6) * 6,
        );
      });
      detailedDNA.update(transcriptionBubbles);
      rnaDetails.forEach((d) => d.update());
      bridges.forEach((bridge, i) =>
        bridge.update(
          transcripts[i].geometry.parameters.path,
          ease(p, 0.53 + i * 0.075, 0.87 + i * 0.04),
          polymerases[i],
          polymerases[i].visible,
        ),
      );
      arrow.visible = count > 0 && p >= 0.93;
      labels[6].position[0] = repressor.position.x;
      labels[6].position[1] = repressor.position.y + 0.8;
      labels[7].position[1] = cap.position.y + 0.7;
      labels[7].text =
        lowGlucose && p > 0.33
          ? b("CAP–cAMP", "CAP–cAMP")
          : b("CAP（未激活）", "CAP (inactive)");
      labels[8].active = beta.visible;
      labels[9].active = hasLactose && p < 0.42;
      labels[10].active = count > 0 && p > 0.6;
      labels[13].active = p > 0.53;
      labels[13].text = !hasLactose
        ? b("强抑制；仍可漏转录", "Repressed; leakage possible")
        : lowGlucose
          ? b("较强转录", "Stronger transcription")
          : b("较低转录", "Lower transcription");
      group.userData = {
        rootId,
        species: "Escherichia coli",
        compartment: "cytoplasm",
        lactose: hasLactose ? "present" : "absent",
        glucose: lowGlucose ? "low" : "high",
        allolactoseBound: hasLactose && p >= 0.25,
        lacIBound: induction < 0.95,
        capCampBound: activation > 0.95,
        expression: hasLactose
          ? lowGlucose
            ? "stronger"
            : "lower"
          : "strongly-repressed-with-leakage",
        illustrativeTranscriptCount: count,
        synthesisDirection: "5-prime-to-3-prime",
        inducerExclusionModeled: false,
      };
    }
    update(0);
    return {
      group,
      materials: k.materialInventory(),
      update,
      labels,
      camera: { position: [0, 1, 12], target: [0, 0, 0] },
    };
  },
};
export default model;
