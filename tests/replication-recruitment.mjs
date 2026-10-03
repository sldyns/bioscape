import assert from "node:assert/strict";
import replication from "../src/processes/modules/genome/replicationProcess.js";

for (const rootId of ["cell", "plant", "yeast"])
  for (const ligase of ["active", "absent"]) {
    const model = replication.create({ rootId });
    const lag = model.group.getObjectByName(
      "lagging-DNA-polymerase-recruitment",
    );
    assert(lag, "the re-recruited polymerase must have a stable identity");
    const lead = model.group.children.find(
      (o) => o.name === "DNA-polymerase-functional-domains",
    );
    const materials = new Set(),
      leadMaterials = new Set();
    lag.traverse((o) => {
      if (o.material) materials.add(o.material);
    });
    lead.traverse((o) => {
      if (o.material) leadMaterials.add(o.material);
    });
    for (const m of materials)
      assert(
        !leadMaterials.has(m),
        "lagging fade must never dim leading polymerase",
      );
    const inventory = new Set(model.materials);
    for (const m of materials)
      assert(inventory.has(m), "fading materials must be owned and disposable");
    const level = () => Math.max(...[...materials].map((m) => m.opacity));
    const state = () =>
      JSON.stringify([
        lag.visible,
        lag.position.toArray(),
        [...materials].map((m) => [m.opacity, m.transparent, m.depthWrite]),
      ]);
    for (const boundary of [0.36, 0.48, 0.6, 0.72]) {
      model.update(boundary - 0.025, { ligase });
      assert(
        lag.visible && level() > 0.1,
        "end of synthesis must remain perceptible",
      );
      model.update(boundary - 1e-6, { ligase });
      assert(
        !lag.visible || level() < 1e-6,
        "outgoing enzyme must disappear before coordinate reset",
      );
      model.update(boundary + 1e-6, { ligase });
      assert(
        !lag.visible || level() < 1e-6,
        "incoming enzyme must start invisibly at new primer",
      );
      model.update(boundary + 0.02, { ligase });
      assert(
        lag.visible && level() > 0.99,
        "enzyme must be fully present during synthesis",
      );
      assert([...leadMaterials].every((m) => m.opacity === 1));
    }
    model.update(0.517, { ligase });
    const expected = state();
    model.update(0.359999, { ligase });
    model.update(0.517, { ligase });
    assert.equal(state(), expected, "seek must restore all fade/depth state");
    model.update(0.82, { ligase });
    assert(!lag.visible || level() < 1e-6, "final release also fades to zero");
    model.update(0.3, { ligase });
    assert(lag.visible && level() > 0.99, "replay restores opaque polymerase");
    const geometry = new Set(),
      mats = new Set();
    model.group.traverse((o) => {
      if (o.geometry) geometry.add(o.geometry);
      if (o.material) mats.add(o.material);
    });
    geometry.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
  }
console.log(
  "Replication recruitment: 6 root/ligase cases; hidden resets, bound synthesis, isolated materials, ownership, replay and final release passed.",
);
