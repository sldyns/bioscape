import assert from "node:assert/strict";
import { divisionKit } from "./divisionShapes.js";
const k = divisionKit();
const c = k.chromatid(1, 1, k.green);
const surfaces = [];
c.group.traverse((o) => {
  if (o.name === "continuous-chromatid-arm") surfaces.push(o);
});
// At the +X meridian of a middle ring the exterior normal faces +X.
// This prevents a FrontSide core from being culled into an apparent woven cage.
for (const surface of surfaces) {
  assert.ok(
    surface.geometry.attributes.normal.getX(14 * 13) > 0.5,
    "condensed chromosome exterior has outward winding",
  );
}
const junctionA = surfaces[1].geometry.attributes.position;
const junctionB = surfaces[2].geometry.attributes.position;
for (let i = 0; i < 13; i++)
  for (const axis of ["X", "Y", "Z"])
    assert.ok(
      Math.abs(
        junctionA["get" + axis](28 * 13 + i) - junctionB["get" + axis](i),
      ) < 1e-6,
      "exchange junction remains continuous",
    );
const rest = surfaces.map((o) => o.geometry.attributes.position.array.slice());
c.setDeflection(0, -0.2);
assert.ok(
  surfaces[2].geometry.attributes.position.getX(20) < rest[2][60],
  "distal arm trails centromere",
);
const bent = surfaces.map((o) => o.geometry.attributes.position.array.slice());
const version = surfaces[0].geometry.attributes.position.version;
c.setDeflection(0, -0.2);
assert.equal(
  surfaces[0].geometry.attributes.position.version,
  version,
  "unchanged seeks do not rebuild surfaces",
);
c.setDeflection(0, 0);
c.setDeflection(0, -0.2);
surfaces.forEach((o, i) =>
  assert.deepEqual(o.geometry.attributes.position.array, bent[i]),
);
c.setDeflection(0, 0);
surfaces.forEach((o, i) =>
  assert.deepEqual(o.geometry.attributes.position.array, rest[i]),
);
const b = k.bundle();
k.setBundle(b, -2, 0, 0, 0, 1, 0.3);
const bv = b.instanceMatrix.version;
k.setBundle(b, -2, 0, 0, 0, 1, 0.3);
assert.equal(
  b.instanceMatrix.version,
  bv,
  "stationary spindle does not upload again",
);
k.setBundle(b, -2, 0, 0, 0, 1, 0.3, 0.012, 0.2);
assert.ok(
  b.instanceMatrix.version > bv,
  "changed fan curvature invalidates stationary cache",
);
console.log(
  "division rounded junction, lag, absolute seek and stationary buffer checks passed",
);
