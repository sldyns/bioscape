import { THREE } from "../../kit.js";

// Fixed-topology tube. All buffers and scratch vectors are allocated at creation.
export function dynamicTube(parent, material, count = 240, radius = 0.05) {
  const sides = 8;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array((count + 1) * sides * 3);
  const indices = [];
  for (let i = 0; i < count; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j,
        b = i * sides + ((j + 1) % sides);
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry, material);
  parent.add(mesh);
  const p = new THREE.Vector3(),
    before = new THREE.Vector3(),
    after = new THREE.Vector3();
  const tangent = new THREE.Vector3(),
    n = new THREE.Vector3(),
    b = new THREE.Vector3();
  const axis = new THREE.Vector3();
  function update(sample) {
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      sample(t, p);
      sample(Math.max(0, t - 0.0001), before);
      sample(Math.min(1, t + 0.0001), after);
      tangent.subVectors(after, before).normalize();
      axis.set(0, 0, 1);
      if (Math.abs(tangent.z) > 0.9) axis.set(0, 1, 0);
      n.crossVectors(tangent, axis).normalize();
      b.crossVectors(tangent, n).normalize();
      for (let j = 0; j < sides; j++) {
        const a = (j * Math.PI * 2) / sides,
          c = radius * Math.cos(a),
          s = radius * Math.sin(a);
        const k = (i * sides + j) * 3;
        positions[k] = p.x + n.x * c + b.x * s;
        positions[k + 1] = p.y + n.y * c + b.y * s;
        positions[k + 2] = p.z + n.z * c + b.z * s;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  return { mesh, update };
}

export function moveSegment(mesh, a, b, radius, scratch) {
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  scratch.subVectors(b, a);
  mesh.scale.set(radius, Math.max(scratch.length(), 0.00001), radius);
  scratch.normalize();
  mesh.quaternion.setFromUnitVectors(UP, scratch);
}
const UP = new THREE.Vector3(0, 1, 0);

// A rotation-minimizing frame is rebuilt deterministically from the same first
// normal on each seek. With binormal = tangent × normal, cos(theta)*normal +
// sin(theta)*binormal gives positive (right-handed) twist along the centerline.
// All arrays and scratch objects are owned by this construction, never a frame.
export function rightHandedDuplex(centerline, radius, twist, count = 1600) {
  const points = Array.from({ length: count + 1 }, () => new THREE.Vector3());
  const tangents = points.map(() => new THREE.Vector3());
  const normals = points.map(() => new THREE.Vector3());
  const before = new THREE.Vector3(),
    after = new THREE.Vector3();
  const tangent = new THREE.Vector3(),
    normal = new THREE.Vector3();
  const binormal = new THREE.Vector3(),
    q = new THREE.Quaternion();
  const reference = new THREE.Vector3(0, 0, 1);
  function update() {
    for (let i = 0; i <= count; i++) {
      const s = i / count;
      centerline(s, points[i]);
      centerline(Math.max(0, s - 0.00001), before);
      centerline(Math.min(1, s + 0.00001), after);
      tangents[i].subVectors(after, before).normalize();
      if (i === 0) {
        reference.set(0, 0, Math.abs(tangents[i].z) < 0.9 ? 1 : 0);
        if (!reference.z) reference.y = 1;
        normals[i].crossVectors(tangents[i], reference).normalize();
      } else {
        q.setFromUnitVectors(tangents[i - 1], tangents[i]);
        normals[i].copy(normals[i - 1]).applyQuaternion(q);
        normals[i]
          .addScaledVector(tangents[i], -normals[i].dot(tangents[i]))
          .normalize();
      }
    }
  }
  function strand(s, out, side) {
    const coordinate = Math.max(0, Math.min(1, s)) * count;
    const i = Math.min(count - 1, Math.floor(coordinate)),
      t = coordinate - i;
    tangent
      .copy(tangents[i])
      .lerp(tangents[i + 1], t)
      .normalize();
    normal.copy(normals[i]).lerp(normals[i + 1], t);
    normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
    binormal.crossVectors(tangent, normal).normalize();
    centerline(s, out);
    return out
      .addScaledVector(normal, side * radius * Math.cos(s * twist))
      .addScaledVector(binormal, side * radius * Math.sin(s * twist));
  }
  update();
  return {
    update,
    sampleA: (s, out) => strand(s, out, 1),
    sampleB: (s, out) => strand(s, out, -1),
  };
}
