import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";

const moduleRoot = process.env.GENOME_MODULE_ROOT
  ? pathToFileURL(resolve(process.env.GENOME_MODULE_ROOT) + "/")
  : new URL("./", import.meta.url);
const transduction = (
  await import(new URL("transductionProcess.js", moduleRoot))
).default;
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const matrix = new THREE.Matrix4();
const sampleColor = new THREE.Color();
const viral = new THREE.Color("#a18cae");
const isViral = (color) =>
  Math.max(
    Math.abs(color.r - viral.r),
    Math.abs(color.g - viral.g),
    Math.abs(color.b - viral.b),
  ) < 1e-5;
const ends = (mesh) => [
  v(0, -0.5, 0).applyMatrix4(mesh.matrixWorld),
  v(0, 0.5, 0).applyMatrix4(mesh.matrixWorld),
];
function donorBackbone(scene) {
  return scene.group.children.find((o) => {
    if (o.name !== "nucleoid-duplex-backbone-0") return false;
    o.getMatrixAt(0, matrix);
    return matrix.elements[12] < 0;
  });
}
function retainedViral(scene) {
  const donor = donorBackbone(scene),
    retained = [];
  for (let i = 0; i < donor.count; i++) {
    donor.getMatrixAt(i, matrix);
    donor.getColorAt(i, sampleColor);
    if (
      Math.hypot(matrix.elements[0], matrix.elements[1], matrix.elements[2]) >
        1e-9 &&
      isViral(sampleColor)
    )
      retained.push({ index: i, matrix: matrix.toArray() });
  }
  return retained;
}
function cells(scene) {
  return scene.group.children.filter(
    (o) =>
      o.isGroup &&
      o.children.some((m) => m.geometry?.type === "CapsuleGeometry"),
  );
}
function insideCapsule(point, center, radius, length) {
  const dx = Math.max(0, Math.abs(point.x - center) - length / 2);
  return dx * dx + point.y * point.y + point.z * point.z < radius * radius;
}

test("specialized lambda excision retains viral DNA while moving adjacent gal", () => {
  let states = 0;
  for (const rootId of ["bacterium", "phage"]) {
    const scene = transduction.create({ rootId });
    scene.update(0, { route: "lambda" });
    const retained = retainedViral(scene);
    assert.ok(
      retained.length > 0,
      "GC-01: an imprecise lambda cut must leave part of the depicted prophage in the donor",
    );
    const transferred = Array.from({ length: 96 }, (_, i) =>
      scene.group.getObjectByName(`transferred-DNA-segment-${i}`),
    );
    assert.ok(transferred.some((mesh) => isViral(mesh.material.color)));
    assert.ok(transferred.some((mesh) => !isViral(mesh.material.color)));
    const donor = donorBackbone(scene);
    // The left excision cut is within phage material, not at its outer boundary.
    donor.getColorAt(15, sampleColor);
    assert.ok(
      isViral(sampleColor),
      "viral DNA lies on the retained side of the cut",
    );
    assert.ok(isViral(transferred.at(-1).material.color));
    for (const p of [0, 0.16, 0.23, 0.33, 0.48, 0.53, 0.33, 0.19]) {
      scene.update(p, { route: "lambda" });
      scene.group.updateMatrixWorld(true);
      assert.deepEqual(
        retainedViral(scene),
        retained,
        "retained viral material stays on the donor",
      );
      assert.equal(
        transferred.filter((m) => !isViral(m.material.color)).length,
        32,
        "same adjacent host locus transfers",
      );
      for (let i = 1; i < transferred.length; i++)
        assert.ok(
          ends(transferred[i - 1])[1].distanceTo(ends(transferred[i])[0]) <
            2e-5,
        );
      for (let i = 16; i < 88; i++) {
        donor.getMatrixAt(i, matrix);
        assert.ok(
          Math.hypot(
            matrix.elements[0],
            matrix.elements[1],
            matrix.elements[2],
          ) < 1e-9,
          "transferred source interval is never duplicated",
        );
      }
      states++;
    }
    scene.update(0.54, { route: "lambda" });
    assert.equal(
      retainedViral(scene).length,
      0,
      "donor DNA disappears with donor lysis",
    );
    scene.update(0.33, { route: "p1" });
    assert.equal(
      retainedViral(scene).length,
      0,
      "P1 does not acquire a chromosomal prophage",
    );
  }
  console.log(`lambda retained/transfer material: ${states} states`);
});

test("E. coli has two bilayers separated by a peptidoglycan-containing periplasm", () => {
  let envelopes = 0;
  for (const rootId of ["bacterium", "phage"])
    for (const route of ["p1", "lambda"]) {
      const scene = transduction.create({ rootId });
      scene.update(0, { route });
      scene.group.updateMatrixWorld(true);
      for (const cell of cells(scene)) {
        const surfaces = cell.children.filter(
          (m) => m.isMesh && !m.isInstancedMesh && m.visible,
        );
        assert.ok(
          surfaces.length >= 5,
          "GC-02: four leaflet surfaces and separate peptidoglycan are needed, not the two faces of one bilayer",
        );
        const layers = [
          "outer-membrane-outer-leaflet",
          "outer-membrane-inner-leaflet",
          "periplasmic-peptidoglycan",
          "inner-membrane-outer-leaflet",
          "inner-membrane-inner-leaflet",
        ].map((name) => cell.getObjectByName(name));
        assert.ok(layers.every(Boolean));
        const scales = layers.map((mesh) => mesh.scale.x);
        assert.ok(scales.every((n, i) => i === 0 || n < scales[i - 1]));
        assert.ok(
          scales[1] - scales[3] >
            scales[0] - scales[1] + (scales[3] - scales[4]),
          "periplasm is separate from both hydrophobic bilayer interiors",
        );
        for (const prefix of ["outer-membrane", "inner-membrane"])
          for (const suffix of [
            "cut-edge-headgroups",
            "cut-edge-hydrophobic-tails",
          ])
            assert.equal(
              cell.getObjectByName(`${prefix}-${suffix}`)?.count,
              192,
            );
        const away = new THREE.Raycaster(
          v(cell.position.x + 0.45, 1.2, -0.02),
          v(0, -1, 0),
          0,
          1,
        ).intersectObjects(layers, false);
        assert.equal(
          new Set(away.map((hit) => hit.object)).size,
          5,
          "all five layers persist away from the local entry port",
        );
        envelopes++;
      }
    }
  console.log(`E. coli envelope topology: ${envelopes} cells`);
});

test("entry conduit connects both membranes and delivered DNA reaches cytoplasm", () => {
  let states = 0;
  for (const rootId of ["bacterium", "phage"])
    for (const route of ["p1", "lambda"]) {
      const scene = transduction.create({ rootId });
      const recipient = cells(scene).find((cell) => cell.position.x > 0);
      const inner = recipient.getObjectByName("inner-membrane-inner-leaflet");
      assert.ok(inner, "GC-02: recipient needs a distinct inner membrane");
      const layers = recipient.children.filter(
        (m) => m.isMesh && !m.isInstancedMesh && m.visible,
      );
      const conduit = scene.group.getObjectByName(
        "trans-envelope-entry-conduit",
      );
      const lumenBottom =
        conduit.position.y - conduit.geometry.parameters.height / 2;
      const lumenTop =
        conduit.position.y + conduit.geometry.parameters.height / 2;
      assert.ok(lumenBottom < 0.9 * inner.scale.y - 0.04);
      assert.ok(lumenTop > 0.9 + 0.04);
      const cargo = [
        "transferred-DNA-segment-",
        "transferred-DNA-partner-",
      ].flatMap((prefix) =>
        Array.from({ length: 96 }, (_, i) =>
          scene.group.getObjectByName(prefix + i),
        ),
      );
      for (const p of [0, 0.23, 0.34, 0.48]) {
        scene.update(p, { route });
        scene.group.updateMatrixWorld(true);
        for (const mesh of cargo)
          for (const point of ends(mesh))
            assert.ok(
              insideCapsule(
                point,
                -2.65,
                0.9 * inner.scale.y,
                1.35 * inner.scale.x,
              ),
              "source and packaging DNA stay inside donor cytoplasm",
            );
      }
      scene.update(0.7, { route });
      scene.group.updateMatrixWorld(true);
      const gates = scene.group
        .getObjectByName("receptor-associated-trans-envelope-entry-schematic")
        .children.filter((object) =>
          object.name.startsWith("recipient-entry-gate-"),
        );
      assert.equal(
        gates.length,
        4,
        "closed entry covers both faces of both bilayers",
      );
      const gated = new THREE.Raycaster(
        v(2.65, 1.2, -0.02),
        v(0, -1, 0),
        0,
        0.7,
      ).intersectObjects(gates, false);
      assert.equal(new Set(gated.map((hit) => hit.object)).size, 4);
      for (const p of [
        0.73, 0.745, 0.76, 0.78, 0.8, 0.82, 0.84, 0.86, 0.88, 0.9, 0.91, 1,
      ]) {
        scene.update(p, { route });
        scene.group.updateMatrixWorld(true);
        const tail = scene.group.getObjectByName(
          "transduction-tail-tube-open-lumen",
        );
        const tailTip = ends(tail).sort((a, b) => a.y - b.y)[0];
        assert.ok(
          tailTip.y < lumenTop && tailTip.y > lumenBottom,
          "tail and trans-envelope conduit overlap",
        );
        for (const mesh of cargo) {
          const [a, b] = ends(mesh),
            delta = b.clone().sub(a),
            distance = delta.length();
          if (
            Math.max(a.y, b.y) >= lumenBottom &&
            Math.min(a.y, b.y) <= lumenTop
          ) {
            const hits = new THREE.Raycaster(
              a,
              delta.clone().normalize(),
              1e-7,
              distance - 1e-7,
            ).intersectObjects(layers, false);
            assert.equal(
              hits.length,
              0,
              "DNA passes actual membrane and wall apertures",
            );
            for (const point of [a, b])
              if (point.y >= lumenBottom && point.y <= lumenTop)
                assert.ok(
                  Math.hypot(point.x - 2.65, point.z) + mesh.scale.x <
                    conduit.geometry.parameters.radiusTop,
                  "DNA remains inside the continuous conduit while crossing both bilayers",
                );
          }
          if (p >= 0.91)
            for (const point of [a, b])
              assert.ok(
                insideCapsule(
                  point,
                  2.65,
                  0.9 * inner.scale.y,
                  1.35 * inner.scale.x,
                ),
                "all delivered DNA is within the cytoplasmic face of the inner membrane",
              );
        }
        states++;
      }
    }
  console.log(`connected entry / cytoplasmic delivery: ${states} states`);
});

if (process.env.GENOME_BEFORE_ROOT)
  test("shared envelope change leaves B. subtilis geometry byte-equivalent", async () => {
    const beforeRoot = pathToFileURL(
      resolve(process.env.GENOME_BEFORE_ROOT) + "/",
    );
    const beforeModel = (
      await import(new URL("bacterialSporulationProcess.js", beforeRoot))
    ).default;
    const afterModel = (
      await import(new URL("bacterialSporulationProcess.js", moduleRoot))
    ).default;
    function signature(scene) {
      const hash = createHash("sha256");
      scene.group.updateMatrixWorld(true);
      scene.group.traverse((object) => {
        hash.update(
          JSON.stringify([
            object.name,
            object.visible,
            object.matrixWorld.elements,
            object.material?.color?.toArray(),
            object.material?.opacity,
          ]),
        );
        for (const attr of [
          object.instanceMatrix,
          object.instanceColor,
          ...Object.values(object.geometry?.attributes || {}),
          object.geometry?.index,
        ])
          if (attr)
            hash.update(
              Buffer.from(
                attr.array.buffer,
                attr.array.byteOffset,
                attr.array.byteLength,
              ),
            );
      });
      return hash.digest("hex");
    }
    for (const engulfment of ["normal", "blocked"]) {
      const before = beforeModel.create(),
        after = afterModel.create();
      for (const p of [0, 0.24, 0.43, 0.56, 0.73, 1, 0.4, 0.9]) {
        before.update(p, { engulfment });
        after.update(p, { engulfment });
        assert.equal(
          signature(after),
          signature(before),
          `B. subtilis ${engulfment} at ${p} must not change`,
        );
      }
    }
  });
