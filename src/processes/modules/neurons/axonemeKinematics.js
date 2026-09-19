// Near-inextensible material coordinates along parallel axonemal tracks.
// Each doublet is sampled by its own arc length, not by shared centerline rows.
export function arcLengthTracks(
  offsets,
  { length = 4.4, segments = 44, baseX = -1.8, baseY = -2.15 } = {},
) {
  const extended = segments + 16,
    X = new Float64Array(extended + 1),
    Y = new Float64Array(extended + 1),
    A = new Float64Array(extended + 1),
    map = new Map();
  for (const offset of offsets) {
    const key = offset.toFixed(10);
    if (!map.has(key))
      map.set(key, {
        offset,
        cumulative: new Float64Array(extended + 1),
        endParameter: segments,
      });
  }
  function track(offset) {
    return map.get(offset.toFixed(10));
  }
  function geometric(offset, u, out) {
    const i = Math.min(extended - 1, Math.max(0, Math.floor(u))),
      f = Math.max(0, Math.min(1, u - i)),
      a = A[i] + (A[i + 1] - A[i]) * f;
    out.set(
      (X[i] + offset * Math.cos(A[i])) * (1 - f) +
        (X[i + 1] + offset * Math.cos(A[i + 1])) * f,
      (Y[i] - offset * Math.sin(A[i])) * (1 - f) +
        (Y[i + 1] - offset * Math.sin(A[i + 1])) * f,
      a,
    );
    return out;
  }
  function parameter(t, distance) {
    let lo = 0,
      hi = extended;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (t.cumulative[mid] < distance) lo = mid;
      else hi = mid;
    }
    return (
      lo + (distance - t.cumulative[lo]) / (t.cumulative[hi] - t.cumulative[lo])
    );
  }
  function point(t, fraction, out) {
    const u = parameter(t, Math.max(0, Math.min(1, fraction)) * length);
    geometric(t.offset, u, out);
    return u;
  }
  function materialAt(t, u) {
    const i = Math.min(extended - 1, Math.max(0, Math.floor(u))),
      f = Math.max(0, Math.min(1, u - i));
    return t.cumulative[i] * (1 - f) + t.cumulative[i + 1] * f;
  }
  function update(gain, time) {
    X[0] = baseX;
    Y[0] = baseY;
    A[0] = 0;
    for (let s = 1; s <= extended; s++) {
      const t = Math.min(1, s / segments),
        angle =
          gain *
          (0.78 * Math.sin(time - 2.5 * t) * t +
            0.22 * Math.sin(2 * time - 4 * t) * t * t);
      A[s] = angle;
      const mid = (angle + A[s - 1]) * 0.5;
      X[s] = X[s - 1] + (Math.sin(mid) * length) / segments;
      Y[s] = Y[s - 1] + (Math.cos(mid) * length) / segments;
    }
    for (const t of map.values()) {
      t.cumulative[0] = 0;
      for (let s = 1; s <= extended; s++) {
        const dx =
            X[s] - X[s - 1] + t.offset * (Math.cos(A[s]) - Math.cos(A[s - 1])),
          dy =
            Y[s] - Y[s - 1] - t.offset * (Math.sin(A[s]) - Math.sin(A[s - 1]));
        t.cumulative[s] = t.cumulative[s - 1] + Math.hypot(dx, dy);
      }
      t.endParameter = parameter(t, length);
    }
  }
  return {
    track,
    point,
    geometric,
    materialAt,
    update,
    tracks: [...map.values()],
    X,
    Y,
    A,
    length,
    segments,
  };
}
