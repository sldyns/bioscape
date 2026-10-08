// Compact, versioned scene links. No executable or arbitrary object properties
// cross the URL boundary; model-specific option validity is checked by players.
import { normalizeComparisonPath } from "../compare/ids.js";
const record = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};
const finite = (v, fallback, low, high) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(high, Math.max(low, v))
    : fallback;
const rounded = (v) => Math.round(v * 100000) / 100000;
const vector = (v) =>
  Array.isArray(v) &&
  v.length === 3 &&
  v.every(
    (x) => typeof x === "number" && Number.isFinite(x) && Math.abs(x) <= 1000,
  )
    ? v.map(rounded)
    : null;
export function sanitizeView(input) {
  const v = record(input),
    direction = vector(v.direction),
    target = vector(v.target);
  if (
    !direction ||
    !target ||
    Math.hypot(...direction) < 0.0001 ||
    !Number.isFinite(v.zoom) ||
    v.zoom <= 0
  )
    return undefined;
  const length = Math.hypot(...direction);
  return {
    direction: direction.map((x) => rounded(x / length)),
    target,
    zoom: rounded(finite(v.zoom, 1, 0.1, 10)),
  };
}
const mode = (v) =>
  ["whole", "section", "explode"].includes(v) ? v : "section";
function panel(input) {
  const v = record(input);
  if (typeof v.id !== "string" || !/^[a-zA-Z][a-zA-Z0-9]{0,59}$/.test(v.id))
    return undefined;
  const path = normalizeComparisonPath(v.id, v.path);
  return {
    id: v.id,
    ...(path ? { path } : {}),
    mode: mode(v.mode),
    explode: finite(v.explode, 60, 0, 100),
    labels: v.labels === true,
    ...(sanitizeView(v.view) ? { view: sanitizeView(v.view) } : {}),
  };
}
export function sanitizeSceneState(input) {
  const v = record(input);
  const result = {
    v: 1,
    lang: v.lang === "en" ? "en" : "zh",
    mode: mode(v.mode),
    explode: finite(v.explode, 60, 0, 100),
    labels: v.labels === true,
    contracted: v.contracted === true,
  };
  const camera = sanitizeView(v.camera);
  if (camera) result.camera = camera;
  if (v.process && typeof v.process === "object") {
    const p = record(v.process),
      parameters = {};
    for (const [key, value] of Object.entries(record(p.parameters)).slice(
      0,
      20,
    )) {
      if (
        /^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key) &&
        !["__proto__", "constructor", "prototype"].includes(key) &&
        typeof value === "string" &&
        value.length <= 80
      )
        parameters[key] = value;
    }
    result.process = {
      progress: rounded(finite(p.progress, 0, 0, 1)),
      speed: [0.5, 1, 1.5].includes(p.speed) ? p.speed : 1,
      parameters,
      annotations: p.annotations !== false,
    };
  }
  const c = record(v.compare),
    left = panel(c.left),
    right = panel(c.right);
  if (left && right) result.compare = { left, right };
  if (v.origin && typeof v.origin === "object") {
    const o = record(v.origin),
      view = sanitizeView(o.camera);
    result.origin = {
      mode: mode(o.mode),
      explode: finite(o.explode, 60, 0, 100),
      labels: o.labels === true,
      contracted: o.contracted === true,
      ...(view ? { camera: view } : {}),
    };
  }
  return result;
}
export function readSceneState(hash) {
  try {
    const raw = new URLSearchParams(String(hash).split("?")[1] || "").get("s");
    if (!raw || raw.length > 12000) return null;
    const value = JSON.parse(raw);
    if (!value || value.v !== 1) return null;
    return sanitizeSceneState(value);
  } catch {
    return null;
  }
}
export function sceneHash(hash, state) {
  const [path, query = ""] = hash.split("?");
  const params = new URLSearchParams(query);
  if (state) params.set("s", JSON.stringify(sanitizeSceneState(state)));
  else params.delete("s");
  return path + (params.size ? "?" + params.toString() : "");
}
export function sceneUrl(hash, state) {
  const url = new URL(window.location.href);
  url.hash = sceneHash(hash, state);
  return url.href;
}
