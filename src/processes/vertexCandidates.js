// Exact search acceleration only; these are existing rendered vertex indices.
// The publisher covers every rendered coordinate in first-emission order.
// The geometry remains the sole lifetime owner through this weak association.
const candidates = new WeakMap();

export function invalidateVertexCandidates(geometry) {
  const current = candidates.get(geometry);
  if (current) current.valid = false;
}

export function publishVertexCandidates(geometry, indices, count) {
  const position = geometry.attributes.position;
  if (
    geometry.index ||
    !position ||
    position.isInterleavedBufferAttribute ||
    position.normalized ||
    position.itemSize !== 3 ||
    !(position.array instanceof Float32Array) ||
    !(indices instanceof Uint32Array) ||
    !Number.isInteger(count) ||
    count < 0 ||
    count > indices.length ||
    count > position.count
  ) {
    invalidateVertexCandidates(geometry);
    return false;
  }
  let current = candidates.get(geometry);
  if (!current) {
    current = {};
    candidates.set(geometry, current);
  }
  current.attribute = position;
  current.array = position.array;
  current.version = position.version;
  current.start = geometry.drawRange.start;
  current.drawCount = geometry.drawRange.count;
  current.indices = indices;
  current.count = count;
  current.valid = true;
  return true;
}

export function readVertexCandidates(geometry) {
  const current = candidates.get(geometry);
  const position = geometry.attributes.position;
  return current?.valid &&
    !geometry.index &&
    current.attribute === position &&
    current.array === position.array &&
    !position.isInterleavedBufferAttribute &&
    !position.normalized &&
    position.itemSize === 3 &&
    current.version === position.version &&
    current.start === geometry.drawRange.start &&
    current.drawCount === geometry.drawRange.count
    ? current
    : null;
}
