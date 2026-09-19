import * as THREE from "three";
const TAU = Math.PI * 2;
function add(g, geo, color, id) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.6,
      clearcoat: 0.12,
      side: THREE.DoubleSide,
    }),
  );
  m.userData.hitId = id;
  g.add(m);
  return m;
}
function tube(g, pts, r, color, id) {
  return add(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))),
      Math.max(32, pts.length * 3),
      r,
      8,
      false,
    ),
    color,
    id,
  );
}
const pores = [
  [-0.68, 0.12],
  [0.65, -0.13],
];
function sheet(g, y, id, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-1.5, -0.83);
  shape.lineTo(1.5, -0.83);
  shape.quadraticCurveTo(1.63, -0.83, 1.63, -0.7);
  shape.lineTo(1.63, 0.7);
  shape.quadraticCurveTo(1.63, 0.83, 1.5, 0.83);
  shape.lineTo(-1.5, 0.83);
  shape.quadraticCurveTo(-1.63, 0.83, -1.63, 0.7);
  shape.lineTo(-1.63, -0.7);
  shape.quadraticCurveTo(-1.63, -0.83, -1.5, -0.83);
  for (const [x, z] of pores) {
    const h = new THREE.Path();
    h.absarc(x, z, 0.215, 0, TAU, true);
    shape.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSize: 0.01,
    bevelThickness: 0.008,
    bevelSegments: 2,
    curveSegments: 48,
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, y, 0);
  add(g, geo, color, id);
}
export function nuclearDetail(id) {
  if (!["envelope", "outerNuclear", "innerNuclear"].includes(id)) return null;
  const g = new THREE.Group();
  if (id !== "innerNuclear") {
    sheet(g, 0.19, "outerNuclear", "#aa91bc");
    // Ribosomes face the cytoplasm; pores are actual openings in both membranes.
    for (let i = 0; i < 24; i++) {
      const x = -1.38 + (i % 8) * 0.39,
        z = -0.57 + Math.floor(i / 8) * 0.53;
      if (pores.some(([a, b]) => Math.hypot(x - a, z - b) < 0.34)) continue;
      const m = add(
        g,
        new THREE.SphereGeometry(0.045, 18, 12),
        "#c6b58f",
        "outerNuclear",
      );
      m.position.set(x, 0.23, z);
      m.scale.set(1, 0.7, 0.85);
    }
  }
  if (id !== "outerNuclear") {
    sheet(g, -0.19, "innerNuclear", "#c8b3d7");
    // Lamina is a supporting mesh on the nucleoplasmic surface, interrupted at pores.
    for (let i = -7; i <= 7; i++) {
      const x = i * 0.2;
      let run = [];
      for (let j = 0; j <= 70; j++) {
        const z = -0.73 + (j / 70) * 1.46;
        if (pores.some(([a, b]) => Math.hypot(x - a, z - b) < 0.25)) {
          if (run.length > 1) tube(g, run, 0.009, "#a394b9", "innerNuclear");
          run = [];
        } else run.push([x, -0.25, z]);
      }
      if (run.length > 1) tube(g, run, 0.009, "#a394b9", "innerNuclear");
    }
    for (let j = -3; j <= 3; j++) {
      const z = j * 0.21;
      let run = [];
      for (let i = 0; i <= 100; i++) {
        const x = -1.5 + i * 0.03;
        if (pores.some(([a, b]) => Math.hypot(x - a, z - b) < 0.25)) {
          if (run.length > 1) tube(g, run, 0.009, "#b09dc2", "innerNuclear");
          run = [];
        } else run.push([x, -0.26, z]);
      }
      if (run.length > 1) tube(g, run, 0.009, "#b09dc2", "innerNuclear");
    }
  }
  if (id === "envelope")
    for (const [x, z] of pores) {
      // Curved annular wall joins outer and inner membranes at the pore rim.
      const pts = [];
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI;
        pts.push(
          new THREE.Vector2(0.215 - 0.045 * Math.sin(a), 0.19 * Math.cos(a)),
        );
      }
      const geo = new THREE.LatheGeometry(pts, 64);
      const m = add(g, geo, "#b49bc7", "outerNuclear");
      m.position.set(x, 0, z);
    }
  g.rotation.set(id === "innerNuclear" ? -0.7 : 0.43, -0.24, -0.055);
  g.userData.landmarks = [
    { zh: "细胞质侧", en: "Cytoplasmic side", position: [-1.3, 0.42, 0] },
    { zh: "核质侧", en: "Nucleoplasmic side", position: [1.3, -0.45, 0] },
    ...(id === "envelope"
      ? [{ zh: "核周隙", en: "Perinuclear space", position: [1.5, 0, 0.72] }]
      : []),
    ...(id === "innerNuclear"
      ? [
          {
            zh: "核纤层（示意）",
            en: "Nuclear lamina (schematic)",
            position: [0, -0.26, 0.6],
          },
        ]
      : []),
  ];
  return g;
}
