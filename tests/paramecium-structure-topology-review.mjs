import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as T from "three";

// Scene modules use extensionless imports. Bundle only their loader boundary,
// sharing this test's Three runtime; remove the temporary file even on failure.
const parameciumDetail = await (async () => {
  const temporary = await mkdtemp(
    join(tmpdir(), "bioscape-paramecium-topology-"),
  );
  const sourceFile = process.argv
    .find((arg) => arg.startsWith("--source-file="))
    ?.slice("--source-file=".length);
  try {
    const outfile = join(temporary, "paramecium.mjs");
    await build({
      entryPoints: [
        fileURLToPath(
          new URL("../src/scene/parameciumDetails.js", import.meta.url),
        ),
      ],
      bundle: true,
      platform: "node",
      format: "esm",
      outfile,
      logLevel: "silent",
      plugins: [
        {
          name: "paramecium-test-source",
          setup(builder) {
            builder.onResolve({ filter: /^three(?:\/.*)?$/ }, ({ path }) => ({
              path: import.meta.resolve(path),
              external: true,
            }));
            if (sourceFile)
              builder.onLoad(
                { filter: /[\\/]src[\\/]scene[\\/]parameciumDetails\.js$/ },
                ({ path }) => ({
                  contents: fs.readFileSync(sourceFile, "utf8"),
                  resolveDir: dirname(path),
                  loader: "js",
                }),
              );
          },
        },
      ],
    });
    return (await import(pathToFileURL(outfile))).parameciumDetail;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
})();

const V = (...p) => new T.Vector3(...p);
const allMeshes = (g, predicate = () => true) => {
  const meshes = [];
  g.traverse((m) => {
    if (m.isMesh && predicate(m)) meshes.push(m);
  });
  return meshes;
};
const bodyPoint = (u, v) => {
  const y = 2.55 * Math.cos(u);
  return V(
    1.18 * Math.sin(u) * Math.cos(v) * (1 + (0.17 * y) / 2.55) +
      0.13 * Math.sin(y * 1.1),
    y,
    0.78 * Math.sin(u) * Math.sin(v),
  );
};
const normalAt = (pointAt, u, v) =>
  pointAt(u, v + 0.0001)
    .sub(pointAt(u, v - 0.0001))
    .cross(pointAt(u + 0.0001, v).sub(pointAt(u - 0.0001, v)))
    .normalize();
const hitsAlong = (meshes, a, b) => {
  const delta = b.clone().sub(a),
    length = delta.length();
  const ray = new T.Raycaster(
    a,
    delta.normalize(),
    1e-5,
    Math.max(1e-5, length - 1e-5),
  );
  return ray.intersectObjects(meshes, false);
};
const key = (p) =>
  p
    .toArray()
    .map((x) => Math.round(x * 1e5))
    .join(",");
const referencedVertexSet = (meshes) => {
  const result = new Map(),
    p = V();
  for (const mesh of meshes) {
    const a = mesh.geometry.attributes.position,
      indices = mesh.geometry.index?.array;
    const used = indices
      ? new Set(indices)
      : Array.from({ length: a.count }, (_, i) => i);
    for (const i of used) {
      p.fromBufferAttribute(a, i).applyMatrix4(mesh.matrixWorld);
      const k = key(p),
        bucket = result.get(k) || [];
      if (!bucket.some((v) => v.distanceToSquared(p) < 1e-18))
        bucket.push(p.clone());
      result.set(k, bucket);
    }
  }
  return result;
};
const assertSharedRim = (rim, first, second, label) => {
  const a = referencedVertexSet(first),
    b = referencedVertexSet(second);
  const present = (points, p) => {
    const [x, y, z] = p.toArray().map((v) => Math.round(v * 1e5));
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++)
          if (
            points
              .get(`${x + dx},${y + dy},${z + dz}`)
              ?.some((v) => v.distanceTo(p) < 2e-6)
          )
            return true;
    return false;
  };
  let matched = 0;
  for (const point of rim) {
    const k = key(V(...point));
    assert.ok(
      present(a, V(...point)),
      `${label}: missing actual surface rim vertex ${k}`,
    );
    assert.ok(
      present(b, V(...point)),
      `${label}: missing actual connected membrane vertex ${k}`,
    );
    matched++;
  }
  return matched;
};
const owned = [],
  get = (id) => {
    const g = parameciumDetail(id);
    owned.push(g);
    g.updateMatrixWorld(true);
    for (const mesh of allMeshes(g))
      for (const value of mesh.geometry.attributes.position.array)
        assert.ok(Number.isFinite(value), `${id}: nonfinite geometry`);
    return g;
  };
const requested = process.argv
  .find((x) => x.startsWith("--case="))
  ?.split("=")[1];
const wants = (id) => !requested || requested === id;
const report = {};
let root;
const getRoot = () => (root ||= get("paramecium"));
const bodyMembranes = () =>
  allMeshes(
    getRoot(),
    (m) =>
      m.userData.topologyRole === "bodyMembrane" ||
      (!m.userData.topologyRole &&
        m.userData.hitId === "paraSurface" &&
        m.geometry.type === "BufferGeometry"),
  );

if (wants("oral")) {
  const membranes = bodyMembranes(),
    samples = [];
  for (const du of [-0.14, -0.045, 0.045, 0.14]) {
    const p = bodyPoint(1.39 + du, 0.79),
      n = normalAt(bodyPoint, 1.39 + du, 0.79);
    const hits = hitsAlong(
      membranes,
      p.clone().addScaledVector(n, 0.12),
      p.clone().addScaledVector(n, -0.08),
    );
    samples.push(hits.length);
    assert.equal(
      hits.length,
      0,
      "oral entrance is sealed by the assembled body membrane",
    );
  }
  const oral = getRoot().children.find(
    (g) => g.userData.scienceTopology?.junction?.id === "oral",
  );
  assert.ok(oral, "oral model must expose its physical cortical junction");
  const connected = allMeshes(
    oral,
    (m) =>
      m.userData.topologyRole === "oralMembrane" &&
      m.userData.membraneFace === "lumen",
  );
  const junction = oral.userData.scienceTopology.junction,
    rim = junction.rim;
  const shared = assertSharedRim(
    rim,
    membranes.filter((m) => m.userData.membraneFace === "lumen"),
    connected,
    "oral",
  );
  const otherRim = rim.map((p, i) =>
    V(...p)
      .addScaledVector(V(...junction.rimNormals[i]), -0.04)
      .toArray(),
  );
  assertSharedRim(
    otherRim,
    membranes.filter((m) => m.userData.membraneFace === "cytoplasm"),
    allMeshes(
      oral,
      (m) =>
        m.userData.topologyRole === "oralMembrane" &&
        m.userData.membraneFace === "cytoplasm",
    ),
    "oral cytoplasmic face",
  );
  const path = oral.userData.scienceTopology.lumenPath.map((p) => V(...p));
  let blocked = 0;
  for (let i = 1; i < path.length; i++)
    blocked += hitsAlong(
      [...membranes, ...connected],
      path[i - 1],
      path[i],
    ).length;
  assert.equal(
    blocked,
    0,
    "oral lumen must remain continuous to the cytopharynx",
  );
  // Inspect actual indexed membrane vertices: adjacent narrow sections must
  // turn smoothly, and no inward-facing wall facet may fold away from the lumen.
  const positions = connected[0].geometry.attributes.position,
    ringSize = rim.length,
    sections = [];
  assert.equal(positions.count % ringSize, 0, "incomplete oral section ring");
  for (let offset = 0; offset < positions.count; offset += ringSize) {
    const points = Array.from({ length: ringSize }, (_, i) =>
      V().fromBufferAttribute(positions, offset + i),
    );
    const center = points
      .reduce((sum, p) => sum.add(p), V())
      .divideScalar(ringSize);
    const areaVector = points.reduce(
      (sum, p, i) =>
        sum.add(
          p
            .clone()
            .sub(center)
            .cross(points[(i + 1) % ringSize].clone().sub(center)),
        ),
      V(),
    );
    sections.push({ points, center, areaVector });
  }
  let maxSectionTurnDegrees = 0,
    reversedNarrowWallFacets = 0,
    minNarrowWallInwardDot = 1;
  const narrowArea =
    2 * Math.PI * oral.userData.scienceTopology.distalRadius ** 2;
  for (let row = 1; row < sections.length; row++) {
    const previous = sections[row - 1],
      current = sections[row];
    maxSectionTurnDegrees = Math.max(
      maxSectionTurnDegrees,
      T.MathUtils.radToDeg(previous.areaVector.angleTo(current.areaVector)),
    );
    if (current.areaVector.length() / 2 > narrowArea) continue;
    const center = previous.center.clone().lerp(current.center, 0.5);
    for (let i = 0; i < ringSize; i++) {
      const next = (i + 1) % ringSize,
        a = previous.points[i],
        b = current.points[i],
        c = previous.points[next],
        d = current.points[next];
      for (const [x, y, z] of [
        [a, b, c],
        [b, d, c],
      ]) {
        const normal = y.clone().sub(x).cross(z.clone().sub(x)).normalize();
        const towardLumen = center
          .clone()
          .sub(
            x
              .clone()
              .add(y)
              .add(z)
              .multiplyScalar(1 / 3),
          )
          .normalize();
        const dot = normal.dot(towardLumen);
        minNarrowWallInwardDot = Math.min(minNarrowWallInwardDot, dot);
        if (dot <= 0) reversedNarrowWallFacets++;
      }
    }
  }
  const folds = [];
  if (maxSectionTurnDegrees >= 15)
    folds.push(
      `abrupt section turn ${maxSectionTurnDegrees.toFixed(3)} degrees`,
    );
  if (reversedNarrowWallFacets)
    folds.push(`${reversedNarrowWallFacets} reversed narrow wall facets`);
  assert.deepEqual(folds, [], "oral transition must not pinch or fold");
  report.oral = {
    blockedEntranceRays: samples,
    sharedRimVertices: shared,
    blockedLumenSegments: blocked,
    maxSectionTurnDegrees,
    reversedNarrowWallFacets,
    minNarrowWallInwardDot,
  };
}

if (wants("cv")) {
  const membranes = bodyMembranes(),
    pores = [];
  for (const y of [-1.48, 1.5]) {
    const u = Math.acos(y / 2.55),
      v = Math.PI * 1.5;
    const p = bodyPoint(u, v),
      n = normalAt(bodyPoint, u, v);
    assert.equal(
      hitsAlong(
        membranes,
        p.clone().addScaledVector(n, 0.06),
        p.clone().addScaledVector(n, -0.1),
      ).length,
      0,
      "contractile vacuole has no cortical opening",
    );
  }
  const complexes = getRoot().children.filter((g) =>
    g.userData.scienceTopology?.junction?.id.startsWith("contractile"),
  );
  assert.equal(
    complexes.length,
    2,
    "two vacuoles must attach to two cortical sites",
  );
  for (const complex of complexes) {
    const topology = complex.userData.scienceTopology,
      junction = topology.junction;
    const connected = allMeshes(
      complex,
      (m) =>
        m.userData.topologyRole === "contractileMembrane" &&
        m.userData.membraneFace === "lumen",
    );
    const shared = assertSharedRim(
      junction.rim,
      membranes.filter((m) => m.userData.membraneFace === "lumen"),
      connected,
      junction.id,
    );
    const otherRim = junction.rim.map((p, i) =>
      V(...p)
        .addScaledVector(V(...junction.rimNormals[i]), -0.04)
        .toArray(),
    );
    assertSharedRim(
      otherRim,
      membranes.filter((m) => m.userData.membraneFace === "cytoplasm"),
      allMeshes(
        complex,
        (m) =>
          m.userData.topologyRole === "contractileMembrane" &&
          m.userData.membraneFace === "cytoplasm",
      ),
      `${junction.id} cytoplasmic face`,
    );
    const p = V(...junction.center),
      n = V(...junction.normal),
      center = V(...topology.vacuoleCenter);
    const hits = hitsAlong(
      connected,
      p.clone().addScaledVector(n, 0.01),
      center,
    );
    assert.equal(
      hits.length,
      0,
      `${junction.id}: lumen is blocked between cortex and central vacuole`,
    );
    pores.push({
      id: junction.id,
      sharedRimVertices: shared,
      openNeckLength: p.distanceTo(center),
    });
  }
  report.cv = { pores };
}

if (wants("axoneme")) {
  const g = get("paraAxoneme");
  g.rotation.set(0, 0, 0);
  g.updateMatrixWorld(true);
  const bMembers = allMeshes(
    g,
    (m) => m.material.color.getHexString() === "afc4bf",
  );
  // This point is inside A's lumen. The old complete B annulus intruded here.
  assert.equal(
    hitsAlong(bMembers, V(0.65, -1.2, 0.04), V(0.65, 1.2, 0.04)).length,
    0,
    "B tubule crosses the lumen of its own A tubule",
  );
  const members = allMeshes(g, (m) => m.userData.axonemeMember);
  for (const [kind, count] of [
    ["A", 9],
    ["B", 9],
    ["central", 2],
  ])
    assert.equal(
      members.filter((m) => m.userData.axonemeMember === kind).length,
      count,
    );
  for (const m of members) {
    const holes = m.geometry.parameters?.shapes?.holes;
    assert.ok(holes, "cross-section must remain inspectable");
    assert.equal(
      holes.length,
      m.userData.axonemeMember === "B" ? 0 : 1,
      "A is complete; B is an incomplete shared-wall arc",
    );
  }
  const a0 = members.find(
    (m) => m.userData.axonemeMember === "A" && m.userData.doubletIndex === 0,
  );
  const b0 = members.find(
    (m) => m.userData.axonemeMember === "B" && m.userData.doubletIndex === 0,
  );
  const sharedWall = hitsAlong([a0, b0], V(0.65, 0, 0), V(0.65, 0, 0.115));
  const wallCrossings = new Set(
    sharedWall.map((h) => Math.round(h.distance * 1e6)),
  ).size;
  assert.equal(
    wallCrossings,
    2,
    "A and B lumina must be separated by one shared wall, not overlapping complete tubes",
  );
  const aVertices = referencedVertexSet([a0]),
    bVertices = referencedVertexSet([b0]);
  const commonVertices = [...bVertices.keys()].filter((k) =>
    aVertices.has(k),
  ).length;
  assert.ok(
    commonVertices >= 32,
    "B's partial wall must meet A along shared attachment edges",
  );
  const arms = allMeshes(
    g,
    (m) => m.material.color.getHexString() === "aa98b5",
  );
  const distances = [];
  for (const arm of arms) {
    const points = arm.geometry.parameters.path.points,
      first = points[0],
      last = points.at(-1);
    const source = arm.userData.sourceDoublet;
    assert.ok(
      Number.isInteger(source) &&
        arm.userData.targetDoublet === (source + 8) % 9,
      "dynein must connect an A to a neighboring B",
    );
    const target = bMembers.find(
      (m) => m.userData.doubletIndex === arm.userData.targetDoublet,
    );
    const direction = last.clone().sub(first).normalize();
    const hits = hitsAlong(
      [target],
      first,
      last.clone().addScaledVector(direction, 0.003),
    );
    assert.ok(hits.length > 0, "dynein fails to meet its neighboring B wall");
    const gap = Math.abs(
      hits[0].point.distanceTo(first) - last.distanceTo(first),
    );
    assert.ok(gap < 0.003, "dynein endpoint is too far from its target wall");
    distances.push(gap);
  }
  assert.equal(
    arms.length,
    90,
    "paired illustrative inner/outer arms at five axial levels",
  );
  report.axoneme = {
    completeA: 9,
    incompleteB: 9,
    central: 2,
    arms: arms.length,
    maxTargetError: Math.max(...distances),
    sharedWallCrossings: wallCrossings,
    sharedAttachmentVertices: commonVertices,
  };
}

if (wants("rows")) {
  const g = getRoot(),
    rows = new Map();
  const stripes = allMeshes(
    g,
    (m) => m.material.color.getHexString() === "8daca7",
  );
  for (const [i, m] of stripes.entries()) {
    const row = m.userData.kinety ?? Math.floor(i / 2);
    const range = rows.get(row) || [Infinity, -Infinity];
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      range[0] = Math.min(range[0], p.getY(i));
      range[1] = Math.max(range[1], p.getY(i));
    }
    rows.set(row, range);
  }
  const longitudinal = [...rows.values()].filter(
    ([a, b]) => a < -2 && b > 2,
  ).length;
  assert.equal(
    longitudinal,
    26,
    "kineties must follow the y long axis across the anterior/posterior midplane",
  );
  report.rows = { longitudinalRows: longitudinal, axis: "y" };
}

if (wants("mito")) {
  const g = get("paraMito");
  const boundary = allMeshes(
    g,
    (m) =>
      m.userData.topologyRole === "innerBoundaryMembrane" ||
      (!m.userData.topologyRole &&
        m.material.color.getHexString() === "d0b38a"),
  );
  for (let j = 0; j < 11; j++) {
    const y = -0.84 + j * 0.165,
      side = j % 2 ? 1 : -1;
    const x = side * 0.58 * Math.sqrt(1 - (y / 1.06) ** 2 - (0.08 / 0.4) ** 2);
    const p = V(x, y, -0.08),
      n = V(x / 0.58 ** 2, y / 1.06 ** 2, -0.08 / 0.4 ** 2).normalize();
    assert.equal(
      hitsAlong(
        boundary,
        p.clone().addScaledVector(n, 0.016),
        p.clone().addScaledVector(n, -0.1),
      ).length,
      0,
      `crista ${j}: boundary membrane seals the crista lumen`,
    );
  }
  const junctions = g.userData.scienceTopology?.cristaJunctions;
  assert.equal(junctions?.length, 11);
  const rows = [];
  for (const junction of junctions) {
    const tube = allMeshes(
      g,
      (m) =>
        m.userData.topologyRole === "tubularCristaMembrane" &&
        m.userData.openingId === junction.id &&
        m.userData.membraneFace === "intermembraneSpace",
    );
    const shared = assertSharedRim(
      junction.rim,
      boundary.filter((m) => m.userData.membraneFace === "intermembraneSpace"),
      tube,
      junction.id,
    );
    const matrixSide = allMeshes(
      g,
      (m) =>
        m.userData.topologyRole === "tubularCristaMembrane" &&
        m.userData.openingId === junction.id &&
        m.userData.membraneFace === "matrix",
    );
    const otherRim = junction.rim.map((p, i) =>
      V(...p)
        .addScaledVector(V(...junction.rimNormals[i]), -0.025)
        .toArray(),
    );
    assertSharedRim(
      otherRim,
      boundary.filter((m) => m.userData.membraneFace === "matrix"),
      matrixSide,
      `${junction.id} matrix face`,
    );
    const path = junction.lumenPath.map((p) => V(...p));
    let blocked = 0;
    for (let i = 1; i < path.length; i++)
      blocked += hitsAlong(tube, path[i - 1], path[i]).length;
    assert.equal(
      blocked,
      0,
      `${junction.id}: no continuous lumen from intermembrane space to crista`,
    );
    const mid = Math.floor(path.length / 2),
      center = path[mid],
      axis = path[mid + 1]
        .clone()
        .sub(path[mid - 1])
        .normalize();
    const perpendicular = axis
      .clone()
      .cross(V(0, 1, 0))
      .normalize();
    const walls = hitsAlong(
      tube,
      center,
      center.clone().addScaledVector(perpendicular, 0.1),
    );
    assert.ok(
      walls.length > 0 &&
        walls[0].distance > 0.019 &&
        walls[0].distance < 0.037,
      `${junction.id}: tubular wall must enclose its lumen`,
    );
    const outerWalls = hitsAlong(
      matrixSide,
      center,
      center.clone().addScaledVector(perpendicular, 0.1),
    );
    assert.ok(
      outerWalls.length > 0 &&
        outerWalls[0].distance > walls[0].distance + 0.01,
      `${junction.id}: the membrane's matrix face must remain outside its lumen`,
    );
    rows.push({
      id: junction.id,
      sharedRimVertices: shared,
      blockedLumenSegments: blocked,
      lumenRadius: walls[0].distance,
      membraneOuterRadius: outerWalls[0].distance,
    });
  }
  report.mito = { cristae: rows };
}

for (const g of owned)
  g.traverse((m) => {
    m.geometry?.dispose();
    m.material?.dispose();
  });
const output = process.argv
  .find((x) => x.startsWith("--output="))
  ?.slice("--output=".length);
if (output) fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify({
    parameciumStructureTopology: "passed",
    cases: Object.keys(report),
    metrics: report,
  }),
);
