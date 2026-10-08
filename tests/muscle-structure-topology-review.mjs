import assert from "node:assert/strict";
import * as T from "three";
import {
  buildMuscleFibre,
  muscleDimensions,
  muscleMyofibrilCentres,
} from "../src/compare/models/muscle.js";

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
const sameColor = (o, c) => o.material?.color.equals(new T.Color(c));
const dispose = (g) =>
  g.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
const fibre = buildMuscleFibre();
fibre.rotation.set(0, 0, 0);
fibre.updateMatrixWorld(true);
const centres = muscleMyofibrilCentres();
const { radius, myofibrilRadius, sarcomereLength: period } = muscleDimensions;
check(centres.length === 91, "Preserve all 91 myofibrils");
let fibrilGap = Infinity;
let membraneGap = Infinity;
let nuclearGap = Infinity;
for (let i = 0; i < centres.length; i++) {
  const [y, z] = centres[i];
  membraneGap = Math.min(
    membraneGap,
    radius - 0.017 - Math.hypot(y, z) - myofibrilRadius,
  );
  for (let j = i + 1; j < centres.length; j++)
    fibrilGap = Math.min(
      fibrilGap,
      Math.hypot(y - centres[j][0], z - centres[j][1]) - 2 * myofibrilRadius,
    );
  for (let j = 0; j < 9; j++) {
    const angle = 0.5 + j * 2.4;
    const dy = y - 0.824 * Math.cos(angle),
      dz = z - 0.824 * Math.sin(angle),
      distance = Math.hypot(dy, dz);
    const radial = (dy * Math.cos(angle) + dz * Math.sin(angle)) / distance;
    const tangential =
      (-dy * Math.sin(angle) + dz * Math.cos(angle)) / distance;
    // A separating support plane bounds the entire elliptical nuclear cylinder,
    // including the parts between sampled vertices, at every longitudinal x.
    const support = Math.hypot(0.036 * radial, 0.1 * tangential);
    nuclearGap = Math.min(nuclearGap, distance - myofibrilRadius - support);
  }
}
check(
  fibrilGap > 0,
  "Every complete myofibril must clear all neighbouring myofibrils",
);
check(
  membraneGap > 0,
  "Every complete myofibril must clear the inner sarcolemma",
);
check(
  nuclearGap > 0,
  "Every complete myofibril must clear the bounding cylinders of peripheral nuclei",
);

const triads = fibre.children.filter(
  (o) => o.isMesh && o.userData.hitId === "muscleFibreTriads",
);
const rings = triads.map((o) => {
  const box = new T.Box3().setFromObject(o);
  return {
    o,
    center: box.getCenter(new T.Vector3()),
    halfWidth: (box.max.x - box.min.x) / 2,
  };
});
const tTubules = rings.filter(({ o }) => sameColor(o, "#c99b68"));
check(tTubules.length === 2, "Keep both sampled T-tubules");
let triadGap = Infinity;
for (const t of tTubules) {
  const phase = ((t.center.x % period) + period) % period;
  check(
    Math.min(Math.abs(phase - period * 0.18), Math.abs(phase - period * 0.82)) <
      1e-6,
    "The static reference T-tubules must align with the displayed A/I phases",
  );
  const flanking = rings.filter(
    ({ o, center }) =>
      sameColor(o, "#91ada8") &&
      Math.abs(center.x - t.center.x) < period * 0.25,
  );
  check(
    flanking.length === 2,
    "Each T-tubule must retain two flanking SR cisternae",
  );
  for (const s of flanking)
    triadGap = Math.min(
      triadGap,
      Math.abs(s.center.x - t.center.x) - s.halfWidth - t.halfWidth,
    );
}
check(
  triadGap > 0.001,
  "T and SR membranes must retain a positive cytosolic junctional gap",
);

// A triangle's projection onto the yz plane must stay outside every enclosing
// myofibril cylinder. This is stronger than checking only its vertices.
function triangleDistance(y, z, a, b, c) {
  const cross = (p, q, r) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const p = [y, z],
    sa = cross(a, b, p),
    sb = cross(b, c, p),
    sc = cross(c, a, p);
  const area = cross(a, b, c);
  if (
    Math.abs(area) > 1e-12 &&
    ((sa >= 0 && sb >= 0 && sc >= 0) || (sa <= 0 && sb <= 0 && sc <= 0))
  )
    return 0;
  const edge = (p, q) => {
    const dy = q[0] - p[0],
      dz = q[1] - p[1],
      den = dy * dy + dz * dz;
    const t = den
      ? T.MathUtils.clamp(((y - p[0]) * dy + (z - p[1]) * dz) / den, 0, 1)
      : 0;
    return Math.hypot(y - p[0] - t * dy, z - p[1] - t * dz);
  };
  return Math.min(edge(a, b), edge(b, c), edge(c, a));
}
const organelleStats = [];
fibre.traverse((o) => {
  if (
    !o.isMesh ||
    !["muscleFibreSR", "muscleFibreTriads", "muscleFibreMitochondria"].includes(
      o.userData.hitId,
    )
  )
    return;
  const pos = o.geometry.attributes.position,
    index = o.geometry.index;
  const points = Array.from({ length: pos.count }, (_, i) =>
    new T.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld),
  );
  let radialMax = 0,
    minGap = Infinity;
  for (const p of points) radialMax = Math.max(radialMax, Math.hypot(p.y, p.z));
  const yz = points.map((p) => [p.y, p.z]);
  const box = new T.Box3().setFromPoints(points);
  const nearby = centres.filter(
    ([y, z]) =>
      y > box.min.y - myofibrilRadius &&
      y < box.max.y + myofibrilRadius &&
      z > box.min.z - myofibrilRadius &&
      z < box.max.z + myofibrilRadius,
  );
  for (let i = 0; i < (index?.count || pos.count); i += 3) {
    const a = yz[index ? index.getX(i) : i],
      b = yz[index ? index.getX(i + 1) : i + 1],
      c = yz[index ? index.getX(i + 2) : i + 2];
    for (const [y, z] of nearby)
      minGap = Math.min(
        minGap,
        triangleDistance(y, z, a, b, c) - myofibrilRadius,
      );
  }
  check(
    radialMax < radius - 0.017 + 1e-6,
    `${o.userData.hitId} must remain within the inner sarcolemma`,
  );
  check(
    minGap > 1e-5,
    `${o.userData.hitId} triangles must clear every myofibril`,
  );
  if (o.userData.hitId === "muscleFibreMitochondria")
    check(
      radialMax < 0.824 - 0.036,
      "Entire mitochondrial samples must clear the peripheral nuclear layer",
    );
  organelleStats.push({
    id: o.userData.hitId,
    minMyofibrilGap: minGap,
    maxRadius: radialMax,
  });
});
const mitochondrialBodies = fibre.children.find(
  (o) =>
    o.userData.hitId === "muscleFibreMitochondria" && sameColor(o, "#b49372"),
);
check(
  mitochondrialBodies.geometry.attributes.position.count === 4 * 21 * 13,
  "Preserve all four mitochondrial bodies and their original tessellation",
);

const nucleus = buildMuscleFibre("muscleFibreNuclei");
nucleus.rotation.set(0, 0, 0);
nucleus.updateMatrixWorld(true);
const envelope = nucleus.children.filter(
  (o) =>
    sameColor(o, "#9986b4") ||
    sameColor(o, "#c4b3d2") ||
    o.userData.anatomyRole === "nuclearPoreCollar",
);
const pores = nucleus.children.filter((o) => sameColor(o, "#ded0e0"));
const poreRays = [];
let solidMembraneControls = 0;
for (const mesh of pores) {
  const p = mesh.geometry.attributes.position;
  const size = 9 * 13;
  check(
    p.count % size === 0,
    "Pore markers retain their 8 by 12 torus tessellation",
  );
  for (let base = 0; base < p.count; base += size) {
    const center = new T.Vector3();
    const rings = [];
    for (let i = 0; i < 12; i++) {
      const radialMean = new T.Vector3();
      for (let j = 0; j < 8; j++)
        radialMean.add(
          new T.Vector3().fromBufferAttribute(p, base + j * 13 + i),
        );
      radialMean.divideScalar(8);
      rings.push(radialMean);
      center.add(radialMean);
    }
    center.divideScalar(12);
    const normal = rings[0]
      .clone()
      .sub(center)
      .cross(rings[3].clone().sub(center))
      .normalize();
    if (normal.dot(center) < 0) normal.negate();
    const ray = new T.Raycaster(
      center.clone().addScaledVector(normal, 0.12),
      normal.clone().negate(),
      0,
      0.32,
    );
    poreRays.push({
      center,
      normal,
      hits: ray.intersectObjects(envelope, false).length,
    });
    const tangent = rings[0].clone().sub(center).normalize();
    const control = new T.Raycaster(
      center
        .clone()
        .addScaledVector(tangent, 0.13)
        .addScaledVector(normal, 0.12),
      normal.clone().negate(),
      0,
      0.4,
    );
    const hitColors = new Set(
      control
        .intersectObjects(envelope, false)
        .map((h) => h.object.material.color.getHexString()),
    );
    if (
      hitColors.has(new T.Color("#9986b4").getHexString()) &&
      hitColors.has(new T.Color("#c4b3d2").getHexString())
    )
      solidMembraneControls++;
  }
}
check(poreRays.length === 44, "Preserve all 44 sampled nuclear pores");
check(
  poreRays.every((p) => p.hits === 0),
  "Every nuclear pore must pass through both lipid membranes",
);
check(
  solidMembraneControls >= 40,
  "Nearby non-pore rays must still hit both membranes",
);
check(
  nucleus.children.some((o) => o.userData.anatomyRole === "nuclearPoreCollar"),
  "Each double-envelope aperture requires a joining membrane collar",
);

function topology(meshes) {
  const edges = new Map(),
    directions = new Map(),
    parent = new Map();
  const find = (k) => {
    if (!parent.has(k)) parent.set(k, k);
    let r = k;
    while (parent.get(r) !== r) r = parent.get(r);
    while (k !== r) {
      const n = parent.get(k);
      parent.set(k, r);
      k = n;
    }
    return r;
  };
  const vertexKey = (p) =>
    p
      .toArray()
      .map((x) => Math.round(x * 1e6))
      .join(",");
  let triangles = 0;
  for (const mesh of meshes) {
    const p = mesh.geometry.attributes.position,
      index = mesh.geometry.index;
    const keys = Array.from({ length: p.count }, (_, i) =>
      vertexKey(
        new T.Vector3()
          .fromBufferAttribute(p, i)
          .applyMatrix4(mesh.matrixWorld),
      ),
    );
    for (let i = 0; i < index.count; i += 3) {
      const ids = [
        keys[index.getX(i)],
        keys[index.getX(i + 1)],
        keys[index.getX(i + 2)],
      ];
      if (new Set(ids).size < 3) continue;
      triangles++;
      for (let j = 0; j < 3; j++) {
        const a = ids[j],
          b = ids[(j + 1) % 3],
          key = a < b ? `${a}|${b}` : `${b}|${a}`;
        edges.set(key, (edges.get(key) || 0) + 1);
        directions.set(key, (directions.get(key) || 0) + (a < b ? 1 : -1));
        parent.set(find(a), find(b));
      }
    }
  }
  return {
    triangles,
    components: new Set([...parent.keys()].map(find)).size,
    openEdges: [...edges.values()].filter((x) => x === 1).length,
    nonmanifoldEdges: [...edges.values()].filter((x) => x > 2).length,
    inconsistentWinding: [...edges].filter(
      ([key, count]) => count === 2 && directions.get(key) !== 0,
    ).length,
  };
}
const nuclearTopology = topology(
  nucleus.children.filter((o) =>
    [
      "nuclearOuterMembrane",
      "nuclearInnerMembrane",
      "nuclearPoreCollar",
    ].includes(o.userData.anatomyRole),
  ),
);
check(
  nuclearTopology.components === 1 &&
    nuclearTopology.openEdges === 0 &&
    nuclearTopology.nonmanifoldEdges === 0 &&
    nuclearTopology.inconsistentWinding === 0,
  "Nuclear outer/inner membranes and pore collars must form one joined watertight membrane surface",
);
const srTopology = topology(
  fibre.children.filter((o) =>
    ["connectedSRCisterna", "connectedLongitudinalSR"].includes(
      o.userData.anatomyRole,
    ),
  ),
);
check(
  srTopology.components === 1 &&
    srTopology.openEdges === 0 &&
    srTopology.nonmanifoldEdges === 0 &&
    srTopology.inconsistentWinding === 0,
  "Longitudinal SR and terminal cisternae must share open tube rims, not intersect intact end walls",
);

const summary = {
  myofibrils: centres.length,
  fibrilGap,
  membraneGap,
  nuclearGap,
  triadGap,
  nuclearPores: poreRays.length,
  blockedPores: poreRays.filter((p) => p.hits).length,
  solidMembraneControls,
  nuclearTopology,
  srTopology,
  organelleStats,
  errors,
};
console.log(JSON.stringify(summary, null, 2));
dispose(fibre);
dispose(nucleus);
assert.equal(errors.length, 0, errors.join("\n"));
