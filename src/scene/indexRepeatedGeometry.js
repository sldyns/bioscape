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
  const unique = new Map();
  const indices =
    count <= 65535 ? new Uint16Array(count) : new Uint32Array(count);
  for (let vertex = 0; vertex < count; vertex++) {
    const key = views
      .map(({ bytes, stride }) =>
        bytes.subarray(vertex * stride, (vertex + 1) * stride).join(","),
      )
      .join("|");
    let index = unique.get(key);
    if (index === undefined) {
      index = vertex;
      unique.set(key, index);
    }
    indices[vertex] = index;
  }
  if (unique.size < count) geometry.setIndex(new BufferAttribute(indices, 1));
  return geometry;
}
