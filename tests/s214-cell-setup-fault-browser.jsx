// Actual React + CellScene + installed Three + native browser resources.
// Test hooks observe acquired resources and inject one synchronous failure.
// No mock of ownSetup/finishSetup/disposeOrbitControls or their call counts.
import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import CellScene from "../src/CellScene.jsx";
import {
  nativeListenerLedger,
  controlKey,
} from "./s214-native-listener-ledger.js";

const output = document.querySelector("#result");
const fixture = document.querySelector("#fixture");
const fault = new URLSearchParams(location.search).get("fault") || "observe";
const lateFault = fault === "late-pointer" || fault === "cleanup-throws";
const checks = [];
const check = (pass, message) => checks.push({ pass: Boolean(pass), message });
const requireCondition = (pass, message) => {
  if (!pass) throw new Error(`Fixture qualification failed: ${message}`);
};
const sentinel = new Error(`S214 injected ${fault}`);
const cleanupSentinel = new Error("S214 injected observer cleanup failure");
let ledger,
  beforeDown = 0,
  beforeUp = 0;
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalSetAttribute = Element.prototype.setAttribute;
const originalFromScene = THREE.PMREMGenerator.prototype.fromScene;
const originalAdd = THREE.Object3D.prototype.add;
const NativeResizeObserver = window.ResizeObserver;
const NativeWorker = window.Worker;
const originalRequest = window.requestAnimationFrame;
const originalCancel = window.cancelAnimationFrame;
const nativeRequest = originalRequest?.bind(window);
const nativeCancel = originalCancel?.bind(window);
const pendingFrames = new Set(),
  observerRows = [],
  resources = new Map();
const workerRows = [];
const disposalCounts = new Map();
let root,
  api = null,
  caught = null,
  injected = 0,
  environmentReturned = false;
let cleanupInjected = 0,
  lateBoundary = null;
let latePointerEntries = [];
let renderer, canvas, oldHost, wrappedRenderBufferDirect, floor, shadow;
let mounted = true;

function watchDisposable(object, role) {
  if (disposalCounts.has(object)) return;
  const entry = {
    role,
    calls: 0,
    completions: 0,
    errors: 0,
    original: object.dispose,
  };
  disposalCounts.set(object, entry);
  object.dispose = function (...args) {
    entry.calls++;
    try {
      const result = entry.original.apply(this, args);
      entry.completions++;
      return result;
    } catch (error) {
      entry.errors++;
      throw error;
    }
  };
}
function watchEvent(object, role) {
  if (resources.has(object)) return;
  const entry = { role, events: 0, listener: null };
  entry.listener = () => {
    entry.events++;
  };
  object.addEventListener("dispose", entry.listener);
  resources.set(object, entry);
}
const nativeFrame = () => new Promise((resolve) => nativeRequest(resolve));
async function waitFor(predicate, name) {
  const deadline = performance.now() + 45000;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(`Timeout: ${name}`);
    await nativeFrame();
  }
}
class FailureBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    caught = error;
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

try {
  requireCondition(
    [
      "pmrem",
      "shadow2d",
      "observe",
      "none",
      "late-pointer",
      "cleanup-throws",
    ].includes(fault),
    "Known fault selector",
  );
  requireCondition(THREE.REVISION === "180", "Frozen Three r180 contract");
  requireCondition(
    typeof NativeResizeObserver === "function",
    "Native ResizeObserver is available",
  );
  requireCondition(
    !lateFault || typeof NativeWorker === "function",
    "Late acquisition fixture requires native Worker support",
  );
  requireCondition(
    typeof nativeRequest === "function" && typeof nativeCancel === "function",
    "Native animation-frame APIs are available",
  );
  requireCondition(
    typeof EventTarget === "function" && typeof ShadowRoot === "function",
    "Native EventTarget and ShadowRoot are available",
  );
  ledger = nativeListenerLedger();
  beforeDown = ledger.count(document, "keydown");
  beforeUp = ledger.count(document, "keyup");
  if (lateFault)
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        const entry = {
          worker: this,
          url: String(url),
          terminations: 0,
          errorEvents: 0,
          onError: null,
        };
        entry.onError = () => {
          entry.errorEvents++;
        };
        this.addEventListener("error", entry.onError);
        this.s214Worker = entry;
        workerRows.push(entry);
      }
      terminate() {
        const result = super.terminate();
        this.s214Worker.terminations++;
        return result;
      }
    };
  window.requestAnimationFrame = (callback) => {
    const id = nativeRequest((time) => {
      pendingFrames.delete(id);
      callback(time);
    });
    pendingFrames.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    pendingFrames.delete(id);
    nativeCancel(id);
  };
  window.ResizeObserver = class extends NativeResizeObserver {
    constructor(callback) {
      const entry = {
        observer: null,
        targets: new Set(),
        callbacks: 0,
        disconnects: 0,
        observedHost: false,
      };
      super((entries, observer) => {
        entry.callbacks++;
        callback(entries, observer);
      });
      entry.observer = this;
      this.s214 = entry;
      observerRows.push(entry);
    }
    observe(target, options) {
      super.observe(target, options);
      this.s214.targets.add(target);
      if (target === oldHost) this.s214.observedHost = true;
      if (fault === "observe" && injected === 0 && target === oldHost) {
        injected++;
        throw sentinel; // Native observation has genuinely started before failure.
      }
    }
    unobserve(target) {
      super.unobserve(target);
      this.s214.targets.delete(target);
    }
    disconnect() {
      super.disconnect();
      this.s214.disconnects++;
      this.s214.targets.clear();
      if (
        fault === "cleanup-throws" &&
        this.s214.observedHost &&
        injected === 1 &&
        cleanupInjected === 0
      ) {
        cleanupInjected++;
        // Fail only AFTER the actual acquired native observer released its targets.
        // Remaining owner release and the original setup error are the oracle.
        throw cleanupSentinel;
      }
    }
  };
  THREE.PMREMGenerator.prototype.fromScene = function (room, ...args) {
    if (renderer)
      throw new Error(
        "Unexpected second CellScene setup in one fault document",
      );
    renderer = this._renderer; // Version-pinned r180 field; fail if it changes.
    if (!renderer?.isWebGLRenderer)
      throw new Error("No real r180 WebGLRenderer");
    canvas = renderer.domElement;
    oldHost = canvas.parentElement;
    wrappedRenderBufferDirect = renderer.renderBufferDirect;
    watchDisposable(renderer, "renderer");
    watchDisposable(this, "pmrem");
    watchDisposable(room, "room");
    room.traverse((object) => {
      if (object.isMesh) {
        watchEvent(object.geometry, "room-geometry");
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          watchEvent(material, "room-material");
      }
    });
    requireCondition(
      oldHost?.classList.contains("model-canvas"),
      "Observe actual mounted CellScene canvas",
    );
    requireCondition(
      ledger.count(document, "keydown") === beforeDown + 1,
      "Actual OrbitControls already owns one document keydown listener at fault entry",
    );
    controlKey(document, "keydown");
    requireCondition(
      ledger.count(document, "keyup") === beforeUp + 1,
      "Actual Control event arms the temporary keyup listener before setup failure",
    );
    if (fault === "pmrem") {
      injected++;
      throw sentinel;
    }
    const env = originalFromScene.call(this, room, ...args);
    watchDisposable(env, "environment-target");
    watchEvent(env, "environment-target");
    environmentReturned = true;
    return env;
  };
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    if (
      fault === "shadow2d" &&
      injected === 0 &&
      environmentReturned &&
      kind === "2d" &&
      this.width === 128 &&
      this.height === 128 &&
      !this.isConnected
    ) {
      injected++;
      return null; // Real product dereference must produce its own TypeError.
    }
    return originalGetContext.call(this, kind, ...args);
  };
  Element.prototype.setAttribute = function (name, value) {
    const result = originalSetAttribute.call(this, name, value);
    if (
      lateFault &&
      injected === 0 &&
      this === oldHost &&
      name === "aria-busy" &&
      value === "true"
    ) {
      // Actual CellScene setup marks this host busy after the complete native
      // pointer registration block, but before capture creation or its first RAF.
      const pointerCounts = [
        "pointerdown",
        "pointerup",
        "pointermove",
        "pointerleave",
        "pointercancel",
      ].map((type) => [type, ledger.count(canvas, type)]);
      const expected = {
        pointerdown: 2,
        pointerup: 1,
        pointermove: 1,
        pointerleave: 1,
        pointercancel: 2,
      };
      requireCondition(
        pointerCounts.every(([type, count]) => count === expected[type]),
        "Late fault reached actual r180 and CellScene pointer registrations",
      );
      latePointerEntries = ledger
        .entries(canvas)
        .filter((entry) => entry.type in expected);
      requireCondition(
        latePointerEntries.length === 7 &&
          latePointerEntries.every((entry) =>
            ledger.has(canvas, entry.type, entry.listener, entry.capture),
          ),
        "Late fault retains exact native pointer callback identities and capture flags",
      );
      requireCondition(
        observerRows.filter(
          (entry) => entry.observedHost && entry.targets.has(oldHost),
        ).length === 1,
        "Late fault follows one live native observation of the actual scene host",
      );
      requireCondition(
        Boolean(floor) &&
          environmentReturned &&
          api === null &&
          pendingFrames.size === 0,
        "Late fault follows resource acquisition and precedes readiness and first scene RAF",
      );
      requireCondition(
        workerRows.length === 1 &&
          workerRows[0].terminations === 0 &&
          workerRows[0].errorEvents === 0 &&
          new URL(workerRows[0].url, location.href).pathname.endsWith(
            "/picking.worker.js",
          ),
        "Late fault follows successful acquisition of exactly one live native picking worker",
      );
      lateBoundary = {
        pointerCounts,
        pointerIdentities: latePointerEntries.length,
        observedHosts: 1,
        pickingWorkers: workerRows.length,
        pendingFrames: pendingFrames.size,
      };
      injected++;
      throw sentinel;
    }
    return result;
  };
  THREE.Object3D.prototype.add = function (...objects) {
    const result = originalAdd.apply(this, objects);
    if (renderer && this.isScene) {
      for (const object of objects) {
        if (!shadow && object.isDirectionalLight && object.castShadow) {
          shadow = object.shadow;
          watchDisposable(shadow, "directional-shadow");
        }
        if (
          !floor &&
          object.isMesh &&
          object.geometry.type === "PlaneGeometry" &&
          object.geometry.parameters.width === 7 &&
          object.geometry.parameters.height === 7 &&
          object.material.isMeshBasicMaterial &&
          object.material.map?.isCanvasTexture
        ) {
          floor = object;
          watchEvent(floor.geometry, "floor-geometry");
          watchEvent(floor.material, "floor-material");
          watchEvent(floor.material.map, "floor-shadow-texture");
        }
      }
    }
    return result;
  };

  root = createRoot(fixture);
  root.render(
    <FailureBoundary>
      <CellScene
        nodeId="phageTail"
        viewKey="s214/setup/phageTail"
        onEnter={() => {}}
        mode="cut"
        explode={55}
        labels={false}
        rotate={false}
        resetKey={0}
        zoom={{ direction: null, key: 0 }}
        lang="en"
        onSceneReady={(value) => {
          api = value;
        }}
      />
    </FailureBoundary>,
  );
  if (fault === "none") {
    await waitFor(
      () => api?.ready || caught,
      "successful actual CellScene setup",
    );
    if (caught) throw caught;
    await nativeFrame();
    await nativeFrame();
    requireCondition(
      floor && observerRows.some((entry) => entry.targets.has(oldHost)),
      "Success control acquired real floor geometry and an active native observer",
    );
    requireCondition(
      pendingFrames.size > 0,
      "Success control has a live scene animation frame",
    );
    controlKey(document, "keydown");
    root.unmount();
    mounted = false;
  } else {
    await waitFor(
      () => caught !== null,
      "original setup error reaches React boundary",
    );
    requireCondition(
      injected === 1,
      "Exactly one requested fault site was reached",
    );
    requireCondition(
      fault === "shadow2d" ? caught instanceof TypeError : caught === sentinel,
      "Original setup failure is preserved; cleanup does not replace it",
    );
    if (lateFault)
      requireCondition(
        lateBoundary !== null,
        "Requested post-pointer setup boundary was reached",
      );
    if (fault === "cleanup-throws")
      requireCondition(
        cleanupInjected === 1,
        "Requested actual observer release completed and then threw once during rollback",
      );
  }
  await nativeFrame();
  await nativeFrame();
  if (lateFault)
    requireCondition(
      workerRows.every((entry) => entry.errorEvents === 0),
      "No native picking Worker error can substitute for rollback termination",
    );
  requireCondition(
    renderer && canvas && oldHost,
    "Acquired-resource positive control is populated",
  );
  requireCondition(
    [...resources.values()].some((entry) => entry.role === "room-geometry") &&
      [...resources.values()].some((entry) => entry.role === "room-material"),
    "Real RoomEnvironment geometry and materials were acquired",
  );
  if (fault !== "pmrem")
    requireCondition(
      environmentReturned && Boolean(shadow),
      "Selected later fault really follows environment and shadow acquisition",
    );
  if (fault === "observe" || fault === "none" || lateFault)
    requireCondition(
      Boolean(floor) && observerRows.some((entry) => entry.observedHost),
      "Late-stage positive control acquired floor geometry and observed the native host",
    );
  check(
    !canvas.isConnected && canvas.parentNode === null,
    "Renderer canvas explicitly removed, not merely hidden with a detached React parent",
  );
  const leftoverDom = oldHost.querySelectorAll(
    "canvas,.model-loading,.model-hover,.model-label-list,.label-leaders",
  ).length;
  check(
    leftoverDom === 0,
    "Retained old host contains no owned canvas or setup overlays",
  );
  check(
    ledger.count(document, "keydown") === beforeDown &&
      ledger.count(document, "keyup") === beforeUp,
    "Both original-root keyboard listener counts return to pre-mount baseline",
  );
  check(
    ledger.count(canvas) === 0,
    "Actual detached canvas retains no tracked native listeners",
  );
  if (lateFault) {
    check(
      latePointerEntries.every(
        (entry) =>
          !ledger.has(canvas, entry.type, entry.listener, entry.capture),
      ),
      "Every acquired native pointer callback identity is absent after rollback",
    );
    for (const entry of workerRows)
      check(
        entry.terminations === 1,
        "Acquired native picking Worker instance completes exactly one real terminate call",
      );
  }
  check(
    observerRows.every((entry) => entry.targets.size === 0),
    "All native ResizeObservers release their actual observed targets",
  );
  check(
    pendingFrames.size === 0,
    "No tracked animation frame remains pending after retirement",
  );
  check(
    renderer.renderBufferDirect !== wrappedRenderBufferDirect,
    "Facing-cull renderer hook is removed on rollback/full disposal",
  );
  for (const entry of disposalCounts.values())
    check(
      entry.calls === 1 && entry.completions === 1 && entry.errors === 0,
      `${entry.role}: acquired native object completes exactly one disposal without error`,
    );
  for (const entry of resources.values())
    check(
      entry.events === 1,
      `${entry.role}: actual resource emits exactly one dispose event`,
    );
  if (fault === "observe" || fault === "none" || lateFault) {
    check(
      observerRows
        .filter((entry) => entry.observedHost)
        .every((entry) => entry.disconnects === 1),
      "Acquired native host observers disconnected exactly once",
    );
  }
  check(
    fault !== "none" || api === null,
    "Successful full teardown clears the published ready API",
  );
  const countsBeforeLateKeyup = [
    ledger.count(document, "keydown"),
    ledger.count(document, "keyup"),
  ];
  controlKey(document, "keyup");
  check(
    ledger.count(document, "keydown") === beforeDown &&
      ledger.count(document, "keyup") === beforeUp,
    "Late Control release leaves no old-root subscription",
  );
  output.textContent = JSON.stringify({
    status: checks.every((c) => c.pass) ? "PASS" : "FAIL",
    fault,
    threeRevision: THREE.REVISION,
    injected,
    cleanupInjected,
    lateBoundary,
    checks,
    observation: {
      leftoverDom,
      countsBeforeLateKeyup,
      pendingFrames: pendingFrames.size,
      disposals: [...disposalCounts.values()].map(
        ({ role, calls, completions, errors }) => ({
          role,
          calls,
          completions,
          errors,
        }),
      ),
      resources: [...resources.values()].map(({ role, events }) => ({
        role,
        events,
      })),
      observers: observerRows.map((entry) => ({
        observedTargets: entry.targets.size,
        callbacks: entry.callbacks,
        disconnects: entry.disconnects,
      })),
      workers: workerRows.map((entry) => ({
        terminations: entry.terminations,
        errorEvents: entry.errorEvents,
      })),
    },
    scope:
      "Native synchronous setup ownership only; not forced GC, GPU-byte reclamation or FPS",
  });
} catch (error) {
  output.textContent = JSON.stringify({
    status: "ERROR",
    fault,
    error: String(error),
    injected,
    cleanupInjected,
    lateBoundary,
    checks,
  });
} finally {
  // Everything below is harness hygiene AFTER the result, never acceptance evidence.
  if (mounted) root?.unmount();
  for (const entry of observerRows)
    NativeResizeObserver.prototype.disconnect.call(entry.observer);
  for (const id of pendingFrames) nativeCancel(id);
  for (const entry of workerRows)
    if (entry.terminations === 0)
      NativeWorker.prototype.terminate.call(entry.worker);
  for (const entry of workerRows)
    entry.worker.removeEventListener("error", entry.onError);
  for (const [object, entry] of resources)
    object.removeEventListener("dispose", entry.listener);
  for (const [object, entry] of disposalCounts) object.dispose = entry.original;
  THREE.PMREMGenerator.prototype.fromScene = originalFromScene;
  THREE.Object3D.prototype.add = originalAdd;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  Element.prototype.setAttribute = originalSetAttribute;
  window.ResizeObserver = NativeResizeObserver;
  window.Worker = NativeWorker;
  window.requestAnimationFrame = originalRequest;
  window.cancelAnimationFrame = originalCancel;
  ledger?.restore();
}
