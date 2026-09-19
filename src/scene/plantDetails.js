import * as T from "three";
import {
  V,
  TAU,
  ball,
  tube,
  setHit,
  place,
  shell,
  aqueousMixture,
  surfacePoint,
} from "./specimenGeometry";
import {
  plastidNucleoid,
  rubiscoAssembly,
  stromaAssembly,
} from "./plantStromaDetails";
import {
  plantOrganelleDetail,
  plantNucleus,
  plantMitochondrion,
  plantER,
} from "./plantOrganelleDetails";
import { golgiAssembly } from "./golgiDetails";
import { ribosomeBody } from "./ribosomeDetails";
import { detailModel } from "./detailModels";
import {
  plantCompartmentDetail,
  vacuoleAssembly,
} from "./plantCompartmentDetails";
import { plantWallDetail } from "./plantWallDetails";
import { chloroplastDetail, chloroplastAssembly } from "./chloroplastDetails";
function remap(g, map, fallback) {
  g.traverse((o) => {
    if (o.isMesh) o.userData.hitId = map[o.userData.hitId] || fallback;
  });
  return g;
}
function wall() {
  const g = new T.Group();
  shell(g, [2.15, 2.62, 1.32], 0.12, "#b0be91", "cellWall", {
    exponent: 0.4,
    opacity: 0.48,
  });
  for (let row = 0; row < 32; row++) {
    const theta = 1.26 + (row / 31) * 1.65;
    for (let segment = 0; segment < 5; segment++) {
      const points = Array.from({ length: 28 }, (_, i) =>
        surfacePoint(
          theta + 0.016 * Math.sin(i * 0.17 + row),
          (segment * TAU) / 5 + (i / 27) * 0.9,
          [2.16, 2.63, 1.33],
          0.4,
        ),
      );
      tube(g, points, 0.008, row % 2 ? "#a3b287" : "#bdc8a2", "cellWall");
    }
  }
  return g;
}
function overviewVacuole() {
  const g = vacuoleAssembly();
  g.rotation.set(0, 0, 0);
  g.updateMatrixWorld(true);
  // A shallow peripheral indentation accommodates the adjacent nucleus.
  for (const m of g.children)
    if (m.isMesh) {
      m.geometry.applyMatrix4(m.matrixWorld);
      m.position.set(0, 0, 0);
      m.quaternion.identity();
      m.scale.set(1, 1, 1);
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i),
          y = p.getY(i);
        if (x < 0)
          p.setX(
            i,
            x +
              0.31 *
                Math.exp(-(((y - 0.7) / 0.53) ** 2)) *
                Math.min(1, -x / 0.6),
          );
      }
      m.geometry.computeVertexNormals();
    }
  return g;
}
function plantCell() {
  const g = new T.Group();
  place(g, wall(), "cellWall", [0, 0, 0], 1);
  shell(g, [2.01, 2.46, 1.2], 0.022, "#96b5a2", "plantMembrane", {
    exponent: 0.42,
    opacity: 0.14,
  });
  place(g, overviewVacuole(), "vacuole", [0.31, 0, -0.06], 1.03);
  place(g, plantNucleus(), "plantNucleus", [-1.29, 0.77, 0.37], 0.46);
  place(g, plantER(), "plantER", [-1.39, -0.04, 0.3], 0.27);
  // Reuse the exact geometry within this model; each copy keeps its own transform.
  const golgi = golgiAssembly();
  place(
    g,
    golgi.clone(true),
    "plantGolgi",
    [-1.3, -0.67, 0.6],
    0.22,
    [0.1, 0, -0.3],
  );
  const chloroplast = chloroplastAssembly();
  // Align the long axes along the curved periphery. All surface vertices stay
  // inside the plasma membrane and outside the tonoplast, including hidden caps.
  for (const [x, y, z, a] of [
    [1.48, 1.71, 0.27, 1.94],
    [1.54, -1.68, 0.18, -1.94],
    [-1.4, -1.83, 0.26, -0.75],
  ])
    place(g, chloroplast.clone(true), "chloroplast", [x, y, z], 0.45, [
      0.15,
      0.1,
      a,
    ]);
  place(
    g,
    plantMitochondrion(),
    "plantMitochondria",
    [-0.29, 2.24, 0.3],
    0.33,
    [0, 0, 1.5],
  );
  const ribo = ribosomeBody({ detail: false });
  for (let i = 0; i < 20; i++) {
    const a = i * 2.3999,
      x = Math.cos(a) * (1.82 + 0.03 * Math.sin(i)),
      y = Math.sin(a) * 2.27;
    place(
      g,
      ribo.clone(true),
      "plantRibosome",
      [x, y, -0.23 + 0.18 * Math.sin(i * 1.71)],
      0.059,
      [i * 0.7, i * 0.4, i],
    );
  }
  for (let i = 0; i < 100; i++) {
    const a = i * 2.3999;
    ball(
      g,
      [
        Math.cos(a) * 1.83,
        Math.sin(a) * 2.23,
        -0.43 + 0.18 * Math.sin(i * 1.3),
      ],
      [0.014, 0.014, 0.014],
      "#afbd9f",
      "plantCytoplasm",
    );
  }
  place(
    g,
    golgi.clone(true),
    "plantGolgi",
    [0.69, -2.25, 0.29],
    0.13,
    [0, 0.25, 0.2],
  );
  g.userData.partAnchors = {
    cellWall: [-1.9, 2, 0.3],
    plantMembrane: [1.96, 0.55, 0.9],
    vacuole: [0.35, -0.1, 0.8],
    chloroplast: [1.48, 1.71, 0.5],
    plantNucleus: [-1.2, 0.85, 0.8],
    plantER: [-1.45, -0.08, 0.4],
    plantGolgi: [-1.3, -0.6, 0.7],
    plantMitochondria: [-0.29, 2.24, 0.4],
    plantRibosome: [1.8, 0.1, 0.65],
    plantCytoplasm: [-0.5, -2.24, 0],
  };
  g.rotation.set(0.04, -0.17, -0.015);
  return g;
}
export function plantDetail(id) {
  if (id === "plant") return plantCell();
  const wallDetail = plantWallDetail(id);
  if (wallDetail) return wallDetail;
  const compartment = plantCompartmentDetail(id);
  if (compartment) return compartment;
  const chloroplast = chloroplastDetail(id);
  if (chloroplast) return chloroplast;
  if (id === "stroma") return stromaAssembly();
  if (id === "plastidDNA") return plastidNucleoid();
  if (id === "rubisco") return rubiscoAssembly();
  const organelle = plantOrganelleDetail(id);
  if (organelle) return organelle;
  if (id === "plantCytoplasm") return aqueousMixture(id);
  if (id === "plantRibosome")
    return remap(
      detailModel("ribosomes"),
      {
        largeSubunit: "plant60S",
        smallSubunit: "plant40S",
        mrna: "mrna",
        trna: "trna",
      },
      id,
    );
  if (id === "plant60S" || id === "plant40S") {
    const key = id === "plant60S" ? "largeSubunit" : "smallSubunit";
    return setHit(ribosomeBody({ detail: true, only: key }), id);
  }
  return null;
}
