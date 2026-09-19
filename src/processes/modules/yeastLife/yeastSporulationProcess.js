import {
  wallAnatomy,
  nuclearAnatomy,
  layeredCutaway,
  surfacePores,
  materialInventory,
  cutSphere,
} from "./anatomy.js";
import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";

function dividingEnvelope(k, material, axis) {
  const n = 32,
    m = 40,
    g = new THREE.BufferGeometry(),
    v = new Float32Array((n + 1) * (m + 1) * 3),
    index = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const a = i * (m + 1) + j,
        b = a + m + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  g.setAttribute("position", new THREE.BufferAttribute(v, 3));
  g.setIndex(index);
  const mesh = k.mesh(g, material);
  return {
    mesh,
    shape(extension, pinch, secondDivision = 0) {
      for (let i = 0; i <= n; i++) {
        const t = i / n,
          long = -0.5 * (1.35 + 1.75 * extension) * Math.cos(Math.PI * t),
          r = 0.64 * Math.sin(Math.PI * t);
        for (let j = 0; j <= m; j++) {
          const a = (j * 2 * Math.PI) / m,
            q = (i * (m + 1) + j) * 3;
          const y = r * (1 + 1.4 * secondDivision) * Math.cos(a);
          // The common envelope broadens around both MII spindles. Late
          // constrictions leave a thin connected sheet between four lobes;
          // only completion of MII permits its final partition.
          const bridge =
            (1 - 0.86 * pinch * Math.exp(-Math.pow(long / 0.24, 2))) *
            (1 - 0.86 * pinch * Math.exp(-Math.pow(y / 0.24, 2)));
          v[q] = axis === "x" ? long : r * Math.cos(a);
          v[q + 1] = axis === "x" ? y : long;
          v[q + 2] = r * (1 - 0.35 * secondDivision) * Math.sin(a) * bridge;
        }
      }
      g.attributes.position.needsUpdate = true;
      g.computeVertexNormals();
      g.computeBoundingSphere();
      g.computeBoundingBox();
    },
  };
}
// An actual growing membrane cup, rather than a closed spore appearing at once.
function prosporeMembrane(k, material) {
  const n = 24,
    m = 36,
    g = new THREE.BufferGeometry(),
    v = new Float32Array((n + 1) * (m + 1) * 3),
    index = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const a = i * (m + 1) + j,
        b = a + m + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  g.setAttribute("position", new THREE.BufferAttribute(v, 3));
  g.setIndex(index);
  const mesh = k.mesh(g, material);
  return {
    mesh,
    shape(closure) {
      const maxAngle = 0.22 + (Math.PI - 0.22) * closure;
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= m; j++) {
          const t = (i / n) * maxAngle,
            a = (j / m) * Math.PI * 2,
            q = (i * (m + 1) + j) * 3;
          v[q] = 0.64 * Math.sin(t) * Math.cos(a);
          v[q + 1] = 0.64 * Math.sin(t) * Math.sin(a);
          v[q + 2] = -0.64 * Math.cos(t);
        }
      g.attributes.position.needsUpdate = true;
      g.computeVertexNormals();
      g.computeBoundingSphere();
      g.computeBoundingBox();
    },
  };
}
function create() {
  const k = sceneKit(),
    { group } = k;
  const cellMat = k.material("#b8ae96", {
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
  });
  const nuclearMat = k.material("#919abd", {
    transparent: true,
    opacity: 0.31,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const sporeMat = k.material("#83a699", {
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const matureMat = k.material("#bb9d70", {
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const teal = k.material("#61968b"),
    rose = k.material("#b68191"),
    gold = k.material("#c7a665");
  const ascus = k.ball([0, 0, -0.1], [2.36, 2.07, 1.35], cellMat);
  wallAnatomy(k, ascus);
  const rim = k.ring([0, 0, -0.23], 1, 0.022, k.material("#b6ac94"));
  rim.scale.set(2.36, 2.07, 1);
  const early = dividingEnvelope(k, nuclearMat, "x");
  early.mesh.name = "sporulation-common-nuclear-envelope";
  const meioticEnvelopeLayers = [layeredCutaway(k, early.mesh, 32, 40, true)];
  const meioticPores = [surfacePores(k, early.mesh, 32, 40)];
  const centers = [
    [-0.88, -0.82, 0],
    [-0.88, 0.82, 0],
    [0.88, -0.82, 0],
    [0.88, 0.82, 0],
  ];
  const finalNuclei = centers.map((c) =>
    k.ball(c, [0.35, 0.37, 0.34], nuclearMat),
  );
  const membranes = centers.map((c) => {
    const s = prosporeMembrane(k, sporeMat);
    s.mesh.position.set(...c);
    return s;
  });
  finalNuclei.forEach((n, i) => {
    n.name = `sporulation-daughter-nucleus-${i}`;
    nuclearAnatomy(k, n);
  });
  const wallGeometry = cutSphere();
  const walls = centers.map((c, i) => {
    // Mannan and glucan appear in the intermembrane lumen; the outer two
    // layers are deposited only after the outer prospore membrane is lost.
    return [
      [0.614, "#e1d4b5", "mannan"],
      [0.63, "#d3bea0", "glucan"],
      [0.654, "#bba687", "chitosan"],
      [0.679, "#aa856a", "dityrosine"],
    ].map(([radius, color, identity]) => {
      const mesh = k.mesh(
        wallGeometry,
        k.material(color, { side: THREE.DoubleSide }),
        c,
      );
      mesh.scale.setScalar(radius);
      mesh.name = `sporulation-wall-${i}-${identity}`;
      const edge = k.ring([0, 0, 0.32], 0.947, 0.009, k.material(color), mesh);
      edge.name = "spore-wall-cut-edge";
      if (identity === "glucan" || identity === "dityrosine") {
        for (let strand = 0; strand < 5; strand++) {
          const polar = 0.8 + strand * 0.22;
          const points = Array.from({ length: 24 }, (_, j) => {
            const a = (j / 23) * Math.PI * 0.64;
            return [
              0.999 * Math.sin(polar) * Math.cos(a),
              0.999 * Math.cos(polar),
              -0.999 * Math.sin(polar) * Math.sin(a),
            ];
          });
          k.tube(points, 0.006, k.material("#b99a7f"), mesh, 40);
        }
      }
      return mesh;
    });
  });
  const membraneInner = membranes.map((m) => {
    const g = m.mesh.geometry.clone();
    const layer = k.mesh(
      g,
      k.material("#c6d6bf", {
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      }),
    );
    layer.position.copy(m.mesh.position);
    return layer;
  });
  membranes.forEach((m, i) => {
    m.mesh.name = `sporulation-outer-prospore-membrane-${i}`;
  });
  membraneInner.forEach((m, i) => {
    m.name = `sporulation-persistent-spore-pm-${i}`;
  });
  const closureRims = centers.map((c) => {
    const r = k.ring(c, 0.64, 0.025, k.material("#6b998a"));
    return r;
  });
  const chromatid = Array.from({ length: 4 }, (_, i) => {
    const g = new THREE.Group();
    group.add(g);
    k.segment([0, -0.2, 0], [0, 0.13, 0], 0.06, i < 2 ? teal : rose, g);
    const tip = k.segment(
      [0, 0.13, 0],
      [0, 0.26, 0],
      0.06,
      i < 2 ? teal : rose,
      g,
    );
    for (let strand = 0; strand < 2; strand++)
      k.tube(
        Array.from({ length: 50 }, (_, j) => {
          const t = j / 49;
          return [
            0.046 * Math.cos(t * Math.PI * 12 + strand * Math.PI),
            -0.2 + 0.46 * t,
            0.046 * Math.sin(t * Math.PI * 12 + strand * Math.PI),
          ];
        }),
        0.012,
        i < 2 ? teal : rose,
        g,
        64,
      );
    const centromere = k.ball([0, -0.02, 0], 0.078, gold, g);
    return { g, tip, centromere };
  });
  const spindleI = k.segment([-0.8, 0, 0.02], [0.8, 0, 0.02], 0.024, gold);
  const spindleII = [
    k.segment([-0.88, -0.82, 0.02], [-0.88, 0.82, 0.02], 0.022, gold),
    k.segment([0.88, -0.82, 0.02], [0.88, 0.82, 0.02], 0.022, gold),
  ];
  const poles = centers.map((c) => k.ball(c, 0.08, gold));
  const vesicles = Array.from({ length: 12 }, () =>
    k.ball([0, 0, 0], 0.047, teal),
  );
  const nutrients = Array.from({ length: 10 }, (_, i) =>
    k.ball(
      [2.75 + 0.22 * Math.sin(i * 2), -1.35 + i * 0.29, 0],
      0.075,
      i % 2 ? teal : gold,
    ),
  );
  const labels = [
    k.label(
      [0, 2.55, 0],
      "a/α 二倍体 · 酿酒酵母",
      "a/α diploid · S. cerevisiae",
      10,
    ),
    k.label(
      [0, -2.6, 0],
      "缺氮 + 非发酵碳源（如乙酸）",
      "Nitrogen starvation + nonfermentable carbon (e.g. acetate)",
      10,
    ),
    k.label(
      [0, 0.95, 0.8],
      "一次复制 → 同源配对与重组",
      "One replication → homolog pairing and recombination",
      10,
    ),
    k.label(
      [0, -1.2, 0.8],
      "减数分裂 I：同源染色体分离",
      "Meiosis I: homologs segregate",
      10,
    ),
    k.label(
      [0, -1.7, 0.8],
      "减数分裂 II：姐妹染色单体分离",
      "Meiosis II: sister chromatids segregate",
      10,
    ),
    k.label(
      [0, 1.78, 0.6],
      "前孢子膜生长并闭合",
      "Prospore membranes grow and close",
      10,
    ),
    k.label(
      [0, -2.55, 0],
      "子囊中四个单倍体子囊孢子",
      "Four haploid ascospores within one ascus",
      10,
    ),
    k.label(
      [0, -2.55, 0],
      "营养充足：不启动本产孢程序",
      "Nutrient-rich: this sporulation program stays off",
      10,
    ),
  ];
  function update(raw, parameters = {}) {
    const p = clamp(raw),
      induced = parameters.nutrients !== "rich",
      q = induced ? p : 0;
    const replication = ease(q, 0.08, 0.2),
      mi = ease(q, 0.3, 0.47),
      mii = ease(q, 0.5, 0.67),
      closure = ease(q, 0.61, 0.83),
      mature = ease(q, 0.84, 0.96);
    early.mesh.visible = q < 0.8;
    early.shape(mi, ease(q, 0.68, 0.8), mii);
    for (let i = 0; i < 2; i++) {
      spindleII[i].visible = q >= 0.5 && q < 0.72;
      spindleII[i].scale.set(0.022, 0.25 + 1.45 * mii, 0.022);
    }
    spindleI.visible = q > 0.25 && q < 0.5;
    spindleI.scale.set(0.024, 0.7 + 1.2 * mi, 0.024);
    for (let i = 0; i < 4; i++) {
      const homolog = i < 2 ? 0 : 1,
        sister = i % 2,
        sign = homolog === 0 ? -1 : 1;
      chromatid[i].g.visible = sister === 0 || replication > 0.05;
      chromatid[i].g.position.set(
        sign * (0.23 + 0.65 * mi) +
          (1 - mi) * (sister - 0.5) * 0.16 * replication,
        (sister === 0 ? -1 : 1) * (0.06 * replication + 0.76 * mii),
        0.1,
      );
      chromatid[i].tip.material =
        q > 0.26 && (i === 1 || i === 2)
          ? homolog === 0
            ? rose
            : teal
          : homolog === 0
            ? teal
            : rose;
      finalNuclei[i].visible = q >= 0.8;
      membranes[i].mesh.visible = q > 0.59 && q < 0.9;
      membranes[i].shape(closure);
      const source = membranes[i].mesh.geometry.attributes.position.array,
        dest = membraneInner[i].geometry.attributes.position.array;
      for (let j = 0; j < source.length; j++) dest[j] = source[j] * 0.947;
      membraneInner[i].geometry.attributes.position.needsUpdate = true;
      membraneInner[i].geometry.computeVertexNormals();
      membraneInner[i].geometry.computeBoundingBox();
      membraneInner[i].geometry.computeBoundingSphere();
      membraneInner[i].visible = q > 0.59;
      const cupAngle = 0.22 + (Math.PI - 0.22) * closure;
      closureRims[i].visible = q > 0.59 && q < 0.84;
      closureRims[i].scale.setScalar(Math.max(0.001, Math.sin(cupAngle)));
      closureRims[i].position.set(
        centers[i][0],
        centers[i][1],
        -0.64 * Math.cos(cupAngle),
      );
      walls[i][0].visible = q > 0.84;
      walls[i][1].visible = q > 0.86;
      walls[i][2].visible = q >= 0.91;
      walls[i][3].visible = q >= 0.94;
      matureMat.opacity = 0.1 + 0.28 * mature;
      poles[i].visible = q > 0.51 && q < 0.82;
      poles[i].position.set(centers[i][0], centers[i][1], -0.37);
    }
    for (let i = 0; i < 12; i++) {
      const c = centers[Math.floor(i / 3)],
        t = (q * 2 + i / 12) % 1;
      vesicles[i].visible = q > 0.59 && q < 0.82;
      vesicles[i].position.set(
        c[0] + 0.8 * (1 - t) * Math.cos(i * 2),
        c[1] + 0.8 * (1 - t) * Math.sin(i * 2),
        -0.6 - 0.25 * (1 - t),
      );
    }
    meioticEnvelopeLayers.forEach((l) => l.update());
    meioticPores.forEach((l) => l.update());
    nutrients.forEach((n) => {
      n.visible = !induced;
    });
    labels[1].active = induced && q < 0.85;
    labels[2].active = induced && q < 0.31;
    labels[3].active = induced && q >= 0.3 && q < 0.5;
    labels[4].active = induced && q >= 0.5 && q < 0.68;
    labels[5].active = induced && q >= 0.65 && q < 0.87;
    labels[6].active = induced && q >= 0.87;
    labels[7].active = !induced;
    group.userData = {
      species: "Saccharomyces cerevisiae",
      process: "sporulation",
      progress: p,
      startingGenotype: "a/alpha diploid",
      condition: induced ? "nitrogen-starved-acetate" : "nutrient-rich",
      meioticProgramActive: induced,
      dnaReplicationRounds: q >= 0.2 ? 1 : 0,
      meioticDivisions: q >= 0.69 ? 2 : q >= 0.48 ? 1 : 0,
      nuclei: q >= 0.8 ? 4 : 1,
      ploidy: q >= 0.48 ? "n" : "2n",
      prosporeMembraneClosure: closure,
      matureAscosporeCount: q >= 0.96 ? 4 : 0,
      sporeType: "meiotic ascospores",
      bacterialEndospore: false,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    materials: materialInventory(group, [
      cellMat,
      nuclearMat,
      sporeMat,
      matureMat,
      teal,
      rose,
      gold,
    ]),
    camera: { position: [0, 1.05, 10.5], target: [0, 0, 0] },
  };
}
export default {
  id: "yeastSporulation",
  title: B("酵母减数分裂与产孢", "Yeast meiosis and sporulation"),
  duration: 36,
  intro: B(
    "展示酿酒酵母 a/α 二倍体在缺氮、具有非发酵碳源并适于呼吸的条件下形成四孢子子囊的代表性流程。只画一对同源染色体；省略染色体数量与大量调控步骤，时间非真实比例。不同菌株和营养条件下不一定产生四个成熟孢子。",
    "A representative four-spored ascus forms from an S. cerevisiae a/α diploid under nitrogen starvation, with a nonfermentable carbon source and conditions supporting respiration. Only one homolog pair is shown; chromosome counts and many regulatory steps are omitted, and timing is schematic. Not all strains or nutrient conditions yield four mature spores.",
  ),
  controls: [
    {
      id: "nutrients",
      label: B("二倍体的营养条件", "Diploid nutrient condition"),
      default: "starved",
      options: [
        {
          value: "starved",
          label: B("缺氮 + 乙酸", "Nitrogen starvation + acetate"),
        },
        { value: "rich", label: B("营养充足对照", "Nutrient-rich control") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("二倍体响应营养信号", "Diploid responds to nutrient signals"),
      description: B(
        "a/α 二倍体在适合的饥饿条件下从营养生殖转入减数分裂。缺氮且有非发酵碳源是典型诱导条件；营养充足对照不启动这里的产孢过程。",
        "An a/α diploid switches from vegetative growth to meiosis under appropriate starvation conditions. Nitrogen starvation with a nonfermentable carbon source is a typical induction regime; the nutrient-rich control does not initiate the sporulation sequence shown.",
      ),
    },
    {
      at: 0.14,
      title: B(
        "一次 DNA 复制与同源重组",
        "One DNA replication and homologous recombination",
      ),
      description: B(
        "减数分裂前进行一次 DNA 复制。复制后的同源染色体配对并可交换片段；颜色变化仅示意一对同源染色体的一次重组事件。",
        "A single premeiotic S phase replicates DNA. Replicated homologs pair and can exchange segments; the color exchange schematically shows one recombination event in one representative homolog pair.",
      ),
    },
    {
      at: 0.31,
      title: B("第一次分裂分开同源染色体", "First division separates homologs"),
      description: B(
        "减数分裂 I 将同源染色体分到两侧，每个同源染色体的姐妹染色单体仍保持关联。染色体组数由二倍体降为单倍体，但染色体仍含两条姐妹染色单体。",
        "Meiosis I segregates homologous chromosomes while sister chromatids remain associated. Chromosome-set number is reduced from diploid to haploid, but each chromosome still has two sister chromatids.",
      ),
    },
    {
      at: 0.51,
      title: B(
        "第二次分裂分开姐妹染色单体",
        "Second division separates sister chromatids",
      ),
      description: B(
        "不再进行一次 DNA 复制，两个核内纺锤体分开姐妹染色单体。共同核膜在两轮减数分裂间保持连接，第二次分裂后期形成四个核叶，随后分隔成四个单倍体核。",
        "Without another DNA replication, two intranuclear spindles separate sister chromatids. The common nuclear envelope stays connected between meiotic divisions, forms four lobes late in meiosis II, and then partitions into four haploid nuclei.",
      ),
    },
    {
      at: 0.66,
      title: B(
        "前孢子膜包围核与胞质",
        "Prospore membranes enclose nuclei and cytoplasm",
      ),
      description: B(
        "减数分裂 II 期间，在改建的纺锤体极体附近形成前孢子膜。膜杯生长并最终闭合，各包围一个单倍体核和一部分胞质；模型用相邻的内外膜层与闭合前缘显示包裹过程，膜厚度经过夸张。",
        "During meiosis II, prospore membranes form near remodeled spindle pole bodies. Membrane cups expand and close around individual haploid nuclei and some cytoplasm. Adjacent inner and outer membrane surfaces and a closing leading edge show enclosure, with exaggerated membrane thickness.",
      ),
    },
    {
      at: 0.87,
      title: B("孢子壁成熟，形成子囊", "Spore walls mature within the ascus"),
      description: B(
        "闭合后，内侧前孢子膜保留为孢子质膜，甘露聚糖和葡聚糖先沉积在两膜之间；外膜消退后，外侧再形成壳聚糖和二酪氨酸层。四个减数分裂产生的子囊孢子留在母细胞形成的子囊内，本场景不展示释放与萌发。",
        "After closure, the inner prospore membrane persists as spore plasma membrane. Mannan and glucan first accumulate between the two membranes; after the outer membrane disappears, chitosan and dityrosine layers form outside. Four meiotic ascospores remain in the maternal ascus; release and germination are not shown.",
      ),
    },
  ],
  legend: [
    {
      color: "#61968b",
      text: B(
        "一个亲本的染色体片段 / 前孢子膜",
        "One parental chromosome segment / prospore membrane",
      ),
    },
    {
      color: "#b68191",
      text: B("另一个亲本的染色体片段", "Other parental chromosome segment"),
    },
    { color: "#919abd", text: B("核膜", "Nuclear envelope") },
    { color: "#bb9d70", text: B("成熟孢子壁", "Mature spore wall") },
  ],
  sources: [
    {
      title:
        "Prospore Membrane Formation Defines a Developmentally Regulated Branch of the Secretory Pathway in Yeast",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2132592/",
    },
    {
      title:
        "A Highly Redundant Gene Network Controls Assembly of the Outer Spore Wall in S. cerevisiae",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3744438/",
    },
    {
      title:
        "Recruitment of the lipid kinase Mss4 to the meiotic spindle pole promotes prospore membrane formation in Saccharomyces cerevisiae",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10092644/",
    },
    {
      title: "Sporulation in the Budding Yeast Saccharomyces cerevisiae",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3213374/",
    },
    {
      title:
        "Membrane and organelle rearrangement during ascospore formation in budding yeast",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11426023/",
    },
  ],
  create,
};
