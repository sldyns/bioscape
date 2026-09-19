import * as THREE from "three";
const TAU = Math.PI * 2;
const backbone = ["#708ea3", "#b29cc3"];
const histoneColors = ["#a58bbc", "#c4a2ad", "#849db3", "#b8b097"];
function mesh(g, geometry, color, id) {
  const m = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, clearcoat: 0.16 }),
  );
  m.userData.hitId = id;
  g.add(m);
  return m;
}
function tube(g, points, r, color, id) {
  const c = new THREE.CatmullRomCurve3(points);
  return mesh(
    g,
    new THREE.TubeGeometry(c, Math.max(32, points.length * 2), r, 8, false),
    color,
    id,
  );
}
function sphere(g, p, s, color, id) {
  const m = mesh(g, new THREE.SphereGeometry(1, 24, 16), color, id);
  m.position.copy(p);
  m.scale.set(...s);
  return m;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function bond(g, a, b, r, color, id) {
  const delta = b.clone().sub(a);
  const m = mesh(
    g,
    new THREE.CylinderGeometry(r, r, delta.length(), 8),
    color,
    id,
  );
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), delta.normalize());
}
function core(g, hit = "histones", tails = true) {
  for (let i = 0; i < 8; i++) {
    const a = ((i % 4) * TAU) / 4 + (i < 4 ? 0 : 0.36),
      y = i < 4 ? -0.19 : 0.19;
    const p = V(Math.cos(a) * 0.32, y, Math.sin(a) * 0.32);
    const m = sphere(g, p, [0.29, 0.26, 0.31], histoneColors[i % 4], hit);
    m.rotation.y = -a;
    if (tails) {
      const sign = i < 4 ? -1 : 1;
      const q = p.clone().multiplyScalar(1.15);
      q.y += sign * 0.2;
      tube(
        g,
        [
          p,
          q,
          V(q.x * 1.55, q.y + sign * 0.16, q.z * 1.42),
          V(q.x * 1.6 + 0.08, q.y + sign * 0.26, q.z * 1.5 - 0.07),
        ],
        0.012,
        histoneColors[i % 4],
        hit,
      );
    }
  }
}
// The superhelix is left-handed; the local DNA double helix is right-handed.
function wrappedPaths() {
  const paths = [[], []];
  for (let i = 0; i <= 300; i++) {
    const t = i / 300,
      a = t * TAU * 1.7,
      theta = t * TAU * 14;
    const center = V(Math.cos(a) * 0.77, -0.47 + t * 0.94, Math.sin(a) * 0.77);
    const radial = V(Math.cos(a), 0, Math.sin(a));
    const tangent = V(
      -Math.sin(a) * 0.77 * TAU * 1.7,
      0.94,
      Math.cos(a) * 0.77 * TAU * 1.7,
    ).normalize();
    const binormal = tangent.clone().cross(radial).normalize();
    for (let k = 0; k < 2; k++) {
      const phase = theta + k * 2.35;
      paths[k].push(
        center
          .clone()
          .addScaledVector(radial, 0.044 * Math.cos(phase))
          .addScaledVector(binormal, 0.044 * Math.sin(phase)),
      );
    }
  }
  return paths;
}
function wrappedUnit(g, { unitHit, showPairs = false } = {}) {
  core(g, unitHit || "histones");
  const paths = wrappedPaths();
  paths.forEach((pts, k) => tube(g, pts, 0.019, backbone[k], unitHit || "dna"));
  if (showPairs)
    for (let i = 0; i < paths[0].length; i += 3) {
      const a = paths[0][i],
        b = paths[1][i];
      bond(g, a, b, 0.009, "#c4bbc9", unitHit || "dna");
    }
  return paths;
}
function link(g, previous, next) {
  const curves = previous.map((a, k) => {
    const b = next[k],
      start = a.at(-1),
      end = b[0],
      handle = Math.min(0.35, start.distanceTo(end) * 0.32);
    const ta = start.clone().sub(a.at(-2)).normalize(),
      tb = b[1].clone().sub(end).normalize();
    return new THREE.CubicBezierCurve3(
      start,
      start.clone().addScaledVector(ta, handle),
      end.clone().addScaledVector(tb, -handle),
      end,
    );
  });
  const paths = [[], []];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100,
      a = curves[0].getPoint(t),
      b = curves[1].getPoint(t),
      center = a.clone().add(b).multiplyScalar(0.5);
    const axis = curves[0]
      .getTangent(t)
      .add(curves[1].getTangent(t))
      .normalize();
    // Add helical winding while preserving both endpoint positions and tangents.
    const angle = TAU * 4 * (3 * t * t - 2 * t * t * t),
      delta = a.clone().sub(center).applyAxisAngle(axis, angle);
    paths[0].push(center.clone().add(delta));
    paths[1].push(center.clone().sub(delta));
  }
  paths.forEach((pts, k) => tube(g, pts, 0.01, backbone[k], "dna"));
}
function chromatin(g) {
  const centers = [
    [-1.7, 0.92, -0.12],
    [-0.55, 1.12, 0.2],
    [0.67, 0.95, -0.05],
    [1.6, 0.1, 0.08],
    [0.65, -0.7, 0.26],
    [-0.56, -0.65, -0.08],
    [-1.6, -1.2, 0.1],
  ];
  const units = centers.map((p, i) => {
    const unit = new THREE.Group();
    g.add(unit);
    unit.position.set(...p);
    unit.scale.setScalar(0.42);
    unit.rotation.set(
      0.13 * Math.sin(i * 1.3),
      -0.32 + i * 0.42,
      0.15 * Math.cos(i),
    );
    const paths = wrappedUnit(unit, { unitHit: "nucleosome" });
    unit.updateMatrixWorld(true);
    return paths.map((path) =>
      path.map((point) => point.clone().applyMatrix4(unit.matrixWorld)),
    );
  });
  for (let i = 0; i < units.length - 1; i++) link(g, units[i], units[i + 1]);
  for (let k = 0; k < 2; k++) {
    const a = units[0][k],
      b = units.at(-1)[k];
    tube(
      g,
      [
        a[0].clone().add(V(-0.3, -0.28, 0)),
        a[0].clone().addScaledVector(a[0].clone().sub(a[1]).normalize(), 0.18),
        a[0],
      ],
      0.012,
      backbone[k],
      "dna",
    );
    tube(
      g,
      [
        b.at(-1),
        b
          .at(-1)
          .clone()
          .addScaledVector(b.at(-1).clone().sub(b.at(-2)).normalize(), 0.18),
        b
          .at(-1)
          .clone()
          .add(V(-0.34, -0.24, 0)),
      ],
      0.012,
      backbone[k],
      "dna",
    );
  }
  g.rotation.x = 0.12;
}
function nucleosome(g) {
  const paths = wrappedUnit(g, { showPairs: true });
  for (let k = 0; k < 2; k++)
    for (const end of [0, 1]) {
      const pts = paths[k],
        p = end ? pts.at(-1) : pts[0],
        t = end ? p.clone().sub(pts.at(-2)) : p.clone().sub(pts[1]);
      t.normalize();
      tube(
        g,
        [
          p,
          p.clone().addScaledVector(t, 0.24),
          p
            .clone()
            .addScaledVector(t, 0.65)
            .add(V(0, end ? 0.08 : -0.08, 0)),
        ],
        0.019,
        backbone[k],
        "dna",
      );
    }
  g.rotation.set(0.36, -0.3, 0.1);
}
function dna(g) {
  const paths = [[], []],
    turns = 3.05,
    height = 3.55;
  const point = (t, k) => {
    const a = t * TAU * turns + k * 2.35;
    return V(Math.cos(a) * 0.47, (t - 0.5) * height, -Math.sin(a) * 0.47);
  };
  for (let i = 0; i <= 300; i++)
    for (let k = 0; k < 2; k++) paths[k].push(point(i / 300, k));
  paths.forEach((p, k) => tube(g, p, 0.036, backbone[k], "dna"));
  const pairs = [
    ["#b1a27a", "#cba99e"],
    ["#87aaa5", "#9aa9c1"],
  ];
  for (let i = 0; i < 33; i++) {
    const t = 0.015 + (i / 32) * 0.97,
      a = point(t, 0),
      b = point(t, 1),
      mid = a.clone().add(b).multiplyScalar(0.5);
    bond(g, a, mid, 0.022, pairs[i % 2][0], "dna");
    bond(g, mid, b, 0.022, pairs[i % 2][1], "dna");
    for (let k = 0; k < 2; k++)
      sphere(g, point(t, k), [0.049, 0.049, 0.049], backbone[k], "dna");
  }
  g.userData.landmarks = [
    { zh: "5′", en: "5′", position: point(0, 0).toArray() },
    { zh: "3′", en: "3′", position: point(1, 0).toArray() },
    { zh: "3′", en: "3′", position: point(0, 1).toArray() },
    { zh: "5′", en: "5′", position: point(1, 1).toArray() },
  ];
}
export function chromatinDetail(id) {
  if (!["chromatin", "nucleosome", "histones", "dna"].includes(id)) return null;
  const g = new THREE.Group();
  if (id === "chromatin") chromatin(g);
  if (id === "nucleosome") nucleosome(g);
  if (id === "histones") {
    core(g);
    g.rotation.set(0.28, -0.3, 0.1);
    g.userData.landmarks = histoneColors.map((_, i) => ({
      zh: ["H2A × 2", "H2B × 2", "H3 × 2", "H4 × 2"][i],
      en: ["H2A × 2", "H2B × 2", "H3 × 2", "H4 × 2"][i],
      position: [
        Math.cos((i * TAU) / 4) * 0.42,
        0.12,
        Math.sin((i * TAU) / 4) * 0.42,
      ],
    }));
  }
  if (id === "dna") dna(g);
  return g;
}
