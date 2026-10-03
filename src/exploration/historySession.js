import { sanitizeSceneState } from "./state.js";

// A URL is a portable snapshot. Within one browsing session, each history entry
// additionally remembers the latest view the person left there. Key by entry,
// not by model, so two visits to the same model remain independently restorable.
let entrySequence = 0;
const nextEntryId = () =>
  globalThis.crypto?.randomUUID?.() || `scene-${Date.now()}-${++entrySequence}`;
export function createSceneHistorySession(makeId = nextEntryId) {
  const entries = new Map();
  let current = null;
  const key = (hash, state) => {
    const meta = state?.bioscape;
    return meta?.hash === hash &&
      typeof meta.id === "string" &&
      meta.id.length < 100
      ? meta.id
      : null;
  };
  const metadata = (hash) => ({ bioscape: { id: current, hash } });
  return {
    activate(hash, state) {
      current = key(hash, state) || makeId();
      return metadata(hash);
    },
    begin(hash) {
      current = makeId();
      return metadata(hash);
    },
    remember(snapshot) {
      if (current) entries.set(current, sanitizeSceneState(snapshot));
    },
    recall(hash, state) {
      return entries.get(key(hash, state)) || null;
    },
    updateHash(hash) {
      current ||= makeId();
      return metadata(hash);
    },
    isCurrent(hash, state) {
      return current !== null && key(hash, state) === current;
    },
  };
}
