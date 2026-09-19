import {
  cellPlateMembrane,
  plateFootprint,
  plateMargin,
} from "./cellPlateMembrane.js";
import { chromatid, microtubule } from "./structuralDetail.js";
import {
  THREE,
  sceneKit,
  clamp,
  ease,
  phase,
  bilingual as b,
} from "../../kit.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  const wall = k.material("#b9bea0"),
    membrane = k.material("#8ba799"),
    chrom = k.material("#827194");
  const micro = k.material("#90b4ad"),
    vesMat = k.material("#d0a578"),
    plateMat = k.material("#c4b98e");
  const nucMat = k.material("#b9acc8", {
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const box = new THREE.BoxGeometry(1, 1, 1);
  // Open-front rectangular meristem cell: existing wall remains intact throughout.
  for (const x of [-2.5, 2.5]) {
    const m = k.mesh(box, wall, [x, 0, -0.05]);
    m.scale.set(0.19, 5.5, 1.9);
  }
  for (const y of [-2.75, 2.75]) {
    const m = k.mesh(box, wall, [0, y, -0.05]);
    m.scale.set(5.2, 0.19, 1.9);
  }
  for (const x of [-2.36, 2.36])
    k.segment([x, -2.63, 0.88], [x, 2.63, 0.88], 0.035, membrane);
  for (const y of [-2.63, 2.63])
    k.segment([-2.36, y, 0.88], [2.36, y, 0.88], 0.035, membrane);
  const sisters = [];
  for (let i = 0; i < 4; i++)
    for (const side of [-1, 1]) {
      const m = chromatid(k, chrom);
      sisters.push({ m, side, x: (i - 1.5) * 0.56 });
    }
  const nuclei = [-1, 1].map((side) => ({
    side,
    m: k.ball([0, side * 1.6, 0], [1.16, 0.68, 0.54], nucMat),
  }));
  const spindles = sisters.map(({ side }) => {
    const m = k.segment([0, side * 2.1, -0.18], [0, 0, 0.15], 0.018, micro);
    m.name = "Kinetochore microtubule";
    return m;
  });
  // Parental PM outside the central fusion window. The window itself is part
  // of the same implicit membrane surface as the plate, not an overlapping lid.
  for (const x of [-2.36, 2.36])
    for (const side of [-1, 1]) {
      const m = k.mesh(box, membrane, [x, side * 1.565, 0]);
      m.scale.set(0.015, 2.13, 1.76);
    }
  const plateMembrane = cellPlateMembrane(
    k,
    k.material("#8ba799", {
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const plate = k.mesh(box, plateMat);
  plate.name = "Wall matrix inside the cell-plate lumen";
  const arrays = [],
    vesicles = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    for (const side of [-1, 1]) {
      const m = microtubule(k, micro);
      arrays.push({ m, angle, side });
      const v = k.ball(
        [0, 0, 0],
        0.095,
        k.material("#d0a578", {
          transparent: true,
          opacity: 0.68,
          depthWrite: false,
        }),
      );
      v.name = "Closed incoming cell-plate vesicle";
      vesicles.push({ m: v, angle, side, offset: i / 24 });
    }
  }
  const a = new THREE.Vector3(),
    target = new THREE.Vector3(),
    direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  // Wall lamellae and pectin-rich middle layer are exposed at the open front.
  for (const z of [0.83, 0.91])
    for (const y of [-2.71, 2.71])
      k.segment([-2.48, y, z], [2.48, y, z], 0.026, plateMat);
  for (const side of [-1, 1])
    for (let i = 0; i < 18; i++)
      k.segment(
        [side * 2.48, -2.5 + i * 0.29, 0.86],
        [side * 2.48, -2.3 + i * 0.29, 0.96],
        0.016,
        wall,
      );
  const labels = [
    k.label([-2.3, 2.96, 0.5], "亲代细胞壁", "Parental cell wall", 2),
    k.label([0.2, 1.65, 0.75], "已复制的染色体", "Duplicated chromosomes", 2),
    k.label([1.4, 0.88, 0.9], "成膜体微管", "Phragmoplast microtubules", 2),
    k.label(
      [0, -0.3, 1.05],
      "囊泡融合形成细胞板",
      "Vesicle fusion builds the cell plate",
      3,
    ),
    k.label([1.3, -1.8, 0.75], "两个子细胞核", "Two daughter nuclei", 1),
  ];
  let membraneState;
  function update(value) {
    const p = clamp(value),
      separation = ease(p, 0.13, 0.35),
      growth = ease(p, 0.39, 0.88),
      radius = 0.12 + 2.24 * growth + 0.08 * ease(p, 0.86, 0.9),
      depth = 0.09 + 0.81 * growth;
    sisters.forEach(({ m, side, x }) => {
      m.position.set(
        x + side * 0.12 * (1 - separation),
        side * (0.07 + 1.53 * separation),
        0.15,
      );
      m.rotation.z = side * (0.45 * (1 - separation));
      m.visible = p < 0.84;
      m.scale.set(1, 1 - 0.2 * ease(p, 0.65, 0.84), 1);
    });
    nuclei.forEach(({ m, side }) => {
      m.visible = p >= 0.31;
      m.scale.set(
        1.16 * ease(p, 0.31, 0.48),
        0.68 * ease(p, 0.31, 0.48),
        0.54 * ease(p, 0.31, 0.48),
      );
      m.position.y = side * 1.6;
    });
    sisters.forEach(({ m }, i) => {
      m.updateMatrix();
      const kinetochore = m.children.find(
        (n) => n.name === "Kinetochore attachment domain",
      );
      target.copy(kinetochore.position).applyMatrix4(m.matrix);
      a.set(0, sisters[i].side * 2.1, -0.18);
      const fiber = spindles[i];
      fiber.position.copy(a).add(target).multiplyScalar(0.5);
      direction.copy(target).sub(a);
      fiber.scale.set(0.018, direction.length(), 0.018);
      fiber.quaternion.setFromUnitVectors(up, direction.normalize());
      fiber.visible = p < 0.37;
    });
    plate.visible = p >= 0.62;
    plate.scale.set(
      Math.max(0.02, radius * 2 - 0.12),
      0.075,
      Math.max(0.02, depth * 2 - 0.12),
    );
    arrays.forEach(({ m, angle, side }) => {
      m.visible = p >= 0.3 && p < 0.93;
      const [x, z] = plateMargin(angle, radius, depth);
      m.position.set(x, side * 0.6, z);
      m.scale.set(1, 1 - 0.7 * ease(p, 0.87, 0.93), 1);
    });
    const fusing = [];
    vesicles.forEach(({ m, angle, side, offset }) => {
      const t = (phase(p, 0.3, 0.9) * 3 + offset) % 1;
      const [x, z] = plateMargin(angle, radius, depth);
      const y = side * (1.1 - 1.1 * t);
      m.position.set(x, y, z);
      m.visible = p >= 0.3 && p < 0.9 && t < 0.72;
      if (p >= 0.3 && p < 0.9 && t >= 0.72) fusing.push([x, y, z]);
    });
    // A perforated lumen network widens into a sheet. Incoming vesicle lumens
    // join it through real necks; internal caps disappear in the union surface.
    const hole = 0.21 * (1 - ease(p, 0.45, 0.62));
    const nextMembraneState =
      p < 0.3 ? "before-plate" : p >= 0.9 ? "joined" : p;
    if (membraneState !== nextMembraneState)
      plateMembrane.update(
        (x, y, z) => {
          let field = 2.36 - Math.abs(x);
          if (p >= 0.3) {
            let plateField = Math.max(
              plateFootprint(x, z, radius, depth),
              Math.abs(y) - 0.095,
            );
            if (hole > 0.001) {
              const hx = Math.abs(x / radius) - 0.43;
              const hz = Math.abs(z / depth) - 0.43;
              plateField = Math.max(
                plateField,
                (hole - Math.hypot(hx, hz)) * Math.min(radius, depth),
              );
            }
            field = Math.min(field, plateField);
          }
          for (const [vx, vy, vz] of fusing)
            field = Math.min(field, Math.hypot(x - vx, y - vy, z - vz) - 0.095);
          return field;
        },
        radius,
        depth,
      );
    membraneState = nextMembraneState;
    labels[1].active = p < 0.35;
    labels[2].active = p >= 0.3 && p < 0.93;
    labels[3].active = p >= 0.3;
    labels[4].active = p >= 0.48;
    group.userData = {
      mechanism: "phragmoplast-guided centrifugal cell plate",
      species: "Arabidopsis thaliana somatic meristem",
      chromosomesPreduplicated: true,
      hasCentrioles: false,
      cleavageFurrow: false,
      cellPlateHalfWidth: radius,
      plateConnectedToParentalWall: p >= 0.88,
      daughterNuclei: p >= 0.48 ? 2 : 0,
      progress: p,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [3.5, 2.4, 11], target: [0, 0, 0] },
  };
}
export default {
  id: "plantDivision",
  title: b("植物细胞分裂", "Plant cell division"),
  duration: 34,
  intro: b(
    "以拟南芥分生组织体细胞为例：从已复制的染色体开始，观察成膜体引导囊泡在中央融合，细胞板向外扩展并连接亲代细胞壁。膜网和融合颈为放大的拓扑示意，前后截面开放以便观察；省略膜回收与壁成熟细节。",
    "Arabidopsis somatic meristem cell: starting with duplicated chromosomes, follow phragmoplast-guided vesicle fusion and outward cell-plate growth to the parental wall. The membrane network and fusion necks are enlarged topology schematics, cut at front and back for inspection; recycling and wall maturation are simplified.",
  ),
  stages: [
    {
      at: 0,
      title: b("分裂前的复制已完成", "Replication already completed"),
      description: b(
        "每条示意染色体含两条姐妹染色单体；本场景不重复演示 DNA 复制。植物纺锤体不依赖动物式中心粒。",
        "Each illustrated chromosome has two sister chromatids; DNA replication precedes this scene. The plant spindle does not require animal-like centrioles.",
      ),
    },
    {
      at: 0.16,
      title: b("姐妹染色单体分离", "Sister chromatids separate"),
      description: b(
        "姐妹染色单体移向相反的细胞两极，为两个子细胞核分配遗传物质。染色体数量为简化示意。",
        "Sister chromatids move toward opposite poles, distributing genetic material to daughter nuclei. Chromosome number is schematic.",
      ),
    },
    {
      at: 0.32,
      title: b("成膜体组织运输", "The phragmoplast organizes delivery"),
      description: b(
        "两组微管在分裂面两侧排列，引导分泌囊泡向细胞中央聚集。",
        "Two microtubule arrays flank the division plane and guide secretory vesicles toward the center.",
      ),
    },
    {
      at: 0.43,
      title: b("囊泡融合成板", "Vesicles fuse into a plate"),
      description: b(
        "囊泡融合产生膜性网络，随后形成细胞板；囊泡内腔将成为新细胞壁所在的胞外空间。",
        "Vesicle fusion produces a membrane network that develops into the cell plate; vesicle lumens become the extracellular space of the new wall.",
      ),
    },
    {
      at: 0.62,
      title: b("从中央向外扩展", "Expansion from center to edge"),
      description: b(
        "成膜体的活跃区向外移动，新囊泡主要补充到细胞板生长边缘。亲代细胞壁没有向内缢缩。",
        "The active phragmoplast zone moves outward, directing new vesicles mainly to the growing plate margin. The parental wall does not constrict inward.",
      ),
    },
    {
      at: 0.9,
      title: b("连接并分隔", "Connection and partition"),
      description: b(
        "细胞板与亲代质膜连接，新壁逐渐成熟，将两个子细胞分隔。细胞板两侧的膜成为各子细胞的质膜。",
        "The plate joins the parental plasma membrane and matures into a partition. Its two membrane faces become the daughter-cell plasma membranes.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Seguí-Simarro et al. (2004), Electron tomographic analysis of somatic cell plate formation in Arabidopsis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC412860/",
    },
    {
      title:
        "Vesicle Dynamics during Plant Cell Cytokinesis Reveals Distinct Developmental Phases",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5490904/",
    },
  ],
  create,
};
