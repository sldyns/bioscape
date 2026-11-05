import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import { test } from "node:test";
import { readCapturePixelsAsync } from "../src/scene/asyncPixelReadback.js";

function fixture() {
  let bound = { external: true };
  const external = bound;
  let target,
    clock = 0,
    id = 0;
  const timers = new Map(),
    buffers = new Set(),
    fences = new Set();
  const state = { complete: false, lost: false, copied: 0, deleted: 0 };
  const gl = {
    PIXEL_PACK_BUFFER: 1,
    PIXEL_PACK_BUFFER_BINDING: 2,
    STREAM_READ: 3,
    RGBA: 4,
    UNSIGNED_BYTE: 5,
    SYNC_GPU_COMMANDS_COMPLETE: 6,
    ALREADY_SIGNALED: 7,
    CONDITION_SATISFIED: 8,
    TIMEOUT_EXPIRED: 9,
    getParameter: () => bound,
    createBuffer() {
      const buffer = {};
      buffers.add(buffer);
      return buffer;
    },
    bindBuffer(_type, value) {
      bound = value;
    },
    bufferData(_type, size) {
      bound.data = new Uint8Array(size);
    },
    readPixels(_x, _y, _w, _h, _format, _type, offset) {
      assert.equal(offset, 0);
      bound.data.fill(target.value);
    },
    fenceSync() {
      const fence = {};
      fences.add(fence);
      return fence;
    },
    flush() {},
    isContextLost: () => state.lost,
    clientWaitSync: () => (state.complete ? 8 : 9),
    getBufferSubData(_type, offset, pixels) {
      assert.equal(offset, 0);
      pixels.set(bound.data);
      state.copied++;
    },
    deleteBuffer(value) {
      assert.ok(buffers.delete(value));
      state.deleted++;
    },
    deleteSync(value) {
      assert.ok(fences.delete(value));
    },
  };
  const runtime = {
    now: () => clock,
    setTimeout(callback) {
      timers.set(++id, callback);
      return id;
    },
    clearTimeout(value) {
      timers.delete(value);
    },
  };
  const renderer = {
    getContext: () => gl,
    setRenderTarget(value) {
      target = value;
    },
  };
  return {
    gl,
    renderer,
    runtime,
    state,
    get pending() {
      return timers.size;
    },
    get allocations() {
      return buffers.size + fences.size;
    },
    tick() {
      const [key, callback] = timers.entries().next().value;
      timers.delete(key);
      callback();
    },
    setClock(value) {
      clock = value;
    },
    checkBinding() {
      assert.equal(bound, external);
    },
  };
}

test("two readbacks keep separate pixels and restore the pack binding", async () => {
  const f = fixture(),
    first = new Uint8Array(16),
    second = new Uint8Array(16);
  const a = readCapturePixelsAsync(f.renderer, { value: 17 }, 2, 2, first, {
    runtime: f.runtime,
  });
  const b = readCapturePixelsAsync(f.renderer, { value: 93 }, 2, 2, second, {
    runtime: f.runtime,
  });
  f.checkBinding();
  assert.equal(f.state.copied, 0);
  assert.equal(f.allocations, 4);
  f.tick();
  assert.equal(f.state.copied, 0);
  f.state.complete = true;
  while (f.pending) f.tick();
  await Promise.all([a.ready, b.ready]);
  assert.ok(first.every((value) => value === 17));
  assert.ok(second.every((value) => value === 93));
  f.checkBinding();
  assert.equal(f.allocations, 0);
  assert.equal(f.state.copied, 2);
});

test("abort promptly releases pending GPU buffers and never copies late data", async () => {
  const f = fixture(),
    controller = new AbortController();
  const job = readCapturePixelsAsync(
    f.renderer,
    { value: 9 },
    2,
    2,
    new Uint8Array(16),
    { signal: controller.signal, runtime: f.runtime },
  );
  controller.abort();
  await assert.rejects(job.ready, { name: "AbortError" });
  job.cancel();
  assert.equal(f.pending, 0);
  assert.equal(f.allocations, 0);
  assert.equal(f.state.copied, 0);
  assert.equal(getEventListeners(controller.signal, "abort").length, 0);
  f.checkBinding();
});

test("lost context and a stalled fence release every owned resource", async () => {
  for (const scenario of ["context", "timeout"]) {
    const f = fixture();
    const job = readCapturePixelsAsync(
      f.renderer,
      { value: 9 },
      2,
      2,
      new Uint8Array(16),
      { runtime: f.runtime },
    );
    if (scenario === "context") f.state.lost = true;
    else f.setClock(15000);
    f.tick();
    await assert.rejects(
      job.ready,
      new RegExp(scenario === "context" ? "CONTEXT_LOST" : "TIMEOUT"),
    );
    assert.equal(f.pending, 0);
    assert.equal(f.allocations, 0);
    assert.equal(f.state.copied, 0);
  }
});

test("unsupported async readback preserves the synchronous full-quality path", async () => {
  let calls = 0;
  const pixels = new Uint8Array(16);
  const renderer = {
    getContext: () => ({}),
    readRenderTargetPixels(target, x, y, width, height, output) {
      calls++;
      assert.deepEqual([target, x, y, width, height], ["target", 0, 0, 2, 2]);
      output.fill(7);
    },
  };
  await readCapturePixelsAsync(renderer, "target", 2, 2, pixels).ready;
  assert.equal(calls, 1);
  assert.ok(pixels.every((value) => value === 7));
});
