import { preferredVideoFormat, recordVideo } from "./recordVideo.js";
import { exportVideoInWorker } from "./workerVideo.js";

const FRAME_RATE = 30;
const BIT_RATE = 10_000_000;
const defaultRuntime = {
  VideoEncoder: globalThis.VideoEncoder,
  VideoFrame: globalThis.VideoFrame,
  Worker: globalThis.Worker,
  createWorker: () =>
    new Worker(new URL("./videoEncoder.worker.js", import.meta.url), {
      type: "module",
    }),
  loadEncoder: () => import("mediabunny"),
  recordVideo,
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

export function preferredExportFormat(runtime = globalThis) {
  if (runtime.VideoEncoder && runtime.VideoFrame)
    return { mimeType: "video/mp4", extension: "mp4" };
  return runtime.HTMLCanvasElement?.prototype.captureStream
    ? preferredVideoFormat(runtime.MediaRecorder)
    : null;
}

/** Generate every frame before muxing it, independent of rendering wall time. */
export async function exportVideo(options) {
  const runtime = options.runtime ?? defaultRuntime;
  if (runtime.Worker && runtime.VideoFrame && runtime.VideoEncoder) {
    const result = await exportVideoInWorker({ ...options, runtime });
    if (result) return result;
    // Preserve the qualified main-thread path where worker AVC is unavailable.
    // Its first composition already exists and must not be rendered twice.
    let first = true;
    return exportVideoOnMainThread({
      ...options,
      runtime,
      drawFrame(value) {
        if (first && value === 0) {
          first = false;
          return;
        }
        first = false;
        options.drawFrame(value);
      },
    });
  }
  return exportVideoOnMainThread({ ...options, runtime });
}

async function exportVideoOnMainThread({
  canvas,
  drawFrame,
  duration,
  signal,
  onProgress = () => {},
  runtime = defaultRuntime,
}) {
  const legacyOptions = { canvas, drawFrame, duration, signal, onProgress };
  if (!runtime.VideoEncoder || !runtime.VideoFrame)
    return runtime.recordVideo(legacyOptions);
  if (!Number.isFinite(duration) || duration < 2 / FRAME_RATE)
    throw new Error("VIDEO_INVALID_DURATION");

  const owner = canvas.ownerDocument ?? globalThis.document;
  const ownerWindow = owner?.defaultView;
  const frameCount = Math.max(2, Math.round(duration * FRAME_RATE));
  let failure,
    output,
    source,
    cancelJob,
    finalizingJob,
    forceCloseJob,
    yieldTimer,
    watchdog;
  let closed = false;
  let finalized = false;
  let useLegacy = false;
  let interrupt;
  // Resolution rather than rejection also covers cancellation between awaits.
  const interruption = new Promise((resolve) => (interrupt = resolve));
  const cancelOutput = () => {
    if (!output || finalized || cancelJob) return cancelJob;
    try {
      cancelJob = Promise.resolve(output.cancel()).catch(() => {});
    } catch {
      cancelJob = Promise.resolve();
    }
    return cancelJob;
  };
  const forceCloseFinalizingSource = () => {
    if (!source || !finalizingJob || finalized || forceCloseJob)
      return forceCloseJob;
    // Mediabunny 1.62.1 ignores Output.cancel() while finalizing. Its pinned
    // CanvasSource lifecycle hook can close the owned encoder independently
    // of the pending flush. Preserve its codec/timing/browser workarounds;
    // the exact dependency contract and real native release are tested.
    if (typeof source._flushAndClose !== "function") return;
    try {
      forceCloseJob = Promise.resolve(source._flushAndClose(true)).catch(
        () => {},
      );
    } catch {
      forceCloseJob = Promise.resolve();
    }
    return forceCloseJob;
  };
  const fail = (error) => {
    if (failure) return;
    failure = error;
    interrupt(error);
    runtime.clearTimeout(yieldTimer);
    forceCloseFinalizingSource();
    cancelOutput();
  };
  const abort = () => fail(new DOMException("Export cancelled", "AbortError"));
  const pageHidden = () => fail(new Error("VIDEO_PAGE_HIDDEN"));
  const visibilityChanged = () => {
    if (owner.hidden) pageHidden();
  };
  const check = () => {
    if (failure) throw failure;
  };
  const waitFor = async (operation) => {
    check();
    const result = await Promise.race([
      operation(),
      interruption.then((error) => {
        throw error;
      }),
    ]);
    check();
    return result;
  };
  const closeSource = () => {
    if (!source || closed) return;
    closed = true;
    source.close();
  };

  signal?.addEventListener("abort", abort, { once: true });
  owner?.addEventListener("visibilitychange", visibilityChanged);
  ownerWindow?.addEventListener("pagehide", pageHidden);
  try {
    if (signal?.aborted) abort();
    if (owner?.hidden) pageHidden();
    check();
    watchdog = runtime.setTimeout(
      () => fail(new Error("VIDEO_ENCODING_TIMEOUT")),
      180_000,
    );
    onProgress(0);
    check();
    // Composition establishes the canvas dimensions. This is also frame zero.
    drawFrame(0);
    check();
    const encoder = await waitFor(() => runtime.loadEncoder());
    const supported = await waitFor(() =>
      encoder.canEncodeVideo("avc", {
        width: canvas.width,
        height: canvas.height,
        bitrate: BIT_RATE,
        frameRate: FRAME_RATE,
        latencyMode: "quality",
      }),
    );
    if (!supported) {
      useLegacy = true;
    } else {
      const target = new encoder.BufferTarget();
      output = new encoder.Output({
        format: new encoder.Mp4OutputFormat(),
        target,
      });
      check();
      source = new encoder.CanvasSource(canvas, {
        codec: "avc",
        bitrate: BIT_RATE,
        latencyMode: "quality",
      });
      check();
      output.addVideoTrack(source, { frameRate: FRAME_RATE });
      await waitFor(() => output.start());
      for (let index = 0; index < frameCount; index++) {
        check();
        if (index) drawFrame(index / (frameCount - 1));
        check();
        // Await encoding/writer backpressure before changing the canvas again.
        await waitFor(() => source.add(index / FRAME_RATE, 1 / FRAME_RATE));
        onProgress((index + 1) / frameCount);
        check();
        if (index < frameCount - 1)
          await waitFor(
            () =>
              new Promise((resolve) => {
                yieldTimer = runtime.setTimeout(resolve, 0);
              }),
          );
      }
      finalizingJob = output.finalize();
      if (failure) forceCloseFinalizingSource();
      await waitFor(() => finalizingJob);
      finalized = true;
      const blob = new Blob([target.buffer], { type: "video/mp4" });
      if (!target.buffer || !blob.size) throw new Error("VIDEO_EMPTY");
      return { blob, mimeType: "video/mp4", extension: "mp4" };
    }
  } catch (error) {
    forceCloseFinalizingSource();
    await forceCloseJob;
    await cancelOutput();
    // Drain the interrupted finalizer as well as the force-close operation.
    // Neither may keep an encoder alive after capture is released.
    if (finalizingJob) await finalizingJob.catch(() => {});
    throw failure || error;
  } finally {
    runtime.clearTimeout(yieldTimer);
    runtime.clearTimeout(watchdog);
    signal?.removeEventListener("abort", abort);
    owner?.removeEventListener("visibilitychange", visibilityChanged);
    ownerWindow?.removeEventListener("pagehide", pageHidden);
    try {
      closeSource();
    } catch {
      // Preserve the original encoding/cancellation error during cleanup.
    }
  }
  if (useLegacy) {
    let first = true;
    return runtime.recordVideo({
      ...legacyOptions,
      drawFrame(value) {
        if (first && value === 0) {
          first = false;
          return;
        }
        first = false;
        drawFrame(value);
      },
    });
  }
}
