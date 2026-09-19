import { leafletEdge } from "./structuralDetail.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
function create() {
  const k = sceneKit(),
    { group } = k,
    patch = new THREE.Group();
  group.add(patch);
  const pm = k.material("#98b6a6", {
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    wall = k.material("#d2c29a", {
      transparent: true,
      opacity: 0.19,
      depthWrite: false,
    });
  const cellulose = k.material("#b9a271"),
    newCellulose = k.material("#d3ac6e"),
    cesa = k.material("#688d84"),
    micro = k.material("#9b92af"),
    pressure = k.material("#83aeb7");
  const box = new THREE.BoxGeometry(1, 1, 1);
  const panel = k.mesh(box, pm, [0, 0, 0], patch);
  panel.scale.set(5, 4, 0.1);
  const wallPanel = k.mesh(box, wall, [0, 0, 0.6], patch);
  wallPanel.scale.set(5, 4, 0.85);
  // Existing extracellular fibers and cytosolic microtubules are separate layers.
  for (let i = 0; i < 7; i++) {
    const y = -1.8 + i * 0.6;
    k.segment([-2.42, y, 0.9], [2.42, y + 0.12, 0.9], 0.045, cellulose, patch);
    if (i < 6)
      k.segment(
        [-2.45, y + 0.25, -0.28],
        [2.45, y + 0.25, -0.28],
        0.032,
        micro,
        patch,
      );
  }
  leafletEdge(k, patch, cesa);
  // Twisted glucan bundles reinforce the wall; matrix tethers cross between bundles.
  for (let row = 0; row < 7; row++)
    for (let strand = 0; strand < 3; strand++) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const x = -2.42 + (i / 96) * 4.84,
          a = (i / 96) * Math.PI * 18 + strand * 2.094;
        pts.push([
          x,
          -1.8 + row * 0.6 + 0.045 * Math.sin(a),
          0.95 + 0.045 * Math.cos(a),
        ]);
      }
      k.tube(pts, 0.013, cellulose, patch, 128);
    }
  for (let row = 0; row < 6; row++)
    for (let i = 0; i < 4; i++)
      k.tube(
        [
          [-2 + i * 1.2, -1.78 + row * 0.6, 1],
          [-1.85 + i * 1.2, -1.48 + row * 0.6, 1.06],
          [-1.95 + i * 1.2, -1.18 + row * 0.6, 1],
        ],
        0.013,
        wall,
        patch,
        16,
      );
  const machines = [];
  for (let i = 0; i < 6; i++) {
    const machine = new THREE.Group();
    patch.add(machine);
    const direction = i % 2 === 0 ? 1 : -1;
    machine.name =
      "Six-lobed cellulose synthase rosette with cytosolic catalytic lobes";
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2;
      k.ball(
        [0.14 * Math.cos(a), 0.14 * Math.sin(a), 0],
        [0.09, 0.09, 0.16],
        cesa,
        machine,
      );
    }
    for (let lobe = 0; lobe < 6; lobe++) {
      const a = (lobe * Math.PI) / 3,
        cx = 0.18 * Math.cos(a),
        cy = 0.18 * Math.sin(a);
      for (let n = 0; n < 3; n++) {
        const ang = a + (n - 1) * 0.65;
        k.ball(
          [cx + 0.047 * Math.cos(ang), cy + 0.047 * Math.sin(ang), -0.18],
          [0.07, 0.065, 0.1],
          cesa,
          machine,
        );
        const helix = [];
        for (let j = 0; j <= 24; j++) {
          const t = j / 24;
          helix.push([
            cx + 0.025 * Math.cos(t * Math.PI * 8 + n),
            cy + 0.025 * Math.sin(t * Math.PI * 8 + n),
            -0.1 + t * 0.24,
          ]);
        }
        k.tube(helix, 0.012, cesa, machine, 32);
      }
      k.tube(
        [
          [cx, cy, 0.12],
          [cx * 0.5, cy * 0.5, 0.31],
          [0, 0, 0.51],
        ],
        0.018,
        newCellulose,
        machine,
        24,
      );
    }
    const fibers = [];
    for (let j = 0; j < 3; j++) {
      const points = [];
      for (let n = 0; n <= 128; n++) {
        const t = n / 128;
        points.push([
          t - 0.5,
          0.012 * Math.sin(t * Math.PI * 24 + j * 2),
          0.012 * Math.cos(t * Math.PI * 24 + j * 2),
        ]);
      }
      const m = k.tube(points, 0.017, newCellulose, patch, 128);
      fibers.push(m);
    }
    const outlet = k.segment(
      [0, 0, 0.13],
      [0, 0, 0.52],
      0.045,
      newCellulose,
      machine,
    );
    machines.push({ machine, fibers, outlet, direction, y: -1.55 + i * 0.6 });
  }
  const arrows = [];
  for (const y of [-1.2, 0, 1.2]) {
    const a = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, y, -1.65),
      1.05,
      pressure.color,
      0.19,
      0.12,
    );
    group.add(a);
    arrows.push(a);
  }
  const expandArrows = [];
  for (const side of [-1, 1]) {
    const a = new THREE.ArrowHelper(
      new THREE.Vector3(0, side, 0),
      new THREE.Vector3(2.85, side * 1.25, 0.4),
      0.75,
      0x83aeb7,
      0.19,
      0.12,
    );
    group.add(a);
    expandArrows.push(a);
  }
  const labels = [
    k.label([-2.5, 2.6, 1], "细胞壁 · 胞外侧", "Cell wall · extracellular", 3),
    k.label([-2.6, -2.35, 0], "质膜", "Plasma membrane", 2),
    k.label(
      [1.7, -1.2, -0.55],
      "皮层微管 · 胞质侧",
      "Cortical microtubules · cytosol",
      2,
    ),
    k.label(
      [0, 0.35, 0.45],
      "膜内纤维素合酶",
      "Membrane cellulose synthase",
      3,
    ),
    k.label(
      [-0.2, 1.8, 1.2],
      "新沉积的纤维素微纤丝",
      "New cellulose microfibrils",
      2,
    ),
    k.label([-1.1, -0.4, -1.6], "膨压作用于细胞壁", "Turgor loads the wall", 2),
  ];
  function update(value, parameters = {}) {
    const p = clamp(value),
      yielding = parameters.extensibility !== "restrained",
      deposition = ease(p, 0.14, 0.82),
      extension = yielding ? ease(p, 0.55, 1) * 0.32 : 0;
    patch.scale.y = 1 + extension;
    machines.forEach(({ machine, fibers, direction, y }) => {
      const start = -direction * 2.15,
        x = start + direction * 4.3 * deposition;
      machine.position.set(x, y, 0);
      machine.scale.y = 1 / (1 + extension);
      fibers.forEach((m, j) => {
        m.visible = p >= 0.14;
        m.position.set(
          (start + x) / 2,
          y + (j - 1) * 0.038,
          0.52 + (j - 1) * 0.018,
        );
        m.scale.set(Math.max(0.001, 4.3 * deposition), 1, 1);
      });
    });
    arrows.forEach((a) => {
      a.visible = p >= 0.46;
    });
    expandArrows.forEach((a, i) => {
      a.visible = p >= 0.55 && yielding;
      a.position.y = (i ? 1 : -1) * (1.25 + extension);
    });
    labels[0].position[1] = 2.35 * (1 + extension);
    labels[1].position[1] = -2.28 * (1 + extension);
    labels[3].position[0] = -2.15 + 4.3 * deposition;
    labels[4].active = p >= 0.2;
    labels[5].active = p >= 0.46;
    group.userData = {
      mechanism:
        "plasma membrane cellulose synthesis and separate turgor-driven wall yielding",
      species: "Arabidopsis thaliana hypocotyl epidermis",
      selectedCondition: yielding ? "yielding" : "restrained",
      celluloseDeposited: deposition,
      celluloseSide: "extracellular",
      microtubuleSide: "cytosolic",
      longitudinalExtension: extension,
      celluloseSynthesisIsNotExpansion: true,
      progress: p,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [4, 2.7, 10], target: [0, 0, 0] },
  };
}
export default {
  id: "cellWallGrowth",
  title: b("纤维素沉积与细胞壁伸展", "Cellulose deposition and wall expansion"),
  duration: 30,
  intro: b(
    "拟南芥下胚轴表皮细胞的一块局部壁面：膜内的纤维素合酶移动，在胞外沉积微纤丝。比较可松弛与受限的壁，区分新材料合成和膨压驱动的伸展。厚度、间距与时间均为示意。",
    "A local wall patch from an Arabidopsis hypocotyl epidermal cell: membrane cellulose synthases move and deposit extracellular microfibrils. Compare yielding and restrained walls to distinguish synthesis from turgor-driven extension. Thicknesses, spacing, and timing are schematic.",
  ),
  controls: [
    {
      id: "extensibility",
      label: b("壁的可伸展性", "Wall extensibility"),
      default: "yielding",
      options: [
        { value: "yielding", label: b("可松弛的壁", "Yielding wall") },
        { value: "restrained", label: b("伸展受限的壁", "Restrained wall") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("壁在膜外，微管在膜内", "Wall outside, microtubules inside"),
      description: b(
        "局部剖面区分胞外细胞壁、质膜和胞质侧皮层微管。横向微纤丝有助于限制径向扩张。",
        "The patch separates extracellular wall, plasma membrane, and cytosolic cortical microtubules. Transverse microfibrils help resist radial expansion.",
      ),
    },
    {
      at: 0.15,
      title: b("膜内合酶移动", "Synthases move in the membrane"),
      description: b(
        "纤维素合酶复合体沿质膜移动；皮层微管可参与引导排列，复合体并不是由微管马达拖动的囊泡。",
        "Cellulose synthase complexes move within the plasma membrane; cortical microtubules can guide their arrangement. They are not vesicles pulled by microtubule motors.",
      ),
    },
    {
      at: 0.32,
      title: b("在胞外沉积微纤丝", "Microfibrils form outside"),
      description: b(
        "合酶将胞质侧底物聚合并向胞外输出葡聚糖链；链聚集形成纤维素微纤丝，留下随合酶移动延长的轨迹。",
        "Synthases polymerize cytosolic substrates and extrude glucan chains extracellularly. The chains assemble into microfibrils, leaving a growing trail as complexes move.",
      ),
    },
    {
      at: 0.5,
      title: b("膨压提供机械负载", "Turgor provides the load"),
      description: b(
        "细胞内部的膨压向壁施加载荷。微纤丝沉积本身不等于细胞伸长，伸展还取决于壁能否松弛。",
        "Internal turgor loads the wall. Microfibril deposition itself is not cell elongation; extension also depends on wall yielding.",
      ),
    },
    {
      at: 0.68,
      title: b("可伸展性决定响应", "Extensibility changes the response"),
      description: b(
        "可松弛条件下，示意壁沿纵向伸展，横向纤丝之间的距离增大；受限条件下仍有沉积，但不显示持续伸展。",
        "The yielding wall extends longitudinally, increasing transverse-fiber spacing. In the restrained condition deposition continues without sustained extension.",
      ),
    },
    {
      at: 0.88,
      title: b("合成与伸展相互配合", "Synthesis and extension cooperate"),
      description: b(
        "新壁材料补充与壁松弛协调生长，但由不同机制调控。这里的条件对比是概念演示，不代表某种处理的定量结果。",
        "New wall material and wall yielding cooperate in growth but have distinct regulation. These conditions are conceptual comparisons, not quantitative treatment results.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Paredez et al. (2006), Visualization of cellulose synthase demonstrates functional association with microtubules",
      url: "https://pubmed.ncbi.nlm.nih.gov/16627697/",
    },
    {
      title:
        "Cellulose Synthesis and Cell Expansion Are Regulated by Different Mechanisms in Growing Arabidopsis Hypocotyls",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5502445/",
    },
    {
      title:
        "Cellulose synthase interactive1- and microtubule-dependent cell wall architecture is required for acid growth in Arabidopsis hypocotyls",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7260726/",
    },
  ],
  create,
};
