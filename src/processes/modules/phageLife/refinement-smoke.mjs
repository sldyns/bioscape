import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { build } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const ids = ["phageLytic", "phageLysogenic", "phageAssembly", "phagePackaging"];
const models = await Promise.all(
  ids.map(async (id) => [id, (await import(`./${id}Process.js`)).default]),
);
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "phage-refinement-"));
try {
  const infectionFile = path.join(temp, "infection.mjs");
  await build({
    entryPoints: [path.resolve(here, "../../phageProcess.js")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: infectionFile,
    logLevel: "silent",
  });
  models.push(["infection", (await import(infectionFile)).default]);
  for (const [id, model] of models) {
    const { group, update } = model.create();
    const inventory = () => {
      const a = [];
      group.traverse((o) =>
        a.push([
          o.uuid,
          o.geometry?.uuid,
          Array.isArray(o.material)
            ? o.material.map((m) => m.uuid)
            : o.material?.uuid,
        ]),
      );
      return JSON.stringify(a);
    };
    const initial = inventory();
    // Lipid tails must stay between paired leaflets, never project as hairs.
    const instanceMatrix = new THREE.Matrix4(),
      end = new THREE.Vector3();
    group.traverse((o) => {
      if (o.name !== "bilayer-hydrophobic-tails") return;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, instanceMatrix);
        // Matrix column length preserves actual cylinder height.
        assert(
          Math.hypot(
            instanceMatrix.elements[4],
            instanceMatrix.elements[5],
            instanceMatrix.elements[6],
          ) < 0.023,
          "lipid tail length must fit bilayer",
        );
        for (const sign of [-0.5, 0.5]) {
          end.set(0, sign, 0).applyMatrix4(instanceMatrix);
          const radius = Math.hypot(end.x / 3.2, end.y / 1.48);
          assert(
            radius >= o.userData.bilayerInnerScale - 1e-6 &&
              radius <= o.userData.bilayerOuterScale + 1e-6,
            "lipid tail endpoint lies inside paired leaflets",
          );
        }
      }
    });

    const snapshot = () => {
      group.updateMatrixWorld(true);
      const a = [];
      group.traverse((o) =>
        a.push([
          o.visible,
          ...o.matrix.elements,
          o.geometry?.drawRange,
          o.isInstancedMesh ? [o.count, ...o.instanceMatrix.array] : null,
          o.geometry?.attributes.position?.array,
        ]),
      );
      return JSON.stringify([a, group.userData]);
    };
    let instanceCount = 0,
      vertexCount = 0;
    group.traverse((o) => {
      if (o.isInstancedMesh) instanceCount += o.count;
      if (o.geometry) {
        const p = o.geometry.attributes.position;
        vertexCount += p.count;
        assert([...p.array].every(Number.isFinite));
        if (o.geometry.attributes.normal)
          assert(
            [...o.geometry.attributes.normal.array].every(Number.isFinite),
          );
      }
    });
    for (const parameters of [
      {},
      { atp: "absent", protease: "inactive", fate: "maintain" },
    ]) {
      for (const p of [
        0,
        0.1,
        0.2,
        0.35,
        0.5,
        0.67,
        0.78,
        0.85,
        0.95,
        1,
        NaN,
      ]) {
        update(p, parameters);
        group.updateMatrixWorld(true);
        const size = new THREE.Box3()
          .setFromObject(group)
          .getSize(new THREE.Vector3());
        assert(size.toArray().every(Number.isFinite), id + " finite bounds");
        assert(
          Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
          id + " bounded size",
        );
        group.traverse((o) => {
          assert(o.matrix.elements.every(Number.isFinite));
          if (o.isInstancedMesh)
            assert([...o.instanceMatrix.array].every(Number.isFinite));
        });
      }
      update(0.7, parameters);
      const a = snapshot();
      update(0.2, parameters);
      update(0.7, parameters);
      assert.equal(snapshot(), a, id + " deterministic seek");
    }
    assert.equal(
      inventory(),
      initial,
      id + " stable geometry, material and nodes",
    );
    update(1);
    if (id === "phageLytic" || id === "phageLysogenic")
      assert(group.userData.progenyReleased);
    if (id === "phageAssembly") assert(group.userData.matureVirion);
    if (id === "phagePackaging") assert(group.userData.neckSealed);
    if (id === "phageLysogenic") {
      update(1, { fate: "maintain" });
      assert.equal(group.userData.lysogenicDaughters, 2);
      assert.equal(group.userData.progenyReleased, false);
    }
    if (id === "phageAssembly") {
      update(1, { protease: "inactive" });
      assert.equal(group.userData.matureVirion, false);
      assert.equal(group.userData.scaffoldRemoved, false);
    }
    if (id === "phagePackaging") {
      update(1, { atp: "absent" });
      assert.equal(group.userData.packagedFraction, 0);
      assert.equal(group.userData.portalRotates, false);
    }
    await build({
      entryPoints: [
        id === "infection"
          ? path.resolve(here, "../../phageProcess.js")
          : path.join(here, `${id}Process.js`),
      ],
      bundle: true,
      format: "esm",
      write: false,
      logLevel: "silent",
    });
    console.log(
      id,
      JSON.stringify({
        nodes: JSON.parse(initial).length,
        instances: instanceCount,
        vertices: vertexCount,
        status: "PASS",
      }),
    );
  }
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
