// Match Three's indexed normal accumulation, including each Float32 write.
export function computeIndexedFloat32VertexNormals(geometry) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const index = geometry.index;
  if (
    !position ||
    !normal ||
    !index ||
    position.isInterleavedBufferAttribute ||
    normal.isInterleavedBufferAttribute ||
    index.isInterleavedBufferAttribute ||
    position.normalized ||
    normal.normalized ||
    index.normalized ||
    position.itemSize !== 3 ||
    normal.itemSize !== 3 ||
    index.itemSize !== 1 ||
    !(position.array instanceof Float32Array) ||
    !(normal.array instanceof Float32Array) ||
    !(index.array instanceof Uint16Array || index.array instanceof Uint32Array)
  )
    return geometry.computeVertexNormals();

  const p = position.array,
    n = normal.array,
    indices = index.array;
  n.fill(0);
  for (let i = 0; i < index.count; i += 3) {
    const a = indices[i] * 3,
      b = indices[i + 1] * 3,
      c = indices[i + 2] * 3;
    const cbx = p[c] - p[b],
      cby = p[c + 1] - p[b + 1],
      cbz = p[c + 2] - p[b + 2];
    const abx = p[a] - p[b],
      aby = p[a + 1] - p[b + 1],
      abz = p[a + 2] - p[b + 2];
    const x = cby * abz - cbz * aby;
    const y = cbz * abx - cbx * abz;
    const z = cbx * aby - cby * abx;
    // Read every old normal before writing: a triangle can repeat a vertex.
    const ax = n[a] + x,
      ay = n[a + 1] + y,
      az = n[a + 2] + z;
    const bx = n[b] + x,
      by = n[b + 1] + y,
      bz = n[b + 2] + z;
    const cx = n[c] + x,
      cy = n[c + 1] + y,
      cz = n[c + 2] + z;
    n[a] = ax;
    n[a + 1] = ay;
    n[a + 2] = az;
    n[b] = bx;
    n[b + 1] = by;
    n[b + 2] = bz;
    n[c] = cx;
    n[c + 1] = cy;
    n[c + 2] = cz;
  }
  for (let i = 0; i < normal.count * 3; i += 3) {
    const x = n[i],
      y = n[i + 1],
      z = n[i + 2];
    const inverse = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
    n[i] = x * inverse;
    n[i + 1] = y * inverse;
    n[i + 2] = z * inverse;
  }
  normal.needsUpdate = true;
}
