import { duplex, pocketDomain } from "./refinedGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { hostCutaway, phage, chromosome } from "./geometry.js";
export default {
  id: "phageLysogenic",
  title: b("λ 噬菌体溶原与诱导", "Lambda lysogeny and induction"),
  duration: 38,
  intro: b(
    "以温和噬菌体 λ 和大肠杆菌为例，展示一条已经建立溶原状态的发育路线。λ 具有细长、非收缩性尾；它不是 T4。选择保持溶原或在一个子细胞中诱导裂解。DNA、粒子数和时间均为示意。",
    "A temperate phage lambda–Escherichia coli model following a lineage that establishes lysogeny. Lambda has a long noncontractile tail and is distinct from T4. Maintain lysogeny or induce lytic development in one daughter cell. DNA, particle numbers and timing are schematic.",
  ),
  controls: [
    {
      id: "fate",
      label: b("子细胞的后续条件", "Daughter-cell condition"),
      default: "induce",
      options: [
        {
          value: "induce",
          label: b("DNA 损伤：诱导裂解", "DNA damage: induction"),
        },
        {
          value: "maintain",
          label: b("无诱导：保持溶原", "No induction: maintain lysogeny"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("λ DNA 进入并环化", "Lambda DNA enters and circularizes"),
      description: b(
        "λ 的 DNA 进入大肠杆菌胞质，黏性末端配对后连接成环。外部粒子保留细长的非收缩性尾。",
        "Lambda DNA enters the E. coli cytoplasm; cohesive ends pair and are ligated into a circle. The extracellular particle has a long noncontractile tail.",
      ),
    },
    {
      at: 0.18,
      title: b("位点特异性整合", "Site-specific integration"),
      description: b(
        "在建立溶原的路线中，整合酶与宿主因子促成 attP 与 attB 重组，将 λ DNA 插入宿主染色体。紫色区段表示连续染色体中的前噬菌体。",
        "During lysogen establishment, integrase and host factors recombine attP with attB, inserting lambda DNA into the host chromosome. Purple marks the prophage within the continuous chromosome.",
      ),
    },
    {
      at: 0.35,
      title: b("CI 维持溶原状态", "CI maintains lysogeny"),
      description: b(
        "CI 阻遏蛋白抑制主要裂解启动子的转录。整合后的前噬菌体随宿主染色体复制；此时不会持续装配新的噬菌体。",
        "CI repressor suppresses the major lytic promoters. The integrated prophage is copied with the host chromosome; new phage particles are not continually assembled.",
      ),
    },
    {
      at: 0.49,
      title: b("随细胞分裂传递", "Inheritance through cell division"),
      description: b(
        "复制后的两份染色体分别传递给子细胞；两者均携带前噬菌体。图中把染色体摊开以显示整合区段。",
        "Replicated chromosomes segregate into daughter cells, each carrying the prophage. Chromosomes are spread out schematically to expose the integrated segment.",
      ),
    },
    {
      at: 0.67,
      title: b("保持溶原或解除抑制", "Maintenance or relief of repression"),
      description: b(
        "选择无诱导时，两细胞保持溶原。选择 DNA 损伤时，左侧子细胞中的活化 RecA 促进 CI 自切割，解除裂解基因的抑制。",
        "Without induction, both cells remain lysogens. With DNA damage, activated RecA in the left daughter promotes CI self-cleavage, relieving repression of lytic genes.",
      ),
    },
    {
      at: 0.78,
      title: b("切除与裂解发育", "Excision and lytic development"),
      description: b(
        "在诱导分支中，整合酶、切除酶和宿主因子促成前噬菌体切除。游离的 λ DNA 扩增，随后包装进新头部并连接非收缩性尾。",
        "In the induced branch, integrase, excisionase and host factors promote prophage excision. Free lambda DNA amplifies, is packaged into new heads and joins noncontractile tails.",
      ),
    },
    {
      at: 0.92,
      title: b("两种条件的结局", "Condition-dependent outcome"),
      description: b(
        "诱导时左侧宿主裂解并释放 λ 子代，右侧未诱导谱系保持溶原；无诱导时两细胞均保留前噬菌体。画面不表示条件决定的精确概率。",
        "With induction, the left host lyses and releases lambda progeny while the uninduced right lineage stays lysogenic. Without induction, both retain their prophages. The scene does not imply exact condition-dependent probabilities.",
      ),
    },
  ],
  sources: [
    {
      title: "NCBI Bookshelf: DNA Rearrangements",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9937/",
    },
    {
      title: "Bacteriophage lambda: early pioneer and still relevant",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4424060/",
    },
    {
      title: "Bacteriophage lambda site-specific recombination",
      url: "https://pubmed.ncbi.nlm.nih.gov/38372210/",
    },
  ],
  create({ rootId = "phage" } = {}) {
    const k = sceneKit(),
      { group } = k,
      host0 = hostCutaway(k, group),
      host1 = hostCutaway(k, group);
    const chr0 = chromosome(k, group, k.material("#899e9b")),
      chr1 = chromosome(k, group, k.material("#899e9b"));
    host0.group.name = "lambda-left-host";
    host1.group.name = "lambda-right-host";
    [chr0, chr1].forEach((chr, i) => {
      chr.group.name = `lambda-chromosome-${i}`;
      chr.inserted.name = `lambda-integrated-prophage-${i}`;
    });
    const lambda = phage(k, group, { lambda: true, scale: 0.76 });
    lambda.group.position.set(-0.35, 2.4, 0.15);
    const dnaCircle = (position, radius, thickness, material) => {
      const points = Array.from({ length: 65 }, (_, i) => {
        const a = (i * Math.PI * 2) / 64;
        return [radius * Math.cos(a), radius * Math.sin(a), 0];
      });
      const d = duplex(k, group, points, {
        radius: thickness * 0.5,
        rail: thickness * 0.32,
        turns: 18,
        samples: 180,
        pairs: 60,
        colors: [material.color.getStyle(), "#c4a8c4"],
      });
      d.group.position.set(...position);
      return d.group;
    };
    const freeDNA = dnaCircle(
      [0, 1.1, 0.18],
      0.34,
      0.043,
      k.material("#ad82a9"),
    );
    const linearDNA = duplex(
      k,
      group,
      [
        [-0.3, 1.6, 0.12],
        [-0.22, 1.1, 0.12],
        [-0.45, 0.85, 0.13],
        [0, 0.8, 0.13],
        [0.35, 0.94, 0.13],
      ],
      {
        radius: 0.024,
        rail: 0.013,
        turns: 15,
        samples: 140,
        pairs: 55,
        colors: ["#ad82a9", "#c1a5c2"],
        name: "lambda-incoming-dsDNA",
      },
    ).group;
    const attP = k.ball([0, 1.43, 0.22], 0.075, k.material("#bd9a5f"));
    const attB = k.ball([0, 0.61, 0.17], 0.075, k.material("#bd9a5f"));
    const integrase = k.ring(
      [0, 0.87, 0.25],
      0.21,
      0.06,
      k.material("#bba879"),
    );
    const repressors = [0, 1].map((index) => {
      const g = new THREE.Group();
      group.add(g);
      k.ball([-0.11, 0, 0], [0.105, 0.13, 0.1], k.material("#899eb1"), g);
      k.ball([0.11, 0, 0], [0.105, 0.13, 0.1], k.material("#899eb1"), g);
      for (const sign of [-1, 1]) {
        pocketDomain(
          k,
          g,
          [sign * 0.115, 0.1, -0.025],
          [0.17, 0.16, 0.13],
          ["#849aac", "#aebcc8"],
        );
        k.segment(
          [sign * 0.11, 0, 0],
          [sign * 0.07, -0.14, 0.05],
          0.027,
          k.material("#91a7b7"),
          g,
        );
      }
      g.name = `lambda-CI-${index}`;
      return g;
    });
    const damage = new THREE.Group();
    group.add(damage);
    k.tube(
      [
        [-2.65, 1.96, 0.2],
        [-2.3, 1.65, 0.2],
        [-2.52, 1.52, 0.2],
        [-2.16, 1.23, 0.2],
      ],
      0.04,
      k.material("#c49b70"),
      damage,
      16,
    );
    const recA = k.tube(
      [
        [-2.48, -0.42, 0.24],
        [-2.22, -0.33, 0.24],
        [-1.96, -0.38, 0.24],
        [-1.68, -0.3, 0.24],
      ],
      0.07,
      k.material("#bbab8c"),
      damage,
      24,
    );
    const excised = dnaCircle(
      [-1.7, 0.64, 0.2],
      0.3,
      0.042,
      k.material("#ad82a9"),
    );
    excised.name = "lambda-excised-prophage";
    excised.scale.x = 0.8;
    const replicas = Array.from({ length: 3 }, (_, i) => {
      const r = dnaCircle(
        [-2.15 + i * 0.43, 0.18, 0.3],
        0.18,
        0.026,
        k.material("#ad82a9"),
      );
      r.scale.x = 0.75;
      return r;
    });
    const sites = [
      [-2.34, 0.45],
      [-1.64, 0.32],
      [-1.03, 0.43],
      [-2.02, -0.36],
      [-1.25, -0.35],
    ];
    const offspring = sites.map(([x, y], index) => {
      const v = phage(k, group, { lambda: true, scale: 0.29 });
      v.group.name = `lambda-progeny-${index}`;
      v.group.position.set(x, y, 0.4);
      return v;
    });
    const septum = k.ring([0, 0, 0.02], 1.35, 0.035, k.material("#85a89e"));
    septum.rotation.y = Math.PI / 2;
    const labels = [
      k.label(
        [-2.5, 1.68, 0],
        "大肠杆菌：包膜剖面",
        "E. coli envelope cutaway",
        2,
      ),
      k.label(
        [0.2, 3.06, 0.1],
        "λ：非收缩性尾",
        "Lambda: noncontractile tail",
        2,
      ),
      k.label([0.75, 1.1, 0.2], "attP × attB", "attP × attB", 2),
      k.label(
        [0, 1.55, 0.2],
        "紫色：整合的前噬菌体",
        "Purple: integrated prophage",
        2,
      ),
      k.label(
        [0, -1.75, 0.2],
        "CI 抑制裂解基因",
        "CI represses lytic genes",
        2,
      ),
      k.label(
        [1.85, 1.72, 0.2],
        "未诱导的溶原子细胞",
        "Uninduced lysogenic daughter",
        2,
      ),
      k.label(
        [-1.8, 1.94, 0.3],
        "诱导：CI 失活",
        "Induction: CI inactivation",
        2,
      ),
      k.label(
        [-2.15, -1.76, 0.2],
        "切除 → 扩增 → 释放",
        "Excision → amplification → release",
        2,
      ),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        induce = parameters.fate !== "maintain",
        integration = ease(p, 0.18, 0.32),
        division = ease(p, 0.49, 0.65),
        loss = induce ? ease(p, 0.68, 0.76) : 0,
        excision = induce ? ease(p, 0.78, 0.83) : 0,
        release = induce ? ease(p, 0.92, 1) : 0;
      host0.group.position.x = -1.7 * division;
      host0.group.scale.set(1 - 0.49 * division, 1, 1);
      host1.group.visible = p >= 0.51;
      host1.group.position.x = 1.7 * division;
      host1.group.scale.set(
        0.51,
        0.55 + 0.45 * division,
        0.55 + 0.45 * division,
      );
      host0.rupture(release);
      host1.rupture(0);
      [chr0, chr1].forEach((chr, i) => {
        chr.group.position.x = (i === 0 ? -1 : 1) * 1.7 * division;
        chr.group.scale.set(1 - 0.48 * division, 1, 1);
        chr.group.visible = i === 0 ? !induce || p < 0.97 : p >= 0.5;
        chr.inserted.visible = p >= 0.29 && (i === 1 || excision < 0.5);
        chr.normal.visible = !chr.inserted.visible;
      });
      // Both inherited chromosomes include the integrated prophage before induction.
      chr1.group.scale.y = 0.25 + 0.75 * ease(p, 0.5, 0.6);
      lambda.group.visible = p < 0.24;
      lambda.genome.visible = p < 0.07;
      lambda.genome.scale.setScalar(Math.max(0.01, 1 - ease(p, 0, 0.12)));
      linearDNA.visible = p > 0.025 && p < 0.135;
      freeDNA.visible = p > 0.1 && p < 0.3;
      freeDNA.position.y = 1.12 - 0.21 * integration;
      freeDNA.scale.set(1 + integration * 0.5, 1 - integration * 0.45, 1);
      attP.visible = p >= 0.15 && p < 0.32;
      attP.position.y = 1.43 - 0.45 * integration;
      attB.visible = attP.visible;
      integrase.visible = p >= 0.18 && p < 0.33;
      repressors.forEach((r, i) => {
        r.visible = p > 0.33 && (i === 0 ? loss < 1 : p >= 0.5);
        r.position.set(
          (i === 0 ? -1 : 1) * 1.7 * division,
          1.09 + (i === 0 ? loss * 0.22 : 0),
          0.27,
        );
        r.scale.setScalar(i === 0 ? Math.max(0.01, 1 - loss) : 1);
      });
      damage.visible = induce && p >= 0.67 && p < 0.8;
      recA.scale.x = 0.4 + 0.6 * ease(p, 0.67, 0.73);
      excised.visible = induce && p >= 0.795 && p < 0.89;
      excised.position.y = 0.83 - 0.53 * excision;
      replicas.forEach((r, i) => {
        r.visible = induce && p >= 0.83 + i * 0.008 && p < 0.92;
        r.scale.y = Math.max(0.01, ease(p, 0.83, 0.865));
      });
      offspring.forEach((v, i) => {
        const [x, y] = sites[i],
          a = (2 * Math.PI * i) / sites.length;
        v.group.visible = induce && p >= 0.86 + i * 0.005;
        v.head.scale.setScalar(Math.max(0.03, ease(p, 0.855, 0.889)));
        v.tail.visible = p >= 0.895;
        v.tail.position.x = 0.26 * (1 - ease(p, 0.89, 0.92));
        v.genome.visible = p >= 0.88;
        v.group.position.set(
          x + (-1.7 + 2.45 * Math.cos(a) - x) * release,
          y + (2 * Math.sin(a) - y) * release,
          0.4 + release * 0.2,
        );
        v.group.rotation.z = release * (i % 2 ? -0.5 : 0.5);
      });
      septum.visible = p > 0.49 && p < 0.65;
      septum.scale.setScalar(Math.max(0.02, 1 - division));
      labels[0].active = p < 0.5;
      labels[1].active = p < 0.2;
      labels[2].active = p >= 0.16 && p < 0.34;
      labels[3].active = p >= 0.3 && p < 0.66;
      labels[4].active = p >= 0.35 && (!induce || p < 0.7);
      labels[5].active = p >= 0.65;
      labels[6].active = induce && p >= 0.67 && p < 0.8;
      labels[7].active = induce && p >= 0.78;
      group.userData = {
        rootId,
        host: "Escherichia coli",
        phage: "lambda",
        tail: "noncontractile",
        condition: induce ? "DNA-damage-in-left-daughter" : "no-induction",
        initialFate: "lysogeny",
        integrationProgress: integration,
        divisionProgress: division,
        CIInactivationProgress: loss,
        excisionProgress: excision,
        integrationComplete: p >= 0.32,
        prophageInherited: p >= 0.65,
        lysogenicDaughters: p < 0.65 ? 0 : induce && p >= 0.83 ? 1 : 2,
        CIRepression: loss < 1,
        excisionComplete: excision === 1,
        lyticDevelopment: induce && p >= 0.83,
        progenyReleased: release === 1,
        envelopeIntegrityLeft: 1 - release,
        envelopeIntegrityRight: 1,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 1.4, 12.2], target: [0, 0.3, 0] },
    };
  },
};
