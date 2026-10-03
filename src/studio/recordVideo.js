const FORMATS = [
  // Explicit AVC avoids browsers silently putting VP9 into an MP4 container,
  // which many native players and slide editors cannot decode.
  { mimeType: "video/mp4;codecs=avc1.42E01E", extension: "mp4" },
  { mimeType: "video/webm;codecs=vp9", extension: "webm" },
  { mimeType: "video/webm;codecs=vp8", extension: "webm" },
  { mimeType: "video/webm", extension: "webm" },
  { mimeType: "video/mp4", extension: "mp4" },
];

export function preferredVideoFormat(Recorder = globalThis.MediaRecorder) {
  if (!Recorder?.isTypeSupported) return null;
  return (
    FORMATS.find(({ mimeType }) => Recorder.isTypeSupported(mimeType)) || null
  );
}

export function recordVideo({
  canvas,
  drawFrame,
  duration,
  signal,
  onProgress = () => {},
  runtime = {
    MediaRecorder: globalThis.MediaRecorder,
    now: () => performance.now(),
    requestAnimationFrame: (fn) => requestAnimationFrame(fn),
    cancelAnimationFrame: (id) => cancelAnimationFrame(id),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
  },
}) {
  return new Promise((resolve, reject) => {
    const format = preferredVideoFormat(runtime.MediaRecorder);
    if (!format || !canvas.captureStream) {
      reject(new Error("VIDEO_UNSUPPORTED"));
      return;
    }
    let stream,
      recorder,
      frameId,
      stopTimer,
      watchdog,
      finalFrameDrawn = false,
      finished = false;
    const chunks = [];
    const cleanup = () => {
      runtime.cancelAnimationFrame(frameId);
      runtime.clearTimeout(stopTimer);
      runtime.clearTimeout(watchdog);
      signal?.removeEventListener("abort", abort);
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            /* Already stopped by the browser. */
          }
        }
      }
      stream?.getTracks().forEach((track) => track.stop());
    };
    const fail = (error) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(error);
    };
    const abort = () =>
      fail(new DOMException("Recording cancelled", "AbortError"));
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    try {
      drawFrame(0);
      stream = canvas.captureStream(30);
      recorder = new runtime.MediaRecorder(stream, {
        mimeType: format.mimeType,
        videoBitsPerSecond: 10_000_000,
      });
      recorder.ondataavailable = ({ data }) => {
        if (data?.size) chunks.push(data);
      };
      recorder.onerror = (event) =>
        fail(event.error || new Error("VIDEO_ENCODING_FAILED"));
      recorder.onstop = () => {
        if (finished) return;
        if (!finalFrameDrawn) {
          fail(new Error("VIDEO_INTERRUPTED"));
          return;
        }
        const mimeType = recorder.mimeType || format.mimeType;
        const blob = new Blob(chunks, { type: mimeType });
        if (!blob.size) {
          fail(new Error("VIDEO_EMPTY"));
          return;
        }
        finished = true;
        cleanup();
        resolve({
          blob,
          mimeType,
          extension: mimeType.includes("mp4") ? "mp4" : "webm",
        });
      };
      recorder.start(250);
      const started = runtime.now();
      let nextPaint = started + 1000 / 30;
      onProgress(0);
      const tick = () => {
        if (finished) return;
        try {
          const now = runtime.now();
          const progress = Math.min(1, (now - started) / (duration * 1000));
          if (now >= nextPaint - 1 || progress === 1) {
            drawFrame(progress);
            nextPaint = now + 1000 / 30;
            if (progress === 1) finalFrameDrawn = true;
            stream.getVideoTracks()[0]?.requestFrame?.();
            onProgress(progress);
          }
          if (progress < 1) {
            frameId = runtime.requestAnimationFrame(tick);
          } else {
            // Leave the final frame on the track long enough for the encoder.
            stopTimer = runtime.setTimeout(() => {
              try {
                recorder.stop();
                watchdog = runtime.setTimeout(
                  () => fail(new Error("VIDEO_FINALIZE_TIMEOUT")),
                  5000,
                );
              } catch (error) {
                fail(error);
              }
            }, 120);
          }
        } catch (error) {
          fail(error);
        }
      };
      frameId = runtime.requestAnimationFrame(tick);
    } catch (error) {
      fail(error);
    }
  });
}
