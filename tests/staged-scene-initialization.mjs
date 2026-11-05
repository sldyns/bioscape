import assert from "node:assert/strict";
import { deferStagedSceneInitialization as start } from "../src/scene/stagedSceneInitialization.js";
let checks = 0;
function equal(a, b) {
  assert.deepEqual(a, b);
  checks++;
}
function harness() {
  const first = [],
    second = [],
    events = [];
  let released = 0,
    completed = 0,
    seen = [];
  const value = {};
  const opts = {
    schedule: (f) => {
      first.push(f);
      return () => events.push("cancel-first");
    },
    scheduleContinuation: (f) => {
      second.push(f);
      return () => events.push("cancel-second");
    },
    onError: (e) => seen.push(e),
  };
  return {
    first,
    second,
    events,
    value,
    opts,
    seen,
    release: (r) => {
      equal(r, value);
      released++;
    },
    get released() {
      return released;
    },
    get completed() {
      return completed;
    },
    setup: (r) => {
      equal(r, value);
      events.push("setup");
      return () => completed++;
    },
  };
}
let h = harness(),
  job = start(() => h.value, h.setup, h.release, h.opts);
equal(job.state, "pending");
job.dispose();
h.first.shift()();
equal(job.state, "disposed");
equal(h.released, 0);
equal(h.second.length, 0);
h = harness();
job = start(() => h.value, h.setup, h.release, h.opts);
h.first.shift()();
equal(job.state, "waiting");
equal(h.events, []);
job.dispose();
job.dispose();
h.second.shift()();
equal(h.released, 1);
equal(h.completed, 0);
equal(job.state, "disposed");
h = harness();
job = start(() => h.value, h.setup, h.release, h.opts);
h.first.shift()();
h.second.shift()();
equal(job.state, "ready");
equal(h.released, 0);
job.dispose();
job.dispose();
equal(h.completed, 1);
equal(h.released, 0);
h = harness();
job = start(
  () => {
    job.dispose();
    return h.value;
  },
  h.setup,
  h.release,
  h.opts,
);
h.first.shift()();
equal(job.state, "disposed");
equal(h.released, 1);
equal(h.second.length, 0);
h = harness();
job = start(
  () => h.value,
  (r) => {
    job.dispose();
    equal(h.released, 0);
    return () => h.events.push("full-release");
  },
  h.release,
  h.opts,
);
h.first.shift()();
h.second.shift()();
equal(job.state, "disposed");
equal(h.released, 0);
equal(h.events, ["full-release"]);
job.dispose();
equal(h.events, ["full-release"]);
const failure = Error("expected");
for (const mode of [
  "create",
  "setup",
  "first-schedule",
  "continuation-schedule",
]) {
  h = harness();
  if (mode === "first-schedule")
    h.opts.schedule = () => {
      throw failure;
    };
  if (mode === "continuation-schedule")
    h.opts.scheduleContinuation = () => {
      throw failure;
    };
  job = start(
    () => {
      if (mode === "create") throw failure;
      return h.value;
    },
    () => {
      throw failure;
    },
    h.release,
    h.opts,
  );
  h.first.shift()?.();
  h.second.shift()?.();
  equal(job.state, "failed");
  equal(h.seen, [failure]);
  equal(h.released, ["setup", "continuation-schedule"].includes(mode) ? 1 : 0);
  job.dispose();
  equal(job.state, "disposed");
}
h = harness();
job = start(
  () => h.value,
  () => {
    job.dispose();
    throw failure;
  },
  h.release,
  h.opts,
);
h.first.shift()();
h.second.shift()();
equal(job.state, "disposed");
equal(h.released, 1);
equal(h.seen, [failure]);
for (const value of [null, undefined]) {
  h = harness();
  job = start(() => value, h.setup, h.release, h.opts);
  h.first.shift()();
  equal(job.state, "ready");
  equal(h.second.length, 0);
  equal(h.released, 0);
  job.dispose();
}
h = harness();
job = start(
  () => h.value,
  () => undefined,
  h.release,
  h.opts,
);
h.first.shift()();
h.second.shift()();
equal(h.released, 1);
job.dispose();
equal(h.released, 1);
h = harness();
job = start(() => h.value, h.setup, h.release, {
  ...h.opts,
  schedule: (f) => {
    f();
    return () => h.events.push("first-cancel");
  },
});
equal(job.state, "waiting");
job.dispose();
equal(h.events, ["cancel-second"]);
equal(h.released, 1);
h.second.shift()();
equal(h.completed, 0);
h = harness();
job = start(() => h.value, h.setup, h.release, {
  ...h.opts,
  schedule: (f) => {
    f();
    return () => {};
  },
  scheduleContinuation: (f) => {
    f();
    return () => {};
  },
});
equal(job.state, "ready");
job.dispose();
equal(h.completed, 1);
// Real native MessageChannel followed by fallback scheduling without rAF in Node.
await new Promise((resolve, reject) => {
  const value = {};
  let released = 0;
  const j = start(
    () => value,
    (r) => {
      try {
        equal(r, value);
      } catch (e) {
        reject(e);
      }
      setTimeout(() => {
        try {
          equal(j.state, "ready");
          j.dispose();
          equal(released, 1);
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 0);
      return () => released++;
    },
    () => reject(Error("unexpected partial release")),
    { onError: reject },
  );
});
console.log(
  JSON.stringify({
    status: "PASS",
    checks,
    scope:
      "Resource ownership and lifecycle; deterministic scheduler injection plus real MessageChannel/fallback. No browser frame/visual qualification.",
  }),
);
const previousRAF = globalThis.requestAnimationFrame,
  previousCancelRAF = globalThis.cancelAnimationFrame;
try {
  let frames = new Map(),
    nextFrame = 0;
  globalThis.requestAnimationFrame = (fn) => {
    const id = ++nextFrame;
    frames.set(id, fn);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  h = harness();
  job = start(() => h.value, h.setup, h.release, {
    ...h.opts,
    scheduleContinuation: undefined,
  });
  h.first.shift()();
  equal(job.state, "waiting");
  equal(frames.size, 1);
  job.dispose();
  equal(frames.size, 0);
  equal(h.released, 1);
  await new Promise((resolve, reject) => {
    h = harness();
    job = start(
      () => h.value,
      (r) => {
        equal(r, h.value);
        setTimeout(() => {
          try {
            equal(job.state, "ready");
            job.dispose();
            equal(h.completed, 1);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 0);
        return h.setup(r);
      },
      h.release,
      { ...h.opts, scheduleContinuation: undefined, onError: reject },
    );
    h.first.shift()();
    equal(job.state, "waiting");
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((f) => f());
    equal(job.state, "waiting");
  });
} finally {
  if (previousRAF === undefined) delete globalThis.requestAnimationFrame;
  else globalThis.requestAnimationFrame = previousRAF;
  if (previousCancelRAF === undefined) delete globalThis.cancelAnimationFrame;
  else globalThis.cancelAnimationFrame = previousCancelRAF;
}
console.log(JSON.stringify({ status: "PASS_INCLUDING_RAF", checks }));
