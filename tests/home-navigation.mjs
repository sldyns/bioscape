import assert from "node:assert/strict";
import {
  isHomeHash,
  safeSceneHash,
  resumeSceneHash,
} from "../src/home/routes.js";
import { createSceneHistorySession } from "../src/exploration/historySession.js";
import {
  sceneHash,
  readSceneState,
  sanitizeSceneState,
} from "../src/exploration/state.js";

for (const hash of ["", "#", "#/"]) assert.equal(isHomeHash(hash), true);
for (const hash of [
  "#/plant",
  "#cell/nucleus",
  "#/plant?view=process&process=photosynthesis",
  "#/?s=legacy",
  "#/unknown",
]) {
  assert.equal(isHomeHash(hash), false, `${hash} remains a scene route`);
}
for (const hash of [
  "https://example.org/",
  "javascript:alert(1)",
  "//example.org/",
  "#/",
  "#/cell\n",
  "#/cell#other",
  "#/cell?s=" + "x".repeat(24000),
]) {
  assert.equal(safeSceneHash(hash), null);
}
const snapshot = {
  v: 1,
  lang: "en",
  mode: "explode",
  explode: 42,
  labels: true,
  camera: { direction: [0, 0, 1], target: [1, 2, 3], zoom: 1.6 },
  process: {
    progress: 0.57,
    speed: 0.5,
    parameters: { light: "dark" },
    annotations: false,
  },
  origin: {
    mode: "section",
    explode: 25,
    labels: true,
    camera: { direction: [1, 0, 0], target: [0, 0, 0], zoom: 1.3 },
  },
  compare: {
    left: {
      id: "cell",
      mode: "section",
      explode: 20,
      labels: true,
      view: { direction: [0, 1, 0], target: [1, 0, 0], zoom: 1.2 },
    },
    right: { id: "plant", mode: "whole", explode: 40, labels: false },
  },
};
const hash = sceneHash("#/plant?view=process&process=photosynthesis", snapshot);
const chineseResume = resumeSceneHash(hash, "zh");
assert.equal(
  readSceneState(chineseResume).lang,
  "zh",
  "Resume follows the explicit homepage language choice",
);
assert.deepEqual(
  readSceneState(chineseResume),
  { ...sanitizeSceneState(snapshot), lang: "zh" },
  "changing Resume language preserves all camera, process, structure and comparison data",
);
assert.equal(
  readSceneState(hash).lang,
  "en",
  "the original share/history fragment remains unchanged",
);
assert.equal(
  new URLSearchParams(chineseResume.split("?")[1]).get("process"),
  "photosynthesis",
);
assert.equal(
  readSceneState(
    resumeSceneHash(
      "#/plant?view=process&process=photosynthesis&custom=keep",
      "en",
    ),
  ).lang,
  "en",
);
assert.equal(
  new URLSearchParams(
    resumeSceneHash("#/plant?custom=keep", "zh").split("?")[1],
  ).get("custom"),
  "keep",
  "Resume retains unrelated query parameters",
);
assert.equal(resumeSceneHash(null, "zh"), null);
assert.equal(resumeSceneHash("https://example.org", "zh"), null);
assert.equal(safeSceneHash(hash), hash);
assert.deepEqual(
  readSceneState(hash),
  sanitizeSceneState(snapshot),
  "resume preserves camera, progress, structure origin and both comparison panes",
);
for (const base of ["https://example.org/", "https://example.org/bioscape/"]) {
  const url = new URL(hash, base);
  assert.equal(
    url.pathname,
    new URL(base).pathname,
    "scene hashes retain deployment base",
  );
  assert.equal(new URL("#/", url).pathname, url.pathname);
}
let sequence = 0;
const session = createSceneHistorySession(() => `entry-${++sequence}`);
const first = session.activate(hash, null);
session.remember(snapshot);
// Homepage is outside the scene session. Remounting on Back uses the original
// entry and its latest snapshot, even if the URL preceded a pending debounce.
const latest = {
  ...snapshot,
  process: { ...snapshot.process, progress: 0.83 },
};
session.remember(latest);
assert.deepEqual(session.recall(hash, first), sanitizeSceneState(latest));
const resumeHash = sceneHash(hash, latest);
const resumed = session.activate(resumeHash, null);
session.remember(readSceneState(resumeHash));
assert.notEqual(resumed.bioscape.id, first.bioscape.id);
assert.deepEqual(
  session.recall(hash, first),
  sanitizeSceneState(latest),
  "Resume does not overwrite the earlier Back entry",
);
assert.deepEqual(
  session.recall(resumeHash, resumed),
  sanitizeSceneState(latest),
);
const second = session.begin(hash);
session.remember({ ...snapshot, explode: 90 });
assert.equal(
  session.recall(hash, first).explode,
  42,
  "separate visits to the same scene remain independent",
);
assert.equal(session.recall(hash, second).explode, 90);
assert.equal(
  session.recall(hash, { bioscape: { ...first.bioscape, hash: "#/cell" } }),
  null,
);
console.log(
  "Homepage routing, portable resume state, deployment bases and per-entry history passed.",
);
