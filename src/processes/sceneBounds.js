import * as THREE from "three";

// Bounds for what can actually be seen at a sampled time. Box3.setFromObject
// includes hidden branches, which can make an otherwise legible lesson tiny.
export function visibleProcessBounds(root, target = new THREE.Box3()) {
  target.makeEmpty();
  root.updateWorldMatrix(true, true);
  const vertex = new THREE.Vector3();
  const instance = new THREE.Matrix4();
  const world = new THREE.Matrix4();
  const box = new THREE.Box3();
  const visit = (object) => {
    if (!object.visible) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const drawable = materials.some(
      (material) =>
        material &&
        material.visible &&
        !(material.transparent && material.opacity === 0),
    );
    const position = object.geometry?.attributes.position;
    if (position && drawable) {
      if (object.isInstancedMesh) {
        // Recompute after an animation updates positions or instance matrices;
        // a cached InstancedMesh.boundingBox can describe an earlier pose.
        object.geometry.computeBoundingBox();
        for (let i = 0; i < object.count; i++) {
          object.getMatrixAt(i, instance);
          world.multiplyMatrices(object.matrixWorld, instance);
          target.union(
            box.copy(object.geometry.boundingBox).applyMatrix4(world),
          );
        }
      } else {
        for (let i = 0; i < position.count; i++) {
          vertex
            .fromBufferAttribute(position, i)
            .applyMatrix4(object.matrixWorld);
          target.expandByPoint(vertex);
        }
      }
    }
    object.children.forEach(visit);
  };
  visit(root);
  return target;
}
