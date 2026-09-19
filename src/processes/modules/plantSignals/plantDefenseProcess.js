import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import {
  helix,
  lrr,
  domain,
  instances,
  instanceWriter,
  flexibleLink,
} from "./structures.js";

export default {
  id: "plantDefense",
  title: b("植物防御：识别 flg22", "Plant defense: sensing flg22"),
  intro: b(
    "拟南芥细胞质膜上的模式触发免疫实例：细菌鞭毛蛋白片段 flg22 促进 FLS2 与 BAK1 组装，经 BIK1 调节 RBOHD，产生质外体活性氧。图中仅展开这一分支，钙信号等协同输入未全部画出。",
    "One Arabidopsis pattern-triggered immunity branch: bacterial flagellin peptide flg22 promotes FLS2–BAK1 assembly, with BIK1 regulating RBOHD and apoplastic reactive oxygen species production. Cooperating inputs, including calcium signaling, are not fully depicted.",
  ),
  duration: 32,
  controls: [
    {
      id: "ligand",
      label: b("外界信号", "External signal"),
      default: "flg22",
      options: [
        { value: "flg22", label: b("有 flg22", "flg22 present") },
        { value: "absent", label: b("无配体对照", "No-ligand control") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("受体跨越质膜", "Receptors span the membrane"),
      description: b(
        "FLS2 的长 LRR 胞外结构域朝向质外体，激酶域位于胞质。BAK1 是较小的共受体，BIK1 在膜的胞质侧工作。",
        "FLS2 exposes its long LRR ectodomain to the apoplast and its kinase domain to the cytosol. BAK1 is a smaller coreceptor; BIK1 works on the cytoplasmic face.",
      ),
    },
    {
      at: 0.16,
      title: b("识别鞭毛蛋白片段", "Recognizing a flagellin peptide"),
      description: b(
        "flg22 沿 FLS2 胞外 LRR 结构的内表面结合。这是识别特定微生物模式的例子，而不是把整个细菌吞入细胞。",
        "flg22 binds along the inner surface of the extracellular FLS2 LRR solenoid. This is recognition of a specific microbial pattern, not engulfment of a bacterium.",
      ),
    },
    {
      at: 0.34,
      title: b("招募共受体", "Coreceptor recruitment"),
      description: b(
        "BAK1 接触 FLS2–flg22 界面并形成受体复合物，膜内侧激酶域的相互作用支持磷酸化和信号启动。",
        "BAK1 contacts the FLS2–flg22 interface, assembling the receptor complex. Cytosolic kinase interactions support phosphorylation and signaling.",
      ),
    },
    {
      at: 0.51,
      title: b("BIK1 调节氧化酶", "BIK1 regulates the oxidase"),
      description: b(
        "受体相关胞质激酶 BIK1 被激活并磷酸化 RBOHD 的胞质调控区。图示突出直接调控关系，不表示 BIK1 是活性氧产生的唯一输入。",
        "Activated receptor-associated cytoplasmic kinase BIK1 phosphorylates the cytosolic regulatory region of RBOHD. This depicts direct regulation, not BIK1 as the sole input for ROS production.",
      ),
    },
    {
      at: 0.7,
      title: b("跨膜电子传递", "Transmembrane electron transfer"),
      description: b(
        "RBOHD 从胞质 NADPH 获取电子，经跨膜部分传至质外体氧分子，生成超氧阴离子。电子运动与配体进入细胞是两回事。",
        "RBOHD accepts electrons from cytosolic NADPH and transfers them through its membrane domain to apoplastic oxygen, generating superoxide. Electron transfer does not imply ligand entry into the cell.",
      ),
    },
    {
      at: 0.87,
      title: b("局部活性氧输出", "Local ROS output"),
      description: b(
        "超氧阴离子可进一步形成过氧化氢，参与防御信号。无配体对照不出现本模型中的诱导输出；基础活性及其他免疫分支被省略。",
        "Superoxide can give rise to hydrogen peroxide, contributing to defense signaling. The no-ligand control lacks this modeled induced output; basal activity and other immune branches are omitted.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Sun et al. (2013) Structural basis for flg22-induced activation of the Arabidopsis FLS2–BAK1 immune complex",
      url: "https://pubmed.ncbi.nlm.nih.gov/24114786/",
    },
    {
      title:
        "Li et al. (2014) FLS2-associated kinase BIK1 directly phosphorylates RbohD to control plant immunity",
      url: "https://pubmed.ncbi.nlm.nih.gov/24629339/",
    },
    {
      title:
        "Kadota et al. (2014) Direct regulation of RBOHD by the PRR-associated kinase BIK1",
      url: "https://pubmed.ncbi.nlm.nih.gov/24630626/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      teal = k.material("#769d94"),
      navy = k.material("#698395"),
      gold = k.material("#caa967"),
      rose = k.material("#be8e8e"),
      green = k.material("#8ba57d"),
      lipid = k.material("#c1c4b0"),
      tail = k.material("#ded7c1");
    // Dense paired leaflets share instance buffers. Exposed cut edges reveal two tails.
    const slots = [];
    for (let row = 0; row < 7; row++)
      for (let i = 0; i < 49; i++) {
        const x = -4.25 + i * 0.177 + (row % 2) * 0.07,
          z = (row - 3) * 0.18;
        if (
          (Math.abs(x + 2) < 0.2 && Math.abs(z) < 0.25) ||
          (Math.abs(x - 2.2) < 0.53 && Math.abs(z) < 0.5)
        )
          continue;
        slots.push([x, z]);
      }
    const write = instanceWriter();
    const lipidLayers = [];
    for (const sign of [-1, 1]) {
      const heads = instances(
        group,
        k.sphere,
        sign > 0 ? lipid : k.material("#aebaa7"),
        slots.length,
        `membrane-${sign}-phosphate-heads`,
      );
      const tails = instances(
        group,
        k.cylinder,
        tail,
        slots.length * 4,
        `membrane-${sign}-paired-kinked-tails`,
      );
      lipidLayers.push({ sign, heads, tails });
      slots.forEach(([x, z], i) => {
        write.bead(heads, i, [x, sign * 0.24, z], 0.07);
        for (let chain = 0; chain < 2; chain++) {
          const dx = (chain - 0.5) * 0.055,
            kink = chain ? 0.028 : 0,
            a = [x + dx, sign * 0.18, z],
            b = [x + dx + kink, sign * 0.095, z + 0.018],
            c = [x + dx + kink, sign * 0.016, z + 0.01];
          write.segment(tails, i * 4 + chain * 2, a, b, 0.018);
          write.segment(tails, i * 4 + chain * 2 + 1, b, c, 0.018);
        }
      });
      write.finish(heads);
      write.finish(tails);
    }
    // FLS2 presents a continuous concave LRR face to ligand and coreceptor.
    const fls = new THREE.Group();
    fls.name = "fls2";
    fls.position.x = -2;
    group.add(fls);
    helix(k, fls, [0, -0.37, 0], [0, 0.43, 0], 0.072, teal, 6);
    const ecto = new THREE.Group();
    ecto.position.set(-0.46, 1.57, 0);
    fls.add(ecto);
    lrr(k, ecto, {
      rx: 0.52,
      ry: 1.06,
      start: 1.72,
      end: 4.45,
      width: 0.23,
      depth: 0.4,
      repeats: 20,
      material: teal,
      accent: k.material("#a9c7b1"),
    });
    k.tube(
      [
        [0, 0.43, 0],
        [-0.18, 0.52, -0.03],
        [-0.61, 0.5, 0],
      ],
      0.065,
      teal,
      fls,
    );
    const flsKinase = new THREE.Group();
    flsKinase.name = "fls2-kinase";
    fls.add(flsKinase);
    const flsLink = flexibleLink(k, fls, "fls2-juxtamembrane", teal);
    domain(k, flsKinase, [-0.04, -0.6, -0.05], [0.69, 0.48, 0.7], navy, teal);
    domain(k, flsKinase, [0.07, -0.91, -0.05], [0.6, 0.5, 0.66], navy, teal);
    // Open ATP cleft between kinase lobes, with activation-loop cartoon.
    k.tube(
      [
        [-0.25, -0.76, 0.13],
        [-0.04, -0.7, 0.2],
        [0.18, -0.8, 0.17],
      ],
      0.026,
      gold,
      flsKinase,
    );
    const bak = new THREE.Group();
    bak.name = "bak1";
    group.add(bak);
    helix(k, bak, [0, -0.38, 0], [0, 0.49, 0], 0.07, green, 6);
    const bakEcto = new THREE.Group();
    bakEcto.position.set(0.16, 0.98, 0.02);
    bak.add(bakEcto);
    lrr(k, bakEcto, {
      rx: 0.17,
      ry: 0.38,
      start: -1.4,
      end: 1.44,
      width: 0.17,
      depth: 0.3,
      repeats: 5,
      material: green,
      accent: k.material("#becda4"),
    });
    k.tube(
      [
        [0, 0.48, 0],
        [0.2, 0.54, 0],
        [0.2, 0.61, 0],
      ],
      0.055,
      green,
      bak,
    );
    const bakKinase = new THREE.Group();
    bakKinase.name = "bak1-kinase";
    bak.add(bakKinase);
    const bakLink = flexibleLink(k, bak, "bak1-juxtamembrane", green);
    domain(k, bakKinase, [0, -0.62, -0.04], [0.58, 0.45, 0.6], green, teal);
    domain(k, bakKinase, [-0.08, -0.89, -0.04], [0.54, 0.4, 0.58], green, teal);
    const peptide = new THREE.Group();
    group.add(peptide);
    const ligandPoints = [];
    for (let i = 0; i < 12; i++) {
      const p = [
        Math.sin(i * 0.25) * 0.13,
        i * 0.071,
        Math.cos(i * 0.5) * 0.04,
      ];
      ligandPoints.push(p);
      k.ball(p, 0.043, gold, peptide);
    }
    k.tube(ligandPoints, 0.037, gold, peptide);
    const bik = new THREE.Group();
    bik.name = "bik1";
    group.add(bik);
    domain(
      k,
      bik,
      [-0.09, 0.07, -0.04],
      [0.57, 0.46, 0.6],
      rose,
      k.material("#d0a9ab"),
    );
    domain(
      k,
      bik,
      [0.12, -0.17, -0.04],
      [0.57, 0.44, 0.58],
      rose,
      k.material("#d0a9ab"),
    );
    k.tube(
      [
        [-0.24, -0.08, 0.12],
        [-0.08, -0.04, 0.18],
        [0.14, -0.09, 0.18],
      ],
      0.026,
      gold,
      bik,
    );
    const oxidase = new THREE.Group();
    oxidase.name = "rbohd";
    oxidase.position.x = 2.2;
    group.add(oxidase);
    // Six individually wound transmembrane helices, with alternating connected loops.
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        x = Math.cos(a) * 0.31,
        z = Math.sin(a) * 0.31;
      helix(
        k,
        oxidase,
        [x, -0.37, z],
        [x, 0.37, z],
        0.068,
        i % 2 ? navy : teal,
        6,
      );
      if (i < 5) {
        const y = i % 2 ? -0.37 : 0.37,
          sgn = i % 2 ? -1 : 1,
          n = ((i + 1) * Math.PI) / 3;
        k.tube(
          [
            [x, y, z],
            [
              (x + Math.cos(n) * 0.31) * 0.5,
              y + sgn * 0.16,
              (z + Math.sin(n) * 0.31) * 0.5,
            ],
            [Math.cos(n) * 0.31, y, Math.sin(n) * 0.31],
          ],
          0.035,
          navy,
          oxidase,
        );
      }
    }
    // Two membrane heme centers are shown as flat cofactor discs, not an ion pore.
    for (const y of [-0.13, 0.13]) {
      const heme = k.mesh(
        new THREE.CylinderGeometry(0.095, 0.095, 0.025, 20),
        rose,
        [0, y, 0.07],
        oxidase,
      );
      heme.rotation.x = Math.PI / 2;
      k.ball([0, y, 0.093], 0.025, gold, oxidase);
    }
    domain(k, oxidase, [0.14, -0.69, -0.02], [0.99, 0.62, 0.84], navy, teal); // FAD-binding domain
    domain(k, oxidase, [0.23, -1.11, -0.01], [0.91, 0.61, 0.83], navy, teal); // NADPH-binding domain
    // N-terminal regulatory region and paired helix-loop-helix calcium-binding motifs.
    k.tube(
      [
        [-0.24, -0.4, -0.02],
        [-0.5, -0.57, 0.02],
        [-0.47, -0.97, 0.02],
      ],
      0.052,
      teal,
      oxidase,
    );
    for (let i = 0; i < 2; i++) {
      const x = -0.54 + i * 0.2;
      helix(
        k,
        oxidase,
        [x, -0.6, 0.1],
        [x - 0.06, -0.88, 0.1],
        0.035,
        green,
        3,
      );
      k.tube(
        [
          [x - 0.06, -0.88, 0.1],
          [x + 0.035, -0.98, 0.1],
          [x + 0.12, -0.88, 0.1],
        ],
        0.025,
        green,
        oxidase,
      );
      helix(
        k,
        oxidase,
        [x + 0.12, -0.88, 0.1],
        [x + 0.12, -0.65, 0.1],
        0.035,
        green,
        3,
      );
    }
    k.ball([0.07, -0.62, 0.24], [0.075, 0.045, 0.025], gold, oxidase);
    const donor = new THREE.Group();
    group.add(donor);
    k.ball([0, 0, 0], [0.17, 0.09, 0.12], gold, donor);
    k.ball([0.2, 0, 0], [0.13, 0.1, 0.1], gold, donor);
    k.segment([0, 0, 0], [0.22, 0, 0], 0.035, gold, donor);
    const pmarks = Array.from({ length: 5 }, () =>
      k.ball([0, 0, 0], 0.072, gold),
    );
    const electrons = Array.from({ length: 5 }, () =>
      k.ball([0, 0, 0], 0.033, gold),
    );
    const ros = Array.from({ length: 12 }, () => {
      const g = new THREE.Group();
      group.add(g);
      k.ball([-0.055, 0, 0], 0.069, rose, g);
      k.ball([0.055, 0, 0], 0.069, rose, g);
      return g;
    });
    const labels = [
      k.label([-3.3, 2.8, 0], "质外体", "Apoplast", 2),
      k.label([-3.3, -2.1, 0], "胞质", "Cytosol", 2),
      k.label([-2.15, 2.93, 0], "FLS2", "FLS2", 2),
      k.label([-0.6, 1.55, 0], "BAK1", "BAK1", 2),
      k.label([-1.05, -1.65, 0.2], "BIK1", "BIK1", 2),
      k.label([2.2, -1.76, 0.1], "RBOHD", "RBOHD", 2),
      k.label([-1.5, 2.16, 0.3], "flg22", "flg22", 2),
      k.label([3.24, 1.75, 0], "质外体活性氧", "Apoplastic ROS", 2),
      k.label([3.3, -0.91, 0.1], "NADPH → NADP⁺", "NADPH → NADP⁺", 1),
      k.label([-0.05, 0.28, 0.7], "质膜", "Plasma membrane", 1),
    ];
    return {
      group,
      camera: { position: [0, 1.9, 12.5], target: [0, 0.25, 0] },
      labels,
      update(value, parameters = {}) {
        const p = clamp(value),
          on = (parameters.ligand ?? "flg22") === "flg22";
        const bind = on ? ease(p, 0.15, 0.32) : 0,
          join = on ? ease(p, 0.34, 0.48) : 0,
          signal = on ? ease(p, 0.54, 0.68) : 0,
          output = on ? ease(p, 0.7, 0.9) : 0;
        bak.position.x = 0.05 - join * 3.35;
        bak.position.z = Math.sin(join * Math.PI) * 0.35;
        flsKinase.position.x = -0.34 * join;
        bakKinase.position.x = 0.34 * join;
        flsLink.update([0, -0.37, 0], [flsKinase.position.x, -0.44, -0.05]);
        bakLink.update([0, -0.38, 0], [bakKinase.position.x, -0.45, -0.04]);
        // Refill every vacated BAK1 site; only its CURRENT footprint excludes lipids.
        for (const { sign, heads, tails } of lipidLayers) {
          slots.forEach(([x, z], i) => {
            const blocked =
              Math.hypot(x - bak.position.x, z - bak.position.z) < 0.2;
            write.bead(heads, i, [x, sign * 0.24, z], blocked ? 0 : 0.07);
            for (let chain = 0; chain < 2; chain++) {
              const dx = (chain - 0.5) * 0.055,
                kink = chain ? 0.028 : 0,
                a = [x + dx, sign * 0.18, z],
                b = [x + dx + kink, sign * 0.095, z + 0.018],
                c = [x + dx + kink, sign * 0.016, z + 0.01];
              write.segment(
                tails,
                i * 4 + chain * 2,
                a,
                b,
                blocked ? 0 : 0.018,
              );
              write.segment(
                tails,
                i * 4 + chain * 2 + 1,
                b,
                c,
                blocked ? 0 : 0.018,
              );
            }
          });
          write.finish(heads);
          write.finish(tails);
        }

        peptide.visible = on;
        peptide.position.set(-3.4 + bind * 0.53, 2.9 - bind * 1.84, 0.27);
        peptide.rotation.z = -0.65 * (1 - bind);
        const dockX = -1.93 - 0.34 * join;
        bik.position.set(
          dockX + (1.5 - dockX) * signal,
          -1.33 + 0.26 * signal,
          0.1 + 0.12 * signal,
        );
        donor.position.set(3.55 - output * 0.83, -1.07, 0);
        donor.visible = on;
        pmarks.forEach((m, i) => {
          m.visible =
            on && (i < 2 ? p >= 0.49 : i === 2 ? p >= 0.51 : signal === 1);
          m.name = `phosphorylation-${i}`;
          m.position.set(
            i === 0
              ? -2 + flsKinase.position.x
              : i === 1
                ? bak.position.x + bakKinase.position.x + 0.08
                : i === 2
                  ? bik.position.x + 0.15
                  : 1.74 + (i - 3) * 0.28,
            i === 2 ? bik.position.y + 0.1 : i < 3 ? -0.63 : -0.85,
            0.36,
          );
        });
        electrons.forEach((e, i) => {
          const t = (p * 2.6 + i / 5) % 1;
          e.visible = output > 0.03;
          e.position.set(
            2.2 + Math.sin(t * Math.PI) * 0.04,
            -0.7 + t * 1.24,
            0.12,
          );
        });
        ros.forEach((g, i) => {
          const t = clamp((p - 0.72 - i * 0.013) / 0.22);
          g.visible = on && t > 0;
          g.position.set(
            2.2 + Math.cos(i * 2.4) * t * (0.62 + i * 0.045),
            0.53 + t * (0.42 + i * 0.085),
            Math.sin(i * 2.4) * t * 0.4,
          );
          g.scale.setScalar(0.6 + t * 0.4);
        });
        labels[3].position[0] = bak.position.x;
        labels[4].position = [bik.position.x, bik.position.y - 0.47, 0.3];
        labels[6].active = on;
        labels[6].position = [
          peptide.position.x + 0.27,
          peptide.position.y + 0.9,
          0.4,
        ];
        labels[7].active = output > 0.05;
        labels[8].active = output > 0.01;
        group.userData = {
          process: "plantDefense",
          species: "Arabidopsis thaliana",
          condition: on ? "flg22" : "absent",
          ligandSide: "apoplast",
          kinaseSide: "cytosol",
          structuralDetail:
            "paired phospholipid leaflets; FLS2 and BAK1 LRR surfaces; bilobed kinases; six helical RBOHD membrane spans; cytosolic enzyme domains",
          rbohdTMHelices: 6,
          fls2LigandBound: bind > 0.95,
          bak1Recruited: join > 0.95,
          bik1RbohdPhosphorylation: signal === 1,
          apoplasticRos: output,
          electronDirection: "cytosolic NADPH to apoplastic oxygen",
          scope:
            "FLS2-BAK1-BIK1-RBOHD branch; calcium and other inputs omitted",
        };
      },
    };
  },
};
