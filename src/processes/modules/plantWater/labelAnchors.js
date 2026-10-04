import * as THREE from "three";

// Labels store world anchors; text placement belongs to the shared annotation
// layout. These closures follow the real object transform without new nodes.
export function bindPointLabel(label, object, localPoint) {
  const point = new THREE.Vector3().fromArray(localPoint),
    world = new THREE.Vector3();
  return () => {
    object.updateWorldMatrix(true, false);
    world.copy(point).applyMatrix4(object.matrixWorld).toArray(label.position);
  };
}

export function bindVertexLabel(label, mesh, index) {
  const point = new THREE.Vector3();
  return () => {
    mesh.updateWorldMatrix(true, false);
    point
      .fromBufferAttribute(mesh.geometry.attributes.position, index)
      .applyMatrix4(mesh.matrixWorld)
      .toArray(label.position);
  };
}

// Select an existing rendered vertex once; this is anchor selection, not a
// nearest-vertex approximation for a distance-to-surface collision test.
export function nearestSurfaceVertex(mesh, target) {
  const point = new THREE.Vector3(),
    sought = new THREE.Vector3().fromArray(target),
    positions = mesh.geometry.attributes.position;
  let best = 0,
    distance = Infinity;
  for (let i = 0; i < positions.count; i++) {
    const candidate = point
      .fromBufferAttribute(positions, i)
      .distanceToSquared(sought);
    if (candidate < distance) {
      best = i;
      distance = candidate;
    }
  }
  return best;
}
