import assert from "node:assert/strict";
import * as THREE from "three";
import { build } from "esbuild";
import { entries } from "./entries.js";

for (const entry of entries) {
  const url = new URL(`./${entry.id}Process.js`, import.meta.url);
  const model = (await import(url)).default;
  const configurations =
    entry.id === "nuclearTransport"
      ? [{}, { nls: "masked" }]
      : entry.id === "motorTransport"
        ? [
            {},
            { motor: "dynein" },
            { motor: "kinesin", atp: "depleted" },
            { motor: "dynein", atp: "depleted" },
          ]
        : entry.id === "organelleImport"
          ? [{}, { transit: "absent" }]
          : [{}];
  let nodeCount = 0;
  for (const rootId of entry.roots)
    for (const parameters of configurations) {
      const view = model.create({ rootId });
      const resources = () => {
        const list = [];
        view.group.traverse((o) =>
          list.push([o.uuid, o.geometry?.uuid, o.material?.uuid]),
        );
        nodeCount = list.length;
        return JSON.stringify(list);
      };
      const initialResources = resources();
      const snapshot = () => {
        view.group.updateMatrixWorld(true);
        const list = [];
        view.group.traverse((o) =>
          list.push([
            o.matrixWorld.elements,
            o.visible,
            o.isInstancedMesh ? Array.from(o.instanceMatrix.array) : null,
          ]),
        );
        return JSON.stringify([list, view.group.userData, view.labels]);
      };
      for (const progress of [0, 0.15, 0.35, 0.5, 0.7, 0.85, 1, NaN]) {
        view.update(progress, parameters);
        view.group.updateMatrixWorld(true);
        const size = new THREE.Box3()
          .setFromObject(view.group)
          .getSize(new THREE.Vector3());
        assert([size.x, size.y, size.z].every(Number.isFinite));
        assert(
          Math.max(size.x, size.y, size.z) > 2 &&
            Math.max(size.x, size.y, size.z) < 20,
        );
        view.group.traverse((o) => {
          assert(o.matrixWorld.elements.every(Number.isFinite));
          if (o.geometry)
            for (const a of Object.values(o.geometry.attributes))
              assert(Array.from(a.array).every(Number.isFinite));
          if (o.isInstancedMesh) {
            assert(Array.from(o.instanceMatrix.array).every(Number.isFinite));
            assert(
              o.boundingSphere && Number.isFinite(o.boundingSphere.radius),
            );
          }
          if (o.material) assert(view.materials.includes(o.material));
        });
      }
      view.update(0.7, parameters);
      const expected = snapshot();
      view.update(0.2, parameters);
      view.update(0.7, parameters);
      assert.equal(snapshot(), expected);
      assert.equal(resources(), initialResources);
      view.update(1, parameters);
      if (entry.id === "nuclearTransport")
        assert.equal(
          view.group.userData.cargoReleased,
          parameters.nls !== "masked",
        );
      if (entry.id === "organelleImport")
        assert.equal(
          view.group.userData.folded,
          parameters.transit !== "absent",
        );
      if (entry.id === "motorTransport")
        assert.equal(
          view.group.userData.transportCompleted,
          parameters.atp !== "depleted",
        );
      if (entry.id === "rnaProcessing")
        assert.equal(view.group.userData.exonsJoined, true);
    }
  await build({
    entryPoints: [url.pathname],
    bundle: true,
    write: false,
    platform: "browser",
  });
  console.log(
    `${entry.id}: all roots / controls, finite buffers and bounds, stable resources, deterministic seeks, complete material inventory, scientific endpoints and esbuild PASS (${nodeCount} nodes)`,
  );
}
