/** Protocol implementation shared by the dedicated worker and its controls. */
export function installVideoEncoderWorker(scope, media, capabilities = scope) {
  let output, source, target, config;
  let frames = 0;
  let busy = false;
  let finalized = false;
  const reply = (data, transfer = []) => scope.postMessage(data, transfer);
  const receive = async ({ data }) => {
    let ownedFrame = data?.frame;
    if (busy) {
      ownedFrame?.close();
      reply({ id: data?.id, type: "error" });
      return;
    }
    busy = true;
    try {
      if (data?.type === "init") {
        if (
          config ||
          !Number.isInteger(data.count) ||
          data.count < 2 ||
          data.frameRate !== 30 ||
          data.bitrate !== 10_000_000
        )
          throw new Error("VIDEO_ENCODING_FAILED");
        config = data;
        if (
          !capabilities.VideoEncoder ||
          !capabilities.VideoFrame ||
          !(await media.canEncodeVideo("avc", {
            width: data.width,
            height: data.height,
            frameRate: data.frameRate,
            bitrate: data.bitrate,
            latencyMode: "quality",
          }))
        ) {
          reply({ id: data.id, type: "unsupported" });
          return;
        }
        target = new media.BufferTarget();
        output = new media.Output({
          format: new media.Mp4OutputFormat(),
          target,
        });
        source = new media.VideoSampleSource({
          codec: "avc",
          bitrate: data.bitrate,
          latencyMode: "quality",
        });
        output.addVideoTrack(source, { frameRate: data.frameRate });
        await output.start();
        reply({ id: data.id, type: "ready" });
      } else if (data?.type === "frame") {
        if (
          !source ||
          finalized ||
          data.index !== frames ||
          frames >= config.count ||
          data.timestamp !== frames / config.frameRate ||
          data.duration !== 1 / config.frameRate ||
          ownedFrame?.codedWidth !== config.width ||
          ownedFrame?.codedHeight !== config.height
        )
          throw new Error("VIDEO_ENCODING_FAILED");
        const sample = new media.VideoSample(ownedFrame, {
          timestamp: data.timestamp,
          duration: data.duration,
        });
        ownedFrame = null;
        try {
          await source.add(sample);
        } finally {
          sample.close();
        }
        frames++;
        reply({ id: data.id, type: "frame" });
      } else if (data?.type === "finalize") {
        if (!source || finalized || frames !== config.count)
          throw new Error("VIDEO_ENCODING_FAILED");
        finalized = true;
        await output.finalize();
        if (!target.buffer?.byteLength) throw new Error("VIDEO_EMPTY");
        reply({ id: data.id, type: "done", buffer: target.buffer }, [
          target.buffer,
        ]);
      } else {
        throw new Error("VIDEO_ENCODING_FAILED");
      }
    } catch {
      reply({ id: data?.id, type: "error" });
      // The parent terminates this worker on failure, including during a
      // non-cancellable third-party flush. No wait can keep the parent busy.
    } finally {
      ownedFrame?.close();
      busy = false;
    }
  };
  scope.addEventListener("message", receive);
  return () => scope.removeEventListener("message", receive);
}
