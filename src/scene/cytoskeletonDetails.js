import * as THREE from "three";
import { TAU, mesh, tube, proteinGeometry } from "./structuralGeometry";
export function skeletonNetwork() {
  const g = new THREE.Group();
  // Radial microtubules curve behind the nuclear volume, from the centrosomal region.
  for (let i = 0; i < 27; i++) {
    const a = (i / 27) * TAU,
      end = [Math.cos(a) * 2.66, Math.sin(a) * 2.86, -0.38],
      left = Math.cos(a) < -0.12;
    const p = [
      [0.12 + 0.06 * Math.cos(a), -0.98 + 0.06 * Math.sin(a), 1.08],
      [
        left
          ? -0.3 - 1.0 * (0.25 + 0.75 * Math.abs(Math.cos(a)))
          : 0.4 + 0.9 * (0.25 + 0.75 * Math.abs(Math.cos(a))),
        -1.48 + 0.2 * Math.sin(a),
        0.1,
      ],
      [Math.cos(a) * 1.9, Math.sin(a) * 1.96, -1.32],
      end,
    ];
    tube(g, p, 0.017, "#8caeaa", "microtubules", 96);
  }
  // A cortical mesh follows the inner cell boundary rather than the radial tracks.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU,
      p = [];
    for (let j = 0; j <= 36; j++) {
      const t = 0.75 + (j / 36) * 1.5,
        phi = a + 0.13 * Math.sin(t * 4 + i);
      p.push([
        Math.sin(t) * Math.cos(phi) * 2.79,
        Math.sin(t) * Math.sin(phi) * 3.01,
        Math.cos(t) * 2.28,
      ]);
    }
    tube(g, p, 0.012, "#a8bc96", "actin", 80);
  }
  for (let i = 0; i < 8; i++) {
    const p = [];
    for (let j = 0; j <= 80; j++) {
      const a = (j / 80) * TAU,
        t = 0.84 + i * 0.17 + 0.035 * Math.sin(a * 7 + i);
      p.push([
        Math.sin(t) * Math.cos(a) * 2.79,
        Math.sin(t) * Math.sin(a) * 3.01,
        Math.cos(t) * 2.28,
      ]);
    }
    tube(g, p, 0.011, "#a8bc96", "actin", 160);
  }
  // Intermediate filaments form a perinuclear cage connected toward the periphery.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU,
      p = [];
    for (let j = 0; j <= 36; j++) {
      const t = (j / 36) * TAU;
      const angle = t + 0.05 * Math.sin(t * 3 + a);
      p.push([
        -0.45 + Math.cos(angle) * Math.cos(a) * 1.31,
        0.36 + Math.sin(angle) * 1.43,
        0.5 + Math.cos(angle) * Math.sin(a) * 1.15,
      ]);
    }
    tube(g, p, 0.014, "#a7a3bb", "intermediate", 110);
    const start = p[(i * 7 + 3) % 36],
      phi = Math.atan2((start[1] - 0.36) / 1.43, (start[0] + 0.45) / 1.31);
    tube(
      g,
      [
        start,
        [
          start[0] + 0.45 * Math.cos(phi),
          start[1] + 0.45 * Math.sin(phi),
          start[2],
        ],
        [Math.cos(phi) * 1.92, Math.sin(phi) * 2.1, start[2]],
        [Math.cos(phi) * 2.6, Math.sin(phi) * 2.81, -0.25],
      ],
      0.014,
      "#a7a3bb",
      "intermediate",
      80,
    );
  }
  g.userData.partAnchors = {
    microtubules: [1.8, -1.22, -0.5],
    actin: [-2.62, -0.7, 0.4],
    intermediate: [-0.95, 1.62, -0.45],
  };
  return g;
}
function microtubule() {
  const g = new THREE.Group(),
    geo = proteinGeometry(),
    rows = 18,
    r = 0.38,
    rise = 0.145;
  for (let p = 0; p < 13; p++)
    for (let j = 0; j < rows; j++) {
      const a = (p / 13) * TAU,
        shift = (p / 13) * 3 * rise,
        m = mesh(g, geo, j % 2 ? "#759e9c" : "#bdccc0", "tubulinDimer");
      m.position.set(
        Math.cos(a) * r,
        (j - (rows - 1) / 2) * rise + shift,
        -Math.sin(a) * r,
      );
      m.scale.set(0.097, 0.078, 0.092);
      m.rotation.y = a;
    }
  g.rotation.set(0.78, -0.2, -0.3);
  g.userData.landmarks = [
    {
      zh: "＋端 · β 亚基朝外",
      en: "Plus end · β exposed",
      position: [0.3, 1.65, 0],
    },
    {
      zh: "−端 · α 亚基朝外",
      en: "Minus end · α exposed",
      position: [0, -1.4, 0],
    },
    { zh: "中空管腔", en: "Hollow lumen", position: [0, 1.5, 0] },
  ];
  return g;
}
function actin() {
  const g = new THREE.Group(),
    geo = proteinGeometry();
  for (let i = 0; i < 44; i++) {
    const a = i * THREE.MathUtils.degToRad(-166.7),
      m = mesh(g, geo, i % 2 ? "#9fb993" : "#7da68d", "actin");
    m.position.set(
      Math.cos(a) * 0.067,
      (i - 21.5) * 0.11,
      -Math.sin(a) * 0.067,
    );
    m.scale.set(0.079, 0.114, 0.077);
    m.rotation.y = a;
  }
  g.rotation.set(0.1, 0, -0.38);
  g.userData.landmarks = [
    { zh: "＋端（倒钩端）", en: "Plus / barbed end", position: [0, 2.4, 0] },
    { zh: "−端（尖端）", en: "Minus / pointed end", position: [0, -2.4, 0] },
  ];
  return g;
}
function tetramer() {
  const g = new THREE.Group();
  for (let d = 0; d < 2; d++)
    for (let chain = 0; chain < 2; chain++) {
      const p = [],
        direction = d ? -1 : 1,
        shift = d ? 0.3 : -0.3;
      for (let i = 0; i <= 220; i++) {
        const t = i / 220,
          a = t * TAU * 5 + chain * Math.PI;
        p.push([
          d * 0.16 - 0.08 + Math.cos(a) * 0.05,
          direction * ((t - 0.5) * 2.5) + shift,
          Math.sin(a) * 0.05 * direction,
        ]);
      }
      tube(g, p, 0.025, d ? "#b9b5ca" : "#969fb9", "intermediateTetramer", 280);
      const start = p[0],
        end = p.at(-1);
      tube(
        g,
        [
          start,
          [start[0] + 0.05, start[1] - direction * 0.13, 0.05],
          [start[0] - 0.07, start[1] - direction * 0.24, 0.12],
        ],
        0.016,
        "#8f9aa9",
        "intermediateTetramer",
        40,
      );
      tube(
        g,
        [
          end,
          [end[0] - 0.05, end[1] + direction * 0.13, 0.07],
          [end[0] + 0.08, end[1] + direction * 0.21, 0.11],
        ],
        0.016,
        "#c5bccb",
        "intermediateTetramer",
        40,
      );
    }
  g.rotation.z = -0.24;
  g.userData.landmarks = [
    {
      zh: "平行双链形成二聚体",
      en: "Parallel chains form a dimer",
      position: [-0.08, -0.6, 0.08],
    },
    {
      zh: "反向错位配对",
      en: "Antiparallel, staggered pair",
      position: [0.08, 0.3, 0.08],
    },
  ];
  return g;
}
function intermediate() {
  const g = new THREE.Group();
  for (let bundle = 0; bundle < 6; bundle++)
    for (let strand = 0; strand < 4; strand++) {
      const points = [];
      for (let j = 0; j <= 180; j++) {
        const t = j / 180,
          a = (bundle / 6) * TAU + t * TAU * 1.3,
          b = (strand / 4) * TAU + t * TAU * 6;
        points.push([
          Math.cos(a) * 0.155 + Math.cos(b) * 0.034,
          (t - 0.5) * 3.2,
          Math.sin(a) * 0.155 + Math.sin(b) * 0.034,
        ]);
      }
      tube(
        g,
        points,
        0.018,
        strand % 2 ? "#a7a7bd" : "#c0bacc",
        "intermediateTetramer",
        220,
      );
    }
  g.rotation.set(0.12, 0, -0.36);
  g.userData.landmarks = [
    {
      zh: "绳索样纤维 · 无整体正负极性",
      en: "Rope-like fiber · No overall polarity",
      position: [0, 0.3, 0.17],
    },
  ];
  return g;
}
export function cytoskeletonDetail(id) {
  if (id === "cytoskeleton") return skeletonNetwork();
  if (id === "microtubules") return microtubule();
  if (id === "actin") return actin();
  if (id === "intermediate") return intermediate();
  if (id === "intermediateTetramer") return tetramer();
  return null;
}
