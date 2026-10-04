import { THREE } from "../../kit.js";

// One continuous female-gamete membrane, with a removable polar cap joined to
// the near cap of a sperm membrane. The annular neck is actual surface topology.
// Coordinates are schematic; all buffers and nodes are allocated only here.
export function gameteFusionSurface(k, materials, center, radii, pole, name) {
  const c = new THREE.Vector3(...center);
  const axes = new THREE.Vector3(...radii);
  const q = new THREE.Vector3(...pole).normalize();
  const u = new THREE.Vector3(0, 0, 1).cross(q).normalize();
  const v = new THREE.Vector3().crossVectors(q, u).normalize();
  const contact = q.clone().multiply(axes).add(c);
  const normal = q.clone().divide(axes).normalize();
  const tangent = u.clone().multiply(axes).normalize();
  const bitangent = new THREE.Vector3()
    .crossVectors(normal, tangent)
    .normalize();
  const radial = 48,
    hostRings = 32,
    neckRings = 6,
    spermRings = 20;
  const rings = hostRings + neckRings + spermRings + 1;
  const positions = new Float32Array(rings * (radial + 1) * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(positions.length), 3),
  );
  const indices = [];
  for (let j = 0; j < rings - 1; j++)
    for (let i = 0; i < radial; i++) {
      const a = j * (radial + 1) + i,
        b = a + radial + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  geometry.setIndex(indices);
  const hostCount = hostRings * radial * 6;
  geometry.addGroup(0, hostCount, 0);
  geometry.addGroup(hostCount, indices.length - hostCount, 1);
  const mesh = k.mesh(geometry, materials);
  mesh.name = name;
  mesh.userData.femaleCenter = center;
  mesh.userData.femaleRadii = radii;
  mesh.userData.fusionContact = contact.toArray();
  mesh.userData.fusionNormal = normal.toArray();
  const h = new THREE.Vector3(),
    s = new THREE.Vector3(),
    point = new THREE.Vector3();
  function host(theta, phi, result) {
    return result
      .copy(q)
      .multiplyScalar(Math.cos(theta))
      .addScaledVector(u, Math.sin(theta) * Math.cos(phi))
      .addScaledVector(v, Math.sin(theta) * Math.sin(phi))
      .multiply(axes)
      .add(c);
  }
  function sperm(theta, phi, radius, result) {
    return result
      .copy(contact)
      .addScaledVector(normal, radius * (1 + Math.cos(theta)))
      .addScaledVector(tangent, radius * Math.sin(theta) * Math.cos(phi))
      .addScaledVector(bitangent, radius * Math.sin(theta) * Math.sin(phi));
  }
  function update(opening, absorption, present) {
    const size = present ? 0.12 * (1 - absorption) : 0;
    const hole = present ? 0.34 * opening * (1 - absorption) : 0;
    const spermEnd = Math.PI - 1.35 * opening;
    let cursor = 0;
    for (let j = 0; j < rings; j++)
      for (let i = 0; i <= radial; i++) {
        const phi = (i / radial) * Math.PI * 2;
        if (j <= hostRings)
          host(Math.PI - ((Math.PI - hole) * j) / hostRings, phi, point);
        else if (j <= hostRings + neckRings) {
          host(hole, phi, h);
          sperm(spermEnd, phi, size, s);
          point.lerpVectors(h, s, (j - hostRings) / neckRings);
        } else
          sperm(
            spermEnd * (1 - (j - hostRings - neckRings) / spermRings),
            phi,
            size,
            point,
          );
        positions[cursor++] = point.x;
        positions[cursor++] = point.y;
        positions[cursor++] = point.z;
      }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  update(0, 1, false);
  return { mesh, update, contact, normal };
}
