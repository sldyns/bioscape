import { createHash } from "node:crypto";

const bytes = (array) =>
  Buffer.from(array.buffer, array.byteOffset, array.byteLength);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const numbers = (values) => bytes(new Float64Array(values));

function bounds(value) {
  return {
    box: value.boundingBox
      ? [value.boundingBox.min.toArray(), value.boundingBox.max.toArray()]
      : null,
    sphere: value.boundingSphere
      ? [value.boundingSphere.center.toArray(), value.boundingSphere.radius]
      : null,
  };
}

function geometryDigest(geometry, geometryCache) {
  const previous = geometryCache.get(geometry);
  if (previous) return previous;
  const attributes = Object.entries(geometry.attributes).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const metadata = JSON.stringify({
    type: geometry.type,
    index: geometry.index?.array.constructor.name,
    attributes: attributes.map(([name, attr]) => [
      name,
      attr.array.constructor.name,
      attr.itemSize,
      attr.normalized,
    ]),
    drawRange: geometry.drawRange,
    groups: geometry.groups,
    bounds: bounds(geometry),
  });
  const hash = createHash("sha256").update(metadata);
  if (geometry.index) hash.update(bytes(geometry.index.array));
  for (const [, attribute] of attributes) hash.update(bytes(attribute.array));
  const result = hash.digest("hex");
  geometryCache.set(geometry, result);
  return result;
}

function materialState(material) {
  if (!material) return null;
  const { metadata, uuid, ...state } = material.toJSON();
  return state;
}

export function processCacheSnapshot(model) {
  model.group.updateMatrixWorld(true);
  // Share primitive hashes only within this snapshot; inspect their actual
  // bytes again next time even if a buggy updater forgets needsUpdate.
  const geometryCache = new WeakMap();
  const geometry = createHash("sha256"),
    transforms = createHash("sha256"),
    appearance = createHash("sha256");
  let objects = 0;
  model.group.traverse((object) => {
    objects++;
    geometry.update(JSON.stringify([object.type, object.name]));
    if (object.geometry)
      geometry.update(geometryDigest(object.geometry, geometryCache));
    for (const attr of [object.instanceMatrix, object.instanceColor])
      if (attr) geometry.update(bytes(attr.array));
    geometry.update(JSON.stringify([object.count ?? null, bounds(object)]));
    transforms.update(numbers(object.matrix.elements));
    transforms.update(numbers(object.matrixWorld.elements));
    appearance.update(
      JSON.stringify({
        visible: object.visible,
        renderOrder: object.renderOrder,
        frustumCulled: object.frustumCulled,
        castShadow: object.castShadow,
        receiveShadow: object.receiveShadow,
        userData: object.userData,
        materials: (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).map(materialState),
      }),
    );
  });
  return {
    objects,
    geometry: geometry.digest("hex"),
    transforms: transforms.digest("hex"),
    appearance: appearance.digest("hex"),
    labels: digest(JSON.stringify(model.labels)),
  };
}

export function disposeCacheModel(model) {
  const geometries = new Set(),
    materials = new Set();
  model.group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      if (material) materials.add(material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}
