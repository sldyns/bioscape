import * as THREE from "three";
import { exactIndexGeometry } from "./exactGeometry";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";

// Union of ellipsoidal samples: both surfaces share a connected cavity at junctions.
export function implicitMembrane(
  samples,
  half,
  resolution = 104,
  maxPolygons = 180000,
) {
  const placeholder = new THREE.MeshBasicMaterial(),
    mc = new MarchingCubes(resolution, placeholder, true, false, maxPolygons);
  mc.field.fill(-10);
  const n = resolution,
    n2 = n * n,
    xSquared = new Float64Array(n);
  for (const { p, r } of samples) {
    const lo = p.map((v, i) =>
      Math.max(
        1,
        Math.floor(((v - r[i] * 1.12 + half[i]) / (2 * half[i])) * n),
      ),
    );
    const hi = p.map((v, i) =>
      Math.min(
        n - 2,
        Math.ceil(((v + r[i] * 1.12 + half[i]) / (2 * half[i])) * n),
      ),
    );
    // The x term is reused for every row. Keep arithmetic order identical to
    // the original field evaluation so the marching surface is unchanged.
    for (let x = lo[0]; x <= hi[0]; x++) {
      const dx = (((x / n) * 2 - 1) * half[0] - p[0]) / r[0];
      xSquared[x] = dx * dx;
    }
    for (let z = lo[2]; z <= hi[2]; z++) {
      const dz = (((z / n) * 2 - 1) * half[2] - p[2]) / r[2],
        zSquared = dz * dz;
      for (let y = lo[1]; y <= hi[1]; y++) {
        const dy = (((y / n) * 2 - 1) * half[1] - p[1]) / r[1],
          ySquared = dy * dy,
          row = y * n + z * n2;
        for (let x = lo[0]; x <= hi[0]; x++) {
          const value = 1 - xSquared[x] - ySquared - zSquared,
            i = x + row;
          if (value > mc.field[i]) mc.field[i] = value;
        }
      }
    }
  }
  const result = [];
  for (const [level, inward] of [
    [0, false],
    [0.42, true],
  ]) {
    mc.isolation = level;
    mc.update();
    if (mc.count > maxPolygons * 3)
      throw new Error("Implicit membrane exceeds its geometry capacity");
    const geo = new THREE.BufferGeometry();
    for (const name of ["position", "normal", "uv"]) {
      const attr = mc.geometry.attributes[name];
      geo.setAttribute(
        name,
        new THREE.BufferAttribute(
          attr.array.slice(0, mc.count * attr.itemSize),
          attr.itemSize,
        ),
      );
    }
    geo.scale(...half);
    if (inward) {
      for (const attr of Object.values(geo.attributes)) {
        const size = attr.itemSize;
        for (let i = 0; i < attr.count; i += 3)
          for (let j = 0; j < size; j++) {
            const a = (i + 1) * size + j,
              b = (i + 2) * size + j,
              temp = attr.array[a];
            attr.array[a] = attr.array[b];
            attr.array[b] = temp;
          }
      }
      for (let i = 0; i < geo.attributes.normal.array.length; i++)
        geo.attributes.normal.array[i] *= -1;
    }
    result.push(geo);
  }
  mc.geometry.dispose();
  placeholder.dispose();
  return result;
}

// Split triangles at an illustrative section surface instead of hiding whole triangles.
export function splitSection(geometry, signedDistance) {
  const attrs = geometry.attributes,
    index = geometry.index,
    count = index ? index.count : attrs.position.count;
  // Each input triangle produces at most two triangles per side. Grow only
  // the side that needs more space, rather than allocating millions of arrays.
  const buckets = Array.from({ length: 2 }, () => ({
    position: new Float32Array(count * 3),
    normal: new Float32Array(count * 3),
    uv: new Float32Array(count * 2),
    count: 0,
    capacity: count,
  }));
  const vertices = Array.from({ length: 6 }, () => ({
      position: [0, 0, 0],
      normal: [0, 0, 0],
      uv: [0, 0],
    })),
    distances = new Float64Array(3),
    polygon = new Uint8Array(4);
  const keys = ["position", "normal", "uv"];
  function append(bucket, vertex) {
    if (bucket.count === bucket.capacity) {
      bucket.capacity = Math.max(6, bucket.capacity * 2);
      for (const key of keys) {
        const next = new Float32Array(bucket.capacity * (key === "uv" ? 2 : 3));
        next.set(bucket[key]);
        bucket[key] = next;
      }
    }
    const offset = bucket.count * 3,
      uvOffset = bucket.count * 2;
    bucket.position[offset] = vertex.position[0];
    bucket.position[offset + 1] = vertex.position[1];
    bucket.position[offset + 2] = vertex.position[2];
    bucket.normal[offset] = vertex.normal[0];
    bucket.normal[offset + 1] = vertex.normal[1];
    bucket.normal[offset + 2] = vertex.normal[2];
    bucket.uv[uvOffset] = vertex.uv[0];
    bucket.uv[uvOffset + 1] = vertex.uv[1];
    bucket.count++;
  }
  for (let i = 0; i < count; i += 3) {
    for (let j = 0; j < 3; j++) {
      const source = index ? index.getX(i + j) : i + j;
      const vertex = vertices[j];
      vertex.position[0] = attrs.position.getX(source);
      vertex.position[1] = attrs.position.getY(source);
      vertex.position[2] = attrs.position.getZ(source);
      vertex.normal[0] = attrs.normal.getX(source);
      vertex.normal[1] = attrs.normal.getY(source);
      vertex.normal[2] = attrs.normal.getZ(source);
      vertex.uv[0] = attrs.uv.getX(source);
      vertex.uv[1] = attrs.uv.getY(source);
      distances[j] = signedDistance(vertices[j].position);
    }
    for (let side = 0; side < 2; side++) {
      const sign = side ? 1 : -1;
      let length = 0;
      for (let j = 0; j < 3; j++) {
        const next = (j + 1) % 3,
          da = distances[j] * sign,
          db = distances[next] * sign;
        if (da >= 0) polygon[length++] = j;
        if (da >= 0 !== db >= 0) {
          const t = da / (da - db);
          for (const key of keys) {
            const a = vertices[j][key],
              b = vertices[next][key],
              out = vertices[j + 3][key];
            for (let k = 0; k < out.length; k++)
              out[k] = a[k] + (b[k] - a[k]) * t;
          }
          polygon[length++] = j + 3;
        }
      }
      for (let j = 1; j < length - 1; j++) {
        append(buckets[side], vertices[polygon[0]]);
        append(buckets[side], vertices[polygon[j]]);
        append(buckets[side], vertices[polygon[j + 1]]);
      }
    }
  }
  geometry.dispose();
  return buckets.map((bucket) => {
    const result = new THREE.BufferGeometry();
    for (const key of keys) {
      const size = key === "uv" ? 2 : 3;
      result.setAttribute(
        key,
        new THREE.BufferAttribute(
          bucket[key].subarray(0, bucket.count * size),
          size,
        ),
      );
    }
    return exactIndexGeometry(result);
  });
}
