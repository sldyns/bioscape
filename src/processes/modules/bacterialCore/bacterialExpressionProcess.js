import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

import { instances } from "./bacterialGeometry.js";

const process = {
  id: "bacterialExpression",
  title: b("细菌的转录与翻译偶联", "Coupled bacterial gene expression"),
  intro: b(
    "以大肠杆菌的 σ70 启动子为例：RNA 聚合酶先识别启动子，70S 核糖体随后读取尚未合成完的 mRNA。场景是细胞质内的局部放大，无核膜；偶联并非所有细菌或所有基因的固定状态。",
    "An E. coli σ70 promoter illustrates initiation followed by a 70S ribosome translating nascent mRNA. This is a cytoplasmic close-up, without a nuclear envelope; coupling is not universal across bacteria or genes.",
  ),
  duration: 32,
  controls: [
    {
      id: "sigma",
      label: b("启动条件", "Initiation condition"),
      default: "present",
      options: [
        { value: "present", label: b("有 σ70", "σ70 available") },
        { value: "absent", label: b("缺少 σ70", "σ70 absent") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("识别所需组分", "Initiation components"),
      description: b(
        "核心 RNA 聚合酶与 σ70 结合成全酶。图中突出 −35 与 −10 启动子区域，省略实际碱基序列。",
        "Core RNA polymerase associates with σ70 to form holoenzyme. The −35 and −10 promoter regions are highlighted; base sequences are omitted.",
      ),
    },
    {
      at: 0.18,
      title: b("全酶结合启动子", "Holoenzyme binds the promoter"),
      description: b(
        "σ70 提供启动子识别。缺少 σ70 的对照停留在未有效启动的状态，不产生下游 RNA。",
        "σ70 provides promoter recognition. Without σ70, this promoter-specific initiation model stalls and produces no downstream RNA.",
      ),
    },
    {
      at: 0.34,
      title: b("局部解链与启动", "Opening and initiation"),
      description: b(
        "局部 DNA 打开形成转录泡。聚合酶沿模板链 3′→5′ 前进，把核苷酸加到 RNA 的 3′ 端。",
        "DNA opens locally into a transcription bubble. Polymerase reads the template 3′→5′ and adds nucleotides to the RNA 3′ end.",
      ),
    },
    {
      at: 0.5,
      title: b("启动子逃逸", "Promoter escape"),
      description: b(
        "聚合酶进入延伸，已经合成的 RNA 的 5′ 端伸出。示意中 σ70 脱离；实际 σ70 的保留时间可有差异。",
        "Polymerase enters elongation and the existing RNA 5′ end emerges. σ70 dissociates in this schematic; its retention can vary in actual complexes.",
      ),
    },
    {
      at: 0.65,
      title: b("核糖体接入新生 RNA", "A ribosome loads onto nascent RNA"),
      description: b(
        "30S 与 50S 亚基组装为 70S 核糖体，从已暴露的起始区开始翻译。RNA 的 3′ 端仍连接正在转录的聚合酶。",
        "30S and 50S subunits assemble into a 70S ribosome at an exposed initiation region. The RNA 3′ end remains attached to the transcribing polymerase.",
      ),
    },
    {
      at: 0.84,
      title: b("同时延伸", "Concurrent elongation"),
      description: b(
        "核糖体沿 mRNA 的 5′→3′ 方向推进，新生肽从大亚基出口伸出；此时转录仍在继续。图中没有表示直接的蛋白质桥接。",
        "The ribosome advances along mRNA 5′→3′ as a nascent peptide emerges from the large subunit. Transcription continues; a direct protein bridge is not depicted.",
      ),
    },
  ],
  sources: [
    {
      title: "Coupled transcription–translation complex C3, E. coli (6VYW)",
      url: "https://www.rcsb.org/structure/6VYW",
    },
    {
      title: "Nascent chain at the E. coli ribosome exit (6I0Y)",
      url: "https://www.rcsb.org/structure/6I0Y",
    },

    {
      title: "Mechanism of bacterial transcription initiation",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3440003/",
    },
    {
      title: "Structural basis of transcription–translation coupling",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7566311/",
    },
  ],
  legend: [
    { color: "#6f8f99", text: b("DNA 双链", "Double-stranded DNA") },
    { color: "#ba9156", text: b("RNA 聚合酶", "RNA polymerase") },
    { color: "#b67f8b", text: b("新生 mRNA", "Nascent mRNA") },
    { color: "#7d9b80", text: b("70S 核糖体", "70S ribosome") },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const dnaA = k.material("#698c98"),
      dnaB = k.material("#9eb0b3"),
      base = k.material("#c0c8c3");
    const amber = k.material("#ba9156"),
      amberLight = k.material("#d3b783"),
      sigmaMat = k.material("#9d7c9f");
    const rnaMat = k.material("#b67f8b"),
      riboA = k.material("#72937b"),
      riboB = k.material("#9ab39a"),
      pepMat = k.material("#d7aa70");
    const segmentCount = 98,
      strands = [[], []],
      rungs = [];
    const v0 = new THREE.Vector3(),
      v1 = new THREE.Vector3(),
      delta = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    function setSegment(mesh, x0, y0, z0, x1, y1, z1, radius) {
      v0.set(x0, y0, z0);
      v1.set(x1, y1, z1);
      delta.subVectors(v1, v0);
      mesh.position.copy(v0).add(v1).multiplyScalar(0.5);
      mesh.scale.set(radius, Math.max(0.00001, delta.length()), radius);
      mesh.quaternion.setFromUnitVectors(up, delta.normalize());
    }
    for (let i = 0; i < segmentCount; i++)
      for (let s = 0; s < 2; s++)
        strands[s].push(
          k.segment([0, 0, 0], [1, 0, 0], 0.047, s ? dnaB : dnaA),
        );
    for (let i = 0; i < segmentCount; i += 3)
      rungs.push({ i, mesh: k.segment([0, 0, 0], [1, 0, 0], 0.024, base) });
    strands.forEach((strand, side) =>
      strand.forEach((mesh, i) => {
        mesh.name = `DNA-strand-${side}-${i}`;
      }),
    );
    const promoter = k.mesh(
      new THREE.BoxGeometry(1.35, 0.08, 0.86),
      k.material("#dcc895", { transparent: true, opacity: 0.58 }),
      [-2.68, 0.59, -0.1],
    );
    for (const x of [-3.07, -2.37])
      k.ball([x, 0.58, 0.02], [0.09, 0.08, 0.49], amberLight);
    const polymerase = new THREE.Group();
    group.add(polymerase);
    // Open-front beta/beta-prime cleft: DNA remains visible between jaws.
    for (const [x, y, z, sx, sy, sz] of [
      [-0.43, 0.1, -0.27, 0.28, 0.48, 0.3],
      [0.43, 0.1, -0.27, 0.28, 0.45, 0.29],
      [0, 0.48, -0.3, 0.48, 0.19, 0.3],
      [-0.38, -0.32, -0.3, 0.23, 0.23, 0.26],
      [0.35, -0.3, -0.3, 0.23, 0.24, 0.26],
      [0, -0.44, -0.31, 0.34, 0.13, 0.24],
      [-0.62, 0.34, -0.28, 0.14, 0.2, 0.19],
      [0.63, 0.22, -0.3, 0.13, 0.2, 0.18],
      [-0.18, 0.64, -0.27, 0.16, 0.13, 0.17],
      [0.24, 0.62, -0.29, 0.15, 0.14, 0.17],
    ])
      k.ball([x, y, z], [sx, sy, sz], x > 0 ? amberLight : amber, polymerase);
    const clampJaw = new THREE.Group();
    clampJaw.position.set(0.38, 0.14, -0.12);
    polymerase.add(clampJaw);
    k.ball([0, 0, 0], [0.15, 0.3, 0.19], amberLight, clampJaw);
    for (let h = 0; h < 6; h++) {
      const points = Array.from({ length: 29 }, (_, i) => {
        const t = (i / 28) * Math.PI * 5;
        return [
          h % 2 ? 0.49 : -0.5,
          -0.25 + (i / 28) * 0.49,
          0.02 + 0.033 * Math.sin(t) + (h - 2.5) * 0.035,
        ];
      });
      k.tube(points, 0.017, h % 2 ? amber : amberLight, polymerase, 40);
    }
    k.tube(
      [
        [-0.2, -0.22, -0.12],
        [-0.27, -0.38, 0.04],
        [-0.3, -0.5, 0.14],
      ],
      0.055,
      amberLight,
      polymerase,
      24,
    );
    const activeSite = k.ball(
      [0.04, -0.08, -0.06],
      0.07,
      k.material("#e0bd7c"),
      polymerase,
    );
    activeSite.name = "RNAP-active-3prime";
    const sigma = new THREE.Group();
    group.add(sigma);
    k.ball([0, 0, 0], [0.31, 0.18, 0.2], sigmaMat, sigma);
    k.ball([0.23, 0.11, 0], [0.21, 0.13, 0.17], sigmaMat, sigma);
    const ribosome = new THREE.Group();
    group.add(ribosome);
    const small = new THREE.Group(),
      large = new THREE.Group();
    ribosome.add(small, large);
    small.position.y = 0.18;
    large.position.y = -0.28;
    small.name = "30S-head-neck-platform";
    large.name = "50S-body-protuberance-exit";
    k.ball([-0.04, -0.02, -0.08], [0.43, 0.19, 0.3], riboB, small);
    k.ball([0.3, 0.14, -0.04], [0.21, 0.2, 0.25], riboB, small);
    k.ball([-0.34, 0.04, 0.02], [0.18, 0.1, 0.26], riboA, small);
    k.ball([0, 0, -0.13], [0.5, 0.31, 0.31], riboA, large);
    k.ball([0.05, 0.22, -0.11], [0.18, 0.16, 0.22], riboB, large);
    k.ball([-0.44, 0.12, -0.03], [0.14, 0.2, 0.16], riboB, large);
    k.tube(
      [
        [0.39, 0.17, -0.12],
        [0.59, 0.24, -0.07],
        [0.68, 0.18, -0.05],
      ],
      0.045,
      riboB,
      large,
      30,
    );
    const rrna = k.material("#c2ccb1");
    for (const [parent, cy, width] of [
      [small, 0, 0.4],
      [large, -0.02, 0.44],
    ])
      for (let band = 0; band < 4; band++) {
        const points = Array.from({ length: 45 }, (_, i) => {
          const t = (i / 44) * Math.PI * 2;
          return [
            width * Math.cos(t) * (0.9 - band * 0.12),
            cy + (band - 1.5) * 0.07 + 0.048 * Math.sin(t * 3),
            0.2 + 0.05 * Math.sin(t),
          ];
        });
        k.tube(points, 0.014, rrna, parent, 60);
      }
    const exit = k.ring([0, -0.27, 0.13], 0.073, 0.022, rrna, large);
    exit.rotation.x = Math.PI / 2;
    exit.name = "50S-peptide-exit";
    k.tube(
      [
        [0, -0.11, 0.06],
        [0, -0.22, 0.12],
        [0, -0.27, 0.13],
      ],
      0.04,
      k.material("#536f60"),
      large,
      20,
    );
    for (const parent of [small, large])
      for (let i = 0; i < 7; i++) {
        const t = (i / 7) * Math.PI * 2;
        k.ball(
          [0.39 * Math.cos(t), 0.13 * Math.sin(t), 0.15],
          [0.065, 0.06, 0.055],
          i % 2 ? riboA : riboB,
          parent,
        );
      }
    const phosphate = instances(
      k,
      group,
      k.sphere,
      dnaA,
      160,
      "DNA-sugar-phosphate-groups",
    );
    const baseHalves = [
      instances(
        k,
        group,
        k.cylinder,
        k.material("#b6c9c6"),
        80,
        "template-bases",
      ),
      instances(
        k,
        group,
        k.cylinder,
        k.material("#c5c8db"),
        80,
        "coding-bases",
      ),
    ];
    const rnaBases = instances(
      k,
      group,
      k.sphere,
      k.material("#d2a8b1"),
      70,
      "RNA-ribose-base-groups",
    );
    const rna = [];
    for (let i = 0; i < 70; i++)
      rna.push(k.segment([0, 0, 0], [1, 0, 0], 0.046, rnaMat));
    rna.forEach((mesh, i) => {
      mesh.name = `nascent-RNA-${i}`;
    });
    const hybridPairs = Array.from({ length: 8 }, (_, i) => {
      const mesh = k.segment([0, 0, 0], [1, 0, 0], 0.018, base);
      mesh.name = `RNA-template-hybrid-${i}`;
      return mesh;
    });
    const peptide = [];
    for (let i = 0; i < 24; i++) {
      const mesh = k.ball([0, 0, 0], 0.072, pepMat);
      mesh.name = `nascent-peptide-${i}`;
      peptide.push(mesh);
    }
    const peptideBonds = Array.from({ length: 23 }, (_, i) => {
      const mesh = k.segment([0, 0, 0], [1, 0, 0], 0.028, pepMat);
      mesh.name = `peptide-bond-${i}`;
      return mesh;
    });
    const exitPosition = new THREE.Vector3();
    const labels = [
      k.label([-2.85, 1.92, 0], "−35 / −10 启动子", "−35 / −10 promoter", 7),
      k.label([-3.6, 0.17, 0], "模板链 3′ → 5′", "Template 3′ → 5′", 6),
      k.label([3.0, 1.8, 0], "编码链 5′ → 3′", "Coding 5′ → 3′", 5),
      k.label([0, 2.5, 0], "RNA 聚合酶全酶", "RNA polymerase holoenzyme", 9),
      k.label([-1, 2.4, 0], "σ70", "σ70", 8),
      k.label([0, -1, 0], "mRNA 5′ 端", "mRNA 5′ end", 7),
      k.label([0, 0, 0], "生长中的 3′ 端", "Growing 3′ end", 7),
      k.label([0, -2, 0], "70S = 30S + 50S", "70S = 30S + 50S", 9),
      k.label([0, -2.8, 0], "新生肽链", "Nascent peptide", 8),
    ];
    // Both strands use one straight centerline and the same orthogonal Y/Z frame.
    // Unwind phase locally while opening a strictly positive radial separation;
    // Cartesian interpolation toward fixed ±Y would let opposite phases cancel.
    const dnaFrame = (x, px, opening) => {
      const bubble = opening * Math.exp(-(((x - px) / 0.47) ** 4));
      return {
        angle: (x + 4) * 3.8 - (x - px) * 3.8 * bubble,
        radius: 0.2 + 0.15 * bubble,
      };
    };
    const dnaPoint = (x, strand, px, opening) => {
      const { angle, radius } = dnaFrame(x, px, opening),
        sign = strand ? -1 : 1;
      return [
        x,
        0.95 + sign * radius * Math.cos(angle),
        sign * radius * Math.sin(angle),
      ];
    };
    let currentOpening = 0;
    const hybridPoint = (t, px) => {
      const x = px - 0.24 * t,
        { angle, radius } = dnaFrame(x, px, currentOpening);
      // The RNA follows the same template frame, just inward of strand 0.
      return [
        x,
        0.95 + (radius - 0.11) * Math.cos(angle),
        (radius - 0.11) * Math.sin(angle),
      ];
    };
    // Parameter 0 is the growing 3′ end; parameter 1 is the free 5′ end.
    const rnaPoint = (t, px, length) => {
      if (t <= 0.1) return hybridPoint(t / 0.1, px);
      if (t < 0.22) {
        const a = hybridPoint(1, px),
          f = (t - 0.1) / 0.12;
        return a.map((v, j) => v + ([px - 0.24, 0.69, 0.2][j] - v) * f);
      }
      const u = (t - 0.22) / 0.78;
      return [
        px - 0.24 - u * length,
        0.69 -
          1.42 * Math.sin((Math.min(1, u * 2) * Math.PI) / 2) +
          0.13 * Math.sin(u * 7),
        0.2 + 0.08 * Math.sin(u * 9),
      ];
    };
    function update(raw, parameters = {}) {
      const p = clamp(raw),
        available = parameters.sigma !== "absent";
      const initiation = available ? ease(p, 0.18, 0.38) : 0,
        elongation = available ? ease(p, 0.43, 1) : 0;
      const px = -2.35 + elongation * 5.08,
        dock = ease(p, 0, 0.23);
      polymerase.position.set(
        available ? px : -2.35,
        0.95 + (1 - dock) * 1.45 + (available ? 0 : 0.45),
        0.07,
      );
      sigma.visible = available;
      sigma.position.set(
        polymerase.position.x - 0.24 - ease(p, 0.46, 0.62) * 0.65,
        polymerase.position.y + 0.52 + ease(p, 0.46, 0.62) * 0.62,
        0.28,
      );
      sigma.scale.setScalar(1 - 0.25 * ease(p, 0.46, 0.62));
      const opening = initiation;
      currentOpening = opening;
      activeSite.position.set(...hybridPoint(0, px)).sub(polymerase.position);
      clampJaw.rotation.z = -0.3 * (1 - initiation);
      for (let i = 0; i < 80; i++) {
        const x = -4.25 + (i / 79) * 8.5,
          aa = dnaPoint(x, 0, px, opening),
          bb = dnaPoint(x, 1, px, opening),
          mid = aa.map((v, j) => (v + bb[j]) * 0.5);
        for (let strand = 0; strand < 2; strand++) {
          const point = strand ? bb : aa;
          phosphate.point(i * 2 + strand, point, 0.052);
          const end = point.map((v, j) => v + (mid[j] - v) * 0.82);
          baseHalves[strand].line(i, point, end, 0.031);
        }
      }
      phosphate.flush();
      baseHalves.forEach((v) => v.flush());
      for (let s = 0; s < 2; s++)
        for (let i = 0; i < segmentCount; i++) {
          const a = dnaPoint(-4.25 + (i * 8.5) / segmentCount, s, px, opening),
            z = dnaPoint(
              -4.25 + ((i + 1) * 8.5) / segmentCount,
              s,
              px,
              opening,
            );
          setSegment(strands[s][i], ...a, ...z, 0.047);
        }
      for (const item of rungs) {
        const x = -4.25 + (item.i * 8.5) / segmentCount,
          a = dnaPoint(x, 0, px, opening),
          z = dnaPoint(x, 1, px, opening);
        item.mesh.visible = opening * Math.exp(-(((x - px) / 0.47) ** 4)) < 0.3;
        setSegment(item.mesh, ...a, ...z, 0.024);
      }
      const length = 0.15 + 2.65 * ease(p, 0.33, 0.82),
        transcript = available && p > 0.33;
      for (let i = 0; i < rna.length; i++) {
        rna[i].visible = transcript;
        const a = rnaPoint(i / 70, px, length),
          z = rnaPoint((i + 1) / 70, px, length);
        setSegment(rna[i], ...a, ...z, 0.043);
        rna[i].scale.x *= ease(p, 0.33, 0.38);
        rna[i].scale.z *= ease(p, 0.33, 0.38);
      }
      for (let i = 0; i < hybridPairs.length; i++) {
        const t = i / (hybridPairs.length - 1);
        hybridPairs[i].visible = transcript;
        setSegment(
          hybridPairs[i],
          ...hybridPoint(t, px),
          ...dnaPoint(px - 0.24 * t, 0, px, opening),
          0.018,
        );
      }
      rnaBases.mesh.visible = transcript;
      for (let i = 0; i < 70; i++) {
        const point = rnaPoint(i / 69, px, length);
        rnaBases.point(i, point, 0.051 * ease(p, 0.33, 0.38));
      }
      rnaBases.flush();
      const load = available ? ease(p, 0.57, 0.68) : 0,
        travel = ease(p, 0.68, 1),
        riboT = 0.84 - 0.37 * travel,
        rp = rnaPoint(riboT, px, length);
      ribosome.visible = available && p > 0.56;
      ribosome.position.set(rp[0], rp[1] - 0.06 - (1 - load) * 0.7, 0.23);
      small.position.y = 0.18 + (1 - load) * 0.75;
      large.position.y = -0.28 - (1 - load) * 0.25;
      const peptideGrowth = available ? ease(p, 0.67, 1) : 0;
      group.updateMatrixWorld(true);
      exit.getWorldPosition(exitPosition);
      group.worldToLocal(exitPosition);
      for (let i = 0; i < peptide.length; i++) {
        const t = i / 23;
        peptide[i].visible = i < Math.floor(peptideGrowth * 24);
        peptide[i].position.set(
          exitPosition.x + 0.09 * Math.sin(i * 0.7),
          exitPosition.y - t * 0.92,
          exitPosition.z + 0.18 * Math.sin((t * Math.PI) / 2),
        );
        if (i > 0) {
          peptideBonds[i - 1].visible = peptide[i].visible;
          setSegment(
            peptideBonds[i - 1],
            ...peptide[i - 1].position.toArray(),
            ...peptide[i].position.toArray(),
            0.028,
          );
        }
      }
      labels[3].position.splice(
        0,
        3,
        polymerase.position.x,
        polymerase.position.y + 0.95,
        0,
      );
      labels[3].text = !available
        ? b("核心 RNA 聚合酶", "Core RNA polymerase")
        : elongation > 0.1
          ? b("RNA 聚合酶", "RNA polymerase")
          : b("RNA 聚合酶全酶", "RNA polymerase holoenzyme");
      labels[4].active = available;
      labels[4].position.splice(
        0,
        3,
        sigma.position.x - 0.3,
        sigma.position.y + 0.3,
        0.1,
      );
      labels[5].active = transcript;
      labels[5].position.splice(0, 3, ...rnaPoint(1, px, length));
      labels[5].position[1] -= 0.25;
      labels[6].active = transcript;
      labels[6].position.splice(0, 3, ...rnaPoint(0, px, length));
      labels[7].active = ribosome.visible;
      labels[7].position.splice(0, 3, rp[0] - 0.55, rp[1] - 0.7, 0.2);
      labels[8].active = peptideGrowth > 0.1;
      labels[8].position.splice(0, 3, rp[0] + 0.9, rp[1] - 1.35, 0.2);
      group.userData = {
        process: "bacterialExpression",
        structuralDetail:
          "open-clamp RNAP, paired DNA bases, 30S/50S rRNA domains",
        organism: "Escherichia coli",
        compartment: "cytoplasm",
        hasNucleus: false,
        sigmaAvailable: available,
        promoterRecognized: available && p >= 0.23,
        transcriptionActive: transcript,
        translationActive: available && p >= 0.68,
        ribosome: "70S",
        rnaSynthesisDirection: "5-to-3",
        templateReadingDirection: "3-to-5",
        nascentRNAThreePrimeAtPolymerase: true,
        coupled: available && p >= 0.68,
        progress: p,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 1.1, 11.6], target: [0, 0.1, 0] },
    };
  },
};
export default process;
