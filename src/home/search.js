export function normalizeHomeSearch(text) {
  // Match plain keyboard input to scientific subscripts and accented names.
  // Keep operators, charge signs and arrows intact because they carry meaning.
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
