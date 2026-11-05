import * as THREE from "three";

const getMatrixAt = THREE.InstancedMesh.prototype.getMatrixAt;
const fromArray = THREE.Matrix4.prototype.fromArray;
const multiplyMatrices = THREE.Matrix4.prototype.multiplyMatrices;
const applyBoxMatrix = THREE.Box3.prototype.applyMatrix4;
const applyVectorMatrix = THREE.Vector3.prototype.applyMatrix4;
const fromBufferAttribute = THREE.Vector3.prototype.fromBufferAttribute;
const attributeGetters = ["getX", "getY", "getZ"].map(
  (name) => THREE.BufferAttribute.prototype[name],
);
const expandByPoint = THREE.Box3.prototype.expandByPoint;

const ownValue = (owner, name) =>
  Object.getOwnPropertyDescriptor(owner, name)?.value;

// Resolve unchanged inherited data methods without invoking accessor overrides.
function dataMethod(owner, name) {
  for (let depth = 0; owner && depth < 8; depth++) {
    const property = Object.getOwnPropertyDescriptor(owner, name);
    if (property) return property.value;
    owner = Object.getPrototypeOf(owner);
  }
  return undefined;
}

function finiteBox(box) {
  if (!box || Object.getPrototypeOf(box) !== THREE.Box3.prototype) return false;
  const min = ownValue(box, "min");
  const max = ownValue(box, "max");
  if (!min || !max) return false;
  for (const axis of ["x", "y", "z"])
    if (
      !Number.isFinite(ownValue(min, axis)) ||
      !Number.isFinite(ownValue(max, axis))
    )
      return false;
  return min.x <= max.x && min.y <= max.y && min.z <= max.z;
}

function sameBox(a, b) {
  return (
    Object.is(a.min.x, b.min.x) &&
    Object.is(a.min.y, b.min.y) &&
    Object.is(a.min.z, b.min.z) &&
    Object.is(a.max.x, b.max.x) &&
    Object.is(a.max.y, b.max.y) &&
    Object.is(a.max.z, b.max.z)
  );
}

function eligible(object, box) {
  const ownMethod = Object.getOwnPropertyDescriptor(object, "getMatrixAt");
  if (
    (ownMethod
      ? ownMethod.value !== getMatrixAt
      : Object.getPrototypeOf(object) !== THREE.InstancedMesh.prototype) ||
    dataMethod(THREE.InstancedMesh.prototype, "getMatrixAt") !== getMatrixAt ||
    dataMethod(THREE.Matrix4.prototype, "fromArray") !== fromArray ||
    dataMethod(THREE.Matrix4.prototype, "multiplyMatrices") !==
      multiplyMatrices ||
    dataMethod(THREE.Box3.prototype, "applyMatrix4") !== applyBoxMatrix ||
    dataMethod(THREE.Vector3.prototype, "applyMatrix4") !== applyVectorMatrix ||
    !Number.isSafeInteger(ownValue(object, "count")) ||
    object.count <= 0 ||
    !finiteBox(box)
  )
    return false;
  const attribute = ownValue(object, "instanceMatrix");
  const array = attribute && ownValue(attribute, "array");
  const matrix = ownValue(object, "matrixWorld");
  const elements = matrix && ownValue(matrix, "elements");
  if (!Array.isArray(elements) || elements.length !== 16) return false;
  for (let index = 0; index < 16; index++)
    if (!Number.isFinite(ownValue(elements, String(index)))) return false;
  // Shared/resizable storage can change between comparison and use. Unknown
  // accessors and custom matrix methods keep the original computation.
  return (
    array instanceof Float32Array &&
    array.buffer instanceof ArrayBuffer &&
    array.buffer.resizable !== true &&
    array.length >= object.count * 16
  );
}

// Ordinary mesh bounds use actual position vertices rather than geometry boxes.
// Retain that exact algorithm on misses; only unchanged native float32 positions
// and all16 unchanged world-matrix numbers may reuse the previous world bounds.
function meshDescriptor(object) {
  const geometry = ownValue(object, "geometry");
  const attributes = geometry && ownValue(geometry, "attributes");
  const position = attributes && ownValue(attributes, "position");
  const array = position && ownValue(position, "array");
  const count = position && ownValue(position, "count");
  const matrix = ownValue(object, "matrixWorld");
  const elements = matrix && ownValue(matrix, "elements");
  if (
    !position ||
    ownValue(position, "itemSize") !== 3 ||
    ownValue(position, "normalized") !== false ||
    !Number.isSafeInteger(count) ||
    count <= 0 ||
    !(array instanceof Float32Array) ||
    !(array.buffer instanceof ArrayBuffer) ||
    array.buffer.resizable === true ||
    count * 3 > array.length ||
    !Array.isArray(elements) ||
    elements.length !== 16 ||
    dataMethod(THREE.Vector3.prototype, "applyMatrix4") !== applyVectorMatrix ||
    dataMethod(THREE.Vector3.prototype, "fromBufferAttribute") !==
      fromBufferAttribute ||
    dataMethod(THREE.Box3.prototype, "expandByPoint") !== expandByPoint
  )
    return null;
  for (let i = 0; i < 3; i++)
    if (
      dataMethod(position, ["getX", "getY", "getZ"][i]) !== attributeGetters[i]
    )
      return null;
  for (let i = 0; i < 16; i++)
    if (!Number.isFinite(ownValue(elements, String(i)))) return null;
  return { array, count, elements };
}

// One framing job owns this store. Geometry.computeBoundingBox still runs on
// every visit, including its morph-target and mutable-position handling.
// A hit requires the actual local box, all16 world matrix numbers and EVERY
// instance-matrix byte to match, even when callers omit needsUpdate/version.
// The limit covers retained typed snapshots/keys; entry count bounds the
// additional small objects. No renderer, GPU object or worker is retained.
export function createInstanceBoundsCache({
  byteLimit = 16 * 1024 * 1024,
  entryLimit = 2048,
  cacheMeshBounds = false,
  retireOnChange = false,
  retireUnproductiveAfterSamples = 0,
} = {}) {
  if (
    !Number.isSafeInteger(byteLimit) ||
    byteLimit < 0 ||
    !Number.isSafeInteger(entryLimit) ||
    entryLimit < 0 ||
    typeof cacheMeshBounds !== "boolean" ||
    typeof retireOnChange !== "boolean" ||
    !Number.isSafeInteger(retireUnproductiveAfterSamples) ||
    (retireUnproductiveAfterSamples !== 0 && retireUnproductiveAfterSamples < 2)
  )
    throw new Error("Invalid instance bounds cache limit");
  const entries = new Map();
  const meshEntries = new Map();
  let retired = new WeakSet();
  let retiredEntries = 0;
  let totalRetirements = 0;
  let meshHits = 0;
  let meshMisses = 0;
  let retainedBytes = 0;
  let hits = 0;
  let misses = 0;
  let completedSamples = 0;
  let disabledForLowReuse = false;
  const clearStorage = () => {
    entries.clear();
    meshEntries.clear();
    retired = new WeakSet();
    retiredEntries = 0;
    retainedBytes = 0;
  };
  const drop = (object) => {
    const entry = entries.get(object);
    if (!entry) return;
    entries.delete(object);
    retainedBytes -= entry.bytes;
  };
  const dropMesh = (object) => {
    const entry = meshEntries.get(object);
    if (!entry) return;
    meshEntries.delete(object);
    retainedBytes -= entry.bytes;
  };
  // A changed input conservatively retires the object for this one framing
  // preparation. All later visits use the original algorithm without cache
  // validation/copies. Markers share the same bounded entry budget and retain
  // only weak object keys; clear() also resets every marker.
  const retire = (object) => {
    if (!retireOnChange) return;
    drop(object);
    dropMesh(object);
    if (
      !retired.has(object) &&
      entries.size + meshEntries.size + retiredEntries < entryLimit
    ) {
      retired.add(object);
      retiredEntries++;
      totalRetirements++;
    }
  };
  return {
    get enabled() {
      return !disabledForLowReuse;
    },
    get meshBoundsEnabled() {
      return cacheMeshBounds && !disabledForLowReuse;
    },
    // Decide only after complete poses. A preparation with no instance reuse
    // and fewer ordinary hits than all misses uses the exact uncached path for
    // every remaining pose. Release both snapshots and weak markers at once.
    finishSample() {
      completedSamples++;
      if (
        !disabledForLowReuse &&
        retireUnproductiveAfterSamples > 0 &&
        completedSamples === retireUnproductiveAfterSamples &&
        hits === 0 &&
        meshHits < meshMisses + misses
      ) {
        clearStorage();
        disabledForLowReuse = true;
      }
      return !disabledForLowReuse;
    },
    admissionStatistics() {
      return {
        warmupSamples: retireUnproductiveAfterSamples,
        completedSamples,
        disabled: disabledForLowReuse,
      };
    },
    isRetired(object) {
      return disabledForLowReuse || (retireOnChange && retired.has(object));
    },
    getMeshBounds(object) {
      if (disabledForLowReuse || !cacheMeshBounds || retired.has(object))
        return null;
      const entry = meshEntries.get(object);
      if (!entry) {
        meshMisses++;
        return null;
      }
      const descriptor = meshDescriptor(object);
      if (
        !descriptor ||
        descriptor.array !== entry.array ||
        descriptor.array.length !== entry.words.length
      ) {
        dropMesh(object);
        retire(object);
        meshMisses++;
        return null;
      }
      if (descriptor.count !== entry.count) {
        retire(object);
        meshMisses++;
        return null;
      }
      for (let i = 0; i < 16; i++)
        if (!Object.is(descriptor.elements[i], entry.world[i])) {
          retire(object);
          meshMisses++;
          return null;
        }
      for (let i = 0; i < entry.words.length; i++)
        if (entry.currentWords[i] !== entry.words[i]) {
          retire(object);
          meshMisses++;
          return null;
        }
      meshHits++;
      return entry.bounds;
    },
    setMeshBounds(object, bounds) {
      if (disabledForLowReuse || !cacheMeshBounds || retired.has(object))
        return false;
      const descriptor = meshDescriptor(object);
      if (!descriptor || !finiteBox(bounds)) {
        dropMesh(object);
        retire(object);
        return false;
      }
      const { array, count, elements } = descriptor;
      let entry = meshEntries.get(object);
      if (entry && entry.array !== array) {
        dropMesh(object);
        entry = null;
      }
      const bytes = array.byteLength + 16 * Float64Array.BYTES_PER_ELEMENT;
      if (
        (!entry &&
          entries.size + meshEntries.size + retiredEntries >= entryLimit) ||
        retainedBytes - (entry?.bytes ?? 0) + bytes > byteLimit
      )
        return false;
      if (!entry) {
        entry = {
          array,
          currentWords: new Uint32Array(
            array.buffer,
            array.byteOffset,
            array.length,
          ),
          words: new Uint32Array(array.length),
          world: new Float64Array(16),
          bounds: new THREE.Box3(),
          bytes,
          count: 0,
        };
        meshEntries.set(object, entry);
        retainedBytes += bytes;
      }
      entry.words.set(entry.currentWords);
      entry.world.set(elements);
      entry.bounds.copy(bounds);
      entry.count = count;
      return true;
    },
    get(object, localBox) {
      if (disabledForLowReuse || retired.has(object)) return null;
      const entry = entries.get(object);
      if (!entry) {
        misses++;
        return null;
      }
      if (
        !eligible(object, localBox) ||
        object.instanceMatrix.array !== entry.array ||
        object.instanceMatrix.array.length !== entry.words.length
      ) {
        drop(object);
        retire(object);
        misses++;
        return null;
      }
      if (object.count !== entry.count || !sameBox(localBox, entry.localBox)) {
        retire(object);
        misses++;
        return null;
      }
      const elements = object.matrixWorld.elements;
      for (let i = 0; i < 16; i++) {
        if (!Object.is(elements[i], entry.world[i])) {
          retire(object);
          misses++;
          return null;
        }
      }
      for (let i = 0; i < entry.words.length; i++) {
        if (entry.currentWords[i] !== entry.words[i]) {
          retire(object);
          misses++;
          return null;
        }
      }
      hits++;
      return entry.bounds;
    },
    set(object, localBox, bounds) {
      if (disabledForLowReuse || retired.has(object)) return false;
      if (!eligible(object, localBox) || !finiteBox(bounds)) {
        drop(object);
        retire(object);
        return false;
      }
      const array = object.instanceMatrix.array;
      let entry = entries.get(object);
      if (entry && entry.array !== array) {
        drop(object);
        entry = null;
      }
      const bytes = array.byteLength + 16 * Float64Array.BYTES_PER_ELEMENT;
      if (
        (!entry &&
          entries.size + meshEntries.size + retiredEntries >= entryLimit) ||
        retainedBytes - (entry?.bytes ?? 0) + bytes > byteLimit
      )
        return false;
      if (!entry) {
        entry = {
          array,
          currentWords: new Uint32Array(
            array.buffer,
            array.byteOffset,
            array.length,
          ),
          words: new Uint32Array(array.length),
          world: new Float64Array(16),
          localBox: new THREE.Box3(),
          bounds: new THREE.Box3(),
          bytes,
          count: 0,
        };
        entries.set(object, entry);
        retainedBytes += bytes;
      }
      entry.words.set(entry.currentWords);
      entry.world.set(object.matrixWorld.elements);
      entry.localBox.copy(localBox);
      entry.bounds.copy(bounds);
      entry.count = object.count;
      return true;
    },
    clear() {
      clearStorage();
    },
    statistics() {
      return {
        hits,
        misses,
        entries: entries.size + meshEntries.size + retiredEntries,
        retiredEntries,
        totalRetirements,
        instanceEntries: entries.size,
        meshEntries: meshEntries.size,
        meshHits,
        meshMisses,
        retainedBytes,
        byteLimit,
        entryLimit,
      };
    },
  };
}
