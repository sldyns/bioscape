export const STORAGE_KEY = "bioscape.studio.v1";

export const BACKGROUNDS = Object.freeze({
  light: "#f7f8fa",
  dark: "#141b26",
  transparent: "transparent",
});

export function normalizePreferences(input, source = {}) {
  const value = input && typeof input === "object" ? input : {};
  const pick = (key, options, fallback) =>
    options.includes(value[key]) ? value[key] : fallback;
  const flag = (key) => (typeof value[key] === "boolean" ? value[key] : true);
  const motions = ["turn"];
  if (source.kind === "process") motions.unshift("process");
  if (source.canExplode || source.api?.canExplode) motions.push("explode");
  return {
    composition: pick(
      "composition",
      ["landscape", "portrait", "square"],
      "landscape",
    ),
    resolution: pick("resolution", [1920, 2560], 1920),
    background: pick("background", Object.keys(BACKGROUNDS), "light"),
    duration: pick("duration", [6, 10, 15], 10),
    motion: pick("motion", motions, motions[0]),
    framing: pick("framing", ["full", "airy"], "full"),
    labels: flag("labels"),
    title: flag("title"),
  };
}

export function loadPreferences(storage, source) {
  try {
    return normalizePreferences(
      JSON.parse(storage?.getItem(STORAGE_KEY)),
      source,
    );
  } catch {
    return normalizePreferences(null, source);
  }
}

/** Keep a completed export when the user reselects the visible active choice. */
export function changePreference(current, key, value, source, mode) {
  const selected =
    key === "background" &&
    mode === "video" &&
    current.background === "transparent"
      ? "light"
      : current[key];
  if (selected === value) return current;
  return normalizePreferences({ ...current, [key]: value }, source);
}

export function savePreferences(storage, value) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private browsing and full storage must not block an export.
  }
}

export function outputDimensions(preferences) {
  const edge = preferences.resolution;
  const short = Math.round((edge * 9) / 16 / 2) * 2;
  if (preferences.composition === "portrait")
    return { width: short, height: edge };
  if (preferences.composition === "square")
    return { width: edge, height: edge };
  return { width: edge, height: short };
}

export function compositionLayout(preferences) {
  const { width, height } = outputDimensions(preferences);
  const short = Math.min(width, height);
  const padding = Math.round(short * 0.045);
  const titleSize = Math.max(42, Math.round(short * 0.04));
  const subtitleSize = Math.max(24, Math.round(short * 0.023));
  const footerSize = Math.max(24, Math.round(short * 0.024));
  const header = preferences.title
    ? Math.ceil(
        padding +
          titleSize * 2.35 +
          subtitleSize * (preferences.description ? 5.8 : 1.6) +
          padding * 0.45,
      )
    : 0;
  // Scientific context belongs to every teaching export, independent of credit.
  const footer =
    padding * 2 + footerSize * (preferences.scientificNote ? 2.5 : 1);
  const inset = preferences.framing === "airy" ? Math.round(short * 0.07) : 0;
  return {
    width,
    height,
    padding,
    titleSize,
    subtitleSize,
    footerSize,
    titleY: padding,
    footerY: height - padding - footerSize,
    model: {
      x: inset,
      y: header + inset,
      width: width - inset * 2,
      height: height - header - footer - inset * 2,
    },
  };
}

export function motionFrame(motion, fraction) {
  const progress = Math.max(0, Math.min(1, fraction));
  if (motion === "process") return { progress };
  if (motion === "explode")
    return { separation: (1 - Math.cos(progress * Math.PI * 2)) / 2 };
  return { turn: progress * Math.PI * 2 };
}

export function exportFilename(title, extension) {
  const stem =
    String(title || "BioScape")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 70) || "BioScape";
  return `BioScape-${stem}.${extension}`;
}
