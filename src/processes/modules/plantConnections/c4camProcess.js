import { THREE, sceneKit, bilingual as b, clamp, ease } from "../../kit.js";
import { anatomy } from "./anatomy.js";

function create() {
  const k = sceneKit(),
    { group, material, mesh, ball, tube, segment, label } = k;
  const detail = anatomy(k);
  const c4 = new THREE.Group(),
    cam = new THREE.Group();
  group.add(c4, cam);
  const carbonMat = material("#9a785c"),
    captureMat = material("#9389a8"),
    membrane = material("#a4bda9"),
    wallMat = material("#d0c6a4");
  const green = material("#739773"),
    cristaMat = material("#ba9089"),
    gold = material("#c8a365");
  const box = new THREE.BoxGeometry(1, 1, 1),
    backSphere = new THREE.SphereGeometry(1, 36, 24, Math.PI, Math.PI);
  const slab = (pos, size, mat, parent) => {
    const o = mesh(box, mat, pos, parent);
    o.scale.set(...size);
    return o;
  };
  const cell = (x, y, sx, sy, parent, sharedSide = 0) => {
    slab(
      [x, y, -0.8],
      [sx, sy, 0.08],
      material("#dce8d8", {
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
      parent,
    );
    for (const side of [-1, 1]) {
      if (side !== sharedSide)
        slab(
          [x + (side * sx) / 2, y, -0.28],
          [0.12, sy, 1.12],
          wallMat,
          parent,
        );
      slab([x, y + (side * sy) / 2, -0.28], [sx, 0.12, 1.12], wallMat, parent);
      if (side !== sharedSide)
        slab(
          [x + side * (sx / 2 - 0.1), y, -0.28],
          [0.035, sy - 0.18, 1.08],
          membrane,
          parent,
        );
      slab(
        [x, y + side * (sy / 2 - 0.1), -0.28],
        [sx - 0.18, 0.035, 1.08],
        membrane,
        parent,
      );
    }
    const heads = [],
      tails = [];
    for (const sign of [-1, 1]) {
      for (let layer = 0; layer < 3; layer++)
        detail.cellulose(
          parent,
          [x - sx / 2 + 0.08, y + sign * (sy / 2 + 0.018), 0.26 - layer * 0.3],
          [x + sx / 2 - 0.08, y + sign * (sy / 2 + 0.018), 0.26 - layer * 0.3],
          0.018,
          4,
        );
      if (sign !== sharedSide)
        for (let layer = 0; layer < 3; layer++)
          detail.cellulose(
            parent,
            [
              x + sign * (sx / 2 + 0.025),
              y - sy / 2 + 0.08,
              0.25 - layer * 0.3,
            ],
            [
              x + sign * (sx / 2 + 0.025),
              y + sy / 2 - 0.08,
              0.25 - layer * 0.3,
            ],
            0.016,
            4,
          );
      for (let i = 0; i < 40; i++)
        for (const leaf of [-1, 1]) {
          const px = x - sx / 2 + 0.2 + (i / 39) * (sx - 0.4),
            py = y + sign * (sy / 2 - 0.1) + leaf * 0.019;
          heads.push({ p: [px, py, 0.27], s: [0.025, 0.025, 0.025] });
          tails.push({
            p: [px, y + sign * (sy / 2 - 0.1), 0.27],
            s: [0.01, 0.035, 0.01],
          });
        }
    }
    detail.instance(
      k.sphere,
      material("#b2c9ac"),
      heads,
      parent,
      "cell-plasma-membrane-paired-headgroups",
    );
    detail.instance(
      k.cylinder,
      material("#a8b598"),
      tails,
      parent,
      "cell-plasma-membrane-lipid-core",
    );
  };
  const chloroplast = (x, y, scale, parent, grana = true) =>
    detail.chloroplast(
      parent,
      [x, y, -0.13],
      [1.1 * scale, 0.72 * scale, 0.61 * scale],
      { stacked: grana },
    );
  const enzyme = (x, y, mat, parent) =>
    detail.protein(
      parent,
      [x, y, 0.08],
      0.42,
      mat.color.getHex(),
      "carbon-metabolism-enzyme",
      4,
    );
  const particles = (parent) => {
    const a = [];
    for (let i = 0; i < 4; i++) {
      const o = ball([0, 0, 0.45], 0.085, carbonMat, parent);
      o.userData = { element: "C", trackedCarbon: i };
      a.push(o);
    }
    return a;
  };
  // C4: two different cells are joined by explicit symplastic pores.
  cell(-2.02, 0, 3.85, 4.45, c4, 1);
  cell(2.02, 0, 3.85, 4.45, c4, -1);
  for (const [bottom, top] of [
    [-2.225, -1.03],
    [-0.63, 0.24],
    [0.64, 2.225],
  ]) {
    slab(
      [0, (bottom + top) / 2, -0.28],
      [0.28, top - bottom, 1.12],
      wallMat,
      c4,
    );
    for (const side of [-1, 1])
      slab(
        [side * 0.16, (bottom + top) / 2, -0.28],
        [0.035, top - bottom, 1.12],
        membrane,
        c4,
      );
  }
  // Replace the front section of the shared wall with a cutaway and two pores.
  for (const y of [0.44, -0.83]) {
    const pore = mesh(
      new THREE.CylinderGeometry(
        0.2,
        0.2,
        0.6,
        28,
        1,
        true,
        0.7,
        Math.PI * 2 - 1.4,
      ),
      material("#86aa99", {
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      [0, y, 0],
      c4,
    );
    pore.rotation.z = Math.PI / 2;
    pore.name = `C4-symplastic-pore-${y > 0 ? "outbound" : "return"}`;
    // Rim inner clearance matches the 0.2-radius aqueous channel.
    for (const side of [-1, 1])
      for (const radius of [0.212, 0.242]) {
        const rim = mesh(
          new THREE.TorusGeometry(radius, 0.012, 8, 40),
          material("#9ab59c"),
          [side * 0.3, y, 0],
          c4,
        );
        rim.rotation.y = Math.PI / 2;
        rim.name = `C4-pore-rim-${y > 0 ? "outbound" : "return"}-${side}-${radius}`;
      }
    for (const x of [-0.11, 0.11])
      detail.cellulose(c4, [x, y + 0.24, 0.29], [x, y + 0.5, 0.29], 0.013, 3);
    segment([-0.36, y, 0], [0.36, y, 0], 0.025, material("#ad8fa5"), c4);
  }
  chloroplast(-2.2, -0.7, 0.96, c4, true);
  chloroplast(2.21, 0.06, 1.13, c4, false);
  enzyme(-2.32, 1.19, captureMat, c4);
  enzyme(2.38, 0.32, material("#8b9d80"), c4);
  const c4Atoms = particles(c4);
  const c4Bonds = [];
  for (let i = 0; i < 3; i++) {
    c4Bonds.push(mesh(k.cylinder, material("#bfa98e"), [0, 0, 0], c4));
    c4Bonds[i].name = `C4-carbon-bond-${i}`;
  }
  const c4ATP = ball([-3.12, -1.35, 0.45], 0.12, gold, c4);
  // CAM: a single succulent mesophyll cell, with vacuolar storage and NAD-ME mitochondrion.
  cell(0, -0.05, 7.75, 4.45, cam);
  const vac = mesh(
    backSphere,
    material("#adbec8", { side: THREE.DoubleSide }),
    [-0.52, -0.1, -0.08],
    cam,
  );
  vac.scale.set(1.63, 1.45, 0.7);
  const innerTonoplast = mesh(
    backSphere,
    material("#c8d9de", { side: THREE.DoubleSide }),
    [-0.52, -0.1, -0.065],
    cam,
  );
  innerTonoplast.scale.set(1.6, 1.42, 0.675);
  innerTonoplast.name = "tonoplast-lumen-facing-leaflet";
  const vacHeads = [];
  for (let i = 0; i < 120; i++)
    for (const side of [-1, 1]) {
      const a = (i / 120) * Math.PI * 2;
      vacHeads.push({
        p: [
          -0.52 + (1.63 + side * 0.014) * Math.cos(a),
          -0.1 + (1.45 + side * 0.014) * Math.sin(a),
          -0.05,
        ],
        s: [0.018, 0.018, 0.018],
      });
    }
  detail.instance(
    k.sphere,
    material("#9eb7c3"),
    vacHeads,
    cam,
    "tonoplast-paired-cut-leaflets",
  );
  for (const side of [-1, 1]) {
    const transport = new THREE.Group();
    transport.position.set(-0.52 + side * 1.58, 0.02, -0.03);
    transport.rotation.z = Math.PI / 2;
    transport.name = "tonoplast-malate-transport-site-schematic";
    cam.add(transport);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      detail.helix(
        transport,
        [Math.cos(a) * 0.062, 0, Math.sin(a) * 0.062],
        0.24,
        0.025,
        material("#819faa"),
      );
    }
  }
  ball(
    [-0.52, -0.1, -0.08],
    [1.63, 1.45, 0.7],
    material("#aec7d5", { transparent: true, opacity: 0.1, depthWrite: false }),
    cam,
  );
  const tonoplastPoints = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    tonoplastPoints.push([
      -0.52 + 1.63 * Math.cos(a),
      -0.1 + 1.45 * Math.sin(a),
      -0.08,
    ]);
  }
  tube(tonoplastPoints, 0.035, material("#91aaba"), cam);
  chloroplast(2.43, -1.1, 0.91, cam, true);
  detail.mitochondrion(cam, [2.35, 0.86, -0.08], [1.1, 0.59, 0.52]);
  enzyme(-2.85, 0.77, captureMat, cam);
  enzyme(2.54, 0.91, material("#ad868c"), cam);
  const camAtoms = particles(cam);
  const camBonds = [];
  for (let i = 0; i < 3; i++)
    camBonds.push(mesh(k.cylinder, material("#bfa98e"), [0, 0, 0], cam));
  const reserves = [];
  for (let i = 0; i < 12; i++)
    reserves.push(
      ball(
        [-0.95 + (i % 4) * 0.34, -0.62 + Math.floor(i / 4) * 0.3, 0.1],
        0.07,
        material("#ba9d80"),
        cam,
      ),
    );
  // Epidermal stomatal inset is explicitly separate from the mesophyll cell.
  const guardShape = new THREE.Shape();
  guardShape.moveTo(-0.3, -0.18);
  guardShape.bezierCurveTo(-0.54, -0.04, -0.47, 0.19, -0.19, 0.2);
  guardShape.bezierCurveTo(0.16, 0.21, 0.43, 0.09, 0.32, -0.12);
  guardShape.bezierCurveTo(0.19, -0.02, 0.04, 0.01, -0.1, -0.045);
  guardShape.bezierCurveTo(-0.21, -0.09, -0.24, -0.15, -0.3, -0.18);
  const guardGeo = new THREE.ExtrudeGeometry(guardShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 20,
  });
  const guards = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    cam.add(g);
    g.position.set(side < 0 ? -2.65 : -1.75, 2.7, 0.14);
    g.name = "kidney-shaped-guard-cell-inset";
    const body = mesh(guardGeo, material("#7f9f7c"), [0, 0, 0], g);
    body.scale.x = side < 0 ? 1 : -1;
    for (let i = 0; i < 3; i++)
      ball(
        [-0.22 + i * 0.15, 0.095, 0.135],
        [0.062, 0.03, 0.025],
        material("#527d60"),
        g,
      );
    tube(
      [
        [-0.2, -0.06, 0.125],
        [0, 0.015, 0.13],
        [0.21, -0.012, 0.13],
      ],
      0.025,
      material("#bcc69a"),
      g,
    );
    guards.push(g);
  }
  const [guardLeft, guardRight] = guards;
  const sun = new THREE.Group();
  cam.add(sun);
  sun.position.set(3.25, 2.72, 0);
  ball([0, 0, 0], 0.19, gold, sun);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    segment(
      [Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0],
      [Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0],
      0.022,
      gold,
      sun,
    );
  }
  const moon = mesh(
    new THREE.TorusGeometry(0.2, 0.07, 12, 40, Math.PI * 1.4),
    material("#94a2b8"),
    [3.25, 2.72, 0],
    cam,
  );
  moon.rotation.z = -0.6;
  // Four carbons: a pre-existing 3C acceptor plus one incoming inorganic carbon.
  const c4Keys = [
    [
      0,
      [-2.65, 1.2, 0.53],
      [-2.48, 1.2, 0.53],
      [-2.31, 1.2, 0.53],
      [-3.5, 2.65, 0.53],
    ],
    [
      0.16,
      [-2.65, 1.2, 0.53],
      [-2.48, 1.2, 0.53],
      [-2.31, 1.2, 0.53],
      [-2.14, 1.2, 0.53],
    ],
    [
      0.28,
      [-2.54, -0.45, 0.41],
      [-2.37, -0.45, 0.41],
      [-2.2, -0.45, 0.41],
      [-2.03, -0.45, 0.41],
    ],
    // Every carbon sphere fits the annular sleeve before any atom overlaps the wall.
    [
      0.34,
      [-0.96, 0.44, 0.1125],
      [-0.79, 0.44, 0.1125],
      [-0.62, 0.44, 0.1125],
      [-0.45, 0.44, 0.1125],
    ],
    [
      0.4,
      [0.45, 0.44, 0.1125],
      [0.62, 0.44, 0.1125],
      [0.79, 0.44, 0.1125],
      [0.96, 0.44, 0.1125],
    ],
    [
      0.51,
      [1.85, 0.26, 0.42],
      [2.02, 0.26, 0.42],
      [2.19, 0.26, 0.42],
      [2.36, 0.26, 0.42],
    ],
    [
      0.65,
      [1.85, -0.2, 0.42],
      [2.02, -0.2, 0.42],
      [2.19, -0.2, 0.42],
      [2.85, 0.54, 0.42],
    ],
    [
      0.74,
      [0.45, -0.83, 0.1125],
      [0.62, -0.83, 0.1125],
      [0.79, -0.83, 0.1125],
      [2.82, 0.1, 0.42],
    ],
    [
      0.8,
      [-0.79, -0.83, 0.1125],
      [-0.62, -0.83, 0.1125],
      [-0.45, -0.83, 0.1125],
      [2.82, 0.1, 0.42],
    ],
    [
      0.93,
      [-2.54, -0.7, 0.41],
      [-2.37, -0.7, 0.41],
      [-2.2, -0.7, 0.41],
      [2.82, 0.1, 0.42],
    ],
    [
      1,
      [-2.65, 1.2, 0.53],
      [-2.48, 1.2, 0.53],
      [-2.31, 1.2, 0.53],
      [2.82, 0.1, 0.42],
    ],
  ];
  const camKeys = [
    [
      0,
      [-2.98, 0.76, 0.43],
      [-2.81, 0.76, 0.43],
      [-2.64, 0.76, 0.43],
      [-2.2, 3.04, 0.22],
    ],
    [
      0.16,
      [-2.98, 0.76, 0.43],
      [-2.81, 0.76, 0.43],
      [-2.64, 0.76, 0.43],
      [-2.47, 0.76, 0.43],
    ],
    [
      0.32,
      [-0.92, 0.1, 0.4],
      [-0.75, 0.1, 0.4],
      [-0.58, 0.1, 0.4],
      [-0.41, 0.1, 0.4],
    ],
    [
      0.49,
      [-0.92, 0.1, 0.4],
      [-0.75, 0.1, 0.4],
      [-0.58, 0.1, 0.4],
      [-0.41, 0.1, 0.4],
    ],
    [
      0.64,
      [2.07, 0.83, 0.35],
      [2.24, 0.83, 0.35],
      [2.41, 0.83, 0.35],
      [2.58, 0.83, 0.35],
    ],
    [
      0.77,
      [2.01, 0.52, 0.35],
      [2.18, 0.52, 0.35],
      [2.35, 0.52, 0.35],
      [2.83, -0.62, 0.37],
    ],
    [
      1,
      [1.99, -1.09, 0.37],
      [2.16, -1.09, 0.37],
      [2.33, -1.09, 0.37],
      [2.88, -0.97, 0.37],
    ],
  ];
  const animate = (atoms, keys, p) => {
    let index = 0;
    while (index < keys.length - 2 && p > keys[index + 1][0]) index++;
    const from = keys[index],
      to = keys[index + 1],
      t = ease(p, from[0], to[0]);
    for (let i = 0; i < 4; i++)
      for (let dim = 0; dim < 3; dim++)
        atoms[i].position.setComponent(
          dim,
          from[i + 1][dim] + (to[i + 1][dim] - from[i + 1][dim]) * t,
        );
  };
  const c4Labels = [
    label([-2.15, 2.44, 0.2], "玉米 · 叶肉细胞", "Maize · mesophyll cell", 3),
    label([2.11, 2.44, 0.2], "维管束鞘细胞", "Bundle-sheath cell", 3),
    label([-2.52, 1.61, 0.5], "PEPC：HCO₃⁻ + PEP", "PEPC: HCO₃⁻ + PEP", 2),
    label([0.04, 0.93, 0.7], "苹果酸 4C 跨细胞", "4C malate between cells", 2),
    label(
      [2.43, -0.7, 0.65],
      "NADP-ME → CO₂ → Rubisco",
      "NADP-ME → CO₂ → Rubisco",
      2,
    ),
    label([-0.04, -1.23, 0.64], "丙酮酸 3C 返回", "3C pyruvate returns", 2),
    label(
      [-2.39, -1.78, 0.45],
      "PPDK：ATP → AMP + PPi",
      "PPDK: ATP → AMP + PPi",
      2,
    ),
  ];
  const camLabels = [
    label(
      [0.2, 2.51, 0.12],
      "K. fedtschenkoi · 成熟叶肉细胞",
      "K. fedtschenkoi · mature mesophyll",
      3,
    ),
    label(
      [-2.26, 3.14, 0.23],
      "表皮气孔（局部示意）",
      "Epidermal stoma (inset)",
      2,
    ),
    label(
      [-0.5, -1.75, 0.46],
      "液泡 · 夜间储存苹果酸",
      "Vacuole · malic acid stored at night",
      3,
    ),
    label(
      [-2.91, 1.23, 0.46],
      "PEPC 夜间固定 HCO₃⁻",
      "PEPC fixes HCO₃⁻ at night",
      2,
    ),
    label([2.4, 1.52, 0.4], "线粒体 NAD-ME 脱羧", "Mitochondrial NAD-ME", 2),
    label(
      [2.4, -1.86, 0.44],
      "白天 · 叶绿体 Rubisco",
      "Day · chloroplast Rubisco",
      3,
    ),
    label([3.37, 2.25, 0.2], "夜间", "Night", 2),
  ];
  const bondDirection = new THREE.Vector3(),
    bondAxis = new THREE.Vector3(0, 1, 0);
  const updateBonds = (atoms, bonds, p, release) => {
    for (let i = 0; i < 3; i++) {
      const o = bonds[i];
      bondDirection.copy(atoms[i + 1].position).sub(atoms[i].position);
      o.position.copy(atoms[i].position).addScaledVector(bondDirection, 0.5);
      o.scale.set(0.025, bondDirection.length(), 0.025);
      o.quaternion.setFromUnitVectors(bondAxis, bondDirection.normalize());
      o.visible = i < 2 || (p >= 0.16 && p < release);
    }
  };
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      isCAM = parameters.strategy === "cam",
      day = ease(p, 0.47, 0.57);
    c4.visible = !isCAM;
    cam.visible = isCAM;
    animate(c4Atoms, c4Keys, p);
    animate(camAtoms, camKeys, p);
    updateBonds(c4Atoms, c4Bonds, p, 0.58);
    updateBonds(camAtoms, camBonds, p, 0.7);
    const reserve = ease(p, 0.14, 0.42) * (1 - ease(p, 0.55, 0.88));
    for (let i = 0; i < reserves.length; i++)
      reserves[i].scale.setScalar(0.2 + 0.8 * reserve);
    guardLeft.position.x = -2.65 + 0.24 * day;
    guardRight.position.x = -1.75 - 0.24 * day;
    sun.visible = day >= 0.5;
    moon.visible = day < 0.5;
    c4ATP.position.set(
      -3.12 + 0.7 * ease(p, 0.84, 0.94),
      -1.35 + 0.52 * ease(p, 0.84, 0.94),
      0.45,
    );
    for (const l of c4Labels) l.active = !isCAM;
    for (const l of camLabels) l.active = isCAM;
    camLabels[6].text = p < 0.52 ? b("夜间", "Night") : b("白天", "Day");
    group.userData = {
      process: "c4cam",
      structuralDetail:
        "cellulose wall bundles; cut bilayer edges; separate granate and reduced-grana chloroplasts; tonoplast transport sites; mitochondrial cristae",
      strategy: isCAM ? "CAM temporal separation" : "C4 spatial separation",
      species: isCAM
        ? "Kalanchoe fedtschenkoi, mature leaf"
        : "Zea mays, mature leaf",
      mainDecarboxylase: isCAM
        ? "mitochondrial NAD-ME"
        : "bundle-sheath chloroplast NADP-ME",
      initialFixation: "cytosolic PEPC uses HCO3-",
      rubiscoSite: isCAM
        ? "same mesophyll cell chloroplast"
        : "bundle-sheath chloroplast",
      timeOfDay: isCAM ? (p < 0.52 ? "night" : "day") : "day",
      stomaOpen: isCAM ? day < 0.5 : true,
      vacuolarStorage: isCAM ? reserve : 0,
      trackedCarbonAtoms: 4,
      acceptorCarbonAtoms: 3,
      capturedCarbonAtoms: p >= 0.16 ? 1 : 0,
      decarboxylatedCarbonAtoms: p >= (isCAM ? 0.77 : 0.65) ? 1 : 0,
      c4AcceptorRegenerated: !isCAM && p >= 0.98,
    };
  }
  update(0);
  return {
    group,
    update,
    labels: [...c4Labels, ...camLabels],
    camera: { position: [0, 1.8, 12.4], target: [0, 0.2, 0] },
  };
}
export default {
  id: "c4cam",
  title: b("C₄ 与 CAM 的二氧化碳浓缩", "CO₂ concentration in C₄ and CAM"),
  duration: 36,
  intro: b(
    "选择两种特化植物：玉米的主要 NADP-ME 型 C₄ 支路以叶肉和维管束鞘细胞分隔反应；伽蓝菜属 Kalanchoë fedtschenkoi 成熟叶的 CAM 以夜间摄碳、液泡储酸和白天脱羧分隔时间。两者仍由 Rubisco 与 Calvin 循环完成同化。碳骨架与胞间连丝均为放大的教学比例，保留完整分子通过细胞质套管的空间；不代表所有 C₄ 亚型或完整 CAM 四阶段。",
    "Choose two specialized plants: the major NADP-ME C₄ branch in maize separates reactions between mesophyll and bundle-sheath cells; CAM in mature Kalanchoë fedtschenkoi leaves separates night uptake and vacuolar acid storage from daytime decarboxylation. Both still assimilate carbon via Rubisco and the Calvin cycle. Carbon skeletons and plasmodesmata use enlarged teaching scales with room for the whole molecule in the cytoplasmic sleeve; alternative C₄ branches and the full four CAM phases are omitted.",
  ),
  controls: [
    {
      id: "strategy",
      label: b("特化植物与策略", "Specialized plant and strategy"),
      default: "c4",
      options: [
        {
          value: "c4",
          label: b("C₄ · 玉米 · 空间分隔", "C₄ · maize · spatial separation"),
        },
        {
          value: "cam",
          label: b(
            "CAM · 伽蓝菜 · 昼夜分隔",
            "CAM · Kalanchoë · day/night separation",
          ),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("分隔的位置或时间", "Separate by location or time"),
      description: b(
        "C₄ 模式同时展示两种细胞；CAM 模式展示同一叶肉细胞及表皮气孔局部示意。两种策略不会在普通植物细胞中自动发生。",
        "C₄ shows two cell types; CAM shows one mesophyll cell and an epidermal stomatal inset. These strategies are specialized, not automatic features of ordinary plant cells.",
      ),
    },
    {
      at: 0.1,
      title: b(
        "PEPC 首次固定无机碳",
        "PEPC makes the first inorganic-carbon capture",
      ),
      description: b(
        "CO₂ 水合提供 HCO₃⁻，胞质 PEPC 将其加到 3C PEP 上，形成 4C 草酰乙酸。C₄ 发生在叶肉，CAM 的主要摄取期在夜间。",
        "Hydration of CO₂ supplies HCO₃⁻, which cytosolic PEPC adds to 3C PEP to make 4C oxaloacetate. C₄ capture occurs in mesophyll; the main CAM uptake phase is at night.",
      ),
    },
    {
      at: 0.26,
      title: b("苹果酸：转运或储存", "Malate: transport or storage"),
      description: b(
        "C₄ 模式中草酰乙酸在叶肉叶绿体还原为苹果酸，再移向维管束鞘。CAM 模式中苹果酸进入液泡储存为苹果酸库，等待白天。",
        "In C₄, oxaloacetate is reduced to malate in mesophyll chloroplasts and transferred to bundle sheath. In CAM, malate enters the vacuole to build a malic-acid store until daytime.",
      ),
    },
    {
      at: 0.51,
      title: b(
        "脱羧在 Rubisco 附近供给 CO₂",
        "Decarboxylation supplies CO₂ near Rubisco",
      ),
      description: b(
        "玉米主支路在维管束鞘叶绿体通过 NADP-ME 脱羧。所示 CAM 植物白天释放液泡苹果酸，经线粒体 NAD-ME 脱羧，气孔通常关闭。",
        "The main maize branch uses NADP-ME in bundle-sheath chloroplasts. The illustrated CAM plant releases vacuolar malate in daytime for mitochondrial NAD-ME decarboxylation, usually with closed stomata.",
      ),
    },
    {
      at: 0.71,
      title: b("Rubisco 再固定", "Rubisco refixes the released carbon"),
      description: b(
        "释放的 CO₂ 进入 Calvin 循环；碳浓缩有助于抑制 Rubisco 氧合。PEPC 的首次固定并没有替代 Rubisco，CO₂ 也不是凭空产生。",
        "Released CO₂ enters the Calvin cycle; concentration helps suppress Rubisco oxygenation. Initial PEPC fixation does not replace Rubisco, and the CO₂ is not newly created carbon.",
      ),
    },
    {
      at: 0.9,
      title: b("再生受体与代价", "Regenerate the acceptor at an energy cost"),
      description: b(
        "C₄ 的 3C 丙酮酸返回叶肉叶绿体，PPDK 消耗 ATP 再生 PEP。CAM 保留的 3C 骨架进入再生代谢，并与储藏碳的昼夜周转相联；模型不展开全部反应。",
        "In C₄, 3C pyruvate returns to mesophyll chloroplasts and PPDK uses ATP to regenerate PEP. The retained CAM 3C skeleton enters regeneration metabolism linked to day/night reserve turnover; these reactions are not expanded here.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Two decarboxylases and partitioning of maize C4 metabolism (2014)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3875822/",
    },
    {
      title: "Kalanchoë PPC1 is essential for CAM (2020)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7145507/",
    },
    {
      title:
        "Malate decarboxylation by mitochondrial NAD-ME in Kalanchoë fedtschenkoi",
      url: "https://pubmed.ncbi.nlm.nih.gov/12228671/",
    },
  ],
  create,
};
