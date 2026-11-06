import { createRenderingResources } from "./scene/renderingOwner.js";
import { resetSharedRenderingState } from "./scene/resetSharedRenderingState.js";
import { deferStagedSceneInitialization } from "./scene/stagedSceneInitialization.js";
import { createShaderPreparation } from "./scene/shaderPreparation.js";
import { createDemandRenderLoop } from "./scene/demandRenderLoop.js";
import { disposeOrbitControls } from "./scene/disposeOrbitControls.js";
import { createFacingCull } from "./scene/facingCull";
import { createDetailLoader } from "./scene/detailLoader";
import { createPickingIndex } from "./scene/picking";
import { createPickingCandidates } from "./scene/pickingCandidates.js";
import { layoutCompactPins } from "./scene/compactPinLayout.js";
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
import { createCellModelResource } from "./scene/cellModelResource.js";
import { makePresentation } from "./scene/presentation";
import { createPresentationAppearance } from "./scene/presentationAppearance";
import { explodedFitDistance } from "./scene/viewFraming";
import { createFramingDistanceCache } from "./scene/framingDistanceCache.js";
import { supportsExplosion } from "./scene/viewCapabilities";
import {
  setStyleIfChanged,
  setAttributeIfChanged,
  setHiddenIfChanged,
} from "./scene/structureDomUpdates.js";
import { getNode } from "./hierarchy";
import {
  isStructureLabelVisible,
  structureCaptureMode,
} from "./scene/structureLabelModes.js";
import {
  applySceneView,
  normalizeSceneView,
  readSceneView,
  createSceneCapture,
} from "./scene/sceneCapture.js";

export default function CellScene({
  nodeId,
  viewKey,
  highlight,
  onEnter,
  mode,
  explode,
  labels,
  rotate,
  resetKey,
  zoom,
  lang,
  onCapabilities,
  contracted = false,
  onSceneReady,
  initialView,
  onViewChange,
  allowZoom = true,
  autoRotateLimit = 0,
  renderingOwner,
}) {
  const keyboardHintId = useId();
  const host = useRef(),
    engine = useRef(),
    live = useRef();
  const recoveryView = useRef(null);
  const [error, setError] = useState(null),
    [attempt, setAttempt] = useState(0);
  live.current = {
    nodeId,
    viewKey,
    resetKey,
    highlight,
    onEnter,
    mode,
    explode,
    labels,
    rotate,
    lang,
    onCapabilities,
    contracted,
    onSceneReady,
    initialView,
    onViewChange,
    autoRotateLimit,
  };
  const lastReady = useRef({ callback: null, api: null });
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
  const pendingInitialization = useRef(null);
  const [initializationFailure, setInitializationFailure] = useState(null);
  // OrbitControls must disconnect from the original document before DOM removal.
  useLayoutEffect(
    () => () => {
      pendingInitialization.current?.dispose();
      engine.current?.dispose();
    },
    [attempt, renderingOwner],
  );

  useEffect(() => {
    const job = deferStagedSceneInitialization(
      () => {
        let renderer,
          environment = null,
          renderingLease = null;
        let graphicsReleased = false;
        try {
          // A scene effect can run before its parent's reactivation effect.
          // Re-enter only from this live initialization, never a loader callback.
          renderingOwner?.resume?.();
          renderingLease = renderingOwner?.acquire() ?? null;
          if (renderingLease) {
            ({ renderer, environment } = renderingLease.resources);
          } else {
            renderer = new THREE.WebGLRenderer({
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            });
          }
          resetSharedRenderingState(renderer, THREE.PCFShadowMap);
        } catch {
          try {
            if (renderingLease) {
              renderingLease.invalidate();
              renderingLease.release();
            } else renderer?.dispose();
          } finally {
            renderer?.domElement.remove();
            setError("webgl");
          }
          return null;
        }
        let lost = false,
          retired = false;
        const setupCleanups = [];
        const lose = (event) => {
          event.preventDefault();
          lost = true;
          renderingLease?.invalidate();
          setError("context");
        };
        const restore = () => {
          setError(null);
          setAttempt((n) => n + 1);
        };
        const detach = () => {
          renderer.domElement.removeEventListener("webglcontextlost", lose);
          renderer.domElement.removeEventListener(
            "webglcontextrestored",
            restore,
          );
        };
        renderer.domElement.addEventListener("webglcontextlost", lose);
        renderer.domElement.addEventListener("webglcontextrestored", restore);
        return {
          renderer,
          get environment() {
            return environment;
          },
          get environmentManaged() {
            return Boolean(renderingLease) || graphicsReleased;
          },
          adoptEnvironment(value) {
            if (renderingLease || !renderingOwner) return;
            const resources = createRenderingResources(renderer, value);
            try {
              renderingLease = renderingOwner.adopt(resources);
              environment = value;
            } catch (cause) {
              graphicsReleased = true;
              resources.dispose();
              throw cause;
            }
          },
          invalidateRendering() {
            renderingLease?.invalidate();
          },
          releaseRendering(invalidate = false) {
            try {
              if (graphicsReleased) return;
              graphicsReleased = true;
              if (renderingLease) {
                if (invalidate || lost) renderingLease.invalidate();
                renderingLease.release();
              } else renderer.dispose();
            } finally {
              renderer.domElement.remove();
            }
          },
          // Until setup returns its full disposer, the staged resource also owns
          // controls, observers and GPU resources created after the renderer.
          ownSetup(cleanup) {
            let active = true;
            const release = () => {
              if (!active) return;
              active = false;
              cleanup();
            };
            setupCleanups.push(release);
            return release;
          },
          finishSetup() {
            setupCleanups.length = 0;
          },
          get lost() {
            return lost;
          },
          detach,
          dispose() {
            if (retired) return;
            retired = true;
            detach();
            while (setupCleanups.length) {
              try {
                setupCleanups.pop()();
              } catch (cause) {
                // Continue releasing the remaining owners, including renderer.
                console.error("Structure scene setup cleanup failed", cause);
              }
            }
            this.releaseRendering(true);
          },
        };
      },
      (prepared) => {
        if (prepared.lost) return () => prepared.dispose();
        const renderer = prepared.renderer;
        prepared.detach();
        const el = host.current;
        const layoutParent = el.parentElement;
        const zoomTools = layoutParent.querySelector(".zoom-tools");
        const reduceMotion = matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        let contextLost = false;
        const facingCull = createFacingCull(renderer);
        prepared.ownSetup(() => facingCull.dispose());
        const loseContext = (event) => {
          event.preventDefault();
          if (api?.ready)
            recoveryView.current = {
              viewKey: currentKey,
              nodeId: live.current.nodeId,
              resetKey: live.current.resetKey,
              initialView: JSON.stringify(
                normalizeSceneView(live.current.initialView),
              ),
              view: readView(),
            };
          contextLost = true;
          prepared.invalidateRendering();
          publishReady(null);
          capture?.dispose();
          setError("context");
        };
        const restoreContext = () => {
          // Rebuild render targets and environment textures as well as geometry.
          setError(null);
          setAttempt((n) => n + 1);
        };
        renderer.domElement.addEventListener("webglcontextlost", loseContext);
        renderer.domElement.addEventListener(
          "webglcontextrestored",
          restoreContext,
        );
        prepared.ownSetup(() => {
          renderer.domElement.removeEventListener(
            "webglcontextlost",
            loseContext,
          );
          renderer.domElement.removeEventListener(
            "webglcontextrestored",
            restoreContext,
          );
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
        renderer.setClearColor(0xf5f5f7, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.98;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = true;
        el.prepend(renderer.domElement);
        const scene = new THREE.Scene(),
          camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
        // Structure geometry moves only on entry, disassembly or contraction.
        // Camera-only frames reuse its world matrices, including for shadows/picking.
        scene.matrixWorldAutoUpdate = false;
        camera.position.set(0.5, 0.65, 11.4);
        const controls = new OrbitControls(camera, renderer.domElement);
        prepared.ownSetup(() => disposeOrbitControls(controls));
        renderer.domElement.tabIndex = 0;
        renderer.domElement.setAttribute("role", "img");
        renderer.domElement.setAttribute("aria-labelledby", keyboardHintId);
        controls.listenToKeyEvents(renderer.domElement);
        controls.enableZoom = allowZoom;
        controls.enableDamping = !reduceMotion;
        controls.enablePan = false;
        controls.dampingFactor = 0.18;
        controls.minDistance = 4;
        controls.maxDistance = 24;
        controls.autoRotateSpeed = 0.24;
        let env = prepared.environment;
        let disposeRoom, disposePmrem;
        if (!env) {
          const pmrem = new THREE.PMREMGenerator(renderer);
          disposePmrem = prepared.ownSetup(() => pmrem.dispose());
          const room = new RoomEnvironment();
          disposeRoom = prepared.ownSetup(() => room.dispose());
          env = pmrem.fromScene(room, 0.04);
        }
        prepared.ownSetup(() => {
          if (!prepared.environmentManaged) env.dispose();
        });
        prepared.adoptEnvironment(env);
        scene.environment = env.texture;
        scene.environmentIntensity = 0.45;
        disposeRoom?.();
        disposePmrem?.();
        // A broad key with restrained fill retains membrane depth and pastel color.
        scene.add(new THREE.HemisphereLight("#ffffff", "#a0a6b2", 0.85));
        const key = new THREE.DirectionalLight("#fffaf5", 2.3);
        prepared.ownSetup(() => key.shadow.dispose());
        key.position.set(-5, 5, 7);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        Object.assign(key.shadow.camera, {
          left: -7,
          right: 7,
          top: 7,
          bottom: -7,
        });
        key.shadow.normalBias = 0.027;
        key.shadow.bias = -0.0002;
        key.shadow.radius = 3;
        scene.add(key);
        const fill = new THREE.DirectionalLight("#e2e9ff", 0.65);
        fill.position.set(4, 1, -3);
        scene.add(fill);
        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 128;
        shadowCanvas.height = 128;
        const ctx = shadowCanvas.getContext("2d"),
          gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(70,73,88,.16)");
        gradient.addColorStop(0.5, "rgba(70,73,88,.07)");
        gradient.addColorStop(1, "rgba(70,73,88,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        prepared.ownSetup(() => shadowTexture.dispose());
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(7, 7),
          new THREE.MeshBasicMaterial({
            map: shadowTexture,
            transparent: true,
            depthWrite: false,
          }),
        );
        prepared.ownSetup(() => {
          floor.geometry.dispose();
          floor.material.dispose();
        });
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -3.1;
        scene.add(floor);
        const pickingIndex = createPickingIndex();
        prepared.ownSetup(() => pickingIndex.dispose());
        const detailLoader = createDetailLoader();
        prepared.ownSetup(() => detailLoader.dispose());
        let requestedKey = null,
          loading = false,
          destroyed = false,
          generation = 0;
        const cellModel = createCellModelResource();
        prepared.ownSetup(() => cellModel.dispose());
        const shaderPreparation = createShaderPreparation(renderer);
        prepared.ownSetup(() => shaderPreparation.dispose());
        const shaderPreparedRoots = new WeakSet();
        let shaderPreparing = false;
        const cache = new Map(),
          cameraStates = new Map();
        let currentKey = null,
          pickable = [],
          collectPickingCandidates = createPickingCandidates([], null);
        let matricesDirty = true,
          updateAppearance;
        let current = null,
          previous = 0,
          transition = 1,
          frameCount = 0,
          metricTime = 0,
          hoverId = null;
        let dirty = true,
          partsMoving = false,
          highlightMoving = false,
          viewWidth = 1,
          viewHeight = 1,
          rightLabelGutter = 0,
          zoomBounds = null,
          renderCount = 0;
        const tempTarget = new THREE.Vector3(),
          tempProjected = new THREE.Vector3();
        const renderLoop = createDemandRenderLoop({
          render(time) {
            try {
              animate(time);
            } catch (cause) {
              prepared.invalidateRendering();
              throw cause;
            }
          },
          canRun: () => !destroyed && !contextLost && !document.hidden,
        });
        prepared.ownSetup(() => renderLoop.dispose());
        const invalidate = () => {
          dirty = true;
          renderLoop.request();
        };
        const visibilityChanged = () => {
          previous = 0;
          frameCount = 0;
          metricTime = 0;
          if (document.hidden) renderLoop.cancelPending();
          else invalidate();
        };
        document.addEventListener("visibilitychange", visibilityChanged);
        prepared.ownSetup(() =>
          document.removeEventListener("visibilitychange", visibilityChanged),
        );
        const labelElements = new Map(),
          landmarkElements = [],
          compactProtectedTargets = [];
        const framingAxes = [
          new THREE.Vector3(),
          new THREE.Vector3(),
          new THREE.Vector3(),
        ];
        const computeDistance = (
          preserveOrientation = false,
          viewCamera = camera,
          separation = null,
        ) => {
          let base =
            Math.max(
              9.8,
              (viewCamera.aspect < 1 ? 6.3 : 5.8) /
                (2 *
                  Math.tan(THREE.MathUtils.degToRad(viewCamera.fov / 2)) *
                  Math.min(viewCamera.aspect, 1)),
            ) *
            ([
              "lysosomalMembrane",
              "lysosomalPump",
              "peroxisomalMembrane",
              "largeSubunit",
              "smallSubunit",
            ].includes(live.current.nodeId)
              ? 1.12
              : 1);
          // The whole neuron is elongated: a spherical-cell minimum leaves half
          // the stage empty. Reuse the bounds fit for its assembled silhouette,
          // including export orientation/depth, without changing other views.
          if (live.current.nodeId === "neuron" && current) {
            if (preserveOrientation) {
              viewCamera.updateMatrixWorld();
              framingAxes.forEach((axis, i) =>
                axis.setFromMatrixColumn(viewCamera.matrixWorld, i),
              );
            }
            base = Math.max(
              controls.minDistance,
              explodedFitDistance(
                current.parts,
                0,
                viewCamera.aspect,
                viewCamera.fov,
                preserveOrientation ? framingAxes : null,
              ),
            );
          }
          if (
            (separation === null && live.current.mode !== "explode") ||
            !current ||
            current.parts.length < 2
          )
            return base;
          if (preserveOrientation) {
            viewCamera.updateMatrixWorld();
            framingAxes.forEach((axis, i) =>
              axis.setFromMatrixColumn(viewCamera.matrixWorld, i),
            );
          }
          return Math.max(
            base,
            explodedFitDistance(
              current.parts,
              separation ?? live.current.explode / 100,
              viewCamera.aspect,
              viewCamera.fov,
              preserveOrientation ? framingAxes : null,
            ),
          );
        };
        const framingDistance = createFramingDistanceCache(computeDistance);
        const distance = (
          preserveOrientation = false,
          viewCamera = camera,
          separation = null,
        ) =>
          framingDistance.get(
            {
              presentation: current,
              nodeId: live.current.nodeId,
              mode: live.current.mode,
              explode: live.current.explode,
              camera,
              minDistance: controls.minDistance,
            },
            preserveOrientation,
            viewCamera,
            separation,
          );
        const desiredCamera = new THREE.Vector3(0.5, 0.65, 11.4);
        let fitting = false;
        let suppressViewChange = false;
        let lastView = null;
        let captureSeparation = null;
        let captureSettlesEntry = false;
        let capture, api;
        const readView = () =>
          readSceneView(camera, controls.target, distance());
        const orbitChanged = () => {
          invalidate();
          if (suppressViewChange || !api?.ready || !live.current.onViewChange)
            return;
          const view = readView();
          const values = [...view.direction, ...view.target, view.zoom];
          if (
            lastView &&
            values.every(
              (value, index) => Math.abs(value - lastView[index]) < 1e-6,
            )
          )
            return;
          lastView = values;
          live.current.onViewChange(view);
        };
        controls.addEventListener("change", orbitChanged);
        prepared.ownSetup(() =>
          controls.removeEventListener("change", orbitChanged),
        );
        const setView = (value) => {
          const view = normalizeSceneView(value);
          if (!api?.ready || !view) return false;
          suppressViewChange = true;
          const damping = controls.enableDamping;
          const autoRotate = controls.autoRotate;
          try {
            settleControls();
            fitting = false;
            applySceneView(camera, controls.target, distance(), view);
            controls.enableDamping = false;
            controls.update();
            const next = readView();
            lastView = [...next.direction, ...next.target, next.zoom];
            invalidate();
            return true;
          } finally {
            controls.enableDamping = damping;
            controls.autoRotate = autoRotate;
            suppressViewChange = false;
          }
        };
        const loadingLabel = document.createElement("div");
        loadingLabel.className = "model-loading";
        loadingLabel.setAttribute("role", "status");
        loadingLabel.hidden = true;
        el.append(loadingLabel);
        prepared.ownSetup(() => loadingLabel.remove());
        const hover = document.createElement("div");
        hover.className = "model-hover";
        hover.hidden = true;
        el.append(hover);
        prepared.ownSetup(() => hover.remove());
        const labelList = document.createElement("div");
        labelList.className = "model-label-list";
        el.append(labelList);
        prepared.ownSetup(() => labelList.remove());
        const leaders = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        leaders.classList.add("label-leaders");
        leaders.setAttribute("aria-hidden", "true");
        el.append(leaders);
        prepared.ownSetup(() => leaders.remove());
        function clearHover() {
          if (hoverId) invalidate();
          hoverId = null;
          hover.hidden = true;
          renderer.domElement.style.cursor = "grab";
        }
        function settleControls() {
          const damping = controls.enableDamping;
          controls.enableDamping = false;
          controls.autoRotate = false;
          controls.update();
          controls.enableDamping = damping;
        }
        function remember() {
          if (currentKey)
            cameraStates.set(currentKey, {
              position: camera.position.clone(),
              target: controls.target.clone(),
              fitDistance: current?.fitDistance || distance(),
            });
        }

        function fit(immediate = false, preserveOrientation = false) {
          invalidate();
          settleControls();
          const fitDistance = distance(preserveOrientation);
          controls.maxDistance = Math.max(24, fitDistance * 2);
          if (preserveOrientation)
            desiredCamera
              .copy(camera.position)
              .sub(controls.target)
              .normalize()
              .multiplyScalar(fitDistance)
              .add(controls.target);
          else {
            desiredCamera.set(0.5, 0.65, fitDistance);
            controls.target.set(0, 0, 0);
          }
          if (immediate || reduceMotion) {
            camera.position.copy(desiredCamera);
            fitting = false;
          } else fitting = true;
        }
        function disposeView(view) {
          view.root.traverse((o) => {
            if (o.isMesh) {
              if (o.isInstancedMesh) o.dispose();
              o.material.dispose();
              if (!o.userData.sharedGeometry) o.geometry.dispose();
            }
          });
        }
        function switchNode(id, special) {
          shaderPreparation.cancel();
          shaderPreparing = false;
          setError(null);
          invalidate();
          clearHover();
          settleControls();
          if (current) scene.remove(current.root);
          if (!cache.has(id))
            cache.set(id, makePresentation(cellModel.value, id, special));
          current = cache.get(id);
          framingDistance.invalidate();
          cache.delete(id);
          cache.set(id, current);
          while (cache.size > 8) {
            const oldest = cache.keys().next().value;
            disposeView(cache.get(oldest));
            cache.delete(oldest);
          }
          scene.add(current.root);
          facingCull.setRoot(current.root, id);
          matricesDirty = true;
          updateAppearance = createPresentationAppearance(current.root);
          transition = reduceMotion ? 1 : 0.86;
          current.root.scale.setScalar(transition);
          currentKey = live.current.viewKey;
          const saved = cameraStates.get(currentKey);
          if (saved) {
            controls.maxDistance = Math.max(24, distance() * 2);
            controls.target.copy(saved.target);
            camera.position
              .copy(saved.position)
              .sub(saved.target)
              .multiplyScalar(distance() / saved.fitDistance)
              .add(saved.target);
            fitting = false;
            controls.update();
          } else fit(true);
          const amount =
            live.current.mode === "explode" ? live.current.explode / 100 : 0;
          current.parts.forEach((p) =>
            p.position
              .copy(p.userData.home)
              .addScaledVector(p.userData.offset, amount),
          );
          pickable = [];
          current.root.traverse((o) => {
            if (o.isMesh) {
              pickable.push(o);
              o.userData.restEmissive ??= o.material.emissive?.clone();
              if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            }
          });

          collectPickingCandidates = createPickingCandidates(pickable, id);
          pickingIndex.prepare(pickable);
          labelElements.forEach((l) => {
            l.pin.remove();
            l.remove();
          });
          labelElements.clear();
          landmarkElements.forEach((l) => {
            l.pin.remove();
            l.remove();
          });
          landmarkElements.length = 0;
          leaders.replaceChildren();
          for (const part of current.parts) {
            const id = part.userData.hitId;
            if (!id || id === live.current.nodeId || labelElements.has(id))
              continue;
            const button = document.createElement("button");
            button.className = "model-label";
            button.onclick = () => live.current.onEnter(id);
            labelList.append(button);
            labelElements.set(id, button);
            const line = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "line",
            );
            leaders.append(line);
            button.leader = line;
            button.onmouseenter = () => {
              hoverId = id;
              invalidate();
            };
            button.onmouseleave = clearHover;
            button.onfocus = () => {
              hoverId = id;
              invalidate();
            };
            button.onblur = clearHover;
          }
          for (const landmark of current.landmarks) {
            const label = document.createElement("span");
            label.className = "model-label model-landmark";
            labelList.append(label);
            const line = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "line",
            );
            leaders.append(line);
            label.leader = line;
            label.landmark = landmark;
            landmarkElements.push(label);
          }
          [...labelElements.values(), ...landmarkElements].forEach(
            (label, i) => {
              const pin = document.createElement("span");
              pin.className = "model-pin";
              pin.textContent = i + 1;
              pin.setAttribute("aria-hidden", "true");
              el.append(pin);
              label.pin = pin;
              label.dataset.number = i + 1;
            },
          );
          let capCount = 0;
          current.root.traverse((o) => {
            if (o.userData.cap) capCount++;
          });
          live.current.onCapabilities?.({
            nodeId: id,
            cutaway: capCount > 0,
            explode: supportsExplosion(id, current.parts.length),
            labels: labelElements.size > 0 || landmarkElements.length > 0,
            labelModes: ["whole", "section", "explode"].filter(
              (mode) =>
                current.parts.some(
                  (part) =>
                    labelElements.has(part.userData.hitId) &&
                    isStructureLabelVisible(part.userData, mode),
                ) ||
                (mode !== "explode" &&
                  current.landmarks.some((landmark) =>
                    isStructureLabelVisible(landmark, mode),
                  )),
            ),
          });
          renderer.shadowMap.needsUpdate = true;
          // A rebuilt renderer should resume this view, unless navigation or an
          // explicit reset requested a different one while the context was lost.
          const recovery = recoveryView.current;
          recoveryView.current = null;
          const resume =
            recovery?.viewKey === currentKey &&
            recovery.nodeId === live.current.nodeId &&
            recovery.resetKey === live.current.resetKey &&
            recovery.initialView ===
              JSON.stringify(normalizeSceneView(live.current.initialView));
          const initial = resume ? recovery.view : live.current.initialView;
          if (initial) setView(initial);
        }
        function requestNode(id) {
          const key = live.current.viewKey;
          if (requestedKey === key) return;
          publishReady(null);
          // A navigation can interrupt a gesture before its pointer-up reaches us.
          activePointers.clear();
          down = null;
          dragged = false;
          remember();
          requestedKey = key;
          setError(null);
          const token = ++generation;
          detailLoader.cancelObsolete();
          if (cache.has(id)) {
            cellModel.cancelPending();
            loading = false;
            controls.enabled = true;
            loadingLabel.hidden = true;
            el.setAttribute("aria-busy", "false");
            el.dataset.prepareMs = "0";
            el.dataset.prepareSource = "cache";
            switchNode(id, null);
            return;
          }
          loading = true;
          controls.enabled = false;
          clearHover();
          // Labels belong to the previous model until the requested view is ready.
          labelList.hidden = true;
          leaders.style.display = "none";
          for (const label of [...labelElements.values(), ...landmarkElements])
            label.pin.style.display = "none";
          loadingLabel.textContent =
            live.current.lang === "en" ? "Preparing model…" : "正在准备模型…";
          loadingLabel.hidden = false;
          el.setAttribute("aria-busy", "true");
          const started = performance.now();
          el.dataset.prepareSource = "build";
          let obsolete = false;
          const isCurrent = () => {
            // Once cancelled, a reply stays cancelled even if the user immediately
            // returns to this route before its promise continuation runs.
            obsolete ||=
              destroyed || token !== generation || live.current.viewKey !== key;
            return !obsolete;
          };
          const retireIfStale = () => {
            if (isCurrent()) return false;
            // No newer frame may have requested the next route yet. Permit a retry
            // rather than leaving this completed request marked as still pending.
            if (!destroyed && token === generation) requestedKey = null;
            return true;
          };
          detailLoader
            .load(id, isCurrent)
            .then(async (special) => {
              if (retireIfStale()) {
                if (special) disposeView({ root: special });
                return;
              }
              if (!special) await cellModel.load();
              else cellModel.cancelPending();
              if (retireIfStale()) {
                if (special) disposeView({ root: special });
                return;
              }
              loading = false;
              controls.enabled = true;
              loadingLabel.hidden = true;
              el.setAttribute("aria-busy", "false");
              el.dataset.prepareMs = (performance.now() - started).toFixed(1);
              el.dataset.prepareSource = special
                ? detailLoader.sourceFor(id)
                : cellModel.source;
              switchNode(id, special);
              invalidate();
            })
            .catch(() => {
              if (retireIfStale()) return;
              loading = false;
              loadingLabel.hidden = true;
              setError("model");
              el.setAttribute("aria-busy", "false");
            });
        }
        const resize = () => {
          const oldDistance = distance(),
            w = el.clientWidth,
            h = el.clientHeight;
          if (!w || !h) return;
          viewWidth = w;
          viewHeight = h;
          if (zoomTools) {
            const canvasBounds = el.getBoundingClientRect(),
              toolsBounds = zoomTools.getBoundingClientRect();
            zoomBounds = {
              left: toolsBounds.left - canvasBounds.left,
              top: toolsBounds.top - canvasBounds.top,
              bottom: toolsBounds.bottom - canvasBounds.top,
            };
            rightLabelGutter = Math.max(0, w - zoomBounds.left + 8);
          }
          invalidate();
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          controls.maxDistance = Math.max(24, distance() * 2);
          if (current) {
            const ratio = distance() / oldDistance;
            camera.position
              .sub(controls.target)
              .multiplyScalar(ratio)
              .add(controls.target);
            if (fitting)
              desiredCamera
                .sub(controls.target)
                .multiplyScalar(ratio)
                .add(controls.target);
          } else fit(true);
        };
        const observer = new ResizeObserver(resize);
        prepared.ownSetup(() => observer.disconnect());
        observer.observe(el);
        if (zoomTools) observer.observe(zoomTools);
        resize();
        const raycaster = new THREE.Raycaster();
        raycaster.firstHitOnly = true;
        const pointer = new THREE.Vector2();
        let down = null,
          dragged = false;
        const activePointers = new Set();
        function hit(e) {
          if (
            loading ||
            shaderPreparing ||
            contextLost ||
            currentKey !== live.current.viewKey
          )
            return null;
          const pickStart = performance.now();
          const r = renderer.domElement.getBoundingClientRect();
          pointer.set(
            ((e.clientX - r.left) / r.width) * 2 - 1,
            (-(e.clientY - r.top) / r.height) * 2 + 1,
          );
          raycaster.setFromCamera(pointer, camera);
          const candidates = collectPickingCandidates();
          let hits = raycaster.intersectObjects(candidates.primary, false);
          if (!hits.length && candidates.fallback.length)
            hits = raycaster.intersectObjects(candidates.fallback, false);
          el.dataset.pickMs = (performance.now() - pickStart).toFixed(2);
          let indexedMeshes = 0;
          for (const mesh of pickable)
            if (mesh.geometry.boundsTree) indexedMeshes++;
          el.dataset.indexedMeshes = indexedMeshes;
          const id = hits[0]?.object.userData.hitId;
          return getNode(live.current.nodeId).children.includes(id) ? id : null;
        }
        const pointerDown = (e) => {
          if (
            loading ||
            shaderPreparing ||
            contextLost ||
            currentKey !== live.current.viewKey
          )
            return;
          activePointers.add(e.pointerId);
          down = [e.clientX, e.clientY];
          dragged = activePointers.size > 1;
          fitting = false;
          clearHover();
        };
        const pointerUp = (e) => {
          const start = down,
            wasDragged = dragged;
          activePointers.delete(e.pointerId);
          down = null;
          dragged = activePointers.size > 0;
          if (
            e.button !== 0 ||
            !start ||
            wasDragged ||
            activePointers.size ||
            Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 5
          )
            return;
          const id = hit(e);
          if (id) {
            clearHover();
            live.current.onEnter(id);
          }
        };
        let lastHover = 0;
        const pointerMove = (e) => {
          if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
            dragged = true;
          if (e.buttons || e.pointerType === "touch") {
            clearHover();
            return;
          }
          if (performance.now() - lastHover < 65) return;
          lastHover = performance.now();
          const nextHover = hit(e);
          if (nextHover !== hoverId) invalidate();
          hoverId = nextHover;
          hover.hidden = !hoverId;
          if (hoverId) {
            const r = el.getBoundingClientRect();
            hover.textContent =
              getNode(hoverId, live.current.lang).name +
              (live.current.lang === "en" ? " · Click to open" : " · 点击进入");
            hover.style.left = `${Math.max(10, Math.min(el.clientWidth - 190, e.clientX - r.left + 15))}px`;
            hover.style.top = `${Math.max(12, Math.min(el.clientHeight - 38, e.clientY - r.top - 36))}px`;
          }
          renderer.domElement.style.cursor = hoverId ? "pointer" : "grab";
        };
        const cancelPointer = (e) => {
          activePointers.delete(e.pointerId);
          down = null;
          dragged = true;
          clearHover();
        };
        renderer.domElement.addEventListener("pointerdown", pointerDown);
        renderer.domElement.addEventListener("pointerup", pointerUp);
        renderer.domElement.addEventListener("pointermove", pointerMove);
        renderer.domElement.addEventListener("pointerleave", clearHover);
        renderer.domElement.addEventListener("pointercancel", cancelPointer);
        prepared.ownSetup(() => {
          renderer.domElement.removeEventListener("pointerdown", pointerDown);
          renderer.domElement.removeEventListener("pointerup", pointerUp);
          renderer.domElement.removeEventListener("pointermove", pointerMove);
          renderer.domElement.removeEventListener("pointerleave", clearHover);
          renderer.domElement.removeEventListener(
            "pointercancel",
            cancelPointer,
          );
        });
        function animate(t) {
          // Loading, shader preparation and moving frames keep their cadence.
          // The settled branch cancels the reserved opportunity below.
          renderLoop.request();
          if (previous === 0) {
            metricTime = t;
            frameCount = 0;
          }
          const dt = previous ? Math.min((t - previous) / 1000, 0.05) : 1 / 60;
          previous = t;
          const p = live.current;
          const ease = reduceMotion ? 1 : 1 - Math.pow(0.87, dt * 30),
            cameraEase = reduceMotion ? 1 : 1 - Math.pow(0.88, dt * 30);
          // Short, time-based inertia keeps direct manipulation responsive.
          controls.dampingFactor = 1 - Math.pow(0.82, dt * 60);
          if (
            !current ||
            currentKey !== p.viewKey ||
            (loading && requestedKey !== p.viewKey)
          )
            requestNode(p.nodeId);
          if (loading) {
            const text = p.lang === "en" ? "Preparing model…" : "正在准备模型…";
            if (loadingLabel.textContent !== text)
              loadingLabel.textContent = text;
            return;
          }
          // A failed request must not render or identify the previous model as the
          // requested route. Its disabled preview remains behind the retry message.
          if (!current || currentKey !== p.viewKey) return;
          if (shaderPreparing) {
            if (!shaderPreparation.ready()) return;
            el.dataset.shaderPreparationStatus = shaderPreparation.status;
            shaderPreparing = false;
            shaderPreparedRoots.add(current.root);
            controls.enabled = true;
            loadingLabel.hidden = true;
            el.setAttribute("aria-busy", "false");
            dirty = true;
          }
          const isContracted =
            p.nodeId === "phageTail" && p.mode !== "explode" && p.contracted;
          const wasFitting = fitting;
          if (fitting) {
            camera.position.lerp(desiredCamera, cameraEase);
            if (camera.position.distanceToSquared(desiredCamera) < 0.0001) {
              camera.position.copy(desiredCamera);
              fitting = false;
            }
          }
          controls.autoRotate = p.rotate;
          if (p.rotate && p.autoRotateLimit > 0) {
            // A preview gently returns before the cutaway turns away from visitors.
            // Manual orbit stays unrestricted; ordinary exploration keeps full turns.
            const angle = controls.getAzimuthalAngle();
            if (angle <= -p.autoRotateLimit) controls.autoRotateSpeed = -0.24;
            else if (angle >= p.autoRotateLimit)
              controls.autoRotateSpeed = 0.24;
          }
          const cameraChanged = controls.update(dt);
          if (
            !dirty &&
            !wasFitting &&
            transition === 1 &&
            !partsMoving &&
            !highlightMoving &&
            !cameraChanged &&
            !p.rotate
          ) {
            el.dataset.renderState = "idle";
            el.dataset.renderFps = "0.0";
            metricTime = t;
            frameCount = 0;
            previous = 0;
            renderLoop.cancelPending();
            return;
          }
          const cpuStart = performance.now();
          // Project labels using this frame's orbit, not the pre-lookAt matrix.
          camera.updateMatrixWorld();
          dirty = false;
          partsMoving = false;
          highlightMoving = false;
          const oldTransition = transition;
          transition = THREE.MathUtils.lerp(transition, 1, ease);
          if (1 - transition < 0.0001) transition = 1;
          current.root.scale.setScalar(transition);
          if (oldTransition !== transition) {
            renderer.shadowMap.needsUpdate = true;
            matricesDirty = true;
          }
          const amount =
            p.mode === "explode" && current.parts.length > 1
              ? p.explode / 100
              : 0;
          const projectedLabels = [],
            compact = viewWidth < 560;
          let compactTargetCount = 0;
          for (const part of current.parts) {
            const target = tempTarget
              .copy(part.userData.home)
              .addScaledVector(part.userData.offset, amount);
            const contracting =
              isContracted && part.userData.hitId === "phageSheath";
            const rest = part.userData.restScale;
            const sx = rest.x * (contracting ? 1.4 : 1),
              sy = rest.y * (contracting ? 0.52 : 1),
              sz = rest.z * (contracting ? 1.4 : 1);
            if (contracting)
              target.y +=
                (part.userData.frameBounds.max.y - part.userData.home.y) * 0.48;
            if (
              Math.abs(part.scale.x - sx) +
                Math.abs(part.scale.y - sy) +
                Math.abs(part.scale.z - sz) >
              0.0001
            ) {
              part.scale.set(
                THREE.MathUtils.lerp(part.scale.x, sx, ease),
                THREE.MathUtils.lerp(part.scale.y, sy, ease),
                THREE.MathUtils.lerp(part.scale.z, sz, ease),
              );
              partsMoving = true;
              renderer.shadowMap.needsUpdate = true;
              matricesDirty = true;
            } else if (
              part.scale.x !== sx ||
              part.scale.y !== sy ||
              part.scale.z !== sz
            ) {
              part.scale.set(sx, sy, sz);
              matricesDirty = true;
              renderer.shadowMap.needsUpdate = true;
            }
            if (part.position.distanceToSquared(target) > 0.000001) {
              renderer.shadowMap.needsUpdate = true;
              part.position.lerp(target, ease);
              partsMoving = true;
              matricesDirty = true;
            } else if (!part.position.equals(target)) {
              part.position.copy(target);
              renderer.shadowMap.needsUpdate = true;
              matricesDirty = true;
            }
          }
          if (matricesDirty) {
            scene.updateMatrixWorld();
            matricesDirty = false;
          }
          for (const part of current.parts) {
            const label = labelElements.get(part.userData.hitId);
            if (label) {
              const text = getNode(part.userData.hitId, p.lang).name;
              if (label.textContent !== text) label.textContent = text;
              const visible =
                p.labels && isStructureLabelVisible(part.userData, p.mode);
              setStyleIfChanged(label, "display", visible ? "block" : "none");
              if (!visible || !compact)
                setStyleIfChanged(label.leader, "display", label.style.display);
              if (visible) {
                const v = tempProjected
                  .copy(part.userData.labelAnchor)
                  .applyMatrix4(part.matrixWorld)
                  .project(camera);
                projectedLabels.push({
                  label,
                  id: part.userData.hitId,
                  protectAnchor: true,
                  x: (v.x * 0.5 + 0.5) * viewWidth,
                  y: (-v.y * 0.5 + 0.5) * viewHeight,
                });
                if (compact && part.userData.annotationTargets)
                  for (const point of part.userData.annotationTargets) {
                    const target =
                      compactProtectedTargets[compactTargetCount] ??
                      (compactProtectedTargets[compactTargetCount] = {
                        x: 0,
                        y: 0,
                      });
                    compactTargetCount++;
                    tempProjected
                      .copy(point)
                      .applyMatrix4(part.matrixWorld)
                      .project(camera);
                    target.x = (tempProjected.x * 0.5 + 0.5) * viewWidth;
                    target.y = (-tempProjected.y * 0.5 + 0.5) * viewHeight;
                  }
              }
            }
          }
          for (const label of landmarkElements) {
            const visible =
              p.labels &&
              p.mode !== "explode" &&
              isStructureLabelVisible(label.landmark, p.mode);
            setStyleIfChanged(label, "display", visible ? "block" : "none");
            if (!visible || !compact)
              setStyleIfChanged(label.leader, "display", label.style.display);
            if (visible) {
              const text = label.landmark[p.lang === "en" ? "en" : "zh"];
              if (label.textContent !== text) label.textContent = text;
              const v = tempProjected
                .copy(label.landmark.position)
                .multiplyScalar(transition)
                .project(camera);
              projectedLabels.push({
                label,
                protectAnchor: true,
                x: (v.x * 0.5 + 0.5) * viewWidth,
                y: (-v.y * 0.5 + 0.5) * viewHeight,
              });
            }
          }
          el.classList.toggle("compact-labels", compact);
          setHiddenIfChanged(labelList, !p.labels);
          setStyleIfChanged(leaders, "display", p.labels ? "block" : "none");
          for (const label of [...labelElements.values(), ...landmarkElements])
            setStyleIfChanged(
              label.pin,
              "display",
              compact && label.style.display !== "none" ? "block" : "none",
            );
          if (compact) {
            compactProtectedTargets.length = compactTargetCount;
            layoutCompactPins(
              projectedLabels,
              viewWidth,
              viewHeight,
              zoomBounds,
              compactProtectedTargets,
            );
            for (const entry of projectedLabels) {
              setStyleIfChanged(entry.label, "left", "");
              setStyleIfChanged(entry.label, "top", "");
              setStyleIfChanged(entry.label.pin, "left", `${entry.pinX}px`);
              setStyleIfChanged(entry.label.pin, "top", `${entry.pinY}px`);
              const line = entry.label.leader,
                moved = entry.pinX !== entry.x || entry.pinY !== entry.y;
              setStyleIfChanged(line, "display", moved ? "block" : "none");
              if (moved) {
                setAttributeIfChanged(line, "x1", entry.x);
                setAttributeIfChanged(line, "y1", entry.y);
                setAttributeIfChanged(line, "x2", entry.pinX);
                setAttributeIfChanged(line, "y2", entry.pinY);
              }
            }
          } else
            for (const side of [-1, 1]) {
              const entries = projectedLabels
                .filter((e) => (e.x < viewWidth / 2 ? -1 : 1) === side)
                .sort((a, b) => a.y - b.y);
              const gap = Math.min(
                48,
                (viewHeight - 64) / Math.max(entries.length - 1, 1),
              );
              let last = 20 - gap;
              entries.forEach((entry, i) => {
                const y = Math.max(
                  last + gap,
                  Math.min(
                    entry.y,
                    viewHeight - 25 - (entries.length - 1 - i) * gap,
                  ),
                );
                last = y;
                const measureKey =
                  entry.label.textContent + "|" + viewWidth + "|" + side;
                if (entry.label.measureKey !== measureKey) {
                  // Measure at the ordinary column position. Auto-width captions
                  // can wrap differently after a previous toolbar avoidance.
                  entry.label.labelWidth = entry.label.offsetWidth;
                  const ordinaryInset = Math.max(
                    Math.min(90, viewWidth * 0.25),
                    entry.label.labelWidth / 2 + 8,
                  );
                  setStyleIfChanged(
                    entry.label,
                    "left",
                    `${side < 0 ? ordinaryInset : viewWidth - ordinaryInset}px`,
                  );
                  entry.label.visibleWidth = entry.label.offsetWidth;
                  entry.label.labelHeight = entry.label.offsetHeight;
                  entry.label.measureKey = measureKey;
                }
                let inset = Math.max(
                  Math.min(90, viewWidth * 0.25),
                  entry.label.labelWidth / 2 + 8,
                );
                if (
                  side > 0 &&
                  zoomBounds &&
                  y + entry.label.labelHeight / 2 > zoomBounds.top &&
                  y - entry.label.labelHeight / 2 < zoomBounds.bottom &&
                  viewWidth - inset + entry.label.visibleWidth / 2 >
                    zoomBounds.left
                )
                  // Cover both long words and captions that widen as they move.
                  inset = Math.max(
                    inset,
                    entry.label.visibleWidth / 2 + rightLabelGutter,
                    rightLabelGutter * 2,
                  );
                const x = side < 0 ? inset : viewWidth - inset;
                setStyleIfChanged(entry.label, "left", `${x}px`);
                setStyleIfChanged(entry.label, "top", `${y}px`);
                const line = entry.label.leader;
                setAttributeIfChanged(line, "x1", entry.x);
                setAttributeIfChanged(line, "y1", entry.y);
                setAttributeIfChanged(line, "x2", x);
                setAttributeIfChanged(line, "y2", y);
              });
            }
          const railHeight =
            compact && p.labels && projectedLabels.length
              ? labelList.offsetHeight + 12
              : 0;
          if (
            layoutParent.style.getPropertyValue("--label-rail") !==
            `${railHeight}px`
          )
            layoutParent.style.setProperty("--label-rail", `${railHeight}px`);
          const appearance = updateAppearance(
            p.mode,
            p.highlight || hoverId,
            reduceMotion ? 1 : 1 - Math.pow(0.78, dt * 30),
          );
          highlightMoving = appearance.moving;
          if (appearance.shadowChanged) renderer.shadowMap.needsUpdate = true;
          facingCull.step(camera);
          if (!shaderPreparedRoots.has(current.root)) {
            const preparingRoot = current.root;
            const preparingKey = currentKey;
            el.dataset.shaderPreparationStatus = "pending";
            shaderPreparation.begin(
              scene,
              camera,
              () =>
                !destroyed &&
                !contextLost &&
                current?.root === preparingRoot &&
                live.current.viewKey === preparingKey,
            );
            if (!shaderPreparation.ready()) {
              shaderPreparing = true;
              controls.enabled = false;
              loadingLabel.hidden = false;
              el.setAttribute("aria-busy", "true");
              publishReady(null);
              dirty = true;
              return;
            }
            shaderPreparedRoots.add(current.root);
          }
          renderer.render(scene, camera);
          el.dataset.pose = isContracted ? "contracted" : "rest";
          renderCount++;
          el.dataset.renderState = "active";
          el.dataset.renderCount = renderCount;
          el.dataset.frameCpuMs = (performance.now() - cpuStart).toFixed(2);
          frameCount++;
          if (t - metricTime > 1500) {
            el.dataset.renderFps = (
              (frameCount * 1000) /
              (t - metricTime)
            ).toFixed(1);
            frameCount = 0;
            metricTime = t;
          }
          current.fitDistance = distance();
          el.dataset.node = p.nodeId;
          el.dataset.mode = p.mode;
          el.dataset.camera = camera.position
            .toArray()
            .map((n) => n.toFixed(3))
            .join(",");
          el.dataset.drawCalls = renderer.info.render.calls;
          publishReady(api);
        }
        loadingLabel.textContent =
          live.current.lang === "en" ? "Preparing model…" : "正在准备模型…";
        loadingLabel.hidden = false;
        el.setAttribute("aria-busy", "true");
        capture = createSceneCapture({
          renderer,
          scene,
          camera,
          target: controls.target,
          getFittedDistance: () => distance(),
          canReuseLiveShadows: () =>
            captureSeparation === null && !captureSettlesEntry,
          fitDistance: (exportCamera) =>
            distance(true, exportCamera, captureSeparation),
          getLabels: () => {
            const items = [];
            const seen = new Set();
            const mode = structureCaptureMode(
              live.current.mode,
              captureSeparation,
            );
            for (const part of current.parts) {
              const id = part.userData.hitId;
              if (
                !labelElements.has(id) ||
                seen.has(id) ||
                !isStructureLabelVisible(part.userData, mode)
              )
                continue;
              seen.add(id);
              items.push({
                text: getNode(id, live.current.lang).name,
                position: part.userData.labelAnchor
                  .clone()
                  .applyMatrix4(part.matrixWorld),
              });
            }
            if (mode !== "explode")
              for (const label of landmarkElements) {
                if (!isStructureLabelVisible(label.landmark, mode)) continue;
                items.push({
                  text: label.landmark[
                    live.current.lang === "en" ? "en" : "zh"
                  ],
                  position: label.landmark.position
                    .clone()
                    .multiplyScalar(transition),
                  priority: -1,
                });
              }
            return items;
          },
        });
        prepared.ownSetup(() => capture.dispose());
        api = {
          get ready() {
            return (
              !destroyed &&
              !contextLost &&
              !loading &&
              !shaderPreparing &&
              Boolean(current) &&
              currentKey === live.current.viewKey
            );
          },
          get canExplode() {
            return (
              Boolean(current) &&
              supportsExplosion(live.current.nodeId, current.parts.length)
            );
          },
          getView: readView,
          setView,
          releaseCapture: () => capture.dispose(),
          prepareCaptureFrame(options = {}) {
            return api.captureFrame(options, true);
          },
          captureFrame(options = {}, prepare = false) {
            if (!api.ready)
              throw new Error("The structure scene is not ready to capture.");
            const separation =
              Number.isFinite(options.separation) && api.canExplode
                ? THREE.MathUtils.clamp(options.separation, 0, 1)
                : null;
            const poses = [];
            const visibility = [];
            const entryTransition = transition;
            const entryScale = current.root.scale.clone();
            const entryRoot = current.root;
            try {
              captureSeparation = separation;
              // Entry animation is a live presentation effect, not an export pose.
              // Capture the complete specimen, including label anchors and shadows,
              // then restore the animation exactly even if capture fails.
              captureSettlesEntry = entryTransition !== 1;
              transition = 1;
              entryRoot.scale.setScalar(1);
              if (!options.background || options.background === "transparent") {
                visibility.push([floor, floor.visible]);
                floor.visible = false;
              }
              if (separation !== null) {
                for (const part of current.parts) {
                  poses.push([part, part.position.clone(), part.scale.clone()]);
                  part.position
                    .copy(part.userData.home)
                    .addScaledVector(part.userData.offset, separation);
                  part.scale.copy(part.userData.restScale);
                }
                const mode = structureCaptureMode(
                  live.current.mode,
                  separation,
                );
                current.root.traverse((object) => {
                  const data = object.userData;
                  if (!data.assembledOnly && !data.cap && !data.cutOnly) return;
                  visibility.push([object, object.visible]);
                  object.visible = data.cap
                    ? mode === "whole"
                    : data.cutOnly
                      ? mode !== "whole"
                      : mode !== "explode";
                });
              }
              if (matricesDirty || separation !== null || captureSettlesEntry)
                scene.updateMatrixWorld();
              return prepare
                ? capture.prepareFrame(options)
                : capture.captureFrame(options);
            } finally {
              captureSeparation = null;
              transition = entryTransition;
              entryRoot.scale.copy(entryScale);
              for (const [part, position, scale] of poses) {
                part.position.copy(position);
                part.scale.copy(scale);
              }
              for (const [object, visible] of visibility)
                object.visible = visible;
              if (separation !== null || captureSettlesEntry)
                scene.updateMatrixWorld();
              captureSettlesEntry = false;
            }
          },
        };
        renderLoop.start();
        engine.current = {
          api,
          renderer,
          camera,
          controls,
          fit,
          invalidate,
          getKey: () => currentKey,
          cancelFit: () => {
            fitting = false;
            invalidate();
          },
        };
        const dispose = () => {
          if (destroyed) return;
          destroyed = true;
          shaderPreparation.dispose();
          publishReady(null);
          capture.dispose();
          framingDistance.invalidate();
          generation++;
          cellModel.cancelPending();
          detailLoader.dispose();
          loadingLabel.remove();
          pickingIndex.dispose();
          renderLoop.dispose();
          observer.disconnect();
          document.removeEventListener("visibilitychange", visibilityChanged);
          controls.removeEventListener("change", orbitChanged);
          disposeOrbitControls(controls);
          renderer.domElement.removeEventListener("pointerdown", pointerDown);
          renderer.domElement.removeEventListener("pointerup", pointerUp);
          renderer.domElement.removeEventListener("pointermove", pointerMove);
          renderer.domElement.removeEventListener("pointerleave", clearHover);
          renderer.domElement.removeEventListener(
            "pointercancel",
            cancelPointer,
          );
          hover.remove();
          leaders.remove();
          labelList.remove();
          landmarkElements.forEach((l) => {
            l.pin.remove();
            l.remove();
          });
          facingCull.dispose();
          for (const view of cache.values()) disposeView(view);
          cellModel.dispose();
          key.shadow.dispose();
          floor.geometry.dispose();
          floor.material.dispose();
          shadowTexture.dispose();
          if (!prepared.environmentManaged) env.dispose();
          renderer.domElement.removeEventListener(
            "webglcontextlost",
            loseContext,
          );
          renderer.domElement.removeEventListener(
            "webglcontextrestored",
            restoreContext,
          );
          prepared.releaseRendering(contextLost);
          labelElements.forEach((l) => {
            l.pin.remove();
            l.remove();
          });
          layoutParent.style.removeProperty("--label-rail");
          engine.current = null;
        };
        if (engine.current) engine.current.dispose = dispose;
        prepared.finishSetup();
        return dispose;
      },
      (prepared) => prepared.dispose(),
      { onError: setInitializationFailure },
    );
    pendingInitialization.current = job;
    return () => {
      job.dispose();
      if (pendingInitialization.current === job)
        pendingInitialization.current = null;
    };
  }, [attempt, renderingOwner]);
  useEffect(() => {
    publishReady(engine.current?.api?.ready ? engine.current.api : null);
  }, [onSceneReady]);
  useEffect(() => {
    engine.current?.invalidate();
  }, [viewKey, highlight, mode, explode, labels, rotate, lang, contracted]);
  useEffect(() => {
    if (engine.current?.getKey() === viewKey) {
      engine.current.fit(false, true);
      engine.current.renderer.shadowMap.needsUpdate = true;
    }
  }, [mode, explode]);
  useEffect(() => {
    if (resetKey) engine.current?.fit();
  }, [resetKey]);
  useEffect(() => {
    if (engine.current && zoom.direction) {
      const { camera, controls } = engine.current;
      engine.current.cancelFit();
      camera.position
        .sub(controls.target)
        .multiplyScalar(zoom.direction === "in" ? 0.84 : 1.19)
        .clampLength(controls.minDistance, controls.maxDistance)
        .add(controls.target);
      controls.update();
    }
  }, [zoom]);
  if (initializationFailure) throw initializationFailure;
  return (
    <div
      className="model-canvas"
      ref={host}
      aria-label={lang === "en" ? "Interactive 3D model" : "可交互三维模型"}
    >
      <p id={keyboardHintId} className="scene-keyboard-hint" aria-hidden="true">
        {lang === "en"
          ? "3D model · Shift + arrow keys to rotate · Tab to leave"
          : "三维模型 · Shift + 方向键旋转 · Tab 移到其他控件"}
      </p>
      {error && (
        <div className="webgl-error" role="alert">
          <p>
            {error === "webgl"
              ? lang === "en"
                ? "WebGL is unavailable. The structure catalog remains accessible."
                : "浏览器暂时无法启用 WebGL，仍可通过目录查看结构说明。"
              : error === "context"
                ? lang === "en"
                  ? "The graphics connection was interrupted. Restoring the model…"
                  : "图形连接暂时中断，正在等待恢复，也可重新加载。"
                : lang === "en"
                  ? "The model could not be loaded. Please try again."
                  : "模型暂时未能加载，请重试。"}
          </p>
          <button
            onClick={() => {
              setError(null);
              setAttempt((n) => n + 1);
            }}
          >
            {lang === "en" ? "Try again" : "重新加载"}
          </button>
        </div>
      )}
    </div>
  );
}
