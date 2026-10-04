import { THREE } from "../../kit.js";

// Labels store the geometry endpoint of a leader, not the position of its text.
const point = new THREE.Vector3();

export function anchorObject(label, object, x = 0, y = 0, z = 0) {
  object.updateWorldMatrix(true, false);
  point.set(x, y, z).applyMatrix4(object.matrixWorld);
  label.position[0] = point.x;
  label.position[1] = point.y;
  label.position[2] = point.z;
}

export function anchorSegment(label, mesh, fraction = 0.5) {
  anchorObject(label, mesh, 0, fraction - 0.5, 0);
}

export function anchorVertex(label, mesh, index) {
  point.fromBufferAttribute(mesh.geometry.attributes.position, index);
  anchorObject(label, mesh, point.x, point.y, point.z);
}
