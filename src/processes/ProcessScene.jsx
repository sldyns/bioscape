import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { visibleProcessBounds } from "./sceneBounds.js";

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
}) {
  const host = useRef(null);
  const engine = useRef(null);
  const live = useRef({ progress, lang, parameters });
  live.current = { progress, lang, parameters };
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = host.current;
    let renderer, controls, environment, pmrem, room, observer;
    let scene, model, labelLayer;
    let disposed = false;
    let contextLost = false;
    let frame = 0;
    let width = 1;
    let height = 1;
    let camera;
    let fittedDistance = 1;
    const labelItems = [];
    setError(null);
    setBusy(true);

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
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
      if (engine.current?.dispose === dispose) engine.current = null;
    };
    const fail = () => {
      dispose();
      setBusy(false);
      setError("webgl");
    };
    const onContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
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
      for (const item of labelItems) {
        const wording =
          width < 480 && item.source.compactText
            ? item.source.compactText
            : item.source.text;
        const text =
          wording[live.current.lang] ?? wording.zh ?? wording.en ?? "";
        if (item.element.textContent !== text) item.element.textContent = text;
        projected.fromArray(item.source.position).project(camera);
        const x = ((projected.x + 1) * width) / 2;
        const y = ((1 - projected.y) * height) / 2;
        const halfWidth = Math.max(4, item.element.offsetWidth / 2);
        const halfHeight = Math.max(12, item.element.offsetHeight / 2);
        const rect = {
          left: x - halfWidth,
          right: x + halfWidth,
          top: y - halfHeight,
          bottom: y + halfHeight,
        };
        const hidden =
          item.source.active === false ||
          projected.z < -1 ||
          projected.z > 1 ||
          rect.left < 8 ||
          rect.right > width - 8 ||
          rect.top < 8 ||
          rect.bottom > height - 8 ||
          occupied.some(
            (other) =>
              rect.left < other.right + 12 &&
              rect.right > other.left - 12 &&
              rect.top < other.bottom + 8 &&
              rect.bottom > other.top - 8,
          );
        item.element.style.visibility = hidden ? "hidden" : "visible";
        item.element.style.left = `${x}px`;
        item.element.style.top = `${y}px`;
        if (!hidden) occupied.push(rect);
      }
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
        renderer.render(scene, camera);
        projectLabels();
        element.dataset.renderState = frame ? "active" : "idle";
      } catch {
        fail();
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
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 150);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = !window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      controls.dampingFactor = 0.085;
      controls.addEventListener("change", requestRender);
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
      const fitDistance = () => {
        const right = new THREE.Vector3().setFromMatrixColumn(
          camera.matrixWorld,
          0,
        );
        const up = new THREE.Vector3().setFromMatrixColumn(
          camera.matrixWorld,
          1,
        );
        const back = new THREE.Vector3().setFromMatrixColumn(
          camera.matrixWorld,
          2,
        );
        const tanVertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const tanHorizontal = tanVertical * camera.aspect;
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
      for (const [index, label] of (model.labels ?? []).entries()) {
        const span = document.createElement("span");
        span.className = "process-model-label";
        span.dataset.label = String(index);
        span.style.cssText =
          "position:absolute;transform:translate(-50%,-50%);white-space:nowrap";
        labelLayer.append(span);
        labelItems.push({
          element: span,
          source: label,
          text: label.text,
        });
      }
      labelItems.sort(
        (a, b) => (b.source.priority ?? 0) - (a.source.priority ?? 0),
      );
      resize(true);
      controls.saveState();
      observer = new ResizeObserver(() => resize());
      observer.observe(element);
      engine.current = {
        dispose,
        update(value) {
          if (disposed) return;
          try {
            model.update(clampProgress(value), live.current.parameters);
            requestRender();
          } catch {
            fail();
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
      if (!disposed) setBusy(false);
    } catch {
      fail();
    }
    return dispose;
  }, [definition, rootId, attempt]);

  useEffect(() => engine.current?.update(progress), [progress, parameters]);
  useEffect(() => engine.current?.requestRender(), [lang]);
  useEffect(() => engine.current?.reset(), [resetKey]);
  useEffect(() => {
    if (zoom.direction) engine.current?.zoom(zoom.direction);
  }, [zoom.key, zoom.direction]);

  return (
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
  );
}
