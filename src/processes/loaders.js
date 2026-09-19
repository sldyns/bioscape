import { extensionEntries } from "./extensions.js";

// Keep production and thumbnail previews on the same lazy-loading registry.
const modules = import.meta.glob("./modules/*/*Process.js");
export const processLoaders = {
  ...Object.fromEntries(
    extensionEntries.map((entry) => {
      const load = modules[entry.module];
      if (!load) throw new Error(`Missing process module: ${entry.module}`);
      return [entry.id, load];
    }),
  ),
  infection: () => import("./phageProcess.js"),
  photosynthesis: () => import("./photosynthesisProcess.js"),
  secretion: () => import("./secretionProcess.js"),
  transcription: () => import("./transcriptionProcess.js"),
};
