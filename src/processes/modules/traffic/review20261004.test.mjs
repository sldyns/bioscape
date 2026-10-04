import assert from "node:assert/strict";
import * as THREE from "three";
import endocytosis from "./endocytosisProcess.js";
import autophagy from "./autophagyProcess.js";

const vertex = new THREE.Vector3();
function profileAtHeight(surface, y) {
  const a = surface.children[1].geometry.attributes.position;
  let radius = -Infinity;
  for (let i = 0; i < a.count - 65; i += 65) {
    const lo = new THREE.Vector3().fromBufferAttribute(a, i + 32);
    const hi = new THREE.Vector3().fromBufferAttribute(a, i + 97);
    if (lo.y <= y && y <= hi.y && hi.y > lo.y)
      radius = Math.max(
        radius,
        -lo.z + ((lo.z - hi.z) * (y - lo.y)) / (hi.y - lo.y),
      );
  }
  return radius;
}
{
  const s = endocytosis.create();
  const membrane = s.group.children[0];
  const collar = s.group.getObjectByName(
    "helical dynamin collar — oligomeric rungs",
  );
  let minimumClearance = Infinity;
  const radii = [];
  for (const p of [
    0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.39, 0.4, 0.414, 0.422, 0.429,
  ]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    radii.push(profileAtHeight(membrane, collar.position.y));
    for (const bead of collar.children) {
      const a = bead.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        vertex.fromBufferAttribute(a, i).applyMatrix4(bead.matrixWorld);
        const radius = profileAtHeight(membrane, vertex.y);
        assert(
          Number.isFinite(radius),
          "collar must be alongside the rendered neck",
        );
        const clearance = Math.hypot(vertex.x + 1.5, vertex.z) - radius;
        minimumClearance = Math.min(minimumClearance, clearance);
        assert(
          clearance > 0,
          `dynamin crosses to the lumen at ${p}: ${clearance}`,
        );
      }
    }
  }
  assert(
    radii[6] - radii.at(-1) > 0.02,
    "membrane must constrict with dynamin after .39",
  );
  s.update(0.43);
  assert(!collar.visible, "collar must not remain inside the sealed carrier");
  console.log(
    "20261004-traffic-01: cytosolic collar and coupled membrane constriction",
    minimumClearance,
  );
}
{
  const s = autophagy.create();
  const anchors = s.group.children.filter(
    (o) =>
      o.name.startsWith("luminal membrane glycan") ||
      o.name.startsWith("V-ATPase"),
  );
  for (const epsilon of [1e-4, 1e-6, 1e-8]) {
    s.update(0.65 - epsilon);
    const before = anchors.map((o) => o.position.clone());
    s.update(0.65 + epsilon);
    anchors.forEach((o, i) =>
      assert(
        o.position.distanceTo(before[i]) < 100 * epsilon + 1e-7,
        "membrane anchor teleports at fusion",
      ),
    );
  }
  const envelope = s.group.getObjectByName("autolysosome-outer-membrane");
  for (const p of [0.65, 0.66, 0.69, 0.73, 0.8, 0.84, 0.9, 0.96, 1]) {
    s.update(p);
    const outer = envelope.children[0].geometry.attributes.position;
    const inner = envelope.children[1].geometry.attributes.position;
    const rows = [];
    for (let i = 0; i < outer.count; i += 65) {
      const a = new THREE.Vector3()
        .fromBufferAttribute(outer, i + 32)
        .add(new THREE.Vector3().fromBufferAttribute(inner, i + 32))
        .multiplyScalar(0.5);
      rows.push([a.x, Math.hypot(a.y, a.z)]);
    }
    for (const anchor of anchors) {
      const i = rows.findIndex(
        (a, i) =>
          i + 1 < rows.length &&
          anchor.position.x >= a[0] &&
          anchor.position.x <= rows[i + 1][0],
      );
      assert(i >= 0);
      const a = rows[i],
        b = rows[i + 1];
      const radius =
        a[1] + ((b[1] - a[1]) * (anchor.position.x - a[0])) / (b[0] - a[0]);
      assert(
        Math.abs(Math.hypot(anchor.position.y, anchor.position.z) - radius) <
          0.002,
        "anchor leaves rendered common membrane",
      );
    }
  }
  console.log("20261004-traffic-02: continuous attached lysosomal anchors");
}

// Repair discoveries: leaders terminate on subjects rather than text offsets.
const closeLabel = (label, expected, message) =>
  assert(
    new THREE.Vector3(...label.position).distanceTo(expected) < 2e-6,
    message,
  );
{
  const s = endocytosis.create(),
    labels = s.labels.slice(),
    arrays = labels.map((l) => l.position),
    cargo = s.group.children.filter((o) => o.name.startsWith("LDL —")),
    receptors = s.group.children.filter((o) => o.name.startsWith("LDLR")),
    hubs = s.group.getObjectByName("three-legged clathrin hubs"),
    collar = s.group.getObjectByName(
      "helical dynamin collar — oligomeric rungs",
    ),
    matrix = new THREE.Matrix4(),
    expected = new THREE.Vector3();
  for (const p of [0, 0.14, 0.3, 0.4, 0.43, 0.53, 0.67, 0.8, 0.95, 1, 0.3]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    closeLabel(
      labels[0],
      cargo[1].getWorldPosition(expected),
      "LDL leader leaves its cargo",
    );
    assert.equal(
      labels[0].active,
      p < 0.43,
      "extracellular label survives internalization",
    );
    assert.equal(labels[2].active, hubs.visible);
    if (labels[2].active) {
      let distance = Infinity;
      for (let i = 0; i < hubs.count; i++) {
        hubs.getMatrixAt(i, matrix);
        if (matrix.getMaxScaleOnAxis() < 0.001) continue;
        expected.setFromMatrixPosition(matrix).applyMatrix4(hubs.matrixWorld);
        distance = Math.min(
          distance,
          expected.distanceTo(new THREE.Vector3(...labels[2].position)),
        );
      }
      assert(
        distance < 2e-6,
        "clathrin leader does not identify a rendered hub",
      );
    }
    closeLabel(
      labels[3],
      new THREE.Vector3(2.35, -1.25, 0),
      "endosome lumen leader is outside the lumen",
    );
    closeLabel(
      labels[4],
      receptors[2].getWorldPosition(expected),
      "sorting label leaves its receptor",
    );
    assert.equal(labels[4].active, p >= 0.8);
    closeLabel(
      labels[5],
      collar.children[11].getWorldPosition(expected),
      "dynamin leader leaves the collar",
    );
    assert.equal(labels[5].active, collar.visible);
    labels.forEach((l, i) => {
      assert.equal(l, s.labels[i]);
      assert.equal(l.position, arrays[i]);
    });
  }
  console.log(
    "20261004-traffic-labels-01: endocytosis subjects and label lifecycles",
  );
}
{
  const s = autophagy.create(),
    labels = s.labels.slice(),
    arrays = labels.map((l) => l.position),
    aggregate = s.group.getObjectByName(
      "damaged cytosolic enzyme aggregate — TPI backbone reference",
    ),
    enzyme = s.group.children.filter((o) => o.name.startsWith("cathepsin D"))[3]
      .children[0],
    cargo = aggregate.children[1].children[0];
  for (const p of [
    0, 0.2, 0.44, 0.6, 0.65, 0.7, 0.75, 0.8, 0.87, 0.94, 0.995, 1, 0.2,
  ]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    for (const [index, object] of [
      [1, cargo],
      [6, enzyme],
    ]) {
      const a = object.geometry.attributes.position;
      const expected = new THREE.Vector3()
        .fromBufferAttribute(a, Math.floor(a.count / 2))
        .applyMatrix4(object.matrixWorld);
      closeLabel(
        labels[index],
        expected,
        "cargo/protease label leaves the actual backbone",
      );
    }
    for (const [index, surface, vertexIndex] of [
      [0, s.group.children[0].children[0], 64 * 65 + 32],
      [2, s.group.children[0].children[0], 32 * 65 + 64],
      [4, s.group.children[1].children[0], 32 * 65 + 64],
    ]) {
      const expected = new THREE.Vector3()
        .fromBufferAttribute(surface.geometry.attributes.position, vertexIndex)
        .applyMatrix4(surface.matrixWorld);
      closeLabel(
        labels[index],
        expected,
        "phagophore/inner-membrane label leaves its visible surface",
      );
    }
    assert.equal(
      labels[1].active,
      aggregate.visible,
      "cargo label outlives degraded cargo",
    );
    assert.equal(labels[3].active, p < 0.65);
    assert.equal(labels[4].active, p >= 0.65 && p < 0.71);
    assert.equal(labels[5].active, p >= 0.71);
    assert.equal(
      labels[6].active,
      true,
      "retained hydrolases should retain their label",
    );
    labels.forEach((l, i) => {
      assert.equal(l, s.labels[i]);
      assert.equal(l.position, arrays[i]);
    });
  }
  console.log(
    "20261004-traffic-labels-02: autophagy backbone anchors and subject visibility",
  );
}
