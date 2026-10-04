import { createDetailLoader } from "./scene/detailLoader";
import { createPickingIndex } from "./scene/picking";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createCellLoader } from "./scene/cellLoader";
import { disposeCell } from "./scene/cellTransfer";
import { makePresentation } from "./scene/presentation";
import { createPresentationAppearance } from "./scene/presentationAppearance";
import { explodedFitDistance } from "./scene/viewFraming";
import { createFramingDistanceCache } from "./scene/framingDistanceCache.js";
import { supportsExplosion } from "./scene/viewCapabilities";
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
}) {
  const host = useRef(),
    engine = useRef(),
    live = useRef();
  const [error, setError] = useState(null),
    [attempt, setAttempt] = useState(0);
  live.current = {
    nodeId,
    viewKey,
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
  useEffect(() => {
    const el = host.current;
    const layoutParent = el.parentElement;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer,
      contextLost = false;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setError("webgl");
      return;
    }
    const loseContext = (event) => {
      event.preventDefault();
      contextLost = true;
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
    controls.enableZoom = allowZoom;
    controls.enableDamping = !reduceMotion;
    controls.enablePan = false;
    controls.dampingFactor = 0.18;
    controls.minDistance = 4;
    controls.maxDistance = 24;
    controls.autoRotateSpeed = 0.24;
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment(),
      env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.45;
    room.dispose();
    pmrem.dispose();
    // A broad key with restrained fill retains membrane depth and pastel color.
    scene.add(new THREE.HemisphereLight("#ffffff", "#a0a6b2", 0.85));
    const key = new THREE.DirectionalLight("#fffaf5", 2.3);
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
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.1;
    scene.add(floor);
    const pickingIndex = createPickingIndex(),
      detailLoader = createDetailLoader();
    let requestedKey = null,
      loading = false,
      destroyed = false,
      generation = 0;
    let cellLoader = null;
    const cache = new Map(),
      cameraStates = new Map();
    let model = null;
    let currentKey = null,
      pickable = [];
    let matricesDirty = true,
      updateAppearance;
    let current = null,
      frame = 0,
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
      renderCount = 0;
    const tempTarget = new THREE.Vector3(),
      tempProjected = new THREE.Vector3();
    const invalidate = () => {
      dirty = true;
    };
    const labelElements = new Map(),
      landmarkElements = [];
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
    let capture, api;
    const readView = () => readSceneView(camera, controls.target, distance());
    const orbitChanged = () => {
      if (suppressViewChange || !api?.ready || !live.current.onViewChange)
        return;
      const view = readView();
      const values = [...view.direction, ...view.target, view.zoom];
      if (
        lastView &&
        values.every((value, index) => Math.abs(value - lastView[index]) < 1e-6)
      )
        return;
      lastView = values;
      live.current.onViewChange(view);
    };
    controls.addEventListener("change", orbitChanged);
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
    const hover = document.createElement("div");
    hover.className = "model-hover";
    hover.hidden = true;
    el.append(hover);
    const labelList = document.createElement("div");
    labelList.className = "model-label-list";
    el.append(labelList);
    const leaders = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    leaders.classList.add("label-leaders");
    leaders.setAttribute("aria-hidden", "true");
    el.append(leaders);
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
      setError(null);
      invalidate();
      clearHover();
      settleControls();
      if (current) scene.remove(current.root);
      if (!cache.has(id)) cache.set(id, makePresentation(model, id, special));
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
      [...labelElements.values(), ...landmarkElements].forEach((label, i) => {
        const pin = document.createElement("span");
        pin.className = "model-pin";
        pin.textContent = i + 1;
        pin.setAttribute("aria-hidden", "true");
        el.append(pin);
        label.pin = pin;
        label.dataset.number = i + 1;
      });
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
      if (live.current.initialView) setView(live.current.initialView);
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
      if (cache.has(id)) {
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
          if (!special) {
            cellLoader ??= createCellLoader();
            model = await cellLoader.promise;
          }
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
            : cellLoader.source;
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
    observer.observe(el);
    resize();
    const raycaster = new THREE.Raycaster();
    raycaster.firstHitOnly = true;
    const pointer = new THREE.Vector2();
    let down = null,
      dragged = false;
    const activePointers = new Set();
    function hit(e) {
      if (loading || contextLost || currentKey !== live.current.viewKey)
        return null;
      const pickStart = performance.now();
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const visible = pickable.filter((o) => {
        if (o.userData.nonInteractive) return false;
        for (let p = o; p; p = p.parent) if (!p.visible) return false;
        return true;
      });
      let hits;
      if (
        [
          "cell",
          "cytoplasm",
          "plant",
          "bacterium",
          "yeast",
          "paramecium",
          "phage",
        ].includes(live.current.nodeId)
      ) {
        const backdrop = [
          "membrane",
          "cytoplasm",
          "cytosol",
          "cytoskeleton",
          "cellWall",
          "plantMembrane",
          "plantCytoplasm",
          "vacuole",
          "bacterialEnvelope",
          "bacterialCytoplasm",
          "yeastWall",
          "yeastMembrane",
          "paraSurface",
          "paraCilia",
          "phageHead",
        ];
        hits = raycaster.intersectObjects(
          visible.filter((o) => !backdrop.includes(o.userData.hitId)),
          false,
        );
        if (!hits.length)
          hits = raycaster.intersectObjects(
            visible.filter((o) => backdrop.includes(o.userData.hitId)),
            false,
          );
      } else hits = raycaster.intersectObjects(visible, false);
      el.dataset.pickMs = (performance.now() - pickStart).toFixed(2);
      el.dataset.indexedMeshes = pickable.filter(
        (o) => o.geometry.boundsTree,
      ).length;
      const id = hits[0]?.object.userData.hitId;
      return getNode(live.current.nodeId).children.includes(id) ? id : null;
    }
    const pointerDown = (e) => {
      if (loading || contextLost || currentKey !== live.current.viewKey) return;
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
    function animate(t) {
      frame = requestAnimationFrame(animate);
      if (document.hidden || contextLost) {
        previous = 0;
        return;
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
        if (loadingLabel.textContent !== text) loadingLabel.textContent = text;
        return;
      }
      // A failed request must not render or identify the previous model as the
      // requested route. Its disabled preview remains behind the retry message.
      if (!current || currentKey !== p.viewKey) return;
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
        else if (angle >= p.autoRotateLimit) controls.autoRotateSpeed = 0.24;
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
        p.mode === "explode" && current.parts.length > 1 ? p.explode / 100 : 0;
      const projectedLabels = [];
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
          label.style.display = visible ? "block" : "none";
          label.leader.style.display = label.style.display;
          if (visible) {
            const v = tempProjected
              .copy(part.userData.labelAnchor)
              .applyMatrix4(part.matrixWorld)
              .project(camera);
            projectedLabels.push({
              label,
              id: part.userData.hitId,
              x: (v.x * 0.5 + 0.5) * viewWidth,
              y: (-v.y * 0.5 + 0.5) * viewHeight,
            });
          }
        }
      }
      for (const label of landmarkElements) {
        const visible =
          p.labels &&
          p.mode !== "explode" &&
          isStructureLabelVisible(label.landmark, p.mode);
        label.style.display = visible ? "block" : "none";
        label.leader.style.display = label.style.display;
        if (visible) {
          const text = label.landmark[p.lang === "en" ? "en" : "zh"];
          if (label.textContent !== text) label.textContent = text;
          const v = tempProjected
            .copy(label.landmark.position)
            .multiplyScalar(transition)
            .project(camera);
          projectedLabels.push({
            label,
            x: (v.x * 0.5 + 0.5) * viewWidth,
            y: (-v.y * 0.5 + 0.5) * viewHeight,
          });
        }
      }
      const compact = viewWidth < 560;
      el.classList.toggle("compact-labels", compact);
      labelList.hidden = !p.labels;
      leaders.style.display = p.labels && !compact ? "block" : "none";
      for (const label of [...labelElements.values(), ...landmarkElements])
        label.pin.style.display =
          compact && label.style.display !== "none" ? "block" : "none";
      if (compact) {
        for (const entry of projectedLabels) {
          entry.label.style.left = "";
          entry.label.style.top = "";
          entry.label.pin.style.left = `${Math.max(10, Math.min(viewWidth - 10, entry.x))}px`;
          entry.label.pin.style.top = `${Math.max(10, Math.min(viewHeight - 10, entry.y))}px`;
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
            const measureKey = entry.label.textContent + "|" + viewWidth;
            if (entry.label.measureKey !== measureKey) {
              entry.label.labelWidth = entry.label.offsetWidth;
              entry.label.measureKey = measureKey;
            }
            const inset = Math.max(
              Math.min(90, viewWidth * 0.25),
              entry.label.labelWidth / 2 + 8,
            );
            const x = side < 0 ? inset : viewWidth - inset;
            entry.label.style.left = `${x}px`;
            entry.label.style.top = `${y}px`;
            const line = entry.label.leader;
            line.setAttribute("x1", entry.x);
            line.setAttribute("y1", entry.y);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
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
      renderer.render(scene, camera);
      el.dataset.pose = isContracted ? "contracted" : "rest";
      renderCount++;
      el.dataset.renderState = "active";
      el.dataset.renderCount = renderCount;
      el.dataset.frameCpuMs = (performance.now() - cpuStart).toFixed(2);
      frameCount++;
      if (t - metricTime > 1500) {
        el.dataset.renderFps = ((frameCount * 1000) / (t - metricTime)).toFixed(
          1,
        );
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
      canReuseLiveShadows: () => captureSeparation === null,
      fitDistance: (exportCamera) =>
        distance(true, exportCamera, captureSeparation),
      getLabels: () => {
        const items = [];
        const seen = new Set();
        const mode = structureCaptureMode(live.current.mode, captureSeparation);
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
              text: label.landmark[live.current.lang === "en" ? "en" : "zh"],
              position: label.landmark.position
                .clone()
                .multiplyScalar(transition),
              priority: -1,
            });
          }
        return items;
      },
    });
    api = {
      get ready() {
        return (
          !destroyed &&
          !contextLost &&
          !loading &&
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
      captureFrame(options = {}) {
        if (!api.ready)
          throw new Error("The structure scene is not ready to capture.");
        const separation =
          Number.isFinite(options.separation) && api.canExplode
            ? THREE.MathUtils.clamp(options.separation, 0, 1)
            : null;
        const poses = [];
        const visibility = [];
        try {
          captureSeparation = separation;
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
            const mode = structureCaptureMode(live.current.mode, separation);
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
          if (matricesDirty || separation !== null) scene.updateMatrixWorld();
          return capture.captureFrame(options);
        } finally {
          captureSeparation = null;
          for (const [part, position, scale] of poses) {
            part.position.copy(position);
            part.scale.copy(scale);
          }
          for (const [object, visible] of visibility) object.visible = visible;
          if (separation !== null) scene.updateMatrixWorld();
        }
      },
    };
    frame = requestAnimationFrame(animate);
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
    return () => {
      destroyed = true;
      publishReady(null);
      capture.dispose();
      framingDistance.invalidate();
      generation++;
      cellLoader?.dispose();
      detailLoader.dispose();
      loadingLabel.remove();
      pickingIndex.dispose();
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerleave", clearHover);
      renderer.domElement.removeEventListener("pointercancel", cancelPointer);
      hover.remove();
      leaders.remove();
      labelList.remove();
      landmarkElements.forEach((l) => {
        l.pin.remove();
        l.remove();
      });
      for (const view of cache.values()) disposeView(view);
      disposeCell(model);
      key.shadow.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      shadowTexture.dispose();
      env.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", loseContext);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        restoreContext,
      );
      renderer.dispose();
      renderer.domElement.remove();
      labelElements.forEach((l) => {
        l.pin.remove();
        l.remove();
      });
      layoutParent.style.removeProperty("--label-rail");
      engine.current = null;
    };
  }, [attempt]);
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
  return (
    <div
      className="model-canvas"
      ref={host}
      aria-label={lang === "en" ? "Interactive 3D model" : "可交互三维模型"}
    >
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
