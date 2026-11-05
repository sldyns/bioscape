const FRAME_RATE = 30;

/** Own the worker for exactly one export, including its final encoder flush. */
export async function exportVideoInWorker({
  canvas,
  drawFrame,
  prepareFrame,
  duration,
  signal,
  onProgress = () => {},
  runtime,
}) {
  if (!Number.isFinite(duration) || duration < 2 / FRAME_RATE)
    throw new Error("VIDEO_INVALID_DURATION");
  const owner = canvas.ownerDocument ?? globalThis.document;
  const ownerWindow = owner?.defaultView;
  const count = Math.max(2, Math.round(duration * FRAME_RATE));
  const pending = new Map();
  const prepared = new Map();
  let interrupt;
  const interruption = new Promise((resolve) => (interrupt = resolve));
  let worker,
    failure,
    watchdog,
    pendingYield = null;
  let terminated = false;
  let nextId = 0;
  const terminate = () => {
    if (worker && !terminated) {
      terminated = true;
      worker.terminate();
    }
  };
  const fail = (error) => {
    if (failure) return;
    failure = error;
    interrupt(error);
    for (const frame of prepared.values()) frame.release();
    prepared.clear();
    const yielded = pendingYield;
    pendingYield = null;
    if (yielded) {
      runtime.clearTimeout(yielded.timer);
      yielded.reject(error);
    }
    // Do not wait for code running inside a stalled encoder or muxer.
    terminate();
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
  };
  const check = () => {
    if (failure) throw failure;
  };
  const prefetch = (index) => {
    if (!prepareFrame || index >= count) return;
    check();
    const frame = prepareFrame(index / (count - 1));
    if (
      !frame ||
      typeof frame.draw !== "function" ||
      typeof frame.release !== "function"
    ) {
      frame?.release?.();
      throw new Error("VIDEO_INVALID_PREPARED_FRAME");
    }
    prepared.set(index, frame);
  };
  const drawPrepared = async (index) => {
    check();
    const frame = prepared.get(index);
    try {
      await Promise.race([
        frame.draw(),
        interruption.then((error) => {
          throw error;
        }),
      ]);
      check();
    } finally {
      frame.release();
      prepared.delete(index);
    }
  };
  const abort = () => fail(new DOMException("Export cancelled", "AbortError"));
  const pageHidden = () => fail(new Error("VIDEO_PAGE_HIDDEN"));
  const visibilityChanged = () => {
    if (owner.hidden) pageHidden();
  };
  const message = ({ data }) => {
    if (failure) return;
    const entry = pending.get(data?.id);
    const allowed = {
      init: ["ready", "unsupported"],
      frame: ["frame"],
      finalize: ["done"],
    };
    if (!entry || !allowed[entry.type]?.includes(data?.type)) {
      fail(new Error("VIDEO_ENCODING_FAILED"));
      return;
    }
    pending.delete(data.id);
    entry.resolve(data);
  };
  const workerError = (event) => {
    event.preventDefault?.();
    fail(new Error("VIDEO_ENCODING_FAILED"));
  };
  const request = (type, data = {}, transfer = [], posted = () => {}) => {
    check();
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { type, resolve, reject });
      try {
        worker.postMessage({ ...data, type, id }, transfer);
        posted();
      } catch (error) {
        fail(error);
      }
    });
  };

  // A frame acknowledgement owns its input until the encoder has accepted it.
  // Give the browser another task turn before drawing the next full-quality pose.
  // Cancellation must also interrupt this turn without waiting for its timer.
  const yieldToBrowser = () => {
    check();
    return new Promise((resolve, reject) => {
      const slot = { timer: null, reject };
      pendingYield = slot;
      try {
        slot.timer = runtime.setTimeout(() => {
          if (pendingYield === slot) pendingYield = null;
          if (failure) reject(failure);
          else resolve();
        }, 0);
        // Covers reentrant cancellation inside a supplied timer implementation.
        if (pendingYield !== slot) runtime.clearTimeout(slot.timer);
      } catch (error) {
        if (pendingYield === slot) pendingYield = null;
        fail(error);
        reject(error);
      }
    });
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
    if (prepareFrame) {
      prefetch(0);
      prefetch(1);
      await drawPrepared(0);
    } else drawFrame(0);
    check();
    worker = runtime.createWorker();
    check();
    worker.addEventListener("message", message);
    worker.addEventListener("error", workerError);
    worker.addEventListener("messageerror", workerError);
    const ready = await request("init", {
      width: canvas.width,
      height: canvas.height,
      count,
      frameRate: FRAME_RATE,
      bitrate: 10_000_000,
    });
    check();
    if (ready.type === "unsupported") return null;
    for (let index = 0; index < count; index++) {
      check();
      if (index) {
        if (prepareFrame) await drawPrepared(index);
        else drawFrame(index / (count - 1));
      }
      // At most two GPU frames can be queued. Their independent snapshots are
      // composed in order, and the encoder still accepts exactly one at a time.
      prefetch(index + 2);
      check();
      let frame;
      try {
        // Match CanvasSource's VideoFrame construction. The worker refines
        // sample metadata with the original exact second timestamps.
        frame = new runtime.VideoFrame(canvas, {
          timestamp: Math.trunc((index / FRAME_RATE) * 1e6),
          duration: Math.trunc((1 / FRAME_RATE) * 1e6),
        });
        check();
        await request(
          "frame",
          {
            frame,
            index,
            timestamp: index / FRAME_RATE,
            duration: 1 / FRAME_RATE,
          },
          [frame],
          () => {
            frame = null;
          },
        );
      } finally {
        // A successful transfer closes the sender's VideoFrame. If posting
        // fails, the sender still owns it and must close it here.
        frame?.close();
      }
      check();
      onProgress((index + 1) / count);
      check();
      if (index < count - 1) await yieldToBrowser();
    }
    const result = await request("finalize");
    check();
    if (!(result.buffer instanceof ArrayBuffer) || !result.buffer.byteLength)
      throw new Error("VIDEO_EMPTY");
    return {
      blob: new Blob([result.buffer], { type: "video/mp4" }),
      mimeType: "video/mp4",
      extension: "mp4",
    };
  } finally {
    for (const frame of prepared.values()) frame.release();
    prepared.clear();
    terminate();
    runtime.clearTimeout(watchdog);
    if (pendingYield) {
      runtime.clearTimeout(pendingYield.timer);
      pendingYield = null;
    }
    signal?.removeEventListener("abort", abort);
    owner?.removeEventListener("visibilitychange", visibilityChanged);
    ownerWindow?.removeEventListener("pagehide", pageHidden);
    worker?.removeEventListener("message", message);
    worker?.removeEventListener("error", workerError);
    worker?.removeEventListener("messageerror", workerError);
  }
}
