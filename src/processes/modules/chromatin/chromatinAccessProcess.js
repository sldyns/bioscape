import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";
import { dynamicTube, moveSegment, rightHandedDuplex } from "./geometry.js";
import { duplexDetails, alphaHelix, cleftComplex } from "./structure.js";

const title = B("染色质可及性", "Chromatin accessibility");
const intro = B(
  "真核细胞核内，核小体位置影响 DNA 位点暴露。本示意以 ISWI 类重塑酶驱动的滑移为例，比较 ATP 水解正常与受阻：同一 DNA 位点从组蛋白表面移到连接区。可及性增加不等于必然转录。",
  "In eukaryotic nuclei, nucleosome positions affect DNA-site exposure. This schematic uses ISWI-family sliding to compare active and disabled ATP hydrolysis: the same DNA site moves from the histone surface into linker DNA. Accessibility does not guarantee transcription.",
);
const stages = [
  {
    at: 0,
    title: B("位点被包裹", "A wrapped site"),
    description: B(
      "DNA 在组蛋白八聚体外缠绕约 1.65 圈。金色标记始终代表同一段序列；普通结合因子难以占据这个包裹位点。",
      "DNA wraps about 1.65 turns around a histone octamer. The gold marker tracks one sequence throughout; an ordinary binding factor has restricted access to this wrapped site.",
    ),
  },
  {
    at: 0.17,
    title: B("重塑酶接触核小体", "Remodeler engagement"),
    description: B(
      "ISWI 类 ATP 酶接触核小体 DNA 与连接区。图中保留组蛋白核心，展示滑移，而非将组蛋白整体移除。",
      "An ISWI-family ATPase engages nucleosomal and linker DNA. The histone core remains intact: the illustrated mechanism is sliding, rather than histone eviction.",
    ),
  },
  {
    at: 0.34,
    title: B("DNA 相对核心转位", "DNA translocation"),
    description: B(
      "ATP 水解支持 DNA 相对组蛋白的转位，使核小体在序列上的位置改变。关闭水解时，模型中的持续滑移停止。",
      "ATP hydrolysis supports DNA translocation relative to histones and changes the nucleosome position along the sequence. Disabling hydrolysis prevents sustained sliding in this model.",
    ),
  },
  {
    at: 0.64,
    title: B("原位点进入连接区", "The site enters linker DNA"),
    description: B(
      "金色序列脱离核小体包裹区，暴露给结合因子。滑移也会覆盖另一侧的序列，因而重塑并不总是开放染色质。",
      "The gold sequence leaves the wrapped region and becomes available to a binding factor. Sliding covers sequence on the other side, so remodeling does not always open chromatin.",
    ),
  },
  {
    at: 0.84,
    title: B("可接近，不等于表达", "Accessible is not expressed"),
    description: B(
      "因子可在暴露位点结合；水解受阻的对照保持较低可及性。这里只示意几何可及性，不预测结合概率、表达量或细胞内的精确速度。",
      "A factor can bind the exposed site; the hydrolysis-disabled control retains restricted access. This illustrates geometric accessibility, not binding probabilities, expression levels, or cellular rates.",
    ),
  },
];

function create({ rootId = "cell" } = {}) {
  const k = sceneKit(),
    { group } = k;
  const dnaA = k.material("#628f9c"),
    dnaB = k.material("#9cb6bb"),
    histone = k.material("#b6a3bc");
  const gold = k.material("#c29955"),
    remodelMat = k.material("#749e8f"),
    factorMat = k.material("#b88674");
  const core = new THREE.Group();
  group.add(core);
  for (let i = 0; i < 8; i++) {
    const a = ((i % 4) * Math.PI) / 2;
    k.ball(
      [i < 4 ? -0.17 : 0.17, 0.32 * Math.sin(a), 0.32 * Math.cos(a)],
      [0.26, 0.32, 0.32],
      histone,
      core,
    );
  }
  core.name = "octamer-eight-histone-folds-and-N-terminal-tails";
  for (let i = 0; i < 8; i++) {
    const a = ((i % 4) * Math.PI) / 2,
      x = i < 4 ? -0.18 : 0.18;
    const fold = k.material(
      ["#ab94b6", "#c0a7bd", "#a297b9", "#b9a3c2"][i % 4],
    );
    for (let j = 0; j < 3; j++)
      alphaHelix(
        k,
        core,
        [x - 0.15, 0.33 * Math.sin(a) + j * 0.035, 0.33 * Math.cos(a)],
        [x + 0.15, 0.33 * Math.sin(a) + j * 0.035, 0.33 * Math.cos(a)],
        0.042,
        fold,
        3,
      );
    k.tube(
      [
        [x, 0.43 * Math.sin(a), 0.43 * Math.cos(a)],
        [x + 0.12, 0.7 * Math.sin(a), 0.7 * Math.cos(a)],
        [x + 0.25, 0.82 * Math.sin(a + 0.15), 0.82 * Math.cos(a + 0.15)],
      ],
      0.018,
      fold,
      core,
      40,
    ).name = "histone-tail";
  }
  const remodeler = new THREE.Group();
  group.add(remodeler);
  k.ball([-0.23, 0, 0], [0.43, 0.38, 0.32], remodelMat, remodeler);
  k.ball([0.28, -0.13, 0.02], [0.37, 0.31, 0.29], remodelMat, remodeler);
  k.segment([0.3, -0.1, 0], [0.63, -0.42, 0.03], 0.11, remodelMat, remodeler);
  k.ball([0.7, -0.44, 0.03], [0.23, 0.17, 0.18], remodelMat, remodeler);
  const motor = cleftComplex(k, remodeler, 0.67, ["#73998a", "#a6b9a5"]);
  motor.position.set(0.02, -0.1, 0.23);
  const atpPocket = k.ring([0.05, -0.04, 0.35], 0.12, 0.025, gold, remodeler);
  atpPocket.name = "ATPase-interlobe-pocket";
  for (let j = 0; j < 3; j++)
    alphaHelix(
      k,
      remodeler,
      [0.48 + j * 0.07, -0.3, 0.16],
      [0.6 + j * 0.07, -0.65, 0.17],
      0.035,
      remodelMat,
      3,
    );
  const factor = new THREE.Group();
  group.add(factor);
  k.ball([-0.13, 0.12, 0], [0.2, 0.33, 0.23], factorMat, factor);
  k.ball([0.13, 0.12, 0], [0.2, 0.33, 0.23], factorMat, factor);
  k.segment([-0.12, 0.1, 0], [0.12, 0.1, 0], 0.1, factorMat, factor);
  alphaHelix(
    k,
    factor,
    [-0.14, -0.04, 0.18],
    [-0.12, 0.42, 0.18],
    0.052,
    factorMat,
    4,
  );
  alphaHelix(
    k,
    factor,
    [0.14, -0.04, 0.18],
    [0.12, 0.42, 0.18],
    0.052,
    factorMat,
    4,
  );
  const nucleotideDetail = duplexDetails(k, group, 164, 0.032);
  const strands = [
    dynamicTube(group, dnaA, 400, 0.038),
    dynamicTube(group, dnaB, 400, 0.038),
  ];
  const site = dynamicTube(group, gold, 30, 0.085);
  const rungs = [];
  for (let i = 0; i < 92; i++)
    rungs.push(k.mesh(k.cylinder, k.material("#b6c7c9")));
  const wrap = 1.65 * Math.PI * 2,
    R = 0.67,
    helixLength = Math.hypot(0.68, R * wrap),
    total = 7.2 - 0.68 + helixLength;
  const siteDistance = 3.6 - 0.7 - 0.34 + 0.82;
  let center = -0.7;
  const centerline = (s, out) => {
    const d = s * total,
      left = center - 0.34 + 3.6;
    if (d < left) return out.set(-3.6 + d, 0, R);
    if (d < left + helixLength) {
      const t = (d - left) / helixLength,
        a = t * wrap;
      return out.set(
        center - 0.34 + 0.68 * t,
        R * Math.sin(a),
        R * Math.cos(a),
      );
    }
    return out.set(
      center + 0.34 + d - left - helixLength,
      R * Math.sin(wrap),
      R * Math.cos(wrap),
    );
  };
  const duplex = rightHandedDuplex(centerline, 0.068, total * 15);
  const { sampleA, sampleB } = duplex;
  strands[0].mesh.name = "nucleosome-DNA-A";
  strands[1].mesh.name = "nucleosome-DNA-B";
  site.mesh.name = "fixed-sequence-site";
  const siteSample = (s, out) =>
    centerline((siteDistance + (s - 0.5) * 0.35) / total, out);
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    scratch = new THREE.Vector3();
  const labels = [
    k.label([0, -1.2, 0], "组蛋白八聚体", "Histone octamer", 8),
    k.label([0, 2.1, 0], "ISWI 类重塑酶", "ISWI-family remodeler", 7),
    k.label([0, 0, 0], "同一 DNA 位点", "Same DNA sequence", 10),
    k.label([-3, 1.8, 0.8], "DNA 结合因子", "DNA-binding factor", 6),
    k.label(
      [3, -1.5, 0],
      "细胞核内 · 滑移示意",
      "Nucleus · sliding schematic",
      1,
    ),
  ];
  if (rootId === "plant")
    labels[1].text = B("ISWI 类 · CHR11/17", "ISWI family · CHR11/17");
  if (rootId === "yeast")
    labels[1].text = B("ISWI 类 · Isw1", "ISWI family · Isw1");
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      active = parameters.hydrolysis !== "disabled";
    const slide = active ? ease(p, 0.33, 0.76) : 0;
    center = -0.7 + 2.15 * slide;
    core.position.x = center;
    const dock = ease(p, 0.12, 0.3),
      depart = active ? ease(p, 0.8, 0.97) : 0;
    remodeler.position.set(center, 1.55 - 0.56 * dock + 0.7 * depart, 0.05);
    remodeler.rotation.z = active
      ? 0.08 * Math.sin(p * 24) * ease(p, 0.32, 0.4) * (1 - ease(p, 0.7, 0.8))
      : 0;
    duplex.update();
    strands[0].update(sampleA);
    strands[1].update(sampleB);
    site.update(siteSample);
    nucleotideDetail.update(sampleA, sampleB);
    for (let i = 0; i < rungs.length; i++) {
      const s = (i + 0.5) / rungs.length;
      sampleA(s, a);
      sampleB(s, b);
      moveSegment(rungs[i], a, b, 0.017, scratch);
    }
    centerline(siteDistance / total, a);
    const exposed = siteDistance + 0.18 < center - 0.34 + 3.6;
    const bind = active ? ease(p, 0.77, 0.91) : 0;
    factor.position.set(a.x, a.y + 0.18 + 1.48 * (1 - bind), a.z + 0.1);
    labels[0].position[0] = center;
    labels[1].position[0] = center;
    labels[1].position[1] = remodeler.position.y + 0.7;
    labels[2].position[0] = a.x;
    labels[2].position[1] = a.y - 0.55;
    labels[2].position[2] = a.z + 0.2;
    labels[3].position[0] = factor.position.x;
    labels[3].position[1] = factor.position.y + 0.6;
    labels[3].position[2] = factor.position.z;
    Object.assign(group.userData, {
      process: "chromatinAccess",
      rootId,
      condition: active ? "active" : "disabled",
      histoneRetained: true,
      visualDetail:
        "histone folds/tails, paired DNA nucleotides, ISWI motor cleft",
      nucleosomeDisplacement: 2.15 * slide,
      siteAccessible: exposed,
      factorBound: exposed && bind > 0.99,
      sequenceSite: siteDistance,
      transcriptionPredicted: false,
    });
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0.3, 3.1, 12.5], target: [0, 0.4, 0] },
  };
}
export default {
  id: "chromatinAccess",
  title,
  intro,
  duration: 32,
  stages,
  create,
  controls: [
    {
      id: "hydrolysis",
      label: B("ATP 水解", "ATP hydrolysis"),
      default: "active",
      options: [
        { value: "active", label: B("正常滑移", "Active sliding") },
        { value: "disabled", label: B("水解受阻", "Hydrolysis disabled") },
      ],
    },
  ],
  contexts: {
    plant: {
      intro: B(
        "植物细胞核中的 ISWI 类重塑酶（拟南芥 CHR11/17 等）参与核小体定位。这里仅展示保守的 ATP 依赖滑移原理及一个示意位点的暴露，不代表特定植物基因的实测表达。",
        "Plant nuclear ISWI-family remodelers, including Arabidopsis CHR11/17, help position nucleosomes. This illustrates conserved ATP-dependent sliding and exposure of a schematic site, not measured expression of a particular plant gene.",
      ),
    },
    yeast: {
      intro: B(
        "酵母细胞核中，Isw1 等 ISWI 类重塑酶可通过 ATP 依赖的 DNA 转位移动核小体。本示意追踪同一 DNA 位点的暴露；滑移也能遮挡其他位点，可及性不直接决定转录。",
        "In yeast nuclei, ISWI-family remodelers such as Isw1 move nucleosomes through ATP-dependent DNA translocation. Follow exposure of one DNA site; sliding can also cover other sites, and accessibility alone does not determine transcription.",
      ),
    },
  },
  sources: [
    {
      title: "Yan et al. (2019), Structures of the ISWI–nucleosome complex",
      url: "https://www.nature.com/articles/s41594-019-0199-9",
    },
    {
      title: "Dann et al. (2017), Human ISWI substrate recognition",
      url: "https://www.nature.com/articles/nature23671",
    },
    {
      title:
        "Li et al. (2014), ISWI proteins and Arabidopsis nucleosome distribution",
      url: "https://pubmed.ncbi.nlm.nih.gov/24606212/",
    },
  ],
};
