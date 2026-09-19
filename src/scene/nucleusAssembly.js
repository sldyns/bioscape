import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { nucleolarBody } from "./nuclearBodies";
const TAU = Math.PI * 2,
  V = (x, y, z) => new THREE.Vector3(x, y, z);
function mesh(g, geo, color, hit, flags = {}) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.6,
      side: THREE.DoubleSide,
      clearcoat: 0.12,
    }),
  );
  m.userData = { hitId: hit, ...flags };
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
function tube(points, r, n = 90) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    n,
    r,
    7,
    false,
  );
}
function combine(g, geos, color, hit, flags) {
  if (!geos.length) return;
  const result = mesh(g, mergeGeometries(geos), color, hit, flags);
  geos.forEach((x) => x.dispose());
  return result;
}
const point = (t, a, r = 1) =>
  V(
    Math.sin(t) * Math.cos(a) * r,
    Math.sin(t) * Math.sin(a) * r,
    Math.cos(t) * r * 0.87,
  );
export function nucleusAssembly() {
  const g = new THREE.Group(),
    pores = [];
  for (let row = 0; row < 5; row++) {
    const t = 0.55 + row * 0.49,
      count = Math.round(14 * Math.sin(t));
    for (let i = 0; i < count; i++)
      pores.push({ t, a: ((i + 0.37 * (row % 2)) / count) * TAU });
  }
  const dirs = pores.map((p) =>
    point(p.t, p.a)
      .multiply(V(1, 1, 1 / 0.87))
      .normalize(),
  );
  const poreAngle = 0.064;
  function crossesPore(direction, margin = 0) {
    return dirs.some(
      (p) => direction.distanceToSquared(p) < (poreAngle + margin) ** 2,
    );
  }
  function shell(radius, start, end) {
    const geo = new THREE.SphereGeometry(
      radius,
      256,
      128,
      0,
      TAU,
      start,
      end - start,
    );
    geo.rotateX(Math.PI / 2);
    // SphereGeometry's azimuth differs; test directions in Cartesian space.
    const position = geo.attributes.position,
      idx = geo.index.array,
      indices = [];
    const a = V(0, 0, 0),
      b = V(0, 0, 0),
      c = V(0, 0, 0),
      center = V(0, 0, 0);
    for (let i = 0; i < idx.length; i += 3) {
      a.fromBufferAttribute(position, idx[i]);
      b.fromBufferAttribute(position, idx[i + 1]);
      c.fromBufferAttribute(position, idx[i + 2]);
      center.copy(a).add(b).add(c).normalize();
      if (!crossesPore(center)) indices.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    geo.setIndex(indices);
    geo.scale(1, 1, 0.87);
    geo.computeVertexNormals();
    return geo;
  }
  for (const front of [false, true]) {
    const start = front ? 0 : 1,
      end = front ? 1 : Math.PI;
    for (const [r, color] of [
      [0.98, "#aa90bf"],
      [0.932, "#ccb7da"],
    ])
      mesh(g, shell(r, start, end), color, "envelope", { cap: front });
  }
  const edge = [];
  for (let i = 0; i <= 180; i++) edge.push(point(1, (i / 180) * TAU, 0.956));
  mesh(g, tube(edge, 0.024, 180), "#c6aed6", "envelope", { cutOnly: true });
  const bodyPores = [],
    capPores = [],
    joinBody = [],
    joinCap = [];
  for (let i = 0; i < pores.length; i++) {
    const p = pores[i],
      dir = dirs[i],
      q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir),
      // Build on the original sphere, then apply the same flattening as the
      // envelope. Otherwise collars tilt away from the membrane near the poles.
      origin = dir.clone().multiplyScalar(0.956 * Math.cos(poreAngle));
    const conform = (geo) => {
      geo.applyQuaternion(q);
      geo.translate(...origin.toArray());
      geo.scale(1, 1, 0.87);
      return geo;
    };
    const geo = new THREE.CylinderGeometry(
      0.98 * Math.sin(poreAngle),
      0.932 * Math.sin(poreAngle),
      0.048 * Math.cos(poreAngle),
      32,
      1,
      true,
    );
    geo.rotateX(Math.PI / 2);
    (p.t < 1 ? joinCap : joinBody).push(conform(geo));
    const pieces = p.t < 1 ? capPores : bodyPores;
    for (const radius of [0.932, 0.98]) {
      const ringRadius = radius * Math.sin(poreAngle),
        depth = (radius - 0.956) * Math.cos(poreAngle);
      const ring = new THREE.TorusGeometry(ringRadius, 0.009, 6, 32);
      ring.translate(0, 0, depth);
      pieces.push(conform(ring));
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU,
          head = new THREE.SphereGeometry(0.014, 10, 8);
        head.translate(
          Math.cos(a) * ringRadius,
          Math.sin(a) * ringRadius,
          depth,
        );
        pieces.push(conform(head));
      }
    }
    // A few fine strands indicate selective pore contents without painting a solid hole.
    for (let k = 0; k < 3; k++) {
      const line = [
        V(-0.048, k * 0.015 - 0.015, 0),
        V(0, 0.008 * Math.sin(i + k), 0.008),
        V(0.048, 0.015 - k * 0.015, 0),
      ];
      pieces.push(conform(tube(line, 0.003, 12)));
    }
  }
  combine(g, joinBody, "#b9a1cc", "envelope");
  combine(g, joinCap, "#b9a1cc", "envelope", { cap: true });
  combine(g, bodyPores, "#947aac", "nuclearPores");
  combine(g, capPores, "#947aac", "nuclearPores", { cap: true });
  // Keep the lamina on the nucleoplasmic face, with real gaps at each pore.
  const lamina = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU;
    let pts = [];
    const flush = () => {
      if (pts.length > 1)
        lamina.push(tube(pts, 0.003, Math.max(8, Math.ceil(pts.length / 3))));
      pts = [];
    };
    for (let j = 0; j <= 180; j++) {
      const t = 1.05 + (j / 180) * 1.85,
        direction = V(
          Math.sin(t) * Math.cos(a),
          Math.sin(t) * Math.sin(a),
          Math.cos(t),
        );
      if (crossesPore(direction, 0.009)) flush();
      else pts.push(point(t, a, 0.918));
    }
    flush();
  }
  combine(g, lamina, "#ae99bf", "envelope");
  // Coherent loops show variable compaction; central space is reserved for the nucleolus.
  const coils = [],
    beads = [];
  for (let k = 0; k < 9; k++) {
    const paths = [];
    for (let i = 0; i <= 170; i++) {
      const t = i / 170,
        a = t * TAU * 1.6 + k * 0.68;
      const r = 0.45 + 0.13 * Math.sin(t * TAU * 2 + k * 0.9);
      const p = V(Math.cos(a) * r, Math.sin(a) * r, (t - 0.5) * 0.82);
      p.x += 0.1 * Math.sin(t * TAU * 3 + k);
      p.y += 0.07 * Math.cos(t * TAU * 4 + k);
      const delta = p.clone().sub(V(0.08, -0.1, 0.25));
      if (delta.length() < 0.34)
        p.copy(
          delta
            .normalize()
            .multiplyScalar(0.34)
            .add(V(0.08, -0.1, 0.25)),
        );
      paths.push(p);
      if (i % 7 === 0) {
        const b = new THREE.SphereGeometry(0.013, 8, 6);
        b.translate(...p.toArray());
        beads.push(b);
      }
    }
    coils.push(tube(paths, 0.0075, 240));
  }
  combine(g, coils, "#a88bbc", "chromatin");
  combine(g, beads, "#bda2ce", "chromatin");
  const body = nucleolarBody();
  body.scale.setScalar(0.3);
  body.position.set(0.08, -0.1, 0.25);
  body.updateMatrixWorld(true);
  const bins = new Map();
  body.traverse((o) => {
    if (!o.isMesh) return;
    const key = o.material.color.getHexString() + !!o.userData.cap;
    if (!bins.has(key))
      bins.set(key, {
        color: o.material.color,
        cap: !!o.userData.cap,
        geos: [],
      });
    bins.get(key).geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
    o.geometry.dispose();
    o.material.dispose();
  });
  for (const { color, cap, geos } of bins.values())
    combine(g, geos, color, "nucleolus", { cap });
  return g;
}
