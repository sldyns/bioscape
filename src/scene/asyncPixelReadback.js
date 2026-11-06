const defaultRuntime = {
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (timer) => clearTimeout(timer),
  now: () => performance.now(),
};

// Some drivers keep an occluded canvas's fence pending even after flushing.
// Retain the full-quality synchronous path for that renderer after one stall.
const stalledRenderers = new WeakSet();
const ASYNC_WAIT_LIMIT_MS = 500;

/** Read the owned RGBA8 capture target without waiting on the main thread. */
export function readCapturePixelsAsync(
  renderer,
  target,
  width,
  height,
  pixels,
  { signal, runtime = defaultRuntime } = {},
) {
  const gl = renderer.getContext();
  let timer, buffer, fence, resolve, reject;
  let settled = false;
  const ready = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  // A prefetched frame can fail before its consumer reaches it.
  ready.catch(() => {});
  const cleanup = () => {
    runtime.clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    if (fence) gl.deleteSync(fence);
    if (buffer) gl.deleteBuffer(buffer);
    fence = buffer = null;
  };
  const finish = (error) => {
    if (settled) return;
    settled = true;
    cleanup();
    if (error) reject(error);
    else resolve(pixels);
  };
  const abort = () =>
    finish(new DOMException("Capture cancelled", "AbortError"));
  const readSynchronously = () => {
    if (gl.isContextLost?.()) throw new Error("CAPTURE_CONTEXT_LOST");
    const hasPackBuffer = gl.PIXEL_PACK_BUFFER !== undefined;
    const previous = hasPackBuffer
      ? gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING)
      : null;
    try {
      if (hasPackBuffer) gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
    } finally {
      if (hasPackBuffer) gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previous);
    }
  };
  if (signal?.aborted) {
    abort();
    return { ready, cancel: abort };
  }
  signal?.addEventListener("abort", abort, { once: true });
  try {
    if (
      typeof gl.fenceSync !== "function" ||
      typeof gl.getBufferSubData !== "function" ||
      stalledRenderers.has(renderer)
    ) {
      readSynchronously();
      finish();
      return { ready, cancel: abort };
    }
    renderer.setRenderTarget(target);
    const previous = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING);
    try {
      buffer = gl.createBuffer();
      if (!buffer) throw new Error("CAPTURE_READBACK_UNAVAILABLE");
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, pixels.byteLength, gl.STREAM_READ);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    } finally {
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previous);
    }
    fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!fence) throw new Error("CAPTURE_READBACK_UNAVAILABLE");
    gl.flush();
    const started = runtime.now();
    const poll = () => {
      if (settled) return;
      try {
        if (gl.isContextLost()) throw new Error("CAPTURE_CONTEXT_LOST");
        // Match Three's nonblocking, flushing fence probe.
        const status = gl.clientWaitSync(fence, gl.SYNC_FLUSH_COMMANDS_BIT, 0);
        if (
          status === gl.ALREADY_SIGNALED ||
          status === gl.CONDITION_SATISFIED
        ) {
          const previous = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING);
          try {
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
            gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, pixels);
          } finally {
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previous);
          }
          finish();
        } else if (status === gl.TIMEOUT_EXPIRED) {
          if (runtime.now() - started >= ASYNC_WAIT_LIMIT_MS) {
            // Each capture slot still owns this unchanged output target.
            // Read the same pixels, without rerendering or reducing quality.
            readSynchronously();
            stalledRenderers.add(renderer);
            finish();
          } else timer = runtime.setTimeout(poll, 0);
        } else {
          throw new Error("CAPTURE_READBACK_FAILED");
        }
      } catch (error) {
        finish(error);
      }
    };
    timer = runtime.setTimeout(poll, 0);
  } catch (error) {
    finish(error);
  }
  return { ready, cancel: abort };
}
