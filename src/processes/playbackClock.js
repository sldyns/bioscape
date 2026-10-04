// Advance the authoritative pose at display cadence. Reading text and saving
// the session use a separate publication cadence and never drive model time.
export function startPlaybackClock({
  progress,
  duration,
  speed,
  onFrame,
  onPublish,
  onFinish,
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
}) {
  let frame = 0;
  let last;
  let published = -Infinity;
  let active = true;
  const tick = (now) => {
    frame = 0;
    if (!active) return;
    if (last !== undefined)
      progress.current = Math.min(
        1,
        progress.current +
          (Math.max(0, Math.min(now - last, 100)) * speed) / (duration * 1000),
      );
    last = now;
    onFrame(progress.current);
    if (now - published >= 30 || progress.current >= 1) {
      onPublish(progress.current);
      published = now;
    }
    if (progress.current >= 1) {
      active = false;
      onFinish();
    } else frame = requestFrame(tick);
  };
  frame = requestFrame(tick);
  return () => {
    active = false;
    if (frame) cancelFrame(frame);
    frame = 0;
  };
}

export const clampProcessProgress = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

// The renderer reads the live source rather than a potentially older React
// publication. A paused camera redraw does not update any model geometry.
export function createProcessPose(update, progress, parameters) {
  let appliedProgress = clampProcessProgress(progress);
  let appliedParameters = parameters;
  return {
    get progress() {
      return appliedProgress;
    },
    get parameters() {
      return appliedParameters;
    },
    apply(value, nextParameters) {
      const next = clampProcessProgress(value);
      if (next === appliedProgress && nextParameters === appliedParameters)
        return false;
      update(next, nextParameters);
      appliedProgress = next;
      appliedParameters = nextParameters;
      return true;
    },
  };
}
