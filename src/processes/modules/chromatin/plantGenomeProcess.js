import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";
import { dynamicTube, rightHandedDuplex } from "./geometry.js";
import {
  duplexDetails,
  nucleotideDetails,
  ribosomeDetails,
  cutSac,
  alphaHelix,
} from "./structure.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  const nuclearDNA = k.material("#9e8caf"),
    orgDNA = k.material("#658c99"),
    rnaMat = k.material("#c29568");
  const cpProtein = k.material("#8aa979"),
    mtProtein = k.material("#af8877");
  const tagMat = k.material("#ceae65"),
    ribMat = k.material("#a4a0ab");
  function shell(center, scale, color) {
    const root = new THREE.Group();
    root.position.set(...center);
    group.add(root);
    for (const shrink of [1, 0.89]) {
      const mat = k.material(color, {
        side: THREE.DoubleSide,
        transparent: true,
        opacity: shrink === 1 ? 0.86 : 0.72,
        depthWrite: true,
      });
      const half = k.mesh(
        new THREE.SphereGeometry(1, 48, 24, Math.PI, Math.PI),
        mat,
        [0, 0, 0],
        root,
      );
      half.scale.set(scale[0] * shrink, scale[1] * shrink, scale[2] * shrink);
      // The front half is removed to expose the interior rather than depict a sealed bubble.
      const rim = k.ring([0, 0, 0], 1, 0.017, k.material(color), root);
      rim.scale.set(scale[0] * shrink, scale[1] * shrink, 1);
    }
    root.name = "double-envelope-open-front-cutaway";
    const lips = new THREE.InstancedMesh(k.sphere, k.material(color), 192);
    root.add(lips);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 192; i++) {
      const a = ((i % 96) / 96) * Math.PI * 2,
        r = i < 96 ? 1 : 0.89;
      dummy.position.set(
        scale[0] * r * Math.cos(a),
        scale[1] * r * Math.sin(a),
        0.012,
      );
      dummy.scale.setScalar(0.026);
      dummy.updateMatrix();
      lips.setMatrixAt(i, dummy.matrix);
    }
    lips.computeBoundingBox();
    lips.computeBoundingSphere();
    return root;
  }
  shell([-3, 0, 0], [1.28, 1.42, 0.8], "#a394ad");
  shell([2.75, 1.65, 0], [1.7, 1.22, 0.7], "#88a78b");
  shell([2.75, -1.65, 0], [1.7, 1.06, 0.7], "#b39381");
  // Folded nuclear DNA and organelle nucleoids, not literal circular genome maps.
  const nuclearPoints = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    nuclearPoints.push([
      -3.85 + 1.7 * t,
      0.6 * Math.sin(t * Math.PI * 4),
      -0.14 + 0.12 * Math.cos(t * Math.PI * 7),
    ]);
  }
  const nuclearCurve = new THREE.CatmullRomCurve3(
    nuclearPoints.map((p) => new THREE.Vector3(...p)),
  );
  const nuclearDuplex = rightHandedDuplex(
    (s, out) => nuclearCurve.getPoint(s, out),
    0.035,
    180,
  );
  const { sampleA: nuclearA, sampleB: nuclearB } = nuclearDuplex;
  const na = dynamicTube(group, nuclearDNA, 180, 0.023),
    nb = dynamicTube(group, k.material("#c0b3cb"), 180, 0.023);
  na.mesh.name = "nuclear-DNA-A";
  nb.mesh.name = "nuclear-DNA-B";
  na.update(nuclearA);
  nb.update(nuclearB);
  duplexDetails(k, group, 70, 0.016).update(nuclearA, nuclearB);
  for (let organelle = 0; organelle < 2; organelle++) {
    const y = organelle === 0 ? 2.13 : -1.29;
    const points = [];
    for (let i = 0; i <= 45; i++) {
      const t = i / 45;
      points.push([
        2.25 + 1.35 * t,
        y + 0.13 * Math.sin(t * 18),
        -0.08 + 0.14 * Math.sin(t * 8),
      ]);
    }
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const duplex = rightHandedDuplex(
      (s, out) => curve.getPoint(s, out),
      0.025,
      130,
    );
    const { sampleA: da, sampleB: db } = duplex;
    const strandA = dynamicTube(group, orgDNA, 120, 0.018),
      strandB = dynamicTube(group, k.material("#a8bcc2"), 120, 0.018);
    strandA.mesh.name = `organelle-${organelle}-DNA-A`;
    strandB.mesh.name = `organelle-${organelle}-DNA-B`;
    strandA.update(da);
    strandB.update(db);
    duplexDetails(k, group, 38, 0.014).update(da, db);
    if (organelle === 1)
      k.tube(
        [
          [2.92, y, 0.05],
          [3.12, y - 0.12, 0.03],
          [3.36, y - 0.36, 0.02],
        ],
        0.033,
        orgDNA,
      );
  }
  // Lumen-bearing thylakoid sacs are stacked, with bridging stroma lamellae.
  for (let column = 0; column < 2; column++)
    for (let level = 0; level < 4; level++) {
      cutSac(
        k,
        group,
        [2.92 + column * 0.7, 1.03 + level * 0.15, -0.08],
        [0.34, 0.057, 0.26],
        "#78966d",
        0.018,
      );
      if (level % 2 === 0)
        cutSac(
          k,
          group,
          [3.26, 1.04 + level * 0.15, -0.16],
          [0.37, 0.033, 0.11],
          "#9aaf83",
          0.012,
        );
    }
  // Cristae are sheet-like invaginations with paired faces and open cut lumina.
  for (let i = 0; i < 4; i++) {
    const x = 2.02 + i * 0.48;
    cutSac(k, group, [x, -2.02, -0.12], [0.15, 0.29, 0.24], "#b29583", 0.025);
    const neck = k.mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.23, 20, 1, true),
      k.material("#b29583", { side: THREE.DoubleSide }),
      [x, -2.03, -0.41],
    );
    neck.rotation.x = Math.PI / 2;
    neck.name = "crista-junction-to-inner-envelope";
    const neckInner = k.mesh(
      new THREE.CylinderGeometry(0.064, 0.064, 0.23, 20, 1, true),
      k.material("#dac8b8", { side: THREE.BackSide }),
      [x, -2.03, -0.41],
    );
    neckInner.rotation.x = Math.PI / 2;
    for (let j = 0; j < 3; j++) {
      const head = k.ball(
        [x + 0.18, -2.16 + j * 0.17, 0.09],
        [0.045, 0.052, 0.044],
        k.material("#bca886"),
      );
      head.name = "crista-matrix-facing-ATP-synthase-head-schematic";
      k.segment(
        [x + 0.12, -2.16 + j * 0.17, 0.01],
        [x + 0.18, -2.16 + j * 0.17, 0.09],
        0.017,
        k.material("#8f8275"),
      );
    }
  }
  const ribosomes = [],
    localRibosomes = [],
    cytosolicPorts = [],
    localPorts = [];
  for (let i = 0; i < 2; i++) {
    const y = i === 0 ? 1.65 : -1.65;
    const rib = new THREE.Group();
    group.add(rib);
    rib.position.set(-0.45, y, 0.06);
    k.ball([0, 0.14, 0], [0.3, 0.22, 0.23], ribMat, rib);
    k.ball([0, -0.1, 0], [0.23, 0.12, 0.2], ribMat, rib);
    cytosolicPorts.push(ribosomeDetails(k, rib, 1));
    ribosomes.push(rib);
    const local = new THREE.Group();
    group.add(local);
    local.position.set(3.44, y + 0.12, 0.12);
    k.ball([0, 0.1, 0], [0.18, 0.15, 0.16], ribMat, local);
    k.ball([0, -0.07, 0], [0.16, 0.08, 0.12], ribMat, local);
    local.name = `local-ribosome-${i}`;
    localPorts.push(ribosomeDetails(k, local, 0.65));
    localRibosomes.push(local);
    // Ring planes are perpendicular to the import direction through both envelopes.
    for (const x of [1.05, 1.24]) {
      const pore = k.ring(
        [x, y, 0.02],
        0.13,
        0.05,
        k.material(i === 0 ? "#587f76" : "#92775f"),
      );
      pore.rotation.y = Math.PI / 2;
      pore.name =
        i === 0
          ? "TOC-or-TIC-protein-translocation-channel"
          : "TOM-or-TIM-protein-translocation-channel";
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2;
        k.ball(
          [x, y + 0.17 * Math.sin(a), 0.02 + 0.17 * Math.cos(a)],
          [0.08, 0.044, 0.044],
          k.material(i === 0 ? "#769884" : "#b09277"),
        );
      }
      alphaHelix(
        k,
        group,
        [x - 0.08, y + 0.2, 0.05],
        [x - 0.08, y + 0.42, 0.06],
        0.035,
        k.material("#a5b19a"),
        3,
      );
    }
    const np = k.ring(
      [-1.9, i === 0 ? 0.68 : -0.68, 0.02],
      0.15,
      0.035,
      k.material("#8c7c98"),
    );
    np.rotation.y = Math.PI / 2;
    np.name = `nuclear-export-pore-${i}`;
    for (let j = 0; j < 8; j++) {
      const a = (j / 8) * Math.PI * 2,
        ny = i === 0 ? 0.68 : -0.68;
      k.ball(
        [-1.9, ny + 0.18 * Math.sin(a), 0.02 + 0.18 * Math.cos(a)],
        [0.055, 0.035, 0.035],
        k.material("#ad9db9"),
      );
    }
  }
  const mrnas = [
    dynamicTube(group, rnaMat, 70, 0.034),
    dynamicTube(group, rnaMat, 70, 0.034),
  ];
  const messageDetails = [
    nucleotideDetails(k, group, 24, "#d8b488", 0.02),
    nucleotideDetails(k, group, 24, "#d8b488", 0.02),
  ];
  const chains = [
    dynamicTube(group, cpProtein, 100, 0.052),
    dynamicTube(group, mtProtein, 100, 0.052),
  ];
  const localRNA = [
    dynamicTube(group, rnaMat, 45, 0.025),
    dynamicTube(group, rnaMat, 45, 0.025),
  ];
  const localProducts = [
    dynamicTube(group, k.material("#5d8b70"), 70, 0.035),
    dynamicTube(group, k.material("#937267"), 70, 0.035),
  ];
  const tags = [
    k.ball([0, 0, 0], 0.083, tagMat),
    k.ball([0, 0, 0], 0.083, tagMat),
  ];
  const labels = [
    k.label([-3, 1.8, 0], "细胞核 · 核基因组", "Nucleus · nuclear genome", 10),
    k.label(
      [2.75, 3.13, 0],
      "叶绿体 · 叶绿体基因组",
      "Chloroplast · plastid genome",
      10,
    ),
    k.label(
      [2.75, -3.0, 0],
      "线粒体 · 线粒体基因组",
      "Mitochondrion · mitochondrial genome",
      10,
    ),
    k.label([-0.35, 0.72, 0.1], "胞质核糖体", "Cytosolic ribosomes", 7),
    k.label([1.12, 2.7, 0.1], "TOC / TIC", "TOC / TIC", 6),
    k.label([1.12, -2.7, 0.1], "TOM / TIM", "TOM / TIM", 6),
    k.label(
      [2.05, 0.62, 0.2],
      "核编码 → 基质导入",
      "Nuclear encoded → stroma import",
      5,
    ),
    k.label(
      [2.06, -0.6, 0.2],
      "核编码 → 线粒体基质",
      "Nuclear encoded → matrix import",
      5,
    ),
    k.label(
      [-3, -1.9, 0],
      "拟南芥叶肉细胞 · 局部切面",
      "Arabidopsis mesophyll · cutaways",
      2,
    ),
  ];
  let progress = 0,
    importEnabled = true;
  const chainSample = (s, out, index) => {
    const y = index === 0 ? 1.65 : -1.65,
      grow = ease(progress, 0.34, 0.55),
      importP = importEnabled ? ease(progress, 0.59, 0.87) : 0,
      fold = importEnabled ? ease(progress, 0.86, 0.99) : 0;
    const lead = -0.25 + 0.82 * grow + 2.12 * importP;
    const x = lead - 0.84 * grow * (1 - s),
      wave = (1 - fold) * 0.07 * Math.sin(s * 18);
    const foldedX = 2.25 + 0.23 * Math.sin(s * 15),
      foldedY = y + 0.22 * Math.cos(s * 15),
      foldedZ = 0.08 + 0.15 * Math.sin(s * 22);
    out.set(
      x * (1 - fold) + foldedX * fold,
      y + wave * (1 - fold) + (foldedY - y) * fold,
      0.08 * (1 - fold) + foldedZ * fold,
    );
    // C-terminal end (s=0) remains on the cytosolic ribosome until release.
    const attached = 1 - ease(progress, 0.55, 0.59);
    out.x += (0.03 + 0.02 * grow) * attached;
    out.y += 0.1 * attached;
    out.z += 0.13 * attached;
    return out;
  };
  const routeScratch = new THREE.Vector3();
  function messageSample(s, out, i, tx, exportP) {
    const sign = i === 0 ? 1 : -1;
    const x = -3.1 + 2.65 * exportP + (s - 0.5) * 0.63 * tx;
    // Every material point threads a straight NPC corridor through both
    // envelope surfaces before the route bends toward the cytosolic ribosome.
    const intoPore = ease(x, -3.45, -2.3),
      outOfPore = ease(x, -1.58, -0.82);
    out.set(
      x,
      sign * 0.68 * intoPore + (sign * 1.65 + 0.03 - sign * 0.68) * outOfPore,
      0.02 + 0.23 * outOfPore,
    );
    const engage = ease(exportP, 0.8, 1);
    cytosolicPorts[i].sampleMessage(s, routeScratch).add(ribosomes[i].position);
    return out.lerp(routeScratch, engage);
  }
  function update(value, parameters = {}) {
    progress = clamp(value);
    importEnabled = parameters.targeting !== "removed";
    const tx = ease(progress, 0.03, 0.22),
      exportP = ease(progress, 0.2, 0.34),
      local = ease(progress, 0.5, 0.88);
    for (let i = 0; i < 2; i++) {
      const y = i === 0 ? 1.65 : -1.65;
      mrnas[i].mesh.visible = progress > 0.035;
      mrnas[i].mesh.name = `exported-mRNA-${i}`;
      mrnas[i].update((s, out) => messageSample(s, out, i, tx, exportP));
      messageDetails[i].root.visible = progress > 0.035;
      messageDetails[i].update((s, out) =>
        messageSample(s, out, i, tx, exportP),
      );
      chains[i].mesh.visible = progress > 0.345;
      chains[i].update((s, out) => chainSample(s, out, i));
      chainSample(1, tags[i].position, i);
      tags[i].visible = importEnabled && progress > 0.345 && progress < 0.91;
      tags[i].position.y -= 0.35 * ease(progress, 0.87, 0.91);
      localRNA[i].mesh.name = `local-mRNA-${i}`;
      localRNA[i].mesh.visible = progress > 0.39;
      localRNA[i].update((s, out) =>
        localPorts[i].sampleMessage(s, out).add(localRibosomes[i].position),
      );
      localProducts[i].mesh.name = `local-nascent-peptide-${i}`;
      localProducts[i].mesh.visible = progress > 0.51;
      const release = ease(progress, 0.89, 0.97);
      localProducts[i].update((s, out) => {
        // s=1 is the growing C terminus: attached at the exit until termination.
        const contour = (1 - s) * local;
        out.copy(localPorts[i].exit).add(localRibosomes[i].position);
        out.x +=
          0.28 * contour + 0.09 * Math.sin(contour * 17) - 0.42 * release;
        out.y +=
          -0.24 * contour +
          0.08 * (1 - Math.cos(contour * 17)) -
          0.22 * release;
        out.z += 0.16 * contour + 0.065 * Math.sin(contour * 12);
        return out;
      });
    }
    labels[6].text = importEnabled
      ? B("核编码 → 叶绿体基质", "Nuclear encoded → stroma")
      : B(
          "定位肽删除 · 前体留在胞质",
          "Transit peptide removed · precursor in cytosol",
        );
    labels[7].text = importEnabled
      ? B("核编码 → 线粒体基质", "Nuclear encoded → matrix")
      : B(
          "前导序列删除 · 前体留在胞质",
          "Presequence removed · precursor in cytosol",
        );
    Object.assign(group.userData, {
      process: "plantGenome",
      species: "Arabidopsis mesophyll",
      genomeCompartments: 3,
      condition: importEnabled ? "intact" : "removed",
      nuclearTranslationCompartment: "cytosol",
      organelleTranslationCompartment: "stroma / matrix",
      cargoType: "protein",
      nuclearRNAImportedIntoOrganelles: false,
      proteinImported: importEnabled && progress >= 0.87,
      transitPeptidePresent: importEnabled && progress < 0.91,
      organelleLocalProducts: progress > 0.51,
      genomeTopologyIsSchematic: true,
      visualDetail:
        "double-envelope cut edges, thylakoid lumina/lamellae, crista sacs, ribosome rRNA channels, nucleotide motifs",
    });
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 1, 15], target: [0, 0, 0] },
  };
}
export default {
  id: "plantGenome",
  title: B("植物的三套基因组", "Three plant genomes"),
  duration: 36,
  intro: B(
    "拟南芥叶肉细胞的局部切面：核、叶绿体和线粒体各有遗传信息。核编码的细胞器前体先在胞质翻译，再经定位信号和转位装置导入；细胞器也在内部表达保留的基因。控制仅删除图示前体的定位肽，不代表所有导入路径。",
    "Cutaways of an Arabidopsis mesophyll cell: the nucleus, chloroplast, and mitochondrion each carry genetic information. Nuclear-encoded organelle precursors are translated in the cytosol and then imported using targeting signals and translocases; organelles also express retained genes internally. The control removes targeting peptides from the illustrated precursors only, not every import pathway.",
  ),
  controls: [
    {
      id: "targeting",
      label: B("前体定位信号", "Precursor targeting signals"),
      default: "intact",
      options: [
        { value: "intact", label: B("定位肽完整", "Signals intact") },
        {
          value: "removed",
          label: B("删除定位肽", "Targeting peptides removed"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("三个遗传区室", "Three genetic compartments"),
      description: B(
        "核 DNA、叶绿体核质与线粒体核质分别处于各自区室。曲线只标示 DNA 的位置；植物细胞器 DNA 可有多拷贝、线性和分支形式，不能由环状基因组图推定为单一圆环。",
        "Nuclear DNA and organelle nucleoids occupy separate compartments. Curves locate DNA schematically; plant organelle DNA can be multicopy, linear, or branched, so a circular genome map need not mean one physical DNA circle.",
      ),
    },
    {
      at: 0.12,
      title: B("核内转录，RNA 出核", "Nuclear transcription and RNA export"),
      description: B(
        "核基因转录生成 RNA；此处省略加工细节，展示成熟 mRNA 经核孔进入胞质。动画拉开空间以区分转录和翻译。",
        "Nuclear genes produce RNA. Processing details are omitted; mature mRNA is shown passing through nuclear pores into the cytosol. The spatial separation distinguishes transcription from translation.",
      ),
    },
    {
      at: 0.34,
      title: B(
        "在胞质合成前体蛋白",
        "Precursors are translated in the cytosol",
      ),
      description: B(
        "胞质核糖体读取核来源的 mRNA，合成带有叶绿体转运肽或线粒体前导序列的蛋白前体。金色端部代表定位信号，不是移动到细胞器的 DNA。",
        "Cytosolic ribosomes read nucleus-derived mRNA and synthesize precursors with a chloroplast transit peptide or mitochondrial presequence. Gold tips mark targeting signals, not DNA moving to an organelle.",
      ),
    },
    {
      at: 0.57,
      title: B("蛋白跨双层包膜导入", "Proteins cross both envelope membranes"),
      description: B(
        "展开的前体通过叶绿体 TOC/TIC 到达基质，或通过线粒体 TOM/TIM 前导序列路径进入基质。图示前体删除定位肽后停留在胞质；核 mRNA 不沿这条路线进入细胞器。",
        "Unfolded precursors cross chloroplast TOC/TIC into the stroma or use the mitochondrial TOM/TIM presequence route into the matrix. The illustrated signal-deleted precursors stay in the cytosol; nuclear mRNAs do not follow this route into organelles.",
      ),
    },
    {
      at: 0.77,
      title: B("细胞器保留本地表达", "Organelles retain local expression"),
      description: B(
        "内部核糖体读取穿过小亚基通道的 mRNA；新生链的 C 端在延长时连接核糖体，终止后才释放。它们合成细胞器基因组编码的部分蛋白。多数所需蛋白仍由核编码；例如拟南芥 Rubisco 小亚基由核编码，而大亚基由叶绿体 rbcL 编码。图中蛋白是代表性产物。",
        "Internal ribosomes read mRNA in the small-subunit channel; the nascent C terminus stays attached during elongation and releases after termination. They synthesize some organelle-genome-encoded proteins, while most required proteins remain nuclear encoded. For example, Arabidopsis Rubisco small subunits are nuclear encoded and its large subunit comes from chloroplast rbcL. Proteins shown are representative products.",
      ),
    },
    {
      at: 0.91,
      title: B("基因组协作构建细胞器", "Genomes cooperate to build organelles"),
      description: B(
        "成功导入的前体在内部加工并折叠，和本地合成的蛋白共同支撑细胞器功能。动画不表示完整导入机器、真实分子比例或即时的光合与呼吸产量。",
        "Imported precursors are processed and folded inside; imported and locally synthesized proteins support organelle function together. The animation does not depict complete import machines, molecular stoichiometry, or immediate photosynthetic and respiratory output.",
      ),
    },
  ],
  create,
  sources: [
    {
      title:
        "Chen et al. (2018), TIC236 links the chloroplast envelope translocons",
      url: "https://www.nature.com/articles/s41586-018-0713-y",
    },
    {
      title:
        "Lister et al. (2004), Arabidopsis mitochondrial protein import apparatus",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC344553/",
    },
    {
      title: "RBCS1A and RBCS3B support Arabidopsis Rubisco content (2012)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3295403/",
    },
    {
      title:
        "Davila et al. (2011), Arabidopsis mitochondrial genome recombination",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3193812/",
    },
  ],
};
