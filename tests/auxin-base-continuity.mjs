import auxin from "../src/processes/modules/plantSignals/auxinProcess.js";
import { disposeScene } from "../src/processes/disposeScene.js";
import { assertAuxinBaseContinuity } from "./helpers/auxin-base-continuity.mjs";

const model = auxin.create();
try {
  const result = assertAuxinBaseContinuity(model);
  console.log(
    "Auxin DNA-base continuity and phosphate attachment: PASS",
    result,
  );
} finally {
  disposeScene(model.group);
}
