import assert from "node:assert/strict";
import * as T from "three";
import budding from "../src/processes/modules/yeastLife/yeastBuddingProcess.js";
import division from "../src/processes/modules/parameciumLife/parameciumDivisionProcess.js";
const failures = [];
const check = (name, fn) => {
  try {
    fn();
    console.log("PASS", name);
  } catch (e) {
    failures.push({ name, error: e.message });
    console.error("FAIL", name, e.message);
  }
};
function directSpheres(model, color) {
  return model.group.children.filter(
    (o) =>
      o.isMesh &&
      o.geometry.type === "SphereGeometry" &&
      o.material.color.getHexString() === color,
  );
}
function update(m, p) {
  m.update(p);
  m.group.updateMatrixWorld(true);
}
function effectiveVisible(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}
function revolvedContains(o, p, columns, margin = 0.003) {
  const q = p.clone().applyMatrix4(o.matrixWorld.clone().invert()),
    a = o.geometry.attributes.position;
  for (let i = 0; i < a.count - columns - 1; i += columns + 1) {
    const j = i + columns + 1,
      x0 = a.getX(i),
      x1 = a.getX(j);
    if (
      q.x < Math.min(x0, x1) - 1e-6 ||
      q.x > Math.max(x0, x1) + 1e-6 ||
      Math.abs(x1 - x0) < 1e-8
    )
      continue;
    const t = (q.x - x0) / (x1 - x0),
      r =
        Math.hypot(a.getY(i), a.getZ(i)) * (1 - t) +
        Math.hypot(a.getY(j), a.getZ(j)) * t;
    return Math.hypot(q.y, q.z) <= r + margin;
  }
  return false;
}
function sphereContains(o, p) {
  return (
    p.clone().applyMatrix4(o.matrixWorld.clone().invert()).lengthSq() <= 1.0001
  );
}
function allVertices(o, fn) {
  const a = o.geometry.attributes.position;
  for (let j = 0; j < a.count; j++)
    fn(new T.Vector3().fromBufferAttribute(a, j).applyMatrix4(o.matrixWorld));
}
const bud = budding.create(),
  vesicles = directSpheres(bud, "57988e"),
  dna = directSpheres(bud, "777da3");
assert.equal(vesicles.length, 8);
assert.equal(dna.length, 8);
check("budding vesicle resets occur only at zero rendered size", () => {
  for (let i = 0; i < 8; i++)
    for (let k = 1; k <= 3; k++) {
      const t = (k - i / 8) / 3;
      if (t <= 0.07 || t >= 0.68) continue;
      update(bud, t - 1e-6);
      const before = vesicles[i].position.clone(),
        bs = vesicles[i].scale.x;
      update(bud, t + 1e-6);
      const after = vesicles[i].position.clone(),
        as = vesicles[i].scale.x;
      if (before.distanceTo(after) > 0.05)
        assert(
          Math.max(bs, as) < 1e-4,
          "visible recycled vesicle traverses the full cell in one step",
        );
      update(bud, t);
      assert(
        vesicles[i].scale.x < 1e-10,
        "carrier is zero-size at its wrap instant",
      );
    }
});
check(
  "budding transport remains present throughout its active interval",
  () => {
    for (let step = 9; step < 67; step++) {
      update(bud, step / 100);
      assert(vesicles.some((o) => effectiveVisible(o) && o.scale.x > 0.02));
    }
  },
);
check("budding DNA stays continuous through daughter-nucleus handoff", () => {
  update(bud, 0.75 - 1e-6);
  const before = dna.map((o) => o.position.clone());
  update(bud, 0.75 + 1e-6);
  assert(
    dna.every((o, i) => o.position.distanceTo(before[i]) < 0.001),
    "DNA position jumps at the envelope handoff",
  );
});
check(
  "budding DNA geometry stays inside its visible nucleus throughout segregation",
  () => {
    const envelope = bud.group.getObjectByName(
        "budding-continuous-nuclear-envelope",
      ),
      daughters = ["budding-mother-nucleus", "budding-daughter-nucleus"].map(
        (n) => bud.group.getObjectByName(n),
      );
    assert.equal(daughters.length, 2);
    for (let step = 340; step <= 1000; step += 3) {
      const p = step / 1000;
      update(bud, p);
      for (const o of dna.filter(effectiveVisible))
        allVertices(o, (v) =>
          assert(
            p < 0.75
              ? revolvedContains(envelope, v, 48)
              : daughters.some((n) => sphereContains(n, v)),
            `DNA vertex outside nucleus at ${p}`,
          ),
        );
    }
  },
);
const para = division.create(),
  granules = directSpheres(para, "8a7197");
assert.equal(granules.length, 18);
check("macronuclear granules remain continuous at bridge handoff", () => {
  update(para, 0.59 - 1e-6);
  const before = granules.map((o) => o.position.clone());
  update(para, 0.59 + 1e-6);
  assert(
    granules.every((o, i) => o.position.distanceTo(before[i]) < 0.001),
    "granule jumps across macronucleus at p=.59",
  );
});
check(
  "macronuclear granules remain inside current envelope and end on opposite sides",
  () => {
    const spheres = [
        "division-mother-macronucleus",
        "daughter-macronucleus-0",
        "daughter-macronucleus-1",
      ].map((n) => para.group.getObjectByName(n)),
      mother = spheres[0],
      daughters = spheres.slice(1),
      bridge = para.group.getObjectByName("continuous-macronuclear-envelope");
    for (let step = 0; step <= 1000; step += 3) {
      const p = step / 1000;
      update(para, p);
      for (const o of granules)
        allVertices(o, (v) =>
          assert(
            p < 0.59
              ? sphereContains(mother, v)
              : p < 0.76
                ? revolvedContains(bridge, v, 32)
                : daughters.some((n) => sphereContains(n, v)),
            `granule vertex outside nucleus at ${p}`,
          ),
        );
    }
    update(para, 1);
    assert(granules.slice(0, 9).every((o) => o.position.y < 0));
    assert(granules.slice(9).every((o) => o.position.y > 0));
  },
);
check("seeks reproduce positions and preserve resource identities", () => {
  for (const model of [bud, para]) {
    const inventory = () => {
      const out = [];
      model.group.traverse((o) => {
        out.push(o.uuid);
        if (o.isMesh) out.push(o.geometry.uuid, o.material.uuid);
      });
      return out;
    };
    const base = inventory();
    const state = () => {
      const out = [];
      model.group.traverse((o) =>
        out.push([o.visible, ...o.position.toArray(), ...o.scale.toArray()]),
      );
      return out;
    };
    update(model, 0.74);
    const first = state();
    update(model, 1);
    update(model, 0);
    update(model, 0.59);
    update(model, 0.74);
    assert.deepEqual(state(), first);
    assert.deepEqual(inventory(), base);
  }
});
for (const model of [bud, para]) {
  const geos = new Set(),
    mats = new Set();
  model.group.traverse((o) => {
    if (o.isMesh) {
      geos.add(o.geometry);
      mats.add(o.material);
    }
  });
  geos.forEach((g) => g.dispose());
  mats.forEach((m) => m.dispose());
}
assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
