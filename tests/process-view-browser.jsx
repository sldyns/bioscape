import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import ProcessScene from "../src/processes/ProcessScene.jsx";
import mitosis from "../src/processes/modules/division/mitosisProcess.js";
import meiosis from "../src/processes/modules/division/meiosisProcess.js";

const fixture = document.querySelector("#fixture");
const output = document.querySelector("#result");
const images = document.querySelector("#images");
const checks = [];
const rows = [];
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const check = (pass, message) => checks.push({ pass: Boolean(pass), message });
function difference(a, b) {
  let pixels = 0;
  for (let i = 0; i < a.length; i += 4)
    if (a.slice(i, i + 4).some((v, j) => v !== b[i + j])) pixels++;
  return pixels;
}
// Queue after the scene's public requestRender, within the same animation frame.
// This reads the live renderer, not captureFrame's independently fitted camera.
async function liveFrame(api) {
  api.requestRender();
  return new Promise((resolve) =>
    requestAnimationFrame(() => {
      const live = fixture.querySelector("canvas");
      const copy = document.createElement("canvas");
      copy.width = live.width;
      copy.height = live.height;
      const context = copy.getContext("2d");
      context.drawImage(live, 0, 0);
      resolve({
        canvas: copy,
        pixels: context.getImageData(0, 0, copy.width, copy.height).data,
      });
    }),
  );
}
let root;
(async () => {
  try {
    for (const definition of [mitosis, meiosis]) {
      let api;
      const mount = async (initialView) => {
        root = createRoot(fixture);
        flushSync(() =>
          root.render(
            <ProcessScene
              definition={definition}
              rootId="cell"
              initialView={initialView}
              lang="en"
              progress={0.65}
              parameters={
                definition === mitosis ? { attachment: "normal" } : {}
              }
              annotations={false}
              resetKey={0}
              zoom={{ direction: null, key: 0 }}
              onSceneReady={(value) => {
                api = value;
              }}
            />,
          ),
        );
        const end = performance.now() + 30000;
        while (!api?.ready) {
          if (performance.now() > end) throw Error("Scene readiness timeout");
          await frame();
        }
        await frame();
      };
      await mount();
      const canvas = fixture.querySelector("canvas");
      const initial = api.getView();
      // Exercise the installed OrbitControls keyboard path; synthetic input is
      // deliberate here, separate from real pointer performance measurements.
      for (let i = 0; i < 36; i++)
        canvas.dispatchEvent(
          new KeyboardEvent("keydown", {
            code: "ArrowRight",
            key: "ArrowRight",
            shiftKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
      for (let i = 0; i < 160; i++) {
        api.requestRender();
        await frame();
      }
      const rotated = api.getView();
      check(
        Math.abs(rotated.direction[0] - initial.direction[0]) > 0.2,
        `${definition.id}: installed controls actually rotate`,
      );
      const before = await liveFrame(api);
      const unchanged = await liveFrame(api);
      check(
        difference(before.pixels, unchanged.pixels) === 0,
        `${definition.id}: settled live readback is deterministic`,
      );
      const opaque = before.pixels.filter(
        (v, i) => i % 4 === 3 && v > 0,
      ).length;
      check(
        opaque > 1000,
        `${definition.id}: live readback contains rendered pixels`,
      );
      flushSync(() => root.unmount());
      root = null;
      await mount(rotated);
      for (let i = 0; i < 4; i++) {
        api.requestRender();
        await frame();
      }
      const after = await liveFrame(api);
      const changedPixels = difference(before.pixels, after.pixels);
      check(
        changedPixels === 0,
        `${definition.id}: restoring saved rotated view after remount preserves physical live framing`,
      );
      before.canvas.title = `${definition.id} before view replay`;
      after.canvas.title = `${definition.id} after view replay`;
      images.append(before.canvas, after.canvas);
      rows.push({
        process: definition.id,
        changedPixels,
        opaque,
        initial,
        rotated,
        restored: api.getView(),
        buffer: [canvas.width, canvas.height],
        dpr: devicePixelRatio,
      });
      flushSync(() => root.unmount());
      root = null;
    }
    output.textContent = JSON.stringify({
      status: checks.every((c) => c.pass) ? "PASS" : "FAIL",
      checks,
      rows,
    });
  } catch (error) {
    output.textContent = JSON.stringify({
      status: "ERROR",
      error: String(error),
      checks,
      rows,
    });
  } finally {
    root?.unmount();
  }
})();
