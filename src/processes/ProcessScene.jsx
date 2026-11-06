import { resetSharedRenderingState } from "../scene/resetSharedRenderingState.js";
import React, {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { visibleProcessBounds } from "./sceneBounds.js";
import { createProcessFramingPreparation } from "./framingPreparation.js";
import { createInstanceBoundsCache } from "./instanceBoundsCache.js";
import { placeLabel } from "./labelLayout.js";
import { prepareAnnotationLabels } from "./annotationDom.js";
import { createProcessPose } from "./playbackClock.js";
import { disposeScene } from "./disposeScene.js";
import { createProcessRenderingResources } from "./renderingOwner.js";
import { disposeOrbitControls } from "../scene/disposeOrbitControls.js";
import {
  applySceneView,
  normalizeSceneView,
  readSceneView,
  createSceneCapture,
} from "../scene/sceneCapture.js";

const clampProgress = (value) =>
  Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;

export default function ProcessScene({
  definition,
  rootId,
  parameters,
  progress,
  progressSource,
  lang,
  resetKey = 0,
  zoom = { direction: null, key: 0 },
  annotations = true,
  onSceneReady,
  initialView,
  onViewChange,
  renderingOwner,
}) {
  const keyboardHintId = useId();
  const host = useRef(null);
  const engine = useRef(null);
  const setupOwner = useRef(null);
  const restoreRetryFocus = useRef(false);
  const recoveryView = useRef(null);
  const keyHost = useRef(null);
  const live = useRef();
  live.current = {
    progress,
    progressSource,
    lang,
    parameters,
    annotations,
    onSceneReady,
    initialView,
    resetKey,
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

  // OrbitControls must disconnect from the original document before DOM removal.
  useLayoutEffect(
    () => () => setupOwner.current?.dispose(),
    [definition, rootId, attempt, renderingOwner],
  );

  useEffect(() => {
    const element = host.current;
    const focusAfterRetry = restoreRetryFocus.current;
    restoreRetryFocus.current = false;
    let renderer, controls, environment, pmrem, room, observer;
    let renderingLease = null;
    let scene, model, labelLayer, leaders;
    let disposed = false;
    let contextLost = false;
    let sceneReady = false;
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
    const readProgress = () =>
      clampProgress(
        live.current.progressSource?.current ?? live.current.progress,
      );
    let pose;
    let currentViewFitDistance = null;
    let constrainOrbitView = null;
    const constrainOrbitTarget = () => {
      const target = controls.target;
      if (
        target.x >= -1000 &&
        target.x <= 1000 &&
        target.y >= -1000 &&
        target.y <= 1000 &&
        target.z >= -1000 &&
        target.z <= 1000
      )
        return;
      // Controller arithmetic can cross the URL boundary by one ULP. Move
      // both points together so this correction preserves the orbit offset.
      const x = THREE.MathUtils.clamp(target.x, -1000, 1000);
      const y = THREE.MathUtils.clamp(target.y, -1000, 1000);
      const z = THREE.MathUtils.clamp(target.z, -1000, 1000);
      camera.position.x += x - target.x;
      camera.position.y += y - target.y;
      camera.position.z += z - target.z;
      target.set(x, y, z);
    };
    const view = (fit = null) => {
      constrainOrbitTarget();
      camera.updateMatrixWorld();
      return readSceneView(
        camera,
        controls.target,
        fit ??
          (currentViewFitDistance ? currentViewFitDistance() : fittedDistance),
      );
    };
    const orbitChanged = () => {
      requestRender();
      if (suppressViewChange || !api?.ready) return;
      const fit = constrainOrbitView?.();
      if (!live.current.onViewChange) return;
      const next = view(fit);
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
    // Kind is fixed at model creation; text and active may change each frame.
    // Keep this array stable for annotationDom's WeakMap numbering cache.
    const physicalSources = [];
    const contextItems = [];
    const projected = new THREE.Vector3();
    setError(null);
    setBusy(true);
    const framing = createProcessFramingPreparation({ budgetMs: 8 });
    const instanceBounds = createInstanceBoundsCache({
      cacheMeshBounds: true,
      retireOnChange: true,
      retireUnproductiveAfterSamples: 2,
    });

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      sceneReady = false;
      framing.dispose();
      instanceBounds.clear();
      publishReady(null);
      capture?.dispose();
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.fonts?.removeEventListener("loadingdone", invalidateAnnotations);
      controls?.removeEventListener("change", orbitChanged);
      disposeOrbitControls(controls);
      renderer?.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      renderer?.domElement.removeEventListener(
        "webglcontextrestored",
        onContextRestored,
      );
      try {
        disposeScene(scene, model?.materials ?? []);
        if (!renderingLease) environment?.dispose();
        room?.dispose();
        pmrem?.dispose();
      } catch (cause) {
        renderingLease?.invalidate();
        throw cause;
      } finally {
        try {
          if (renderingLease) renderingLease.release();
          else renderer?.dispose();
        } finally {
          renderer?.domElement.remove();
          labelLayer?.remove();
          keyHost.current?.replaceChildren();
          keyHost.current?.removeAttribute("tabindex");
          if (engine.current?.dispose === dispose) engine.current = null;
          if (setupOwner.current?.dispose === dispose)
            setupOwner.current = null;
        }
      }
    };
    const fail = (cause) => {
      renderingLease?.invalidate();
      console.error(
        "Process scene failure",
        definition.id,
        pose?.progress ?? readProgress(),
        cause,
      );
      try {
        dispose();
      } catch (cleanupCause) {
        console.error(
          "Process scene cleanup failure",
          definition.id,
          cleanupCause,
        );
      }
      setBusy(false);
      setError("webgl");
    };
    const onContextLost = (event) => {
      event.preventDefault();
      if (api?.ready)
        recoveryView.current = {
          definition,
          rootId,
          resetKey: live.current.resetKey,
          initialView: JSON.stringify(
            normalizeSceneView(live.current.initialView),
          ),
          view: view(),
        };
      contextLost = true;
      framing.cancel("context-lost");
      instanceBounds.clear();
      renderingLease?.invalidate();
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
      if (!live.current.annotations) return;
      const occupied = [];
      const focusedElement = document.activeElement;
      const focusedKey =
        focusedElement?.parentElement === keyHost.current
          ? focusedElement
          : null;
      for (const item of contextItems) {
        const text =
          item.source.text[live.current.lang] ??
          item.source.text.zh ??
          item.source.text.en ??
          "";
        const hidden = item.source.active === false;
        if (item.text !== text) {
          item.key.textContent = text;
          item.text = text;
        }
        if (item.key.hidden !== hidden) item.key.hidden = hidden;
      }
      prepareAnnotationLabels(
        labelItems,
        physicalSources,
        live.current.lang,
        `${width}|${height}`,
      );
      if (focusedKey?.hidden) {
        // Playback can remove the focused annotation at a stage boundary.
        // Preserve keyboard position among the remaining keys in DOM order.
        let nextKey = focusedKey.nextElementSibling;
        while (nextKey && (nextKey.hidden || nextKey.tagName !== "BUTTON"))
          nextKey = nextKey.nextElementSibling;
        if (!nextKey) {
          nextKey = focusedKey.previousElementSibling;
          while (nextKey && (nextKey.hidden || nextKey.tagName !== "BUTTON"))
            nextKey = nextKey.previousElementSibling;
        }
        (nextKey ?? renderer.domElement).focus();
      }
      const protectedAnchors = [];
      // Refresh the full target set before priority-ordered placement. A later
      // label's physical target must also constrain an earlier numbered marker.
      for (const item of labelItems) {
        item.projectedAnchor = null;
        if (!item.active) continue;
        projected.fromArray(item.source.position).project(camera);
        const anchor = {
          x: ((projected.x + 1) * width) / 2,
          y: ((1 - projected.y) * height) / 2,
        };
        if (
          projected.z >= -1 &&
          projected.z <= 1 &&
          anchor.x >= 0 &&
          anchor.x <= width &&
          anchor.y >= 0 &&
          anchor.y <= height
        ) {
          item.projectedAnchor = anchor;
          protectedAnchors.push(anchor);
        }
      }
      // A model can expose additional visible parts to protect without changing
      // the annotation text or its physical leader endpoint.
      if (model.annotationTargets)
        for (const position of model.annotationTargets) {
          projected.fromArray(position).project(camera);
          const target = {
            x: ((projected.x + 1) * width) / 2,
            y: ((1 - projected.y) * height) / 2,
          };
          if (
            projected.z >= -1 &&
            projected.z <= 1 &&
            target.x >= 0 &&
            target.x <= width &&
            target.y >= 0 &&
            target.y <= height
          )
            protectedAnchors.push(target);
        }
      for (const item of labelItems) {
        const { numbered, projectedAnchor: anchor } = item;
        const placement = anchor
          ? placeLabel(
              anchor,
              item.size,
              { width, height },
              occupied,
              numbered,
              protectedAnchors,
            )
          : null;
        const visibility = placement ? "visible" : "hidden";
        const lineVisibility = placement && numbered ? "visible" : "hidden";
        if (item.visibility !== visibility) {
          item.element.style.visibility = visibility;
          item.visibility = visibility;
        }
        if (item.lineVisibility !== lineVisibility) {
          item.line.style.visibility = lineVisibility;
          item.lineVisibility = lineVisibility;
        }
        if (!placement) continue;
        occupied.push(placement.rect);
        if (item.x !== placement.x) {
          item.element.style.left = `${placement.x}px`;
          item.line.setAttribute("x2", placement.x);
          item.x = placement.x;
        }
        if (item.y !== placement.y) {
          item.element.style.top = `${placement.y}px`;
          item.line.setAttribute("y2", placement.y);
          item.y = placement.y;
        }
        if (item.anchorX !== anchor.x) {
          item.line.setAttribute("x1", anchor.x);
          item.anchorX = anchor.x;
        }
        if (item.anchorY !== anchor.y) {
          item.line.setAttribute("y1", anchor.y);
          item.anchorY = anchor.y;
        }
      }
    };
    const invalidateAnnotations = () => {
      for (const item of labelItems) item.measuredKey = null;
      requestRender();
    };
    const requestRender = () => {
      if (!disposed && !contextLost && sceneReady && !frame) {
        element.dataset.renderState = "active";
        frame = requestAnimationFrame(render);
      }
    };
    const render = () => {
      frame = 0;
      if (disposed || contextLost || !sceneReady) return;
      try {
        if (pose?.apply(readProgress(), live.current.parameters))
          matricesDirty = true;
        // OrbitControls emits change only while damping still moves the camera.
        // The final unchanged frame ends the loop; paused scenes stay idle.
        controls.update();
        constrainOrbitTarget();
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

    setupOwner.current = { dispose };
    const initialize = async () => {
      try {
        renderingOwner?.resume?.();
        renderingLease = renderingOwner?.acquire() ?? null;
        if (renderingLease) {
          ({ renderer, environment } = renderingLease.resources);
        } else {
          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          });
        }
        resetSharedRenderingState(renderer, THREE.PCFShadowMap);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0xf5f5f7, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.98;
        renderer.domElement.style.display = "block";
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
        controls.enabled = false;
        renderer.domElement.tabIndex = 0;
        renderer.domElement.setAttribute("role", "img");
        renderer.domElement.setAttribute("aria-labelledby", keyboardHintId);
        controls.listenToKeyEvents(renderer.domElement);
        controls.enablePan = true;
        controls.enableDamping = !window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        controls.dampingFactor = 0.18;
        controls.addEventListener("change", orbitChanged);
        scene.add(new THREE.HemisphereLight("#ffffff", "#a0a6b2", 0.85));
        const key = new THREE.DirectionalLight("#fffaf5", 2.3);
        key.position.set(-5, 5, 7);
        scene.add(key);
        const fill = new THREE.DirectionalLight("#e2e9ff", 0.65);
        fill.position.set(4, 1, -3);
        scene.add(fill);

        model = definition.create({ rootId });
        scene.add(model.group);
        // Visit every uniform/stage sample in time order so unchanged geometry
        // can be reused between adjacent phases before restoring the live pose.
        const sampleProgress = new Set(
          [
            ...Array.from({ length: 9 }, (_, index) => index / 8),
            ...(definition.stages ?? []).map((stage) =>
              clampProgress(stage.at),
            ),
          ].sort((a, b) => a - b),
        );
        const bounds = new THREE.Box3();
        const sampleBounds = new THREE.Box3();
        const framingParameters = [live.current.parameters];
        for (const variant of definition.framingParameters ?? []) {
          const candidate = { ...live.current.parameters, ...variant };
          const alreadySampled = framingParameters.some((known) =>
            Object.entries(candidate).every(
              ([name, value]) => known?.[name] === value,
            ),
          );
          if (!alreadySampled) framingParameters.push(candidate);
        }
        const framingResult = await framing.start(
          framingParameters.flatMap((parameters) =>
            [...sampleProgress].map((value) => ({ value, parameters })),
          ),
          ({ value, parameters }) => {
            model.update(value, parameters);
            bounds.union(
              visibleProcessBounds(
                model.group,
                sampleBounds,
                instanceBounds.enabled ? instanceBounds : null,
              ),
            );
            instanceBounds.finishSample();
          },
          { isCurrent: () => !disposed && !contextLost },
        );
        instanceBounds.clear();
        if (disposed || contextLost) return;
        if (framingResult.status !== "ready")
          throw new Error(
            framingResult.error ?? "Process framing did not complete",
          );
        // Playback/parameters may have changed while another task had control.
        // Restore the latest requested pose before publishing any ready scene.
        const readyProgress = readProgress();
        model.update(readyProgress, live.current.parameters);
        pose = createProcessPose(
          (value, parameters) => model.update(value, parameters),
          readyProgress,
          live.current.parameters,
        );
        // Preparing the complete framing can be cancelled. Build the identical
        // environment only after that work succeeds, before any ready render;
        // abandoned preparations never allocate or render a new PMREM room.
        if (!environment) {
          pmrem = new THREE.PMREMGenerator(renderer);
          room = new RoomEnvironment();
          environment = pmrem.fromScene(room, 0.04);
          room.dispose();
          room = null;
          pmrem.dispose();
          pmrem = null;
          if (renderingOwner)
            renderingLease = renderingOwner.adopt(
              createProcessRenderingResources(renderer, environment),
            );
        }
        scene.environment = environment.texture;
        scene.environmentIntensity = 0.45;
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
        const fitDistance = (
          viewCamera = camera,
          viewTarget = controls.target,
        ) => {
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
          // Corners are relative to the model's initial target. A restored view
          // can look at a different target while retaining the same world bounds.
          const targetOffset = target.clone().sub(viewTarget);
          const rightOffset = targetOffset.dot(right);
          const upOffset = targetOffset.dot(up);
          const backOffset = targetOffset.dot(back);
          return Math.max(
            0.5,
            ...corners.map(
              (corner) =>
                corner.dot(back) +
                backOffset +
                1.12 *
                  Math.max(
                    Math.abs(corner.dot(right) + rightOffset) / tanHorizontal,
                    Math.abs(corner.dot(up) + upOffset) / tanVertical,
                  ),
            ),
          );
        };
        currentViewFitDistance = () => fitDistance();
        const boundsDiagonal = bounds.getSize(new THREE.Vector3()).length();
        const setDistanceEnvelope = (fit, distance) => {
          // Keep the normal zoom limits while retaining any legal restored or
          // panned view outside them. The saved zoom remains distance / fit.
          controls.minDistance = Math.min(fit * 0.3, distance);
          controls.maxDistance = Math.max(fit * 3, distance);
          const far = Math.max(150, controls.maxDistance + boundsDiagonal);
          if (camera.far !== far) {
            camera.far = far;
            camera.updateProjectionMatrix();
          }
        };
        constrainOrbitView = () => {
          // OrbitControls already moves the camera and target together. Only
          // correct the existing serialization limits; ordinary pan keeps D.
          const offset = camera.position.clone().sub(controls.target);
          constrainOrbitTarget();
          camera.updateMatrixWorld();
          fittedDistance = fitDistance();
          const distance = offset.length();
          const boundedDistance = THREE.MathUtils.clamp(
            distance,
            fittedDistance * 0.1,
            fittedDistance * 10,
          );
          if (boundedDistance !== distance)
            camera.position
              .copy(controls.target)
              .add(offset.setLength(boundedDistance));
          setDistanceEnvelope(fittedDistance, boundedDistance);
          // Reuse this fit for publication; never recurse into controls.update.
          return fittedDistance;
        };
        const resize = (initial = false) => {
          if (disposed) return;
          const rect = element.getBoundingClientRect();
          width = Math.max(1, rect.width);
          height = Math.max(1, rect.height);
          camera.updateMatrixWorld();
          const zoomRatio = initial
            ? 1
            : camera.position.distanceTo(controls.target) / fitDistance();
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          camera.updateMatrixWorld();
          fittedDistance = fitDistance();
          const distance = fittedDistance * zoomRatio;
          const offset = camera.position
            .clone()
            .sub(controls.target)
            .normalize();
          camera.position
            .copy(controls.target)
            .addScaledVector(offset, distance);
          setDistanceEnvelope(fittedDistance, distance);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.setSize(width, height, false);
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
          if (label.annotationKind === "context") {
            const key = document.createElement("p");
            key.className = "process-annotation-context";
            key.dataset.label = String(index);
            key.setAttribute("role", "note");
            keyHost.current.append(key);
            // The existing scrollable key remains keyboard-accessible; the note
            // itself is not an action or a target for molecular highlighting.
            keyHost.current.tabIndex = 0;
            contextItems.push({ source: label, key, text: null });
            continue;
          }
          const sourceIndex = physicalSources.push(label) - 1;
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
          key.addEventListener("focus", () => {
            key.scrollIntoView({ block: "nearest", inline: "nearest" });
            highlight(true);
          });
          key.addEventListener("blur", () => highlight(false));
          labelItems.push({
            element: span,
            key,
            wording,
            line,
            numberElement: number,
            sourceIndex,
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
          const normalized = normalizeSceneView(value);
          if (!api?.ready || !normalized) return false;
          suppressViewChange = true;
          const damping = controls.enableDamping;
          try {
            controls.enableDamping = false;
            controls.update();
            const fitCamera = camera.clone();
            const fitTarget = new THREE.Vector3().fromArray(normalized.target);
            fitCamera.position.fromArray(normalized.direction).add(fitTarget);
            fitCamera.lookAt(fitTarget);
            fitCamera.updateMatrixWorld();
            fittedDistance = fitDistance(fitCamera, fitTarget);
            setDistanceEnvelope(
              fittedDistance,
              fittedDistance * normalized.zoom,
            );
            const applied = applySceneView(
              camera,
              controls.target,
              fittedDistance,
              normalized,
            );
            if (applied) {
              controls.update();
              const current = view();
              lastView = [
                ...current.direction,
                ...current.target,
                current.zoom,
              ];
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
          getFittedDistance: () => {
            camera.updateMatrixWorld();
            return fitDistance();
          },
          fitDistance,
          getLabels: () =>
            (model.labels ?? []).map((label) => {
              const text =
                label.text[live.current.lang] ??
                label.text.zh ??
                label.text.en ??
                "";
              if (label.annotationKind === "context")
                return {
                  text,
                  active: label.active,
                  priority: label.priority,
                  annotationKind: "context",
                };
              return {
                text,
                position: new THREE.Vector3().fromArray(label.position),
                active: label.active,
                priority: label.priority,
              };
            }),
        });
        api = {
          get ready() {
            return !disposed && !contextLost && sceneReady && Boolean(model);
          },
          getView: view,
          setView,
          requestRender,
          getProgress: () => pose.progress,
          releaseCapture: () => capture.dispose(),
          prepareCaptureFrame(options = {}) {
            return api.captureFrame(options, true);
          },
          captureFrame(options = {}, prepare = false) {
            if (!api.ready)
              throw new Error("The process scene is not ready to capture.");
            if (pose.apply(readProgress(), live.current.parameters))
              matricesDirty = true;
            const appliedProgress = pose.progress;
            const appliedParameters = pose.parameters;
            const seek =
              Number.isFinite(options.progress) &&
              clampProgress(options.progress) !== appliedProgress;
            try {
              if (seek)
                model.update(
                  clampProgress(options.progress),
                  appliedParameters,
                );
              if (matricesDirty || seek) scene.updateMatrixWorld();
              return prepare
                ? capture.prepareFrame(options)
                : capture.captureFrame(options);
            } finally {
              if (seek) {
                model.update(appliedProgress, appliedParameters);
                scene.updateMatrixWorld();
              }
            }
          },
        };
        // No orbit or queued render can expose an unfinished framing pose.
        sceneReady = true;
        controls.enabled = true;
        const recovery = recoveryView.current;
        recoveryView.current = null;
        const resume =
          recovery?.definition === definition &&
          recovery.rootId === rootId &&
          recovery.resetKey === live.current.resetKey &&
          recovery.initialView ===
            JSON.stringify(normalizeSceneView(live.current.initialView));
        const initial = resume ? recovery.view : live.current.initialView;
        if (initial) setView(initial);
        observer = new ResizeObserver(() => resize());
        observer.observe(element);
        document.fonts?.addEventListener("loadingdone", invalidateAnnotations);
        engine.current = {
          api,
          dispose,
          requestRender,
          invalidateAnnotations,
          reset() {
            if (disposed) return;
            const damping = controls.enableDamping;
            try {
              // Consume the pending orbit delta before restoring the default pose.
              controls.enableDamping = false;
              controls.reset();
            } finally {
              controls.enableDamping = damping;
            }
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
            camera.position
              .copy(controls.target)
              .add(offset.setLength(distance));
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
          if (focusAfterRetry) renderer.domElement.focus();
        }
      } catch (cause) {
        if (!disposed) fail(cause);
      }
    };
    // initialize owns model/preparation failures; fail also reports any cleanup
    // failure so this asynchronous boundary cannot leave an unhandled rejection.
    void initialize();
    return dispose;
  }, [definition, rootId, attempt, renderingOwner]);

  useEffect(() => engine.current?.requestRender(), [progress, parameters]);
  useEffect(() => engine.current?.invalidateAnnotations(), [lang, annotations]);
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
      {busy && !error && (
        <div className="process-scene-preparing" role="status">
          {lang === "zh" ? "正在准备模型…" : "Preparing model…"}
        </div>
      )}
      <div
        ref={host}
        className="process-canvas"
        data-process={definition.id}
        aria-busy={busy}
        aria-label={
          lang === "zh"
            ? "可旋转、平移和缩放的过程模型"
            : "Rotatable, pannable, zoomable process model"
        }
      >
        <p
          id={keyboardHintId}
          className="scene-keyboard-hint"
          aria-hidden="true"
        >
          {lang === "en"
            ? "3D model · Arrow keys to pan · Shift + arrow keys to rotate · Tab to leave"
            : "三维模型 · 方向键平移 · Shift + 方向键旋转 · Tab 移到其他控件"}
        </p>
        {error && (
          <div className="process-scene-error" role="alert">
            <p>
              {lang === "zh"
                ? "三维画面暂时不可用，可以重试加载。"
                : "The 3D view is temporarily unavailable. Please try loading it again."}
            </p>
            <button
              type="button"
              onClick={(event) => {
                restoreRetryFocus.current =
                  event.currentTarget.matches(":focus-visible");
                setAttempt((value) => value + 1);
              }}
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
