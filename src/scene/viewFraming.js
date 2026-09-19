// Fit the actual separated bounds, including perspective depth. No mesh work
// runs here: presentation stores each part's assembled bounds once.
export function explodedFitDistance(parts, amount, aspect, fov, axes = null) {
  const tanY = Math.tan((fov * Math.PI) / 360);
  const tanX = tanY * Math.max(aspect, 0.05);
  let distance = 0;
  for (const part of parts) {
    const { frameBounds: box, offset } = part.userData;
    for (const x0 of [box.min.x, box.max.x])
      for (const y0 of [box.min.y, box.max.y])
        for (const z0 of [box.min.z, box.max.z]) {
          const x = x0 + offset.x * amount;
          const y = y0 + offset.y * amount;
          const z = z0 + offset.z * amount;
          const project = (axis) => x * axis.x + y * axis.y + z * axis.z;
          const px = axes ? project(axes[0]) : x;
          const py = axes ? project(axes[1]) : y;
          const pz = axes ? project(axes[2]) : z;
          distance = Math.max(
            distance,
            pz + Math.abs(px) / tanX,
            pz + Math.abs(py) / tanY,
          );
        }
  }
  return distance * 1.14;
}
