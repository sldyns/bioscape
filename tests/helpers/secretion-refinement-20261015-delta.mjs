import assert from "node:assert/strict";
import * as THREE from "three";
import { createHash } from "node:crypto";
import { processCacheSnapshot } from "./process-cache-snapshot.mjs";

// Sibling occurrence is counted only among the same structural kind. Inserting
// a named cut-edge mesh cannot renumber a later unnamed enzyme/lipid subtree.
export function secretionStructuralNodes(root) {
  const result = new Map();
  const visit = (node, path) => {
    assert(!result.has(path), `duplicate structural selector ${path}`);
    result.set(path, node);
    const counts = new Map();
    for (const child of node.children) {
      const kind = JSON.stringify([
        child.type,
        child.name,
        child.geometry?.type ?? null,
      ]);
      const occurrence = counts.get(kind) ?? 0;
      counts.set(kind, occurrence + 1);
      visit(child, `${path}/${kind}#${occurrence}`);
    }
  };
  visit(root, "root");
  return result;
}

export function secretionResourceIdentity(model) {
  const bindings = [],
    nodes = [],
    geometries = new Set(),
    materials = new Set(),
    buffers = [];
  const addAttribute = (owner, key, attribute) => {
    if (attribute)
      buffers.push([
        owner,
        key,
        attribute,
        attribute.array,
        attribute.array.buffer,
      ]);
  };
  model.group.traverse((node) => {
    nodes.push(node);
    bindings.push([node.geometry, node.material]);
    for (const key of ["instanceMatrix", "instanceColor"])
      addAttribute(node, key, node[key]);
    if (node.geometry && !geometries.has(node.geometry)) {
      const g = node.geometry;
      geometries.add(g);
      addAttribute(g, "index", g.index);
      for (const [key, attr] of Object.entries(g.attributes))
        addAttribute(g, key, attr);
      for (const [key, attrs] of Object.entries(g.morphAttributes))
        attrs.forEach((attr, i) => addAttribute(g, `${key}:${i}`, attr));
    }
    for (const m of [node.material].flat()) if (m) materials.add(m);
  });
  for (const m of [model.materials ?? []].flat()) materials.add(m);
  return {
    bindings,
    nodes,
    geometries: [...geometries],
    materials: [...materials],
    buffers,
  };
}

export function assertSecretionResourceIdentity(actual, expected, context) {
  for (const key of ["nodes", "geometries", "materials"]) {
    assert.equal(
      actual[key].length,
      expected[key].length,
      `${context} ${key} count`,
    );
    actual[key].forEach((item, i) =>
      assert.equal(item, expected[key][i], `${context} ${key} identity ${i}`),
    );
  }
  actual.bindings.forEach((row, i) =>
    row.forEach((item, j) =>
      assert.equal(
        item,
        expected.bindings[i][j],
        `${context} node resource binding ${i}:${j}`,
      ),
    ),
  );
  assert.equal(
    actual.buffers.length,
    expected.buffers.length,
    `${context} buffer count`,
  );
  actual.buffers.forEach((row, i) =>
    row.forEach((item, j) =>
      assert.equal(
        item,
        expected.buffers[i][j],
        `${context} buffer identity ${i}:${j}`,
      ),
    ),
  );
}

export function secretionCandidateSnapshot(model) {
  // The shared snapshot includes every hidden/visible node and all current
  // buffer bytes; append camera, local transforms and hierarchy explicitly.
  const cache = processCacheSnapshot(model);
  const paths = secretionStructuralNodes(model.group),
    reverse = new Map([...paths].map(([p, n]) => [n, p]));
  const hash = createHash("sha256");
  for (const [path, node] of paths)
    hash.update(
      JSON.stringify([
        path,
        reverse.get(node.parent) ?? null,
        node.children.map((c) => reverse.get(c)),
        node.position.toArray(),
        node.rotation.toArray(),
        node.quaternion.toArray(),
        node.scale.toArray(),
        node.geometry
          ? [
              node.geometry.type,
              node.geometry.name,
              node.geometry.drawRange,
              node.geometry.groups,
            ]
          : null,
      ]),
    );
  hash.update(JSON.stringify(model.camera));
  return { ...cache, completeHierarchyAndCamera: hash.digest("hex") };
}

const segment = (type, name, geometry, occurrence) =>
  `${JSON.stringify([type, name, geometry])}#${occurrence}`;
const cisternaPaths = [
  ...Array.from(
    { length: 3 },
    (_, i) =>
      `root/${segment("Group", "", null, 0)}/${segment("Group", "secretory-cisterna", null, i)}`,
  ),
  ...Array.from(
    { length: 5 },
    (_, i) => `root/${segment("Group", "secretory-cisterna", null, i)}`,
  ),
];

// Reviewed delta: 16 thick edge cords become the -x leaflet rail; +x rails
// and hydrophobic ribbons add exactly 32 nodes. Every other original node is
// retained byte-for-byte. Derive every changed/new geometry from frozen curves.
export function secretionRefinementDelta(candidate, baseline) {
  const current = secretionStructuralNodes(candidate.group),
    reference = secretionStructuralNodes(baseline.group);
  assert.equal(reference.size, 350);
  assert.equal(current.size, 382);
  assert.deepEqual(
    [...reference]
      .filter(([, n]) => n.name === "secretory-cisterna")
      .map(([p]) => p)
      .sort(),
    cisternaPaths.toSorted(),
  );
  assert.deepEqual(
    [...current]
      .filter(([, n]) => n.name === "secretory-cisterna")
      .map(([p]) => p)
      .sort(),
    cisternaPaths.toSorted(),
  );
  const replacements = new Map(),
    additions = new Map(),
    expectedDetails = new Map();
  for (const sac of cisternaPaths)
    for (let edge = 0; edge < 2; edge++) {
      const oldPath = `${sac}/${segment("Mesh", "", "TubeGeometry", edge + 1)}`;
      const old = reference.get(oldPath);
      assert(old);
      assert.equal(old.geometry.parameters.radius, 0.025);
      const controlPoints = old.geometry.parameters.path.points;
      assert.equal(controlPoints.length, 49);
      for (let side = 0; side < 2; side++) {
        const path = `${sac}/${segment("Mesh", "cisterna-polar-cut-leaflet", "TubeGeometry", edge * 2 + side)}`;
        assert(current.has(path), `missing prescribed polar rail ${path}`);
        const curve = new THREE.CatmullRomCurve3(
          controlPoints.map(
            (p) => new THREE.Vector3(p.x + (side ? 0.018 : -0.018), p.y, p.z),
          ),
        );
        expectedDetails.set(path, {
          geometry: new THREE.TubeGeometry(curve, 64, 0.009, 8, false),
          baselineNode: old,
          kind: "rail",
        });
        if (side) additions.set(path, current.get(path));
        else replacements.set(oldPath, path);
      }
      const ribbonPath = `${sac}/${segment("Mesh", "cisterna-hydrophobic-cut-edge", "PlaneGeometry", edge)}`;
      assert(
        current.has(ribbonPath),
        `missing prescribed ribbon ${ribbonPath}`,
      );
      const positions = [],
        indices = [];
      for (let i = 0; i < controlPoints.length; i++) {
        const p = controlPoints[i];
        for (const side of [-1, 1])
          positions.push(p.x + side * 0.018, p.y, p.z);
        if (i < controlPoints.length - 1) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geometry = new THREE.PlaneGeometry(1, 1, 48, 1);
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      expectedDetails.set(ribbonPath, {
        geometry,
        baselineNode: old,
        kind: "ribbon",
      });
      additions.set(ribbonPath, current.get(ribbonPath));
    }
  const pairs = [],
    canonical = new Map(),
    used = new Set();
  for (const [path, node] of reference) {
    const candidatePath = replacements.get(path) ?? path;
    const actual = current.get(candidatePath);
    assert(actual, `missing original structural node ${path}`);
    assert(!used.has(actual));
    used.add(actual);
    canonical.set(actual, path);
    pairs.push({
      path,
      candidatePath,
      actual,
      expected: node,
      replaced: replacements.has(path),
    });
  }
  for (const [path, node] of additions) {
    assert(!used.has(node));
    used.add(node);
    canonical.set(node, path);
  }
  assert.equal(replacements.size, 16);
  assert.equal(additions.size, 32);
  assert.equal(expectedDetails.size, 48);
  assert.equal(
    used.size,
    current.size,
    "every candidate node classified exactly once",
  );
  for (const [, node] of current)
    assert(used.has(node), "undeclared candidate node");
  return {
    pairs,
    canonical,
    referencePaths: new Map([...reference].map(([p, n]) => [n, p])),
    additions,
    expectedDetails,
    current,
    reference,
  };
}
