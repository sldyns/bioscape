import * as T from "three";
import {
  V,
  TAU,
  addMesh,
  ball,
  tube,
  setHit,
  place,
  aqueousMixture,
} from "./specimenGeometry";
import {
  bacterialDnaDetail,
  bacterialNucleoid,
  plasmidModel,
} from "./bacterialDnaDetails";
import { bacterialEnvelopeDetail } from "./bacterialEnvelopeDetails";
import {
  bacterialAppendageDetail,
  flagellumAssembly,
} from "./bacterialAppendageDetails";
import { splitSection } from "./implicitMembrane";
import { detailModel } from "./detailModels";
const SECTION_Z = 0.28;
function capsule(g, r, length, c, id, opacity) {
  const [back, front] = splitSection(
    new T.CapsuleGeometry(r, length, 18, 72),
    (p) => p[2] - SECTION_Z,
  );
  addMesh(g, back, c, id, { transparent: true, opacity, depthWrite: false });
  const cap = addMesh(g, front, c, id, {
    transparent: true,
    opacity: opacity * 0.45,
    depthWrite: false,
  });
  cap.userData.cap = true;
  const cutR = Math.sqrt(r * r - SECTION_Z * SECTION_Z),
    points = [];
  for (let i = 0; i <= 50; i++) {
    const a = (i / 50) * Math.PI;
    points.push(
      V(cutR * Math.cos(a), length / 2 + cutR * Math.sin(a), SECTION_Z),
    );
  }
  for (let i = 1; i <= 20; i++)
    points.push(V(-cutR, length / 2 - (i / 20) * length, SECTION_Z));
  for (let i = 0; i <= 50; i++) {
    const a = Math.PI + (i / 50) * Math.PI;
    points.push(
      V(cutR * Math.cos(a), -length / 2 + cutR * Math.sin(a), SECTION_Z),
    );
  }
  for (let i = 1; i <= 20; i++)
    points.push(V(cutR, -length / 2 + (i / 20) * length, SECTION_Z));
  const edge = tube(g, points, 0.024, c, id, true);
  edge.userData.cutOnly = true;
}
function envelope() {
  const g = new T.Group();
  capsule(g, 0.92, 2, "#a1bdb6", "bacterialOuter", 0.42);
  for (let k = 0; k < 24; k++) {
    const y = -1.6 + (k / 23) * 3.2,
      r = Math.sqrt(0.86 ** 2 - Math.max(0, Math.abs(y) - 1) ** 2),
      cut = Math.asin(Math.min(1, SECTION_Z / r));
    for (const [start, end, cap] of [
      [-cut, Math.PI + cut, false],
      [Math.PI + cut, TAU - cut, true],
    ]) {
      const pts = Array.from({ length: 70 }, (_, i) => {
        const a = start + (i / 69) * (end - start);
        return V(Math.cos(a) * r, y, -Math.sin(a) * r);
      });
      tube(g, pts, 0.009, "#c2b391", "peptidoglycan").userData.cap = cap;
    }
  }
  capsule(g, 0.79, 2, "#83aea9", "bacterialMembrane", 0.27);
  for (let i = 0; i < 60; i++) {
    const a = i * 2.4,
      y = (i / 60 - 0.5) * 1.95,
      z = -Math.abs(Math.sin(a)) * 0.93,
      x = Math.cos(a) * 0.93;
    tube(
      g,
      [
        [x, y, z],
        [x * 1.1, y + 0.02, z * 1.1],
        [x * 1.19, y + 0.08, z * 1.19],
      ],
      0.012,
      "#c9c19f",
      "bacterialOuter",
    );
  }
  g.userData.partAnchors = {
    bacterialOuter: [-0.92, 0.6, 0.1],
    peptidoglycan: [0.85, -0.3, 0.28],
    bacterialMembrane: [-0.76, -0.8, 0.28],
  };
  return g;
}
function ribosome(only) {
  const g = new T.Group();
  if (only !== "bacterial30S") {
    ball(g, [0, -0.3, 0], [0.76, 0.49, 0.54], "#c6ae87", "bacterial50S");
    ball(g, [-0.5, -0.16, 0.15], [0.25, 0.28, 0.27], "#c6ae87", "bacterial50S");
    for (let k = 0; k < 10; k++) {
      const p = [];
      for (let i = 0; i < 28; i++) {
        const a = k * 0.56 + (i / 27) * 0.5,
          b = 0.4 + (1.7 * i) / 27;
        p.push(
          V(
            0.77 * Math.sin(b) * Math.cos(a),
            -0.3 + 0.51 * Math.cos(b),
            0.55 * Math.sin(b) * Math.sin(a),
          ),
        );
      }
      tube(g, p, 0.023, k % 2 ? "#e0caa1" : "#a9977c", "bacterial50S");
    }
  }
  if (only !== "bacterial50S") {
    ball(g, [0.06, 0.43, 0.03], [0.66, 0.25, 0.4], "#a8b5a5", "bacterial30S");
    ball(g, [0.44, 0.63, 0.02], [0.23, 0.26, 0.27], "#a8b5a5", "bacterial30S");
    for (let i = 0; i < 7; i++) {
      const p = Array.from({ length: 22 }, (_, j) =>
        V(
          -0.56 + (j / 21) * 1.12,
          0.45 + 0.16 * Math.sin((j / 21) * Math.PI),
          0.08 + 0.3 * Math.sin(i * 0.8 + j * 0.04),
        ),
      );
      tube(g, p, 0.018, "#809d93", "bacterial30S");
    }
  }
  g.userData.landmarks = [
    {
      zh: only === "bacterial30S" ? "解码区（示意）" : "亚基间功能界面",
      en:
        only === "bacterial30S"
          ? "Decoding region (schematic)"
          : "Intersubunit functional interface",
      position: [0, 0.09, 0.34],
    },
  ];
  return g;
}
function bacterialCell() {
  const g = new T.Group();
  place(g, envelope(), "bacterialEnvelope", [0, 0, 0], 1);
  place(g, bacterialNucleoid(), "nucleoid", [0, 0.03, -0.05], 0.9);
  place(g, plasmidModel(), "plasmids", [0.4, -1.1, 0.3], 0.31, [0.3, -0.1, 0]);
  place(
    g,
    plasmidModel(),
    "plasmids",
    [-0.3, 1.12, 0.28],
    0.27,
    [-0.2, 0.1, 0.3],
  );
  const ribo = ribosome();
  for (let i = 0; i < 15; i++) {
    const a = i * 2.3999;
    place(
      g,
      ribo.clone(true),
      "bacterialRibosome",
      [Math.cos(a) * 0.59, (i / 14 - 0.5) * 2.7, Math.sin(a) * 0.44],
      0.14,
      [0, a, 0],
    );
  }
  for (let i = 0; i < 85; i++) {
    const a = i * 2.3999,
      y = (i / 84 - 0.5) * 2.65,
      r = 0.47 + 0.09 * Math.sin(i * 1.3);
    ball(
      g,
      [Math.cos(a) * r, y, Math.sin(a) * r],
      [0.014, 0.014, 0.014],
      "#b9c7b2",
      "bacterialCytoplasm",
    );
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU,
      y = ((i % 5) - 2) * 0.4,
      p = V(Math.cos(a) * 0.93, y, Math.sin(a) * 0.93);
    const pilus = tube(
      g,
      [
        p,
        p.clone().multiplyScalar(1.2),
        p
          .clone()
          .multiplyScalar(1.43)
          .add(V(0, 0.12, 0)),
      ],
      0.017,
      "#a8b5a3",
      "pili",
    );
    // A pilus leaves with its removed envelope attachment, rather than floating
    // over the opening. Classify in cell-local coordinates before root rotation.
    pilus.userData.cap = p.z > SECTION_Z;
  }
  place(
    g,
    flagellumAssembly({ context: false }),
    "flagellum",
    [0, 1.62, 0],
    0.54,
    [0, 0, -0.25],
  );
  g.rotation.set(0.16, -0.25, -0.4);
  g.userData.partAnchors = {
    bacterialEnvelope: [-0.85, 0.5, 0.1],
    nucleoid: [-0.2, 0.2, 0.45],
    plasmids: [0.43, -0.96, 0.4],
    bacterialRibosome: [-0.51, -0.9, 0.3],
    bacterialCytoplasm: [0.6, 0.8, -0.1],
    pili: [1.2, -0.5, 0.1],
    flagellum: [0.42, 2.7, 0.1],
  };
  return g;
}
export function bacteriaDetail(id) {
  if (id === "bacterium") return bacterialCell();
  const envelopeDetail = bacterialEnvelopeDetail(id);
  if (envelopeDetail) return envelopeDetail;
  const dnaDetail = bacterialDnaDetail(id);
  if (dnaDetail) return dnaDetail;
  if (id === "bacterialDNA") {
    const g = setHit(detailModel("dna"), id);
    g.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(g);
    g.userData.landmarks = [
      {
        zh: "糖磷酸骨架",
        en: "Sugar–phosphate backbone",
        position: [b.max.x, 0, 0],
      },
      {
        zh: "互补碱基配对",
        en: "Complementary base pairing",
        position: [0, 0, 0],
      },
    ];
    return g;
  }

  if (id === "bacterialRibosome") return ribosome();
  if (id === "bacterial50S" || id === "bacterial30S") return ribosome(id);
  if (id === "bacterialCytoplasm") return aqueousMixture(id);
  const appendage = bacterialAppendageDetail(id);
  if (appendage) return appendage;
  return null;
}
