import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPreviewPlayback,
  previewScale,
} from "../src/studio/previewPlayback.js";

function fixture(overrides = {}) {
  let id = 0;
  const jobs = new Map();
  const frames = [],
    states = [],
    errors = [];
  const loop = createPreviewPlayback({
    drawFrame: (fraction) => frames.push(fraction),
    duration: 1,
    onPlayingChange: (state) => states.push(state),
    onError: (error) => errors.push(error),
    runtime: {
      requestAnimationFrame(fn) {
        jobs.set(++id, fn);
        return id;
      },
      cancelAnimationFrame(key) {
        jobs.delete(key);
      },
    },
    ...overrides,
  });
  const tick = (time) => {
    const pending = [...jobs.values()];
    jobs.clear();
    pending.forEach((fn) => fn(time));
  };
  return { loop, jobs, frames, states, errors, tick };
}

test("paused preview paints once and schedules no idle captures", () => {
  const f = fixture();
  f.tick(0);
  assert.deepEqual(f.frames, [0]);
  assert.equal(f.jobs.size, 0);
  f.tick(1000);
  assert.deepEqual(f.frames, [0]);
});

test("pausing before the first paint still completes the pending preview", () => {
  const f = fixture();
  f.loop.pause();
  assert.equal(f.jobs.size, 1);
  f.tick(1000);
  assert.deepEqual(f.frames, [0]);
  assert.equal(f.jobs.size, 0);
});

test("pausing after seeking keeps the requested frame without advancing time", () => {
  const f = fixture();
  f.tick(0);
  f.loop.seek(0.6);
  f.loop.pause();
  f.tick(1000);
  assert.deepEqual(f.frames, [0, 0.6]);
  assert.equal(f.jobs.size, 0);
});

test("playback follows elapsed time continuously, paints at most 30fps and stops at the end", () => {
  const f = fixture();
  f.loop.play();
  for (let i = 0; i <= 120; i++) f.tick((i * 1000) / 120);
  assert.equal(f.frames[0], 0);
  assert.equal(f.frames.at(-1), 1);
  assert.ok(f.frames.length >= 29 && f.frames.length <= 32);
  assert.ok(
    f.frames.some((value) => value > 0.02 && value < 0.045),
    "no 5% slideshow steps",
  );
  assert.equal(f.states.at(-1), false);
  assert.equal(f.jobs.size, 0);
});

test("rapid seeks coalesce to the latest position and stop playback", () => {
  const f = fixture();
  f.loop.play();
  f.tick(0);
  for (const value of [0.1, 0.2, 0.333, 0.789]) f.loop.seek(value);
  assert.equal(f.jobs.size, 1);
  f.tick(20);
  assert.equal(f.frames.at(-1), 0.789);
  assert.equal(f.states.at(-1), false);
  assert.equal(f.jobs.size, 0);
});

test("pause/resume excludes paused wall time, replay starts from zero, disposal cancels work", () => {
  const f = fixture();
  f.loop.play();
  f.tick(0);
  f.tick(400);
  f.loop.pause();
  f.loop.play();
  f.tick(9000);
  assert.equal(f.frames.at(-1), 0.4);
  f.tick(9600);
  assert.equal(f.frames.at(-1), 1);
  f.loop.play();
  f.tick(10000);
  assert.equal(f.frames.at(-1), 0);
  f.loop.dispose();
  assert.equal(f.jobs.size, 0);
});

test("capture failure stops the loop and allows an explicit refresh retry", () => {
  let fail = true;
  const f = fixture({
    drawFrame() {
      if (fail) throw Error("capture");
    },
  });
  f.loop.play();
  f.tick(0);
  assert.equal(f.errors.length, 1);
  assert.equal(f.jobs.size, 0);
  fail = false;
  f.loop.refresh();
  f.tick(10);
  assert.equal(f.errors.length, 1);
});

test("preview respects both visible bounds and a pixel budget without changing export size", () => {
  const output = { width: 1080, height: 1920 };
  const scale = previewScale(output, { width: 560, height: 500 }, 2);
  assert.equal(scale, (484 / 1920) * 1.5);
  assert.deepEqual(output, { width: 1080, height: 1920 });
  assert.equal(previewScale(output, { width: 2000, height: 2000 }, 3), 0.5);
});
