import { useLayoutEffect, useRef } from "react";
import { createRenderingOwner } from "./renderingOwner.js";

// Comparison owns two independent canvases; retire this separate idle pair
// before that workspace becomes active. Leaving exploration retires it too.
export default function SceneRenderingHost({ children, active = true }) {
  const owner = useRef(null);
  if (owner.current === null) owner.current = createRenderingOwner();
  useLayoutEffect(() => {
    const current = owner.current;
    if (active) current.resume();
    else current.retire();
    return () => current.retire();
  }, [active]);
  return children(owner.current);
}
