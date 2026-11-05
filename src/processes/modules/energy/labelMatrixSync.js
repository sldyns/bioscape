import { Object3D } from "three";

const nativeWorldUpdate = Object3D.prototype.updateWorldMatrix;
const nativeLocalUpdate = Object3D.prototype.updateMatrix;

// Call begin after all pose changes and before a synchronous label pass. Native
// matrix updates only read transforms, so shared ancestors need one refresh in
// that pass. A new pass never reuses matrices from an earlier pose or parent.
export function labelMatrixSync() {
  const updated = new Set();
  function update(object) {
    // Preserve custom update side effects, including transforms changed during
    // the pass. Descendants of an override also stay on the uncached path.
    if (
      object.updateWorldMatrix !== nativeWorldUpdate ||
      object.updateMatrix !== nativeLocalUpdate
    ) {
      updated.clear();
      object.updateWorldMatrix(true, false);
      return false;
    }
    if (updated.has(object)) return true;
    const reusable = object.parent === null || update(object.parent);
    object.updateWorldMatrix(false, false);
    if (reusable) updated.add(object);
    return reusable;
  }
  return { begin: () => updated.clear(), update };
}
