import test from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import apoptosis from "./apoptosisProcess.js";
import differentiation from "./differentiationProcess.js";
import signal from "./signalTransductionProcess.js";
import immune from "./immuneResponseProcess.js";

test("implicit membrane sections share the authoritative live topology and seek deterministically", () => {
  for (const process of [apoptosis, differentiation]) {
    const model = process.create();
    const membrane = model.group.getObjectByName("continuous-plasma-membrane");
    const rear = model.group.getObjectByName("implicit-membrane-rear-surface");
    const edge = model.group.getObjectByName(
      "implicit-membrane-bilayer-section",
    );
    assert.equal(rear.geometry, membrane.geometry);
    const buffers = edge.geometry.attributes.position.array;
    model.update(0.91);
    const expected = buffers.slice(0, edge.geometry.drawRange.count * 3);
    assert.ok(expected.length > 0);
    model.update(0.2);
    model.update(0.91);
    assert.deepEqual(buffers.slice(0, expected.length), expected);
    assert.equal(edge.geometry.attributes.position.array, buffers);
    assert.ok(expected.every(Number.isFinite));
    assert.equal(edge.geometry.drawRange.count % 4, 0);
  }
});

test("receptor continuity, lysosomal cut sections and smooth tetramer assembly remain explicit", () => {
  const receptor = signal.create();
  let chains = 0;
  receptor.group.traverse((o) => {
    if (o.name === "PDGFR-continuous-Ig-domain-chain") chains++;
  });
  assert.equal(chains, 2);
  const cytotoxic = immune.create();
  let granules = 0;
  cytotoxic.group.traverse((o) => {
    if (o.name !== "cytotoxic-granule-membrane-section") return;
    granules++;
    assert.equal(o.geometry.parameters.phiLength, Math.PI);
    assert.equal(o.children.length, 2);
    assert.equal(o.scale.x, 0.1);
  });
  assert.equal(granules, 5);
  const erythroblast = differentiation.create();
  const tetramer = erythroblast.group.getObjectByName("hemoglobin-tetramer");
  let intermediate = false;
  for (let i = 0; i <= 60; i++) {
    erythroblast.update(i / 60);
    if (
      tetramer.visible &&
      tetramer.scale.x > 0.001 &&
      tetramer.scale.x < 0.999
    )
      intermediate = true;
  }
  assert.ok(
    intermediate,
    "assembly grows continuously instead of popping into view",
  );
});

test("implicit section entire fixed buffer resets across growth, fission and reverse seeks", () => {
  const poses = [0, 0.1, 0.4, 0.81, 0.91, 0.96, 1];
  for (const process of [apoptosis, differentiation]) {
    const model = process.create();
    const edge = model.group.getObjectByName(
      "implicit-membrane-bilayer-section",
    );
    const attribute = edge.geometry.attributes.position;
    const buffer = attribute.array;
    const expected = new Map();
    const hash = () =>
      createHash("sha256")
        .update(
          new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
        )
        .digest("hex");
    for (const pose of poses) {
      model.update(pose);
      expected.set(pose, {
        count: edge.geometry.drawRange.count,
        hash: hash(),
      });
    }
    for (const pose of [0, 1, 0.1, ...poses.toReversed()]) {
      model.update(pose);
      const reference = expected.get(pose);
      assert.equal(edge.geometry.drawRange.count, reference.count);
      assert.equal(
        hash(),
        reference.hash,
        `${process.id}: whole fixed buffer must reset at ${pose}`,
      );
      assert.ok(
        buffer.subarray(reference.count * 3).every((v) => v === 0),
        "unused tail must be zero",
      );
      const version = attribute.version;
      model.update(pose);
      assert.equal(
        attribute.version,
        version,
        "stationary topology skips section upload",
      );
      assert.equal(attribute.array, buffer, "buffer identity remains stable");
    }
  }
});
