import assert from "node:assert/strict";
import * as T from "three";
import { MeshBVH } from "three-mesh-bvh";
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
function innerShellContainment(envelopes) {
  const cache = new Map(),
    direction = new T.Vector3(0.372, 0.615, 0.695).normalize(),
    ray = new T.Ray(new T.Vector3(), direction),
    local = new T.Vector3();
  let shells = [];
  function fullShell(source) {
    let entry = cache.get(source);
    if (!entry) {
      const count = source.attributes.position.count,
        geometry = new T.BufferGeometry(),
        indices = [];
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(new Float32Array(count * 6), 3),
      );
      // The displayed inner leaflet is a rear cutaway. Reflect its actual
      // indexed triangles across local z=0 to recover the full physical shell.
      // Reflection reverses handedness, so reverse the mirrored winding too.
      for (let i = 0; i < source.index.count; i += 3) {
        const a = source.index.getX(i),
          b = source.index.getX(i + 1),
          c = source.index.getX(i + 2);
        indices.push(a, b, c, a + count, c + count, b + count);
      }
      geometry.setIndex(indices);
      entry = {
        geometry,
        count,
        version: -1,
        indexVersion: source.index.version,
      };
      cache.set(source, entry);
    }
    assert.equal(source.index.version, entry.indexVersion);
    const position = source.attributes.position;
    if (entry.version !== position.version) {
      const out = entry.geometry.attributes.position;
      for (let i = 0; i < entry.count; i++) {
        const x = position.getX(i),
          y = position.getY(i),
          z = position.getZ(i);
        assert(z <= 1e-7, "inner leaflet must use the documented rear cutaway");
        out.setXYZ(i, x, y, z);
        out.setXYZ(i + entry.count, x, y, -z);
      }
      out.needsUpdate = true;
      entry.geometry.computeBoundingBox();
      if (entry.bvh) entry.bvh.refit();
      else entry.bvh = new MeshBVH(entry.geometry);
      entry.version = position.version;
    }
    return entry;
  }
  return {
    prepare() {
      shells = envelopes.filter(effectiveVisible).map((outer) => {
        const inner = outer.children[0];
        assert(inner?.isMesh, "visible nucleus must retain its inner leaflet");
        return {
          inner,
          entry: fullShell(inner.geometry),
          inverse: inner.matrixWorld.clone().invert(),
        };
      });
      assert(shells.length > 0);
      return shells;
    },
    contains(point) {
      return shells.some(({ entry, inverse }) => {
        local.copy(point).applyMatrix4(inverse);
        // The box only rejects distant points. Acceptance requires the first
        // actual triangle intersection to be an exit from the oriented shell.
        if (!entry.geometry.boundingBox.containsPoint(local)) return false;
        ray.origin.copy(local);
        const hit = entry.bvh.raycastFirst(ray, T.DoubleSide);
        return !!hit && hit.face.normal.dot(direction) > 0;
      });
    },
    dispose() {
      for (const { geometry } of cache.values()) geometry.dispose();
    },
  };
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
  granules = directSpheres(para, "8a7197"),
  macronuclearShells = innerShellContainment(
    [
      "division-mother-macronucleus",
      "continuous-macronuclear-envelope",
      "daughter-macronucleus-0",
      "daughter-macronucleus-1",
    ].map((name) => para.group.getObjectByName(name)),
  );
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
    let poses = 0,
      vertices = 0;
    for (let step = 0; step <= 1000; step += 3) {
      const p = step / 1000;
      update(para, p);
      macronuclearShells.prepare();
      poses++;
      for (const o of granules)
        allVertices(o, (v) => {
          vertices++;
          assert(
            macronuclearShells.contains(v),
            `granule vertex outside nucleus at ${p}`,
          );
        });
    }
    assert.equal(poses, 334);
    assert.equal(vertices, 2555100);
    update(para, 1);
    assert(granules.slice(0, 9).every((o) => o.position.y < 0));
    assert(granules.slice(9).every((o) => o.position.y > 0));
  },
);
check("actual inner-shell oracle rejects injected granule escape", () => {
  for (const p of [0, 0.591, 0.74, 0.8, 1]) {
    update(para, p);
    const [{ inner, entry }] = macronuclearShells.prepare(),
      bounds = entry.geometry.boundingBox,
      center = bounds.getCenter(new T.Vector3()),
      extent = bounds.getSize(new T.Vector3()).multiplyScalar(0.5),
      escaped = center.addScaledVector(extent, 0.85),
      granule = granules[0],
      original = granule.position.clone();
    // At the narrow bridge, also reject a point on the equatorial plane
    // well inside the full bounding box but outside the actual neck.
    if (p === 0.74) escaped.set(extent.x * 0.7, 0, 0);
    assert(bounds.containsPoint(escaped), "negative control must defeat a box");
    escaped.applyMatrix4(inner.matrixWorld);
    assert(!macronuclearShells.contains(escaped));
    granule.position.copy(granule.parent.worldToLocal(escaped));
    granule.updateMatrixWorld(true);
    try {
      assert.throws(
        () =>
          allVertices(granule, (v) =>
            assert(
              macronuclearShells.contains(v),
              `injected granule vertex outside nucleus at ${p}`,
            ),
          ),
        /injected granule vertex outside nucleus/,
      );
    } finally {
      granule.position.copy(original);
      granule.updateMatrixWorld(true);
    }
    allVertices(granule, (v) => assert(macronuclearShells.contains(v)));
  }
});
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
macronuclearShells.dispose();
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
