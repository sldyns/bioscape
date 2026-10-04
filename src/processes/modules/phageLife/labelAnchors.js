import { THREE } from "../../kit.js";

// label.position is the native/export leader endpoint, not text placement.
const point = new THREE.Vector3(),
  matrix = new THREE.Matrix4();
function publish(label, object) {
  object.updateWorldMatrix(true, false);
  point.applyMatrix4(object.matrixWorld);
  point.toArray(label.position);
}
export function objectAnchor(label, object, x = 0, y = 0, z = 0) {
  point.set(x, y, z);
  publish(label, object);
}
export function vertexAnchor(label, mesh, index = 0) {
  point.fromBufferAttribute(mesh.geometry.attributes.position, index);
  publish(label, mesh);
}
export function instanceAnchor(label, mesh, index = 0) {
  mesh.getMatrixAt(index, matrix);
  point.setFromMatrixPosition(matrix);
  publish(label, mesh);
}
export function duplexAnchor(label, group, fraction = 0.5) {
  const mesh = group.children.find((o) => o.isMesh && !o.isInstancedMesh),
    geometry = mesh.geometry,
    first = Math.floor(geometry.drawRange.start / 42),
    count = Number.isFinite(geometry.drawRange.count)
      ? geometry.drawRange.count
      : geometry.index.count,
    last = Math.min(
      geometry.attributes.position.count / 8 - 1,
      first + Math.floor(count / 42),
    ),
    ring = Math.round(first + (last - first) * fraction),
    position = geometry.attributes.position;
  point.set(0, 0, 0);
  for (let i = 0; i < 7; i++) {
    point.x += position.getX(ring * 8 + i);
    point.y += position.getY(ring * 8 + i);
    point.z += position.getZ(ring * 8 + i);
  }
  point.multiplyScalar(1 / 7);
  publish(label, mesh);
  return count > 0;
}
