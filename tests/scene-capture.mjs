import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  normalizeSceneView,
  readSceneView,
  applySceneView,
  captureCamera,
  layoutCaptureLabels,
  createCaptureLabelMask,
  drawCaptureLabels,
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

// R05: these conservative occupied regions reproduce the peripheral enzyme and
// DNA conflicts observed in the original 960x640 captures. They test the layout
// contract; root separately re-captures actual GPU pixels for rendered approval.
const labelMeasure = (text, size) =>
  [...text].reduce(
    (sum, character) =>
      sum + size * (/[^\x00-\x7f]/u.test(character) ? 1 : 0.55),
    0,
  );
const labelFixture = (text, x, y) => ({ text, x, y });
function fixturePixels(width, height, rectangles) {
  const pixels = new Uint8Array(width * height * 4);
  for (const [left, top, right, bottom, alpha = 255] of rectangles)
    for (let y = top; y < bottom; y++)
      for (let x = left; x < right; x++)
        pixels[(y * width + x) * 4 + 3] = alpha;
  return pixels;
}
function layoutConstraints(items, width, height) {
  for (const item of items) {
    assert(item.left >= 0 && item.top >= 0);
    assert(item.left + item.width <= width && item.top + item.height <= height);
  }
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i],
        b = items[j];
      assert(
        a.left + a.width <= b.left ||
          b.left + b.width <= a.left ||
          a.top + a.height <= b.top ||
          b.top + b.height <= a.top,
        `${a.text} overlaps ${b.text}`,
      );
    }
  for (const side of [-1, 1]) {
    const column = items.filter((item) => item.side === side);
    for (let i = 1; i < column.length; i++) {
      assert(column[i].y >= column[i - 1].y, "Preserve anchor order");
      assert(column[i].top > column[i - 1].top, "Preserve caption order");
    }
  }
}
const sosBase = [
  labelFixture("损伤相关 ssDNA 间隙", 650, 195),
  labelFixture("LexA 二聚体", 359, 371),
  labelFixture("模板链 3′ → 5′", 190, 445),
  labelFixture("编码链 5′ → 3′", 185, 437),
  labelFixture("SOS box", 385, 457),
];
for (const fixture of [
  {
    name: "RNA stage 4 CCR4–NOT",
    labels: [
      labelFixture("5′ 帽", 106, 403),
      labelFixture("TNRC6 / GW182", 643, 302),
      labelFixture("Argonaute · 成熟miRNA", 517, 312),
      labelFixture("CCR4–NOT", 849, 361),
      labelFixture("引导链 5′ → 3′ 向左", 611, 366),
      labelFixture("3′ · poly(A)", 877, 396),
      labelFixture("mRNA · 3′ UTR 靶位点", 484, 425),
    ],
    regions: [
      [320, 230, 640, 408],
      [605, 255, 730, 325],
      [760, 309, 890, 386],
      [99, 393, 881, 408],
    ],
  },
  {
    name: "SOS start damage gap",
    labels: sosBase,
    regions: [
      [88, 155, 875, 215],
      [101, 413, 855, 457],
      [335, 350, 430, 430],
      [330, 444, 442, 474],
    ],
  },
  {
    name: "SOS stage 5 RecA and damage gap",
    labels: [
      labelFixture("LexA 自切割", 365, 119),
      labelFixture("RecA* 核蛋白丝状体", 312, 146),
      ...sosBase.filter((x) => x.text !== "LexA 二聚体"),
      labelFixture("RNA 聚合酶", 569, 382),
      labelFixture("应答 RNA · 5′ → 3′", 405, 523),
    ],
    regions: [
      [88, 155, 875, 215],
      [101, 413, 855, 457],
      [294, 104, 600, 302],
      [484, 351, 617, 452],
      [402, 515, 615, 531],
    ],
  },
])
  test(`occupied-pixel layout preserves all labels without model overlap: ${fixture.name}`, () => {
    const original = structuredClone(fixture.labels);
    const pixels = fixturePixels(960, 640, fixture.regions);
    const previousPixels = pixels.slice();
    const occupied = createCaptureLabelMask(pixels, 960, 640);
    const before = layoutCaptureLabels(fixture.labels, 960, 640, labelMeasure);
    const after = layoutCaptureLabels(
      fixture.labels,
      960,
      640,
      labelMeasure,
      occupied,
    );
    const cost = (items) =>
      items.reduce(
        (sum, item) =>
          sum + occupied(item.left, item.top, item.width, item.height),
        0,
      );
    assert(
      cost(before) > 0,
      "The regression fixture must actually expose the old model occlusion",
    );
    assert.equal(
      cost(after),
      0,
      "Caption boxes must avoid these available model pixels",
    );
    assert.equal(
      after.length,
      fixture.labels.length,
      "No caption is hidden to solve overlap",
    );
    const content = (items) =>
      items.map(({ text, lines, fontSize, width, height, x, y, side }) => ({
        text,
        lines,
        fontSize,
        width,
        height,
        x,
        y,
        side,
      }));
    assert.deepEqual(
      content(after),
      content(before),
      "Keep original text, font, wrapping, anchors and columns",
    );
    assert.deepEqual(fixture.labels, original, "Do not rewrite source anchors");
    assert.deepEqual(pixels, previousPixels, "Never alter the rendered pixels");
    layoutConstraints(after, 960, 640);
  });

test("capture occupancy respects top-down readback, alpha edges and scaled composition coordinates", () => {
  const pixels = fixturePixels(960, 640, [
    [200, 120, 201, 121, 16],
    [800, 480, 801, 481, 255],
  ]);
  const occupied = createCaptureLabelMask(pixels, 960, 640, 2);
  assert(
    occupied(99, 59, 3, 3) > 0,
    "A one-pixel translucent feature survives conservative binning",
  );
  assert(
    occupied(399, 239, 3, 3) > 0,
    "Canvas labelScale maps to physical render pixels",
  );
  assert.equal(
    occupied(99, 259, 3, 3),
    0,
    "Do not vertically flip the already top-down pixel buffer",
  );
  assert.equal(occupied(-100, -100, 2, 2), 0);
  assert.equal(occupied(900, 900, 2, 2), 0);
});

test("a fully occupied export still keeps every chosen label with valid spacing", () => {
  const labels = Array.from({ length: 12 }, (_, i) =>
    labelFixture(`Label ${i}`, i % 2 ? 800 : 160, 80 + (i % 6) * 90),
  );
  const before = layoutCaptureLabels(labels, 960, 640, labelMeasure);
  const occupied = createCaptureLabelMask(
    fixturePixels(960, 640, [[0, 0, 960, 640]]),
    960,
    640,
  );
  const after = layoutCaptureLabels(labels, 960, 640, labelMeasure, occupied);
  assert.equal(after.length, before.length);
  assert.equal(after.length, labels.length);
  layoutConstraints(after, 960, 640);
});

test("very small labelScale cannot expand the occupancy search without bound", () => {
  const scale = 0.0001,
    width = 960 / scale,
    height = 640 / scale;
  const labels = [100, 280, 440].map((y, index) => ({
    text: `Label ${index}`,
    x: 100 / scale,
    y: y / scale,
  }));
  let rectangleQueries = 0;
  const placed = layoutCaptureLabels(
    labels,
    width,
    height,
    labelMeasure,
    () => {
      rectangleQueries++;
      return 0;
    },
  );
  assert.equal(placed.length, labels.length);
  assert(
    rectangleQueries <= labels.length * 4096,
    "Search work is bounded independently of logical labelScale",
  );
  layoutConstraints(placed, width, height);
  assert.deepEqual(
    layoutCaptureLabels([], Infinity, Infinity, labelMeasure),
    [],
  );
});

test("export draws every leader beneath every caption background and text", async () => {
  const draw = process.env.BIOSCAPE_CAPTURE_DRAWING_REVIEW_MODULE
    ? (await import(process.env.BIOSCAPE_CAPTURE_DRAWING_REVIEW_MODULE))
        .drawCaptureLabels
    : drawCaptureLabels;
  const camera = new THREE.PerspectiveCamera(36, 1.5, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const sources = [
    {
      text: "Transit peptide removed · precursor in cytosol",
      position: new THREE.Vector3(0, 1, 0),
    },
    { text: "TOC / TIC", position: new THREE.Vector3(1, 0.5, 0) },
    {
      text: "Presequence removed · precursor in cytosol",
      position: new THREE.Vector3(0, -1, 0),
    },
    { text: "TOM / TIM", position: new THREE.Vector3(1, -1.5, 0) },
  ];
  for (const background of ["#f5f5f7", "transparent"]) {
    const events = [];
    let path = null;
    const context = {
      measureText: (text) => ({ width: text.length * 7 }),
      beginPath: () => {
        path = null;
      },
      moveTo: (x, y) => {
        path = { kind: "leader", from: [x, y] };
      },
      lineTo: (x, y) => {
        path.to = [x, y];
      },
      roundRect: (...bounds) => {
        path = { kind: "caption", bounds };
      },
      stroke: () =>
        events.push({ operation: "stroke", path: structuredClone(path) }),
      fill: () =>
        events.push({ operation: "fill", path: structuredClone(path) }),
      fillText: (text, x, y) => events.push({ operation: "text", text, x, y }),
    };
    draw(context, sources, camera, 960, 640, background);
    const leaders = events
      .map((event, index) => ({ ...event, index }))
      .filter(
        (event) => event.operation === "stroke" && event.path.kind === "leader",
      );
    const captions = events
      .map((event, index) => ({ ...event, index }))
      .filter(
        (event) => event.operation === "fill" && event.path.kind === "caption",
      );
    const texts = events
      .map((event, index) => ({ ...event, index }))
      .filter((event) => event.operation === "text");
    assert.equal(
      captions.length,
      sources.length,
      "Every label still receives its own background",
    );
    assert.equal(
      texts.length,
      sources.length,
      "Every original one-line caption is drawn",
    );
    assert.equal(
      leaders.length,
      sources.length * (background === "transparent" ? 2 : 1),
      "Transparent leader halos remain intact",
    );
    assert(
      Math.max(...leaders.map((event) => event.index)) <
        Math.min(...captions.map((event) => event.index)),
      "No later leader may be painted over any caption background",
    );
    assert(
      Math.max(...leaders.map((event) => event.index)) <
        Math.min(...texts.map((event) => event.index)),
      "No leader stroke may strike through the text layer",
    );
    assert.deepEqual(
      texts.map((event) => event.text),
      sources.map((source) => source.text),
    );
  }
});
