import assert from "node:assert/strict";
import { createSceneHistorySession } from "../src/exploration/historySession.js";
import {
  consumeSceneReloadCheckpoint,
  restoreSceneReloadCheckpoint,
  saveSceneReloadCheckpoint,
} from "../src/exploration/reloadCheckpoint.js";
import { readSceneState, sceneHash } from "../src/exploration/state.js";
let sequence = 0;
const session = createSceneHistorySession(() => `entry-${++sequence}`);
const a = session.activate("#/cell", null);
session.remember({ mode: "section" });
const b = session.begin("#/plant");
session.remember({ mode: "whole", labels: true });
assert.equal(
  session.recall("#/plant", b).mode,
  "whole",
  "A -> B -> Back -> Forward restores edits even without URL state",
);
const c = session.begin("#/bacterium");
session.remember({ mode: "section" });
session.activate("#/plant", b);
session.remember({ mode: "explode", explode: 83 });
session.activate("#/cell", a);
assert.equal(
  session.recall("#/plant", b).explode,
  83,
  "edits after Back override the earlier portable snapshot",
);
session.activate("#/bacterium", c);
const secondB = session.begin("#/plant");
session.remember({ mode: "section", labels: false });
assert.equal(session.recall("#/plant", b).mode, "explode");
assert.equal(
  session.recall("#/plant", secondB).mode,
  "section",
  "same model in separate entries keeps separate views",
);
assert.equal(
  session.recall("#/neuron", secondB),
  null,
  "a manually changed fragment cannot reuse another entry's state",
);
assert.ok(session.isCurrent("#/plant", secondB));
assert.ok(!session.isCurrent("#/plant", b));
const updated = session.updateHash("#/plant?s=portable");
assert.equal(updated.bioscape.id, secondB.bioscape.id);
assert.equal(session.recall("#/plant?s=portable", updated).mode, "section");
assert.equal(
  createSceneHistorySession(() => "fresh").recall("#/plant", b),
  null,
  "a reload falls back to the portable URL",
);
console.log(
  "History sessions: latest edits, Back/Forward, repeated models, fragment isolation and reload fallback PASS",
);

const values = new Map();
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
const original = sceneHash("#/cell?view=process&process=mitosis", {
  process: { progress: 0.5 },
});
const edited = sceneHash(original, {
  process: { progress: 0.5 },
  camera: { direction: [1, 0, 1], target: [0, 0, 0], zoom: 1.2 },
});
const href = `https://example.test/bioscape/?review=1${original}`;
const historyState = {
  scroll: 17,
  bioscape: { id: "scene-one", hash: original, extra: "preserved" },
};
const context = { storage, href, historyState, navigationType: "reload" };
const save = () => saveSceneReloadCheckpoint({ ...context, hash: edited });
assert.equal(save(), true);
const restored = consumeSceneReloadCheckpoint(context);
assert.deepEqual(readSceneState(restored.hash), readSceneState(edited));
assert.equal(restored.state.scroll, 17);
assert.equal(restored.state.bioscape.extra, "preserved");
assert.equal(restored.state.bioscape.id, "scene-one");
assert.equal(restored.state.bioscape.hash, restored.hash);
assert.equal(consumeSceneReloadCheckpoint(context), null, "restore only once");

for (const patch of [
  { navigationType: "navigate" },
  { navigationType: "back_forward" },
  { navigationType: undefined },
  { href: href.replace("review=1", "review=2") },
  { href: href.replace("example.test", "other.test") },
  { href: href.replace("/bioscape/", "/other/") },
  { href: href.replace(original, edited) },
  { href: "https://example.test/bioscape/#/" },
  { historyState: { bioscape: { id: "second-visit", hash: original } } },
  { historyState: { bioscape: { id: "scene-one", hash: "#/plant" } } },
]) {
  assert.equal(save(), true);
  assert.equal(consumeSceneReloadCheckpoint({ ...context, ...patch }), null);
  assert.equal(values.size, 0, "every document consumes obsolete checkpoints");
}
for (const hash of [
  sceneHash("#/plant", { mode: "whole" }),
  sceneHash("#/cell?view=process&process=meiosis", { labels: true }),
  sceneHash("#/cell?view=process&process=mitosis&extra=1", { labels: true }),
  "https://other.test/#/cell",
  "#/cell?s=invalid",
  null,
]) {
  save();
  assert.equal(saveSceneReloadCheckpoint({ ...context, hash }), false);
  assert.equal(values.size, 0, "invalid saves cannot leave an earlier draft");
}
for (const raw of ["{", "null", JSON.stringify({ v: 2 }), "x".repeat(50001)]) {
  values.set("bioscape-reload-checkpoint", raw);
  assert.equal(consumeSceneReloadCheckpoint(context), null);
  assert.equal(values.size, 0);
}
const unavailable = {
  getItem() {
    throw new Error("unavailable");
  },
  setItem() {
    throw new Error("unavailable");
  },
  removeItem() {
    throw new Error("unavailable");
  },
};
assert.equal(
  saveSceneReloadCheckpoint({ ...context, storage: unavailable, hash: edited }),
  false,
);
assert.equal(
  consumeSceneReloadCheckpoint({ ...context, storage: unavailable }),
  null,
);
save();
assert.equal(
  saveSceneReloadCheckpoint({
    ...context,
    storage: { ...storage, setItem: unavailable.setItem },
    hash: edited,
  }),
  false,
);
assert.equal(values.size, 0, "a quota failure also removes the old checkpoint");

save();
const calls = [];
const browser = {
  sessionStorage: storage,
  location: { href },
  history: { state: historyState, replaceState: (...args) => calls.push(args) },
  performance: { getEntriesByType: () => [{ type: "reload" }] },
};
assert.equal(restoreSceneReloadCheckpoint(browser), true);
assert.equal(restoreSceneReloadCheckpoint(browser), false);
assert.equal(
  calls.length,
  1,
  "startup replaces the current entry exactly once",
);
assert.equal(calls[0][2], edited);
save();
assert.equal(
  restoreSceneReloadCheckpoint({ ...browser, performance: undefined }),
  false,
);
assert.equal(values.size, 0, "missing navigation timing falls back to the URL");
console.log(
  "Reload checkpoint: rapid edits, one-shot restore, entry/link isolation and unavailable storage PASS",
);
