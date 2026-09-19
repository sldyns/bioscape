import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { molecularDetail } from "./molecularDetail.js";

export default {
  id: "bacterialRepair",
  title: b("细菌 DNA 损伤 · SOS 响应", "Bacterial DNA damage · SOS response"),
  duration: 34,
  intro: b(
    "大肠杆菌的 RecA–LexA 调控示例。上方是损伤后积累的单链 DNA 区域，下方是同一细胞中另一个 SOS 启动子区域。展示诱导修复与损伤耐受基因的信号机制，不把 SOS 启动等同于修复完成。",
    "An Escherichia coli RecA–LexA regulatory example. The upper region shows ssDNA accumulated after damage; the lower region is a separate SOS promoter in the same cell. The scene shows induction of repair and damage-tolerance genes, not completed DNA repair.",
  ),
  controls: [
    {
      id: "lexA",
      label: b("LexA 条件", "LexA condition"),
      default: "wildtype",
      options: [
        { value: "wildtype", label: b("可自切割 LexA", "Self-cleavable LexA") },
        {
          value: "noncleavable",
          label: b("不可切割 LexA 对照", "Noncleavable LexA comparison"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("损伤与单链间隙", "Damage and an ssDNA gap"),
      description: b(
        "复制受阻或复制后的间隙可产生持续暴露的单链 DNA。图示是一种损伤关联间隙；不代表所有损伤都形成同一种结构。",
        "Replication stalling or post-replication gaps can expose persistent ssDNA. The illustrated damage-associated gap is one example, not a universal structure for all lesions.",
      ),
    },
    {
      at: 0.18,
      title: b("形成 RecA* 丝状体", "Build a RecA* filament"),
      description: b(
        "RecA 在单链 DNA 上装配活性核蛋白丝状体；ATP 支持其活性构象。这里只强调信号作用，未展示同源链交换。",
        "RecA assembles an active nucleoprotein filament on ssDNA; ATP supports its active conformation. The focus here is signaling rather than homologous strand exchange.",
      ),
    },
    {
      at: 0.38,
      title: b("LexA 接触 RecA*", "LexA contacts RecA*"),
      description: b(
        "LexA 二聚体通常结合 SOS box 抑制基因。可交换的 LexA 分子与 RecA* 相互作用，促进自身催化切割；RecA 本身不是切开 LexA 的蛋白酶。",
        "LexA dimers normally repress genes at SOS boxes. Exchangeable LexA interacts with RecA*, which promotes LexA autocleavage; RecA itself is not the protease cutting LexA.",
      ),
    },
    {
      at: 0.57,
      title: b("解除转录抑制", "Relieve transcriptional repression"),
      description: b(
        "可自切割 LexA 的功能性抑制池减少，SOS 启动子获得转录机会。不可切割对照保留抑制，即使 RecA* 已形成。",
        "Autocleavage reduces the functional LexA repressor pool, permitting SOS promoter transcription. The noncleavable comparison retains repression despite forming RecA*.",
      ),
    },
    {
      at: 0.78,
      title: b("表达应答基因", "Express response genes"),
      description: b(
        "RNA 聚合酶沿模板合成 5′→3′ RNA，诱导修复和损伤耐受相关基因。各基因时序不同；持久响应可能包括易错跨损伤合成，本示意未模拟其修复结局。",
        "RNA polymerase synthesizes RNA 5′→3′ along the template, inducing repair and damage-tolerance genes. Timing differs among genes; persistent responses can include error-prone translesion synthesis. Repair outcomes are not simulated here.",
      ),
    },
  ],
  sources: [
    {
      title: "E. coli RNA polymerase elongation complex (PDB 6ALF)",
      url: "https://www.rcsb.org/structure/6ALF",
    },
    {
      title:
        "The LexA-RecA* structure reveals a cryptic lock-and-key mechanism for SOS activation",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11521096/",
    },
    {
      title:
        "The SOS system: A complex and tightly regulated response to DNA damage",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6590174/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      dna = k.material("#90acb2"),
      nascent = k.material("#b8c9ca"),
      recMat = k.material("#829e91"),
      lexMat = k.material("#aa91af"),
      cutMat = k.material("#c7997f"),
      rnaMat = k.material("#beaa7d"),
      polMat = k.material("#9dafa7"),
      boxMat = k.material("#b7a984");
    // Upper parental strand remains continuous; the complementary nascent strand has a gap.
    const detail = molecularDetail(k),
      dnaBase = k.material("#c6d4ca"),
      proteinAccent = k.material("#b6c9ba"),
      rnaBase = k.material("#ddcda7");
    const topPoints = [];
    for (let i = 0; i <= 60; i++) {
      const x = -3.75 + i * 0.125;
      topPoints.push([
        x,
        1.45 + 0.1 * Math.sin(x * 1.8),
        0.06 * Math.cos(x * 1.8),
      ]);
    }
    k.tube(topPoints, 0.065, dna);
    k.tube(
      [
        [-3.75, 1.08, 0],
        [-2.8, 1.02, 0.1],
        [-1.9, 1.08, 0],
      ],
      0.065,
      nascent,
    );
    k.tube(
      [
        [1.9, 1.08, 0],
        [2.8, 1.02, 0.1],
        [3.75, 1.08, 0],
      ],
      0.065,
      nascent,
    );
    for (let i = 0; i < 13; i++) {
      const x = -3.65 + i * 0.13;
      k.segment([x, 1.4, 0], [x, 1.06, 0], 0.021, nascent);
      k.segment([-x, 1.4, 0], [-x, 1.06, 0], 0.021, nascent);
    }
    const lesion = k.mesh(
      new THREE.OctahedronGeometry(0.15),
      cutMat,
      [-1.85, 1.44, 0.15],
    );
    const rec = [];
    for (let i = 0; i < 15; i++) {
      const x = -1.7 + i * 0.24,
        m = new THREE.Group();
      m.name = `RecA nucleoprotein subunit ${i + 1}`;
      group.add(m);
      m.position.set(x, 1.45, 0);
      m.rotation.x = i * 1.01;
      detail.fold(
        m,
        "RecA ATPase core",
        [0, 0.26, 0],
        [0.2, 0.31, 0.27],
        recMat,
        proteinAccent,
        { sheetCount: 3, helixCount: 2 },
      );
      detail.fold(
        m,
        "RecA C-terminal domain",
        [0.03, 0.47, -0.04],
        [0.14, 0.16, 0.14],
        recMat,
        proteinAccent,
        { sheetCount: 2, helixCount: 1 },
      );
      k.tube(
        [
          [0, 0.15, -0.13],
          [0.025, 0.08, 0],
          [0, 0.15, 0.13],
        ],
        0.035,
        boxMat,
        m,
      );
      k.ball([0.07, 0.23, 0.15], [0.048, 0.034, 0.027], boxMat, m);
      rec.push(m);
    }
    // Separate gene locus, with explicit antiparallel backbones and a promoter operator.
    const locusPoints = [[], []],
      locusLinks = [[], []],
      locusPairs = [],
      locusDetail = [];
    for (let strand = 0; strand < 2; strand++) {
      for (let i = 0; i <= 60; i++)
        locusPoints[strand].push(new THREE.Vector3());
      for (let i = 0; i < 60; i++) {
        const m = k.segment(
          [0, 0, 0],
          [0.1, 0, 0],
          0.05,
          strand ? nascent : dna,
        );
        m.name = `SOS DNA backbone ${strand} ${i}`;
        locusLinks[strand].push(m);
      }
    }
    for (let i = 0; i <= 60; i++) {
      const m = k.segment([0, 0, 0], [0.1, 0, 0], 0.021, nascent);
      m.name = `SOS DNA pair ${i}`;
      locusPairs.push(m);
    }
    const operator = k.mesh(
      new THREE.BoxGeometry(1.06, 0.075, 0.7),
      boxMat,
      [-0.95, -1.51, 0],
    );
    const lex = new THREE.Group();
    group.add(lex);
    const domains = [];
    for (let side = 0; side < 2; side++) {
      const x = side ? 0.24 : -0.24;
      const bind = detail.fold(
          lex,
          "LexA N-terminal DNA-binding domain",
          [x, -0.19, 0.1],
          [0.27, 0.24, 0.23],
          lexMat,
          proteinAccent,
          { sheetCount: 0, helixCount: 3 },
        ),
        catalytic = detail.fold(
          lex,
          "LexA C-terminal self-cleavage domain",
          [x, 0.23, 0.04],
          [0.29, 0.27, 0.25],
          lexMat,
          cutMat,
          { sheetCount: 3, helixCount: 2 },
        );
      const hinge = k.segment(
        [x, -0.13, 0.1],
        [x, 0.12, 0.05],
        0.047,
        cutMat,
        lex,
      );
      domains.push({ bind, catalytic, hinge, x });
    }
    const pol = new THREE.Group();
    group.add(pol);
    detail.fold(
      pol,
      "RNAP beta clamp",
      [-0.26, 0.02, -0.16],
      [0.37, 0.41, 0.32],
      polMat,
      recMat,
      { sheetCount: 3, helixCount: 2 },
    );
    detail.fold(
      pol,
      "RNAP beta-prime clamp",
      [0.28, 0.06, -0.18],
      [0.37, 0.43, 0.33],
      polMat,
      recMat,
      { sheetCount: 3, helixCount: 2 },
    );
    detail.fold(
      pol,
      "RNAP assembly lobe",
      [0, 0.35, -0.3],
      [0.39, 0.25, 0.29],
      polMat,
      recMat,
      { sheetCount: 2, helixCount: 2 },
    );
    k.tube(
      [
        [-0.35, -0.02, 0.05],
        [0, -0.18, 0.08],
        [0.4, -0.02, 0.05],
      ],
      0.065,
      recMat,
      pol,
    );
    const transcript = [];
    for (let i = 0; i < 28; i++) {
      const t = i / 27;
      transcript.push(
        k.segment(
          [t * 3.4, -1.88 - 0.35 * Math.sin(t * Math.PI), 0.38],
          [t * 3.4 + 0.11, -1.88 - 0.35 * Math.sin((t + 0.02) * Math.PI), 0.38],
          0.048,
          rnaMat,
        ),
      );
    }
    const labels = [
      k.label(
        [-2.5, 2.2, 0.2],
        "损伤相关 ssDNA 间隙",
        "Damage-associated ssDNA gap",
        3,
      ),
      k.label(
        [0.8, 2.16, 0.2],
        "RecA* 核蛋白丝状体",
        "RecA* nucleoprotein filament",
        3,
      ),
      k.label([-1, -0.52, 0.3], "LexA 二聚体", "LexA dimer", 3),
      k.label([-1, -1.91, 0.1], "SOS box", "SOS box", 2),
      k.label([2.2, -0.64, 0.1], "RNA 聚合酶", "RNA polymerase", 2),
      k.label(
        [2.5, -2.67, 0.1],
        "应答 RNA · 5′ → 3′",
        "Response RNA · 5′ → 3′",
        2,
      ),
      k.label([-3.9, -0.7, 0], "编码链 5′ → 3′", "Coding strand 5′ → 3′", 1),
      k.label([-3.9, -1.86, 0], "模板链 3′ → 5′", "Template strand 3′ → 5′", 1),
      k.label([1.0, 0.68, 0.4], "LexA 自切割", "LexA autocleavage", 3),
    ];
    const ra = new THREE.Vector3(),
      rb = new THREE.Vector3(),
      rd = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    const ssP = detail.instances(
        detail.sphere,
        dna,
        61,
        group,
        "ssDNA phosphate rail",
      ),
      ssS = detail.instances(
        detail.sugar,
        dnaBase,
        61,
        group,
        "ssDNA deoxyribose",
      ),
      ssB = detail.instances(
        detail.base,
        dnaBase,
        61,
        group,
        "ssDNA attached bases",
      );
    for (let i = 0; i < 61; i++) {
      ra.set(...topPoints[i]);
      detail.bead(ssP, i, ra, 0.059);
      ra.z += 0.045;
      detail.bead(ssS, i, ra, [0.055, 0.05, 0.05]);
      rb.copy(ra);
      rb.y -= 0.13;
      rb.z += 0.045;
      detail.bar(ssB, i, ra, rb, 0.071, 0.056);
    }
    detail.finish(ssP, ssS, ssB);
    for (let strand = 0; strand < 2; strand++) {
      const ps = detail.instances(
          detail.sphere,
          strand ? nascent : dna,
          61,
          group,
          `SOS locus strand ${strand} phosphates`,
        ),
        su = detail.instances(
          detail.sugar,
          dnaBase,
          61,
          group,
          `SOS locus strand ${strand} sugars`,
        ),
        ba = detail.instances(
          detail.base,
          dnaBase,
          61,
          group,
          `SOS locus strand ${strand} bases`,
        );
      locusDetail.push({ ps, su, ba });
    }
    const rnaP = detail.instances(
        detail.sphere,
        rnaMat,
        29,
        group,
        "response RNA phosphates",
      ),
      rnaS = detail.instances(
        detail.sugar,
        rnaBase,
        29,
        group,
        "response RNA ribose",
      ),
      rnaB = detail.instances(
        detail.base,
        rnaBase,
        29,
        group,
        "response RNA bases",
      );
    const rnaNodes = Array.from({ length: 29 }, () => new THREE.Vector3());
    const rnaHybrid = rnaNodes.map((_, i) => {
      const m = k.segment([0, 0, 0], [0.1, 0, 0], 0.018, boxMat);
      m.name = `SOS RNA template pair ${i}`;
      return m;
    });
    transcript.forEach((m, i) => {
      m.name = `SOS transcript backbone ${i}`;
    });
    pol.name = "SOS elongating RNAP";
    const join = (m, a, b, radius) => {
      rd.copy(b).sub(a);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.scale.set(radius, Math.max(rd.length(), 1e-6), radius);
      m.quaternion.setFromUnitVectors(up, rd.lengthSq() ? rd.normalize() : up);
    };
    const update = (value, parameters = {}) => {
      const p = clamp(value),
        cleavable = parameters.lexA !== "noncleavable",
        assemble = ease(p, 0.13, 0.35),
        contact = ease(p, 0.36, 0.49),
        cleave = cleavable ? ease(p, 0.49, 0.64) : 0,
        returning = cleavable ? 0 : ease(p, 0.52, 0.7),
        transcribe = cleavable ? ease(p, 0.64, 1) : 0;
      rec.forEach((m, i) => {
        m.visible = assemble > i / 15;
        m.scale.setScalar(0.88 + assemble * 0.12);
      });
      lex.position.set(
        -0.95 + contact * 0.6 - returning * 0.6,
        -0.73 + contact * 1.87 - returning * 1.87,
        0.32,
      );
      domains.forEach(({ bind, catalytic, hinge, x }, i) => {
        const side = i ? 1 : -1;
        bind.position.set(
          x + side * cleave * 0.63,
          -0.19 - cleave * 0.46,
          0.1 + cleave * 0.24,
        );
        catalytic.position.set(
          x + side * cleave * 0.3,
          0.23 + cleave * 0.3,
          0.04,
        );
        hinge.visible = cleave < 0.18;
      });
      lex.visible = cleave < 0.99 || p < 0.84;
      pol.visible = cleavable && p > 0.63;
      const polX = -0.75 + transcribe * 3.5;
      const bubble = cleavable ? ease(p, 0.635, 0.65) : 0;
      const opening = (x) =>
        bubble * (1 - ease(Math.abs(x - polX + 0.25), 0.46, 0.86));
      // A common positive-radius cross section, with integrated local unwinding.
      // The two strand identities always occupy opposite sides of this frame.
      const phases = new Float64Array(61);
      phases[0] = Math.PI / 2;
      for (let i = 1; i <= 60; i++) {
        const left = opening(-3.75 + (i - 1) * 0.125),
          right = opening(-3.75 + i * 0.125);
        phases[i] = phases[i - 1] - 0.47 * (1 - (left + right) / 2);
      }
      const phaseAt = (x) => {
        const index = Math.max(0, Math.min(60, (x + 3.75) / 0.125));
        const left = Math.min(59, Math.floor(index)),
          fraction = index - left;
        return phases[left] * (1 - fraction) + phases[left + 1] * fraction;
      };
      const rotation = bubble * (-4 * Math.PI - phaseAt(polX));
      const dnaAt = (strand, x, out) => {
        const amount = opening(x),
          angle = phaseAt(x) + rotation;
        const radius = 0.16 * (1 - amount) + 0.325 * amount,
          sign = strand ? -1 : 1;
        out.set(
          x,
          -1.25 + 0.075 * amount + sign * radius * Math.cos(angle),
          0.08 * amount + sign * radius * Math.sin(angle),
        );
        return out;
      };
      pol.position.set(polX, -1.14, -0.02);
      for (let strand = 0; strand < 2; strand++) {
        const { ps, su, ba } = locusDetail[strand];
        for (let i = 0; i <= 60; i++) {
          const x = -3.75 + i * 0.125,
            amount = opening(x);
          const a = dnaAt(strand, x, locusPoints[strand][i]);
          detail.bead(ps, i, a, 0.054);
          detail.bead(su, i, a, [0.048, 0.05, 0.046]);
          dnaAt(1 - strand, x, rb);
          rb.lerp(a, 0.7);
          rb.lerp(
            ra.copy(a).add(new THREE.Vector3(0, strand ? 0.08 : -0.08, 0)),
            amount,
          );
          detail.bar(ba, i, a, rb, 0.059, 0.053);
        }
        locusLinks[strand].forEach((m, i) =>
          join(m, locusPoints[strand][i], locusPoints[strand][i + 1], 0.05),
        );
        detail.finish(ps, su, ba);
      }
      locusPairs.forEach((m, i) => {
        ra.copy(locusPoints[0][i]).lerp(locusPoints[1][i], 0.3);
        rb.copy(locusPoints[1][i]).lerp(locusPoints[0][i], 0.3);
        join(m, ra, rb, 0.021);
        m.visible = opening(-3.75 + i * 0.125) === 0;
      });
      const length = transcribe * 28;
      for (let i = 0; i <= 28; i++) {
        const x = -0.75 + Math.min(i, length) * 0.125;
        const distance = polX - x,
          exit = ease(distance, 0.625, 1.05);
        rnaNodes[i].set(x, -1.32 - exit * 0.73, 0.08 + exit * 0.3);
      }
      transcript.forEach((m, i) => {
        join(m, rnaNodes[i], rnaNodes[i + 1], 0.048);
        m.visible = cleavable && length > i && p > 0.65;
      });
      lesion.scale.setScalar(1 + 0.08 * Math.sin(p * Math.PI));
      labels[1].active = p > 0.16;
      labels[2].active = p < 0.51 || !cleavable;
      labels[2].position[0] = lex.position.x;
      labels[2].position[1] = lex.position.y + 0.65;
      labels[4].active = pol.visible;
      labels[4].position[0] = pol.position.x;
      labels[5].active = transcribe > 0.05;
      labels[8].active = cleavable && cleave > 0 && p < 0.84;
      for (let i = 0; i <= 28; i++) {
        const visible =
          cleavable && length > 0 && i <= Math.ceil(length) && p > 0.65;
        const show = visible ? 1 : 0;
        ra.copy(rnaNodes[i]);
        detail.bead(rnaP, i, ra, 0.055 * show);
        detail.bead(rnaS, i, ra, [0.05 * show, 0.046 * show, 0.042 * show]);
        rb.copy(ra).add(new THREE.Vector3(0, -0.08, 0));
        detail.bar(rnaB, i, ra, rb, 0.062 * show, 0.05 * show);
        const partner = locusPoints[1][24 + i];
        const hybrid = rnaHybrid[i];
        const targetTip = partner.clone().add(new THREE.Vector3(0, 0.08, 0));
        join(hybrid, rb, targetTip, 0.018);
        hybrid.visible =
          visible &&
          i <= Math.floor(length) &&
          polX - ra.x <= 0.625 &&
          opening(ra.x) === 1;
      }
      detail.finish(rnaP, rnaS, rnaB);
      group.userData = {
        structuralDetail:
          "helical RecA ATPase and CTD subunits, LexA DNA-binding and catalytic domains, nucleotide-level DNA and RNA",
        process: "bacterialRepair",
        organism: "Escherichia coli",
        condition: cleavable ? "self-cleavable LexA" : "noncleavable LexA",
        ssDNAExposed: true,
        recAFilamentSubunits: rec.filter((m) => m.visible).length,
        recARole: "promotes LexA autocleavage, not a protease",
        lexACleaved: cleave > 0.9,
        sosDerepressed: cleavable && p > 0.64,
        transcriptSegments: transcript.filter((m) => m.visible).length,
        rnaSynthesisDirection: "5-prime to 3-prime",
        repairCompletionShown: false,
      };
    };
    update(0);
    return {
      group,
      materials: detail.inventory(group),
      update,
      labels,
      camera: { position: [0, 2.0, 10.8], target: [0, -0.05, 0] },
    };
  },
};
