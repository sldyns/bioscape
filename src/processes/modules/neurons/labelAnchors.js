import { THREE } from "../../kit.js";

// Annotation positions are geometry targets, not desired text locations.
// Reuse scratch storage: no scene or GPU resources are created during updates.
const point = new THREE.Vector3();
const instance = new THREE.Matrix4();

function write(label, object) {
  object.updateWorldMatrix(true, false);
  point.applyMatrix4(object.matrixWorld);
  label.position[0] = point.x;
  label.position[1] = point.y;
  label.position[2] = point.z;
}

export function anchorObject(label, object, x = 0, y = 0, z = 0) {
  point.set(x, y, z);
  write(label, object);
}

export function anchorVertex(label, mesh, index) {
  point.fromBufferAttribute(mesh.geometry.attributes.position, index);
  write(label, mesh);
}

export function anchorInstance(label, mesh, index) {
  mesh.getMatrixAt(index, instance);
  point.setFromMatrixPosition(instance);
  write(label, mesh);
}
