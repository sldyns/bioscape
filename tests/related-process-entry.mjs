import assert from "node:assert/strict";
import { prepareRelatedProcessEntry } from "../src/exploration/relatedProcessEntry.js";

assert.deepEqual(
  prepareRelatedProcessEntry(null, {
    entryProgress: 0.4,
    entryParameters: { strategy: "cam" },
  }),
  { progress: 0.4, parameters: { strategy: "cam" } },
);
const remembered = {
  progress: 0.8,
  speed: 0.5,
  parameters: { strategy: "c4", light: "dim" },
  camera: { zoom: 1.1 },
};
const differentBranch = prepareRelatedProcessEntry(remembered, {
  entryProgress: 0.4,
  entryParameters: { strategy: "cam" },
});
assert.equal(differentBranch.progress, 0.4);
assert.deepEqual(differentBranch.parameters, { strategy: "cam", light: "dim" });
assert.equal(differentBranch.speed, 0.5);
assert.deepEqual(remembered.parameters, { strategy: "c4", light: "dim" });
assert.equal(
  prepareRelatedProcessEntry(differentBranch, {
    entryProgress: 0,
    entryParameters: { strategy: "cam" },
  }).progress,
  0.4,
);
assert.deepEqual(prepareRelatedProcessEntry(remembered, {}), remembered);
console.log(
  "Related process entries: fresh parameters, branch-specific seek, same-branch resume and nonmutation PASS",
);
