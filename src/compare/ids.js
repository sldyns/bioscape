import { cellTypes } from "../catalog/cellTypes.js";
import { children } from "../hierarchy.js";
import { specializedSpecimens, specializedSpecimenIds } from "./specimens.js";

// Shared-state validation needs IDs, not the comparison directory's bilingual
// descriptions, references, ancestry records, and search groups. Keep its exact
// first-visit ordering without constructing those directory entries at startup.
export const comparisonIds = [];
const seen = new Set();
function visit(id) {
  if (seen.has(id)) return;
  seen.add(id);
  comparisonIds.push(id);
  for (const child of children[id] || []) visit(child);
}
for (const root of cellTypes)
  if (!specializedSpecimenIds.has(root.id)) visit(root.id);
for (const specimen of specializedSpecimens) {
  comparisonIds.push(specimen.id);
  for (const part of specimen.parts) comparisonIds.push(part.id);
}

const roots = new Set(cellTypes.map(({ id }) => id));
// Context is optional in older links. Validate a supplied full route against the
// live hierarchy; a matching terminal ID alone does not establish its species.
export function normalizeComparisonPath(id, path) {
  if (
    typeof id !== "string" ||
    !Array.isArray(path) ||
    !path.length ||
    path.length > comparisonIds.length ||
    path.at(-1) !== id ||
    !roots.has(path[0])
  )
    return null;
  for (let index = 0; index < path.length; index++) {
    if (
      typeof path[index] !== "string" ||
      (index > 0 && !children[path[index - 1]]?.includes(path[index]))
    )
      return null;
  }
  return [...path];
}
