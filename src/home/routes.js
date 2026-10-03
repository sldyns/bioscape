import { readSceneState, sceneHash } from "../exploration/state.js";

// Only these empty routes are home. Legacy hashes (including query-only shared
// scene links) continue through the existing scene parser unchanged.
export const isHomeHash = (hash) => ["", "#", "#/"].includes(hash);

export const RESUME_STORAGE_KEY = "bioscape-last-scene";

// Resume data is an internal fragment, never a URL supplied to location.href.
export function safeSceneHash(value) {
  return typeof value === "string" &&
    value.length <= 24000 &&
    /^#\/?[a-zA-Z][a-zA-Z0-9/]*(?:\?[^\s#]*)?$/.test(value)
    ? value
    : null;
}

// Only an explicit homepage Resume applies its selected language. Original
// shared links and existing history entries retain their serialized language.
export function resumeSceneHash(hash, lang) {
  const safe = safeSceneHash(hash);
  return safe
    ? sceneHash(safe, { ...(readSceneState(safe) || {}), lang })
    : null;
}
