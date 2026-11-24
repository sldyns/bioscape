import assert from "node:assert/strict";
import { processCacheSnapshot } from "./process-cache-snapshot.mjs";
import { createNuclearCompartmentProbe } from "./plant-water-nuclear-compartments.mjs";

const bytes = (array) =>
  Buffer.from(array.buffer, array.byteOffset, array.byteLength);
const bounds = (value) => ({
  box: value.boundingBox
    ? [value.boundingBox.min.toArray(), value.boundingBox.max.toArray()]
    : null,
  sphere: value.boundingSphere
    ? [value.boundingSphere.center.toArray(), value.boundingSphere.radius]
    : null,
});
const attrMetadata = (attribute) =>
  attribute
    ? [
        attribute.array.constructor.name,
        attribute.itemSize,
        attribute.normalized,
        attribute.count,
      ]
    : null;

// The legacy overlay placed its flux tracers in front of the cell. Require
// the replacement translations at each original pose, checking endpoints
// against the actual indexed cell and tonoplast cross-sections.
function guardTracerOracle(nodes) {
  const bodies = nodes.filter(
    (n) => n.name === "guard cell wall and intact membrane",
  );
  const vacuoles = nodes.filter((n) => n.name === "guard cell vacuole");
  const counts = { water: 0, ion: 0, proton: 0 };
  const rows = {
    ion: [13, 19, 23, 29, 33, 39, 43, 49],
    water: [15, 21, 25, 31, 35, 41, 45, 51],
    proton: [17, 27, 37, 47],
  };
  const colors = new Map([
    [0x659ebc, "water"],
    [0xcd9478, "proton"],
    [0xa698b2, "ion"],
    [0xbaa574, "ion"],
  ]);
  const markers = new Map();
  for (const node of nodes) {
    const kind = colors.get(node.material?.color?.getHex());
    if (!kind) continue;
    const i = counts[kind]++;
    const lane = kind === "ion" ? i % 8 : i >> 1;
    const left = kind === "ion" ? i < 8 : i % 2 === 1;
    const near = rows[kind][lane] * 25 + (kind === "water" ? 1 : 2);
    markers.set(node, { kind, lane, left, near });
  }
  assert.deepEqual(counts, { water: 16, ion: 16, proton: 8 });
  return function check(node, p, state, context) {
    const marker = markers.get(node);
    if (!marker) return false;
    const { kind, lane, left, near } = marker;
    const water = kind === "water",
      proton = kind === "proton";
    const out =
      proton || (water ? state.waterFlux === "out" : state.ionFlux === "out");
    const [start, end] = proton
      ? [0.12, 0.29]
      : water
        ? out
          ? [0.73, 0.94]
          : [0.28, 0.5]
        : out
          ? [0.66, 0.93]
          : [0.21, 0.48];
    const t = Math.min(
      1,
      Math.max(0, ((Number.isFinite(p) ? p : 0) - start) / (end - start)),
    );
    const shifted = t * (1 + ((((lane * 5) % 8) - 3.5) / 6) * (1 - t));
    const weight = out ? 1 - shifted : shifted;
    const vac = vacuoles[left ? 0 : 1].geometry.attributes.position;
    const cell = bodies[left ? 0 : 1].geometry.attributes.position;
    for (const axis of ["x", "y", "z"]) {
      const read = "get" + axis.toUpperCase();
      const inner = water
        ? 0.8 * vac[read](near) + 0.2 * vac[read](near + 12)
        : (vac[read](near) + cell[read](near)) / 2;
      const bath =
        axis === "x" ? (left ? -1 : 1) * (water ? 3.05 : 2.85) : inner;
      const expected = (1 - weight) * bath + weight * inner;
      assert(
        Math.abs(node.position[axis] - expected) < 1e-11,
        `${context}: ${kind} tracer lane ${lane} ${axis} must follow its membrane-anchored transit`,
      );
    }
    return true;
  };
}

// ae697be is intentionally retained, including its invalid nuclear placement.
// Exact equality still applies to every scene field except:
// - the translation components of the two complete nuclear meshes;
// - the checked membrane-anchored translations of the 40 flux tracers;
// - z coordinates, normals and derived bounds of the two vacuolar surfaces.
// Even these vacuoles must retain x/y bytes, all indices, UVs and topology.
export function createStomataScientificCacheComparison(model, reference) {
  const nodes = [],
    oldNodes = [];
  model.group.traverse((node) => nodes.push(node));
  reference.group.traverse((node) => oldNodes.push(node));
  assert.equal(nodes.length, oldNodes.length);
  const nuclear = new Set(
    nodes
      .map((n, i) => (n.material?.color?.getHex() === 0xa296ad ? i : -1))
      .filter((i) => i >= 0),
  );
  const vacuolar = new Set(
    nodes
      .map((n, i) => (n.name === "guard cell vacuole" ? i : -1))
      .filter((i) => i >= 0),
  );
  assert.equal(nuclear.size, 2);
  assert.equal(vacuolar.size, 2);
  const probe = createNuclearCompartmentProbe("stomata", model);
  const checkTracer = guardTracerOracle(nodes);
  return {
    assert(context, progress) {
      const current = processCacheSnapshot(model),
        historical = processCacheSnapshot(reference);
      for (const field of ["objects", "appearance", "labels"])
        assert.deepEqual(
          current[field],
          historical[field],
          `${context}: complete ${field}`,
        );
      const comparedGeometries = new WeakMap();
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i],
          old = oldNodes[i],
          isNucleus = nuclear.has(i),
          isVacuole = vacuolar.has(i),
          isTracer = checkTracer(node, progress, model.group.userData, context);
        assert.deepEqual(
          [node.type, node.name, node.count ?? null, bounds(node)],
          [old.type, old.name, old.count ?? null, bounds(old)],
          `${context}: node ${i} identity/bounds`,
        );
        assert.deepEqual(
          node.children.map((n) => nodes.indexOf(n)),
          old.children.map((n) => oldNodes.indexOf(n)),
          `${context}: node ${i} hierarchy`,
        );
        assert.deepEqual(node.quaternion.toArray(), old.quaternion.toArray());
        assert.deepEqual(node.scale.toArray(), old.scale.toArray());
        for (const field of ["matrix", "matrixWorld"]) {
          if (isNucleus || isTracer) {
            for (let j = 0; j < 16; j++)
              if (j < 12 || j > 14)
                assert.equal(
                  node[field].elements[j],
                  old[field].elements[j],
                  `${context}: node ${i} ${field} nontranslation`,
                );
          } else
            assert.deepEqual(
              node[field].elements,
              old[field].elements,
              `${context}: node ${i} ${field}`,
            );
        }
        for (const field of ["instanceMatrix", "instanceColor"]) {
          assert.deepEqual(attrMetadata(node[field]), attrMetadata(old[field]));
          if (node[field])
            assert(
              bytes(node[field].array).equals(bytes(old[field].array)),
              `${context}: node ${i} ${field}`,
            );
        }
        const g = node.geometry,
          oldG = old.geometry;
        assert.equal(Boolean(g), Boolean(oldG));
        if (!g) continue;
        if (comparedGeometries.get(g) === oldG) continue;
        comparedGeometries.set(g, oldG);
        assert.deepEqual(
          [g.type, g.groups, g.drawRange, attrMetadata(g.index)],
          [oldG.type, oldG.groups, oldG.drawRange, attrMetadata(oldG.index)],
        );
        if (g.index)
          assert(
            bytes(g.index.array).equals(bytes(oldG.index.array)),
            `${context}: node ${i} index`,
          );
        assert.deepEqual(
          Object.keys(g.attributes).sort(),
          Object.keys(oldG.attributes).sort(),
        );
        for (const [name, attr] of Object.entries(g.attributes)) {
          const oldAttr = oldG.attributes[name];
          assert.deepEqual(
            attrMetadata(attr),
            attrMetadata(oldAttr),
            `${context}: node ${i} ${name} metadata`,
          );
          if (isVacuole && name === "position") {
            for (let j = 0; j < attr.count; j++) {
              assert.equal(
                attr.getX(j),
                oldAttr.getX(j),
                `${context}: vacuole ${i} x`,
              );
              assert.equal(
                attr.getY(j),
                oldAttr.getY(j),
                `${context}: vacuole ${i} y`,
              );
              const delta = oldAttr.getZ(j) - attr.getZ(j);
              assert(
                delta >= -1e-7 && delta <= 0.2900001,
                `${context}: vacuole ${i} recess-only z`,
              );
              if (oldAttr.getZ(j) <= 0)
                assert.equal(
                  attr.getZ(j),
                  oldAttr.getZ(j),
                  `${context}: vacuole ${i} back surface`,
                );
            }
          } else if (!(isVacuole && name === "normal"))
            assert(
              bytes(attr.array).equals(bytes(oldAttr.array)),
              `${context}: node ${i} ${name} bytes`,
            );
          assert(
            attr.array.every(Number.isFinite),
            `${context}: node ${i} ${name} finite`,
          );
        }
        if (!isVacuole)
          assert.deepEqual(
            bounds(g),
            bounds(oldG),
            `${context}: node ${i} geometry bounds`,
          );
      }
      probe.assert(context);
    },
    dispose() {
      probe.dispose();
    },
  };
}
