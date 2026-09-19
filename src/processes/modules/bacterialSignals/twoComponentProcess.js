import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { helix, bilayer, transcriptionDetail } from "./structuralDetails.js";
export default {
  id: "twoComponent",
  title: b("双组分信号：NarX–NarL", "Two-component signaling: NarX–NarL"),
  intro: b(
    "以厌氧条件下的大肠杆菌为例：硝酸盐结合内膜 NarX 的周质侧感受域，经组氨酸到天冬氨酸的磷酸转移调节转录。本图聚焦 NarX–NarL 支路，并假定厌氧调节因子 FNR 已具活性；省略 NarQ/NarP 交叉调控。",
    "In anaerobic E. coli, nitrate binds the periplasmic sensor of inner-membrane NarX. Histidine-to-aspartate phosphotransfer regulates transcription. This scene isolates the NarX–NarL branch, assumes active anaerobic regulator FNR, and omits NarQ/NarP cross-regulation.",
  ),
  duration: 32,
  controls: [
    {
      id: "nitrate",
      label: b("周质硝酸盐", "Periplasmic nitrate"),
      default: "present",
      options: [
        { value: "present", label: b("存在", "Present") },
        { value: "absent", label: b("缺少", "Absent") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("内膜两侧", "Across the inner membrane"),
      description: b(
        "NarX 二聚体跨越内膜；感受域位于周质，催化域位于胞质。图中上方不是细胞外空间。",
        "The NarX dimer spans the inner membrane, with a periplasmic sensor and cytoplasmic catalytic domains. The upper compartment is not the extracellular space.",
      ),
    },
    {
      at: 0.16,
      title: b("配体结合", "Ligand binding"),
      description: b(
        "硝酸盐结合于 NarX 两亚基间的感受口袋，并改变跨膜信号状态。选择缺少硝酸盐可比较未增强的支路。",
        "Nitrate binds a sensor pocket between NarX subunits and changes transmembrane signaling. Select absent nitrate to compare the unstimulated branch.",
      ),
    },
    {
      at: 0.34,
      title: b("组氨酸自磷酸化", "Histidine autophosphorylation"),
      description: b(
        "胞质侧激酶利用 ATP，将磷酸基团加到 NarX 的保守组氨酸上，留下 ADP。",
        "The cytoplasmic kinase uses ATP to phosphorylate a conserved NarX histidine, leaving ADP.",
      ),
    },
    {
      at: 0.51,
      title: b("转移到响应调节蛋白", "Transfer to the response regulator"),
      description: b(
        "NarL 接收域先与 NarX 接触，随后磷酸基团由 His 直接转移到保守 Asp；NarL-P 再离开。这是典型两步磷酸转移，不是多级 His–Asp–His–Asp 磷酸接力。",
        "The NarL receiver first contacts NarX; the phosphoryl group transfers directly from His to conserved Asp before NarL-P departs. This is canonical two-step phosphotransfer, not a multistep His–Asp–His–Asp phosphorelay.",
      ),
    },
    {
      at: 0.7,
      title: b("调节 DNA 上的转录", "Regulating transcription on DNA"),
      description: b(
        "NarL-P 结合调控 DNA。在厌氧调节背景下，它促进 narGHJI 硝酸还原酶基因簇的表达。",
        "NarL-P binds regulatory DNA. In the anaerobic regulatory context it promotes expression of the narGHJI nitrate-reductase cluster.",
      ),
    },
    {
      at: 0.9,
      title: b("响应取决于环境", "An environment-dependent response"),
      description: b(
        "新 RNA 从 5′ 端向 3′ 端延长。无硝酸盐时不显示这次增强表达事件；基础激酶活性及其他支路并未被设为零。",
        "New RNA extends from 5′ toward 3′. Without nitrate, this enhanced-expression event is absent; basal kinase activity and other branches are not assumed to be zero.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Structural Analysis of Ligand Stimulation of the Histidine Kinase NarX",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3749045/",
    },
    {
      title:
        "Signal-Dependent Phosphorylation of the Membrane-Bound NarX Two-Component Sensor-Transmitter Protein",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC94037/",
    },
    {
      title:
        "Synthetic lac operator substitutions for studying nitrate- and nitrite-responsive Nar systems",
      url: "https://pubmed.ncbi.nlm.nih.gov/12644479/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const membrane = k.material("#b6c9ba"),
      tails = k.material("#d8dfce"),
      sensor = k.material("#719c99"),
      regulator = k.material("#ad879b"),
      gold = k.material("#cfab67"),
      dnaMat = k.material("#8b9baf"),
      rnaMat = k.material("#c28a70"),
      pale = k.material("#b8c5c4");
    bilayer(k, group, { y: 0.925, skip: (x) => x > -2.72 && x < -1.35 });
    const subunits = [];
    for (let s = 0; s < 2; s++) {
      const x = -2.4 + s * 0.55,
        g = new THREE.Group();
      group.add(g);
      g.position.x = x;
      subunits.push(g);
      // Two membrane helices per protomer connect the periplasmic sensor to the cytoplasmic kinase.
      for (const dx of [-0.1, 0.1]) {
        helix(k, g, [dx, 0.32, 0], [dx, 1.35, 0], 0.056, 9, 0.026, sensor);
        helix(k, g, [dx, 1.34, 0], [dx, 1.92, 0], 0.052, 5, 0.025, sensor);
      }
      k.tube(
        [
          [-0.1, 1.91, 0],
          [0, 2, 0.02],
          [0.1, 1.91, 0],
        ],
        0.026,
        pale,
        g,
      );
      for (const dx of [-0.1, 0.1])
        helix(
          k,
          g,
          [dx, -0.68, -0.02],
          [dx, 0.28, -0.02],
          0.047,
          8,
          0.023,
          sensor,
        );
      const side = s === 0 ? -1 : 1;
      k.ball([side * 0.34, -0.71, -0.08], [0.23, 0.25, 0.17], sensor, g);
      // ATP-binding lobe frames an exposed nucleotide pocket.
      helix(
        k,
        g,
        [side * 0.49, -0.91, 0.05],
        [side * 0.43, -0.53, 0.05],
        0.035,
        4,
        0.02,
        pale,
      );
      for (let n = 0; n < 3; n++)
        k.segment(
          [side * (0.22 + n * 0.06), -0.83, 0.1],
          [side * (0.24 + n * 0.06), -0.61, 0.11],
          0.022,
          pale,
          g,
        );
      k.tube(
        [
          [side * 0.23, -0.9, 0.05],
          [side * 0.38, -0.97, 0.08],
          [side * 0.52, -0.89, 0.05],
        ],
        0.024,
        sensor,
        g,
      );
    }

    // A nitrate icon has trigonal geometry, distinct from the phosphate marker.
    const nitrate = new THREE.Group();
    group.add(nitrate);
    k.ball([0, 0, 0], 0.095, dnaMat, nitrate);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3,
        p = [0.18 * Math.cos(a), 0.18 * Math.sin(a), 0];
      k.segment([0, 0, 0], p, 0.028, pale, nitrate);
      k.ball(p, 0.075, rnaMat, nitrate);
    }
    const atp = new THREE.Group();
    group.add(atp);
    k.ball([0, 0, 0], [0.16, 0.21, 0.12], dnaMat, atp);
    for (let i = 0; i < 3; i++)
      k.ball([0.25 + i * 0.17, 0, 0], 0.07, gold, atp);
    atp.name = "ATP-ADP";
    atp.children[3].name = "ATP-terminal-phosphate";
    atp.position.set(-3.5, -0.7, 0.2);
    const phosphate = k.ball([-2.15, -0.4, 0.35], 0.105, gold);
    const his = k.ring([-2.12, -0.4, 0.3], 0.14, 0.025, gold);
    phosphate.name = "transferred-phosphoryl-group";
    his.name = "NarX-His-site";
    const narL = new THREE.Group();
    narL.name = "NarL";
    group.add(narL);
    k.ball([0, 0, 0], [0.34, 0.28, 0.22], regulator, narL);
    k.ball([0.33, -0.2, 0], [0.24, 0.19, 0.19], regulator, narL);
    const asp = k.ring([-0.05, 0, 0.24], 0.115, 0.025, gold, narL);
    asp.name = "NarL-Asp-site";
    const acceptor = new THREE.Vector3();
    for (let i = 0; i < 3; i++)
      helix(
        k,
        narL,
        [-0.23 + i * 0.15, -0.16, 0.18],
        [-0.17 + i * 0.15, 0.14, 0.18],
        0.03,
        3,
        0.016,
        pale,
      );
    for (const dy of [-0.25, -0.12])
      helix(k, narL, [0.2, dy, 0.13], [0.48, dy, 0.13], 0.028, 3, 0.015, pale);
    const transcription = transcriptionDetail(k, group, {
      x0: -0.65,
      x1: 3.55,
      y: -2,
      radius: 0.17,
    });
    const promoter = k.ring([0.78, -2, 0.02], 0.27, 0.018, gold);
    promoter.rotation.y = Math.PI / 2;
    const labels = [
      k.label([0.5, 2.45, 0], "周质 · 硝酸盐", "Periplasm · nitrate", 2),
      k.label([2.45, 1.35, 0], "内膜", "Inner membrane", 2),
      k.label([-2.15, 2.24, 0], "NarX 感受域", "NarX sensor", 2),
      k.label([-2.25, -1.28, 0], "NarX · His", "NarX · His", 2),
      k.label([-3.35, -0.23, 0.2], "ATP → ADP", "ATP → ADP", 1),
      k.label([0.5, -0.3, 0.2], "NarL · Asp", "NarL · Asp", 2),
      k.label([2.3, -2.46, 0], "narGHJI · DNA", "narGHJI · DNA", 2),
      k.label([3.0, -0.56, 0.3], "RNA · 5′→3′", "RNA · 5′→3′", 1),
      k.label([3.05, 0.35, 0], "胞质", "Cytoplasm", 1),
      k.label([-0.73, -2.28, 0], "5′ / 3′", "5′ / 3′", 0),
      k.label([3.64, -2.23, 0], "3′ / 5′", "3′ / 5′", 0),
    ];
    function update(value, parameters = {}) {
      const p = clamp(value),
        present = parameters.nitrate !== "absent";
      const bind = present ? ease(p, 0.1, 0.27) : 0,
        encounter = present ? ease(p, 0.36, 0.46) : 0,
        transfer = present ? ease(p, 0.46, 0.62) : 0,
        dock = present ? ease(p, 0.65, 0.8) : 0;
      nitrate.visible = present;
      nitrate.position.set(-0.75 - 1.375 * bind, 2.2 - 0.53 * bind, 0.18);
      subunits[0].position.y = -0.1 * bind;
      subunits[1].position.y = 0.04 * bind;
      atp.visible = true;
      atp.children[3].visible = !(present && p >= 0.35);
      const atpApproach = present ? ease(p, 0.3, 0.35) : 0;
      // ATP gamma marker meets His before its mutually exclusive handoff.
      atp.position.set(
        -3.5 + 0.79 * atpApproach,
        -0.7 + 0.3 * atpApproach,
        0.2 + 0.1 * atpApproach,
      );
      his.visible = present && p >= 0.35 && p < 0.62;
      asp.visible = present && p >= 0.46;
      narL.position.set(
        (0.4 - 2.47 * encounter) * (1 - dock) + 0.78 * dock,
        (-0.6 + 0.2 * encounter) * (1 - dock) - 1.59 * dock,
        (0.24 + 0.36 * encounter) * (1 - dock) + 0.24 * dock,
      );
      // Face the Asp pocket toward the NarX His, at a 0.117-unit site separation.
      narL.rotation.y = Math.PI * encounter * (1 - dock);
      acceptor
        .copy(asp.position)
        .applyQuaternion(narL.quaternion)
        .add(narL.position);
      phosphate.visible = present && p >= 0.35;
      // One conserved marker crosses only the contacting active-site gap, then
      // follows NarL's Asp through rotation and departure; no free courier.
      phosphate.position.copy(his.position).lerp(acceptor, transfer);
      const extension = present ? ease(p, 0.8, 1) : 0;
      transcription.update(
        1.72 + 0.66 * extension,
        present ? ease(p, 0.78, 0.85) : 0,
        1.65 * extension,
        present && p >= 0.79,
      );
      labels[5].position = [narL.position.x, narL.position.y + 0.43, 0.5];
      labels[7].active = present && p > 0.82;
      group.userData = {
        species: "Escherichia coli",
        oxygen: "anaerobic; active FNR assumed",
        condition: present ? "nitrate-present" : "nitrate-absent",
        receptor: "inner-membrane NarX dimer",
        ligandSide: "periplasm",
        phosphotransfer: "NarX-His to NarL-Asp",
        narLPhosphorylated: present && p >= 0.62,
        promoterOccupied: present && p >= 0.8,
        enhancedTranscript: present && p > 0.8,
        basalActivityOmitted: true,
        rnaSynthesis: "5-prime to 3-prime",
        structuralDetail:
          "paired-leaflets; NarX-TM-helices-and-ATP-pocket; NarL-folds; DNA-phosphates-bases; RNAP-cleft-and-opening-bubble",
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 1, 11.8], target: [0, 0, 0] },
    };
  },
};
