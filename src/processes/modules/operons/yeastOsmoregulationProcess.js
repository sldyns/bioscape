import {
  trackMaterials,
  duplex,
  nucleotideDetail,
  nuclearRim,
  lipidRim,
  kinaseDetail,
  helix,
  materialInventory,
} from "./structuralDetails.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
const model = {
  id: "yeastOsmoregulation",
  title: b(
    "酵母渗透调节：HOG 与甘油",
    "Yeast osmoregulation: HOG and glycerol",
  ),
  duration: 38,
  intro: b(
    "酿酒酵母面对一次温和的外界高渗冲击。只展开 Sln1–Ypd1–Ssk1 输入支路，省略平行的 Sho1 支路。胞膜内缩、Hog1 核转位与甘油积累是示意性过程，不能读取真实体积或时间。Fps1 的早期关闭可不依赖 HOG；Hog1 不可磷酸化对照仍保留这一反应及基础甘油。此对照表示激活位点不能被 Pbs2 磷酸化；不等同于只抑制 Hog1 催化活性的处理。",
    "Saccharomyces cerevisiae responding to a moderate hyperosmotic step. Only the Sln1–Ypd1–Ssk1 input branch is expanded; the parallel Sho1 branch is omitted. Membrane shrinkage, Hog1 nuclear localization and glycerol accumulation are qualitative, not measurements of volume or time. Early Fps1 closure can occur without HOG, so it and basal glycerol remain in the nonphosphorylatable Hog1 control. This intervention prevents Pbs2 phosphorylation at Hog1 activation sites; it is distinct from inhibiting catalytic activity alone.",
  ),
  controls: [
    {
      id: "osmolarity",
      label: b("外界渗透变化", "External osmotic step"),
      default: "high",
      options: [
        { value: "high", label: b("升高", "Increase") },
        { value: "unchanged", label: b("不变", "Unchanged") },
      ],
    },
    {
      id: "hog1",
      label: b("Hog1 激活位点", "Hog1 activation sites"),
      default: "active",
      options: [
        { value: "active", label: b("正常", "Normal") },
        { value: "inhibited", label: b("不可磷酸化", "Nonphosphorylatable") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("基础磷酸接力", "Basal phosphorelay"),
      description: b(
        "无高渗冲击时，Sln1 经 Ypd1 使 Ssk1 保持磷酸化，从而抑制下游 HOG 激活。金色标记表示磷酸基团，不代表激活总是增加。",
        "Without an osmotic step, Sln1 transfers phosphate through Ypd1 to Ssk1, restraining downstream HOG activation. Gold marks phosphate; phosphorylation does not always mean activation.",
      ),
    },
    {
      at: 0.15,
      title: b("失水与甘油通道关闭", "Water loss and glycerol-channel closure"),
      description: b(
        "外界渗透压升高使水净外流、细胞体积下降。Fps1 通道迅速关闭以减少甘油流失；其早期关闭不应全部归因于 Hog1。细胞壁边界只作参照。",
        "Higher external osmolarity drives net water loss and cell shrinkage. Fps1 rapidly closes to reduce glycerol loss; early closure is not attributed entirely to Hog1. The wall boundary is a reference outline.",
      ),
    },
    {
      at: 0.32,
      title: b(
        "降低磷酸接力以激活支路",
        "Less phosphorelay activates the branch",
      ),
      description: b(
        "Sln1 支路的磷酸接力减弱，未磷酸化 Ssk1 促进 Ssk2/Ssk22，随后激活 Pbs2。不是把渗透物直接当作 Sln1 的配体。",
        "Reduced Sln1 phosphorelay leaves Ssk1 unphosphorylated, enabling Ssk2/Ssk22 and then Pbs2 activation. External osmolytes are not depicted as ligands binding Sln1.",
      ),
    },
    {
      at: 0.49,
      title: b("Hog1 的胞质与核内作用", "Cytoplasmic and nuclear Hog1 actions"),
      description: b(
        "Pbs2 先磷酸化 Hog1，随后 Hog1 经核孔进入细胞核，参与应激转录，也在胞质调节代谢。不可磷酸化对照缺少这一激活步骤；催化活性降低本身不必阻止入核。",
        "Pbs2 first phosphorylates Hog1; Hog1 then enters the nucleus through a nuclear pore, contributing to stress transcription as well as cytoplasmic metabolic regulation. The nonphosphorylatable control lacks this activation step; reduced catalytic activity alone need not prevent import.",
      ),
    },
    {
      at: 0.68,
      title: b("增加并保留甘油", "Produce and retain glycerol"),
      description: b(
        "HOG 促进包括 GPD1 在内的应答，配合代谢调节增加胞质甘油。关闭 Fps1 减少外流；三碳结构代表甘油，数量仅表示相对积累。",
        "HOG promotes responses including GPD1 expression and metabolic regulation that increase cytoplasmic glycerol. Closed Fps1 reduces efflux. Three-carbon shapes represent glycerol; counts indicate only relative accumulation.",
      ),
    },
    {
      at: 0.9,
      title: b("渗透平衡逐步恢复", "Osmotic balance is restored"),
      description: b(
        "积累的相容性溶质减小跨膜水势差，使体积恢复并降低 HOG 信号。Hog1 不可磷酸化时恢复受损；本模型不预测存活率，也不穷尽其他补偿机制。",
        "Accumulated compatible solute reduces the water-potential difference, allowing volume recovery and HOG signal attenuation. Recovery is impaired with nonphosphorylatable Hog1. This model predicts neither survival nor every compensatory mechanism.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Ferrigno et al. (1998): Phosphorylation-dependent Hog1 import and Nmd5/Xpo1 nuclear exchange",
      url: "https://pubmed.ncbi.nlm.nih.gov/9755161/",
    },
    {
      title:
        "HOG1 MAP kinase regulation by the Sln1–Ypd1–Ssk1 phosphorelay (1996)",
      url: "https://pubmed.ncbi.nlm.nih.gov/8808622/",
    },
    {
      title:
        "Robust network structure of the Sln1–Ypd1–Ssk1 phosphorelay (2015)",
      url: "https://pubmed.ncbi.nlm.nih.gov/25888817/",
    },
    {
      title:
        "Fps1 facilitates glycerol flux and closes under osmotic stress (1995)",
      url: "https://pubmed.ncbi.nlm.nih.gov/7729414/",
    },
  ],
  create({ rootId = "yeast" } = {}) {
    const k = trackMaterials(sceneKit()),
      { group } = k,
      wallmat = k.material("#c4baa2"),
      mem = k.material("#8bada0"),
      watermat = k.material("#91b6c3"),
      green = k.material("#7c9d86"),
      plum = k.material("#ac8a9f"),
      blue = k.material("#8199ac"),
      gold = k.material("#cba667"),
      inactive = k.material("#bbc6bf"),
      rnaMat = k.material("#c8917a");
    const wall = k.ring([0, 0, -0.2], 3.12, 0.09, wallmat);
    wall.scale.set(1.3, 0.9, 1);
    const membrane = new THREE.Group();
    group.add(membrane);
    lipidRim(k, membrane);
    nuclearRim(k, {
      center: [1.18, 0.12, -0.04],
      rx: 0.95,
      ry: 0.91,
      pores: 5,
      transportPore: {
        index: 2,
        angle: Math.PI,
        radius: 0.335,
        tube: 0.035,
        halfAngle: 0.4,
        z: 0.16,
      },
    });
    duplex(k, { x0: 0.48, x1: 1.86, y: 0.02, radius: 0.08, count: 18 });
    const sensor = new THREE.Group();
    group.add(sensor);
    k.ball([0, 0.28, 0], [0.24, 0.24, 0.2], green, sensor);
    for (const x of [-0.14, 0.14])
      k.segment([x, 0.15, 0], [x, -0.3, 0], 0.065, green, sensor);
    k.ball([0, -0.42, 0], [0.29, 0.2, 0.24], green, sensor);
    for (const x of [-0.14, 0.14])
      helix(k, sensor, [x, -0.04, 0.12], green, {
        length: 0.48,
        radius: 0.042,
        turns: 4,
      });
    helix(k, sensor, [0, -0.42, 0.2], blue, {
      length: 0.27,
      radius: 0.06,
      turns: 3,
      rotation: 1.2,
    });
    const ypd = k.ball([-2.3, 0.82, 0], [0.26, 0.21, 0.22], blue),
      ssk = k.ball([-1.65, 0.34, 0], [0.31, 0.23, 0.25], green);
    for (let i = 0; i < 4; i++) {
      helix(k, ypd, [(i - 1.5) * 0.3, 0, 0.65], blue, {
        length: 1.4,
        radius: 0.09,
        turns: 4,
        rotation: 0.15,
      });
      helix(k, ssk, [(i - 1.5) * 0.3, 0, 0.65], green, {
        length: 1.2,
        radius: 0.075,
        turns: 3,
        rotation: -0.25,
      });
    }
    const sskP = k.ball([-1.43, 0.52, 0.16], 0.09, gold),
      ypdP = k.ball([-2.1, 0.98, 0.16], 0.08, gold),
      sensorP = k.ball([0.18, -0.43, 0.2], 0.08, gold, sensor);
    const kinase1 = new THREE.Group();
    group.add(kinase1);
    kinase1.position.set(-1.43, -0.38, 0);
    kinaseDetail(k, kinase1, plum);
    const pbs = new THREE.Group();
    group.add(pbs);
    pbs.position.set(-0.52, -0.46, 0);
    kinaseDetail(k, pbs, blue, { scale: 0.8 });
    const pbsP = k.ball([-0.3, -0.29, 0.14], 0.08, gold);
    pbsP.name = "Pbs2 activation phosphate";
    const hog = new THREE.Group();
    group.add(hog);
    hog.name = "Hog1 transport cargo";
    hog.scale.setScalar(0.65);
    kinaseDetail(k, hog, plum, { scale: 0.9 });
    const hogP = k.ball([0, 0.27, 0.18], 0.075, gold, hog);
    hogP.name = "Hog1 activation phosphate";
    // Radial transit segment traverses the real left pore; approach and exit
    // remain outside and inside respectively until the whole cargo clears it.
    const approach = new THREE.Vector3(-0.08, -0.6, 0.12);
    const poreOutside = new THREE.Vector3(-0.3, 0.12, 0.12);
    const poreInside = new THREE.Vector3(0.7, 0.12, 0.12);
    const nuclearTarget = new THREE.Vector3(1.1, 0.31, 0.12);
    function placeHog(fraction) {
      if (fraction < 0.25)
        hog.position.copy(approach).lerp(poreOutside, ease(fraction, 0, 0.25));
      else if (fraction < 0.75)
        hog.position
          .copy(poreOutside)
          .lerp(poreInside, ease(fraction, 0.25, 0.75));
      else
        hog.position
          .copy(poreInside)
          .lerp(nuclearTarget, ease(fraction, 0.75, 1));
    }
    const arrows = [];
    for (const [a, z] of [
      [
        [-2.22, 0.58, 0],
        [-1.91, 0.43, 0],
      ],
      [
        [-1.6, 0.07, 0],
        [-1.52, -0.12, 0],
      ],
      [
        [-1.09, -0.4, 0],
        [-0.84, -0.43, 0],
      ],
    ])
      arrows.push(k.segment(a, z, 0.025, inactive));
    const channel = new THREE.Group();
    group.add(channel);
    channel.name = "Fps1 glycerol channel";
    const jaws = [
      k.ball([0, 0.16, 0], [0.22, 0.12, 0.19], blue, channel),
      k.ball([0, -0.16, 0], [0.22, 0.12, 0.19], blue, channel),
    ];
    jaws.forEach((jaw) => {
      for (let j = 0; j < 3; j++)
        helix(k, jaw, [(j - 1) * 0.6, 0, 0.5], blue, {
          length: 1.2,
          radius: 0.1,
          turns: 3,
          rotation: Math.PI / 2,
        });
    });
    const rna = k.tube(
      [
        [0.78, 0.46, 0.08],
        [1.05, 0.53, 0.08],
        [1.26, 0.4, 0.08],
        [1.48, 0.49, 0.08],
      ],
      0.04,
      rnaMat,
    );
    const rnaDetail = nucleotideDetail(k, rna, {
      spacing: 0.08,
      radius: 0.026,
    });
    const enzyme = k.ball([0.1, -1.47, 0], [0.4, 0.23, 0.24], green);
    for (let i = 0; i < 3; i++)
      helix(k, enzyme, [(i - 1) * 0.45, 0, 0.8], green, {
        length: 1.4,
        radius: 0.1,
        turns: 4,
      });
    const glycerol = Array.from({ length: 15 }, (_, i) => {
      const g = new THREE.Group();
      group.add(g);
      for (let j = 0; j < 3; j++) {
        k.ball([j * 0.105, (j % 2) * 0.07, 0], 0.06, gold, g);
        k.segment(
          [j * 0.105, (j % 2) * 0.07, 0],
          [j * 0.105, (j % 2) * 0.07 + 0.095, 0.025],
          0.018,
          gold,
          g,
        );
        k.ball([j * 0.105, (j % 2) * 0.07 + 0.095, 0.025], 0.034, rnaMat, g);
        if (j)
          k.segment(
            [(j - 1) * 0.105, ((j - 1) % 2) * 0.07, 0],
            [j * 0.105, (j % 2) * 0.07, 0],
            0.027,
            gold,
            g,
          );
      }
      g.position.set(
        -2.3 + (i % 5) * 0.85,
        -1.25 - Math.floor(i / 5) * 0.3,
        0.08,
      );
      return g;
    });
    const waters = Array.from({ length: 10 }, (_, i) =>
      k.ball([0, 0, 0], [0.06, 0.105, 0.06], watermat),
    );
    const labels = [
      k.label([-2.6, 2.7, 0], "Sln1", "Sln1", 2),
      k.label([-2.4, 1.19, 0], "Ypd1", "Ypd1", 1),
      k.label(
        [-1.65, 0.8, 0],
        "Ssk1-P：抑制支路",
        "Ssk1-P: branch restrained",
        2,
      ),
      k.label([-1.48, -0.91, 0], "Ssk2/22", "Ssk2/22", 1),
      k.label([-0.55, -0.93, 0], "Pbs2", "Pbs2", 1),
      k.label([0.1, 0.72, 0], "Hog1", "Hog1", 2),
      k.label([1.35, 1.32, 0], "细胞核", "Nucleus", 1),
      k.label([4.2, 0.45, 0], "Fps1 开", "Fps1 open", 2),
      k.label([0.1, -2.27, 0], "胞质甘油", "Cytoplasmic glycerol", 2),
      k.label([0, 3.22, 0], "无渗透冲击", "No osmotic step", 2),
      k.label([1.22, 0.83, 0], "GPD1 应答", "GPD1 response", 1),
      k.label(
        [-0.15, -2.8, 0],
        "体积示意；不按比例",
        "Schematic volume; not to scale",
        1,
      ),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        stress = parameters.osmolarity !== "unchanged",
        functional = parameters.hog1 !== "inhibited",
        shock = stress ? ease(p, 0.12, 0.26) : 0,
        recovery = stress && functional ? ease(p, 0.7, 1) : 0,
        volume = 1 - 0.2 * shock + 0.18 * recovery;
      membrane.scale.setScalar(volume);
      sensor.position.set(-2.47 * volume, 2.06 * volume, 0);
      channel.position.set(3.86 * volume, 0, 0);
      jaws[0].position.y = 0.19 - 0.13 * shock;
      jaws[1].position.y = -0.19 + 0.13 * shock;
      sensorP.visible =
        ypdP.visible =
        sskP.visible =
          !stress || p < 0.32 || recovery > 0.85;
      pbsP.visible = stress && p >= 0.44 && (functional ? p < 0.86 : true);
      hogP.visible = functional && stress && p >= 0.51 && p < 0.86;
      ssk.material = stress && p > 0.32 ? green : inactive;
      ypd.material = stress && p > 0.32 ? inactive : blue;
      const importProgress = stress && functional ? ease(p, 0.53, 0.65) : 0;
      const exportProgress = stress && functional ? ease(p, 0.87, 0.99) : 0;
      const nuclearMove = importProgress * (1 - exportProgress);
      placeHog(nuclearMove);
      rna.visible = stress && functional && p > 0.66;
      rna.geometry.setDrawRange(
        0,
        Math.floor((rna.geometry.index.count * ease(p, 0.66, 0.78)) / 6) * 6,
      );
      enzyme.material = stress && functional && p > 0.66 ? green : inactive;
      const count =
        3 +
        (stress ? Math.floor((functional ? 12 : 2) * ease(p, 0.64, 0.95)) : 0);
      glycerol.forEach((g, i) => {
        g.visible = i < count;
        g.scale.setScalar(0.85);
      });
      waters.forEach((w, i) => {
        const a = (-0.7 + i * 0.145) * Math.PI;
        const outward = stress && p >= 0.14 && p < 0.31;
        const inward = stress && functional && p >= 0.76 && p < 0.94;
        w.visible = outward || inward;
        const t = outward ? ease(p, 0.14, 0.31) : ease(p, 0.76, 0.94),
          r = outward ? 2.5 + 1.05 * t : 3.55 - 0.8 * t;
        w.position.set(r * 1.3 * Math.cos(a), r * 0.9 * Math.sin(a), 0.13);
        w.rotation.z = a - Math.PI / 2;
      });
      rnaDetail.update();
      labels[0].position[0] = sensor.position.x;
      labels[0].position[1] = sensor.position.y + 0.55;
      labels[2].text =
        stress && p > 0.32 && recovery < 0.85
          ? b("Ssk1 去磷酸化", "Ssk1 dephosphorylated")
          : b("Ssk1-P：抑制支路", "Ssk1-P: branch restrained");
      labels[5].position[0] = hog.position.x;
      labels[5].position[1] = hog.position.y + 0.5;
      labels[5].text = functional
        ? b("Hog1", "Hog1")
        : b("Hog1 不可磷酸化", "Hog1 nonphosphorylatable");
      labels[7].position[0] = channel.position.x;
      labels[7].text =
        shock > 0.8
          ? b("Fps1 关闭", "Fps1 closed")
          : b("Fps1 开放", "Fps1 open");
      labels[10].active = rna.visible;
      labels[9].text = !stress
        ? b("渗透环境不变", "Osmotic environment unchanged")
        : p < 0.26
          ? b("高渗冲击 → 失水", "Hyperosmotic step → water loss")
          : p > 0.9 && functional
            ? b("甘油积累 · 逐步恢复", "Glycerol accumulation · recovery")
            : functional
              ? b("HOG 适应性应答", "HOG adaptive response")
              : b("适应性恢复受损", "Adaptive recovery impaired");
      group.userData = {
        rootId,
        species: "Saccharomyces cerevisiae",
        branch: "Sln1-Ypd1-Ssk1-Ssk2/22-Pbs2-Hog1",
        osmoticStep: stress,
        hog1Functional: functional,
        hog1Intervention: functional
          ? "normal-activation-sites"
          : "nonphosphorylatable-activation-sites",
        hog1Phosphorylated: hogP.visible,
        ssk1Phosphorylated: sskP.visible,
        hog1Nuclear:
          Math.pow((hog.position.x - 1.18) / 0.95, 2) +
            Math.pow((hog.position.y - 0.12) / 0.91, 2) <
          1,
        fps1Closed: shock > 0.8,
        fps1EarlyClosureRequiresHog1: false,
        glycerolAccumulation:
          stress && functional && p > 0.68 ? "adaptive" : "basal",
        schematicMembraneScale: volume,
        recovery: stress
          ? functional && p > 0.9
            ? "recovering"
            : "impaired-or-pending"
          : "baseline",
        glycerolCompartment: "cytoplasm",
        transcriptionCompartment: "nucleus",
      };
    }
    update(0);
    return {
      group,
      materials: k.materialInventory(),
      update,
      labels,
      camera: { position: [0, 0.5, 12.7], target: [0, 0, 0] },
    };
  },
};
export default model;
