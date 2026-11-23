const storageKey = "bioscape-specimen-light";
const listeners = new Set();
let selected;

export function getSpecimenLight() {
  if (!selected) {
    try {
      selected = localStorage.getItem(storageKey) === "side" ? "side" : "soft";
    } catch {
      selected = "soft";
    }
  }
  return selected;
}

export function setSpecimenLight(value) {
  if ((value !== "soft" && value !== "side") || value === getSpecimenLight())
    return;
  selected = value;
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // The selection still applies to every live scene in this tab.
  }
  for (const listener of listeners) listener(value);
}

export function subscribeSpecimenLight(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
