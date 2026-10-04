import assert from "node:assert/strict";
import * as THREE from "three";
import { continuousMembrane } from "./continuousMembrane.js";
import { continuousMembrane as referenceMembrane } from "./continuousMembrane.reference.mjs";

// Compare complete GPU buffers, including inactive tails, against the frozen
// pre-optimization implementation. Float tolerances would miss changes to edge
// interpolation, winding decisions and the normalized output bit patterns.
const setups = [
  {
    name: "apoptosis",
    bounds: [
      [-4, -3.6, -1.4],
      [4, 3.6, 1.4],
    ],
    resolution: [40, 32, 16],
  },
  {
    name: "differentiation",
    bounds: [
      [-3.4, -2.4, -1.2],
      [3.8, 2.4, 1.2],
    ],
    resolution: [44, 32, 16],
  },
  {
    name: "asymmetric grid",
    bounds: [
      [-3.137, -2.253, -1.171],
      [3.793, 2.371, 1.319],
    ],
    resolution: [13, 9, 7],
  },
  {
    name: "single cube",
    bounds: [
      [-1, -1, -1],
      [1, 1, 1],
    ],
    resolution: [1, 1, 1],
  },
];
const lobe = (center, radii) => ({ center, radii });
const cases = [
  { name: "empty initial cache", lobes: [], blend: 0.12 },
  { name: "all outside", lobes: [lobe([30, 0, 0], [1, 1, 1])], blend: 0.12 },
  { name: "all inside", lobes: [lobe([0, 0, 0], [30, 30, 30])], blend: 0.12 },
  {
    name: "one cell",
    lobes: [lobe([0, 0, 0], [2.55, 1.95, 0.87])],
    blend: 0.14,
  },
  {
    name: "connected neck",
    lobes: [
      lobe([-0.75, 0, 0], [2.1, 1.72, 0.76]),
      lobe([1.35, 0.13, 0.07], [0.94, 0.86, 0.51]),
    ],
    blend: 0.13,
  },
  {
    name: "separated pyrenocyte",
    lobes: [
      lobe([-0.75, 0, 0], [1.5, 1.3, 0.71]),
      lobe([2.35, 0.21, 0.07], [0.724, 0.67, 0.4108]),
    ],
    blend: 0.13,
  },
  {
    name: "six apoptotic lobes",
    lobes: [
      lobe([0, 0, 0], [1.82, 1.56, 0.66]),
      ...Array.from({ length: 5 }, (_, i) => {
        const a = 0.35 + (i * Math.PI * 2) / 5;
        return lobe(
          [Math.cos(a) * 3.34, Math.sin(a) * 2.87, 0],
          [0.49, 0.44, 0.38],
        );
      }),
    ],
    blend: 0.14,
  },
  { name: "grid zeros", lobes: [lobe([0, 0, 0], [1, 1, 1])], blend: 0.12 },
  {
    name: "unequal radii, weak blend",
    lobes: [
      lobe([-0.341, 0.273, 0.017], [1.357, 0.919, 0.631]),
      lobe([0.717, -0.291, -0.113], [0.731, 0.523, 0.417]),
    ],
    blend: 1e-8,
  },
  { name: "empty after visible geometry", lobes: [], blend: 0.14 },
];
let seed = 0x51a7c0de;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
};
for (let i = 0; i < 12; i++)
  cases.push({
    name: `deterministic unequal lobes ${i}`,
    lobes: Array.from({ length: 1 + (i % 6) }, () =>
      lobe(
        [(random() - 0.5) * 4, (random() - 0.5) * 3, (random() - 0.5) * 0.8],
        [0.45 + random() * 1.2, 0.41 + random(), 0.32 + random() * 0.55],
      ),
    ),
    blend: 0.05 + random() * 0.2,
  });
const sequence = [...cases, ...cases.slice().reverse()];
const bytes = (array) =>
  Buffer.from(array.buffer, array.byteOffset, array.byteLength);
let states = 0,
  fullBufferBytes = 0,
  fieldChecks = 0;
for (const setup of setups) {
  const material = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.17,
    side: THREE.DoubleSide,
  });
  const before = referenceMembrane(
      new THREE.Group(),
      material,
      setup.bounds,
      setup.resolution,
    ),
    after = continuousMembrane(
      new THREE.Group(),
      material,
      setup.bounds,
      setup.resolution,
    ),
    bg = before.mesh.geometry,
    ag = after.mesh.geometry,
    identities = [
      ag,
      ag.attributes.position,
      ag.attributes.normal,
      ag.attributes.position.array,
      ag.attributes.normal.array,
    ],
    materialState = JSON.stringify(material.toJSON());
  function check(label) {
    assert.deepEqual(
      ag.drawRange,
      bg.drawRange,
      `${label}: draw range/triangle count`,
    );
    for (const name of ["position", "normal"]) {
      const a = ag.attributes[name],
        b = bg.attributes[name];
      assert(
        bytes(a.array).equals(bytes(b.array)),
        `${label}: complete ${name} bytes, triangle order and tail`,
      );
      assert.equal(
        a.version,
        b.version,
        `${label}: identical-input cache/upload behavior`,
      );
      assert.equal(a.itemSize, b.itemSize);
      fullBufferBytes += a.array.byteLength;
    }
    assert.equal(
      after.mesh.material,
      material,
      `${label}: same material identity`,
    );
    assert.equal(
      JSON.stringify(material.toJSON()),
      materialState,
      `${label}: material unchanged`,
    );
    assert.equal(after.mesh.name, before.mesh.name);
    assert(ag.boundingBox.equals(bg.boundingBox), `${label}: bounding box`);
    assert(
      ag.boundingSphere.equals(bg.boundingSphere),
      `${label}: bounding sphere`,
    );
    [
      ag,
      ag.attributes.position,
      ag.attributes.normal,
      ag.attributes.position.array,
      ag.attributes.normal.array,
    ].forEach((resource, i) =>
      assert.equal(
        resource,
        identities[i],
        `${label}: fixed resource identity ${i}`,
      ),
    );
    for (const p of [
      [0, 0, 0],
      [-0.75, 0.16, 0.04],
      [1.371, -0.617, 0.283],
    ]) {
      const an = new Float64Array(3),
        bn = new Float64Array(3);
      assert.equal(
        after.field(...p, an),
        before.field(...p, bn),
        `${label}: label/compartment field`,
      );
      assert(bytes(an).equals(bytes(bn)), `${label}: exact field normals`);
      fieldChecks++;
    }
    states++;
  }
  for (const c of sequence) {
    const input = structuredClone(c.lobes);
    try {
      before.update(input, c.blend);
    } catch (error) {
      error.message = `${setup.name}/${c.name}: ${error.message}`;
      throw error;
    }
    after.update(input, c.blend);
    check(`${setup.name}/${c.name}`);
    // A new but numerically identical input must still skip rebuilding/uploads.
    before.update(structuredClone(input), c.blend);
    after.update(structuredClone(input), c.blend);
    check(`${setup.name}/${c.name}/repeat`);
  }
  const mutable = [lobe([0.2, -0.1, 0.02], [1.3, 1.1, 0.7])];
  for (let i = 0; i < 3; i++) {
    mutable[0].center[0] += 0.137;
    mutable[0].radii[1] -= 0.031;
    before.update(mutable, 0.13);
    after.update(mutable, 0.13);
    check(`${setup.name}/in-place input mutation ${i}`);
  }
  bg.dispose();
  ag.dispose();
  material.dispose();
}
console.log(
  `signals-continuous-membrane: ${states} states, ${fullBufferBytes} full-buffer bytes and ${fieldChecks} exact field/normal checks PASS`,
);
