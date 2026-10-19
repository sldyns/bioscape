import repair from "../src/processes/modules/genome/dnaRepairProcess.js";
import { disposeScene } from "../src/processes/disposeScene.js";
import { assertRepairBaseContinuity } from "./helpers/repair-base-continuity.mjs";

for (const rootId of ["cell", "plant", "yeast"]) {
  const model = repair.create({ rootId });
  model.group.position.set(0.3, -0.2, 0.4);
  model.group.rotation.set(0.12, -0.23, 0.18);
  model.group.scale.set(1.07, 0.94, 1.03);
  try {
    console.log(rootId, JSON.stringify(assertRepairBaseContinuity(model)));
  } finally {
    disposeScene(model.group);
  }
}
