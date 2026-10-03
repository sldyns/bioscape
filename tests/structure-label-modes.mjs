import assert from "node:assert/strict";
import {
  isStructureLabelVisible,
  structureCaptureMode,
} from "../src/scene/structureLabelModes.js";

const internal = { visibleModes: ["section", "explode"] };
assert.equal(isStructureLabelVisible(internal, "whole"), false);
assert.equal(isStructureLabelVisible(internal, "section"), true);
assert.equal(isStructureLabelVisible(internal, "explode"), true);
assert.equal(isStructureLabelVisible({}, "whole"), true);
assert.equal(
  isStructureLabelVisible({ visibleModes: ["section"] }, "explode"),
  false,
);

// A disassembly export temporarily changes cap visibility. Its annotations must
// describe that captured geometry, rather than the unchanged live UI mode.
assert.equal(structureCaptureMode("whole", null), "whole");
assert.equal(structureCaptureMode("whole", 0), "whole");
assert.equal(structureCaptureMode("whole", 0.4), "explode");
assert.equal(structureCaptureMode("explode", 0), "section");
assert.equal(structureCaptureMode("section", 0), "section");
assert.equal(
  isStructureLabelVisible(internal, structureCaptureMode("whole", 0)),
  false,
);
assert.equal(
  isStructureLabelVisible(internal, structureCaptureMode("whole", 0.4)),
  true,
);
console.log(
  "Structure annotations: opaque whole views and temporary export modes PASS",
);
