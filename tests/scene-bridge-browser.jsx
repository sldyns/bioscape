import React from "react";
import { createRoot } from "react-dom/client";
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
let root;
try {
  const definition = {
    id: "capture-lifecycle-test",
    stages: [],
    create() {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: "#bd6773" }),
      );
      group.add(mesh);
      const basePositions = mesh.geometry.attributes.position.array.slice();
      const labels = [
        { text: { en: "Animated model", zh: "运动模型" }, position: [0, 1, 0] },
      ];
      return {
        group,
        labels,
        camera: { position: [0, 0, 10], target: [0, 0, 0] },
        update(progress) {
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
          parameters={{}}
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
    "PASS: structure async readiness, process readiness, initial view, silent setView, fit-relative resize, real separation/progress captures, exact model pose restoration, release, disposal and null notifications.";
  document.body.dataset.result = "pass";
} catch (error) {
  result.textContent = `FAIL: ${error.stack}`;
  document.body.dataset.result = "fail";
} finally {
  root?.unmount();
}
