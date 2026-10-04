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
