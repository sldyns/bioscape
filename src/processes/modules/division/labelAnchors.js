import { readVertexCandidates } from "../../vertexCandidates.js";
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
      if (
        !geometry.index &&
        !position.isInterleavedBufferAttribute &&
        !position.normalized &&
        position.itemSize === 3 &&
        position.array instanceof Float32Array
      ) {
        const values = position.array,
          targetX = target.x,
          targetY = target.y,
          targetZ = target.z;
        const candidates = readVertexCandidates(geometry),
          indices = candidates?.indices,
          start = indices ? 0 : geometry.drawRange.start,
          stop = indices ? candidates.count : end;
        for (let sample = start; sample < stop; sample++) {
          const i = indices ? indices[sample] : sample;
          const offset = i * 3,
            dx = values[offset] - targetX,
            dy = values[offset + 1] - targetY,
            dz = values[offset + 2] - targetZ;
          const distance = dx * dx + dy * dy + dz * dz;
          if (distance < nearest) {
            nearest = distance;
            vertex = i;
          }
        }
      } else {
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
    }
    mesh.updateWorldMatrix(true, false);
    point
      .fromBufferAttribute(position, vertex)
      .applyMatrix4(mesh.matrixWorld)
      .toArray(label.position);
  };
}
