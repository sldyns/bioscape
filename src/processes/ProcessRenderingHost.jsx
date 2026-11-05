import { useLayoutEffect, useRef } from "react";
import { createProcessRenderingOwner } from "./renderingOwner.js";

export default function ProcessRenderingHost({ children }) {
  const owner = useRef(null);
  if (owner.current === null) owner.current = createProcessRenderingOwner();
  useLayoutEffect(() => {
    const current = owner.current;
    current.resume();
    return () => current.retire();
  }, []);
  return children(owner.current);
}
