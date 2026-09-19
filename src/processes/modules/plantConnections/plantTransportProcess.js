import { THREE, sceneKit, bilingual as b, clamp, ease } from "../../kit.js";
import { anatomy } from "./anatomy.js";

function create() {
  const k = sceneKit();
  const detail = anatomy(k);
  const { group, material, ball, segment, tube, mesh, label } = k;
  const lipid = material("#98b4aa"),
    tail = material("#c4cec0"),
    pumpMat = material("#9a7f9f"),
    carrierMat = material("#658c95");
  const protonMat = material("#c59656"),
    sucroseMat = material("#a16f67"),
    wallMat = material("#d5c9aa");
  const box = new THREE.BoxGeometry(1, 1, 1);
  // Paired headgroups and two hydrocarbon tails: shared instanced geometry.
  const heads = [],
    tails = [];
  for (let ix = 0; ix < 49; ix++)
    for (let iz = 0; iz < 9; iz++) {
      const x = -4 + ix / 6,
        z = -0.85 + iz * 0.2;
      if (
        ((x + 1.75) / 0.57) ** 2 + ((z - 0.3) / 0.48) ** 2 < 1 ||
        ((x - 1.65) / 0.68) ** 2 + ((z - 0.55) / 0.46) ** 2 < 1
      )
        continue;
      for (const side of [-1, 1]) {
        heads.push({ p: [x, side * 0.25, z], s: [0.072, 0.072, 0.072] });
        for (const offset of [-0.027, 0.027])
          tails.push({
            p: [x + offset, side * 0.125, z],
            s: [0.016, 0.2, 0.016],
            r: [0, 0, offset * 3],
          });
      }
    }
  detail.instance(k.sphere, lipid, heads, group, "bilayer-polar-headgroups");
  detail.instance(k.cylinder, tail, tails, group, "paired-hydrophobic-tails");
  // Porous wall fibers stay wholly outside the plasma membrane.
  for (let i = 0; i < 7; i++)
    tube(
      [
        [-4, 1.55 + i * 0.09, -1.15],
        [0, 1.65 + i * 0.08, -1.1],
        [4, 1.58 + i * 0.09, -1.05],
      ],
      0.035,
      wallMat,
    );
  for (let i = 0; i < 15; i++)
    segment(
      [-3.85 + i * 0.54, 1.48, -1.19],
      [-3.7 + i * 0.54, 2.15, -1.08],
      0.024,
      wallMat,
    );
  const cyto = mesh(
    box,
    material("#c8d8cc", {
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    }),
    [0, -1.45, -0.45],
  );
  cyto.scale.set(8.2, 2.3, 1.3);
  const gradientMaterial = material("#d8b77e", {
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const gradientField = mesh(box, gradientMaterial, [0, 0.98, -0.63]);
  gradientField.scale.set(8.2, 1.27, 1.1);
  gradientField.name = "qualitative-proton-gradient-field";

  const pump = new THREE.Group();
  group.add(pump);
  pump.name = "H-ATPase-domain-schematic";
  pump.position.x = -1.75;
  pump.position.z = 0.3;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const h = detail.helix(
      pump,
      [0.32 * Math.cos(a), 0, 0.3 * Math.sin(a)],
      1.08,
      0.095,
      pumpMat,
      `H-ATPase-M${i + 1}`,
    );
    h.rotation.z = Math.cos(a) * 0.09;
  }
  const catalytic = detail.protein(
    pump,
    [-0.3, -0.93, 0.04],
    0.64,
    "#957c9b",
    "nucleotide-binding-domain",
    3,
  );
  const hinge = detail.protein(
    pump,
    [0.29, -0.63, -0.13],
    0.48,
    "#ad91a8",
    "actuator-domain",
    2,
  );
  detail.protein(
    pump,
    [0.2, -1.16, -0.16],
    0.52,
    "#847795",
    "phosphorylation-domain",
    3,
  );
  // Domain arrangement only: uncertain pump peptide insertions are not drawn as bonds.
  const carrier = new THREE.Group();
  group.add(carrier);
  carrier.name = "SUC2-transmembrane-topology";
  carrier.position.set(1.65, 0, 0.55);
  const lobes = [];
  for (const s of [-1, 1]) {
    const lobe = new THREE.Group();
    carrier.add(lobe);
    lobe.position.x = s * 0.35;
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2;
      detail.helix(
        lobe,
        [s * 0.06 + Math.cos(a) * 0.13, 0, Math.sin(a) * 0.22],
        1.13,
        0.072,
        carrierMat,
        `SUC2-${s < 0 ? "N" : "C"}-helix-${j + 1}`,
      );
      if (j < 5) {
        const side = j % 2 === 0 ? 1 : -1,
          next = ((j + 1) / 6) * Math.PI * 2;
        const loop = tube(
          [
            [s * 0.06 + Math.cos(a) * 0.13, side * 0.565, Math.sin(a) * 0.22],
            [
              s * 0.06 + Math.cos((a + next) / 2) * 0.18,
              side * 0.7,
              Math.sin((a + next) / 2) * 0.27,
            ],
            [
              s * 0.06 + Math.cos(next) * 0.13,
              side * 0.565,
              Math.sin(next) * 0.22,
            ],
          ],
          0.025,
          carrierMat,
          lobe,
        );
        loop.name = `SUC2-${s < 0 ? "N" : "C"}-loop-${j + 1}`;
      }
    }
    ball(
      [-s * 0.13, 0.02, 0.01],
      [0.06, 0.14, 0.11],
      material("#c3b58b"),
      lobe,
    );
    lobes.push(lobe);
  }
  const linker = new THREE.Group();
  carrier.add(linker);
  linker.name = "SUC2-cytoplasmic-interdomain-linker";
  const linkerSegments = Array.from({ length: 24 }, () =>
    mesh(k.cylinder, carrierMat, [0, 0, 0], linker),
  );
  const linkA = new THREE.Vector3(),
    linkB = new THREE.Vector3(),
    linkPrev = new THREE.Vector3(),
    linkNext = new THREE.Vector3(),
    linkDirection = new THREE.Vector3(),
    linkUp = new THREE.Vector3(0, 1, 0);
  function updateLinker() {
    lobes.forEach((l) => l.updateMatrix());
    linkA
      .set(
        -0.06 + Math.cos((5 * Math.PI) / 3) * 0.13,
        -0.565,
        Math.sin((5 * Math.PI) / 3) * 0.22,
      )
      .applyMatrix4(lobes[0].matrix);
    linkB.set(0.06 + 0.13, -0.565, 0).applyMatrix4(lobes[1].matrix);
    linkPrev.copy(linkA);
    linkerSegments.forEach((m, i) => {
      const t = (i + 1) / linkerSegments.length,
        u = 1 - t;
      linkNext.set(
        linkA.x * u + linkB.x * t,
        linkA.y * u + linkB.y * t - 0.28 * 4 * t * u,
        linkA.z * u + linkB.z * t,
      );
      linkDirection.subVectors(linkNext, linkPrev);
      m.position.copy(linkPrev).add(linkNext).multiplyScalar(0.5);
      m.scale.set(0.025, linkDirection.length(), 0.025);
      m.quaternion.setFromUnitVectors(linkUp, linkDirection.normalize());
      linkPrev.copy(linkNext);
    });
  }
  for (let layer = 0; layer < 3; layer++)
    for (let row = 0; row < 5; row++)
      detail.cellulose(
        group,
        [-3.95, 1.58 + row * 0.11, -1.06 - layer * 0.055],
        [3.95, 1.67 + row * 0.1, -1.04 - layer * 0.055],
        0.021,
        3,
      );
  const protons = [];
  for (let i = 0; i < 1; i++) {
    const h = ball([-1.75, -1.45, 0.27], 0.09, protonMat);
    h.name = "tracked-pump-and-symport-proton";
    protons.push(h);
  }
  const sugar = new THREE.Group();
  group.add(sugar);
  const ringGeometry = new THREE.TorusGeometry(0.16, 0.045, 8, 6);
  const r1 = mesh(ringGeometry, sucroseMat, [-0.13, 0, 0], sugar),
    r2 = mesh(ringGeometry, sucroseMat, [0.17, 0, 0], sugar);
  r2.rotation.z = 0.4;
  segment([-0.01, 0, 0], [0.05, 0, 0], 0.045, sucroseMat, sugar);
  const coupledH = protons[0];
  const atp = new THREE.Group();
  group.add(atp);
  atp.name = "single-cycle-ATP-to-ADP";
  ball([-0.24, 0, 0], [0.22, 0.14, 0.12], material("#748f98"), atp);
  const phosphate = [];
  for (let i = 0; i < 3; i++) {
    const ph = ball([i * 0.15, 0, 0], 0.075, protonMat, atp);
    ph.name = `ATP-phosphate-${i + 1}`;
    phosphate.push(ph);
  }
  const labels = [
    label([-3.1, 2.1, 0], "细胞壁 · 质外体", "Cell wall · apoplast", 3),
    label([-2.9, -2.05, 0.25], "伴胞的细胞质", "Companion-cell cytosol", 3),
    label(
      [-1.95, -1.35, 0.4],
      "质膜 H⁺-ATPase",
      "Plasma-membrane H⁺-ATPase",
      3,
    ),
    label([2.7, -0.25, 0.65], "SUC2 同向转运体", "SUC2 symporter", 3),
    label([0.4, 1.45, 0.2], "H⁺ 电化学梯度", "H⁺ electrochemical gradient", 2),
    label([3.1, 1.18, 0.4], "蔗糖", "Sucrose", 2),
    label(
      [-3.05, -0.75, 0.65],
      "1 ATP → ADP + Pi · 1 H⁺ 外排",
      "1 ATP → ADP + Pi · 1 H⁺ exported",
      2,
    ),
    label(
      [-1.9, -2.28, 0.2],
      "质子泵：结构域示意，省略肽链连接",
      "Proton pump: domains; peptide connections omitted",
      1,
    ),
  ];
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      active = parameters.energy !== "depleted";
    const pumping = active ? ease(p, 0.12, 0.41) : 0,
      uptake = active ? ease(p, 0.59, 0.87) : 0;
    const activation = active ? Math.sin(Math.PI * ease(p, 0.08, 0.35)) : 0;
    gradientMaterial.opacity = active ? 0.08 * ease(p, 0.12, 0.41) : 0;
    catalytic.rotation.z = activation * 0.16;
    hinge.position.y = -0.63 - activation * 0.12;
    atp.position.set(-3 + 0.93 * ease(p, 0.02, 0.14), -1.1, 0.62);
    atp.visible = active;
    const hydrolysis = active ? ease(p, 0.18, 0.34) : 0;
    phosphate[2].position.set(0.3 - 0.42 * hydrolysis, -0.5 * hydrolysis, 0);
    for (let i = 0; i < protons.length; i++) {
      const t = active ? ease(p, 0.12 + i * 0.018, 0.28 + i * 0.018) : 0;
      const spread = 0;
      protons[i].position.set(
        -1.75 + (-1.7 + i * 0.42) * spread,
        -1.45 + 2.65 * t,
        0.27 + (i % 3) * 0.055,
      );
    }
    const binding = ease(p, 0.43, 0.59);
    sugar.position.set(
      3.25 - 1.6 * binding + 0.62 * (active ? ease(p, 0.79, 0.87) : 0),
      1.28 - 0.67 * binding - 2.19 * uptake,
      0.55,
    );
    if (active && p >= 0.43)
      coupledH.position.set(
        -1.75 + 3.23 * binding - 0.26 * ease(p, 0.79, 0.87),
        1.2 - 0.65 * binding - 2.05 * uptake,
        0.27 + 0.31 * binding,
      );
    // Alternating access: the two bundles tilt; substrate does not cross bare lipid.
    lobes[0].rotation.z = 0.18 - 0.36 * uptake;
    lobes[1].rotation.z = -0.18 + 0.36 * uptake;
    updateLinker();
    labels[4].active = active && p >= 0.26;
    group.userData = {
      process: "plantTransport",
      trackedPumpCycles: active && p >= 0.34 ? 1 : 0,
      trackedExportedProtons: active && p >= 0.28 ? 1 : 0,
      structuralDetail:
        "paired lipid leaflets; pump domain schematic without peptide connections; SUC-family alternating-side topology and cytoplasmic linker",
      species: "Arabidopsis thaliana",
      cellType: "phloem companion cell",
      energy: active
        ? "ATP available"
        : "ATP absent; initially unenergized membrane",
      pumpDirection: "cytosol-to-apoplast",
      symportDirection: "apoplast-to-cytosol",
      gradientEstablished: pumping,
      transportedSucrose: uptake,
      primaryEnergy: "plasma-membrane H+-ATPase",
      secondaryEnergy: "proton electrochemical gradient",
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0, 2.7, 10], target: [0, 0, 0] },
  };
}
export default {
  id: "plantTransport",
  title: b("质子梯度驱动蔗糖摄取", "Proton-driven sucrose uptake"),
  intro: b(
    "拟南芥叶脉伴胞质膜的局部剖面。H⁺-ATPase 消耗 ATP 向质外体泵出质子，SUC2 利用质子回流摄入蔗糖。追踪单次 ATP 水解与一个 H⁺ 的外排及回流，背景浓度场不按粒子数计量。质子泵仅示意结构域，省略肽链连接。对照从无初始梯度的膜开始；不模拟液泡或整株运输，形状与时间均为示意。",
    "A cutaway of an Arabidopsis leaf-vein companion-cell plasma membrane. The H⁺-ATPase uses ATP to export protons; SUC2 couples proton return to sucrose uptake. One ATP hydrolysis and one H⁺ export/return are tracked; the background gradient is not counted as particles. The pump shows domains with peptide connections omitted. The comparison starts without a pre-existing gradient. Vacuoles and whole-plant transport are outside this schematic; shapes and timing are illustrative.",
  ),
  duration: 30,
  controls: [
    {
      id: "energy",
      label: b("供能条件", "Energy supply"),
      default: "available",
      options: [
        { value: "available", label: b("ATP 可用", "ATP available") },
        {
          value: "depleted",
          label: b("无 ATP · 初始无梯度", "No ATP · initially no gradient"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("两侧与两种蛋白", "Two sides, two proteins"),
      description: b(
        "细胞壁位于质外体侧；泵和同向转运体嵌在同一片质膜中。",
        "The wall is on the apoplastic side; the pump and symporter span the same plasma membrane.",
      ),
    },
    {
      at: 0.13,
      title: b("ATP 驱动向外泵送", "ATP drives proton export"),
      description: b(
        "H⁺-ATPase 的胞质侧催化结构利用 ATP 水解，将质子从胞质送入质外体。",
        "The cytosolic catalytic domain uses ATP hydrolysis to move protons from cytosol to apoplast.",
      ),
    },
    {
      at: 0.35,
      title: b("建立电化学梯度", "An electrochemical gradient forms"),
      description: b(
        "向外泵送建立跨膜的质子浓度差和电势差；质子回流可释放自由能。",
        "Outward pumping establishes a proton concentration difference and membrane potential; proton return can release free energy.",
      ),
    },
    {
      at: 0.48,
      title: b("外侧结合", "Binding from the apoplast"),
      description: b(
        "蔗糖与质子到达 SUC2 的外侧入口。转运体的选择性不等于膜对蔗糖自由通透。",
        "Sucrose and a proton approach the outer-facing SUC2 site. Transporter selectivity does not make the lipid membrane freely permeable to sucrose.",
      ),
    },
    {
      at: 0.64,
      title: b("耦合与交替开放", "Coupling and alternating access"),
      description: b(
        "SUC2 改变朝向，使质子回流与蔗糖进入胞质相耦合；SUC2 本身不水解 ATP。",
        "SUC2 changes access, coupling proton return to sucrose entry into the cytosol; SUC2 itself does not hydrolyze ATP.",
      ),
    },
    {
      at: 0.89,
      title: b("两级供能", "Two levels of energy coupling"),
      description: b(
        "先由 ATP 驱动质子泵，再由梯度驱动摄糖。无 ATP 且无初始梯度时，本模型不能完成净摄取。",
        "ATP first powers the proton pump, then the gradient powers uptake. Without ATP and an initial gradient, this model cannot complete net uptake.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Pedersen et al. (2007), Crystal structure of the plasma membrane proton pump",
      url: "https://www.esalq.usp.br/lepse/imgs/conteudo_thumb/Crystal-structure-of-the-plasma-membrane-proton-pump-1.pdf",
    },
    {
      title: "Plant H+-ATPase catalytic domains and ten transmembrane segments",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6222091/",
    },
    {
      title:
        "SUC1 structure supports SUC-family two-domain architecture; schematic SUC2 is not an atomic reconstruction",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10281868/",
    },
    {
      title: "AtSUC2 tissue-specific complementation and phloem loading (2008)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2528097/",
    },
    {
      title:
        "Plant glucose transporter structure and function: proton motive force",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8298354/",
    },
  ],
  create,
};
