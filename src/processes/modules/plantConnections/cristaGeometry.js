import { THREE } from "../../kit.js";

// A sectioned inner membrane with genuine apertures, continuously indexed into
// five open tubular cristae. The openings share vertices with the envelope;
// there is no intact spherical membrane or solid cap behind a junction.
export function cristaGeometry() {
  const radius = 0.9,
    vc = -1.06,
    du = 0.052,
    dv = 0.062,
    ringSize = 16;
  const holes = [];
  for (let i = 0; i < 5; i++) {
    const x = -0.66 + i * 0.31;
    for (const offset of [-0.085, 0.095])
      holes.push({ u: Math.asin((x + offset) / radius), v: vc });
  }
  const knots = (count, spans) => {
    const values = Array.from(
      { length: count + 1 },
      (_, i) => -Math.PI / 2 + (i / count) * Math.PI,
    ).filter((x) => !spans.some(([a, b]) => x > a && x < b));
    for (const [a, b] of spans)
      for (let i = 0; i <= 4; i++) values.push(a + ((b - a) * i) / 4);
    return [...new Set(values)].sort((a, b) => a - b);
  };
  const us = knots(
      72,
      holes.map((h) => [h.u - du, h.u + du]),
    ),
    vs = knots(64, [[vc - dv, vc + dv]]),
    remap = new Map();
  const key = (i, j) => `${i}:${j}`;
  const find = (array, value) =>
    array.findIndex((x) => Math.abs(x - value) < 1e-9);
  for (const h of holes) {
    h.left = find(us, h.u - du);
    h.right = find(us, h.u + du);
    h.bottom = find(vs, h.v - dv);
    h.top = find(vs, h.v + dv);
    h.grid = [];
    for (let i = 0; i < 4; i++) h.grid.push([h.left + i, h.bottom]);
    for (let i = 0; i < 4; i++) h.grid.push([h.right, h.bottom + i]);
    for (let i = 0; i < 4; i++) h.grid.push([h.right - i, h.top]);
    for (let i = 0; i < 4; i++) h.grid.push([h.left, h.top - i]);
    h.grid.forEach(([i, j], index) => {
      const a = (-3 * Math.PI) / 4 + (index / ringSize) * Math.PI * 2;
      remap.set(key(i, j), [h.u + du * Math.cos(a), h.v + dv * Math.sin(a)]);
    });
  }
  const vertices = [],
    indices = [],
    ids = [],
    vertexKeys = new Map();
  const add = (p) => {
    const id = p
      .map((x) => (Math.abs(x) < 5e-11 ? 0 : x).toFixed(10))
      .join(",");
    if (vertexKeys.has(id)) return vertexKeys.get(id);
    const n = vertices.length / 3;
    vertices.push(...p);
    vertexKeys.set(id, n);
    return n;
  };
  const surface = (u, v) => [
    radius * Math.sin(u),
    radius * Math.cos(u) * Math.sin(v),
    0.014 - radius * Math.cos(u) * Math.cos(v),
  ];
  const point = (id) => new THREE.Vector3().fromArray(vertices, id * 3);
  for (let i = 0; i < us.length; i++) {
    ids[i] = [];
    for (let j = 0; j < vs.length; j++) {
      if (
        holes.some(
          (h) => i > h.left && i < h.right && j > h.bottom && j < h.top,
        )
      ) {
        ids[i][j] = -1;
        continue;
      }
      const [u, v] = remap.get(key(i, j)) || [us[i], vs[j]];
      ids[i][j] = add(surface(u, v));
    }
  }
  const face = (a, b, c) => {
    if (a !== b && b !== c && a !== c) indices.push(a, b, c);
  };
  for (let i = 0; i < us.length - 1; i++)
    for (let j = 0; j < vs.length - 1; j++) {
      if (
        holes.some(
          (h) => i >= h.left && i < h.right && j >= h.bottom && j < h.top,
        )
      )
        continue;
      face(ids[i][j], ids[i + 1][j], ids[i][j + 1]);
      face(ids[i + 1][j], ids[i + 1][j + 1], ids[i][j + 1]);
    }
  const envelopeIndexCount = indices.length,
    junctions = [];
  for (const h of holes) {
    h.ring = h.grid.map(([i, j]) => ids[i][j]);
    h.center = h.ring
      .reduce((sum, id) => sum.add(point(id)), new THREE.Vector3())
      .multiplyScalar(1 / ringSize);
  }
  for (let i = 0; i < 5; i++) {
    const left = holes[i * 2],
      right = holes[i * 2 + 1],
      x = -0.66 + i * 0.31,
      base = -0.62 * Math.sqrt(1 - x * x),
      height = 0.83 * (1 - Math.abs(x) * 0.32);
    const inward = (p) => new THREE.Vector3(0, 0, 0.014).sub(p).normalize();
    const leftTop = new THREE.Vector3(x - 0.065, base + height - 0.03, -0.14),
      rightTop = new THREE.Vector3(x + 0.06, base + height + 0.01, -0.16),
      curve = new THREE.CurvePath();
    const span = rightTop.clone().sub(leftTop),
      bendRadius = span.length() / 2,
      across = span.normalize(),
      bendUp = new THREE.Vector3(0, 1, 0)
        .addScaledVector(across, -across.y)
        .normalize(),
      top = leftTop
        .clone()
        .add(rightTop)
        .multiplyScalar(0.5)
        .addScaledVector(bendUp, bendRadius),
      handle = bendRadius * (4 / 3) * Math.tan(Math.PI / 8);
    curve.add(
      new THREE.CubicBezierCurve3(
        left.center,
        left.center.clone().addScaledVector(inward(left.center), 0.1),
        leftTop.clone().addScaledVector(bendUp, -0.15),
        leftTop,
      ),
    );
    curve.add(
      new THREE.CubicBezierCurve3(
        leftTop,
        leftTop.clone().addScaledVector(bendUp, handle),
        top.clone().addScaledVector(across, -handle),
        top,
      ),
    );
    curve.add(
      new THREE.CubicBezierCurve3(
        top,
        top.clone().addScaledVector(across, handle),
        rightTop.clone().addScaledVector(bendUp, handle),
        rightTop,
      ),
    );
    curve.add(
      new THREE.CubicBezierCurve3(
        rightTop,
        rightTop.clone().addScaledVector(bendUp, -0.15),
        right.center.clone().addScaledVector(inward(right.center), 0.1),
        right.center,
      ),
    );
    const steps = 80,
      frames = curve.computeFrenetFrames(steps, false),
      centers = Array.from({ length: steps + 1 }, (_, j) =>
        curve.getPointAt(j / steps),
      );
    const circleOffset = (step, j) =>
      frames.normals[step]
        .clone()
        .multiplyScalar(0.044 * Math.cos((j * Math.PI * 2) / ringSize))
        .addScaledVector(
          frames.binormals[step],
          0.044 * Math.sin((j * Math.PI * 2) / ringSize),
        );
    const matchRing = (h, step) => {
      let score = Infinity,
        best;
      for (const direction of [-1, 1])
        for (let shift = 0; shift < ringSize; shift++) {
          const ring = Array.from(
            { length: ringSize },
            (_, j) => h.ring[(shift + direction * j + ringSize) % ringSize],
          );
          const error = ring.reduce(
            (sum, id, j) =>
              sum +
              point(id).sub(h.center).distanceToSquared(circleOffset(step, j)),
            0,
          );
          if (error < score) {
            score = error;
            best = ring;
          }
        }
      return best;
    };
    const start = matchRing(left, 0),
      end = matchRing(right, steps),
      rings = [start];
    const smooth = (t) => t * t * (3 - 2 * t);
    for (let j = 1; j < steps; j++) {
      const ring = [];
      for (let a = 0; a < ringSize; a++) {
        const offset = circleOffset(j, a);
        // Smoothly turn the exact spherical opening into a round lumen.
        if (j < 6)
          offset.lerp(point(start[a]).sub(left.center), 1 - smooth(j / 6));
        if (j > steps - 6)
          offset.lerp(
            point(end[a]).sub(right.center),
            smooth((j - steps + 6) / 6),
          );
        ring.push(add(centers[j].clone().add(offset).toArray()));
      }
      rings.push(ring);
    }
    rings.push(end);
    const firstIndex = indices.length;
    for (let j = 0; j < steps; j++)
      for (let a = 0; a < ringSize; a++) {
        const b = (a + 1) % ringSize;
        face(rings[j][a], rings[j][b], rings[j + 1][a]);
        face(rings[j][b], rings[j + 1][b], rings[j + 1][a]);
      }
    junctions.push({
      start,
      end,
      firstIndex,
      indexCount: indices.length - firstIndex,
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData = { envelopeIndexCount, junctions };
  return geometry;
}
