import { THREE } from "../../kit.js";

// A single level set joins the cell lobes and their retained channels. Unlike
// intersecting closed ellipsoids plus a connector, this has no internal caps.
// The positive-z half is intentionally omitted as the lesson's viewing cutaway.
export function germCellMembrane(k) {
  const group = new THREE.Group();
  group.name = "continuous-germ-cell-membrane";
  k.group.add(group);
  const nx = 64,
    ny = 56,
    nz = 18;
  const dx = 8 / nx,
    dy = 6.6 / ny,
    dz = 1.65 / nz;
  const row = nx + 1,
    plane = row * (ny + 1),
    count = plane * (nz + 1);
  const field = new Float32Array(count);
  const gradients = new Float32Array(count * 3);
  const coordinates = new Float32Array(count * 3);
  const index = (i, j, l) => i + j * row + l * plane;
  for (let l = 0; l <= nz; l++)
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        coordinates.set(
          [-4 + i * dx, -3.3 + j * dy, -1.65 + l * dz],
          index(i, j, l) * 3,
        );
      }
  const layers = [0, -0.035].map((level, i) => {
    const material = k.material(i ? "#dce7dd" : "#b8d0c6", {
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    k.materials.add(material);
    const geometry = new THREE.BufferGeometry();
    geometry.boundingBox = new THREE.Box3();
    geometry.boundingSphere = new THREE.Sphere();
    // Fixed resource and buffer identities while the division topology evolves.
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(90000 * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(90000 * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = i ? "germ-cell-inner-leaflet" : "germ-cell-outer-leaflet";
    group.add(mesh);
    return { level, geometry };
  });
  const tets = [
    [0, 5, 1, 6],
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 0],
    [0, 3],
    [1, 3],
    [2, 3],
  ];
  const triangles = [
    [],
    [0, 3, 2],
    [0, 1, 4],
    [1, 4, 2, 2, 4, 3],
    [1, 2, 5],
    [0, 3, 5, 0, 5, 1],
    [0, 2, 5, 0, 5, 4],
    [5, 4, 3],
    [3, 4, 5],
    [4, 5, 0, 5, 2, 0],
    [1, 5, 0, 5, 3, 0],
    [5, 2, 1],
    [3, 4, 2, 2, 4, 1],
    [4, 1, 0],
    [2, 3, 0],
    [],
  ];
  const cornerOffsets = [
    0,
    1,
    row + 1,
    row,
    plane,
    plane + 1,
    plane + row + 1,
    plane + row,
  ];
  const tetraOffsets = tets.map((tet) => tet.map((c) => cornerOffsets[c]));
  const crossingEdges = triangles.map((tri) => [...new Set(tri)]);
  const activeCells = new Int32Array(nx * ny * nz);
  const activeMin = new Float32Array(activeCells.length);
  const activeMax = new Float32Array(activeCells.length);
  const ids = new Int32Array(4);
  // Adjacent tetrahedra share these seven grid-edge directions. Cache the first
  // emitted intersection, retaining the same nonindexed triangles and normals.
  // The cache points into the existing output buffer; it adds no mesh resources.
  const edgeKinds = new Uint8Array(plane + row + 2);
  [1, row, plane, row + 1, plane + 1, plane + row, plane + row + 1].forEach(
    (offset, kind) => {
      edgeKinds[offset] = kind;
    },
  );
  const edgeCache = new Int32Array(count * 7),
    edgeKeys = new Int32Array(6);
  const v = new Float64Array(4),
    ep = new Float64Array(18),
    en = new Float64Array(18);
  const smoothMin = (a, b) => {
    const h = Math.max(0.12 - Math.abs(a - b), 0) / 0.12;
    return Math.min(a, b) - h * h * 0.03;
  };
  let lastFirst = -1,
    lastSecond = -1;
  // Axis terms are reused for every grid row. The sample coordinates and the
  // two isovalues are unchanged; this removes repeated hypot/abs work without
  // reducing either the scalar grid or the marching-tetrahedra detail.
  const xLobe = new Float64Array(nx + 1),
    xHorizontal = new Float64Array(nx + 1),
    xVertical = new Float64Array(nx + 1),
    yLobe = new Float64Array(ny + 1),
    yHorizontal = new Float64Array(ny + 1),
    yVertical = new Float64Array(ny + 1);
  function update(first, second) {
    if (first === lastFirst && second === lastSecond) return;
    lastFirst = first;
    lastSecond = second;
    const cx = 2.05 * first,
      cy = 1.32 * second;
    const rx = 3.3 + (1.58 - 3.3) * first - 0.1 * second;
    const ry = 2.15 + (1.85 - 2.15) * first - 0.65 * second;
    const rz = 1.35 + (1.15 - 1.35) * first - 0.11 * second;
    for (let i = 0; i <= nx; i++) {
      const x = Math.abs(coordinates[i * 3]) - cx;
      xLobe[i] = (x / rx) ** 2;
      xHorizontal[i] = Math.max(x, 0) ** 2;
      xVertical[i] = x * x;
    }
    for (let j = 0; j <= ny; j++) {
      const y = coordinates[j * row * 3 + 1];
      yLobe[j] = ((Math.abs(y) - cy) / ry) ** 2;
      yHorizontal[j] = (y - cy) ** 2;
      yVertical[j] = Math.max(Math.abs(y) - cy, 0) ** 2;
    }
    for (let l = 0; l <= nz; l++) {
      const z = coordinates[l * plane * 3 + 2],
        zLobe = (z / rz) ** 2,
        z2 = z * z;
      for (let j = 0; j <= ny; j++) {
        const yL = yLobe[j] + zLobe,
          yH = yHorizontal[j] + z2,
          yV = yVertical[j] + z2,
          n = l * plane + j * row;
        // Every x term depends only on abs(x). These x coordinates are exact
        // binary fractions (-4 + i/8), so mirrored samples are bit-identical.
        // Copy the rounded Float32 value while retaining the complete grid.
        for (let i = 0; i <= nx / 2; i++) {
          const lobe = (Math.sqrt(xLobe[i] + yL) - 1) * rz,
            horizontal = Math.sqrt(xHorizontal[i] + yH) - 0.2,
            vertical = Math.sqrt(xVertical[i] + yV) - 0.2;
          field[n + i] = smoothMin(smoothMin(lobe, horizontal), vertical);
          field[n + nx - i] = field[n + i];
        }
      }
    }
    for (let l = 0; l <= nz; l++)
      for (let j = 0; j <= ny; j++)
        for (let i = 0; i <= nx; i++) {
          const p = i + j * row + l * plane,
            n = p * 3;
          gradients[n] =
            (field[p + (i < nx ? 1 : 0)] - field[p - (i > 0 ? 1 : 0)]) /
            ((i === 0 || i === nx ? 1 : 2) * dx);
          gradients[n + 1] =
            (field[p + (j < ny ? row : 0)] - field[p - (j > 0 ? row : 0)]) /
            ((j === 0 || j === ny ? 1 : 2) * dy);
          gradients[n + 2] =
            (field[p + (l < nz ? plane : 0)] - field[p - (l > 0 ? plane : 0)]) /
            ((l === 0 || l === nz ? 1 : 2) * dz);
        }
    // Screen each cell once for both leaflets. Only cells that can intersect an
    // isosurface enter the six-tetrahedron extraction loop.
    let activeCount = 0;
    for (let l = 0; l < nz; l++)
      for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
          const n = i + j * row + l * plane;
          let min = Infinity,
            max = -Infinity;
          for (let c = 0; c < 8; c++) {
            const value = field[n + cornerOffsets[c]];
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
          if (min > 0 || max < -0.035) continue;
          activeCells[activeCount] = n;
          activeMin[activeCount] = min;
          activeMax[activeCount++] = max;
        }
    for (const { level, geometry } of layers) {
      const positions = geometry.attributes.position.array,
        normals = geometry.attributes.normal.array;
      positions.fill(0);
      normals.fill(0);
      edgeCache.fill(0);
      let cursor = 0;
      const box = geometry.boundingBox;
      box.makeEmpty();
      for (let cell = 0; cell < activeCount; cell++) {
        if (activeMin[cell] > level || activeMax[cell] < level) continue;
        const n = activeCells[cell];
        for (const tet of tetraOffsets) {
          let mask = 0;
          for (let q = 0; q < 4; q++) {
            ids[q] = n + tet[q];
            v[q] = field[ids[q]];
            if (v[q] < level) mask |= 1 << q;
          }
          const tri = triangles[mask];
          if (!tri.length) continue;
          for (const e of crossingEdges[mask]) {
            const [a, b] = edges[e];
            const low = Math.min(ids[a], ids[b]),
              high = Math.max(ids[a], ids[b]),
              key = low * 7 + edgeKinds[high - low],
              cached = edgeCache[key] - 1;
            edgeKeys[e] = key;
            if (cached >= 0) {
              for (let q = 0; q < 3; q++) {
                ep[e * 3 + q] = positions[cached + q];
                en[e * 3 + q] = normals[cached + q];
              }
              continue;
            }
            const t = (level - v[a]) / (v[b] - v[a]);
            for (let q = 0; q < 3; q++) {
              ep[e * 3 + q] =
                coordinates[ids[a] * 3 + q] * (1 - t) +
                coordinates[ids[b] * 3 + q] * t;
              en[e * 3 + q] =
                gradients[ids[a] * 3 + q] * (1 - t) +
                gradients[ids[b] * 3 + q] * t;
            }
            const norm =
              Math.hypot(en[e * 3], en[e * 3 + 1], en[e * 3 + 2]) || 1;
            for (let q = 0; q < 3; q++) en[e * 3 + q] /= norm;
          }
          for (const e of tri) {
            if (cursor + 3 > positions.length)
              throw new Error("Germ-cell surface capacity exceeded");
            if (!edgeCache[edgeKeys[e]]) edgeCache[edgeKeys[e]] = cursor + 1;
            for (let q = 0; q < 3; q++) {
              positions[cursor] = ep[e * 3 + q];
              normals[cursor++] = en[e * 3 + q];
            }
            box.min.x = Math.min(box.min.x, ep[e * 3]);
            box.min.y = Math.min(box.min.y, ep[e * 3 + 1]);
            box.min.z = Math.min(box.min.z, ep[e * 3 + 2]);
            box.max.x = Math.max(box.max.x, ep[e * 3]);
            box.max.y = Math.max(box.max.y, ep[e * 3 + 1]);
            box.max.z = Math.max(box.max.z, ep[e * 3 + 2]);
          }
        }
      }
      geometry.setDrawRange(0, cursor / 3);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
      geometry.attributes.position.clearUpdateRanges();
      geometry.attributes.normal.clearUpdateRanges();
      geometry.attributes.position.addUpdateRange(0, cursor);
      geometry.attributes.normal.addUpdateRange(0, cursor);
      // A conservative sphere avoids rescanning the unused fixed-capacity tail.
      box.getCenter(geometry.boundingSphere.center);
      geometry.boundingSphere.radius = box.min.distanceTo(box.max) * 0.5;
    }
  }
  // Piecewise-linear interpolation in the same tetrahedra as the rendered
  // surface, mirrored across its deliberate viewing cut. Ring contours use the
  // actual sampled inner leaflet, rather than a separate shrink formula.
  function scalarAt(x, y, z) {
    const gx = Math.max(0, Math.min(nx, (x + 4) / dx)),
      gy = Math.max(0, Math.min(ny, (y + 3.3) / dy)),
      gz = Math.max(0, Math.min(nz, (1.65 - Math.abs(z)) / dz));
    const i = Math.min(nx - 1, Math.floor(gx)),
      j = Math.min(ny - 1, Math.floor(gy)),
      l = Math.min(nz - 1, Math.floor(gz));
    const tx = gx - i,
      ty = gy - j,
      tz = gz - l,
      n = i + j * row + l * plane;
    let hi, mid, lo, a, b;
    if (tx >= ty) {
      if (ty >= tz) {
        hi = tx;
        mid = ty;
        lo = tz;
        a = 1;
        b = 1 + row;
      } else if (tx >= tz) {
        hi = tx;
        mid = tz;
        lo = ty;
        a = 1;
        b = 1 + plane;
      } else {
        hi = tz;
        mid = tx;
        lo = ty;
        a = plane;
        b = plane + 1;
      }
    } else if (tx >= tz) {
      hi = ty;
      mid = tx;
      lo = tz;
      a = row;
      b = row + 1;
    } else if (ty >= tz) {
      hi = ty;
      mid = tz;
      lo = tx;
      a = row;
      b = row + plane;
    } else {
      hi = tz;
      mid = ty;
      lo = tx;
      a = plane;
      b = plane + row;
    }
    return (
      (1 - hi) * field[n] +
      (hi - mid) * field[n + a] +
      (mid - lo) * field[n + b] +
      lo * field[n + plane + row + 1]
    );
  }
  function contourRadius(axis, centerX, angle) {
    const a = Math.cos(angle),
      b = Math.sin(angle);
    let lo = 0,
      hi = 3;
    for (let i = 0; i < 19; i++) {
      const r = (lo + hi) * 0.5;
      const value =
        axis === "x"
          ? scalarAt(centerX, r * b, -r * a)
          : scalarAt(centerX + r * a, 0, r * b);
      if (value < -0.035) lo = r;
      else hi = r;
    }
    return (lo + hi) * 0.5;
  }
  update(0, 0);
  return { group, update, contourRadius };
}
