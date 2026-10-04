import assert from "node:assert/strict";
import * as THREE from "three";
import { dynamicTube as regulationTube } from "../src/processes/modules/regulation/geometry.js";
import { dynamicTube as chromatinTube } from "../src/processes/modules/chromatin/geometry.js";
import {
  originalRegulationTube,
  originalChromatinTube,
} from "./fixtures/dynamic-tube-baseline-ae697be.mjs";

function makeKit() {
  const group = new THREE.Group();
  return {
    group,
    mesh(geometry, material, position, parent = group) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      parent.add(mesh);
      return mesh;
    },
  };
}

function snapshot(geometry) {
  return {
    attributes: Object.fromEntries(
      Object.entries(geometry.attributes).map(([name, attribute]) => [
        name,
        {
          itemSize: attribute.itemSize,
          normalized: attribute.normalized,
          usage: attribute.usage,
          bytes: new Uint8Array(
            attribute.array.buffer,
            attribute.array.byteOffset,
            attribute.array.byteLength,
          ).slice(),
        },
      ]),
    ),
    index: [...geometry.index.array],
    groups: structuredClone(geometry.groups),
    drawRange: { ...geometry.drawRange },
    box: [
      geometry.boundingBox.min.toArray(),
      geometry.boundingBox.max.toArray(),
    ],
    sphere: [
      geometry.boundingSphere.center.toArray(),
      geometry.boundingSphere.radius,
    ],
  };
}

function sample(shape, progress) {
  if (shape === "axial")
    return (t, out) =>
      out.set(
        0.02 * Math.sin(t * 7 + progress),
        0.018 * Math.cos(t * 5 + progress),
        t * 3,
      );
  if (shape === "fold")
    return (t, out) =>
      out.set(
        Math.cos(t * Math.PI * 2) * progress,
        Math.sin(t * Math.PI * 2) * progress,
        Math.sin(t * Math.PI * 4 + progress) * progress,
      );
  return (t, out) =>
    out.set(
      t * 2 - 1,
      Math.sin(t * Math.PI * 2 + progress) * 0.3,
      progress * 0.7 + t * t * 0.4,
    );
}

let compared = 0;
for (const [name, current, original] of [
  ["regulation", regulationTube, originalRegulationTube],
  ["chromatin", chromatinTube, originalChromatinTube],
]) {
  for (const [count, radius] of [
    [1, 0],
    [4, 0.031],
    [32, 0.05],
    [48, 0.013],
  ]) {
    for (const shape of ["bend", "axial", "fold"]) {
      const make = (constructor) => {
        const material = new THREE.MeshStandardMaterial();
        return name === "regulation"
          ? constructor(makeKit(), count, radius, material)
          : constructor(new THREE.Group(), material, count, radius);
      };
      const actual = make(current),
        expected = make(original);
      // Include forward playback, reversal, endpoint collapse and repeated seeks.
      for (const progress of [0, 0.08, 0.4, 0.99, 1, 0.4, 0.08, 0, 0]) {
        actual.update(sample(shape, progress));
        expected.update(sample(shape, progress));
        assert.deepEqual(
          snapshot(actual.mesh.geometry),
          snapshot(expected.mesh.geometry),
          `${name}/${shape}: count=${count}, radius=${radius}, progress=${progress}`,
        );
        compared++;
      }
      for (const tube of [actual, expected]) {
        tube.mesh.geometry.dispose();
        tube.mesh.material.dispose();
      }
    }
  }
}
console.log(
  `Dynamic tubes: ${compared} frozen-reference poses retain every attribute byte, index and bound`,
);
