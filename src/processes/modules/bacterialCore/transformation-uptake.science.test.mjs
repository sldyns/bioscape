import assert from "node:assert/strict";
import * as THREE from "three";
import transformation from "./transformationProcess.js";
import { segmentWriter } from "./bacterialGeometry.js";

const ends = (mesh) =>
  [-0.5, 0.5].map((y) => mesh.localToWorld(new THREE.Vector3(0, y, 0)));
const named = (scene, prefix, count) =>
  Array.from({ length: count }, (_, i) => {
    const node = scene.group.getObjectByName(`${prefix}${i}`);
    assert(node, `${prefix}${i} exists`);
    return node;
  });
const visible = (node) => {
  for (let current = node; current; current = current.parent)
    if (!current.visible) return false;
  return true;
};
const near = (a, b, message, tolerance = 2e-5) =>
  assert(a.distanceTo(b) < tolerance, `${message}: ${a.distanceTo(b)}`);

function retainedBackbone(scene) {
  return [
    ...named(scene, "external-strand-0-", 54),
    ...named(scene, "ComEC-transiting-strand-", 16),
    ...named(scene, "incoming-strand-", 35),
  ].filter(visible);
}

function uptakeCheck(scene, context = "") {
  const retained = retainedBackbone(scene);
  for (let i = 1; i < retained.length; i++)
    near(
      ends(retained[i - 1])[1],
      ends(retained[i])[0],
      `one retained strand stays continuous: ${retained[i - 1].name} -> ${retained[i].name} ${context}`,
    );

  // Test crossings against the actual torus openings, not a duplicated route
  // formula or a userData flag. Once the leading end has passed a mouth, the
  // retained backbone must traverse its empty lumen and clear its protein rim.
  for (const name of ["ComEC-outer-mouth", "ComEC-inner-mouth"]) {
    const mouth = scene.group.getObjectByName(name);
    assert(mouth, `${name} exists`);
    const localEnds = retained.map((mesh) =>
      ends(mesh).map((point) => mouth.worldToLocal(point)),
    );
    const spansPlane =
      Math.min(...localEnds.flat().map((point) => point.z)) < -1e-4 &&
      Math.max(...localEnds.flat().map((point) => point.z)) > 1e-4;
    if (!spansPlane) continue;
    const crossings = [];
    localEnds.forEach(([a, b], i) => {
      if (a.z * b.z <= 0 && Math.abs(b.z - a.z) > 1e-8) {
        const point = a.clone().lerp(b, -a.z / (b.z - a.z));
        const radius = Math.max(retained[i].scale.x, retained[i].scale.z);
        assert(
          Math.hypot(point.x, point.y) + radius <
            mouth.geometry.parameters.radius - mouth.geometry.parameters.tube,
          "ssDNA crosses the actual ComEC lumen rather than its protein rim",
        );
        if (!crossings.some((old) => old.distanceTo(point) < 2e-5))
          crossings.push(point);
      }
    });
    assert.equal(
      crossings.length,
      1,
      "one nonbranching DNA crossing per mouth",
    );
  }

  // The degraded partner stops outside the pore; it is never drawn through
  // the same transmembrane lumen as a second imported strand.
  const outer = scene.group
    .getObjectByName("ComEC-outer-mouth")
    .getWorldPosition(new THREE.Vector3());
  for (const node of named(scene, "external-strand-1-", 54).filter(visible))
    for (const point of ends(node))
      assert(point.x < outer.x - 0.08, "the other DNA strand stays outside");
}

function exchangeEndpoint(scene, progress, parameters) {
  scene.update(progress, parameters);
  scene.group.updateMatrixWorld(true);
  return ends(scene.group.getObjectByName("incoming-strand-34"))[1];
}

function terminalContinuityCheck(endpointAt) {
  const at = endpointAt(0.87);
  for (const epsilon of [1e-3, 1e-4, 1e-5, 1e-6, 1e-7]) {
    const before = endpointAt(0.87 - epsilon),
      after = endpointAt(0.87 + epsilon);
    near(
      before,
      at,
      "the terminal pairing endpoint converges continuously",
      epsilon * 0.02,
    );
    near(after, at, "the exchanged endpoint remains at the chromosome");
  }
}

// A positive signed triple product has the same convention as the experimentally
// right-handed 1BNA duplex. Use actual consecutive world-space tube endpoints;
// reversing strand direction does not reverse the handedness test.
function duplexHandednessCheck(scene) {
  for (const side of [0, 1]) {
    const points = named(scene, `external-strand-${side}-`, 54)
      .slice(0, 12)
      .map((mesh) => ends(mesh)[0]);
    for (let i = 0; i < points.length - 3; i++) {
      const a = points[i + 1].clone().sub(points[i]),
        b = points[i + 2].clone().sub(points[i + 1]),
        c = points[i + 3].clone().sub(points[i + 2]);
      assert(
        a.cross(b).dot(c) > 1e-8,
        "both environmental DNA backbones have right-handed B-DNA geometry",
      );
    }
  }
}

const scene = transformation.create();
scene.update(0);
scene.group.updateMatrixWorld(true);
duplexHandednessCheck(scene);
let states = 0;
for (const homology of ["matched", "absent"]) {
  const parameters = { homology };
  // Offset samples avoid relying on the author's mesh/clipping grid. Include
  // onset, complete uptake and trailing-pore-release boundaries from both sides.
  const samples = new Set([
    ...Array.from({ length: 121 }, (_, i) => 0.24 + ((i + 0.37) / 121) * 0.37),
    ...[0.24, 0.27, 0.57, 0.61].flatMap((p) => [p - 1e-7, p, p + 1e-7]),
    0.3,
    0.35,
    0.42,
    0.48,
    0.55,
  ]);
  for (const p of samples) {
    scene.update(p, parameters);
    scene.group.updateMatrixWorld(true);
    uptakeCheck(scene, `${homology} at ${p}`);
    states++;
  }
  terminalContinuityCheck((p) => exchangeEndpoint(scene, p, parameters));
  const expected = exchangeEndpoint(scene, 0.8699, parameters);
  exchangeEndpoint(scene, 0.241, parameters);
  exchangeEndpoint(scene, 0.999, parameters);
  near(
    exchangeEndpoint(scene, 0.8699, parameters),
    expected,
    "irregular seeks retain the same terminal geometry",
  );
}

// Reintroduce each original failure in the actual scene and prove that the
// invariant rejects it. Removing the transiting DNA recreates a free gap at
// ComEC; lifting the last endpoint recreates the old .18 terminal snap.
scene.update(0.42, { homology: "matched" });
scene.group.updateMatrixWorld(true);
for (const node of named(scene, "ComEC-transiting-strand-", 16))
  node.visible = false;
assert.throws(() => uptakeCheck(scene), assert.AssertionError);
const write = segmentWriter();
assert.throws(
  () =>
    terminalContinuityCheck((p) => {
      exchangeEndpoint(scene, p, { homology: "matched" });
      const terminal = scene.group.getObjectByName("incoming-strand-34"),
        [start, endpoint] = ends(terminal);
      if (p < 0.87) {
        endpoint.z += 0.18;
        write(terminal, start.toArray(), endpoint.toArray(), 0.038);
        scene.group.updateMatrixWorld(true);
      }
      return ends(terminal)[1];
    }),
  assert.AssertionError,
);
scene.update(0);
scene.group.updateMatrixWorld(true);
for (const side of [0, 1])
  for (const mesh of named(scene, `external-strand-${side}-`, 54)) {
    const [a, b] = ends(mesh);
    a.z = 0.34 - a.z;
    b.z = 0.34 - b.z;
    write(mesh, a.toArray(), b.toArray(), 0.034);
  }
scene.group.updateMatrixWorld(true);
assert.throws(() => duplexHandednessCheck(scene), assert.AssertionError);

console.log(
  `transformation uptake: ${states} actual-geometry states, single pore crossings, continuous pairing endpoint, right-handed duplex and three defect mutations passed`,
);
