import * as T from "three";
import { V, TAU, ball, tube, addMesh, setHit } from "./specimenGeometry";
import { wall } from "./structuralGeometry";
import { perforatedWall } from "./plantWallDetails";

function pilusRod(count = 45) {
  const g = new T.Group();
  for (let i = 0; i < count; i++) {
    const a = (i * TAU) / 3.13,
      y = (i - (count - 1) / 2) * 0.047;
    const sub = ball(
      g,
      [0.125 * Math.cos(a), y, 0.125 * Math.sin(a)],
      [0.095, 0.078, 0.125],
      i % 3 ? "#a3b197" : "#bbbea0",
      "pilusRod",
    );
    sub.rotation.y = -a;
    if (i % 2 === 0)
      tube(
        g,
        [
          [0.14 * Math.cos(a - 0.4), y - 0.05, 0.14 * Math.sin(a - 0.4)],
          [0.19 * Math.cos(a), y, 0.19 * Math.sin(a)],
          [0.14 * Math.cos(a + 0.4), y + 0.05, 0.14 * Math.sin(a + 0.4)],
        ],
        0.01,
        "#879e89",
        "pilusRod",
      );
  }
  g.userData.landmarks = [
    {
      zh: "FimA亚基沿螺旋堆积",
      en: "FimA subunits pack helically",
      position: [0.19, 0.3, 0.08],
    },
  ];
  return g;
}
function pilusTip() {
  const g = new T.Group();
  for (const [p, s, c] of [
    [[0, -0.44, 0], [0.1, 0.18, 0.095], "#9eae98"],
    [[0.035, -0.15, 0], [0.1, 0.16, 0.095], "#b7bd9f"],
    [[0.04, 0.12, 0], [0.13, 0.19, 0.105], "#a6b797"],
    [[0.04, 0.45, 0], [0.17, 0.2, 0.14], "#c1b796"],
  ]) {
    ball(g, p, s, c, "pilusTip");
    for (let j = 0; j < 4; j++)
      tube(
        g,
        Array.from({ length: 16 }, (_, i) => {
          const t = (i / 15) * Math.PI;
          return V(
            p[0] + s[0] * Math.sin(t),
            p[1] + s[1] * Math.cos(t),
            p[2] + s[2] * (j - 1.5) * 0.32,
          );
        }),
        0.009,
        "#92a18b",
        "pilusTip",
      );
  }
  ball(g, [0.04, 0.69, 0.02], [0.04, 0.04, 0.04], "#b6a0bd", "pilusTip");
  g.userData.landmarks = [
    {
      zh: "FimH黏附结构域",
      en: "FimH adhesin domain",
      position: [0.11, 0.47, 0.11],
    },
    {
      zh: "FimF/FimG接头（示意）",
      en: "FimF/FimG adaptors (schematic)",
      position: [0, -0.28, 0.09],
    },
    {
      zh: "甘露糖结合端",
      en: "Mannose-binding end",
      position: [0.04, 0.69, 0.02],
    },
  ];
  return g;
}
export function typeOnePilus() {
  const g = new T.Group(),
    rod = pilusRod(),
    tip = pilusTip();
  tip.position.y = 1.53;
  tip.scale.setScalar(0.75);
  g.add(rod, tip);
  g.userData.partAnchors = {
    pilusRod: [0.14, -0.1, 0.1],
    pilusTip: [0.07, 1.8, 0.08],
  };
  g.rotation.set(0.08, -0.2, -0.24);
  return g;
}
// Protein-domain packing leaves a genuine central channel; no solid core tube.
function axialTube(points, id, { rows = 40, radius = 0.15, cap = true } = {}) {
  const g = new T.Group(),
    curve = new T.CatmullRomCurve3(points),
    frames = curve.computeFrenetFrames(rows, false);
  for (let i = 0; i <= rows; i++) {
    const p = curve.getPointAt(i / rows);
    for (let k = 0; k < 11; k++) {
      const a = (k * TAU) / 11 + i * 0.13;
      const radial = frames.normals[i]
        .clone()
        .multiplyScalar(Math.cos(a))
        .addScaledVector(frames.binormals[i], Math.sin(a));
      const m = ball(
        g,
        p.clone().addScaledVector(radial, radius).toArray(),
        [radius * 0.4, radius * 0.43, radius * 0.37],
        k % 3 ? "#9eb095" : "#b5c09e",
        id,
      );
      m.quaternion.setFromUnitVectors(V(0, 1, 0), frames.tangents[i]);
      if (cap && radial.z > 0.15) m.userData.cap = true;
    }
  }
  return g;
}
export function flagellarHook() {
  const p = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 39) * 1.4;
    return V(0.4 * (1 - Math.cos(a)), 0.4 * Math.sin(a), 0);
  });
  const g = axialTube(p, "flagellarHook", { rows: 18, radius: 0.075 });
  g.userData.landmarks = [
    {
      zh: "弯钩 · 传递转矩的柔性接头",
      en: "Hook · Flexible torque-transmitting joint",
      position: [0.19, 0.34, 0.06],
    },
    {
      zh: "贯穿的轴向通道",
      en: "Continuous axial channel",
      position: [0, 0, 0],
    },
  ];
  return g;
}
export function filamentDetail() {
  const points = Array.from({ length: 80 }, (_, i) =>
    V(
      0.18 * Math.sin((i / 79) * Math.PI * 1.2),
      (i / 79 - 0.5) * 2.1,
      0.08 * Math.cos((i / 79) * Math.PI * 1.2),
    ),
  );
  const g = axialTube(points, "flagellarFilament", { rows: 40, radius: 0.17 });
  g.userData.landmarks = [
    {
      zh: "11条原丝（所选典型结构）",
      en: "11 protofilaments in this representative type",
      position: [0.31, 0.13, 0.1],
    },
    {
      zh: "中央窄通道",
      en: "Narrow central channel",
      position: [0, -1.05, 0.08],
    },
  ];
  g.rotation.set(0.12, -0.25, -0.18);
  return g;
}
function annulus(g, r, t, h, y, c, id) {
  const body = wall(g, r, t, h, Math.PI * 0.16, Math.PI * 1.84, c, id);
  body.position.y = y;
  const cap = wall(g, r, t, h, Math.PI * 1.84, Math.PI * 2.16, c, id);
  cap.position.y = y;
  cap.userData.cap = true;
  return body;
}
function rotor(g) {
  annulus(g, 0.35, 0.085, 0.22, -0.49, "#9cb2a1", "motorRotor");
  // The MS-ring hub seats the rod but leaves its export channel open.
  annulus(g, 0.27, 0.215, 0.11, -0.23, "#aabdac", "motorRotor");
  for (let k = 0; k < 16; k++) {
    const a = (k * TAU) / 16;
    const connector = tube(
      g,
      [
        [0.3 * Math.cos(a), -0.4, 0.3 * Math.sin(a)],
        [0.278 * Math.cos(a), -0.34, 0.278 * Math.sin(a)],
        [0.25 * Math.cos(a), -0.275, 0.25 * Math.sin(a)],
      ],
      0.022,
      "#9db19e",
      "motorRotor",
    );
    if (Math.cos(a) > Math.cos(Math.PI * 0.16)) connector.userData.cap = true;
  }
  for (let k = 0; k < 32; k++) {
    const a = (k * TAU) / 32;
    const subunit = ball(
      g,
      [0.326 * Math.cos(a), -0.5, 0.326 * Math.sin(a)],
      [0.032, 0.086, 0.031],
      k % 2 ? "#b0bca3" : "#8ea799",
      "motorRotor",
    );
    if (Math.cos(a) > Math.cos(Math.PI * 0.16)) subunit.userData.cap = true;
  }
}
function bushings(g) {
  annulus(g, 0.083, 0.035, 0.99, 0.17, "#aaa98c", "motorBushing");
  annulus(g, 0.175, 0.056, 0.07, 0.18, "#c4b494", "motorBushing");
  annulus(g, 0.18, 0.061, 0.075, 0.51, "#b3bda2", "motorBushing");
}
function stators(g) {
  for (let k = 0; k < 9; k++) {
    const a = (k * TAU) / 9,
      cx = 0.41 * Math.cos(a),
      cz = 0.41 * Math.sin(a);
    for (let h = 0; h < 5; h++) {
      const b = (h * TAU) / 5;
      tube(
        g,
        [
          [cx + 0.045 * Math.cos(b), -0.34, cz + 0.045 * Math.sin(b)],
          [cx + 0.045 * Math.cos(b), -0.11, cz + 0.045 * Math.sin(b)],
        ],
        0.023,
        "#b7b38f",
        "motorStator",
      );
    }
    tube(
      g,
      [
        [cx, -0.18, cz],
        [cx, 0.15, cz],
      ],
      0.025,
      "#90a9a0",
      "motorStator",
    );
    // Connect the membrane unit to the cytoplasmic rotor and seat its
    // periplasmic end at the peptidoglycan plane (domain shapes are schematic).
    ball(
      g,
      [cx * 0.88, -0.37, cz * 0.88],
      [0.047, 0.07, 0.047],
      "#a8ae90",
      "motorStator",
    );
    ball(g, [cx, 0.16, cz], [0.065, 0.026, 0.065], "#9aafa0", "motorStator");
  }
}
export function motorAssembly({ context = true } = {}) {
  const g = new T.Group();
  rotor(g);
  bushings(g);
  stators(g);
  if (context)
    for (const [y, c, opacity] of [
      [0.51, "#a5bbb0", 0.28],
      [0.18, "#c4b28a", 0.2],
      [-0.23, "#96b3a5", 0.28],
    ]) {
      const geo = perforatedWall({
        width: 1.8,
        height: 1.5,
        depth: 0.048,
        holes: [[0, 0]],
        radius: y < 0 ? 0.31 : 0.2,
      });
      geo.rotateX(Math.PI / 2);
      const m = addMesh(g, geo, c, "flagellarMotor", {
        transparent: true,
        opacity,
        depthWrite: false,
      });
      m.position.y = y;
    }
  g.userData.partAnchors = {
    motorRotor: [-0.3, -0.48, 0.16],
    motorBushing: [0, 0.43, 0.08],
    motorStator: [0.4, -0.18, 0.08],
  };
  g.userData.landmarks = [
    { zh: "外膜", en: "Outer membrane", position: [-0.65, 0.51, 0.48] },
    { zh: "肽聚糖", en: "Peptidoglycan", position: [-0.65, 0.18, 0.48] },
    {
      zh: "细胞膜 · 下方为细胞质",
      en: "Cytoplasmic membrane · Cytoplasm below",
      position: [-0.65, -0.23, 0.48],
    },
  ];
  g.rotation.set(0.2, -0.38, -0.04);
  return g;
}
export function flagellumAssembly({ context = true } = {}) {
  const g = new T.Group(),
    motor = motorAssembly({ context });
  motor.rotation.set(0, 0, 0);
  setHit(motor, "flagellarMotor");
  g.add(motor);
  const hook = flagellarHook();
  hook.position.y = 0.66;
  g.add(hook);
  const start = V(0.4 * (1 - Math.cos(1.4)), 0.66 + 0.4 * Math.sin(1.4), 0),
    winding = TAU * 2.2,
    initialSpeed = Math.hypot(0.21 * winding, 1.8),
    joinCorrection = V(Math.sin(1.4), Math.cos(1.4), 0)
      .multiplyScalar(initialSpeed)
      .sub(V(0.21 * winding, 1.8, 0)),
    points = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    points.push(
      start
        .clone()
        .add(
          V(
            0.21 * Math.sin(t * winding),
            t * 1.8,
            0.21 * (Math.cos(t * winding) - 1),
          ),
        )
        // Match the hook's exit tangent, then smoothly recover the helix.
        .addScaledVector(joinCorrection, t * (1 - t) ** 6),
    );
  }
  const f = axialTube(points, "flagellarFilament", {
    rows: 100,
    radius: 0.072,
    cap: false,
  });
  g.add(f);
  g.userData.partAnchors = {
    flagellarMotor: [-0.22, -0.1, 0.22],
    flagellarHook: [0.18, 0.96, 0.1],
    flagellarFilament: [0.4, 2, 0.1],
  };
  g.rotation.set(0.15, -0.2, -0.24);
  return g;
}
export function bacterialAppendageDetail(id) {
  if (id === "pili") return typeOnePilus();
  if (id === "pilusRod") return pilusRod(58);
  if (id === "pilusTip") return pilusTip();
  if (id === "flagellum") return flagellumAssembly();
  if (id === "flagellarFilament") return filamentDetail();
  if (id === "flagellarHook") return flagellarHook();
  if (id === "flagellarMotor") return motorAssembly();
  if (["motorRotor", "motorBushing", "motorStator"].includes(id)) {
    const g = new T.Group();
    ({ motorRotor: rotor, motorBushing: bushings, motorStator: stators })[id](
      g,
    );
    g.userData.landmarks = {
      motorRotor: [
        {
          zh: "MS环 · 细胞膜位置",
          en: "MS ring · Cytoplasmic membrane",
          position: [0.26, -0.23, 0],
        },
        {
          zh: "C环 · 细胞质侧",
          en: "C ring · Cytoplasmic side",
          position: [0.32, -0.5, 0.12],
        },
      ],
      motorBushing: [
        {
          zh: "L环 · 外膜处",
          en: "L ring · Outer membrane",
          position: [0.17, 0.51, 0],
        },
        {
          zh: "P环 · 肽聚糖处",
          en: "P ring · Peptidoglycan",
          position: [0.17, 0.18, 0],
        },
        { zh: "杆内通道", en: "Axial rod channel", position: [0, 0.665, 0] },
      ],
      motorStator: [
        {
          zh: "膜内离子驱动部件（示意）",
          en: "Membrane ion-driven unit (schematic)",
          position: [0.4, -0.23, 0.04],
        },
        {
          zh: "朝周质的锚定部分",
          en: "Periplasm-facing anchor",
          position: [0.41, 0.15, 0],
        },
      ],
    }[id];
    g.rotation.set(0.28, -0.4, 0);
    return g;
  }
  return null;
}
