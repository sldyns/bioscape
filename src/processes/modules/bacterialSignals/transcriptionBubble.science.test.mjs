import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";
import * as THREE from "three";
import twoComponent from "./twoComponentProcess.js";
import quorumSensing from "./quorumSensingProcess.js";

const vector = () => new THREE.Vector3();
const matrix = new THREE.Matrix4();
const limit = 2e-5;
const names = ["DNA-0-backbone", "DNA-1-backbone"];
let solidChecks = 0;

function instance(mesh, index) {
  mesh.getMatrixAt(index, matrix);
  const transform = new THREE.Matrix4().multiplyMatrices(
    mesh.matrixWorld,
    matrix,
  );
  const scale = vector().setFromMatrixScale(transform);
  return {
    mesh,
    index,
    transform,
    a: new THREE.Vector3(0, -0.5, 0).applyMatrix4(transform),
    b: new THREE.Vector3(0, 0.5, 0).applyMatrix4(transform),
    center: vector().setFromMatrixPosition(transform),
    radius: Math.max(scale.x, scale.z),
  };
}
function instances(mesh) {
  return Array.from({ length: mesh.count }, (_, i) => instance(mesh, i));
}
function nearest(a, b) {
  const u = a.b.clone().sub(a.a),
    v = b.b.clone().sub(b.a),
    w = a.a.clone().sub(b.a),
    A = u.dot(u),
    B = u.dot(v),
    C = v.dot(v),
    D = u.dot(w),
    E = v.dot(w),
    clamp = (t) => Math.max(0, Math.min(1, t));
  let distance = Infinity;
  const test = (s, t) => {
    distance = Math.min(
      distance,
      w.clone().addScaledVector(u, s).addScaledVector(v, -t).length(),
    );
  };
  test(0, C ? clamp(E / C) : 0);
  test(1, C ? clamp((B + E) / C) : 0);
  test(A ? clamp(-D / A) : 0, 0);
  test(A ? clamp((B - D) / A) : 0, 1);
  const determinant = A * C - B * B;
  if (determinant > 1e-15) {
    const s = (B * E - C * D) / determinant,
      t = (A * E - B * D) / determinant;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) test(s, t);
  }
  return distance;
}
function xGap(a, b) {
  return Math.max(
    Math.min(a.a.x, a.b.x) - Math.max(b.a.x, b.b.x),
    Math.min(b.a.x, b.b.x) - Math.max(a.a.x, a.b.x),
  );
}
function prism(cylinder) {
  const count = cylinder.mesh.geometry.parameters.radialSegments,
    positions = cylinder.mesh.geometry.attributes.position,
    vertices = [];
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < count; i++)
      vertices.push(
        vector()
          .fromBufferAttribute(positions, row * (count + 1) + i)
          .applyMatrix4(cylinder.transform),
      );
  const axial = vertices[count].clone().sub(vertices[0]).normalize(),
    edges = [axial],
    normals = [axial];
  for (let i = 0; i < count; i++) {
    const edge = vertices[(i + 1) % count].clone().sub(vertices[i]).normalize();
    edges.push(edge);
    normals.push(vector().crossVectors(axial, edge).normalize());
  }
  return { vertices, edges, normals };
}
// Exact separating-axis test for the actual closed polygonal cylinders, not
// a capsule-only rejection: rounded envelopes can overlap across flat caps.
function intersects(a, b) {
  solidChecks++;
  const p = prism(a),
    q = prism(b);
  const separated = (axis) => {
    const x = p.vertices.map((point) => point.dot(axis)),
      y = q.vertices.map((point) => point.dot(axis));
    return (
      Math.max(...x) < Math.min(...y) - 1e-9 ||
      Math.max(...y) < Math.min(...x) - 1e-9
    );
  };
  for (const axis of [...p.normals, ...q.normals])
    if (separated(axis)) return false;
  for (const u of p.edges)
    for (const v of q.edges) {
      const axis = vector().crossVectors(u, v);
      if (axis.lengthSq() > 1e-15 && separated(axis.normalize())) return false;
    }
  return true;
}
function separate(a, b, message) {
  if (xGap(a, b) > a.radius + b.radius + limit) return Infinity;
  const clearance = nearest(a, b) - a.radius - b.radius;
  assert(clearance > limit || !intersects(a, b), message);
  return clearance;
}
function chainDistance(point, rails) {
  let distance = Infinity;
  for (const rail of rails) {
    if (Math.abs(point.x - rail.center.x) > 0.25) continue;
    distance = Math.min(
      distance,
      new THREE.Line3(rail.a, rail.b)
        .closestPointToPoint(point, true, vector())
        .distanceTo(point),
    );
  }
  return distance;
}
function inspect(scene) {
  scene.group.updateMatrixWorld(true);
  const get = (name) => scene.group.getObjectByName(name),
    rails = names.map((name) => instances(get(name))),
    heads = [0, 1].map((side) => instances(get(`DNA-${side}-phosphates`))),
    bases = [0, 1].map((side) => instances(get(`DNA-${side}-bases`)));
  const minimum = {
    crossCapsule: Infinity,
    selfCapsule: Infinity,
    oppositePhosphates: Infinity,
    phosphateOtherRail: Infinity,
    baseRailAttachment: 0,
  };
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < rails[side].length; i++) {
      if (i > 0)
        assert(
          rails[side][i - 1].b.distanceTo(rails[side][i].a) < limit,
          "DNA backbone remains continuous",
        );
      for (let j = i + 2; j < rails[side].length; j++)
        minimum.selfCapsule = Math.min(
          minimum.selfCapsule,
          separate(
            rails[side][i],
            rails[side][j],
            `same-strand solid collision ${side}:${i}/${j}`,
          ),
        );
      if (side === 0)
        for (let j = 0; j < rails[1].length; j++)
          minimum.crossCapsule = Math.min(
            minimum.crossCapsule,
            separate(
              rails[0][i],
              rails[1][j],
              `opposite-strand solid collision ${i}/${j}`,
            ),
          );
    }
    for (let i = 0; i < heads[side].length; i++) {
      const head = heads[side][i],
        base = bases[side][i];
      assert(
        base.a.distanceTo(head.center) < limit,
        "each base begins at its own sugar-phosphate group",
      );
      const attachment = chainDistance(head.center, rails[side]);
      minimum.baseRailAttachment = Math.max(
        minimum.baseRailAttachment,
        attachment,
      );
      assert(
        attachment < 0.02,
        "base/phosphate starts remain on the actual polygonal backbone",
      );
      for (const other of heads[1 - side]) {
        if (Math.abs(head.center.x - other.center.x) > 0.2) continue;
        const clearance =
          head.center.distanceTo(other.center) - head.radius - other.radius;
        minimum.oppositePhosphates = Math.min(
          minimum.oppositePhosphates,
          clearance,
        );
        assert(
          clearance > limit,
          "opposite-strand phosphate surfaces stay separate",
        );
      }
      const clearance =
        chainDistance(head.center, rails[1 - side]) -
        head.radius -
        rails[1 - side][0].radius;
      minimum.phosphateOtherRail = Math.min(
        minimum.phosphateOtherRail,
        clearance,
      );
      assert(
        clearance > limit,
        "phosphate does not intersect the opposite backbone",
      );
      // Opposite base halves shorten as the bubble opens but remain assigned
      // to their own backbone, rather than becoming a bridge between strands.
      const other = bases[1 - side][i],
        toward = other.a.clone().sub(base.a),
        along = base.b.clone().sub(base.a);
      assert(
        toward.dot(along) > 0 && along.length() < toward.length() * 0.5,
        "base half remains on its own side of the duplex",
      );
    }
  }
  const rna = get("RNA-backbone"),
    site = get("regulatory-RNAP-active-3prime"),
    polymerase = get("bacterial-RNA-polymerase-open-cleft-schematic");
  if (rna.visible) {
    assert(polymerase.visible, "nascent RNA requires active RNAP");
    const segments = instances(rna),
      nucleotides = instances(get("RNA-nucleotides"));
    assert(
      segments[0].a.distanceTo(site.getWorldPosition(vector())) < limit,
      "growing RNA 3-prime end is at the RNAP active site",
    );
    for (let i = 0; i < segments.length; i++) {
      if (i > 0)
        assert(
          segments[i - 1].b.distanceTo(segments[i].a) < limit,
          "single RNA backbone remains continuous",
        );
      assert(
        segments[i].b.distanceTo(nucleotides[i].center) < limit,
        "RNA nucleotide remains attached to its own backbone",
      );
    }
  }
  return minimum;
}
function signature(scene) {
  scene.group.updateMatrixWorld(true);
  const hash = createHash("sha256");
  scene.group.traverse((node) => {
    hash.update(
      JSON.stringify([
        node.visible,
        node.matrixWorld.elements,
        node.material?.uuid,
        node.material?.opacity,
      ]),
    );
    if (node.isInstancedMesh)
      hash.update(Buffer.from(node.instanceMatrix.array.buffer));
  });
  hash.update(JSON.stringify(scene.labels));
  hash.update(JSON.stringify(scene.group.userData));
  return hash.digest("hex");
}
for (const model of [twoComponent, quorumSensing]) {
  const scene = model.create(),
    control = model.controls[0],
    original = [];
  scene.group.traverse((node) =>
    original.push([node, node.geometry, node.material]),
  );
  for (const option of control.options) {
    const parameters = { [control.id]: option.value },
      times = new Set(Array.from({ length: 501 }, (_, i) => i / 500));
    for (const p of [0.7, 0.72, 0.75, 0.77, 0.78, 0.79, 0.8, 0.832, 0.85, 0.94])
      for (const delta of [-1e-7, 0, 1e-7]) times.add(p + delta);
    let count = 0;
    const minima = {
      crossCapsule: Infinity,
      selfCapsule: Infinity,
      oppositePhosphates: Infinity,
      phosphateOtherRail: Infinity,
      baseRailAttachment: 0,
    };
    for (const p of times) {
      scene.update(p, parameters);
      const state = inspect(scene);
      for (const key of Object.keys(minima))
        minima[key] =
          key === "baseRailAttachment"
            ? Math.max(minima[key], state[key])
            : Math.min(minima[key], state[key]);
      count++;
    }
    for (const p of [0.731, 0.75, 0.832, 0.857]) {
      scene.update(p, parameters);
      const expected = signature(scene);
      scene.update(1, {
        [control.id]: control.options.find((o) => o.value !== option.value)
          .value,
      });
      scene.update(0, parameters);
      scene.update(p, parameters);
      assert.equal(
        signature(scene),
        expected,
        "arbitrary cross-condition seeks restore all buffers, labels and state",
      );
    }
    console.log(
      `${model.id}/${option.value}: ${count} states; no intersecting DNA solids; minima ${JSON.stringify(minima)}`,
    );
  }
  const after = [];
  scene.group.traverse((node) =>
    after.push([node, node.geometry, node.material]),
  );
  assert.deepEqual(
    after,
    original,
    "opening allocates no scene objects, geometries or materials",
  );
}

// Compile the unchanged pre-fix helper at its original import location. This
// proves the actual old source fails, without editing live files or relying on
// a test-only analytical approximation of the old path.
const oldSource = fs.readFileSync(
    new URL(
      "./fixtures/structuralDetails-before-bact-20261005-01.txt",
      import.meta.url,
    ),
    "utf8",
  ),
  require = createRequire(import.meta.url);
for (const [id, p, index] of [
  ["twoComponent", 0.832, 71],
  ["quorumSensing", 0.75, 53],
]) {
  const compiled = await esbuild.build({
    entryPoints: [new URL(`./${id}Process.js`, import.meta.url).pathname],
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    write: false,
    plugins: [
      {
        name: "baseline-helper",
        setup(build) {
          build.onLoad(
            { filter: /\/bacterialSignals\/structuralDetails\.js$/ },
            () => ({ contents: oldSource, loader: "js" }),
          );
        },
      },
    ],
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled.outputFiles[0].text)(
    require,
    module,
    module.exports,
  );
  const oldScene = module.exports.default.create();
  oldScene.update(p);
  oldScene.group.updateMatrixWorld(true);
  const [a, b] = names.map((name) =>
    instance(oldScene.group.getObjectByName(name), index),
  );
  assert(
    intersects(a, b),
    "baseline witness intersects actual 16-sided solids",
  );
  assert.throws(
    () => separate(a, b, "opposite-strand solid collision"),
    /opposite-strand solid collision/,
  );
  console.log(
    `${id}: unchanged baseline helper rejected at ${p}; centerline distance ${nearest(a, b)}`,
  );
}
console.log(
  `BACT-20261005-01: actual polygonal-solid checks ${solidChecks}; old source fails and corrected source passes.`,
);
