import {
  proteinDomain,
  helix,
  molecularInventory,
} from "./refinementGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

export default {
  id: "rnaProcessing",
  title: b(
    "RNA 加工：从前体到成熟信使",
    "RNA processing: precursor to messenger",
  ),
  duration: 34,
  intro: b(
    "动物与植物细胞核中一种含内含子的 RNA 聚合酶 II 转录本示意。依次放大加帽、剪接和 3′ 端加工；真实细胞中这些过程常与转录重叠。形状不代表真实序列或精确比例。",
    "A schematic intron-containing RNA polymerase II transcript in an animal or plant nucleus. Capping, splicing and 3′ processing are highlighted in turn; in cells they often overlap with transcription. Shapes do not encode a real sequence or exact scale.",
  ),
  stages: [
    {
      at: 0,
      title: b("辨认前体 RNA", "Identify the precursor"),
      description: b(
        "RNA 从左侧 5′ 端到右侧 3′ 端。青绿色和蓝色区段是两个外显子；中间赭色区段是本次将去除的内含子。",
        "RNA runs from the 5′ end at left to the 3′ end at right. Teal and blue segments are two exons; the ochre segment is the intron removed here.",
      ),
    },
    {
      at: 0.13,
      title: b("保护 5′ 端", "Cap the 5′ end"),
      description: b(
        "加帽酶在新生 RNA 的 5′ 端形成含 7-甲基鸟苷的帽结构，连接方式为 5′–5′ 三磷酸连接。帽有助于 RNA 稳定性及后续识别。",
        "Capping enzymes form a 7-methylguanosine cap with a 5′–5′ triphosphate linkage on the nascent RNA. The cap supports RNA stability and subsequent recognition.",
      ),
    },
    {
      at: 0.29,
      title: b("组装剪接体", "Assemble the spliceosome"),
      description: b(
        "由小核 RNA 与蛋白质组成的剪接体识别剪接位点和分支点，使反应位点在三维空间中靠近。这里仅表示一个内含子。",
        "The spliceosome, built from small nuclear RNAs and proteins, recognizes splice sites and the branch point and brings reaction sites together in three dimensions. One intron is shown.",
      ),
    },
    {
      at: 0.46,
      title: b("形成套索并连接外显子", "Form a lariat and ligate exons"),
      description: b(
        "分支点腺苷的 2′-OH 首先进攻 5′ 剪接位点，形成套索中间体；随后上游外显子的 3′-OH 进攻 3′ 剪接位点，连接两个外显子并释放内含子套索。",
        "The branch-point adenosine 2′-OH first attacks the 5′ splice site to form a lariat intermediate. The upstream exon 3′-OH then attacks the 3′ splice site, joining the exons and releasing the intron lariat.",
      ),
    },
    {
      at: 0.69,
      title: b("切割 3′ 端并加尾", "Cleave and polyadenylate"),
      description: b(
        "加工复合物切割前体 RNA；poly(A) 聚合酶在新 3′ 端添加非模板编码的腺苷尾。这里演示常见的加尾转录本，并非所有 RNA 都采用这种加工。",
        "A processing complex cleaves the precursor; poly(A) polymerase adds a non-templated adenosine tail to the new 3′ end. This shows a common polyadenylated transcript, not the processing of every RNA.",
      ),
    },
    {
      at: 0.9,
      title: b("成熟但仍在细胞核内", "Mature, still in the nucleus"),
      description: b(
        "本模型得到有 5′ 帽、已连接外显子和 poly(A) 尾的 RNA。随后还需结合蛋白质并接受核输出调控；此处没有在核内翻译。",
        "The model now has a 5′ cap, joined exons and a poly(A) tail. Protein assembly and regulated nuclear export follow; translation is not shown inside the nucleus.",
      ),
    },
  ],
  sources: [
    {
      title: "The Cell: RNA Processing and Turnover",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9864/",
    },
    {
      title:
        "Fica et al. (2017): Structure of a spliceosome remodelled for exon ligation",
      url: "https://pubmed.ncbi.nlm.nih.gov/28076345/",
    },
    {
      title: "Molecular Biology of the Cell: From DNA to RNA",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26887/",
    },
  ],
  create({ rootId = "cell" } = {}) {
    const k = sceneKit(),
      { group } = k;
    const teal = k.material("#4c9990"),
      blue = k.material("#748eae"),
      ochre = k.material("#bd955d"),
      violet = k.material("#9480a5"),
      gold = k.material("#d1af67"),
      pale = k.material("#c6b8cf");
    const left = new THREE.Group(),
      right = new THREE.Group(),
      intron = new THREE.Group(),
      cap = new THREE.Group(),
      splice = new THREE.Group(),
      tail = new THREE.Group(),
      cleaver = new THREE.Group(),
      stub = new THREE.Group();
    group.add(left, right, intron, cap, splice, tail, cleaver, stub);
    left.name = "exon-1";
    right.name = "exon-2";
    intron.name = "intron";
    const sugarGeometry = new THREE.CylinderGeometry(0.073, 0.073, 0.045, 5);
    sugarGeometry.rotateX(Math.PI / 2);
    const baseGeometry = new THREE.CylinderGeometry(0.105, 0.105, 0.035, 6);
    baseGeometry.rotateX(Math.PI / 2);
    const baseMaterial = k.material("#d0c2a6"),
      phosphateMaterial = k.material("#ded8c5");
    function strand(parent, x0, x1, mat) {
      const pts = Array.from({ length: 65 }, (_, i) => {
        const t = i / 64;
        return [
          x0 + (x1 - x0) * t,
          0.1 * Math.sin(t * 10.8) * Math.sin(Math.PI * t),
          0.12 * Math.sin(t * 15.6) * Math.sin(Math.PI * t),
        ];
      });
      k.tube(pts, 0.043, mat, parent, 96);
      for (let i = 0; i <= 16; i++) {
        const q = pts[i * 4];
        k.mesh(sugarGeometry, mat, q, parent);
        const direction = i % 2 ? 1 : -1;
        k.segment(q, [q[0], q[1] + direction * 0.13, q[2]], 0.025, mat, parent);
        const base = k.mesh(
          baseGeometry,
          baseMaterial,
          [q[0], q[1] + direction * 0.2, q[2]],
          parent,
        );
        base.scale.set(0.75, 1, 1);
        k.ball([q[0] - 0.055, q[1], q[2]], 0.038, phosphateMaterial, parent);
      }
    }
    strand(left, -3.2, -1.1, teal);
    strand(right, 1.1, 3.2, blue);
    strand(stub, 3.2, 3.85, blue);
    const segs = [],
      beads = [],
      intronBases = [],
      n = 46,
      a = new THREE.Vector3(),
      z = new THREE.Vector3(),
      d = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < n; i++) {
      segs.push(k.segment([0, 0, 0], [0, 1, 0], 0.068, ochre, intron));
      segs[i].name = `intron-backbone-${i}`;
      beads.push(k.mesh(sugarGeometry, ochre, [0, 0, 0], intron));
      if (i % 2 === 0)
        intronBases.push({
          i,
          mesh: k.mesh(baseGeometry, baseMaterial, [0, 0, 0], intron),
        });
    }
    const pts = Array.from({ length: n + 1 }, () => new THREE.Vector3());
    // Cap base, ribose and three linked phosphates show the unusual end connection.
    k.mesh(baseGeometry, gold, [-0.18, 0.17, 0], cap);
    const purine = k.mesh(sugarGeometry, gold, [-0.06, 0.17, 0], cap);
    purine.scale.setScalar(1.2);
    k.mesh(sugarGeometry, teal, [-0.1, 0, 0], cap);
    k.segment([-0.1, 0, 0], [-0.1, 0.16, 0], 0.026, gold, cap);
    for (let i = 0; i < 3; i++) {
      k.ball([i * 0.1, 0, 0], 0.047, phosphateMaterial, cap);
      if (i < 2)
        k.segment([i * 0.1, 0, 0], [(i + 1) * 0.1, 0, 0], 0.021, gold, cap);
    }
    // Asymmetric snRNP scaffold leaves a forward-facing catalytic channel open.
    const domains = [
      [-0.66, 0.36, -0.28, 0.37, 0.58, 0.33],
      [-0.38, 1.05, -0.31, 0.46, 0.32, 0.3],
      [0.3, 1.19, -0.34, 0.5, 0.29, 0.33],
      [0.76, 0.78, -0.24, 0.36, 0.5, 0.3],
      [0.55, 0.05, -0.28, 0.4, 0.3, 0.31],
      [-0.16, -0.08, -0.32, 0.42, 0.24, 0.3],
      [-0.9, 0.98, -0.29, 0.24, 0.29, 0.22],
      [0.98, 0.26, -0.29, 0.22, 0.29, 0.24],
    ];
    for (let i = 0; i < domains.length; i++) {
      const d = domains[i];
      proteinDomain(
        k,
        splice,
        d.slice(0, 3),
        d.slice(3),
        i % 2 ? violet : pale,
        i,
      );
    }
    for (const x of [-0.63, 0.63]) {
      k.tube(
        [
          [x, 0.1, 0.09],
          [x * 0.65, 0.44, 0.12],
          [x * 0.68, 0.82, 0.1],
          [x, 0.98, 0.03],
          [x * 1.08, 0.62, 0.07],
          [x, 0.1, 0.09],
        ],
        0.028,
        gold,
        splice,
        64,
      );
      for (let i = 0; i < 4; i++)
        k.segment(
          [x * 0.73, 0.32 + i * 0.13, 0.1],
          [x * 0.99, 0.32 + i * 0.13, 0.08],
          0.017,
          baseMaterial,
          splice,
        );
    }
    helix(
      k,
      splice,
      [-0.78, 0.2, 0.05],
      [-0.8, 0.8, 0.07],
      0.063,
      5,
      violet,
      0.025,
    );
    helix(
      k,
      splice,
      [0.6, 0.6, 0.08],
      [0.28, 1.15, 0.03],
      0.059,
      5,
      pale,
      0.027,
    );
    proteinDomain(k, cleaver, [-0.15, 0, 0], [0.42, 0.3, 0.27], pale);
    proteinDomain(k, cleaver, [0.33, 0, 0], [0.3, 0.27, 0.24], violet);
    helix(
      k,
      cleaver,
      [-0.35, 0.14, 0.23],
      [-0.04, 0.16, 0.22],
      0.045,
      3,
      violet,
      0.023,
    );
    const tailPieces = [],
      tailNucleotides = [];
    for (let i = 0; i < 20; i++) {
      const x = i * 0.13;
      const nucleotide = new THREE.Group();
      tail.add(nucleotide);
      tailNucleotides.push(nucleotide);
      nucleotide.position.set(
        x,
        0.13 * Math.sin(i * 0.65),
        0.15 * (Math.cos(i * 0.65) - 1),
      );
      k.mesh(sugarGeometry, gold, [0, 0, 0], nucleotide);
      k.segment([0, 0, 0], [0, 0.14, 0], 0.022, gold, nucleotide);
      k.mesh(baseGeometry, baseMaterial, [0, 0.2, 0], nucleotide);

      tailPieces.push(
        k.segment(
          [x, 0.13 * Math.sin(i * 0.65), 0.15 * (Math.cos(i * 0.65) - 1)],
          [
            x + 0.13,
            0.13 * Math.sin((i + 1) * 0.65),
            0.15 * (Math.cos((i + 1) * 0.65) - 1),
          ],
          0.061,
          gold,
          tail,
        ),
      );
    }
    const labels = [
      k.label([-3.25, -0.58, 0], "5′ 帽", "5′ cap", 2),
      k.label([-2.1, -0.6, 0], "外显子 1", "Exon 1", 1),
      k.label([2.1, -0.6, 0], "外显子 2", "Exon 2", 1),
      k.label(
        [0, 2.15, 0],
        "剪接体：RNA + 蛋白质",
        "Spliceosome: RNA + proteins",
        2,
      ),
      k.label([0.1, -2, 0], "内含子套索", "Intron lariat", 1),
      k.label([2.1, -0.7, 0], "poly(A) 尾 · 3′", "Poly(A) tail · 3′", 2),
    ];
    function update(value) {
      const p = clamp(value),
        loop = ease(p, 0.43, 0.55),
        join = ease(p, 0.55, 0.65),
        // First bond swap at 0.55; second at 0.65. Product motion follows
        // each reaction, never breaking the still-intact intron–exon 2 bond.
        branchMove = ease(p, 0.55, 0.61),
        release = ease(p, 0.65, 0.79),
        cut = ease(p, 0.71, 0.78);
      right.position.x = -2.2 * join;
      cap.position.set(-3.45, 0.9 * (1 - ease(p, 0.12, 0.25)), 0);
      cap.visible = p >= 0.12;
      splice.visible = p >= 0.25 && p < 0.75;
      splice.scale.setScalar(0.72 + 0.28 * ease(p, 0.25, 0.38));
      splice.position.set(0, release * 0.6, release * -0.8);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x0 = -1.1 + 2.2 * t,
          y0 = 1.6 * Math.sin(Math.PI * t),
          z0 = 0.16 * Math.sin(2 * Math.PI * t);
        let lx, ly, lz;
        const branchIndex = 38,
          anchorX = -1.1 + 1.1 * branchMove,
          anchorY = 0.6 * branchMove;
        if (i <= branchIndex) {
          // The branch nucleotide is a real backbone vertex. Before branching,
          // the 5′ splice junction stays at exon 1 while the branch approaches it.
          const angle = (i / branchIndex) * 2 * Math.PI;
          lx = anchorX + 0.65 * Math.sin(angle);
          ly = anchorY + 0.58 * (1 - Math.cos(angle));
          lz = 0.1 * Math.sin(angle * 2);
        } else {
          const q = (i - branchIndex) / (n - branchIndex);
          // Until exon ligation, this endpoint is exactly exon 2's 5′ end.
          const exon2Start = 1.1 - 2.2 * join;
          lx = anchorX * (1 - q) + q * (exon2Start + release * 1.8);
          ly = anchorY * (1 - q) + q * release * 0.5;
          lz = 0;
        }
        pts[i].set(
          x0 + (lx - x0) * loop,
          y0 + (ly - y0) * loop - release * 2.6,
          z0 + (lz - z0) * loop,
        );
      }
      for (let i = 0; i < n; i++) {
        a.copy(pts[i]);
        z.copy(pts[i + 1]);
        d.copy(z).sub(a);
        segs[i].position.copy(a).add(z).multiplyScalar(0.5);
        segs[i].scale.set(0.068, Math.max(0.0001, d.length()), 0.068);
        segs[i].quaternion.setFromUnitVectors(up, d.normalize());
        beads[i].position.copy(a);
      }
      for (const item of intronBases) {
        item.mesh.position.copy(pts[item.i]);
        item.mesh.position.y += 0.15;
        item.mesh.rotation.z = Math.atan2(
          pts[item.i + 1].y - pts[item.i].y,
          pts[item.i + 1].x - pts[item.i].x,
        );
      }
      stub.position.set(-2.2 * join + cut * 0.8, -cut * 0.75, 0);
      stub.visible = p < 0.9;
      cleaver.position.set(1.1, 0.65 * (1 - cut), 0.35);
      cleaver.visible = p >= 0.68 && p < 0.89;
      tail.position.set(1, 0, 0);
      tailPieces.forEach((m, i) => {
        m.visible = p >= 0.77 && i < 20 * ease(p, 0.77, 0.92);
        tailNucleotides[i].visible = m.visible;
      });
      labels[0].active = p >= 0.2;
      labels[2].position[0] = 2.1 - 2.2 * join;
      labels[3].active = splice.visible;
      labels[4].active = release > 0.4;
      labels[5].active = p >= 0.82;
      group.userData = {
        rootId,
        compartment: "nucleus",
        rnaOrientation: "5prime-left-to-3prime-right",
        capAdded: p >= 0.25,
        spliceReaction:
          join === 1
            ? "exons-ligated"
            : loop === 1
              ? "lariat-intermediate"
              : "precursor",
        exonsJoined: join === 1,
        polyATail: p >= 0.92,
        translating: false,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      materials: molecularInventory(group),
      camera: { position: [0, 2.2, 10.8], target: [0, 0, 0] },
    };
  },
};
