import { THREE } from "../../kit.js";
export function segmentWriter() {
  const a = new THREE.Vector3(),
    z = new THREE.Vector3(),
    d = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  return (mesh, p0, p1, r = 0.04) => {
    a.set(...p0);
    z.set(...p1);
    d.subVectors(z, a);
    mesh.position.copy(a).add(z).multiplyScalar(0.5);
    mesh.scale.set(r, Math.max(0.00001, d.length()), r);
    mesh.quaternion.setFromUnitVectors(up, d.normalize());
  };
}
export function rod(
  k,
  parent,
  {
    radius = 0.82,
    length = 1.9,
    color = "#87a99b",
    horizontal = false,
    wall = false,
  } = {},
) {
  const g = new THREE.Group();
  parent.add(g);
  if (horizontal) g.rotation.z = Math.PI / 2;
  const membranes = wall ? [radius] : [radius * 0.89, radius];
  const shellMat = k.material(color, { side: THREE.DoubleSide });
  const wallMat = k.material("#c3b58b", { side: THREE.DoubleSide });
  const profile = (v, r) => {
    const y = -length / 2 - radius + v * (length + radius * 2),
      q = Math.max(0, Math.abs(y) - length / 2);
    return [y, r * Math.sqrt(Math.max(0, 1 - (q / radius) ** 2))];
  };
  function shell(r, mat, cut = 0.84) {
    const pos = [],
      indices = [],
      nu = 64,
      nv = 44;
    for (let j = 0; j <= nv; j++) {
      const [y, rr] = profile(j / nv, r);
      for (let i = 0; i <= nu; i++) {
        const t = Math.PI * cut + (i / nu) * Math.PI * (3 - 2 * cut);
        pos.push(rr * Math.cos(t), y, rr * Math.sin(t));
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const n = j * (nu + 1) + i;
        indices.push(n, n + 1, n + nu + 1, n + 1, n + nu + 2, n + nu + 1);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    k.mesh(geo, mat, [0, 0, 0], g);
  }
  membranes.forEach((r) => {
    const cut = !wall && r === radius ? 0.99 : 0.84;
    shell(r - 0.026, shellMat, cut);
    shell(r + 0.026, shellMat, cut);
  });
  const lipidCount = membranes.length * 2 * 2 * 44;
  const heads = instances(
    k,
    g,
    k.sphere,
    k.material("#a7bbae"),
    lipidCount,
    "membrane-paired-leaflet-heads",
  );
  const tails = instances(
    k,
    g,
    k.cylinder,
    k.material("#c6be98"),
    lipidCount,
    "membrane-cut-edge-acyl-tails",
  );
  let n = 0;
  for (const r of membranes)
    for (const edge of !wall && r === radius ? [0.99, 2.01] : [0.84, 2.16])
      for (const leaflet of [-1, 1])
        for (let j = 0; j < 44; j++) {
          const v = (j + 0.5) / 44,
            [y, rr] = profile(v, r),
            t = edge * Math.PI,
            rrHead = rr + leaflet * 0.027;
          heads.point(
            n,
            [rrHead * Math.cos(t), y, rrHead * Math.sin(t)],
            0.035,
          );
          tails.line(
            n,
            [rrHead * Math.cos(t), y, rrHead * Math.sin(t)],
            [rr * Math.cos(t), y, rr * Math.sin(t)],
            0.012,
          );
          n++;
        }
  heads.flush();
  tails.flush();
  const wallRadius = wall ? radius * 1.1 : radius * 0.945;
  if (wall) shell(wallRadius, wallMat, 0.94);
  const glycans = instances(
    k,
    g,
    k.cylinder,
    k.material("#b9a477"),
    21 * 28,
    "peptidoglycan-glycan-strands",
  );
  const links = instances(
    k,
    g,
    k.cylinder,
    k.material("#cdbf98"),
    20 * 14,
    "peptidoglycan-peptide-crosslinks",
  );
  for (let j = 0; j < 21; j++)
    for (let i = 0; i < 28; i++) {
      const [y, r] = profile(0.12 + j * 0.038, wallRadius + 0.006),
        t0 = Math.PI * 0.88 + (i / 28) * Math.PI * 1.24,
        t1 = t0 + (Math.PI * 1.24) / 28;
      glycans.line(
        j * 28 + i,
        [r * Math.cos(t0), y, r * Math.sin(t0)],
        [r * Math.cos(t1), y, r * Math.sin(t1)],
        wall ? 0.02 : 0.014,
      );
    }
  for (let j = 0; j < 20; j++)
    for (let i = 0; i < 14; i++) {
      const [y0, r0] = profile(0.12 + j * 0.038, wallRadius + 0.01),
        [y1, r1] = profile(0.12 + (j + 1) * 0.038, wallRadius + 0.01),
        t = Math.PI * 0.88 + ((i + 0.5) / 14) * Math.PI * 1.24;
      links.line(
        j * 14 + i,
        [r0 * Math.cos(t), y0, r0 * Math.sin(t)],
        [r1 * Math.cos(t), y1, r1 * Math.sin(t)],
        0.009,
      );
    }
  glycans.flush();
  links.flush();
  g.userData = {
    structuralSchematic: true,
    cutaway: true,
    membranes: wall ? 1 : 2,
    peptidoglycan: true,
  };
  return g;
}
export function chain(k, n, material, parent) {
  return Array.from({ length: n }, () =>
    k.segment([0, 0, 0], [0.1, 0, 0], 0.035, material, parent),
  );
}

// Schematic repeating substructures, not atomic-coordinate reconstructions.
export function instances(k, parent, geometry, material, count, name) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  parent.add(mesh);
  const dummy = new THREE.Object3D(),
    a = new THREE.Vector3(),
    z = new THREE.Vector3(),
    d = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  return {
    mesh,
    point(i, p, size) {
      dummy.position.set(...p);
      dummy.quaternion.identity();
      if (Array.isArray(size)) dummy.scale.set(...size);
      else dummy.scale.setScalar(size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    },
    line(i, p0, p1, r) {
      a.set(...p0);
      z.set(...p1);
      d.subVectors(z, a);
      dummy.position.copy(a).add(z).multiplyScalar(0.5);
      dummy.scale.set(r, Math.max(0.00001, d.length()), r);
      dummy.quaternion.setFromUnitVectors(up, d.normalize());
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    },
    flush() {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    },
  };
}
