import { Vector3 } from "three";

// Saved camera zoom uses a stable reference distance. A rotated specimen has
// a different apparent extent, and a tile can be wider than the live viewport.
export function structurePlateCamera({
  camera,
  original,
  rotated,
  tileAspect,
  posedDistance,
  referenceDistance,
}) {
  const from = new Vector3().fromArray(original.direction);
  const to = new Vector3().fromArray(rotated.direction);
  const reference = referenceDistance();
  const scale =
    (original.zoom * reference) / posedDistance(from, camera.aspect);
  const tileCamera = camera.clone();
  tileCamera.aspect = tileAspect;
  const pivot = new Vector3().fromArray(rotated.target);
  tileCamera.position.copy(pivot).add(to);
  tileCamera.lookAt(pivot);
  tileCamera.updateMatrixWorld();
  return {
    view: {
      ...rotated,
      zoom: (scale * posedDistance(to, camera.aspect)) / reference,
    },
    captureView: {
      ...rotated,
      zoom:
        (scale * posedDistance(to, tileAspect)) / referenceDistance(tileCamera),
    },
  };
}
