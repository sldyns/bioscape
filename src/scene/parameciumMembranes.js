import * as T from "three";

const V = (...values) => new T.Vector3(...values);
const TAU = Math.PI * 2;

export function parametricNormal(pointAt, u, v) {
  if (Math.sin(u) < 1e-7) return V(0, Math.cos(u) > 0 ? 1 : -1, 0);
  const h = 1e-4;
  return pointAt(u, v + h)
    .sub(pointAt(u, v - h))
    .cross(
      pointAt(Math.min(Math.PI, u + h), v).sub(pointAt(Math.max(0, u - h), v)),
    )
    .normalize();
}

// A structured surface with exact, shared hole boundaries. The rectangular
// remeshing patches are still evaluated on the same smooth parametric surface;
// an annulus connects every grid edge to its elliptical opening without a
// triangle crossing the opening or a second membrane behind it.
export function perforatedSurface(
  pointAt,
  holes,
  { uSegments = 160, vSegments = 192, annulusSegments = 8 } = {},
) {
  const positions = [],
    normals = [],
    uv = [],
    index = [];
  const add = (u, v) => {
    const i = positions.length / 3;
    positions.push(...pointAt(u, v).toArray());
    normals.push(...parametricNormal(pointAt, u, v).toArray());
    uv.push(v / TAU, u / Math.PI);
    return i;
  };
  const at = (i, j) => i * (vSegments + 1) + j;
  for (let i = 0; i <= uSegments; i++)
    for (let j = 0; j <= vSegments; j++)
      add((i / uSegments) * Math.PI, (j / vSegments) * TAU);

  const patches = holes.map((hole) => {
    const [u, v] = hole.center,
      [a, b] = hole.radii;
    const [minU, minV] = hole.minimumPatch || [0, 0];
    const centerI = Math.round((u / Math.PI) * uSegments);
    const centerJ = Math.round((v / TAU) * vSegments);
    const i0 = Math.min(
      Math.floor(((u - a * 1.55) / Math.PI) * uSegments),
      centerI - minU,
    );
    const i1 = Math.max(
      Math.ceil(((u + a * 1.55) / Math.PI) * uSegments),
      centerI + minU,
    );
    const j0 = Math.min(
      Math.floor(((v - b * 1.55) / TAU) * vSegments),
      centerJ - minV,
    );
    const j1 = Math.max(
      Math.ceil(((v + b * 1.55) / TAU) * vSegments),
      centerJ + minV,
    );
    if (i0 < 1 || i1 >= uSegments || j0 < 1 || j1 >= vSegments)
      throw new Error(
        `Paramecium membrane opening crosses a chart edge: ${hole.id}`,
      );
    return { ...hole, i0, i1, j0, j1 };
  });
  for (let i = 0; i < patches.length; i++)
    for (let j = i + 1; j < patches.length; j++) {
      const a = patches[i],
        b = patches[j];
      if (a.i0 < b.i1 && b.i0 < a.i1 && a.j0 < b.j1 && b.j0 < a.j1)
        throw new Error(
          `Overlapping Paramecium membrane charts: ${a.id}, ${b.id}`,
        );
    }
  for (let i = 0; i < uSegments; i++)
    for (let j = 0; j < vSegments; j++) {
      if (patches.some((p) => i >= p.i0 && i < p.i1 && j >= p.j0 && j < p.j1))
        continue;
      const a = at(i, j),
        b = at(i + 1, j),
        c = at(i, j + 1),
        d = at(i + 1, j + 1);
      index.push(a, c, b, b, c, d);
    }

  const openings = new Map();
  for (const patch of patches) {
    const perimeter = [];
    for (let i = patch.i0; i < patch.i1; i++) perimeter.push([i, patch.j0]);
    for (let j = patch.j0; j < patch.j1; j++) perimeter.push([patch.i1, j]);
    for (let i = patch.i1; i > patch.i0; i--) perimeter.push([i, patch.j1]);
    for (let j = patch.j1; j > patch.j0; j--) perimeter.push([patch.i0, j]);
    const [u0, v0] = patch.center,
      [a, b] = patch.radii;
    const boundary = perimeter.map(([i, j]) => {
      const du = (i / uSegments) * Math.PI - u0;
      const dv = (j / vSegments) * TAU - v0;
      const radius = Math.hypot(du / a, dv / b);
      return {
        uv: [u0 + du / radius, v0 + dv / radius],
        angle: Math.atan2(dv / b, du / a),
      };
    });
    const rings = [];
    for (let k = 0; k <= annulusSegments; k++) {
      const t = k / annulusSegments;
      rings.push(
        perimeter.map(([i, j], n) =>
          k === annulusSegments
            ? at(i, j)
            : add(
                T.MathUtils.lerp(
                  boundary[n].uv[0],
                  (i / uSegments) * Math.PI,
                  t,
                ),
                T.MathUtils.lerp(boundary[n].uv[1], (j / vSegments) * TAU, t),
              ),
        ),
      );
    }
    for (let k = 0; k < annulusSegments; k++)
      for (let j = 0; j < perimeter.length; j++) {
        const next = (j + 1) % perimeter.length;
        const a = rings[k][j],
          b = rings[k + 1][j],
          c = rings[k][next],
          d = rings[k + 1][next];
        index.push(a, c, b, c, d, b);
      }
    openings.set(patch.id, {
      id: patch.id,
      center: pointAt(u0, v0),
      normal: parametricNormal(pointAt, u0, v0),
      uv: boundary.map((p) => p.uv),
      angles: boundary.map((p) => p.angle),
      rim: boundary.map(({ uv: [u, v] }) => pointAt(u, v)),
      normals: boundary.map(({ uv: [u, v] }) =>
        parametricNormal(pointAt, u, v),
      ),
      definition: patch,
    });
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  return { geometry, openings };
}

export function loftRings(rings, startNormals = null) {
  const positions = [],
    uv = [],
    index = [],
    starts = [];
  for (let row = 0; row < rings.length; row++) {
    starts.push(positions.length / 3);
    for (let j = 0; j < rings[row].length; j++) {
      positions.push(...rings[row][j].toArray());
      uv.push(j / rings[row].length, row / (rings.length - 1));
    }
  }
  for (let row = 0; row < rings.length - 1; row++) {
    const count = rings[row].length;
    for (let j = 0; j < count; j++) {
      const a = starts[row] + j,
        c = starts[row] + ((j + 1) % count);
      if (rings[row + 1].length === 1) index.push(a, starts[row + 1], c);
      else {
        const b = starts[row + 1] + j,
          d = starts[row + 1] + ((j + 1) % count);
        index.push(a, b, c, b, d, c);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  if (startNormals) {
    const normals = geometry.attributes.normal;
    for (let i = 0; i < startNormals.length; i++)
      normals.setXYZ(i, ...startNormals[i].toArray());
  }
  return geometry;
}

// The second face follows the first face's normals. At an invagination these
// normals turn into the lumen, so the membrane offsets outward around the
// tubule rather than creating a second disconnected pipe or sealing its mouth.
export function membraneOtherFace(geometry, thickness) {
  const result = geometry.clone(),
    p = result.attributes.position,
    n = result.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const t =
      typeof thickness === "function" ? thickness(i, p.count) : thickness;
    p.setXYZ(
      i,
      p.getX(i) - n.getX(i) * t,
      p.getY(i) - n.getY(i) * t,
      p.getZ(i) - n.getZ(i) * t,
    );
  }
  const indices = result.index.array;
  for (let i = 0; i < indices.length; i += 3)
    [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  result.computeVertexNormals();
  return result;
}

export function ellipticalPoint(radii, u, v, phase = 0) {
  return V(
    radii[0] * Math.sin(u) * Math.cos(v + phase),
    radii[1] * Math.cos(u),
    radii[2] * Math.sin(u) * Math.sin(v + phase),
  );
}
