import assert from "node:assert/strict";
import {
  startPlaybackClock,
  createProcessPose,
} from "../src/processes/playbackClock.js";

function frameQueue() {
  let id = 0;
  const callbacks = new Map();
  return {
    requestFrame: (callback) => {
      callbacks.set(++id, callback);
      return id;
    },
    cancelFrame: (key) => callbacks.delete(key),
    step(now) {
      const current = [...callbacks.entries()];
      for (const [key] of current) callbacks.delete(key);
      for (const [, callback] of current) callback(now);
    },
    get pending() {
      return callbacks.size;
    },
  };
}

for (const hz of [60, 75, 90, 120, 144]) {
  const queue = frameQueue();
  const progress = { current: 0 };
  const parameters = Object.freeze({ condition: "active" });
  const updates = [];
  const publications = [];
  const pose = createProcessPose((p) => updates.push(p), 0, parameters);
  let renderPending = false;
  const render = () => {
    renderPending = false;
    pose.apply(progress.current, parameters);
  };
  const invalidate = () => {
    if (renderPending) return;
    renderPending = true;
    queue.requestFrame(render);
  };
  const stop = startPlaybackClock({
    progress,
    duration: 32,
    speed: 1,
    onFrame: invalidate,
    onPublish: (value) => {
      publications.push(value);
      // A later React publication only invalidates. It must not apply this
      // older UI value over the latest authoritative display pose.
      queue.requestFrame(invalidate);
    },
    onFinish: () => assert.fail("Unexpected early finish"),
    requestFrame: queue.requestFrame,
    cancelFrame: queue.cancelFrame,
  });
  for (let i = 0; i <= hz * 2; i++) queue.step(1000 + (i * 1000) / hz);
  stop();
  queue.step(3100);
  queue.step(3200);
  assert.equal(
    queue.pending,
    0,
    "Paused playback must settle to no frame work",
  );
  assert(updates.length >= hz * 2 - 1, `${hz} Hz must retain display poses`);
  assert(publications.length < updates.length * 0.6);
  assert(updates.every((p, i) => i === 0 || p > updates[i - 1]));
  assert(Math.abs(pose.progress - 2 / 32) < 1e-10);
  const count = updates.length;
  for (let i = 0; i < 60; i++) render();
  assert.equal(updates.length, count, "Paused orbit cannot repeat model work");
  const resume = startPlaybackClock({
    progress,
    duration: 32,
    speed: 1.5,
    onFrame: invalidate,
    onPublish: () => {},
    onFinish: () => assert.fail("Unexpected finish"),
    requestFrame: queue.requestFrame,
    cancelFrame: queue.cancelFrame,
  });
  queue.step(100000);
  assert.equal(progress.current, pose.progress, "Resume excludes paused time");
  queue.step(100500);
  assert(Math.abs(progress.current - (2 / 32 + (0.1 * 1.5) / 32)) < 1e-10);
  resume();
  queue.step(100600);
}

// Terminal time is exact, replay is absolute, and a canceled old callback
// cannot advance a newly selected condition or a scene that has been disposed.
{
  const queue = frameQueue();
  const progress = { current: 0.999 };
  let finished = 0;
  const values = [];
  const stop = startPlaybackClock({
    progress,
    duration: 24,
    speed: 1,
    onFrame: () => {},
    onPublish: (p) => values.push(p),
    onFinish: () => finished++,
    requestFrame: queue.requestFrame,
    cancelFrame: queue.cancelFrame,
  });
  queue.step(0);
  queue.step(100);
  assert.equal(progress.current, 1);
  assert.equal(values.at(-1), 1);
  assert.equal(finished, 1);
  assert.equal(queue.pending, 0);
  stop();
  progress.current = 0;
  queue.step(200);
  assert.equal(progress.current, 0);
}

{
  const calls = [];
  const a = Object.freeze({ condition: "active" });
  const b = Object.freeze({ condition: "blocked" });
  const pose = createProcessPose((p, params) => calls.push([p, params]), 0, a);
  for (const p of [0, 0.7, 0.2, 0.7]) pose.apply(p, a);
  assert.deepEqual(
    calls.map(([p]) => p),
    [0.7, 0.2, 0.7],
  );
  assert.equal(pose.apply(0.7, a), false);
  assert.equal(
    pose.apply(0.7, b),
    true,
    "A condition change must update the model",
  );
  assert.equal(pose.parameters, b);
  pose.apply(NaN, b);
  assert.equal(pose.progress, 0);
  pose.apply(2, b);
  assert.equal(pose.progress, 1);
  const broken = createProcessPose(
    () => {
      throw new Error("bad pose");
    },
    0,
    a,
  );
  assert.throws(() => broken.apply(0.5, b), /bad pose/);
  assert.equal(
    broken.progress,
    0,
    "Failed geometry cannot commit new pose state",
  );
  assert.equal(broken.parameters, a);
}
console.log(
  "Process playback: display cadence, coalescing, pause/resume, speed, exact end and pose caching PASS",
);
