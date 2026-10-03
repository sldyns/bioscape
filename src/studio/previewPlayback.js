/** One disposable, demand-driven clock for the canvas preview. */
export function createPreviewPlayback({
  drawFrame,
  duration,
  initialFraction = 0,
  onProgress = () => {},
  onPlayingChange = () => {},
  onError = () => {},
  fps = 30,
  runtime = {
    requestAnimationFrame: (fn) => requestAnimationFrame(fn),
    cancelAnimationFrame: (id) => cancelAnimationFrame(id),
  },
}) {
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const interval = 1000 / fps;
  let fraction = clamp(initialFraction);
  let playing = false;
  let invalid = true;
  let disposed = false;
  let request = null;
  let previous = null;
  let nextPaint = 0;
  const schedule = () => {
    if (!disposed && request === null)
      request = runtime.requestAnimationFrame(tick);
  };
  const cancel = () => {
    if (request !== null) runtime.cancelAnimationFrame(request);
    request = null;
  };
  const pause = () => {
    playing = false;
    previous = null;
    cancel();
    onPlayingChange(false);
    // Pausing time must not discard the first paint or a pending seek.
    if (invalid) schedule();
  };
  function tick(now) {
    request = null;
    if (disposed) return;
    if (playing && previous !== null)
      fraction = clamp(fraction + (now - previous) / (duration * 1000));
    previous = now;
    if (invalid || (playing && (now >= nextPaint - 1 || fraction === 1))) {
      try {
        drawFrame(fraction);
        onProgress(fraction);
      } catch (error) {
        invalid = false;
        pause();
        onError(error);
        return;
      }
      invalid = false;
      nextPaint = now + interval;
    }
    if (playing && fraction === 1) pause();
    if (playing) schedule();
  }
  schedule();
  return {
    play() {
      if (disposed || playing) return;
      if (fraction === 1) fraction = 0;
      playing = true;
      previous = null;
      invalid = true;
      onPlayingChange(true);
      schedule();
    },
    pause,
    seek(value) {
      if (disposed) return;
      pause();
      fraction = clamp(value);
      invalid = true;
      schedule();
    },
    refresh() {
      invalid = true;
      schedule();
    },
    dispose() {
      disposed = true;
      playing = false;
      cancel();
    },
  };
}

/** Preview uses the visible area; export layout and resolution stay unchanged. */
export function previewScale({ width, height }, bounds, pixelRatio = 1) {
  const density = Math.min(1.5, Math.max(1, pixelRatio));
  const fit = Math.min(
    Math.max(1, bounds.width - 16) / width,
    Math.max(1, bounds.height - 16) / height,
  );
  return Math.min(1, 960 / Math.max(width, height), fit * density);
}
