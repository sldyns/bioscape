// Directions are in the displayed specimen's axes, after the asset's own
// transform. The default leaves the open faces of the older cutaways visible.
const directions = {
  erythrocyte: [0.34, 0.58, 1],
  atpSynthase: [0.062, -0.205, 0.977],
  cristae: [-0.99, 0.136, -0.003],
  muscleFibre: [0.16, 0.18, 1],
};

export const specimenDirection = (id) => directions[id] ?? [0.05, 0.065, 1];
export const initialStructureMode = (id) =>
  id === "erythrocyte" ? "whole" : "section";

export function turnedView(view, turn, tilt = 0) {
  const [x, y, z] = view.direction;
  const yaw = Math.atan2(x, z) + turn;
  const elevation = Math.atan2(y, Math.hypot(x, z)) + tilt;
  // Allow an exact saved pole on the first three views. Keep a tilted
  // detail view off the pole so horizontal orbiting is still meaningful.
  const limit = tilt === 0 ? Math.PI / 2 : (83 * Math.PI) / 180;
  const pitch = Math.max(-limit, Math.min(limit, elevation));
  return {
    ...view,
    direction: [
      Math.cos(pitch) * Math.sin(yaw),
      Math.sin(pitch),
      Math.cos(pitch) * Math.cos(yaw),
    ],
  };
}
