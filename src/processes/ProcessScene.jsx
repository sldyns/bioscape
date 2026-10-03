import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { visibleProcessBounds } from "./sceneBounds.js";
import { placeLabel } from "./labelLayout.js";
import { prepareAnnotationLabels } from "./annotationDom.js";
import {
  applySceneView,
  normalizeSceneView,
  readSceneView,
  createSceneCapture,
} from "../scene/sceneCapture.js";

const clampProgress = (value) =>
  Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;

// Process models own their resources; dispose shared geometry and materials once.
function disposeScene(scene) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  scene?.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value);
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

export default function ProcessScene({
  definition,
  rootId,
  parameters,
  progress,
  lang,
  resetKey = 0,
  zoom = { direction: null, key: 0 },
  annotations = true,
  onSceneReady,
  initialView,
  onViewChange,
}) {
  const host = useRef(null);
  const engine = useRef(null);
  const keyHost = useRef(null);
  const live = useRef();
  live.current = {
    progress,
    lang,
    parameters,
    onSceneReady,
    initialView,
    onViewChange,
  };
  const lastReady = useRef({ callback: null, api: null });
  const lastReset = useRef(resetKey);
  const publishReady = (api) => {
    const callback = live.current.onSceneReady;
    if (
      lastReady.current.callback === callback &&
      lastReady.current.api === api
    )
      return;
    lastReady.current = { callback, api };
    callback?.(api);
  };
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = host.current;
    let renderer, controls, environment, pmrem, room, observer;
    let scene, model, labelLayer, leaders;
    let disposed = false;
    let contextLost = false;
    let frame = 0;
    let width = 1;
    let height = 1;
    let camera;
    let matricesDirty = true;
    let fittedDistance = 1;
    let capture,
      api,
      suppressViewChange = false;
    let lastView = null;
    let appliedProgress = clampProgress(live.current.progress);
    let appliedParameters = live.current.parameters;
    const view = () => readSceneView(camera, controls.target, fittedDistance);
    const orbitChanged = () => {
      requestRender();
      if (suppressViewChange || !api?.ready || !live.current.onViewChange)
        return;
      const next = view();
      const values = [...next.direction, ...next.target, next.zoom];
      if (
        lastView &&
        values.every((value, index) => Math.abs(value - lastView[index]) < 1e-6)
      )
        return;
      lastView = values;
      live.current.onViewChange(next);
    };
    const labelItems = [];
    setError(null);
    setBusy(true);

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      publishReady(null);
      capture?.dispose();
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.fonts?.removeEventListener("loadingdone", fontsChanged);
      controls?.dispose();
      renderer?.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      renderer?.domElement.removeEventListener(
        "webglcontextrestored",
        onContextRestored,
      );
      disposeScene(scene);
      for (const material of model?.materials ?? []) material.dispose();
      environment?.dispose();
      room?.dispose();
      pmrem?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      labelLayer?.remove();
      keyHost.current?.replaceChildren();
      if (engine.current?.dispose === dispose) engine.current = null;
    };
    const fail = (cause) => {
      console.error(
        "Process scene failure",
        definition.id,
        appliedProgress,
        cause,
      );
      dispose();
      setBusy(false);
      setError("webgl");
    };
    const onContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      publishReady(null);
      capture?.dispose();
      cancelAnimationFrame(frame);
      frame = 0;
      setError("context");
      setBusy(false);
    };
    const onContextRestored = () => {
      if (!disposed) setAttempt((value) => value + 1);
    };
    const projectLabels = () => {
      const occupied = [];
      const projected = new THREE.Vector3();
      prepareAnnotationLabels(
        labelItems,
        model.labels ?? [],
        live.current.lang,
        `${width}|${height}`,
      );
      for (const item of labelItems) {
        const { active, numbered } = item;
        projected.fromArray(item.source.position).project(camera);
        const anchor = {
          x: ((projected.x + 1) * width) / 2,
          y: ((1 - projected.y) * height) / 2,
        };
        const placement =
          active &&
          projected.z >= -1 &&
          projected.z <= 1 &&
          anchor.x >= 0 &&
          anchor.x <= width &&
          anchor.y >= 0 &&
          anchor.y <= height
            ? placeLabel(
                anchor,
                item.size,
                { width, height },
                occupied,
                numbered,
              )
            : null;
        item.element.style.visibility = placement ? "visible" : "hidden";
        item.line.style.visibility =
          placement && numbered ? "visible" : "hidden";
        if (!placement) continue;
        occupied.push(placement.rect);
        item.element.style.left = `${placement.x}px`;
        item.element.style.top = `${placement.y}px`;
        item.line.setAttribute("x1", anchor.x);
        item.line.setAttribute("y1", anchor.y);
        item.line.setAttribute("x2", placement.x);
        item.line.setAttribute("y2", placement.y);
      }
    };
    const fontsChanged = () => {
      for (const item of labelItems) item.measuredKey = null;
      requestRender();
    };
    const requestRender = () => {
      if (!disposed && !contextLost && !frame) {
        element.dataset.renderState = "active";
        frame = requestAnimationFrame(render);
      }
    };
    const render = () => {
      frame = 0;
      if (disposed || contextLost) return;
      try {
        // OrbitControls emits change only while damping still moves the camera.
        // The final unchanged frame ends the loop; paused scenes stay idle.
        controls.update();
        if (matricesDirty) {
          scene.updateMatrixWorld();
          matricesDirty = false;
        }
        renderer.render(scene, camera);
        projectLabels();
        element.dataset.renderState = frame ? "active" : "idle";
      } catch (cause) {
        fail(cause);
      }
    };

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0xf5f5f7, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.98;
      renderer.domElement.style.display = "block";
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);
      renderer.domElement.addEventListener(
        "webglcontextrestored",
        onContextRestored,
      );
      element.prepend(renderer.domElement);
      scene = new THREE.Scene();
      // Only model.update() changes process geometry. Orbiting a paused process
      // can reuse the complete, full-resolution scene transform hierarchy.
      scene.matrixWorldAutoUpdate = false;
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 150);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = !window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      controls.dampingFactor = 0.18;
      controls.addEventListener("change", orbitChanged);
      pmrem = new THREE.PMREMGenerator(renderer);
      room = new RoomEnvironment();
      environment = pmrem.fromScene(room, 0.04);
      room.dispose();
      room = null;
      pmrem.dispose();
      pmrem = null;
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.45;
      scene.add(new THREE.HemisphereLight("#ffffff", "#a0a6b2", 0.85));
      const key = new THREE.DirectionalLight("#fffaf5", 2.3);
      key.position.set(-5, 5, 7);
      scene.add(key);
      const fill = new THREE.DirectionalLight("#e2e9ff", 0.65);
      fill.position.set(4, 1, -3);
      scene.add(fill);

      model = definition.create({ rootId });
      scene.add(model.group);
      const currentProgress = clampProgress(live.current.progress);
      const sampleProgress = new Set([
        ...Array.from({ length: 9 }, (_, index) => index / 8),
        ...(definition.stages ?? []).map((stage) => clampProgress(stage.at)),
      ]);
      const bounds = new THREE.Box3();
      const sampleBounds = new THREE.Box3();
      for (const value of sampleProgress) {
        model.update(value, live.current.parameters);
        bounds.union(visibleProcessBounds(model.group, sampleBounds));
      }
      model.update(currentProgress, live.current.parameters);
      // Sample the full animation once, then keep its framing fixed while
      // scrubbing. Unused space in a generic envelope should not shrink models.
      if (
        bounds.isEmpty() ||
        ![...bounds.min.toArray(), ...bounds.max.toArray()].every(
          Number.isFinite,
        )
      ) {
        bounds.set(
          new THREE.Vector3(-4, -3, -1.2),
          new THREE.Vector3(4, 3, 1.2),
        );
      }
      const target = new THREE.Vector3().fromArray(model.camera.target);
      const initialPosition = new THREE.Vector3().fromArray(
        model.camera.position,
      );
      const direction = initialPosition.clone().sub(target).normalize();
      if (direction.lengthSq() === 0) direction.set(0, 0, 1);
      const initialDistance = initialPosition.distanceTo(target);
      camera.position.copy(initialPosition);
      controls.target.copy(target);
      camera.lookAt(target);
      camera.updateMatrixWorld();

      const corners = [];
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z])
            corners.push(new THREE.Vector3(x, y, z).sub(target));
      const fitDistance = (viewCamera = camera) => {
        const right = new THREE.Vector3().setFromMatrixColumn(
          viewCamera.matrixWorld,
          0,
        );
        const up = new THREE.Vector3().setFromMatrixColumn(
          viewCamera.matrixWorld,
          1,
        );
        const back = new THREE.Vector3().setFromMatrixColumn(
          viewCamera.matrixWorld,
          2,
        );
        const tanVertical = Math.tan(
          THREE.MathUtils.degToRad(viewCamera.fov / 2),
        );
        const tanHorizontal = tanVertical * viewCamera.aspect;
        return Math.max(
          0.5,
          ...corners.map(
            (corner) =>
              corner.dot(back) +
              1.12 *
                Math.max(
                  Math.abs(corner.dot(right)) / tanHorizontal,
                  Math.abs(corner.dot(up)) / tanVertical,
                ),
          ),
        );
      };
      const resize = (initial = false) => {
        if (disposed) return;
        const rect = element.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        const zoomRatio = initial
          ? 1
          : camera.position.distanceTo(controls.target) / fittedDistance;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        fittedDistance = fitDistance();
        const offset = camera.position.clone().sub(controls.target).normalize();
        camera.position
          .copy(controls.target)
          .addScaledVector(offset, fittedDistance * zoomRatio);
        controls.minDistance = fittedDistance * 0.3;
        controls.maxDistance = fittedDistance * 3;
        camera.far = Math.max(
          150,
          controls.maxDistance + bounds.getSize(new THREE.Vector3()).length(),
        );
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        requestRender();
      };
      labelLayer = document.createElement("div");
      labelLayer.className = "process-model-labels";
      labelLayer.style.cssText =
        "position:absolute;inset:0;pointer-events:none;overflow:hidden";
      element.append(labelLayer);
      leaders = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      leaders.classList.add("process-label-leaders");
      labelLayer.append(leaders);
      for (const [index, label] of (model.labels ?? []).entries()) {
        const span = document.createElement("span");
        span.className = "process-model-label";
        span.dataset.label = String(index);
        span.style.cssText =
          "position:absolute;transform:translate(-50%,-50%);white-space:nowrap";
        labelLayer.append(span);
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        leaders.append(line);
        const key = document.createElement("button");
        key.type = "button";
        key.className = "process-annotation-item";
        const number = document.createElement("span");
        number.className = "process-annotation-number";
        const wording = document.createElement("span");
        key.append(number, wording);
        keyHost.current.append(key);
        const highlight = (value) => {
          span.classList.toggle("highlighted", value);
          line.classList.toggle("highlighted", value);
        };
        key.addEventListener("pointerenter", () => highlight(true));
        key.addEventListener("pointerleave", () => highlight(false));
        key.addEventListener("focus", () => highlight(true));
        key.addEventListener("blur", () => highlight(false));
        labelItems.push({
          element: span,
          key,
          wording,
          line,
          numberElement: number,
          sourceIndex: index,
          source: label,
          text: label.text,
        });
      }
      labelItems.sort(
        (a, b) => (b.source.priority ?? 0) - (a.source.priority ?? 0),
      );
      resize(true);
      controls.saveState();
      const setView = (value) => {
        if (!api?.ready || !normalizeSceneView(value)) return false;
        suppressViewChange = true;
        const damping = controls.enableDamping;
        try {
          controls.enableDamping = false;
          controls.update();
          const applied = applySceneView(
            camera,
            controls.target,
            fittedDistance,
            value,
          );
          if (applied) {
            controls.update();
            const current = view();
            lastView = [...current.direction, ...current.target, current.zoom];
            requestRender();
          }
          return applied;
        } finally {
          controls.enableDamping = damping;
          suppressViewChange = false;
        }
      };
      capture = createSceneCapture({
        renderer,
        scene,
        camera,
        target: controls.target,
        getFittedDistance: () => fittedDistance,
        fitDistance,
        getLabels: () =>
          (model.labels ?? []).map((label) => ({
            text:
              label.text[live.current.lang] ??
              label.text.zh ??
              label.text.en ??
              "",
            position: new THREE.Vector3().fromArray(label.position),
            active: label.active,
            priority: label.priority,
          })),
      });
      api = {
        get ready() {
          return !disposed && !contextLost && Boolean(model);
        },
        getView: view,
        setView,
        releaseCapture: () => capture.dispose(),
        captureFrame(options = {}) {
          if (!api.ready)
            throw new Error("The process scene is not ready to capture.");
          const seek =
            Number.isFinite(options.progress) &&
            clampProgress(options.progress) !== appliedProgress;
          try {
            if (seek)
              model.update(clampProgress(options.progress), appliedParameters);
            if (matricesDirty || seek) scene.updateMatrixWorld();
            return capture.captureFrame(options);
          } finally {
            if (seek) {
              model.update(appliedProgress, appliedParameters);
              scene.updateMatrixWorld();
            }
          }
        },
      };
      if (live.current.initialView) setView(live.current.initialView);
      observer = new ResizeObserver(() => resize());
      observer.observe(element);
      document.fonts?.addEventListener("loadingdone", fontsChanged);
      engine.current = {
        api,
        dispose,
        update(value) {
          if (disposed) return;
          try {
            appliedProgress = clampProgress(value);
            appliedParameters = live.current.parameters;
            model.update(appliedProgress, appliedParameters);
            matricesDirty = true;
            requestRender();
          } catch (cause) {
            fail(cause);
          }
        },
        requestRender,
        reset() {
          if (disposed) return;
          controls.reset();
          controls.target.copy(target);
          camera.position
            .copy(target)
            .addScaledVector(direction, initialDistance || 1);
          camera.lookAt(target);
          camera.updateMatrixWorld();
          resize(true);
          requestRender();
        },
        zoom(direction) {
          if (disposed) return;
          const offset = camera.position.clone().sub(controls.target);
          const distance = THREE.MathUtils.clamp(
            offset.length() * (direction === "in" ? 0.84 : 1.19),
            controls.minDistance,
            controls.maxDistance,
          );
          camera.position.copy(controls.target).add(offset.setLength(distance));
          requestRender();
        },
      };
      // resize() has queued a frame; render the first pose now without leaving
      // that queued callback orphaned during later cleanup.
      cancelAnimationFrame(frame);
      frame = 0;
      render();
      if (!disposed) {
        setBusy(false);
        publishReady(api);
      }
    } catch (cause) {
      fail(cause);
    }
    return dispose;
  }, [definition, rootId, attempt]);

  useEffect(() => engine.current?.update(progress), [progress, parameters]);
  useEffect(() => engine.current?.requestRender(), [lang]);
  useEffect(() => {
    if (lastReset.current !== resetKey) engine.current?.reset();
    lastReset.current = resetKey;
  }, [resetKey]);
  useEffect(() => {
    publishReady(engine.current?.api?.ready ? engine.current.api : null);
  }, [onSceneReady]);
  useEffect(() => {
    if (zoom.direction) engine.current?.zoom(zoom.direction);
  }, [zoom.key, zoom.direction]);

  return (
    <div className="process-scene-shell" data-annotations={annotations}>
      <div
        ref={host}
        className="process-canvas"
        data-process={definition.id}
        aria-busy={busy}
        aria-label={
          lang === "zh"
            ? "可旋转缩放的过程模型"
            : "Rotatable, zoomable process model"
        }
      >
        {error && (
          <div className="process-scene-error" role="alert">
            <p>
              {lang === "zh"
                ? "三维画面暂时不可用，可以重试加载。"
                : "The 3D view is temporarily unavailable. Please try loading it again."}
            </p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {lang === "zh" ? "重新加载" : "Reload model"}
            </button>
          </div>
        )}
      </div>
      <div
        ref={keyHost}
        className="process-annotation-key"
        role="group"
        aria-label={lang === "zh" ? "模型标注" : "Model annotations"}
      />
    </div>
  );
}
