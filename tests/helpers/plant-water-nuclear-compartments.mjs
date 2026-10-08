import assert from "node:assert/strict";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";

const rayDirection = new THREE.Vector3(0.371, 0.529, 0.763).normalize();
function meshesWithColor(group, color) {
  const found = [];
  group.traverse((node) => {
    if (node.isMesh && node.material?.color?.getHex() === color)
      found.push(node);
  });
  return found;
}
function cloneWithBVH(source, fullIndex) {
  const geometry = source.clone();
  if (fullIndex) geometry.setIndex(fullIndex.clone());
  geometry.boundsTree = new MeshBVH(geometry, { indirect: true });
  return geometry;
}
function inside(geometry, point) {
  const hits = geometry.boundsTree
    .raycast(new THREE.Ray(point, rayDirection), THREE.DoubleSide)
    .map((hit) => hit.distance)
    .sort((a, b) => a - b);
  // Merge coincident edge hits from two triangles of the same closed surface.
  return (
    hits.filter((d, i) => i === 0 || d - hits[i - 1] > 1e-7).length % 2 === 1
  );
}

// Work on private copies: BVH construction/queries must not populate bounds or
// reorder indices on the production scene used by exact historical comparisons.
export function createNuclearCompartmentProbe(kind, model) {
  model.group.updateMatrixWorld(true);
  const guard = kind === "stomata";
  const nuclei = meshesWithColor(model.group, guard ? 0xa296ad : 0xa992aa);
  const vacuoles = meshesWithColor(model.group, guard ? 0xc9dcc0 : 0x82b7c0);
  const bodies = meshesWithColor(model.group, guard ? 0x94ac78 : 0xead9b3);
  assert.equal(nuclei.length, guard ? 2 : 1);
  assert.equal(vacuoles.length, nuclei.length);
  assert.equal(bodies.length, nuclei.length);
  const pairs = nuclei.map((nucleus, i) => ({
    nucleus,
    vacuole: vacuoles[i],
    body: bodies[i],
    nuclearGeometry: cloneWithBVH(nucleus.geometry),
    vacGeometry: cloneWithBVH(vacuoles[i].geometry),
    // The cutaway guard cell retains every original full-surface vertex.
    // Its paired vacuole has precisely the same 65 x 25 swept-surface index.
    // Using that full index restores ONLY the omitted cutaway triangles for
    // containment queries; no new model geometry or assumed bounding box.
    bodyGeometry: cloneWithBVH(
      bodies[i].geometry,
      guard ? vacuoles[i].geometry.index : null,
    ),
  }));
  return {
    pairs,
    inspect({ exactDistances = false } = {}) {
      model.group.updateMatrixWorld(true);
      return pairs.map(
        ({
          nucleus,
          vacuole,
          body,
          nuclearGeometry,
          vacGeometry,
          bodyGeometry,
        }) => {
          for (const [source, copy] of [
            [vacuole.geometry, vacGeometry],
            [body.geometry, bodyGeometry],
          ]) {
            copy.attributes.position.array.set(
              source.attributes.position.array,
            );
            copy.boundsTree.refit();
          }
          const result = {};
          for (const [name, host, geometry] of [
            ["vacuole", vacuole, vacGeometry],
            ["cell", body, bodyGeometry],
          ]) {
            const relative = host.matrixWorld
              .clone()
              .invert()
              .multiply(nucleus.matrixWorld);
            const center = new THREE.Vector3().setFromMatrixPosition(relative);
            const intersects = geometry.boundsTree.intersectsGeometry(
              nuclearGeometry,
              relative,
            );
            const worldScale = new THREE.Vector3().setFromMatrixScale(
              host.matrixWorld,
            );
            const threshold =
              0.01 / Math.min(worldScale.x, worldScale.y, worldScale.z);
            const close = geometry.boundsTree.closestPointToGeometry(
              nuclearGeometry,
              relative,
              {},
              {},
              0,
              exactDistances ? Infinity : threshold,
            );
            result[name] = {
              intersects,
              centerInside: inside(geometry, center),
              clearanceAtLeast: close
                ? close.distance *
                  Math.min(worldScale.x, worldScale.y, worldScale.z)
                : 0.01,
            };
          }
          return result;
        },
      );
    },
    assert(context) {
      const results = this.inspect();
      for (const [i, pair] of results.entries()) {
        assert(
          !pair.vacuole.intersects,
          `${context} nucleus ${i} intersects vacuole triangles`,
        );
        assert(
          !pair.vacuole.centerInside,
          `${context} nucleus ${i} lies inside vacuole`,
        );
        assert(
          !pair.cell.intersects,
          `${context} nucleus ${i} intersects complete cell boundary`,
        );
        assert(
          pair.cell.centerInside,
          `${context} nucleus ${i} lies outside complete cell`,
        );
        for (const name of ["vacuole", "cell"])
          assert(
            pair[name].clearanceAtLeast >= 0.01 - 1e-9,
            `${context} nucleus ${i} lacks whole-mesh ${name} clearance`,
          );
      }
      return results;
    },
    dispose() {
      for (const pair of pairs)
        for (const name of ["nuclearGeometry", "vacGeometry", "bodyGeometry"])
          pair[name].dispose();
    },
  };
}
