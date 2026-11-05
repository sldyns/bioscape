import assert from "node:assert/strict";
import { deferSceneInitialization } from "../src/scene/sceneInitialization.js";
let checks = 0;
let tasks = [],
  cancels = 0,
  calls = 0,
  releases = 0;
const schedule = (fn) => {
  tasks.push(fn);
  return () => cancels++;
};
let a = deferSceneInitialization(
  () => {
    calls++;
    return () => releases++;
  },
  { schedule },
);
assert.equal(a.state, "pending");
assert.equal(calls, 0);
tasks.shift()();
assert.equal(a.state, "ready");
assert.equal(calls, 1);
a.dispose();
a.dispose();
assert.equal(releases, 1);
assert.equal(a.state, "disposed");
checks += 6;
a = deferSceneInitialization(() => calls++, { schedule });
a.dispose();
tasks.shift()();
assert.equal(calls, 1);
assert.equal(a.state, "disposed");
checks += 2;
a = deferSceneInitialization(
  () => {
    a.dispose();
    return () => releases++;
  },
  { schedule },
);
tasks.shift()();
assert.equal(a.state, "disposed");
assert.equal(releases, 2);
a.dispose();
assert.equal(releases, 2);
checks += 3;
const error = Error("owned error");
let seen;
a = deferSceneInitialization(
  () => {
    throw error;
  },
  { schedule, onError: (e) => (seen = e) },
);
tasks.shift()();
assert.equal(seen, error);
assert.equal(a.state, "failed");
a.dispose();
checks += 2;
a = deferSceneInitialization(() => {}, {
  schedule() {
    throw error;
  },
  onError: (e) => (seen = e),
});
assert.equal(a.state, "failed");
assert.equal(seen, error);
checks += 2;
await new Promise((resolve, reject) => {
  let task;
  task = deferSceneInitialization(
    () => {
      setTimeout(() => {
        try {
          assert.equal(task.state, "ready");
          task.dispose();
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 0);
    },
    { onError: reject },
  );
});
checks++;
console.log("PASS", checks);
