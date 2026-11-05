import assert from "node:assert/strict";
import test from "node:test";
import {
  createProcessFramingPreparation,
  createProcessFramingTaskQueue,
} from "../src/processes/framingPreparation.js";

function fixture(options = {}) {
  const tasks = [];
  const queues = [];
  const clock = { value: 0 };
  const preparation = createProcessFramingPreparation({
    now: () => clock.value,
    makeTaskQueue() {
      const state = { closed: false, scheduled: 0, disposed: 0 };
      queues.push(state);
      return {
        schedule(callback) {
          assert.equal(state.closed, false);
          state.scheduled++;
          tasks.push(() => {
            if (!state.closed) callback();
          });
        },
        dispose() {
          state.closed = true;
          state.disposed++;
        },
      };
    },
    ...options,
  });
  return {
    preparation,
    tasks,
    queues,
    clock,
    next() {
      const callback = tasks.shift();
      assert(callback);
      callback();
    },
    flush() {
      let count = 0;
      while (tasks.length) {
        assert(++count < 1000);
        this.next();
      }
    },
  };
}

test("all parameter and progress samples retain their original order and identity", async () => {
  const f = fixture(),
    a = { calcium: "normal" },
    b = { calcium: "blocked" };
  const steps = [a, b].flatMap((parameters) =>
    [0, 0.125, 0.4, 1].map((value) => ({ value, parameters })),
  );
  const calls = [];
  const promise = f.preparation.start(steps, (step) => {
    calls.push(step);
    f.clock.value += 3;
  });
  assert.equal(
    calls.length,
    0,
    "Construction must leave an opportunity before its first sampling task",
  );
  f.flush();
  assert.deepEqual(await promise, { status: "ready", completed: 8 });
  assert.deepEqual(calls, steps);
  for (let i = 0; i < steps.length; i++) assert.equal(calls[i], steps[i]);
  assert.equal(f.queues[0].disposed, 1);
  assert.equal(f.preparation.pending, false);
});

test("budget yields between complete samples without dropping or repeating one", async () => {
  const f = fixture(),
    calls = [];
  const promise = f.preparation.start([0, 1, 2, 3, 4], (value) => {
    calls.push(value);
    f.clock.value += 2.5;
  });
  f.next();
  assert.deepEqual(calls, [0, 1]);
  assert.equal(f.preparation.pending, true);
  f.next();
  assert.deepEqual(calls, [0, 1, 2, 3]);
  f.next();
  assert.equal((await promise).completed, 5);
  assert.equal(f.tasks.length, 0);
});

test("one indivisible expensive pose completes before yielding", async () => {
  const f = fixture(),
    calls = [];
  const promise = f.preparation.start([0, 1], (value) => {
    calls.push(value);
    f.clock.value += 19;
  });
  f.next();
  assert.deepEqual(calls, [0]);
  f.next();
  assert.equal((await promise).status, "ready");
  assert.deepEqual(calls, [0, 1]);
});

test("navigation before the first task performs no model or bounds access", async () => {
  const f = fixture();
  let current = true;
  const promise = f.preparation.start(
    [0, 1],
    () => assert.fail("Obsolete model access"),
    { isCurrent: () => current },
  );
  current = false;
  f.flush();
  assert.deepEqual(await promise, { status: "cancelled", completed: 0 });
});

test("navigation between chunks retires remaining work and closes its queue", async () => {
  const f = fixture(),
    calls = [];
  let current = true;
  const promise = f.preparation.start(
    [0, 1, 2],
    (value) => {
      calls.push(value);
      f.clock.value += 5;
    },
    { isCurrent: () => current },
  );
  f.next();
  current = false;
  f.flush();
  assert.deepEqual(calls, [0]);
  assert.deepEqual(await promise, { status: "cancelled", completed: 1 });
  assert.equal(f.queues[0].disposed, 1);
});

test("explicit cancellation prevents a previously queued callback from touching its owner", async () => {
  const f = fixture();
  const promise = f.preparation.start([0], () =>
    assert.fail("Cancelled owner access"),
  );
  f.preparation.cancel("context-lost");
  f.flush();
  assert.deepEqual(await promise, { status: "context-lost", completed: 0 });
  assert.equal(f.preparation.pending, false);
});

test("disposal while a partial task is pending is idempotent", async () => {
  const f = fixture(),
    calls = [];
  const promise = f.preparation.start([0, 1], (value) => {
    calls.push(value);
    f.clock.value += 5;
  });
  f.next();
  f.preparation.dispose();
  f.preparation.dispose();
  f.flush();
  assert.deepEqual(calls, [0]);
  assert.deepEqual(await promise, { status: "disposed", completed: 1 });
  assert.equal(f.queues[0].disposed, 1);
});

test("disposed owners cannot allocate another queue or start another model", async () => {
  const f = fixture();
  f.preparation.dispose();
  assert.deepEqual(
    await f.preparation.start([0], () => assert.fail("Disposed access")),
    { status: "cancelled", completed: 0 },
  );
  assert.equal(f.queues.length, 0);
});

test("superseding a partial job preserves only the new job's ownership", async () => {
  const f = fixture(),
    calls = [];
  const old = f.preparation.start(["old0", "old1"], (value) => {
    calls.push(value);
    f.clock.value += 5;
  });
  f.next();
  const fresh = f.preparation.start(["new0"], (value) => calls.push(value));
  f.flush();
  assert.deepEqual(calls, ["old0", "new0"]);
  assert.equal((await old).status, "superseded");
  assert.equal((await fresh).status, "ready");
  assert.equal(f.queues[0].disposed, 1);
  assert.equal(f.queues[1].disposed, 1);
});

test("a sample that synchronously cancels itself cannot queue later work", async () => {
  const f = fixture(),
    calls = [];
  const promise = f.preparation.start([0, 1], (value) => {
    calls.push(value);
    f.preparation.cancel();
  });
  f.flush();
  assert.deepEqual(calls, [0]);
  assert.equal((await promise).status, "cancelled");
});

test("a sample that synchronously starts a replacement cannot erase its new owner", async () => {
  const f = fixture(),
    calls = [];
  let replacement;
  const old = f.preparation.start([0, 1], (value) => {
    calls.push(value);
    replacement = f.preparation.start([2], (value) => calls.push(value));
  });
  f.flush();
  assert.deepEqual(calls, [0, 2]);
  assert.equal((await old).status, "superseded");
  assert.equal((await replacement).status, "ready");
  assert.equal(f.preparation.pending, false);
});

test("a failed sample reports failure and performs no later model accesses", async () => {
  const f = fixture(),
    calls = [];
  const promise = f.preparation.start([0, 1, 2], (value) => {
    calls.push(value);
    if (value === 1) throw Error("Controlled update or bounds failure");
  });
  f.flush();
  const result = await promise;
  assert.equal(result.status, "failed");
  assert.equal(result.completed, 1);
  assert.match(result.error, /Controlled/);
  assert.deepEqual(calls, [0, 1]);
  assert.equal(f.queues[0].disposed, 1);
});

test("queue construction and scheduling failures settle rather than hanging", async () => {
  for (const makeTaskQueue of [
    () => {
      throw Error("queue construction");
    },
    () => ({
      schedule() {
        throw Error("queue scheduling");
      },
      dispose() {},
    }),
  ]) {
    const f = fixture({ makeTaskQueue });
    const result = await f.preparation.start([0], () =>
      assert.fail("Broken queue cannot sample"),
    );
    assert.equal(result.status, "failed");
    assert.equal(f.preparation.pending, false);
  }
});

test("empty samples and invalid budgets never allocate a queue or touch the model", async () => {
  const f = fixture();
  assert.deepEqual(
    await f.preparation.start([], () => assert.fail("Empty model access")),
    { status: "ready", completed: 0 },
  );
  assert.equal(f.queues.length, 0);
  for (const budgetMs of [0, -1, Infinity, NaN]) {
    const invalid = fixture({ budgetMs });
    assert.equal(
      (
        await invalid.preparation.start([0], () =>
          assert.fail("Invalid budget access"),
        )
      ).status,
      "failed",
    );
    assert.equal(invalid.queues.length, 0);
  }
});

test("the real task queue is asynchronous and closes after completion", async () => {
  const preparation = createProcessFramingPreparation();
  let called = false;
  const promise = preparation.start([0], () => {
    called = true;
  });
  assert.equal(called, false);
  assert.equal((await promise).status, "ready");
  assert.equal(called, true);
  preparation.dispose();
});

test("the real queue rejects duplicate ownership and ignores a canceled callback", async () => {
  const queue = createProcessFramingTaskQueue();
  queue.schedule(() => assert.fail("Closed queue callback"));
  assert.throws(() => queue.schedule(() => {}), /unavailable/);
  queue.dispose();
  queue.dispose();
  assert.throws(() => queue.schedule(() => {}), /unavailable/);
  await new Promise((resolve) => setTimeout(resolve, 0));
});
