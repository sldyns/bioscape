import assert from "node:assert/strict";
import * as THREE from "three";
const { default: model } = await import(
  process.env.CHROMATIN_RDDM_MODEL || "./plantRdDMProcess.js"
);

// Read the same tube rings and index draw range the renderer uses. No
// scientific state labels or duplicated trajectory formula establishes contact.
function points(mesh) {
  const attr = mesh.geometry.attributes.position,
    result = [];
  for (let i = 0; i < attr.count; i += 8) {
    const p = new THREE.Vector3();
    for (let j = 0; j < 8; j++)
      p.add(new THREE.Vector3().fromBufferAttribute(attr, i + j));
    result.push(p.multiplyScalar(1 / 8).applyMatrix4(mesh.matrixWorld));
  }
  return result;
}
function visibleEnd(rails, strand) {
  const visible = rails.filter(
    (r, i) => i % 2 === strand && r.geometry.drawRange.count > 0,
  );
  const mesh = strand === 0 ? visible.at(-1) : visible[0];
  const range = mesh.geometry.drawRange;
  const ring = (range.start + (strand === 0 ? range.count : 0)) / (8 * 6);
  return points(mesh)[ring];
}
function nearest(point, path) {
  let distance = Infinity;
  for (let i = 1; i < path.length; i++) {
    const delta = path[i].clone().sub(path[i - 1]);
    const f = THREE.MathUtils.clamp(
      point
        .clone()
        .sub(path[i - 1])
        .dot(delta) / delta.lengthSq(),
      0,
      1,
    );
    distance = Math.min(
      distance,
      point.distanceTo(path[i - 1].clone().addScaledVector(delta, f)),
    );
  }
  return distance;
}
let attachmentChecks = 0,
  duplexChecks = 0,
  boundaryChecks = 0;
for (const drm2 of ["active", "inactive"]) {
  const scene = model.create({ rootId: "plant" });
  // This structural selector also works on the pre-fix implementation, so the
  // first assertion rejects its physical defect before relying on new names.
  const producer = scene.group.children.find((o) =>
    o.children.some(
      (c) => c.name === "enzyme-subunits-and-nucleic-acid-binding-cleft",
    ),
  );
  const rails = scene.group.children.filter(
    (o) =>
      o.geometry?.type === "BufferGeometry" &&
      o.geometry.attributes.position.count === 76 * 8,
  );
  assert.equal(rails.length, 4);
  scene.update(0.1, { drm2 });
  scene.group.updateMatrixWorld(true);
  assert(
    new THREE.Box3()
      .setFromObject(producer)
      .distanceToPoint(visibleEnd(rails, 0)) < 0.06,
    "Pol IV nascent RNA 3′ end must remain within the actual producer complex",
  );
  const polPort = scene.group.getObjectByName("Pol-IV-RNA-3prime-port");
  const templatePort = scene.group.getObjectByName("RDR2-template-entry-port");
  const productPort = scene.group.getObjectByName("RDR2-RNA-3prime-port");
  assert(polPort && templatePort && productPort, "physical enzyme ports exist");
  const world = (object) => object.getWorldPosition(new THREE.Vector3());
  const initialProducerTransform = producer.matrixWorld.toArray();
  const rdr = templatePort.parent;
  assert(
    new THREE.Box3()
      .setFromObject(producer)
      .intersectsBox(new THREE.Box3().setFromObject(rdr)),
    "producer protein surfaces remain adjacent in the coupled complex",
  );
  const names = rails.map((r) => r.uuid);
  for (let i = 0; i <= 39; i++) {
    const p = 0.025 + (i * (0.119 - 0.025)) / 39;
    scene.update(p, { drm2 });
    scene.group.updateMatrixWorld(true);
    assert(
      visibleEnd(rails, 0).distanceTo(world(polPort)) < 0.024,
      `Pol IV 3′ attachment at ${p}`,
    );
    attachmentChecks++;
  }
  for (let i = 0; i <= 20; i++) {
    scene.update(0.12 + (i * 0.04) / 20, { drm2 });
    scene.group.updateMatrixWorld(true);
    const tip = visibleEnd(rails, 0),
      start = world(polPort),
      end = world(templatePort);
    assert(
      nearest(tip, [start, end]) < 1e-6,
      "same completed 3′ end threads the interpolymerase corridor",
    );
    attachmentChecks++;
  }
  for (let i = 0; i <= 59; i++) {
    const p = 0.167 + (i * (0.279 - 0.167)) / 59;
    scene.update(p, { drm2 });
    scene.group.updateMatrixWorld(true);
    assert(
      visibleEnd(rails, 1).distanceTo(world(productPort)) < 0.024,
      `RDR2 growing 3′ attachment at ${p}`,
    );
    const template = [...points(rails[0]), ...points(rails[2]).slice(1)];
    assert(
      nearest(world(templatePort), template) < 0.0003,
      "same Pol IV template continuously threads the RDR2 entry",
    );
    assert.deepEqual(
      producer.matrixWorld.toArray(),
      initialProducerTransform,
      "coupled producer stays at source locus during RDR2 synthesis",
    );
    attachmentChecks++;
  }
  for (let i = 0; i <= 80; i++) {
    const p = 0.16 + (i * 0.18) / 80;
    scene.update(p, { drm2 });
    scene.group.updateMatrixWorld(true);
    const pths = rails.map(points);
    for (const strand of [0, 1])
      assert(
        pths[strand].at(-1).distanceTo(pths[strand + 2][0]) < 1e-6,
        "both preallocated fragments remain one continuous RNA until DCL3 cleavage",
      );
    for (const f of [0, 1])
      for (let j = 0; j < pths[0].length; j++) {
        assert(
          Math.abs(pths[f * 2][j].distanceTo(pths[f * 2 + 1][j]) - 0.22) < 1e-6,
          "unbending preserves strand separation instead of crossing RNA strands",
        );
        duplexChecks++;
      }
    assert.deepEqual(
      rails.map((r) => r.uuid),
      names,
      "same precursor objects reach DCL3",
    );
  }
  for (const p of [0.12, 0.16, 0.28, 0.34]) {
    scene.update(p - 1e-7, { drm2 });
    scene.group.updateMatrixWorld(true);
    const before = rails.map(points);
    scene.update(p + 1e-7, { drm2 });
    scene.group.updateMatrixWorld(true);
    for (let r = 0; r < rails.length; r++) {
      const after = points(rails[r]);
      assert(
        after.every((v, i) => v.distanceTo(before[r][i]) < 0.00005),
        `no geometry step at synthesis/handoff/release boundary ${p}`,
      );
      boundaryChecks++;
    }
  }
  scene.update(0.34, { drm2 });
  scene.group.updateMatrixWorld(true);
  assert(
    points(rails[0])
      .at(-1)
      .distanceTo(new THREE.Vector3(-0.78, 1.26, 0.12)) < 1e-6,
    "intact precursor reaches the existing DCL3 cleavage site before cutting",
  );
  assert(
    visibleEnd(rails, 1).distanceTo(world(productPort)) > 0.35,
    "completed duplex releases from RDR2 before DCL3 cleavage",
  );
}
console.log(
  `RdDM coupled-production regression passed: ${attachmentChecks} attachment/handoff checks, ${duplexChecks} actual strand-separation checks, ${boundaryChecks} boundary checks; both DRM2 conditions.`,
);
