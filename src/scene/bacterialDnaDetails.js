import * as T from "three";
import { V, TAU, ball, tube } from "./specimenGeometry";
import { duplex } from "./plantStromaDetails";
function bindingProtein(g, p, scale = 1, id = "nucleoidProteins") {
  const unit = new T.Group();
  g.add(unit);
  unit.position.copy(p);
  unit.scale.setScalar(scale);
  for (const side of [-1, 1]) {
    ball(
      unit,
      [side * 0.075, 0, 0],
      [0.095, 0.065, 0.062],
      side < 0 ? "#bcb08d" : "#a7b39a",
      id,
    );
    tube(
      unit,
      [
        [side * 0.06, 0.025, 0],
        [side * 0.085, 0.11, 0.01],
        [side * 0.16, 0.14, 0.01],
      ],
      0.025,
      "#b5bd9c",
      id,
    );
  }
  return unit;
}
export function bacterialNucleoid() {
  const g = new T.Group(),
    points = [];
  const domains = [
    [-0.18, -0.73, -0.07],
    [0.22, -0.52, 0.14],
    [-0.12, -0.1, 0.16],
    [0.18, 0.3, -0.06],
    [-0.17, 0.72, 0.1],
    [0.12, 0.82, -0.14],
    [-0.18, 0.3, -0.17],
    [0.16, -0.13, -0.17],
  ];
  for (let j = 0; j < domains.length; j++)
    for (let i = 0; i <= 70; i++) {
      const t = i / 70,
        a = t * TAU * (2.1 + (j % 3) * 0.2) + j * 0.7;
      const local = V(
        0.16 * Math.cos(a) * (1 + 0.2 * Math.sin(a * 1.3)),
        (t - 0.5) * 0.38 + 0.04 * Math.sin(a * 2.1),
        0.13 * Math.sin(a),
      );
      local.applyEuler(
        new T.Euler(j * 0.23, ((j % 3) - 0.7) * 0.6, (j % 2 ? 1 : -1) * 0.46),
      );
      points.push(local.add(V(...domains[j])));
    }
  duplex(g, points, "bacterialDNA", 0.012, true);
  for (let i = 12; i < points.length; i += 39)
    bindingProtein(g, points[i], 0.29);
  g.userData.partAnchors = {
    bacterialDNA: [0.3, 0.38, 0.24],
    nucleoidProteins: points[51].toArray(),
  };
  g.userData.landmarks = [
    {
      zh: "没有核被膜包围",
      en: "No surrounding nuclear envelope",
      position: [0.52, 0.72, 0],
    },
  ];
  g.rotation.set(0.15, -0.22, -0.05);
  return g;
}
export function plasmidModel() {
  const g = new T.Group(),
    p = [];
  // One closed duplex folded back into a plectoneme. Opposite portions of
  // the same molecule wind around each other and join at smooth terminal
  // loops; they are not separate DNA molecules or the two DNA strands.
  // This illustrates conformation, not a measured superhelical density.
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * TAU,
      axis = Math.cos(a),
      winding = axis * Math.PI * 1.2,
      spread = 0.25 * Math.sin(a);
    p.push(
      V(
        0.1 * Math.sin(axis * Math.PI) + spread * Math.cos(winding),
        0.82 * axis,
        spread * Math.sin(winding),
      ),
    );
  }
  duplex(g, p, "bacterialDNA", 0.028, true);
  g.userData.landmarks = [
    {
      zh: "同一闭合双链互绕 · 超螺旋示意",
      en: "One closed duplex interwound · Schematic supercoiling",
      position: [0.38, 0.15, 0.08],
    },
  ];
  g.rotation.set(0.2, -0.1, 0.12);
  return g;
}
export function bacterialDnaDetail(id) {
  if (id === "nucleoid") return bacterialNucleoid();
  if (id === "plasmids") return plasmidModel();
  if (id === "nucleoidProteins") {
    const g = new T.Group();
    bindingProtein(g, V(), 2.2);
    duplex(
      g,
      [
        [-0.8, 0.03, 0],
        [-0.45, 0.09, 0],
        [0, 0.3, 0.06],
        [0.43, 0.1, 0],
        [0.8, 0.04, 0],
      ],
      id,
      0.035,
    );
    g.userData.landmarks = [
      {
        zh: "结合蛋白使DNA弯曲（示意）",
        en: "Protein-associated DNA bending (schematic)",
        position: [0, 0.17, 0],
      },
    ];
    return g;
  }
  return null;
}
