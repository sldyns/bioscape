import assert from "node:assert/strict";

function sameArray(actual, expected, message) {
  assert.equal(actual.constructor, expected.constructor, `${message}: type`);
  const a = ArrayBuffer.isView(actual) ? actual : new Float64Array(actual),
    b = ArrayBuffer.isView(expected) ? expected : new Float64Array(expected);
  assert.equal(a.byteLength, b.byteLength, `${message}: length`);
  const equal = Buffer.from(a.buffer, a.byteOffset, a.byteLength).equals(
    Buffer.from(b.buffer, b.byteOffset, b.byteLength),
  );
  assert(equal, `${message}: differing numeric bytes`);
}

function sameBounds(actual, expected, message) {
  for (const name of ["boundingBox", "boundingSphere"]) {
    const a = actual[name],
      b = expected[name];
    assert.equal(Boolean(a), Boolean(b), `${message}: ${name} presence`);
    if (!a) continue;
    if (name === "boundingBox") {
      sameArray(a.min.toArray(), b.min.toArray(), `${message}: box min`);
      sameArray(a.max.toArray(), b.max.toArray(), `${message}: box max`);
    } else {
      sameArray(a.center.toArray(), b.center.toArray(), `${message}: center`);
      sameArray([a.radius], [b.radius], `${message}: radius`);
    }
  }
}

// Compare render-relevant numeric bytes, including hidden objects. Buffer upload
// versions, UUIDs and global resource IDs intentionally differ between builders.
export function assertEquivalentTrees(actual, expected, message) {
  const a = [],
    b = [];
  actual.traverse((object) => a.push(object));
  expected.traverse((object) => b.push(object));
  assert.equal(a.length, b.length, `${message}: object count`);
  for (let i = 0; i < a.length; i++) {
    const node = `${message}: node ${i} (${a[i].name})`;
    for (const key of [
      "type",
      "name",
      "visible",
      "count",
      "renderOrder",
      "frustumCulled",
      "castShadow",
      "receiveShadow",
    ])
      assert.equal(a[i][key], b[i][key], `${node}: ${key}`);
    for (const key of ["position", "scale", "quaternion"])
      sameArray(a[i][key].toArray(), b[i][key].toArray(), `${node}: ${key}`);
    for (const key of ["matrix", "matrixWorld"])
      sameArray(a[i][key].elements, b[i][key].elements, `${node}: ${key}`);
    assert.deepEqual(a[i].userData, b[i].userData, `${node}: user data`);
    assert.equal(Boolean(a[i].geometry), Boolean(b[i].geometry), node);
    if (a[i].geometry) {
      const ga = a[i].geometry,
        gb = b[i].geometry;
      assert.deepEqual(Object.keys(ga.attributes), Object.keys(gb.attributes));
      for (const key of Object.keys(ga.attributes)) {
        assert.equal(ga.attributes[key].itemSize, gb.attributes[key].itemSize);
        assert.equal(
          ga.attributes[key].normalized,
          gb.attributes[key].normalized,
        );
        sameArray(
          ga.attributes[key].array,
          gb.attributes[key].array,
          `${node}: ${key}`,
        );
      }
      assert.equal(Boolean(ga.index), Boolean(gb.index), `${node}: index`);
      if (ga.index) sameArray(ga.index.array, gb.index.array, `${node}: index`);
      assert.deepEqual(ga.drawRange, gb.drawRange, `${node}: draw range`);
      assert.deepEqual(ga.groups, gb.groups, `${node}: groups`);
      sameBounds(ga, gb, node);
    }
    assert.equal(
      Boolean(a[i].instanceMatrix),
      Boolean(b[i].instanceMatrix),
      node,
    );
    if (a[i].instanceMatrix)
      sameArray(
        a[i].instanceMatrix.array,
        b[i].instanceMatrix.array,
        `${node}: instances`,
      );
    sameBounds(a[i], b[i], node);
    const ma = a[i].material
        ? Array.isArray(a[i].material)
          ? a[i].material
          : [a[i].material]
        : [],
      mb = b[i].material
        ? Array.isArray(b[i].material)
          ? b[i].material
          : [b[i].material]
        : [];
    assert.equal(ma.length, mb.length, `${node}: materials`);
    ma.forEach((material, j) => {
      for (const key of [
        "type",
        "opacity",
        "transparent",
        "side",
        "depthWrite",
        "depthTest",
        "roughness",
        "metalness",
        "visible",
        "wireframe",
        "blending",
      ])
        assert.equal(material[key], mb[j][key], `${node}: material ${key}`);
      if (material.color)
        sameArray(
          material.color.toArray(),
          mb[j].color.toArray(),
          `${node}: color`,
        );
    });
  }
}
