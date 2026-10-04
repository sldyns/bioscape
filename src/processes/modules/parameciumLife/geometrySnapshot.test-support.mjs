import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import * as THREE from "three";

// Run the unchanged original code with the same Node/V8/Three runtime as the
// candidate. Persisted binary hashes can vary across libm/V8 implementations.
// These copies retain their original paths, so no import rewriting is needed.
export async function frozenDefinitions(reference, referenceBytes) {
  const directory = new URL("./fixtures/ae697be/", import.meta.url),
    provenance = JSON.parse(
      await readFile(new URL("provenance.json", directory), "utf8"),
    ),
    sha256 = (data) => createHash("sha256").update(data).digest("hex");
  assert.equal(
    provenance.baselineCommit,
    "ae697be5f252c1df58b34b57a6e9a8e1c014acf4",
  );
  assert.equal(provenance.baselineCommit, reference.baselineCommit);
  assert.equal(sha256(referenceBytes), provenance.historicalReferenceSha256);
  assert.deepEqual(provenance.importRewrites, []);
  assert.deepEqual(
    provenance.files.map((file) => file.sourcePath).sort(),
    Object.keys(reference.sourceHashes).sort(),
    "preserve the complete independently frozen dependency tree",
  );
  const urls = new Set(
    provenance.files.map((file) => new URL(file.fixturePath, directory).href),
  );
  assert.equal(urls.size, provenance.files.length);
  for (const file of provenance.files) {
    assert.equal(file.fixturePath, file.sourcePath);
    const url = new URL(file.fixturePath, directory),
      bytes = await readFile(url);
    assert.equal(
      sha256(bytes),
      file.sha256,
      `${file.sourcePath} fixture bytes`,
    );
    assert.equal(file.sha256, reference.sourceHashes[file.sourcePath]);
    for (const [, specifier] of bytes
      .toString("utf8")
      .matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g)) {
      if (specifier.startsWith("."))
        assert(
          urls.has(new URL(specifier, url).href),
          `${file.sourcePath} import must stay in the original fixture tree`,
        );
      else assert.equal(specifier, "three", "only Three is runtime-shared");
    }
  }
  const definitions = new Map();
  for (const id of new Set(reference.cases.map((row) => row.id))) {
    const url = new URL(
      `src/processes/modules/parameciumLife/${id}Process.js`,
      directory,
    );
    assert(urls.has(url.href));
    definitions.set(id, (await import(url)).default);
  }
  return definitions;
}

// Baseline fingerprints include every buffer, including hidden geometry, and
// preserve resource sharing. UUIDs and GPU dirty counters are not scene output.
export function geometrySnapshot(model, parent) {
  parent.updateMatrixWorld(true);
  const hash = createHash("sha256"),
    geometries = new Map(),
    materials = new Map();
  let nodes = 0,
    positionValues = 0,
    normalValues = 0,
    instanceValues = 0;
  const json = (value) => hash.update(JSON.stringify(value));
  const raw = (array) =>
    hash.update(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
  const numbers = (values) => raw(new Float64Array(values));
  function bounds(object) {
    json([!!object.boundingBox, !!object.boundingSphere]);
    if (object.boundingBox)
      numbers([
        ...object.boundingBox.min.toArray(),
        ...object.boundingBox.max.toArray(),
      ]);
    if (object.boundingSphere)
      numbers([
        ...object.boundingSphere.center.toArray(),
        object.boundingSphere.radius,
      ]);
  }
  function material(value) {
    if (!value) return null;
    if (Array.isArray(value)) return value.map(material);
    if (materials.has(value)) return materials.get(value);
    const id = materials.size;
    materials.set(value, id);
    json([
      value.type,
      value.side,
      value.transparent,
      value.depthWrite,
      value.depthTest,
      value.visible,
      value.wireframe,
      value.blending,
      value.vertexColors,
      value.flatShading,
    ]);
    numbers([
      value.opacity,
      value.roughness ?? 0,
      value.metalness ?? 0,
      value.clearcoat ?? 0,
      value.emissiveIntensity ?? 0,
      ...(value.color?.toArray() ?? []),
      ...(value.emissive?.toArray() ?? []),
    ]);
    return id;
  }
  model.group.traverse((object) => {
    nodes++;
    json([
      object.type,
      object.name,
      object.visible,
      object.count,
      object.frustumCulled,
      object.renderOrder,
      object.userData,
    ]);
    numbers([
      ...object.position.toArray(),
      ...object.quaternion.toArray(),
      ...object.scale.toArray(),
      ...object.matrix.elements,
      ...object.matrixWorld.elements,
    ]);
    json(material(object.material));
    const geometry = object.geometry;
    if (geometry) {
      let id = geometries.get(geometry);
      if (id === undefined) {
        id = geometries.size;
        geometries.set(geometry, id);
        json([geometry.type, geometry.groups, geometry.userData]);
        numbers([geometry.drawRange.start, geometry.drawRange.count]);
        for (const key of Object.keys(geometry.attributes).sort()) {
          const attribute = geometry.attributes[key];
          json([
            key,
            attribute.itemSize,
            attribute.count,
            attribute.normalized,
            attribute.array.constructor.name,
          ]);
          raw(attribute.array);
          if (key === "position") positionValues += attribute.array.length;
          if (key === "normal") normalValues += attribute.array.length;
        }
        if (geometry.index) raw(geometry.index.array);
        bounds(geometry);
      }
      json(["geometry", id]);
    }
    if (object.instanceMatrix) {
      raw(object.instanceMatrix.array);
      if (object.instanceColor) raw(object.instanceColor.array);
      instanceValues += object.instanceMatrix.array.length;
      bounds(object);
    }
  });
  for (const label of model.labels) {
    json([label.text, label.active, label.priority, label.id]);
    numbers(label.position);
  }
  json(model.camera);
  return {
    sha256: hash.digest("hex"),
    nodes,
    geometries: geometries.size,
    materials: materials.size,
    positionValues,
    normalValues,
    instanceValues,
  };
}

export function setupSnapshot(definition, transformed) {
  const model = definition.create(),
    parent = new THREE.Group();
  if (transformed) {
    parent.position.set(0.13, -0.24, 0.19);
    parent.rotation.set(0.17, -0.21, 0.07);
    parent.scale.set(1.12, 0.93, 1.04);
    model.group.position.set(0.31, -0.27, 0.12);
    model.group.rotation.set(-0.05, 0.11, -0.08);
  }
  parent.add(model.group);
  return { model, parent };
}

export function resourceInventory(model) {
  const values = [];
  model.group.traverse((object) => {
    values.push(object);
    if (object.geometry) {
      values.push(object.geometry, object.geometry.index);
      for (const attribute of Object.values(object.geometry.attributes))
        values.push(attribute, attribute.array, attribute.array.buffer);
    }
    if (object.instanceMatrix)
      values.push(
        object.instanceMatrix,
        object.instanceMatrix.array,
        object.instanceMatrix.array.buffer,
      );
  });
  return values;
}

export function disposeSnapshot(model) {
  const geometry = new Set(),
    material = new Set();
  model.group.traverse((object) => {
    if (object.geometry) geometry.add(object.geometry);
    for (const value of Array.isArray(object.material)
      ? object.material
      : [object.material])
      if (value) material.add(value);
  });
  for (const value of [...geometry, ...material]) value.dispose();
}
