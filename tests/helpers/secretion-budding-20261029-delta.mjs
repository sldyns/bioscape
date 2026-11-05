import assert from "node:assert/strict";
import * as THREE from "three";

// Versioned semantic delta, not a new performance baseline. Frozen fixtures
// stay untouched; every field outside these two growth intervals stays exact.
export function secretionBuddingDelta(scene, progress) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const er = p >= 0.12 && p < 0.15;
  const trans = p >= 0.67 && p < 0.7;
  const poses = new Set(),
    world = new Set(),
    geometries = new Set();
  const near = (a, b, label, tolerance = 2e-6) =>
    assert(a.distanceTo(b) <= tolerance, `${label}: ${a.distanceTo(b)}`);
  const point = (mesh, i) =>
    new THREE.Vector3()
      .fromBufferAttribute(mesh.geometry.attributes.position, i)
      .applyMatrix4(mesh.matrixWorld);
  if (er || trans) {
    const start = er ? 0.12 : 0.67;
    const end = er ? 0.15 : 0.7;
    const q = (p - start) / (end - start);
    const scale = Math.max(0.001, q * q * (3 - 2 * q));
    const carrier = scene.group.getObjectByName(
      er ? "ER-carrier" : "secretory-carrier",
    );
    const bridge = scene.group.getObjectByName(
      er ? "continuous-ER-carrier-neck" : "continuous-Golgi-carrier-neck",
    );
    const mouthX = -2.92 - 0.95 * Math.cos(2.76);
    const mouthY = 1.06 * Math.cos(2.76);
    const expected = er
      ? new THREE.Vector3(mouthX + (-1.68 - mouthX) * scale, 0.68, 0)
      : new THREE.Vector3(
          0.94 + 0.36 * Math.cos(2.76) ** 2,
          mouthY + (-1.42 - mouthY) * scale,
          0,
        );
    near(
      carrier.position,
      expected,
      "prescribed growing-carrier center",
      1e-12,
    );
    near(
      carrier.scale,
      new THREE.Vector3(scale, scale, scale),
      "prescribed growing-carrier size",
      1e-12,
    );
    poses.add(carrier);
    carrier.traverse((node) => world.add(node));
    if (trans) {
      const lipids = scene.group.getObjectByName(
        "persistent-carrier-membrane-lipids",
      );
      near(lipids.position, expected, "persistent carrier lipid center", 1e-12);
      near(lipids.scale, carrier.scale, "persistent carrier lipid size", 1e-12);
      poses.add(lipids);
      lipids.traverse((node) => world.add(node));
    }
    const erGroup = scene.group.children.find((node) =>
      node.children.some((child) => child.name === "secretory-cisterna"),
    );
    const donor = er
      ? erGroup.children.find((node) => node.name === "secretory-cisterna")
      : scene.group.children.find((node) => node.name === "secretory-cisterna");
    const body = donor.getObjectByName("cisterna-body");
    const open = carrier.getObjectByName("open-carrier-membrane");
    const edge = (mesh, startIndex, u, segments) => {
      const lo = Math.floor(u),
        hi = Math.min(Math.ceil(u), segments);
      return point(mesh, startIndex + lo).lerp(
        point(mesh, startIndex + hi),
        u - lo,
      );
    };
    for (let j = 144; j <= 288; j++)
      near(
        point(bridge, j),
        edge(body, 22 * 49, (j - 144) / 3, 48),
        "actual donor polygon seam",
      );
    for (let j = 0; j <= 288; j++) {
      const first = point(bridge, j),
        last = point(bridge, 12 * 289 + j);
      near(
        last,
        edge(open, 24 * 37, j / 8, 36),
        "actual growing-carrier polygon seam",
      );
      for (let row = 1; row < 12; row++)
        near(
          point(bridge, row * 289 + j),
          first.clone().lerp(last, row / 12),
          "neck interior interpolates welded rings",
        );
    }
    geometries.add(bridge.geometry);
    for (const node of world) {
      const expectedWorld = new THREE.Matrix4().multiplyMatrices(
        node.parent.matrixWorld,
        node.matrix,
      );
      assert(
        node.matrixWorld.elements.every(
          (value, i) => Math.abs(value - expectedWorld.elements[i]) < 1e-12,
        ),
        "descendant world matrix must follow exact local/parent composition",
      );
    }
  }
  return {
    kind: er ? "ER" : trans ? "TGN" : null,
    baselineComparableState(node, actual, reference) {
      if (poses.has(node))
        for (const index of [9, 12, 13]) actual[index] = reference[index];
      if (world.has(node)) actual[14] = reference[14];
      return actual;
    },
    compareGeometry(
      actual,
      expected,
      context,
      equalValue,
      equalAttribute,
      bounds,
    ) {
      if (!geometries.has(actual)) return false;
      equalValue(
        [actual.type, actual.name, actual.groups, actual.drawRange],
        [expected.type, expected.name, expected.groups, expected.drawRange],
        `${context} budding neck metadata`,
      );
      equalValue(
        Object.keys(actual.attributes),
        Object.keys(expected.attributes),
        `${context} budding attribute names`,
      );
      const derived = actual.clone();
      derived.computeVertexNormals();
      derived.computeBoundingBox();
      derived.computeBoundingSphere();
      for (const name of Object.keys(expected.attributes)) {
        const a = actual.attributes[name],
          b = expected.attributes[name];
        if (name === "position") {
          equalValue(
            [a.itemSize, a.count, a.normalized, a.usage],
            [b.itemSize, b.count, b.normalized, b.usage],
            `${context} growing position layout`,
          );
          assert.equal(a.array.constructor, b.array.constructor);
        } else
          equalAttribute(
            a,
            name === "normal" ? derived.attributes.normal : b,
            `${context} growing ${name}`,
          );
      }
      equalAttribute(
        actual.index,
        expected.index,
        `${context} unchanged growing-neck index`,
      );
      equalValue(
        actual.morphAttributes,
        expected.morphAttributes,
        `${context} unchanged morph state`,
      );
      equalValue(
        bounds(actual),
        bounds(derived),
        `${context} bounds derived from actual welded vertices`,
      );
      derived.dispose();
      return true;
    },
  };
}
