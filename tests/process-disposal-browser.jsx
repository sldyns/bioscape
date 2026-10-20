import React from "react";
import { createRoot } from "react-dom/client";
import ProcessScene from "../src/processes/ProcessScene.jsx";
import mitosis from "../src/processes/modules/division/mitosisProcess.js";
import meiosis from "../src/processes/modules/division/meiosisProcess.js";

const output = document.querySelector("#result");
const root = createRoot(document.querySelector("#fixture"));
const checks = [],
  rows = [],
  ids = new WeakMap(),
  pending = new Set();
let nextId = 0,
  api = null;
const add = EventTarget.prototype.addEventListener;
const remove = EventTarget.prototype.removeEventListener;
const capture = (options) =>
  typeof options === "boolean" ? options : Boolean(options?.capture);
const tracked = (target, type, listener, options) =>
  target === document && type === "keydown" && listener && capture(options);
EventTarget.prototype.addEventListener = function (type, listener, options) {
  if (tracked(this, type, listener, options)) {
    if (!ids.has(listener)) ids.set(listener, ++nextId);
    pending.add(ids.get(listener));
  }
  return add.call(this, type, listener, options);
};
EventTarget.prototype.removeEventListener = function (type, listener, options) {
  if (tracked(this, type, listener, options)) pending.delete(ids.get(listener));
  return remove.call(this, type, listener, options);
};
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const check = (pass, message) => checks.push({ pass: Boolean(pass), message });
const ready = (value) => {
  api = value;
};
async function waitReady() {
  const end = performance.now() + 30000;
  while (performance.now() < end) {
    if (api?.ready && document.querySelector("#fixture canvas")) return;
    await frame();
  }
  throw Error("Actual process scene did not become ready");
}
(async () => {
  try {
    for (const definition of [mitosis, meiosis]) {
      for (let cycle = 0; cycle < 2; cycle++) {
        const before = pending.size;
        root.render(
          <ProcessScene
            definition={definition}
            rootId="cell"
            parameters={{}}
            progress={0.83}
            lang="en"
            annotations={false}
            onSceneReady={ready}
          />,
        );
        await waitReady();
        await frame();
        const active = pending.size;
        check(
          active === before + 1,
          `${definition.id}/${cycle}: actual controls register one document capture listener`,
        );
        root.render(null);
        await frame();
        await frame();
        rows.push({
          process: definition.id,
          cycle,
          before,
          active,
          after: pending.size,
        });
        check(
          pending.size === before,
          `${definition.id}/${cycle}: unmount removes the original document subscription`,
        );
        check(
          api === null && !document.querySelector("#fixture canvas"),
          `${definition.id}/${cycle}: ready API and DOM canvas are released`,
        );
      }
    }
    check(
      pending.size === 0,
      "No document keyboard subscriptions accumulate across remounts",
    );
    output.textContent = JSON.stringify({
      status: checks.every((item) => item.pass) ? "PASS" : "FAIL",
      checks,
      rows,
      scope:
        "Actual React/OrbitControls unmount listener ownership; no forced GC, heap, GPU-memory or FPS claim",
    });
  } catch (error) {
    output.textContent = JSON.stringify({
      status: "ERROR",
      error: String(error),
      checks,
      rows,
    });
  } finally {
    root.unmount();
    EventTarget.prototype.addEventListener = add;
    EventTarget.prototype.removeEventListener = remove;
  }
})();
