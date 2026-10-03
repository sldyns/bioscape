import assert from "node:assert/strict";
import { createSceneHistorySession } from "../src/exploration/historySession.js";
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
