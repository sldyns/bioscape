import { BACKGROUNDS, compositionLayout, motionFrame } from "./config.js";
import { project } from "../project.js";

const FONT =
  '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';

function textLines(ctx, value, width, maxLines) {
  const characters = Array.from(String(value || "").replace(/\s+/g, " "));
  const lines = [];
  let line = "";
  for (let index = 0; index < characters.length; index++) {
    const next = line + characters[index];
    if (ctx.measureText(next).width > width && line) {
      if (lines.length === maxLines - 1) {
        while (line && ctx.measureText(`${line}…`).width > width)
          line = line.slice(0, -1);
        lines.push(`${line.trimEnd()}…`);
        return lines;
      }
      lines.push(line.trimEnd());
      line = characters[index].trimStart();
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawComposition(
  canvas,
  source,
  preferences,
  { fraction, lang = "zh", scale = 1, reuseFrame = false } = {},
) {
  if (!source?.api?.captureFrame || source.api.ready === false)
    throw new Error("SCENE_NOT_READY");
  const description =
    source.kind === "process" &&
    preferences.composition === "portrait" &&
    source.subtitle;
  const layout = compositionLayout({
    ...preferences,
    scientificNote: Boolean(source.scientificNote),
    description: Boolean(description),
  });
  const { width, height, model, padding } = layout;
  const pixelWidth = Math.max(1, Math.round(width * scale));
  const pixelHeight = Math.max(1, Math.round(height * scale));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const background = BACKGROUNDS[preferences.background];
  ctx.clearRect(0, 0, width, height);
  if (background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  const frame = source.api.captureFrame({
    width: Math.max(1, Math.round(model.width * scale)),
    height: Math.max(1, Math.round(model.height * scale)),
    background,
    labels: preferences.labels,
    reuseFrame,
    labelScale: scale,
    ...(fraction === undefined
      ? {}
      : motionFrame(preferences.motion, fraction)),
  });
  if (!frame?.width || !frame?.height) throw new Error("EMPTY_CAPTURE");
  ctx.drawImage(frame, model.x, model.y, model.width, model.height);
  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const dark = preferences.background === "dark";
  const ink = dark ? "#f5f7fb" : "#242428";
  const muted = dark ? "#b2bdce" : "#717780";
  if (preferences.title) {
    ctx.fillStyle = ink;
    ctx.font = `600 ${layout.titleSize}px ${FONT}`;
    const lines = textLines(ctx, source.title, width - padding * 2, 2);
    lines.forEach((line, index) =>
      ctx.fillText(
        line,
        padding,
        layout.titleY + index * layout.titleSize * 1.15,
      ),
    );
    const frameCaption = source.getFrameCaption?.(
      preferences.motion === "process" ? fraction : undefined,
    );
    const subtitleText =
      frameCaption || (source.subtitle === source.title ? "" : source.subtitle);
    if (subtitleText) {
      ctx.fillStyle = muted;
      ctx.font = `400 ${layout.subtitleSize}px ${FONT}`;
      const [subtitle] = textLines(ctx, subtitleText, width - padding * 2, 1);
      ctx.fillText(
        subtitle || "",
        padding,
        layout.titleY +
          lines.length * layout.titleSize * 1.15 +
          layout.subtitleSize * 0.5,
      );
    }
    if (description) {
      ctx.fillStyle = muted;
      ctx.font = `400 ${layout.subtitleSize}px ${FONT}`;
      const details = textLines(ctx, description, width - padding * 2, 3);
      details.forEach((line, index) =>
        ctx.fillText(
          line,
          padding,
          layout.titleY +
            lines.length * layout.titleSize * 1.15 +
            layout.subtitleSize * (2.4 + index * 1.4),
        ),
      );
    }
  }
  {
    ctx.fillStyle = muted;
    ctx.font = `400 ${layout.footerSize}px ${FONT}`;
    if (source.scientificNote) {
      const [note] = textLines(
        ctx,
        source.scientificNote,
        width - padding * 2,
        1,
      );
      ctx.fillText(note, padding, layout.footerY - layout.footerSize * 1.5);
    }
    ctx.fillText(project.name, padding, layout.footerY);
    ctx.textAlign = "right";
    ctx.fillText(
      lang === "en" ? "Teaching model · not to scale" : "教学示意 · 非真实比例",
      width - padding,
      layout.footerY,
    );
  }
  ctx.restore();
  return layout;
}

export function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("IMAGE_ENCODING_FAILED")),
        "image/png",
      );
    } catch (error) {
      reject(error);
    }
  });
}
