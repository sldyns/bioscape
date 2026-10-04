import * as THREE from "three";

// Independent ae697be reference functions, copied before the optimization.
// Keep original arithmetic, sampling, normal and bounds behavior unchanged.

export function originalRegulationTube(
  kit,
  count,
  radius,
  material,
  parent = kit.group,
) {
  const sides = 8,
    positions = new Float32Array((count + 1) * sides * 3);
  const indices = [];
  for (let i = 0; i < count; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j,
        b = i * sides + ((j + 1) % sides);
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setIndex(indices);
  const mesh = kit.mesh(geometry, material, [0, 0, 0], parent);
  const samples = Array.from({ length: count + 1 }, () => new THREE.Vector3());
  const tangent = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    binormal = new THREE.Vector3();
  const axis = new THREE.Vector3(0, 0, 1);
  return {
    mesh,
    update(point) {
      for (let i = 0; i <= count; i++) point(i / count, samples[i]);
      for (let i = 0; i <= count; i++) {
        tangent
          .subVectors(
            samples[Math.min(count, i + 1)],
            samples[Math.max(0, i - 1)],
          )
          .normalize();
        axis.set(
          0,
          Math.abs(tangent.z) > 0.9 ? 1 : 0,
          Math.abs(tangent.z) > 0.9 ? 0 : 1,
        );
        normal.crossVectors(tangent, axis).normalize();
        binormal.crossVectors(tangent, normal).normalize();
        for (let j = 0; j < sides; j++) {
          const c = radius * Math.cos((j / sides) * Math.PI * 2),
            s = radius * Math.sin((j / sides) * Math.PI * 2);
          const index = (i * sides + j) * 3;
          positions[index] = samples[i].x + c * normal.x + s * binormal.x;
          positions[index + 1] = samples[i].y + c * normal.y + s * binormal.y;
          positions[index + 2] = samples[i].z + c * normal.z + s * binormal.z;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    },
  };
}

export function originalChromatinTube(
  parent,
  material,
  count = 240,
  radius = 0.05,
) {
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
