import assert from "node:assert/strict";
import { createRenderTurnQueue } from "../src/scene/renderTurnQueue.js";
let checks = 0;
const equal = (a, b) => {
  assert.deepEqual(a, b);
  checks++;
};
function harness(extra = {}) {
  const frames = new Map(),
    tasks = [],
    events = [];
  let next = 0;
  const opts = {
    canRender: () => true,
    requestFrame: (fn) => {
      const id = ++next;
      frames.set(id, fn);
      return id;
    },
    cancelFrame: (id) => frames.delete(id),
    scheduleTask: (fn, reject) => {
      const task = { fn, reject, live: true };
      tasks.push(task);
      return () => (task.live = false);
    },
    ...extra,
  };
  const queue = createRenderTurnQueue(opts);
  return {
    frames,
    tasks,
    events,
    queue,
    frame() {
      const [id, fn] = frames.entries().next().value;
      frames.delete(id);
      fn();
    },
    task() {
      const t = tasks.shift();
      if (t.live) t.fn();
    },
  };
}
let h = harness();
h.queue.schedule(() => h.events.push("A"));
h.queue.schedule(() => h.events.push("B"));
h.queue.schedule(() => h.events.push("C"));
equal(h.frames.size, 1);
h.frame();
equal(h.tasks.length, 1);
equal(h.frames.size, 0);
h.task();
equal(h.events, ["A"]);
equal(h.frames.size, 1);
h.frame();
h.task();
equal(h.events, ["A", "B"]);
h.frame();
h.task();
equal(h.events, ["A", "B", "C"]);
equal(h.frames.size, 0);
h = harness();
const cancelA = h.queue.schedule(() => h.events.push("A"));
const cancelB = h.queue.schedule(() => h.events.push("B"));
cancelA();
equal(h.frames.size, 1);
h.frame();
h.task();
equal(h.events, ["B"]);
cancelB();
equal(h.frames.size, 0);
h = harness();
const cancel = h.queue.schedule(() => h.events.push("A"));
equal(h.frames.size, 1);
cancel();
cancel();
equal(h.frames.size, 0);
equal(h.tasks.length, 0);
h = harness();
const cancelPending = h.queue.schedule(() => h.events.push("A"));
h.queue.schedule(() => h.events.push("B"));
h.frame();
cancelPending();
equal(h.tasks[0].live, false);
equal(h.frames.size, 1);
h.task();
equal(h.events, []);
h.frame();
h.task();
equal(h.events, ["B"]);
h = harness();
h.queue.schedule(() => {
  h.events.push("A");
  h.queue.schedule(() => h.events.push("B"));
  equal(h.frames.size, 0);
});
h.frame();
h.task();
equal(h.frames.size, 1);
h.frame();
h.task();
equal(h.events, ["A", "B"]);
const failure = Error("expected");
let seen = [];
h = harness({
  scheduleTask: () => {
    throw failure;
  },
});
h.queue.schedule(
  () => {},
  (e) => seen.push(e),
);
h.frame();
equal(seen, [failure]);
equal(h.frames.size, 0);
h.queue.schedule(
  () => {},
  (e) => seen.push(e),
);
h.frame();
equal(seen, [failure, failure]);
h = harness();
seen = [];
h.queue.schedule(
  () => {},
  (e) => seen.push(e),
);
h.frame();
const task = h.tasks.shift();
task.reject(failure);
equal(seen, [failure]);
equal(h.frames.size, 0);
h = harness();
h.queue.schedule(() => {
  throw failure;
});
h.queue.schedule(() => h.events.push("B"));
h.frame();
assert.throws(
  () => h.task(),
  (e) => e === failure,
);
checks++;
equal(h.frames.size, 1);
h.frame();
h.task();
equal(h.events, ["B"]);
let requested = 0;
const q = createRenderTurnQueue({
  canRender: () => false,
  requestFrame: () => requested++,
  scheduleTask: (fn) => {
    fn();
    return () => {};
  },
});
let ran = 0;
q.schedule(() => ran++);
equal(ran, 1);
equal(requested, 0);
const throwing = createRenderTurnQueue({
  canRender: () => true,
  requestFrame: () => {
    throw failure;
  },
  scheduleTask: () => {},
});
assert.throws(
  () => throwing.schedule(() => {}),
  (e) => e === failure,
);
checks++;
console.log(
  JSON.stringify({
    status: "PASS",
    checks,
    scope:
      "Shared queue one continuation per render-turn, FIFO order, queued/pending/last cancellation, reentrant queueing, scheduling failure, callback throw and no-rAF fallback. Controlled schedulers, not native timing.",
  }),
);
