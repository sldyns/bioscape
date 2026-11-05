import { safeSceneHash } from "../home/routes.js";
import { readSceneState, sceneHash } from "./state.js";

const STORAGE_KEY = "bioscape-reload-checkpoint";
const entryId = (state, hash) => {
  const meta = state?.bioscape;
  return meta?.hash === hash &&
    typeof meta.id === "string" &&
    meta.id.length > 0 &&
    meta.id.length < 100
    ? meta.id
    : null;
};
const route = (url) => {
  const [path, query = ""] = url.hash.split("?");
  const params = new URLSearchParams(query);
  params.delete("s");
  params.sort();
  return `${url.origin}${url.pathname}${url.search}${path}?${params}`;
};
function targetHash(href, hash) {
  if (!safeSceneHash(hash)) return null;
  const state = readSceneState(hash);
  if (!state) return null;
  const source = new URL(href),
    target = new URL(hash, source);
  return route(source) === route(target) ? sceneHash(hash, state) : null;
}

export function clearSceneReloadCheckpoint(storage) {
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

// A reload may commit the old URL before pagehide can replace it. Keep one
// tab-local checkpoint instead, bound to the full URL and its history entry.
export function saveSceneReloadCheckpoint({
  storage,
  href,
  historyState,
  hash,
}) {
  if (!clearSceneReloadCheckpoint(storage)) return false;
  try {
    const id = entryId(historyState, new URL(href).hash),
      target = targetHash(href, hash);
    if (!id || !target) return false;
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: 1, href, entryId: id, hash: target }),
    );
    return true;
  } catch {
    return false;
  }
}

export function consumeSceneReloadCheckpoint({
  storage,
  href,
  historyState,
  navigationType,
}) {
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    clearSceneReloadCheckpoint(storage);
    return null;
  }
  // Consume on every document startup, including home and shared-link visits.
  if (!clearSceneReloadCheckpoint(storage)) return null;
  try {
    if (navigationType !== "reload" || !raw || raw.length > 50000) return null;
    const saved = JSON.parse(raw),
      id = entryId(historyState, new URL(href).hash);
    if (saved?.v !== 1 || saved.href !== href || !id || saved.entryId !== id)
      return null;
    const hash = targetHash(href, saved.hash);
    return hash
      ? {
          hash,
          state: {
            ...historyState,
            bioscape: { ...historyState.bioscape, hash },
          },
        }
      : null;
  } catch {
    return null;
  }
}

export function restoreSceneReloadCheckpoint(browser = window) {
  try {
    const restored = consumeSceneReloadCheckpoint({
      storage: browser.sessionStorage,
      href: browser.location.href,
      historyState: browser.history.state,
      navigationType:
        browser.performance?.getEntriesByType?.("navigation")?.[0]?.type,
    });
    if (!restored) return false;
    browser.history.replaceState(restored.state, "", restored.hash);
    return true;
  } catch {
    return false;
  }
}
