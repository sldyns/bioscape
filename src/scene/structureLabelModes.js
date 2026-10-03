// Some structures are exposed only after removing an opaque enclosing surface.
// Use the same anatomical visibility rules in the viewer and exported frames.
export function isStructureLabelVisible(label, mode) {
  return (
    !Array.isArray(label?.visibleModes) || label.visibleModes.includes(mode)
  );
}

export function structureCaptureMode(liveMode, separation = null) {
  if (separation === null) return liveMode;
  if (separation > 0) return "explode";
  return liveMode === "explode" ? "section" : liveMode;
}
