import { BufferAttribute } from "three";

// Use only for immutable primitive geometry, before creating its instances.
// Keep every original attribute buffer and triangle in its original order.
// An exact byte key (no tolerance/rounding) lets the GPU reuse identical vertices
// without joining UV seams, smoothing normals or simplifying the mesh.
export function indexRepeatedGeometry(geometry) {
  if (geometry.index || Object.keys(geometry.morphAttributes).length)
    return geometry;
  const attributes = Object.values(geometry.attributes);
  const count = geometry.attributes.position?.count ?? 0;
  if (
    !count ||
    attributes.some(
      (attribute) =>
        attribute.isInterleavedBufferAttribute ||
        attribute.isInstancedBufferAttribute ||
        attribute.count !== count,
    )
  )
    return geometry;
  const views = attributes.map((attribute) => ({
    bytes: new Uint8Array(
      attribute.array.buffer,
      attribute.array.byteOffset,
      attribute.array.byteLength,
    ),
    stride: attribute.itemSize * attribute.array.BYTES_PER_ELEMENT,
  }));
  let capacity = 1;
  while (capacity < count * 2) capacity *= 2;
  const table = new Uint32Array(capacity),
    mask = capacity - 1;
  let uniqueCount = 0;
  const indices =
    count <= 65535 ? new Uint16Array(count) : new Uint32Array(count);
  for (let vertex = 0; vertex < count; vertex++) {
    let hash = 2166136261;
    for (const { bytes, stride } of views) {
      const start = vertex * stride;
      for (let offset = 0; offset < stride; offset++)
        hash = Math.imul(hash ^ bytes[start + offset], 16777619);
    }
    // Avalanche the shared low bits common in Float32 primitive attributes.
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    let slot = hash & mask;
    for (;;) {
      const entry = table[slot];
      if (!entry) {
        table[slot] = vertex + 1;
        indices[vertex] = vertex;
        uniqueCount++;
        break;
      }
      const candidate = entry - 1;
      let same = true;
      for (const { bytes, stride } of views) {
        const start = vertex * stride,
          previous = candidate * stride;
        for (let offset = 0; offset < stride; offset++)
          if (bytes[start + offset] !== bytes[previous + offset]) {
            same = false;
            break;
          }
        if (!same) break;
      }
      if (same) {
        indices[vertex] = candidate;
        break;
      }
      slot = (slot + 1) & mask;
    }
  }
  if (uniqueCount < count) geometry.setIndex(new BufferAttribute(indices, 1));
  return geometry;
}
