import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

import { molecularDetail } from "./molecularDetail.js";

export default {
  id: "rnaSilencing",
  title: b("miRNA 引导的沉默", "miRNA-guided silencing"),
  intro: b(
    "动物细胞质中的成熟 miRNA–Argonaute 复合物识别靶 mRNA。比较常见的不完全配对、具有切割能力的 AGO2 与充分配对，以及种子区不匹配；一般的 miRNA 沉默并不需要直接切割。",
    "A mature miRNA–Argonaute complex recognizes a target mRNA in animal cytosol. Compare common partial pairing, extensive pairing with catalytically active AGO2, and a seed mismatch. Typical miRNA silencing does not require direct slicing.",
  ),
  duration: 32,
  controls: [
    {
      id: "pairing",
      label: b("靶位点与 Argonaute", "Target site and Argonaute"),
      default: "seed",
      options: [
        {
          value: "seed",
          label: b("种子区配对 · 常规 miRISC", "Seed pairing · typical miRISC"),
        },
        {
          value: "slice",
          label: b("充分配对 · 活性 AGO2", "Extensive pairing · active AGO2"),
        },
        { value: "mismatch", label: b("种子区不匹配", "Seed mismatch") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("成熟引导链", "Mature guide"),
      description: b(
        "已装载的 miRNA 位于 Argonaute 的沟槽中。此处从成熟 miRISC 开始，不展示 miRNA 生物发生。",
        "The loaded miRNA occupies an Argonaute groove. This scene begins with mature miRISC and omits miRNA biogenesis.",
      ),
    },
    {
      at: 0.18,
      title: b("识别 3′ UTR", "Recognize the 3′ UTR"),
      description: b(
        "引导链与 mRNA 反向平行配对；种子区识别支持结合。种子区不匹配时，本示例不形成稳定靶复合物。",
        "Guide and mRNA pair antiparallel. Seed recognition supports binding; the seed-mismatched target in this example does not form a stable target complex.",
      ),
    },
    {
      at: 0.38,
      title: b("配对决定分支", "Pairing selects a branch"),
      description: b(
        "常规分支保留中央错配并招募 TNRC6/GW182；充分配对分支特指有切割活性的 AGO2。不能把切割推广到所有 Argonaute。",
        "The typical branch retains central mismatches and recruits TNRC6/GW182. The extensive-pairing branch specifically uses slicing-competent AGO2; slicing must not be generalized to all Argonautes.",
      ),
    },
    {
      at: 0.56,
      title: b("抑制翻译或切割", "Repress translation or slice"),
      description: b(
        "TNRC6 招募 CCR4–NOT 等效应因子，促进翻译抑制与去腺苷酸化。活性 AGO2 分支则切开配对区域的 mRNA 骨架。",
        "TNRC6 recruits effectors including CCR4–NOT, promoting translational repression and deadenylation. Active AGO2 instead cleaves the mRNA backbone within the paired region.",
      ),
    },
    {
      at: 0.78,
      title: b("靶 RNA 周转", "Target RNA turnover"),
      description: b(
        "常规分支的 poly(A) 尾缩短，随后可去帽并降解；切割产物也可降解。不匹配分支保留完整靶 RNA。步骤间可重叠，动画不代表精确动力学。",
        "In the typical branch, poly(A) shortening can be followed by decapping and decay; sliced fragments can also decay. The mismatched target remains intact. Steps can overlap; the animation does not specify kinetics.",
      ),
    },
  ],
  sources: [
    {
      title: "Sheu-Gruttadauria et al. 2019: Beyond the seed",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6600645/",
    },
    {
      title: "Mechanistic Insights into MicroRNA-Mediated Gene Silencing",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6396329/",
    },
    {
      title: "Metazoan MicroRNAs",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6091663/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const ago = k.material("#819aaf"),
      agoDark = k.material("#597487"),
      guide = k.material("#b788ab"),
      target = k.material("#c6ac78"),
      pairMat = k.material("#adc4ba"),
      factor = k.material("#88a794"),
      decay = k.material("#bd927c");
    const risc = new THREE.Group();
    group.add(risc);
    const detail = molecularDetail(k),
      nucleotideBase = k.material("#d4bc92"),
      guideBase = k.material("#d0b1c9");
    detail.fold(
      risc,
      "N domain",
      [-1.3, 0.85, -0.48],
      [0.68, 0.81, 0.53],
      ago,
      agoDark,
      { sheetCount: 3, helixCount: 3, rotation: -0.28 },
    );
    detail.fold(
      risc,
      "PAZ 3-prime guide anchor",
      [-0.77, 1.49, -0.43],
      [0.74, 0.57, 0.43],
      ago,
      agoDark,
      { sheetCount: 4, helixCount: 2, rotation: 0.24 },
    );
    detail.fold(
      risc,
      "PIWI catalytic lobe",
      [0.44, 0.95, -0.58],
      [1.01, 0.94, 0.57],
      agoDark,
      ago,
      { sheetCount: 5, helixCount: 3, rotation: -0.2 },
    );
    detail.fold(
      risc,
      "MID 5-prime guide anchor",
      [1.35, 0.62, -0.42],
      [0.59, 0.65, 0.48],
      ago,
      agoDark,
      { sheetCount: 3, helixCount: 2, rotation: 0.3 },
    );
    k.tube(
      [
        [-1.3, 0.16, -0.4],
        [-0.72, -0.18, -0.48],
        [0.36, -0.17, -0.49],
        [1.43, 0.2, -0.35],
      ],
      0.12,
      agoDark,
      risc,
    );
    const pocket = k.ring([1.54, 0.48, 0.12], 0.17, 0.035, agoDark, risc);
    pocket.scale.set(1, 0.72, 1);
    k.tube(
      [
        [-1.45, 0.43, 0.28],
        [-1.65, 0.74, -0.05],
        [-1.16, 1.12, -0.06],
      ],
      0.045,
      guide,
      risc,
    );
    // One index map: guide numbering runs right to left; target runs left to right.
    const pitch = 0.138,
      guideX = (i) => -1.45 + i * pitch;
    const targetX = (i) =>
      i < 3 ? [-4, -3, -2][i] : i < 25 ? guideX(i - 3) : [2, 2.5, 3][i - 25];
    const targetIndexForGuide = (number) => 3 + (22 - number);
    const cutIndex = targetIndexForGuide(11); // bond opposite guide 11 / 10.
    const guides = [],
      bonds = [],
      mrna = [],
      bases = [];
    const targetPoints = Array.from({ length: 28 }, () => new THREE.Vector3());
    const join = (mesh, a, b, radius) => {
      const d = new THREE.Vector3().subVectors(b, a);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.scale.set(radius, Math.max(d.length(), 1e-6), radius);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.normalize(),
      );
    };
    for (let i = 0; i < 22; i++) {
      const x = guideX(i);
      const backbone = k.segment(
        [x, 0.43, 0.28],
        [guideX(Math.min(i + 1, 21)), 0.43, 0.28],
        0.055,
        guide,
        risc,
      );
      backbone.name = `miRNA backbone ${i}`;
      backbone.visible = i < 21;
      const base = k.segment(
        [x, 0.43, 0.28],
        [x, 0.31, 0.28],
        0.035,
        guide,
        risc,
      );
      base.name = `miRNA base ${i}`;
      guides.push(backbone, base);
      const pair = k.segment([x, 0.31, 0.28], [x, 0.14, 0.28], 0.018, pairMat);
      pair.name = `miRNA target pair ${i}`;
      bonds.push(pair);
    }
    for (let i = 0; i < 28; i++) {
      const x = targetX(i);
      const backbone = k.segment(
        [x, 0, 0.28],
        [targetX(Math.min(i + 1, 27)), 0, 0.28],
        0.055,
        target,
      );
      backbone.name = `target backbone ${i}`;
      const base = k.segment([x, 0, 0.28], [x, 0.14, 0.28], 0.034, target);
      base.name = `target base ${i}`;
      mrna.push(backbone);
      bases.push(base);
    }
    const tail = [];
    for (let i = 0; i < 12; i++)
      tail.push(
        k.ball(
          [3.05 + i * 0.13, 0.04 + Math.sin(i * 0.65) * 0.08, 0.28],
          0.066,
          target,
        ),
      );
    const cap = k.ball([-4.15, 0, 0.28], [0.15, 0.19, 0.15], agoDark);
    const tnrc6 = new THREE.Group();
    group.add(tnrc6);
    k.tube(
      [
        [1.1, 1.2, -0.12],
        [1.95, 1.48, 0.02],
        [2.35, 1.04, 0.1],
        [2.75, 0.92, 0.1],
      ],
      0.13,
      factor,
      tnrc6,
    );
    const ccr = new THREE.Group();
    group.add(ccr);
    k.ball([0, 0, 0], [0.48, 0.36, 0.3], factor, ccr);
    k.ball([0.35, -0.18, 0.04], [0.31, 0.22, 0.26], decay, ccr);
    const cut = k.mesh(
      new THREE.OctahedronGeometry(0.17),
      decay,
      [0, 0.04, 0.55],
    );
    const labels = [
      k.label(
        [-0.4, 2.5, 0],
        "Argonaute · 成熟 miRNA",
        "Argonaute · mature miRNA",
        3,
      ),
      k.label([-3.9, -0.5, 0.3], "5′ 帽", "5′ cap", 2),
      k.label([3.5, -0.55, 0.3], "3′ · poly(A)", "3′ · poly(A)", 2),
      k.label(
        [0.2, -0.7, 0.3],
        "mRNA · 3′ UTR 靶位点",
        "mRNA · 3′ UTR target",
        3,
      ),
      k.label([2.2, 1.85, 0.2], "TNRC6 / GW182", "TNRC6 / GW182", 2),
      k.label([3.4, 0.9, 0.3], "CCR4–NOT", "CCR4–NOT", 2),
      k.label([0.1, 0.9, 0.7], "AGO2 切割位点", "AGO2 cleavage site", 3),
      k.label(
        [1.4, 0.72, 0.5],
        "引导链 5′ → 3′ 向左",
        "Guide 5′ → 3′ to the left",
        1,
      ),
    ];
    const gp = detail.instances(
        detail.sphere,
        guide,
        22,
        risc,
        "guide phosphate backbone",
      ),
      gs = detail.instances(
        detail.sugar,
        guideBase,
        22,
        risc,
        "guide ribose sugars",
      ),
      gb = detail.instances(
        detail.base,
        guideBase,
        22,
        risc,
        "guide exposed bases",
      ),
      mp = detail.instances(
        detail.sphere,
        target,
        28,
        group,
        "mRNA phosphates",
      ),
      ms = detail.instances(
        detail.sugar,
        nucleotideBase,
        28,
        group,
        "mRNA ribose sugars",
      ),
      mb = detail.instances(
        detail.base,
        nucleotideBase,
        28,
        group,
        "mRNA bases",
      );
    const point = new THREE.Vector3();
    detail.fold(
      ccr,
      "deadenylase catalytic pocket",
      [0.13, -0.05, 0.13],
      [0.35, 0.3, 0.25],
      factor,
      decay,
      { sheetCount: 3, helixCount: 2 },
    );
    for (let i = 0; i < 3; i++)
      detail.fold(
        tnrc6,
        `TNRC6 interacting domain ${i}`,
        [1.35 + i * 0.47, 1.26 - i * 0.15, 0.03],
        [0.24, 0.23, 0.2],
        factor,
        ago,
        { sheetCount: 2, helixCount: 1 },
      );
    const update = (value, parameters = {}) => {
      const p = clamp(value),
        mode = ["slice", "mismatch"].includes(parameters.pairing)
          ? parameters.pairing
          : "seed",
        match = mode !== "mismatch",
        slicing = mode === "slice";
      const dock = ease(p, 0.08, 0.32),
        recruit = ease(p, 0.38, 0.53),
        shorten = ease(p, 0.58, 0.85),
        turnover = ease(p, 0.83, 1),
        cleavage = ease(p, 0.56, 0.68);
      risc.position.set(
        match ? 0 : -dock * 0.3,
        (1 - dock) * 1.6 + (match ? 0 : ease(p, 0.36, 0.8) * 1.15),
        0,
      );
      for (let i = 0; i < 28; i++) {
        const side = i <= cutIndex ? -1 : 1;
        const bulge =
          mode === "seed" && i >= 13 && i <= 16
            ? -0.24 * Math.sin(((i - 12) * Math.PI) / 5)
            : 0;
        targetPoints[i].set(
          targetX(i) + (slicing ? side * cleavage * 0.58 : 0),
          bulge - (slicing ? cleavage * 0.28 : 0),
          0.28,
        );
        const tip = targetPoints[i].clone().add(new THREE.Vector3(0, 0.14, 0));
        join(bases[i], targetPoints[i], tip, 0.034);
        bases[i].visible = !(
          match &&
          turnover > (slicing ? (Math.abs(i - 14.5) / 16) * 0.8 : (28 - i) / 29)
        );
      }
      mrna.forEach((m, i) => {
        const end =
          i < 27
            ? targetPoints[i + 1]
            : targetPoints[i].clone().add(new THREE.Vector3(0.05, 0, 0));
        join(m, targetPoints[i], end, 0.055);
        m.visible =
          bases[i].visible &&
          (i === 27 || bases[i + 1].visible) &&
          !(slicing && cleavage > 0 && i === cutIndex);
      });
      bonds.forEach((m, i) => {
        const start = new THREE.Vector3(guideX(i), 0.31, 0.28).add(
          risc.position,
        );
        const end = targetPoints[i + 3]
          .clone()
          .add(new THREE.Vector3(0, 0.14, 0));
        join(m, start, end, 0.018);
        m.visible =
          match &&
          dock === 1 &&
          (!slicing || cleavage === 0) &&
          bases[i + 3].visible &&
          ((slicing && i >= 6 && i <= 20) ||
            (!slicing && ((i >= 14 && i <= 20) || (i >= 6 && i <= 9))));
      });
      cut.position.x = (guideX(11) + guideX(12)) / 2;
      tail.forEach((m, i) => {
        m.visible = slicing
          ? turnover < (12 - i) / 13
          : !match || i < 12 - Math.floor(shorten * 11);
        m.position.y =
          (slicing ? -cleavage * 0.28 : 0) + 0.04 + Math.sin(i * 0.65) * 0.08;
        m.position.x = 3.05 + i * 0.13 + (slicing ? cleavage * 0.58 : 0);
      });
      cap.visible = !match || turnover < 0.12;
      cap.position.set(
        -4.15 - (slicing ? cleavage * 0.58 : 0),
        slicing ? -cleavage * 0.28 : 0,
        0.28,
      );
      tnrc6.visible = match && !slicing && p >= 0.38;
      tnrc6.position.set((1 - recruit) * 0.75, (1 - recruit) * 0.65, 0);
      ccr.visible = tnrc6.visible;
      ccr.position.set(3.65 - shorten * 0.9, 0.58 + (1 - recruit) * 0.8, 0.1);
      cut.visible = slicing && p > 0.54 && p < 0.74;
      cut.scale.setScalar(1 + Math.sin(cleavage * Math.PI) * 0.5);
      labels[4].active = labels[5].active = tnrc6.visible;
      labels[6].active = cut.visible;
      labels[0].position[1] = 2.3 + risc.position.y;
      labels[7].position[1] = 0.73 + risc.position.y;
      for (let i = 0; i < 22; i++) {
        const backbone = guides[i * 2],
          base = guides[i * 2 + 1];
        point.set(guideX(i), 0.43, 0.28);
        detail.bead(gp, i, point, 0.06);
        point.x += 0.015;
        detail.bead(gs, i, point, [0.055, 0.047, 0.045]);
        point.copy(base.position);
        point.z += 0.012;
        detail.bead(gb, i, point, [0.065, 0.1, 0.055]);
      }
      for (let i = 0; i < 28; i++) {
        const backbone = mrna[i],
          base = bases[i],
          show = base.visible ? 1 : 0;
        point.copy(targetPoints[i]);
        detail.bead(mp, i, point, 0.06 * show);
        point.x += 0.015;
        detail.bead(ms, i, point, [0.057 * show, 0.05 * show, 0.048 * show]);
        point.copy(base.position);
        point.z += 0.02;
        detail.bead(mb, i, point, [0.08 * show, 0.095 * show, 0.058 * show]);
      }
      detail.finish(gp, gs, gb, mp, ms, mb);
      group.userData = {
        structuralDetail:
          "N PAZ MID PIWI domains, anchor pockets, sugar phosphate bases, schematic folds",
        process: "rnaSilencing",
        compartment: "animal cytosol",
        pairing: mode,
        guideDirection: "antiparallel to mRNA",
        targetBound: match && p > 0.32,
        mechanism: !match
          ? "no stable target binding"
          : slicing
            ? "AGO2 slicing"
            : "TNRC6 repression and deadenylation",
        polyATailRemaining: tail.filter((m) => m.visible).length,
        cleaved: slicing && p > 0.68,
        complete: p === 1,
      };
    };
    update(0);
    return {
      group,
      materials: detail.inventory(group),
      update,
      labels,
      camera: { position: [0, 2.1, 10.5], target: [0, 0.9, 0] },
    };
  },
};
