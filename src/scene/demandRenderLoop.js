// Keep one pending rendering opportunity, including during continuous motion.
// Construction is inert so setup cleanup can own the loop before it starts.
export function createDemandRenderLoop({
  render,
  canRun = () => true,
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (frame) => cancelAnimationFrame(frame),
}) {
  let frame = null,
    started = false,
    disposed = false;
  const tick = (time) => {
    frame = null;
    if (!disposed && canRun()) render(time);
  };
  const request = () => {
    if (started && !disposed && frame === null && canRun())
      frame = requestFrame(tick);
  };
  const cancelPending = () => {
    if (frame !== null) cancelFrame(frame);
    frame = null;
  };
  return {
    request,
    cancelPending,
    start() {
      if (disposed) return;
      started = true;
      request();
    },
    dispose() {
      disposed = true;
      cancelPending();
    },
  };
}
