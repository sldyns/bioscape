// Source-only S214 regression; use the existing Vite/native-browser test route.
import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import ProcessScene from "../src/processes/ProcessScene.jsx";
import {
  nativeListenerLedger,
  controlKey,
} from "./s214-native-listener-ledger.js";

const output = document.querySelector("#result");
const fixture = document.querySelector("#fixture");
const arm = new URLSearchParams(location.search).get("arm") || "candidate";
const checks = [],
  rows = [];
const check = (condition, message) =>
  checks.push({ pass: Boolean(condition), message });
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(`Fixture qualification: ${message}`);
};
let nativeFrame;
const frame = () => new Promise((resolve) => nativeFrame(resolve));
async function waitFor(predicate, name) {
  const deadline = performance.now() + 30000;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(`Timeout: ${name}`);
    await frame();
  }
}
let ledger;
let root;
const temporaryHosts = [];
const controlsToRelease = [];
const makeControl = (container) => {
  const canvas = document.createElement("canvas");
  container.append(canvas);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.z = 6;
  const controls = new OrbitControls(camera, canvas);
  controls.listenToKeyEvents(canvas);
  controlsToRelease.push({ controls, oldRoot: canvas.getRootNode() });
  return controls;
};

try {
  if (!["baseline", "candidate"].includes(arm)) throw new Error("Invalid arm");
  if (THREE.REVISION !== "180")
    throw new Error("Requires the frozen Three r180 contract");
  requireCondition(
    typeof requestAnimationFrame === "function" &&
      typeof EventTarget === "function" &&
      typeof ShadowRoot === "function" &&
      typeof HTMLCanvasElement === "function" &&
      typeof KeyboardEvent === "function",
    "native frame, root, canvas and keyboard event APIs are available",
  );
  nativeFrame = requestAnimationFrame.bind(window);
  ledger = nativeListenerLedger();
  let retire = (controls) => controls.dispose();
  if (arm === "candidate") {
    // The unmodified S213 baseline does not contain this helper. Both the URL
    // and ignored import must stay runtime-only so Vite does not resolve it
    // while transforming the baseline route before this branch is selected.
    const helperPath = ["..", "src", "scene", "disposeOrbitControls.js"].join(
      "/",
    );
    const helperUrl = new URL(helperPath, import.meta.url).href;
    const helper = await import(/* @vite-ignore */ helperUrl);
    if (typeof helper.disposeOrbitControls !== "function")
      throw new Error("Candidate cleanup helper is not available");
    retire = helper.disposeOrbitControls;
  }

  // Positive failure detector: the real r180 disposer must leave the exact
  // temporary callback on its old root, even after keyup on that old root.
  const negativeHost = document.createElement("div");
  document.body.append(negativeHost);
  temporaryHosts.push(negativeHost);
  const negative = makeControl(negativeHost);
  controlKey(document, "keydown");
  requireCondition(
    ledger.has(document, "keyup", negative._interceptControlUp),
    "Negative control: actual Control event installs bound keyup callback",
  );
  negative.dispose();
  negative.domElement.remove();
  controlKey(document, "keyup");
  requireCondition(
    ledger.has(document, "keyup", negative._interceptControlUp),
    "Negative control: original r180 cleanup retains callback on old document",
  );
  document.removeEventListener("keyup", negative._interceptControlUp, true);
  negativeHost.remove();

  for (const kind of ["document", "shadow-root"]) {
    const host = document.createElement("div");
    document.body.append(host);
    temporaryHosts.push(host);
    const container =
      kind === "shadow-root" ? host.attachShadow({ mode: "open" }) : host;
    const oldRoot = container.getRootNode();
    const beforeDown = ledger.count(oldRoot, "keydown");
    const beforeUp = ledger.count(oldRoot, "keyup");
    const retired = makeControl(container);
    const survivor = makeControl(container);
    controlKey(oldRoot, "keydown");
    requireCondition(
      ledger.count(oldRoot, "keydown") === beforeDown + 2 &&
        ledger.count(oldRoot, "keyup") === beforeUp + 2,
      `${kind}: two actual controls subscribe independently`,
    );
    retire(retired);
    const upBeforeDetach = ledger.count(oldRoot, "keyup");
    check(
      !ledger.has(oldRoot, "keyup", retired._interceptControlUp) &&
        !ledger.has(oldRoot, "keydown", retired._interceptControlDown),
      `${kind}: retired callbacks absent before canvas detaches`,
    );
    check(
      ledger.has(oldRoot, "keyup", survivor._interceptControlUp),
      `${kind}: disposing one preview preserves the other preview`,
    );
    retired.domElement.remove();
    controlKey(oldRoot, "keyup");
    check(
      !survivor._controlActive && ledger.count(oldRoot, "keyup") === beforeUp,
      `${kind}: survivor handles keyup and old-root listener count returns to baseline`,
    );
    // Re-arm the survivor to cover retiring the final preview with Control held.
    controlKey(oldRoot, "keydown");
    retire(survivor);
    survivor.domElement.remove();
    check(
      ledger.count(oldRoot, "keydown") === beforeDown &&
        ledger.count(oldRoot, "keyup") === beforeUp,
      `${kind}: final preview retirement returns both root counts to baseline`,
    );
    rows.push({
      kind,
      beforeDown,
      beforeUp,
      upBeforeDetach,
      afterDown: ledger.count(oldRoot, "keydown"),
      afterUp: ledger.count(oldRoot, "keyup"),
    });
    // Remove only the expected failed-arm remnants after evidence is recorded.
    for (const controls of [retired, survivor])
      oldRoot.removeEventListener("keyup", controls._interceptControlUp, true);
    host.remove();
  }

  // Exercise the actual ProcessScene call site, not just the helper. A minimal
  // process keeps this a lifecycle test while using real rendering and disposal.
  const definition = {
    id: "s214-lifecycle-fixture",
    stages: [],
    create() {
      const group = new THREE.Group();
      group.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ color: "#84aa9d" }),
        ),
      );
      return {
        group,
        labels: [],
        update() {},
        camera: { position: [0, 0, 6], target: [0, 0, 0] },
      };
    },
  };
  root = createRoot(fixture);
  for (let cycle = 0; cycle < 2; cycle++) {
    let api = null;
    const beforeDown = ledger.count(document, "keydown");
    const beforeUp = ledger.count(document, "keyup");
    root.render(
      <ProcessScene
        definition={definition}
        rootId="cell"
        parameters={{}}
        progress={0.91}
        lang="en"
        annotations={false}
        onSceneReady={(value) => {
          api = value;
        }}
      />,
    );
    await waitFor(() => api?.ready, "real ProcessScene ready");
    const canvas = fixture.querySelector("canvas");
    requireCondition(
      canvas instanceof HTMLCanvasElement &&
        ledger.count(document, "keydown") === beforeDown + 1,
      `ProcessScene/${cycle}: real mount registers its controls`,
    );
    controlKey(document, "keydown");
    requireCondition(
      ledger.count(document, "keyup") === beforeUp + 1,
      `ProcessScene/${cycle}: Control is held across actual React unmount`,
    );
    root.render(null);
    // Wait only for React's DOM commit, never for the behavior under test.
    // Waiting for listener counts to drop would hide the original leak.
    await waitFor(
      () => !fixture.querySelector("canvas"),
      "ProcessScene unmount DOM commit",
    );
    check(
      ledger.count(document, "keydown") === beforeDown &&
        ledger.count(document, "keyup") === beforeUp,
      `ProcessScene/${cycle}: unmount returns both old-root counts to baseline`,
    );
    check(
      !canvas.isConnected && !fixture.querySelector("canvas") && api === null,
      `ProcessScene/${cycle}: canvas and ready API retired`,
    );
    controlKey(document, "keyup");
    check(
      ledger.count(document, "keyup") === beforeUp,
      `ProcessScene/${cycle}: late keyup cannot leave retired root subscription`,
    );
    rows.push({
      kind: "ProcessScene",
      cycle,
      beforeDown,
      beforeUp,
      afterDown: ledger.count(document, "keydown"),
      afterUp: ledger.count(document, "keyup"),
    });
    // A failed baseline is intentionally isolated by reloading for further work.
    if (ledger.count(document, "keyup") !== beforeUp) break;
  }
  output.textContent = JSON.stringify({
    status: checks.every((c) => c.pass) ? "PASS" : "FAIL",
    arm,
    threeRevision: THREE.REVISION,
    checks,
    rows,
    scope:
      "Native DOM events and installed OrbitControls; no GC/heap/GPU-memory/FPS claim",
  });
} catch (error) {
  output.textContent = JSON.stringify({
    status: "ERROR",
    arm,
    error: String(error),
    checks,
    rows,
  });
} finally {
  try {
    root?.unmount();
    for (const { controls, oldRoot } of controlsToRelease) {
      oldRoot.removeEventListener(
        "keydown",
        controls._interceptControlDown,
        true,
      );
      oldRoot.removeEventListener("keyup", controls._interceptControlUp, true);
      controls.dispose();
      controls.domElement.remove();
    }
    for (const host of temporaryHosts) host.remove();
  } finally {
    ledger?.restore();
  }
}
