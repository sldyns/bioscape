import {
  rodCutaway,
  phageSurface,
  nucleoidDuplex,
  nucleoidPoint,
} from "./envelopeDetail.js";
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
        "尾部与受体表面的入胞装置接合，DNA 沿连通的通路穿过包膜，衣壳留在外部。入胞装置是功能示意，并非已解析的完整分子结构；λ 的受体识别不等同于 DNA 穿过 LamB 的糖通道。",
        "The tail engages the surface entry apparatus, providing a connected route for DNA across the envelope while the capsid stays outside. The entry apparatus is a functional schematic, not a resolved molecular assembly; λ receptor recognition does not mean DNA passes through the LamB sugar pore.",
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
    {
      title:
        "Visualization of bacteriophage P1 infection by cryo-electron tomography",
      url: "https://pubmed.ncbi.nlm.nih.gov/21745674/",
    },
    {
      title:
        "Structural mechanism of bacteriophage lambda tail’s interaction with the bacterial receptor",
      url: "https://www.nature.com/articles/s41467-024-48686-3",
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
      tailmat = k.material("#9d91aa"),
      // The cutaway exposes the inside of the existing back-half wall. Its
      // inner face must remain visible after the surrounding P1 sheath moves.
      tailCutawayMat = k.material("#9d91aa", { side: THREE.DoubleSide });
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
      extraMaterials.push(
        ...rodCutaway(g, 1.35, 0.9, "#86a49a", { entryPort: x > 0 }).materials,
      );
      cells.push(g);
    }
    const entry = new THREE.Group();
    entry.name = "receptor-associated-trans-envelope-entry-schematic";
    entry.position.x = 2.65;
    group.add(entry);
    // An open-front protein conduit exposes its lumen. It is separate from
    // the recognition markers, so lambda DNA is not routed through a drawn
    // LamB maltose pore. The aperture is present in both envelope surfaces.
    const entryWall = k.mesh(
      new THREE.CylinderGeometry(
        0.085,
        0.085,
        0.23,
        24,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      tailCutawayMat,
      [0, 0.835, 0],
      entry,
    );
    entryWall.name = "trans-envelope-entry-conduit";
    const entryRim = k.ring([0, 0.89, 0], 0.13, 0.036, tailmat, entry);
    entryRim.rotation.x = Math.PI / 2;
    const recognitionMarkers = [];
    for (let i = 0; i < 3; i++) {
      const theta = (i * Math.PI * 2) / 3;
      const marker = k.ball(
        [0.14 * Math.cos(theta), 0.9, 0.14 * Math.sin(theta)],
        [0.06, 0.047, 0.045],
        viral,
        entry,
      );
      recognitionMarkers.push(marker);
    }
    // Closed receptor-associated gates seal the aperture before attachment;
    // lateral withdrawal exposes the same central path before cargo arrives.
    const entryGates = [1, 0.925].map((scale) => {
      const gate = k.mesh(
        new THREE.PlaneGeometry(0.36 * scale, 0.18 * scale),
        k.material("#b6c8bc", { side: THREE.DoubleSide }),
        [0, 0.9 * scale, -0.09 * scale],
        entry,
      );
      gate.rotation.x = -Math.PI / 2;
      gate.name = `recipient-entry-gate-${scale}`;
      return gate;
    });
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
    const shaft = k.mesh(
      new THREE.CylinderGeometry(1, 1, 1, 20, 1, true, Math.PI / 2, Math.PI),
      tailCutawayMat,
      [0, -0.71, 0],
      phage,
    );
    shaft.name = "transduction-tail-tube-open-lumen";
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
      const m = k.segment([0, 0, 0], [0, 0.01, 0], 0.019, gold);
      m.name = `transferred-DNA-segment-${i}`;
      return m;
    });
    const cargoPartner = Array.from({ length: 96 }, (_, i) => {
      const m = k.segment([0, 0, 0], [0, 0.01, 0], 0.019, gold);
      m.name = `transferred-DNA-partner-${i}`;
      return m;
    });
    const cargoBases = Array.from({ length: 32 }, (_, i) => {
      const m = k.segment([0, 0, 0], [0, 0.01, 0], 0.012, host);
      m.name = `transferred-DNA-base-pair-${i}`;
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
      d = new THREE.Vector3(),
      sourcePoint = new THREE.Vector3(),
      destinationPoint = new THREE.Vector3(),
      tangent = new THREE.Vector3(),
      normal = new THREE.Vector3(),
      binormal = new THREE.Vector3(),
      offset = new THREE.Vector3();
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
      k.label([3.35, 1.15, 0], "接合后的入胞通路", "Engaged entry pathway", 2),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        special = parameters.route === "lambda",
        extract = ease(p, 0.16, 0.33),
        pack = ease(p, 0.34, 0.48),
        travel = ease(p, 0.55, 0.7),
        engage = ease(p, 0.7, 0.73),
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
      cutMarks.forEach((m, i) => {
        nucleoidPoint(-2.65, (i ? 22 : 4) / 48, 0, sourcePoint);
        m.position.copy(sourcePoint);
        m.visible = special && p > 0.17 && p < 0.31;
      });
      phage.visible = p > 0.23;
      phage.position.set(
        -2.9 + travel * 5.55,
        0.05 + travel * 2.05 + Math.sin(travel * Math.PI) * 1.1,
        0,
      );
      phage.rotation.z = (Math.PI / 2) * (1 - travel);
      phage.updateMatrix();
      phage.name = "packaging-and-delivery-virion";
      sheath.visible = !special;
      capsidDetail.sleeve.visible = !special;
      capsidDetail.sleeve.scale.y = 1 - 0.38 * inject;
      capsidDetail.sleeve.position.y = -0.17 * inject;
      sheath.scale.x = sheath.scale.z = 0.12;
      sheath.scale.y = 0.58 * (1 - 0.38 * inject);
      sheath.position.y = -0.69 + 0.11 * inject;
      pose(
        shaft,
        [0, -0.43, 0],
        [0, -1.06 - (special ? 0.14 : 0.18) * engage, 0],
        special ? 0.08 : 0.085,
      );
      entryGates.forEach((gate) => {
        gate.scale.x = 1 - engage;
        gate.position.x = 0.18 * engage;
        gate.visible = engage < 1;
      });
      recognitionMarkers.forEach((marker) => {
        marker.material = special ? viral : gold;
      });
      const cargoCenter = (s) => {
        const u = s - 1.35 * inject;
        if (pack === 1 && u < -0.22) {
          const intoCell = -u - 0.22;
          const bend = Math.max(0, intoCell - 0.16);
          return [
            0.42 * Math.sin((5 * bend * bend) / (bend + 0.04)),
            -1.2 - intoCell,
            0,
          ];
        }
        if (pack === 1 && u < 0) return [0, -0.43 + (u / 0.22) * 0.77, 0];
        // Rotate a monotone helix axis while its coil radius grows. Cartesian
        // blending of a horizontal line and a vertical coil folds the contour
        // through itself midway through packaging.
        const axis = (pack * Math.PI) / 2;
        const along = (u - 0.5) * (0.84 - 0.19 * pack);
        const r = 0.22 * pack * ease(u, 0, 0.15);
        return [
          Math.cos(axis) * along +
            Math.sin(axis) * r * Math.cos(u * Math.PI * 6),
          0.15 -
            0.255 * pack +
            Math.sin(axis) * along -
            Math.cos(axis) * r * Math.cos(u * Math.PI * 6),
          0.18 * (1 - pack) + r * Math.sin(u * Math.PI * 6),
        ];
      };
      const cargoPath = (s, strand = 0) => {
        const locusT = (22 - (special ? 18 : 6) * s) / 48;
        const twist = locusT * Math.PI * 24 + strand * Math.PI;
        const helixRadius = 0.035;
        destinationPoint.set(...cargoCenter(s)).applyMatrix4(phage.matrix);
        const sourceAngle = locusT * Math.PI * 2;
        sourcePoint.set(
          -2.65 + 1.08 * Math.cos(sourceAngle),
          0.45 * Math.sin(sourceAngle),
          0.12,
        );
        sourcePoint.lerp(destinationPoint, extract);
        // Rotate the duplex frame instead of linearly mixing opposing
        // backbone offsets, which would collapse the two strands together.
        if (extract < 1) {
          const angle = sourceAngle + (Math.PI - sourceAngle) * extract;
          const radius = 0.067 + (helixRadius - 0.067) * extract;
          sourcePoint.x += radius * Math.cos(twist) * Math.cos(angle);
          sourcePoint.y += radius * Math.cos(twist) * Math.sin(angle);
          sourcePoint.z += radius * Math.sin(twist);
        } else {
          const frame = (pack * Math.PI) / 2;
          tangent.set(...cargoCenter(s + 1e-5));
          offset.set(...cargoCenter(s - 1e-5));
          tangent.sub(offset).normalize();
          normal.set(-Math.sin(frame), Math.cos(frame), 0);
          normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
          binormal.crossVectors(tangent, normal).normalize();
          offset
            .copy(normal)
            .multiplyScalar(helixRadius * Math.cos(twist))
            .addScaledVector(binormal, helixRadius * Math.sin(twist))
            .applyQuaternion(phage.quaternion);
          sourcePoint.add(offset);
        }
        return sourcePoint.toArray();
      };
      cargo.forEach((m, i) => {
        pose(
          m,
          cargoPath(i / cargo.length),
          cargoPath((i + 1) / cargo.length),
          0.019 - 0.005 * pack,
        );
        m.material = special && i >= 32 ? viral : gold;
        m.visible = true;
        pose(
          cargoPartner[i],
          cargoPath(i / cargo.length, 1),
          cargoPath((i + 1) / cargo.length, 1),
          0.019 - 0.005 * pack,
        );
        cargoPartner[i].material = m.material;
      });
      cargoBases.forEach((m, i) => {
        const s = (i + 0.5) / cargoBases.length;
        pose(m, cargoPath(s, 0), cargoPath(s, 1), 0.012);
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
      cells[0].position.toArray(labels[0].position);
      labels[0].active = cells[0].visible;
      cells[1].position.toArray(labels[1].position);
      cargo[16].position.toArray(labels[2].position);
      cargo[32].position.toArray(labels[3].position);
      labels[2].active = !special && p < 0.5;
      labels[3].active = special && p < 0.5;
      labels[4].active = p > 0.48 && p < 0.74;
      phage.position.toArray(labels[4].position);
      labels[5].position.splice(0, 3, ...cargoPath(0));
      labels[5].active = inject > 0 && labels[5].position[1] < 0.8325;
      cargo[48].position.toArray(labels[6].position);
      labels[6].active = p > 0.92;
      labels[7].position.splice(0, 3, 2.65, 0.835, 0);
      labels[7].active = p >= 0.7 && p < 0.91;
      group.userData = {
        rootId,
        organism: "Escherichia coli",
        route: special ? "lambda-specialized" : "P1-generalized",
        integratedProphage: special && extract === 0,
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
      materials: [
        host,
        gold,
        viral,
        env,
        shell,
        tailmat,
        tailCutawayMat,
        ...entryGates.map((gate) => gate.material),
        ...extraMaterials,
      ],
      update,
      labels,
      camera: { position: [0, 2.7, 12.7], target: [0, 0.55, 0] },
    };
  },
};
