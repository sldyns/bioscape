import { THREE } from "../../kit.js";

// Native and exported leader lines end at these world coordinates. Text layout
// belongs to the shared annotation renderer, so never add a visual text offset.
export function labelAnchors(labels) {
  const point = new THREE.Vector3();
  return {
    atMesh(index, mesh, x = 0, y = 0, z = 0) {
      mesh.localToWorld(point.set(x, y, z)).toArray(labels[index].position);
    },
    atVertex(index, mesh, vertex) {
      point.fromBufferAttribute(mesh.geometry.attributes.position, vertex);
      mesh.localToWorld(point).toArray(labels[index].position);
    },
  };
}
