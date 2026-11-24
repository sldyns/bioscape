const R = 0.69;
const EDGE = 0.004;

function uv(point) {
  return [(R * point[1]) / (R + point[0]), (R * point[2]) / (R + point[0])];
}

function surface(u, v) {
  const s = u * u + v * v,
    denominator = R * R + s;
  return [
    (R * (R * R - s)) / denominator,
    (2 * R * R * u) / denominator,
    (2 * R * R * v) / denominator,
  ];
}

// In stereographic coordinates the parent/vesicle intersection is a circle
// whose centre lies on the open z=0 cut. Nested radial rows triangulate its
// complement without changing that curve or the fixed patch boundary.
export function hyphalRadialPatch(piece, cut) {
  const denominator = cut.d + R * cut.nx;
  const center = (R * R * cut.ny) / denominator;
  const radius = (R * cut.a) / denominator;
  const outer = [piece.grid[0][0]];
  for (let j = 1; j < piece.phi.length; j++) outer.push(piece.grid[j][0]);
  outer.push(...piece.grid.at(-1).slice(1));
  for (let j = piece.phi.length - 2; j >= 0; j--)
    outer.push(piece.grid[j].at(-1));
  const projected = outer.map(uv);
  function angle(point, index, last) {
    if (index === 0) return -Math.PI;
    if (index === last) return 0;
    return Math.atan2(point[1], point[0] - center);
  }
  const outerAngles = projected.map((p, i) =>
    angle(p, i, projected.length - 1),
  );
  for (let i = 1; i < outerAngles.length; i++)
    if (!(outerAngles[i] > outerAngles[i - 1]))
      throw new Error("Non-star-shaped hyphal patch");
  const maximumWidth = Math.max(
    ...projected.map((p) => Math.hypot(p[0] - center, p[1]) - radius),
  );
  if (!(maximumWidth > 0 && radius > 0))
    throw new Error("Invalid hyphal patch ring");
  const rows = Math.max(1, Math.ceil((2 * maximumWidth) / EDGE));
  function outerDistance(alpha, cosine, sine) {
    if (alpha === -Math.PI) return Math.abs(projected[0][0] - center);
    if (alpha === 0) return Math.abs(projected.at(-1)[0] - center);
    let lo = 0,
      hi = outerAngles.length - 1;
    while (hi - lo > 1) {
      const middle = (lo + hi) >> 1;
      if (outerAngles[middle] < alpha) lo = middle;
      else hi = middle;
    }
    const p = projected[lo],
      q = projected[hi];
    const ex = q[0] - p[0],
      ey = q[1] - p[1];
    return ((p[0] - center) * ey - p[1] * ex) / (cosine * ey - sine * ex);
  }
  // Radial rows share subdivision angles. Reuse the same boundary
  // intersection and trigonometry for each angle within this patch.
  const rays = new Map();
  function pointAt(t, alpha) {
    let ray = rays.get(alpha);
    if (!ray) {
      const cosine = Math.cos(alpha);
      const sine = Math.sin(alpha);
      ray = {
        cosine,
        sine,
        width: outerDistance(alpha, cosine, sine) - radius,
      };
      rays.set(alpha, ray);
    }
    const distance = radius + ray.width * t;
    return surface(
      center + distance * ray.cosine,
      alpha === 0 || alpha === -Math.PI ? 0 : distance * ray.sine,
    );
  }
  const vertices = [],
    faces = [];
  function makeRing(points, angles) {
    const ids = points.map((point) => {
      vertices.push(point);
      return vertices.length - 1;
    });
    return { ids, angles };
  }
  let previous = makeRing(
    cut.ring,
    cut.ring.map(uv).map((p, i) => angle(p, i, cut.ring.length - 1)),
  );
  const corners = [
    -Math.PI,
    outerAngles[piece.phi.length - 1],
    outerAngles[piece.phi.length + piece.theta.length - 2],
    0,
  ];
  for (let row = 1; row <= rows; row++) {
    let next;
    if (row === rows) next = makeRing(outer, outerAngles);
    else {
      const t = row / rows,
        points = [],
        angles = [];
      function subdivide(lo, hi, a, b, depth) {
        const middle = (lo + hi) / 2,
          p = pointAt(t, middle);
        if (
          Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > EDGE ||
          Math.hypot(
            p[0] - (a[0] + b[0]) / 2,
            p[1] - (a[1] + b[1]) / 2,
            p[2] - (a[2] + b[2]) / 2,
          ) > 0.0001
        ) {
          if (depth >= 16)
            throw new Error("Hyphal radial row did not converge");
          subdivide(lo, middle, a, p, depth + 1);
          subdivide(middle, hi, p, b, depth + 1);
        } else {
          points.push(b);
          angles.push(hi);
        }
      }
      points.push(pointAt(t, -Math.PI));
      angles.push(-Math.PI);
      for (let j = 0; j < corners.length - 1; j++)
        subdivide(
          corners[j],
          corners[j + 1],
          pointAt(t, corners[j]),
          pointAt(t, corners[j + 1]),
          0,
        );
      next = makeRing(points, angles);
    }
    let i = 0,
      j = 0;
    while (i < previous.ids.length - 1 || j < next.ids.length - 1) {
      if (
        j === next.ids.length - 1 ||
        (i < previous.ids.length - 1 &&
          previous.angles[i + 1] <= next.angles[j + 1])
      ) {
        faces.push([previous.ids[i], previous.ids[i + 1], next.ids[j]]);
        i++;
      } else {
        faces.push([previous.ids[i], next.ids[j + 1], next.ids[j]]);
        j++;
      }
    }
    previous = next;
  }
  return { vertices, faces };
}
