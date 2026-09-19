import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { rod, chain, segmentWriter, instances } from "./bacterialGeometry.js";
const process = {
  id: "transformation",
  title: b("枯草芽孢杆菌的自然转化", "Natural transformation in B. subtilis"),
  intro: b(
    "选择处于自然感受态的枯草芽孢杆菌：环境双链 DNA 在细胞极被处理，一条链通过 ComEC 入胞，再由 RecA 促进同源重组。该革兰氏阳性细胞只有一层细胞膜；摄取并不保证整合。",
    "A naturally competent Bacillus subtilis cell processes environmental double-stranded DNA at a pole. One strand crosses ComEC, followed by RecA-mediated homologous recombination. This Gram-positive cell has one cytoplasmic membrane; uptake does not guarantee integration.",
  ),
  duration: 35,
  controls: [
    {
      id: "homology",
      label: b("输入 DNA 与染色体", "Incoming DNA versus chromosome"),
      default: "matched",
      options: [
        { value: "matched", label: b("有同源区", "Homologous sequence") },
        {
          value: "absent",
          label: b("无可配对的同源区", "No matching homology"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("感受态细胞与环境 DNA", "Competent cell and environmental DNA"),
      description: b(
        "镜头已选定感受态亚群中的一个细胞。左侧是游离的双链 DNA 片段，不需要另一活细胞与它接触。",
        "The scene selects a cell already in the competent subpopulation. Free double-stranded DNA is outside; no contacting live donor is required.",
      ),
    },
    {
      at: 0.16,
      title: b("细胞极捕获 DNA", "Polar DNA capture"),
      description: b(
        "极部感受态装置与 ComEA 参与捕获和结合 DNA。厚肽聚糖层外侧的片段被带至膜上的摄取装置。",
        "The polar competence machinery and ComEA participate in DNA capture and binding. The fragment outside the thick peptidoglycan layer reaches the membrane uptake apparatus.",
      ),
    },
    {
      at: 0.33,
      title: b("一条链通过 ComEC", "One strand crosses ComEC"),
      description: b(
        "一条 DNA 链通过 ComEC 进入细胞质，另一条链被降解。示意只突出这一次跨膜摄取，不把双链整体送入细胞。",
        "One DNA strand enters the cytoplasm through ComEC while the other is degraded. The model emphasizes single-strand uptake across the membrane.",
      ),
    },
    {
      at: 0.51,
      title: b("保护单链并装载 RecA", "Protecting ssDNA and loading RecA"),
      description: b(
        "单链结合蛋白保护输入 DNA，DprA 协助 RecA 装载。RecA 核蛋白丝参与搜索染色体上的同源序列。",
        "Single-strand binding proteins protect incoming DNA, and DprA helps load RecA. The RecA nucleoprotein filament searches the chromosome for homologous sequence.",
      ),
    },
    {
      at: 0.69,
      title: b("同源配对与链交换", "Homologous pairing and strand exchange"),
      description: b(
        "有同源区时，输入链先靠近染色体，再局部配对并推进 D-loop 链交换；原有链在接触区域被排开。无同源区的对照仍可摄取 DNA，但不能完成这里显示的同源整合。",
        "With homology, incoming DNA first approaches the chromosome, then local pairing advances a D-loop; the resident strand is displaced where contact has occurred. DNA without matching homology can enter but cannot complete this homologous integration pathway.",
      ),
    },
    {
      at: 0.9,
      title: b(
        "含输入序列的异源双链",
        "A heteroduplex containing donor sequence",
      ),
      description: b(
        "整合后的一段染色体含输入链与原有互补链，形成异源双链。这里止于重组；后续复制、错配处理与遗传分离未展开。",
        "A chromosome segment now contains the incoming strand paired with the resident complement, forming a heteroduplex. Subsequent replication, mismatch processing, and segregation are outside the scene.",
      ),
    },
  ],
  sources: [
    {
      title:
        "The Three-Layered DNA Uptake Machinery at the Cell Pole in Competent Bacillus subtilis Cells (publisher)",
      url: "https://journals.asm.org/doi/10.1128/jb.01128-10",
    },

    {
      title:
        "The Three-Layered DNA Uptake Machinery at the Cell Pole in Competent Bacillus subtilis Cells",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3067657/",
    },
    {
      title: "Bacillus subtilis DprA Recruits RecA onto Single-stranded DNA",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3829333/",
    },
    {
      title:
        "Chromosomal transformation in Bacillus subtilis is a non-polar recombination reaction",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4824099/",
    },
  ],
  legend: [
    { color: "#ae7d96", text: b("输入 DNA 链", "Incoming DNA strand") },
    { color: "#90a8b0", text: b("受体染色体", "Recipient chromosome") },
    {
      color: "#c2ac7e",
      text: b("细胞壁与降解产物", "Cell wall and degraded strand"),
    },
    {
      color: "#809b81",
      text: b("RecA 核蛋白丝", "RecA nucleoprotein filament"),
    },
    { color: "#9689a9", text: b("ComEA / ComEC", "ComEA / ComEC") },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      write = segmentWriter();
    const cell = new THREE.Group();
    cell.position.x = 0.72;
    group.add(cell);
    rod(k, cell, {
      radius: 1,
      length: 3.15,
      horizontal: true,
      wall: true,
      color: "#87a596",
    });
    const donor = k.material("#ae7d96"),
      other = k.material("#c2ac7e"),
      resident = k.material("#90a8b0"),
      resident2 = k.material("#b7c1bc"),
      recMat = k.material("#809b81"),
      comMat = k.material("#9689a9");
    const exterior = [chain(k, 54, donor, group), chain(k, 54, other, group)];
    const imported = chain(k, 35, donor, group);
    imported.forEach((mesh, i) => {
      mesh.name = `incoming-strand-${i}`;
    });
    const chr = [
      chain(k, 110, resident, group),
      chain(k, 110, resident2, group),
    ];
    chr.forEach((strand, side) =>
      strand.forEach((mesh, i) => {
        mesh.name = `resident-strand-${side}-${i}`;
      }),
    );
    const chrom = (t) => [
      0.88 + 1.37 * Math.cos(t),
      -0.27 + 0.57 * Math.sin(t),
      0.13 + 0.11 * Math.sin(t * 3),
    ];
    for (let s = 0; s < 2; s++)
      for (let i = 0; i < 110; i++) {
        const a = chrom((i / 110) * Math.PI * 2),
          z = chrom(((i + 1) / 110) * Math.PI * 2);
        a[2] += s * 0.105;
        z[2] += s * 0.105;
        write(chr[s][i], a, z, 0.035);
      }
    const comec = new THREE.Group();
    group.add(comec);
    comec.position.set(-1.87, 0, 0.2);
    for (const x of [-0.1, 0.1]) {
      const r = k.ring([x, 0, 0], 0.24, 0.085, comMat, comec);
      r.rotation.y = Math.PI / 2;
    }
    k.segment([-0.15, -0.28, 0], [0.15, -0.28, 0], 0.085, comMat, comec);
    // A sectioned transmembrane pore leaves an open ssDNA lumen.
    for (let j = 0; j < 10; j++) {
      const t = (j / 10) * Math.PI * 2;
      k.segment(
        [-0.19, 0.205 * Math.cos(t), 0.205 * Math.sin(t)],
        [0.19, 0.205 * Math.cos(t), 0.205 * Math.sin(t)],
        0.038,
        comMat,
        comec,
      );
    }
    for (let j = 0; j < 6; j++) {
      const t = (j / 6) * Math.PI * 2;
      k.ball(
        [0.26, 0.21 * Math.cos(t), 0.21 * Math.sin(t)],
        [0.09, 0.065, 0.065],
        k.material("#b5a6bd"),
        comec,
      );
    }
    const recFilament = instances(
      k,
      group,
      k.cylinder,
      k.material("#a4b69a"),
      104,
      "RecA-helical-filament-ridge",
    );
    const incomingBases = instances(
      k,
      group,
      k.sphere,
      k.material("#d0a4b7"),
      52,
      "incoming-ssDNA-nucleotides",
    );
    const externalBases = instances(
      k,
      group,
      k.cylinder,
      k.material("#cebbc1"),
      36,
      "environmental-DNA-basepairs",
    );
    const comea = new THREE.Group();
    comea.position.set(-2.12, 0.37, 0.16);
    group.add(comea);
    k.ball([0, 0, 0], [0.13, 0.15, 0.14], comMat, comea);
    k.ball([-0.15, 0.06, 0.04], [0.11, 0.17, 0.1], comMat, comea);
    k.tube(
      [
        [-0.19, -0.05, 0.08],
        [0, -0.12, 0.13],
        [0.1, -0.08, 0.07],
      ],
      0.029,
      k.material("#c1afcc"),
      comea,
      24,
    );
    comea.name = "ComEA-extracytoplasmic-domain";
    k.segment([0.08, 0, 0], [0.22, 0, 0], 0.034, comMat, comea).name =
      "ComEA-tether";
    const anchorPoints = Array.from({ length: 49 }, (_, i) => {
      const t = i / 48;
      return [
        0.2 + 0.31 * t,
        0.025 * Math.sin(t * Math.PI * 10),
        0.025 * Math.cos(t * Math.PI * 10),
      ];
    });
    k.tube(anchorPoints, 0.028, comMat, comea, 64).name =
      "ComEA-transmembrane-anchor";
    const dprA = k.ball(
      [-1.48, 0.37, 0.24],
      [0.15, 0.2, 0.14],
      k.material("#d3af76"),
    );
    const capture = chain(k, 12, comMat, group);
    const ssb = Array.from({ length: 10 }, () =>
      k.ball([0, 0, 0], [0.075, 0.12, 0.1], k.material("#bba57f")),
    );
    const recA = Array.from({ length: 27 }, () =>
      k.ball([0, 0, 0], [0.07, 0.125, 0.125], recMat),
    );
    const debris = Array.from({ length: 16 }, () =>
      k.ball([0, 0, 0], 0.035, other),
    );
    const labels = [
      k.label([0.5, 1.62, 0], "感受态枯草芽孢杆菌", "Competent B. subtilis", 9),
      k.label([-3.62, 0.87, 0], "环境双链 DNA", "Environmental dsDNA", 8),
      k.label([-2.18, -0.72, 0.3], "ComEC：单链入胞", "ComEC: ssDNA uptake", 9),
      k.label(
        [-2.97, -1.4, 0],
        "另一链在外侧降解",
        "Other strand degraded outside",
        7,
      ),
      k.label(
        [-0.9, 0.88, 0.4],
        "DprA / 单链结合蛋白",
        "DprA / ssDNA-binding proteins",
        8,
      ),
      k.label(
        [0.4, 0.95, 0.4],
        "RecA 与同源搜索",
        "RecA and homology search",
        9,
      ),
      k.label([1, -1.23, 0.3], "受体染色体", "Recipient chromosome", 8),
      k.label(
        [1.1, 0.8, 0.4],
        "输入链与原有互补链",
        "Incoming strand + resident complement",
        9,
      ),
      k.label(
        [2.9, 0.95, 0],
        "肽聚糖 / 单层细胞膜",
        "Peptidoglycan / cytoplasmic membrane",
        7,
      ),
    ];
    function update(raw, parameters = {}) {
      const p = clamp(raw),
        match = parameters.homology !== "absent",
        bind = ease(p, 0.1, 0.24),
        uptake = ease(p, 0.27, 0.57),
        docking = match ? ease(p, 0.66, 0.74) : 0,
        pair = match ? ease(p, 0.74, 0.87) : 0,
        integrated = match && p >= 0.9;
      const externalPoint = (t, s) => [
        -4.65 + 2.75 * t + 2.75 * uptake,
        0.1 + (1 - bind) * 0.32 + 0.115 * Math.sin(t * 17 + s * Math.PI),
        0.17 + 0.115 * Math.cos(t * 17 + s * Math.PI),
      ];
      for (let s = 0; s < 2; s++)
        for (let i = 0; i < 54; i++) {
          exterior[s][i].visible = i / 54 < 1 - uptake;
          write(
            exterior[s][i],
            externalPoint(i / 54, s),
            externalPoint((i + 1) / 54, s),
            0.034,
          );
        }
      for (let i = 0; i < 36; i++) {
        const t = i / 35;
        externalBases.line(
          i,
          externalPoint(t, 0),
          externalPoint(t, 1),
          t < 1 - uptake ? 0.021 : 0,
        );
      }
      externalBases.flush();
      // Incoming strand stays connected to the uptake pore until uptake finishes.
      const source = (t) => [
        -1.78 + 2.22 * t,
        0.06 + 0.49 * Math.sin(t * Math.PI * 0.75),
        0.27 + 0.05 * Math.sin(t * 8),
      ];
      const target = (t) => chrom(((44 - 35 * t) / 110) * Math.PI * 2);
      const incoming = (t) => {
        const a = source(t),
          z = target(t);
        // Dock alongside the duplex first. Contact then advances along the DNA.
        z[2] += pair >= 1 ? 0 : 0.18 * ease(t, pair, Math.min(1, pair + 0.1));
        return a.map((v, j) => v + (z[j] - v) * docking);
      };
      const loss = !match ? ease(p, 0.79, 0.99) : 0;
      for (let i = 0; i < imported.length; i++) {
        const a = incoming(i / imported.length),
          z = incoming((i + 1) / imported.length);
        a[1] += loss * ((i % 3) - 1) * 0.32;
        z[1] += loss * ((i % 3) - 1) * 0.32;
        imported[i].visible =
          i / imported.length < uptake && (match || i / imported.length > loss);
        write(imported[i], a, z, 0.038);
      }
      for (let i = 0; i < 52; i++) {
        const t = i / 52;
        incomingBases.point(
          i,
          incoming(t),
          t < uptake && (match || t > loss) ? 0.047 : 0,
        );
      }
      incomingBases.flush();
      recFilament.mesh.visible = p >= 0.49 && p < 0.89;
      for (let i = 0; i < 104; i++) {
        const point = (t) => {
            const q = incoming(t),
              angle = t * Math.PI * 30;
            return [
              q[0],
              q[1] + 0.13 * Math.cos(angle),
              q[2] + 0.13 * Math.sin(angle),
            ];
          },
          t = i / 104;
        recFilament.line(
          i,
          point(t),
          point((i + 1) / 104),
          t < uptake && t > loss ? 0.026 : 0,
        );
      }
      recFilament.flush();
      // Preserve the original chromosome until contact. Its displaced strand
      // remains connected at both D-loop junctions until the integration endpoint.
      const residentPoint = (index, side) => {
        const q = chrom((index / 110) * Math.PI * 2);
        q[2] += side * 0.105;
        const t = (44 - index) / 35;
        if (side === 0 && pair > 0 && t >= 0 && t <= pair)
          q[2] -= 0.35 * Math.sin((Math.PI * t) / pair);
        return q;
      };
      for (let side = 0; side < 2; side++)
        for (let i = 0; i < 110; i++) {
          chr[side][i].visible = !(
            side === 0 &&
            integrated &&
            i >= 9 &&
            i < 44
          );
          write(
            chr[side][i],
            residentPoint(i, side),
            residentPoint(i + 1, side),
            0.035,
          );
        }
      for (let i = 0; i < capture.length; i++) {
        const point = (t) => [
          -2.02 - 0.43 * t,
          0.07 + 0.035 * Math.sin(t * 15),
          0.15,
        ];
        capture[i].visible = p >= 0.12 && p < 0.45;
        write(capture[i], point(i / 12), point((i + 1) / 12), 0.022);
      }

      dprA.visible = p >= 0.34 && p < 0.7;
      for (let i = 0; i < ssb.length; i++) {
        const t = (i + 0.4) / ssb.length;
        ssb[i].visible = p >= 0.34 && p < 0.62 && t < uptake;
        const a = source(t);
        ssb[i].position.set(a[0], a[1], a[2] + 0.07);
      }
      for (let i = 0; i < recA.length; i++) {
        const t = (i + 0.5) / recA.length,
          a = incoming(t);
        recA[i].visible = p >= 0.49 && p < 0.89 && t < uptake && t > loss;
        recA[i].position.set(
          a[0],
          a[1] + 0.065 * Math.cos(i * 1.5),
          a[2] + 0.065 * Math.sin(i * 1.5),
        );
        recA[i].rotation.x = i * 1.5;
      }
      for (let i = 0; i < debris.length; i++) {
        const t = (i + 0.5) / debris.length;
        debris[i].visible = p > 0.3 && p < 0.71 && t < uptake;
        debris[i].position.set(
          -2.15 - t * 0.85,
          -0.17 - t * 0.65,
          0.3 + 0.17 * Math.sin(i * 1.9),
        );
      }
      labels[1].active = p < 0.58;
      labels[2].active = p >= 0.17 && p < 0.63;
      labels[3].active = p > 0.31 && p < 0.7;
      labels[4].active = p >= 0.34 && p < 0.58;
      labels[5].active = p >= 0.53 && p < 0.89;
      labels[7].active = p >= 0.89;
      labels[7].text = match
        ? b(
            "异源双链：输入链 + 原有互补链",
            "Heteroduplex: incoming + resident strand",
          )
        : b("无同源区：未发生整合", "No homology: no integration");
      group.userData = {
        process: "transformation",
        structuralDetail:
          "single bilayer and thick wall cutaway, ComEC pore helices, RecA helical nucleoprotein filament",
        organism: "Bacillus subtilis",
        competent: true,
        membraneCount: 1,
        outerMembrane: false,
        liveDonorRequired: false,
        uptakeStrands: 1,
        externalStrandDegraded: true,
        uptakeFraction: uptake,
        homology: match,
        recALoaded: p >= 0.51 && p < 0.89,
        homologousPairing: pair,
        integrated,
        finalState: integrated
          ? "heteroduplex"
          : p >= 0.9
            ? "no-integration"
            : "processing",
        replicationShown: false,
        progress: p,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [-0.2, 1.4, 11.2], target: [-0.5, 0, 0] },
    };
  },
};
export default process;
