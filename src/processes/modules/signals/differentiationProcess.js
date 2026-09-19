import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";

import {
  helix,
  chromatinFiber,
  poreComplex,
  materialInventory,
} from "./structuralKit.js";

import { continuousMembrane } from "./continuousMembrane.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  group.name = "Murine definitive erythroblast terminal differentiation";
  const cellMat = new THREE.MeshStandardMaterial({
    color: "#bac2cb",
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    roughness: 0.56,
    side: THREE.DoubleSide,
  });
  const red = new THREE.Color("#c5918e"),
    start = new THREE.Color("#bac2cb");
  const plasma = continuousMembrane(
    group,
    cellMat,
    [
      [-3.4, -2.4, -1.2],
      [3.8, 2.4, 1.2],
    ],
    [44, 32, 16],
  );
  const nuclear = new THREE.Group();
  group.add(nuclear);
  nuclear.position.set(-0.86, 0.2, 0.07);
  const nuclearMat = k.material("#a49bb9", {
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  nuclear.name = "extruding-nucleus";
  const nuclearSurface = k.ball([0, 0, 0], [1.1, 1, 0.52], nuclearMat, nuclear);
  nuclearSurface.geometry = nuclearSurface.geometry.clone();

  for (let lane = 0; lane < 3; lane++)
    chromatinFiber(
      k,
      nuclear,
      Array.from({ length: 19 }, (_, i) => {
        const a = i * 0.55;
        return [
          (0.4 + lane * 0.18) * Math.cos(a),
          (0.36 + lane * 0.17) * Math.sin(a),
          0.11 + lane * 0.018,
        ];
      }),
      0.032,
    );
  // Capture all chromatin and envelope vertices in one nuclear coordinate
  // system. A common invertible deformation preserves their containment and
  // the relation between the duplex, linker DNA and histone cores.
  group.updateMatrixWorld(true);
  const nuclearInverse = nuclear.matrixWorld.clone().invert();
  const deformingMeshes = [];
  function capture(mesh) {
    const toNuclear = nuclearInverse.clone().multiply(mesh.matrixWorld);
    const fromNuclear = toNuclear.clone().invert();
    const position = mesh.geometry.attributes.position;
    const rest = new Float64Array(position.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(toNuclear);
      rest.set(v.toArray(), i * 3);
    }
    deformingMeshes.push({ mesh, rest, fromNuclear });
  }
  capture(nuclearSurface);
  for (const fiber of nuclear.children.filter(
    (o) => o.name === "nucleosome-fiber",
  ))
    fiber.traverse((o) => {
      if (o.isMesh) capture(o);
    });
  let lastDeform = NaN;
  const deformationPoint = new THREE.Vector3();
  const nuclearPore = poreComplex(k, nuclear, [0.91, 0.27, 0.1], 0.1);
  const gata = k.mesh(
    new THREE.BoxGeometry(0.27, 0.22, 0.2),
    k.material("#b7886d"),
    [-0.8, 0.6, 0.3],
    nuclear,
  );
  for (const x of [-0.065, 0.065]) {
    k.ball([x, 0, 0.08], [0.08, 0.1, 0.08], k.material("#b7886d"), gata);
    helix(
      k,
      gata,
      [x, 0.01, 0.17],
      0.12,
      0.027,
      k.material("#d4b999"),
      2,
      "y",
      0.012,
    );
  }
  const rna = k.tube(
    [
      [0.4, 0.5, 0.3],
      [0.67, 0.32, 0.26],
      [0.72, 0.0, 0.3],
      [0.61, -0.27, 0.25],
    ],
    0.035,
    k.material("#bb9379"),
    nuclear,
  );
  rna.geometry.translate(-0.4, -0.5, -0.3);
  rna.position.set(0.4, 0.5, 0.3);
  const ribosomes = [],
    hemoglobin = [];
  const hemeMat = k.material("#b47c7c");
  for (let i = 0; i < 20; i++) {
    const a = i * 2.39996,
      rad = 1.35 + (i % 3) * 0.13;
    const x = -0.75 + Math.cos(a) * rad,
      y = Math.sin(a) * rad * 0.88;
    const rib = new THREE.Group();
    group.add(rib);
    rib.position.set(x, y, 0.17);
    k.ball([0, 0.025, 0], [0.105, 0.072, 0.085], k.material("#a69ba7"), rib);
    k.ball([0, -0.06, 0.005], [0.087, 0.035, 0.07], k.material("#c5b8ba"), rib);
    k.tube(
      [
        [-0.07, 0.04, 0.08],
        [-0.03, 0.075, 0.085],
        [0.035, 0.065, 0.085],
        [0.08, 0.018, 0.055],
      ],
      0.012,
      k.material("#dfcfc3"),
      rib,
      20,
    );
    ribosomes.push(rib);
    const h = new THREE.Group();
    group.add(h);
    for (const [dx, dy] of [
      [-0.065, -0.055],
      [0.065, -0.055],
      [-0.065, 0.055],
      [0.065, 0.055],
    ]) {
      k.ball([dx, dy, 0], 0.075, hemeMat, h);
      const heme = k.mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.009, 6),
        k.material("#d3a477"),
        [dx, dy, 0.069],
        h,
      );
      heme.rotation.x = Math.PI / 2;
      helix(
        k,
        h,
        [dx, dy, 0.049],
        0.085,
        0.024,
        k.material("#d1a2a0"),
        3,
        "y",
        0.009,
      );
    }
    hemoglobin.push({ h, x, y });
  }
  const mito = k.ring([-1.82, -0.71, 0.12], 0.26, 0.06, k.material("#b2a18c"));
  mito.scale.set(1, 0.6, 1);
  for (let i = 0; i < 3; i++)
    k.tube(
      [
        [-0.15 + i * 0.13, -0.1, 0.02],
        [-0.13 + i * 0.13, 0.09, 0.02],
        [-0.08 + i * 0.13, 0.08, 0.02],
        [-0.06 + i * 0.13, -0.1, 0.02],
      ],
      0.018,
      k.material("#cbbba5"),
      mito,
      24,
    );
  const labels = [
    k.label(
      [-0.75, 2.45, 0],
      "小鼠定型红系：有核红细胞",
      "Mouse definitive erythroblast",
      2,
    ),
    k.label(
      [-1.55, 0.85, 0.4],
      "GATA1 · 红系基因程序",
      "GATA1 · erythroid program",
      2,
    ),
    k.label([-2.15, -1.45, 0.2], "血红蛋白积累", "Hemoglobin accumulation", 1),
    k.label(
      [2.3, 1.14, 0.1],
      "膜包裹的排出核",
      "Membrane-enclosed pyrenocyte",
      2,
    ),
    k.label([-0.9, -2.12, 0.1], "网织红细胞", "Reticulocyte", 2),
    k.label(
      [0.95, -0.75, 0.1],
      "极化与膜收缩",
      "Polarization and constriction",
      1,
    ),
  ];
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      competent = parameters.program !== "impaired",
      t = competent ? p : 0;
    const transcription = ease(t, 0.05, 0.23),
      synthesis = ease(t, 0.23, 0.49),
      condense = ease(t, 0.44, 0.63),
      polarize = ease(t, 0.62, 0.76),
      extrude = ease(t, 0.75, 0.92),
      detach = ease(t, 0.92, 1);
    const sx = 2.28 - 0.73 * condense,
      sy = 2.05 - 0.65 * condense;
    cellMat.color.copy(start).lerp(red, synthesis);
    nuclear.position.set(
      -0.86 + 0.86 * polarize + 2.15 * extrude + 0.6 * detach,
      0.2 * (1 - polarize),
      0.07,
    );
    nuclear.scale.setScalar(1 - 0.46 * condense);
    const deform = 0.22 * Math.sin(Math.PI * extrude);
    if (deform !== lastDeform) {
      for (const { mesh, rest, fromNuclear } of deformingMeshes) {
        const position = mesh.geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
          const x = rest[i * 3],
            nx = x / 1.1;
          const waist = 1 - deform * Math.exp((-nx * nx) / 0.16);
          deformationPoint
            .set(x, rest[i * 3 + 1] * waist, rest[i * 3 + 2] * waist)
            .applyMatrix4(fromNuclear);
          position.setXYZ(i, ...deformationPoint.toArray());
        }
        position.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
      }
      lastDeform = deform;
    }
    nuclearMat.opacity = 0.16 + 0.2 * condense;
    gata.visible = competent && t < 0.46;
    gata.position.set(
      -0.8 + 0.63 * transcription,
      0.6 - 0.39 * transcription,
      0.3,
    );
    rna.visible = competent && t > 0.17 && t < 0.55;
    rna.scale.setScalar(Math.max(0.001, ease(t, 0.17, 0.3)));
    ribosomes.forEach((r, i) => {
      r.visible = i < 6 || t < 0.86;
      r.position.x = -0.75 + (hemoglobin[i].x + 0.75) * (1 - 0.3 * condense);
      r.position.y = hemoglobin[i].y * (1 - 0.3 * condense);
    });
    hemoglobin.forEach(({ h, x, y }, i) => {
      h.visible = synthesis > (i + 1) / 22;
      h.position.set(
        -0.75 + (x + 0.75) * (1 - 0.32 * condense),
        y * (1 - 0.32 * condense),
        0.14,
      );
    });
    mito.position.set(-1.82 + 0.35 * condense, -0.71, 0.12);
    mito.scale.set(1 - 0.4 * condense, 0.6 - 0.22 * condense, 1);
    // A nucleus-containing lobe moves out of the same membrane. Smooth union
    // removes the old internal boundary and makes a genuine narrowing neck.
    const nr = 1 - 0.46 * condense;
    plasma.update(
      [
        { center: [-0.75, 0, 0], radii: [sx, sy, 0.87 - 0.16 * condense] },
        {
          center: nuclear.position.toArray(),
          radii: [1.1 * nr + 0.13, nr + 0.13, 0.52 * nr + 0.13],
        },
      ],
      0.13,
    );
    labels[0].active = t < 0.92;
    labels[1].active = t < 0.44;
    labels[2].active = t >= 0.23 && t < 0.76;
    labels[3].active = t >= 0.77;
    labels[4].active = t >= 0.92;
    labels[5].active = t >= 0.62 && t < 0.94;
    group.userData = {
      organism: "mouse",
      lineage: "definitive erythroid",
      program: parameters.program || "competent",
      regulator: "GATA1",
      hemoglobinAccumulating: synthesis > 0.1,
      nucleusCondensed: condense > 0.9,
      nucleusExtruded: detach > 0.8,
      reticulocyte: detach > 0.8,
      pyrenocyteMembraneEnclosed: true,
      matureErythrocyte: false,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    science: { plasma, nuclear, nuclearSurface, deformingMeshes },
    materials: materialInventory(group),
    camera: { position: [0, 1.2, 10.8], target: [0, 0, 0] },
  };
}
export default {
  id: "differentiation",
  title: B("红系终末分化", "Terminal erythroid differentiation"),
  duration: 34,
  intro: B(
    "以小鼠定型红系为例，跟随已承诺红系的有核红细胞走向网织红细胞，观察 GATA1 相关基因程序、血红蛋白积累和排核。这里压缩了多个成熟阶段并省略中间分裂，不代表所有细胞的分化。",
    "Follow a committed mouse definitive erythroblast toward a reticulocyte through a GATA1-associated gene program, hemoglobin accumulation and enucleation. Several maturation stages are compressed and intervening divisions omitted; this is not a universal differentiation route.",
  ),
  controls: [
    {
      id: "program",
      label: B("红系调控程序", "Erythroid regulatory program"),
      default: "competent",
      options: [
        { value: "competent", label: B("GATA1 功能完整", "Functional GATA1") },
        {
          value: "impaired",
          label: B("GATA1 功能不足", "Insufficient GATA1 function"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("已承诺的红细胞谱系", "An already committed lineage"),
      description: B(
        "起点为小鼠定型红系的早期有核红细胞，不是任意干细胞。模型假定培养环境提供必要的支持信号。",
        "The starting cell is an early mouse definitive erythroblast, not an arbitrary stem cell. Necessary environmental support is assumed.",
      ),
    },
    {
      at: 0.17,
      title: B("执行红系基因程序", "Executing the erythroid program"),
      description: B(
        "核内 GATA1 与其他调控因子共同组织红系基因表达。GATA1 功能不足的比较条件在早期停滞；这一因子并非单独决定所有成熟事件。",
        "Nuclear GATA1 works with other regulators to organize erythroid gene expression. The insufficient-GATA1 comparison arrests early; GATA1 alone does not determine every maturation event.",
      ),
    },
    {
      at: 0.32,
      title: B("血红蛋白积累", "Accumulating hemoglobin"),
      description: B(
        "胞质中的翻译与血红素合成等过程支持血红蛋白积累，细胞逐渐改变组成。图中四叶结构为血红蛋白示意，数目不代表测量值。",
        "Translation and processes including heme synthesis support hemoglobin accumulation and changing cell composition. Four-lobed shapes represent hemoglobin; their counts are not measurements.",
      ),
    },
    {
      at: 0.5,
      title: B("细胞缩小与染色质凝聚", "Shrinkage and chromatin condensation"),
      description: B(
        "终末成熟过程中细胞缩小，核内染色质凝聚。图中沿一条后代路径压缩展示，未画出期间可能发生的细胞分裂。",
        "During terminal maturation the cell shrinks and nuclear chromatin condenses. A single descendant trajectory is compressed here; intervening cell divisions are not drawn.",
      ),
    },
    {
      at: 0.68,
      title: B("极化并排出细胞核", "Polarization and nuclear extrusion"),
      description: B(
        "凝聚的细胞核移向一侧，细胞骨架与膜运输协同参与排核。局部皮质收缩在此作示意；排核力学不简化为唯一的收缩环机制。",
        "The condensed nucleus moves to one side; cytoskeletal remodeling and membrane trafficking cooperate in extrusion. Local cortical constriction is schematic, not a claim that one contractile-ring mechanism fully explains enucleation.",
      ),
    },
    {
      at: 0.93,
      title: B("网织红细胞与排出核", "Reticulocyte and pyrenocyte"),
      description: B(
        "产物是无核网织红细胞和被膜包裹的排出核；后者通常由巨噬细胞清除。网织红细胞仍保留部分 RNA 与细胞器，还需继续成熟为红细胞。",
        "The products are an enucleated reticulocyte and a membrane-enclosed pyrenocyte, usually cleared by macrophages. The reticulocyte retains some RNA and organelles and must mature further into an erythrocyte.",
      ),
    },
  ],
  sources: [
    {
      title: "Nucleosome core particle (PDB 1AOI)",
      url: "https://www.rcsb.org/structure/1AOI",
    },
    {
      title:
        "Differential effects of GATA-1 on proliferation and differentiation of erythroid lineage cells",
      url: "https://pubmed.ncbi.nlm.nih.gov/16174764/",
    },
    {
      title:
        "Mammalian erythroblast enucleation requires PI3K-dependent cell polarization",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3283871/",
    },
    {
      title:
        "Tropomodulin 1 controls erythroblast enucleation via regulation of F-actin in the enucleosome",
      url: "https://pubmed.ncbi.nlm.nih.gov/28729432/",
    },
  ],
  create,
};
