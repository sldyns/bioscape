import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as T from "three";
import { loadSceneReferences } from "./helpers/load-scene-references.mjs";
const modules = await loadSceneReferences(
  `export { default as data } from "./src/scene/data/dna-1bna.json";
        export { dnaDuplexReference } from "./src/scene/dnaDuplexReference.js";
        export { loadDetailModel } from "./src/scene/loadDetailModel.js";
        export { packDetail, unpackDetail } from "./src/scene/detailTransfer.js";
        export { makePresentation } from "./src/scene/presentation.js";
        export { specimenDirection } from "./src/scene/specimenViews.js";
        export { explodedFitDistance } from "./src/scene/viewFraming.js";`,
);
const {
  data,
  dnaDuplexReference,
  loadDetailModel,
  packDetail,
  unpackDetail,
  makePresentation,
  specimenDirection,
  explodedFitDistance,
} = modules;

const V = (...p) => new T.Vector3(...p);
const mean = (points) =>
  points.reduce((sum, p) => sum.add(p), V()).divideScalar(points.length);
const average = (values) =>
  values.reduce((sum, x) => sum + x, 0) / values.length;
const deposited = [],
  residues = new Map();
assert.equal(data.entry, "1BNA");
assert.equal(data.resolutionAngstrom, 1.9);
assert.equal(data.chains.length, 2);
for (const strand of data.chains) {
  assert.equal(strand.residues.length, 12);
  for (const [index, row] of strand.residues.entries()) {
    const atoms = {};
    const names = data.backboneAtoms.concat(data.baseAtoms[row.base]);
    assert.equal(row.xyz.length, names.length * 3);
    names.forEach((name, i) => {
      const coords = row.xyz.slice(3 * i, 3 * i + 3);
      if (coords[0] === null) {
        assert.equal(index, 0);
        assert.ok(["P", "OP1", "OP2"].includes(name));
        return;
      }
      assert.ok(coords.every(Number.isInteger));
      atoms[name] = V(...coords).multiplyScalar(data.coordinateUnitAngstrom);
      deposited.push(atoms[name]);
    });
    assert.ok(atoms["O5'"] && atoms["O3'"] && !atoms["O2'"]);
    if (index > 0) {
      const previous = residues.get(strand.residues[index - 1].number);
      const length = previous.atoms["O3'"].distanceTo(atoms.P);
      assert.ok(length > 1.4 && length < 1.85);
    }
    residues.set(row.number, { base: row.base, atoms });
  }
}
assert.equal(deposited.length, 486);
const wc = {
  AT: ["N6-O4", "N1-N3"],
  GC: ["O6-N4", "N1-N3", "N2-O2"],
};
const pairTypes = { AT: 0, GC: 0 },
  distances = [],
  axes = [];
const ring = ["N1", "C2", "N3", "C4", "C5", "C6"];
for (const [a, b, contacts] of data.pairs) {
  assert.equal(a + b, 25);
  const one = residues.get(a),
    two = residues.get(b);
  const inOrder = ["A", "G"].includes(one.base);
  const code = inOrder ? one.base + two.base : two.base + one.base;
  assert.deepEqual(
    contacts.map((ab) => (inOrder ? ab : [...ab].reverse()).join("-")),
    wc[code],
  );
  pairTypes[code]++;
  for (const [x, y] of contacts)
    distances.push(one.atoms[x].distanceTo(two.atoms[y]));
  axes.push(mean([one, two].flatMap(({ atoms }) => ring.map((n) => atoms[n]))));
}
assert.deepEqual(pairTypes, { AT: 4, GC: 8 });
assert.equal(distances.length, 32);
assert.ok(Math.min(...distances) > 2.6 && Math.max(...distances) < 3.25);

// Project the C1′ sites around a single fitted global duplex direction. This
// measures strand angular asymmetry, independent of the artistic display pose.
const center = mean(axes),
  direction = axes.at(-1).clone().sub(axes[0]).normalize();
function radial(p) {
  const v = p.clone().sub(center);
  return v.addScaledVector(direction, -v.dot(direction)).normalize();
}
const twist = [],
  separations = [];
let previous;
for (const [a, b] of data.pairs) {
  const r = radial(residues.get(a).atoms["C1'"]),
    s = radial(residues.get(b).atoms["C1'"]);
  separations.push(T.MathUtils.radToDeg(r.angleTo(s)));
  if (previous)
    twist.push(
      T.MathUtils.radToDeg(
        Math.atan2(direction.dot(previous.clone().cross(r)), previous.dot(r)),
      ),
    );
  previous = r;
}
assert.ok(
  twist.every((angle) => angle > 20 && angle < 47),
  "right-handed progression",
);
assert.ok(
  average(separations) > 125 && average(separations) < 134,
  "unequal groove openings",
);
assert.ok(Math.abs(axes.at(-1).distanceTo(axes[0]) / 11 - 3.346) < 0.004);

// The atom spheres in the merged mesh retain their poles. Recover the actual
// centers and verify their distance matrix and signed handedness against PDB.
function sphereCenters(geometry) {
  const p = geometry.attributes.position,
    n = geometry.attributes.normal,
    found = [];
  for (let i = 0; i + 116 < p.count; i++) {
    if (
      n.getY(i) < 0.99999 ||
      n.getY(i + 12) < 0.99999 ||
      n.getY(i + 104) > -0.99999
    )
      continue;
    if (
      Math.abs(p.getX(i) - p.getX(i + 12)) > 1e-5 ||
      Math.abs(p.getZ(i) - p.getZ(i + 104)) > 1e-5
    )
      continue;
    found.push(
      V()
        .fromBufferAttribute(p, i)
        .lerp(V().fromBufferAttribute(p, i + 104), 0.5),
    );
    i += 116;
  }
  return found;
}
function handedness(points) {
  const [a, b, c, d] = [0, 23, 115, 380].map((i) => points[i]);
  return Math.sign(
    b.clone().sub(a).cross(c.clone().sub(a)).dot(d.clone().sub(a)),
  );
}
const raw = dnaDuplexReference("dna");
assert.equal(dnaDuplexReference("unrelated"), null);
const drawn = sphereCenters(raw.children[0].geometry);
assert.equal(drawn.length, 486);
for (let i = 0; i < drawn.length; i++)
  for (let j = 0; j < i; j++)
    assert.ok(
      Math.abs(
        drawn[i].distanceTo(drawn[j]) - deposited[i].distanceTo(deposited[j]),
      ) < 1e-5,
    );
assert.equal(handedness(drawn), handedness(deposited));
assert.ok(handedness(drawn));

// The shortest non-bonded intranucleotide separation in this deposit exceeds
// 2.10 Å. Every covalent heavy-atom bond measures less than 1.61 Å.
const expectedBonds = new Set();
const bondKey = (i, j) => [Math.min(i, j), Math.max(i, j)].join("/");
for (const strand of data.chains) {
  let priorOxygen;
  for (const r of strand.residues) {
    const atoms = residues.get(r.number).atoms,
      list = Object.values(atoms);
    for (const [i, a] of list.entries()) {
      for (const b of list.slice(0, i)) {
        if (a.distanceTo(b) < 1.9)
          expectedBonds.add(
            bondKey(deposited.indexOf(a), deposited.indexOf(b)),
          );
      }
    }
    if (priorOxygen)
      expectedBonds.add(
        bondKey(deposited.indexOf(priorOxygen), deposited.indexOf(atoms.P)),
      );
    priorOxygen = atoms["O3'"];
  }
}
const positions = raw.children[0].geometry.attributes.position;
const vertex = (i) => V().fromBufferAttribute(positions, i);
const actualBonds = new Set();
for (let i = 0; i + 21 < positions.count; i++) {
  // Each covalent rod contributes two parallel ten-sided rings with a seam.
  if (
    vertex(i).distanceToSquared(vertex(i + 10)) > 1e-10 ||
    vertex(i + 11).distanceToSquared(vertex(i + 21)) > 1e-10 ||
    vertex(i).distanceToSquared(vertex(i + 1)) < 1e-4 ||
    vertex(i).distanceToSquared(vertex(i + 11)) < 1
  )
    continue;
  const vertices = (offset) =>
    Array.from({ length: 10 }, (_, k) => vertex(i + offset + k));
  const atom = (point) =>
    drawn.findIndex((p) => p.distanceToSquared(point) < 1e-9);
  const a = atom(mean(vertices(0))),
    b = atom(mean(vertices(11)));
  assert.ok(a >= 0 && b >= 0, "covalent rods terminate at modeled atoms");
  const key = bondKey(a, b);
  assert.ok(!actualBonds.has(key), "shared purine edge is drawn once");
  actualBonds.add(key);
  i += 21;
}
assert.equal(expectedBonds.size, 544);
assert.deepEqual(actualBonds, expectedBonds);

// Every ellipsoidal dash is centered on its inferred donor/acceptor segment.
let dashOffset = positions.count - 64 * 63;
for (const [a, b, contacts] of data.pairs) {
  for (const [nameA, nameB] of contacts) {
    const one = drawn[deposited.indexOf(residues.get(a).atoms[nameA])];
    const two = drawn[deposited.indexOf(residues.get(b).atoms[nameB])];
    for (const t of [0.32, 0.68]) {
      const actual = vertex(dashOffset).lerp(vertex(dashOffset + 54), 0.5);
      assert.ok(actual.distanceTo(one.clone().lerp(two, t)) < 1e-5);
      dashOffset += 63;
    }
  }
}
assert.equal(dashOffset, positions.count);

function digest(geometry) {
  const hash = createHash("sha256");
  for (const a of [
    geometry.attributes.position,
    geometry.attributes.normal,
    geometry.attributes.color,
    geometry.index,
  ]) {
    hash.update(
      new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength),
    );
  }
  return hash.digest("hex");
}
let firstDigest, firstLabels;
const stats = [];
for (const id of ["dna", "bacterialDNA"]) {
  const model = await loadDetailModel(id);
  assert.equal(model.children.length, 1);
  const geometry = model.children[0].geometry;
  assert.ok(geometry.attributes.color.normalized);
  assert.ok(geometry.attributes.color.array instanceof Uint8Array);
  assert.ok(geometry.index.count % 3 === 0);
  assert.ok(geometry.index.count / 3 < 130000);
  assert.ok(model.children.every((m) => m.userData.hitId === id));
  const fingerprint = digest(geometry);
  if (firstDigest) assert.equal(fingerprint, firstDigest);
  firstDigest = fingerprint;
  const { payload, buffers } = packDetail(model, {
    prepareBounds: true,
    prepareSpheres: false,
  });
  const bytes = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  assert.ok(bytes < 4300000);
  const restored = unpackDetail(
    structuredClone(payload, { transfer: buffers }),
  );
  assert.ok(buffers.every((buffer) => !buffer.byteLength));
  assert.equal(fingerprint, digest(restored.children[0].geometry));
  assert.ok(restored.children[0].geometry.boundingBox);
  assert.equal(restored.children[0].geometry.boundingSphere, null);
  const presentation = makePresentation(null, id, restored);
  const { root, parts, landmarks } = presentation;
  assert.equal(landmarks.length, 8);
  if (firstLabels) assert.deepEqual(landmarks, firstLabels);
  firstLabels = landmarks;
  const termini = landmarks.filter((mark) =>
    /Strand [AB] · [35]′ end/.test(mark.en),
  );
  assert.equal(termini.length, 4);
  assert.deepEqual(
    new Set(termini.map((m) => m.pdbAtoms[0])),
    new Set(["A:1:O5'", "B:13:O5'", "A:12:O3'", "B:24:O3'"]),
  );
  assert.ok(
    landmarks
      .find((m) => m.en === "Major groove edge")
      .pdbAtoms[0].endsWith(":N7"),
  );
  assert.ok(
    landmarks
      .find((m) => m.en === "Minor groove edge")
      .pdbAtoms[0].endsWith(":O2"),
  );
  const direction = V(...specimenDirection(id)).normalize();
  const orientation = new T.Matrix4().lookAt(direction, V(), V(0, 1, 0));
  const axes = [0, 1, 2].map((i) => V().setFromMatrixColumn(orientation, i));
  let worstOcclusion = 0;
  for (const aspect of [1.5, 0.65]) {
    const camera = direction
      .clone()
      .multiplyScalar(explodedFitDistance(parts, 0, aspect, 36, axes));
    for (const m of landmarks) {
      assert.ok(m.zh && m.en && m.position.toArray().every(Number.isFinite));
      const ray = new T.Raycaster(
        camera,
        m.position.clone().sub(camera).normalize(),
      );
      const hit = ray.intersectObject(root, true)[0];
      assert.equal(hit?.object.userData.hitId, id);
      const occlusion = hit.point.distanceTo(m.position);
      worstOcclusion = Math.max(worstOcclusion, occlusion);
      assert.ok(
        occlusion < 0.008,
        `${id} · ${m.en}: occlusion ${occlusion.toFixed(4)}`,
      );
    }
  }
  stats.push({
    id,
    meshes: parts[0].children.length,
    triangles: restored.children[0].geometry.index.count / 3,
    bytes,
    worstOcclusion,
  });
  root.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
}
console.log(
  JSON.stringify({
    entry: data.entry,
    atoms: drawn.length,
    covalentBonds: actualBonds.size,
    hydrogenBondDashes: 64,
    pairs: pairTypes,
    hbondRangeAngstrom: [Math.min(...distances), Math.max(...distances)].map(
      (n) => +n.toFixed(3),
    ),
    stats,
  }),
);
