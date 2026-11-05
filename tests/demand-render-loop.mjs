import assert from "node:assert/strict";
import { createDemandRenderLoop } from "../src/scene/demandRenderLoop.js";

function fixture() {
  let next = 0,
    visible = true,
    moving = false;
  const frames = new Map(),
    rendered = [];
  const loop = createDemandRenderLoop({
    canRun: () => visible,
    requestFrame(callback) {
      const id = next++;
      frames.set(id, callback);
      return id;
    },
    cancelFrame: (id) => frames.delete(id),
    render(time) {
      rendered.push(time);
      loop.request();
      if (!moving) loop.cancelPending();
    },
  });
  return {
    loop,
    frames,
    rendered,
    visible: (value) => (visible = value),
    moving: (value) => (moving = value),
    tick(time) {
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback(time);
    },
  };
}

const f = fixture();
f.loop.request();
assert.equal(
  f.frames.size,
  0,
  "setup invalidation does not start an unowned loop",
);
f.loop.start();
for (let i = 0; i < 20; i++) f.loop.request();
assert.equal(
  f.frames.size,
  1,
  "repeated invalidation coalesces, including RAF id 0",
);
f.tick(10);
assert.deepEqual(f.rendered, [10]);
assert.equal(f.frames.size, 0, "settled rendering leaves no idle callbacks");

f.moving(true);
f.loop.request();
for (const time of [20, 30, 40]) {
  f.tick(time);
  assert.equal(
    f.frames.size,
    1,
    "motion retains the next rendering opportunity",
  );
}
f.moving(false);
f.tick(50);
assert.equal(f.frames.size, 0);

f.visible(false);
f.loop.request();
assert.equal(f.frames.size, 0, "hidden scenes do not queue work");
f.visible(true);
f.loop.request();
f.visible(false);
f.tick(60);
assert.equal(f.rendered.at(-1), 50, "a newly hidden scene is not rendered");
f.visible(true);
f.loop.request();
f.tick(70);
assert.equal(
  f.rendered.at(-1),
  70,
  "visibility restoration can wake an idle loop",
);

f.loop.request();
const late = [...f.frames.values()][0];
f.loop.dispose();
f.loop.dispose();
f.loop.start();
f.loop.request();
late(80);
assert.equal(
  f.frames.size,
  0,
  "disposed loops cannot be restarted by late work",
);
assert.equal(f.rendered.at(-1), 70);

const cancelledSetup = fixture();
cancelledSetup.loop.dispose();
cancelledSetup.loop.start();
assert.equal(cancelledSetup.frames.size, 0, "failed setup never starts a loop");

console.log(
  "Demand render loop: setup ownership, coalescing, idle, motion, hidden/resume and late disposal passed",
);
