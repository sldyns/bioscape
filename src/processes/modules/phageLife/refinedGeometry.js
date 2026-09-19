import { THREE, clamp } from "../../kit.js";

// All relief is schematic domain architecture, not fitted atomic coordinates.
export function instances(k, parent, geometry, material, poses, name) {
  const mesh = new THREE.InstancedMesh(geometry, material, poses.length),
    o = new THREE.Object3D();
  mesh.name = name;
  for (let i = 0; i < poses.length; i++) {
    const p = poses[i];
    o.position.set(...p.position);
    o.scale.set(...(p.scale || [1, 1, 1]));
    o.quaternion.identity();
    if (p.quaternion) o.quaternion.copy(p.quaternion);
    if (p.rotation) o.rotation.set(...p.rotation);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  parent.add(mesh);
  return mesh;
}
export function hollowCylinder(
  k,
  parent,
  outer,
  inner,
  height,
  material,
  position = [0, 0, 0],
) {
  const g = new THREE.Group();
  parent.add(g);
  g.position.set(...position);
  const profile = [
    new THREE.Vector2(inner, -height / 2),
    new THREE.Vector2(outer, -height / 2),
    new THREE.Vector2(outer, height / 2),
    new THREE.Vector2(inner, height / 2),
    new THREE.Vector2(inner, -height / 2),
  ];
  k.mesh(new THREE.LatheGeometry(profile, 48), material, [0, 0, 0], g);
  return g;
}
export function duplex(
  k,
  parent,
  centers,
  {
    radius = 0.026,
    rail = 0.012,
    turns = 24,
    samples = 256,
    pairs = 96,
    colors = ["#bc9c65", "#d1b682"],
    name = "double-stranded-DNA",
  } = {},
) {
  const group = new THREE.Group();
  group.name = name;
  parent.add(group);
  const path = new THREE.CatmullRomCurve3(
    centers.map((p) => new THREE.Vector3(...p)),
  );
  const rails = [[], []],
    basePoses = [],
    phosphatePoses = [],
    unitY = new THREE.Vector3(0, 1, 0),
    frames = path.computeFrenetFrames(samples, false);
  const at = (t) => {
    const center = path.getPointAt(t),
      index = Math.min(samples, Math.round(t * samples)),
      a = t * Math.PI * 2 * turns,
      offset = frames.normals[index]
        .clone()
        .multiplyScalar(Math.cos(a) * radius)
        .addScaledVector(frames.binormals[index], Math.sin(a) * radius);
    return [center.clone().add(offset), center.clone().sub(offset)];
  };
  for (let i = 0; i <= samples; i++) {
    const p = at(i / samples);
    rails[0].push(p[0]);
    rails[1].push(p[1]);
  }
  const meshes = rails.map((p, s) =>
    k.mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(p),
        samples,
        rail,
        7,
        false,
      ),
      k.material(colors[s]),
      [0, 0, 0],
      group,
    ),
  );
  for (let i = 0; i < pairs; i++) {
    const [a, b] = at(i / (pairs - 1)),
      d = b.clone().sub(a);
    basePoses.push({
      position: a.clone().add(b).multiplyScalar(0.5).toArray(),
      scale: [rail * 0.64, d.length(), rail * 0.64],
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        unitY,
        d.normalize(),
      ),
    });
    for (const p of [a, b])
      phosphatePoses.push({
        position: p.toArray(),
        scale: [rail * 1.45, rail * 1.45, rail * 1.45],
      });
  }
  const bases = instances(
    k,
    group,
    k.cylinder,
    k.material("#d7c9a9"),
    basePoses,
    "base-pair-rungs",
  );
  const phosphates = instances(
    k,
    group,
    k.sphere,
    k.material(colors[0]),
    phosphatePoses,
    "backbone-phosphates",
  );
  const total = meshes[0].geometry.index.count;
  function fraction(value) {
    const f = clamp(value);
    meshes.forEach((m) =>
      m.geometry.setDrawRange(0, Math.floor((total * f) / 42) * 42),
    );
    bases.count = Math.floor(pairs * f);
    phosphates.count = Math.floor(pairs * f) * 2;
  }
  return { group, fraction, meshes, bases, phosphates };
}
export function capsomerSites(
  k,
  parent,
  vertices,
  material,
  { radius = 0.075 } = {},
) {
  const a = new THREE.Vector3(...vertices[0]),
    b = new THREE.Vector3(...vertices[1]),
    c = new THREE.Vector3(...vertices[2]);
  const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  if (normal.dot(a) < 0) normal.negate();
  const tangent = b.clone().sub(a).normalize(),
    cross = new THREE.Vector3().crossVectors(normal, tangent).normalize(),
    poses = [];
  for (const weights of [
    [1 / 3, 1 / 3, 1 / 3],
    [0.63, 0.185, 0.185],
    [0.185, 0.63, 0.185],
    [0.185, 0.185, 0.63],
  ]) {
    const center = a
      .clone()
      .multiplyScalar(weights[0])
      .addScaledVector(b, weights[1])
      .addScaledVector(c, weights[2])
      .addScaledVector(normal, 0.018);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3,
        point = center
          .clone()
          .addScaledVector(tangent, Math.cos(angle) * radius * 0.54)
          .addScaledVector(cross, Math.sin(angle) * radius * 0.54);
      poses.push({
        position: point.toArray(),
        scale: [radius * 0.37, radius * 0.27, radius * 0.18],
        quaternion: new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          normal,
        ),
      });
    }
  }
  return instances(
    k,
    parent,
    k.sphere,
    material,
    poses,
    "capsomer-domain-lattice",
  );
}
export function pocketDomain(
  k,
  parent,
  position,
  scale,
  colors = ["#8ca59d", "#a8bcb1"],
) {
  const g = new THREE.Group();
  parent.add(g);
  g.position.set(...position);
  g.scale.set(...scale);
  // Two articulated lobes surround an exposed cleft; a back wall preserves depth.
  for (const [p, s, c] of [
    [[-0.35, 0.05, -0.06], [0.42, 0.61, 0.37], 0],
    [[0.35, 0.03, -0.04], [0.4, 0.56, 0.35], 1],
    [[0, 0.43, -0.22], [0.38, 0.25, 0.28], 1],
    [[0, -0.45, -0.2], [0.35, 0.25, 0.24], 0],
  ])
    k.ball(p, s, k.material(colors[c]), g);
  k.tube(
    [
      [-0.42, 0.26, 0.23],
      [-0.3, 0.03, 0.28],
      [-0.36, -0.24, 0.22],
    ],
    0.035,
    k.material(colors[1]),
    g,
    16,
  );
  k.tube(
    [
      [0.34, 0.28, 0.19],
      [0.27, 0.02, 0.25],
      [0.38, -0.22, 0.2],
    ],
    0.03,
    k.material(colors[0]),
    g,
    16,
  );
  return g;
}
export function ribosome(k, parent, position, scale = 0.24) {
  const g = new THREE.Group();
  parent.add(g);
  g.position.set(...position);
  g.scale.setScalar(scale);
  const large = pocketDomain(
    k,
    g,
    [0, 0.38, 0],
    [0.95, 0.75, 0.7],
    ["#a493aa", "#b9aac0"],
  );
  large.rotation.z = 0.15;
  const small = pocketDomain(
    k,
    g,
    [0, -0.4, 0.02],
    [1, 0.35, 0.57],
    ["#aab2a1", "#c4c7b8"],
  );
  small.rotation.z = -0.05;
  for (let strand = 0; strand < 2; strand++)
    k.tube(
      Array.from({ length: 30 }, (_, i) => {
        const a = i * 0.33;
        return [
          0.62 * Math.cos(a),
          strand ? 0.35 + 0.2 * Math.sin(a * 1.7) : -0.39 + 0.11 * Math.sin(a),
          0.42 + 0.06 * Math.cos(a * 0.7),
        ];
      }),
      0.033,
      k.material(strand ? "#86758e" : "#87947f"),
      g,
      40,
    );
  k.tube(
    [
      [-1, -0.1, 0.2],
      [-0.4, -0.06, 0.24],
      [0.3, -0.08, 0.24],
      [0.95, -0.1, 0.2],
    ],
    0.043,
    k.material("#82a99a"),
    g,
    24,
  );
  k.tube(
    [
      [0.15, 0.04, 0.4],
      [0.1, 0.38, 0.55],
      [0.21, 0.6, 0.48],
      [0.38, 0.48, 0.4],
    ],
    0.046,
    k.material("#c5ab75"),
    g,
    20,
  );
  return g;
}
