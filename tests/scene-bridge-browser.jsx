import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import * as THREE from "three";
import CellScene from "../src/CellScene.jsx";
import ProcessScene from "../src/processes/ProcessScene.jsx";

const result = document.querySelector("#result");
const fixture = document.querySelector("#fixture");
const images = document.querySelector("#images");
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const initialView = { direction: [0.6, 0, 0.8], target: [0, 0, 0], zoom: 1.25 };
const closeView = (a, b) =>
  [...a.direction, ...a.target, a.zoom].every(
    (v, i) => Math.abs(v - [...b.direction, ...b.target, b.zoom][i]) < 1e-6,
  );
const bytes = (canvas) =>
  canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
const samePixels = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
const nextFrame = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
// Read the actual display canvas in the same RAF after its requested render.
// captureFrame has an independently fitted camera and cannot prove live framing.
async function liveFrame(api) {
  api.requestRender();
  return new Promise((resolve, reject) =>
    requestAnimationFrame(() => {
      try {
        const live = fixture.querySelector("canvas");
        check(live, "Process live canvas must exist");
        const copy = document.createElement("canvas");
        copy.width = live.width;
        copy.height = live.height;
        copy.getContext("2d").drawImage(live, 0, 0);
        resolve(copy);
      } catch (error) {
        reject(error);
      }
    }),
  );
}

function markerBounds(canvas, channel) {
  const pixels = bytes(canvas);
  const box = { count: 0, minX: Infinity, minY: Infinity, maxX: -1, maxY: -1 };
  for (let i = 0; i < pixels.length; i += 4) {
    // Export's global ACES pass mixes the unlit marker channels. Require
    // green/blue dominance over both others to reject the pale background/model.
    const dominant = pixels[i + channel];
    if (
      dominant <= 160 ||
      dominant - pixels[i] <= 40 ||
      dominant - pixels[i + (channel === 1 ? 2 : 1)] <= 40
    )
      continue;
    const pixel = i / 4;
    const x = pixel % canvas.width;
    const y = Math.floor(pixel / canvas.width);
    box.count++;
    box.minX = Math.min(box.minX, x);
    box.minY = Math.min(box.minY, y);
    box.maxX = Math.max(box.maxX, x);
    box.maxY = Math.max(box.maxY, y);
  }
  return box;
}

function visibleMarkers(canvas, name) {
  const top = markerBounds(canvas, 1);
  const bottom = markerBounds(canvas, 2);
  for (const [label, box] of [
    ["upper", top],
    ["lower", bottom],
  ]) {
    check(box.count >= 3, name + ": " + label + " geometry marker must render");
    check(
      box.minX > 1 &&
        box.minY > 1 &&
        box.maxX < canvas.width - 2 &&
        box.maxY < canvas.height - 2,
      name +
        ": " +
        label +
        " geometry marker must be wholly inside the viewport",
    );
  }
  check(
    top.maxY < bottom.minY,
    name + ": upper/lower markers retain their order",
  );
  return { top, bottom };
}

function sameMarkerPositions(a, b, name) {
  for (const marker of ["top", "bottom"])
    for (const edge of ["minX", "minY", "maxX", "maxY"])
      check(
        Math.abs(a[marker][edge] - b[marker][edge]) <= 2,
        name + ": live/export " + marker + " " + edge + " must agree",
      );
}

let root;
let sizeObserver;
let processCreates = 0;
try {
  const definition = {
    id: "capture-lifecycle-test",
    stages: [],
    framingParameters: [{ framing: "narrow" }, { framing: "wide" }],
    create() {
      processCreates++;
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: "#bd6773" }),
      );
      group.add(mesh);
      // The same two endpoint meshes move with the branch and progress.
      // Their pixels prove both extreme ends exist, rather than just some model.
      const markerGeometry = new THREE.BoxGeometry(2, 0.6, 0.15);
      const upper = new THREE.Mesh(
        markerGeometry,
        new THREE.MeshBasicMaterial({ color: "#00ff00", toneMapped: false }),
      );
      const lower = new THREE.Mesh(
        markerGeometry,
        new THREE.MeshBasicMaterial({ color: "#0000ff", toneMapped: false }),
      );
      group.add(upper, lower);
      const basePositions = mesh.geometry.attributes.position.array.slice();
      const labels = [
        { text: { en: "Animated model", zh: "运动模型" }, position: [0, 1, 0] },
      ];
      return {
        group,
        labels,
        camera: { position: [0, 0, 10], target: [0, 0, 0] },
        update(progress, parameters = {}) {
          const span =
            parameters.framing === "wide" ? 1.2 + progress * 4.3 : 1.2;
          upper.position.set(0, span, 0.7);
          lower.position.set(0, -span, 0.7);
          const positions = mesh.geometry.attributes.position;
          for (let i = 0; i < positions.count; i++)
            positions.setX(i, basePositions[i * 3] * (0.3 + progress * 2));
          positions.needsUpdate = true;
          mesh.geometry.computeBoundingBox();
          mesh.geometry.computeBoundingSphere();
        },
      };
    },
  };
  for (const [kind, nodeId] of [
    ["structure", "phageTail"],
    ["cell", "cell"],
    ["neuron", "neuron"],
    ["process", null],
  ]) {
    fixture.style.width = "640px";
    let notifyNull = 0,
      viewEvents = 0;
    let ready;
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`${kind} readiness timeout`)),
        30000,
      );
      ready = (api) => {
        if (api) {
          clearTimeout(timer);
          resolve(api);
        } else notifyNull++;
      };
    });
    root = createRoot(fixture);
    const props = {
      onSceneReady: ready,
      onViewChange: () => viewEvents++,
      initialView,
      lang: "en",
      resetKey: 0,
      zoom: { direction: null, key: 0 },
    };
    root.render(
      kind !== "process" ? (
        <CellScene
          {...props}
          nodeId={nodeId}
          viewKey={`capture/${nodeId}`}
          onEnter={() => {}}
          mode="cut"
          explode={55}
          labels={false}
          rotate={false}
        />
      ) : (
        <ProcessScene
          {...props}
          definition={definition}
          rootId="cell"
          progress={0.2}
          parameters={{ framing: "narrow" }}
        />
      ),
    );
    const api = await promise;
    await nextFrame();
    check(api.ready, `${kind} API must be ready`);
    check(
      closeView(api.getView(), initialView),
      `${kind} initialView must survive scene initialization: ${JSON.stringify(api.getView())}`,
    );
    const eventsBefore = viewEvents;
    check(
      api.setView({ direction: [0, 0, 1], target: [0, 0, 0], zoom: 1.4 }),
      `${kind} setView must accept a valid view`,
    );
    await nextFrame();
    check(
      viewEvents === eventsBefore,
      `${kind} setView must not echo view events`,
    );
    if (kind === "process") {
      const creationCount = processCreates;
      const originalCanvas = fixture.querySelector("canvas");
      const dimensions = [originalCanvas.width, originalCanvas.height];
      let resizeDeliveries = 0;
      sizeObserver = new ResizeObserver(() => resizeDeliveries++);
      sizeObserver.observe(fixture.querySelector(".process-canvas"));
      await nextFrame();
      check(
        resizeDeliveries > 0,
        "The native resize observer must deliver initially",
      );
      const deliveriesBefore = resizeDeliveries;
      const farView = { direction: [0, 0, 1], target: [0, 50, 0], zoom: 1 };
      check(api.setView(farView), "Process must accept the offset-target view");
      const farLive = await liveFrame(api);
      const farMarkers = visibleMarkers(
        farLive,
        "Offset target without resize",
      );
      const farExport = api.captureFrame({
        width: farLive.width,
        height: farLive.height,
        background: "#f5f5f7",
        labels: false,
      });
      sameMarkerPositions(
        farMarkers,
        visibleMarkers(farExport, "Offset target capture"),
        "Offset target",
      );
      await nextFrame();
      check(
        resizeDeliveries === deliveriesBefore,
        "No native resize delivery may rescue the offset-target fit",
      );
      sizeObserver.disconnect();
      sizeObserver = null;
      check(
        closeView(api.getView(), farView),
        "Offset-target capture must preserve the live view",
      );
      check(
        originalCanvas.width === dimensions[0] &&
          originalCanvas.height === dimensions[1],
        "Offset-target far-plane check must not resize the live canvas",
      );
      check(
        viewEvents === eventsBefore,
        "Offset-target setView/capture must not echo view events",
      );

      // Keep the known saved-target offset through the existing resize/capture
      // checks below. Parameter changes use real React, with no remount/reset.
      const branchView = {
        direction: [0, 0, 1],
        target: [0, 0.25, 0],
        zoom: 1.4,
      };
      check(
        api.setView(branchView),
        "Process must restore the small target offset",
      );
      const renderBranch = (framing, progress) =>
        flushSync(() =>
          root.render(
            <ProcessScene
              {...props}
              definition={definition}
              rootId="cell"
              progress={progress}
              parameters={{ framing }}
            />,
          ),
        );
      const branchMarkers = [];
      const branchFrames = [];
      for (const framing of ["narrow", "wide", "narrow"]) {
        renderBranch(framing, 1);
        const live = await liveFrame(api);
        branchMarkers.push(visibleMarkers(live, framing + " branch"));
        branchFrames.push(live);
        check(
          processCreates === creationCount &&
            fixture.querySelector("canvas") === originalCanvas,
          "Parameter changes must preserve the model and live canvas",
        );
        check(
          closeView(api.getView(), branchView),
          "Parameter changes must preserve the offset target and fit-relative zoom",
        );
        check(api.getProgress() === 1, "Branch endpoint pose must be applied");
      }
      const span = ({ top, bottom }) => bottom.maxY - top.minY;
      check(
        span(branchMarkers[1]) > span(branchMarkers[0]) * 2,
        "Wide branch must actually move its endpoint geometry beyond narrow bounds",
      );
      check(
        samePixels(bytes(branchFrames[0]), bytes(branchFrames[2])),
        "Narrow/wide/narrow must restore the exact live model pose",
      );
      check(
        viewEvents === eventsBefore,
        "Parameter changes must not refit or emit camera changes",
      );
      renderBranch("narrow", 0.2);
      await nextFrame();
      check(
        api.getProgress() === 0.2,
        "Restore the original capture test progress",
      );
      check(
        processCreates === creationCount &&
          closeView(api.getView(), branchView),
        "Restoring the original progress must keep the model and view",
      );
      images.append(farLive, farExport, branchFrames[0], branchFrames[1]);
    }
    fixture.style.width = "400px";
    await nextFrame();
    await nextFrame();
    check(
      Math.abs(api.getView().zoom - 1.4) < 1e-6,
      `${kind} resize must preserve fit-relative zoom`,
    );
    const solidBefore = api.captureFrame({
      width: 320,
      height: 400,
      background: "#ffffff",
    });
    const before = api.getView();
    const original = api.captureFrame({
      width: 320,
      height: 400,
      background: "transparent",
      labels: true,
    });
    const changed = api.captureFrame({
      width: 320,
      height: 400,
      background: "transparent",
      labels: true,
      ...(kind !== "process" ? { separation: 1 } : { progress: 0.8 }),
    });
    const restored = api.captureFrame({
      width: 320,
      height: 400,
      background: "transparent",
      labels: true,
    });
    check(
      closeView(api.getView(), before),
      `${kind} capture must preserve live view`,
    );
    check(
      samePixels(bytes(original), bytes(restored)),
      `${kind} capture must restore model pose`,
    );
    check(
      !samePixels(bytes(original), bytes(changed)),
      `${kind} capture must render the requested model pose`,
    );
    const solidAfter = api.captureFrame({
      width: 320,
      height: 400,
      background: "#ffffff",
    });
    check(
      samePixels(bytes(solidBefore), bytes(solidAfter)),
      `${kind} transparent capture must restore decorative floor visibility`,
    );
    images.append(original, changed);
    api.releaseCapture();
    const repeated = api.captureFrame({
      width: 320,
      height: 400,
      background: "transparent",
      labels: true,
    });
    check(
      samePixels(bytes(restored), bytes(repeated)),
      `${kind} capture must work after releasing its targets`,
    );
    api.releaseCapture();
    const nullBefore = notifyNull;
    root.unmount();
    root = null;
    check(
      !api.ready && notifyNull > nullBefore,
      `${kind} disposal must invalidate API and notify null`,
    );
    let rejected = false;
    try {
      api.captureFrame({ width: 100, height: 100 });
    } catch {
      rejected = true;
    }
    check(rejected, `${kind} disposed scene capture must reject`);
  }
  fixture.remove();
  result.textContent =
    "PASS: structure async readiness, process readiness, initial view, silent setView, fit-relative resize, real separation/progress captures, exact model pose restoration, offset-target live/export framing without resize, parameter-union endpoint visibility without remount, release, disposal and null notifications.";
  document.body.dataset.result = "pass";
} catch (error) {
  result.textContent = `FAIL: ${error.stack}`;
  document.body.dataset.result = "fail";
} finally {
  sizeObserver?.disconnect();
  root?.unmount();
}
