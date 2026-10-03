import * as THREE from "three";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function normalizeSceneView(view) {
  if (!view || !Number.isFinite(view.zoom) || view.zoom <= 0) return null;
  for (const key of ["direction", "target"])
    if (
      !Array.isArray(view[key]) ||
      view[key].length !== 3 ||
      !view[key].every(
        (value) => Number.isFinite(value) && Math.abs(value) <= 1000,
      )
    )
      return null;
  const direction = new THREE.Vector3().fromArray(view.direction);
  if (direction.lengthSq() < 1e-12) return null;
  return {
    direction: direction.normalize().toArray(),
    target: [...view.target],
    zoom: THREE.MathUtils.clamp(view.zoom, 0.1, 10),
  };
}

export function readSceneView(camera, target, fittedDistance) {
  const offset = camera.position.clone().sub(target);
  return {
    direction: offset.clone().normalize().toArray(),
    target: target.toArray(),
    zoom: offset.length() / Math.max(fittedDistance, 0.001),
  };
}

export function applySceneView(camera, target, fittedDistance, value) {
  const view = normalizeSceneView(value);
  if (!view || !Number.isFinite(fittedDistance) || fittedDistance <= 0)
    return false;
  target.fromArray(view.target);
  camera.position
    .fromArray(view.direction)
    .multiplyScalar(fittedDistance * view.zoom)
    .add(target);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return true;
}

export function captureCamera(
  camera,
  target,
  fittedDistance,
  width,
  height,
  turn,
  fitDistance,
  copy = camera.clone(),
) {
  copy.copy(camera, false);
  const offset = camera.position.clone().sub(target);
  const zoom = offset.length() / Math.max(fittedDistance, 0.001);
  if (Number.isFinite(turn))
    offset.applyAxisAngle(camera.up, turn % (Math.PI * 2));
  copy.aspect = width / height;
  copy.position.copy(target).add(offset);
  copy.lookAt(target);
  copy.updateMatrixWorld();
  const distance = fitDistance(copy);
  copy.position.copy(target).add(offset.setLength(distance * zoom));
  copy.far = Math.max(camera.far, distance * zoom + 100);
  copy.updateProjectionMatrix();
  copy.updateMatrixWorld();
  return copy;
}

function wrapText(text, maxWidth, measure) {
  const lines = [];
  let line = "";
  for (const word of text.match(/\S+\s*/gu) ?? []) {
    if (line && measure((line + word).trimEnd()) > maxWidth) {
      lines.push(line.trim());
      line = "";
    }
    // Chinese phrases and unusually long words can require character wrapping.
    for (const character of [...word]) {
      if (line && measure((line + character).trimEnd()) > maxWidth) {
        lines.push(line.trim());
        line = character.trimStart();
      } else line += character;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

// Captions use the same source anchors as the live annotations. Export can have
// a different aspect ratio, so lay them out anew instead of scaling DOM pixels.
export function layoutCaptureLabels(labels, width, height, measure) {
  if (width < 64 || height < 64) return [];
  const fontSize = Math.max(12, width / (width < height ? 40 : 65));
  const margin = fontSize * 0.65;
  const padding = fontSize * 0.45;
  const gap = fontSize * 0.45;
  const maxWidth = width * 0.36 - padding * 2;
  const result = [];
  for (const side of [-1, 1]) {
    let usedHeight = margin;
    const chosen = [];
    for (const label of labels
      .filter((label) => (label.x < width / 2 ? -1 : 1) === side)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))) {
      const lines = wrapText(label.text, maxWidth, (text) =>
        measure(text, fontSize),
      );
      if (!lines.length || lines.length > 3) continue;
      const itemHeight = lines.length * fontSize * 1.3 + padding * 2;
      if (usedHeight + itemHeight > height - margin) continue;
      const itemWidth =
        Math.min(
          maxWidth,
          Math.max(...lines.map((text) => measure(text, fontSize))),
        ) +
        padding * 2;
      chosen.push({
        ...label,
        lines,
        fontSize,
        padding,
        width: itemWidth,
        height: itemHeight,
      });
      usedHeight += itemHeight + gap;
    }
    chosen.sort((a, b) => a.y - b.y);
    let top = margin;
    let remaining =
      chosen.reduce((sum, item) => sum + item.height + gap, 0) - gap;
    for (const item of chosen) {
      const desired = item.y - item.height / 2;
      item.top = Math.max(top, Math.min(desired, height - margin - remaining));
      item.left = side < 0 ? margin : width - margin - item.width;
      item.side = side;
      result.push(item);
      top = item.top + item.height + gap;
      remaining -= item.height + gap;
    }
  }
  return result;
}

export function captureLabelPalette(background) {
  if (background === "transparent")
    return { line: "#4a505d", halo: "rgba(255,255,255,.9)" };
  const color = new THREE.Color(background);
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return { line: luminance < 0.18 ? "#d3dce9" : "#4a505d", halo: null };
}

function drawCaptureLabels(
  context,
  sources,
  camera,
  width,
  height,
  background,
) {
  const projected = [];
  for (const label of sources) {
    if (!label.text || !label.position || label.active === false) continue;
    const point = label.position.clone().project(camera);
    if (
      point.z < -1 ||
      point.z > 1 ||
      Math.abs(point.x) > 1 ||
      Math.abs(point.y) > 1
    )
      continue;
    projected.push({
      ...label,
      x: ((point.x + 1) * width) / 2,
      y: ((1 - point.y) * height) / 2,
    });
  }
  const family =
    'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  const labels = layoutCaptureLabels(projected, width, height, (text, size) => {
    context.font = `500 ${size}px ${family}`;
    return context.measureText(text).width;
  });
  const palette = captureLabelPalette(background);
  const lineWidth = Math.max(1, width / 1100);
  context.lineWidth = lineWidth;
  for (const label of labels) {
    const endpoint = label.side < 0 ? label.left + label.width : label.left;
    context.strokeStyle = palette.line;
    context.beginPath();
    context.moveTo(label.x, label.y);
    context.lineTo(endpoint, label.top + label.height / 2);
    if (palette.halo) {
      context.strokeStyle = palette.halo;
      context.lineWidth = lineWidth + 2;
      context.stroke();
      context.strokeStyle = palette.line;
      context.lineWidth = lineWidth;
    }
    context.stroke();
    context.fillStyle = "rgba(255,255,255,.94)";
    context.beginPath();
    context.roundRect(
      label.left,
      label.top,
      label.width,
      label.height,
      label.fontSize * 0.3,
    );
    context.fill();
    context.strokeStyle = "rgba(120,130,148,.3)";
    context.stroke();
    context.fillStyle = "#222936";
    context.font = `500 ${label.fontSize}px ${family}`;
    context.textBaseline = "top";
    label.lines.forEach((line, index) =>
      context.fillText(
        line,
        label.left + label.padding,
        label.top + label.padding + index * label.fontSize * 1.3,
      ),
    );
  }
}

// Allocate only on export. Reuse the two targets during recording, and keep
// renderer dimensions, orbit damping and live camera entirely out of capture.
export function createSceneCapture({
  renderer,
  scene,
  camera,
  target,
  getFittedDistance,
  fitDistance,
  getLabels,
  canReuseLiveShadows = () => false,
}) {
  let linearTarget, outputTarget, outputPass, pixelCanvas, pixelContext;
  let pixels, image, frameCanvas, exportCamera;
  const shadowCache = new Map();
  const dispose = () => {
    linearTarget?.dispose();
    outputTarget?.dispose();
    outputPass?.dispose();
    for (const { shadow } of shadowCache.values()) shadow.dispose();
    shadowCache.clear();
    if (pixelCanvas) pixelCanvas.width = pixelCanvas.height = 0;
    if (frameCanvas) frameCanvas.width = frameCanvas.height = 0;
    linearTarget = outputTarget = outputPass = null;
    pixelCanvas =
      pixelContext =
      pixels =
      image =
      frameCanvas =
      exportCamera =
        null;
  };
  function captureFrame({
    width = 1920,
    height = 1080,
    background = "transparent",
    labels = false,
    turn = 0,
    reuseFrame = false,
    labelScale = 1,
  } = {}) {
    width = Math.round(width);
    height = Math.round(height);
    const maxSize = Math.min(renderer.capabilities.maxTextureSize, 8192);
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1 ||
      width > maxSize ||
      height > maxSize ||
      width * height > 32_000_000
    ) {
      dispose();
      throw new RangeError(
        "Capture dimensions are not supported by this graphics device.",
      );
    }
    if (renderer.getContext().isContextLost()) {
      dispose();
      throw new Error("The graphics context was lost during capture.");
    }
    // Snapshots are independent by default. Studio can opt into a transient
    // canvas after copying each frame into its composition before the next call.
    const canvas = reuseFrame
      ? (frameCanvas ??= document.createElement("canvas"))
      : document.createElement("canvas");
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      dispose();
      throw new Error("Canvas export is unavailable.");
    }
    const state = {
      target: renderer.getRenderTarget(),
      cubeFace: renderer.getActiveCubeFace(),
      mip: renderer.getActiveMipmapLevel(),
      viewport: renderer.getViewport(new THREE.Vector4()),
      scissor: renderer.getScissor(new THREE.Vector4()),
      scissorTest: renderer.getScissorTest(),
      clearColor: renderer.getClearColor(new THREE.Color()),
      clearAlpha: renderer.getClearAlpha(),
      background: scene.background,
      shadowUpdate: renderer.shadowMap.needsUpdate,
      shadowAuto: renderer.shadowMap.autoUpdate,
      renderInfo: { ...renderer.info.render },
      autoClear: renderer.autoClear,
      xr: renderer.xr.enabled,
    };
    const shadows = [];
    try {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, width, height);
      if (!linearTarget) {
        linearTarget = new THREE.WebGLRenderTarget(width, height, {
          type: renderer.extensions.has("EXT_color_buffer_float")
            ? THREE.HalfFloatType
            : THREE.UnsignedByteType,
          samples: Math.min(4, renderer.capabilities.maxSamples),
        });
        outputTarget = new THREE.WebGLRenderTarget(width, height, {
          depthBuffer: false,
        });
        outputPass = new OutputPass();
        // Transparent scene blending stores premultiplied linear RGB. Canvas
        // ImageData expects straight alpha, before tone mapping/color transfer.
        outputPass.material.fragmentShader =
          outputPass.material.fragmentShader.replace(
            "gl_FragColor = texture2D( tDiffuse, vUv );",
            "gl_FragColor = texture2D( tDiffuse, vec2(vUv.x, 1.0 - vUv.y) );\nif (gl_FragColor.a > 0.0) gl_FragColor.rgb /= gl_FragColor.a;",
          );
        pixelCanvas = document.createElement("canvas");
        pixelContext = pixelCanvas.getContext("2d");
        if (!pixelContext) throw new Error("Canvas export is unavailable.");
      }
      linearTarget.setSize(width, height);
      outputTarget.setSize(width, height);
      if (!image || image.width !== width || image.height !== height) {
        pixelCanvas.width = width;
        pixelCanvas.height = height;
        image = pixelContext.createImageData(width, height);
        // readPixels writes directly into the ImageData backing store. The
        // output shader flips Y, so no second pixel buffer or row copies remain.
        pixels = new Uint8Array(
          image.data.buffer,
          image.data.byteOffset,
          image.data.byteLength,
        );
      }
      exportCamera ??= camera.clone();
      captureCamera(
        camera,
        target,
        getFittedDistance(),
        width,
        height,
        turn,
        fitDistance,
        exportCamera,
      );
      const shadowLights = [];
      if (renderer.shadowMap.enabled)
        scene.traverse((object) => {
          if (object.isLight && object.castShadow && object.shadow)
            shadowLights.push(object);
        });
      const reuseShadows =
        canReuseLiveShadows() &&
        !renderer.shadowMap.needsUpdate &&
        shadowLights.every(
          (light) => light.shadow.map && !light.shadow.needsUpdate,
        );
      if (!reuseShadows) {
        for (const light of shadowLights) {
          const source = light.shadow;
          let cached = shadowCache.get(light);
          if (
            !cached ||
            cached.source !== source ||
            !cached.shadow.mapSize.equals(source.mapSize)
          ) {
            cached?.shadow.dispose();
            cached = { source, shadow: source.clone() };
            shadowCache.set(light, cached);
          }
          const shadow = cached.shadow;
          shadow.camera.copy(source.camera, false);
          for (const key of [
            "intensity",
            "bias",
            "radius",
            "normalBias",
            "blurSamples",
            "focus",
            "aspect",
          ])
            if (key in source) shadow[key] = source[key];
          shadow.autoUpdate = true;
          shadow.needsUpdate = true;
          shadows.push([light, source]);
          light.shadow = shadow;
        }
      }
      for (const [light, cached] of shadowCache)
        if (!shadowLights.includes(light)) {
          cached.shadow.dispose();
          shadowCache.delete(light);
        }
      renderer.xr.enabled = false;
      // Camera-only captures can read the live map without modifying it. A
      // temporary model pose renders into its own retained shadow allocation.
      renderer.shadowMap.needsUpdate = !reuseShadows && shadowLights.length > 0;
      renderer.shadowMap.autoUpdate = false;
      renderer.autoClear = true;
      scene.background = null;
      renderer.setClearColor(0, 0);
      renderer.setRenderTarget(linearTarget);
      renderer.setScissorTest(false);
      renderer.render(scene, exportCamera);
      outputPass.render(renderer, outputTarget, linearTarget);
      renderer.readRenderTargetPixels(
        outputTarget,
        0,
        0,
        width,
        height,
        pixels,
      );
      if (renderer.getContext().isContextLost())
        throw new Error("The graphics context was lost during capture.");
      pixelContext.putImageData(image, 0, 0);
      if (background !== "transparent") {
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(pixelCanvas, 0, 0);
      if (labels) {
        const scale =
          Number.isFinite(labelScale) && labelScale > 0 ? labelScale : 1;
        context.save();
        try {
          context.scale(scale, scale);
          drawCaptureLabels(
            context,
            getLabels?.() ?? [],
            exportCamera,
            width / scale,
            height / scale,
            background,
          );
        } finally {
          context.restore();
        }
      }
      return canvas;
    } catch (error) {
      dispose();
      throw error;
    } finally {
      for (const [object, shadow] of shadows) object.shadow = shadow;
      scene.background = state.background;
      renderer.setClearColor(state.clearColor, state.clearAlpha);
      renderer.shadowMap.needsUpdate = state.shadowUpdate;
      renderer.shadowMap.autoUpdate = state.shadowAuto;
      // Three uses the monotonic frame index to upload changed geometry and
      // instance buffers. Rewinding it would silently reuse a captured pose.
      Object.assign(renderer.info.render, state.renderInfo, {
        frame: renderer.info.render.frame,
      });
      renderer.autoClear = state.autoClear;
      renderer.xr.enabled = state.xr;
      renderer.setRenderTarget(state.target, state.cubeFace, state.mip);
      renderer.setViewport(state.viewport);
      renderer.setScissor(state.scissor);
      renderer.setScissorTest(state.scissorTest);
    }
  }
  return { captureFrame, dispose };
}
