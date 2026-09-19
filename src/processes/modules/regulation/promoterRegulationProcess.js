import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import {
  molecularDNA,
  molecularRNA,
  protein,
  polymerase,
  move,
  domain,
  helix,
  tfiidComplex,
} from "./geometry.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  group.name = "Mammalian TATA-containing promoter: PIC assembly";
  const coding = k.material("#819eae"),
    template = k.material("#b0bdc9");
  const gold = k.material("#b89b61"),
    teal = k.material("#76a49b"),
    purple = k.material("#a897bc");
  const polMat = k.material("#8a9aae"),
    rnaMat = k.material("#cb9169");
  const dna = molecularDNA(k, {
    pairs: 96,
    segments: 480,
    radius: 0.044,
    phosphate: 0.056,
    baseWidth: 0.071,
    materials: [
      coding,
      template,
      k.material("#b7c8bc"),
      k.material("#c6b9cb"),
      k.material("#d4cdb7"),
    ],
  });
  dna.rails[0].mesh.name = "Promoter coding backbone";
  dna.rails[1].mesh.name = "Promoter template backbone";
  const baseWhite = new THREE.Color("#ffffff"),
    siteColor = new THREE.Color("#c3a45d");
  for (const bases of dna.bases)
    for (let i = 0; i < 96; i++) bases.setColorAt(i, baseWhite);
  const start = k.ring([0.15, 0, 0], 0.45, 0.025, rnaMat);
  start.rotation.y = Math.PI / 2;
  const tfiid = tfiidComplex(k, teal, gold);
  const tfab = protein(
    k,
    "TFIIA and TFIIB positioning factors",
    [
      [-0.25, 0, 0, 0.26, 0.23, 0.22],
      [0.2, 0.1, 0, 0.23, 0.29, 0.23],
    ],
    gold,
  );
  const pol = polymerase(k, polMat);
  const tfiif = protein(
    k,
    "TFIIF",
    [
      [0, 0, 0, 0.24, 0.38, 0.23],
      [0.2, 0.28, 0, 0.21, 0.2, 0.19],
    ],
    teal,
    pol,
  );
  tfiif.position.set(-0.6, -0.35, -0.2);
  const tfiiE = protein(
    k,
    "TFIIE",
    [
      [0, 0, 0, 0.28, 0.21, 0.2],
      [0.3, 0.1, 0, 0.22, 0.17, 0.19],
    ],
    gold,
  );
  const tfiiH = protein(
    k,
    "TFIIH XPB translocase and core",
    [
      [-0.3, 0, 0, 0.32, 0.35, 0.3],
      [0.27, 0.03, 0, 0.29, 0.33, 0.3],
      [0, 0.4, -0.12, 0.4, 0.25, 0.27],
    ],
    purple,
  );
  // TFIIH is not a hexameric helicase ring: XPB has two translocase lobes.
  tfiiH.name = "TFIIH — XPB bilobal motor, p52 and scaffold";
  const xpbLight = k.material("#c0adce");
  domain(
    k,
    tfiiH,
    "XPB lobe 1",
    [-0.23, -0.18, 0.17],
    [0.24, 0.26, 0.2],
    purple,
    1,
  );
  domain(
    k,
    tfiiH,
    "XPB lobe 2",
    [0.24, -0.16, 0.17],
    [0.23, 0.24, 0.19],
    xpbLight,
    2,
  );
  k.tube(
    [
      [-0.48, 0.1, -0.1],
      [-0.32, 0.42, -0.21],
      [0.22, 0.47, -0.18],
      [0.47, 0.16, -0.03],
    ],
    0.052,
    xpbLight,
    tfiiH,
    48,
  ).name = "TFIIH p52 scaffold arc";
  helix(
    k,
    tfiiH,
    [-0.35, -0.05, 0.32],
    [-0.11, 0.15, 0.33],
    0.035,
    3.5,
    xpbLight,
    0.014,
  );
  helix(
    k,
    tfiiH,
    [0.11, -0.01, 0.32],
    [0.34, 0.17, 0.31],
    0.035,
    3.5,
    xpbLight,
    0.014,
  );
  helix(
    k,
    tfab,
    [-0.33, -0.12, 0.19],
    [-0.2, 0.19, 0.16],
    0.038,
    4,
    k.material("#d4bf8c"),
    0.015,
  );
  helix(
    k,
    tfab,
    [0.08, -0.1, 0.18],
    [0.22, 0.22, 0.2],
    0.042,
    4.5,
    k.material("#d4bf8c"),
    0.015,
  );
  k.tube(
    [
      [0.3, 0.04, 0.1],
      [0.46, -0.09, 0.15],
      [0.55, -0.17, 0.12],
    ],
    0.023,
    gold,
    tfab,
    32,
  ).name = "TFIIB reader/linker schematic";
  helix(
    k,
    tfiif,
    [-0.06, -0.2, 0.18],
    [0.14, 0.27, 0.17],
    0.04,
    5,
    k.material("#afc9bf"),
    0.015,
  );
  k.tube(
    [
      [-0.15, 0.09, 0.08],
      [0.04, 0.36, 0.13],
      [0.3, 0.41, 0.12],
    ],
    0.038,
    teal,
    tfiif,
    32,
  ).name = "TFIIF clamp interaction arm";
  helix(
    k,
    tfiiE,
    [-0.14, -0.03, 0.19],
    [0.33, 0.12, 0.18],
    0.041,
    5,
    k.material("#d5c293"),
    0.015,
  );
  const rna = molecularRNA(k, rnaMat, { count: 52, radius: 0.035 });
  const labels = [
    k.label([-2.05, -0.9, 0.1], "TATA 启动子", "TATA promoter", 3),
    k.label([-0.8, 1.7, 0], "TFIID · TBP 弯曲 DNA", "TFIID · TBP bends DNA", 2),
    k.label([0.3, -1.05, 0.3], "转录起始位点 +1", "Transcription start +1", 2),
    k.label([0.6, 1.45, 0], "Pol II · TFIIF", "Pol II · TFIIF", 3),
    k.label([2.1, -0.95, 0.1], "TFIIH · XPB 解链", "TFIIH · XPB opens DNA", 2),
    k.label([-1.4, -1.6, 0.7], "新生 RNA · 5′ 端", "Nascent RNA · 5′ end", 3),
    k.label([-3.85, 0.75, 0.1], "编码链 5′ → 3′", "Coding 5′ → 3′", 1),
    k.label([3.65, -0.7, 0.1], "模板链 3′ → 5′", "Template 3′ → 5′", 1),
    k.label(
      [-1.4, 2.45, 0],
      "位点改变：本轮未形成稳定 PIC",
      "Altered site: no stable PIC in this attempt",
      4,
    ),
  ];
  let bend = 0,
    opening = 0,
    travel = 0;
  const point = (t, strand, out) => {
    const x = -4.2 + 8.4 * t,
      local = x + 1.75;
    const y = -0.44 * bend * Math.exp((-local * local) / 0.52);
    const localX = x - (0.23 + travel);
    const phase = (localX / 8.4) * Math.PI * 18;
    const bubble = opening * Math.exp(-Math.pow(localX / 0.66, 4));
    // Open the common duplex frame, never interpolate two backbone positions
    // through one another. Radius remains positive and chain identity is fixed.
    const closedRadius = 0.3 * Math.sin(2.35 / 2);
    const closedMid = 0.3 * Math.cos(2.35 / 2);
    const openRadius = Math.hypot(0.36, 0.0525);
    const angle = phase * (1 - bubble) + Math.atan2(0.0525, 0.36) * bubble;
    const radius = closedRadius * (1 - bubble) + openRadius * bubble;
    const sign = strand ? -1 : 1;
    out.set(
      x,
      y -
        closedMid * Math.sin(phase) * (1 - bubble) +
        0.09 * bubble +
        sign * radius * Math.cos(angle),
      closedMid * Math.cos(phase) * (1 - bubble) -
        0.0525 * bubble +
        sign * radius * Math.sin(angle),
    );
  };
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      altered = parameters.bindingSite === "altered";
    const recognition = ease(p, 0.08, 0.27),
      escape = ease(p, 0.79, 0.99);
    const stable = altered
      ? recognition * (1 - ease(p, 0.34, 0.58))
      : recognition;
    bend = stable;
    opening = altered ? 0 : ease(p, 0.59, 0.74);
    travel = altered ? 0 : escape * 1.65;
    dna.update(
      (t, strand, out) => point(t, strand, out),
      (t) =>
        1 -
        opening *
          Math.exp(-Math.pow((-4.2 + 8.4 * t - (0.23 + travel)) / 0.66, 4)),
    );
    move(tfiid, [-2.1, 2.1, -0.2], [-1.27, 0.12, -0.35], stable);
    move(
      tfab,
      [-3.5, 1.1, -0.6],
      [-0.87, -0.03, -0.22],
      altered ? stable * 0.2 : ease(p, 0.27, 0.41),
    );
    const assembly = altered ? 0 : ease(p, 0.34, 0.53);
    move(pol, [1.3, 2.05, -0.4], [0.2 + travel, 0.03, -0.12], assembly);
    move(
      tfiiE,
      [3.55, 1.5, -0.3],
      [0.63, 0.62, -0.4],
      altered ? 0 : ease(p, 0.48, 0.6),
    );
    move(
      tfiiH,
      [3.55, -1.35, -0.2],
      [1.5 + escape * 0.6, -0.03, -0.05],
      altered ? 0 : ease(p, 0.5, 0.65),
    );
    tfiiH.rotation.x = opening * 0.32;
    rna.group.visible = !altered && p > 0.74;
    const length = ease(p, 0.74, 0.99) * 2.3;
    // The first backbone point is the catalytic 3′ end, not the RNA exit.
    // The short, straight initial segment lies alongside the opened template.
    rna.update(
      (t, out) => {
        const distance = length * t;
        const peel = ease(distance, 0.26, 1.55);
        out.set(
          pol.position.x + 0.03 - distance,
          pol.position.y - 0.18 - 1.1 * peel,
          pol.position.z + 0.015 + 0.28 * peel,
        );
      },
      length,
      (t, out) => out.set(0, -0.065, 0),
    );
    siteColor.set(altered ? "#bf837c" : "#d4b66c");
    for (const bases of dna.bases) {
      for (let i = 0; i < 96; i++)
        bases.setColorAt(i, i >= 23 && i <= 33 ? siteColor : baseWhite);
      bases.instanceColor.needsUpdate = true;
    }
    labels[1].active = stable > 0.2;
    labels[3].position[0] = 0.4 + travel;
    labels[3].active = true;
    labels[4].active = !altered && p > 0.48;
    labels[5].active = rna.group.visible;
    labels[5].position[0] = pol.position.x + 0.03 - length;
    labels[8].active = altered && p > 0.38;
    group.userData = {
      species: "mammal",
      compartment: "nucleus",
      condition: altered ? "altered-TATA" : "consensus-TATA",
      stablePIC: !altered && p >= 0.53,
      promoterBound: stable > 0.8,
      dnaOpen: opening > 0.5,
      rnaSynthesis: !altered && p > 0.74,
      rnaDirection: "5′→3′",
      templateDirection: "3′→5′",
      polymeraseTravel: travel,
      notQuantitative: true,
      structuralDetail: {
        dnaBasePairs: 96,
        separatedBasesRetained: true,
        tbpBetaStrands: 8,
        polIIOpenCleft: true,
        xpbBilobal: true,
      },
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0.2, 2.1, 11], target: [0, 0.3, 0] },
  };
}
export default {
  id: "promoterRegulation",
  title: b("启动子与转录装配", "Promoter regulation"),
  duration: 32,
  legend: [
    { color: "#76a49b", text: b("TFIID 与 TFIIF", "TFIID and TFIIF") },
    { color: "#8a9aae", text: b("RNA 聚合酶 II", "RNA polymerase II") },
    { color: "#a897bc", text: b("TFIIH", "TFIIH") },
    {
      color: "#cb9169",
      text: b("RNA / 起始位点标记", "RNA / start-site marker"),
    },
  ],
  intro: b(
    "哺乳动物细胞核中，一个含 TATA 的示意启动子招募通用转录因子与 Pol II。比较识别位点完整与改变时的一次装配尝试；未成功的示例不表示所有突变都会完全关闭转录。多数人类启动子并无典型 TATA。",
    "In a mammalian nucleus, a schematic TATA-containing promoter recruits general factors and Pol II. Compare one assembly attempt at an intact or altered recognition site; an unsuccessful example does not mean every mutation abolishes transcription. Most human promoters lack a canonical TATA box.",
  ),
  controls: [
    {
      id: "bindingSite",
      label: b("TATA 识别位点", "TATA recognition site"),
      default: "intact",
      options: [
        { value: "intact", label: b("完整位点", "Intact site") },
        {
          value: "altered",
          label: b(
            "改变位点 · 未稳定结合示例",
            "Altered site · unstable binding example",
          ),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("识别启动子", "Recognize the promoter"),
      description: b(
        "两条 DNA 链反向平行。金色区域标出示意 TATA 位点，起始位点在下游；圆环仅为起始位点标记；画面省略核小体；碱基配对与蛋白结构为示意，不对应原子坐标或具体序列。",
        "The two DNA strands are antiparallel. Gold marks the schematic TATA region upstream of the start site; the ring only marks the start site. Nucleosomes are omitted; base pairs and protein folds are schematic, not atomic coordinates or a specific sequence.",
      ),
    },
    {
      at: 0.17,
      title: b("TFIID 结合与 DNA 弯曲", "TFIID binding and DNA bending"),
      description: b(
        "TFIID 的 TBP 亚基结合并弯曲 DNA，TAF 亚基帮助识别核心启动子。改变位点情景展示本轮结合不稳定。",
        "The TBP subunit of TFIID binds and bends DNA; TAF subunits assist core-promoter recognition. The altered-site scenario illustrates an unstable binding attempt.",
      ),
    },
    {
      at: 0.34,
      title: b("定位聚合酶", "Position the polymerase"),
      description: b(
        "TFIIA 与 TFIIB 支持起始复合体定位，Pol II 与 TFIIF 加入。此处将可协同发生的步骤拆开展示。",
        "TFIIA and TFIIB support positioning; Pol II and TFIIF join. Cooperative events are separated here for clarity.",
      ),
    },
    {
      at: 0.52,
      title: b("完成预起始装配", "Complete pre-initiation assembly"),
      description: b(
        "TFIIE 与 TFIIH 靠近下游 DNA。稳定装配提供开启模板所需的结构；位点改变示例中这些因子保持游离。",
        "TFIIE and TFIIH approach downstream DNA. Stable assembly prepares the template for opening; factors remain unbound in the altered-site example.",
      ),
    },
    {
      at: 0.66,
      title: b("开启转录泡", "Open the transcription bubble"),
      description: b(
        "TFIIH 的 XPB 转位活动帮助启动子解链，模板链进入 Pol II 的活性裂隙；不是整段 DNA 同时打开。",
        "XPB translocation within TFIIH helps open promoter DNA, placing the template in the Pol II cleft; opening remains local.",
      ),
    },
    {
      at: 0.81,
      title: b("起始与离开启动子", "Initiation and promoter escape"),
      description: b(
        "Pol II 沿模板链的 3′→5′ 方向前进，将核苷酸加入 RNA 的 3′ 端，RNA 因此按 5′→3′ 延长。磷酸化等步骤在此省略。",
        "Pol II advances along template DNA 3′→5′, adding nucleotides to the RNA 3′ end so RNA grows 5′→3′. Phosphorylation and other steps are omitted.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Barnes et al. (2015) — Transcribing Pol II with a complete bubble (5C44)",
      url: "https://www.rcsb.org/structure/5C44",
    },
    {
      title: "Louder et al. (2016) — Structure of promoter-bound TFIID",
      url: "https://www.nature.com/articles/nature17394",
    },
    {
      title: "Patel et al. (2018) — Human TFIID and TBP loading",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6446905/",
    },
    {
      title: "Aibara et al. (2021) — Mammalian Pol II pre-initiation complexes",
      url: "https://www.nature.com/articles/s41586-021-03554-8",
    },
  ],
  create,
};
