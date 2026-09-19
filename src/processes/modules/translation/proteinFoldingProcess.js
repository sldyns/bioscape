import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { ribosomeAssembly } from "./ribosomeAssembly.js";
import { articulatedChain } from "./mechanics.js";
import {
  cutawayLobe,
  helix,
  sheet,
  peptideSidechains,
} from "./molecularDetails.js";

function create({ rootId = "cell" } = {}) {
  const k = sceneKit(),
    { group } = k;
  const chainMat = k.material("#bd9272"),
    hydrophobicMat = k.material("#c78758");
  const domainMat = k.material("#7faaa2"),
    lidMat = k.material("#5e9187");
  const ribosome = ribosomeAssembly(k, group, 2.48);
  ribosome.position.set(-3.85, 1.45, -0.15);
  ribosome.rotation.set(0.18, -0.36, 0.04);
  // This separate enlarged outlet is a functional path, not a fitted atomic tunnel.
  const outlet = new THREE.Group();
  outlet.name = "folding-outlet-schematic";
  group.add(outlet);
  for (const y of [-0.59, -0.19])
    k.tube(
      [
        [-3.38, y, 0.02],
        [-3.06, y, 0.02],
        [-2.72, y, 0.02],
      ],
      0.023,
      k.material("#98acb1"),
      outlet,
    );
  const continuation = k.tube(
    [
      [-3.28, -0.39, 0.12],
      [-3, -0.39, 0.12],
      [-2.74, -0.39, 0.12],
    ],
    0.06,
    chainMat,
    outlet,
  );
  continuation.name = "nascent-chain-unshown-upstream-continuation";
  const n = 76,
    chain = articulatedChain(k, n, 0.07, chainMat);
  const updatePeptideDetails = peptideSidechains(k, chain);
  // A short hydrophobic client segment, highlighted without assigning a real sequence.
  for (let i = 37; i <= 44; i++) {
    chain.beads[i].material = hydrophobicMat;
    if (i < n - 1) chain.links[i].material = hydrophobicMat;
  }
  const extended = [],
    intermediate = [],
    folded = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    extended.push(
      new THREE.Vector3(
        -2.74 + 5.3 * t,
        -0.39 + 0.18 * Math.sin(t * 17),
        0.12 + 0.18 * Math.sin(t * 21),
      ),
    );
    // N-terminal region locally organizes before the full domain is released.
    const h = Math.max(0, (t - 0.66) / 0.34);
    intermediate.push(
      new THREE.Vector3(
        -2.74 + 5.3 * t,
        -0.39 +
          0.18 * Math.sin(t * 17) +
          0.46 * Math.sin(h * 6 * Math.PI) * Math.min(1, h * 6),
        0.12 +
          0.18 * Math.sin(t * 21) +
          0.42 * (1 - Math.cos(h * 6 * Math.PI)) * Math.min(1, h * 6),
      ),
    );
    // One illustrative compact alpha/beta domain, not a universal native fold.
    let x, y, z;
    if (t < 0.32) {
      const u = t / 0.32;
      x = 0.75 + u * 1.7;
      y = 0.45 + 0.43 * Math.sin(u * 6 * Math.PI);
      z = 0.25 + 0.43 * Math.cos(u * 6 * Math.PI);
    } else if (t < 0.42) {
      const u = (t - 0.32) / 0.1;
      x = 2.45 + 0.4 * Math.sin(u * Math.PI);
      y = 0.45 - 1.12 * u;
      z = 0.68 - 0.78 * u;
    } else if (t < 0.59) {
      const u = (t - 0.42) / 0.17;
      x = 2.45 - 1.75 * u;
      y = -0.67 + 0.075 * Math.sin(u * 10 * Math.PI);
      z = -0.1;
    } else if (t < 0.66) {
      const u = (t - 0.59) / 0.07;
      x = 0.7 - 0.27 * Math.sin(u * Math.PI);
      y = -0.67 + 0.49 * u;
      z = -0.1 - 0.12 * Math.sin(u * Math.PI);
    } else if (t < 0.83) {
      const u = (t - 0.66) / 0.17;
      x = 0.7 + 1.75 * u;
      y = -0.18 + 0.075 * Math.sin(u * 10 * Math.PI);
      z = -0.16;
    } else {
      const u = (t - 0.83) / 0.17;
      x = 2.45 - 1.52 * u;
      y = -0.18 + 0.23 * Math.sin(u * Math.PI);
      z = -0.16 - 0.53 * Math.sin(u * Math.PI);
    }
    folded.push(new THREE.Vector3(x, y, z));
  }
  const hsp = new THREE.Group();
  group.add(hsp);
  // Open substrate groove at x≈0.15 and a distinct nucleotide-binding domain below.
  const domainShell = k.material("#86a69a", { side: THREE.DoubleSide });
  // Beta-sandwich substrate-binding domain: two pleated faces leave its groove open.
  sheet(
    k,
    hsp,
    [0.16, -0.73, 0.23],
    1.36,
    0.31,
    7,
    k.material("#73a095", { side: THREE.DoubleSide }),
  );
  sheet(
    k,
    hsp,
    [0.16, -0.82, -0.22],
    1.3,
    0.3,
    7,
    k.material("#a0bdb2", { side: THREE.DoubleSide }),
  );
  for (const side of [-1, 1])
    k.tube(
      [
        [0.16 + side * 0.66, -0.79, -0.25],
        [0.16 + side * 0.74, -0.56, 0.05],
        [0.16 + side * 0.57, -0.4, 0.17],
      ],
      0.075,
      domainMat,
      hsp,
      28,
    );
  // Four NBD subdomains surround a solvent-accessible nucleotide cleft.
  for (const [x, y, s] of [
    [-0.98, -1.43, 0.32],
    [-0.82, -1.96, 0.3],
    [-0.03, -1.41, 0.31],
    [-0.15, -1.98, 0.31],
  ]) {
    cutawayLobe(k, hsp, [x, y, -0.16], [s, 0.32, 0.36], domainShell);
    sheet(
      k,
      hsp,
      [x, y, 0.16],
      s * 1.5,
      0.42,
      3,
      k.material("#759b8d", { side: THREE.DoubleSide }),
    );
    helix(
      k,
      hsp,
      [x - 0.17, y - 0.22, 0.26],
      [x - 0.16, y + 0.22, 0.26],
      0.064,
      2.4,
      lidMat,
      0.027,
    );
  }
  k.tube(
    [
      [-0.05, -0.92, -0.35],
      [-0.33, -1.05, -0.45],
      [-0.6, -1.12, -0.23],
    ],
    0.072,
    lidMat,
    hsp,
  );
  const lid = new THREE.Group();
  hsp.add(lid);
  lid.position.set(-0.51, -0.39, -0.3);
  for (let j = 0; j < 3; j++) {
    const points = [];
    for (let i = 0; i <= 36; i++) {
      const t = i / 36;
      points.push([
        0.12 + t * 1.25,
        0.1 + j * 0.115 + 0.052 * Math.sin(t * 12 * Math.PI),
        0.05 + 0.065 * Math.cos(t * 12 * Math.PI),
      ]);
    }
    k.tube(points, 0.036, lidMat, lid, 50);
  }
  const nucleotide = new THREE.Group();
  hsp.add(nucleotide);
  nucleotide.position.set(-0.44, -1.57, 0.31);
  k.ball([-0.17, 0, 0], [0.13, 0.16, 0.07], k.material("#a99bb9"), nucleotide);
  const phosphate = [];
  for (let j = 0; j < 3; j++)
    phosphate.push(
      k.ball([0.04 + j * 0.15, 0, 0], 0.08, k.material("#d1b05f"), nucleotide),
    );
  const jProtein = new THREE.Group();
  group.add(jProtein);
  k.ball([0, 0, 0], [0.21, 0.48, 0.24], k.material("#a99abc"), jProtein);
  k.ball([0.17, 0.4, 0], [0.27, 0.22, 0.26], k.material("#a99abc"), jProtein);
  const nef = new THREE.Group();
  group.add(nef);
  k.ball([0, 0, 0], [0.28, 0.49, 0.23], k.material("#8ba3bd"), nef);
  k.ball([0.27, 0.3, 0], [0.27, 0.23, 0.23], k.material("#8ba3bd"), nef);
  // J-domain helix bundle and a schematic helical nucleotide-exchange surface.
  for (let j = 0; j < 4; j++)
    helix(
      k,
      jProtein,
      [-0.18 + j * 0.115, -0.31, 0.23],
      [-0.14 + j * 0.105, 0.34, 0.22],
      0.062,
      3.3,
      k.material("#9181a6"),
      0.025,
    );
  for (let j = 0; j < 3; j++)
    helix(
      k,
      nef,
      [-0.17 + j * 0.18, -0.28, 0.22],
      [-0.08 + j * 0.13, 0.34, 0.24],
      0.07,
      3.2,
      k.material("#708ca8"),
      0.027,
    );
  const hbonds = [];
  for (let i = 0; i < 7; i++) {
    const x = 0.92 + i * 0.21;
    const bond = k.segment(
      [x, -0.58, -0.12],
      [x, -0.25, -0.14],
      0.014,
      k.material("#b5b09a"),
    );
    hbonds.push(bond);
  }
  const labels = [
    k.label(
      [-3.85, 2.95, 0.2],
      "人 80S · 4UG0 实验骨架",
      "Human 80S · experimental 4UG0",
      1,
    ),
    k.label([2.7, 0.8, 0.5], "N 端先出现", "N terminus emerges first", 2),
    k.label(
      [-0.04, 0.6, 0.5],
      "暴露的疏水片段",
      "Exposed hydrophobic segment",
      2,
    ),
    k.label(
      [0.3, -2.5, 0.25],
      "Hsp70 · 底物结合域与 ATP 酶域",
      "Hsp70 · substrate and ATPase domains",
      2,
    ),
    k.label(
      [-1.42, 0.75, 0.25],
      "J 蛋白协助结合",
      "J protein assists capture",
      1,
    ),
    k.label(
      [-1.75, -2, 0.35],
      "核苷酸交换因子",
      "Nucleotide exchange factor",
      1,
    ),
    k.label([2.1, 1.3, 0.2], "示例 α/β 折叠", "Illustrative α/β fold", 2),
    k.label(
      [-2.65, -0.1, 0.3],
      "出口处链段（局部放大）",
      "Exit-region chain (enlargement)",
      1,
    ),
    k.label([0.15, -1.5, 0.7], "ADP · 保持结合", "ADP · client retained", 2),
  ];
  labels.push(
    k.label(
      [-3.83, 0.09, 0],
      "蓝灰 rRNA · 金色蛋白",
      "Blue-grey rRNA · gold proteins",
      1,
    ),
  );
  labels.push(
    k.label(
      [1.3, 2.28, 0],
      "下方：折叠机理放大示意",
      "Below: enlarged folding mechanism",
      1,
    ),
  );
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      held = parameters.cycle === "hold";
    const local = ease(p, 0.03, 0.23),
      bind = ease(p, 0.2, 0.37),
      exchange = held ? 0 : ease(p, 0.55, 0.72),
      fold = held ? 0 : ease(p, 0.69, 0.94);
    const finish = ease(p, 0.41, 0.53);
    continuation.visible = p < 0.41;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      chain.points[i].copy(extended[i]).lerp(intermediate[i], local);
      // Completion frees the C end while a short middle segment remains in Hsp70.
      chain.points[i].x += 0.33 * finish * (1 - t) * (1 - t);
      chain.points[i].y += 0.4 * finish * (1 - t) * (1 - t);
      chain.points[i].lerp(folded[i], fold);
    }
    chain.commit();
    updatePeptideDetails();
    hsp.position.set(0, -0.75 * (1 - bind) - 1.0 * exchange, -0.08);
    lid.rotation.z = 0.95 * (1 - bind) + 1.05 * exchange;
    phosphate[2].visible = p < 0.31 || exchange > 0.7;
    nucleotide.rotation.z = 0.1 * (1 - bind);
    nucleotide.position.x = -0.44 - 0.75 * Math.sin(exchange * Math.PI);
    jProtein.visible = p >= 0.13 && p < 0.48;
    jProtein.position.set(
      -1.1 - 0.8 * (1 - bind),
      0.27 + 0.4 * (1 - bind),
      0.16,
    );
    nef.visible = !held && p >= 0.53 && p < 0.79;
    nef.position.set(
      -1.55 + 0.3 * Math.sin(exchange * Math.PI),
      -1.5 - 0.8 * exchange,
      0.23,
    );
    hbonds.forEach((o) => {
      o.visible = fold > 0.78;
    });
    labels[1].active = p < 0.7 || held;
    labels[2].active = p < 0.72 || held;
    labels[3].position[1] = -2.5 - 1.0 * exchange;
    labels[4].active = jProtein.visible;
    labels[5].active = nef.visible;
    labels[6].active = fold > 0.8;
    labels[7].active = p < 0.5;
    labels[8].active = bind > 0.8 && exchange < 0.6;
    labels[8].position[1] = -1.5 - 0.75 * (1 - bind) - exchange;
    group.userData = {
      process: "proteinFolding",
      rootId,
      compartment: "cytosol",
      condition: held ? "ADP-bound hold" : "complete nucleotide cycle",
      chainSynthesisDirection: "NtoC",
      clientBound: bind > 0.8 && exchange < 0.6,
      nucleotide: bind < 0.8 || exchange > 0.7 ? "ATP" : "ADP",
      foldFraction: fold,
      illustrativeFold: true,
      structuralDetail:
        "Hsp70 beta-sandwich SBD, helical lid, four-subdomain ATPase cleft, nascent peptide sidechain markers",
      universalFold: false,
      releaseCompleted: fold === 1,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 1.8, 10.5], target: [-0.6, -0.65, 0] },
  };
}
export default {
  id: "proteinFolding",
  title: b("新生蛋白质折叠", "Nascent protein folding"),
  duration: 34,
  intro: b(
    "左上是保持共同坐标的人源 4UG0 80S 骨架（其他真核场景采用代表结构）；下方是独立放大的出口链段与折叠机理，并未拟合到该实验结构。真核细胞质中的示意可溶性蛋白：新生链先形成局部结构，Hsp70 暂时结合暴露片段，经 ATP/ADP 循环释放后继续折叠。α/β 终态仅为一种教学示例，不代表所有蛋白；真实路径可多轮尝试，也可能需要其他伴侣。",
    "Upper left: registered human 4UG0 80S backbone, used as a representative in other eukaryotic contexts. Below: a separate enlargement of an exit-region chain and folding mechanism, not fitted to that structure. An illustrative soluble protein in the eukaryotic cytosol. Local structure forms on a nascent chain; Hsp70 temporarily binds exposed segments and releases them through an ATP/ADP cycle. The α/β end state is one teaching example, not a universal fold. Real clients may require repeated cycles and other chaperones.",
  ),
  controls: [
    {
      id: "cycle",
      label: b("Hsp70 循环", "Hsp70 cycle"),
      default: "complete",
      options: [
        {
          value: "complete",
          label: b("完成核苷酸交换", "Complete nucleotide exchange"),
        },
        {
          value: "hold",
          label: b("停留在 ADP 结合态", "Hold the ADP-bound state"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("新生链离开出口", "Nascent chain emerges"),
      description: b(
        "N 端先离开核糖体，C 端仍在核糖体内合成。局部放大图从出口附近截取已伸出的链段，左侧延续线表示未画出的上游部分；它不是一个游离 C 端。",
        "The N terminus emerges first while the C terminus is synthesized inside the ribosome. The enlargement starts near the outlet; a continuation on the left marks the unshown upstream chain, not a free C terminus.",
      ),
    },
    {
      at: 0.15,
      title: b("局部折叠与片段暴露", "Local structure and exposed segments"),
      description: b(
        "部分序列形成局部结构；橙色表示尚暴露的疏水片段。J 蛋白帮助 Hsp70 接触底物，并促进其 ATP 水解。",
        "Some sequence regions acquire local structure; orange marks an exposed hydrophobic segment. A J protein helps Hsp70 engage the client and stimulates ATP hydrolysis.",
      ),
    },
    {
      at: 0.32,
      title: b("ADP 态暂时夹持", "ADP state retains the client"),
      description: b(
        "Hsp70 底物结合域的盖部闭合，ADP 态的底物交换较慢。伴侣暂时保护暴露片段，并不指定蛋白的最终结构。",
        "The substrate-domain lid closes and client exchange is slow in the ADP state. Hsp70 protects exposed regions temporarily; it does not prescribe the native structure.",
      ),
    },
    {
      at: 0.48,
      title: b("合成完成，等待交换", "Synthesis completes; exchange follows"),
      description: b(
        "完整链脱离核糖体，但选定片段仍受 Hsp70 保护。“停留在 ADP 结合态”分支让夹持状态持续，以比较底物释放对后续折叠的影响。",
        "The completed chain leaves the ribosome while Hsp70 retains the selected segment. The ADP-hold branch preserves this bound state to compare how client release enables further folding.",
      ),
    },
    {
      at: 0.62,
      title: b("核苷酸交换促使释放", "Nucleotide exchange enables release"),
      description: b(
        "在完整循环中，交换因子促进 ADP 离开，ATP 重新结合后盖部打开，底物可释放。示意磷酸基数目区分 ATP 与 ADP，未展开全部化学细节。",
        "In the complete cycle, an exchange factor promotes ADP release; ATP rebinding opens the lid and enables client release. Schematic phosphate counts distinguish ATP and ADP without depicting all chemical details.",
      ),
    },
    {
      at: 0.83,
      title: b("继续探索稳定构象", "Continue toward a stable conformation"),
      description: b(
        "释放后的示例链逐渐形成紧凑的 α/β 结构；细线提示部分局部相互作用。ADP 保持分支仍为结合中间态。单次循环并不保证任何真实蛋白完成折叠。",
        "The released illustrative chain gradually adopts a compact α/β structure; fine lines suggest selected local interactions. The ADP-hold branch remains a bound intermediate. One cycle does not guarantee complete folding of a real protein.",
      ),
    },
  ],
  legend: [
    { color: "#bd9272", text: b("同一条多肽链", "One continuous polypeptide") },
    {
      color: "#c78758",
      text: b("示意疏水片段", "Illustrative hydrophobic segment"),
    },
    { color: "#7faaa2", text: b("Hsp70", "Hsp70") },
    { color: "#a99abc", text: b("J 蛋白", "J protein") },
    {
      color: "#8ba3bd",
      text: b("核苷酸交换因子", "Nucleotide exchange factor"),
    },
  ],
  sources: [
    {
      title: "RCSB 4UG0 · Human 80S ribosome",
      url: "https://www.rcsb.org/structure/4UG0",
    },
    {
      title:
        "Allostery in the Hsp70 chaperones is transduced by subdomain rotations",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2693909/",
    },
    {
      title: "NCBI Bookshelf · Protein Folding and Processing",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9843/",
    },
    {
      title:
        "The Link That Binds: The Linker of Hsp70 as a Helm of the Protein’s Function",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6843406/",
    },
    {
      title: "Hsp70 chaperones: Cellular functions and molecular mechanism",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2773841/",
    },
  ],
  create,
};
