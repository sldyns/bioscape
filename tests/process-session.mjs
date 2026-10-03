import assert from "node:assert/strict";
import { restoreProcessSession } from "../src/exploration/processSession.js";
const definition = {
  controls: [
    {
      id: "condition",
      default: "normal",
      options: [{ value: "normal" }, { value: "blocked" }],
    },
  ],
};
const source = {
  progress: 0.68,
  speed: 1.5,
  annotations: false,
  parameters: { condition: "blocked", other: "ignore" },
  camera: { direction: [1, 1, 1], target: [0, 0, 0], zoom: 1.2 },
};
const state = restoreProcessSession(definition, source);
assert.equal(state.progress, 0.68);
assert.equal(state.speed, 1.5);
assert.equal(state.annotations, false);
assert.deepEqual(state.parameters, { condition: "blocked" });
assert.ok(Math.abs(Math.hypot(...state.camera.direction) - 1) < 0.00001);
assert.deepEqual(
  restoreProcessSession(definition, {
    progress: Infinity,
    speed: 10,
    parameters: { condition: "wrong" },
    camera: {},
  }),
  {
    progress: 0,
    speed: 1,
    annotations: true,
    camera: undefined,
    parameters: { condition: "normal" },
  },
);
assert.deepEqual(restoreProcessSession({}), {
  progress: 0,
  speed: 1,
  annotations: true,
  camera: undefined,
  parameters: {},
});
assert.equal(restoreProcessSession(definition, { progress: -1 }).progress, 0);
assert.equal(restoreProcessSession(definition, { progress: 7 }).progress, 1);
assert.equal(source.parameters.other, "ignore");
console.log(
  "Process sessions: valid restoration, definition-specific option validation, range guards and input isolation PASS",
);
