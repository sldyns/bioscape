import * as THREE from "three";

// Share only vertices whose complete Float32 attributes are bit-identical.
// Unlike tolerance-based welding, this preserves normals, UV seams, signed
// zero, every triangle, and the original draw order. The input is consumed.
export function exactIndexGeometry(geometry) {
  if (geometry.index) return geometry;
  const attrs = geometry.attributes;
  if (
    Object.keys(attrs).length !== 3 ||
    !["position", "normal", "uv"].every(
      (name) =>
        attrs[name] &&
        !attrs[name].isInterleavedBufferAttribute &&
        attrs[name].array instanceof Float32Array,
    ) ||
    attrs.position.itemSize !== 3 ||
    attrs.normal.itemSize !== 3 ||
    attrs.uv.itemSize !== 2
  )
    return geometry;
  const count = attrs.position.count;
  const bits = ["position", "normal", "uv"].map((name) => {
    const a = attrs[name].array;
    return new Uint32Array(a.buffer, a.byteOffset, a.length);
  });
  let capacity = 1;
  while (capacity < count * 2) capacity *= 2;
  const table = new Uint32Array(capacity),
    mask = capacity - 1;
  const indices = new Uint32Array(count);
  let unique = 0;
  for (let i = 0; i < count; i++) {
    let hash = 2166136261;
    for (let a = 0; a < 3; a++) {
      const size = a === 2 ? 2 : 3;
      for (let k = 0; k < size; k++)
        hash = Math.imul(hash ^ bits[a][i * size + k], 16777619);
    }
    // Float bits often share low zero bits. Avalanche before masking avoids
    // long probe clusters on regular surfaces and axis-aligned UV values.
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    let slot = hash & mask;
    for (;;) {
      const entry = table[slot];
      if (!entry) {
        table[slot] = unique + 1;
        indices[i] = unique;
        for (let a = 0; a < 3; a++) {
          const size = a === 2 ? 2 : 3;
          for (let k = 0; k < size; k++)
            bits[a][unique * size + k] = bits[a][i * size + k];
        }
        unique++;
        break;
      }
      const candidate = entry - 1;
      let same = true;
      for (let a = 0; a < 3 && same; a++) {
        const size = a === 2 ? 2 : 3;
        for (let k = 0; k < size; k++)
          if (bits[a][candidate * size + k] !== bits[a][i * size + k]) {
            same = false;
            break;
          }
      }
      if (same) {
        indices[i] = candidate;
        break;
      }
      slot = (slot + 1) & mask;
    }
  }
  for (const name of ["position", "normal", "uv"]) {
    const attr = attrs[name];
    geometry.setAttribute(
      name,
      new THREE.BufferAttribute(
        attr.array.slice(0, unique * attr.itemSize),
        attr.itemSize,
        attr.normalized,
      ),
    );
  }
  geometry.setIndex(
    new THREE.BufferAttribute(
      unique <= 65535 ? new Uint16Array(indices) : indices,
      1,
    ),
  );
  return geometry;
}
