import * as THREE from "three";

function hasStablePositionAttribute(position) {
  const itemSize = Object.getOwnPropertyDescriptor(position, "itemSize")?.value;
  if (
    position.isGLBufferAttribute ||
    !Number.isSafeInteger(itemSize) ||
    itemSize < 3 ||
    Object.prototype.hasOwnProperty.call(position, "getX") ||
    Object.prototype.hasOwnProperty.call(position, "getY") ||
    Object.prototype.hasOwnProperty.call(position, "getZ")
  )
    return false;
  const interleaved = position.isInterleavedBufferAttribute;
  if (
    interleaved &&
    Object.getPrototypeOf(position) !==
      THREE.InterleavedBufferAttribute.prototype
  )
    return false;
  const owner = interleaved
    ? Object.getOwnPropertyDescriptor(position, "data")?.value
    : position;
  if (!owner) return false;
  const count = Object.getOwnPropertyDescriptor(owner, "count")?.value;
  if (!Number.isSafeInteger(count) || count <= 8) return false;
  const prototype = interleaved
    ? THREE.InterleavedBufferAttribute.prototype
    : position.isFloat16BufferAttribute
      ? THREE.Float16BufferAttribute.prototype
      : THREE.BufferAttribute.prototype;
  const array = Object.getOwnPropertyDescriptor(owner, "array")?.value;
  const stride = Object.getOwnPropertyDescriptor(owner, "stride")?.value;
  const offset = Object.getOwnPropertyDescriptor(position, "offset")?.value;
  return (
    (interleaved || position.isBufferAttribute) &&
    (!interleaved ||
      (!Object.prototype.hasOwnProperty.call(position, "count") &&
        !Object.prototype.hasOwnProperty.call(position, "array"))) &&
    position.getX === prototype.getX &&
    position.getY === prototype.getY &&
    position.getZ === prototype.getZ &&
    ArrayBuffer.isView(array) &&
    typeof array[0] === "number" &&
    typeof Object.getOwnPropertyDescriptor(position, "normalized")?.value ===
      "boolean" &&
    (interleaved
      ? Number.isSafeInteger(stride) &&
        stride >= itemSize &&
        Number.isSafeInteger(offset) &&
        offset >= 0 &&
        offset + itemSize <= stride &&
        count * stride <= array.length
      : count * itemSize <= array.length)
  );
}

function hasFiniteDiagonalAffineMatrix(matrix) {
  const e = matrix.elements;
  return (
    e[1] === 0 &&
    e[2] === 0 &&
    e[3] === 0 &&
    e[4] === 0 &&
    e[6] === 0 &&
    e[7] === 0 &&
    e[8] === 0 &&
    e[9] === 0 &&
    e[11] === 0 &&
    e[15] === 1 &&
    e.every(Number.isFinite) &&
    !Object.is(e[12], -0) &&
    !Object.is(e[13], -0) &&
    !Object.is(e[14], -0)
  );
}

function applyInstanceBoxMatrix(box, matrix) {
  const e = matrix.elements;
  const { min, max } = box;
  if (box.isEmpty() || e[3] !== 0 || e[7] !== 0 || e[11] !== 0 || e[15] !== 1)
    return box.applyMatrix4(matrix);
  const x0 =
    e[0] * (e[0] < 0 ? max.x : min.x) +
    e[4] * (e[4] < 0 ? max.y : min.y) +
    e[8] * (e[8] < 0 ? max.z : min.z) +
    e[12];
  const x1 =
    e[0] * (e[0] < 0 ? min.x : max.x) +
    e[4] * (e[4] < 0 ? min.y : max.y) +
    e[8] * (e[8] < 0 ? min.z : max.z) +
    e[12];
  const y0 =
    e[1] * (e[1] < 0 ? max.x : min.x) +
    e[5] * (e[5] < 0 ? max.y : min.y) +
    e[9] * (e[9] < 0 ? max.z : min.z) +
    e[13];
  const y1 =
    e[1] * (e[1] < 0 ? min.x : max.x) +
    e[5] * (e[5] < 0 ? min.y : max.y) +
    e[9] * (e[9] < 0 ? min.z : max.z) +
    e[13];
  const z0 =
    e[2] * (e[2] < 0 ? max.x : min.x) +
    e[6] * (e[6] < 0 ? max.y : min.y) +
    e[10] * (e[10] < 0 ? max.z : min.z) +
    e[14];
  const z1 =
    e[2] * (e[2] < 0 ? min.x : max.x) +
    e[6] * (e[6] < 0 ? min.y : max.y) +
    e[10] * (e[10] < 0 ? min.z : max.z) +
    e[14];
  // Nonfinite inputs or overflow cannot yield six finite extrema. Keep the
  // original corner path for those cases and for signed-zero extrema.
  if (
    !Number.isFinite(x0) ||
    x0 === 0 ||
    !Number.isFinite(x1) ||
    x1 === 0 ||
    !Number.isFinite(y0) ||
    y0 === 0 ||
    !Number.isFinite(y1) ||
    y1 === 0 ||
    !Number.isFinite(z0) ||
    z0 === 0 ||
    !Number.isFinite(z1) ||
    z1 === 0
  )
    return box.applyMatrix4(matrix);
  // Select actual extreme corners and retain Vector3's operation order.
  min.set(x0, y0, z0);
  max.set(x1, y1, z1);
  return box;
}

// Bounds for what can actually be seen at a sampled time. Box3.setFromObject
// includes hidden branches, which can make an otherwise legible lesson tiny.
export function visibleProcessBounds(
  root,
  target = new THREE.Box3(),
  instanceCache = null,
) {
  target.makeEmpty();
  root.updateWorldMatrix(true, true);
  const vertex = new THREE.Vector3();
  const instance = new THREE.Matrix4();
  const world = new THREE.Matrix4();
  const box = new THREE.Box3();
  const objectBounds = instanceCache ? new THREE.Box3() : null;
  const visit = (object) => {
    if (!object.visible) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const drawable = materials.some(
      (material) =>
        material &&
        material.visible &&
        !(material.transparent && material.opacity === 0),
    );
    const position = object.geometry?.attributes.position;
    if (position && drawable) {
      if (object.isInstancedMesh) {
        const cache = instanceCache?.isRetired?.(object) ? null : instanceCache;
        // Recompute after an animation updates positions or instance matrices;
        // a cached InstancedMesh.boundingBox can describe an earlier pose.
        object.geometry.computeBoundingBox();
        const cached = cache?.get(object, object.geometry.boundingBox);
        if (cached) target.union(cached);
        else {
          const extent = cache ? objectBounds.makeEmpty() : target;
          for (let i = 0; i < object.count; i++) {
            object.getMatrixAt(i, instance);
            world.multiplyMatrices(object.matrixWorld, instance);
            extent.union(
              applyInstanceBoxMatrix(
                box.copy(object.geometry.boundingBox),
                world,
              ),
            );
          }
          if (cache) {
            target.union(extent);
            cache.set(object, object.geometry.boundingBox, extent);
          }
        }
      } else {
        const meshCache =
          instanceCache?.meshBoundsEnabled && !instanceCache.isRetired?.(object)
            ? instanceCache
            : null;
        const cached = meshCache?.getMeshBounds(object);
        if (cached) target.union(cached);
        else {
          const extent = meshCache ? objectBounds.makeEmpty() : target;
          let bounded = false;
          if (
            hasStablePositionAttribute(position) &&
            hasFiniteDiagonalAffineMatrix(object.matrixWorld)
          ) {
            // Scan the complete position buffer, including unused tails. Do not
            // use geometry bounds: those can include morph targets or stale data.
            box.setFromBufferAttribute(position);
            if (
              Number.isFinite(box.min.x) &&
              Number.isFinite(box.min.y) &&
              Number.isFinite(box.min.z) &&
              Number.isFinite(box.max.x) &&
              Number.isFinite(box.max.y) &&
              Number.isFinite(box.max.z)
            ) {
              // Diagonal transforms are monotone per coordinate. Negative-zero
              // translations are excluded because invented corners can alter -0.
              extent.union(box.applyMatrix4(object.matrixWorld));
              bounded = true;
            }
          }
          if (!bounded) {
            for (let i = 0; i < position.count; i++) {
              vertex
                .fromBufferAttribute(position, i)
                .applyMatrix4(object.matrixWorld);
              extent.expandByPoint(vertex);
            }
          }
          if (meshCache) {
            target.union(extent);
            meshCache.setMeshBounds(object, extent);
          }
        }
      }
    }
    object.children.forEach(visit);
  };
  visit(root);
  return target;
}
