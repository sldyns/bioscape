import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";

import {
  helix,
  betaSheet,
  membraneWall,
  rearShell,
  chromatinFiber,
  materialInventory,
} from "./structuralKit.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  group.name = "Mammalian MHC-I antigen presentation to an effector CD8 T cell";
  const mem = k.material("#91aea1"),
    erMat = k.material("#94a5ae"),
    peptideMat = k.material("#bf8e61");
  const arc = (cx, cy, rx, ry, a, b) =>
    Array.from({ length: 81 }, (_, i) => {
      const t = a + ((b - a) * i) / 80;
      return [cx + rx * Math.cos(t), cy + ry * Math.sin(t), 0];
    });
  // Cross-sectional target membrane has a closable fusion opening on its right.
  k.tube(arc(-1.3, 0.35, 2.5, 2.3, 0.24, Math.PI * 2 - 0.015), 0.055, mem);
  const membranePatch = k.tube(
    arc(-1.3, 0.35, 2.5, 2.3, -0.015, 0.24),
    0.055,
    mem,
  );
  membraneWall(
    k,
    group,
    arc(-1.3, 0.35, 2.5, 2.3, 0.24, Math.PI * 2 - 0.015),
    mem,
    { thickness: 0.075, depth: 0.09 },
  );
  const surfacePatch = membraneWall(
    k,
    group,
    arc(-1.3, 0.35, 2.5, 2.3, -0.015, 0.24),
    mem,
    { thickness: 0.075, depth: 0.09 },
  );
  rearShell(k, group, [-1.3, 0.35, -0.08], [2.5, 2.3, 0.8], "#c3d1c6", 0.56);
  const nucleus = k.ball(
    [-2.4, -0.9, -0.05],
    [0.65, 0.6, 0.32],
    k.material("#b9b0c7", {
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    }),
  );
  k.ring([-2.4, -0.9, 0.08], 0.63, 0.034, k.material("#a9a0b9")).scale.y = 0.95;
  const erPoints = [
    [-3.1, 0.33, 0],
    [-3.25, 0.65, 0],
    [-3.1, 1.23, 0],
    [-2, 1.31, 0],
    [-0.9, 1.22, 0],
    [-0.72, 0.75, 0],
    [-0.9, 0.33, 0],
    [-1.67, 0.29, 0],
  ];
  k.tube(erPoints, 0.065, erMat);
  k.tube(
    [
      [-2.02, 0.29, 0],
      [-2.5, 0.3, 0],
      [-3.1, 0.33, 0],
    ],
    0.065,
    erMat,
  );
  const erCurve = new THREE.CatmullRomCurve3(
    erPoints.map((p) => new THREE.Vector3(...p)),
  );
  membraneWall(
    k,
    group,
    erCurve.getPoints(80).map((p) => p.toArray()),
    erMat,
    { thickness: 0.07, depth: 0.2 },
  );
  membraneWall(
    k,
    group,
    [
      [-2.02, 0.29, 0],
      [-2.5, 0.3, 0],
      [-3.1, 0.33, 0],
    ],
    erMat,
    { thickness: 0.07, depth: 0.2 },
  );
  const erBack = k.mesh(
    new THREE.PlaneGeometry(2.05, 0.73),
    k.material("#cad4d3", {
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    [-1.97, 0.8, -0.2],
  );
  rearShell(k, group, [-2.4, -0.9, -0.05], [0.65, 0.6, 0.32], "#b6abc5", 0.62);
  chromatinFiber(
    k,
    group,
    [
      [-2.8, -1.1, 0.02],
      [-2.6, -0.55, 0.02],
      [-2.17, -0.61, 0.02],
      [-2.05, -1.05, 0.02],
      [-2.45, -1.22, 0.02],
    ],
    0.026,
  );
  const tap = new THREE.Group();
  group.add(tap);
  tap.position.set(-1.86, 0.29, 0);
  for (const x of [-0.11, 0.11])
    k.segment([x, -0.22, 0], [x, 0.23, 0], 0.075, k.material("#80939a"), tap);
  k.ball([-0.12, -0.25, 0], [0.14, 0.12, 0.12], k.material("#a4a994"), tap);
  k.ball([0.12, -0.25, 0], [0.14, 0.12, 0.12], k.material("#a4a994"), tap);
  for (const side of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      helix(
        k,
        tap,
        [side * 0.13 + Math.cos(a) * 0.04, 0, 0.06 + Math.sin(a) * 0.04],
        0.38,
        0.022,
        k.material("#a9bcc0"),
        5,
        "y",
        0.011,
      );
    }
  const proteasome = new THREE.Group();
  group.add(proteasome);
  proteasome.position.set(-2.75, -0.12, 0.08);
  proteasome.rotation.z = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const r = k.ring(
      [0, -0.21 + i * 0.14, 0],
      0.24,
      0.057,
      k.material(i % 2 ? "#a394a6" : "#8f8197"),
      proteasome,
    );
    r.rotation.x = Math.PI / 2;
  }
  for (let layer = 0; layer < 4; layer++)
    for (let sub = 0; sub < 7; sub++) {
      const a = (sub * Math.PI * 2) / 7;
      const part = k.ball(
        [Math.cos(a) * 0.225, -0.21 + layer * 0.14, Math.sin(a) * 0.225],
        [0.079, 0.064, 0.079],
        k.material(layer % 2 ? "#ae9daf" : "#95859d"),
        proteasome,
      );
      part.rotation.y = -a;
    }
  for (const end of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      k.ball(
        [Math.cos(a) * 0.17, end * 0.35, Math.sin(a) * 0.17],
        [0.09, 0.06, 0.09],
        k.material("#b7a7b5"),
        proteasome,
      );
    }
  const protein = k.tube(
    [
      [-3.59, -0.3, 0.11],
      [-3.44, -0.15, 0.1],
      [-3.55, 0.01, 0.1],
      [-3.34, 0.15, 0.1],
      [-3.24, -0.03, 0.1],
    ],
    0.048,
    peptideMat,
  );
  protein.geometry.translate(3.05, 0.12, -0.1);
  protein.position.set(-3.05, -0.12, 0.1);
  const peptide = new THREE.Group();
  group.add(peptide);
  const residues = [];
  for (let i = 0; i < 5; i++)
    residues.push(
      k.ball(
        [i * 0.055, Math.sin(i * 1.3) * 0.03, 0],
        0.04,
        peptideMat,
        peptide,
      ),
    );
  const mhc = new THREE.Group();
  mhc.name = "MHC-I";
  peptide.name = "presented-peptide";
  group.add(mhc);
  const mhcMat = k.material("#7c9ca8");
  k.segment([0, -0.16, 0], [0, 0.21, 0], 0.052, mhcMat, mhc);
  k.ball([0, 0.26, 0], [0.15, 0.17, 0.13], mhcMat, mhc);
  k.tube(
    [
      [-0.19, 0.42, 0],
      [0, 0.38, 0],
      [0.19, 0.42, 0],
    ],
    0.066,
    mhcMat,
    mhc,
  );
  k.tube(
    [
      [-0.19, 0.42, 0.15],
      [0, 0.38, 0.15],
      [0.19, 0.42, 0.15],
    ],
    0.055,
    mhcMat,
    mhc,
  );
  k.ball([0.19, 0.22, 0.1], [0.095, 0.14, 0.1], k.material("#a8b5b1"), mhc);
  // The peptide groove is a beta-sheet floor between two alpha-helical walls.
  for (let i = 0; i < 5; i++)
    k.mesh(
      new THREE.BoxGeometry(0.33, 0.026, 0.028),
      k.material("#a9bec5"),
      [0, 0.354, 0.018 + i * 0.034],
      mhc,
    );
  for (const z of [-0.006, 0.17])
    helix(
      k,
      mhc,
      [0, 0.418, z],
      0.36,
      0.025,
      k.material("#bad0d2"),
      5,
      "x",
      0.014,
    );
  betaSheet(k, mhc, [0, 0.2, 0.133], 0.17, k.material("#b6c9cd"), 4);
  betaSheet(k, mhc, [0.19, 0.2, 0.196], 0.12, k.material("#d3dbd5"), 3);
  helix(
    k,
    mhc,
    [0, 0, 0.06],
    0.25,
    0.033,
    k.material("#9ab6bb"),
    4,
    "y",
    0.016,
  );
  const carrier = new THREE.Group();
  group.add(carrier);
  const vmat = k.material("#a4b8ad", {
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const vesicle = k.ball([0, 0, 0], 0.46, vmat, carrier);
  const vRim = k.ring([0, 0, 0.05], 0.46, 0.034, mem, carrier);
  membraneWall(k, carrier, arc(0, 0, 0.46, 0.46, 0, Math.PI * 2), mem, {
    thickness: 0.039,
    depth: 0.03,
  });
  rearShell(k, carrier, [0, 0, -0.02], [0.45, 0.45, 0.45], "#b6c7bb", 0.52);
  const golgi = new THREE.Group();
  group.add(golgi);
  golgi.position.y = 1.05;
  for (let i = 0; i < 3; i++)
    k.tube(
      [
        [-0.35, -0.5 - i * 0.18, 0],
        [0, -0.42 - i * 0.18, 0],
        [0.37, -0.57 - i * 0.18, 0],
      ],
      0.065,
      k.material("#b9a490"),
      golgi,
    );
  for (let i = 0; i < 3; i++) {
    const y = -0.5 - i * 0.18;
    membraneWall(
      k,
      golgi,
      [
        [-0.4, y - 0.04, 0],
        [-0.36, y + 0.06, 0],
        [0, y + 0.12, 0],
        [0.4, y + 0.035, 0],
        [0.42, y - 0.04, 0],
        [0.03, y + 0.035, 0],
        [-0.4, y - 0.04, 0],
      ],
      k.material("#b9a490"),
      { thickness: 0.031, depth: 0.14, heads: false },
    );
  }
  const tcell = new THREE.Group();
  group.add(tcell);
  k.ball(
    [0, 0, -0.05],
    [1.3, 1.6, 0.65],
    k.material("#a8b5bd", {
      transparent: true,
      opacity: 0.19,
      depthWrite: false,
    }),
    tcell,
  );
  const tr = k.ring([0, 0, 0.05], 1.33, 0.045, k.material("#8ba0ad"), tcell);
  tr.scale.y = 1.2;
  k.ball(
    [0.32, -0.17, 0],
    [0.66, 0.85, 0.4],
    k.material("#a9a2b9", {
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
    tcell,
  );
  rearShell(k, tcell, [0, 0, -0.05], [1.3, 1.6, 0.65], "#becbd3", 0.59);
  membraneWall(
    k,
    tcell,
    arc(0, 0, 1.3, 1.6, 0, Math.PI * 2),
    k.material("#8ba0ad"),
    { thickness: 0.06, depth: 0.05 },
  );
  chromatinFiber(
    k,
    tcell,
    [
      [0.0, -0.62, 0.03],
      [0.64, -0.6, 0.02],
      [0.7, 0.37, 0.03],
      [0.06, 0.45, 0.03],
      [-0.12, -0.1, 0.03],
    ],
    0.029,
  );
  const tcr = new THREE.Group();
  tcell.add(tcr);
  tcr.position.set(-1.28, 0.28, 0.04);
  tcr.rotation.z = Math.PI / 2;
  for (const x of [-0.09, 0.09]) {
    k.segment([x, -0.15, 0], [x, 0.32, 0], 0.055, k.material("#9f8da8"), tcr);
    k.ball([x, 0.39, 0], [0.085, 0.16, 0.1], k.material("#9f8da8"), tcr);
  }
  for (const x of [-0.09, 0.09]) {
    k.ball([x, 0.12, 0], [0.08, 0.12, 0.09], k.material("#af9db7"), tcr);
    betaSheet(k, tcr, [x, 0.13, 0.09], 0.12, k.material("#d0c2d3"), 3);
    betaSheet(k, tcr, [x, 0.365, 0.085], 0.1, k.material("#d0c2d3"), 3);
    k.tube(
      [
        [x - 0.055, 0.48, 0.03],
        [x - 0.025, 0.51, 0.09],
        [x + 0.025, 0.51, 0.09],
        [x + 0.055, 0.47, 0.03],
      ],
      0.018,
      k.material("#bea8bf"),
      tcr,
      24,
    );
  }
  for (const x of [-0.19, 0.19])
    k.ball([x, -0.035, 0.01], [0.055, 0.13, 0.07], k.material("#b2aea1"), tcr);
  const cd8 = k.segment(
    [-1.2, -0.16, 0.08],
    [-1.88, 0.26, 0.08],
    0.047,
    k.material("#a7ad81"),
    tcell,
  );
  for (const sign of [-1, 1]) {
    k.ball(
      [-1.8, 0.23 + sign * 0.055, 0.08],
      [0.13, 0.075, 0.08],
      k.material("#a7ad81"),
      tcell,
    );
    betaSheet(
      k,
      tcell,
      [-1.8, 0.23 + sign * 0.055, 0.16],
      0.13,
      k.material("#ccd0b1"),
      3,
    );
  }
  const granules = [];
  for (let i = 0; i < 5; i++)
    granules.push(k.ball([0, 0, 0.13], 0.1, k.material("#af9a7c"), tcell));
  const labels = [
    k.label([-2.35, 2.84, 0], "有核靶细胞", "Nucleated target cell", 2),
    k.label([3.5, 2.15, 0], "效应 CD8 T 细胞", "Effector CD8 T cell", 2),
    k.label([-2.38, 1.7, 0.1], "内质网腔", "ER lumen", 2),
    k.label([-3.14, -0.57, 0.1], "蛋白酶体", "Proteasome", 1),
    k.label([-1.71, -0.18, 0.15], "TAP", "TAP", 2),
    k.label(
      [0.08, -1.29, 0],
      "高尔基体通路（压缩）",
      "Golgi route (compressed)",
      1,
    ),
    k.label([1.15, 1.48, 0.1], "肽–MHC-I", "Peptide–MHC-I", 2),
    k.label([2.7, -0.48, 0.2], "TCR + CD8", "TCR + CD8", 2),
  ];
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      match = parameters.epitope !== "unmatched";
    const degrade = ease(p, 0.03, 0.19),
      imported = ease(p, 0.19, 0.35),
      load = ease(p, 0.35, 0.46),
      traffic = ease(p, 0.5, 0.72),
      fuse = ease(p, 0.72, 0.81),
      contact = ease(p, 0.82, 0.94),
      response = match ? ease(p, 0.92, 1) : 0;
    protein.scale.x = 1 - 0.98 * degrade;
    protein.visible = p < 0.2;
    residues.forEach((r, i) => {
      r.position.y = Math.sin(i * 1.3) * 0.03 + (match ? 0 : (i % 2) * 0.075);
    });
    const turn = (ease(p, 0.5, 0.6) * Math.PI) / 2;
    const cx = -0.8 + 1.46 * traffic,
      cy = 0.75 - 0.04 * traffic;
    carrier.visible = p >= 0.49 && p < 0.82;
    carrier.position.set(cx + 0.5 * fuse, cy, 0);
    carrier.scale.set(1 - 0.97 * fuse, 1, 1);
    const mx = p < 0.5 ? -0.8 : cx - 0.45 * Math.sin(turn) + 0.94 * fuse;
    const my = p < 0.5 ? 0.3 : cy - 0.45 * Math.cos(turn);
    mhc.position.set(mx, my, 0.03);
    mhc.rotation.z = -turn;
    if (p < 0.19) peptide.position.set(-2.46 + 0.3 * degrade, -0.11, 0.12);
    else if (p < 0.35)
      peptide.position.set(
        -2.16 + 0.3 * imported,
        -0.11 + 0.72 * imported,
        0.12,
      );
    else if (p < 0.46)
      peptide.position.set(-1.86 + 1.02 * load, 0.61 + 0.09 * load, 0.12);
    else
      peptide.position.set(
        mx + 0.43 * Math.sin(turn) - 0.1 * Math.cos(turn),
        my + 0.43 * Math.cos(turn) + 0.1 * Math.sin(turn),
        0.12,
      );
    peptide.rotation.z = p >= 0.46 ? -turn : 0;
    peptide.visible = p >= 0.13;
    membranePatch.visible = !(p >= 0.735 && p < 0.81);
    surfacePatch.visible = membranePatch.visible;
    tcell.position.set(
      3.62 - 0.32 * contact + (match ? 0 : 0.33 * ease(p, 0.94, 1)),
      0.43,
      0,
    );
    granules.forEach((g, i) => {
      const a = i * 1.35;
      g.position.set(
        0.4 * Math.cos(a) * (1 - response) - 0.76 * response,
        0.55 * Math.sin(a) * (1 - response) + 0.13 * response,
        0.13,
      );
    });
    tcr.rotation.x = match ? 0 : 0.15 * ease(p, 0.94, 1);
    cd8.visible = true;
    labels[6].active = p >= 0.69;
    labels[7].active = p >= 0.81;
    labels[3].active = p < 0.34;
    labels[4].active = p < 0.5;
    group.userData = {
      organism: "mammalian",
      mechanism: "endogenous MHC-I presentation to effector CD8 T cell",
      epitope: parameters.epitope || "matched",
      participatingCells: 2,
      peptideCompartment:
        p < 0.3
          ? "target cytosol"
          : p < 0.5
            ? "ER lumen"
            : p < 0.81
              ? "secretory lumen"
              : "extracellular MHC-I groove",
      surfacePresentation: p >= 0.81,
      tcrRecognized: match && p >= 0.94,
      granulesPolarized: match && response > 0.8,
      naiveTCellPriming: false,
      cellKillingShown: false,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    science: { mhc, peptide, tcr, tcell, residues },
    materials: materialInventory(group),
    camera: { position: [0.3, 1.15, 13.6], target: [0.3, 0.2, 0] },
  };
}
export default {
  id: "immuneResponse",
  title: B(
    "MHC-I 呈递与 T 细胞识别",
    "MHC-I presentation and T-cell recognition",
  ),
  duration: 36,
  intro: B(
    "两个哺乳动物细胞之间的相互作用：有核靶细胞呈递内源性蛋白片段，已分化的效应 CD8 T 细胞进行特异识别。比较能或不能被该 TCR 识别的肽，两者都可装载到此 MHC-I。这里不模拟初始 T 细胞启动或实际杀伤。",
    "An interaction between two mammalian cells: a nucleated target presents endogenous protein fragments to an already differentiated effector CD8 T cell. Compare peptides that this TCR recognizes or does not recognize; both can bind this MHC-I. Naive-T-cell priming and actual killing are not modeled.",
  ),
  controls: [
    {
      id: "epitope",
      label: B("呈递肽与该 TCR", "Presented peptide and this TCR"),
      default: "matched",
      options: [
        {
          value: "matched",
          label: B("可被该 TCR 识别", "Recognized by this TCR"),
        },
        {
          value: "unmatched",
          label: B("该 TCR 不识别", "Not recognized by this TCR"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("胞质蛋白切割", "Cytosolic protein processing"),
      description: B(
        "靶细胞胞质中的内源性蛋白被蛋白酶体切成肽段。这里跟随其中一条可呈递肽；并非每个产生的片段都能进入 MHC-I 通路。",
        "A target-cell cytosolic protein is processed by the proteasome. One presentable peptide is followed; not every generated fragment enters the MHC-I pathway.",
      ),
    },
    {
      at: 0.19,
      title: B("TAP 转运进入内质网", "TAP import into the ER"),
      description: B(
        "TAP 将胞质肽转运到内质网腔，过程需要 ATP。图中通道跨越内质网膜，肽经通道而不是直接穿过脂质。",
        "TAP transports cytosolic peptides into the ER lumen using ATP. The channel spans the ER membrane; peptides pass through it rather than directly through lipid.",
      ),
    },
    {
      at: 0.35,
      title: B("装载肽–MHC-I", "Loading peptide–MHC-I"),
      description: B(
        "肽结合由 MHC-I 重链和 β₂ 微球蛋白形成的复合物；结合槽面向内质网腔。伴侣、修剪酶和完整装载复合体在此省略。",
        "A peptide binds the complex formed by an MHC-I heavy chain and β₂-microglobulin, with its binding groove facing the ER lumen. Chaperones, trimming enzymes and the full loading complex are omitted.",
      ),
    },
    {
      at: 0.5,
      title: B("经分泌通路到达表面", "Secretory transport to the surface"),
      description: B(
        "稳定的肽–MHC-I 经内质网、高尔基体和运输载体到达质膜。运输路线压缩显示；膜腔侧最终对应细胞外侧，肽不会进入邻近 T 细胞的胞质。",
        "Stable peptide–MHC-I travels through the ER, Golgi and carriers to the plasma membrane. This route is compressed; the luminal face becomes extracellular, and peptide does not enter the neighboring T-cell cytosol.",
      ),
    },
    {
      at: 0.81,
      title: B("两个细胞接触", "Contact between two cells"),
      description: B(
        "效应 CD8 T 细胞靠近靶细胞。TCR 同时识别肽和 MHC-I 的表面，CD8 结合 MHC-I 的另一部位；可装载肽并不一定被这个 TCR 识别。",
        "An effector CD8 T cell approaches. TCR contacts both peptide and MHC-I, while CD8 binds another MHC-I site. A peptide that loads successfully need not be recognized by this TCR.",
      ),
    },
    {
      at: 0.94,
      title: B("特异识别与极化", "Specific recognition and polarization"),
      description: B(
        "匹配识别支持接触稳定和细胞毒颗粒向接触面极化。不匹配条件下，颗粒不极化且接触松开。后续杀伤、抑制信号和免疫突触的复杂组织未画出。",
        "Matching recognition supports stable contact and polarization of cytotoxic granules toward the interface. Without recognition, granules remain unpolarized and contact loosens. Subsequent killing, inhibitory signals and detailed synapse organization are not shown.",
      ),
    },
  ],
  sources: [
    {
      title: "TCR-peptide-MHC complex (PDB 1AO7)",
      url: "https://www.rcsb.org/structure/1AO7",
    },
    {
      title: "CD8-MHC contact (PDB 1AKJ)",
      url: "https://www.rcsb.org/structure/1AKJ",
    },
    {
      title: "Nucleosome core particle (PDB 1AOI)",
      url: "https://www.rcsb.org/structure/1AOI",
    },
    {
      title: "Immunobiology — The generation of T-cell receptor ligands",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK27137/",
    },
    {
      title: "Molecular Biology of the Cell — T Cells and MHC Proteins",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26926/",
    },
  ],
  create,
};
