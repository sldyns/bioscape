import { THREE } from "../../kit.js";

// Interpolate the actual axial rings, including their polygonal cross sections.
// Callers leave a margin inside the innermost membrane layer.
export function axialRadius(mesh, x, columns = 48) {
  const a = mesh.geometry.attributes.position;
  let radius = 0;
  for (let row = 0; row < a.count - columns - 1; row += columns + 1) {
    const next = row + columns + 1,
      x0 = a.getX(row),
      x1 = a.getX(next);
    if (x < Math.min(x0, x1) || x > Math.max(x0, x1)) continue;
    if (Math.abs(x1 - x0) < 1e-9) continue;
    const u = (x - x0) / (x1 - x0);
    radius = Math.max(
      radius,
      Math.hypot(a.getY(row), a.getZ(row)) * (1 - u) +
        Math.hypot(a.getY(next), a.getZ(next)) * u,
    );
  }
  return radius * Math.cos(Math.PI / columns);
}

// A preallocated tube whose axial rings follow a changing intracellular route.
export function axialTube(k, material, name, segments = 64, sides = 8) {
  const geometry = new THREE.BufferGeometry(),
    positions = new Float32Array((segments + 1) * (sides + 1) * 3),
    indices = [],
    center = new THREE.Vector3();
  for (let i = 0; i < segments; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j,
        b = a + sides + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const mesh = k.mesh(geometry, material);
  mesh.name = name;
  return {
    mesh,
    shape(route, thickness) {
      for (let i = 0; i <= segments; i++) {
        route(i / segments, center);
        for (let j = 0; j <= sides; j++) {
          const a = (j / sides) * Math.PI * 2,
            index = (i * (sides + 1) + j) * 3;
          positions[index] = center.x;
          positions[index + 1] = center.y + thickness * Math.cos(a);
          positions[index + 2] = center.z + thickness * Math.sin(a);
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    },
  };
}

// Exact barycentric intersection with the back of a triangulated envelope.
// This also returns the actual triangle normal for an embedded SPB anchor.
export function backSurfaceAt(mesh, x, y, point, normal) {
  const a = mesh.geometry.attributes.position,
    indices = mesh.geometry.index;
  let best = Infinity;
  point.set(x, y, 0);
  normal.set(0, 0, -1);
  for (let i = 0; i < indices.count; i += 3) {
    const ia = indices.getX(i),
      ib = indices.getX(i + 1),
      ic = indices.getX(i + 2),
      ax = a.getX(ia),
      ay = a.getY(ia),
      az = a.getZ(ia),
      bx = a.getX(ib) - ax,
      by = a.getY(ib) - ay,
      bz = a.getZ(ib) - az,
      cx = a.getX(ic) - ax,
      cy = a.getY(ic) - ay,
      cz = a.getZ(ic) - az,
      determinant = bx * cy - by * cx;
    if (Math.abs(determinant) < 1e-12) continue;
    const u = ((x - ax) * cy - (y - ay) * cx) / determinant,
      v = (bx * (y - ay) - by * (x - ax)) / determinant;
    if (u < -1e-7 || v < -1e-7 || u + v > 1 + 1e-7) continue;
    const z = az + u * bz + v * cz;
    if (z >= best) continue;
    best = z;
    point.set(x, y, z);
    normal.set(by * cz - bz * cy, bz * cx - bx * cz, determinant);
    if (normal.z > 0) normal.negate();
    normal.normalize();
  }
  return Number.isFinite(best);
}

// Stable vertex inventory for a closed, longitudinal envelope. A zero endpoint
// radius closes the poles; a positive interior radius maintains one lumen.
export function longitudinalEnvelope(
  k,
  material,
  name,
  rows = 40,
  columns = 48,
) {
  const positions = new Float32Array((rows + 1) * (columns + 1) * 3);
  const indices = [];
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < columns; j++) {
      const a = i * (columns + 1) + j,
        b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const mesh = k.mesh(geometry, material);
  mesh.name = name;
  return {
    mesh,
    shape(profile) {
      for (let i = 0; i <= rows; i++) {
        const [x, r] = profile(i / rows);
        for (let j = 0; j <= columns; j++) {
          const a = (2 * Math.PI * j) / columns,
            n = (i * (columns + 1) + j) * 3;
          positions[n] = x;
          positions[n + 1] = r * Math.cos(a);
          positions[n + 2] = r * Math.sin(a);
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    },
  };
}

export function placeSegment(mesh, a, b, radius = 0.025) {
  const d = b.clone().sub(a),
    length = d.length();
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(radius, Math.max(0.00001, length), radius);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
}
