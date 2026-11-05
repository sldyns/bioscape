import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { getEventListeners } from "node:events";
import {
  exportVideo,
  preferredExportFormat,
} from "../src/studio/exportVideo.js";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

class Target extends EventTarget {
  listeners = new Map();
  addEventListener(type, fn, options) {
    super.addEventListener(type, fn, options);
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
  }
  removeEventListener(type, fn, options) {
    super.removeEventListener(type, fn, options);
    this.listeners.get(type)?.delete(fn);
  }
  get listenerCount() {
    return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0);
  }
}

function fixture(hooks = {}) {
  const document = new Target();
  document.hidden = false;
  document.defaultView = new Target();
  const controller = new AbortController();
  const canvas = { ownerDocument: document, width: 0, height: 0 };
  const state = {
    draws: [],
    samples: [],
    progress: [],
    timers: new Map(),
    created: 0,
    started: 0,
    cancelled: 0,
    finalized: 0,
    closed: 0,
    forceClosed: 0,
    legacy: 0,
    activeAdds: 0,
    maxActiveAdds: 0,
    wallTime: 0,
  };
  let timerId = 0;
  const stage = (name, ...args) => hooks[name]?.(f, ...args);
  const encoder = {
    async canEncodeVideo(codec, options) {
      state.preflight = { codec, options };
      assert.equal(canvas.width, 2560);
      assert.equal(canvas.height, 2560);
      const result = await stage("preflight");
      return result ?? true;
    },
    BufferTarget: class {
      buffer = null;
    },
    Mp4OutputFormat: class {},
    Output: class {
      constructor(options) {
        state.created++;
        this.target = options.target;
        stage("output");
      }
      addVideoTrack(source, options) {
        state.track = options;
        stage("track");
      }
      async start() {
        state.started++;
        await stage("start");
      }
      async finalize() {
        state.finalized++;
        await stage("finalize");
        this.target.buffer = hooks.empty
          ? null
          : new Uint8Array([1, 2, 3]).buffer;
      }
      async cancel() {
        state.cancelled++;
        await stage("cancel");
      }
    },
    CanvasSource: class {
      constructor(input, config) {
        assert.equal(input, canvas);
        state.config = config;
        if (hooks.forceClose)
          this._flushAndClose = (force) => {
            assert.equal(force, true);
            state.forceClosed++;
            return stage("forceClose", force);
          };
        stage("source");
      }
      async add(timestamp, duration) {
        state.activeAdds++;
        state.maxActiveAdds = Math.max(state.maxActiveAdds, state.activeAdds);
        state.samples.push({
          timestamp,
          duration,
          fraction: state.draws.at(-1),
        });
        try {
          await stage("add", state.samples.length);
        } finally {
          state.activeAdds--;
        }
      }
      close() {
        state.closed++;
        stage("close");
      }
    },
  };
  const runtime = {
    VideoEncoder: class {},
    VideoFrame: class {},
    async loadEncoder() {
      await stage("load");
      return encoder;
    },
    async recordVideo(options) {
      state.legacy++;
      if (hooks.legacy) return hooks.legacy(f, options);
      options.drawFrame(0);
      options.drawFrame(1);
      return { extension: "webm" };
    },
    setTimeout(fn, ms) {
      const id = ++timerId;
      state.timers.set(id, { fn, ms });
      if (ms === 0)
        queueMicrotask(() => {
          if (!state.timers.has(id)) return;
          state.timers.delete(id);
          fn();
        });
      return id;
    },
    clearTimeout(id) {
      state.timers.delete(id);
    },
  };
  const f = {
    state,
    document,
    controller,
    canvas,
    runtime,
    encoder,
    hide() {
      document.hidden = true;
      document.dispatchEvent(new Event("visibilitychange"));
    },
    pagehide() {
      document.defaultView.dispatchEvent(new Event("pagehide"));
    },
    options: {
      canvas,
      signal: controller.signal,
      duration: 0.1,
      runtime,
      drawFrame(value) {
        state.draws.push(value);
        canvas.width = canvas.height = 2560;
        // Simulate a renderer taking longer than a video frame, without sleeping.
        state.wallTime += 90;
        stage("draw", value);
      },
      onProgress(value) {
        state.progress.push(value);
        stage("progress", value);
      },
    },
    clean() {
      assert.equal(document.listenerCount, 0);
      assert.equal(document.defaultView.listenerCount, 0);
      assert.equal(getEventListeners(controller.signal, "abort").length, 0);
      assert.equal(state.timers.size, 0);
    },
  };
  return f;
}

async function until(predicate) {
  for (let index = 0; index < 100; index++) {
    if (predicate()) return;
    await new Promise(setImmediate);
  }
  assert.fail("Expected lifecycle stage was not reached");
}

for (const duration of [6, 10, 15])
  test(`slow rendering preserves every intended pose and the ${duration}-second 30fps timeline`, async () => {
    const f = fixture();
    const count = duration * 30;
    const result = await exportVideo({ ...f.options, duration });
    const { state } = f;
    assert.equal(state.samples.length, count);
    assert.equal(state.draws.length, count);
    assert.equal(state.draws[0], 0);
    assert.equal(state.draws.at(-1), 1);
    for (let index = 0; index < count; index++) {
      assert.equal(state.samples[index].fraction, index / (count - 1));
      assert.equal(state.samples[index].timestamp, index / 30);
      assert.equal(state.samples[index].duration, 1 / 30);
    }
    assert.equal(state.samples.at(-1).timestamp + 1 / 30, duration);
    assert.equal(state.wallTime, count * 90);
    assert.equal(state.config.latencyMode, "quality");
    assert.equal(state.config.bitrate, 10_000_000);
    assert.deepEqual(state.track, { frameRate: 30 });
    assert.equal(state.maxActiveAdds, 1);
    assert.equal(state.progress[0], 0);
    assert.equal(state.progress.at(-1), 1);
    assert.equal(state.closed, 1);
    assert.equal(state.finalized, 1);
    assert.equal(state.cancelled, 0);
    assert.equal(result.extension, "mp4");
    assert.equal(result.blob.size, 3);
    f.clean();
  });

test("canvas waits for encoder backpressure before drawing another pose", async () => {
  const pending = deferred();
  const f = fixture({
    add: (_, count) => (count === 1 ? pending.promise : undefined),
  });
  const job = exportVideo(f.options);
  await until(() => f.state.samples.length === 1);
  assert.deepEqual(f.state.draws, [0]);
  await new Promise(setImmediate);
  assert.deepEqual(f.state.draws, [0]);
  pending.resolve();
  await job;
  assert.equal(f.state.samples.length, 3);
  f.clean();
});

for (const event of ["abort", "hidden", "pagehide"])
  for (const stage of ["load", "preflight", "start", "add"]) {
    test(`${event} interrupts pending ${stage}, releases output and rejects partial video`, async () => {
      const pending = deferred();
      let reached = false;
      const f = fixture({
        [stage]: () => {
          reached = true;
          return pending.promise;
        },
      });
      const job = exportVideo(f.options);
      const rejected = assert.rejects(
        job,
        event === "abort" ? { name: "AbortError" } : /VIDEO_PAGE_HIDDEN/,
      );
      await until(() => reached);
      if (event === "abort") f.controller.abort();
      else if (event === "hidden") f.hide();
      else f.pagehide();
      await rejected;
      assert.equal(f.state.cancelled, f.state.created ? 1 : 0);
      const drawsAtCancel = f.state.draws.length;
      pending.resolve();
      await new Promise(setImmediate);
      assert.equal(f.state.draws.length, drawsAtCancel);
      assert.equal(f.state.legacy, 0);
      f.clean();
    });
  }

for (const event of ["abort", "hidden", "pagehide"])
  test(`${event} during finalization without a force-close hook still waits for resource release`, async () => {
    const pending = deferred();
    let reached = false;
    let settled = false;
    const f = fixture({
      finalize: () => {
        reached = true;
        return pending.promise;
      },
    });
    const job = exportVideo(f.options);
    job.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    const rejected = assert.rejects(
      job,
      event === "abort" ? { name: "AbortError" } : /VIDEO_PAGE_HIDDEN/,
    );
    await until(() => reached);
    if (event === "abort") f.controller.abort();
    else if (event === "hidden") f.hide();
    else f.pagehide();
    await new Promise(setImmediate);
    assert.equal(
      settled,
      false,
      "Do not report cleanup while finalization is still active",
    );
    pending.resolve();
    await rejected;
    assert.equal(f.state.closed, 1);
    assert.equal(f.state.legacy, 0);
    f.clean();
  });

for (const event of ["abort", "hidden"])
  for (const stage of ["draw", "progress", "output", "source", "track"]) {
    test(`reentrant ${event} during ${stage} cannot submit another frame`, async () => {
      const f = fixture({
        [stage]: (f) => (event === "abort" ? f.controller.abort() : f.hide()),
      });
      await assert.rejects(
        exportVideo(f.options),
        event === "abort" ? { name: "AbortError" } : /VIDEO_PAGE_HIDDEN/,
      );
      assert.equal(f.state.samples.length, 0);
      assert.equal(f.state.legacy, 0);
      assert.equal(f.state.cancelled, f.state.created ? 1 : 0);
      f.clean();
    });
  }

for (const event of ["abort", "hidden"])
  test(`already ${event} export opens no encoder or composition`, async () => {
    const f = fixture();
    if (event === "abort") f.controller.abort();
    else f.document.hidden = true;
    await assert.rejects(
      exportVideo(f.options),
      event === "abort" ? { name: "AbortError" } : /VIDEO_PAGE_HIDDEN/,
    );
    assert.equal(f.state.draws.length, 0);
    assert.equal(f.state.created, 0);
    f.clean();
  });

for (const stage of [
  "load",
  "preflight",
  "source",
  "track",
  "start",
  "draw",
  "add",
  "finalize",
])
  test(`${stage} failure is retained, cleaned and never silently replaced by legacy output`, async () => {
    const f = fixture({
      [stage]: () => {
        throw new Error(`FAIL_${stage}`);
      },
    });
    await assert.rejects(exportVideo(f.options), new RegExp(`FAIL_${stage}`));
    assert.equal(f.state.cancelled, f.state.created ? 1 : 0);
    assert.equal(f.state.legacy, 0);
    f.clean();
  });

test("unsupported codec falls back before creating output and reuses only initial pose", async () => {
  const f = fixture({
    preflight: () => false,
    legacy(f, options) {
      f.clean();
      options.drawFrame(0);
      options.drawFrame(0.5);
      options.drawFrame(1);
      return { extension: "webm" };
    },
  });
  assert.equal((await exportVideo(f.options)).extension, "webm");
  assert.equal(f.state.created, 0);
  assert.equal(f.state.legacy, 1);
  assert.deepEqual(f.state.draws, [0, 0.5, 1]);
  f.clean();
});

test("missing WebCodecs uses the unchanged recorder path", async () => {
  const f = fixture();
  f.runtime.VideoEncoder = undefined;
  await exportVideo(f.options);
  assert.equal(f.state.created, 0);
  assert.equal(f.state.legacy, 1);
  assert.deepEqual(f.state.draws, [0, 1]);
  f.clean();
});

test("encoding watchdog interrupts pending work and closes listeners and output", async () => {
  const f = fixture({ add: () => new Promise(() => {}) });
  const job = exportVideo(f.options);
  const rejected = assert.rejects(job, /VIDEO_ENCODING_TIMEOUT/);
  await until(() => f.state.samples.length === 1);
  [...f.state.timers.values()].find((timer) => timer.ms === 180_000).fn();
  await rejected;
  assert.equal(f.state.cancelled, 1);
  f.clean();
});

test("empty encoder output cannot become a downloadable file", async () => {
  const f = fixture({ empty: true });
  await assert.rejects(exportVideo(f.options), /VIDEO_EMPTY/);
  f.clean();
});

test("capability supports frame generation without requiring captureStream", () => {
  assert.equal(
    preferredExportFormat({ VideoEncoder: class {}, VideoFrame: class {} })
      .extension,
    "mp4",
  );
  assert.equal(preferredExportFormat({}), null);
});

for (const event of ["abort", "hidden", "pagehide", "timeout"])
  test(`${event} closes a stalled fallback finalizer without waiting for its flush`, async () => {
    const pending = deferred();
    let reached = false;
    const f = fixture({
      finalize() {
        reached = true;
        return pending.promise;
      },
      forceClose() {
        pending.reject(new DOMException("Encoder closed", "AbortError"));
      },
    });
    const job = exportVideo(f.options);
    const rejected = assert.rejects(
      job,
      event === "abort"
        ? { name: "AbortError" }
        : event === "timeout"
          ? /VIDEO_ENCODING_TIMEOUT/
          : /VIDEO_PAGE_HIDDEN/,
    );
    await until(() => reached);
    const samples = f.state.samples.length;
    if (event === "abort") f.controller.abort();
    else if (event === "hidden") f.hide();
    else if (event === "pagehide") f.pagehide();
    else
      [...f.state.timers.values()].find((timer) => timer.ms === 180_000).fn();
    await rejected;
    f.pagehide();
    assert.equal(f.state.forceClosed, 1);
    assert.equal(f.state.closed, 1);
    assert.equal(f.state.cancelled, 1);
    assert.equal(f.state.samples.length, samples);
    assert.equal(f.state.legacy, 0);
    f.clean();
  });

test("fallback cancellation drains its force-close cleanup before releasing capture", async () => {
  const pending = deferred(),
    cleanup = deferred();
  let reached = false,
    settled = false;
  const f = fixture({
    finalize() {
      reached = true;
      return pending.promise;
    },
    forceClose() {
      pending.reject(new DOMException("Encoder closed", "AbortError"));
      return cleanup.promise;
    },
  });
  const job = exportVideo(f.options);
  job.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  const rejected = assert.rejects(job, { name: "AbortError" });
  await until(() => reached);
  f.controller.abort();
  await new Promise(setImmediate);
  assert.equal(f.state.forceClosed, 1);
  assert.equal(settled, false);
  assert.equal(f.state.closed, 0);
  cleanup.resolve();
  await rejected;
  assert.equal(f.state.closed, 1);
  f.clean();
});

test("reentrant cancellation at finalization starts its owned force-close once", async () => {
  const pending = deferred();
  const f = fixture({
    finalize(f) {
      f.controller.abort();
      return pending.promise;
    },
    forceClose() {
      pending.reject(new DOMException("Encoder closed", "AbortError"));
    },
  });
  await assert.rejects(exportVideo(f.options), { name: "AbortError" });
  assert.equal(f.state.forceClosed, 1);
  assert.equal(f.state.closed, 1);
  f.clean();
});

test("successful fallback export never invokes the force-close hook", async () => {
  const f = fixture({
    forceClose() {
      throw new Error("Unexpected force-close");
    },
  });
  const result = await exportVideo(f.options);
  assert.equal(result.extension, "mp4");
  assert.equal(f.state.forceClosed, 0);
  assert.equal(f.state.samples.length, 3);
  assert.equal(f.state.closed, 1);
  f.clean();
});

test("pinned Mediabunny force-close interrupts its already-running encoder flush exactly once", async () => {
  const dependency = JSON.parse(
    await readFile(
      new URL("../node_modules/mediabunny/package.json", import.meta.url),
      "utf8",
    ),
  );
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(dependency.version, "1.62.1");
  assert.equal(manifest.dependencies.mediabunny, "1.62.1");
  const { CanvasSource } = await import("mediabunny");
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "HTMLCanvasElement",
  );
  class Canvas {}
  Object.defineProperty(globalThis, "HTMLCanvasElement", {
    configurable: true,
    writable: true,
    value: Canvas,
  });
  try {
    const source = new CanvasSource(new Canvas(), {
      codec: "avc",
      bitrate: 10_000_000,
      latencyMode: "quality",
    });
    const pending = deferred();
    let closes = 0;
    const native = {
      state: "configured",
      flush: () => pending.promise,
      close() {
        this.state = "closed";
        closes++;
        pending.reject(new DOMException("Encoder closed", "AbortError"));
      },
    };
    // Contract fixture only: execute the real pinned wrapper's lifecycle using
    // a controllable WebCodecs interface; actual native release is a browser gate.
    source._encoder.encoder = native;
    const flushing = source._flushAndClose(false);
    const rejected = assert.rejects(flushing, { name: "AbortError" });
    await source._flushAndClose(true);
    await rejected;
    await source._flushAndClose(true);
    assert.equal(closes, 1);
    assert.equal(native.state, "closed");
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis, "HTMLCanvasElement", descriptor);
    else delete globalThis.HTMLCanvasElement;
  }
});
