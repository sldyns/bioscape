import assert from "node:assert/strict";
import {
  readSceneState,
  sceneHash,
  sanitizeSceneState,
} from "../src/exploration/state.js";

const state = {
  lang: "en",
  mode: "explode",
  explode: 42,
  labels: true,
  contracted: false,
  camera: { direction: [0, 0, 1], target: [0, 0, 0], zoom: 1.25 },
  process: {
    progress: 0.57,
    speed: 0.5,
    parameters: { light: "dark" },
    annotations: false,
  },
  compare: {
    left: {
      id: "cell",
      mode: "section",
      explode: 60,
      labels: false,
      view: { direction: [1, 0, 0], target: [0, 0, 0], zoom: 1 },
    },
    right: { id: "neuron", mode: "whole", explode: 0, labels: true },
    sync: true,
  },
};
const route = "#/plant/chloroplast?view=process&process=photosynthesis";
const hash = sceneHash(route, state);
assert(hash.startsWith(route + "&s="));
assert.deepEqual(readSceneState(hash), sanitizeSceneState(state));
assert.equal(
  "sync" in readSceneState(hash).compare,
  false,
  "legacy comparison links lose synchronization while preserving both views",
);
assert.deepEqual(
  readSceneState(hash).compare.left.view,
  state.compare.left.view,
);
assert.equal(
  sceneHash(hash, state),
  hash,
  "Sharing a shared scene does not nest state",
);
assert.equal(readSceneState("#/cell?s=%"), null);
assert.equal(readSceneState("#/cell?s=" + encodeURIComponent('{"v":9}')), null);
assert.equal(readSceneState("#/cell?s=" + "x".repeat(20000)), null);
const invalid = sanitizeSceneState({
  lang: "xx",
  mode: "javascript:",
  explode: Infinity,
  camera: { direction: [0, 0, 0], target: [0, 0, 0], zoom: 1 },
  process: {
    progress: 99,
    speed: 8,
    parameters: JSON.parse('{"__proto__":"x","constructor":"x","good":"low"}'),
  },
  compare: { left: { id: "<script>" }, right: { id: "plant" } },
});
assert.equal(invalid.lang, "zh");
assert.equal(invalid.mode, "section");
assert.equal(invalid.camera, undefined);
assert.equal(invalid.process.progress, 1);
assert.equal(invalid.process.speed, 1);
assert.deepEqual(invalid.process.parameters, { good: "low" });
assert.equal(invalid.compare, undefined);
assert.equal(sanitizeSceneState(null).mode, "section");
assert.equal(
  sanitizeSceneState({
    camera: { direction: [0, 0, 1], target: [120, 0, 0], zoom: 0.2 },
  }).camera.zoom,
  0.2,
  "valid renderer views survive sharing",
);
assert.equal(
  sanitizeSceneState({
    camera: { direction: [0, 0, 1], target: [0, 0, 0], zoom: -1 },
  }).camera,
  undefined,
);
console.log(
  "Scene sharing: round-trip, duplicate state, malformed and untrusted values PASS",
);
