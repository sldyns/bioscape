import { bilayer, pore, ampaReceptor } from "./structural.js";
import { THREE, sceneKit, clamp, phase, bilingual as b } from "../../kit.js";

export default {
  id: "synapse",
  title: b("谷氨酸突触传递", "Glutamatergic synaptic transmission"),
  intro: b(
    "哺乳动物中枢兴奋性突触的剖面示例：突触前末梢、突触后树突与邻近星形胶质细胞。展示 Ca²⁺ 依赖的释放和 AMPA 受体响应；并非所有突触均使用谷氨酸。受体为放大的结构拓扑示意，非原子坐标。",
    "Cutaway of a mammalian central excitatory synapse: a presynaptic terminal, postsynaptic dendrite and nearby astrocyte. Shows Ca²⁺-dependent release and an AMPA receptor response; not all synapses use glutamate. Receptors are enlarged topology schematics, not atomic coordinates.",
  ),
  duration: 34,
  controls: [
    {
      id: "calcium",
      label: b("突触前 Ca²⁺ 通道", "Presynaptic Ca²⁺ channels"),
      default: "available",
      options: [
        { value: "available", label: b("可开放", "Available") },
        { value: "blocked", label: b("阻断", "Blocked") },
      ],
    },
  ],
  stages: [
    [
      0,
      "已停靠的囊泡",
      "Docked vesicle",
      "囊泡在突触前活性区已停靠并准备释放；囊泡腔与突触间隙仍不连通。",
      "A vesicle is already docked and primed at the presynaptic active zone; its lumen is not yet connected to the cleft.",
    ],
    [
      0.14,
      "动作电位到达",
      "Action potential arrives",
      "末梢去极化可打开电压门控 Ca²⁺ 通道。阻断通道时，电信号仍到达，但不触发此图中的释放。",
      "Terminal depolarization can open voltage-gated Ca²⁺ channels. With channels blocked, the electrical signal arrives but does not trigger release in this scene.",
    ],
    [
      0.26,
      "局部钙内流",
      "Local calcium influx",
      "Ca²⁺ 从细胞外进入末梢，在已准备好的囊泡旁触发钙敏感的融合装置。",
      "Ca²⁺ enters the terminal from outside, activating calcium-sensitive fusion machinery next to the primed vesicle.",
    ],
    [
      0.38,
      "膜融合与释放",
      "Membrane fusion and release",
      "融合孔使囊泡腔与细胞外间隙连通。谷氨酸经孔释放，囊泡膜成为突触前膜的一部分。",
      "A fusion pore connects the vesicle lumen to the extracellular cleft. Glutamate exits through the pore; vesicle membrane becomes part of the presynaptic membrane.",
    ],
    [
      0.56,
      "受体开放",
      "Receptors open",
      "谷氨酸在胞外侧结合 AMPA 受体，使阳离子通道开放。此处用 Na⁺ 内流表示净去极化电流；递质不穿过受体进入树突。",
      "Glutamate binds to the extracellular face of AMPA receptors and opens cation channels. Na⁺ influx represents the net depolarizing current here; transmitter does not pass through the receptor into the dendrite.",
    ],
    [
      0.78,
      "递质清除",
      "Transmitter clearance",
      "谷氨酸解离并扩散，部分经星形胶质细胞 EAAT 转运体摄取。受体关闭；本图省略转运偶联离子和后续囊泡回收。",
      "Glutamate dissociates and diffuses; some is taken up through astrocytic EAAT transporters. Receptors close. Coupled transport ions and later vesicle recycling are omitted.",
    ],
  ].map(([at, z, e, dz, de]) => ({
    at,
    title: b(z, e),
    description: b(dz, de),
  })),
  sources: [
    {
      title:
        "Nature Communications (2026) — GluA1/A2 AMPA receptor core structure",
      url: "https://www.nature.com/articles/s41467-026-71063-1",
    },
    {
      title: "NCBI Bookshelf — Chemical Synapses",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK11009/",
    },
    {
      title: "NCBI Bookshelf — Glutamate",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK10807/",
    },
    {
      title: "NCBI Bookshelf — Plasticity of Glutamate Synaptic Mechanisms",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK98204/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      box = new THREE.BoxGeometry(1, 1, 1);
    const membrane = k.material("#b5b9ae"),
      glutamate = k.material("#c78d67"),
      calcium = k.material("#a59ac0"),
      sodium = k.material("#6eaba7"),
      protein = k.material("#7794a1"),
      glial = k.material("#92ad8c");
    function slab(x, y, sx, sy, mat, z = -0.18, sz = 0.7) {
      const m = k.mesh(box, mat, [x, y, z]);
      m.scale.set(sx, sy, sz);
      return m;
    }
    slab(
      -0.25,
      1.72,
      5.6,
      2.05,
      k.material("#c8d7d3", { transparent: true, opacity: 0.17 }),
    );
    slab(
      -0.25,
      -1.7,
      5.6,
      1.6,
      k.material("#c3cbd9", { transparent: true, opacity: 0.2 }),
    );
    slab(
      3.45,
      0,
      0.7,
      3.1,
      k.material("#bacdb3", { transparent: true, opacity: 0.35 }),
    );
    slab(3.06, 0.67, 0.12, 1.42, glial);
    slab(3.06, -1.08, 0.12, 1.38, glial);
    const uptake = k.ring([3.06, -0.19, 0.25], 0.19, 0.065, glial);
    uptake.rotation.y = Math.PI / 2;
    // Bilayer has real openings at the fusion site, Ca channel and AMPA pores.
    const preSegments = [
      [-3, -1.8],
      [-1.4, -0.24],
      [0.24, 2.5],
    ];
    const postSegments = [
      [-3, -1.13],
      [-0.77, 0.77],
      [1.13, 2.5],
    ];
    bilayer(k, {
      x0: -3,
      x1: 2.5,
      y: 0.55,
      z0: -0.55,
      z1: 0.6,
      holes: [
        { x: -1.6, z: 0.25, r: 0.24 },
        { x: 0, z: 0, r: 0.29 },
      ],
    });
    bilayer(k, {
      x0: -3,
      x1: 2.5,
      y: -0.88,
      z0: -0.55,
      z1: 0.6,
      holes: [
        { x: -0.95, z: 0.25, r: 0.26 },
        { x: 0.95, z: 0.25, r: 0.26 },
      ],
    });
    const plug = new THREE.Group();
    group.add(plug);
    bilayer(k, {
      x0: -0.23,
      x1: 0.23,
      y: 0.55,
      z0: -0.22,
      z1: 0.23,
      parent: plug,
    });
    const vesicle = new THREE.Group();
    vesicle.position.set(0, 1.12, 0.04);
    vesicle.scale.z = 0.82;
    group.add(vesicle);
    const vesMat = k.material("#9eb6a0", { side: THREE.DoubleSide }),
      innerMat = k.material("#c6c3a8", { side: THREE.DoubleSide });
    for (const [r, mat] of [
      [0.56, vesMat],
      [0.514, innerMat],
    ])
      k.mesh(
        new THREE.SphereGeometry(r, 36, 24, Math.PI * 0.8, Math.PI * 1.4),
        mat,
        [0, 0, 0],
        vesicle,
      );
    for (const phi of [Math.PI * 0.8, Math.PI * 2.2])
      for (let j = 1; j < 19; j++) {
        const t = (j * Math.PI) / 20;
        for (const r of [0.56, 0.514])
          k.ball(
            [
              -r * Math.cos(phi) * Math.sin(t),
              r * Math.cos(t),
              r * Math.sin(phi) * Math.sin(t),
            ],
            0.027,
            vesMat,
            vesicle,
          );
      }
    const omega = new THREE.Group();
    group.add(omega);
    const contour = [
      [0.24, 0.55],
      [0.2, 0.7],
      [0.4, 0.83],
      [0.54, 1.1],
      [0.43, 1.43],
      [0.2, 1.62],
      [0, 1.66],
    ];
    for (const [dr, mat] of [
      [0, vesMat],
      [-0.035, innerMat],
    ]) {
      const pts = contour.map(
        ([x, y]) => new THREE.Vector2(Math.max(0.002, x + dr), y),
      );
      k.mesh(
        new THREE.LatheGeometry(pts, 44, Math.PI * 0.8, Math.PI * 1.4),
        mat,
        [0, 0, 0],
        omega,
      );
    }
    for (const phi of [Math.PI * 0.8, Math.PI * 2.2]) {
      const edge = contour.map(([r, y]) => [
        r * Math.sin(phi),
        y,
        r * Math.cos(phi),
      ]);
      k.tube(edge, 0.025, vesMat, omega, 36);
    }
    // Vesicle and target membrane are visibly connected by zipper-like SNARE bundles.
    const fusionMachinery = new THREE.Group();
    group.add(fusionMachinery);
    for (const sign of [-1, 1])
      for (let h = 0; h < 4; h++) {
        const points = [];
        for (let j = 0; j <= 30; j++) {
          const t = j / 30,
            a = t * Math.PI * 5 + (h * Math.PI) / 2;
          points.push([
            sign * (0.27 + 0.055 * t) + 0.019 * Math.cos(a),
            0.63 + t * 0.22,
            0.13 + 0.019 * Math.sin(a),
          ]);
        }
        k.tube(
          points,
          0.012,
          k.material(h % 2 ? "#b6a58b" : "#8e9ead"),
          fusionMachinery,
          36,
        );
      }
    k.ball([-0.43, 0.88, 0.17], [0.11, 0.07, 0.07], calcium, fusionMachinery);
    k.ball([-0.38, 0.99, 0.17], [0.085, 0.07, 0.065], calcium, fusionMachinery);
    const caChannel = pore(k, {
      position: [-1.6, 0.55, 0.25],
      color: "#a398bd",
      height: 0.54,
    });
    const calciumIons = Array.from({ length: 5 }, (_, i) =>
      k.ball([-1.6, 0.05, 0.24 + i * 0.015], 0.068, calcium),
    );
    const receptors = [-0.95, 0.95].map((x) => ({
      x,
      channel: ampaReceptor(k, {
        position: [x, -0.88, 0.25],
        color: "#7493a5",
        height: 0.43,
        receptor: true,
        radius: 0.14,
      }),
      ions: Array.from({ length: 3 }, () =>
        Object.assign(k.ball([x, -0.5, 0.25], 0.058, sodium), {
          name: "postsynaptic sodium ion",
        }),
      ),
    }));
    for (const x of [-0.95, 0.95]) {
      k.tube(
        [
          [x - 0.22, -1.2, 0.1],
          [x, -1.35, 0.04],
          [x + 0.22, -1.2, 0.1],
        ],
        0.047,
        k.material("#9da3b5"),
        group,
        24,
      );
      for (const dx of [-0.14, 0.14])
        k.segment([x + dx, -1.14, 0.1], [x + dx, -1.3, 0.1], 0.029, protein);
    }
    for (let j = 0; j < 3; j++) {
      const a = (j * Math.PI * 2) / 3;
      const domain = new THREE.Group();
      domain.position.set(
        3.06,
        -0.19 + 0.18 * Math.cos(a),
        0.25 + 0.18 * Math.sin(a),
      );
      group.add(domain);
      k.ball([0, 0, 0], [0.18, 0.1, 0.1], glial, domain);
      k.ball(
        [-0.13, 0, 0],
        [0.08, 0.065, 0.065],
        k.material("#b2c5a8"),
        domain,
      );
    }
    const transmitter = Array.from({ length: 20 }, (_, i) => {
      const m = k.ball([0, 1.15, 0.15], 0.045, glutamate);
      m.name = `glutamate ${i}`;
      return m;
    });
    group.updateMatrixWorld(true);
    const contactTargets = receptors.flatMap((r) =>
      [0, 2].map((i) =>
        r.channel.bindingAnchors[i].getWorldPosition(new THREE.Vector3()),
      ),
    );
    const ligandDistances = new Float64Array(4);
    // Ready vesicles remain in the terminal, distinct from the docked vesicle.
    for (const [x, y] of [
      [-1.1, 2.03],
      [1.15, 1.9],
      [1.85, 1.26],
    ])
      k.ring([x, y, 0.1], 0.24, 0.055, membrane);
    const signal = slab(-0.25, 2.5, 5.5, 0.055, sodium, 0.12, 0.08);
    const labels = [
      k.label(
        [-0.25, 2.94, 0],
        "突触前轴突末梢",
        "Presynaptic axon terminal",
        2,
      ),
      k.label(
        [-2.08, 1.05, 0.4],
        "电压门控 Ca²⁺ 通道",
        "Voltage-gated Ca²⁺ channel",
        2,
      ),
      k.label(
        [0.85, 1.3, 0.4],
        "已停靠囊泡 → 融合孔",
        "Docked vesicle → fusion pore",
        1,
      ),
      k.label(
        [-1.5, -0.15, 0.4],
        "突触间隙 · 细胞外",
        "Synaptic cleft · extracellular",
        2,
      ),
      k.label(
        [0.05, -1.51, 0.4],
        "AMPA 受体 · 突触后树突",
        "AMPA receptors · postsynaptic dendrite",
        2,
      ),
      k.label(
        [3.2, -2.04, 0.3],
        "星形胶质细胞 · EAAT 摄取",
        "Astrocyte · EAAT uptake",
        1,
      ),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        allowed = parameters.calcium !== "blocked";
      const fusion = allowed && p >= 0.38,
        caOpen = allowed && p >= 0.22 && p < 0.38;
      let receptorOpen = false;
      signal.visible = p >= 0.14 && p < 0.25;
      caChannel.setOpen(caOpen);
      fusionMachinery.visible = p < 0.65;
      calciumIons.forEach((m, i) => {
        const f = phase(p, 0.22 + i * 0.015, 0.32 + i * 0.015);
        m.visible = allowed && p >= 0.22 + i * 0.015 && p < 0.4;
        m.position.set(-1.6 + 0.65 * phase(p, 0.32, 0.4), 0.04 + 1.05 * f, 0.3);
      });
      vesicle.visible = !fusion;
      omega.visible = fusion;
      plug.visible = !fusion;
      transmitter.forEach((m, i) => {
        const angle = i * 2.39996,
          r = 0.13 + 0.13 * (i % 3),
          sx = Math.cos(angle) * r,
          sy = 1.12 + Math.sin(angle) * r;
        const release = allowed
          ? phase(p, 0.39 + i * 0.002, 0.5 + i * 0.002)
          : 0;
        const diffuse = allowed
          ? phase(p, 0.5 + i * 0.002, (i < 4 ? 0.55 : 0.61) + i * 0.002)
          : 0;
        const targetX = i < 4 ? contactTargets[i].x : Math.sin(angle) * 1.7;
        const targetY =
          i < 4 ? contactTargets[i].y : -0.28 + Math.cos(angle) * 0.21;
        const clear = allowed
          ? phase(p, 0.78 + i * 0.003, 0.91 + i * 0.003)
          : 0;
        let x = sx * (1 - release),
          y = sy + (0.2 - sy) * release;
        x += (targetX - x) * diffuse;
        y += (targetY - y) * diffuse;
        // All molecules remain extracellular until crossing the lateral EAAT opening.
        const toward = phase(clear, 0, 0.77);
        x += (2.9 - x) * toward;
        y += (-0.19 - y) * toward;
        x += (3.37 - x) * phase(clear, 0.77, 1);
        const targetZ = i < 4 ? contactTargets[i].z : 0.25;
        const z =
          (0.12 + (targetZ - 0.12) * diffuse) * (1 - clear) + 0.25 * clear;
        m.position.set(x, y, z);
        if (i < 4)
          ligandDistances[i] = m.position.distanceTo(contactTargets[i]);
        m.visible = true;
      });
      receptors.forEach((r, ri) => {
        const occupied =
          ligandDistances[ri * 2] < 0.035 &&
          ligandDistances[ri * 2 + 1] < 0.035;
        const open = allowed && p >= 0.56 && p < 0.79 && occupied;
        receptorOpen ||= open;
        r.channel.setOpen(open);
        r.ions.forEach((m, i) => {
          m.visible = open;
          const f = phase(p, 0.56 + i * 0.035, 0.69 + i * 0.035);
          m.position.set(r.x, -0.43 - 1.07 * f, 0.25);
        });
      });
      group.userData = {
        process: "synapse",
        specimen: "mammalian central glutamatergic synapse",
        calcium: allowed ? "available" : "blocked",
        calciumInflux: caOpen,
        fusionPoreOpen: fusion,
        vesicleLumenConnectedTo: "extracellular cleft when fused",
        receptorOpen,
        transmitterLocation:
          !allowed || p < 0.39
            ? "vesicle"
            : p < 0.79
              ? "extracellular cleft"
              : "astrocytic uptake",
        transmitterEntersPostsynapticCell: false,
      };
    }
    update(0);
    return {
      group,
      update,
      camera: { position: [0.3, 1, 10.8], target: [0.3, 0.35, 0] },
      labels,
    };
  },
};
