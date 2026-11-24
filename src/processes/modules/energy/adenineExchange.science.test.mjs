import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import definition from "./adenineExchangeProcess.js";

const model = definition.create({ rootId: "cell" });
const named = (name) => {
  const obj = model.group.getObjectByName(name);
  assert(obj, name);
  return obj;
};
const adp = named("ADP"),
  atp = named("ATP");
const protein = [];
model.group.traverse((o) => {
  if (o.isMesh && o.name.startsWith("ANT-")) protein.push(o);
});
function at(time) {
  model.update(time, {});
  model.group.updateMatrixWorld(true);
}
function blocked(sign) {
  const ray = new THREE.Raycaster(
    new THREE.Vector3(0, 1.65 * sign, 0),
    new THREE.Vector3(0, -sign, 0),
    0,
    1.65,
  );
  return !!ray.intersectObjects(protein, false).length;
}
function state(time) {
  at(time);
  return {
    adp: adp.matrixWorld.toArray(),
    atp: atp.matrixWorld.toArray(),
    gates: protein.map((m) => [
      m.name,
      m.matrixWorld.toArray(),
      m.morphTargetInfluences ? [...m.morphTargetInfluences] : null,
    ]),
    labels: model.labels.map((l) => [l.active ?? true, ...l.position]),
  };
}

test("two different nucleotides cross a single carrier in opposite directions", () => {
  assert.equal(definition.stages.length, 6);
  assert.equal(definition.stages[0].at, 0);
  assert(
    definition.stages.every(
      (s, i, a) =>
        s.title.zh &&
        s.title.en &&
        s.description.zh &&
        s.description.en &&
        s.at < 1 &&
        (!i || s.at > a[i - 1].at),
    ),
  );
  assert.equal(
    adp.children.filter((o) => o.name.startsWith("ADP-phosphate-")).length,
    2,
  );
  assert.equal(
    atp.children.filter((o) => o.name.startsWith("ATP-phosphate-")).length,
    3,
  );
  const cohort = [...adp.children, ...atp.children];
  at(0);
  assert(adp.position.y > 2 && atp.position.y < -2);
  at(0.26);
  const site = adp.position.clone();
  assert(site.length() < 1e-12 && atp.position.y < -2);
  at(0.53);
  assert(adp.position.y < -1.5);
  at(0.7);
  assert(atp.position.distanceTo(site) < 1e-12 && adp.position.y < -2);
  at(1);
  assert(atp.position.y > 2 && adp.position.y < -2);
  assert.deepEqual([...adp.children, ...atp.children], cohort);
});

test("actual helical geometry and gate meshes alternate access through closed intermediates", () => {
  const expected = [
    [0, false, true],
    [0.33, true, true],
    [0.45, true, false],
    [0.68, true, false],
    [0.77, true, true],
    [1, false, true],
  ];
  for (const [t, upper, lower] of expected) {
    at(t);
    assert.deepEqual([blocked(1), blocked(-1)], [upper, lower], String(t));
  }
  // Test the axis against full carrier meshes throughout both transitions.
  for (let i = 0; i <= 200; i++) {
    at(i / 200);
    assert(blocked(1) || blocked(-1), `Both faces open at ${i / 200}`);
  }
  const axis = named("ANT-H4-core"),
    v = new THREE.Vector3();
  function mouth(atTop) {
    let radial = 0,
      n = 0;
    for (let i = 0; i < axis.geometry.attributes.position.count; i++) {
      axis.getVertexPosition(i, v);
      if ((atTop ? 1 : -1) * v.y > 1.15) {
        radial += Math.hypot(v.x, v.z);
        n++;
      }
    }
    assert(n > 0);
    return radial / n;
  }
  at(0);
  const top = mouth(true),
    bottom = mouth(false);
  at(0.55);
  assert(top - mouth(true) > 0.55 && mouth(false) - bottom > 0.55);
  for (let i = 1; i <= 5; i++) assert(named(`ANT-loop-${i}-${i + 1}`).isMesh);
});

test("each ligand fits through the open gate and vacates the shared site before the other arrives", () => {
  const box = new THREE.Box3();
  const checks = [0, 0];
  const sides = [
    ["IMS", 1],
    ["matrix", -1],
  ];
  for (let i = 0; i <= 800; i++) {
    at(i / 800);
    assert(!(adp.position.length() < 0.5 && atp.position.length() < 0.5));
    for (const ligand of [adp, atp]) {
      box.setFromObject(ligand);
      for (const [side, [name, sign]] of sides.entries()) {
        const lip = named(`ANT-${name}-closure-0`),
          low = lip.position.y - lip.scale.y,
          high = lip.position.y + lip.scale.y;
        if (box.max.y < low || box.min.y > high) continue;
        const aperture =
          Math.hypot(lip.position.x, lip.position.z) - lip.scale.x;
        const projected = Math.hypot(
          Math.max(Math.abs(box.min.x), Math.abs(box.max.x)),
          Math.max(Math.abs(box.min.z), Math.abs(box.max.z)),
        );
        assert(
          aperture > projected,
          `${ligand.name} clearance at ${i / 800}, ${name}`,
        );
        assert(sign * lip.position.y > 0);
        checks[side]++;
      }
    }
  }
  assert(checks.every((n) => n > 20));
});

test("physical marker anchors and presentation snapshots survive repeated backward seeks", () => {
  const stableLabels = [...model.labels];
  const times = [0, 0.08, 0.24, 0.33, 0.51, 0.66, 0.77, 0.92, 1];
  const snapshots = times.map(state);
  const point = new THREE.Vector3(),
    matrix = new THREE.Matrix4(),
    heads = named("inner-membrane-heads");
  for (const i of [8, 4, 2, 6, 0, 5, 7, 3, 1]) {
    assert.deepEqual(state(times[i]), snapshots[i]);
    assert(
      model.labels.every(
        (l, j) => l === stableLabels[j] && l.position.every(Number.isFinite),
      ),
    );
    [
      named("ADP-phosphate-2"),
      named("ATP-phosphate-3"),
      named("central-site-contact-1"),
      named("ANT-IMS-closure-1"),
      named("ANT-matrix-closure-1"),
    ].forEach((object, j) => {
      object.getWorldPosition(point);
      assert.deepEqual(model.labels[j + 2].position, point.toArray());
    });
  }
  for (const face of model.labels.slice(0, 2)) {
    let best = Infinity;
    for (let i = 0; i < heads.count; i++) {
      heads.getMatrixAt(i, matrix);
      point.setFromMatrixPosition(matrix);
      best = Math.min(
        best,
        point.distanceTo(new THREE.Vector3(...face.position)),
      );
    }
    assert(best < 1e-6);
  }
});
