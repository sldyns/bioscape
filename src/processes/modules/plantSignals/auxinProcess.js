import { tir1Pocket } from "./tir1Pocket.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { helix, lrr, domain, instances, instanceWriter } from "./structures.js";

export default {
  id: "auxin",
  title: b(
    "生长素：解除转录抑制",
    "Auxin: releasing transcriptional repression",
  ),
  intro: b(
    "拟南芥幼茎细胞的核内 TIR1/AFB–Aux/IAA–ARF 通路。生长素促进抑制蛋白被识别、泛素化并降解；结合位点采用 2P1Q 的 TIR1 接触残基、IAA 与 IAA7 降解子共同坐标；外围 SCF 和分子移动为反应示意。右侧组织小图仅示意后续差异伸长。",
    "Nuclear TIR1/AFB–Aux/IAA–ARF signaling in an Arabidopsis shoot cell. Auxin promotes recognition, ubiquitylation and destruction of a repressor. The binding site uses common 2P1Q coordinates for TIR1 contact residues, IAA and the IAA7 degron; the surrounding SCF and molecular motions are reaction schematics. The tissue inset represents later differential elongation.",
  ),
  duration: 34,
  controls: [
    {
      id: "auxin",
      label: b("核内生长素", "Nuclear auxin"),
      default: "present",
      options: [
        { value: "present", label: b("有生长素", "Auxin present") },
        { value: "low", label: b("低生长素对照", "Low auxin control") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("抑制状态", "Repressed state"),
      description: b(
        "Aux/IAA 与 DNA 上的激活型 ARF 相互作用，并通过共抑制因子限制转录。低生长素对照保持这一示意状态。",
        "Aux/IAA interacts with an activating ARF on DNA and restricts transcription through corepressors. The low-auxin control retains this schematic state.",
      ),
    },
    {
      at: 0.16,
      title: b("生长素作为分子胶", "Auxin as molecular glue"),
      description: b(
        "生长素进入 TIR1 的结合口袋，增强 Aux/IAA 降解子与受体的相互作用。TIR1 是 SCF 泛素连接酶的底物识别组分。",
        "Auxin occupies a TIR1 pocket and stabilizes engagement of the Aux/IAA degron. TIR1 is the substrate-recognition component of an SCF ubiquitin ligase.",
      ),
    },
    {
      at: 0.34,
      title: b("标记抑制蛋白", "Tagging the repressor"),
      description: b(
        "SCF 体系促进 Aux/IAA 多聚泛素化；图中泛素链为示意，不表示固定链长。生长素本身不被画成蛋白激酶。",
        "The SCF machinery promotes Aux/IAA polyubiquitylation. The drawn chain is schematic, with no fixed biological length implied; auxin is not a protein kinase.",
      ),
    },
    {
      at: 0.52,
      title: b("蛋白酶体移除 Aux/IAA", "Proteasomal removal of Aux/IAA"),
      description: b(
        "带标记的 Aux/IAA 进入 26S 蛋白酶体并被降解。泛素被回收，ARF 蛋白保留在 DNA 上。",
        "Tagged Aux/IAA is degraded by the 26S proteasome. Ubiquitin is recycled and the ARF remains on DNA.",
      ),
    },
    {
      at: 0.71,
      title: b("靶基因转录", "Target-gene transcription"),
      description: b(
        "移除抑制后，激活型 ARF 支持生长素响应基因转录。RNA 在核内按 5′→3′ 延长；后续输出及翻译未在主图展开。",
        "After repression is relieved, activating ARF supports auxin-responsive transcription. RNA elongates 5′→3′ in the nucleus; export and translation are not expanded in the main view.",
      ),
    },
    {
      at: 0.88,
      title: b("组织尺度的后续效应", "Later tissue-level effects"),
      description: b(
        "幼茎中包括 SAUR 在内的下游调节可促进细胞壁酸化和伸长；两侧反应不同可产生差异生长。小图概括较晚的结果，不把核内信号与机械伸长视为同一步。",
        "In shoots, downstream regulators including SAUR proteins can promote wall acidification and elongation. Unequal responses across a tissue can yield differential growth. The inset summarizes later events rather than equating nuclear signaling with immediate mechanical extension.",
      ),
    },
  ],
  sources: [
    {
      title: "PDB 2P1Q: TIR1–ASK1–IAA–IAA7 experimental binding site",
      url: "https://www.rcsb.org/structure/2P1Q",
    },
    {
      title:
        "Tan et al. (2007) Mechanism of auxin perception by the TIR1 ubiquitin ligase",
      url: "https://www.nature.com/articles/nature05731",
    },
    {
      title:
        "Winkler et al. (2017) Variation in auxin sensing guides AUX/IAA transcriptional repressor ubiquitylation and destruction",
      url: "https://www.nature.com/articles/ncomms15706",
    },
    {
      title:
        "Spartz et al. (2014) SAUR inhibition of PP2C-D phosphatases activates plasma membrane H+-ATPases",
      url: "https://pubmed.ncbi.nlm.nih.gov/24858935/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const teal = k.material("#65958e"),
      green = k.material("#92af87"),
      purple = k.material("#a38cac"),
      gold = k.material("#c5a265"),
      coral = k.material("#c88f79"),
      cream = k.material("#d8d4bf"),
      navy = k.material("#62798b");
    // Open nuclear boundary: the interior is exposed, not an opaque sphere.
    const boundary = k.mesh(
      new THREE.TorusGeometry(3.35, 0.028, 8, 112, Math.PI * 1.82),
      k.material("#bac6bc"),
      [-1.05, -0.05, -0.65],
    );
    boundary.scale.set(1.08, 0.94, 1);
    // Experimental local pocket: selected complete TIR1 contact residues.
    const receptor = new THREE.Group();
    receptor.name = "tir1-receptor";
    receptor.position.set(-2.3, 1.25, 0.15);
    group.add(receptor);
    tir1Pocket(k, receptor, { material: teal, name: "tir1-pocket-surface" });
    domain(k, receptor, [-0.35, -0.56, -0.1], [0.43, 0.42, 0.6], teal, green); // F-box attachment
    domain(k, group, [-2.83, 0.52, -0.18], [0.65, 0.45, 0.7], green, cream); // ASK1 adaptor
    // Curved cullin scaffold: serial helical domains bridge receptor to RING/E2.
    for (let i = 0; i < 3; i++)
      domain(
        k,
        group,
        [-2.65 + i * 0.4, 0.21 - Math.sin(i * 0.9) * 0.16, -0.25],
        [0.65, 0.39, 0.52],
        cream,
        green,
      );
    k.tube(
      [
        [-2.82, 0.42, -0.2],
        [-2.35, 0.12, -0.2],
        [-1.88, 0.1, -0.2],
        [-1.49, 0.36, -0.08],
      ],
      0.065,
      cream,
    );
    domain(k, group, [-1.46, 0.37, -0.1], [0.4, 0.38, 0.42], gold, cream); // RBX RING
    domain(k, group, [-1.2, 0.65, 0.02], [0.5, 0.47, 0.55], navy, teal); // ubiquitin-conjugating E2
    const auxin = new THREE.Group();
    auxin.name = "auxin-ligand";
    group.add(auxin);
    tir1Pocket(k, auxin, {
      part: "auxin",
      material: gold,
      name: "auxin-2p1q-atoms",
    });
    // Antiparallel double backbone with nucleotide-scale bases and a moving bubble.
    const writer = instanceWriter(),
      dnaSegments = 160,
      pairCount = 52;
    const dnaRails = [teal, navy].map((m, i) =>
      instances(group, k.cylinder, m, dnaSegments, `auxin-DNA-${i}-backbone`),
    );
    const phosphates = [teal, navy].map((m, i) =>
      instances(group, k.sphere, m, pairCount, `auxin-DNA-${i}-phosphates`),
    );
    const bases = [k.material("#b3ccc0"), k.material("#b4bece")].map((m, i) =>
      instances(group, k.cylinder, m, pairCount, `auxin-DNA-${i}-bases`),
    );
    const dnaPoint = (x, strand, center, opening) => {
      const theta = ((x + 3.6) * Math.PI * 2) / 0.84 + strand * Math.PI,
        sign = strand ? 1 : -1,
        local = Math.max(0, 1 - Math.abs(x - center) / 0.45),
        w = opening * local * local * (3 - 2 * local);
      return [
        x,
        -1.97 + Math.cos(theta) * 0.21 * (1 - w) + sign * w * 0.32,
        Math.sin(theta) * 0.21 * (1 - w) + w * 0.07,
      ];
    };
    const arf = new THREE.Group();
    arf.position.set(-1.8, -1.56, 0);
    group.add(arf);
    domain(k, arf, [-0.2, -0.12, -0.05], [0.76, 0.68, 0.75], green, teal);
    domain(k, arf, [0.22, -0.11, -0.08], [0.68, 0.62, 0.7], green, teal);
    domain(k, arf, [0.36, 0.27, 0.02], [0.47, 0.45, 0.5], green, cream); // PB1 interaction domain
    k.tube(
      [
        [0.07, 0.12, 0],
        [0.17, 0.39, 0.06],
        [0.36, 0.27, 0.02],
      ],
      0.042,
      green,
      arf,
    );
    const repressor = new THREE.Group();
    repressor.name = "aux-iaa";
    group.add(repressor);
    // The true degron coordinates dock with the true ligand and receptor.
    tir1Pocket(k, repressor, {
      part: "degron",
      material: purple,
      name: "iaa7-degron",
    });
    const bodyOffset = new THREE.Vector3(0.55, 0.1, 1.15);
    domain(
      k,
      repressor,
      bodyOffset.toArray(),
      [0.58, 0.54, 0.6],
      purple,
      k.material("#c5b0ce"),
    );
    k.tube(
      [
        [0.22, 0.08, 1.18],
        [0.37, 0.13, 1.21],
        [0.55, 0.1, 1.15],
      ],
      0.035,
      purple,
      repressor,
    );
    const corepressor = domain(
      k,
      group,
      [-2.3, -0.84, -0.12],
      [0.7, 0.55, 0.65],
      navy,
      teal,
    );
    // One conserved set of represented ubiquitins, independent of substrate scale.
    const tags = new THREE.Group();
    tags.name = "ubiquitin-chain";
    group.add(tags);
    for (let i = 0; i < 4; i++) {
      const ub = k.ball(
        [i * 0.18, Math.sin(i * 0.7) * 0.14, 0],
        0.085,
        gold,
        tags,
      );
      ub.name = `ubiquitin-${i}`;
      if (i)
        k.segment(
          [(i - 1) * 0.18, Math.sin((i - 1) * 0.7) * 0.14, 0],
          [i * 0.18, Math.sin(i * 0.7) * 0.14, 0],
          0.025,
          gold,
          tags,
        );
    }
    const ubiquitinAttachment = k.segment(
      [0, 0, 0],
      [0.1, 0.35, 0],
      0.025,
      gold,
    );
    ubiquitinAttachment.name = "ubiquitin-substrate-link";
    const tagA = new THREE.Vector3(),
      tagB = new THREE.Vector3(),
      tagDelta = new THREE.Vector3(),
      tagUp = new THREE.Vector3(0, 1, 0);
    // 20S barrel: alpha7-beta7-beta7-alpha7 with a visible front cutaway.
    const proteasome = new THREE.Group();
    proteasome.position.set(0.83, 1.04, -0.02);
    group.add(proteasome);
    const protSub = new THREE.SphereGeometry(1, 20, 14),
      coreColors = [teal, navy, navy, teal];
    for (let ring = 0; ring < 4; ring++)
      for (let j = 0; j < 7; j++) {
        const angle = (j * Math.PI * 2) / 7 + 0.13,
          y = (ring - 1.5) * 0.23;
        // Frontmost beta subunit omitted as a bounded cutaway to expose the lumen.
        if ((ring === 1 || ring === 2) && j === 2) continue;
        const m = k.mesh(
          protSub,
          coreColors[ring],
          [Math.cos(angle) * 0.4, y, Math.sin(angle) * 0.4],
          proteasome,
        );
        m.scale.set(0.18, 0.145, 0.19);
        m.rotation.y = -angle;
        helix(
          k,
          proteasome,
          [Math.cos(angle) * 0.43, y - 0.065, Math.sin(angle) * 0.43],
          [Math.cos(angle) * 0.43, y + 0.065, Math.sin(angle) * 0.43],
          0.043,
          cream,
          2,
        );
      }
    for (const sign of [-1, 1]) {
      // Hexameric ATPase base above the sevenfold core; axial pore stays open.
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3;
        domain(
          k,
          proteasome,
          [Math.cos(a) * 0.37, sign * 0.61, Math.sin(a) * 0.37],
          [0.32, 0.39, 0.32],
          teal,
          green,
        );
      }
      const rim = k.ring([0, sign * 0.46, 0], 0.31, 0.026, cream, proteasome);
      rim.rotation.x = Math.PI / 2;
      for (let j = 0; j < 4; j++)
        domain(
          k,
          proteasome,
          [-0.47 + j * 0.24, sign * 0.86, -0.25],
          [0.34, 0.32, 0.36],
          navy,
          teal,
        );
    }
    const unfoldedSubstrate = k.tube(
      [
        [0.83, 2.45, 0.04],
        [0.87, 2.22, 0.06],
        [0.8, 1.99, 0.04],
        [0.83, 1.72, 0.01],
        [0.83, 1.3, 0],
      ],
      0.033,
      purple,
    );
    const fragments = Array.from({ length: 6 }, (_, i) =>
      k.ball([0.75, 1.1, 0], 0.055, purple),
    );
    const pol = new THREE.Group();
    group.add(pol);
    pol.position.set(-0.5, -1.94, -0.1);
    // Multi-lobed RNA polymerase leaves an open DNA cleft facing the viewer.
    for (const [x, y, sx, sy] of [
      [-0.3, 0.04, 0.32, 0.4],
      [0.31, 0.01, 0.28, 0.38],
      [0, 0.36, 0.38, 0.19],
      [-0.4, -0.22, 0.19, 0.23],
      [0.34, -0.26, 0.22, 0.18],
    ])
      domain(k, pol, [x, y, -0.14], [sx, sy, 0.42], coral, cream);
    const rnaRails = instances(
        group,
        k.cylinder,
        coral,
        55,
        "auxin-nascent-RNA-backbone",
      ),
      rnaNucleotides = instances(
        group,
        k.sphere,
        gold,
        56,
        "auxin-nascent-RNA-nucleotides",
      );
    const cells = [];
    for (let c = 0; c < 2; c++)
      for (let r = 0; r < 3; r++) {
        const g = new THREE.Group();
        g.position.set(3.05 + c * 0.63, -1.2 + r * 0.67, -0.05);
        group.add(g);
        const wall = k.mesh(
          new THREE.BoxGeometry(0.51, 0.6, 0.35),
          k.material(c ? "#b4c39b" : "#d0d6bf", {
            transparent: true,
            opacity: 0.48,
          }),
          [0, 0, 0],
          g,
        );
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(wall.geometry),
          new THREE.LineBasicMaterial({ color: c ? "#84976e" : "#a7b096" }),
        );
        g.add(edges);
        k.ball([0.09, -0.13, 0.03], [0.07, 0.085, 0.07], green, g);
        cells.push({ g, c, r });
      }
    const labels = [
      k.label(
        [-2.4, 2.3, 0],
        "TIR1 · 2P1Q 结合位点",
        "TIR1 · 2P1Q binding site",
        2,
      ),
      k.label([0.8, 2.14, 0], "26S 蛋白酶体", "26S proteasome", 2),
      k.label([-1.62, -2.44, 0], "DNA · ARF", "DNA · ARF", 2),
      k.label([-1.25, -0.62, 0.35], "Aux/IAA 抑制蛋白", "Aux/IAA repressor", 2),
      k.label(
        [-0.06, -0.05, 0.2],
        "新生 RNA · 5′→3′",
        "Nascent RNA · 5′→3′",
        1,
      ),
      k.label(
        [3.34, 1.33, 0],
        "后续差异伸长",
        "Later differential elongation",
        1,
      ),
      k.label(
        [-3.4, -2.9, 0],
        "核内 · 拟南芥幼茎",
        "Nucleus · Arabidopsis shoot",
        1,
      ),
      k.label([-3.1, 2.85, 0.1], "生长素", "Auxin", 1),
    ];
    return {
      group,
      camera: { position: [0, 1.1, 12.4], target: [-0.15, 0, 0] },
      labels,
      update(value, parameters = {}) {
        const p = clamp(value),
          on = (parameters.auxin ?? "present") === "present";
        const bind = on ? ease(p, 0.14, 0.31) : 0,
          tag = on ? ease(p, 0.34, 0.48) : 0,
          carry = on ? ease(p, 0.49, 0.61) : 0,
          loss = on ? ease(p, 0.63, 0.7) : 0,
          detach = on ? ease(p, 0.61, 0.63) : 0,
          tx = on ? ease(p, 0.71, 0.88) : 0,
          growth = on ? ease(p, 0.88, 1) : 0;
        auxin.visible = on;
        auxin.position.set(
          -3.25 + bind * 0.95,
          2.55 - bind * 1.3,
          0.15 + (1 - bind) * 0.2,
        );
        const substrateScale = Math.max(0.001, 1 - loss);
        repressor.position.set(
          -1.99 - bind * 0.31 + carry * 2.58,
          -1.39 + bind * 2.64 + carry * 0.75,
          -1.13 + bind * 1.28 - carry * 1.18,
        );
        // Hold the compact domain at the entrance while only substrate unfolds.
        repressor.position.addScaledVector(bodyOffset, 1 - substrateScale);
        repressor.scale.setScalar(substrateScale);
        repressor.visible = loss < 0.995;
        corepressor.visible = bind < 0.5;
        tags.visible = on && tag > 0.001;
        tags.scale.setScalar(1);
        tagA
          .copy(repressor.position)
          .addScaledVector(bodyOffset, substrateScale);
        tagB.set(tagA.x + 0.1, tagA.y + 0.35, tagA.z);
        tags.position.set(
          tagB.x + (1.4 - tagB.x) * detach,
          tagB.y + (1.87 - tagB.y) * detach,
          tagB.z + (0.22 - tagB.z) * detach,
        );
        if (tag < 1) {
          tags.position.x = -1.1 + (tags.position.x + 1.1) * tag;
          tags.position.y = 0.9 + (tags.position.y - 0.9) * tag;
        }
        ubiquitinAttachment.visible = on && tag > 0.99 && detach === 0;
        tagDelta.subVectors(tags.position, tagA);
        const tagLength = tagDelta.length();
        ubiquitinAttachment.position
          .copy(tags.position)
          .add(tagA)
          .multiplyScalar(0.5);
        ubiquitinAttachment.quaternion.setFromUnitVectors(
          tagUp,
          tagDelta.normalize(),
        );
        ubiquitinAttachment.scale.set(
          0.025,
          Math.max(tagLength, 0.00001),
          0.025,
        );
        unfoldedSubstrate.visible = loss > 0.02 && loss < 0.98;
        unfoldedSubstrate.scale.y = 1 - loss * 0.2;
        unfoldedSubstrate.position.y = loss * 0.2;
        for (let i = 0; i < fragments.length; i++) {
          const f = fragments[i];
          f.visible = loss > 0.05 && p < 0.83;
          f.position.set(
            0.83 + Math.cos(i * 2.3) * loss * 0.52,
            0.95 - loss * (0.6 + i * 0.08),
            Math.sin(i * 2.3) * 0.22,
          );
        }
        const center = -0.5 + tx * 1.28,
          opening = on ? ease(p, 0.695, 0.748) : 0;
        pol.position.x = center;
        pol.visible = tx > 0.005;
        for (let strand = 0; strand < 2; strand++) {
          for (let i = 0; i < dnaSegments; i++)
            writer.segment(
              dnaRails[strand],
              i,
              dnaPoint(
                -3.6 + (i / dnaSegments) * 5.3,
                strand,
                center,
                opening * 0.96,
              ),
              dnaPoint(
                -3.6 + ((i + 1) / dnaSegments) * 5.3,
                strand,
                center,
                opening * 0.96,
              ),
              0.035,
            );
          for (let i = 0; i < pairCount; i++) {
            const x = -3.55 + (i / (pairCount - 1)) * 5.2,
              a = dnaPoint(x, strand, center, opening * 0.96),
              b = dnaPoint(x, 1 - strand, center, opening * 0.96),
              opened = tx > 0 && Math.abs(x - center) < 0.36;
            writer.bead(phosphates[strand], i, a, 0.044);
            writer.segment(
              bases[strand],
              i,
              a,
              [
                a[0] + (opened ? (strand ? 0.065 : -0.065) : 0),
                a[1] + (b[1] - a[1]) * (opened ? 0.17 : 0.48),
                a[2] + (b[2] - a[2]) * (opened ? 0.17 : 0.48),
              ],
              0.032,
            );
          }
          writer.finish(dnaRails[strand]);
          writer.finish(phosphates[strand]);
          writer.finish(bases[strand]);
        }
        const rnaPoint = (t) => {
          const d = t * tx * 1.46;
          return [
            center - d * 0.42,
            -1.91 + d * 0.83,
            0.21 + Math.sin(d * 5) * 0.09,
          ];
        };
        rnaRails.visible = rnaNucleotides.visible = tx > 0.005;
        for (let i = 0; i <= 55; i++) {
          writer.bead(rnaNucleotides, i, rnaPoint(i / 55), 0.037);
          if (i < 55)
            writer.segment(
              rnaRails,
              i,
              rnaPoint(i / 55),
              rnaPoint((i + 1) / 55),
              0.026,
            );
        }
        writer.finish(rnaRails);
        writer.finish(rnaNucleotides);
        for (const { g, c, r } of cells) {
          const stretch = 1 + growth * (c ? 0.36 : 0.08);
          g.scale.y = stretch;
          g.position.y = -1.2 + r * 0.67 * stretch;
        }
        labels[3].position = [
          repressor.position.x,
          repressor.position.y + 0.48,
          0.35,
        ];
        labels[3].active = loss < 0.95;
        labels[4].active = tx > 0.08;
        labels[7].active = on;
        group.userData = {
          process: "auxin",
          species: "Arabidopsis thaliana",
          compartment: "nucleus",
          condition: on ? "present" : "low",
          auxinBound: bind > 0.95,
          repressorUbiquitylated: tag > 0.95 && loss < 0.95,
          repressorDegraded: loss > 0.95,
          ubiquitinState:
            detach > 0
              ? "recycling"
              : tag > 0
                ? "tagging-or-attached"
                : "pool-omitted",
          arfOnDNA: true,
          structuralDetail:
            "LRR pocket; SCF domains; alpha7-beta7-beta7-alpha7 core cutaway; hexamer ATPase caps; nucleotide DNA and transcription bubble",
          dnaStrands: "antiparallel; template read 3-prime to 5-prime",
          transcription: tx,
          differentialElongation: growth,
          rnaDirection: "5-prime to 3-prime",
          tissueInset: "later shoot response, qualitative",
        };
      },
    };
  },
};
