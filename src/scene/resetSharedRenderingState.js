// Restore the original fresh-renderer drawing defaults before a new scene
// applies its own pixel ratio, background, exposure and shadow configuration.
// This does not touch context creation attributes or the owned environment.
export function resetSharedRenderingState(renderer, defaultShadowType) {
  renderer.setRenderTarget(null);
  renderer.setScissorTest(false);
  renderer.autoClear = true;
  renderer.autoClearColor = true;
  renderer.autoClearDepth = true;
  renderer.autoClearStencil = true;
  renderer.sortObjects = true;
  renderer.info.autoReset = true;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = defaultShadowType;
  renderer.shadowMap.autoUpdate = true;
  renderer.shadowMap.needsUpdate = false;
}
