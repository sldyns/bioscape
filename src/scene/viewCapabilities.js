// Samples in a pool are independent. A crista junction and rim belong to
// the same continuous membrane. Neither view has separable components.
const nonExplodable = new Set([
  "cristae",
  "cytosol",
  "stroma",
  "matrix",
  "oxidativeEnzymes",
]);

export function supportsExplosion(id, partCount) {
  return partCount > 1 && !nonExplodable.has(id);
}
