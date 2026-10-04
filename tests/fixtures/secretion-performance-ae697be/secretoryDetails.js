import * as THREE from "three";
// Illustrative membrane molecular anatomy. Shared geometry and instancing keep
// thousands of explicit lipid components inexpensive; no atomic fit is implied.
export function lipidSurface(parent, sites, color = "#97b5af", size = 0.025) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.58,
    clearcoat: 0.12,
  });
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: "#b9b3a0",
    roughness: 0.7,
  });
  const heads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(size, 10, 8),
    material,
    sites.length * 2,
  );
  const tails = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(size * 0.18, size * 0.18, 1, 5),
    tailMaterial,
    sites.length * 4,
  );
  const dummy = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    axis = new THREE.Vector3(),
    tangent = new THREE.Vector3(),
    p = new THREE.Vector3();
  function update(nextSites = sites) {
    let hi = 0,
      ti = 0;
    for (const site of nextSites) {
      const center = new THREE.Vector3(...site.position),
        normal = new THREE.Vector3(...site.normal).normalize();
      tangent
        .crossVectors(
          normal,
          Math.abs(normal.y) < 0.9 ? up : new THREE.Vector3(1, 0, 0),
        )
        .normalize();
      for (const side of [-1, 1]) {
        dummy.position.copy(center).addScaledVector(normal, side * size * 1.05);
        dummy.scale.set(1, 1, 1);
        dummy.quaternion.identity();
        dummy.updateMatrix();
        heads.setMatrixAt(hi++, dummy.matrix);
        for (const branch of [-1, 1]) {
          p.copy(center)
            .addScaledVector(normal, side * size * 0.45)
            .addScaledVector(tangent, branch * size * 0.32);
          axis.copy(normal);
          dummy.position.copy(p);
          dummy.quaternion.setFromUnitVectors(up, axis);
          dummy.scale.set(1, size * 1.1, 1);
          dummy.updateMatrix();
          tails.setMatrixAt(ti++, dummy.matrix);
        }
      }
    }
    heads.instanceMatrix.needsUpdate = true;
    tails.instanceMatrix.needsUpdate = true;
    heads.computeBoundingBox();
    heads.computeBoundingSphere();
    tails.computeBoundingBox();
    tails.computeBoundingSphere();
  }
  update();
  parent.add(heads, tails);
  return { heads, tails, materials: [material, tailMaterial], update };
}
export function foldedProtein(parent, radius, color, center = [0, 0, 0]) {
  const g = new THREE.Group();
  parent.add(g);
  g.position.set(...center);
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    clearcoat: 0.12,
  });
  const pts = [];
  for (let i = 0; i <= 90; i++) {
    const t = (i / 90) * Math.PI * 7;
    pts.push(
      new THREE.Vector3(
        radius * Math.sin(t) * (0.62 + 0.15 * Math.cos(t * 0.4)),
        radius * 0.7 * Math.cos(t * 0.83),
        radius * 0.62 * Math.sin(t * 0.61),
      ),
    );
  }
  const chain = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts),
      120,
      radius * 0.1,
      6,
      false,
    ),
    mat,
  );
  g.add(chain);
  return g;
}

// A single tube surface whose two boundary rings are copied from the actual
// donor and carrier openings. This replaces overlapping unmatched cylinders.
export function continuousNeck(parent, material, name) {
  // 288 is a common multiple of the donor's 96 and carrier's 36 segments.
  // Interpolate their polygon edges, not an ideal circle between vertices.
  const around = 288,
    rows = 12;
  const positions = new Float32Array((rows + 1) * (around + 1) * 3),
    indices = [];
  for (let row = 0; row < rows; row++)
    for (let j = 0; j < around; j++) {
      const a = row * (around + 1) + j,
        b = a + around + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  parent.add(mesh);
  const first = new THREE.Vector3(),
    last = new THREE.Vector3();
  const a = new THREE.Vector3(),
    b = new THREE.Vector3();
  function polygonPoint(callback, segments, phi, out) {
    const u = (phi / (Math.PI * 2)) * segments,
      lo = Math.floor(u);
    callback((lo / segments) * Math.PI * 2, a);
    callback(((lo + 1) / segments) * Math.PI * 2, b);
    out.copy(a).lerp(b, u - lo);
  }
  function set(donor, carrier) {
    for (let row = 0; row <= rows; row++) {
      const t = row / rows;
      for (let j = 0; j <= around; j++) {
        const phi = (j / around) * Math.PI * 2;
        polygonPoint(donor, 96, phi, first);
        polygonPoint(carrier, 36, phi, last);
        const i = (row * (around + 1) + j) * 3;
        positions[i] = first.x * (1 - t) + last.x * t;
        positions[i + 1] = first.y * (1 - t) + last.y * t;
        positions[i + 2] = first.z * (1 - t) + last.z * t;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  return { mesh, set, around, rows };
}
