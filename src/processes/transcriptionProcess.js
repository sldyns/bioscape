import * as THREE from "three";

const clamp = (value) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const phase = (p, a, b) => clamp((p - a) / (b - a));
const smooth = (value) => value * value * (3 - 2 * value);
const TAU = Math.PI * 2;

function create() {
  const group = new THREE.Group();
  group.name = "Eukaryotic transcription — local DNA opening and nascent RNA";
  const sphere = new THREE.SphereGeometry(1, 16, 12);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
  const mat = (color, extra = {}) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.52,
      clearcoat: 0.16,
      clearcoatRoughness: 0.5,
      ...extra,
    });
  const templateMaterial = mat("#719e9b");
  const codingMaterial = mat("#a0aaca");
  const templateBase = mat("#a9c6be");
  const codingBase = mat("#c4c8db");
  const rnaMaterial = mat("#cc925b");
  const rnaBaseMaterial = mat("#e3b780");
  const proteinMaterials = [mat("#8b9bb3"), mat("#a3b0c2"), mat("#b4bfcc")];
  const instances = (geometry, material, count, name) => {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.name = name;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Dynamic positions can move beyond a previously computed instance bound.
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };
  const dnaSegments = 256,
    pairs = 80,
    rnaSegments = 96;
  const rails = [templateMaterial, codingMaterial].map((m, i) =>
    instances(
      cylinder,
      m,
      dnaSegments,
      `${i ? "coding" : "template"}-backbone`,
    ),
  );
  const phosphates = [templateMaterial, codingMaterial].map((m, i) =>
    instances(sphere, m, pairs, `${i ? "coding" : "template"}-phosphates`),
  );
  const bases = [templateBase, codingBase].map((m, i) =>
    instances(cylinder, m, pairs, `${i ? "coding" : "template"}-bases`),
  );
  const rna = instances(
    cylinder,
    rnaMaterial,
    rnaSegments,
    "nascent-rna-backbone",
  );
  const rnaBeads = instances(
    sphere,
    rnaBaseMaterial,
    rnaSegments + 1,
    "rna-nucleotides",
  );
  const remnant = instances(
    cylinder,
    rnaMaterial,
    12,
    "downstream-rna-after-cleavage",
  );
  const polymerase = new THREE.Group();
  polymerase.name = "RNA-polymerase-II-schematic";
  group.add(polymerase);
  // A sculpted, open-front cleft leaves the template and RNA exit visible.
  // These lobes are a diagram of the enzyme, not fitted atomic coordinates.
  const lobes = [
    [-0.48, 0.13, -0.39, 0.51, 0.65, 0.36],
    [0.45, 0.1, -0.41, 0.47, 0.6, 0.36],
    [0.02, 0.58, -0.35, 0.68, 0.33, 0.42],
    [-0.61, -0.31, -0.2, 0.32, 0.32, 0.36],
    [0.55, -0.39, -0.18, 0.33, 0.38, 0.39],
    [-0.04, -0.6, -0.44, 0.49, 0.26, 0.25],
    [-0.77, 0.45, -0.3, 0.27, 0.31, 0.27],
    [0.77, 0.32, -0.37, 0.23, 0.28, 0.27],
    [0.38, 0.81, -0.44, 0.24, 0.22, 0.26],
    [-0.33, 0.82, -0.33, 0.22, 0.23, 0.26],
    [-0.68, -0.61, -0.41, 0.24, 0.21, 0.26],
    [0.71, -0.65, -0.41, 0.24, 0.22, 0.23],
  ];
  for (let i = 0; i < lobes.length; i++) {
    const item = new THREE.Mesh(sphere, proteinMaterials[i % 3]);
    item.position.set(...lobes[i].slice(0, 3));
    item.scale.set(...lobes[i].slice(3));
    item.rotation.z = Math.sin(i * 2.3) * 0.35;
    polymerase.add(item);
  }
  const factors = new THREE.Group();
  factors.name = "general-transcription-factors-schematic";
  group.add(factors);
  const factorMaterial = mat("#b7b395");
  for (let i = 0; i < 5; i++) {
    const item = new THREE.Mesh(sphere, factorMaterial);
    item.position.set(-2.62 + i * 0.17, 0.4 + Math.sin(i) * 0.14, -0.25);
    item.scale.set(0.19, 0.16 + (i % 2) * 0.05, 0.21);
    factors.add(item);
  }
  const promoter = new THREE.Mesh(
    new THREE.TorusGeometry(0.57, 0.025, 8, 48),
    mat("#c6c2a9"),
  );
  promoter.rotation.y = Math.PI / 2;
  promoter.position.x = -2.55;
  promoter.name = "promoter-position-marker";
  group.add(promoter);
  const activeSite = new THREE.Mesh(
    sphere,
    mat("#d9b16c", { emissive: "#cba967", emissiveIntensity: 0.12 }),
  );
  activeSite.scale.setScalar(0.09);
  group.add(activeSite);
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1.7, 1.23, -0.1),
    3.15,
    "#8b98a6",
    0.15,
    0.1,
  );
  arrow.name = "polymerase-travel-direction";
  group.add(arrow);

  const labels = [
    { position: [-2.6, -0.92, 0], text: { zh: "启动子", en: "Promoter" } },
    {
      position: [-3.48, -0.64, 0],
      text: { zh: "模板链 3′", en: "Template 3′" },
    },
    { position: [3.45, -0.64, 0], text: { zh: "5′", en: "5′" } },
    { position: [-3.48, 0.73, 0], text: { zh: "编码链 5′", en: "Coding 5′" } },
    { position: [3.45, 0.73, 0], text: { zh: "3′", en: "3′" } },
    {
      position: [0, 1.52, 0],
      text: { zh: "读取模板 3′ → 5′", en: "Read template 3′ → 5′" },
    },
    {
      position: [-1.8, 0.95, 0.3],
      priority: 3,
      text: { zh: "RNA 聚合酶 II", en: "RNA polymerase II" },
    },
    {
      position: [0, -1.6, 0.4],
      priority: 2,
      active: false,
      text: { zh: "新生 RNA · 5′ 端", en: "Nascent RNA · 5′ end" },
    },
    {
      position: [0, -0.7, 0.5],
      priority: 1,
      active: false,
      text: { zh: "3′ 端延伸", en: "Growing 3′ end" },
    },
  ];
  const temp = new THREE.Object3D();
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const putSegment = (mesh, i, from, to, radius) => {
    temp.position.copy(from).add(to).multiplyScalar(0.5);
    direction.subVectors(to, from);
    const length = direction.length();
    temp.quaternion.setFromUnitVectors(up, direction.divideScalar(length || 1));
    temp.scale.set(radius, Math.max(1e-6, length), radius);
    temp.updateMatrix();
    mesh.setMatrixAt(i, temp.matrix);
  };
  const putBead = (mesh, i, point, radius) => {
    temp.position.copy(point);
    temp.quaternion.identity();
    temp.scale.setScalar(radius);
    temp.updateMatrix();
    mesh.setMatrixAt(i, temp.matrix);
  };
  let center = -1.8,
    opening = 0;
  const dnaPoint = (x, strand, out) => {
    const phase = ((x - center) / 0.9) * TAU;
    const local = Math.abs(x - center) / 0.85;
    const w = local < 1 ? opening * smooth(1 - local) : 0;
    const sign = strand ? 1 : -1;
    const radius = 0.34 * (1 - w) + 0.55 * w;
    // Unwind in a shared frame while preserving opposite strand identities.
    // Cartesian interpolation could collapse the two rails at adverse phases.
    const angle = phase * (1 - w);
    return out.set(
      x,
      sign * radius * Math.cos(angle),
      sign * radius * Math.sin(angle) + w * 0.16,
    );
  };
  const rnaPoint = (t, length, release, out) => {
    // t starts at the 3′ active end. The older 5′ end travels out of the cleft.
    const distance = t * length;
    const peel = smooth(clamp((distance - 0.24) / 0.72));
    return out.set(
      center - distance * 0.57 + Math.sin(distance * 4.3) * 0.1 * peel,
      -0.39 -
        distance * 0.33 -
        Math.sin(distance * 2.5) * 0.12 * peel -
        release * 0.6,
      0.32 + Math.sin(distance * 3) * 0.13 * peel + release * 0.32,
    );
  };

  const update = (progress) => {
    const p = clamp(progress);
    const elongation = phase(p, 0.27, 0.84);
    const cleavage = smooth(phase(p, 0.86, 0.91));
    const termination = smooth(phase(p, 0.94, 0.98));
    // Resolve the downstream RNA before the enzyme disengages. Moving Pol II
    // while retaining a template-bound RNA anchor would tear the 3′ connection.
    const departure = smooth(phase(p, 0.98, 1));
    center = -1.8 + 3.5 * elongation + 0.42 * phase(p, 0.86, 0.96);
    opening = smooth(phase(p, 0.11, 0.25)) * (1 - departure);
    polymerase.position.set(
      center,
      0.08 + (1 - smooth(phase(p, 0, 0.12))) * 0.55 + departure * 0.65,
      -departure * 0.35,
    );
    factors.scale.setScalar(1 - 0.75 * smooth(phase(p, 0.27, 0.4)));
    for (let strand = 0; strand < 2; strand++) {
      for (let i = 0; i < dnaSegments; i++) {
        dnaPoint(-3.6 + (7.2 * i) / dnaSegments, strand, a);
        dnaPoint(-3.6 + (7.2 * (i + 1)) / dnaSegments, strand, b);
        putSegment(rails[strand], i, a, b, 0.042);
      }
      for (let i = 0; i < pairs; i++) {
        const x = -3.56 + (7.12 * i) / (pairs - 1);
        dnaPoint(x, strand, a);
        putBead(phosphates[strand], i, a, 0.055);
        dnaPoint(x, 1 - strand, b);
        c.copy(a).lerp(b, 0.48);
        const local = Math.abs(x - center) / 0.85;
        const opened = local < 1 ? opening * smooth(1 - local) : 0;
        // Each exposed base stays attached to its own backbone; no false rungs
        // bridge the locally separated DNA strands in the transcription bubble.
        c.lerp(a, opened * 0.79);
        putSegment(bases[strand], i, a, c, 0.029);
      }
      rails[strand].instanceMatrix.needsUpdate = true;
      bases[strand].instanceMatrix.needsUpdate = true;
      phosphates[strand].instanceMatrix.needsUpdate = true;
    }
    const growth = phase(p, 0.23, 0.84);
    const length = 0.12 + growth * 3.45;
    rna.visible = rnaBeads.visible = p >= 0.23;
    // A cut partitions the already existing chain at distance .4 from its
    // catalytic 3′ end. Both products meet there before their separation.
    const cleaved = p >= 0.86;
    const cutDistance = 0.4;
    const polymeraseCenter = center;
    const extension = cleaved ? (polymeraseCenter - 1.7) / 0.57 : 0;
    const remaining = (cutDistance + extension) * (1 - termination);
    if (cleaved) center = 1.7;
    for (let i = 0; i < rnaSegments; i++) {
      const from = Math.max(
        cleaved ? cutDistance : 0,
        (i / rnaSegments) * length,
      );
      const to = Math.max(
        cleaved ? cutDistance : 0,
        ((i + 1) / rnaSegments) * length,
      );
      rnaPoint(from, 1, cleavage, a);
      rnaPoint(to, 1, cleavage, b);
      putSegment(rna, i, a, b, to > from ? 0.044 : 0);
    }
    // Preserve existing nucleotide markers on their respective products rather
    // than redistributing all of them onto a newly rescaled released chain.
    for (let i = 0; i <= rnaSegments; i++) {
      const distance = (i / rnaSegments) * length;
      const downstream = cleaved && distance < cutDistance;
      center = downstream ? polymeraseCenter : cleaved ? 1.7 : polymeraseCenter;
      rnaPoint(
        downstream ? distance + extension : distance,
        1,
        downstream ? 0 : cleavage,
        a,
      );
      const retained = !downstream || distance + extension <= remaining;
      putBead(
        rnaBeads,
        i,
        a,
        retained ? (i === rnaSegments ? 0.063 : 0.049) : 0,
      );
    }
    center = cleaved ? 1.7 : polymeraseCenter;
    rnaPoint(1, length, cleavage, b);
    labels[7].position.splice(0, 3, b.x, b.y - 0.31, b.z + 0.12);
    rnaPoint(cleaved ? cutDistance : 0, 1, cleavage, a);
    labels[8].position.splice(0, 3, a.x + 0.14, a.y - 0.39, a.z + 0.1);
    labels[7].active = growth > 0.04;
    labels[8].active = growth > 0.04 && !cleaved;
    center = polymeraseCenter;
    remnant.visible = cleaved && p < 0.98;
    for (let i = 0; i < 12; i++) {
      rnaPoint(i / 12, remaining, 0, a);
      rnaPoint((i + 1) / 12, remaining, 0, b);
      putSegment(remnant, i, a, b, 0.039 * (1 - termination));
    }
    rna.instanceMatrix.needsUpdate = true;
    rnaBeads.instanceMatrix.needsUpdate = true;
    remnant.instanceMatrix.needsUpdate = true;
    activeSite.visible = p >= 0.23 && p < 0.98;
    activeSite.position.set(center, -0.39, 0.32);
    labels[6].position.splice(0, 3, center, 1.02 + departure * 0.65, 0.35);
    for (const item of [
      ...rails,
      ...bases,
      ...phosphates,
      rna,
      rnaBeads,
      remnant,
    ]) {
      item.boundingBox = null;
      item.boundingSphere = null;
    }
    group.userData.progress = p;
    group.userData.bubbleOpening = opening;
    group.userData.polymeraseX = center;
    group.userData.rnaLength = p < 0.23 ? 0 : length;
    group.userData.rnaReleased = cleavage >= 1;
    group.userData.polymeraseTerminated = termination >= 1;
    group.userData.synthesisDirection = "5′→3′";
    group.userData.templateReadDirection = "3′→5′";
  };
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 2.0, 12.5], target: [0, -0.4, 0] },
  };
}

export default {
  id: "transcription",
  title: { zh: "转录", en: "Transcription" },
  intro: {
    zh: "放大细胞核中的一段 DNA，观察 RNA 聚合酶 II 如何读取模板、合成 RNA。模型展示真核蛋白质编码基因的转录；酶、序列和时间均为教学简化，加帽、剪接等加工未展开。",
    en: "Zoom into a segment of nuclear DNA to follow RNA polymerase II reading a template and making RNA. This illustrates a eukaryotic protein-coding gene. Enzyme shapes, sequence and timing are simplified; capping, splicing and other processing are not expanded here.",
  },
  duration: 28,
  legend: [
    { color: "#719e9b", text: { zh: "DNA 模板链", en: "Template DNA" } },
    { color: "#a0aaca", text: { zh: "DNA 编码链", en: "Coding DNA" } },
    { color: "#cc925b", text: { zh: "新生 RNA", en: "Nascent RNA" } },
  ],
  stages: [
    {
      at: 0,
      title: { zh: "在启动子处组装", en: "Assemble at the promoter" },
      description: {
        zh: "通用转录因子帮助 RNA 聚合酶 II 在启动子附近组装，确定转录的起始位置和方向。浅色小团代表这些因子；圆环仅标记启动子的位置，并不是 DNA 上的实体环。",
        en: "General transcription factors help RNA polymerase II assemble at the promoter and establish where transcription begins. Pale clusters represent these factors. The ring marks the promoter location; it is not a physical DNA ring.",
      },
    },
    {
      at: 0.13,
      title: { zh: "局部打开 DNA", en: "Open a local DNA bubble" },
      description: {
        zh: "起始复合体在局部打开双链 DNA，暴露模板链，形成转录泡。整个 DNA 不会全部解开；聚合酶只接触附近的一小段。模型把酶的前方敞开，以便观察内部。",
        en: "The initiation complex opens a short stretch of the DNA duplex, exposing the template in a transcription bubble. The entire DNA molecule does not unwind. The enzyme has an open front in this diagram so the nucleic acids remain visible.",
      },
    },
    {
      at: 0.27,
      title: { zh: "开始合成 RNA", en: "Begin RNA synthesis" },
      description: {
        zh: "聚合酶按模板链上的碱基选择互补的核糖核苷三磷酸。RNA 从 5′ 端开始，新的核苷酸总是接到 3′ 端；RNA 使用 U，而不是 DNA 中的 T。",
        en: "Polymerase selects complementary ribonucleoside triphosphates using the template bases. RNA starts with its 5′ end, and new nucleotides are added to its 3′ end. RNA uses U in place of DNA’s T.",
      },
    },
    {
      at: 0.43,
      title: { zh: "沿模板持续延伸", en: "Extend along the template" },
      description: {
        zh: "聚合酶沿模板链的 3′→5′ 方向前进，RNA 按 5′→3′ 方向变长。新生 RNA 的 3′ 端位于活性中心；较早合成的 5′ 端逐渐从酶中伸出。",
        en: "Polymerase travels along the template 3′→5′ while RNA grows 5′→3′. The nascent 3′ end remains at the active site, while the older 5′ end emerges from the enzyme.",
      },
    },
    {
      at: 0.68,
      title: { zh: "前方打开，后方复合", en: "Open ahead, rejoin behind" },
      description: {
        zh: "转录泡随聚合酶移动，前方的 DNA 分开，后方的两条 DNA 链重新配对。RNA 只是短暂接触模板，随后分离；转录不会把一条 DNA 链变成 RNA。",
        en: "The bubble moves with polymerase: DNA opens ahead and the two DNA strands reanneal behind. RNA contacts the template briefly before separating. Transcription does not convert a DNA strand into RNA.",
      },
    },
    {
      at: 0.86,
      title: { zh: "RNA 切割与后续终止", en: "RNA cleavage, then termination" },
      description: {
        zh: "典型蛋白质编码基因的 RNA 经 3′ 端切割后释放，聚合酶通常继续向下游转录一段，再终止并离开 DNA。释放不等于成熟：加帽、剪接及多聚腺苷酸化等加工与转录协调进行，这里未逐一展示。",
        en: "For a typical protein-coding gene, 3′ cleavage releases the upstream RNA while polymerase continues downstream before terminating. Release does not by itself mean maturity: capping, splicing and polyadenylation are coordinated with transcription and are not individually shown here.",
      },
    },
  ],
  sources: [
    {
      title:
        "Aibara et al. · RNA polymerase II pre-initiation complex with open promoter DNA (7NW0)",
      url: "https://www.rcsb.org/structure/7NW0",
    },
    {
      title:
        "Barnes et al. · Complete transcription bubble in a transcribing Pol II complex (5C44)",
      url: "https://www.rcsb.org/structure/5C44",
    },
    {
      title:
        "Eaton et al. · Xrn2 accelerates termination by RNA polymerase II, underpinned by CPSF73 activity",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5830926/",
    },
  ],
  create,
};
