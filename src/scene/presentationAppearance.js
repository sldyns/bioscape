import { Color } from "three";

// Index once per presentation. Camera movement does not change cut surfaces or
// highlighting, so it must not rescan every mesh in a detailed structure.
export function createPresentationAppearance(root) {
  const visibility = [];
  const emissive = [];
  const hover = new Color("#294866");
  const black = new Color(0);
  root.traverse((object) => {
    const data = object.userData;
    if (data.assembledOnly || data.cap || data.cutOnly) visibility.push(object);
    if (object.isMesh && object.material.emissive) {
      data.restEmissive ??= object.material.emissive.clone();
      emissive.push(object);
    }
  });
  let previousMode;
  let previousActive = Symbol("uninitialized");
  let moving = false;
  return (mode, active, ease) => {
    let shadowChanged = false;
    if (mode !== previousMode) {
      for (const object of visibility) {
        const data = object.userData;
        const visible = data.cap
          ? mode === "whole"
          : data.cutOnly
            ? mode !== "whole"
            : mode !== "explode";
        if (object.visible !== visible) shadowChanged = true;
        object.visible = visible;
      }
      previousMode = mode;
    }
    if (moving || active !== previousActive) {
      moving = false;
      for (const object of emissive) {
        const color =
          active && object.userData.hitId === active
            ? hover
            : object.userData.restEmissive || black;
        const value = object.material.emissive;
        if (
          Math.abs(value.r - color.r) +
            Math.abs(value.g - color.g) +
            Math.abs(value.b - color.b) >
          0.0001
        ) {
          value.lerp(color, ease);
          moving = true;
        } else value.copy(color);
      }
      previousActive = active;
    }
    return { moving, shadowChanged };
  };
}
