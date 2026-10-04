import { THREE } from "../../kit.js";

// Labels are leader endpoints, so their positions follow the represented
// structure or lumen. Placement of the text itself belongs to the player.
export function labelAnchor(root, label, object, localPoint = [0, 0, 0]) {
  const point = new THREE.Vector3();
  return () => {
    object.updateWorldMatrix(true, false);
    point.fromArray(localPoint).applyMatrix4(object.matrixWorld);
    root.worldToLocal(point);
    point.toArray(label.position);
    label.anchorTarget = object.name;
  };
}
