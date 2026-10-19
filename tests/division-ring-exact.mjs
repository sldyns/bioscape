import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { divisionKit } from "../src/processes/modules/division/divisionShapes.js";

function stateHash(root) {
  root.updateMatrixWorld(true);
  const hash = createHash("sha256");
  const numbers = (values) =>
    hash.update(Buffer.from(new Float64Array(values).buffer));
  root.traverse((object) => {
    hash.update(object.type + ":" + object.name);
    numbers([
      +object.visible,
      ...object.matrix.elements,
      ...object.matrixWorld.elements,
    ]);
    const geometry = object.geometry;
    for (const [name, attribute] of Object.entries(
      geometry?.attributes ?? {},
    )) {
      hash.update(name);
      hash.update(
        Buffer.from(
          attribute.array.buffer,
          attribute.array.byteOffset,
          attribute.array.byteLength,
        ),
      );
      numbers([
        attribute.itemSize,
        attribute.count,
        attribute.version,
        +attribute.normalized,
      ]);
      for (const range of attribute.updateRanges)
        numbers([range.start, range.count]);
    }
    for (const attribute of [geometry?.index, object.instanceMatrix]) {
      if (!attribute) continue;
      hash.update(
        Buffer.from(
          attribute.array.buffer,
          attribute.array.byteOffset,
          attribute.array.byteLength,
        ),
      );
      numbers([attribute.version]);
      for (const range of attribute.updateRanges)
        numbers([range.start, range.count]);
    }
    if (geometry) numbers([geometry.drawRange.start, geometry.drawRange.count]);
    for (const owner of [geometry, object]) {
      if (owner?.boundingBox)
        numbers([
          ...owner.boundingBox.min.toArray(),
          ...owner.boundingBox.max.toArray(),
        ]);
      if (owner?.boundingSphere)
        numbers([
          ...owner.boundingSphere.center.toArray(),
          owner.boundingSphere.radius,
        ]);
    }
  });
  return hash.digest("hex");
}

// Exported only so the QA fixture generator can use the independent frozen V2
// factory. The checked-in golden contains hashes, not runtime product output.
export function captureRingSequence(factory) {
  const kit = factory();
  const rings = Array.from({ length: 3 }, () => kit.contractileRing());
  const formulas = [
    (angle) => 1 + 0.11 * Math.sin(angle * 3) + 0.03 * Math.cos(angle * 7),
    (angle) => 0.71 + 0.22 * Math.cos(angle) ** 2 + 0.06 * Math.sin(angle * 5),
    () => -0,
    (angle) => -0.13 - 0.07 * Math.sin(angle * 2),
  ];
  const actions = [
    ["fit", 0, false],
    ["fit", 1, false],
    ["fit", 1, true],
    ["reset"],
    ["reset"],
    ["fit", 2, false],
    ["fit", 3, true],
    ["fit", 0, true],
    ["fit", 0, false],
    ["fit", 0, true],
    ["reset"],
    ["reset"],
  ];
  const output = { constructor: stateHash(kit.group), states: [] };
  for (const [actionIndex, [kind, formula, changed]] of actions.entries()) {
    for (let ring = 0; ring < rings.length; ring++) {
      kit.group.position.set(0.2, -0.1, actionIndex * 0.03);
      kit.group.rotation.set(0.13, -0.2, actionIndex * 0.1);
      kit.group.scale.set(1.07, 0.93, 1.12);
      let queries = 0;
      if (kind === "reset") rings[ring].resetContour();
      else {
        rings[ring].fitContour((angle) => {
          assert.equal(angle, (queries * Math.PI * 2) / 100);
          queries++;
          return formulas[formula](angle);
        }, changed);
        if (actionIndex === 0 || actionIndex === 5)
          assert.equal(queries, 100, "first fit runs even when changed=false");
        if (actionIndex === 1 || actionIndex === 8)
          assert.equal(queries, 0, "unchanged contour does not call callback");
      }
      output.states.push({
        actionIndex,
        ring,
        queries,
        hash: stateHash(kit.group),
      });
    }
  }
  return output;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const fixture = JSON.parse(
    readFileSync(
      new URL("./fixtures/division-ring-v2-exact.json", import.meta.url),
    ),
  );
  const actual = captureRingSequence(divisionKit);
  assert.equal(actual.states.length, 36);
  assert.deepEqual(actual, fixture.expected);
  console.log(
    "division ring exact: constructor and 36 contour/reset states passed",
  );
}
