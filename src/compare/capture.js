import { comparisonFrameLayout } from "./state.js";
import { getComparisonEntry } from "./catalog.js";

const transientFrames = new WeakMap();
const validScale = (value) => (Number.isFinite(value) && value > 0 ? value : 1);

// Typography and pane division use the export coordinate system even when the
// browser displays a smaller preview. Pixel rounding is applied only to renders.
export function comparisonCaptureLayout(width, height, labelScale = 1) {
  const scale = validScale(labelScale);
  const logicalWidth = Math.round(width / scale);
  const logicalHeight = Math.round(height / scale);
  const { panes } = comparisonFrameLayout(logicalWidth, logicalHeight);
  const fontSize = Math.max(
    24,
    Math.round(Math.max(logicalWidth, logicalHeight) * 0.014),
  );
  const scaleFontSize = Math.max(18, Math.round(fontSize * 0.72));
  const padding = Math.max(8, Math.round(fontSize * 0.3));
  const lineGap = Math.max(6, Math.round(fontSize * 0.25));
  return {
    width: logicalWidth,
    height: logicalHeight,
    panes,
    fontSize,
    scaleFontSize,
    titleHeight: padding * 2 + fontSize + lineGap + scaleFontSize,
    titleY: padding + fontSize / 2,
    scaleY: padding + fontSize + lineGap + scaleFontSize / 2,
  };
}

export function releaseComparisonCapture(apis) {
  const frame = transientFrames.get(apis);
  if (frame) {
    frame.width = frame.height = 0;
    transientFrames.delete(apis);
  }
}

export function captureComparisonFrame(apis, state, lang, options = {}) {
  if (!apis.left?.ready || !apis.right?.ready) {
    releaseComparisonCapture(apis);
    throw new Error(
      lang === "en"
        ? "Both models must finish loading before export."
        : "请等待两个模型加载完成后导出。",
    );
  }
  const { width = 1920, height = 1080, background = "#f5f5f7" } = options;
  const scale = validScale(options.labelScale);
  let layout;
  try {
    layout = comparisonCaptureLayout(width, height, scale);
  } catch (error) {
    releaseComparisonCapture(apis);
    throw error;
  }
  const { panes, fontSize, scaleFontSize, titleHeight, titleY, scaleY } =
    layout;
  const canvas = options.reuseFrame
    ? transientFrames.get(apis) || document.createElement("canvas")
    : document.createElement("canvas");
  if (options.reuseFrame) transientFrames.set(apis, canvas);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    releaseComparisonCapture(apis);
    throw new Error("Canvas capture is unavailable");
  }
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (background !== "transparent") {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, layout.width, layout.height);
    }
    const language = lang === "en" ? "en" : "zh";
    for (const [index, side] of ["left", "right"].entries()) {
      const pane = panes[index];
      const modelHeight = Math.max(16, pane.height - titleHeight);
      const scene = apis[side].captureFrame({
        ...options,
        width: Math.max(1, Math.round(pane.width * scale)),
        height: Math.max(1, Math.round(modelHeight * scale)),
        background,
        labels:
          typeof options.labels === "boolean"
            ? options.labels
            : state[side].labels,
      });
      // A transient source frame is copied before the next source capture.
      ctx.drawImage(
        scene,
        pane.x,
        pane.y + titleHeight,
        pane.width,
        modelHeight,
      );
      ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const title = `${index === 0 ? "A" : "B"} · ${getComparisonEntry(state[side].id)[language]}`;
      const center = pane.x + pane.width / 2;
      // A fine halo keeps specimen identity readable on transparent/dark captures.
      ctx.lineWidth = Math.max(2, fontSize * 0.2);
      ctx.strokeStyle = "rgba(255,255,255,.85)";
      ctx.strokeText(title, center, pane.y + titleY, pane.width - 20);
      ctx.fillStyle = "#27313b";
      ctx.fillText(title, center, pane.y + titleY, pane.width - 20);
      ctx.font = `${scaleFontSize}px system-ui, sans-serif`;
      const scaleNote =
        language === "en"
          ? "Independently fitted · not to the same scale"
          : "独立适配画面 · 非统一比例";
      ctx.strokeText(scaleNote, center, pane.y + scaleY, pane.width - 20);
      ctx.fillText(scaleNote, center, pane.y + scaleY, pane.width - 20);
    }
    return canvas;
  } catch (error) {
    releaseComparisonCapture(apis);
    throw error;
  } finally {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
