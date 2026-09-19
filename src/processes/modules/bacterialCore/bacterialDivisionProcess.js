import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

import { instances } from "./bacterialGeometry.js";

const process = {
  id: "bacterialDivision",
  title: b("大肠杆菌的二分裂", "E. coli binary fission"),
  intro: b(
    "用慢生长大肠杆菌的一轮分裂，展示染色体复制与分离、分裂体装配，以及细胞包膜内陷。剖开的一侧用于看见细胞质；FtsZ 是组织支架，隔膜肽聚糖合成与包膜重塑共同完成分裂。",
    "One simplified division cycle in slowly growing E. coli shows chromosome replication and segregation, divisome assembly, and envelope invagination. A cutaway exposes the cytoplasm. FtsZ organizes the machinery; septal wall synthesis and envelope remodeling complete division.",
  ),
  duration: 36,
  controls: [
    {
      id: "septalSynthesis",
      label: b("隔膜合成条件", "Septal synthesis"),
      default: "active",
      options: [
        { value: "active", label: b("正常合成", "Active synthesis") },
        {
          value: "blocked",
          label: b("隔膜肽聚糖合成受阻", "Septal wall synthesis blocked"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b(
        "杆状细胞与环形染色体",
        "Rod-shaped cell and circular chromosome",
      ),
      description: b(
        "内膜包围细胞质，肽聚糖位于内外膜之间。染色体是折叠的环形 DNA；示意省略快速生长时的多轮复制。",
        "The inner membrane encloses cytoplasm, with peptidoglycan between inner and outer membranes. Folded circular DNA is shown; overlapping replication cycles during rapid growth are omitted.",
      ),
    },
    {
      at: 0.17,
      title: b("复制并延长", "Replication and elongation"),
      description: b(
        "从复制起点启动的两个复制叉沿环形染色体相向推进。新合成的姐妹 DNA 逐步增加，细胞同时延长。",
        "Two replication forks move in opposite directions around the circular chromosome. Newly synthesized sister DNA increases as the cell elongates.",
      ),
    },
    {
      at: 0.43,
      title: b("姐妹染色体分离", "Sister chromosomes segregate"),
      description: b(
        "复制完成的姐妹染色体进入细胞两半，使中部获得分裂空间。真实复制与分离在时间上有重叠。",
        "Replicated sister chromosomes occupy opposite cell halves, clearing the division site. In real cells replication and segregation overlap in time.",
      ),
    },
    {
      at: 0.52,
      title: b("中部装配分裂体", "The divisome assembles at midcell"),
      description: b(
        "短 FtsZ 丝段在内膜的细胞质侧形成动态支架，膜锚定蛋白及 FtsWI 等隔膜合成组分在中部组织起来。",
        "Short FtsZ filaments form a dynamic scaffold on the cytoplasmic face of the inner membrane. Membrane anchors and septal synthesis components including FtsWI organize at midcell.",
      ),
    },
    {
      at: 0.68,
      title: b("隔膜生长与包膜内陷", "Septal growth and envelope invagination"),
      description: b(
        "隔膜肽聚糖合成和重塑伴随内外膜向内收缩；FtsZ 在最终封闭之前逐步离开。若隔膜合成受阻，FtsZ 支架仍不能独自把细胞分开；对照停在早期阶段。",
        "Septal wall synthesis and remodeling accompany inward movement of both membranes; FtsZ leaves before final closure. When septal synthesis is blocked, the FtsZ scaffold alone cannot separate the cell; that condition stalls early.",
      ),
    },
    {
      at: 0.9,
      title: b("形成两个子细胞", "Two daughter cells"),
      description: b(
        "在正常条件下，包膜闭合、隔膜分离，形成各自具有完整染色体的两个杆状子细胞。新细胞极来自原来的分裂部位。",
        "With active synthesis, envelope closure and septal splitting produce two rods, each with a complete chromosome. Their new poles arise at the former division site.",
      ),
    },
  ],
  sources: [
    {
      title:
        "FtsZ disassembly prior to compartmentalization of the Escherichia coli cell",
      url: "https://pubmed.ncbi.nlm.nih.gov/24506818/",
    },
    {
      title:
        "Dynamics of Escherichia coli Chromosome Segregation during Multifork Replication",
      url: "https://journals.asm.org/doi/10.1128/jb.01212-07",
    },

    {
      title:
        "New insights into the assembly and regulation of the bacterial divisome",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11102604/",
    },
    {
      title: "Assembly and Activation of the Escherichia coli Divisome",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5517055/",
    },
  ],
  legend: [
    { color: "#729b97", text: b("内外膜", "Inner and outer membranes") },
    { color: "#c4ae7d", text: b("肽聚糖与隔膜", "Peptidoglycan and septum") },
    { color: "#aa879c", text: b("染色体 DNA", "Chromosomal DNA") },
    { color: "#7492b0", text: b("FtsZ 支架", "FtsZ scaffold") },
    {
      color: "#b88465",
      text: b("隔膜合成复合物", "Septal synthesis complexes"),
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const outerMat = k.material("#90b5ac", {
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1,
    });
    const innerMat = k.material("#658e89", {
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1,
    });
    const wallMat = k.material("#c4ae7d", {
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1,
    });
    const dnaMat = k.material("#9b7791"),
      sisterMat = k.material("#c397a8"),
      forkMat = k.material("#dcc395");
    const ftsMat = k.material("#7492b0"),
      enzymeMat = k.material("#b88465"),
      anchorMat = k.material("#d1b786");
    const cells = [new THREE.Group(), new THREE.Group()];
    cells.forEach((c) => group.add(c));
    const surfaces = [],
      longSteps = 45,
      roundSteps = 52;
    // Each half is open along the front viewing sector, revealing genuine interior space.
    function surface(side, radius, material) {
      const positions = new Float32Array(
          (longSteps + 1) * (roundSteps + 1) * 3,
        ),
        indices = [];
      for (let i = 0; i < longSteps; i++)
        for (let j = 0; j < roundSteps; j++) {
          const n = i * (roundSteps + 1) + j;
          indices.push(
            n,
            n + 1,
            n + roundSteps + 1,
            n + 1,
            n + roundSteps + 2,
            n + roundSteps + 1,
          );
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setIndex(indices);
      const mesh = k.mesh(geo, material, [0, 0, 0], cells[side]);
      mesh.name = `envelope-${side}-${radius}`;
      surfaces.push({ side, radius, geo });
      return mesh;
    }
    for (let side = 0; side < 2; side++) {
      surface(side, 1.04, outerMat);
      surface(side, 0.97, wallMat);
      surface(side, 0.9, innerMat);
    }
    // Cut edges are longitudinal curves with the same changing pole and waist geometry.
    const edges = [];
    for (let side = 0; side < 2; side++)
      for (const theta of [Math.PI * 0.84, Math.PI * 2.16])
        for (let i = 0; i < longSteps; i++) {
          edges.push({
            side,
            theta,
            i,
            mesh: k.segment([0, 0, 0], [1, 0, 0], 0.032, innerMat, cells[side]),
          });
        }
    const up = new THREE.Vector3(0, 1, 0),
      a = new THREE.Vector3(),
      z = new THREE.Vector3(),
      d = new THREE.Vector3();
    function segment(mesh, p0, p1, r) {
      a.set(...p0);
      z.set(...p1);
      d.subVectors(z, a);
      mesh.position.copy(a).add(z).multiplyScalar(0.5);
      mesh.scale.set(r, Math.max(d.length(), 0.00001), r);
      mesh.quaternion.setFromUnitVectors(up, d.normalize());
    }
    function contour(u, side, radius, constriction, elongation) {
      const sign = side ? 1 : -1,
        length = 2.65 + 0.52 * elongation;
      const outerPole = Math.sqrt(
        Math.max(0, 1 - Math.max(0, (u - 0.64) / 0.36) ** 2),
      );
      const innerPole = Math.sqrt(
        Math.max(0, 1 - Math.max(0, 1 - u / 0.33) ** 2),
      );
      return [
        sign * u * length,
        radius * outerPole * (1 - constriction + constriction * innerPole),
      ];
    }
    const chromosomes = [new THREE.Group(), new THREE.Group()];
    chromosomes.forEach((c) => group.add(c));
    const dnaPieces = [[], []],
      pieces = 288;
    const dnaPoint = (t) => [
      (1.06 + 0.12 * Math.cos(t * 17)) * Math.cos(t),
      (0.3 + 0.12 * Math.cos(t * 17)) * Math.sin(t),
      0.13 * Math.sin(t * 17) + 0.04 * Math.sin(t * 3),
    ];
    for (let s = 0; s < 2; s++)
      for (let i = 0; i < pieces; i++)
        dnaPieces[s].push(
          k.segment(
            dnaPoint((i / pieces) * Math.PI * 2),
            dnaPoint(((i + 1) / pieces) * Math.PI * 2),
            0.034,
            s ? sisterMat : dnaMat,
            chromosomes[s],
          ),
        );
    const unreplicated = Array.from({ length: 144 }, (_, i) => {
      const mesh = k.segment(
        [0, 0, 0],
        [1, 0, 0],
        0.034,
        dnaMat,
        chromosomes[0],
      );
      mesh.name = `unreplicated-DNA-${i}`;
      return mesh;
    });
    dnaPieces.forEach((arm, side) =>
      arm.forEach((mesh, i) => {
        mesh.name = `replicated-arm-${side}-${i}`;
      }),
    );
    const forks = [
      k.ball([0, 0, 0], 0.105, forkMat),
      k.ball([0, 0, 0], 0.105, forkMat),
    ];
    forks.forEach((mesh, i) => {
      mesh.name = `replication-fork-${i}`;
    });
    const scaffold = new THREE.Group();
    scaffold.name = "FtsZ-scaffold";
    group.add(scaffold);
    const fts = [];
    for (let j = 0; j < 40; j++) {
      const theta = (j / 40) * Math.PI * 2;
      // Deliberate gaps emphasize discontinuous short filaments, not a contractile rope.
      const mesh = k.segment([0, 0, 0], [0, 0.08, 0], 0.043, ftsMat, scaffold);
      mesh.name = `FtsZ-filament-${j}`;
      fts.push({ theta, mesh });
    }
    const synthases = [],
      anchors = [];
    for (let j = 0; j < 14; j++) {
      synthases.push(k.ball([0, 0, 0], [0.14, 0.095, 0.095], enzymeMat));
      anchors.push(k.ball([0, 0, 0], [0.12, 0.055, 0.055], anchorMat));
    }
    const septa = [];
    for (const x of [-0.1, 0.1]) {
      const m = k.mesh(new THREE.TorusGeometry(1, 0.065, 10, 72), wallMat, [
        x,
        0,
        0,
      ]);
      m.rotation.y = Math.PI / 2;
      septa.push(m);
    }
    const membraneHeads = instances(
      k,
      group,
      k.sphere,
      k.material("#a9c1b4"),
      576,
      "inner-outer-membrane-paired-leaflets",
    );
    const membraneTails = instances(
      k,
      group,
      k.cylinder,
      k.material("#d0c79f"),
      576,
      "bilayer-cutedge-tails",
    );
    const wallGlycans = instances(
      k,
      group,
      k.cylinder,
      k.material("#d1b880"),
      1008,
      "septal-and-lateral-peptidoglycan-mesh",
    );
    const wallBridges = instances(
      k,
      group,
      k.cylinder,
      k.material("#b7a16e"),
      476,
      "peptidoglycan-crosslinks",
    );
    synthases.forEach((mesh, i) => {
      mesh.name = `FtsWI-${i}`;
    });
    for (const enzyme of synthases) {
      k.ball([-0.5, 0.65, 0], [0.7, 0.9, 0.65], anchorMat, enzyme);
      k.ball([0.5, -0.5, 0], [0.65, 0.8, 0.65], enzymeMat, enzyme);
    }
    const labels = [
      k.label(
        [-2.7, 1.58, 0.1],
        "大肠杆菌 · 包膜剖面",
        "E. coli · envelope cutaway",
        9,
      ),
      k.label(
        [2.6, 1.3, 0],
        "外膜 / 肽聚糖 / 内膜",
        "Outer membrane / wall / inner membrane",
        7,
      ),
      k.label(
        [0, -1.55, 0],
        "环形染色体（折叠）",
        "Folded circular chromosome",
        8,
      ),
      k.label([0, 1.57, 0.1], "复制叉", "Replication forks", 7),
      k.label(
        [0, -1.47, 0.6],
        "FtsZ 与膜锚定支架",
        "FtsZ and membrane anchors",
        9,
      ),
      k.label(
        [0.5, 1.5, 0.6],
        "FtsWI：隔膜肽聚糖合成",
        "FtsWI: septal wall synthesis",
        9,
      ),
      k.label([0, -1.72, 0.1], "包膜内陷", "Envelope invagination", 8),
      k.label(
        [-1.85, -1.5, 0],
        "子细胞 · 完整染色体",
        "Daughter · complete chromosome",
        8,
      ),
      k.label(
        [1.85, -1.5, 0],
        "子细胞 · 完整染色体",
        "Daughter · complete chromosome",
        8,
      ),
    ];
    function update(raw, parameters = {}) {
      const p = clamp(raw),
        blocked = parameters.septalSynthesis === "blocked";
      const replication = ease(p, 0.13, 0.41),
        elongation = ease(p, 0.05, 0.46);
      const constriction = blocked ? 0 : ease(p, 0.65, 0.89),
        separation = blocked ? 0 : ease(p, 0.9, 1);
      for (let side = 0; side < 2; side++)
        cells[side].position.x = (side ? 1 : -1) * separation * 0.4;
      for (const { side, radius, geo } of surfaces) {
        const attr = geo.attributes.position;
        for (let i = 0; i <= longSteps; i++) {
          const [x, r] = contour(
            i / longSteps,
            side,
            radius,
            constriction,
            elongation,
          );
          for (let j = 0; j <= roundSteps; j++) {
            const cut = radius > 1 ? 0.97 : radius > 0.94 ? 0.9 : 0.84;
            const theta =
              Math.PI * cut + (j / roundSteps) * Math.PI * (3 - 2 * cut);
            attr.setXYZ(
              i * (roundSteps + 1) + j,
              x,
              r * Math.cos(theta),
              r * Math.sin(theta),
            );
          }
        }
        attr.needsUpdate = true;
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
      }
      let headIndex = 0;
      for (let side = 0; side < 2; side++)
        for (const membraneRadius of [0.9, 1.04])
          for (const edge of [
            membraneRadius > 1 ? 0.97 : 0.84,
            membraneRadius > 1 ? 2.03 : 2.16,
          ])
            for (const leaflet of [-1, 1])
              for (let j = 0; j < 36; j++) {
                const [x, r] = contour(
                    (j + 0.5) / 36,
                    side,
                    membraneRadius,
                    constriction,
                    elongation,
                  ),
                  theta = edge * Math.PI,
                  headRadius = r + leaflet * 0.022,
                  offset = cells[side].position.x;
                membraneHeads.point(
                  headIndex,
                  [
                    x + offset,
                    headRadius * Math.cos(theta),
                    headRadius * Math.sin(theta),
                  ],
                  0.027,
                );
                membraneTails.line(
                  headIndex,
                  [
                    x + offset,
                    headRadius * Math.cos(theta),
                    headRadius * Math.sin(theta),
                  ],
                  [x + offset, r * Math.cos(theta), r * Math.sin(theta)],
                  0.009,
                );
                headIndex++;
              }
      membraneHeads.flush();
      membraneTails.flush();
      let gi = 0,
        bi = 0;
      for (let side = 0; side < 2; side++)
        for (let row = 0; row < 18; row++) {
          const u = (row + 0.5) / 18,
            [x, r] = contour(u, side, 0.977, constriction, elongation),
            offset = cells[side].position.x;
          for (let j = 0; j < 28; j++) {
            const t = 0.9 * Math.PI + (j / 28) * 1.2 * Math.PI,
              z = t + (1.2 * Math.PI) / 28;
            wallGlycans.line(
              gi++,
              [x + offset, r * Math.cos(t), r * Math.sin(t)],
              [x + offset, r * Math.cos(z), r * Math.sin(z)],
              0.013,
            );
          }
          if (row < 17)
            for (let j = 0; j < 14; j++) {
              const [x1, r1] = contour(
                  (row + 1.5) / 18,
                  side,
                  0.977,
                  constriction,
                  elongation,
                ),
                t = 0.9 * Math.PI + ((j + 0.5) / 14) * 1.2 * Math.PI;
              wallBridges.line(
                bi++,
                [x + offset, r * Math.cos(t), r * Math.sin(t)],
                [x1 + offset, r1 * Math.cos(t), r1 * Math.sin(t)],
                0.009,
              );
            }
        }
      wallGlycans.flush();
      wallBridges.flush();
      for (const edge of edges) {
        const c0 = contour(
            edge.i / longSteps,
            edge.side,
            0.9,
            constriction,
            elongation,
          ),
          c1 = contour(
            (edge.i + 1) / longSteps,
            edge.side,
            0.9,
            constriction,
            elongation,
          );
        segment(
          edge.mesh,
          [c0[0], c0[1] * Math.cos(edge.theta), c0[1] * Math.sin(edge.theta)],
          [c1[0], c1[1] * Math.cos(edge.theta), c1[1] * Math.sin(edge.theta)],
          0.032,
        );
      }
      // Three connected DNA arms share two exact fork coordinates until termination.
      const postReplication = ease(p, 0.41, 0.49),
        forkAngle = replication * Math.PI;
      chromosomes.forEach((c) => {
        c.position.set(0, 0, 0.18);
        c.scale.set(1, 1, 1);
      });
      const branchPoint = (t, side) => {
        const q = dnaPoint(t),
          sign = side ? 1 : -1;
        const opening =
          forkAngle > 0
            ? Math.max(0, Math.cos(((t / forkAngle) * Math.PI) / 2)) ** 2
            : 0;
        q[0] +=
          sign *
          (0.9 * replication * opening * (1 - postReplication) +
            1.7 * postReplication +
            separation * 0.4);
        return q;
      };
      for (let side = 0; side < 2; side++)
        for (let i = 0; i < pieces; i++) {
          const a = -forkAngle + (2 * forkAngle * i) / pieces,
            z = -forkAngle + (2 * forkAngle * (i + 1)) / pieces;
          dnaPieces[side][i].visible = replication > 0;
          segment(
            dnaPieces[side][i],
            branchPoint(a, side),
            branchPoint(z, side),
            0.034,
          );
        }
      for (let i = 0; i < unreplicated.length; i++) {
        const a =
            forkAngle +
            ((Math.PI * 2 - 2 * forkAngle) * i) / unreplicated.length,
          z =
            forkAngle +
            ((Math.PI * 2 - 2 * forkAngle) * (i + 1)) / unreplicated.length;
        unreplicated[i].visible = replication < 1;
        segment(unreplicated[i], dnaPoint(a), dnaPoint(z), 0.034);
      }
      for (let i = 0; i < 2; i++) {
        const point = dnaPoint((i ? 1 : -1) * forkAngle);
        forks[i].visible = replication > 0 && replication < 1;
        forks[i].position.set(point[0], point[1], point[2] + 0.18);
      }
      const assembled = ease(p, 0.48, 0.59),
        departure = blocked ? 0 : ease(p, 0.76, 0.83),
        ringRadius = 0.78 * (1 - constriction);
      scaffold.visible = p >= 0.48 && departure < 1;
      scaffold.scale.setScalar(1);
      for (let j = 0; j < fts.length; j++) {
        fts[j].mesh.visible =
          j < Math.ceil(assembled * 40 * (1 - departure)) && j % 5 !== 4;
        const theta = fts[j].theta + p * 1.4;
        segment(
          fts[j].mesh,
          [0, ringRadius * Math.cos(theta), ringRadius * Math.sin(theta)],
          [
            0,
            ringRadius * Math.cos(theta + 0.103),
            ringRadius * Math.sin(theta + 0.103),
          ],
          0.043,
        );
      }
      for (let j = 0; j < synthases.length; j++) {
        const angle = (j / synthases.length) * Math.PI * 2 + p * 0.9,
          r = 0.98 * (1 - constriction);
        synthases[j].visible =
          p >= 0.57 &&
          (blocked || p < 0.91) &&
          j < Math.ceil(ease(p, 0.57, 0.65) * 14);
        synthases[j].position.set(
          0.04,
          r * Math.cos(angle),
          r * Math.sin(angle),
        );
        synthases[j].scale.set(0.14, 0.095, 0.095);
        synthases[j].scale.multiplyScalar(
          Math.max(0.15, 1 - 0.7 * constriction),
        );
        anchors[j].visible = p >= 0.51 && (blocked || p < 0.91);
        anchors[j].position.set(
          -0.03,
          (ringRadius + 0.055) * Math.cos(angle),
          (ringRadius + 0.055) * Math.sin(angle),
        );
      }
      for (let j = 0; j < septa.length; j++) {
        const mesh = septa[j];
        mesh.visible = !blocked && p >= 0.65 && p < 0.905;
        mesh.scale.setScalar(Math.max(0.001, 1 - constriction));
        mesh.position.x = j ? 0.09 : -0.09;
      }
      labels[2].active = p < 0.47;
      labels[3].active = replication > 0 && replication < 1;
      labels[4].active = p >= 0.48 && p < 0.69;
      labels[5].active = p >= 0.59 && p < 0.86;
      labels[6].active = p >= 0.7 && (p < 0.9 || blocked);
      labels[6].text = blocked
        ? b("合成受阻：不能完成分裂", "Synthesis blocked: division stalls")
        : b(
            "包膜内陷与隔膜重塑",
            "Envelope invagination and septal remodeling",
          );
      labels[7].active = labels[8].active = !blocked && p >= 0.9;
      group.userData = {
        process: "bacterialDivision",
        structuralDetail:
          "paired membrane leaflets, peptidoglycan lattice, supercoiled nucleoids",
        organism: "Escherichia coli",
        growthScope: "single simplified slow-growth cycle",
        septalSynthesis: blocked ? "blocked" : "active",
        replicationFraction: replication,
        chromosomeCopies: replication >= 1 ? 2 : 1,
        segregated: postReplication >= 1,
        ftsZIsScaffold: true,
        septalWallSynthesis: !blocked && p >= 0.65 && p < 0.9,
        constrictionFraction: constriction,
        daughterCells: !blocked && p >= 0.9 ? 2 : 0,
        innerAndOuterMembranes: true,
        progress: p,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0.35, 2.7, 10.8], target: [0, 0, 0] },
    };
  },
};
export default process;
