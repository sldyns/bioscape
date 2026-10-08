import assert from "node:assert/strict";
import { BufferAttribute, BufferGeometry, Vector3 } from "three";
import {
  buildFacingBounds,
  classifyFacingCluster,
} from "../src/scene/facingCull.js";

// Test against the actual stored triangles, independently of the implementation's
// sphere/normal-cone bound. The extrema below hold for every eye in the ball.
const TRIANGLES_PER_CLUSTER = 8;
const counters = { fixtures: 0, clusters: 0, balls: 0, culled: 0, signs: 0 };
const directions = [[0, 0, 0]];
for (let i = 0; i < 34; i++) {
  const z = 1 - (2 * (i + 0.5)) / 34;
  const angle = i * Math.PI * (3 - Math.sqrt(5));
  const r = Math.sqrt(1 - z * z);
  directions.push([r * Math.cos(angle), r * Math.sin(angle), z]);
}
for (const s of [-1, 1])
  for (let axis = 0; axis < 3; axis++) {
    const v = [0, 0, 0];
    v[axis] = s;
    directions.push(v);
  }

function geometryFrom(triangles, Index = Uint16Array) {
  const geometry = new BufferGeometry();
  const positions = Float32Array.from(triangles.flat(2));
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  // Deliberately unrelated vertex normals: fixed-function facing uses winding.
  const shadingNormals = Float32Array.from(positions, (_, i) => (i % 3) - 1);
  geometry.setAttribute("normal", new BufferAttribute(shadingNormals, 3));
  geometry.setIndex(
    new BufferAttribute(
      Index.from({ length: positions.length / 3 }, (_, i) => i),
      1,
    ),
  );
  return geometry;
}

function trianglesFrom(geometry, cluster) {
  const p = geometry.attributes.position.array;
  const index = geometry.index.array;
  const result = [];
  const first = cluster * TRIANGLES_PER_CLUSTER * 3;
  const end = Math.min(first + TRIANGLES_PER_CLUSTER * 3, index.length);
  for (let i = first; i < end; i += 3) {
    const a = Array.from(p.subarray(index[i] * 3, index[i] * 3 + 3));
    const b = Array.from(p.subarray(index[i + 1] * 3, index[i + 1] * 3 + 3));
    const c = Array.from(p.subarray(index[i + 2] * 3, index[i + 2] * 3 + 3));
    const u = b.map((v, j) => v - a[j]);
    const v = c.map((value, j) => value - a[j]);
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    result.push({ a, normal, length: Math.hypot(...normal) });
  }
  return result;
}

function verifyBall(geometry, bounds, cluster, eye, radius, label) {
  const mask = classifyFacingCluster(
    bounds,
    cluster,
    new Vector3(...eye),
    radius,
  );
  assert.ok([1, 2, 3].includes(mask), `${label}: invalid pass mask ${mask}`);
  counters.balls++;
  if (mask === 3) return mask;
  counters.culled++;
  for (const { a, normal, length } of trianglesFrom(geometry, cluster)) {
    assert.ok(
      length > 0,
      `${label}: a degenerate triangle must remain uncertain`,
    );
    const signed = normal.reduce((sum, n, i) => sum + n * (eye[i] - a[i]), 0);
    if (!(mask & 1))
      assert.ok(
        signed - radius * length > 0,
        `${label}: removed a possible back face`,
      );
    if (!(mask & 2))
      assert.ok(
        signed + radius * length < 0,
        `${label}: removed a possible front face`,
      );
    // Include both exact extremizers, boundary directions and interior points.
    const extrema = [-1, 1].map((s) => normal.map((n) => (s * n) / length));
    for (const d of [...directions, ...extrema]) {
      for (const fraction of [0.37, 1]) {
        const value = normal.reduce(
          (sum, n, i) => sum + n * (eye[i] + radius * fraction * d[i] - a[i]),
          0,
        );
        assert.ok(
          mask === 2 ? value > 0 : value < 0,
          `${label}: sampled eye disagrees`,
        );
        counters.signs++;
      }
    }
  }
  return mask;
}

function runFixture(label, geometry, balls) {
  const clusters = Math.ceil(
    geometry.index.count / (TRIANGLES_PER_CLUSTER * 3),
  );
  const before = Object.values(geometry.attributes)
    .map((attribute) => Buffer.from(attribute.array.buffer).toString("hex"))
    .concat(Buffer.from(geometry.index.array.buffer).toString("hex"));
  const bounds = new Float64Array(clusters * 8);
  buildFacingBounds(geometry, 0, clusters, bounds);
  assert.ok(bounds.every(Number.isFinite), `${label}: finite bounds`);
  for (let cluster = 0; cluster < clusters; cluster++) {
    counters.clusters++;
    for (const { eye, radius, expected } of balls) {
      const actual = verifyBall(geometry, bounds, cluster, eye, radius, label);
      if (expected !== undefined)
        assert.equal(
          actual,
          expected,
          `${label}: pass mask at ${eye}, r=${radius}`,
        );
    }
  }
  const after = Object.values(geometry.attributes)
    .map((attribute) => Buffer.from(attribute.array.buffer).toString("hex"))
    .concat(Buffer.from(geometry.index.array.buffer).toString("hex"));
  assert.deepEqual(
    after,
    before,
    `${label}: source attribute/index bytes changed`,
  );
  counters.fixtures++;
  return bounds;
}

const planar = Array.from({ length: 8 }, (_, i) => {
  const x = (i % 4) * 0.25;
  const y = Math.floor(i / 4) * 0.25;
  return [
    [x, y, 0],
    [x + 0.2, y, 0],
    [x, y + 0.2, 0],
  ];
});
const boundaryBalls = [
  { eye: [0.4, 0.2, 20], radius: 0, expected: 2 },
  { eye: [0.4, 0.2, -20], radius: 0.4, expected: 1 },
  { eye: [0.4, 0.2, 0], radius: 0, expected: 3 },
  { eye: [0.4, 0.2, 0.3], radius: 0.3, expected: 3 },
  { eye: [0.4, 0.2, -0.3], radius: 0.3, expected: 3 },
  { eye: [0.4, 0.2, 0.3], radius: 0.5, expected: 3 },
];
for (const Index of [Uint16Array, Uint32Array]) {
  runFixture(
    `planar ${Index.name}`,
    geometryFrom(planar, Index),
    boundaryBalls,
  );
  runFixture(
    `reversed winding ${Index.name}`,
    geometryFrom(
      planar.map(([a, b, c]) => [a, c, b]),
      Index,
    ),
    boundaryBalls.map((ball) => ({
      ...ball,
      expected: ball.expected === 3 ? 3 : 3 - ball.expected,
    })),
  );
}
for (const permutation of [
  [2, 0, 1],
  [1, 2, 0],
])
  runFixture(
    `rotated normal ${permutation}`,
    geometryFrom(planar.map((t) => t.map((p) => permutation.map((i) => p[i])))),
    boundaryBalls.map((ball) => ({
      ...ball,
      eye: permutation.map((i) => ball.eye[i]),
    })),
  );
const remapped = geometryFrom(planar, Uint32Array);
const oldPositions = remapped.attributes.position.array.slice();
const vertexCount = remapped.attributes.position.count;
for (let i = 0; i < vertexCount; i++) {
  remapped.attributes.position.array.set(
    oldPositions.subarray(i * 3, i * 3 + 3),
    (vertexCount - 1 - i) * 3,
  );
  remapped.index.array[i] = vertexCount - 1 - i;
}
runFixture("nonsequential indexed vertices", remapped, boundaryBalls);
const uncertainBalls = [
  { eye: [0.4, 0.2, 20], radius: 0, expected: 3 },
  { eye: [0.4, 0.2, -20], radius: 0.4, expected: 3 },
  { eye: [4000, -2000, 10000], radius: 30, expected: 3 },
];
runFixture(
  "opposed winding",
  geometryFrom(planar.map(([a, b, c], i) => (i % 2 ? [a, c, b] : [a, b, c]))),
  uncertainBalls,
);
const line = [
  [0, 0, 0],
  [1, 0, 0],
  [2, 0, 0],
];
runFixture("all degenerate", geometryFrom(Array(8).fill(line)), uncertainBalls);
runFixture(
  "one degenerate",
  geometryFrom([...planar.slice(0, 7), line]),
  uncertainBalls,
);

// Seventeen triangles exercise a partial final cluster. Build the three ranges
// out of order and ensure each call leaves other clusters untouched.
const partialGeometry = geometryFrom(
  [
    ...planar,
    ...planar.map((triangle) => triangle.map(([x, y, z]) => [x, y, z + 1])),
    planar[0].toReversed(),
  ],
  Uint32Array,
);
const fullBounds = runFixture("partial cluster", partialGeometry, [
  { eye: [0.4, 0.2, 20], radius: 0.2 },
  { eye: [0.4, 0.2, -20], radius: 0.2 },
]);
const partialBounds = new Float64Array(24).fill(NaN);
for (const cluster of [2, 0, 1]) {
  const before = partialBounds.slice();
  buildFacingBounds(partialGeometry, cluster, cluster + 1, partialBounds);
  for (let i = 0; i < partialBounds.length; i++)
    if (Math.floor(i / 8) !== cluster)
      assert.ok(
        Object.is(partialBounds[i], before[i]),
        "partial build wrote outside requested range",
      );
}
assert.deepEqual(partialBounds, fullBounds, "chunk order changed bounds");
buildFacingBounds(partialGeometry, 1, 1, partialBounds);
assert.deepEqual(partialBounds, fullBounds, "empty build range changed bounds");
assert.equal(
  classifyFacingCluster(partialBounds, 2, new Vector3(0.4, 0.2, 20), 0.2),
  1,
);

let seed = 0x34e632ad;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
}
function jitter(size) {
  return (random() - 0.5) * size;
}
for (const spread of [0.01, 0.4, 2, 7]) {
  const triangles = Array.from({ length: 24 }, () => {
    const a = [jitter(2), jitter(2), jitter(spread)];
    return [
      a,
      [a[0] + 0.4, a[1] + jitter(0.08), a[2] + jitter(spread)],
      [a[0] + jitter(0.08), a[1] + 0.4, a[2] + jitter(spread)],
    ];
  });
  for (const scale of [0.0001, 0.13, 1, 1000]) {
    const shift = [2.3 * scale, -4.1 * scale, 0.8 * scale];
    const transformed = triangles.map((t) =>
      t.map((p) => p.map((v, i) => scale * v + shift[i])),
    );
    const balls = [];
    for (const d of [[0, 0, 1], [0, 0, -1], ...directions.slice(1, 13)])
      for (const distance of [0.1, 3, 50])
        for (const relativeRadius of [0, 0.04, 0.8])
          balls.push({
            eye: d.map((v, i) => shift[i] + v * distance * scale),
            radius: distance * scale * relativeRadius,
          });
    runFixture(
      `folded spread=${spread} scale=${scale}`,
      geometryFrom(transformed, Uint32Array),
      balls,
    );
  }
}

assert.ok(counters.culled > 100, "fixtures must exercise real pruning");
console.log(
  `PASS facing-cull math: ${counters.fixtures} fixtures, ${counters.clusters} clusters, ${counters.balls} camera balls, ${counters.culled} pruned, ${counters.signs} triangle-eye signs`,
);
