import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

import { molecularDetail } from "./molecularDetail.js";

export default {
  id: "proteasome",
  title: b("泛素–蛋白酶体降解", "Ubiquitin–proteasome degradation"),
  duration: 36,
  intro: b(
    "细胞质中的单端加帽 26S 蛋白酶体示意。选择一种带 K48 型多聚泛素且具有可接近起始区的底物；该通路在动物、植物及酵母中保守。开放的前侧用于观察真实的轴向通道。",
    "A schematic singly capped 26S proteasome in the cytosol. The selected substrate carries a K48-linked polyubiquitin chain and an accessible initiation region. This pathway is conserved in animals, plants, and yeast. The open front reveals the axial channel.",
  ),
  controls: [
    {
      id: "tag",
      label: b("底物标记", "Substrate tag"),
      default: "ubiquitin",
      options: [
        {
          value: "ubiquitin",
          label: b("K48 多聚泛素标记", "K48 polyubiquitin tag"),
        },
        { value: "untagged", label: b("无标记对照", "Untagged comparison") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("可识别的底物", "A recognizable substrate"),
      description: b(
        "示例从已带泛素链的蛋白开始，省略 E1、E2、E3 标记反应。并非所有泛素修饰都意味着降解。",
        "The example starts with an already ubiquitylated protein and omits E1, E2, and E3 tagging reactions. Not every ubiquitin modification signals degradation.",
      ),
    },
    {
      at: 0.16,
      title: b("19S 识别与起始", "19S recognition and initiation"),
      description: b(
        "19S 受体结合泛素链，ATPase 马达捕获可接近的非折叠起始区。本例无标记对照不被有效招募；这不是对全部底物的普遍规则。",
        "19S receptors bind the ubiquitin chain and the ATPase motor captures an accessible unstructured initiation region. The untagged comparison is not efficiently recruited here; this is not a universal rule for all substrates.",
      ),
    },
    {
      at: 0.34,
      title: b("展开与移除泛素", "Unfold and remove ubiquitin"),
      description: b(
        "ATP 驱动的六聚体马达拉动多肽并使折叠结构展开。入口附近的 Rpn11 切除泛素链，与底物转运相协调。",
        "The ATP-driven hexameric motor pulls the polypeptide and unfolds folded domains. Rpn11 near the entrance removes the ubiquitin chain in coordination with substrate translocation.",
      ),
    },
    {
      at: 0.52,
      title: b("穿过轴向通道", "Pass through the axial channel"),
      description: b(
        "展开的多肽经过开放的 α 环闸门进入 20S 核心。由外到内依次为 α–β–β–α 四层七聚体环；β 环催化位点朝向内腔。",
        "The unfolded chain passes the open α-ring gate into the 20S core. Four heptameric rings form an α–β–β–α stack, with catalytic sites on β subunits facing the chamber.",
      ),
    },
    {
      at: 0.72,
      title: b("蛋白水解", "Proteolysis"),
      description: b(
        "内腔的催化位点将多肽切成短肽。输出是短肽，不是直接完成全部氨基酸回收；后续肽酶步骤未展示。",
        "Catalytic sites inside the chamber cleave the chain into short peptides. The output is peptides rather than complete amino-acid recycling; downstream peptidases are omitted.",
      ),
    },
    {
      at: 0.9,
      title: b("泛素回收", "Ubiquitin recycling"),
      description: b(
        "移除的泛素链可由去泛素化酶拆解并回收。动画将此后续过程画在入口旁；未显示具体酶。无标记对照保持完整。",
        "The removed ubiquitin chain can be disassembled by deubiquitylating enzymes and recycled. This downstream step is shown beside the entrance without a specific enzyme. The untagged comparison remains intact.",
      ),
    },
  ],
  sources: [
    {
      title:
        "de la Pena et al. 2018: Substrate-engaged 26S proteasome structures",
      url: "https://www.lander-lab.com/pdfs/30309908.pdf",
    },
    {
      title:
        "Proteasome in action: substrate degradation by the 26S proteasome",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8106498/",
    },
    {
      title: "Structure and Function of the 26S Proteasome",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6422034/",
    },
  ],
  create({ rootId = "cell" } = {}) {
    const k = sceneKit(),
      { group } = k;
    const alpha = k.material("#8ca7b2"),
      beta = k.material("#a1b8ac"),
      motorMat = k.material("#718f9d"),
      lidMat = k.material("#b8ac86"),
      ubMat = k.material("#b3956b"),
      substrate = k.material("#ae86a0"),
      peptide = k.material("#bd999f"),
      active = k.material("#be805c");
    const detail = molecularDetail(k);
    // Physical annular segments expose the axial cavity. One front sector per ring is cut away.
    const shell = new THREE.Group();
    group.add(shell);
    for (let layer = 0; layer < 4; layer++) {
      for (let i = 0; i < 7; i++) {
        const angle = (i * Math.PI * 2) / 7 + 0.18;
        const front = Math.sin(angle) > 0.62;
        // Solid protein-subunit volumes meet at their radial and axial faces.
        // Only the identified front sectors are omitted as an observation cutaway.
        const half = Math.PI / 7,
          shape = new THREE.Shape();
        const begin = angle - half,
          end = angle + half;
        shape.moveTo(0.5 * Math.cos(begin), 0.5 * Math.sin(begin));
        shape.lineTo(1.24 * Math.cos(begin), 1.24 * Math.sin(begin));
        shape.absarc(0, 0, 1.24, begin, end, false);
        shape.lineTo(0.5 * Math.cos(end), 0.5 * Math.sin(end));
        shape.absarc(0, 0, 0.5, end, begin, true);
        shape.closePath();
        const volume = k.mesh(
          new THREE.ExtrudeGeometry(shape, {
            depth: 0.62,
            bevelEnabled: false,
            curveSegments: 12,
          }),
          layer === 0 || layer === 3 ? alpha : beta,
          [0, 0.36 - layer * 0.62, 0],
          shell,
        );
        volume.rotation.x = Math.PI / 2;
        volume.name = `20S protein volume ${layer} ${i}`;
        volume.visible = !front;
        const subunit = detail.fold(
          shell,
          `${layer === 0 || layer === 3 ? "alpha" : "beta"}-${layer}-${i}`,
          [Math.cos(angle) * 1.11, 0.05 - layer * 0.62, Math.sin(angle) * 1.11],
          [0.35, 0.34, 0.22],
          layer === 0 || layer === 3 ? alpha : beta,
          layer === 0 || layer === 3 ? motorMat : lidMat,
          { sheetCount: 4, helixCount: 2 },
        );
        subunit.rotation.y = -angle + Math.PI / 2;
        subunit.visible = !front;
        if (front)
          k.segment(
            [Math.cos(angle) * 1.1, 0.3 - layer * 0.62, Math.sin(angle) * 1.1],
            [Math.cos(angle) * 1.1, -0.2 - layer * 0.62, Math.sin(angle) * 1.1],
            0.025,
            layer === 0 || layer === 3 ? alpha : beta,
            shell,
          );
      }
    }
    const catalytic = [];
    for (const y of [-0.57, -1.19])
      for (let i = 0; i < 3; i++) {
        const a = Math.PI + (i * Math.PI) / 3;
        catalytic.push(
          k.ball(
            [Math.cos(a) * 0.65, y, Math.sin(a) * 0.65],
            [0.11, 0.1, 0.1],
            active,
          ),
        );
      }
    catalytic.forEach((mesh, index) => {
      mesh.name = `beta catalytic site ${index}`;
    });
    const motor = [],
      poreLoops = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        unit = new THREE.Group();
      unit.name = `Rpt ATPase ${i + 1}`;
      group.add(unit);
      unit.position.set(Math.cos(a) * 0.83, 0.8, Math.sin(a) * 0.83);
      unit.rotation.y = -a + Math.PI / 2;
      detail.fold(
        unit,
        "AAA large domain",
        [0, 0, 0],
        [0.4, 0.38, 0.4],
        motorMat,
        alpha,
        { sheetCount: 3, helixCount: 2 },
      );
      detail.fold(
        unit,
        "AAA small helical domain",
        [0.26, 0.24, -0.05],
        [0.23, 0.24, 0.24],
        motorMat,
        lidMat,
        { sheetCount: 0, helixCount: 3 },
      );
      k.ball([-0.23, 0.18, 0.24], [0.08, 0.09, 0.035], active, unit);
      for (let j = 0; j < 3; j++)
        k.ball([-0.23 + j * 0.063, 0.28, 0.24], 0.034, lidMat, unit);
      motor.push(unit);
      const loop = k.tube(
        [
          [Math.cos(a) * 0.62, 0.77, Math.sin(a) * 0.62],
          [Math.cos(a) * 0.41, 0.73, Math.sin(a) * 0.41],
          [Math.cos(a) * 0.065, 0.68, Math.sin(a) * 0.065],
        ],
        0.05,
        lidMat,
      );
      loop.name = `ATPase pore loop ${i}`;
      poreLoops.push(loop);
    }
    const gate = [];
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      const m = k.mesh(new THREE.BoxGeometry(0.41, 0.075, 0.1), alpha, [
        Math.cos(a) * 0.37,
        0.21,
        Math.sin(a) * 0.37,
      ]);
      m.rotation.y = -a;
      gate.push(m);
    }
    // Regulatory lid arches beside the motor, not a second sealed chamber.
    k.tube(
      [
        [-1.07, 0.6, -0.25],
        [-1.43, 1.24, -0.32],
        [-0.92, 1.7, -0.28],
        [-0.18, 1.45, -0.27],
      ],
      0.19,
      lidMat,
    );
    k.ball([-1.14, 1.65, -0.16], [0.34, 0.25, 0.28], lidMat);
    k.ball([-0.14, 1.35, 0.1], [0.24, 0.14, 0.22], active); // Rpn11
    const receptor = k.ball([-1.28, 1.88, 0.18], [0.23, 0.19, 0.17], ubMat);
    detail.fold(
      group,
      "ubiquitin receptor",
      [-1.28, 1.88, 0.18],
      [0.3, 0.26, 0.25],
      ubMat,
      lidMat,
      { sheetCount: 3, helixCount: 1 },
    );
    detail.fold(
      group,
      "Rpn11 catalytic domain",
      [-0.14, 1.35, 0.1],
      [0.26, 0.2, 0.23],
      active,
      lidMat,
      { sheetCount: 3, helixCount: 1 },
    );
    detail.fold(
      group,
      "19S lid scaffold",
      [-1.05, 1.1, -0.5],
      [0.48, 0.58, 0.38],
      lidMat,
      alpha,
      { sheetCount: 4, helixCount: 2 },
    );
    const residues = [],
      links = [],
      original = [];
    for (let i = 0; i < 42; i++) {
      const u = i * 0.1,
        folded = Math.max(0, u - 0.8);
      const pos = [
        -2.5 + 0.3 * Math.sin(folded * 8),
        1.45 + 0.68 + Math.min(u, 0.8) + folded * 0.45,
        0.18 + 0.22 * Math.sin(folded * 6),
      ];
      original.push(pos);
      residues.push(k.ball(pos, 0.073, substrate));
      residues.at(-1).name = `substrate residue ${i}`;
      if (i > 0) {
        links.push(k.segment(original[i - 1], pos, 0.039, substrate));
        links.at(-1).name = `substrate peptide bond ${i - 1}`;
      }
    }
    const ubiquitin = [],
      ubLinks = [];
    for (let i = 0; i < 4; i++) {
      const m = detail.fold(
        group,
        `ubiquitin ${i + 1}`,
        [-3.08 - i * 0.22, 2.85 + i * 0.2, 0.2],
        [0.19, 0.18, 0.17],
        ubMat,
        lidMat,
        { sheetCount: 3, helixCount: 1 },
      );
      ubiquitin.push(m);
      if (i)
        ubLinks.push(
          k.segment(
            [-3.08 - (i - 1) * 0.22, 2.85 + (i - 1) * 0.2, 0.2],
            [-3.08 - i * 0.22, 2.85 + i * 0.2, 0.2],
            0.036,
            ubMat,
          ),
        );
    }
    const attachment = k.segment(
      [-2.92, 2.84, 0.2],
      [-3.08, 2.85, 0.2],
      0.036,
      ubMat,
    );
    attachment.name = "substrate ubiquitin linkage";
    const peptides = [];
    for (let j = 0; j < 7; j++) {
      const g = new THREE.Group();
      group.add(g);
      k.tube(
        [
          [-0.12, 0, 0],
          [0, 0.05, 0.03],
          [0.13, -0.03, 0],
          [0.21, 0.02, -0.03],
        ],
        0.047,
        peptide,
        g,
      );
      g.name = `product peptide ${j}`;
      peptides.push(g);
    }
    const labels = [
      k.label(
        [-2.8, 3.9, 0],
        "已标记底物 · 可接近起始区",
        "Tagged substrate · accessible initiation region",
        2,
      ),
      k.label([-3.2, 2.1, 0.3], "K48 多聚泛素", "K48 polyubiquitin", 2),
      k.label(
        [1.55, 0.85, 0],
        "19S · ATPase 六聚体",
        "19S · ATPase hexamer",
        3,
      ),
      k.label([1.75, -0.85, 0], "20S · α–β–β–α", "20S · α–β–β–α", 3),
      k.label([-1.65, -0.8, 0.4], "β 催化腔", "β catalytic chamber", 2),
      k.label([0.6, 1.65, 0.2], "Rpn11", "Rpn11", 2),
      k.label([1.7, -2.5, 0], "短肽释放", "Peptide release", 2),
      k.label([-2.65, 2.9, 0.3], "泛素回收", "Ubiquitin recycling", 2),
    ];
    const va = new THREE.Vector3(),
      vb = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    const connect = (m, a, z) => {
      va.copy(z).sub(a);
      m.position.copy(a).add(z).multiplyScalar(0.5);
      m.scale.set(0.039, Math.max(va.length(), 1e-6), 0.039);
      m.quaternion.setFromUnitVectors(up, va.normalize());
    };
    const update = (value, parameters = {}) => {
      const p = clamp(value),
        tagged = parameters.tag !== "untagged",
        dock = tagged ? ease(p, 0.07, 0.3) : 0,
        // Residue 12 reaches the Rpn11 linkage position before chain release.
        travel = tagged
          ? 0.53 * ease(p, 0.3, 0.48) + 4.7 * ease(p, 0.5, 0.93)
          : 0,
        feed = travel / 5.23,
        release = tagged ? ease(p, 0.48, 0.64) : 0,
        recycle = tagged ? ease(p, 0.83, 1) : 0;
      residues.forEach((m, i) => {
        const u = i * 0.1 - travel,
          folded = Math.max(0, u - 0.8);
        const engaged = new THREE.Vector3(
          0.3 * Math.sin(folded * 8),
          0.68 + Math.min(u, 0.8) + folded * 0.45,
          0.22 * Math.sin(folded * 6),
        );
        m.position.fromArray(original[i]).lerp(engaged, dock);
        m.visible = !tagged || m.position.y > -0.85;
      });
      links.forEach((m, i) => {
        connect(m, residues[i].position, residues[i + 1].position);
        m.visible = residues[i].visible && residues[i + 1].visible;
      });
      ubiquitin.forEach((m, i) => {
        m.visible = tagged;
        const anchor = residues[12].position;
        const atCut = new THREE.Vector3(-0.28 - i * 0.22, 1.35 + i * 0.2, 0.1);
        const attached = new THREE.Vector3(
          anchor.x - 0.28 - i * 0.22,
          anchor.y + i * 0.2,
          anchor.z + 0.1,
        );
        const free = new THREE.Vector3(
          -1.98 - i * 0.22 - recycle * i * 0.12,
          3 + i * 0.2 + recycle * Math.sin(i) * 0.3,
          0.2 + recycle * i * 0.15,
        );
        m.position.copy(
          p <= 0.48 ? attached : atCut.clone().lerp(free, release),
        );
      });
      ubLinks.forEach((m, i) => {
        connect(m, ubiquitin[i].position, ubiquitin[i + 1].position);
        m.visible = tagged && recycle < 0.15;
      });
      vb.copy(residues[12].position);
      connect(attachment, vb, ubiquitin[0].position);
      attachment.visible = tagged && p <= 0.48;
      gate.forEach((m, i) => {
        const a = (i * Math.PI * 2) / 7,
          r = 0.37 + dock * 0.31;
        m.position.set(Math.cos(a) * r, 0.21, Math.sin(a) * r);
        m.rotation.y = -a + dock * 0.7;
      });
      motor.forEach((m, i) => {
        m.position.y =
          0.75 +
          (tagged && p > 0.3 && p < 0.91 ? Math.sin(p * 45 + i) * 0.04 : 0);
      });
      poreLoops.forEach((m, i) => {
        m.position.y =
          tagged && p > 0.3 && p < 0.91 ? Math.sin(p * 45 + i) * 0.075 : 0;
      });
      peptides.forEach((m, j) => {
        const q = ease(p, 0.65 + j * 0.018, 0.82 + j * 0.023);
        m.visible = tagged && q > 0;
        const axial = Math.min(q / 0.65, 1),
          outside = Math.max(0, (q - 0.65) / 0.35);
        m.position.set(
          (j % 2 ? 1 : -1) * outside * (0.6 + j * 0.1),
          -1.05 - axial * 1.35 - outside * 0.35,
          outside * (j % 3) * 0.1,
        );
        m.rotation.z = (j - 3) * 0.3 * outside;
      });
      catalytic.forEach((m) => {
        const activation = 1 + (tagged ? feed * 0.14 : 0);
        m.scale.set(0.11 * activation, 0.1 * activation, 0.1 * activation);
      });
      labels[0].text = tagged
        ? b(
            "已标记底物 · 可接近起始区",
            "Tagged substrate · accessible initiation region",
          )
        : b(
            "无标记底物 · 本例不招募",
            "Untagged substrate · not recruited here",
          );
      labels[1].active = tagged && release < 0.5;
      labels[7].active = tagged && release > 0.5;
      labels[6].active = tagged && p > 0.65;
      group.userData = {
        structuralDetail:
          "28 folded core subunits, six bilobed ATPases, inward pore loops, schematic secondary structures",
        process: "proteasome",
        rootId,
        compartment: "cytosol",
        substrate: tagged ? "K48 polyubiquitylated" : "untagged comparison",
        ringTopology: "alpha7-beta7-beta7-alpha7",
        motorSubunits: 6,
        tagReleased: release === 1,
        gateOpen: dock > 0.8,
        translocation: "19S to axial 20S chamber",
        peptidesReleased: peptides.filter((m) => m.visible).length,
        ubiquitinRecycled: recycle === 1,
        complete: p === 1,
      };
    };
    update(0);
    return {
      group,
      materials: detail.inventory(group),
      update,
      labels,
      camera: { position: [4.1, 2.5, 10], target: [-0.35, 0.55, 0] },
    };
  },
};
