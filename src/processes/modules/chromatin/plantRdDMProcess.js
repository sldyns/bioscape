import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";
import { dynamicTube, moveSegment, rightHandedDuplex } from "./geometry.js";
import {
  duplexDetails,
  nucleotideDetails,
  cleftComplex,
  alphaHelix,
} from "./structure.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  const dnaMat = k.material("#8099ac"),
    rnaMat = k.material("#b5946a"),
    complementMat = k.material("#d0b992");
  const enzymeMat = k.material("#99a99c"),
    agoMat = k.material("#a193b2"),
    methylMat = k.material("#c18f63");
  const targetIndex = 36;
  function dna(x, y, length, name, replace = false) {
    const duplex = rightHandedDuplex(
      (s, out) => out.set(x + length * s, y, 0),
      0.13,
      length * 5,
    );
    const count = Math.round(length * 17);
    const detail = duplexDetails(
      k,
      group,
      count,
      0.032,
      replace ? new Set([targetIndex]) : new Set(),
    );
    detail.update(duplex.sampleA, duplex.sampleB);
    detail.bases[0].name = `${name}-base-A`;
    detail.bases[1].name = `${name}-base-B`;
    detail.sugars.name = `${name}-sugars`;
    detail.phosphates.name = `${name}-phosphates`;
    for (let strand = 0; strand < 2; strand++) {
      const tube = dynamicTube(group, dnaMat, 200, 0.038);
      tube.mesh.name = `${name}-DNA-${strand === 0 ? "A" : "B"}`;
      tube.update(strand === 0 ? duplex.sampleA : duplex.sampleB);
    }
    return { duplex, count };
  }
  dna(-4.25, 2.0, 3.05, "source");
  const targetDNA = dna(0.2, -1.65, 4.15, "target", true);
  function protein(position, mat, scale = 0.5) {
    const root = new THREE.Group();
    root.position.set(...position);
    group.add(root);
    const body = cleftComplex(k, root, scale * 1.85, [
      `#${mat.color.getHexString()}`,
      "#c0c4bd",
    ]);
    body.name = "enzyme-subunits-and-nucleic-acid-binding-cleft";
    return root;
  }
  const polIV = protein([-3.5, 2.1, 0.1], enzymeMat, 0.42),
    rdr = protein([-2.8, 1.23, 0.03], k.material("#8ea79d"), 0.28);
  const polV = protein([3.35, -1.56, 0.12], enzymeMat, 0.38);
  const dcl = new THREE.Group();
  group.add(dcl);
  dcl.position.set(-0.7, 1.15, 0);
  const jaws = [];
  for (let i = 0; i < 2; i++) {
    const jaw = new THREE.Group();
    dcl.add(jaw);
    k.ball(
      [0, i === 0 ? 0.3 : -0.3, 0],
      [0.16, 0.37, 0.21],
      k.material("#8f9baa"),
      jaw,
    );
    const sign = i === 0 ? 1 : -1;
    for (let j = 0; j < 3; j++)
      alphaHelix(
        k,
        jaw,
        [-0.15, sign * (0.13 + j * 0.13), 0.17],
        [0.14, sign * (0.21 + j * 0.13), 0.17],
        0.033,
        k.material("#b2bcc8"),
        4,
      );
    k.ball(
      [0.025, sign * 0.09, 0.14],
      [0.047, 0.065, 0.07],
      k.material("#cbb588"),
      jaw,
    ).name = "DCL3-RNase-III-catalytic-tip";
    jaws.push(jaw);
  }
  k.tube(
    [
      [-0.15, -0.47, -0.08],
      [-0.33, -0.21, -0.16],
      [-0.33, 0.23, -0.16],
      [-0.12, 0.5, -0.08],
    ],
    0.055,
    k.material("#a7b2bd"),
    dcl,
    70,
  ).name = "DCL3-duplex-clamp";
  const ago = protein([0.9, 1.15, 0.03], agoMat, 0.56);
  ago.name = "AGO4-guide-binding-groove-PAZ-MID-PIWI-schematic";
  for (let i = 0; i < 4; i++)
    alphaHelix(
      k,
      ago,
      [-0.52 + i * 0.34, -0.26, 0.08],
      [-0.44 + i * 0.34, 0.04, 0.12],
      0.04,
      agoMat,
      4,
    );
  const guidePocket = k.ring(
    [0.56, -0.1, 0.13],
    0.115,
    0.022,
    k.material("#c8b297"),
    ago,
  );
  guidePocket.name = "AGO4-guide-end-binding-pocket";
  const drm = protein([2.4, -0.72, 0.18], k.material("#b79883"), 0.31);
  drm.name = "DRM2-target-recognition-and-methyltransferase-domains";
  k.ring([0, -0.24, 0.22], 0.1, 0.026, k.material("#d3b98a"), drm).name =
    "DRM2-cytosine-recognition-pocket";
  // Replace exactly one original A-strand base instance. Its sugar and
  // phosphate remain in the duplex; the same base pivots at that sugar.
  const baseA = new THREE.Vector3(),
    baseB = new THREE.Vector3();
  targetDNA.duplex.sampleA((targetIndex + 0.5) / targetDNA.count, baseA);
  targetDNA.duplex.sampleB((targetIndex + 0.5) / targetDNA.count, baseB);
  const baseMiddle = baseA.clone().add(baseB).multiplyScalar(0.5);
  const cytosine = new THREE.Group();
  cytosine.position.copy(baseA).lerp(baseMiddle, 0.23);
  group.add(cytosine);
  cytosine.name = "target-cytosine-glycosidic-pivot";
  const baseOrientation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    baseMiddle.clone().sub(baseA).normalize(),
  );
  const flipRotation = new THREE.Quaternion(),
    genomicAxis = new THREE.Vector3(1, 0, 0);
  k.segment(
    [0, 0, 0],
    [0, 0.027, 0],
    0.012,
    k.material("#b8c4ce"),
    cytosine,
  ).name = "cytosine-glycosidic-bond";
  const base = k.mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.018, 6),
    k.material("#b6c4d3"),
    [0, 0.047, 0],
    cytosine,
  );
  base.rotation.x = Math.PI / 2;
  base.name = "single-target-cytosine-ring";
  const methylGroup = new THREE.Group();
  methylGroup.name = "cytosine-C5-methyl-group";
  cytosine.add(methylGroup);
  k.segment(
    [0.0433, 0.072, 0],
    [0.079, 0.093, 0],
    0.01,
    methylMat,
    methylGroup,
  ).name = "C5-methyl-bond";
  const writtenMethyl = k.ball(
    [0.087, 0.097, 0],
    0.025,
    methylMat,
    methylGroup,
  );
  writtenMethyl.name = "C5-methyl-carbon";
  const fullFlip = new THREE.Quaternion().setFromAxisAngle(genomicAxis, 2.35);
  const engagedBase = new THREE.Vector3(0, 0.047, 0)
    .applyQuaternion(fullFlip)
    .applyQuaternion(baseOrientation)
    .add(cytosine.position);
  // The drawn recognition pocket meets the same flipped base, not a spare marker.
  const dockedDRM = engagedBase.clone().sub(new THREE.Vector3(0, -0.24, 0.22));
  const rnaDetails = Array.from({ length: 4 }, () =>
    nucleotideDetails(k, group, 24, "#d6be92", 0.029),
  );
  const scaffoldDetails = nucleotideDetails(k, group, 34, "#d6bb8d", 0.03);
  const rails = [];
  for (let fragment = 0; fragment < 2; fragment++)
    for (let strand = 0; strand < 2; strand++)
      rails.push(
        dynamicTube(group, strand === 0 ? rnaMat : complementMat, 75, 0.035),
      );
  const basePairs = [];
  for (let i = 0; i < 48; i++)
    basePairs.push(k.mesh(k.cylinder, k.material("#c7b998")));
  const scaffold = dynamicTube(group, rnaMat, 110, 0.04);
  const matchBars = [];
  for (let i = 0; i < 24; i++)
    matchBars.push(k.mesh(k.cylinder, k.material("#beb090")));
  let p = 0;
  const fragmentSample = (s, out, fragment, strand) => {
    const cut = ease(p, 0.34, 0.43),
      load = ease(p, 0.43, 0.56),
      dock = ease(p, 0.57, 0.76);
    const start = fragment === 0 ? -2.4 : -0.78;
    let x = start + 1.62 * s + (fragment === 0 ? -0.18 : 0.2) * cut,
      y = 1.15 + (strand === 0 ? 0.11 : -0.11),
      z = 0.05 * Math.sin(s * Math.PI * 4);
    if (fragment === 1) {
      const centerX = (0.03 + 0.2 * cut) * (1 - dock) + 2.01 * dock;
      const centerY =
        (1.15 + (strand === 0 ? 0.11 : -0.11)) * (1 - dock) +
        (strand === 0 ? -0.68 : 0.2) * dock;
      x = centerX + 1.62 * (s - 0.5) * Math.cos(Math.PI * dock);
      y =
        centerY +
        1.62 * (s - 0.5) * Math.sin(Math.PI * dock) +
        (strand === 1 ? 0.65 * load : 0);
    }
    return out.set(x, y, z + 0.12);
  };
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    scratch = new THREE.Vector3();
  const labels = [
    k.label(
      [-3.38, 2.75, 0.1],
      "Pol IV · 来源位点",
      "Pol IV · source locus",
      9,
    ),
    k.label(
      [-2.85, 0.4, 0.1],
      "RDR2 · 双链 RNA",
      "RDR2 · double-stranded RNA",
      7,
    ),
    k.label([-0.7, 2.1, 0.1], "DCL3 · 切割", "DCL3 · cleavage", 8),
    k.label([0.9, 2.3, 0.1], "AGO4 · 24 nt 引导链", "AGO4 · 24-nt guide", 10),
    k.label([3.6, -0.8, 0.1], "Pol V", "Pol V", 7),
    k.label(
      [2.1, -2.52, 0.1],
      "靶 DNA · 胞嘧啶甲基化",
      "Target DNA · cytosine methylation",
      10,
    ),
    k.label([2.1, -0.9, 0.25], "支架 RNA 5′ → 3′", "Scaffold RNA 5′ → 3′", 6),
    k.label(
      [-2.9, -1.62, 0],
      "拟南芥细胞核 · 经典 RdDM",
      "Arabidopsis nucleus · canonical RdDM",
      2,
    ),
    k.label([2.5, -0.08, 0.2], "DRM2", "DRM2", 7),
  ];
  function update(value, parameters = {}) {
    p = clamp(value);
    const active = parameters.drm2 !== "inactive";
    const pol = ease(p, 0.02, 0.16),
      ds = ease(p, 0.13, 0.29),
      cut = ease(p, 0.34, 0.43),
      load = ease(p, 0.43, 0.56),
      dock = ease(p, 0.57, 0.76),
      recruit = ease(p, 0.74, 0.84);
    polIV.position.x = -3.5 + 0.55 * pol;
    rdr.position.x = 0.84 - 3.24 * ds;
    rdr.position.y = 0.73;
    jaws[0].rotation.z = 0.35 * (1 - cut);
    jaws[1].rotation.z = -0.35 * (1 - cut);
    dcl.position.z = 0.55 * ease(p, 0.43, 0.52);
    for (let f = 0; f < 2; f++)
      for (let s = 0; s < 2; s++) {
        const rail = rails[f * 2 + s];
        rail.update((t, out) => fragmentSample(t, out, f, s));
        const growth = s === 0 ? pol : ds;
        rail.mesh.visible = growth > 0 && !(f === 1 && s === 1 && load > 0.98);
        const portion = clamp(growth * 2 - (s === 0 ? f : 1 - f));
        rnaDetails[f * 2 + s].root.visible = rail.mesh.visible;
        rnaDetails[f * 2 + s].update(
          (t, out) => fragmentSample(t, out, f, s),
          portion,
          s === 1,
          s === 0 ? -1 : 1,
        );
        const count = Math.floor(portion * 75) * 8 * 6;
        rail.mesh.geometry.setDrawRange(
          s === 0 ? 0 : 75 * 8 * 6 - count,
          count,
        );
      }
    for (let i = 0; i < 48; i++) {
      const f = i < 24 ? 0 : 1,
        s = (i % 24) / 23;
      fragmentSample(s, a, f, 0);
      fragmentSample(s, b, f, 1);
      moveSegment(basePairs[i], a, b, 0.012, scratch);
      basePairs[i].visible = ds > (47 - i) / 48 && !(f === 1 && load > 0.08);
    }
    ago.position.set(0.23 + 1.78 * dock, 1.16 - 1.6 * dock, 0.1);
    ago.visible = p > 0.39;
    ago.scale.set(1, 0.78, 1);
    const scaffoldGrowth = ease(p, 0.45, 0.63);
    scaffold.mesh.visible = scaffoldGrowth > 0;
    scaffold.update((s, out) =>
      out.set(
        3.4 - 2.36 * scaffoldGrowth * (1 - s),
        -0.96 + 0.06 * Math.sin(s * 8) * (1 - dock),
        0.17,
      ),
    );
    scaffoldDetails.root.visible = scaffoldGrowth > 0;
    scaffoldDetails.update(
      (s, out) =>
        out.set(
          3.4 - 2.36 * scaffoldGrowth * (1 - s),
          -0.96 + 0.06 * Math.sin(s * 8) * (1 - dock),
          0.17,
        ),
      1,
      false,
      1,
    );
    for (let i = 0; i < 24; i++) {
      const x = 1.2 + (1.62 * i) / 23;
      a.set(x, -0.68, 0.17);
      b.set(x, -0.96, 0.17);
      moveSegment(matchBars[i], a, b, 0.012, scratch);
      matchBars[i].visible = dock > 0.98;
    }
    drm.position.set(2.65, -0.25, 0.26).lerp(dockedDRM, recruit);
    drm.visible = p > 0.72;
    const baseFlip = ease(p, 0.77, 0.86) * (1 - ease(p, 0.93, 1));
    flipRotation.setFromAxisAngle(genomicAxis, baseFlip * 2.35);
    cytosine.quaternion.copy(baseOrientation).multiply(flipRotation);
    methylGroup.visible = active && p > 0.89;
    const markCount = methylGroup.visible ? 1 : 0;
    labels[3].position[0] = ago.position.x;
    labels[3].position[1] = ago.position.y + 0.8;
    labels[3].active = p > 0.39;
    labels[6].active = p > 0.53;
    labels[8].active = p > 0.72;
    labels[8].text = active
      ? B("DRM2 · 写入甲基标记", "DRM2 · deposits methyl marks")
      : B("DRM2 催化失活", "DRM2 catalytically inactive");
    labels[5].text = active
      ? B("靶 DNA · 新增胞嘧啶甲基化", "Target DNA · new cytosine methylation")
      : B("靶 DNA · 未写入新的甲基标记", "Target DNA · no new methyl marks");
    Object.assign(group.userData, {
      process: "plantRdDM",
      species: "Arabidopsis thaliana",
      branch: "canonical Pol IV/RDR2-DCL3-AGO4/Pol V-DRM2",
      condition: active ? "active" : "inactive",
      guideLengthNt: 24,
      guideScaffoldOrientation: "antiparallel",
      dsRNAGenerated: ds > 0.99,
      guideLoaded: load > 0.99,
      scaffoldPaired: dock > 0.98,
      drm2Recruited: recruit > 0.99,
      newMethylMarks: markCount,
      methylationTarget: "DNA cytosine",
      sequenceChanged: false,
      globalMethylationAbolished: false,
      targetBaseFlip: baseFlip,
      visualDetail:
        "enzyme clefts/alpha helices, duplex sugar-phosphate/base plates, AGO4 guide groove, DRM2 base flipping",
    });
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 1, 13.7], target: [0, 0.1, 0] },
  };
}
export default {
  id: "plantRdDM",
  title: B("RNA 引导的 DNA 甲基化", "RNA-directed DNA methylation"),
  duration: 38,
  intro: B(
    "拟南芥细胞核中经典 RdDM 分支的简化示意：Pol IV 与 RDR2 产生双链 RNA，经 DCL3 加工后，AGO4 所携带的 24 nt 引导链与 Pol V 转录本配对，帮助定位 DRM2。控制只改变 DRM2 催化活性；非经典 RdDM 和甲基化维持途径未展示。",
    "A simplified canonical RdDM branch in the Arabidopsis nucleus: Pol IV and RDR2 produce double-stranded RNA; after DCL3 processing, an AGO4-bound 24-nt guide pairs with a Pol V transcript to help target DRM2. The control changes DRM2 catalysis only. Noncanonical RdDM and maintenance methylation pathways are not shown.",
  ),
  controls: [
    {
      id: "drm2",
      label: B("DRM2 催化活性", "DRM2 catalytic activity"),
      default: "active",
      options: [
        { value: "active", label: B("正常催化", "Active catalysis") },
        { value: "inactive", label: B("催化失活", "Catalytically inactive") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("Pol IV 产生前体 RNA", "Pol IV produces precursor RNA"),
      description: B(
        "在可被该途径识别的来源位点，Pol IV 转录 DNA。这里将来源和靶区分开展示以便阅读；它们可以属于同一基因组区域。所有 RNA 合成均为 5′→3′。",
        "Pol IV transcribes DNA at a locus engaged by this pathway. Source and target regions are separated for readability; they can belong to the same genomic region. All RNA synthesis proceeds 5′→3′.",
      ),
    },
    {
      at: 0.16,
      title: B("RDR2 合成互补链", "RDR2 makes the complementary strand"),
      description: B(
        "与 Pol IV 协作的 RNA 依赖性 RNA 聚合酶 RDR2 合成互补链，形成反向平行的双链 RNA 前体。上方短条表示配对的 RNA，而不是新 DNA。",
        "RNA-dependent RNA polymerase RDR2 cooperates with Pol IV to make the complementary strand of an antiparallel dsRNA precursor. Upper rungs represent paired RNA, not newly synthesized DNA.",
      ),
    },
    {
      at: 0.33,
      title: B("DCL3 加工小 RNA", "DCL3 processes small RNAs"),
      description: B(
        "DCL3 切割双链前体。图中追踪一条代表性的 24 nt 引导链；真实加工可产生不同末端和伴随链长度，并不总是整齐的等长双链。",
        "DCL3 cleaves the duplex precursor. The model follows one representative 24-nt guide; actual products have varying ends and passenger-strand lengths, rather than uniformly identical duplexes.",
      ),
    },
    {
      at: 0.46,
      title: B("AGO4 装载，引导链保留", "AGO4 loading retains a guide"),
      description: B(
        "AGO4 装载小 RNA，保留引导链而移除伴随链。装载与运输细节被省略；图中空间布局不用于断言所有生物发生步骤都发生在同一个核内位置。",
        "AGO4 loads a small RNA and retains its guide while the passenger strand is removed. Loading and trafficking details are omitted; spatial layout does not assign all biogenesis steps to one nuclear location.",
      ),
    },
    {
      at: 0.61,
      title: B(
        "识别 Pol V 支架转录本",
        "Recognition of a Pol V scaffold transcript",
      ),
      description: B(
        "AGO4 引导链与 Pol V 产生的互补支架 RNA 反向平行配对，并与其他蛋白相互作用，共同帮助招募 DRM2；不是小 RNA 直接给 DNA 加上甲基。",
        "The AGO4 guide pairs antiparallel with complementary Pol V scaffold RNA and works with protein interactions to recruit DRM2. The small RNA itself does not directly methylate DNA.",
      ),
    },
    {
      at: 0.82,
      title: B("DRM2 改写 DNA 化学标记", "DRM2 modifies DNA chemical marks"),
      description: B(
        "有活性的 DRM2 在靶 DNA 胞嘧啶上催化从头甲基化，可涉及 CG、CHG 和 CHH。双链中的同一个胞嘧啶绕糖苷连接翻出，进入催化槽；新甲基连接碱基的 C5 位点，骨架保持连接。环与化学键均为几何示意。催化失活时上游 RNA 配对仍可发生，但图示新增甲基标记消失；这不意味着全基因组既有甲基化被清除。",
        "Active DRM2 catalyzes de novo cytosine methylation at target DNA in CG, CHG, and CHH contexts. The same cytosine in the duplex pivots at its glycosidic attachment into the catalytic cleft; the new methyl group attaches at base C5 while the backbone stays connected. Rings and bonds are geometric schematics. With catalytically inactive DRM2, upstream pairing still occurs but the illustrated new marks are absent. Existing genome-wide methylation is not thereby erased.",
      ),
    },
    {
      at: 0.95,
      title: B(
        "沉默倾向，不更改序列",
        "Silencing tendencies without sequence change",
      ),
      description: B(
        "RdDM 参与转座元件等位点的转录沉默。甲基标记改变 DNA 的化学状态而非碱基序列；这里不显示虚构的表达倍数，也不覆盖所有植物甲基化途径。",
        "RdDM contributes to transcriptional silencing at loci such as transposable elements. Methyl marks alter DNA chemistry rather than base sequence. No expression fold changes are inferred, and the scene does not cover all plant methylation pathways.",
      ),
    },
  ],
  create,
  sources: [
    {
      title:
        "Fang et al. (2021), Substrate deformation regulates DRM2-mediated DNA methylation",
      url: "https://pubmed.ncbi.nlm.nih.gov/34078593/",
    },
    {
      title:
        "Singh et al. (2019), Reaction mechanisms of Pol IV, RDR2, and DCL3",
      url: "https://pubmed.ncbi.nlm.nih.gov/31398324/",
    },
    {
      title:
        "Co-targeting RNA polymerases IV and V promotes efficient de novo DNA methylation in Arabidopsis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6386582/",
    },
    {
      title:
        "Identification of Pol IV and RDR2-dependent precursors of 24-nt siRNAs in Arabidopsis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4716838/",
    },
  ],
};
