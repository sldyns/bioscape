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

// ae697be is intentionally retained, including its invalid nuclear placement.
// Exact equality still applies to every scene field except:
// - the translation components of the two complete nuclear meshes;
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
  return {
    assert(context) {
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
          isVacuole = vacuolar.has(i);
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
          if (isNucleus) {
            for (let j = 0; j < 16; j++)
              if (j < 12 || j > 14)
                assert.equal(
                  node[field].elements[j],
                  old[field].elements[j],
                  `${context}: nucleus ${i} ${field} nontranslation`,
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
