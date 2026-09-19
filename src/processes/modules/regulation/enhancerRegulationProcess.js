import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import {
  molecularRNA,
  protein,
  polymerase,
  domain,
  helix,
} from "./geometry.js";
import { chromatinFiber } from "./chromatinGeometry.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  group.name = "Mammalian enhancer regulation on a dynamic nucleosomal fiber";
  const activeMat = k.material("#759f93"),
    mediatorMat = k.material("#b4a06f"),
    polMat = k.material("#8298ae"),
    rnaMat = k.material("#c98b6c");
  const fiber = chromatinFiber(k);
  const enhancer = new THREE.Group(),
    promoter = new THREE.Group();
  group.add(enhancer, promoter);
  enhancer.name = "Accessible enhancer with sequence-specific activators";
  promoter.name = "Core promoter and Pol II";
  k.tube(
    [
      [-0.48, -0.17, -0.06],
      [0, -0.2, -0.06],
      [0.48, -0.17, -0.06],
    ],
    0.028,
    activeMat,
    enhancer,
    48,
  ).name = "Enhancer locus marker";
  k.tube(
    [
      [-0.36, -0.17, -0.06],
      [0, -0.19, -0.06],
      [0.36, -0.17, -0.06],
    ],
    0.028,
    mediatorMat,
    promoter,
    40,
  ).name = "Promoter locus marker";
  const activators = [-0.27, 0.25].map((x, i) => {
    const factor = protein(
      k,
      `Sequence-specific activator ${i + 1}`,
      [
        [0, 0, 0, 0.14, 0.24, 0.18],
        [-0.13, 0.25, 0, 0.13, 0.2, 0.16],
        [0.14, 0.23, 0, 0.13, 0.19, 0.15],
      ],
      activeMat,
      enhancer,
    );
    const recognition = k.material("#b0cbbb");
    helix(
      k,
      factor,
      [-0.11, -0.11, 0.08],
      [0.13, 0.05, 0.08],
      0.038,
      4,
      recognition,
      0.014,
    ).name = "DNA recognition helix schematic";
    helix(
      k,
      factor,
      [-0.13, 0.2, 0.14],
      [-0.08, 0.42, 0.08],
      0.034,
      3.5,
      recognition,
      0.013,
    );
    k.tube(
      [
        [-0.1, 0.4, 0],
        [-0.24, 0.58, -0.08],
        [-0.09, 0.71, -0.08],
        [0.1, 0.64, -0.04],
      ],
      0.023,
      activeMat,
      factor,
      36,
    ).name = "Activation region schematic";
    factor.userData.x = x;
    return factor;
  });
  const mediator = new THREE.Group();
  mediator.name = "Mediator — articulated tail, middle and PIC-facing head";
  group.add(mediator);
  const mediatorLight = k.material("#ccb98c"),
    mediatorDark = k.material("#96804f");
  const mediatorParts = [
    ["Tail lower", [-0.66, -0.22, -0.11], [0.24, 0.36, 0.23], mediatorMat],
    ["Tail upper", [-0.56, 0.25, -0.19], [0.31, 0.29, 0.25], mediatorLight],
    ["Middle scaffold", [-0.11, 0.38, -0.23], [0.5, 0.2, 0.24], mediatorMat],
    ["Middle connector", [0.12, 0.08, -0.22], [0.28, 0.27, 0.19], mediatorDark],
    ["Head jaw", [0.44, 0.05, -0.12], [0.24, 0.33, 0.23], mediatorLight],
    ["Head neck", [0.29, -0.34, -0.09], [0.29, 0.2, 0.22], mediatorMat],
    [
      "Head movable arm",
      [0.54, -0.39, -0.02],
      [0.17, 0.18, 0.17],
      mediatorLight,
    ],
  ];
  mediatorParts.forEach(([name, pos, scale, mat], i) =>
    domain(k, mediator, `Mediator ${name}`, pos, scale, mat, i),
  );
  k.tube(
    [
      [-0.66, -0.23, -0.32],
      [-0.59, 0.28, -0.36],
      [-0.15, 0.5, -0.33],
      [0.26, 0.3, -0.27],
      [0.49, -0.19, -0.16],
    ],
    0.055,
    mediatorDark,
    mediator,
    64,
  ).name = "Mediator intermodule scaffold";
  for (let i = 0; i < 5; i++)
    helix(
      k,
      mediator,
      [-0.48 + i * 0.19, 0.29, 0.012],
      [-0.36 + i * 0.19, 0.47, 0.025],
      0.035,
      3,
      mediatorLight,
      0.014,
    );
  const pol = polymerase(k, polMat);
  pol.scale.setScalar(0.63);
  const rna = molecularRNA(k, rnaMat, { count: 42, radius: 0.03 });
  const frame = () => ({
    origin: new THREE.Vector3(),
    x: new THREE.Vector3(),
    y: new THREE.Vector3(),
    z: new THREE.Vector3(),
  });
  const activeFrame = frame();
  const orientation = new THREE.Matrix4();
  const catalyticOffset = new THREE.Vector3(0.03, -0.18, 0.015).multiplyScalar(
    0.63,
  );
  const offset = new THREE.Vector3();
  function transcriptPoint(f, t, length, out) {
    const distance = t * length;
    const peel = ease(distance, 0.14, 1.2);
    return out
      .copy(f.origin)
      .addScaledVector(f.x, -distance)
      .addScaledVector(f.y, -0.83 * peel)
      .addScaledVector(f.z, 0.28 * peel);
  }
  // Each burst releases its own existing chain. The first product remains when
  // a second initiation occurs, instead of vanishing or being reused as RNA 2.
  const products = [0.74, 0.99].map((end, i) => {
    const f = frame();
    const endFold = 0.3 + 0.62 * Math.sin(end * Math.PI * 2.5) ** 2;
    fiber.update(end, endFold);
    fiber.frame(6, 0.62, f);
    const molecule = molecularRNA(k, rnaMat, { count: 42, radius: 0.03 });
    molecule.group.name = `Released RNA from burst ${i + 1}`;
    molecule.update(
      (t, out) => transcriptPoint(f, t, 1.78, out),
      1.78,
      (t, out) => out.copy(f.y).multiplyScalar(-0.065),
    );
    return { end, molecule };
  });
  const enhancerPos = new THREE.Vector3(),
    promoterPos = new THREE.Vector3();
  let fold = 0,
    p = 0;
  const labels = [
    k.label([-2.3, 1.5, 0], "增强子 · 激活因子", "Enhancer · activators", 3),
    k.label([2.3, 0.7, 0], "启动子 · Pol II", "Promoter · Pol II", 3),
    k.label(
      [-0.1, -2.7, 0],
      "核小体与连接 DNA",
      "Nucleosomes and linker DNA",
      2,
    ),
    k.label(
      [1.3, 2.3, 0],
      "共激活因子 · 示意 Mediator",
      "Coactivator · schematic Mediator",
      2,
    ),
    k.label([2.8, -0.5, 0], "新生 RNA · 5′ 端", "Nascent RNA · 5′ end", 3),
    k.label(
      [0, 2.9, 0],
      "空间靠近 ≠ 即时转录",
      "Proximity ≠ immediate transcription",
      4,
    ),
    k.label(
      [0, 2.3, 0],
      "招募受限：本窗口无转录脉冲",
      "Recruitment impaired: no burst in this window",
      4,
    ),
  ];
  function update(progress, parameters = {}) {
    p = clamp(progress);
    const impaired = parameters.coactivator === "impaired";
    // Identical chromatin centerlines decouple proximity from output; only the
    // productive promoter undergoes local strand opening.
    fold = 0.3 + 0.62 * Math.sin(p * Math.PI * 2.5) ** 2;
    const burst =
      !impaired && ((p >= 0.59 && p < 0.74) || (p >= 0.87 && p < 0.99));
    const burstProgress =
      p < 0.8 ? clamp((p - 0.59) / 0.15) : clamp((p - 0.87) / 0.12);
    const activeT = impaired
      ? 0.34
      : p < 0.74
        ? 0.34 + 0.28 * burstProgress
        : p < 0.87
          ? 0.62 - 0.28 * ease(p, 0.76, 0.85)
          : 0.34 + 0.28 * burstProgress;
    const opening = impaired
      ? 0
      : p < 0.8
        ? ease(p, 0.53, 0.59) * (1 - ease(p, 0.74, 0.78))
        : ease(p, 0.81, 0.87) * (1 - ease(p, 0.99, 1));
    fiber.update(p, fold, { t: activeT, opening });
    fiber.frame(6, activeT, activeFrame);
    fiber.site(1, 0.5, enhancerPos);
    fiber.site(6, 0.5, promoterPos);
    enhancer.position.copy(enhancerPos);
    promoter.position.copy(promoterPos);
    const bound = ease(p, 0.09, 0.29);
    activators.forEach((factor, i) =>
      factor.position.set(
        factor.userData.x + (1 - bound) * (i ? -0.6 : 0.6),
        0.14 + 1.25 * (1 - bound),
        0,
      ),
    );
    const recruited = impaired ? 0 : ease(p, 0.3, 0.5);
    mediator.position.set(
      promoterPos.x - 0.76 + (1 - recruited) * 0.7,
      promoterPos.y + 0.84 + (1 - recruited) * 1.25,
      promoterPos.z - 0.23,
    );
    mediator.rotation.z = -0.15 + 0.1 * recruited;
    const polAssembly = ease(p, 0.32, 0.52);
    orientation.makeBasis(activeFrame.x, activeFrame.y, activeFrame.z);
    pol.quaternion.setFromRotationMatrix(orientation);
    offset.copy(catalyticOffset).applyQuaternion(pol.quaternion);
    const recycling =
      !impaired && p >= 0.74 && p < 0.87
        ? 0.8 * Math.sin(Math.PI * clamp((p - 0.74) / 0.13))
        : 0;
    pol.position
      .copy(activeFrame.origin)
      .sub(offset)
      .addScaledVector(activeFrame.y, (1 - polAssembly) * 1.5 + recycling)
      .addScaledVector(activeFrame.x, (1 - polAssembly) * 0.8);
    const rnaLength = burst ? 1.78 * burstProgress : 0;
    rna.group.visible = burst;
    rna.update(
      (t, out) => transcriptPoint(activeFrame, t, rnaLength, out),
      rnaLength,
      (t, out) => out.copy(activeFrame.y).multiplyScalar(-0.065),
    );
    for (const { end, molecule } of products) {
      molecule.group.visible = !impaired && p >= end;
      const release = ease(p, end, Math.min(1, end + 0.1));
      molecule.group.position.set(0, -0.85 * release, 0.45 * release);
    }
    labels[0].position.splice(
      0,
      3,
      enhancerPos.x - 0.1,
      enhancerPos.y + 1.05,
      enhancerPos.z,
    );
    labels[1].position.splice(
      0,
      3,
      promoterPos.x + 0.25,
      promoterPos.y - 0.62,
      promoterPos.z,
    );
    labels[3].position.splice(
      0,
      3,
      mediator.position.x - 0.15,
      mediator.position.y + 0.64,
      mediator.position.z,
    );
    labels[3].active = !impaired && p > 0.3;
    labels[4].active = burst;
    transcriptPoint(activeFrame, 1, rnaLength, offset);
    labels[4].position.splice(0, 3, offset.x, offset.y - 0.24, offset.z);
    labels[6].active = impaired && p > 0.49;
    labels[5].active = !labels[6].active;
    group.userData = {
      species: "mammal",
      compartment: "nucleus",
      condition: impaired
        ? "coactivator-recruitment-impaired"
        : "competent-coactivator",
      enhancerBound: bound > 0.9,
      coactivatorRecruited: recruited > 0.9,
      transcriptionBurst: burst,
      enhancerPromoterDistance: enhancerPos.distanceTo(promoterPos),
      proximityIsNotOutput: true,
      rnaDirection: "5′→3′",
      illustrativeBurstTiming: true,
      nucleosomeCount: fiber.cores.length,
      structuralDetail: {
        histoneSubunits: 56,
        displayedBasePairs: fiber.basePairs,
        duplexLinkers: 8,
        nucleosomeTails: true,
        mediatorModules: 3,
      },
      nucleosomeSuperhelix: "left-handed",
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 3.05, 12.4], target: [0, -0.2, 0] },
  };
}
export default {
  id: "enhancerRegulation",
  title: b("增强子与远程调控", "Enhancer regulation"),
  duration: 34,
  legend: [
    { color: "#b1a9bb", text: b("核小体", "Nucleosomes") },
    {
      color: "#759f93",
      text: b("增强子与激活因子", "Enhancer and activators"),
    },
    { color: "#b4a06f", text: b("共激活因子", "Coactivator") },
    { color: "#8298ae", text: b("RNA 聚合酶 II", "RNA polymerase II") },
    { color: "#c98b6c", text: b("新生 RNA", "Nascent RNA") },
  ],
  intro: b(
    "哺乳动物细胞核中的机制示意：增强子上的激活因子与共激活因子支持启动子功能，染色质不断改变构象。两种情景采用相同的空间轨迹，却有不同的招募结果；转录脉冲为教学示例，不是测量结果或所有位点的通则。",
    "A mechanistic schematic in a mammalian nucleus: enhancer-bound activators and coactivators support promoter function while chromatin changes conformation. Both scenarios share the same spatial trajectory but differ in recruitment. Burst timing is illustrative, not a measurement or a rule for every locus.",
  ),
  controls: [
    {
      id: "coactivator",
      label: b("共激活因子招募", "Coactivator recruitment"),
      default: "competent",
      options: [
        { value: "competent", label: b("可招募", "Recruitment competent") },
        { value: "impaired", label: b("招募受限", "Recruitment impaired") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("动态染色质上的两个元件", "Two elements on dynamic chromatin"),
      description: b(
        "同一段染色质含增强子和启动子；核小体的八亚基组蛋白核心外缠绕 DNA 双链，连接区可弯曲；蛋白折叠与碱基细节均为结构示意。图中距离不按基因组碱基数或纳米比例绘制。",
        "The enhancer and promoter lie on one chromatin fiber. Duplex DNA wraps around eight-subunit histone cores and flexible linkers connect them; protein folds and base details are structural schematics. Distances are not scaled to genomic bases or nanometres.",
      ),
    },
    {
      at: 0.17,
      title: b("激活因子识别增强子", "Activators recognize the enhancer"),
      description: b(
        "序列特异性激活因子占据可接近的增强子位点。这里假定染色质已经允许结合，不展示先导因子与重塑的完整过程。",
        "Sequence-specific activators occupy accessible enhancer sites. Accessibility is assumed; pioneer-factor action and the full remodeling process are omitted.",
      ),
    },
    {
      at: 0.35,
      title: b("共激活因子与启动子装配", "Coactivators and promoter assembly"),
      description: b(
        "Mediator 类共激活因子帮助调控蛋白与 Pol II 机器协作。招募受限情景中，激活因子仍能结合，但共激活因子保持游离。",
        "Mediator-like coactivators help regulatory proteins cooperate with the Pol II machinery. With recruitment impaired, activators still bind but the coactivator remains unbound.",
      ),
    },
    {
      at: 0.53,
      title: b("靠近并非充分条件", "Proximity is not sufficient"),
      description: b(
        "空间轨迹在两种情景中相同。增强子与启动子更近，仍不代表瞬间发生转录；调控关系依赖位点、因子和时间尺度。",
        "Both scenarios have identical spatial trajectories. A shorter enhancer–promoter distance does not guarantee immediate transcription; regulation depends on locus, factors and timescale.",
      ),
    },
    {
      at: 0.66,
      title: b("一个示意转录脉冲", "An illustrative transcription burst"),
      description: b(
        "可招募情景中，启动子局部解链，Pol II 沿模板推进，RNA 的 3′ 端保持在活性中心并按 5′→3′ 延伸。脉冲时刻独立于距离曲线，不是由图中距离计算出的表达预测。",
        "In the competent scenario, DNA opens locally and Pol II advances along the template, retaining the growing RNA 3′ end at its active center. Burst timing is independent of the distance trajectory, not an expression prediction calculated from distance.",
      ),
    },
    {
      at: 0.8,
      title: b("停顿与再次启动", "An interval and another initiation episode"),
      description: b(
        "同一空间环境下可有转录间歇和再次启动；前一条 RNA 释放后保留，下一轮产生另一条 RNA。共激活因子受限示例在此窗口内没有脉冲，不表示细胞内所有基础转录均为零。",
        "Transcription can recur after an interval in the same spatial environment. The released first RNA remains while the next episode produces another RNA. No burst in the impaired observation window does not imply all basal transcription is zero.",
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
      title: "Rengachari et al. (2021) — Human Mediator–Pol II PIC",
      url: "https://www.nature.com/articles/s41586-021-03555-7",
    },
    {
      title:
        "Alexander et al. (2019) — Live-cell Sox2 enhancer proximity and transcription",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6534382/",
    },
    {
      title:
        "Li et al. (2020) — Genome topology and regulatory-factor clustering",
      url: "https://www.nature.com/articles/s41594-020-0493-6",
    },
    {
      title:
        "Zuin et al. (2022) — Nonlinear control through enhancer–promoter interactions",
      url: "https://www.nature.com/articles/s41586-022-04570-y",
    },
  ],
  create,
};
