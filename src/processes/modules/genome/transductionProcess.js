import { rodCutaway, phageSurface, nucleoidDuplex } from "./envelopeDetail.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

export default {
  id: "transduction",
  title: b("噬菌体介导的转导", "Phage-mediated transduction"),
  duration: 36,
  intro: b(
    "以大肠杆菌为供体和受体，比较 P1 广义转导与 λ 局限性转导。控制项切换 DNA 来源、包装内容和尾部形态。本动画放大一次少见的转导事件，省略正常噬菌体后代及辅助功能；注入并不保证稳定遗传。",
    "Compare P1 generalized and λ specialized transduction between E. coli cells. The control changes DNA origin, packaged cargo and tail morphology. One rare transducing event is enlarged; ordinary progeny and supporting functions are omitted. Delivery does not guarantee stable inheritance.",
  ),
  controls: [
    {
      id: "route",
      label: b("转导类型", "Transduction route"),
      default: "p1",
      options: [
        { value: "p1", label: b("P1 · 广义转导", "P1 · generalized") },
        { value: "lambda", label: b("λ · 局限性转导", "λ · specialized") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("两种不同起点", "Two distinct starting points"),
      description: b(
        "P1 分支从裂解生长中的包装阶段开始，不画染色体整合的 P1。λ 分支从整合在大肠杆菌染色体上的前噬菌体开始，邻近细菌基因为金色。",
        "P1 starts during packaging in lytic growth; no integrated P1 is depicted. The λ branch begins with a chromosomal prophage next to a gold bacterial locus.",
      ),
    },
    {
      at: 0.16,
      title: b("供体 DNA 进入转移路径", "Donor DNA enters the transfer route"),
      description: b(
        "P1 偶尔误包装细菌 DNA，来源不局限于整合位点附近。λ 则因罕见的不精确切出带走邻近基因，例如 gal，同时丢失部分噬菌体序列。",
        "P1 occasionally packages bacterial DNA without restriction to a prophage-adjacent locus. Rare imprecise λ excision instead captures a neighboring locus such as gal while losing some phage sequence.",
      ),
    },
    {
      at: 0.34,
      title: b("不同的头部内容", "Different capsid contents"),
      description: b(
        "P1 转导颗粒中示意为细菌 DNA；λ 颗粒中为噬菌体与邻近细菌 DNA 的杂合分子。后者可能需要辅助噬菌体功能，图中未展开。",
        "The P1 transducing particle contains bacterial DNA; the λ particle contains a phage–bacterial hybrid. The latter may require helper functions, omitted here.",
      ),
    },
    {
      at: 0.51,
      title: b("裂解释放与传播", "Release and transfer"),
      description: b(
        "供体裂解释放颗粒；转导颗粒抵达另一个有相容受体的大肠杆菌。噬菌体结构仅作放大示意。",
        "Donor lysis releases particles. A transducing particle reaches another E. coli cell with a compatible receptor. Phage structures are enlarged schematics.",
      ),
    },
    {
      at: 0.71,
      title: b("DNA 注入受体", "DNA enters the recipient"),
      description: b(
        "DNA 沿尾部进入受体，蛋白衣壳留在外部。金色供体序列可以由噬菌体颗粒跨细胞传递，不需要细菌直接接触。",
        "DNA passes through the tail into the recipient while the capsid remains outside. Phage particles transfer gold donor sequences without direct bacterial contact.",
      ),
    },
    {
      at: 0.9,
      title: b("进入不等于稳定获得", "Delivery is not stable acquisition"),
      description: b(
        "本模型止于 DNA 进入。稳定遗传还取决于重组、建立和选择等条件；P1 的可转移位点范围广，经典 λ 局限性转导仅携带切出位点邻近基因。",
        "The model ends at DNA delivery. Stable inheritance requires further establishment or recombination. P1 can transfer many loci; classical λ specialized transduction carries loci adjacent to the excision site.",
      ),
    },
  ],
  sources: [
    {
      title: "Generalized transduction — E. coli/P1 systems",
      url: "https://pubmed.ncbi.nlm.nih.gov/19066827/",
    },
    {
      title: "Bacteriophage Lambda Site-Specific Recombination",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11096046/",
    },
    {
      title: "Genome of Bacteriophage P1",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC523184/",
    },
  ],
  create({ rootId = "bacterium" } = {}) {
    const k = sceneKit(),
      { group } = k;
    const host = k.material("#7d9698"),
      gold = k.material("#c3a265"),
      viral = k.material("#a18cae"),
      env = k.material("#8aa9a0", {
        transparent: true,
        opacity: 0.19,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      shell = k.material("#9b91aa", {
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
      tailmat = k.material("#9d91aa");
    const extraMaterials = [];
    const cells = [];
    for (const x of [-2.65, 2.65]) {
      const g = new THREE.Group();
      group.add(g);
      g.position.x = x;
      const m = k.mesh(
        new THREE.CapsuleGeometry(0.9, 1.35, 8, 32),
        env,
        [0, 0, 0],
        g,
      );
      m.rotation.z = Math.PI / 2;
      m.visible = false;
      extraMaterials.push(...rodCutaway(g, 1.35, 0.9).materials);
      cells.push(g);
    }
    const dna = [];
    const recipient = [];
    for (let i = 0; i < 48; i++) {
      const a = (i * Math.PI * 2) / 48,
        z = ((i + 1) * Math.PI * 2) / 48;
      dna.push(
        k.segment(
          [-2.65 + 1.08 * Math.cos(a), 0.45 * Math.sin(a), 0.12],
          [-2.65 + 1.08 * Math.cos(z), 0.45 * Math.sin(z), 0.12],
          0.048,
          host,
        ),
      );
      recipient.push(
        k.segment(
          [2.65 + 1.08 * Math.cos(a), 0.45 * Math.sin(a), 0.12],
          [2.65 + 1.08 * Math.cos(z), 0.45 * Math.sin(z), 0.12],
          0.048,
          host,
        ),
      );
    }
    const donorDetailed = nucleoidDuplex(group, -2.65),
      recipientDetailed = nucleoidDuplex(group, 2.65);
    extraMaterials.push(
      ...donorDetailed.materials,
      ...recipientDetailed.materials,
    );
    recipient.forEach((m) => (m.visible = false));
    const cutMarks = [
      k.segment([-2.55, 0.15, 0.25], [-2.35, 0.7, 0.25], 0.035, gold),
      k.segment([-3.62, 0.15, 0.25], [-3.42, 0.7, 0.25], 0.035, gold),
    ];
    const phage = new THREE.Group();
    group.add(phage);
    const head = k.mesh(
      new THREE.IcosahedronGeometry(0.43, 1),
      shell,
      [0, 0, 0],
      phage,
    );
    head.rotation.z = 0.1;
    head.visible = false;
    const capsidDetail = phageSurface(phage);
    extraMaterials.push(...capsidDetail.materials);
    const shaft = k.segment(
      [0, -0.36, 0],
      [0, -1.06, 0],
      0.055,
      tailmat,
      phage,
    );
    const sheath = k.segment([0, -0.4, 0], [0, -0.98, 0], 0.12, tailmat, phage);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      k.segment(
        [0, -1, 0],
        [0.28 * Math.cos(a), -1.2, 0.28 * Math.sin(a)],
        0.02,
        tailmat,
        phage,
      );
    }
    // One ordered DNA contour. Each material segment has one physical
    // location as it moves from head through tail into the recipient.
    const cargo = Array.from({ length: 96 }, (_, i) => {
      const m = k.segment([0, 0, 0], [0, 0.01, 0], 0.023, gold, phage);
      m.name = `transferred-DNA-segment-${i}`;
      return m;
    });
    const debris = [];
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI * 2) / 14;
      const m = k.segment(
        [-2.65 + 1.4 * Math.cos(a), 0.8 * Math.sin(a), -0.1],
        [-2.65 + 1.55 * Math.cos(a + 0.13), 0.9 * Math.sin(a + 0.13), -0.1],
        0.06,
        host,
      );
      debris.push(m);
    }
    const up = new THREE.Vector3(0, 1, 0),
      d = new THREE.Vector3();
    const pose = (m, a, z, r) => {
      d.set(z[0] - a[0], z[1] - a[1], z[2] - a[2]);
      m.position.set((a[0] + z[0]) / 2, (a[1] + z[1]) / 2, (a[2] + z[2]) / 2);
      m.scale.set(r, Math.max(0.0001, d.length()), r);
      m.quaternion.setFromUnitVectors(up, d.normalize());
    };
    const labels = [
      k.label([-2.65, -1.3, 0], "供体 · 大肠杆菌", "Donor · E. coli", 2),
      k.label([2.65, -1.3, 0], "受体 · 大肠杆菌", "Recipient · E. coli", 2),
      k.label(
        [-2.65, 1.2, 0],
        "P1：误包装细菌 DNA",
        "P1: bacterial DNA mispackaging",
        3,
      ),
      k.label(
        [-2.65, 1.2, 0],
        "λ：前噬菌体与邻近 gal",
        "λ prophage beside gal",
        3,
      ),
      k.label([0, 2.6, 0], "转导颗粒", "Transducing particle", 2),
      k.label([2.65, 0.1, 0.5], "进入的供体 DNA", "Delivered donor DNA", 3),
      k.label(
        [2.65, 1.2, 0.4],
        "稳定遗传尚未建立",
        "Stable inheritance not yet established",
        2,
      ),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        special = parameters.route === "lambda",
        extract = ease(p, 0.16, 0.33),
        pack = ease(p, 0.34, 0.48),
        travel = ease(p, 0.55, 0.7),
        inject = ease(p, 0.73, 0.91);
      cells[0].visible = p < 0.54;
      dna.forEach((m, i) => {
        m.material = special
          ? i >= 4 && i < 16
            ? viral
            : i >= 16 && i < 22
              ? gold
              : host
          : i >= 16 && i < 22
            ? gold
            : host;
        m.visible =
          p < 0.54 &&
          !(
            p > 0.23 &&
            ((special && i >= 4 && i < 22) || (!special && i >= 16 && i < 22))
          );
      });
      donorDetailed.update(p, special, true);
      recipientDetailed.update(p, false, false);
      dna.forEach((m) => (m.visible = false));
      cutMarks.forEach((m) => {
        m.visible = special && p > 0.17 && p < 0.31;
      });
      phage.visible = p > 0.23;
      phage.position.set(
        -2.9 + travel * 5.55,
        0.05 + travel * 2.05 + Math.sin(travel * Math.PI) * 1.1,
        0,
      );
      phage.rotation.z = (Math.PI / 2) * (1 - travel);
      phage.name = "packaging-and-delivery-virion";
      sheath.visible = !special;
      capsidDetail.sleeve.visible = !special;
      capsidDetail.sleeve.scale.y = 1 - 0.38 * inject;
      capsidDetail.sleeve.position.y = -0.17 * inject;
      sheath.scale.x = sheath.scale.z = 0.12;
      sheath.scale.y = 0.58 * (1 - 0.38 * inject);
      sheath.position.y = -0.69 + 0.11 * inject;
      shaft.scale.x = shaft.scale.z = special ? 0.036 : 0.055;
      const cargoPath = (s) => {
        const u = s - 1.35 * inject;
        if (u < -0.22) {
          const v = -u - 0.22;
          return [
            0.42 * Math.sin(Math.max(0, v - 0.16) * 7),
            -1.2 - 0.65 * v,
            0,
          ];
        }
        if (u < 0) return [0, -0.43 + (u / 0.22) * 0.77, 0];
        const r = 0.22 * Math.sin((Math.min(1, u / 0.15) * Math.PI) / 2);
        const coiled = [
          r * Math.cos(u * Math.PI * 6),
          -0.43 + 0.65 * u,
          r * Math.sin(u * Math.PI * 6),
        ];
        // Packaging stays within the donor cutaway, before donor lysis.
        const uncoiled = [-0.42 + 0.84 * s, 0.15, 0.18];
        return coiled.map((v, i) => uncoiled[i] + (v - uncoiled[i]) * pack);
      };
      cargo.forEach((m, i) => {
        pose(
          m,
          cargoPath(i / cargo.length),
          cargoPath((i + 1) / cargo.length),
          0.023,
        );
        m.material = special && i >= 32 ? viral : gold;
        m.visible = p > 0.23;
      });
      debris.forEach((m, i) => {
        m.visible = p >= 0.54 && p < 0.83;
        const a = (i * Math.PI * 2) / 14,
          s = ease(p, 0.54, 0.83);
        m.position.x =
          -2.65 +
          (m.userData.baseX ?? (m.userData.baseX = m.position.x + 2.65)) *
            (1 + s * 0.3);
        m.position.y =
          (m.userData.baseY ?? (m.userData.baseY = m.position.y)) *
          (1 + s * 0.4);
      });
      labels[2].active = !special && p < 0.5;
      labels[3].active = special && p < 0.5;
      labels[4].active = p > 0.48 && p < 0.74;
      labels[4].position[0] = phage.position.x;
      labels[4].position[1] = phage.position.y + 0.65;
      labels[5].active = p > 0.77;
      labels[6].active = p > 0.92;
      group.userData = {
        rootId,
        organism: "Escherichia coli",
        route: special ? "lambda-specialized" : "P1-generalized",
        integratedProphage: special && p < 0.23,
        packagedCargo: special
          ? "phage-plus-adjacent-bacterial-DNA"
          : "bacterial-DNA",
        geneScope: special
          ? "prophage-adjacent-gal-example"
          : "many-chromosomal-loci",
        delivered: inject === 1,
        stableInheritanceShown: false,
      };
    }
    update(0);
    return {
      group,
      materials: [host, gold, viral, env, shell, tailmat, ...extraMaterials],
      update,
      labels,
      camera: { position: [0, 2.7, 12.7], target: [0, 0.55, 0] },
    };
  },
};
