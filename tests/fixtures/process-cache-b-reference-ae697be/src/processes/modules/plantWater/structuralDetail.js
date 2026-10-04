import * as THREE from "three";
// Repeated educational surface structures share buffers within a scene.
export function bilayerOutline(
  k,
  parent,
  points,
  { gap = 0.07, head = 0.022, color = "#b28d73", tailColor = "#c6b79a" } = {},
) {
  const count = points.length - 1,
    heads = new THREE.InstancedMesh(k.sphere, k.material(color), count * 2),
    tails = new THREE.InstancedMesh(
      k.cylinder,
      k.material(tailColor),
      count * 2,
    ),
    temp = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    direction = new THREE.Vector3();
  parent.add(heads, tails);
  heads.name = "paired phospholipid headgroups";
  tails.name = "bilayer hydrophobic interior";
  const rails = [[], []];
  for (let i = 0; i < count; i++) {
    const p = points[i],
      before = points[(i + count - 1) % count],
      after = points[(i + 1) % count],
      dx = after[0] - before[0],
      dy = after[1] - before[1],
      norm = Math.hypot(dx, dy) || 1,
      nx = dy / norm,
      ny = -dx / norm;
    for (let side = 0; side < 2; side++) {
      const sign = side ? 1 : -1,
        x = p[0] + nx * gap * 0.5 * sign,
        y = p[1] + ny * gap * 0.5 * sign;
      temp.position.set(x, y, p[2]);
      temp.quaternion.identity();
      temp.scale.setScalar(head);
      temp.updateMatrix();
      heads.setMatrixAt(i * 2 + side, temp.matrix);
      rails[side].push([x, y, p[2]]);
      temp.position.set(
        p[0] + nx * gap * 0.25 * sign,
        p[1] + ny * gap * 0.25 * sign,
        p[2] - 0.004,
      );
      direction.set(nx, ny, 0);
      temp.quaternion.setFromUnitVectors(up, direction);
      temp.scale.set(0.008, gap * 0.46, 0.008);
      temp.updateMatrix();
      tails.setMatrixAt(i * 2 + side, temp.matrix);
    }
  }
  for (const rail of rails) {
    rail.push(rail[0]);
    k.tube(rail, 0.012, k.material(color), parent);
  }
  heads.instanceMatrix.needsUpdate = true;
  tails.instanceMatrix.needsUpdate = true;
  heads.computeBoundingSphere();
  tails.computeBoundingSphere();
  return { heads, tails };
}
export function chloroplastFactory(k) {
  const bowl = new THREE.SphereGeometry(
      1,
      32,
      16,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    ),
    disk = new THREE.CylinderGeometry(1, 1, 1, 24),
    outer = k.material("#76905d", { side: THREE.DoubleSide }),
    inner = k.material("#adbe8c", { side: THREE.DoubleSide }),
    thylakoid = k.material("#607d4b"),
    rimPoints = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i * Math.PI) / 32;
    rimPoints.push(
      new THREE.Vector3(0.41 * Math.cos(a), 0, 0.28 * Math.sin(a)),
    );
  }
  const rimGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(rimPoints),
      64,
      0.009,
      6,
      false,
    ),
    temp = new THREE.Object3D();
  return function (parent, scale = 1) {
    const g = new THREE.Group();
    g.name = "chloroplast cutaway: double envelope and connected grana";
    g.scale.setScalar(scale);
    parent.add(g);
    const a = k.mesh(bowl, outer, [0, 0, 0], g);
    a.scale.set(0.41, 0.15, 0.28);
    const b = k.mesh(bowl, inner, [0, 0.006, 0], g);
    b.scale.set(0.38, 0.127, 0.253);
    k.mesh(rimGeometry, outer, [0, 0, 0], g);
    const rim = k.mesh(rimGeometry, inner, [0, 0.006, 0], g);
    rim.scale.set(0.925, 1, 0.904);
    const grana = new THREE.InstancedMesh(disk, thylakoid, 15);
    grana.name = "three grana, five flattened thylakoids each";
    g.add(grana);
    for (let n = 0; n < 3; n++)
      for (let j = 0; j < 5; j++) {
        temp.position.set(-0.2 + n * 0.2, -0.078 + j * 0.025, 0);
        temp.rotation.set(0, 0, 0);
        temp.scale.set(0.076, 0.014, 0.088);
        temp.updateMatrix();
        grana.setMatrixAt(n * 5 + j, temp.matrix);
      }
    grana.instanceMatrix.needsUpdate = true;
    grana.computeBoundingSphere();
    for (let j = 0; j < 2; j++)
      k.segment(
        [-0.2 + j * 0.2, -0.04, 0],
        [j * 0.2, -0.04, 0],
        0.012,
        k.material("#96aa72"),
        g,
      );
    g.userData.structuralDetail =
      "schematic cutaway, not atomic reconstruction";
    return g;
  };
}
export function dynamicSegments(k, count, color, parent = k.group) {
  const mesh = new THREE.InstancedMesh(k.cylinder, k.material(color), count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  parent.add(mesh);
  const temp = new THREE.Object3D(),
    a = new THREE.Vector3(),
    z = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  return {
    mesh,
    put(i, x1, y1, z1, x2, y2, z2, r = 0.012) {
      a.set(x1, y1, z1);
      z.set(x2 - x1, y2 - y1, z2 - z1);
      const length = z.length();
      temp.position.copy(a).addScaledVector(z, 0.5);
      temp.quaternion.setFromUnitVectors(up, z.divideScalar(length || 1));
      temp.scale.set(r, length, r);
      temp.updateMatrix();
      mesh.setMatrixAt(i, temp.matrix);
    },
    finish() {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    },
  };
}
// Two-sided vessel wall with real side-wall pit apertures, not painted dots.
export function pittedVesselWall() {
  const positions = [],
    indices = [],
    nu = 88,
    nv = 54,
    start = 0.35,
    span = Math.PI * 1.7,
    minY = -0.91;
  const filled = [];
  for (let j = 0; j < nv; j++) {
    filled[j] = [];
    for (let i = 0; i < nu; i++) {
      const u = (i + 0.5) / nu,
        y = minY + ((j + 0.5) * 1.82) / nv;
      let hole = false;
      for (let row = 0; row < 5; row++)
        for (let col = 0; col < 6; col++) {
          const cu = 0.085 + col * 0.165 + (row % 2) * 0.023,
            cy = -0.7 + row * 0.35;
          if (((u - cu) / 0.025) ** 2 + ((y - cy) / 0.092) ** 2 < 1)
            hole = true;
        }
      filled[j][i] = !hole;
    }
  }
  function vertex(u, v, r) {
    const a = start + span * u;
    return [Math.sin(a) * r, minY + v * 1.82, Math.cos(a) * r];
  }
  function quad(a, b, c, d) {
    const n = positions.length / 3;
    positions.push(...a, ...b, ...c, ...d);
    indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      if (!filled[j][i]) continue;
      const u = i / nu,
        v = j / nv,
        U = (i + 1) / nu,
        V = (j + 1) / nv;
      quad(
        vertex(u, v, 0.49),
        vertex(u, V, 0.49),
        vertex(U, V, 0.49),
        vertex(U, v, 0.49),
      );
      quad(
        vertex(u, v, 0.445),
        vertex(U, v, 0.445),
        vertex(U, V, 0.445),
        vertex(u, V, 0.445),
      );
      if (i === 0 || !filled[j][i - 1])
        quad(
          vertex(u, v, 0.445),
          vertex(u, V, 0.445),
          vertex(u, V, 0.49),
          vertex(u, v, 0.49),
        );
      if (i === nu - 1 || !filled[j][i + 1])
        quad(
          vertex(U, v, 0.49),
          vertex(U, V, 0.49),
          vertex(U, V, 0.445),
          vertex(U, v, 0.445),
        );
      if (j === 0 || !filled[j - 1][i])
        quad(
          vertex(u, v, 0.49),
          vertex(U, v, 0.49),
          vertex(U, v, 0.445),
          vertex(u, v, 0.445),
        );
      if (j === nv - 1 || !filled[j + 1][i])
        quad(
          vertex(u, V, 0.445),
          vertex(U, V, 0.445),
          vertex(U, V, 0.49),
          vertex(u, V, 0.49),
        );
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
