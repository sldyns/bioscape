import { THREE, clamp, ease, bilingual as b } from "../../kit.js";
import {
  membraneScene,
  materialInventory,
  alphaHelix,
  foldedDomain,
  sugarRing,
  mix,
} from "./membraneGeometry.js";

export default {
  id: "bacterialCellWall",
  title: b("大肠杆菌肽聚糖装配", "Peptidoglycan assembly in E. coli"),
  intro: b(
    "大肠杆菌伸长复合体的局部示意：RodA 将膜外侧的脂质 II 聚合成糖链，PBP2 在周质中形成肽交联。模型跟踪两份已翻转的脂质 II 合成一段四糖链；外膜省略。β-内酰胺条件突出对转肽的直接阻断，不推演继发调控或裂解。",
    "Local schematic of the E. coli elongation complex: RodA polymerizes externally presented lipid II into glycan, and PBP2 forms peptide crosslinks in the periplasm. The model follows two flipped lipid II substrates into one tetrasaccharide chain; the outer membrane is omitted. The β-lactam condition isolates direct inhibition of transpeptidation without simulating downstream regulation or lysis.",
  ),
  duration: 34,
  stages: [
    {
      at: 0,
      title: b("内膜与周质", "Inner membrane and periplasm"),
      description: b(
        "脂质 II 的糖肽头位于内膜的周质侧；已有肽聚糖网位于上方。",
        "The sugar-peptide head of lipid II faces the periplasmic side of the inner membrane; existing peptidoglycan lies above.",
      ),
    },
    {
      at: 0.17,
      title: b("脂质 II 进入 RodA", "Lipid II enters RodA"),
      description: b(
        "二糖五肽的 NAM 端经焦磷酸连接膜内脂质载体；两份脂质 II 供给 RodA。胞质前体合成和翻转未绘出。",
        "The NAM end of each disaccharide-pentapeptide links through pyrophosphate to its membrane lipid carrier. Two lipid II substrates feed RodA; cytoplasmic synthesis and flipping are omitted.",
      ),
    },
    {
      at: 0.35,
      title: b("糖链延长", "Glycan elongation"),
      description: b(
        "两份二糖相连形成四糖链；供体的脂质焦磷酸释放，受体的 NAM–焦磷酸–脂质连接保留，锚定生长链。",
        "The two disaccharides join into a tetrasaccharide. The donor lipid pyrophosphate is released; the acceptor NAM–pyrophosphate–lipid linkage remains, anchoring the growing chain.",
      ),
    },
    {
      at: 0.64,
      title: b("PBP2 催化转肽", "PBP2 catalyzes transpeptidation"),
      description: b(
        "四糖链来到转肽区域；每次交联释放供体肽末端 D-Ala，并将第四位 D-Ala 连接到邻链第三位 mDAP。",
        "The tetrasaccharide reaches the transpeptidation region. Each crosslink releases terminal donor D-Ala and links donor D-Ala at position four to mDAP at position three on the neighboring chain.",
      ),
    },
    {
      at: 0.77,
      title: b("有或无交联", "Crosslinking or inhibition"),
      description: b(
        "β-内酰胺与 PBP 活性位点形成稳定共价复合物，阻断新交联；已有网架保持可见。",
        "A β-lactam forms a stable covalent complex at the PBP active site, blocking new crosslinks; the existing mesh remains visible.",
      ),
    },
    {
      at: 0.9,
      title: b("网架连接结果", "Resulting network connectivity"),
      description: b(
        "正常条件新增糖链接入网架；抑制条件留下未交联肽干。此处未表示完整细胞壁或所有细菌的交联方式。",
        "Normally the new glycan becomes connected to the mesh. Inhibition leaves uncrosslinked stems. This is neither a complete wall nor a model of every bacterial crosslink type.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Structural basis of peptidoglycan synthesis by E. coli RodA-PBP2 complex",
      url: "https://www.nature.com/articles/s41467-023-40483-8",
    },
    {
      title:
        "Genome-wide identification of genes required for alternative peptidoglycan cross-linking in Escherichia coli revealed unexpected impacts of β-lactams",
      url: "https://www.nature.com/articles/s41467-022-35528-3",
    },
  ],
  controls: [
    {
      id: "antibiotic",
      label: b("PBP2 条件", "PBP2 condition"),
      default: "none",
      options: [
        { value: "none", label: b("无抗生素", "No antibiotic") },
        {
          value: "betaLactam",
          label: b("β-内酰胺占据活性位点", "β-lactam occupies active site"),
        },
      ],
    },
  ],
  legend: [
    { color: "#b7a679", text: b("NAG", "NAG") },
    { color: "#83a99b", text: b("NAM", "NAM") },
    {
      color: "#a394b6",
      text: b("肽干 / 新交联", "Peptide stem / new crosslink"),
    },
    { color: "#bd8170", text: b("β-内酰胺", "β-lactam") },
  ],
  create() {
    const k = membraneScene(0.82, -3, [{ centre: 0.65, radius: 0.26 }]);
    const nag = k.material("#b7a679"),
      nam = k.material("#83a99b"),
      peptide = k.material("#a394b6"),
      bond = k.material("#a5b2a8"),
      protein = k.material("#7f9ba3"),
      enzyme = k.material("#9aa7be"),
      drugMat = k.material("#bd8170"),
      carrierMat = k.material("#c6b880");
    // Ten membrane helices surround RodA's periplasm-facing substrate groove.
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      const h = alphaHelix(
        k,
        [-3 + Math.cos(a) * 0.5, 0, -0.2 + Math.sin(a) * 0.34],
        1.85,
        protein,
      );
      h.rotation.z = Math.cos(a) * 0.075;
    }
    k.tube(
      [
        [-3.54, 0.84, -0.3],
        [-3.38, 1.04, -0.45],
        [-3, 1.11, -0.51],
        [-2.63, 1.04, -0.4],
        [-2.47, 0.83, -0.27],
      ],
      0.105,
      protein,
    );
    k.tube(
      [
        [-3.33, 0.87, 0.12],
        [-3.28, 1.0, 0.16],
        [-3.17, 1.05, 0.16],
      ],
      0.038,
      carrierMat,
    );
    k.tube(
      [
        [-2.78, 0.87, 0.12],
        [-2.8, 1.0, 0.16],
        [-2.93, 1.05, 0.16],
      ],
      0.038,
      carrierMat,
    );
    alphaHelix(k, [0.65, 0, -0.38], 1.8, enzyme);
    k.tube(
      [
        [0.65, 0.5, -0.38],
        [0.96, 0.83, -0.43],
        [1.03, 1.12, -0.35],
        [1.5, 1.48, -0.4],
      ],
      0.12,
      enzyme,
    );
    const pbpHead = foldedDomain(
      k,
      [1.5, 1.76, -0.4],
      [1.16, 0.72, 0.8],
      enzyme,
      "PBP2-transpeptidase-cleft",
    );
    k.ball([0, 0.06, 0.27], 0.055, carrierMat, pbpHead);
    k.segment([0, -0.12, 0.06], [0, 0.06, 0.27], 0.026, carrierMat, pbpHead);
    const site = k.ring([1.5, 1.81, -0.05], 0.15, 0.045, drugMat);
    const alanine = k.material("#c3a475"),
      mdap = k.material("#a18eac");
    // Bond cylinders have stable identities; their actual endpoints track the
    // reacting objects. No hidden product pool is revealed during polymerization.
    const up = new THREE.Vector3(0, 1, 0);
    const delta = new THREE.Vector3();
    function moveBond(mesh, from, to) {
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      delta.subVectors(to, from);
      mesh.scale.y = Math.max(delta.length(), 1e-6);
      mesh.quaternion.setFromUnitVectors(up, delta.normalize());
    }
    function namedBond(name, from, to, radius, material, parent = k.group) {
      const mesh = k.segment(from, to, radius, material, parent);
      mesh.name = name;
      return mesh;
    }
    function stem(parent, prefix, x, y, z, direction, count) {
      const residues = [],
        bonds = [];
      for (let t = 1; t <= count; t++) {
        const point = [x, y + direction * t * 0.19, z];
        const bead = k.ball(
          point,
          0.064,
          t >= 4 ? alanine : t === 3 ? mdap : peptide,
          parent,
        );
        bead.name = `${prefix}-residue-${t}`;
        if (t === 3) {
          k.segment([0, 0, 0], [0.95, 0.35, 0.25], 0.18, mdap, bead);
          k.ball([1.05, 0.35, 0.25], 0.36, mdap, bead);
        }
        residues.push(bead);
        bonds.push(
          namedBond(
            `${prefix}-stem-bond-${t}`,
            point,
            [x, y + direction * (t - 1) * 0.19, z],
            0.025,
            peptide,
            parent,
          ),
        );
      }
      return { residues, bonds };
    }
    for (let row = 0; row < 2; row++) {
      const y = row === 0 ? 2.8 : 3.4;
      const z = row === 0 ? 0.3 : -0.6;
      for (let j = 0; j < 10; j++) {
        const x = -3.4 + j * 0.68;
        const prefix = `wall-${row}-${j}`;
        const sugar = sugarRing(k, [x, y, z], j % 2 ? nam : nag);
        sugar.name = `${prefix}-${j % 2 ? "NAM" : "NAG"}`;
        if (j)
          namedBond(
            `${prefix}-glycosidic`,
            [x - 0.52, y, z],
            [x - 0.16, y, z],
            0.035,
            bond,
          );
        if (j % 2) {
          stem(k.group, prefix, x, y, z, -1, 4);
          // Leave front-chain mDAP at j=5,7 free to accept the new chain.
          // Existing crosslinks connect rear D-Ala4 to front mDAP3.
          if (row === 1 && j !== 5 && j !== 7)
            namedBond(
              `existing-peptide-crosslink-${j}`,
              [x, y - 4 * 0.19, z],
              [x, 2.8 - 3 * 0.19, 0.3],
              0.045,
              peptide,
            );
        }
      }
    }
    const units = [0, 1].map((i) => {
      const group = new THREE.Group();
      group.name = `reacting-disaccharide-${i}`;
      k.group.add(group);
      const n = sugarRing(k, [0, 1.18, 0.3], nag, group);
      const m = sugarRing(k, [0.68, 1.18, 0.3], nam, group);
      n.name = `reactant-${i}-NAG`;
      m.name = `reactant-${i}-NAM`;
      namedBond(
        `reactant-${i}-glycosidic`,
        [0.16, 1.18, 0.3],
        [0.52, 1.18, 0.3],
        0.04,
        bond,
        group,
      );
      const peptideStem = stem(group, `reactant-${i}`, 0.68, 1.18, 0.3, 1, 5);
      const carrier = new THREE.Group();
      carrier.name = `undecaprenyl-pyrophosphate-${i}`;
      k.group.add(carrier);
      // The carrier is linked to the reducing NAM, not to NAG.
      for (const [j, y] of [0.94, 0.77].entries()) {
        const p = k.ball([0, y, 0.3], 0.067, carrierMat, carrier);
        p.name = `carrier-${i}-phosphate-${j}`;
      }
      namedBond(
        `carrier-${i}-PP`,
        [0, 0.94, 0.3],
        [0, 0.77, 0.3],
        0.028,
        carrierMat,
        carrier,
      );
      namedBond(
        `carrier-${i}-PP-lipid`,
        [0, 0.77, 0.3],
        [0, 0.6, 0.3],
        0.028,
        carrierMat,
        carrier,
      );
      k.tube(
        [
          [0, 0.6, 0.3],
          [0, 0.4, 0.3],
          [-0.13, 0.2, 0.3],
          [0.1, -0.05, 0.3],
          [-0.12, -0.32, 0.3],
        ],
        0.047,
        carrierMat,
        carrier,
      );
      const attachment = namedBond(
        `NAM-pyrophosphate-bond-${i}`,
        [0, 1.18, 0.3],
        [0, 0.94, 0.3],
        0.034,
        carrierMat,
      );
      const crosslink = namedBond(
        `new-peptide-crosslink-${i}`,
        [0, 1.94, 0.3],
        [0, 2.23, 0.3],
        0.055,
        peptide,
      );
      return { group, carrier, attachment, crosslink, ...peptideStem };
    });
    const newGlycosidic = namedBond(
      "polymerization-glycosidic-bond",
      [-3.36, 1.18, 0.3],
      [-3.0, 1.18, 0.3],
      0.04,
      bond,
    );
    const aPoint = new THREE.Vector3(),
      bPoint = new THREE.Vector3();
    const antibiotic = new THREE.Group();
    k.group.add(antibiotic);
    const corners = [
      [-0.12, -0.12, 0],
      [0.12, -0.12, 0],
      [0.12, 0.12, 0],
      [-0.12, 0.12, 0],
    ];
    const drugBonds = corners.map((v, i) =>
      k.segment(v, corners[(i + 1) % 4], 0.04, drugMat, antibiotic),
    );
    // Side substituent and carbonyl distinguish the strained beta-lactam ring
    // from a generic inhibitor dot; opening the fourth bond indicates acylation.
    k.segment(
      [-0.12, 0.12, 0],
      [-0.27, 0.22, 0.04],
      0.028,
      drugMat,
      antibiotic,
    );
    k.ball([-0.3, 0.24, 0.04], 0.055, drugMat, antibiotic);
    k.segment([0.12, 0.12, 0], [0.19, 0.26, 0], 0.028, drugMat, antibiotic);
    k.ball([0.2, 0.29, 0], 0.06, carrierMat, antibiotic);
    const covalent = k.segment(
      [1.5, 1.8, 0.01],
      [1.68, 1.8, 0.25],
      0.035,
      drugMat,
    );
    const labels = [
      k.label([-3.4, -1.1, 0], "胞质", "Cytoplasm", 2),
      k.label(
        [-3.15, 3.64, 0],
        "已有肽聚糖 · 周质",
        "Existing peptidoglycan · periplasm",
        2,
      ),
      k.label(
        [-3, -1.23, 0.2],
        "RodA · 糖链聚合",
        "RodA · glycan polymerization",
        2,
      ),
      k.label([2.6, 0.4, 0.3], "PBP2 · 转肽", "PBP2 · transpeptidation", 2),
      k.label([-2.6, 1.08, 0.8], "两份脂质 II", "Two lipid II substrates", 2),
      k.label([2.72, 2.02, 0.8], "新肽交联", "New peptide crosslinks", 2),
      k.label(
        [2.7, -1.6, 0],
        "内膜 · 外膜省略",
        "Inner membrane · outer membrane omitted",
      ),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        blocked = parameters.antibiotic === "betaLactam";
      // Two continuously visible lipid-II substrates become one lipid-IV
      // chain. The donor carrier is released; the acceptor carrier remains.
      const joined = p >= 0.32;
      const advance = ease(p, 0.39, 0.61) * 3.52;
      units[0].group.position.x = -4.2 + advance;
      units[1].group.position.x =
        mix(-0.5, -2.84, ease(p, 0.04, 0.29)) + advance;
      newGlycosidic.visible = joined;
      moveBond(
        newGlycosidic,
        aPoint.set(units[0].group.position.x + 0.84, 1.18, 0.3),
        bPoint.set(units[1].group.position.x - 0.16, 1.18, 0.3),
      );
      let crosslinks = 0;
      units.forEach((unit, i) => {
        const x = unit.group.position.x + 0.68;
        const attached = i === 1 || !joined;
        unit.carrier.position.x = attached
          ? x
          : mix(-3.52, -4.05, ease(p, 0.32, 0.61));
        unit.attachment.visible = attached;
        moveBond(
          unit.attachment,
          aPoint.set(x, 1.18, 0.3),
          bPoint.set(unit.carrier.position.x, 0.94, 0.3),
        );
        const reactionAt = 0.69 + i * 0.13;
        const released = !blocked && p >= reactionAt;
        const release = released ? ease(p, reactionAt, reactionAt + 0.09) : 0;
        unit.residues[4].position.set(
          0.68 + release * 0.25,
          2.13 + release * 0.25,
          0.3 + release,
        );
        unit.bonds[4].visible = !released;
        unit.crosslink.visible = released;
        // These acceptor mDAP groups were deliberately left unoccupied above.
        moveBond(
          unit.crosslink,
          aPoint.set(x, 1.94, 0.3),
          bPoint.set(i * 1.36, 2.23, 0.3),
        );
        if (released) crosslinks++;
      });
      const drugBind = ease(p, 0.12, 0.42);
      antibiotic.visible = blocked;
      antibiotic.position.set(
        mix(3.1, 1.68, drugBind),
        mix(0.8, 1.8, drugBind),
        0.25,
      );
      drugBonds[3].visible = drugBind < 0.98;
      covalent.visible = blocked && drugBind >= 0.98;
      site.material = blocked ? drugMat : enzyme;
      pbpHead.rotation.z = blocked ? 0 : Math.sin(p * Math.PI * 2) * 0.035;
      labels[4].text = joined
        ? b(
            "四糖链 · 保留一枚脂质锚",
            "Tetrasaccharide · one lipid anchor retained",
          )
        : b(
            "两份脂质 II · NAM–PP–脂质",
            "Two lipid II substrates · NAM–PP–lipid",
          );
      labels[5].text = blocked
        ? b("PBP2 被占据 · 无新交联", "PBP2 occupied · no new crosslinks")
        : b("新肽交联", "New peptide crosslinks");
      k.group.userData = {
        process: "bacterialCellWall",
        species: "Escherichia coli",
        compartment: "periplasm",
        complex: "RodA-PBP2",
        rodATransmembraneHelices: 10,
        sugarRingGeometry: true,
        pbpCatalyticCleft: true,
        antibiotic: blocked ? "beta-lactam" : "none",
        newSugarUnits: joined ? 4 : 0,
        precursorSugarUnits: joined ? 0 : 4,
        newCrosslinks: crosslinks,
        terminalDAlanineReleased: crosslinks,
        pbpCovalentlyBlocked: blocked && drugBind >= 0.98,
        precursorAlreadyFlipped: true,
        outerMembraneOmitted: true,
        lysisSimulated: false,
      };
    }
    update(0);
    return {
      group: k.group,
      materials: materialInventory(k.group, [enzyme, drugMat]),
      update,
      labels,
      camera: { position: [0, 2.2, 12.3], target: [0, 1, 0] },
    };
  },
};
