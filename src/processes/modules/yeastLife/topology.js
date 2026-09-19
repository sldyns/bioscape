import { THREE } from "../../kit.js";

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
