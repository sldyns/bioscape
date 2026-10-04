import { THREE } from "../../kit.js";

// Label positions are leader endpoints in both the scene and image exports.
// Keep named structures attached to their actual geometry as parents move.
export function labelAnchors(bindings) {
  const point = new THREE.Vector3(),
    origin = [0, 0, 0];
  return {
    bindings,
    update() {
      for (const { label, target, local = origin } of bindings) {
        point.fromArray(local);
        target.localToWorld(point);
        point.toArray(label.position);
      }
    },
  };
}
