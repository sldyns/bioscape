import assert from "node:assert/strict";
import { processCacheSnapshot } from "./process-cache-snapshot.mjs";
import manifest from "./process-refinement-20261015-manifest.mjs";
export const refinementIDs = Object.keys(manifest);
// These roots contain the explicitly reviewed art changes; all remaining roots
// retain complete byte/state equality, including unnamed objects by ordinal.
const changed = {
  bacterialDivision: [2, 3, 4, 5],
  chromatinAccess: [1],
  tad: [3],
  dnaRepair: [9, 10, 14],
  osmoticBalance: [],
};
const movedLabels = {
  bacterialDivision: [2, 3, 7, 8],
  chromatinAccess: [1],
  tad: [],
  dnaRepair: [],
  osmoticBalance: [],
};
function subtree(group) {
  return processCacheSnapshot({ group, labels: [] });
}
function historicalUserDataSnapshot(root, old) {
  const restored = [];
  const a = [],
    b = [];
  root.traverse((o) => a.push(o));
  old.traverse((o) => b.push(o));
  assert.equal(a.length, b.length);
  try {
    a.forEach((o, i) => {
      if (
        "schematicAssembly" in o.userData &&
        !("schematicAssembly" in b[i].userData)
      ) {
        const kind = o.userData.schematicAssembly;
        assert(
          [
            "nuclease",
            "DNA-polymerase",
            "ligase",
            "ssDNA-binding-domain",
          ].includes(kind),
        );
        assert.equal(o.name, `${kind}-functional-domains`);
        assert.equal(o.userData.domainCount, kind === "nuclease" ? 3 : 5);
      }
      for (const key of ["schematicAssembly", "domainCount"])
        if (!(key in b[i].userData) && key in o.userData) {
          restored.push([o, key, o.userData[key]]);
          delete o.userData[key];
        }
    });
    return subtree(root);
  } finally {
    for (const [o, k, v] of restored) o.userData[k] = v;
  }
}
export function createRefinementComparison(id, model, reference) {
  if (!manifest[id]) return null;
  const spec = manifest[id];
  for (const [side, m] of [
    ["current", model],
    ["reference", reference],
  ])
    assert.deepEqual(
      m.group.children.map((o, i) => [i, o.type, o.name]),
      spec[side],
      `${id}: exhaustive ${side} parent/ordinal/type/name manifest`,
    );
  const categories = spec.current.map(([i]) =>
    id === "osmoticBalance" && i === 1
      ? "added"
      : changed[id].includes(i)
        ? "changed"
        : "unchanged",
  );
  assert.equal(categories.length, model.group.children.length);
  return {
    assert(context) {
      model.group.updateMatrixWorld(true);
      reference.group.updateMatrixWorld(true);
      for (const field of ["position", "quaternion", "scale"])
        assert.deepEqual(
          model.group[field].toArray(),
          reference.group[field].toArray(),
          `${context}: root ${field}`,
        );
      assert.deepEqual(model.camera, reference.camera, `${context}: camera`);
      assert.deepEqual(
        model.group.userData,
        reference.group.userData,
        `${context}: all semantic userData`,
      );
      assert.equal(model.labels.length, reference.labels.length);
      model.labels.forEach((l, i) => {
        const old = reference.labels[i];
        assert.deepEqual(Object.keys(l).sort(), Object.keys(old).sort());
        for (const key of Object.keys(l))
          if (!(key === "position" && movedLabels[id].includes(i)))
            assert.deepEqual(l[key], old[key], `${context}: label ${i}/${key}`);
        assert(l.position.every(Number.isFinite));
      });
      model.group.children.forEach((o, i) => {
        if (categories[i] !== "unchanged") return;
        const j = id === "osmoticBalance" && i > 1 ? i - 1 : i;
        const old = reference.group.children[j];
        assert.deepEqual(
          id === "dnaRepair" ? historicalUserDataSnapshot(o, old) : subtree(o),
          subtree(old),
          `${context}: unchanged root ordinal ${i}`,
        );
      });
      // Schematic changed assemblies retain finite physical depth and a real cleft.
      if (id === "dnaRepair")
        for (const i of changed[id]) {
          const o = model.group.children[i],
            n = o.userData.domainCount;
          assert(n >= 4);
          assert(
            o.children[0].position.x < -0.2 && o.children[1].position.x > 0.2,
          );
          assert(
            o.children
              .slice(0, n)
              .every((c) => c.geometry === o.children[0].geometry),
          );
        }
      if (id === "chromatinAccess" || id === "tad") {
        const root = model.group.children[changed[id][0]],
          folds = [];
        root.traverse((o) => {
          if (o.geometry?.type === "DomedFoldGeometry") folds.push(o);
        });
        assert(folds.length >= 1);
        for (const o of folds) {
          const p = o.geometry.attributes.position;
          let min = Infinity,
            max = -Infinity;
          for (let j = 0; j < p.count; j++) {
            min = Math.min(min, p.getZ(j));
            max = Math.max(max, p.getZ(j));
          }
          assert(max - min > 0.15);
        }
      }
      if (id === "osmoticBalance") {
        const rim = model.group.children[1],
          b = rim.geometry.attributes.position.array;
        assert.equal(b.length, rim.userData.boundaryEdges * 18);
        for (let n = 0; n < rim.userData.boundaryEdges; n++)
          for (let a = 0; a < 3; a++) {
            let k = n * 18;
            assert.equal(b[k + a], b[k + 9 + a]);
            assert.equal(b[k + 6 + a], b[k + 12 + a]);
            assert(Math.abs(b[k + 6 + a] - b[k + 3 + a] * 0.935) < 1e-6);
            assert(Math.abs(b[k + 15 + a] - b[k + a] * 0.935) < 1e-6);
          }
      }
    },
  };
}
const canonical = (p) =>
  Object.keys(p)
    .sort()
    .map((k) => [k, p[k]]);
function inventory(model) {
  const refs = [];
  model.group.traverse((o) => {
    refs.push(o, o.geometry, o.material);
    if (Array.isArray(o.material)) refs.push(...o.material);
    for (const a of [
      o.instanceMatrix,
      o.instanceColor,
      o.geometry?.index,
      ...Object.values(o.geometry?.attributes ?? {}),
    ])
      if (a) refs.push(a, a.array, a.array.constructor);
  });
  refs.push(model.materials, ...(model.materials ?? []));
  return refs;
}
export function createCurrentStateGuard(model) {
  const initialCamera = structuredClone(model.camera);
  const initial = inventory(model),
    states = new Map();
  return {
    assert(context) {
      assert.deepEqual(model.camera, initialCamera, `${context}: fixed camera`);
      const now = inventory(model);
      assert.equal(now.length, initial.length, `${context}: resource count`);
      now.forEach((o, i) =>
        assert.equal(o, initial[i], `${context}: resource identity ${i}`),
      );
      model.group.traverse((o) => {
        assert(
          [...o.position, ...o.quaternion, ...o.scale].every(Number.isFinite),
          `${context}: finite transforms`,
        );
        for (const value of [o, o.geometry]) {
          if (value?.boundingBox)
            assert(
              [...value.boundingBox.min, ...value.boundingBox.max].every(
                Number.isFinite,
              ),
              `${context}: finite bounds`,
            );
          if (value?.boundingSphere)
            assert(
              [
                ...value.boundingSphere.center,
                value.boundingSphere.radius,
              ].every(Number.isFinite),
              `${context}: finite sphere`,
            );
        }
        for (const a of [
          o.instanceMatrix,
          o.instanceColor,
          ...Object.values(o.geometry?.attributes ?? {}),
        ])
          if (a)
            assert(a.array.every(Number.isFinite), `${context}: finite buffer`);
      });
    },
    pose(progress, parameters, context) {
      const key = JSON.stringify([progress, canonical(parameters)]),
        snapshot = processCacheSnapshot(model);
      if (states.has(key))
        assert.deepEqual(
          snapshot,
          states.get(key),
          `${context}: whole current repeated state`,
        );
      else states.set(key, snapshot);
      this.assert(context);
      model.update(0.97831, parameters);
      this.assert(context);
      model.update(0.03197, parameters);
      this.assert(context);
      model.update(progress, parameters);
      assert.deepEqual(
        processCacheSnapshot(model),
        snapshot,
        `${context}: whole current reverse seek`,
      );
      this.assert(context);
    },
  };
}
