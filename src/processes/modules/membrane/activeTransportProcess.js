import { THREE, clamp, ease, bilingual as b } from "../../kit.js";
import {
  membraneScene,
  materialInventory,
  alphaHelix,
  foldedDomain,
  mix,
} from "./membraneGeometry.js";

export default {
  id: "activeTransport",
  title: b("钠钾泵的主动运输", "Active transport by the sodium–potassium pump"),
  intro: b(
    "动物细胞质膜的 Na⁺/K⁺-ATP 酶：每轮水解一个 ATP，将 3 个 Na⁺ 运出、2 个 K⁺ 运入。剖面将 α 亚基的跨膜螺旋与胞质催化域简化；膜两侧的门交替开放。无 ATP 条件停在可结合钠的状态。",
    "Animal plasma-membrane Na⁺/K⁺-ATPase: one ATP drives export of 3 Na⁺ and import of 2 K⁺ per cycle. The cutaway simplifies the α-subunit transmembrane helices and cytoplasmic catalytic domains. Access gates open alternately. Without ATP the model remains in a sodium-binding state.",
  ),
  duration: 36,
  stages: [
    {
      at: 0,
      title: b("E1：朝向细胞质", "E1: open to the cytoplasm"),
      description: b(
        "胞质侧的 3 个 Na⁺ 结合膜内位点；外侧通路关闭。",
        "Three cytoplasmic Na⁺ bind within the membrane while the external route stays closed.",
      ),
    },
    {
      at: 0.2,
      title: b("ATP 与磷酸化", "ATP and phosphorylation"),
      description: b(
        "胞质域结合 ATP，泵发生磷酸化，ADP 释放；钠被封闭在蛋白内。",
        "ATP binds the cytoplasmic domains, the pump is phosphorylated, and ADP leaves. Sodium becomes occluded within the protein.",
      ),
    },
    {
      at: 0.38,
      title: b("E2P：向外释钠", "E2P: sodium released outside"),
      description: b(
        "构象改变使外侧通路开放，3 个 Na⁺ 释放到细胞外。",
        "A conformational change opens the external route and releases three Na⁺ outside.",
      ),
    },
    {
      at: 0.56,
      title: b("从外侧结合钾", "Potassium binds from outside"),
      description: b(
        "2 个 K⁺ 由外侧进入结合位点；内侧通路保持关闭。",
        "Two K⁺ enter binding sites from outside; the cytoplasmic route remains closed.",
      ),
    },
    {
      at: 0.71,
      title: b("去磷酸化与封闭", "Dephosphorylation and occlusion"),
      description: b(
        "钾结合后外侧门关闭并形成闭锁态，随后去磷酸化、释放磷酸，再转回 E1。",
        "After potassium binding, the external gate closes and potassium becomes occluded. Dephosphorylation and phosphate release follow before the return to E1.",
      ),
    },
    {
      at: 0.86,
      title: b("向内释钾", "Potassium released inside"),
      description: b(
        "内侧通路重新开放并释放 2 个 K⁺，完成一轮运输，净向外移动一个正电荷。",
        "The cytoplasmic route reopens and releases two K⁺, completing a cycle with one net positive charge moved outward.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Kinetics of K(+) occlusion by the phosphoenzyme of the Na(+),K(+)-ATPase",
      url: "https://pubmed.ncbi.nlm.nih.gov/21190658/",
    },
    {
      title:
        "Structural basis for gating mechanism of the human sodium-potassium pump",
      url: "https://www.nature.com/articles/s41467-022-32990-x",
    },
    {
      title:
        "Cryo-EM structures of recombinant human sodium-potassium pump determined in three different states",
      url: "https://www.nature.com/articles/s41467-022-31602-y",
    },
  ],
  legend: [
    { color: "#ca886a", text: b("Na⁺", "Na⁺") },
    { color: "#9d91bf", text: b("K⁺", "K⁺") },
    { color: "#d9b464", text: b("磷酸基", "Phosphate") },
    { color: "#829e99", text: b("跨膜蛋白", "Transmembrane protein") },
  ],
  controls: [
    {
      id: "energy",
      label: b("能量条件", "Energy condition"),
      default: "atp",
      options: [
        { value: "atp", label: b("有 ATP", "ATP available") },
        { value: "none", label: b("无 ATP", "No ATP") },
      ],
    },
  ],
  create() {
    const k = membraneScene(1.0);
    const helixMat = k.material("#829e99");
    const gateMat = k.material("#607f7b");
    const nMat = k.material("#aa99b1");
    const pMat = k.material("#b9a77e");
    const aMat = k.material("#93a5b5");
    const naMat = k.material("#ca886a");
    const potassiumMat = k.material("#9d91bf");
    const phosphateMat = k.material("#d9b464");
    // Schematic alpha-subunit: ten transmembrane helices surrounding binding cavity.
    const helices = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const object = alphaHelix(
        k,
        [Math.cos(a) * 0.77, 0, Math.sin(a) * 0.48 - 0.03],
        1.96,
        helixMat,
      );
      object.name = `alpha-subunit-helix-M${i + 1}`;
      helices.push({ object, x: object.position.x, z: object.position.z, i });
    }
    // Gates move sideways and never open at the same time.
    const externalGate = k.ball([0, 0.72, 0.22], [0.58, 0.13, 0.31], gateMat);
    const internalGate = k.ball([0, -0.72, 0.22], [0.58, 0.13, 0.31], gateMat);
    externalGate.name = "pump-external-gate";
    internalGate.name = "pump-internal-gate";
    for (const gate of [externalGate, internalGate]) {
      for (let j = -2; j <= 2; j++)
        k.tube(
          [
            [j * 0.25, -0.65, -0.3],
            [j * 0.25, 0.1, 0.15],
            [j * 0.25, 0.55, 0.32],
          ],
          0.1,
          helixMat,
          gate,
          12,
        );
    }
    const nDomain = foldedDomain(
      k,
      [-1.13, -1.75, 0],
      [1.05, 1.12, 0.86],
      nMat,
      "N-domain-nucleotide-cleft",
    );
    const pDomain = foldedDomain(
      k,
      [0.05, -1.79, -0.21],
      [1.06, 1.15, 0.88],
      pMat,
      "P-domain-phosphorylation-pocket",
    );
    const aDomain = foldedDomain(
      k,
      [1.07, -1.47, -0.18],
      [0.87, 1.03, 0.84],
      aMat,
      "A-domain-actuator",
    );
    k.segment([-0.62, -0.72, -0.28], [-1.08, -1.46, -0.16], 0.13, nMat);
    k.segment([0.55, -0.71, -0.27], [1.03, -1.16, -0.18], 0.13, aMat);
    const activeResidue = k.material("#c6b88e");
    k.ball([0.1, 0.02, 0.25], 0.065, activeResidue, pDomain);
    k.segment(
      [0.1, -0.12, 0.12],
      [0.1, 0.02, 0.25],
      0.033,
      activeResidue,
      pDomain,
    );
    for (const y of [-0.22, 0, 0.22]) {
      k.tube(
        [
          [-0.3, y, -0.12],
          [-0.23, y, 0.22],
          [-0.15, y, 0.34],
        ],
        0.031,
        activeResidue,
      );
      k.tube(
        [
          [0.3, y, -0.12],
          [0.23, y, 0.22],
          [0.15, y, 0.34],
        ],
        0.031,
        activeResidue,
      );
    }
    // Back-side beta-subunit: one membrane helix with an extracellular folded head.
    // It sits behind the cutaway so it cannot conceal transported ions.
    alphaHelix(k, [0.63, 0, -0.64], 1.88, aMat);
    foldedDomain(
      k,
      [0.88, 1.39, -0.55],
      [0.66, 0.66, 0.6],
      aMat,
      "beta-subunit-extracellular-domain",
    );
    for (const x of [0.64, 0.93])
      k.tube(
        [
          [x, 1.69, -0.53],
          [x - 0.08, 1.89, -0.48],
          [x + 0.03, 2.02, -0.44],
        ],
        0.025,
        activeResidue,
      );
    const sodium = [-0.3, 0, 0.3].map((x, i) => {
      const m = k.ball([x, -2.7, 0.51], 0.14, naMat);
      m.name = `sodium-${i}`;
      return m;
    });
    const potassium = [-0.19, 0.19].map((x, i) => {
      const m = k.ball([x, 2.65, 0.5], 0.16, potassiumMat);
      m.name = `potassium-${i}`;
      return m;
    });
    const nucleotide = new THREE.Group();
    k.group.add(nucleotide);
    k.ball([0, 0, 0], [0.21, 0.14, 0.13], nMat, nucleotide);
    for (const x of [0.3, 0.53])
      k.ball([x, 0, 0], 0.105, phosphateMat, nucleotide);
    const terminalPhosphate = k.ball([-2.35, -2.6, 0.4], 0.115, phosphateMat);
    const phosphate = k.ball([0.12, -1.61, 0.25], 0.15, phosphateMat);
    terminalPhosphate.name = "ATP-terminal-phosphate";
    phosphate.name = "pump-phosphate";
    nucleotide.name = "ATP-ADP-nucleotide";
    const labels = [
      k.label([-3.3, 2.93, 0], "细胞外", "Extracellular", 2),
      k.label([-3.4, -2.99, 0], "细胞质", "Cytoplasm", 2),
      k.label([2.3, 2.45, 0], "3 Na⁺ 向外", "3 Na⁺ out", 2),
      k.label([2.4, -2.5, 0], "2 K⁺ 向内", "2 K⁺ in", 2),
      k.label([-1.63, -1.48, 0.5], "ATP 结合域", "ATP-binding domain"),
      k.label([0.2, -2.47, 0.3], "磷酸化域", "Phosphorylation domain"),
      k.label([2.35, 0.1, 0.55], "E1 · 朝内开放", "E1 · inward open", 2),
      k.label([-2.6, -2.57, 0.45], "ATP", "ATP", 2),
      k.label([0.24, -1.18, 0.45], "磷酸基", "Phosphate"),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        powered = parameters.energy !== "none";
      const q = powered ? p : Math.min(p, 0.18);
      const closeIn = ease(q, 0.2, 0.29);
      const openOut = ease(q, 0.33, 0.39) * (1 - ease(q, 0.7, 0.77));
      const reopenIn = ease(q, 0.81, 0.87);
      const inwardOpen = 1 - closeIn + reopenIn;
      internalGate.position.x = -0.79 * inwardOpen;
      internalGate.scale.x = 0.58 - 0.42 * inwardOpen;
      externalGate.position.x = 0.79 * openOut;
      externalGate.scale.x = 0.58 - 0.42 * openOut;
      const e2 = ease(q, 0.29, 0.4) * (1 - ease(q, 0.76, 0.88));
      helices.forEach(({ object, x, z, i }) => {
        object.position.x = x + (i < 5 ? 0.1 : -0.1) * e2;
        object.position.z = z;
        object.rotation.z = (i % 2 ? 1 : -1) * 0.11 * e2;
      });
      nDomain.position.x =
        -1.13 + ease(q, 0.17, 0.27) * 0.22 - ease(q, 0.79, 0.92) * 0.22;
      nDomain.rotation.z = e2 * -0.2;
      aDomain.rotation.z = e2 * 0.34;
      pDomain.rotation.z = e2 * 0.12;
      sodium.forEach((ion, i) => {
        const binding = ease(q, 0.02 + i * 0.015, 0.18);
        const release = ease(q, 0.41 + i * 0.014, 0.54);
        ion.position.set(
          mix([-0.3, 0, 0.3][i], (i - 1) * 0.9, release),
          mix(-2.7 - i * 0.06, (i - 1) * 0.22, binding) +
            release * (2.4 - (i - 1) * 0.22),
          0.52,
        );
      });
      potassium.forEach((ion, i) => {
        const binding = ease(q, 0.55 + i * 0.02, 0.68);
        const release = ease(q, 0.88 + i * 0.015, 0.985);
        ion.position.set(
          mix((i ? 1 : -1) * 0.2, (i ? 1 : -1) * 0.82, release),
          mix(2.68, (i ? 1 : -1) * 0.18, binding) -
            release * (2.72 + (i ? 1 : -1) * 0.18),
          0.5,
        );
      });
      const dock = ease(q, 0.08, 0.2),
        leave = ease(q, 0.3, 0.42);
      nucleotide.visible = powered;
      nucleotide.position.set(
        mix(-2.72, -1.17, dock) - leave * 1.25,
        mix(-2.64, -1.59, dock) - leave * 0.95,
        0.45,
      );
      terminalPhosphate.visible = powered && q < 0.29;
      terminalPhosphate.position.set(
        nucleotide.position.x + 0.76,
        nucleotide.position.y,
        0.45,
      );
      phosphate.visible = powered && q >= 0.29;
      // Conservative teaching synchronization: the represented phosphotransfer
      // waits for Na occlusion; K occlusion precedes dephosphorylation/Pi exit.
      // These fractions are not measured microscopic reaction times.
      const piRelease = ease(q, 0.78, 0.805);
      phosphate.position.set(
        0.12 + piRelease * 1.5,
        -1.61 - piRelease * 1.23,
        0.39,
      );
      labels[8].active = phosphate.visible;
      labels[8].position[0] = phosphate.position.x;
      labels[8].position[1] = phosphate.position.y + 0.27;
      labels[7].text = !powered
        ? b("无 ATP · 周期停滞", "No ATP · cycle stalled")
        : q < 0.29
          ? b("ATP", "ATP")
          : b("ADP", "ADP");
      // Occlusion is a geometrical state: both access gates have closed.
      const bothClosed = inwardOpen === 0 && openOut === 0;
      const state = bothClosed
        ? q < 0.5
          ? "E1P-occluded"
          : q < 0.78
            ? "E2P-K-occluded"
            : "E2-occluded"
        : q < 0.2 || q >= 0.87
          ? "E1"
          : q < 0.29
            ? "inward-closing"
            : q < 0.39
              ? "outward-opening"
              : q < 0.7
                ? "E2P"
                : q < 0.77
                  ? "outward-closing"
                  : "inward-opening";
      const stateTexts = {
        E1: b("E1 · 朝内开放", "E1 · inward open"),
        "E1P-occluded": b("E1P · 钠封闭", "E1P · sodium occluded"),
        E2P: b("E2P · 朝外开放", "E2P · outward open"),
        "E2P-K-occluded": b("E2P · 钾封闭", "E2P · potassium occluded"),
        "E2-occluded": b("E2 · 钾封闭", "E2 · potassium occluded"),
        "inward-closing": b("胞质侧门关闭中", "Cytoplasmic gate closing"),
        "outward-opening": b("外侧门开放中", "External gate opening"),
        "outward-closing": b(
          "钾结合 · 外侧门关闭中",
          "Potassium bound · external gate closing",
        ),
        "inward-opening": b("胞质侧门重新开放中", "Cytoplasmic gate reopening"),
      };
      labels[6].text = stateTexts[state];
      k.group.userData = {
        process: "activeTransport",
        alphaTransmembraneHelices: 10,
        catalyticDomains: ["N", "P", "A"],
        betaSubunitVisible: true,
        structuralDetail: "schematic-secondary-structure",
        organism: "animal",
        energy: powered ? "atp" : "none",
        conformation: state,
        sodiumExported: q >= 0.54 ? 3 : 0,
        potassiumImported: q >= 0.985 ? 2 : 0,
        atpHydrolyzed: q >= 0.29 ? 1 : 0,
        inwardGateOpen: inwardOpen,
        outwardGateOpen: openOut,
        phosphorylated: q >= 0.29 && q < 0.78,
        membranePlane: "y=0",
        completed: q >= 0.985,
      };
    }
    update(0);
    return {
      group: k.group,
      materials: materialInventory(k.group),
      update,
      labels,
      camera: { position: [0, 1.6, 11.8], target: [0, -0.15, 0] },
    };
  },
};
