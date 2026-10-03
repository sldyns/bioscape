// Smooth meridional profiles, scoped to vesicle fusion. Tangents are shared by
// adjacent cubic spans; axial tangents vanish at poles for rounded end caps.
export function smoothFusionProfile(points) {
  const tangents = points.map((point, i) =>
    point.map((_, axis) => {
      if (i === 0 || i === points.length - 1) {
        if (axis === 0) return 0;
        return i === 0
          ? points[1][axis] - point[axis]
          : point[axis] - points[i - 1][axis];
      }
      const before = point[axis] - points[i - 1][axis];
      const after = points[i + 1][axis] - point[axis];
      // Monotone Hermite tangents prevent radial overshoot around a neck.
      return before * after <= 0 ? 0 : (2 * before * after) / (before + after);
    }),
  );
  function sample(t) {
    const u = Math.max(0, Math.min(1, t)) * (points.length - 1);
    const i = Math.min(points.length - 2, Math.floor(u)),
      f = u - i;
    const f2 = f * f,
      f3 = f2 * f;
    return [0, 1].map(
      (axis) =>
        (2 * f3 - 3 * f2 + 1) * points[i][axis] +
        (f3 - 2 * f2 + f) * tangents[i][axis] +
        (-2 * f3 + 3 * f2) * points[i + 1][axis] +
        (f3 - f2) * tangents[i + 1][axis],
    );
  }
  return sample;
}

// A nascent common lumen begins at the two apposed spherical envelopes, then
// relaxes toward the mature shape. No membrane surface is placed across it.
export function fusionEnvelope(
  sample,
  left,
  right,
  neckSmoothing,
  neckT = 0.5,
) {
  const targetLo = sample(0)[0],
    targetHi = sample(1)[0];
  const targetNeck = sample(neckT)[0];
  const lo = left[0] - left[1],
    hi = right[0] + right[1];
  const neck =
    (left[1] ** 2 - right[1] ** 2 - left[0] ** 2 + right[0] ** 2) /
    (2 * (right[0] - left[0]));
  const before = (neck - lo) / (targetNeck - targetLo);
  const after = (hi - neck) / (targetHi - targetNeck);
  const tangent = (2 * before * after) / (before + after);
  // Correspondence follows the same fusion neck throughout relaxation. A
  // generic t-to-t blend would leave a second waist where the old neck was.
  function originalX(x) {
    const first = x <= targetNeck;
    const a = first ? targetLo : targetNeck,
      b = first ? targetNeck : targetHi;
    const c = first ? lo : neck,
      d = first ? neck : hi;
    const m0 = first ? before : tangent,
      m1 = first ? tangent : after;
    const u = (x - a) / (b - a),
      u2 = u * u,
      u3 = u2 * u;
    return (
      (2 * u3 - 3 * u2 + 1) * c +
      (u3 - 2 * u2 + u) * (b - a) * m0 +
      (-2 * u3 + 3 * u2) * d +
      (u3 - u2) * (b - a) * m1
    );
  }
  return (t, opening) => {
    const target = sample(t);
    const x = originalX(target[0]);
    const a = left[1] ** 2 - (x - left[0]) ** 2;
    const b = right[1] ** 2 - (x - right[0]) ** 2;
    const h = Math.max(0, neckSmoothing - Math.abs(a - b)) / neckSmoothing;
    const r = Math.sqrt(
      Math.max(0, Math.max(a, b) + (h * h * neckSmoothing) / 4),
    );
    return [x + (target[0] - x) * opening, r + (target[1] - r) * opening];
  };
}

// Find receptor anchors on exactly the same animated profile as the bilayer.
export function profileAtX(sample, x, rings = 0) {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (sample(mid)[0] < x) lo = mid;
    else hi = mid;
  }
  if (rings > 1) {
    // Match the piecewise planar rendered wall between adjacent sampled rings.
    const index = Math.min(
      rings - 2,
      Math.floor(((lo + hi) / 2) * (rings - 1)),
    );
    const a = sample(index / (rings - 1)),
      b = sample((index + 1) / (rings - 1));
    const slope = (b[1] - a[1]) / Math.max(0.000001, b[0] - a[0]);
    return [a[1] + (x - a[0]) * slope, slope];
  }
  const t = (lo + hi) / 2,
    value = sample(t);
  const a = sample(Math.max(0, t - 0.0001)),
    b = sample(Math.min(1, t + 0.0001));
  return [value[1], (b[1] - a[1]) / Math.max(0.000001, b[0] - a[0])];
}
