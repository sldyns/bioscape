import * as T from "three";
import {
  V,
  TAU,
  ball,
  tube,
  ring,
  shell,
  texturedShell,
  nucleus,
  vesicle,
  addMesh,
  hollowTube,
} from "./microbeGeometry";
import { place, setHit, lipidPatch } from "./specimenGeometry";
import { rawMitochondrion } from "./mitochondriaDetails";
import { plantER } from "./plantOrganelleDetails";
import { splitSection } from "./implicitMembrane";
import { microbeNucleusPart } from "./parameciumDetails";
function retainSurface(mesh, signedDistance) {
  const [inside, outside] = splitSection(mesh.geometry, signedDistance);
  inside.dispose();
  mesh.geometry = outside;
}
function openJunction(mesh, intoOther, radii) {
  // Most wall particles are nowhere near the bud. Preserve their indexed geometry.
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox.clone().applyMatrix4(intoOther);
  const nearest = ["x", "y", "z"].map((axis, i) => {
    const lo = bounds.min[axis],
      hi = bounds.max[axis];
    return (lo > 0 ? lo : hi < 0 ? -hi : 0) / radii[i];
  });
  if (nearest.reduce((sum, v) => sum + v * v, 0) >= 1) return;
  retainSurface(mesh, (p) => {
    const q = V(...p).applyMatrix4(intoOther);
    return (
      (q.x / radii[0]) ** 2 + (q.y / radii[1]) ** 2 + (q.z / radii[2]) ** 2 - 1
    );
  });
}
function glycan(g, base, id, size = 1) {
  // Smooth, bounded shape variation keeps each connected glycan distinct.
  const phase = base[0] * 7.31 + base[2] * 5.17 + 0.7;
  const height = 0.845 * (0.91 + 0.09 * Math.sin(phase));
  const paths = [
    Array.from({ length: 14 }, (_, i) => {
      const t = i / 13;
      return V(
        base[0] +
          size *
            (0.1 * Math.sin(phase) * t * t +
              0.022 * Math.sin(i * 1.65 + phase) * t),
        base[1] + height * t * size,
        base[2] +
          size *
            (0.075 * Math.cos(phase * 0.8) * t + 0.018 * Math.sin(i * 1.2) * t),
      );
    }),
  ];
  for (let j = 3; j < 12; j += 3)
    for (const side of [0, 1]) {
      const angle =
        phase + j * 1.17 + side * Math.PI + 0.23 * Math.sin(j + side);
      const length =
        (0.155 + 0.035 * Math.sin(phase + j * 0.7 + side * 2)) * size;
      const rise = (0.085 + 0.025 * Math.cos(phase - j + side)) * size;
      paths.push(
        Array.from({ length: 5 }, (_, i) => {
          const t = i / 4,
            arc = angle + 0.28 * t;
          return paths[0][j]
            .clone()
            .add(
              V(
                Math.cos(arc) * length * t,
                rise * t + 0.018 * size * Math.sin(t * Math.PI),
                Math.sin(arc) * length * t,
              ),
            );
        }),
      );
    }
  for (const p of paths) {
    tube(g, p, 0.014 * size, "#c3b48d", id);
    p.forEach((v) =>
      ball(
        g,
        v.toArray(),
        [0.026 * size, 0.026 * size, 0.026 * size],
        "#d0c29e",
        id,
      ),
    );
  }
}
function wallPatch({ only = null } = {}) {
  const g = new T.Group();
  let strands = [];
  if (only !== "yeastMannan") {
    strands = Array.from({ length: 10 }, (_, j) => {
      const phase = j * 1.91;
      return Array.from({ length: 44 }, (_, i) => {
        const t = i / 43;
        return V(
          -1.12 +
            i * 0.052 +
            0.025 * Math.sin(TAU * 1.3 * t + phase) * Math.sin(Math.PI * t),
          -0.15 +
            0.055 * Math.sin(TAU * (1.2 + 0.05 * Math.cos(j)) * t + phase) +
            0.018 * Math.sin(TAU * 3 * t + phase * 0.7),
          -0.62 +
            j * 0.135 +
            0.04 * Math.sin(TAU * (0.7 + 0.08 * Math.cos(j)) * t + phase) +
            0.012 * Math.sin(TAU * 2.1 * t + phase * 0.6),
        );
      });
    });
    strands.forEach((pts, j) => {
      tube(g, pts, 0.022, "#b7a176", "yeastGlucan");
      if (j === strands.length - 1) return;
      for (let branch = 0; branch < 4; branch++) {
        const k = 5 + branch * 10 + ((j * 3 + branch * 2) % 5);
        const step = 1 + ((j + branch * 2) % 4);
        // Exact samples from neighboring chains remain the two branch endpoints.
        const end = strands[j + 1][Math.min(43, k + step)];
        const middle = pts[k]
          .clone()
          .lerp(end, 0.5)
          .add(
            V(
              0.018 * Math.sin(j + branch),
              0.022 + 0.012 * Math.cos(j * 1.3 + branch),
              0.008 * Math.sin(j * 0.7 + branch),
            ),
          );
        tube(g, [pts[k], middle, end], 0.016, "#c5b38a", "yeastGlucan");
      }
    });
  }
  if (only !== "yeastGlucan")
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 7; i++) {
        const phase = i * 2.17 + j * 1.39;
        const p = [
          -0.94 + i * 0.31 + 0.028 * Math.sin(phase),
          0.015 + 0.012 * Math.sin(phase * 0.6),
          -0.51 + j * 0.34 + 0.025 * Math.cos(phase * 1.1),
        ];
        const protein = ball(
          g,
          p,
          [0.072, 0.11, 0.065],
          "#b4b392",
          "yeastMannan",
        );
        protein.rotation.set(
          0.09 * Math.sin(phase),
          phase * 0.23,
          0.08 * Math.cos(phase),
        );
        if (strands.length) {
          // Keep the outer glycoprotein attached to the underlying glucan scaffold.
          const anchor = strands.flat().reduce((nearest, point) => {
            const distance = (q) => (q.x - p[0]) ** 2 + (q.z - p[2]) ** 2;
            return distance(point) < distance(nearest) ? point : nearest;
          });
          const attachment = V(p[0], p[1] - 0.075, p[2]);
          tube(
            g,
            [anchor, anchor.clone().lerp(attachment, 0.5), attachment],
            0.017,
            "#b4b392",
            "yeastMannan",
          );
        }
        glycan(g, p, "yeastMannan", 0.59 + 0.055 * Math.sin(phase + 0.4));
      }
  g.rotation.set(0.3, -0.25, -0.06);
  g.userData.partAnchors = {
    yeastGlucan: [0.4, -0.12, 0.55],
    yeastMannan: [-0.5, 0.5, 0.2],
  };
  return g;
}
function bud({ growing = false } = {}) {
  const g = new T.Group();
  const wall = new T.Group();
  wall.name = "bud-wall";
  shell(wall, [0.95, 1.07, 0.83], 0.06, "#cab18a", "yeastBud", {
    opacity: 0.65,
  });
  g.add(wall);
  const membrane = new T.Group();
  membrane.name = "bud-membrane";
  shell(membrane, [0.82, 0.94, 0.7], 0.024, "#9bb9aa", "yeastBud", {
    opacity: 0.24,
  });
  g.add(membrane);
  if (!growing) {
    // The isolated bud ends at an open neck, not a closed sphere with floating rings.
    wall.children.forEach((m) => retainSurface(m, (p) => p[1] + 0.91));
    membrane.children.forEach((m) => retainSurface(m, (p) => p[1] + 0.82));
    const neck = hollowTube(g, "yeastBud", 0.5, 0.22, "#cab18a", 0.445);
    neck.position.y = -1.02;
    neck.scale.z = 0.83 / 0.95;
    const neckMembrane = hollowTube(
      g,
      "yeastBud",
      0.401,
      0.31,
      "#9bb9aa",
      0.377,
    );
    neckMembrane.position.y = -0.975;
    neckMembrane.scale.z = 0.7 / 0.82;
    for (const y of [-0.94, -1.06]) {
      const r = ring(g, [0, y, 0], 0.485, 0.032, "#b69a75", "yeastSeptum");
      r.rotation.x = Math.PI / 2;
      r.scale.y = 0.83 / 0.95;
    }
    g.userData.landmarks = [
      { zh: "芽体", en: "Daughter bud", position: [-0.65, 0.5, 0.2] },
      {
        zh: "与母细胞连通的芽颈",
        en: "Open neck to mother cell",
        position: [0, -1.13, 0],
      },
    ];
    g.userData.partAnchors = { yeastSeptum: [0.41, -1.02, 0.2] };
  }
  return g;
}
function septum() {
  const g = new T.Group();
  // A continuous annular sheet has a real lumen and a visible growing inner edge.
  const sheetShape = new T.Shape();
  sheetShape.absarc(0, 0, 0.79, 0, TAU, false);
  const lumen = new T.Path();
  lumen.absarc(0, 0, 0.37, 0, TAU, true);
  sheetShape.holes.push(lumen);
  const sheetGeometry = new T.ExtrudeGeometry(sheetShape, {
    depth: 0.055,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.009,
    bevelThickness: 0.009,
    curveSegments: 64,
  });
  sheetGeometry.translate(0, 0, -0.0275);
  const sheet = addMesh(g, sheetGeometry, "#cdb48e", "yeastSeptum");
  sheet.scale.y = 0.92;
  for (let layer = 0; layer < 5; layer++) {
    const m = ring(
      g,
      [0, 0, (layer - 2) * 0.05],
      0.8,
      0.045,
      "#c2a475",
      "yeastSeptum",
    );
    m.scale.y = 0.92;
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    tube(
      g,
      [
        V(0.77 * Math.cos(a), 0.708 * Math.sin(a), 0.036),
        V(0.59 * Math.cos(a), 0.543 * Math.sin(a), 0.039),
        V(0.39 * Math.cos(a), 0.359 * Math.sin(a), 0.036),
      ],
      0.009,
      "#d0b58d",
      "yeastSeptum",
    );
  }
  g.userData.landmarks = [
    { zh: "几丁质环", en: "Chitin ring", position: [0.8, 0, 0] },
    { zh: "形成中的隔膜", en: "Forming septum", position: [0.38, 0, 0] },
  ];
  return g;
}
function mito() {
  return setHit(rawMitochondrion({ includeDNA: false }), "yeastMito");
}
function er() {
  return setHit(plantER(), "yeastER");
}
function yeast() {
  const g = new T.Group();
  texturedShell(g, [1.6, 1.95, 1.25], 0.09, "#c8b491", "yeastWall", {
    rows: 22,
  });
  shell(g, [1.47, 1.81, 1.12], 0.024, "#9bb9aa", "yeastMembrane", {
    opacity: 0.2,
  });
  place(g, nucleus("yeastNucleus"), "yeastNucleus", [-0.61, 0.54, 0.26], 0.53);
  place(
    g,
    vesicle("yeastVacuole", "#a0c0c0"),
    "yeastVacuole",
    [0.4, -0.34, -0.05],
    0.78,
  );
  for (const [x, y, z, a] of [
    [-0.86, -0.79, 0.24, 0.3],
    [0.68, 0.97, 0.19, -0.6],
    [0.04, -1.42, 0.12, 1.1],
  ])
    place(g, mito(), "yeastMito", [x, y, z], 0.48, [0, 0, a]);
  place(g, er(), "yeastER", [-0.7, 0.17, -0.28], 0.43, [0, 0, 0.2]);
  const b = place(
    g,
    bud({ growing: true }),
    "yeastBud",
    [1.22, 1.58, 0],
    0.68,
    [0, 0, -0.5],
  );
  // Trim each envelope against its matching layer, preserving cytoplasmic continuity.
  g.updateMatrixWorld(true);
  const intoBud = b.matrixWorld.clone().invert();
  for (const m of g.children.filter(
    (m) =>
      m.isMesh && ["yeastWall", "yeastMembrane"].includes(m.userData.hitId),
  )) {
    const radii =
      m.userData.hitId === "yeastMembrane"
        ? [0.81, 0.93, 0.69]
        : [0.94, 1.06, 0.82];
    openJunction(m, intoBud.clone().multiply(m.matrixWorld), radii);
  }
  for (const [name, radii] of [
    ["bud-wall", [1.59, 1.94, 1.24]],
    ["bud-membrane", [1.46, 1.8, 1.11]],
  ]) {
    b.getObjectByName(name).traverse((m) => {
      if (m.isMesh) openJunction(m, m.matrixWorld, radii);
    });
  }
  // A past bud scar follows the outer ellipsoid and belongs to its removable front cap.
  for (let i = 0; i < 3; i++) {
    const r = 0.16 + i * 0.022;
    const points = Array.from({ length: 73 }, (_, j) => {
      const a = (j / 72) * TAU;
      const x = -0.64 + r * Math.cos(a),
        y = -0.85 + r * Math.sin(a);
      const z = 1.25 * Math.sqrt(1 - (x / 1.6) ** 2 - (y / 1.95) ** 2);
      return V(x, y, z + 0.016);
    });
    const scar = tube(g, points, 0.013, "#b29b76", "yeastWall");
    scar.userData.cap = true;
  }
  g.userData.partAnchors = {
    yeastWall: [-1.4, 0.8, 0.1],
    yeastMembrane: [-1.4, -0.3, 0.2],
    yeastNucleus: [-0.61, 0.54, 0.5],
    yeastVacuole: [0.6, -0.3, 0.55],
    yeastMito: [0.05, -1.42, 0.4],
    yeastER: [-0.9, 0.12, 0.05],
    yeastBud: [1.25, 1.92, 0.3],
  };
  return g;
}
export function yeastDetail(id) {
  switch (id) {
    case "yeast":
      return yeast();
    case "yeastWall":
      return wallPatch();
    case "yeastGlucan":
      return setHit(wallPatch({ only: id }), id);
    case "yeastMannan": {
      const g = new T.Group();
      ball(g, [0, -0.1, 0], [0.2, 0.28, 0.15], "#b4b392", id);
      glycan(g, [0, 0.07, 0], id, 1.7);
      return g;
    }
    case "yeastMembrane":
      return lipidPatch(id);
    case "yeastNucleus":
      return nucleus(id, {
        parts: {
          envelope: "yeastNuclearEnvelope",
          pores: "yeastNuclearPores",
          chromatin: "yeastChromatin",
          nucleoli: "yeastNucleolus",
        },
      });
    case "yeastNuclearEnvelope":
      return microbeNucleusPart(id, "envelope");
    case "yeastNuclearPores":
      return microbeNucleusPart(id, "pores");
    case "yeastChromatin":
      return microbeNucleusPart(id, "chromatin");
    case "yeastNucleolus":
      return microbeNucleusPart(id, "nucleolus");
    case "yeastVacuole":
      return vesicle(id, "#9ebfc2", { cargo: true });
    case "yeastMito":
      return mito();
    case "yeastER":
      return er();
    case "yeastBud":
      return bud();
    case "yeastSeptum":
      return septum();
    default:
      return null;
  }
}
