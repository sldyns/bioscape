import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = await mkdtemp(join(tmpdir(), "bioscape-model-reuse-"));
const baseline = process.env.BIOSCAPE_LOADING_BASELINE_ROOT;
const hash = (array) =>
  array
    ? createHash("sha256")
        .update(
          new Uint8Array(array.buffer, array.byteOffset, array.byteLength),
        )
        .digest("hex")
    : null;
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const dataOnly = (value) =>
  value && typeof value === "object"
    ? Array.isArray(value)
      ? value.map(dataOnly)
      : Object.fromEntries(
          Object.entries(value).map(([key, child]) => [key, dataOnly(child)]),
        )
    : value;
async function implementation(root, name) {
  const outfile = join(directory, `${name}.mjs`);
  await build({
    stdin: {
      contents: [
        'export { buildCell } from "./src/scene/buildCell.js";',
        'export { packCell, unpackCell, disposeCell } from "./src/scene/cellTransfer.js";',
        'export { makePresentation } from "./src/scene/presentation.js";',
        'export { loadDetailModel } from "./src/scene/loadDetailModel.js";',
      ].join("\n"),
      resolveDir: root,
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    nodePaths: [join(project, "node_modules")],
    logLevel: "silent",
  });
  return import(pathToFileURL(outfile).href);
}
function appearance(material) {
  return Object.fromEntries(
    Object.entries(material)
      .filter(
        ([key, value]) =>
          !["id", "uuid", "version"].includes(key) &&
          (value?.isColor ||
            value?.isTexture ||
            ["number", "string", "boolean"].includes(typeof value) ||
            value === null),
      )
      .map(([key, value]) => [
        key,
        value?.isColor
          ? value.toArray()
          : value?.isTexture
            ? {
                bytes: hash(value.image.data),
                width: value.image.width,
                height: value.image.height,
                properties: Object.fromEntries(
                  [
                    "format",
                    "type",
                    "mapping",
                    "wrapS",
                    "wrapT",
                    "magFilter",
                    "minFilter",
                    "anisotropy",
                    "generateMipmaps",
                    "flipY",
                    "unpackAlignment",
                    "colorSpace",
                    "premultiplyAlpha",
                  ].map((property) => [property, value[property]]),
                ),
              }
            : value,
      ]),
  );
}
function snapshot(root) {
  root.updateMatrixWorld(true);
  const nodes = [];
  root.traverse((object) => nodes.push(object));
  const ids = new Map(nodes.map((object, id) => [object, id]));
  return nodes.map((object) => ({
    parent: ids.get(object.parent) ?? null,
    matrix: [...object.matrixWorld.elements],
    data: dataOnly(object.userData),
    visible: object.visible,
    renderOrder: object.renderOrder,
    ...(object.isMesh
      ? {
          geometry: Object.fromEntries(
            Object.entries(object.geometry.attributes).map(([name, a]) => [
              name,
              {
                bytes: hash(a.array),
                type: a.array.constructor.name,
                itemSize: a.itemSize,
                normalized: a.normalized,
                usage: a.usage,
                gpuType: a.gpuType,
              },
            ]),
          ),
          index: hash(object.geometry.index?.array),
          indexType: object.geometry.index?.array.constructor.name,
          groups: object.geometry.groups,
          drawRange: object.geometry.drawRange,
          instanceMatrix: hash(object.instanceMatrix?.array),
          instanceColor: hash(object.instanceColor?.array),
          count: object.count,
          material: appearance(object.material),
          castShadow: object.castShadow,
          receiveShadow: object.receiveShadow,
          frustumCulled: object.frustumCulled,
        }
      : {}),
  }));
}
function topology(model) {
  const ids = new Map();
  model.cell.traverse((object) => ids.set(object, ids.size));
  return {
    groups: Object.fromEntries(
      Object.entries(model.groups).map(([key, object]) => [
        key,
        ids.get(object),
      ]),
    ),
    parts: Object.fromEntries(
      Object.entries(model.parts).map(([key, objects]) => [
        key,
        objects.map((object) => ids.get(object)),
      ]),
    ),
    full: model.full.map((object) => ids.get(object)),
    anchors: Object.fromEntries(
      Object.entries(model.anchors).map(([key, point]) => [
        key,
        point.toArray(),
      ]),
    ),
  };
}
function completeBounds(root) {
  const result = [];
  const values = (object) => ({
    box: [object.boundingBox.min.toArray(), object.boundingBox.max.toArray()],
    sphere: [
      object.boundingSphere.center.toArray(),
      object.boundingSphere.radius,
    ],
  });
  root.traverse((object) => {
    if (!object.isMesh) return;
    if (object.geometry.boundingBox === null)
      object.geometry.computeBoundingBox();
    if (object.geometry.boundingSphere === null)
      object.geometry.computeBoundingSphere();
    if (object.isInstancedMesh) {
      if (object.boundingBox === null) object.computeBoundingBox();
      if (object.boundingSphere === null) object.computeBoundingSphere();
    }
    result.push({
      geometry: values(object.geometry),
      instances: object.isInstancedMesh ? values(object) : null,
    });
  });
  return result;
}
async function inspect(impl, checkReuse) {
  const model = impl.buildCell();
  if (checkReuse) {
    const copies = model.groups.mitochondria.children;
    assert.equal(copies.length, 3);
    for (let i = 0; i < copies[0].children.length; i++) {
      const meshes = copies.map((group) => group.children[i]);
      assert.equal(new Set(meshes).size, 3);
      assert.equal(new Set(meshes.map((mesh) => mesh.geometry)).size, 1);
      assert.equal(new Set(meshes.map((mesh) => mesh.material)).size, 1);
      assert.equal(new Set(meshes.map((mesh) => mesh.userData)).size, 3);
    }
    const beads = model.groups.membrane.children.filter(
      (object) => object.isInstancedMesh,
    );
    assert.equal(beads.length, 4);
    assert.equal(beads[0].geometry, beads[1].geometry);
    assert.equal(beads[0].geometry, beads[3].geometry);
    assert.notEqual(beads[0].geometry, beads[2].geometry);
    assert.equal(new Set(beads.map((object) => object.instanceMatrix)).size, 4);
    assert.equal(new Set(beads.map((object) => object.instanceColor)).size, 4);
  }
  const result = {
    model: digest(snapshot(model.cell)),
    topology: digest(topology(model)),
  };
  result.presentations = {};
  for (const id of [
    "cell",
    "cytoplasm",
    "mitochondria",
    "mitoInner",
    "atpSynthase",
  ]) {
    const detail =
      id === "cell" || id === "cytoplasm"
        ? null
        : await impl.loadDetailModel(id);
    const view = impl.makePresentation(model, id, detail);
    result.presentations[id] = digest(snapshot(view.root));
    const materials = new Set(),
      geometries = new Set();
    view.root.traverse((object) => {
      if (object.isInstancedMesh) object.dispose();
      if (object.material) materials.add(object.material);
      if (object.geometry && !object.userData.sharedGeometry)
        geometries.add(object.geometry);
    });
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
  }
  result.bounds = digest(completeBounds(model.cell));
  if (checkReuse)
    model.cell.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.boundingBox = object.geometry.boundingSphere = null;
      if (object.isInstancedMesh)
        object.boundingBox = object.boundingSphere = null;
    });
  const { payload, buffers } = impl.packCell(model, { prepareBounds: true });
  const restored = impl.unpackCell(
    structuredClone(payload, { transfer: buffers }),
  );
  assert.equal(digest(snapshot(restored.cell)), result.model);
  assert.equal(digest(topology(restored)), result.topology);
  if (checkReuse)
    restored.cell.traverse((object) => {
      if (!object.isMesh) return;
      assert(object.geometry.boundingBox && object.geometry.boundingSphere);
      if (object.isInstancedMesh)
        assert(object.boundingBox && object.boundingSphere);
    });
  assert.equal(digest(completeBounds(restored.cell)), result.bounds);
  if (checkReuse) {
    const copies = restored.groups.mitochondria.children;
    for (let i = 0; i < copies[0].children.length; i++)
      assert.equal(
        copies[0].children[i].geometry,
        copies[2].children[i].geometry,
      );
  }
  const released = new Map();
  restored.cell.traverse((object) => {
    for (const resource of [object.geometry, object.material]) {
      if (!resource || released.has(resource)) continue;
      released.set(resource, 0);
      resource.addEventListener("dispose", () =>
        released.set(resource, released.get(resource) + 1),
      );
    }
  });
  impl.disposeCell(restored);
  assert([...released.values()].every((count) => count === 1));
  impl.disposeCell(model);
  return result;
}
try {
  const current = await inspect(await implementation(project, "current"), true);
  if (baseline) {
    const reference = await inspect(
      await implementation(resolve(baseline), "baseline"),
      false,
    );
    assert.deepEqual(
      current,
      reference,
      "Frozen geometry/material/pose/texture or anatomy changed",
    );
  }
  console.log(
    `Model reuse: independent nodes/instances, shared immutable resources, exact prepared bounds, transfer identity and unique disposal passed${baseline ? "; frozen cell and five presentation hashes match" : ""}`,
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
