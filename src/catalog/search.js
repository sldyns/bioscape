// Keep charge signs and reaction arrows while accepting subscripts and unaccented input.
export function normalizeSearch(text) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
