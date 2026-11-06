import assert from "node:assert/strict";
import { test } from "node:test";
import { resetSharedRenderingState } from "../src/scene/resetSharedRenderingState.js";

function previouslyUsedStructureRenderer() {
  const renderer = {
    domElement: {},
    environment: {},
    shadowMap: {
      enabled: true,
      type: "soft",
      autoUpdate: false,
      needsUpdate: true,
    },
    info: { autoReset: false },
    autoClear: false,
    autoClearColor: false,
    autoClearDepth: false,
    autoClearStencil: false,
    sortObjects: false,
    target: { captureTarget: true },
    scissor: true,
    clearAlpha: 0,
    pixelRatio: 1.8,
    setRenderTarget(value) {
      this.target = value;
    },
    setScissorTest(value) {
      this.scissor = value;
    },
  };
  return renderer;
}

test("a process cannot inherit structure shadows or a previous capture target", () => {
  const renderer = previouslyUsedStructureRenderer();
  resetSharedRenderingState(renderer, "default-shadow-type");
  assert.equal(renderer.target, null);
  assert.equal(renderer.scissor, false);
  assert.deepEqual(renderer.shadowMap, {
    enabled: false,
    type: "default-shadow-type",
    autoUpdate: true,
    needsUpdate: false,
  });
  assert.equal(renderer.autoClear, true);
  assert.equal(renderer.autoClearColor, true);
  assert.equal(renderer.autoClearDepth, true);
  assert.equal(renderer.autoClearStencil, true);
  assert.equal(renderer.info.autoReset, true);
  assert.equal(renderer.sortObjects, true);
});

test("drawing reset preserves the owned canvas/environment and scene-specific alpha/pixel ratio", () => {
  const renderer = previouslyUsedStructureRenderer();
  const { domElement, environment } = renderer;
  resetSharedRenderingState(renderer, "default");
  assert.equal(renderer.domElement, domElement);
  assert.equal(renderer.environment, environment);
  assert.equal(renderer.clearAlpha, 0);
  assert.equal(renderer.pixelRatio, 1.8);
  renderer.clearAlpha = 1;
  renderer.pixelRatio = 2;
  renderer.shadowMap.enabled = true;
  resetSharedRenderingState(renderer, "default");
  assert.equal(renderer.clearAlpha, 1);
  assert.equal(renderer.pixelRatio, 2);
  assert.equal(renderer.shadowMap.enabled, false);
});
