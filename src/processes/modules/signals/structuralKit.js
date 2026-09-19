import { THREE } from "../../kit.js";

// Schematic secondary structures: these are not atomic reconstructions.
export function helix(
  k,
  parent,
  origin,
  length,
  radius,
  mat,
  turns = 4,
  axis = "y",
  tube = 0.014,
) {
  const pts = Array.from({ length: 65 }, (_, i) => {
    const t = i / 64,
      a = t * Math.PI * 2 * turns,
      p = [radius * Math.cos(a), length * (t - 0.5), radius * Math.sin(a)];
    if (axis === "x") [p[0], p[1]] = [p[1], p[0]];
    return p.map((v, j) => v + origin[j]);
  });
  return k.tube(pts, tube, mat, parent, 80);
}
export function betaSheet(k, parent, origin, size, mat, strands = 4) {
  for (let i = 0; i < strands; i++) {
    const p = k.mesh(
      new THREE.BoxGeometry(size * 0.85, size * 0.11, size * 0.07),
      mat,
      [origin[0], origin[1] + (i - (strands - 1) / 2) * size * 0.15, origin[2]],
      parent,
    );
    p.rotation.z = i % 2 ? -0.12 : 0.12;
  }
}
export function kinaseFold(k, parent, mat, scale = 1) {
  const fold = new THREE.Group();
  parent.add(fold);
  fold.scale.setScalar(scale);
  const secondary = k.material("#c4c0b8");
  // N-lobe beta sheet and larger alpha-helical C-lobe flank a visible cleft.
  betaSheet(k, fold, [-0.13, 0.16, 0.2], 0.31, secondary, 5);
  for (let i = 0; i < 4; i++)
    helix(
      k,
      fold,
      [0.15 + (i % 2) * 0.11, -0.16 + Math.floor(i / 2) * 0.18, 0.16],
      0.23,
      0.038,
      secondary,
      3,
      "y",
      0.013,
    );
  k.tube(
    [
      [-0.22, -0.02, 0.19],
      [-0.04, -0.09, 0.23],
      [0.09, 0.01, 0.23],
      [0.24, 0.06, 0.17],
    ],
    0.025,
    mat,
    fold,
  );
  k.ball(
    [-0.02, 0.01, 0.16],
    [0.045, 0.08, 0.038],
    k.material("#8b8577"),
    fold,
  );
  return fold;
}
export function membraneWall(
  k,
  parent,
  points,
  mat,
  { thickness = 0.065, depth = 0.25, heads = true } = {},
) {
  const wall = new THREE.Group();
  parent.add(wall);
  const positions = [],
    indices = [],
    outer = [],
    inner = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)],
      b = points[Math.min(points.length - 1, i + 1)],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy) || 1,
      nx = -dy / len,
      ny = dx / len;
    outer.push([
      points[i][0] + (nx * thickness) / 2,
      points[i][1] + (ny * thickness) / 2,
      depth,
    ]);
    inner.push([
      points[i][0] - (nx * thickness) / 2,
      points[i][1] - (ny * thickness) / 2,
      depth,
    ]);
    for (const side of [-1, 1])
      for (const z of [-depth, depth])
        positions.push(
          points[i][0] + (nx * thickness * side) / 2,
          points[i][1] + (ny * thickness * side) / 2,
          z,
        );
    if (i < points.length - 1) {
      const j = i * 4;
      indices.push(
        j,
        j + 4,
        j + 1,
        j + 1,
        j + 4,
        j + 5,
        j + 2,
        j + 3,
        j + 6,
        j + 3,
        j + 7,
        j + 6,
        j + 1,
        j + 5,
        j + 3,
        j + 3,
        j + 5,
        j + 7,
      );
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  k.mesh(g, mat, [0, 0, 0], wall);
  k.tube(outer, 0.014, mat, wall);
  k.tube(inner, 0.014, mat, wall);
  if (heads) {
    const count = Math.ceil(points.length / 2) * 2,
      beads = new THREE.InstancedMesh(k.sphere, mat, count),
      obj = new THREE.Object3D();
    let n = 0;
    for (let i = 0; i < points.length; i += 2)
      for (const side of [outer, inner]) {
        obj.position.set(...side[i]);
        obj.scale.set(0.025, 0.025, 0.035);
        obj.updateMatrix();
        beads.setMatrixAt(n++, obj.matrix);
      }
    beads.count = n;
    beads.instanceMatrix.needsUpdate = true;
    beads.computeBoundingBox();
    beads.computeBoundingSphere();
    wall.add(beads);
  }
  return wall;
}
export function rearShell(k, parent, position, radii, color, opacity = 0.68) {
  const mat = k.material(color, {
    side: THREE.DoubleSide,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  });
  const shell = k.mesh(
    new THREE.SphereGeometry(1, 48, 28, Math.PI, Math.PI),
    mat,
    position,
    parent,
  );
  shell.scale.set(...radii);
  return shell;
}
export function chromatinFiber(k, parent, points, radius = 0.032) {
  const guide = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  const chain = new THREE.Group();
  chain.name = "nucleosome-fiber";
  parent.add(chain);
  const dna = k.material("#8d86ab"),
    histone = k.material("#b0a3ba");
  const centers = [];
  for (let i = 0; i < 12; i++) {
    const c = guide.getPoint((i + 0.5) / 12);
    if (centers.every((p) => p.distanceTo(c) > 0.17)) centers.push(c);
  }
  const path = [];
  for (let j = 0; j < centers.length; j++) {
    const c = centers[j];
    const core = k.mesh(
      new THREE.CylinderGeometry(0.037, 0.037, 0.052, 18),
      histone,
      c.toArray(),
      chain,
    );
    core.rotation.x = Math.PI / 2;
    core.name = "histone-core";
    const wrap = [];
    for (let i = 0; i <= 96; i++) {
      const u = i / 96,
        a = -u * Math.PI * 3.3;
      wrap.push(
        c
          .clone()
          .add(
            new THREE.Vector3(
              0.068 * Math.cos(a),
              0.068 * Math.sin(a),
              -0.027 + 0.054 * u,
            ),
          ),
      );
    }
    if (path.length) {
      const last = path.at(-1),
        first = wrap[0];
      const high = Math.max(last.z, first.z, ...centers.map((p) => p.z)) + 0.14;
      path.push(
        new THREE.Vector3(last.x, last.y, high),
        new THREE.Vector3(first.x, first.y, high),
        first.clone(),
      );
    }
    path.push(...wrap);
  }
  // A continuous DNA duplex follows a superhelical axis OUTSIDE the cores.
  // A polyline avoids spline shortcuts through a histone at linker joins.
  const axis = new THREE.CurvePath();
  for (let i = 1; i < path.length; i++)
    axis.add(new THREE.LineCurve3(path[i - 1], path[i]));
  const samples = 1200,
    strands = [[], []];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples,
      c = axis.getPoint(t),
      tangent = axis.getTangent(t).normalize();
    const ref =
      Math.abs(tangent.z) > 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(0, 0, 1);
    const n = new THREE.Vector3().crossVectors(tangent, ref).normalize(),
      b = new THREE.Vector3().crossVectors(tangent, n).normalize();
    const a = t * 2 * Math.PI * centers.length * 12;
    for (let j = 0; j < 2; j++)
      strands[j].push(
        c
          .clone()
          .addScaledVector(n, 0.008 * Math.cos(a + j * Math.PI))
          .addScaledVector(b, 0.008 * Math.sin(a + j * Math.PI)),
      );
  }
  for (const pts of strands) {
    const curve = new THREE.CurvePath();
    for (let i = 1; i < pts.length; i++)
      curve.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    const m = k.mesh(
      new THREE.TubeGeometry(curve, 1800, 0.004, 5, false),
      dna,
      [0, 0, 0],
      chain,
    );
    m.name = "nucleosomal-dna";
  }
  return chain;
}

export function poreComplex(k, parent, position, radius = 0.2) {
  const pore = new THREE.Group();
  parent.add(pore);
  pore.position.set(...position);
  const mat = k.material("#8d9ca9");
  for (const z of [-0.09, 0.09]) k.ring([0, 0, z], radius, 0.026, mat, pore);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4,
      x = Math.cos(a) * radius,
      y = Math.sin(a) * radius;
    k.segment([x, y, -0.09], [x, y, 0.09], 0.028, mat, pore);
    k.ball([x, y, 0], [0.056, 0.044, 0.075], k.material("#abb5bc"), pore);
  }
  return pore;
}
export function materialInventory(group, extra = []) {
  const materials = new Set(extra);
  group.traverse((n) => {
    if (n.material)
      for (const m of Array.isArray(n.material) ? n.material : [n.material])
        materials.add(m);
  });
  return [...materials];
}
