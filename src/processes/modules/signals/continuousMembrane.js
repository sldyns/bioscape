import { THREE } from "../../kit.js";

// A single isosurface of smoothly joined ellipsoids. Overlapping lobes have no
// internal membrane, and a narrowing neck becomes two closed surfaces at fission.
// Fixed buffers preserve scene/resource identity during deterministic seeks.
export function continuousMembrane(
  parent,
  material,
  bounds,
  resolution = [40, 32, 16],
) {
  const [nx, ny, nz] = resolution;
  const pointCount = (nx + 1) * (ny + 1) * (nz + 1),
    points = new Float64Array(pointCount * 3),
    values = new Float64Array(pointCount),
    cubes = new Uint32Array(nx * ny * nz * 8),
    strideY = nz + 1,
    strideX = (ny + 1) * strideY;
  const index = (x, y, z) => (x * (ny + 1) + y) * (nz + 1) + z;
  let point = 0;
  for (let x = 0; x <= nx; x++)
    for (let y = 0; y <= ny; y++)
      for (let z = 0; z <= nz; z++) {
        // Float64 retains the original Number arithmetic until GPU-buffer writes.
        points[point++] =
          bounds[0][0] + ((bounds[1][0] - bounds[0][0]) * x) / nx;
        points[point++] =
          bounds[0][1] + ((bounds[1][1] - bounds[0][1]) * y) / ny;
        points[point++] =
          bounds[0][2] + ((bounds[1][2] - bounds[0][2]) * z) / nz;
      }
  // Keep the original cube, tetrahedron and corner order. Connectivity is fixed;
  // no nested per-tetrahedron arrays or per-update corner objects are needed.
  const pattern = new Uint8Array([
    0, 5, 1, 6, 0, 1, 2, 6, 0, 2, 3, 6, 0, 3, 7, 6, 0, 7, 4, 6, 0, 4, 5, 6,
  ]);
  let corner = 0;
  for (let x = 0; x < nx; x++)
    for (let y = 0; y < ny; y++)
      for (let z = 0; z < nz; z++) {
        cubes[corner++] = index(x, y, z);
        cubes[corner++] = index(x + 1, y, z);
        cubes[corner++] = index(x + 1, y + 1, z);
        cubes[corner++] = index(x, y + 1, z);
        cubes[corner++] = index(x, y, z + 1);
        cubes[corner++] = index(x + 1, y, z + 1);
        cubes[corner++] = index(x + 1, y + 1, z + 1);
        cubes[corner++] = index(x, y + 1, z + 1);
      }
  const capacity = 60000;
  const positions = new Float32Array(capacity * 3),
    normals = new Float32Array(capacity * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "continuous-plasma-membrane";
  parent.add(mesh);
  // These conservative bounds cover every permitted lobe configuration.
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(...bounds[0]),
    new THREE.Vector3(...bounds[1]),
  );
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(
    new THREE.Sphere(),
  );
  let lobes = [],
    blend = 0.12;
  const insideSlots = new Int32Array(4),
    outsideSlots = new Int32Array(4),
    normalScratch = new Float64Array(3),
    edgePositions = new Float64Array(capacity * 3),
    edgeNormals = new Float64Array(capacity * 3),
    edgeSlots = new Uint32Array(pointCount * 14),
    edgeStamps = new Uint32Array(pointCount * 14);
  let revision = 0,
    edgeCount = 0,
    count = 0;
  function field(x, y, z, normal) {
    let d = 100,
      gx = 0,
      gy = 0,
      gz = 0;
    for (const l of lobes) {
      const dx = x - l.center[0],
        dy = y - l.center[1],
        dz = z - l.center[2];
      const q = Math.sqrt(
        dx * dx * l.inv[0] + dy * dy * l.inv[1] + dz * dz * l.inv[2],
      );
      const b = (q - 1) * l.min;
      if (normal) {
        const w = Math.max(0, Math.min(1, 0.5 + (0.5 * (d - b)) / blend)),
          f = l.min / Math.max(q, 1e-12);
        gx = gx * (1 - w) + w * f * dx * l.inv[0];
        gy = gy * (1 - w) + w * f * dy * l.inv[1];
        gz = gz * (1 - w) + w * f * dz * l.inv[2];
      }
      const h = Math.max(0, 1 - Math.abs(d - b) / blend);
      d = Math.min(d, b) - blend * h * h * 0.25;
    }
    if (normal) {
      const len = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
      normal[0] = gx / len;
      normal[1] = gy / len;
      normal[2] = gz / len;
    }
    return d;
  }
  function edge(a, b) {
    // Every tetrahedral edge follows one of the seven positive grid offsets.
    // Cache the two directions separately: reversing a/b changes interpolation
    // rounding, even though the mathematical point is identical.
    const delta = Math.abs(b - a),
      kind =
        delta === 1
          ? 0
          : delta === strideY
            ? 1
            : delta === strideX
              ? 2
              : delta === strideY + 1
                ? 3
                : delta === strideX + 1
                  ? 4
                  : delta === strideX + strideY
                    ? 5
                    : 6,
      key = (Math.min(a, b) * 7 + kind) * 2 + (a > b ? 1 : 0);
    if (edgeStamps[key] === revision) return edgeSlots[key];
    if (edgeCount === capacity) throw new RangeError("offset is out of bounds");
    const slot = edgeCount++ * 3,
      u = values[a] / (values[a] - values[b]),
      ai = a * 3,
      bi = b * 3,
      x = points[ai] + (points[bi] - points[ai]) * u,
      y = points[ai + 1] + (points[bi + 1] - points[ai + 1]) * u,
      z = points[ai + 2] + (points[bi + 2] - points[ai + 2]) * u;
    edgePositions[slot] = x;
    edgePositions[slot + 1] = y;
    edgePositions[slot + 2] = z;
    field(x, y, z, normalScratch);
    edgeNormals[slot] = normalScratch[0];
    edgeNormals[slot + 1] = normalScratch[1];
    edgeNormals[slot + 2] = normalScratch[2];
    edgeSlots[key] = slot;
    edgeStamps[key] = revision;
    return slot;
  }
  function emit(a, b, c) {
    const ux = edgePositions[b] - edgePositions[a],
      uy = edgePositions[b + 1] - edgePositions[a + 1],
      uz = edgePositions[b + 2] - edgePositions[a + 2],
      vx = edgePositions[c] - edgePositions[a],
      vy = edgePositions[c + 1] - edgePositions[a + 1],
      vz = edgePositions[c + 2] - edgePositions[a + 2];
    if (
      (uy * vz - uz * vy) * edgeNormals[a] +
        (uz * vx - ux * vz) * edgeNormals[a + 1] +
        (ux * vy - uy * vx) * edgeNormals[a + 2] <
      0
    ) {
      const swap = b;
      b = c;
      c = swap;
    }
    if (count + 3 > capacity) throw new RangeError("offset is out of bounds");
    // Scalar writes avoid temporary subarray views while retaining the original
    // Float64-to-Float32 conversion and exact emitted triangle/vertex order.
    const offset = count * 3;
    for (let j = 0; j < 3; j++) {
      positions[offset + j] = edgePositions[a + j];
      positions[offset + 3 + j] = edgePositions[b + j];
      positions[offset + 6 + j] = edgePositions[c + j];
      normals[offset + j] = edgeNormals[a + j];
      normals[offset + 3 + j] = edgeNormals[b + j];
      normals[offset + 6 + j] = edgeNormals[c + j];
    }
    count += 3;
  }
  function update(nextLobes, smoothing = 0.12) {
    // Molecular events often leave the membrane unchanged. Compare the actual
    // field inputs, including arbitrary backward seeks and condition changes,
    // before rebuilding its identical fixed-resolution isosurface.
    if (
      blend === smoothing &&
      lobes.length === nextLobes.length &&
      nextLobes.every(
        (l, i) =>
          l.center.every((v, j) => v === lobes[i].center[j]) &&
          l.radii.every((v, j) => v === lobes[i].radii[j]),
      )
    )
      return;
    lobes = nextLobes.map((l) => ({
      ...l,
      center: [...l.center],
      radii: [...l.radii],
      inv: l.radii.map((r) => 1 / (r * r)),
      min: Math.min(...l.radii),
    }));
    blend = smoothing;
    for (let i = 0; i < pointCount; i++) {
      const p = i * 3;
      values[i] = field(points[p], points[p + 1], points[p + 2]);
    }
    if (++revision === 0x100000000) {
      edgeStamps.fill(0);
      revision = 1;
    }
    edgeCount = 0;
    count = 0;
    for (let cube = 0; cube < cubes.length; cube += 8) {
      const firstInside = values[cubes[cube]] < 0;
      let mixed = false;
      for (let j = 1; j < 8; j++)
        if (values[cubes[cube + j]] < 0 !== firstInside) {
          mixed = true;
          break;
        }
      // A uniform-sign cube cannot emit a triangle in any of its six tetrahedra.
      if (!mixed) continue;
      for (let t = 0; t < pattern.length; t += 4) {
        let ni = 0,
          no = 0;
        for (let j = 0; j < 4; j++) {
          const point = cubes[cube + pattern[t + j]];
          if (values[point] < 0) insideSlots[ni++] = point;
          else outsideSlots[no++] = point;
        }
        if (ni === 1)
          emit(
            edge(insideSlots[0], outsideSlots[0]),
            edge(insideSlots[0], outsideSlots[1]),
            edge(insideSlots[0], outsideSlots[2]),
          );
        else if (ni === 3)
          emit(
            edge(outsideSlots[0], insideSlots[0]),
            edge(outsideSlots[0], insideSlots[1]),
            edge(outsideSlots[0], insideSlots[2]),
          );
        else if (ni === 2) {
          const a = edge(insideSlots[0], outsideSlots[0]),
            b = edge(insideSlots[0], outsideSlots[1]),
            c = edge(insideSlots[1], outsideSlots[0]),
            d = edge(insideSlots[1], outsideSlots[1]);
          emit(a, b, c);
          emit(b, d, c);
        }
      }
    }
    if (count > capacity) throw new Error("Membrane capacity exceeded");
    positions.fill(0, count * 3);
    normals.fill(0, count * 3);
    geometry.setDrawRange(0, count);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    // Unused entries stay finite and are excluded by drawRange.
  }
  return { mesh, update, field };
}
