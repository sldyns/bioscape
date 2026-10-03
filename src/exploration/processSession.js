import { sanitizeView } from "./state.js";

export function restoreProcessSession(definition, input = {}) {
  const state = input || {};
  return {
    progress: Number.isFinite(state.progress)
      ? Math.min(1, Math.max(0, state.progress))
      : 0,
    speed: [0.5, 1, 1.5].includes(state.speed) ? state.speed : 1,
    annotations: state.annotations !== false,
    camera: sanitizeView(state.camera),
    parameters: Object.fromEntries(
      (definition.controls || []).map((control) => [
        control.id,
        control.options.some(
          (option) => option.value === state.parameters?.[control.id],
        )
          ? state.parameters[control.id]
          : control.default,
      ]),
    ),
  };
}
