import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
function create() {
  const k = sceneKit(),
    { group } = k;
  const integ = k.material("#b3be94"),
    sac = k.material("#c8cba7", {
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    }),
    eggMat = k.material("#a9bcb0", {
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
    synergidMat = k.material("#d2bc98", {
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
    maternal = k.material("#8a80a4"),
    paternal = k.material("#c88f6c"),
    tubeMat = k.material("#b5a17b");
  // A cutaway ovule is maternal multicellular tissue, not a single generic cell.
  const tissueMats = [k.material("#bec69d"), k.material("#aeba92")];
  for (let layer = 0; layer < 2; layer++)
    for (let cell = 0; cell < 28; cell++) {
      const a = -Math.PI * 0.38 + (cell / 28) * Math.PI * 1.76,
        span = (Math.PI * 1.76) / 28 - 0.011,
        ri = 0.96 + layer * 0.17,
        ro = ri + 0.145;
      const shape = new THREE.Shape();
      for (let j = 0; j <= 8; j++) {
        const t = a + (j / 8) * span,
          x = Math.cos(t) * 1.66 * ro,
          y = Math.sin(t) * 2.36 * ro;
        if (j === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      for (let j = 8; j >= 0; j--) {
        const t = a + (j / 8) * span;
        shape.lineTo(Math.cos(t) * 1.66 * ri, Math.sin(t) * 2.36 * ri);
      }
      shape.closePath();
      const mesh = k.mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.32,
          bevelEnabled: true,
          bevelSize: 0.012,
          bevelThickness: 0.012,
          bevelSegments: 2,
          steps: 1,
        }),
        tissueMats[(cell + layer) % 2],
        [0, 0, -0.18],
      );
      mesh.name = "Individual maternal integument cell";
      const mid = a + span / 2,
        r = (ri + ro) / 2;
      k.ball(
        [Math.cos(mid) * 1.66 * r, Math.sin(mid) * 2.36 * r, 0.17],
        [0.035, 0.05, 0.025],
        maternal,
      );
    }
  k.ball([0, 0.2, -0.12], [1.38, 2.05, 0.36], sac);
  const centralCell = k.ball([0, 0.63, -0.06], [1.15, 1.36, 0.27], sac);
  const egg = k.ball([-0.22, -1.02, 0.12], [0.47, 0.53, 0.28], eggMat);
  const synergids = [-1, 1].map((side) =>
    k.ball([side * 0.66, -1.58, 0.12], [0.28, 0.46, 0.22], synergidMat),
  );
  const filiform = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    group.add(g);
    filiform.push(g);
    g.name = "Synergid filiform apparatus wall ingrowths";
    for (let i = 0; i < 6; i++)
      k.tube(
        [
          [side * 0.66 - 0.19 + i * 0.074, -1.98, 0.24],
          [side * 0.66 - 0.17 + i * 0.065, -1.82 + (i % 2) * 0.07, 0.29],
          [side * 0.66 - 0.13 + i * 0.055, -1.67, 0.2],
        ],
        0.017,
        integ,
        g,
        20,
      );
  }
  const eggNucleus = k.ball([-0.22, -0.92, 0.37], 0.18, maternal);
  const centralNucleus = k.ball([0, 0.65, 0.2], 0.27, maternal);
  const maternalMarks = [
    k.ball([-0.27, -0.92, 0.48], 0.055, maternal),
    k.ball([-0.1, 0.65, 0.4], 0.064, maternal),
    k.ball([0.1, 0.65, 0.4], 0.064, maternal),
  ];
  const spermMarkers = [
    k.ball([0, 0, 0], 0.07, paternal),
    k.ball([0, 0, 0], 0.07, paternal),
  ];
  spermMarkers.forEach(
    (m) => (m.name = "Paternal nuclear contribution after fusion"),
  );
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.9, -3.15, 0),
    new THREE.Vector3(-1.4, -3.1, 0),
    new THREE.Vector3(0.12, -2.7, 0.05),
    new THREE.Vector3(0.66, -2.05, 0.1),
    new THREE.Vector3(0.66, -1.48, 0.15),
  ]);
  tubeMat.side = THREE.DoubleSide;
  function cutTube(radius) {
    const g = new THREE.TubeGeometry(path, 80, radius, 16, false),
      src = g.index.array,
      pos = g.attributes.position,
      indices = [];
    for (let i = 0; i < src.length; i += 3) {
      const ids = [src[i], src[i + 1], src[i + 2]],
        ring = Math.floor(ids[0] / 17),
        center = path.getPoint(Math.min(1, ring / 80));
      const z = ids.reduce((sum, id) => sum + pos.getZ(id), 0) / 3;
      if (z <= center.z + 0.015) indices.push(...ids);
    }
    g.setIndex(indices);
    return g;
  }
  const tubeGeometry = cutTube(0.145),
    tube = k.mesh(tubeGeometry, tubeMat);
  const tubeLumenGeometry = cutTube(0.108);
  k.mesh(
    tubeLumenGeometry,
    k.material("#9bae9b", { side: THREE.DoubleSide }),
    [0, 0, 0],
  );
  tube.name = "Pollen tube open-front wall and lumen";
  const vegetativeNucleus = k.ball([0, 0, 0], [0.06, 0.1, 0.05], maternal);
  const sperm = [
    k.ball([0, 0, 0], 0.12, paternal),
    k.ball([0, 0, 0], 0.12, paternal),
  ];
  for (const cell of sperm) {
    cell.material = k.material("#c99d84", {
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    });
    const nucleus = k.ball([0, 0, 0.45], [0.63, 0.66, 0.4], paternal, cell);
    nucleus.name = "Paternal nucleus carried by sperm";
    const rim = k.ring([0, 0, 0.15], 0.92, 0.045, paternal, cell);
    rim.name = "Sperm plasma membrane cut edge";
  }
  const sample = new THREE.Vector3();
  const embryo = new THREE.Group();
  group.add(embryo);
  embryo.name = "Asymmetric two-cell Arabidopsis embryo";
  // Micropyle is below: the larger basal daughter is on that side.
  const daughters = [
    { name: "Basal embryo cell", y: -1.16, size: [0.27, 0.32, 0.2] },
    { name: "Apical embryo cell", y: -0.63, size: [0.22, 0.18, 0.17] },
  ];
  for (const { name, y, size } of daughters) {
    const cell = k.ball([-0.22, y, 0.19], size, eggMat, embryo);
    cell.name = name;
    const nucleus = k.ball([-0.22, y, 0.24], 0.09, maternal, embryo);
    nucleus.name = name + " nucleus 2n";
  }
  const divisionWall = k.mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.018, 28),
    integ,
    [-0.22, -0.82, 0.19],
    embryo,
  );
  divisionWall.name = "First embryo division wall";
  const endosperm = [
    [-0.45, 0.7],
    [0.45, 0.7],
    [0, 1.4],
    [0, 0.1],
  ].map(([x, y]) => k.ball([x, y, 0.2], 0.17, maternal));
  const labels = [
    k.label(
      [-1.9, 2.58, 0.2],
      "胚珠 · 多细胞组织",
      "Ovule · multicellular tissue",
      3,
    ),
    k.label(
      [1.52, 0.82, 0.3],
      "中央细胞核 · 母方 2n",
      "Central nucleus · maternal 2n",
      3,
    ),
    k.label([-0.85, -0.7, 0.7], "卵细胞 · n", "Egg cell · n", 3),
    k.label([1.1, -1.86, 0.5], "接受花粉管的助细胞", "Receptive synergid", 2),
    k.label(
      [-2.1, -2.85, 0.3],
      "花粉管携带两个精细胞",
      "Pollen tube carries two sperm",
      2,
    ),
    k.label([-0.5, -1.2, 0.7], "2n 胚的起点", "Origin of the 2n embryo", 3),
    k.label([0.72, 1.65, 0.6], "3n 胚乳谱系", "3n endosperm lineage", 3),
  ];
  function update(value, parameters = {}) {
    const p = clamp(value),
      arrival = ease(p, 0, 0.3),
      release = ease(p, 0.3, 0.45),
      fusion = ease(p, 0.48, 0.72),
      development = ease(p, 0.82, 1),
      swapped = parameters.assignment === "frontCentral";
    tubeGeometry.setDrawRange(
      0,
      Math.max(3, Math.floor((arrival * tubeGeometry.index.count) / 3) * 3),
    );
    tubeLumenGeometry.setDrawRange(
      0,
      Math.max(
        3,
        Math.floor((arrival * tubeLumenGeometry.index.count) / 3) * 3,
      ),
    );
    path.getPoint(Math.max(0, arrival - 0.07), sample);
    vegetativeNucleus.position.copy(sample);
    vegetativeNucleus.position.z += 0.09;
    vegetativeNucleus.visible = p < 0.31;
    filiform.forEach((g, i) => {
      g.visible = i === 0 || p < 0.63;
    });
    sperm.forEach((m, i) => {
      const eggTarget = (i === 0) !== swapped;
      const tx = eggTarget ? -0.22 : 0,
        ty = eggTarget ? -0.92 : 0.65;
      if (p < 0.3) {
        path.getPoint(Math.max(0, arrival - 0.13 - 0.07 * i), sample);
        m.position.copy(sample);
      } else {
        path.getPoint(0.87 - 0.07 * i, sample);
        m.position.set(
          sample.x * (1 - release) + (0.08 + i * 0.13) * release,
          sample.y * (1 - release) - 0.49 * release,
          sample.z * (1 - release) + 0.25 * release,
        );
        m.position.x += (tx - m.position.x) * fusion;
        m.position.y += (ty - m.position.y) * fusion;
      }
      m.visible = p < 0.72;
      m.scale.setScalar(0.12 * (1 - 0.65 * ease(p, 0.65, 0.72)));
    });
    synergids[1].scale.set(
      0.28 * (1 - 0.35 * release),
      0.46 * (1 - 0.4 * release),
      0.22,
    );
    synergids[1].visible = p < 0.63;
    eggNucleus.visible = p < 0.9;
    centralNucleus.visible = p < 0.86;
    egg.visible = p < 0.9;
    centralCell.visible = true;
    spermMarkers[0].position.set(-0.13, -0.92, 0.49);
    spermMarkers[1].position.set(0, 0.77, 0.43);
    spermMarkers.forEach((m) => (m.visible = p >= 0.72 && p < 0.86));
    maternalMarks.forEach((m) => {
      m.visible = p < 0.86;
    });
    embryo.visible = p >= 0.9;
    endosperm.forEach((m, i) => {
      m.visible = p >= 0.86;
      m.scale.setScalar(0.17 * (0.7 + 0.3 * development));
      m.position.x = [-0.45, 0.45, 0, 0][i] * (0.7 + 0.3 * development);
    });
    labels[1].active = p < 0.72;
    labels[2].active = p < 0.72;
    labels[3].active = p < 0.63;
    labels[4].active = p < 0.48;
    labels[5].active = p >= 0.72;
    labels[6].active = p >= 0.72;
    group.userData = {
      mechanism: "angiosperm double fertilization",
      species: "Arabidopsis thaliana",
      sceneScale: "multicellular ovule",
      spermCount: 2,
      immotileSperm: true,
      assignment: swapped ? "front-central" : "front-egg",
      eggFertilized: p >= 0.72,
      centralCellFertilized: p >= 0.72,
      embryoPloidy: p >= 0.72 ? 2 : null,
      endospermPloidy: p >= 0.72 ? 3 : null,
      maternalCentralNucleusPloidy: 2,
      progress: p,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0.5, 1, 11], target: [0, -0.1, 0] },
  };
}
export default {
  id: "doubleFertilization",
  title: b("被子植物双受精", "Angiosperm double fertilization"),
  duration: 36,
  intro: b(
    "拟南芥胚珠的多细胞组织剖面，包含母体珠被、胚囊、卵细胞和助细胞，不是单个植物细胞。中央细胞的两个母方极核已融合为 2n 核。两精细胞分别建立 2n 胚和 3n 胚乳谱系，末段压缩了后续发育时间。",
    "A multicellular Arabidopsis ovule cutaway includes maternal integuments, embryo sac, egg, and synergids; it is not one plant cell. The central cell has already fused its two maternal polar nuclei into a 2n nucleus. Two sperm establish the 2n embryo and 3n endosperm lineages; later development is time-compressed.",
  ),
  controls: [
    {
      id: "assignment",
      label: b("等价精细胞的去向示例", "Example fate of equivalent sperm"),
      default: "frontEgg",
      options: [
        {
          value: "frontEgg",
          label: b("前方精细胞进入卵", "Front sperm enters egg"),
        },
        {
          value: "frontCentral",
          label: b("前方精细胞进入中央细胞", "Front sperm enters central cell"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("胚珠中的雌配子", "Female gametes in the ovule"),
      description: b(
        "母体组织包围胚囊。卵细胞为 n，中央细胞含已融合的两个母方极核；退化的反足细胞未画出。",
        "Maternal tissue surrounds the embryo sac. The egg is haploid; the central cell contains two already-fused maternal polar nuclei. Degenerated antipodal cells are omitted.",
      ),
    },
    {
      at: 0.17,
      title: b("花粉管送达", "Pollen-tube delivery"),
      description: b(
        "花粉管经珠孔进入一枚接受性助细胞附近，携带两个无鞭毛、不主动游动的精细胞。",
        "The pollen tube enters through the micropyle near a receptive synergid, carrying two nonmotile sperm without flagella.",
      ),
    },
    {
      at: 0.33,
      title: b("释放到配子交界", "Release at the gamete boundary"),
      description: b(
        "花粉管释放两个精细胞，接受性助细胞退化。精细胞被送到卵细胞与中央细胞的交界区域。",
        "Tube discharge delivers both sperm to the boundary between egg and central cell; the receptive synergid degenerates.",
      ),
    },
    {
      at: 0.5,
      title: b("分别融合", "One sperm for each female gamete"),
      description: b(
        "一个精细胞与卵融合，另一个与中央细胞融合。两精细胞的前后位置不预先限定命运，两次融合也没有固定先后。",
        "One sperm fuses with the egg and the other with the central cell. Their original front/back positions do not fix their fate, and the two fusions have no obligatory order.",
      ),
    },
    {
      at: 0.73,
      title: b("建立两种倍性", "Two ploidy outcomes"),
      description: b(
        "卵核 n 与精核 n 形成 2n 合子；中央细胞母方 2n 核与另一精核 n 形成 3n 初生胚乳核。",
        "Egg n plus sperm n yields a 2n zygote. The maternal central-cell 2n nucleus plus the other sperm n yields a 3n primary endosperm nucleus.",
      ),
    },
    {
      at: 0.88,
      title: b("胚与胚乳分别发育", "Embryo and endosperm develop"),
      description: b(
        "拟南芥合子首次不等分形成较小的顶端细胞和朝珠孔的较大基部细胞；胚乳早期进行游离核分裂。形态与时间尺度为示意。",
        "The Arabidopsis zygote first divides asymmetrically into a smaller apical cell and a larger basal cell toward the micropyle; early endosperm undergoes free-nuclear divisions. Shapes and timing are schematic.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Kimata et al. (2016), Cytoskeleton dynamics control the first asymmetric cell division in Arabidopsis zygote",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5150365/",
    },
    {
      title:
        "Hamamura et al. (2011), Live-cell imaging reveals the dynamics of two sperm cells during double fertilization in Arabidopsis thaliana",
      url: "https://pubmed.ncbi.nlm.nih.gov/21396821/",
    },
    {
      title:
        "Polyspermy Block in the Central Cell During Double Fertilization of Arabidopsis thaliana",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7835324/",
    },
  ],
  create,
};
