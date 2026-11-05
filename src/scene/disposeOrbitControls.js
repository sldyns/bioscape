// Three r180 disconnects the root keydown listener, but leaves the temporary
// keyup listener installed when Control is held. Remove it while the canvas
// still belongs to its original root, before normal disposal and DOM removal.
export function disposeOrbitControls(controls) {
  if (!controls) return;
  if (typeof controls._interceptControlUp === "function")
    controls.domElement
      ?.getRootNode()
      ?.removeEventListener("keyup", controls._interceptControlUp, {
        capture: true,
      });
  controls.dispose();
}
