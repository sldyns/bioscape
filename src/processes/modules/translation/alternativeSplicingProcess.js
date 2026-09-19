import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { articulatedChain } from "./mechanics.js";
import {
  cutawayLobe,
  helix,
  sheet,
  rnaStem,
  rnaBaseDetails,
} from "./molecularDetails.js";

function create({ rootId = "cell" } = {}) {
  const k = sceneKit(),
    { group } = k;
  const exonMats = ["#6e9f98", "#c7a16b", "#a18db4"].map((c) => k.material(c));
  const intronMat = k.material("#bac5c6");
  const chain = articulatedChain(k, 81, 0.071, intronMat);
  const updateRnaDetails = rnaBaseDetails(k, chain);
  const sections = [
    [0, 15],
    [16, 31],
    [32, 48],
    [49, 64],
    [65, 80],
  ];
  const initial = chain.points.map(
    (_, i) => new THREE.Vector3(-4 + i * 0.1, 0, 0.1),
  );
  for (let e = 0; e < 3; e++)
    for (let i = sections[e * 2][0]; i <= sections[e * 2][1]; i++) {
      chain.beads[i].material = exonMats[e];
      chain.beads[i].scale.setScalar(0.093);
      if (i < 80) chain.links[i].material = exonMats[e];
    }
  const splicers = Array.from({ length: 2 }, () => {
    const g = new THREE.Group();
    group.add(g);
    const body = k.material("#93a8b9", { side: THREE.DoubleSide });
    // Open Prp8/U5 scaffold exposes the RNA-binding catalytic cleft.
    cutawayLobe(k, g, [-0.48, 0.16, -0.26], [0.52, 0.67, 0.54], body, 1);
    cutawayLobe(k, g, [0.44, 0.19, -0.3], [0.51, 0.63, 0.53], body, 2);
    cutawayLobe(
      k,
      g,
      [0, -0.45, -0.26],
      [0.62, 0.31, 0.42],
      k.material("#adbdc8", { side: THREE.DoubleSide }),
    );
    for (const side of [-1, 1]) {
      sheet(
        k,
        g,
        [side * 0.53, 0.15, 0.04],
        0.34,
        0.53,
        3,
        k.material("#718b9f", { side: THREE.DoubleSide }),
      );
      helix(
        k,
        g,
        [side * 0.78, -0.15, 0.02],
        [side * 0.65, 0.49, 0.05],
        0.075,
        3.2,
        k.material("#b7c7ce"),
        0.029,
      );
    }
    const snrna = k.material("#647e9b");
    rnaStem(k, g, [-0.29, 0.11, 0.14], [-0.48, 0.79, 0.14], 0.065, 1.8, snrna);
    rnaStem(k, g, [0.32, 0.06, 0.13], [0.54, 0.64, 0.12], 0.062, 1.7, snrna);
    // U2/U6 RNA helices and the U5 exon-positioning loop are exposed at the opening.
    k.tube(
      [
        [-0.22, 0.12, 0.18],
        [-0.15, -0.08, 0.25],
        [0, -0.18, 0.24],
        [0.22, 0.05, 0.22],
      ],
      0.031,
      snrna,
      g,
      40,
    );
    k.tube(
      [
        [-0.09, -0.21, 0.25],
        [-0.22, -0.37, 0.29],
        [0.11, -0.43, 0.3],
        [0.25, -0.2, 0.26],
      ],
      0.031,
      snrna,
      g,
      36,
    );
    for (const x of [-0.075, 0.075])
      k.ball([x, -0.04, 0.22], 0.035, k.material("#bfc299"), g);
    // A small seven-membered Sm protein ring supports a snRNA stem loop.
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      k.ball(
        [0.14 + 0.26 * Math.cos(a), 0.93 + 0.22 * Math.sin(a), -0.12],
        [0.11, 0.1, 0.1],
        k.material(i % 2 ? "#b5bdbb" : "#8ca8b1"),
        g,
      );
    }
    rnaStem(k, g, [0.15, 0.95, -0.09], [0.39, 1.31, -0.12], 0.046, 1.3, snrna);
    return g;
  });
  const branchNodes = [
    k.ball([0, 0, 0], 0.14, k.material("#cc9476")),
    k.ball([0, 0, 0], 0.14, k.material("#cc9476")),
  ];
  const branchLinks = [
    k.segment([0, 0, 0], [0.1, 0, 0], 0.03, k.material("#cc9476")),
    k.segment([0, 0, 0], [0.1, 0, 0], 0.03, k.material("#cc9476")),
  ];
  const junctions = [
    k.ball([0, 0, 0], 0.103, k.material("#72998b")),
    k.ball([0, 0, 0], 0.103, k.material("#72998b")),
  ];
  const joinLinks = [
    k.segment([0, 0, 0], [0.1, 0, 0], 0.053, exonMats[0]),
    k.segment([0, 0, 0], [0.1, 0, 0], 0.053, exonMats[2]),
  ];
  const dir = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0),
    target = new THREE.Vector3();
  const labels = [
    k.label([-3.25, -0.55, 0.4], "外显子 6", "Exon 6", 2),
    k.label([0, -0.55, 0.4], "外显子 7", "Exon 7", 2),
    k.label([3.3, -0.55, 0.4], "外显子 8", "Exon 8", 2),
    k.label([-1.5, 0.55, 0.3], "内含子 6", "Intron 6", 1),
    k.label([1.55, 0.55, 0.3], "内含子 7", "Intron 7", 1),
    k.label(
      [0, 2.7, 0.3],
      "剪接体 · RNA 与蛋白复合体",
      "Spliceosome · RNA–protein complex",
      1,
    ),
    k.label(
      [-0.1, 1.6, 0.6],
      "分支点 A · 2′–5′ 键",
      "Branch A · 2′–5′ linkage",
      2,
    ),
    k.label([0, -1.15, 0.3], "成熟 RNA：6–7–8", "Mature RNA: 6–7–8", 2),
    k.label([-4.25, 0, 0.25], "5′", "5′", 2),
    k.label([4.25, 0, 0.25], "3′", "3′", 2),
    k.label([0, 3.1, 0], "人类 SMN2 · 细胞核", "Human SMN2 · nucleus", 1),
  ];
  function lariat(out, t, cx, cy, r) {
    if (t <= 0.8) {
      const angle = -Math.PI / 2 + (2 * Math.PI * t) / 0.8;
      out.set(
        cx + r * Math.cos(angle),
        cy + r * Math.sin(angle),
        0.1 + 0.1 * Math.sin(angle * 2),
      );
    } else {
      const u = (t - 0.8) / 0.2;
      out.set(cx + 0.65 * u, cy - r - 0.4 * u, 0.1);
    }
  }
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      skip = parameters.isoform === "skip",
      loop = ease(p, 0.24, 0.49),
      ligate = ease(p, 0.55, 0.73),
      depart = ease(p, 0.75, 0.94),
      assemble = ease(p, 0.05, 0.22);
    for (let i = 0; i < 81; i++) {
      let isExcised = false;
      if (i <= 15) {
        const t = i / 15;
        target.set((skip ? -1.65 : -2.35) + t * 1.5, -0.75, 0.1);
        chain.points[i].copy(initial[i]).lerp(target, ligate);
      } else if (i >= 65) {
        const t = (i - 65) / 15;
        target.set((skip ? 0.15 : 0.85) + t * 1.5, -0.75, 0.1);
        chain.points[i].copy(initial[i]).lerp(target, ligate);
      } else if (skip) {
        lariat(target, (i - 16) / 48, 0, 1.45 + depart * 0.6, 1.1);
        isExcised = true;
      } else if (i >= 32 && i <= 48) {
        const t = (i - 32) / 16;
        target.set(-0.75 + 1.5 * t, -0.75, 0.1);
        chain.points[i].copy(initial[i]).lerp(target, ligate);
      } else if (i < 32) {
        lariat(target, (i - 16) / 15, -1.5, 1.2 + depart * 0.65, 0.66);
        isExcised = true;
      } else {
        lariat(target, (i - 49) / 15, 1.5, 1.2 + depart * 0.65, 0.66);
        isExcised = true;
      }
      if (isExcised) chain.points[i].copy(initial[i]).lerp(target, loop);
    }
    chain.commit();
    updateRnaDetails();
    // Break the donor connection first, then the acceptor; join retained exons.
    for (const link of chain.links) link.visible = true;
    chain.links[15].visible = p < 0.34;
    chain.links[64].visible = p < 0.59;
    if (!skip) {
      chain.links[31].visible = p < 0.59;
      chain.links[48].visible = p < 0.34;
    }
    const pairs = skip
      ? [[15, 65]]
      : [
          [15, 32],
          [48, 65],
        ];
    for (let j = 0; j < 2; j++) {
      const on = j < pairs.length && p >= 0.59;
      joinLinks[j].visible = on;
      junctions[j].visible = on;
      if (j < pairs.length) {
        const [a, c] = pairs[j];
        dir.subVectors(chain.points[c], chain.points[a]);
        joinLinks[j].position
          .copy(chain.points[a])
          .add(chain.points[c])
          .multiplyScalar(0.5);
        joinLinks[j].scale.set(0.053, Math.max(0.0001, dir.length()), 0.053);
        joinLinks[j].quaternion.setFromUnitVectors(up, dir.normalize());
        junctions[j].position.copy(joinLinks[j].position);
      }
      splicers[j].visible = (!skip || j === 0) && p < 0.9;
      splicers[j].position.set(
        skip ? 0 : j === 0 ? -1.5 : 1.5,
        (1 - assemble) * 1.1 - depart * 0.7,
        -0.23,
      );
      splicers[j].scale.setScalar((skip ? 1.38 : 1) * (1 - 0.2 * depart));
      branchNodes[j].visible = loop > 0.4 && (!skip || j === 0);
      const bi = skip ? 54 : j === 0 ? 28 : 61;
      branchNodes[j].position.copy(chain.points[bi]);
      const start = skip ? 16 : j === 0 ? 16 : 49;
      branchLinks[j].visible = branchNodes[j].visible;
      dir.subVectors(chain.points[bi], chain.points[start]);
      branchLinks[j].position
        .copy(chain.points[bi])
        .add(chain.points[start])
        .multiplyScalar(0.5);
      branchLinks[j].scale.set(0.03, Math.max(0.0001, dir.length()), 0.03);
      branchLinks[j].quaternion.setFromUnitVectors(up, dir.normalize());
    }
    labels[0].position[0] = -3.25 + (skip ? 2.35 : 1.65) * ligate;
    labels[0].position[1] = -0.55 - 0.75 * ligate;
    labels[1].position[1] = skip
      ? 2.55 * loop + 0.6 * depart
      : -0.55 - 0.75 * ligate;
    labels[2].position[0] = 3.3 - (skip ? 2.35 : 1.65) * ligate;
    labels[2].position[1] = -0.55 - 0.75 * ligate;
    labels[3].active = p < 0.35 && !skip;
    labels[4].active = p < 0.35 && !skip;
    labels[5].active = p < 0.82;
    labels[6].active = loop > 0.5;
    labels[6].position[0] = skip ? 0 : -1.5;
    labels[6].position[1] = 0.25 + 0.6 * depart;
    labels[7].active = p > 0.76;
    labels[7].position[1] = -1.8;
    labels[7].text.zh = skip ? "成熟 RNA：6–8（Δ7）" : "成熟 RNA：6–7–8";
    labels[7].text.en = skip ? "Mature RNA: 6–8 (Δ7)" : "Mature RNA: 6–7–8";
    labels[8].position[0] = chain.points[0].x - 0.25;
    labels[8].position[1] = chain.points[0].y;
    labels[9].position[0] = chain.points[80].x + 0.25;
    labels[9].position[1] = chain.points[80].y;
    group.userData = {
      process: "alternativeSplicing",
      rootId,
      species: "Homo sapiens",
      gene: "SMN2",
      compartment: "nucleus",
      condition: skip ? "exon7-skipping" : "exon7-inclusion",
      retainedExons: skip ? [6, 8] : [6, 7, 8],
      excisedExon7: skip && depart > 0.8,
      ligationCompleted: ligate === 1,
      proteinFunctionGuaranteed: false,
      structuralDetail:
        "open spliceosomal cleft, U2/U6 RNA helices, U5 loop, Sm ring and nucleotide backbones",
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 1.8, 11], target: [0, 0.55, 0] },
  };
}
export default {
  id: "alternativeSplicing",
  title: b("可变剪接：SMN2", "Alternative splicing: SMN2"),
  duration: 32,
  intro: b(
    "以人类细胞核中的 SMN2 前体 RNA 为例，比较第 7 外显子的保留与跳跃。仅放大外显子 6–8，长度与装配时序作示意。输出为不同 RNA，不把每种剪接产物都视为功能正常的蛋白。",
    "Compare inclusion and skipping of exon 7 in human nuclear SMN2 pre-mRNA. Only exons 6–8 are enlarged; lengths and assembly timing are schematic. The outputs are different RNAs, not a promise that every isoform produces a functional protein.",
  ),
  controls: [
    {
      id: "isoform",
      label: b("剪接结果", "Splicing outcome"),
      default: "include",
      options: [
        { value: "include", label: b("保留外显子 7", "Include exon 7") },
        { value: "skip", label: b("跳跃外显子 7", "Skip exon 7") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("同一段前体 RNA", "The same precursor RNA"),
      description: b(
        "外显子 6、7、8 由内含子连接。SMN2 的顺式调控序列与结合因子共同影响外显子 7 的识别；此处直接比较两种已选定路径。",
        "Introns connect exons 6, 7 and 8. SMN2 cis-regulatory sequences and associated factors influence exon-7 recognition; the control compares two selected pathways.",
      ),
    },
    {
      at: 0.17,
      title: b("选择配对的剪接位点", "Pair the splice sites"),
      description: b(
        "保留路径分别配对两段内含子的边界。跳跃路径则配对外显子 6 后的供体位点与外显子 8 前的受体位点，把外显子 7 包含在待移除区域中。",
        "Inclusion pairs the boundaries of each intron. Skipping pairs the donor after exon 6 with the acceptor before exon 8, including exon 7 in the region to be removed.",
      ),
    },
    {
      at: 0.34,
      title: b("分支点形成套索", "Branch-point attack forms a lariat"),
      description: b(
        "分支腺苷的 2′-OH 参与第一步转酯反应，连接内含子 5′ 端并释放上游外显子末端。图中的套索是真正具有分支的 RNA，不是单纯环形 RNA。",
        "The branch adenosine 2′-OH participates in the first transesterification, joining the intron 5′ end while freeing the upstream exon end. The lariat is branched RNA, not simply a circular RNA.",
      ),
    },
    {
      at: 0.57,
      title: b("连接保留的外显子", "Ligate the retained exons"),
      description: b(
        "第二步转酯反应连接保留外显子，并释放套索。保留路径显示两个剪接事件的压缩视图；两事件不必真实同步发生。",
        "A second transesterification joins retained exons and releases a lariat. The inclusion route compresses two splice events into one view; they need not occur synchronously in vivo.",
      ),
    },
    {
      at: 0.77,
      title: b("不同 RNA，不同后果", "Distinct RNAs, distinct consequences"),
      description: b(
        "保留得到 6–7–8 连接，跳跃得到 6–8 连接。跳跃对应的 SMNΔ7 蛋白较不稳定且功能受损；不能从 RNA 多样性直接推断功能蛋白多样性。",
        "Inclusion yields a 6–7–8 junction pattern; skipping yields 6–8. The corresponding SMNΔ7 protein is less stable and functionally impaired, so RNA diversity does not automatically imply functional protein diversity.",
      ),
    },
    {
      at: 0.92,
      title: b("套索待解分支与降解", "Lariats proceed to turnover"),
      description: b(
        "被移除的区域离开剪接体；其后通常解分支并降解。画面停留在剪接完成时，不显示蛋白翻译或后续 RNA 质量控制。",
        "Excised regions leave the spliceosome and normally undergo debranching and degradation. The scene stops after splicing, before translation or downstream RNA quality control.",
      ),
    },
  ],
  legend: [
    { color: "#6e9f98", text: b("外显子 6", "Exon 6") },
    { color: "#c7a16b", text: b("可选外显子 7", "Alternative exon 7") },
    { color: "#a18db4", text: b("外显子 8", "Exon 8") },
    { color: "#bac5c6", text: b("内含子", "Introns") },
    { color: "#91abc0", text: b("剪接体剖视", "Spliceosome cutaway") },
  ],
  sources: [
    {
      title:
        "Lorson et al. · A single nucleotide in the SMN gene regulates splicing",
      url: "https://pubmed.ncbi.nlm.nih.gov/10339583/",
    },
    {
      title:
        "Mechanism of Splicing Regulation of Spinal Muscular Atrophy Genes",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6026014/",
    },
    {
      title: "RNA Splicing by the Spliceosome",
      url: "https://pubmed.ncbi.nlm.nih.gov/31794245/",
    },
    {
      title: "NCBI Bookshelf · RNA Processing and Turnover",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9864/",
    },
  ],
  create,
};
