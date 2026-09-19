import { THREE } from "../../kit.js";

export function clathrinLattice(k, material) {
  // Truncating an icosahedron gives 60 three-valent vertices, 12 pentagons
  // and 20 hexagons. This is a schematic cage topology, not an atomic fit.
  const seed = new THREE.IcosahedronGeometry(1, 0),
    a = seed.attributes.position.array,
    vertices = [];
  for (let i = 0; i < a.length; i += 3) {
    const p = new THREE.Vector3(a[i], a[i + 1], a[i + 2]);
    if (!vertices.some((q) => q.distanceTo(p) < 1e-5)) vertices.push(p);
  }
  seed.dispose();
  let shortest = Infinity;
  for (let i = 0; i < vertices.length; i++)
    for (let j = i + 1; j < vertices.length; j++)
      shortest = Math.min(shortest, vertices[i].distanceTo(vertices[j]));
  const points = [];
  for (let i = 0; i < vertices.length; i++)
    for (let j = 0; j < vertices.length; j++)
      if (
        i !== j &&
        Math.abs(vertices[i].distanceTo(vertices[j]) - shortest) < 1e-4
      )
        points.push(
          vertices[i]
            .clone()
            .multiplyScalar(2)
            .add(vertices[j])
            .divideScalar(3)
            .normalize(),
        );
  let edgeLength = Infinity;
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      edgeLength = Math.min(edgeLength, points[i].distanceTo(points[j]));
  const edges = [];
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      if (Math.abs(points[i].distanceTo(points[j]) - edgeLength) < 1e-4)
        edges.push([i, j]);
  const rods = new THREE.InstancedMesh(k.cylinder, material, edges.length),
    hubs = new THREE.InstancedMesh(k.sphere, material, points.length);
  k.group.add(rods, hubs);
  rods.name = "clathrin pentagon–hexagon struts";
  hubs.name = "three-legged clathrin hubs";
  const mapped = points.map(() => new THREE.Vector3()),
    dummy = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    delta = new THREE.Vector3(),
    mid = new THREE.Vector3();
  return {
    edges: edges.length,
    vertices: points.length,
    update({ bend, detached, cx, cy, uncoat, visible }) {
      rods.visible = visible;
      hubs.visible = visible;
      for (let i = 0; i < points.length; i++) {
        const n = points[i],
          theta = Math.acos(-n.y),
          az = Math.atan2(n.x, -n.z),
          r =
            ((1 - bend) * 1.28 * theta) / Math.PI +
            bend * (1.12 + uncoat * 0.42) * Math.sin(theta),
          y = detached ? cy : 1.4 - bend * 1.7;
        mapped[i].set(
          (detached ? cx : -1.5) + r * Math.sin(az),
          y + bend * (1.12 + uncoat * 0.42) * n.y - (1 - bend) * 0.12,
          -r * Math.cos(az),
        );
        const show = n.z < 0.38 && (detached || theta < Math.PI * 0.91);
        dummy.position.copy(mapped[i]);
        dummy.quaternion.identity();
        dummy.scale.setScalar(show ? 0.039 : 0.00001);
        dummy.updateMatrix();
        hubs.setMatrixAt(i, dummy.matrix);
      }
      for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i],
          show =
            points[a].z < 0.38 &&
            points[b].z < 0.38 &&
            (detached || (points[a].y < 0.96 && points[b].y < 0.96));
        mid.copy(mapped[a]).add(mapped[b]).multiplyScalar(0.5);
        delta.subVectors(mapped[b], mapped[a]);
        const len = delta.length();
        dummy.position.copy(mid);
        dummy.quaternion.setFromUnitVectors(up, delta.normalize());
        dummy.scale.set(
          show ? 0.022 : 0.00001,
          Math.max(0.00001, len * (1 - uncoat * 0.75)),
          show ? 0.022 : 0.00001,
        );
        dummy.updateMatrix();
        rods.setMatrixAt(i, dummy.matrix);
      }
      for (const m of [rods, hubs]) {
        m.instanceMatrix.needsUpdate = true;
        m.computeBoundingBox();
        m.computeBoundingSphere();
      }
    },
  };
}

export function ldlReceptor(k, mat) {
  const group = new THREE.Group();
  group.name = "LDLR — transmembrane helix, EGF/propeller, seven LA repeats";
  k.group.add(group);
  const linker = k.material("#c79c80"),
    propeller = k.material("#9e765e"),
    ca = k.material("#d6bb80"),
    adaptorMat = k.material("#95a3b6");
  k.segment([0, -0.12, 0], [0, 0.1, 0], 0.022, mat, group);
  k.tube(
    [
      [0, -0.11, 0],
      [0.04, -0.17, 0],
      [-0.035, -0.2, 0.015],
    ],
    0.014,
    mat,
    group,
    16,
  );
  k.segment([0, 0.1, 0], [0, 0.18, 0], 0.018, linker, group);
  // Six blades form the receptor's compact beta-propeller; the LA chain bends
  // toward it during acid-dependent ligand release without crossing the membrane.
  const fold = new THREE.Group();
  group.add(fold);
  fold.position.y = 0.17;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const blade = k.ball(
      [0.065 * Math.cos(a), 0.01, 0.065 * Math.sin(a)],
      [0.026, 0.042, 0.042],
      propeller,
      fold,
    );
    blade.rotation.y = -a;
  }
  const repeats = new THREE.Group();
  group.add(repeats);
  repeats.position.set(0, 0.22, 0);
  for (let i = 0; i < 7; i++) {
    const a = -0.65 + i * 0.23,
      x = 0.055 * Math.sin(a),
      y = i * 0.036;
    k.ball([x, y, 0], [0.031, 0.025, 0.025], mat, repeats);
    k.ball([x + 0.007, y, 0.023], 0.006, ca, repeats);
    if (i)
      k.segment(
        [0.055 * Math.sin(a - 0.23), (i - 1) * 0.036, 0],
        [x, y, 0],
        0.009,
        linker,
        repeats,
      );
  }
  for (const [x, y] of [
    [-0.04, 0.12],
    [0.04, 0.14],
  ])
    k.tube(
      [
        [0, y, 0],
        [x, y + 0.025, 0.012],
        [x * 1.4, y + 0.06, 0.018],
      ],
      0.007,
      linker,
      group,
      12,
    );
  const adaptor = new THREE.Group();
  group.add(adaptor);
  adaptor.position.y = -0.18;
  k.ball([-0.034, 0, 0], [0.042, 0.03, 0.036], adaptorMat, adaptor);
  k.ball([0.034, -0.008, 0], [0.038, 0.026, 0.027], adaptorMat, adaptor);
  k.segment([0, -0.025, 0], [0.035, -0.12, 0], 0.012, adaptorMat, adaptor);
  return { group, repeats, adaptor };
}

export function ldlParticle(k, mat) {
  const group = new THREE.Group();
  group.name =
    "LDL — neutral lipid core, phospholipid monolayer and one ApoB chain";
  k.group.add(group);
  k.ball([0, 0, 0], 0.137, mat, group);
  const heads = new THREE.InstancedMesh(k.sphere, k.material("#dcc38e"), 72),
    dummy = new THREE.Object3D();
  group.add(heads);
  for (let i = 0; i < 72; i++) {
    const y = 1 - (2 * (i + 0.5)) / 72,
      r = Math.sqrt(1 - y * y),
      a = i * 2.39996;
    dummy.position.set(
      0.144 * r * Math.cos(a),
      0.144 * y,
      0.144 * r * Math.sin(a),
    );
    dummy.scale.setScalar(0.018);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  }
  heads.instanceMatrix.needsUpdate = true;
  heads.computeBoundingBox();
  heads.computeBoundingSphere();
  const points = Array.from({ length: 65 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2,
      r = 0.154 + 0.006 * Math.sin(a * 5);
    return [r * Math.cos(a), 0.047 * Math.sin(a * 3), r * Math.sin(a)];
  });
  k.tube(points, 0.019, k.material("#b47d54"), group, 96);
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    const p = k.ball(
      [0.157 * Math.cos(a), 0.047 * Math.sin(a * 3), 0.157 * Math.sin(a)],
      [0.027, 0.025, 0.045],
      k.material("#ac7853"),
      group,
    );
    p.rotation.y = -a;
  }
  return group;
}

export function acidPump(k, parent) {
  const group = new THREE.Group();
  parent.add(group);
  group.name = "V-ATPase — membrane rotor and cytosolic ATPase head";
  const a = k.material("#829cac"),
    b = k.material("#bcc5ba"),
    stalk = k.material("#bba787");
  for (let i = 0; i < 8; i++) {
    const q = (i * Math.PI) / 4;
    k.segment(
      [0.071 * Math.cos(q), -0.045, 0.071 * Math.sin(q)],
      [0.071 * Math.cos(q), 0.065, 0.071 * Math.sin(q)],
      0.017,
      a,
      group,
    );
  }
  k.segment([0, 0.04, 0], [0, 0.22, 0], 0.016, stalk, group);
  for (let i = 0; i < 6; i++) {
    const q = (i * Math.PI) / 3;
    k.ball(
      [0.079 * Math.cos(q), 0.26, 0.079 * Math.sin(q)],
      [0.044, 0.069, 0.044],
      i % 2 ? a : b,
      group,
    );
  }
  for (let i = 0; i < 2; i++) {
    const sign = i ? 1 : -1;
    k.tube(
      [
        [sign * 0.11, 0.02, 0],
        [sign * 0.13, 0.13, 0],
        [sign * 0.1, 0.28, 0],
      ],
      0.011,
      stalk,
      group,
      24,
    );
  }
  return group;
}
