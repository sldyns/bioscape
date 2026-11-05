import assert from "node:assert/strict";
import auxin from "./auxinProcess.js";
import { annotationNumbers } from "../../labelLayout.js";

const model = auxin.create();
const ligand = model.group.getObjectByName("auxin-ligand"),
  repressor = model.group.getObjectByName("aux-iaa");
const ligandIndex = model.labels.findIndex(
  (label) => label.text.zh === "生长素",
);
assert(
  ligand && repressor && ligandIndex >= 0,
  "actual ligand and repressor required",
);
const visible = (object) =>
  object.visible && (!object.parent || visible(object.parent));
const references = new Map();
for (const [progress, condition] of [
  [0.52, "present"],
  [0.52, "low"],
  [0.52, "present"],
  [0.88, "present"],
  [0.88, "low"],
  [0.7, "present"],
  [0.52, "present"],
  [0, "low"],
  [0, "present"],
  [0.88, "low"],
]) {
  model.update(progress, { auxin: condition });
  model.group.updateMatrixWorld(true);
  const present = condition === "present",
    label = model.labels[ligandIndex];
  assert.equal(
    visible(ligand),
    present,
    "ligand is absent in the low-auxin control",
  );
  assert.equal(
    label.active,
    present,
    "annotation follows actual ligand visibility",
  );
  for (const language of ["en", "zh", "en"]) {
    const numbers = annotationNumbers(model.labels, language);
    if (present) {
      assert(
        Number.isInteger(numbers[ligandIndex]),
        `${language}: molecular auxin label remains numbered`,
      );
      if (progress === 0.52)
        assert.equal(
          numbers[ligandIndex],
          7,
          `${language}: middle-stage key is 7`,
        );
    } else {
      assert.equal(
        numbers[ligandIndex],
        null,
        "low-auxin branch has no ligand key",
      );
      assert(
        visible(repressor),
        "low-auxin control retains the real repressor",
      );
    }
    const activeNumbers = numbers.filter((number) => number !== null);
    assert.deepEqual(
      activeNumbers,
      activeNumbers.map((_, index) => index + 1),
      "condition and stage transitions do not leave holes in the legend",
    );
    const key = `${progress}:${condition}:${language}`,
      state = { active: label.active, anchor: [...label.position], numbers };
    if (references.has(key))
      assert.deepEqual(
        state,
        references.get(key),
        "seek/condition round trip restores annotations",
      );
    else references.set(key, state);
  }
}
console.log(
  "S214-plantSignals: auxin key and actual low-control visibility survive condition/language/seek transitions",
);
