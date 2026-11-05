import assert from "node:assert/strict";
import { LineCurve3, CurvePath, Vector3, TubeGeometry } from "three";
import { preparedLineCurve3 } from "../src/processes/preparedLineCurve.js";

let seed = 423931;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return (seed / 4294967296 - 0.5) * 20;
};
const pairs = [
  [
    [0, 0, 0],
    [0, 0, 0],
  ],
  [
    [-0, 0, -Number.MIN_VALUE],
    [0, -0, Number.MIN_VALUE],
  ],
  [
    [-3.7, 1.2, 0.08],
    [2.1, -4.9, 0.13],
  ],
  [
    [Number.MAX_VALUE, 1, -1],
    [-Number.MAX_VALUE, 2, 3],
  ],
  [
    [Infinity, 1, 2],
    [3, 4, 5],
  ],
  [
    [NaN, 1, 2],
    [3, 4, 5],
  ],
];
for (let i = 0; i < 250; i++)
  pairs.push([
    [random(), random(), random()],
    [random(), random(), random()],
  ]);
for (const [a, b] of pairs) {
  const reference = new LineCurve3(new Vector3(...a), new Vector3(...b));
  const candidate = preparedLineCurve3(new Vector3(...a), new Vector3(...b));
  assert.equal(Object.getPrototypeOf(candidate), LineCurve3.prototype);
  assert.deepEqual(candidate.getLengths(), reference.getLengths());
  assert.equal(candidate.getLength(), reference.getLength());
  for (const t of [0, 0.001, 0.25, 0.5, 0.999, 1]) {
    const targetA = new Vector3(),
      targetB = new Vector3();
    assert.equal(reference.getPointAt(t, targetA), targetA);
    assert.equal(candidate.getPointAt(t, targetB), targetB);
    assert.deepEqual(targetB.toArray(), targetA.toArray());
  }
  assert.deepEqual(candidate.toJSON(), reference.toJSON());
}

// Prepared data retains the normal Three.js invalidation and division changes.
const original = new LineCurve3(new Vector3(-1, 2, 3), new Vector3(4, 5, 6));
const prepared = preparedLineCurve3(
  new Vector3(-1, 2, 3),
  new Vector3(4, 5, 6),
);
original.getLengths();
original.v2.set(2, -3, 7);
prepared.v2.set(2, -3, 7);
original.updateArcLengths();
prepared.updateArcLengths();
assert.deepEqual(prepared.getLengths(), original.getLengths());
assert.deepEqual(prepared.getLengths(17), original.getLengths(17));
assert.deepEqual(prepared.getLengths(), original.getLengths());

// Exercise the composed path, tangent sampling and the full-resolution tubes
// used by the chromatin helper, including repeated points and arc boundaries.
const points = [
  new Vector3(0, 0, 0),
  new Vector3(0, 0, 0),
  ...Array.from(
    { length: 43 },
    (_, i) => new Vector3(Math.cos(i * 0.37), Math.sin(i * 0.37), i * 0.013),
  ),
  new Vector3(0.2, 0.4, -0.3),
  new Vector3(0.2, 0.4, -0.3),
];
const pathA = new CurvePath(),
  pathB = new CurvePath();
for (let i = 1; i < points.length; i++) {
  pathA.add(new LineCurve3(points[i - 1].clone(), points[i].clone()));
  pathB.add(preparedLineCurve3(points[i - 1].clone(), points[i].clone()));
}
assert.deepEqual(pathB.getCurveLengths(), pathA.getCurveLengths());
const times = [
  ...Array.from({ length: 501 }, (_, i) => i / 500),
  ...pathA.getCurveLengths().map((length) => length / pathA.getLength()),
];
for (const t of times) {
  for (const method of ["getPoint", "getPointAt", "getTangent", "getTangentAt"])
    assert.deepEqual(pathB[method](t).toArray(), pathA[method](t).toArray());
}
const tubeA = new TubeGeometry(pathA, 1800, 0.004, 5, false);
const tubeB = new TubeGeometry(pathB, 1800, 0.004, 5, false);
for (const name of Object.keys(tubeA.attributes))
  assert.deepEqual(tubeB.attributes[name].array, tubeA.attributes[name].array);
assert.deepEqual(tubeB.index.array, tubeA.index.array);
tubeA.dispose();
tubeB.dispose();
console.log(
  `Prepared line curves: ${pairs.length} exact sampled-length fixtures, invalidation, composed tangents and full-resolution tube buffers PASS`,
);
