import { THREE } from "../../kit.js";

// Labels are projected directly in world space by ProcessScene. Keep their
// leaders on a rendered vertex, including live deformation and root transforms.
export function surfaceAnchor(label, mesh, preferred) {
  const point = new THREE.Vector3(),
    target = new THREE.Vector3(...preferred);
  let vertex = -1;
  return (reselect = false) => {
    const geometry = mesh.geometry,
      position = geometry.attributes.position;
    if (vertex < 0 || reselect) {
      let nearest = Infinity;
      const end = Math.min(
        geometry.index?.count ?? position.count,
        geometry.drawRange.start + geometry.drawRange.count,
      );
      for (let i = geometry.drawRange.start; i < end; i++) {
        const index = geometry.index ? geometry.index.getX(i) : i;
        const distance = point
          .fromBufferAttribute(position, index)
          .distanceToSquared(target);
        if (distance < nearest) {
          nearest = distance;
          vertex = index;
        }
      }
    }
    mesh.updateWorldMatrix(true, false);
    point
      .fromBufferAttribute(position, vertex)
      .applyMatrix4(mesh.matrixWorld)
      .toArray(label.position);
  };
}
