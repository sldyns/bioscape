import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  normalizeSceneView,
  readSceneView,
  applySceneView,
  captureCamera,
  layoutCaptureLabels,
} from "../src/scene/sceneCapture.js";

test("view round trips orientation, target and fit-relative zoom", () => {
  const camera = new THREE.PerspectiveCamera(36, 2, 0.1, 100);
  const target = new THREE.Vector3(1, 2, 3);
  camera.position.set(1, 2, 23);
  assert.deepEqual(readSceneView(camera, target, 10), {
    direction: [0, 0, 1],
    target: [1, 2, 3],
    zoom: 2,
  });
  assert.equal(
    applySceneView(camera, target, 5, {
      direction: [3, 0, 0],
      target: [-1, 0, 2],
      zoom: 2,
    }),
    true,
  );
  assert.deepEqual(camera.position.toArray(), [9, 0, 2]);
  assert.deepEqual(target.toArray(), [-1, 0, 2]);
});

test("invalid saved views cannot poison the live camera", () => {
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(2, 3, 4);
  const target = new THREE.Vector3();
  const bad = [
    null,
    {},
    { direction: [0, 0, 0], target: [0, 0, 0], zoom: 1 },
    { direction: [0, 0, 1], target: [Infinity, 0, 0], zoom: 1 },
    { direction: [0, 0, 1], target: [0, 0, 0], zoom: NaN },
    { direction: [0, 0, 1], target: [0, 0, 0], zoom: -1 },
    { direction: [0, 0, 1], target: [1e10, 0, 0], zoom: 1 },
  ];
  for (const view of bad)
    assert.equal(applySceneView(camera, target, 10, view), false);
  assert.deepEqual(camera.position.toArray(), [2, 3, 4]);
  assert.deepEqual(target.toArray(), [0, 0, 0]);
  assert.ok(
    normalizeSceneView({ direction: [0, 0, 5], target: [0, 0, 0], zoom: 1 })
      .direction[2] === 1,
  );
});

test("capture adjusts fit for aspect and turns relative to camera without touching live pose", () => {
  const camera = new THREE.PerspectiveCamera(36, 2, 0.1, 100);
  const target = new THREE.Vector3(1, 0, 0);
  camera.position.set(1, 0, 20);
  camera.lookAt(target);
  const copy = captureCamera(
    camera,
    target,
    10,
    500,
    1000,
    Math.PI / 2,
    (exportCamera) => (exportCamera.aspect < 1 ? 30 : 10),
  );
  assert.equal(copy.aspect, 0.5);
  assert.ok(Math.abs(copy.position.x - 61) < 1e-9);
  assert.ok(Math.abs(copy.position.z) < 1e-9);
  assert.equal(copy.position.distanceTo(target), 60);
  assert.equal(camera.aspect, 2);
  assert.deepEqual(camera.position.toArray(), [1, 0, 20]);
});

test("capture labels remain within canvas with legible spacing and omit excess annotations", () => {
  const labels = Array.from({ length: 80 }, (_, index) => ({
    text: `Annotation ${index}`,
    x: index % 2 ? 400 : 100,
    y: 200,
    priority: 80 - index,
  }));
  const placed = layoutCaptureLabels(
    labels,
    500,
    600,
    (text) => text.length * 12,
  );
  assert.ok(placed.length < labels.length);
  assert.ok(placed.length > 0);
  for (const item of placed) {
    assert.ok(item.fontSize >= 500 / 40);
    assert.ok(item.left >= 0 && item.left + item.width <= 500);
    assert.ok(item.top >= 0 && item.top + item.height <= 600);
  }
  for (let a = 0; a < placed.length; a++)
    for (let b = a + 1; b < placed.length; b++) {
      const x = placed[a],
        y = placed[b];
      assert.ok(
        x.left + x.width <= y.left ||
          y.left + y.width <= x.left ||
          x.top + x.height <= y.top ||
          y.top + y.height <= x.top,
      );
    }
  assert.ok(placed.some((item) => item.text === "Annotation 0"));
});

test("English export labels wrap at word boundaries when the words fit", () => {
  const placed = layoutCaptureLabels(
    [{ text: "Contractile sheath", x: 20, y: 200 }],
    320,
    400,
    (text) => text.length * 7,
  );
  assert.deepEqual(placed[0].lines, ["Contractile", "sheath"]);
});

test("export leader strokes contrast with both studio themes and transparent placements", async () => {
  const { captureLabelPalette } = await import("../src/scene/sceneCapture.js");
  const luminance = (hex) => {
    const c = new THREE.Color(hex);
    return c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
  };
  for (const background of ["#141b26", "#ffffff", "#f5f5f7"]) {
    const ink = luminance(captureLabelPalette(background).line);
    const paper = luminance(background);
    assert.ok(
      (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05) > 4.5,
    );
  }
  assert.ok(captureLabelPalette("transparent").halo);
});

test("elongated assembled and exploded bounds fit rotated portrait and landscape captures", async () => {
  const { explodedFitDistance } = await import("../src/scene/viewFraming.js");
  const parts = [
    {
      userData: {
        frameBounds: new THREE.Box3(
          new THREE.Vector3(-2.7, -1, -0.4),
          new THREE.Vector3(2.7, 1, 0.4),
        ),
        offset: new THREE.Vector3(0.5, 1, 0.6),
      },
    },
    {
      userData: {
        frameBounds: new THREE.Box3(
          new THREE.Vector3(-2, -0.4, -0.7),
          new THREE.Vector3(-1, 0.4, 0.7),
        ),
        offset: new THREE.Vector3(-0.6, 0, 0),
      },
    },
  ];
  for (const aspect of [0.5, 760 / 560, 2.5])
    for (const turn of [0, Math.PI / 4, Math.PI / 2, Math.PI])
      for (const amount of [0, 0.55, 1]) {
        const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 100);
        const direction = new THREE.Vector3(
          Math.sin(turn),
          0.2,
          Math.cos(turn),
        ).normalize();
        camera.position.copy(direction).multiplyScalar(10);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        const axes = [0, 1, 2].map((i) =>
          new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, i),
        );
        const distance = Math.max(
          4,
          explodedFitDistance(parts, amount, aspect, 36, axes),
        );
        camera.position.copy(direction).multiplyScalar(distance);
        camera.updateMatrixWorld();
        for (const {
          userData: { frameBounds: b, offset },
        } of parts)
          for (const x of [b.min.x, b.max.x])
            for (const y of [b.min.y, b.max.y])
              for (const z of [b.min.z, b.max.z]) {
                const projected = new THREE.Vector3(x, y, z)
                  .addScaledVector(offset, amount)
                  .project(camera);
                assert.ok(
                  Math.abs(projected.x) < 1 &&
                    Math.abs(projected.y) < 1 &&
                    Math.abs(projected.z) < 1,
                );
              }
      }
});

test("a reused capture camera tracks current lens settings without mutating the live camera", () => {
  const camera = new THREE.PerspectiveCamera(36, 2, 0.1, 100);
  camera.position.set(0, 0, 10);
  const target = new THREE.Vector3();
  const scratch = captureCamera(camera, target, 10, 400, 600, 0, () => 10);
  camera.fov = 50;
  camera.near = 0.4;
  camera.updateProjectionMatrix();
  const updated = captureCamera(
    camera,
    target,
    10,
    800,
    400,
    Math.PI / 2,
    () => 12,
    scratch,
  );
  assert.equal(updated, scratch);
  assert.equal(updated.fov, 50);
  assert.equal(updated.near, 0.4);
  assert.equal(updated.aspect, 2);
  assert.ok(Math.abs(updated.position.x - 12) < 1e-9);
  assert.ok(Math.abs(updated.position.z) < 1e-9);
  assert.deepEqual(camera.position.toArray(), [0, 0, 10]);
});
