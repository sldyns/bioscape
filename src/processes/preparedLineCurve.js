import { LineCurve3 } from "three";

// Prepare the same sampled lengths as Curve.getLengths, without allocating a
// temporary Vector3 for every sample. The returned curve keeps all Three.js
// methods, including its normal invalidation and resampling behavior.
export function preparedLineCurve3(start, end) {
  const curve = new LineCurve3(start, end);
  const divisions = curve.arcLengthDivisions;
  const ax = start.x,
    ay = start.y,
    az = start.z;
  const bx = end.x,
    by = end.y,
    bz = end.z;
  if (
    !Number.isSafeInteger(divisions) ||
    divisions < 1 ||
    ![ax, ay, az, bx, by, bz].every(Number.isFinite)
  )
    return curve;
  const dx = bx - ax,
    dy = by - ay,
    dz = bz - az;
  let previousX = dx * 0 + ax;
  let previousY = dy * 0 + ay;
  let previousZ = dz * 0 + az;
  let sum = 0;
  const lengths = [0];
  for (let p = 1; p <= divisions; p++) {
    const t = p / divisions;
    // LineCurve3 copies its final endpoint directly when t is exactly one.
    const x = t === 1 ? bx : dx * t + ax;
    const y = t === 1 ? by : dy * t + ay;
    const z = t === 1 ? bz : dz * t + az;
    const sx = x - previousX,
      sy = y - previousY,
      sz = z - previousZ;
    sum += Math.sqrt(sx * sx + sy * sy + sz * sz);
    lengths.push(sum);
    previousX = x;
    previousY = y;
    previousZ = z;
  }
  curve.cacheArcLengths = lengths;
  curve.needsUpdate = false;
  return curve;
}
