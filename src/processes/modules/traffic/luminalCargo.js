import { THREE } from "../../kit.js";

// Measured once at construction, including every phospholipid-head instance.
// The radius is in the parent's coordinates; the LDL mesh itself is unchanged.
export function particleRadius(particle) {
  particle.updateWorldMatrix(true, true);
  const origin = particle.getWorldPosition(new THREE.Vector3()),
    point = new THREE.Vector3(),
    matrix = new THREE.Matrix4();
  let radius = 0;
  particle.traverse((object) => {
    if (!object.geometry) return;
    const positions = object.geometry.attributes.position;
    for (
      let instance = 0;
      instance < (object.isInstancedMesh ? object.count : 1);
      instance++
    ) {
      if (object.isInstancedMesh) {
        object.getMatrixAt(instance, matrix);
        matrix.premultiply(object.matrixWorld);
      } else matrix.copy(object.matrixWorld);
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
        radius = Math.max(radius, point.distanceTo(origin));
      }
    }
  });
  return radius;
}

// Maximum radial centre position for a sphere inside the actual luminal
// leaflet, revolved about X. For each linear meridional segment, minimize
// wallRadius(x) - sqrt(radius² - (x - centreX)²) over the overlapping interval.
// This protects the whole cargo, including at a steep or narrowing fusion neck.
export function luminalSphereAllowance(
  positions,
  centreX,
  radius,
  stride = 65,
) {
  const meridian = (stride - 1) / 2;
  let allowance = Infinity;
  for (let row = meridian; row + stride < positions.count; row += stride) {
    const x = positions.getX(row),
      nextX = positions.getX(row + stride),
      r = -positions.getZ(row),
      nextR = -positions.getZ(row + stride),
      lo = Math.max(centreX - radius, x),
      hi = Math.min(centreX + radius, nextX);
    if (hi < lo || nextX <= x) continue;
    const slope = (nextR - r) / (nextX - x),
      minimumX = Math.max(
        lo,
        Math.min(hi, centreX - (slope * radius) / Math.sqrt(1 + slope * slope)),
      );
    allowance = Math.min(
      allowance,
      r +
        slope * (minimumX - x) -
        Math.sqrt(Math.max(0, radius * radius - (minimumX - centreX) ** 2)),
    );
  }
  return allowance;
}
