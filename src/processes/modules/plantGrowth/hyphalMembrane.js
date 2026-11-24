import { THREE } from "../../kit.js";
import { hyphalRadialPatch } from "./hyphalRadialPatch.js";

const R = 0.69;
const HALF_PI = Math.PI / 2;
const FRONT = 0.14;
const FINE_STEP = 0.006;
const CUP_FINE_STEP = 0.015;

function sphere(theta, phi) {
  if (phi === HALF_PI) return [0, 0, -R];
  return [
    Math.abs(theta) === HALF_PI ? 0 : R * Math.cos(phi) * Math.cos(theta),
    R * Math.cos(phi) * Math.sin(theta),
    phi === 0 ? 0 : -R * Math.sin(phi),
  ];
}

function sequence(lo, hi, steps) {
  return Array.from({ length: steps + 1 }, (_, i) =>
    i === steps ? hi : lo + ((hi - lo) * i) / steps,
  );
}

// Both sphere surfaces use these same intersection vertices. The seam is a
// boundary curve, never a disc that could cap an open fusion neck.
function cupFacing(a, b, c, center) {
  const ux = b[0] - a[0],
    uy = b[1] - a[1],
    uz = b[2] - a[2];
  const vx = c[0] - a[0],
    vy = c[1] - a[1],
    vz = c[2] - a[2];
  return (
    (uy * vz - uz * vy) * (a[0] - center.x) +
    (uz * vx - ux * vz) * (a[1] - center.y) +
    (ux * vy - uy * vx) * a[2]
  );
}

function cupFaceKeepsWinding(a, b, c, center) {
  return (
    cupFacing(a, b, c, center) > 0 &&
    cupFacing(
      a.map(Math.fround),
      b.map(Math.fround),
      c.map(Math.fround),
      center,
    ) > 0
  );
}

function representableCupFan(pole, ring, center) {
  const vertices = new Set([pole.map(Math.fround).join(",")]);
  for (const point of ring) vertices.add(point.map(Math.fround).join(","));
  return (
    vertices.size === ring.length + 1 &&
    ring
      .slice(1)
      .every((point, i) => cupFaceKeepsWinding(pole, point, ring[i], center))
  );
}

function intersection(center) {
  const { x, y, r } = center;
  const rho = Math.hypot(x, y),
    nx = x / rho,
    ny = y / rho;
  const roundoff = 8 * Number.EPSILON * (R + rho + r);
  if (rho + r - R <= roundoff) return { ...center, rho, nx, ny, closed: true };
  if (rho - r - R >= -roundoff)
    return { ...center, rho, nx, ny, exterior: true };
  const d = (R * R + rho * rho - r * r) / (2 * rho);
  const a =
    Math.sqrt((R + r - rho) * (rho + r - R) * (rho + R - r) * (rho + R + r)) /
    (2 * rho);
  const steps = Math.max(8, Math.ceil((Math.PI * a) / 0.0018));
  const ring = sequence(Math.PI, 0, steps).map((psi, i) => [
    d * nx - a * Math.cos(psi) * ny,
    d * ny + a * Math.cos(psi) * nx,
    i === 0 || i === steps ? 0 : -a * Math.sin(psi),
  ]);
  const alpha = Math.acos(Math.max(-1, Math.min(1, (rho - d) / r)));
  // At the outer tangent the tiny residual cup can collapse in Float32.
  // Use the limiting exterior mesh when that fan has no conforming geometry.
  if (
    alpha <= CUP_FINE_STEP &&
    !representableCupFan([x - r * nx, y - r * ny, 0], ring, center)
  )
    return { ...center, rho, nx, ny, exterior: true };
  return {
    ...center,
    rho,
    nx,
    ny,
    d,
    a,
    ring,
    alpha,
  };
}

function zipper(first, second, emit, coordinate) {
  if (first.length === 1) {
    for (let j = 0; j < second.length - 1; j++)
      emit(first[0], second[j], second[j + 1]);
    return;
  }
  if (second.length === 1) {
    for (let i = 0; i < first.length - 1; i++)
      emit(first[i], first[i + 1], second[0]);
    return;
  }
  let i = 0,
    j = 0;
  while (i < first.length - 1 || j < second.length - 1) {
    if (
      j === second.length - 1 ||
      (i < first.length - 1 &&
        (coordinate
          ? coordinate(first[i + 1]) <= coordinate(second[j + 1])
          : (i + 1) / (first.length - 1) <= (j + 1) / (second.length - 1)))
    ) {
      emit(first[i], first[i + 1], second[j]);
      i++;
    } else {
      emit(first[i], second[j + 1], second[j]);
      j++;
    }
  }
}

function parentPieces() {
  const centers = sequence(-1.1, 1.1, 6);
  const intervals = [];
  let start = -HALF_PI;
  for (const theta of centers) {
    intervals.push({ lo: start, hi: theta - FRONT });
    intervals.push({ lo: theta - FRONT, hi: theta + FRONT, feature: theta });
    start = theta + FRONT;
  }
  intervals.push({ lo: start, hi: HALF_PI });
  const phi = sequence(0, FRONT, Math.ceil(FRONT / FINE_STEP));
  const allTheta = [];
  const pieces = intervals.map((interval) => {
    const theta = sequence(
      interval.lo,
      interval.hi,
      Math.ceil(
        (interval.hi - interval.lo) /
          (interval.feature === undefined ? 0.04 : FINE_STEP),
      ),
    );
    allTheta.push(...theta.slice(0, -1));
    const grid = phi.map((p) => theta.map((t) => sphere(t, p)));
    const triangles = [];
    for (let j = 0; j < phi.length - 1; j++)
      for (let i = 0; i < theta.length - 1; i++)
        triangles.push(
          [grid[j][i], grid[j][i + 1], grid[j + 1][i]],
          [grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]],
        );
    return { ...interval, theta, phi, grid, triangles };
  });
  allTheta.push(HALF_PI);
  const bulk = [];
  const coarseTheta = sequence(-HALF_PI, HALF_PI, Math.ceil(Math.PI / 0.04));
  const bulkPhi = sequence(FRONT, HALF_PI, Math.ceil((HALF_PI - FRONT) / 0.04));
  let previous = allTheta.map((theta) => sphere(theta, FRONT));
  for (const phi of bulkPhi.slice(1)) {
    const next =
      phi === HALF_PI
        ? [sphere(0, HALF_PI)]
        : coarseTheta.map((theta) => sphere(theta, phi));
    zipper(
      previous,
      next,
      (a, b, c) => bulk.push([a, b, c]),
      (point) => Math.atan2(point[1], point[0]),
    );
    previous = next;
  }
  return { pieces, bulk };
}

function cup(cut, emit) {
  if (cut.exterior) return;
  const { x, y, r, nx, ny } = cut;
  const last = cut.closed ? Math.PI : cut.alpha;
  const angles = [0];
  const denseStart = Math.max(0, last - 0.18);
  let transition = -1;
  for (let alpha = 0.05; alpha < denseStart; alpha += 0.05) angles.push(alpha);
  if (!cut.closed) {
    if (denseStart > angles.at(-1)) {
      transition = angles.length - 1;
      angles.push(denseStart);
    }
    const steps = Math.max(1, Math.ceil((last - denseStart) / CUP_FINE_STEP));
    for (let i = 1; i < steps; i++)
      angles.push(denseStart + ((last - denseStart) * i) / steps);
  } else {
    for (
      let alpha = Math.max(0.05, angles.at(-1) + 0.05);
      alpha < last;
      alpha += 0.05
    )
      angles.push(alpha);
  }
  angles.push(last);
  function ringAt(alpha, i) {
    if (!cut.closed && i === angles.length - 1) return cut.ring;
    const axis = -r * Math.cos(alpha),
      radius = r * Math.sin(alpha);
    if (i === 0 || (cut.closed && i === angles.length - 1))
      return [[x + axis * nx, y + axis * ny, 0]];
    const edge = !cut.closed && alpha >= denseStart ? 0.0018 : 0.004;
    const steps = Math.max(2, Math.ceil((Math.PI * radius) / edge));
    return sequence(Math.PI, 0, steps).map((psi, j) => [
      x + axis * nx - radius * Math.cos(psi) * ny,
      y + axis * ny + radius * Math.cos(psi) * nx,
      j === 0 || j === steps ? 0 : -radius * Math.sin(psi),
    ]);
  }
  const rings = angles.map(ringAt);
  if (transition > 0) {
    let valid = true;
    zipper(rings[transition], rings[transition + 1], (a, b, c) => {
      if (valid && !cupFaceKeepsWinding(a, b, c, cut)) valid = false;
    });
    if (!valid) {
      // Split the original span in half. Both radial gaps remain at most
      // the coarse 0.05-radian step, with room for the denser angular ring.
      const angle = (angles[transition - 1] + angles[transition + 1]) / 2;
      rings[transition] = ringAt(angle, transition);
    }
  }
  for (let i = 0; i < rings.length - 1; i++)
    zipper(rings[i], rings[i + 1], emit);
}

// This is the boundary of the unchanged analytic field
// min(R - |p|, |p - c_0| - r_0, ...), on x>=0, z<=0. Active incoming
// lumens are pairwise disjoint; assert that model-specific precondition.
export function hyphalMembrane(k, material) {
  const positions = new Float32Array(150000 * 3);
  const normals = new Float32Array(positions.length);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage),
  );
  const uploadAttributes = [
    geometry.getAttribute("position"),
    geometry.getAttribute("normal"),
  ];
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(0, -0.84, -0.84),
    new THREE.Vector3(0.88, 0.84, 0),
  );
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(
    new THREE.Sphere(),
  );
  const mesh = k.mesh(geometry, material);
  mesh.name =
    "Apical plasma membrane continuous with exocytotic vesicle lumens";
  const parent = parentPieces();
  let cursor = 0;
  function triangle(a, b, c, center) {
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2];
    const vx = c[0] - a[0],
      vy = c[1] - a[1],
      vz = c[2] - a[2];
    let nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    const mx = (a[0] + b[0] + c[0]) / 3,
      my = (a[1] + b[1] + c[1]) / 3,
      mz = (a[2] + b[2] + c[2]) / 3;
    const gx = center ? mx - center.x : -mx,
      gy = center ? my - center.y : -my,
      gz = center ? mz : -mz;
    if (nx * gx + ny * gy + nz * gz < 0) {
      const swap = b;
      b = c;
      c = swap;
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const length = Math.hypot(nx, ny, nz);
    if (!length) return;
    if (cursor + 9 > positions.length)
      throw new Error("Hyphal membrane surface capacity exceeded");
    for (let i = 0; i < 3; i++) {
      const point = i === 0 ? a : i === 1 ? b : c;
      positions[cursor] = point[0];
      normals[cursor++] = nx / length;
      positions[cursor] = point[1];
      normals[cursor++] = ny / length;
      positions[cursor] = point[2];
      normals[cursor++] = nz / length;
    }
  }
  function cache(triangles) {
    cursor = 0;
    for (const [a, b, c] of triangles) triangle(a, b, c);
    return {
      position: positions.slice(0, cursor),
      normal: normals.slice(0, cursor),
    };
  }
  parent.bulk = cache(parent.bulk);
  for (const piece of parent.pieces) {
    piece.cached = cache(piece.triangles);
    piece.triangles = null;
  }
  function copy(cached) {
    if (cursor + cached.position.length > positions.length)
      throw new Error("Hyphal membrane surface capacity exceeded");
    positions.set(cached.position, cursor);
    normals.set(cached.normal, cursor);
    cursor += cached.position.length;
  }
  // The back of the parent membrane is the same prefix in every pose.
  cursor = 0;
  copy(parent.bulk);
  const firstChangingComponent = cursor;
  let previousGeometryCuts;

  function update(values, count) {
    const cuts = [];
    for (let i = 0; i < count; i++) {
      const center = {
        x: values[i * 3],
        y: values[i * 3 + 1],
        r: values[i * 3 + 2],
      };
      if (!(center.x > center.r && center.r > 0 && center.r < R))
        throw new Error("Invalid apical lumen");
      for (const other of cuts)
        if (
          Math.hypot(center.x - other.x, center.y - other.y) <=
          center.r + other.r
        )
          throw new Error("Apical lumens must be pairwise disjoint");
      cuts.push(intersection(center));
    }
    // Exterior cuts produce no patch or cup. Identical active inputs leave
    // the local vertex data and draw range intact, even as the mesh moves.
    const geometryCuts = cuts.filter((cut) => !cut.exterior);
    if (
      previousGeometryCuts?.length === geometryCuts.length &&
      geometryCuts.every((cut, index) => {
        const previous = previousGeometryCuts[index];
        return (
          Object.is(cut.x, previous.x) &&
          Object.is(cut.y, previous.y) &&
          Object.is(cut.r, previous.r)
        );
      })
    )
      return;

    previousGeometryCuts = undefined;
    cursor = firstChangingComponent;
    const assigned = new Set();
    for (const piece of parent.pieces) {
      const cut =
        piece.feature === undefined
          ? null
          : cuts.find(
              (c) =>
                !c.closed &&
                !c.exterior &&
                Math.abs(Math.atan2(c.y, c.x) - piece.feature) < FRONT,
            );
      if (cut) {
        if (assigned.has(cut)) throw new Error("Fusion neck assigned twice");
        assigned.add(cut);
        const patch = hyphalRadialPatch(piece, cut);
        for (const [a, b, c] of patch.faces)
          triangle(patch.vertices[a], patch.vertices[b], patch.vertices[c]);
      } else copy(piece.cached);
    }
    if (assigned.size !== cuts.filter((c) => !c.closed && !c.exterior).length)
      throw new Error("Missing fusion neck");
    for (const cut of cuts) cup(cut, (a, b, c) => triangle(a, b, c, cut));
    positions.fill(0, cursor);
    normals.fill(0, cursor);
    geometry.setDrawRange(0, cursor / 3);
    // Three uploads the full attribute when it creates a GPU buffer.
    // Subsequent draws only need the changing part of the active range.
    for (const attribute of uploadAttributes) {
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(
        firstChangingComponent,
        cursor - firstChangingComponent,
      );
      attribute.needsUpdate = true;
    }
    previousGeometryCuts = geometryCuts;
  }
  return { mesh, update };
}
