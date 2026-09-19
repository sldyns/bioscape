// These views show independent molecules sampled from a fluid or enzyme pool.
// Moving them apart would imply that they are subunits of one assembly.
const molecularSamples = new Set([
  "cytosol",
  "stroma",
  "matrix",
  "oxidativeEnzymes",
]);

export function supportsExplosion(id, partCount) {
  return partCount > 1 && !molecularSamples.has(id);
}
