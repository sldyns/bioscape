import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as T from "three";
import {
  buildMuscleFibre,
  muscleDimensions,
  muscleMyofibrilCentres,
  sarcomereAnatomy,
} from "../src/compare/models/muscle.js";
import { muscleMetadata } from "../src/compare/models/muscleMetadata.js";
const ids = ["muscleFibre", ...muscleMetadata.parts.map((p) => p.id)];
function signature(g) {
  const hash = createHash("sha256");
  g.traverse((o) => {
    if (o.isMesh) {
      hash.update(o.geometry.attributes.position.array);
      hash.update(o.userData.hitId);
    }
  });
  return hash.digest("hex");
}
const results = [];
for (const id of ids) {
  const g = buildMuscleFibre(id);
  assert(g?.isGroup);
  const allowed = new Set(id === "muscleFibre" ? ids : [id]);
  let meshes = 0,
    triangles = 0,
    caps = 0,
    cutOnly = 0;
  g.traverse((o) => {
    assert(!o.isInstancedMesh);
    if (!o.isMesh) return;
    meshes++;
    triangles +=
      (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
    assert(allowed.has(o.userData.hitId), o.userData.hitId);
    for (const attr of Object.values(o.geometry.attributes))
      assert(attr.array.every(Number.isFinite), `${id}: nonfinite buffer`);
    caps += !!o.userData.cap;
    cutOnly += !!o.userData.cutOnly;
  });
  const size = new T.Box3().setFromObject(g).getSize(new T.Vector3());
  assert(size.toArray().every((n) => Number.isFinite(n) && n > 0));
  assert(Math.max(...size.toArray()) < 8);
  assert(meshes <= 30);
  assert(
    triangles <
      (id === "muscleFibre"
        ? 350000
        : id === "muscleFibreSarcomere"
          ? 250000
          : 450000),
  );
  assert(g.userData.biology.singleCell);
  assert(g.userData.biology.croppedSegment);
  assert(g.userData.biology.nucleiPeripheral);
  const before = signature(g);
  g.updateMatrixWorld(true);
  assert.equal(signature(g), before);
  if (["muscleFibre", "muscleFibreNuclei", "muscleFibreTriads"].includes(id))
    assert(caps > 0);
  if (id === "muscleFibre") {
    for (const p of muscleMetadata.parts) assert(g.userData.partAnchors[p.id]);
    assert.equal(g.userData.biology.nuclei, 9);
    assert.equal(g.userData.biology.myofibrils, 91);
  }
  if (id === "muscleFibreSarcomere") {
    const parts = new Map(g.children.map((o) => [o.userData.anatomyRole, o]));
    for (const role of [
      "thickFilament",
      "thinFilament",
      "myosinHeads",
      "zDisc",
      "mLine",
      "titin",
    ])
      assert(parts.has(role));
    const thick = parts.get("thickFilament").geometry;
    thick.computeBoundingBox();
    assert(
      Math.abs(thick.boundingBox.min.x - sarcomereAnatomy.thickLeft) < 1e-5,
    );
    assert(
      Math.abs(thick.boundingBox.max.x - sarcomereAnatomy.thickRight) < 1e-5,
    );
    const thin = parts.get("thinFilament").geometry.attributes.position;
    let thinMinAbs = Infinity;
    for (let i = 0; i < thin.count; i++)
      thinMinAbs = Math.min(thinMinAbs, Math.abs(thin.getX(i)));
    assert(
      Math.abs(thinMinAbs - sarcomereAnatomy.thinRightTip) < 1e-4,
      "Actual actin geometry must leave the stated H region empty",
    );
    const heads = parts.get("myosinHeads").geometry.attributes.position;
    for (let i = 0; i < heads.count; i++)
      assert(
        Math.abs(heads.getX(i)) >= sarcomereAnatomy.bareHalfLength,
        "Heads must not enter the central bare zone",
      );
    const again = buildMuscleFibre(id);
    assert.equal(signature(again), before, "factory geometry deterministic");
    again.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
  }
  results.push({ id, meshes, triangles, caps, cutOnly });
  g.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
}
assert.equal(muscleMyofibrilCentres().length, 91);
assert(
  Math.abs(
    muscleDimensions.sarcomeres * muscleDimensions.sarcomereLength -
      muscleDimensions.length,
  ) < 1e-10,
);
assert(sarcomereAnatomy.zLeft < sarcomereAnatomy.thickLeft);
assert(sarcomereAnatomy.thickLeft < sarcomereAnatomy.thinLeftTip);
assert(sarcomereAnatomy.thinLeftTip < 0);
assert(sarcomereAnatomy.thinRightTip > 0);
assert(sarcomereAnatomy.thinRightTip < sarcomereAnatomy.thickRight);
assert(sarcomereAnatomy.thickRight < sarcomereAnatomy.zRight);
assert(sarcomereAnatomy.bareHalfLength < sarcomereAnatomy.thinRightTip);
console.log(JSON.stringify({ status: "pass", models: results }, null, 2));
