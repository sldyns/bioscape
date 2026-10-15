import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { beadInstances, helix } from "./structuralDetails.js";
import { labelAnchors } from "./labelAnchors.js";
export default {
  id: "biofilm",
  title: b(
    "生物膜：附着、基质与分散",
    "Biofilm: attachment, matrix and dispersal",
  ),
  intro: b(
    "非黏液型铜绿假单胞菌 PAO1 的表面生物膜示意。Psl 是重要黏附和支架多糖，胞外 DNA 与蛋白也参与基质；不同菌株的基质不同。这里选取附着后形成聚集体再局部分散的路径，不把它当作所有生物膜必经的固定形态。",
    "A surface biofilm of nonmucoid Pseudomonas aeruginosa PAO1. Psl is a key adhesive and scaffold polysaccharide; extracellular DNA and proteins also contribute. Matrix composition varies by strain. This illustrates an attached-aggregate route with local dispersal, not a mandatory morphology for all biofilms.",
  ),
  duration: 36,
  controls: [
    {
      id: "cue",
      label: b("成熟后的环境", "Environment after maturation"),
      default: "NO",
      options: [
        {
          value: "NO",
          label: b("低水平 NO 分散信号", "Low-level NO dispersal cue"),
        },
        { value: "none", label: b("无此次分散信号", "No added dispersal cue") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("接近表面", "Approaching a surface"),
      description: b(
        "游离细胞接近固体表面。附着是局部接触过程，最初可逆，并不意味着细胞死亡。",
        "Planktonic cells approach a solid surface. Attachment involves local contact and can initially be reversible; it does not imply cell death.",
      ),
    },
    {
      at: 0.17,
      title: b("黏附与停留", "Adhesion and residence"),
      description: b(
        "PAO1 分泌的 Psl 有助于细胞黏附。表面运动与已沉积的多糖影响细胞停留位置。",
        "Psl secreted by PAO1 supports adhesion. Surface movement and deposited polysaccharide influence where cells remain.",
      ),
    },
    {
      at: 0.34,
      title: b("形成微菌落", "Forming microcolonies"),
      description: b(
        "附着细胞的生长和局部聚集形成微菌落；模型用有限数量的代表细胞显示群体结构。",
        "Growth and local aggregation of attached cells produce microcolonies. A limited number of representative cells depicts the community architecture.",
      ),
    },
    {
      at: 0.51,
      title: b("胞外基质与空隙", "Extracellular matrix and spaces"),
      description: b(
        "Psl 支架与胞外 DNA、基质蛋白共同稳定群体。基质是可渗透的纤维网络，不是包住全部细胞的膜。",
        "A Psl scaffold, extracellular DNA and matrix proteins stabilize the community. The matrix is a permeable network, not a membrane enclosing all cells.",
      ),
    },
    {
      at: 0.7,
      title: b("条件性分散响应", "A conditional dispersal response"),
      description: b(
        "低水平 NO 可提高磷酸二酯酶活性并降低胞内 c-di-GMP，促进分散。图中未把 NO 画成杀菌处理，也未将此过程等同于群体感应。",
        "Low-level NO can increase phosphodiesterase activity and lower intracellular c-di-GMP, promoting dispersal. NO is not depicted as a bactericidal treatment or as a quorum-sensing switch.",
      ),
    },
    {
      at: 0.88,
      title: b("局部松解与释放", "Local loosening and release"),
      description: b(
        "分散涉及黏附解除与基质重塑，部分活细胞离开，周围基质仍可保留。无新增信号时，本次示意群体保持附着。",
        "Dispersal involves untethering and matrix remodeling. Some viable cells leave while surrounding matrix can remain. Without the added cue, this illustrative community remains attached.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Psl trails guide exploration and microcolony formation in early P. aeruginosa biofilms",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4109411/",
    },
    {
      title:
        "Assembly and Development of the Pseudomonas aeruginosa Biofilm Matrix",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2654510/",
    },
    {
      title:
        "Nitric Oxide Signaling in Pseudomonas aeruginosa Biofilms Mediates Phosphodiesterase Activity, Decreased Cyclic Di-GMP Levels, and Enhanced Dispersal",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2786556/",
    },
    {
      title:
        "Untethering and Degradation of the Polysaccharide Matrix Are Essential Steps in the Dispersion Response of Pseudomonas aeruginosa Biofilms",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6964737/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      cellMat = k.material("#779f93"),
      psl = k.material("#c4ab72"),
      edna = k.material("#a28ba8"),
      substrate = k.material("#c4c9c1"),
      protein = k.material("#8baab6");
    const solidSurface = k.mesh(
      new THREE.BoxGeometry(7.4, 0.3, 3.6),
      substrate,
      [0, -1.9, 0],
    );
    solidSurface.name = "biofilm-solid-surface";
    for (let i = 0; i < 9; i++)
      k.segment(
        [-3.6 + i * 0.9, -1.738, -1.72],
        [-3.6 + i * 0.9, -1.738, 1.72],
        0.012,
        k.material("#b1b8b0"),
      );
    // Two broad, low microcolonies with packed basal cells and staggered upper
    // neighbors. Intercellular Psl links form a porous network rather than a
    // vertical ladder of isolated cells.
    const positions = [
      [-2.25, -1.57, 0.58],
      [-1.45, -1.57, -0.12],
      [1.15, -1.57, 0.48],
      [-2.55, -1.55, -0.42],
      [-1.55, -1.22, 0.52],
      [-0.75, -1.54, -0.64],
      [0.65, -1.55, -0.43],
      [1.85, -1.55, 0.55],
      [-2.1, -1.2, -0.15],
      [-1.15, -1.18, 0.04],
      [0.95, -1.19, 0.28],
      [1.65, -1.18, -0.26],
      [-1.85, -0.84, 0.37],
      [-1.18, -0.85, -0.35],
      [1.25, -0.84, 0.07],
      [-1.6, -0.5, 0.02],
      [0.87, -0.86, -0.42],
      [1.9, -1.16, 0.36],
      [-1.16, -0.52, 0.2],
      [1.3, -0.5, 0.02],
      [-2.2, -0.85, -0.47],
      [0.65, -1.53, 0.98],
      [-0.78, -1.55, 0.88],
      [1.85, -1.55, -0.73],
    ];
    // Birth proceeds from the surface upward. Each upper representative cell
    // expands beside an attached lower or lateral neighbor before moving into the
    // mature EPS-supported position; never scale a tiny cell in open space.
    const birthOrder = positions
      .map((_, i) => i)
      .sort(
        (a, b) =>
          Number(positions[a][1] >= -1.5) - Number(positions[b][1] >= -1.5) ||
          a - b,
      );
    const birthParents = positions.map((pos, i) => {
      if (i < 3 || pos[1] < -1.5) return -1;
      let parent = 0,
        nearest = Infinity;
      for (let j = 0; j < i; j++) {
        const other = positions[j];
        const distance =
          (other[0] - pos[0]) ** 2 +
          (other[1] - pos[1]) ** 2 +
          (other[2] - pos[2]) ** 2;
        if (distance < nearest) {
          nearest = distance;
          parent = j;
        }
      }
      return parent;
    });
    const birthStarts = positions.map((pos, i) =>
      i < 3
        ? 0
        : pos[1] < -1.5
          ? 0.26
          : pos[1] < -1
            ? 0.34
            : pos[1] < -0.7
              ? 0.42
              : 0.5,
    );
    for (let i = 3; i < positions.length; i++)
      if (birthParents[i] >= 0)
        birthStarts[i] = Math.max(
          birthStarts[i],
          birthStarts[birthParents[i]] + 0.06,
        );
    const cells = [],
      flagella = [],
      tethers = [],
      fibers = [],
      fiberEndpoints = [],
      fiberCurves = [],
      degradable = [];
    const poreGeometry = new THREE.TorusGeometry(0.026, 0.009, 6, 14);
    const surfaceMaterial = k.material("#adc0a7");
    positions.forEach((pos, i) => {
      const g = new THREE.Group();
      g.name = `biofilm-cell-${i}`;
      group.add(g);
      k.ball([0, 0, 0], [0.37, 0.15, 0.15], cellMat, g);
      k.segment(
        [-0.22, 0.01, 0.14],
        [0.2, 0.01, 0.14],
        0.014,
        k.material("#537f75"),
        g,
      );
      // Membrane ridges, protein pores and short surface glycans are schematic.
      for (let face = 0; face < 4; face++) {
        const theta = (face * Math.PI) / 2 + 0.35;
        const ridge = Array.from({ length: 18 }, (_, j) => {
          const x = -0.33 + (j * 0.66) / 17,
            r = 0.152 * Math.sqrt(Math.max(0, 1 - (x / 0.38) ** 2));
          return [x, r * Math.sin(theta), r * Math.cos(theta)];
        });
        k.tube(ridge, 0.007, surfaceMaterial, g, 32);
      }
      for (let n = 0; n < 5; n++) {
        const x = -0.24 + n * 0.12,
          r = 0.155 * Math.sqrt(1 - (x / 0.38) ** 2);
        k.mesh(poreGeometry, protein, [x, 0.04, r], g);
        k.tube(
          [
            [x, -0.045, r],
            [x + 0.018, -0.066, r + 0.04],
            [x + 0.008, -0.055, r + 0.075],
          ],
          0.007,
          surfaceMaterial,
          g,
          12,
        );
      }
      const headPositions = [];
      for (let n = 0; n < 52; n++) {
        const x = -0.33 + (0.66 * (n % 13)) / 12,
          theta = (Math.floor(n / 13) * Math.PI) / 2 + 0.5,
          r = 0.151 * Math.sqrt(1 - (x / 0.38) ** 2);
        headPositions.push([x, r * Math.sin(theta), r * Math.cos(theta)]);
      }
      beadInstances(
        k,
        g,
        headPositions,
        0.009,
        surfaceMaterial,
        "bacterial-envelope-headgroup-motifs",
      );
      cells.push(g);
      const flag = k.tube(
        [
          [-0.3, 0, 0],
          [-0.48, 0.12, 0],
          [-0.65, -0.05, 0.05],
          [-0.86, 0.12, 0.04],
        ],
        0.018,
        cellMat,
        g,
      );
      flagella.push(flag);
      const stem = k.segment(pos, [pos[0], -1.72, pos[2]], 0.018, psl);
      stem.name = `Psl-adhesion-tether-${i}`;
      tethers.push(stem);
      if (i > 2) {
        const from = positions[i];
        let near = 0,
          best = Infinity;
        for (let j = 0; j < i; j++) {
          const q = positions[j],
            distance =
              (q[0] - from[0]) ** 2 +
              (q[1] - from[1]) ** 2 +
              (q[2] - from[2]) ** 2;
          if (distance < best) {
            best = distance;
            near = j;
          }
        }
        const to = positions[near];
        const mid = [
          (from[0] + to[0]) / 2 + 0.18,
          (from[1] + to[1]) / 2 + 0.2,
          (from[2] + to[2]) / 2 + 0.2,
        ];
        const f = new THREE.Group();
        group.add(f);
        f.name = "Psl-fiber-bundle-and-oligosaccharide-repeat-motifs";
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(...from),
          new THREE.Vector3(...mid),
          new THREE.Vector3(...to),
        ]);
        k.tube([from, mid, to], 0.025, psl, f);
        const sugarPositions = [];
        for (let j = 0; j < 18; j++) {
          const q = curve.getPoint(j / 17);
          sugarPositions.push(q.toArray());
          if (j % 4 === 1) {
            const branch = [q.x + 0.095, q.y + 0.055, q.z + 0.045];
            k.segment(q.toArray(), branch, 0.013, psl, f);
            sugarPositions.push(branch);
          }
        }
        beadInstances(
          k,
          f,
          sugarPositions,
          0.038,
          k.material("#d7c393"),
          "polysaccharide-repeat-motifs",
        );
        // Neighboring strands turn the scaffold into a fiber bundle at a second scale.
        for (const side of [-1, 1])
          k.tube(
            [
              from.map((v, j) => v + (j === 2 ? side * 0.06 : 0)),
              mid.map((v, j) => v + (j === 2 ? side * 0.08 : 0)),
              to.map((v, j) => v + (j === 2 ? side * 0.06 : 0)),
            ],
            0.009,
            psl,
            f,
          );
        // Grow each bridge around its own center after both endpoint cells
        // exist; a stage seek must never reveal an unsupported upper scaffold.
        const center = new THREE.Vector3(
          (from[0] + to[0]) / 2,
          (from[1] + to[1]) / 2,
          (from[2] + to[2]) / 2,
        );
        f.position.copy(center);
        for (const child of f.children) child.position.sub(center);
        fibers.push(f);
        fiberEndpoints.push([i, near]);
        fiberCurves.push(curve);
        degradable.push(i === 12 || i === 15 || i === 18 || i === 20);
      }
    });
    const basalMatrix = new THREE.Group();
    basalMatrix.name = "surface-attached-Psl-footprint";
    group.add(basalMatrix);
    for (const center of [-1.65, 1.25]) {
      for (let row = 0; row < 4; row++) {
        const depth = -0.78 + row * 0.52;
        k.tube(
          [
            [center - 0.98, -1.72, depth],
            [center - 0.35, -1.7, depth + 0.12],
            [center + 0.32, -1.72, depth - 0.1],
            [center + 0.95, -1.71, depth + 0.06],
          ],
          0.018,
          psl,
          basalMatrix,
          24,
        );
      }
      for (let column = 0; column < 3; column++) {
        const x = center - 0.65 + column * 0.65;
        k.tube(
          [
            [x, -1.71, -0.8],
            [x + 0.12, -1.69, 0],
            [x - 0.08, -1.71, 0.85],
          ],
          0.014,
          psl,
          basalMatrix,
          20,
        );
      }
    }
    const dnaFibers = [];
    for (let i = 0; i < 6; i++) {
      const x = i < 3 ? -1.8 : 1.1,
        y = -1.47 + (i % 3) * 0.35;
      const dna = new THREE.Group();
      group.add(dna);
      dna.name = "extracellular-DNA-double-helix";
      const strands = [[], []];
      for (let j = 0; j < 30; j++) {
        for (let strand = 0; strand < 2; strand++) {
          const angle = j * 0.7 + strand * Math.PI;
          strands[strand].push([
            x + (j / 29 - 0.5) * 1.2,
            y + 0.045 * Math.sin(angle),
            0.68 - 0.045 * Math.cos(angle),
          ]);
        }
        if (j % 2 === 0)
          k.segment(strands[0][j], strands[1][j], 0.009, edna, dna);
      }
      strands.forEach((points) => k.tube(points, 0.013, edna, dna));
      dnaFibers.push(dna);
    }

    const adhesive = [];
    for (let i = 0; i < 8; i++)
      adhesive.push(
        k.ball(
          [-2.2 + (i % 4) * 1.25, -1.45 + Math.floor(i / 4) * 0.43, 0.55],
          [0.065, 0.12, 0.065],
          protein,
        ),
      );
    const cues = [];
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      g.name = `NO-cue-${i}`;
      group.add(g);
      k.ball([0, 0, 0], 0.07, protein, g);
      k.ball([0.1, 0, 0], 0.06, k.material("#b9877e"), g);
      cues.push(g);
    }
    // Two linked rings denote intracellular c-di-GMP in a labeled conceptual inset.
    const inset = new THREE.Group();
    inset.name = "c-di-GMP-conceptual-inset";
    group.add(inset);
    inset.position.set(2.9, 1.1, 0.15);
    k.ring([-0.07, 0, 0], 0.12, 0.032, psl, inset);
    k.ring([0.15, 0, 0], 0.12, 0.032, psl, inset);
    const labels = [
      k.label([0, -2.4, 1.2], "固体表面", "Solid surface", 2),
      k.label([-2.25, 1.27, 0], "PAO1 · 非黏液型", "PAO1 · nonmucoid", 2),
      k.label([-2.8, -0.34, 0.9], "Psl 支架", "Psl scaffold", 2),
      k.label([-0.2, -0.53, 1], "胞外 DNA", "Extracellular DNA", 1),
      k.label([2.14, -0.45, 0.8], "基质蛋白", "Matrix proteins", 1),
      k.label(
        [2.8, 1.57, 0.2],
        "胞内 c-di-GMP（示意）",
        "Intracellular c-di-GMP (inset)",
        1,
      ),
      k.label(
        [-0.1, 2.22, 0],
        "低水平 NO · 分散线索",
        "Low-level NO · dispersal cue",
        2,
      ),
      k.label([2.62, 2.35, 0.2], "活细胞释放", "Viable cells released", 2),
    ];
    const anchors = labelAnchors(labels),
      dnaStrand = dnaFibers[0].children.find(
        (m) => m.geometry?.type === "TubeGeometry",
      );
    const birthPoint = new THREE.Vector3();
    function update(value, parameters = {}) {
      const p = clamp(value),
        cue = parameters.cue !== "none",
        attach = ease(p, 0.05, 0.25),
        mature = ease(p, 0.32, 0.64),
        release = cue ? ease(p, 0.79, 1) : 0;
      basalMatrix.visible = attach > 0.65;
      for (const i of birthOrder) {
        const pos = positions[i],
          growth = i < 3 ? 1 : ease(p, birthStarts[i], birthStarts[i] + 0.14),
          leaver = i === 12 || i === 15 || i === 18 || i === 20,
          r = leaver ? release : 0;
        cells[i].visible = growth > 0;
        cells[i].scale.setScalar(Math.max(0.001, growth));
        cells[i].position.set(
          pos[0] +
            (i < 3 ? (1 - attach) * (-0.6 + i * 0.45) : 0) +
            r * (2.2 + (i % 2) * 0.5),
          pos[1] +
            (i < 3 ? (1 - attach) * (2.6 + i * 0.16) : 0) +
            r * (2.0 + (i % 3) * 0.12),
          pos[2],
        );
        if (i >= 3 && growth > 0 && growth < 1) {
          const parent = birthParents[i];
          if (parent < 0) {
            // The bottom surface of a growing basal cell remains in contact
            // with the deposited Psl footprint (top y = -1.72).
            cells[i].position.y =
              -1.75 + 0.15 * growth + (pos[1] + 1.6) * growth ** 6;
          } else {
            const support = cells[parent].position,
              outward = growth ** 12;
            fiberCurves[i - 3].getPoint(1 - outward, birthPoint);
            cells[i].position.set(
              birthPoint.x + (support.x - positions[parent][0]) * (1 - outward),
              birthPoint.y + (support.y - positions[parent][1]) * (1 - outward),
              birthPoint.z + (support.z - positions[parent][2]) * (1 - outward),
            );
          }
        }
        cells[i].rotation.z =
          ((i % 3) - 1) * (pos[1] < -1.5 ? 0.08 : 0.35) +
          (i < 3 ? (1 - attach) * 0.5 : 0) +
          r * 0.7;
        flagella[i].visible = (i < 3 && attach < 0.8) || r > 0.15;
        tethers[i].visible =
          pos[1] < -1.5 &&
          cells[i].visible &&
          p > 0.17 &&
          !(leaver && release > 0.05);
        tethers[i].scale.x = 0.018 * Math.max(0.001, attach);
        tethers[i].scale.z = 0.018 * Math.max(0.001, attach);
      }
      fibers.forEach((f, i) => {
        const endpoints = fiberEndpoints[i],
          endpointGrowth = Math.min(
            cells[endpoints[0]].scale.x,
            cells[endpoints[1]].scale.x,
          ),
          birth =
            clamp((endpointGrowth - 0.75) / 0.2) *
            clamp((mature - (i % 5) * 0.06) / 0.15);
        f.visible = birth > 0 && !(degradable[i] && release > 0.03);
        f.scale.setScalar(Math.max(0.001, birth));
      });
      dnaFibers.forEach(
        (f, i) =>
          (f.visible = mature > 0.2 + i * 0.09 && !(i === 2 && release > 0.12)),
      );
      adhesive.forEach((m, i) => (m.visible = mature > 0.2 + (i % 3) * 0.15));
      cues.forEach((g, i) => {
        g.visible = cue && p > 0.7;
        g.position.set(
          -2.3 + i * 0.72,
          2.03 - 0.7 * ease(p, 0.7, 0.83) + 0.1 * Math.sin(i),
          0.15,
        );
      });
      inset.visible = p > 0.5;
      inset.scale.setScalar(cue ? 1 - 0.65 * ease(p, 0.7, 0.83) : 1);
      anchors[0].local(solidSurface, 0, 0.15, 1.2);
      anchors[1].surface(cells[0].children[0]);
      anchors[2].surface(
        fibers[0].visible ? fibers[0].children[0] : tethers[0],
        fibers[0].visible ? 32 * 9 : 0,
      );
      anchors[3].surface(dnaStrand, 32 * 9);
      anchors[4].surface(adhesive[0]);
      anchors[5].surface(inset.children[0]);
      anchors[6].surface(cues[0].children[0]);
      anchors[7].surface(cells[12].children[0]);
      labels[7].active =
        labels[7].active && release > 0.25 && cells[12].position.y > 0.3;
      group.userData = {
        species: "Pseudomonas aeruginosa PAO1",
        phenotype: "nonmucoid",
        dominantScaffold: "Psl",
        matrixIsMembrane: false,
        cue: cue ? "low-level nitric oxide" : "none",
        attached: attach > 0.95,
        mature: mature > 0.95,
        cDiGMPTrend: cue && p > 0.7 ? "decreased" : "no-added-dispersal-cue",
        localMatrixRemodeling: release > 0,
        releasedCells: release > 0 ? 4 : 0,
        cellKilling: false,
        universalStageSequence: false,
        structuralDetail:
          "envelope-ridges-and-pore-motifs; multistrand-Psl-with-repeat-units; extracellular-DNA-double-helices",
        surfaceDetailIsAtomic: false,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 3.3, 10.8], target: [0, -0.15, 0] },
    };
  },
};
