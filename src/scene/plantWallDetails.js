import * as T from "three";
import { V, TAU, addMesh, ball, tube, ring, setHit } from "./specimenGeometry";
import { wall as annularWall } from "./structuralGeometry";

const wallHoles = [
  [-0.78, 0.27],
  [0.67, -0.26],
];
export function perforatedWall({
  width = 3.5,
  height = 2.2,
  depth = 0.16,
  holes = wallHoles,
  radius = 0.22,
} = {}) {
  const s = new T.Shape(),
    x = width / 2,
    y = height / 2,
    r = 0.14;
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y);
  s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r);
  s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y);
  s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-x, -y + r);
  s.quadraticCurveTo(-x, -y, -x + r, -y);
  for (const [cx, cy] of holes) {
    const h = new T.Path();
    h.absarc(cx, cy, radius, 0, TAU, true);
    s.holes.push(h);
  }
  const geo = new T.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.009,
    bevelThickness: 0.008,
    bevelSegments: 2,
    curveSegments: 64,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}
function fibrils(
  g,
  {
    z = 0,
    angle = 0,
    id = "cellulose",
    width = 3.25,
    height = 1.92,
    holes = wallHoles,
  } = {},
) {
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  for (let row = -7; row <= 7; row++)
    for (let strand = 0; strand < 3; strand++) {
      let run = [];
      const flush = () => {
        if (run.length > 1)
          tube(g, run, 0.0095, strand === 1 ? "#8b9d68" : "#afba83", id);
        run = [];
      };
      for (let i = 0; i <= 120; i++) {
        const a = -2 + (i / 120) * 4,
          b = row * 0.18 + (strand - 1) * 0.025;
        const x = a * cos - b * sin,
          y = a * sin + b * cos + 0.025 * Math.sin(a * 4 + row);
        if (
          Math.abs(x) > width / 2 ||
          Math.abs(y) > height / 2 ||
          holes.some(([hx, hy]) => Math.hypot(x - hx, y - hy) < 0.245)
        ) {
          flush();
          continue;
        }
        run.push(V(x, y, z + 0.007 * Math.sin(i * 0.8 + strand)));
      }
      flush();
    }
}
function wallPatch() {
  const g = new T.Group();
  // These are adjoining regions of one wall, not separated laminate sheets.
  const layerDepth = 0.2;
  for (const [z, c] of [
    [-0.2, "#c4c3a1"],
    [0, "#bebf97"],
    [0.2, "#c9caaa"],
  ]) {
    const m = addMesh(
      g,
      perforatedWall({ depth: layerDepth }),
      c,
      "wallMatrix",
      {
        roughness: 0.72,
      },
    );
    m.position.z = z;
    fibrils(g, {
      z: z + layerDepth / 2 + 0.01,
      angle: z < 0 ? -0.32 : z > 0 ? 0.42 : 0.08,
    });
  }
  for (const [x, y] of wallHoles) {
    const channel = plasmodesma({ context: false });
    setHit(channel, "plasmodesmata");
    // Preserve the pore diameter, while joining its membrane mouths to both
    // wall faces. A uniform scale left the mouths floating beyond the wall.
    channel.scale.set(0.46, 0.46, (layerDepth * 1.5) / 0.78);
    channel.position.set(x, y, 0);
    g.add(channel);
  }
  g.rotation.set(-0.2, -0.38, -0.06);
  g.userData.partAnchors = {
    cellulose: [-0.4, 0.8, 0.3],
    wallMatrix: [1.48, 0.7, 0.3],
    plasmodesmata: [-0.78, 0.27, 0.42],
  };
  g.userData.landmarks = [
    {
      zh: "壁内多糖基质",
      en: "Polysaccharide matrix",
      position: [1.35, -0.6, 0.2],
    },
  ];
  return g;
}
function cellulose() {
  const g = new T.Group();
  // Chain number and spacing are illustrative, not a claimed microfibril stoichiometry.
  for (let row = -1; row <= 1; row++)
    for (let col = -2; col <= 2; col++) {
      const points = [];
      for (let i = 0; i <= 100; i++) {
        const t = i / 100,
          a = t * 0.48,
          x = row * 0.087,
          z = col * 0.083;
        points.push(
          V(
            x * Math.cos(a) - z * Math.sin(a),
            t * 2.7 - 1.35,
            x * Math.sin(a) + z * Math.cos(a),
          ),
        );
      }
      tube(
        g,
        points,
        0.031,
        (col + row) % 2 ? "#96aa70" : "#c1c792",
        "glucanChain",
      );
      for (let i = 0; i < 18; i++) {
        const t = (i + 0.5) / 18,
          a = t * 0.48,
          x = row * 0.087,
          z = col * 0.083;
        ball(
          g,
          [
            x * Math.cos(a) - z * Math.sin(a),
            t * 2.7 - 1.35,
            x * Math.sin(a) + z * Math.cos(a),
          ],
          [0.039, 0.046, 0.039],
          i % 2 ? "#b0ba82" : "#90a266",
          "glucanChain",
        );
      }
    }
  for (let i = 0; i < 12; i++) {
    const y = -1.18 + i * 0.21;
    tube(
      g,
      [
        [-0.1, y, -0.08],
        [0.1, y + 0.02, -0.08],
      ],
      0.0055,
      "#cbd0b2",
      "glucanChain",
    );
  }
  g.rotation.set(0.18, 0.3, 0.66);
  g.userData.landmarks = [
    {
      zh: "平行β-葡聚糖链",
      en: "Parallel beta-glucan chains",
      position: [0.14, 0.9, 0.12],
    },
    {
      zh: "链间相互作用（示意）",
      en: "Interchain interactions (schematic)",
      position: [0, -0.48, 0.11],
    },
  ];
  return g;
}
function glucanChain() {
  const g = new T.Group();
  for (let unit = 0; unit < 6; unit++) {
    const center = V((unit - 2.5) * 0.49, 0, 0),
      points = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      points.push(
        center
          .clone()
          .add(
            V(
              0.205 * Math.cos(a),
              0.16 * Math.sin(a) * (unit % 2 ? -1 : 1),
              k % 2 ? 0.035 : -0.035,
            ),
          ),
      );
    }
    for (let k = 0; k < 6; k++) {
      ball(
        g,
        points[k].toArray(),
        [0.039, 0.039, 0.039],
        k === 1 ? "#c08d7f" : "#a8b681",
        "glucanChain",
      );
      tube(
        g,
        [points[k], points[(k + 1) % 6]],
        0.019,
        "#a2ae7b",
        "glucanChain",
      );
    }
    const side = points[2].clone().add(V(-0.03, unit % 2 ? -0.15 : 0.15, 0.03));
    tube(g, [points[2], side], 0.016, "#a2ae7b", "glucanChain");
    ball(g, side.toArray(), [0.035, 0.035, 0.035], "#a8b681", "glucanChain");
    if (unit < 5) {
      const oxygen = center.clone().add(V(0.245, 0, 0.035));
      ball(
        g,
        oxygen.toArray(),
        [0.036, 0.036, 0.036],
        "#c08d7f",
        "glucanChain",
      );
      tube(
        g,
        [points[0], oxygen, V(center.x + 0.285, 0, 0.035)],
        0.017,
        "#a3ae82",
        "glucanChain",
      );
    }
  }
  g.rotation.set(0.22, -0.18, 0.13);
  g.userData.landmarks = [
    { zh: "β(1→4)连接", en: "Beta(1→4) linkage", position: [0, 0, 0.035] },
    {
      zh: "相邻糖单元交替取向",
      en: "Alternating glucosyl orientation",
      position: [-0.5, 0.22, 0.02],
    },
  ];
  return g;
}
function wallMatrix() {
  const g = new T.Group();
  for (let i = 0; i < 10; i++) {
    const p = Array.from({ length: 56 }, (_, j) => {
      const t = j / 55;
      return V(
        t * 2.6 - 1.3,
        (i - 4.5) * 0.16 + 0.12 * Math.sin(t * 6 + i),
        0.18 * Math.sin(t * 5 + i * 0.7),
      );
    });
    tube(g, p, 0.014, i % 2 ? "#b8ab80" : "#a8bb9a", "wallMatrix");
    for (let j = 8; j < 50; j += 13) {
      const a = p[j],
        b = a.clone().add(V(0.06, 0.13, 0.1));
      tube(
        g,
        [a, b, b.clone().add(V(-0.05, 0.07, 0.04))],
        0.012,
        "#bdc4a1",
        "wallMatrix",
      );
    }
  }
  for (const x of [-0.85, 0.86])
    for (let k = 0; k < 4; k++)
      tube(
        g,
        [
          [x + k * 0.024, -1, -0.12],
          [x + 0.05 + k * 0.024, 0, -0.08],
          [x + k * 0.024, 1, 0.01],
        ],
        0.02,
        "#849b69",
        "wallMatrix",
      );
  g.userData.landmarks = [
    {
      zh: "果胶与半纤维素网络",
      en: "Pectin and hemicellulose network",
      position: [0.12, 0.1, 0.24],
    },
    {
      zh: "邻近微纤丝（背景）",
      en: "Adjacent microfibril (context)",
      position: [0.86, 0.7, 0],
    },
  ];
  g.rotation.set(0.18, -0.3, -0.12);
  return g;
}
function channelMembrane(g, id = "pdMembrane") {
  for (const [start, end, cap] of [
    [0.2 * Math.PI, 1.8 * Math.PI, false],
    [1.8 * Math.PI, 2.2 * Math.PI, true],
  ]) {
    const m = annularWall(g, 0.44, 0.035, 1.55, start, end, "#8eaea2", id);
    m.rotation.x = Math.PI / 2;
    m.userData.cap = cap;
  }
  for (const z of [-0.78, 0.78]) {
    const m = addMesh(
      g,
      perforatedWall({
        width: 1.7,
        height: 1.55,
        depth: 0.028,
        holes: [[0, 0]],
        radius: 0.405,
      }),
      "#a3bfb0",
      id,
      { transparent: true, opacity: 0.4, depthWrite: false },
    );
    m.position.z = z;
    ring(g, [0, 0, z], 0.43, 0.024, "#779e91", id);
  }
}
function desmotubule(g, id = "pdDesmotubule") {
  const m = annularWall(g, 0.103, 0.041, 1.9, 0, TAU, "#aa93ba", id);
  m.rotation.x = Math.PI / 2;
  for (const side of [-1, 1])
    for (const x of [-1, 1])
      tube(
        g,
        [
          [0, 0, side * 0.91],
          [x * 0.17, 0, side * 1.0],
          [x * 0.36, 0.06, side * 1.07],
        ],
        0.048,
        "#bba7c5",
        id,
      );
}
function plasmodesma({ context = true } = {}) {
  const g = new T.Group();
  channelMembrane(g);
  desmotubule(g);
  for (let level = 0; level < 3; level++)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU,
        z = (level - 1) * 0.43;
      tube(
        g,
        [
          [Math.cos(a) * 0.11, Math.sin(a) * 0.11, z],
          [Math.cos(a) * 0.39, Math.sin(a) * 0.39, z],
        ],
        0.008,
        "#bec8b2",
        "plasmodesmata",
      );
    }
  if (context) {
    const m = addMesh(
      g,
      perforatedWall({
        width: 1.8,
        height: 1.65,
        depth: 1.32,
        holes: [[0, 0]],
        radius: 0.46,
      }),
      "#c8c49b",
      "plasmodesmata",
      { transparent: true, opacity: 0.18, depthWrite: false },
    );
    m.userData.context = true;
  }
  g.userData.partAnchors = {
    pdMembrane: [0.4, 0, 0.66],
    pdDesmotubule: [0, 0, 1],
  };
  g.userData.landmarks = [
    { zh: "细胞质套隙", en: "Cytoplasmic sleeve", position: [0.25, 0, 0.79] },
    {
      zh: "相邻细胞的膜连续",
      en: "Continuous membranes between cells",
      position: [0.65, 0.5, 0.79],
    },
  ];
  if (context) g.rotation.set(0.23, -0.57, -0.1);
  return g;
}
export function plantWallDetail(id) {
  if (id === "cellWall") return wallPatch();
  if (id === "cellulose") return cellulose();
  if (id === "glucanChain") return glucanChain();
  if (id === "wallMatrix") return wallMatrix();
  if (id === "plasmodesmata") return plasmodesma();
  if (id === "pdMembrane") {
    const g = new T.Group();
    channelMembrane(g, id);
    g.rotation.set(0.22, -0.55, 0);
    g.userData.landmarks = [
      {
        zh: "膜包围细胞质通道",
        en: "Membrane-lined cytoplasmic channel",
        position: [0.43, 0, 0.6],
      },
    ];
    return g;
  }
  if (id === "pdDesmotubule") {
    const g = new T.Group();
    desmotubule(g, id);
    g.rotation.set(0.3, -0.55, 0);
    g.userData.landmarks = [
      {
        zh: "受压缩的内质网管",
        en: "Compressed ER-derived tube",
        position: [0.1, 0, 0.25],
      },
      {
        zh: "与相邻内质网相连",
        en: "Continuity with adjacent ER",
        position: [0.3, 0.05, 0.99],
      },
    ];
    return g;
  }
  return null;
}
