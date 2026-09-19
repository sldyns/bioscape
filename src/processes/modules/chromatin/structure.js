import { THREE } from "../../kit.js";

// Nucleotides are visual motifs, not atom-coordinate reconstructions.
export function duplexDetails(
  k,
  parent,
  count,
  size = 0.04,
  replacedA = new Set(),
) {
  const root = new THREE.Group();
  root.name = "paired-sugar-phosphate-and-base-plates";
  parent.add(root);
  const phosphates = new THREE.InstancedMesh(
    k.sphere,
    k.material("#d1d8ce"),
    count * 2,
  );
  const sugars = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 0.45, 5),
    k.material("#9eacaa"),
    count * 2,
  );
  const bases = [
    new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      k.material("#b2c4bb"),
      count,
    ),
    new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      k.material("#bfc5d7"),
      count,
    ),
  ];
  for (const mesh of [phosphates, sugars, ...bases]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(mesh);
  }
  const dummy = new THREE.Object3D(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    d = new THREE.Vector3(),
    mid = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  function update(sampleA, sampleB) {
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      sampleA(t, a);
      sampleB(t, b);
      mid.copy(a).add(b).multiplyScalar(0.5);
      for (let s = 0; s < 2; s++) {
        const p = s ? b : a;
        dummy.position.copy(p);
        dummy.quaternion.identity();
        dummy.scale.setScalar(size);
        dummy.updateMatrix();
        phosphates.setMatrixAt(i * 2 + s, dummy.matrix);
        dummy.position.lerp(mid, 0.23);
        dummy.rotation.set(Math.PI / 2, 0, t * 18);
        dummy.scale.set(size * 1.4, size * 1.4, size * 1.4);
        dummy.updateMatrix();
        sugars.setMatrixAt(i * 2 + s, dummy.matrix);
        d.subVectors(mid, p);
        const len = d.length();
        dummy.position.copy(p).lerp(mid, 0.55);
        dummy.quaternion.setFromUnitVectors(up, d.normalize());
        dummy.scale.set(size * 0.75, Math.max(0.0001, len * 0.7), size * 0.42);
        if (s === 0 && replacedA.has(i)) dummy.scale.setScalar(0);
        dummy.updateMatrix();
        bases[s].setMatrixAt(i, dummy.matrix);
      }
    }
    for (const mesh of [phosphates, sugars, ...bases]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    }
  }
  return { root, update, bases, sugars, phosphates };
}

export function nucleotideDetails(
  k,
  parent,
  count,
  color = "#ddc091",
  size = 0.042,
) {
  const root = new THREE.Group();
  root.name = "RNA-sugar-phosphate-nucleotides";
  parent.add(root);
  const phosphate = new THREE.InstancedMesh(k.sphere, k.material(color), count);
  const sugar = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 0.42, 5),
    k.material("#c4ab83"),
    count,
  );
  const bases = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    k.material("#e2cb9e"),
    count,
  );
  for (const mesh of [phosphate, sugar, bases]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(mesh);
  }
  const dummy = new THREE.Object3D(),
    p = new THREE.Vector3();
  function update(sample, visible = 1, reverse = false, baseSide = 1) {
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count,
        show = (reverse ? 1 - t : t) < visible,
        scale = show ? size : 0;
      sample(t, p);
      dummy.position.copy(p);
      dummy.quaternion.identity();
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      phosphate.setMatrixAt(i, dummy.matrix);
      dummy.position.y += baseSide * size;
      dummy.rotation.set(Math.PI / 2, 0, 0.25);
      dummy.scale.setScalar(scale * 1.35);
      dummy.updateMatrix();
      sugar.setMatrixAt(i, dummy.matrix);
      dummy.position.y += baseSide * size * 1.3;
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(scale * 0.9, scale * 1.7, scale * 0.4);
      dummy.updateMatrix();
      bases.setMatrixAt(i, dummy.matrix);
    }
    for (const mesh of [phosphate, sugar, bases]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    }
  }
  return { root, update };
}

export function alphaHelix(k, parent, from, to, radius, mat, turns = 4) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to),
    dir = b.clone().sub(a).normalize(),
    ref =
      Math.abs(dir.z) > 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(0, 0, 1),
    n = new THREE.Vector3().crossVectors(dir, ref).normalize(),
    bin = new THREE.Vector3().crossVectors(dir, n),
    points = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48,
      theta = t * turns * Math.PI * 2;
    points.push(
      a
        .clone()
        .lerp(b, t)
        .addScaledVector(n, radius * Math.cos(theta))
        .addScaledVector(bin, radius * Math.sin(theta))
        .toArray(),
    );
  }
  const tube = k.tube(points, radius * 0.28, mat, parent, 80);
  tube.name = "schematic-protein-alpha-helix";
  return tube;
}

export function cleftComplex(
  k,
  parent,
  scale,
  colors = ["#91a69f", "#b3c0b7"],
) {
  const root = new THREE.Group();
  root.name = "open-subunit-cleft-schematic";
  parent.add(root);
  root.scale.setScalar(scale);
  const lobes = [
    [-0.56, 0.04, -0.28, 0.27, 0.52, 0.26],
    [0.52, 0.07, -0.25, 0.27, 0.47, 0.25],
    [0, 0.55, -0.28, 0.5, 0.2, 0.25],
    [-0.36, -0.4, -0.23, 0.26, 0.24, 0.2],
    [0.35, -0.42, -0.21, 0.23, 0.23, 0.2],
    [-0.65, 0.45, -0.24, 0.2, 0.22, 0.18],
    [0.62, 0.37, -0.3, 0.17, 0.21, 0.17],
  ];
  for (let i = 0; i < lobes.length; i++) {
    const q = lobes[i];
    k.ball(
      q.slice(0, 3),
      q.slice(3),
      k.material(colors[i % colors.length]),
      root,
    );
  }
  for (let i = 0; i < 4; i++)
    alphaHelix(
      k,
      root,
      [i < 2 ? -0.5 : 0.49, -0.29 + (i % 2) * 0.36, -0.02],
      [i < 2 ? -0.43 : 0.41, -0.02 + (i % 2) * 0.36, 0.06],
      0.055,
      k.material(colors[(i + 1) % 2]),
      3,
    );
  return root;
}

export function ribosomeDetails(k, parent, scale = 1) {
  const root = new THREE.Group();
  root.name = "ribosome-rRNA-ridges-subunit-channel";
  root.scale.setScalar(scale);
  parent.add(root);
  const protein = k.material("#adb1b7"),
    rrna = k.material("#8f99a8");
  for (let i = 0; i < 7; i++)
    k.ball(
      [-0.27 + i * 0.085, 0.22 + 0.04 * Math.cos(i), -0.09],
      [0.075, 0.1, 0.1],
      protein,
      root,
    );
  for (let side = 0; side < 2; side++) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      pts.push([
        -0.25 + 0.5 * t,
        (side ? -0.15 : 0.2) + 0.055 * Math.sin(t * 15),
        0.17 + 0.03 * Math.sin(t * 10),
      ]);
    }
    k.tube(pts, 0.018, rrna, root, 70);
  }
  const channelPoints = [
    [-0.2, 0.04, 0.13],
    [-0.04, 0.02, 0.2],
    [0.11, 0.025, 0.2],
    [0.26, 0.05, 0.14],
  ];
  const channel = new THREE.CatmullRomCurve3(
    channelPoints.map((p) => new THREE.Vector3(...p)),
  );
  // The paired grey edges are a channel reference, not a second RNA molecule.
  for (const side of [-1, 1])
    k.tube(
      channelPoints.map((p) => [p[0], p[1] + side * 0.048, p[2] - 0.025]),
      0.013,
      rrna,
      root,
      50,
    ).name = "mRNA-channel-edge";
  const exit = new THREE.Vector3(0.23, 0.1, 0.15).multiplyScalar(scale);
  const exitRing = k.ring(
    [0.23, 0.1, 0.15],
    0.085,
    0.015,
    k.material("#8b929c"),
    root,
  );
  exitRing.rotation.y = Math.PI / 3;
  exitRing.name = "nascent-peptide-exit";
  return {
    root,
    exit,
    sampleMessage: (s, out) => channel.getPoint(s, out).multiplyScalar(scale),
  };
}

// Open-front membrane sac with paired surfaces and a visible cut rim/lumen.
export function cutSac(k, parent, center, radii, color, thickness = 0.025) {
  const root = new THREE.Group();
  root.position.set(...center);
  root.name = "membrane-sac-with-lumen-cut-edge";
  parent.add(root);
  const outer = k.mesh(
    new THREE.SphereGeometry(1, 32, 16, Math.PI, Math.PI),
    k.material(color, { side: THREE.DoubleSide }),
    [0, 0, 0],
    root,
  );
  outer.scale.set(...radii);
  const innerR = radii.map((r) => Math.max(0.012, r - thickness));
  const inner = k.mesh(
    new THREE.SphereGeometry(1, 32, 16, Math.PI, Math.PI),
    k.material(color === "#b29583" ? "#dcc8b8" : "#bdc9ad", {
      side: THREE.BackSide,
    }),
    [0, 0, 0],
    root,
  );
  inner.scale.set(...innerR);
  const pos = [],
    idx = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    pos.push(
      radii[0] * Math.cos(a),
      radii[1] * Math.sin(a),
      0.001,
      innerR[0] * Math.cos(a),
      innerR[1] * Math.sin(a),
      0.001,
    );
    if (i < 64) {
      const j = i * 2;
      idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  k.mesh(
    geo,
    k.material("#d1d8bd", { side: THREE.DoubleSide }),
    [0, 0, 0],
    root,
  );
  return root;
}
