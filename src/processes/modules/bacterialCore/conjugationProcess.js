import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { rod, chain, segmentWriter, instances } from "./bacterialGeometry.js";
const process = {
  id: "conjugation",
  title: b("F 质粒接合转移", "F-plasmid conjugation"),
  intro: b(
    "以携带游离 F 质粒的大肠杆菌供体和不携带 F 质粒的受体为例。先建立接触，再单向转移一条 DNA 链；双方补链后各保留一个双链 F 质粒。此处不是 Hfr 染色体转移。",
    "An E. coli donor with an autonomous F plasmid contacts an F-negative recipient. A single DNA strand transfers in one direction, and complementary synthesis leaves both cells with double-stranded F plasmids. Hfr chromosome transfer is not depicted.",
  ),
  duration: 34,
  controls: [
    {
      id: "oriT",
      label: b("转移起点切口", "Nicking at oriT"),
      default: "intact",
      options: [
        { value: "intact", label: b("TraI 可切开 oriT", "TraI can nick oriT") },
        { value: "blocked", label: b("oriT 切口受阻", "oriT nicking blocked") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("供体与受体", "Donor and recipient"),
      description: b(
        "左侧供体含独立的双链 F 质粒，右侧受体起初没有该质粒；两者均保有自己的染色体。",
        "The donor contains a separate double-stranded F plasmid; the recipient initially lacks it. Each cell retains its own chromosome.",
      ),
    },
    {
      at: 0.16,
      title: b("菌毛捕获受体", "Pilus-mediated contact"),
      description: b(
        "接合菌毛伸展、接触受体并回缩，使细胞靠近。细长菌毛与随后的稳定细胞接触区分开表示。",
        "A conjugative pilus extends, contacts the recipient, and retracts to bring cells together. This slender pilus is distinct from the later stable contact junction.",
      ),
    },
    {
      at: 0.34,
      title: b("稳定接触并准备 DNA", "Stable contact and DNA processing"),
      description: b(
        "TraN 等组分稳定配对，TraI 在 oriT 切开一条链。图中接触区的转移装置被放大；切口受阻时下游转移停止。",
        "Components including TraN stabilize the pair. TraI nicks one strand at oriT. The transfer apparatus is enlarged; blocked nicking prevents downstream transfer.",
      ),
    },
    {
      at: 0.49,
      title: b("单链单向进入受体", "Unidirectional single-strand transfer"),
      description: b(
        "与 TraI 相连的 T 链 5′ 端先进入受体，经接触区转移。供体中留下的模板链指导替代链合成。",
        "The TraI-linked 5′ end of the T strand enters the recipient first through the contact junction. The retained donor strand templates replacement synthesis.",
      ),
    },
    {
      at: 0.8,
      title: b(
        "受体闭环并合成互补链",
        "Recipient circularization and synthesis",
      ),
      description: b(
        "完整的转移链在受体中闭环，互补链合成把单链质粒变为双链；双方的合成时间可重叠。",
        "The fully transferred strand circularizes in the recipient. Complementary synthesis converts it to double-stranded DNA; synthesis in the two cells can overlap.",
      ),
    },
    {
      at: 0.91,
      title: b("供体保留，受体获得", "Donor retains; recipient acquires"),
      description: b(
        "转移及补链成功后，双方均有完整 F 质粒。受体建立质粒基因表达后可获得供体能力；本镜头省略该表达延迟。",
        "After successful transfer and synthesis, both cells carry complete F plasmids. Recipient donor capability requires plasmid gene expression, whose delay is omitted here.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Real-time visualisation of the intracellular dynamics of conjugative plasmid transfer",
      url: "https://www.nature.com/articles/s41467-023-35978-3",
    },

    {
      title: "Plasmid Transfer by Conjugation in Gram-Negative Bacteria",
      url: "https://pubmed.ncbi.nlm.nih.gov/33105635/",
    },
    {
      title:
        "Plasmids pick a bacterial partner before committing to conjugation",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10516633/",
    },
  ],
  legend: [
    { color: "#6d9399", text: b("保留的 DNA 模板链", "Retained DNA template") },
    { color: "#b17c94", text: b("转移的 T 链", "Transferred T strand") },
    { color: "#c5a46e", text: b("新合成互补链", "New complementary strand") },
    {
      color: "#9d91ac",
      text: b("菌毛与转移复合物", "Pilus and transfer complex"),
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      write = segmentWriter();
    const dna = k.material("#6d9399"),
      tMat = k.material("#b17c94"),
      newMat = k.material("#c5a46e"),
      protein = k.material("#9d91ac");
    const cells = [new THREE.Group(), new THREE.Group()];
    cells.forEach((c, i) => {
      group.add(c);
      rod(k, c, { color: i ? "#90aab1" : "#88a58e", radius: 0.84, length: 2 });
    });
    for (const cell of cells) {
      const points = Array.from({ length: 160 }, (_, i) => {
        const a = (i / 159) * Math.PI * 2;
        return [
          (0.4 + 0.06 * Math.cos(a * 17)) * Math.cos(a),
          0.63 + (0.37 + 0.06 * Math.cos(a * 17)) * Math.sin(a),
          0.09 * Math.sin(a * 17),
        ];
      });
      k.tube(points, 0.027, k.material("#a5aaa0"), cell, 230);
    }
    const donorBase = chain(k, 72, dna, cells[0]),
      donorNew = chain(k, 72, newMat, cells[0]);
    const recipientNew = chain(k, 72, newMat, cells[1]);
    const circle = (t, strand = 0) => [
      0.49 * Math.cos(t),
      -0.65 + 0.49 * Math.sin(t),
      0.26 + strand * 0.09,
    ];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2,
        z = ((i + 1) / 72) * Math.PI * 2;
      write(donorBase[i], circle(a), circle(z), 0.032);
      write(donorNew[i], circle(a, 1), circle(z, 1), 0.032);
      write(
        recipientNew[i],
        circle(a + Math.PI, 1),
        circle(z + Math.PI, 1),
        0.032,
      );
    }
    const pilus = chain(k, 30, protein, group),
      transfer = chain(k, 240, tMat, group);
    transfer.forEach((mesh, i) => {
      mesh.name = `T-strand-${i}`;
    });
    donorNew.forEach((mesh, i) => {
      mesh.name = `donor-replacement-${i}`;
    });
    recipientNew.forEach((mesh, i) => {
      mesh.name = `recipient-complement-${i}`;
    });
    const junction = new THREE.Group();
    group.add(junction);
    for (const x of [-0.2, 0.2]) {
      const ring = k.ring([x, -0.55, 0.12], 0.23, 0.09, protein, junction);
      ring.rotation.y = Math.PI / 2;
    }
    const gate = k.segment(
      [-0.23, -0.55, 0.12],
      [0.23, -0.55, 0.12],
      0.16,
      k.material("#b4a9bd", { transparent: true, opacity: 0.38 }),
      junction,
    );
    const t4Subunits = instances(
      k,
      junction,
      k.sphere,
      k.material("#b0a2bf"),
      48,
      "T4SS-envelope-spanning-subunits",
    );
    for (let ring = 0; ring < 4; ring++)
      for (let j = 0; j < 12; j++) {
        const t = (j / 12) * Math.PI * 2;
        t4Subunits.point(
          ring * 12 + j,
          [
            -0.36 + ring * 0.16,
            -0.55 + 0.23 * Math.cos(t),
            0.12 + 0.23 * Math.sin(t),
          ],
          [0.055, 0.055, 0.055],
        );
      }
    t4Subunits.flush();
    for (let j = 0; j < 6; j++) {
      const t = (j / 6) * Math.PI * 2;
      k.ball(
        [-0.46, -0.55 + 0.16 * Math.cos(t), 0.12 + 0.16 * Math.sin(t)],
        [0.09, 0.065, 0.065],
        newMat,
        junction,
      );
    }
    const pilins = instances(
      k,
      group,
      k.sphere,
      k.material("#b1a4bf"),
      110,
      "helical-pilin-repeat",
    );
    const plasmidPairs = [
      instances(
        k,
        cells[0],
        k.cylinder,
        k.material("#b4bfaf"),
        72,
        "donor-plasmid-basepairs",
      ),
      instances(
        k,
        cells[1],
        k.cylinder,
        k.material("#c9bfa0"),
        72,
        "recipient-plasmid-basepairs",
      ),
    ];
    const relaxase = k.ball(
      [0, 0, 0],
      [0.12, 0.14, 0.11],
      k.material("#bc927a"),
    );
    relaxase.name = "TraI-leading-5prime";
    const nick = k.ball([0.49, -0.65, 0.38], 0.08, newMat, cells[0]);
    const labels = [
      k.label([-2.5, 2.18, 0], "F⁺ 供体", "F⁺ donor", 9),
      k.label([2.5, 2.18, 0], "F⁻ 受体", "F⁻ recipient", 9),
      k.label(
        [0, 0.3, 0],
        "接合菌毛：建立接触",
        "Conjugative pilus: contact",
        8,
      ),
      k.label(
        [0, -1.55, 0.2],
        "稳定接触区 / 转移装置",
        "Stable junction / transfer apparatus",
        9,
      ),
      k.label([-2.5, -1.72, 0], "oriT · TraI", "oriT · TraI", 8),
      k.label(
        [0.3, 0.18, 0.5],
        "T 链：5′ 端先进入",
        "T strand: 5′ end first",
        9,
      ),
      k.label(
        [-1.8, -2.22, 0],
        "供体替代链合成",
        "Donor replacement synthesis",
        8,
      ),
      k.label(
        [1.8, -2.22, 0],
        "受体互补链合成",
        "Recipient complementary synthesis",
        8,
      ),
    ];
    function update(raw, parameters = {}) {
      const p = clamp(raw),
        blocked = parameters.oriT === "blocked",
        close = ease(p, 0.18, 0.35),
        separate = blocked ? 0 : ease(p, 0.92, 1);
      const cx = 2.5 - 1.43 * close + 0.7 * separate;
      cells[0].position.x = -cx;
      cells[1].position.x = cx;
      // One ordered material path, from leading 5′ (s=0) to trailing 3′ (s=1).
      // A finite fraction occupies the magnified conduit; it cannot also occupy either circle.
      const bridgeFraction = 0.18,
        advance = blocked ? 0 : (1 + bridgeFraction) * ease(p, 0.36, 0.8),
        tf = clamp(advance),
        arrived = clamp(advance - bridgeFraction),
        recipientSynthesis = blocked
          ? 0
          : Math.min(arrived, ease(p, 0.75, 0.94));
      for (let i = 0; i < 72; i++) {
        const a = (1 - tf + (tf * i) / 72) * Math.PI * 2,
          z = (1 - tf + (tf * (i + 1)) / 72) * Math.PI * 2;
        donorNew[i].visible = tf > 0;
        write(donorNew[i], circle(a, 1), circle(z, 1), 0.032);
        recipientNew[i].visible = recipientSynthesis > 0;
        write(
          recipientNew[i],
          circle(Math.PI + ((recipientSynthesis * i) / 72) * Math.PI * 2, 1),
          circle(
            Math.PI + ((recipientSynthesis * (i + 1)) / 72) * Math.PI * 2,
            1,
          ),
          0.032,
        );
      }
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < 72; i++) {
          const t = (i / 72) * Math.PI * 2 + (side ? Math.PI : 0);
          plasmidPairs[side].line(
            i,
            circle(t),
            circle(t, 1),
            side && i / 72 >= recipientSynthesis ? 0 : 0.014,
          );
        }
        plasmidPairs[side].flush();
      }
      const pilusReach = ease(p, 0.03, 0.18);
      for (let i = 0; i < 30; i++) {
        const point = (t) => [
          -cx + 0.84 + t * (2 * cx - 1.68) * pilusReach,
          -0.1 + 0.22 * Math.sin(t * Math.PI) * (1 - close),
          0.12,
        ];
        pilus[i].visible = p < 0.37;
        write(pilus[i], point(i / 30), point((i + 1) / 30), 0.036);
      }
      pilins.mesh.visible = p < 0.37;
      for (let i = 0; i < 110; i++) {
        const t = i / 109,
          angle = t * Math.PI * 32;
        pilins.point(
          i,
          [
            -cx + 0.84 + t * (2 * cx - 1.68) * pilusReach,
            -0.1 +
              0.22 * Math.sin(t * Math.PI) * (1 - close) +
              0.038 * Math.cos(angle),
            0.12 + 0.038 * Math.sin(angle),
          ],
          [0.025, 0.027, 0.027],
        );
      }
      pilins.flush();
      junction.visible = p >= 0.33 && p < 0.95;
      junction.scale.x = 1 + (1 - close) * 2;
      gate.visible = true;
      const donorExit = [-cx + 0.49, -0.65, 0.35],
        recipientEntry = [cx - 0.49, -0.65, 0.26];
      const route = (t) => {
        // The shared middle point is in the visible transfer pore.
        const a = t < 0.5 ? donorExit : [0, -0.55, 0.12],
          z = t < 0.5 ? [0, -0.55, 0.12] : recipientEntry,
          f = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        return a.map((v, j) => v + (z[j] - v) * f);
      };
      const strandPoint = (s) => {
        const q = advance - s;
        if (q <= 0) {
          const v = circle(-q * Math.PI * 2, 1);
          v[0] -= cx;
          return v;
        }
        if (q < bridgeFraction) return route(q / bridgeFraction);
        const v = circle(Math.PI + (q - bridgeFraction) * Math.PI * 2);
        v[0] += cx;
        return v;
      };
      for (let i = 0; i < transfer.length; i++) {
        transfer[i].visible = true;
        write(
          transfer[i],
          strandPoint(i / transfer.length),
          strandPoint((i + 1) / transfer.length),
          0.034,
        );
      }
      relaxase.visible =
        !blocked && advance > 0 && advance < 1 + bridgeFraction;
      relaxase.position.set(...strandPoint(0));
      nick.visible = !blocked && p >= 0.36 && p < 0.48;
      labels[0].position[0] = -cx;
      labels[1].position[0] = cx;
      labels[1].text =
        !blocked && p >= 0.94
          ? b("获得 F 质粒的受体", "Recipient with F plasmid")
          : b("F⁻ 受体", "F⁻ recipient");
      labels[2].active = p < 0.34;
      labels[3].active = p >= 0.33 && p < 0.93;
      labels[4].active = p >= 0.3 && p < 0.49;
      labels[4].position[0] = -cx;
      labels[5].active =
        !blocked && advance > 0 && advance < 1 + bridgeFraction;
      labels[6].active = !blocked && p > 0.48;
      labels[7].active = !blocked && p > 0.75;
      labels[6].position[0] = -cx;
      labels[7].position[0] = cx;
      if (blocked && p > 0.48) {
        labels[4].active = true;
        labels[4].text = b("oriT 未切开：无转移", "oriT uncut: no transfer");
      } else labels[4].text = b("oriT · TraI", "oriT · TraI");
      group.userData = {
        process: "conjugation",
        structuralDetail:
          "laminated envelope cutaways, T4SS annular subunits, helical pilin, plasmid basepairs",
        organism: "Escherichia coli",
        plasmid: "autonomous F",
        oriTNicking: !blocked && p > 0.36,
        pilusDistinctFromJunction: true,
        stableContact: p >= 0.35 && p < 0.95,
        transferStrands: 1,
        leadingEnd: "5-prime",
        transferFraction: tf,
        donorReplacementFraction: tf,
        recipientComplementFraction: recipientSynthesis,
        donorRetainsPlasmid: true,
        recipientDoubleStrandedPlasmid: recipientSynthesis >= 1,
        chromosomeTransfer: false,
        progress: p,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 1.6, 11.8], target: [0, 0, 0] },
    };
  },
};
export default process;
