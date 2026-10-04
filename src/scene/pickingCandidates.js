const foregroundFirstNodes = new Set([
  "cell",
  "cytoplasm",
  "plant",
  "bacterium",
  "yeast",
  "paramecium",
  "phage",
]);

const backdropIds = new Set([
  "membrane",
  "cytoplasm",
  "cytosol",
  "cytoskeleton",
  "cellWall",
  "plantMembrane",
  "plantCytoplasm",
  "vacuole",
  "bacterialEnvelope",
  "bacterialCytoplasm",
  "yeastWall",
  "yeastMembrane",
  "paraSurface",
  "paraCilia",
  "phageHead",
]);

// Rebuild when a presentation's topology or hit IDs change. Visibility and
// interactivity can change without a rebuild, so check them on every pick.
// The arrays are scratch storage and remain in their original mesh order.
export function createPickingCandidates(meshes, nodeId) {
  const foregroundFirst = foregroundFirstNodes.has(nodeId);
  const entries = meshes.map((mesh) => ({
    mesh,
    backdrop: foregroundFirst && backdropIds.has(mesh.userData.hitId),
  }));
  const candidates = { primary: [], fallback: [] };
  return () => {
    candidates.primary.length = 0;
    candidates.fallback.length = 0;
    for (const { mesh, backdrop } of entries) {
      if (mesh.userData.nonInteractive) continue;
      let visible = true;
      for (let parent = mesh; parent; parent = parent.parent) {
        if (!parent.visible) {
          visible = false;
          break;
        }
      }
      if (visible)
        (backdrop ? candidates.fallback : candidates.primary).push(mesh);
    }
    return candidates;
  };
}
