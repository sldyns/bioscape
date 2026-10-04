import { THREE } from "../../kit.js";

// position is the leader's biological target, not the label's text offset.
export function labelAnchors(bindings) {
  const targets = bindings.map(([label, object, point = [0, 0, 0]]) => ({
    label,
    object,
    point,
    world: new THREE.Vector3(),
  }));
  return () => {
    for (const { label, object, point, world } of targets) {
      if (Number.isInteger(point))
        world.fromBufferAttribute(object.geometry.attributes.position, point);
      else world.fromArray(point);
      object.localToWorld(world).toArray(label.position);
    }
  };
}
