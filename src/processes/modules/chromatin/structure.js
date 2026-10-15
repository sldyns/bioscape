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
  // Continuous domain silhouettes surround a foreground substrate cleft.
  // These are schematic fold envelopes, not fitted molecular coordinates.
  const dark = k.material(colors[0]),
    light = k.material(colors[1]);
  const domains = [
    [
      [-0.77, -0.32],
      [-0.73, 0.27],
      [-0.46, 0.59],
      [-0.24, 0.4],
      [-0.29, 0.09],
      [-0.19, -0.29],
      [-0.39, -0.54],
    ],
    [
      [0.19, -0.36],
      [0.3, 0.05],
      [0.28, 0.39],
      [0.49, 0.54],
      [0.74, 0.24],
      [0.78, -0.19],
      [0.57, -0.51],
    ],
    [
      [-0.47, -0.5],
      [-0.19, -0.7],
      [0.27, -0.67],
      [0.55, -0.45],
      [0.28, -0.28],
      [-0.2, -0.3],
    ],
  ];
  for (let i = 0; i < domains.length; i++) {
    const mesh = foldDomain(k, root, domains[i], i === 1 ? light : dark, 0.28);
    mesh.position.z = -0.23;
    mesh.name = [
      "substrate-cleft-clamp-domain",
      "substrate-cleft-wall-domain",
      "connected-basal-platform",
    ][i];
  }
  k.tube(
    [
      [-0.42, 0.4, -0.35],
      [-0.21, 0.55, -0.46],
      [0.2, 0.53, -0.46],
      [0.45, 0.38, -0.35],
    ],
    0.1,
    light,
    root,
    28,
  ).name = "posterior-domain-bridge";
  for (const side of [-1, 1]) {
    k.tube(
      [
        [side * 0.27, -0.27, 0.03],
        [side * 0.35, 0.02, 0.08],
        [side * 0.33, 0.29, 0.03],
      ],
      0.034,
      light,
      root,
      24,
    ).name = "substrate-cleft-rim";
    alphaHelix(
      k,
      root,
      [side * 0.56, -0.25, 0.02],
      [side * 0.59, 0.19, 0.04],
      0.042,
      light,
      4,
    );
  }
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

// Rounded, domed fold envelopes. Surface depth follows distance from the curved
// outline, so narrow recognition arms stay continuous without filling the cleft.
export function foldDomain(k, parent, points, material, depth = 0.24) {
  const shape = new THREE.Shape();
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      prev = points[(i + points.length - 1) % points.length],
      next = points[(i + 1) % points.length];
    const entry = [p[0] * 0.76 + prev[0] * 0.24, p[1] * 0.76 + prev[1] * 0.24];
    const exit = [p[0] * 0.76 + next[0] * 0.24, p[1] * 0.76 + next[1] * 0.24];
    if (i === 0) shape.moveTo(...entry);
    else shape.lineTo(...entry);
    shape.quadraticCurveTo(...p, ...exit);
  }
  shape.closePath();
  const outline = shape.getSpacedPoints(40).slice(0, -1);
  const planar = outline.map((p) => p.clone());
  const triangles = THREE.ShapeUtils.triangulateShape(outline, []);
  const midpointCache = new Map();
  function midpoint(a, b) {
    const key = a < b ? a + ":" + b : b + ":" + a;
    if (midpointCache.has(key)) return midpointCache.get(key);
    const index = planar.length;
    planar.push(planar[a].clone().add(planar[b]).multiplyScalar(0.5));
    midpointCache.set(key, index);
    return index;
  }
  let faces = triangles;
  for (let pass = 0; pass < 2; pass++) {
    const refined = [];
    for (const [a, b, c] of faces) {
      const ab = midpoint(a, b),
        bc = midpoint(b, c),
        ca = midpoint(c, a);
      refined.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
    }
    faces = refined;
  }
  function edgeDistance(p) {
    let distance = Infinity;
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i],
        b = outline[(i + 1) % outline.length],
        dx = b.x - a.x,
        dy = b.y - a.y;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy),
        ),
      );
      distance = Math.min(
        distance,
        Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy),
      );
    }
    return distance;
  }
  const vertices = [],
    indices = [],
    count = planar.length;
  for (const sign of [1, -1])
    for (const p of planar) {
      const dome = Math.sqrt(Math.max(0, 1 - Math.exp(-edgeDistance(p) * 18)));
      vertices.push(p.x, p.y, sign * (0.035 + depth * 0.7 * dome));
    }
  for (const face of faces) {
    let [a, b, c] = face;
    const pa = planar[a],
      pb = planar[b],
      pc = planar[c];
    if ((pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x) < 0)
      [b, c] = [c, b];
    indices.push(a, b, c, a + count, c + count, b + count);
  }
  // Include every subdivided boundary edge: front, rear and rim form one
  // watertight graph without T junctions, including narrow concave arms.
  for (let i = 0; i < outline.length; i++) {
    const a = i,
      b = (i + 1) % outline.length,
      mid = midpointCache.get(a < b ? a + ":" + b : b + ":" + a);
    const am = midpointCache.get(a < mid ? a + ":" + mid : mid + ":" + a);
    const mb = midpointCache.get(mid < b ? mid + ":" + b : b + ":" + mid);
    const chain = [a, am, mid, mb, b];
    for (let j = 0; j < 4; j++) {
      let u = chain[j],
        v = chain[j + 1];
      // Outline direction determines the outward rim winding.
      if (THREE.ShapeUtils.isClockWise(outline)) [u, v] = [v, u];
      indices.push(u, v + count, v, u, u + count, v + count);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.type = "DomedFoldGeometry";
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData = {
    roundedOutline: true,
    domedSurface: true,
    outlineSamples: 40,
  };
  return k.mesh(geometry, material, [0, 0, 0], parent);
}
