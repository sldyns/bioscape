// Keep every original Float32 sample and insert only the additional planes.
// The caller owns fixed CPU/GPU capacities; no buffers are replaced on update.
export function mergeSamplingPlanes(base, additions, count, target) {
  target.set(base);
  let length = base.length;
  for (let j = 0; j < count; j++) {
    const value = Math.fround(additions[j]);
    if (!Number.isFinite(value))
      throw new Error("Membrane sampling plane must be finite");
    if (value <= base[0] || value >= base[base.length - 1]) continue;
    let at = 0;
    while (at < length && target[at] < value) at++;
    if (target[at] === value) continue;
    if (length === target.length)
      throw new Error("Membrane sampling plane capacity exceeded");
    target.copyWithin(at + 1, at, length);
    target[at] = value;
    length++;
  }
  return length - 1;
}
