import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import {
  helix,
  beadInstances,
  transcriptionDetail,
} from "./structuralDetails.js";
export default {
  id: "quorumSensing",
  title: b(
    "群体感应：费氏弧菌 LuxI–LuxR",
    "Quorum sensing: V. fischeri LuxI–LuxR",
  ),
  intro: b(
    "费氏弧菌（Aliivibrio/Vibrio fischeri）的 LuxI 产生 3-oxo-C6-HSL。局部信号积累使胞质 LuxR 调节 lux 基因。此处只展开这一支路，假定其他调节条件、氧和发光底物适宜；群体感应并非直接数细胞。",
    "In Aliivibrio/Vibrio fischeri, LuxI produces 3-oxo-C6-HSL. Local signal accumulation allows cytoplasmic LuxR to regulate lux genes. Only this branch is expanded; other regulatory conditions, oxygen and light-reaction substrates are assumed permissive. Quorum sensing does not directly count cells.",
  ),
  duration: 32,
  controls: [
    {
      id: "exchange",
      label: b("同一群体的信号交换", "Signal exchange for the same population"),
      default: "retained",
      options: [
        { value: "retained", label: b("局部积累", "Local accumulation") },
        { value: "diluted", label: b("持续稀释", "Continuous dilution") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("产生特定 AHL", "Producing a specific AHL"),
      description: b(
        "LuxI 是胞质中的信号合成酶，生成 3-oxo-C6-HSL；它不是膜受体。",
        "LuxI is a cytoplasmic signal synthase producing 3-oxo-C6-HSL; it is not a membrane receptor.",
      ),
    },
    {
      at: 0.16,
      title: b("跨膜扩散", "Diffusion across the envelope"),
      description: b(
        "这种短链 AHL 能进出细胞。图中环形符号代表同一种 AHL，运动路径只是扩散示意。",
        "This short-chain AHL can enter and leave cells. Ring symbols represent the same AHL; paths illustrate diffusion.",
      ),
    },
    {
      at: 0.34,
      title: b("环境决定信号积累", "Environment shapes accumulation"),
      description: b(
        "相同细胞数也可有不同局部浓度：保留信号有利于积累，持续稀释可阻止充分积累。",
        "The same cell number can yield different local concentrations: retention favors accumulation while dilution can prevent it.",
      ),
    },
    {
      at: 0.51,
      title: b("胞质 LuxR 结合 AHL", "Cytoplasmic LuxR binds AHL"),
      description: b(
        "AHL 结合使 LuxR 形成活性调控复合物，随后结合 lux 启动子附近的 lux box。",
        "AHL binding enables an active LuxR regulatory complex that binds the lux box near the lux promoter.",
      ),
    },
    {
      at: 0.7,
      title: b("转录与正反馈", "Transcription and positive feedback"),
      description: b(
        "LuxR–AHL 促进 luxICDABEG 转录。新增 LuxI 可提高信号合成，构成正反馈；图中未展开翻译。",
        "LuxR–AHL promotes luxICDABEG transcription. Additional LuxI increases signal production, creating positive feedback; translation is not expanded.",
      ),
    },
    {
      at: 0.88,
      title: b("发光是条件性输出", "Light is a conditional output"),
      description: b(
        "在适宜条件下，lux 表达产生发光系统。淡色光晕表示输出状态，不代表实测亮度；持续稀释时不展示此次增强输出。",
        "Under permissive conditions, lux expression supplies the light-producing system. Halos denote output, not measured intensity; continuous dilution omits this enhanced-output event.",
      ),
    },
  ],
  sources: [
    {
      title: "Microbial Primer: LuxR-LuxI Quorum Sensing",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10569067/",
    },
    {
      title:
        "Reversible Acyl-Homoserine Lactone Binding to Purified Vibrio fischeri LuxR Protein",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC321501/",
    },
    {
      title:
        "LuxR-type Quorum Sensing Regulators That Are Detached from Common Scents",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2975784/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      teal = k.material("#78a49c"),
      pale = k.material("#b7d0c4"),
      gold = k.material("#c9ab70"),
      violet = k.material("#9a88a4"),
      dna = k.material("#829ab0");
    const transparent = k.material("#a7c7b7", {
      transparent: false,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glow = k.material("#cde9bc", {
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      emissive: "#bfd1a1",
      emissiveIntensity: 0.35,
    });
    // Community at left; enlarged sectioned recipient at right, explicitly labeled as an inset.
    const neighbors = [],
      halos = [];
    [
      [-2.9, 1.15],
      [-3.05, -0.1],
      [-2.5, -1.35],
    ].forEach(([x, y], i) => {
      const body = k.ball([x, y, 0], [0.5, 0.21, 0.23], teal);
      body.rotation.z = 0.35 - i * 0.4;
      neighbors.push(body);
      halos.push(k.ball([x, y, -0.04], [0.68, 0.39, 0.32], glow));
    });
    const rear = k.mesh(
      new THREE.SphereGeometry(1, 48, 24, Math.PI, Math.PI),
      transparent,
      [1.25, 0, 0],
    );
    rear.scale.set(2, 1.65, 0.7);
    const lipids = [];
    for (let i = 0; i < 140; i++)
      for (const side of [-1, 1]) {
        const angle = (i * Math.PI * 2) / 140;
        lipids.push([
          1.25 + (2 + side * 0.04) * Math.cos(angle),
          (1.65 + side * 0.04) * Math.sin(angle),
          0.02,
        ]);
      }
    beadInstances(
      k,
      group,
      lipids,
      0.024,
      pale,
      "cut-envelope-phospholipid-leaflets",
    );
    const edge = Array.from({ length: 65 }, (_, i) => [
      1.25 + 2 * Math.cos((i * Math.PI) / 32),
      1.65 * Math.sin((i * Math.PI) / 32),
      0,
    ]);
    k.tube(edge, 0.035, pale);
    const luxI = k.ball([0.35, 0.6, 0.48], [0.25, 0.19, 0.17], teal);
    const extraI = k.ball([0.68, 0.83, 0.48], [0.21, 0.17, 0.14], teal);
    // LuxI substrate cleft and helical rim remain visible above the DNA.
    for (let i = 0; i < 3; i++)
      helix(
        k,
        group,
        [0.17 + i * 0.12, 0.47, 0.6],
        [0.2 + i * 0.12, 0.73, 0.6],
        0.035,
        3,
        0.017,
        pale,
      );
    const luxR = new THREE.Group();
    group.add(luxR);
    // A split ligand-binding lobe leaves two AHL pockets exposed, with DNA-binding helices below.
    for (const side of [-1, 1]) {
      k.ball([side * 0.25, 0.02, -0.05], [0.23, 0.26, 0.15], violet, luxR);
      for (let i = 0; i < 3; i++)
        helix(
          k,
          luxR,
          [side * (0.13 + i * 0.085), -0.04, 0.13],
          [side * (0.15 + i * 0.085), 0.23, 0.13],
          0.03,
          3,
          0.016,
          pale,
        );
      const pocket = k.ring(
        [side * 0.2, 0.09, 0.17],
        0.088,
        0.021,
        violet,
        luxR,
      );
      pocket.scale.y = 1.25;
      k.segment(
        [side * 0.2, -0.15, 0.03],
        [side * 0.16, -0.3, 0.03],
        0.037,
        violet,
        luxR,
      );
      for (const yy of [-0.3, -0.39])
        helix(
          k,
          luxR,
          [side * 0.05, yy, 0.06],
          [side * 0.3, yy, 0.06],
          0.028,
          3,
          0.017,
          violet,
        );
    }
    const bound = [];
    for (const x of [-0.19, 0.19])
      bound.push(k.ring([x, 0.1, 0.21], 0.065, 0.024, gold, luxR));
    const transcription = transcriptionDetail(k, group, {
      x0: -0.1,
      x1: 2.85,
      y: -1.05,
      radius: 0.15,
    });
    const promoter = k.ring([0.35, -1.05, 0], 0.22, 0.018, gold);
    promoter.rotation.y = Math.PI / 2;
    // The seven small tabs indicate operon organization without replacing molecular DNA.
    for (let i = 0; i < 7; i++)
      k.mesh(new THREE.BoxGeometry(0.2, 0.055, 0.07), i === 0 ? teal : dna, [
        0.78 + i * 0.28,
        -1.34,
        -0.05,
      ]);
    const AHL = [];
    for (let i = 0; i < 26; i++) {
      const g = new THREE.Group();
      group.add(g);
      k.ring([0, 0, 0], 0.07, 0.021, gold, g);
      k.segment([0.07, 0, 0], [0.17, 0.06, 0], 0.022, gold, g);
      AHL.push(g);
    }
    const focalGlow = k.ball([1.25, 0, -0.15], [2.08, 1.73, 0.73], glow);
    const labels = [
      k.label([-2.7, 1.83, 0], "费氏弧菌群体", "V. fischeri population", 2),
      k.label([1.2, 2.03, 0], "单细胞放大剖面", "Enlarged cell cutaway", 2),
      k.label([0.1, 1.05, 0.5], "LuxI · 合成酶", "LuxI · synthase", 2),
      k.label([1.95, 0.75, 0.5], "LuxR + AHL", "LuxR + AHL", 2),
      k.label([0.25, -1.45, 0.4], "lux box", "lux box", 1),
      k.label([1.82, -1.45, 0.4], "luxICDABEG", "luxICDABEG", 2),
      k.label(
        [-1.3, -2, 0],
        "3-oxo-C6-HSL · 可进出细胞",
        "3-oxo-C6-HSL · enters and leaves cells",
        1,
      ),
      k.label([2.16, -0.3, 0.6], "RNA", "RNA", 1),
      k.label([-0.23, -0.92, 0.25], "5′ / 3′", "5′ / 3′", 0),
      k.label([3, -1.05, 0.25], "3′ / 5′", "3′ / 5′", 0),
    ];
    function update(value, parameters = {}) {
      const p = clamp(value),
        retained = parameters.exchange !== "diluted",
        accumulation = retained ? ease(p, 0.2, 0.5) : 0,
        activation = retained ? ease(p, 0.51, 0.68) : 0,
        output = retained ? ease(p, 0.79, 0.96) : 0;
      for (let i = 0; i < AHL.length; i++) {
        const q = (p * 0.75 + i * 0.137) % 1;
        const visibleCount = retained
          ? 4 + Math.floor(22 * ease(p, 0.12, 0.85))
          : 5;
        AHL[i].visible = i < visibleCount;
        if (i < 5) {
          AHL[i].position.set(
            0.35 - 3.6 * q,
            0.6 + Math.sin(q * 6 + i) * 0.6,
            0.5,
          );
        } else {
          const a = i * 2.399 + p * 0.38,
            r = 1.05 + (i % 4) * 0.34;
          AHL[i].position.set(
            -0.65 + Math.cos(a) * r,
            Math.sin(a) * 1.25,
            0.3 + (i % 3) * 0.12,
          );
        }
        if (!retained) AHL[i].position.x -= 2 * ease(p, 0.3, 0.95);
      }
      luxR.position.set(
        1.65 - 1.3 * activation,
        0.3 + 0.0 * accumulation - 0.93 * activation,
        0.46,
      );
      bound.forEach((x) => (x.visible = activation > 0));
      extraI.visible = retained && p > 0.84;
      const extension = retained ? ease(p, 0.72, 0.94) : 0;
      transcription.update(
        1 + 0.95 * extension,
        retained ? ease(p, 0.7, 0.77) : 0,
        1.3 * extension,
        retained && p > 0.7,
      );
      focalGlow.visible = output > 0;
      focalGlow.scale.set(2.08, 1.73, 0.73);
      glow.opacity = 0.16 * output;
      halos.forEach((h) => (h.visible = output > 0));
      labels[3].position = [luxR.position.x + 0.6, luxR.position.y + 0.3, 0.6];
      labels[7].active = retained && p > 0.74;
      group.userData = {
        species: "Aliivibrio (Vibrio) fischeri",
        circuit: "LuxI–LuxR",
        signal: "3-oxo-C6-HSL",
        signalExchange: retained ? "local-retention" : "continuous-dilution",
        cellCountFixed: true,
        receptorCompartment: "cytoplasm",
        luxBoxOccupied: activation > 0.95,
        enhancedLuxTranscription: retained && p > 0.7,
        positiveFeedback: retained && p > 0.84,
        lightOutput: output > 0,
        lightIntensityIsMeasured: false,
        oxygenAndSubstratesAssumed: true,
        structuralDetail:
          "bounded-envelope; LuxI-cleft; LuxR-ligand-pockets-and-DNA-binding-helices; DNA-basepairs-bubble-and-RNAP",
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 0.8, 11.8], target: [0, 0, 0] },
    };
  },
};
