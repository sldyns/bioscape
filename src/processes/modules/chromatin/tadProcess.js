import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";
import { dynamicTube, moveSegment, rightHandedDuplex } from "./geometry.js";
import { duplexDetails, alphaHelix, cleftComplex } from "./structure.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  const fiberMat = k.material("#8b9fad"),
    ctcfMat = k.material("#738f86"),
    cohesinMat = k.material("#ba9476");
  const locusMat = k.material("#bb9e68"),
    contactMat = k.material("#c0af94", { transparent: true, opacity: 0.65 });
  const fiber = dynamicTube(group, fiberMat, 500, 0.025);
  const fiberPartner = dynamicTube(group, k.material("#b3c2c8"), 500, 0.025);
  const nucleotideDetail = duplexDetails(k, group, 150, 0.025);
  const cohesin = new THREE.Group();
  group.add(cohesin);
  cohesin.name = "cohesin-SMC-coiled-coils-hinge-ATPase-heads-kleisin";
  for (const side of [-1, 1]) {
    const mat = k.material(side < 0 ? "#b18d70" : "#c2a68a");
    alphaHelix(
      k,
      cohesin,
      [side * 0.07, -2.03, -0.03],
      [side * 0.56, -1.45, 0.0],
      0.043,
      mat,
      9,
    );
    alphaHelix(
      k,
      cohesin,
      [side * 0.56, -1.45, 0],
      [side * 0.25, -0.95, 0.06],
      0.043,
      mat,
      7,
    );
    k.ball([side * 0.25, -0.94, 0.07], [0.19, 0.16, 0.15], mat, cohesin);
    k.ring(
      [side * 0.25, -0.9, 0.2],
      0.075,
      0.018,
      k.material("#d2b878"),
      cohesin,
    );
  }
  k.ball([0, -2.06, 0], [0.16, 0.14, 0.13], cohesinMat, cohesin);
  k.tube(
    [
      [-0.3, -1.0, 0.13],
      [-0.52, -1.56, 0.18],
      [0, -2.24, 0.17],
      [0.55, -1.55, 0.18],
      [0.3, -1.0, 0.13],
    ],
    0.035,
    k.material("#9b826c"),
    cohesin,
    80,
  ).name = "kleisin-link";
  for (let i = 0; i < 7; i++)
    alphaHelix(
      k,
      cohesin,
      [0.68 + 0.06 * Math.cos(i), -1.8 + i * 0.14, 0],
      [0.88 + 0.06 * Math.cos(i), -1.77 + i * 0.14, 0.12],
      0.037,
      k.material("#92a197"),
      3,
    );
  const ctcf = [];
  for (let i = 0; i < 2; i++) {
    const root = new THREE.Group();
    group.add(root);
    k.ball([0, 0, 0], [0.19, 0.27, 0.19], ctcfMat, root);
    const arrow = k.mesh(
      new THREE.ConeGeometry(0.13, 0.34, 20),
      ctcfMat,
      [0, 0.46, 0],
      root,
    );
    k.segment([0, 0.18, 0], [0, 0.4, 0], 0.05, ctcfMat, root);
    root.name = "oriented-CTCF-zinc-finger-chain";
    for (let f = 0; f < 11; f++) {
      const y = (f - 5) * 0.045,
        x = 0.11 * Math.sin(f * 0.45);
      k.ball([x, y, 0.18], [0.055, 0.047, 0.05], ctcfMat, root);
      if (f % 2 === 0)
        alphaHelix(
          k,
          root,
          [x - 0.035, y - 0.04, 0.21],
          [x + 0.035, y + 0.04, 0.21],
          0.018,
          ctcfMat,
          2,
        );
    }
    ctcf.push(root);
  }
  const loci = [
    k.ball([0, 0, 0], 0.14, locusMat),
    k.ball([0, 0, 0], 0.14, locusMat),
  ];
  const rightSite = k.ring([0, 0, 0], 0.2, 0.032, k.material("#bdada1"));
  const contacts = [];
  for (let i = 0; i < 9; i++) contacts.push(k.mesh(k.cylinder, contactMat));
  // Genomic coordinates remain fixed while their spatial positions change.
  let left = 0.48,
    right = 0.52;
  // One material coordinate s carries 12 scene units of DNA at every time.
  // The circular major arc has fixed mouth spacing; solve its radius from
  // the genomic length assigned to the loop. The straight arms shorten by
  // exactly the material admitted through the two cohesin contact points.
  const contourLength = 12,
    halfMouth = 0.15;
  let loopRadius = 0.15,
    loopAngle = Math.PI,
    mouthAngle = Math.PI / 2;
  function updateLoop() {
    const length = contourLength * (right - left);
    let lo = halfMouth,
      hi = length / Math.PI + halfMouth;
    for (let i = 0; i < 48; i++) {
      const r = (lo + hi) / 2;
      const arc = r * (2 * Math.PI - 2 * Math.asin(halfMouth / r));
      if (arc < length) lo = r;
      else hi = r;
    }
    loopRadius = (lo + hi) / 2;
    mouthAngle = Math.asin(halfMouth / loopRadius);
    loopAngle = 2 * Math.PI - 2 * mouthAngle;
  }
  const sample = (s, out) => {
    if (s < left)
      return out.set(-halfMouth - contourLength * (left - s), -0.9, 0);
    if (s > right)
      return out.set(halfMouth + contourLength * (s - right), -0.9, 0);
    const t = (s - left) / (right - left);
    const angle = -Math.PI / 2 - mouthAngle - loopAngle * t;
    return out.set(
      loopRadius * Math.cos(angle),
      -0.9 +
        Math.sqrt(loopRadius * loopRadius - halfMouth * halfMouth) +
        loopRadius * Math.sin(angle),
      0,
    );
  };
  updateLoop();
  const duplex = rightHandedDuplex(sample, 0.06, 220);
  const { sampleA, sampleB } = duplex;
  fiber.mesh.name = "TAD-DNA-A";
  fiberPartner.mesh.name = "TAD-DNA-B";
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    v = new THREE.Vector3(),
    u = new THREE.Vector3(),
    scratch = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  const labels = [
    k.label(
      [0, 3.35, 0],
      "哺乳动物间期染色质",
      "Mammalian interphase chromatin",
      7,
    ),
    k.label([0, -2.64, 0], "黏连蛋白 · 环挤出", "Cohesin · loop extrusion", 10),
    k.label([-2, -0.15, 0], "CTCF →", "CTCF →", 9),
    k.label([2, -0.15, 0], "← CTCF", "← CTCF", 9),
    k.label(
      [0, 1, 0],
      "域内位点 · 接触机会",
      "Within-domain loci · contact opportunities",
      5,
    ),
    k.label(
      [3, -1.7, 0],
      "空间示意 · 非 Hi-C 重建",
      "Spatial schematic · not a Hi-C reconstruction",
      2,
    ),
  ];
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      condition = ["boundaryDeleted", "cohesinDepleted"].includes(
        parameters.condition,
      )
        ? parameters.condition
        : "normal";
    const depleted = condition === "cohesinDepleted",
      deleted = condition === "boundaryDeleted";
    const extrusion = depleted ? 0 : ease(p, 0.17, 0.72),
      extension = deleted ? ease(p, 0.68, 0.93) : 0;
    left = 0.48 - 0.25 * extrusion;
    right = 0.52 + 0.25 * extrusion + 0.15 * extension;
    updateLoop();
    duplex.update();
    fiber.update(sampleA);
    fiberPartner.update(sampleB);
    nucleotideDetail.update(sampleA, sampleB);
    cohesin.visible = !depleted;
    cohesin.position.y = -(1 - ease(p, 0.02, 0.15)) * 0.65;
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? 0.23 : 0.77;
      sample(s, a);
      sample(s + 0.001, b);
      v.subVectors(b, a)
        .normalize()
        .multiplyScalar(i === 0 ? 1 : -1);
      ctcf[i].position.copy(a);
      ctcf[i].quaternion.setFromUnitVectors(up, v);
      ctcf[i].visible = !(deleted && i === 1);
      labels[i + 2].position[0] = a.x + (i === 0 ? -0.55 : 0.55);
      labels[i + 2].position[1] = a.y + 0.7;
      labels[i + 2].position[2] = a.z;
    }
    labels[3].text = deleted
      ? B("右侧 CTCF 位点删除", "Right CTCF site deleted")
      : B("← CTCF", "← CTCF");
    sample(0.77, rightSite.position);
    rightSite.visible = deleted;
    sample(0.34, loci[0].position);
    sample(0.66, loci[1].position);
    a.copy(loci[0].position);
    b.copy(loci[1].position);
    const contactShown = !depleted && p > 0.6;
    for (let i = 0; i < contacts.length; i++) {
      v.copy(a).lerp(b, (i + 0.15) / contacts.length);
      u.copy(a).lerp(b, (i + 0.65) / contacts.length);
      moveSegment(contacts[i], v, u, 0.017, scratch);
      contacts[i].visible = contactShown;
    }
    labels[4].active = contactShown;
    labels[4].position[0] = (a.x + b.x) / 2;
    labels[4].position[1] = (a.y + b.y) / 2 + 0.4;
    labels[0].position[1] = Math.max(0.3, -0.9 + 2 * loopRadius) + 0.65;
    labels[1].text = depleted
      ? B(
          "黏连蛋白耗竭 · 无持续环挤出",
          "Cohesin depleted · no sustained extrusion",
        )
      : B("黏连蛋白 · 环挤出", "Cohesin · loop extrusion");
    Object.assign(group.userData, {
      process: "tad",
      condition,
      speciesScope: "mammalian interphase nucleus",
      leftGenomicAnchor: left,
      rightGenomicAnchor: right,
      loopSpan: right - left,
      ctcfOrientation: "convergent",
      rightBoundaryPresent: !deleted,
      cohesinPresent: !depleted,
      boundaryCrossed: right > 0.78,
      contactLinkIsSchematic: true,
      contactDistance: a.distanceTo(b),
      membraneBound: false,
      visualDetail:
        "SMC coiled-coils/hinge/ATPase heads/kleisin, CTCF fingers, DNA nucleotides",
      expressionPredicted: false,
    });
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 2.3, 16], target: [0, 0.65, 0] },
  };
}
export default {
  id: "tad",
  title: B("染色质环与 TAD", "Chromatin loops & TADs"),
  duration: 36,
  intro: B(
    "哺乳动物间期细胞核的简化环挤出模型：黏连蛋白扩大染色质环，相向的 CTCF 位点可限制挤出。比较正常、右边界删除与黏连蛋白耗竭。TAD 是统计上的接触域，没有膜；并非每个 TAD 都是一个固定环。",
    "A simplified loop-extrusion model in a mammalian interphase nucleus: cohesin enlarges chromatin loops, while convergent CTCF sites can constrain extrusion. Compare normal, right-boundary deletion, and cohesin depletion. TADs are statistical contact domains without membranes; not every TAD is a single stable loop.",
  ),
  controls: [
    {
      id: "condition",
      label: B("染色质条件", "Chromatin condition"),
      default: "normal",
      options: [
        {
          value: "normal",
          label: B("相向 CTCF 边界", "Convergent CTCF boundaries"),
        },
        {
          value: "boundaryDeleted",
          label: B("删除右侧边界", "Delete right boundary"),
        },
        {
          value: "cohesinDepleted",
          label: B("耗竭黏连蛋白", "Deplete cohesin"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("一条连续的染色质", "One continuous chromatin fiber"),
      description: B(
        "标记箭头表示两个 CTCF 结合位点沿基因组的相向取向。金色标记是沿同一染色体选取的两个位点，不代表基因表达读数。",
        "Arrows show convergent genomic orientations of two CTCF binding sites. Gold markers identify two loci on the same chromosome; they are not gene-expression readouts.",
      ),
    },
    {
      at: 0.16,
      title: B("黏连蛋白建立小环", "Cohesin establishes a small loop"),
      description: B(
        "有活性的黏连蛋白与装载因子 NIPBL–MAU2 可用 ATP 驱动环挤出；此处只简画环基部的复合物，未展示各亚基。耗竭对照不能持续挤出。",
        "Active cohesin with NIPBL–MAU2 can use ATP to extrude loops. The complex at the loop base is simplified; individual subunits are omitted. The depletion control cannot sustain extrusion.",
      ),
    },
    {
      at: 0.36,
      title: B(
        "更长的基因组区间进入环",
        "A larger genomic interval enters the loop",
      ),
      description: B(
        "DNA 从两侧进入不断扩大的环。序列上的位点随着染色质折叠改变空间位置，图中位置与动画时间均非实验标尺。",
        "DNA from both sides enters the expanding loop. Fixed sequence loci move in space as chromatin folds. Neither spatial coordinates nor animation time are experimental scales.",
      ),
    },
    {
      at: 0.62,
      title: B("取向相关的边界作用", "Orientation-dependent boundary action"),
      description: B(
        "正常情景中，相向 CTCF 限制两侧继续挤出。这是理想化的停驻：实际阻挡受 CTCF 占据、取向和 DNA 张力等因素影响，并非绝对墙壁。",
        "With intact convergent sites, CTCF constrains further extrusion on both sides. This is idealized stalling: real barriers depend on occupancy, orientation, and DNA tension, and are not absolute walls.",
      ),
    },
    {
      at: 0.78,
      title: B("边界删除改变环的范围", "Boundary deletion changes loop reach"),
      description: B(
        "删除右侧 CTCF 后，该侧可继续越过原边界；左侧保持限制。耗竭黏连蛋白则缺少挤出环，但不意味着所有其他染色质接触或 A/B 区室消失。",
        "After right-site deletion, extrusion can extend beyond that boundary while the left side remains constrained. Cohesin depletion removes the extruded loop, but does not abolish all other contacts or A/B compartmentalization.",
      ),
    },
    {
      at: 0.93,
      title: B("接触域是统计特征", "Contact domains are statistical"),
      description: B(
        "虚线仅标出域内位点的接触关系示意，不是测得的相互作用或 Hi-C 图重建。TAD 体现群体或时间平均的接触偏好；改变接触不必然激活或抑制某个基因。",
        "The dashed connector illustrates a possible within-domain contact relationship, not a measured interaction or reconstructed Hi-C map. TADs reflect contact preferences averaged over cells or time; changing contacts does not necessarily activate or repress a gene.",
      ),
    },
  ],
  create,
  sources: [
    {
      title: "Davidson et al. (2019), DNA loop extrusion by human cohesin",
      url: "https://pubmed.ncbi.nlm.nih.gov/31753851/",
    },
    {
      title: "Davidson et al. (2023), CTCF is a DNA-tension-dependent barrier",
      url: "https://www.nature.com/articles/s41586-023-05961-5",
    },
    {
      title: "Rao et al. (2017), Cohesin loss eliminates all loop domains",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5846482/",
    },
  ],
};
