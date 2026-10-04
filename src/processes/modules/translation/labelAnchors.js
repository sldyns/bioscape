import { THREE } from "../../kit.js";

// Labels store molecular targets; text placement belongs to the shared layout.
export function labelAnchors(bindings) {
  const targets = bindings.map(
    ([label, object, point = new THREE.Vector3()]) => ({
      label,
      object,
      point,
      world: new THREE.Vector3(),
    }),
  );
  return () => {
    for (const { label, object, point, world } of targets)
      object.localToWorld(world.copy(point)).toArray(label.position);
  };
}

export function surfacePoint(mesh) {
  const positions = mesh.geometry.attributes.position;
  return new THREE.Vector3().fromBufferAttribute(
    positions,
    Math.floor(positions.count / 2),
  );
}
