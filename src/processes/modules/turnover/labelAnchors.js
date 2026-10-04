import { THREE } from "../../kit.js";

// Labels are leaders into the model, not text-layout coordinates. Each setter
// owns one scratch vector; preserve the label and its position array on seek.
// Local points are real mesh centers/endpoints or pre-sampled backbone points.
export function labelAnchors(labels) {
  return labels.map((label) => {
    const point = new THREE.Vector3();
    return (object, x = 0, y = 0, z = 0) => {
      object.localToWorld(point.set(x, y, z)).toArray(label.position);
    };
  });
}
