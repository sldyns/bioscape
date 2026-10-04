// Presentation frameBounds/offsets are fixed by makePresentation. Camera-only
// motion can reuse its ordinary fit; oriented/custom-camera exports cannot.
export function createFramingDistanceCache(compute) {
  let previous = null;
  let distance;
  return {
    get(
      state,
      preserveOrientation = false,
      viewCamera = state.camera,
      separation = null,
    ) {
      if (
        preserveOrientation ||
        viewCamera !== state.camera ||
        separation !== null
      )
        return compute(preserveOrientation, viewCamera, separation);
      const key = [
        state.presentation,
        state.presentation?.parts,
        state.presentation?.parts?.length,
        state.nodeId,
        state.mode,
        state.explode,
        state.camera,
        viewCamera.aspect,
        viewCamera.fov,
        state.minDistance,
      ];
      if (
        previous &&
        key.every((value, index) => Object.is(value, previous[index]))
      )
        return distance;
      const next = compute(preserveOrientation, viewCamera, separation);
      // Commit only after a successful calculation, including for cache misses
      // during resize or view changes. A failed calculation must be retried.
      previous = key;
      distance = next;
      return distance;
    },
    // Call after replacing a presentation, or if its stored framing data ever
    // changes in place. Runtime part position/scale do not alter that data.
    invalidate() {
      previous = null;
    },
  };
}
