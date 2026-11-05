import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import { test } from "node:test";
import { exportVideoInWorker } from "../src/studio/workerVideo.js";
import { exportVideo } from "../src/studio/exportVideo.js";
import { installVideoEncoderWorker } from "../src/studio/videoEncoderRuntime.js";

const deferred = () => {
  let resolve;
  const promise = new Promise((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
};
const turn = () => new Promise(setImmediate);
async function until(predicate) {
  for (let index = 0; index < 50; index++) {
    if (predicate()) return;
    await turn();
  }
  assert.fail("Expected worker stage not reached");
}
async function bounded(promise) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Parent still waits for stalled worker")),
          250,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

class Target extends EventTarget {
  entries = new Map();
  addEventListener(type, callback, options) {
    super.addEventListener(type, callback, options);
    if (!this.entries.has(type)) this.entries.set(type, new Set());
    this.entries.get(type).add(callback);
  }
  removeEventListener(type, callback, options) {
    super.removeEventListener(type, callback, options);
    this.entries.get(type)?.delete(callback);
  }
  get listenerCount() {
    return [...this.entries.values()].reduce((n, s) => n + s.size, 0);
  }
}

function fixture(hooks = {}) {
  const owner = new Target();
  owner.hidden = false;
  owner.defaultView = new Target();
  const controller = new AbortController();
  const canvas = { ownerDocument: owner, width: 0, height: 0, pose: 0 };
  const state = {
    draws: [],
    messages: [],
    frames: [],
    progress: [],
    yields: 0,
    timers: new Map(),
    terminated: 0,
    created: 0,
    legacy: 0,
    activeFrames: 0,
    maxActiveFrames: 0,
  };
  let worker;
  const stage = (name, ...args) => hooks[name]?.(f, ...args);
  class Frame {
    constructor(input, init) {
      this.codedWidth = input.width;
      this.codedHeight = input.height;
      this.pose = input.pose;
      this.init = init;
      this.closed = false;
      this.transferred = false;
      state.frames.push(this);
      stage("constructFrame", this);
    }
    close() {
      assert.equal(this.closed, false);
      this.closed = true;
    }
  }
  class FakeWorker extends Target {
    owned = new Set();
    stopped = false;
    postMessage(data, transfer) {
      state.messages.push(data);
      if (hooks.postThrows) throw new Error("POST_FAILED");
      if (data.type === "frame") {
        assert.deepEqual(transfer, [data.frame]);
        data.frame.transferred = true;
        this.owned.add(data.frame);
        state.activeFrames++;
        state.maxActiveFrames = Math.max(
          state.maxActiveFrames,
          state.activeFrames,
        );
      }
      queueMicrotask(async () => {
        const response = await stage(data.type, data);
        if (this.stopped) return;
        if (data.type === "frame") {
          data.frame.close();
          this.owned.delete(data.frame);
          state.activeFrames--;
        }
        const type =
          data.type === "init"
            ? hooks.unsupported
              ? "unsupported"
              : "ready"
            : data.type === "frame"
              ? "frame"
              : "done";
        this.dispatchEvent(
          new MessageEvent("message", {
            data: response ?? {
              id: data.id,
              type,
              ...(type === "done"
                ? { buffer: new Uint8Array([1, 2, 3]).buffer }
                : {}),
            },
          }),
        );
      });
    }
    terminate() {
      assert.equal(this.stopped, false);
      this.stopped = true;
      state.terminated++;
      for (const frame of this.owned) {
        frame.close();
        state.activeFrames--;
      }
      this.owned.clear();
    }
  }
  let timerId = 0;
  const runtime = {
    Worker: FakeWorker,
    VideoEncoder: class {},
    VideoFrame: Frame,
    createWorker() {
      state.created++;
      worker = new FakeWorker();
      stage("createWorker");
      return worker;
    },
    setTimeout(fn, ms) {
      const id = ++timerId;
      const invoke = () => {
        state.timers.delete(id);
        fn();
      };
      state.timers.set(id, { fn: invoke, ms });
      if (ms === 0) {
        state.yields++;
        stage("yield");
        if (!hooks.holdYield)
          queueMicrotask(() => {
            if (state.timers.has(id)) invoke();
          });
      }
      return id;
    },
    clearTimeout(id) {
      state.timers.delete(id);
    },
    async loadEncoder() {
      return {
        async canEncodeVideo() {
          return false;
        },
      };
    },
    async recordVideo(options) {
      state.legacy++;
      options.drawFrame(0);
      options.drawFrame(1);
      return { extension: "webm" };
    },
  };
  const f = {
    state,
    owner,
    controller,
    canvas,
    runtime,
    get worker() {
      return worker;
    },
    hide() {
      owner.hidden = true;
      owner.dispatchEvent(new Event("visibilitychange"));
    },
    pagehide() {
      owner.defaultView.dispatchEvent(new Event("pagehide"));
    },
    options: {
      canvas,
      signal: controller.signal,
      duration: 0.1,
      runtime,
      drawFrame(value) {
        canvas.width = canvas.height = 2560;
        canvas.pose = value;
        state.draws.push(value);
        stage("draw", value);
      },
      onProgress(value) {
        state.progress.push(value);
        stage("progress", value);
      },
    },
    clean() {
      assert.equal(owner.listenerCount, 0);
      assert.equal(owner.defaultView.listenerCount, 0);
      assert.equal(getEventListeners(controller.signal, "abort").length, 0);
      assert.equal(state.timers.size, 0);
      assert.equal(worker?.listenerCount ?? 0, 0);
      assert.equal(state.activeFrames, 0);
      assert.ok(state.frames.every((frame) => frame.closed));
    },
  };
  return f;
}

for (const duration of [6, 10, 15])
  test(`worker preserves all ${duration * 30} poses and exact timestamps with bounded ownership`, async () => {
    const f = fixture();
    const result = await exportVideo({ ...f.options, duration });
    const count = duration * 30;
    const frames = f.state.messages.filter((m) => m.type === "frame");
    assert.equal(frames.length, count);
    assert.equal(f.state.draws.length, count);
    assert.equal(f.state.draws[0], 0);
    assert.equal(f.state.draws.at(-1), 1);
    for (let i = 0; i < count; i++) {
      assert.equal(frames[i].frame.pose, i / (count - 1));
      assert.equal(frames[i].timestamp, i / 30);
      assert.equal(frames[i].duration, 1 / 30);
      assert.equal(frames[i].frame.init.timestamp, Math.trunc((i / 30) * 1e6));
      assert.equal(frames[i].frame.codedWidth, 2560);
      assert.equal(frames[i].frame.codedHeight, 2560);
      assert.equal(frames[i].frame.transferred, true);
    }
    assert.equal(f.state.maxActiveFrames, 1);
    assert.equal(f.state.yields, count - 1);
    assert.equal(result.blob.size, 3);
    assert.equal(f.state.terminated, 1);
    assert.equal(f.state.legacy, 0);
    f.clean();
  });

test("worker acknowledgement applies backpressure before the next model pose", async () => {
  const held = deferred();
  const f = fixture({
    frame: (_, m) => (m.index === 0 ? held.promise : undefined),
  });
  const job = exportVideoInWorker(f.options);
  await until(() => f.state.activeFrames === 1);
  await turn();
  assert.deepEqual(f.state.draws, [0]);
  held.resolve();
  await job;
  f.clean();
});

for (const stage of ["init", "frame", "finalize"])
  for (const event of ["abort", "hidden", "pagehide", "timeout"])
    test(`${event} releases a worker stalled forever in ${stage} without waiting for it`, async () => {
      let reached = false;
      const held = deferred();
      const f = fixture({
        [stage]: () => {
          reached = true;
          return held.promise;
        },
      });
      const job = exportVideoInWorker(f.options);
      const rejection = assert.rejects(
        job,
        event === "abort"
          ? { name: "AbortError" }
          : event === "timeout"
            ? /VIDEO_ENCODING_TIMEOUT/
            : /VIDEO_PAGE_HIDDEN/,
      );
      await until(() => reached);
      if (event === "abort") f.controller.abort();
      else if (event === "hidden") f.hide();
      else if (event === "pagehide") f.pagehide();
      else [...f.state.timers.values()][0].fn();
      await bounded(rejection);
      assert.equal(f.state.terminated, 1);
      f.clean();
      const count = f.state.draws.length;
      held.resolve();
      await turn();
      assert.equal(f.state.draws.length, count);
    });

for (const stage of ["draw", "progress", "createWorker", "constructFrame"])
  test(`reentrant cancellation during ${stage} leaves no worker, frame or listener`, async () => {
    const f = fixture({ [stage]: (f) => f.controller.abort() });
    await assert.rejects(exportVideoInWorker(f.options), {
      name: "AbortError",
    });
    assert.equal(f.state.messages.filter((m) => m.type === "frame").length, 0);
    f.clean();
  });

for (const event of ["abort", "hidden"])
  test(`already ${event} creates no worker and does not draw`, async () => {
    const f = fixture();
    if (event === "abort") f.controller.abort();
    else f.owner.hidden = true;
    await assert.rejects(
      exportVideoInWorker(f.options),
      event === "abort" ? { name: "AbortError" } : /VIDEO_PAGE_HIDDEN/,
    );
    assert.equal(f.state.created, 0);
    assert.equal(f.state.draws.length, 0);
    f.clean();
  });

test("failed transfer closes the still-owned sender frame and rejects partial output", async () => {
  const f = fixture();
  let first = true;
  const original = f.runtime.createWorker;
  f.runtime.createWorker = () => {
    const w = original();
    const post = w.postMessage.bind(w);
    w.postMessage = (data, transfer) => {
      if (data.type === "frame" && first) {
        first = false;
        throw new Error("POST_FAILED");
      }
      post(data, transfer);
    };
    return w;
  };
  await assert.rejects(exportVideoInWorker(f.options), /POST_FAILED/);
  assert.equal(f.state.frames.length, 1);
  assert.equal(f.state.frames[0].transferred, false);
  f.clean();
});

for (const event of ["error", "messageerror"])
  test(`${event} terminates an encoder and rejects the current frame`, async () => {
    const f = fixture({ frame: () => new Promise(() => {}) });
    const job = exportVideoInWorker(f.options);
    const rejected = assert.rejects(job, /VIDEO_ENCODING_FAILED/);
    await until(() => f.state.activeFrames === 1);
    f.worker.dispatchEvent(new Event(event));
    await bounded(rejected);
    f.clean();
  });

for (const response of [
  { type: "done", id: 900 },
  { type: "error", id: 1 },
])
  test(`invalid worker response ${JSON.stringify(response)} is rejected without fallback`, async () => {
    const f = fixture({ init: () => response });
    await assert.rejects(exportVideo(f.options), /VIDEO_ENCODING_FAILED/);
    assert.equal(f.state.legacy, 0);
    f.clean();
  });

test("unsupported worker preflight releases it before the existing compatibility path", async () => {
  const f = fixture({ unsupported: true });
  const result = await exportVideo(f.options);
  assert.equal(result.extension, "webm");
  assert.equal(f.state.terminated, 1);
  assert.equal(f.state.legacy, 1);
  assert.deepEqual(f.state.draws, [0, 1]);
  f.clean();
});

test("a cancelled stalled export can be followed by a completely new worker export", async () => {
  const first = fixture({ finalize: () => new Promise(() => {}) });
  const job = exportVideoInWorker(first.options);
  const rejected = assert.rejects(job, { name: "AbortError" });
  await until(() => first.state.messages.some((m) => m.type === "finalize"));
  first.controller.abort();
  await bounded(rejected);
  first.clean();
  const next = fixture();
  await exportVideoInWorker(next.options);
  next.clean();
});

test("an acknowledged Worker frame yields a task before the next model pose", async () => {
  const f = fixture({ holdYield: true });
  const job = exportVideoInWorker(f.options);
  for (let accepted = 1; accepted < 3; accepted++) {
    await until(() => [...f.state.timers.values()].some((v) => v.ms === 0));
    assert.equal(f.state.draws.length, accepted);
    assert.equal(f.state.progress.at(-1), accepted / 3);
    const pending = [...f.state.timers.values()].find((v) => v.ms === 0);
    pending.fn();
    await turn();
  }
  await bounded(job);
  assert.equal(f.state.draws.length, 3);
  f.clean();
});

for (const event of ["abort", "hidden", "pagehide", "timeout"])
  test(`${event} interrupts an acknowledged-frame yield without another pose`, async () => {
    const f = fixture({ holdYield: true });
    const job = exportVideoInWorker(f.options);
    const rejected = assert.rejects(
      job,
      event === "abort"
        ? { name: "AbortError" }
        : event === "timeout"
          ? /VIDEO_ENCODING_TIMEOUT/
          : /VIDEO_PAGE_HIDDEN/,
    );
    await until(() => [...f.state.timers.values()].some((v) => v.ms === 0));
    const timer = [...f.state.timers.values()].find((v) => v.ms === 0);
    assert.deepEqual(f.state.draws, [0]);
    if (event === "abort") f.controller.abort();
    else if (event === "hidden") f.hide();
    else if (event === "pagehide") f.pagehide();
    else [...f.state.timers.values()].find((v) => v.ms === 180_000).fn();
    await bounded(rejected);
    timer.fn();
    await turn();
    assert.deepEqual(f.state.draws, [0]);
    assert.equal(f.state.terminated, 1);
    f.clean();
  });

test("reentrant abort while scheduling the next frame clears the returned timer", async () => {
  const f = fixture({ yield: (f) => f.controller.abort() });
  await assert.rejects(exportVideoInWorker(f.options), { name: "AbortError" });
  assert.deepEqual(f.state.draws, [0]);
  assert.equal(f.state.terminated, 1);
  f.clean();
});

function encoderFixture(hooks = {}) {
  const replies = [];
  let receive;
  const state = { samples: [], finalized: 0, closed: 0 };
  const scope = {
    VideoEncoder: class {},
    VideoFrame: class {},
    addEventListener(_, fn) {
      receive = fn;
    },
    removeEventListener() {
      receive = null;
    },
    postMessage(data, transfer) {
      replies.push({ data, transfer });
    },
  };
  const media = {
    canEncodeVideo: async () => true,
    BufferTarget: class {},
    Mp4OutputFormat: class {},
    Output: class {
      constructor({ target }) {
        this.target = target;
      }
      addVideoTrack(_, metadata) {
        state.metadata = metadata;
      }
      async start() {}
      async finalize() {
        state.finalized++;
        this.target.buffer = new Uint8Array([1]).buffer;
      }
    },
    VideoSampleSource: class {
      constructor(config) {
        state.config = config;
      }
      async add(sample) {
        state.samples.push(sample);
        await hooks.add?.();
      }
    },
    VideoSample: class {
      constructor(frame, init) {
        this.frame = frame;
        this.init = init;
      }
      close() {
        this.frame.close();
        state.closed++;
      }
    },
  };
  const dispose = installVideoEncoderWorker(scope, media);
  return {
    state,
    replies,
    dispose,
    send: (data) => receive({ data }),
    frame: () => ({
      codedWidth: 2560,
      codedHeight: 2560,
      closed: false,
      close() {
        assert.equal(this.closed, false);
        this.closed = true;
      },
    }),
  };
}
const init = {
  type: "init",
  id: 1,
  width: 2560,
  height: 2560,
  count: 2,
  frameRate: 30,
  bitrate: 10_000_000,
};
test("encoder protocol retains exact metadata and closes each sample before acknowledgement", async () => {
  const f = encoderFixture();
  await f.send(init);
  for (let i = 0; i < 2; i++) {
    const frame = f.frame();
    await f.send({
      type: "frame",
      id: i + 2,
      index: i,
      frame,
      timestamp: i / 30,
      duration: 1 / 30,
    });
    assert.equal(frame.closed, true);
    assert.equal(f.state.samples[i].init.timestamp, i / 30);
    assert.equal(f.state.samples[i].init.duration, 1 / 30);
    assert.equal(f.replies.at(-1).data.type, "frame");
  }
  await f.send({ type: "finalize", id: 4 });
  assert.equal(f.state.finalized, 1);
  assert.equal(f.replies.at(-1).data.type, "done");
  assert.deepEqual(f.replies.at(-1).transfer, [f.replies.at(-1).data.buffer]);
  assert.equal(f.state.config.latencyMode, "quality");
  assert.equal(f.state.config.bitrate, 10_000_000);
  f.dispose();
});

test("encoder protocol never acknowledges a frame while its add is pending", async () => {
  const held = deferred();
  const f = encoderFixture({ add: () => held.promise });
  await f.send(init);
  const frame = f.frame();
  const job = f.send({
    type: "frame",
    id: 2,
    index: 0,
    frame,
    timestamp: 0,
    duration: 1 / 30,
  });
  await turn();
  assert.equal(frame.closed, false);
  assert.equal(f.replies.length, 1);
  held.resolve();
  await job;
  assert.equal(frame.closed, true);
  f.dispose();
});

test("encoder refuses incomplete finalization and malformed frame timing or dimensions", async () => {
  const f = encoderFixture();
  await f.send(init);
  await f.send({ type: "finalize", id: 2 });
  assert.equal(f.replies.at(-1).data.type, "error");
  assert.equal(f.state.finalized, 0);
  for (const change of [
    { index: 1 },
    { timestamp: 1 },
    { duration: 0 },
    {
      frame: {
        codedWidth: 1,
        codedHeight: 1,
        close() {
          this.closed = true;
        },
      },
    },
  ]) {
    const frame = f.frame();
    const data = {
      type: "frame",
      id: 3,
      index: 0,
      timestamp: 0,
      duration: 1 / 30,
      frame,
      ...change,
    };
    await f.send(data);
    assert.equal(f.replies.at(-1).data.type, "error");
    assert.equal(data.frame.closed, true);
  }
  assert.equal(f.state.samples.length, 0);
  f.dispose();
});

test("prepared export queues at most two frames and encodes them in order", async () => {
  const f = fixture(),
    first = deferred(),
    queued = [],
    released = [];
  const open = new Set();
  let maximum = 0;
  f.options.prepareFrame = (value) => {
    queued.push(value);
    open.add(value);
    maximum = Math.max(maximum, open.size);
    let closed = false;
    return {
      async draw() {
        if (value === 0) await first.promise;
        assert.equal(closed, false);
        f.options.drawFrame(value);
      },
      release() {
        if (closed) return;
        closed = true;
        open.delete(value);
        released.push(value);
      },
    };
  };
  const job = exportVideoInWorker(f.options);
  await turn();
  assert.deepEqual(queued, [0, 0.5]);
  first.resolve();
  await bounded(job);
  assert.equal(maximum, 2);
  assert.deepEqual(f.state.draws, [0, 0.5, 1]);
  assert.deepEqual(
    f.state.frames.map((frame) => frame.pose),
    [0, 0.5, 1],
  );
  assert.equal(open.size, 0);
  assert.equal(released.length, 3);
  f.clean();
});

test("cancellation interrupts a pending prepared draw before creating an encoder", async () => {
  const f = fixture(),
    blocked = deferred();
  let released = 0;
  f.options.prepareFrame = () => {
    let closed = false;
    return {
      draw: () => blocked.promise,
      release() {
        if (!closed) released++;
        closed = true;
      },
    };
  };
  const job = exportVideoInWorker(f.options);
  await turn();
  f.controller.abort();
  await assert.rejects(bounded(job), { name: "AbortError" });
  assert.equal(released, 2);
  assert.equal(f.state.created, 0);
  f.clean();
});

test("a prefetched read failure releases the other frame and worker", async () => {
  const f = fixture();
  let released = 0;
  f.options.prepareFrame = (value) => {
    let closed = false;
    return {
      async draw() {
        if (value === 0.5) throw new Error("CAPTURE_CONTEXT_LOST");
        f.options.drawFrame(value);
      },
      release() {
        if (!closed) released++;
        closed = true;
      },
    };
  };
  await assert.rejects(
    bounded(exportVideoInWorker(f.options)),
    /CAPTURE_CONTEXT_LOST/,
  );
  assert.equal(released, 3);
  assert.equal(f.state.terminated, 1);
  assert.equal(f.state.frames.length, 1);
  f.clean();
});

test("unsupported worker encoding releases prefetched work and keeps frame zero", async () => {
  const f = fixture({ unsupported: true });
  let released = 0;
  f.options.prepareFrame = (value) => {
    let closed = false;
    return {
      draw: async () => f.options.drawFrame(value),
      release() {
        if (!closed) released++;
        closed = true;
      },
    };
  };
  await bounded(exportVideo(f.options));
  assert.deepEqual(f.state.draws, [0, 1]);
  assert.equal(released, 2);
  assert.equal(f.state.legacy, 1);
  f.clean();
});
