import * as T from "three";
import {
  V,
  TAU,
  ball,
  tube,
  ring,
  shell,
  surfacePoint,
  nucleus,
  vesicle,
  hollowTube,
  addMesh,
} from "./microbeGeometry";
import { place } from "./specimenGeometry";
import { poreComplex } from "./nuclearBodies";
import { chromatinDetail } from "./chromatinDetails";
function bodyPoint(t, a) {
  const p = surfacePoint(t, a, [1.18, 2.55, 0.78]);
  p.x *= 1 + (0.17 * p.y) / 2.55;
  p.x += 0.13 * Math.sin(p.y * 1.1);
  return p;
}
function surface() {
  const g = new T.Group();
  shell(g, [1.18, 2.55, 0.78], 0.04, "#a7c1b9", "paraSurface", {
    opacity: 0.36,
    cut: 1.18,
  });
  // Deform the wall and its cut rim with the same map used for surface appendages.
  for (const m of g.children) {
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setX(i, p.getX(i) * (1 + (0.17 * y) / 2.55) + 0.13 * Math.sin(y * 1.1));
    }
    m.geometry.computeVertexNormals();
  }
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * TAU;
    for (const [start, end, cap] of [
      [0.12, 1.18, true],
      [1.18, Math.PI - 0.12, false],
    ]) {
      const pts = Array.from({ length: 48 }, (_, i) =>
        bodyPoint(start + ((end - start) * i) / 47, a).multiplyScalar(1.008),
      );
      tube(g, pts, 0.008, "#8daca7", "paraSurface").userData.cap = cap;
    }
  }
  return g;
}
function ciliaOnBody(g) {
  for (let row = 0; row < 30; row++)
    for (let k = 0; k < 26; k++) {
      const t = 0.16 + (row / 29) * (Math.PI - 0.32),
        a = ((k + 0.35 * (row % 2)) / 26) * TAU,
        p = bodyPoint(t, a);
      // Keep the oral opening unobstructed.
      if (p.x > 0.45 && p.z > 0.38 && p.y > -0.5 && p.y < 0.9) continue;
      const normal = V(
        p.x / 1.18 ** 2,
        p.y / 2.55 ** 2,
        p.z / 0.78 ** 2,
      ).normalize();
      const pts = [
        p,
        p.clone().addScaledVector(normal, 0.065),
        p
          .clone()
          .addScaledVector(normal, 0.15)
          .add(V(0.035, -0.055, 0)),
        p
          .clone()
          .addScaledVector(normal, 0.22)
          .add(V(0.06, -0.11, 0.02)),
      ];
      const m = tube(g, pts, 0.009, "#92b0ac", "paraCilia");
      if (t < 1.18) m.userData.cap = true;
    }
}
function axoneme() {
  const g = new T.Group(),
    r = 0.65;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU,
      p = V(r * Math.cos(a), 0, r * Math.sin(a));
    for (let k = 0; k < 2; k++) {
      const m = hollowTube(
        g,
        "paraAxoneme",
        0.082,
        2.2,
        k ? "#afc4bf" : "#98aec0",
      );
      m.position
        .copy(p)
        .add(V(-Math.sin(a) * k * 0.115, 0, Math.cos(a) * k * 0.115));
    }
    for (let y = -0.8; y <= 0.8; y += 0.4) {
      tube(
        g,
        [
          V(p.x, y, p.z),
          V(p.x * 0.65, y, p.z * 0.65),
          V(p.x * 0.35, y, p.z * 0.35),
        ],
        0.022,
        "#c2ae8f",
        "paraAxoneme",
      );
      tube(
        g,
        [
          V(p.x, y, p.z),
          V(p.x - Math.sin(a) * 0.19, y + 0.05, p.z + Math.cos(a) * 0.19),
        ],
        0.025,
        "#aa98b5",
        "paraAxoneme",
      );
    }
  }
  for (const x of [-0.115, 0.115]) {
    const m = hollowTube(g, "paraAxoneme", 0.075, 2.2, "#bcb393");
    m.position.x = x;
  }
  for (const y of [-0.95, 0.95]) {
    const m = ring(g, [0, y, 0], 0.9, 0.022, "#a3bcb3", "paraAxoneme");
    m.rotation.x = Math.PI / 2;
  }
  g.rotation.set(0.55, 0, 0.12);
  g.userData.landmarks = [
    {
      zh: "9组外周二联体",
      en: "Nine outer doublets",
      position: [0.65, 0.8, 0],
    },
    {
      zh: "2根中央微管",
      en: "Two central microtubules",
      position: [0, 0.8, 0],
    },
    {
      zh: "动力蛋白与连接结构（示意）",
      en: "Dynein and links (schematic)",
      position: [-0.4, 0, 0.45],
    },
  ];
  return g;
}
function cilia() {
  const g = new T.Group();
  for (let j = 0; j < 5; j++) {
    const x = (j - 2) * 0.4;
    const pts = Array.from({ length: 34 }, (_, i) => {
      const t = i / 33;
      return V(x + 0.32 * t * t, 1.8 * t - 0.65, 0.075 * Math.sin(t * Math.PI));
    });
    const membrane = tube(g, pts, 0.075, "#a9c0b8", "paraCilia");
    // One enlarged translucent cilium reveals the same 9 + 2 plan as its detail.
    // The other cilia retain their membrane silhouette so the row stays legible.
    if (j === 2) {
      membrane.material.transparent = true;
      membrane.material.opacity = 0.23;
      membrane.material.depthWrite = false;
      for (let k = 0; k < 9; k++) {
        const q = (k / 9) * TAU;
        for (let member = 0; member < 2; member++) {
          const dx = 0.047 * Math.cos(q) - member * 0.009 * Math.sin(q),
            dz = 0.047 * Math.sin(q) + member * 0.009 * Math.cos(q);
          tube(
            g,
            pts.map((p) => p.clone().add(V(dx, 0, dz))),
            0.0055,
            member ? "#b3c5be" : "#8ea8b9",
            "paraAxoneme",
          );
        }
      }
      for (const dx of [-0.012, 0.012])
        tube(
          g,
          pts.map((p) => p.clone().add(V(dx, 0, 0))),
          0.0055,
          "#bcb393",
          "paraAxoneme",
        );
    }
    ball(g, [x, -0.71, 0], [0.09, 0.14, 0.09], "#aeb5bf", "paraCilia");
    const collar = ring(g, [x, -0.63, 0], 0.087, 0.014, "#9caaa9", "paraCilia");
    collar.rotation.x = Math.PI / 2;
  }
  g.userData.partAnchors = { paraAxoneme: [0.16, 0.55, 0.06] };
  g.userData.landmarks = [
    { zh: "纤毛膜", en: "Ciliary membrane", position: [-0.62, 0.65, 0] },
    {
      zh: "基体（示意）",
      en: "Basal body (schematic)",
      position: [-0.4, -0.72, 0],
    },
  ];
  return g;
}
function oral() {
  const g = new T.Group();
  const profile = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39;
    return new T.Vector2(0.54 * (1 - t) ** 1.25 + 0.125, 1.1 - 1.85 * t);
  }).reverse();
  const trough = new T.LatheGeometry(profile, 64, Math.PI / 2, Math.PI);
  addMesh(g, trough, "#b8a5bc", "paraOral");
  for (let side of [-1, 1])
    tube(
      g,
      Array.from({ length: 50 }, (_, i) => {
        const t = i / 49;
        return V(side * (0.54 * (1 - t) ** 1.25 + 0.125), 1.1 - 1.85 * t, 0);
      }),
      0.028,
      "#b7a2ba",
      "paraOral",
    );
  for (let j = 0; j < 15; j++)
    for (let side of [-1, 1]) {
      const y = 1 - j * 0.1,
        t = (1.1 - y) / 1.85,
        x = side * (0.54 * (1 - t) ** 1.25 + 0.125);
      tube(
        g,
        [
          [x, y, 0.03],
          [x - side * 0.1, y - 0.08, 0.11],
          [x - side * 0.14, y - 0.16, 0.16],
        ],
        0.015,
        "#96b4ac",
        "paraOral",
      );
    }
  hollowTube(g, "paraOral", 0.125, 0.55, "#b69cb7").position.y = -1.01;
  g.userData.landmarks = [
    { zh: "口沟", en: "Oral groove", position: [0.48, 0.75, 0.1] },
    {
      zh: "胞口与胞咽",
      en: "Cytostome and cytopharynx",
      position: [0, -0.8, 0],
    },
  ];
  return g;
}
function radial(id = "paraRadial") {
  const g = new T.Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU,
      p = V(Math.cos(a), Math.sin(a), 0);
    tube(
      g,
      [
        p.clone().multiplyScalar(0.25),
        p.clone().multiplyScalar(0.65),
        p
          .clone()
          .multiplyScalar(1.13)
          .add(V(0.025, -0.035, 0)),
      ],
      0.046,
      "#9fc4d0",
      id,
    );
    const m = ball(
      g,
      p.clone().multiplyScalar(0.53).toArray(),
      [0.15, 0.065, 0.065],
      "#a9cdd5",
      id,
    );
    m.rotation.z = a;
    const tangent = V(-Math.sin(a), Math.cos(a), 0);
    // Simplified spongiome: connected membrane tubules surrounding each canal.
    // The displayed branch count is illustrative, not a species-specific count.
    for (let branch = 0; branch < 4; branch++)
      for (const side of [-1, 1]) {
        const origin = p.clone().multiplyScalar(0.76 + branch * 0.09);
        tube(
          g,
          [
            origin,
            origin
              .clone()
              .addScaledVector(tangent, side * 0.075)
              .add(V(0, 0, 0.035)),
            origin
              .clone()
              .addScaledVector(tangent, side * 0.12)
              .addScaledVector(p, 0.055),
          ],
          0.012,
          "#b0cdd1",
          id,
        );
      }
  }
  g.userData.landmarks = [
    { zh: "收集管", en: "Collecting canal", position: [0.94, 0, 0] },
    { zh: "膨大部", en: "Ampulla", position: [0.53, 0, 0.065] },
    {
      zh: "海绵状管网（示意）",
      en: "Spongiome (schematic)",
      position: [0.9, 0.14, 0.035],
    },
  ];
  return g;
}
function contractile() {
  const g = radial();
  ball(g, [0, 0, 0], [0.34, 0.34, 0.22], "#a1c6d0", "paraContractile", {
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  ring(g, [0, 0, 0.21], 0.06, 0.025, "#86a8b9", "paraContractile");
  g.userData.partAnchors = { paraRadial: [0.75, 0.55, 0] };
  return g;
}
function trichocyst() {
  const g = new T.Group();
  ball(g, [0, 0, 0], [0.22, 1, 0.19], "#b8bca3", "paraTrichocysts", {
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    tube(
      g,
      Array.from({ length: 26 }, (_, i) => {
        const t = i / 25;
        return V(
          0.11 * Math.sin(t * Math.PI) * Math.cos(a),
          -1 + 2 * t,
          0.09 * Math.sin(t * Math.PI) * Math.sin(a),
        );
      }),
      0.012,
      "#a4ad92",
      "paraTrichocysts",
    );
  }
  tube(
    g,
    [
      [0, 0.93, 0],
      [0, 1.1, 0],
      [0, 1.2, 0],
    ],
    0.03,
    "#adb399",
    "paraTrichocysts",
  );
  return g;
}
function mitochondrion() {
  const g = new T.Group();
  shell(g, [0.66, 1.15, 0.48], 0.04, "#c1a48f", "paraMito", { opacity: 0.65 });
  shell(g, [0.58, 1.06, 0.4], 0.025, "#d0b38a", "paraMito", { opacity: 0.45 });
  for (let j = 0; j < 11; j++) {
    const y = -0.84 + j * 0.165,
      side = j % 2 ? 1 : -1,
      anchor =
        0.58 * Math.sqrt(1 - (y / 1.06) ** 2 - (0.08 / 0.4) ** 2) - 0.045;
    tube(
      g,
      [
        [side * anchor, y, -0.08],
        [side * anchor * 0.55, y + 0.035, 0],
        [0, y + 0.07, 0.04],
        [-side * 0.13, y + 0.1, 0.07],
      ],
      0.045,
      "#c8aa7d",
      "paraMito",
    );
  }
  g.userData.landmarks = [
    {
      zh: "管状嵴（示意）",
      en: "Tubular cristae (schematic)",
      position: [0.15, 0.4, 0.04],
    },
  ];
  return g;
}
function paramecium() {
  const g = surface();
  ciliaOnBody(g);
  place(
    g,
    nucleus("paraMacro", { elongated: true, nucleoli: 4 }),
    "paraMacro",
    [-0.2, 0.08, 0.14],
    0.57,
    [0, 0, -0.55],
  );
  place(
    g,
    nucleus("paraMicro", { nucleoli: 0 }),
    "paraMicro",
    [0.3, 0.6, 0.25],
    0.2,
  );
  place(g, oral(), "paraOral", [0.77, 0.43, 0.35], 0.5, [0, 0.3, -0.2]);
  for (const y of [-1.48, 1.5])
    place(g, contractile(), "paraContractile", [-0.12, y, 0.1], 0.48);
  for (const [x, y, z, s] of [
    [-0.5, 0.89, 0.21, 0.22],
    [0.46, -0.68, 0.21, 0.3],
    [-0.56, -0.6, 0.21, 0.25],
    [0.28, 1.05, -0.26, 0.18],
  ])
    place(
      g,
      vesicle("paraFood", "#c6b498", { cargo: true }),
      "paraFood",
      [x, y, z],
      s,
    );
  for (let i = 0; i < 12; i++) {
    const y = -1.7 + i * 0.29,
      x =
        (i % 2 ? 1 : -1) *
        (i === 1 ? 0.66 : 0.82) *
        Math.sqrt(1 - (y / 2.6) ** 2);
    place(g, mitochondrion(), "paraMito", [x, y, -0.16], 0.13, [0, 0, i]);
  }
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU,
      p = bodyPoint(1.8, a).multiplyScalar(0.8);
    const m = place(g, trichocyst(), "paraTrichocysts", p.toArray(), 0.14);
    m.quaternion.setFromUnitVectors(
      V(0, 1, 0),
      V(p.x / 1.18 ** 2, p.y / 2.55 ** 2, p.z / 0.78 ** 2).normalize(),
    );
  }
  g.userData.partAnchors = {
    paraSurface: [-1, 1, 0],
    paraCilia: [1.24, 0.1, 0.04],
    paraOral: [0.8, 0.63, 0.55],
    paraFood: [0.46, -0.68, 0.4],
    paraContractile: [-0.12, 1.5, 0.32],
    paraMacro: [-0.3, 0.13, 0.4],
    paraMicro: [0.3, 0.6, 0.4],
    paraTrichocysts: [-0.9, -0.4, 0],
    paraMito: [0.6, -1.4, 0.1],
  };
  return g;
}
// Paramecium nuclear-envelope evidence and the schematic limits are recorded in
// parameciumNuclearSources in catalog/microbes.js. No animal lamina is added.
function nuclearAssembly(id) {
  const macro = id === "paraMacro";
  return nucleus(id, {
    elongated: macro,
    nucleoli: macro ? 4 : 0,
    parts: {
      envelope: `${id}Envelope`,
      pores: `${id}Pores`,
      chromatin: `${id}Chromatin`,
      ...(macro ? { nucleoli: `${id}Nucleoli` } : {}),
    },
  });
}
function nuclearEnvelopePatch(id) {
  const g = new T.Group(),
    shape = new T.Shape();
  shape.moveTo(-1.32, -0.8);
  shape.lineTo(1.32, -0.8);
  shape.quadraticCurveTo(1.45, -0.8, 1.45, -0.67);
  shape.lineTo(1.45, 0.67);
  shape.quadraticCurveTo(1.45, 0.8, 1.32, 0.8);
  shape.lineTo(-1.32, 0.8);
  shape.quadraticCurveTo(-1.45, 0.8, -1.45, 0.67);
  shape.lineTo(-1.45, -0.67);
  shape.quadraticCurveTo(-1.45, -0.8, -1.32, -0.8);
  const hole = new T.Path();
  hole.absarc(0, 0, 0.3, 0, TAU, true);
  shape.holes.push(hole);
  for (const [z, color] of [
    [0.135, "#ac97bd"],
    [-0.135, "#c5b1d4"],
  ]) {
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: false,
      curveSegments: 64,
    });
    geo.translate(0, 0, z - 0.0125);
    addMesh(g, geo, color, id);
  }
  // A curved annulus joins the two membranes while retaining an open channel.
  const profile = Array.from({ length: 33 }, (_, i) => {
    const a = (i / 32) * Math.PI;
    return new T.Vector2(0.3 - 0.055 * Math.sin(a), 0.135 * Math.cos(a));
  });
  const join = new T.LatheGeometry(profile, 80);
  join.rotateX(Math.PI / 2);
  addMesh(g, join, "#b69dc7", id);
  g.rotation.set(-0.34, -0.42, 0.06);
  g.userData.landmarks = [
    { zh: "外核膜", en: "Outer nuclear membrane", position: [-0.9, 0.4, 0.15] },
    {
      zh: "内核膜",
      en: "Inner nuclear membrane",
      position: [0.9, -0.4, -0.15],
    },
    { zh: "核周隙", en: "Perinuclear space", position: [1.3, 0, 0] },
    {
      zh: "核孔处膜连续",
      en: "Membrane continuity at a pore",
      position: [0.29, 0, 0],
    },
  ];
  return g;
}
function nuclearPoreDetail(id) {
  // Conserved architectural schematic, not species-specific nucleoporin coordinates.
  const g = poreComplex();
  g.traverse((m) => {
    if (m.isMesh) m.userData.hitId = id;
  });
  return g;
}
function nuclearChromatinDetail(id) {
  const g = chromatinDetail("chromatin");
  g.traverse((m) => {
    if (m.isMesh) m.userData.hitId = id;
  });
  g.userData.landmarks = [
    { zh: "DNA与组蛋白", en: "DNA and histones", position: [-0.55, 1.12, 0.2] },
    { zh: "连接DNA", en: "Linker DNA", position: [0.1, 1.04, 0.1] },
  ];
  return g;
}
function nucleolarCondensate(id) {
  const g = new T.Group();
  // Magnified fibrogranular condensate; no membrane or mammalian tripartite
  // compartments are implied. Texture densities and individual counts are illustrative.
  for (let k = 0; k < 18; k++) {
    const center = V(
        Math.cos(k * 2.399) * 0.43,
        Math.sin(k * 2.399) * 0.35,
        ((k % 5) - 2) * 0.14,
      ),
      points = Array.from({ length: 55 }, (_, i) => {
        const t = i / 54;
        return center
          .clone()
          .add(
            V(
              0.3 * Math.sin(t * 7.4 + k * 0.7),
              0.24 * Math.cos(t * 9.3 + k * 0.4),
              0.23 * Math.sin(t * 6.2 + k),
            ),
          );
      });
    tube(g, points, 0.018, k % 2 ? "#ac91b9" : "#967aa9", id);
  }
  for (let i = 0; i < 260; i++) {
    const z = 1 - (2 * (i + 0.5)) / 260,
      angle = i * 2.399963,
      radius = 0.28 + 0.58 * Math.cbrt((((i * 73) % 260) + 0.5) / 260),
      radial = Math.sqrt(1 - z * z),
      p = V(
        Math.cos(angle) * radial * radius,
        Math.sin(angle) * radial * radius * 0.83,
        z * radius * 0.73,
      ),
      size = 0.023 + (0.008 * (i % 5)) / 4,
      m = addMesh(
        g,
        new T.SphereGeometry(size, 14, 10),
        i % 3 ? "#bda6c9" : "#a98cba",
        id,
      );
    m.position.copy(p);
  }
  g.rotation.set(0.14, -0.18, 0);
  g.userData.landmarks = [
    {
      zh: "纤维状成分（示意）",
      en: "Fibrillar material (schematic)",
      position: [-0.35, 0.25, 0.18],
    },
    {
      zh: "颗粒状成分（示意）",
      en: "Granular material (schematic)",
      position: [0.5, -0.12, 0.3],
    },
  ];
  return g;
}
// Shared schematic components retain taxon-specific IDs and descriptions.
export function microbeNucleusPart(id, kind) {
  if (kind === "envelope") return nuclearEnvelopePatch(id);
  if (kind === "pores") return nuclearPoreDetail(id);
  if (kind === "chromatin") return nuclearChromatinDetail(id);
  if (kind === "nucleolus") {
    const g = nucleolarCondensate(id);
    if (id === "yeastNucleolus") {
      // Yeast EM identifies an envelope-associated crescent; bending the same
      // fibrogranular aggregate preserves detail without adding a false shell.
      const crescent = (p) => {
        const angle = p.y * 1.7,
          radius = 0.67 + p.x * 0.33;
        return V(
          radius * Math.cos(angle) - 0.48,
          radius * Math.sin(angle),
          p.z * 0.78,
        );
      };
      for (const m of g.children) {
        m.updateMatrix();
        const positions = m.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const p = crescent(
            V().fromBufferAttribute(positions, i).applyMatrix4(m.matrix),
          );
          positions.setXYZ(i, p.x, p.y, p.z);
        }
        m.position.set(0, 0, 0);
        m.quaternion.identity();
        m.scale.set(1, 1, 1);
        m.geometry.computeVertexNormals();
      }
      g.userData.landmarks = g.userData.landmarks.map((mark) => ({
        ...mark,
        position: crescent(V(...mark.position)).toArray(),
      }));
    }
    return g;
  }
  return null;
}
export function parameciumDetail(id) {
  switch (id) {
    case "paramecium":
      return paramecium();
    case "paraSurface":
      return surface();
    case "paraCilia":
      return cilia();
    case "paraAxoneme":
      return axoneme();
    case "paraOral":
      return oral();
    case "paraFood":
      return vesicle(id, "#c7af90", { cargo: true });
    case "paraContractile":
      return contractile();
    case "paraRadial":
      return radial();
    case "paraMacro":
    case "paraMicro":
      return nuclearAssembly(id);
    case "paraMacroEnvelope":
    case "paraMicroEnvelope":
      return nuclearEnvelopePatch(id);
    case "paraMacroPores":
    case "paraMicroPores":
      return nuclearPoreDetail(id);
    case "paraMacroChromatin":
    case "paraMicroChromatin":
      return nuclearChromatinDetail(id);
    case "paraMacroNucleoli":
      return microbeNucleusPart(id, "nucleolus");
    case "paraTrichocysts":
      return trichocyst();
    case "paraMito":
      return mitochondrion();
    default:
      return null;
  }
}
