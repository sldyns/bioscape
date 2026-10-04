import { THREE } from "../../kit.js";

// Annotation positions are leader endpoints. Keep their arrays stable and read
// the rendered surface after animation, including instance and parent transforms.
export function labelAnchors(labels) {
  return labels.map((label) => {
    const point = new THREE.Vector3();
    const instance = new THREE.Matrix4();
    function place(object, instanceIndex) {
      if (instanceIndex !== undefined) {
        object.getMatrixAt(instanceIndex, instance);
        point.applyMatrix4(instance);
      }
      object.localToWorld(point).toArray(label.position);
      label.active = true;
      for (let node = object; node; node = node.parent)
        if (!node.visible) label.active = false;
    }
    return {
      surface(object, vertex = 0, instanceIndex) {
        point.fromBufferAttribute(object.geometry.attributes.position, vertex);
        place(object, instanceIndex);
      },
      local(object, x, y, z, instanceIndex) {
        point.set(x, y, z);
        place(object, instanceIndex);
      },
    };
  });
}
