import * as THREE from "three";
import { sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { dynamicSegments, chloroplastFactory } from "./structuralDetail.js";
// Smooth kidney-shaped swept surfaces. Geometry buffers are allocated only at construction.
function kidneyGeometry(side, cutaway = false) {
  const g = new THREE.BufferGeometry(),
    positions = new Float32Array(65 * 25 * 3),
    indices = [];
  for (let i = 0; i < 64; i++)
    for (let j = 0; j < 24; j++) {
      if (cutaway && i > 10 && i < 54 && j >= 3 && j < 9) continue;
      let a = i * 25 + j,
        c = a + 25;
      if (side > 0) indices.push(a, a + 1, c, c, a + 1, c + 1);
      else indices.push(a, c, a + 1, c, c + 1, a + 1);
    }
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setIndex(indices);
  return g;
}
function fillKidney(g, side, opening, layer) {
  const a = g.attributes.position;
  for (let i = 0; i <= 64; i++) {
    const t = (Math.PI * i) / 64,
      s = Math.sin(t),
      cx = 0.075 + (0.49 + 0.68 * opening) * s,
      cy = 2.5 * Math.cos(t),
      dx = (0.49 + 0.68 * opening) * Math.cos(t),
      dy = -2.5 * s,
      n = Math.hypot(dx, dy),
      nx = -dy / n,
      ny = dx / n,
      r = (0.012 + (0.465 + 0.045 * opening) * Math.pow(s, 0.6)) * layer;
    for (let j = 0; j <= 24; j++) {
      const v = (2 * Math.PI * j) / 24;
      a.setXYZ(
        i * 25 + j,
        side * (cx + nx * r * Math.cos(v)),
        cy + ny * r * Math.cos(v),
        r * 0.73 * Math.sin(v),
      );
    }
  }
  a.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
  g.computeBoundingBox();
}
function wallGeometry(side) {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(65 * 9 * 3), 3),
  );
  const ix = [];
  for (let i = 0; i < 64; i++)
    for (let j = 0; j < 8; j++) {
      const a = i * 9 + j,
        c = a + 9;
      if (side > 0) ix.push(a, a + 1, c, c, a + 1, c + 1);
      else ix.push(a, c, a + 1, c, c + 1, a + 1);
    }
  g.setIndex(ix);
  return g;
}
function fillWall(g, side, o, layer = 1, thickness = 0.055, height = 0.045) {
  const a = g.attributes.position;
  for (let i = 0; i <= 64; i++) {
    const t = (Math.PI * i) / 64,
      s = Math.sin(t),
      cx = 0.075 + (0.49 + 0.68 * o) * s,
      cy = 2.5 * Math.cos(t),
      dx = (0.49 + 0.68 * o) * Math.cos(t),
      dy = -2.5 * s,
      n = Math.hypot(dx, dy),
      r = (0.012 + (0.465 + 0.045 * o) * Math.pow(s, 0.6)) * layer;
    for (let j = 0; j <= 8; j++) {
      const v = (2 * Math.PI * j) / 8;
      a.setXYZ(
        i * 9 + j,
        side * (cx + (dy / n) * r + thickness * Math.cos(v)),
        cy - (dx / n) * r,
        height + thickness * Math.sin(v),
      );
    }
  }
  a.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
  g.computeBoundingBox();
}
const process = {
  id: "stomata",
  title: b("气孔开闭", "Stomatal opening and closure"),
  intro: b(
    "拟南芥叶表皮中一对肾形保卫细胞，俯视并略作剖示。蓝光促进质子泵活动及离子积累，水进入后膨压升高，弯曲细胞壁使孔隙扩大。选择后半程加入 ABA，或持续光照；这是简化的渗透与力学过程，不代表所有植物气孔形状。",
    "A schematic top/cutaway view of paired kidney-shaped guard cells in Arabidopsis leaf epidermis. Blue light promotes proton pumping and ion accumulation; water uptake increases turgor and wall deformation opens the pore. Choose ABA in the second half or sustained light. This simplified osmotic and mechanical sequence does not represent every plant stomatal shape.",
  ),
  duration: 34,
  controls: [
    {
      id: "signal",
      label: b("后半程信号", "Second-half signal"),
      default: "aba",
      options: [
        { value: "aba", label: b("蓝光后加入 ABA", "Blue light, then ABA") },
        { value: "light", label: b("持续蓝光", "Sustained blue light") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("低膨压、窄孔隙", "Low turgor, narrow pore"),
      description: b(
        "两侧保卫细胞包围真正的气孔空间；厚实的向孔侧壁与周围表皮共同约束形变。",
        "Paired guard cells border an actual pore. Thick pore-facing walls and the surrounding epidermis constrain deformation.",
      ),
    },
    {
      at: 0.12,
      title: b("蓝光启动质子泵", "Blue light activates proton pumps"),
      description: b(
        "蓝光感受途径激活质膜 H⁺-ATPase，向外泵出 H⁺，膜超极化有利于 K⁺经通道进入。",
        "Blue-light sensing activates plasma-membrane H⁺-ATPases. Outward proton pumping hyperpolarizes the membrane and favors K⁺ entry through channels.",
      ),
    },
    {
      at: 0.26,
      title: b("离子积累与吸水", "Ion accumulation and water uptake"),
      description: b(
        "K⁺与配对阴离子等渗透物质积累，使水势下降；水跨膜进入，液泡和保卫细胞体积增加。",
        "Accumulated K⁺ and counter-anions lower water potential. Water enters across membranes, increasing vacuole and guard-cell volume.",
      ),
    },
    {
      at: 0.46,
      title: b("膨压驱动开孔", "Turgor drives opening"),
      description: b(
        "膨压与细胞壁结构共同使两侧保卫细胞弯曲，扩大孔隙；CO₂与水蒸气可经孔隙交换。",
        "Turgor acting against structured walls bends the guard cells apart. The wider pore permits CO₂ and water-vapor exchange.",
      ),
    },
    {
      at: 0.62,
      title: b("ABA 改变离子通量", "ABA changes ion transport"),
      description: b(
        "若加入 ABA，信号促使阴离子外流和膜去极化，进而促进 K⁺外流；若继续光照，本示意保持张开。",
        "If ABA is added, signaling promotes anion efflux and depolarization followed by K⁺ efflux. With sustained light, this schematic remains open.",
      ),
    },
    {
      at: 0.86,
      title: b("失水闭孔或保持开放", "Closure or sustained opening"),
      description: b(
        "ABA 条件下溶质减少、水外流、膨压降低，孔隙收窄。保卫细胞保持完整，过程并非质壁分离。",
        "Under ABA, solute loss and water efflux reduce turgor and narrow the pore. Guard cells remain intact; this is not plasmolysis.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Kinoshita et al. — phot1 and phot2 mediate blue light regulation of stomatal opening",
      url: "https://www.nature.com/articles/414656a",
    },
    {
      title:
        "Vahisalu et al. — SLAC1 is required for guard cell anion channel function",
      url: "https://www.nature.com/articles/nature06608",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const green = k.material("#94ac78", {
        transparent: true,
        opacity: 0.96,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      vacMat = k.material("#c9dcc0", { roughness: 0.38 }),
      wallMat = k.material("#6c8557");
    // Epidermal context consists of peripheral polygonal wall boundaries, leaving the pore unobstructed.
    const wallSegments = [
      [-3.4, -3.15, -3.4, 3.15],
      [3.4, -3.15, 3.4, 3.15],
      [-3.4, 3.15, 3.4, 3.15],
      [-3.4, -3.15, 3.4, -3.15],
      [-3.4, 0.45, -2.2, 0.85],
      [-2.2, 0.85, -1.8, 2.65],
      [3.4, -0.35, 2.2, -0.8],
      [2.2, -0.8, 1.8, -2.65],
      [-3.4, -1.7, -2.05, -2.6],
      [3.4, 1.75, 2.1, 2.6],
    ];
    for (const [x, y, a, c] of wallSegments)
      k.segment([x, y, -0.48], [a, c, -0.48], 0.075, k.material("#cbd1b2"));
    const cells = [],
      makeChloroplast = chloroplastFactory(k);
    for (const side of [-1, 1]) {
      const body = k.mesh(kidneyGeometry(side, true), green),
        vac = k.mesh(kidneyGeometry(side), vacMat),
        wall = k.mesh(wallGeometry(side), wallMat);
      body.name = "guard cell wall and intact membrane";
      vac.name = "guard cell vacuole";
      wall.name = "thick pore-facing wall";
      const plastids = [];
      for (let i = 0; i < 5; i++) {
        const m = makeChloroplast(group, 0.38);
        m.rotation.x = Math.PI / 2;
        plastids.push(m);
      }
      const nucleus = k.ball(
        [0, 0, 0],
        [0.18, 0.25, 0.12],
        k.material("#a296ad"),
      );
      const membranes = [-0.95, -0.89, 0.95, 0.89].map(() =>
        k.mesh(
          wallGeometry(side),
          k.material("#bbc6a4", { side: THREE.DoubleSide }),
        ),
      );
      membranes.forEach((m) => (m.name = "paired plasma membrane cut edge"));
      const ribs = dynamicSegments(k, 19 * 6, "#b8c59a");
      ribs.mesh.name = "radial cellulose wall bundles";
      cells.push({ side, body, vac, wall, plastids, nucleus, membranes, ribs });
    }
    const ions = [],
      water = [],
      protons = [];
    for (let i = 0; i < 16; i++) {
      ions.push(
        k.ball([0, 0, 0], 0.066, k.material(i % 2 ? "#baa574" : "#a698b2")),
      );
      water.push(k.ball([0, 0, 0], 0.05, k.material("#659ebc")));
    }
    for (let i = 0; i < 8; i++)
      protons.push(k.ball([0, 0, 0], 0.037, k.material("#cd9478")));
    const light = k.mesh(
      new THREE.ConeGeometry(0.18, 0.5, 16),
      k.material("#9fc7d9"),
      [-2.7, 2.75, 0.7],
    );
    light.rotation.z = -0.6;
    const aba = k.mesh(
      new THREE.IcosahedronGeometry(0.19, 0),
      k.material("#c09a87"),
      [2.7, 2.6, 0.6],
    );
    const labels = [
      k.label(
        [-1.8, 2.55, 0.6],
        "拟南芥 · 成对保卫细胞",
        "Arabidopsis · guard-cell pair",
        3,
      ),
      k.label([0, -0.05, 0.65], "气孔孔隙", "Stomatal pore", 3),
      k.label([1.35, -2.15, 0.6], "向孔侧厚壁", "Thick pore-facing wall", 2),
      k.label([-3.05, 0.2, 0.7], "K⁺ / 阴离子", "K⁺ / counter-anions", 2),
      k.label([2.8, 1.15, 0.6], "水 · 膨压", "Water · turgor", 2),
      k.label([-2.65, 2.75, 0.8], "蓝光", "Blue light", 1),
      k.label([2.65, 2.65, 0.8], "ABA", "ABA", 2),
    ];
    function update(value, parameters = {}) {
      const p = clamp(value),
        hasABA = parameters.signal !== "light",
        opened = ease(p, 0.22, 0.49),
        closed = hasABA ? ease(p, 0.69, 0.94) : 0,
        o = opened * (1 - closed);
      for (const c of cells) {
        fillKidney(c.body.geometry, c.side, o, 1);
        fillKidney(c.vac.geometry, c.side, o, 0.7);
        fillWall(c.wall.geometry, c.side, o);
        c.membranes.forEach((m, i) =>
          fillWall(
            m.geometry,
            c.side,
            o,
            [-0.95, -0.89, 0.95, 0.89][i],
            0.013,
            0.075,
          ),
        );
        let ribIndex = 0;
        for (let n = 0; n < 19; n++) {
          const t = 0.22 + (n * (Math.PI - 0.44)) / 18,
            s = Math.sin(t),
            cx = 0.075 + (0.49 + 0.68 * o) * s,
            cy = 2.5 * Math.cos(t),
            dx = (0.49 + 0.68 * o) * Math.cos(t),
            dy = -2.5 * s,
            length = Math.hypot(dx, dy),
            r = 0.012 + (0.465 + 0.045 * o) * Math.pow(s, 0.6);
          for (const j of [0, 1, 2, 9, 10, 11]) {
            const a = (j * Math.PI) / 12,
              b = ((j + 1) * Math.PI) / 12;
            c.ribs.put(
              ribIndex++,
              c.side * (cx - (dy / length) * r * Math.cos(a)),
              cy + (dx / length) * r * Math.cos(a),
              0.01 + r * 0.73 * Math.sin(a),
              c.side * (cx - (dy / length) * r * Math.cos(b)),
              cy + (dx / length) * r * Math.cos(b),
              0.01 + r * 0.73 * Math.sin(b),
              0.012,
            );
          }
        }
        c.ribs.finish();
        c.plastids.forEach((m, i) => {
          const t = 0.5 + i * 0.53;
          m.position.set(
            c.side * (0.075 + (0.49 + 0.68 * o) * Math.sin(t) + 0.12),
            2.5 * Math.cos(t),
            0.29,
          );
        });
        c.nucleus.position.set(c.side * (0.6 + 0.64 * o), -0.82, 0.27);
      }
      const influx = p > 0.21 && p < 0.48,
        efflux = hasABA && p > 0.66 && p < 0.93;
      ions.forEach((m, i) => {
        m.visible = influx || efflux;
        const s = i % 2 ? -1 : 1,
          t = (p * 5 + i / 8) % 1,
          inner = 0.6 + 0.68 * o;
        m.position.set(
          s * (efflux ? inner + (2.85 - inner) * t : 2.85 - (2.85 - inner) * t),
          -1.4 + (i % 8) * 0.39,
          0.48,
        );
      });
      water.forEach((m, i) => {
        m.visible = (p > 0.28 && p < 0.5) || (hasABA && p > 0.73 && p < 0.94);
        const s = i % 2 ? -1 : 1,
          t = (p * 4 + i / 8) % 1,
          inner = 0.59 + 0.68 * o;
        m.position.set(
          s * (efflux ? inner + (3.05 - inner) * t : 3.05 - (3.05 - inner) * t),
          -1.3 + (i % 8) * 0.37,
          0.7,
        );
      });
      protons.forEach((m, i) => {
        m.visible = p > 0.12 && p < 0.29;
        const t = (p * 5 + i / 4) % 1;
        m.position.set(
          (i % 2 ? -1 : 1) * (0.75 + 1.9 * t),
          -0.85 + (i % 4) * 0.55,
          0.8,
        );
      });
      light.visible = p > 0.08 && (!hasABA || p < 0.63);
      aba.visible = hasABA && p >= 0.61;
      labels[5].active = light.visible;
      labels[6].active = aba.visible;
      group.userData = {
        process: "stomata",
        specimen: "Arabidopsis dicot guard-cell pair",
        signal: hasABA ? "blue-light-then-ABA" : "sustained-blue-light",
        opening: o,
        poreWidth: 0.176 + 1.27 * o,
        guardCellVolumeRelative: Math.pow((0.477 + 0.045 * o) / 0.477, 2),
        turgorRelative: o,
        ionFlux: influx ? "in" : efflux ? "out" : "balanced",
        waterFlux:
          p > 0.28 && p < 0.5
            ? "in"
            : hasABA && p > 0.73 && p < 0.94
              ? "out"
              : "balanced",
        protonPump: p > 0.12 && p < 0.6,
        membraneIntact: true,
        structuralDetail:
          "radial cellulose, thick inner wall, membrane cut edges and chloroplast grana",
      };
    }
    update(0);
    return {
      group,
      update,
      camera: { position: [0, 1.1, 11], target: [0, 0, 0] },
      labels,
    };
  },
};
export default process;
