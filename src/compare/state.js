import { comparisonIds } from "./catalog.js";

const ids = new Set(comparisonIds);
export const isComparisonId = (id) => typeof id === "string" && ids.has(id);

export function normalizeComparisonView(view) {
  if (!view || !Array.isArray(view.direction) || !Array.isArray(view.target))
    return null;
  if (
    view.direction.length !== 3 ||
    view.target.length !== 3 ||
    ![...view.direction, ...view.target, view.zoom].every(Number.isFinite) ||
    [...view.direction, ...view.target].some((n) => Math.abs(n) > 1000) ||
    view.zoom <= 0
  )
    return null;
  const length = Math.hypot(...view.direction);
  if (length < 1e-8) return null;
  return {
    direction: view.direction.map((n) => n / length),
    target: [...view.target],
    zoom: Math.min(10, Math.max(0.1, view.zoom)),
  };
}

function normalizePane(pane, fallbackId) {
  return {
    id: isComparisonId(pane?.id) ? pane.id : fallbackId,
    mode: ["whole", "section", "explode"].includes(pane?.mode)
      ? pane.mode
      : "whole",
    explode: Number.isFinite(pane?.explode)
      ? Math.min(100, Math.max(0, pane.explode))
      : 55,
    labels: typeof pane?.labels === "boolean" ? pane.labels : true,
    view: normalizeComparisonView(pane?.view),
  };
}

export function normalizeComparisonState(input) {
  return {
    left: normalizePane(input?.left, "cell"),
    right: normalizePane(input?.right, "plant"),
  };
}

export const DEFAULT_COMPARISON_STATE = normalizeComparisonState();

export function sameView(a, b, tolerance = 0.00001) {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.zoom - b.zoom) <= tolerance &&
    a.direction.every((v, i) => Math.abs(v - b.direction[i]) <= tolerance) &&
    a.target.every((v, i) => Math.abs(v - b.target[i]) <= tolerance)
  );
}

export function comparisonFrameLayout(width, height) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 32 ||
    height < 32 ||
    width > 8192 ||
    height > 8192
  )
    throw new Error("Invalid comparison capture dimensions");
  const stacked = height > width * 1.2;
  const gap = Math.max(2, Math.round(Math.min(width, height) * 0.012));
  const extent = Math.floor(((stacked ? height : width) - gap) / 2);
  const panes = stacked
    ? [
        { x: 0, y: 0, width, height: extent },
        { x: 0, y: extent + gap, width, height: height - extent - gap },
      ]
    : [
        { x: 0, y: 0, width: extent, height },
        { x: extent + gap, y: 0, width: width - extent - gap, height },
      ];
  return { stacked, panes };
}
