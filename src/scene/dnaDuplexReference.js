import * as THREE from "three";
import data from "./data/dna-1bna.json";

// The coordinates are the deposited 1BNA heavy atoms. Only this rigid pose and
// the uniform display scale change their positions (PDB DOI 10.2210/pdb1BNA/pdb).
const vector = (...v) => new THREE.Vector3(...v);
const zero = vector();
const up = vector(0, 1, 0);
const front = vector(0.05, 0.065, 1).normalize();
const depositedCenter = vector(14.40962, 21.11792, 8.72755);
const depositedView = vector(-0.897389, 0.359196, -0.256263);
const helixAxis = vector(0.10726, 0.19599, 0.97472);
const pose = new THREE.Matrix4()
  .lookAt(front, zero, up)
  .multiply(new THREE.Matrix4().makeRotationZ(-0.16))
  .multiply(
    new THREE.Matrix4().lookAt(depositedView, zero, helixAxis).transpose(),
  );

const sugarRing = ["C1'", "C2'", "C3'", "C4'", "O4'"];
const sixRing = ["N1", "C2", "N3", "C4", "C5", "C6"];
const fiveRing = ["C4", "N9", "C8", "N7", "C5"];
const substituents = {
  A: [["C6", "N6"]],
  G: [
    ["C6", "O6"],
    ["C2", "N2"],
  ],
  C: [
    ["C2", "O2"],
    ["C4", "N4"],
  ],
  T: [
    ["C2", "O2"],
    ["C4", "O4"],
    ["C5", "C7"],
  ],
};
const palette = {
  A: { spine: "#4f7186", sugar: "#a5bec5", end: "#40647b" },
  B: { spine: "#9c7d52", sugar: "#d1bb91", end: "#87653e" },
  base: { A: "#d9b775", G: "#c9aa77", T: "#b0c5c9", C: "#94b0bb" },
  purineBond: "#9d855f",
  pyrimidineBond: "#708d99",
  oxygen: "#a98165",
  nitrogen: "#567589",
  contact: "#5d9199",
};

// These sites open toward the default camera. O2 on a pyrimidine forms a
// minor-groove edge. N7 on a purine is exposed on the major-groove edge.
const sites = [
  ["A:1:O5'", "A 链 5′ 端", "Strand A · 5′ end", 66],
  ["B:24:O3'", "B 链 3′ 端", "Strand B · 3′ end", 66],
  ["A:12:O3'", "A 链 3′ 端", "Strand A · 3′ end", 91],
  ["B:13:O5'", "B 链 5′ 端", "Strand B · 5′ end", 66],
  ["A:10:N7", "大沟缘", "Major groove edge", 66],
  ["B:19:O2", "小沟缘", "Minor groove edge", 66],
  ["8/1/1", "A·T · 两处氢键", "A·T · 2 H bonds", 58],
  ["3/0/0", "G·C · 三处氢键", "G·C · 3 H bonds", 1],
];
const siteFaces = new Map(sites.map(([key, , , face]) => [key, face]));
const atomSphere = new THREE.SphereGeometry(1, 12, 8);
const openBond = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
const dashSphere = new THREE.SphereGeometry(1, 8, 6);

// Build one ordinary indexed mesh. The detail worker transfers it directly,
// with smooth primitive normals and the complete color field intact.
function moleculeGeometry() {
  const positions = [],
    normals = [],
    colors = [],
    indices = [];
  const colorCache = new Map();
  const normalMatrix = new THREE.Matrix3(),
    point = vector(),
    normal = vector();
  function pigment(hex) {
    if (!colorCache.has(hex))
      colorCache.set(
        hex,
        new THREE.Color(hex).toArray().map((v) => Math.round(255 * v)),
      );
    return colorCache.get(hex);
  }
  function stamp(shape, matrix, color) {
    const offset = positions.length / 3,
      paint = pigment(color);
    const pos = shape.attributes.position,
      nrm = shape.attributes.normal;
    normalMatrix.getNormalMatrix(matrix);
    for (let i = 0; i < pos.count; i++) {
      point.fromBufferAttribute(pos, i).applyMatrix4(matrix);
      normal.fromBufferAttribute(nrm, i).applyNormalMatrix(normalMatrix);
      positions.push(point.x, point.y, point.z);
      normals.push(normal.x, normal.y, normal.z);
      colors.push(...paint);
    }
    for (const index of shape.index.array) indices.push(offset + index);
  }
  function triangle(a, b, c, color) {
    const offset = positions.length / 3,
      paint = pigment(color);
    THREE.Triangle.getNormal(a, b, c, normal);
    for (const v of [a, b, c]) {
      positions.push(v.x, v.y, v.z);
      normals.push(normal.x, normal.y, normal.z);
      colors.push(...paint);
    }
    indices.push(offset, offset + 1, offset + 2);
  }
  function finish() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.Uint8BufferAttribute(colors, 3, true),
    );
    geometry.setIndex(indices);
    return geometry;
  }
  return { stamp, triangle, finish };
}

// These triangle centers were ray-checked at the initial perspective over both
// compact and wide aspect ratios. A recessed terminus needs the side of its
// oxygen sphere that clears the adjacent deoxyribose in that view.
function surfacePoint(shape, matrix, face) {
  const center = vector(),
    corner = vector();
  for (let j = 0; j < 3; j++) {
    const index = shape.index.array[3 * face + j];
    center.add(corner.fromBufferAttribute(shape.attributes.position, index));
  }
  return center.divideScalar(3).applyMatrix4(matrix).toArray();
}

function ringFace(batch, points, color, thickness) {
  const center = points
    .reduce((sum, p) => sum.add(p), vector())
    .divideScalar(points.length);
  const normal = vector();
  for (let i = 0; i < points.length; i++) {
    const a = points[i].clone().sub(center);
    const b = points[(i + 1) % points.length].clone().sub(center);
    normal.add(a.cross(b));
  }
  normal.normalize().multiplyScalar(thickness / 2);
  const top = points.map((p) => p.clone().add(normal));
  const bottom = points.map((p) => p.clone().sub(normal));
  const topCenter = center.clone().add(normal),
    bottomCenter = center.clone().sub(normal);
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    batch.triangle(topCenter, top[i], top[j], color);
    batch.triangle(bottomCenter, bottom[j], bottom[i], color);
    batch.triangle(top[i], bottom[i], bottom[j], color);
    batch.triangle(top[i], bottom[j], top[j], color);
  }
}

function residuePoints(residue) {
  const names = data.backboneAtoms.concat(data.baseAtoms[residue.base]),
    points = {};
  names.forEach((name, i) => {
    if (residue.xyz[i * 3] === null) return;
    points[name] = vector()
      .fromArray(residue.xyz, i * 3)
      .multiplyScalar(data.coordinateUnitAngstrom)
      .sub(depositedCenter)
      .applyMatrix4(pose);
  });
  return points;
}

export function dnaDuplexReference(id) {
  if (id !== "dna" && id !== "bacterialDNA") return null;
  const group = new THREE.Group(),
    batch = moleculeGeometry();
  const byNumber = new Map(),
    landmarks = new Map();
  const orientation = new THREE.Quaternion(),
    identity = new THREE.Quaternion();
  const matrix = new THREE.Matrix4(),
    scale = vector(),
    midpoint = vector(),
    delta = vector();
  function rod(a, b, radius, color) {
    delta.subVectors(b, a);
    const length = delta.length();
    orientation.setFromUnitVectors(up, delta.divideScalar(length));
    matrix.compose(
      midpoint.addVectors(a, b).multiplyScalar(0.5),
      orientation,
      scale.set(radius, length, radius),
    );
    batch.stamp(openBond, matrix, color);
  }
  function note(key, shape, atoms) {
    if (siteFaces.has(key))
      landmarks.set(key, {
        position: surfacePoint(shape, matrix, siteFaces.get(key)),
        pdbAtoms: atoms,
      });
  }
  for (const chain of data.chains) {
    const paint = palette[chain.id];
    let previous = null;
    for (const [i, residue] of chain.residues.entries()) {
      const p = residuePoints(residue),
        base = residue.base;
      byNumber.set(residue.number, p);
      const purine = Boolean(p.N9),
        edge = purine ? palette.purineBond : palette.pyrimidineBond;
      for (const [name, position] of Object.entries(p)) {
        const terminal =
          (i === 0 && name === "O5'") ||
          (i === chain.residues.length - 1 && name === "O3'");
        const backbone = data.backboneAtoms.includes(name);
        let radius = backbone ? 0.47 : 0.34;
        let color = backbone ? paint.spine : edge;
        if (name === "P") radius = 0.69;
        if (name.startsWith("O") && name !== "O3'" && name !== "O5'")
          color = palette.oxygen;
        if (name.startsWith("N")) {
          radius = 0.39;
          color = palette.nitrogen;
        }
        if (terminal) {
          radius = 0.65;
          color = paint.end;
        }
        matrix.compose(position, identity, scale.setScalar(radius));
        batch.stamp(atomSphere, matrix, color);
        const key = [chain.id, residue.number, name].join(":");
        note(key, atomSphere, [key]);
      }
      if (p.P) {
        rod(previous["O3'"], p.P, 0.39, paint.spine);
        rod(p.P, p["O5'"], 0.39, paint.spine);
        rod(p.P, p.OP1, 0.29, paint.spine);
        rod(p.P, p.OP2, 0.29, paint.spine);
      }
      rod(p["O5'"], p["C5'"], 0.37, paint.spine);
      rod(p["C5'"], p["C4'"], 0.37, paint.spine);
      rod(p["C3'"], p["O3'"], 0.37, paint.spine);
      rod(p["C1'"], p[purine ? "N9" : "N1"], 0.25, edge);
      const rings = [sugarRing, sixRing];
      if (purine) rings.push(fiveRing);
      for (const ring of rings) {
        const sugar = ring === sugarRing;
        ringFace(
          batch,
          ring.map((name) => p[name]),
          sugar ? paint.sugar : palette.base[base],
          sugar ? 0.27 : 0.23,
        );
        ring.forEach((name, j) => {
          const next = ring[(j + 1) % ring.length];
          // C4–C5 is shared by the two purine rings.
          if (ring === fiveRing && name === "C5" && next === "C4") return;
          const mainSpine = name === "C3'" && next === "C4'";
          rod(
            p[name],
            p[next],
            mainSpine ? 0.37 : sugar ? 0.29 : 0.21,
            sugar ? paint.spine : edge,
          );
        });
      }
      for (const [a, b] of substituents[base]) rod(p[a], p[b], 0.22, edge);
      previous = p;
    }
  }
  // Dashed contacts join canonical donor/acceptor heavy atoms. The archived
  // crystal model supplies both endpoints; no hydrogen coordinate is implied.
  for (const [a, b, contacts] of data.pairs) {
    contacts.forEach(([nameA, nameB], index) => {
      const from = byNumber.get(a)[nameA],
        to = byNumber.get(b)[nameB];
      delta.subVectors(to, from);
      const length = delta.length();
      orientation.setFromUnitVectors(up, delta.divideScalar(length));
      [0.32, 0.68].forEach((t, dash) => {
        matrix.compose(
          midpoint.lerpVectors(from, to, t),
          orientation,
          scale.set(0.13, 0.12 * length, 0.13),
        );
        batch.stamp(dashSphere, matrix, palette.contact);
        note([a, index, dash].join("/"), dashSphere, [
          `A:${a}:${nameA}`,
          `B:${b}:${nameB}`,
        ]);
      });
    });
  }
  const mesh = new THREE.Mesh(
    batch.finish(),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.58,
      metalness: 0,
    }),
  );
  mesh.userData.hitId = id;
  group.add(mesh);
  group.scale.setScalar(0.085);
  group.userData.landmarks = sites.map(([key, zh, en]) => ({
    zh,
    en,
    ...landmarks.get(key),
  }));
  return group;
}
