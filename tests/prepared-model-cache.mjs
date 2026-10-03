import assert from "node:assert/strict";
import * as THREE from "three";
import { createPreparedModelCache } from "../src/scene/preparedModelCache.js";
import {
  packCell,
  unpackCell,
  disposeCell,
} from "../src/scene/cellTransfer.js";
import { packDetail, unpackDetail } from "../src/scene/detailTransfer.js";
import { createCellLoader } from "../src/scene/cellLoader.js";
import { createDetailLoader } from "../src/scene/detailLoader.js";

const tiny = createPreparedModelCache({ maxBytes: 24, maxEntries: 2 });
const shared = new ArrayBuffer(16);
const a = { first: new Float32Array(shared), second: new Uint8Array(shared) };
assert(tiny.set("a", a));
assert.equal(tiny.byteLength, 16, "Shared views must count once");
tiny.set("b", new Uint8Array(8));
assert.equal(tiny.get("a"), a);
tiny.set("c", new Uint8Array(8));
assert.equal(tiny.get("b"), undefined, "Least recently used entry must retire");
assert.equal(tiny.get("a"), a);
assert.equal(tiny.set("large", new Uint8Array(25)), false);
assert.equal(tiny.size, 2, "Oversized entry must not flush the cache");
tiny.set("a", new Uint8Array(4));
assert.equal(tiny.byteLength, 12, "Replacement must release prior accounting");
tiny.clear();
assert.equal(tiny.byteLength, 0);
tiny.set("null", null);
assert.equal(tiny.get("null"), null, "No-detail replies are reusable");

const root = new THREE.Group();
root.userData = { nested: { selected: false } };
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhysicalMaterial({ color: "#aabbcc", ior: 1.3 });
material.userData = { nested: { selected: false } };
const mesh = new THREE.Mesh(geometry, material);
mesh.userData = { nested: { selected: false } };
root.add(mesh);
const base = {
  cell: root,
  groups: {},
  parts: {},
  full: [mesh],
  anchors: {},
  resources: [],
};
const cellPayload = structuredClone(packCell(base).payload);
const detailPayload = structuredClone(packDetail(root).payload);
for (const [payload, unpack, getRoot] of [
  [cellPayload, unpackCell, (model) => model.cell],
  [detailPayload, unpackDetail, (model) => model],
]) {
  const first = unpack(payload),
    second = unpack(payload);
  const firstRoot = getRoot(first),
    secondRoot = getRoot(second);
  const left = firstRoot.children[0],
    right = secondRoot.children[0];
  assert.notEqual(left.geometry, right.geometry);
  assert.equal(
    left.geometry.attributes.position.array,
    right.geometry.attributes.position.array,
    "Immutable vertex data must not be copied",
  );
  assert.notEqual(left.material, right.material);
  firstRoot.userData.nested.selected = true;
  left.userData.nested.selected = true;
  left.material.userData.nested.selected = true;
  left.geometry.groups[0].count = 0;
  left.material.color.set("#ff0000");
  left.geometry.dispose();
  left.material.dispose();
  assert.equal(secondRoot.userData.nested.selected, false);
  assert.equal(right.userData.nested.selected, false);
  assert.equal(right.material.userData.nested.selected, false);
  assert.equal(right.geometry.groups[0].count, 6);
  assert.notEqual(right.material.color.getHex(), 0xff0000);
  const third = getRoot(unpack(payload)).children[0];
  assert.equal(
    third.userData.nested.selected,
    false,
    "Cache metadata must stay pristine",
  );
  assert.equal(third.geometry.groups[0].count, 6);
}

const originalWorker = Object.getOwnPropertyDescriptor(globalThis, "Worker");
const workers = [];
globalThis.Worker = class {
  constructor() {
    workers.push(this);
  }
  postMessage(request) {
    this.request = request;
  }
  terminate() {
    this.terminated = true;
  }
};
try {
  const cache = createPreparedModelCache();
  const first = createCellLoader({ cache });
  workers.at(-1).onmessage({ data: { payload: cellPayload } });
  const firstModel = await first.promise;
  disposeCell(firstModel);
  first.dispose();
  const count = workers.length;
  const second = createCellLoader({ cache });
  assert.equal(second.source, "prepared-cache");
  assert.equal((await second.promise).cell.children.length, 1);
  assert.equal(workers.length, count, "Cache hit must not start a worker");
  second.dispose();
  const canceled = createCellLoader({ cache });
  canceled.dispose();
  assert.equal(
    await canceled.promise,
    null,
    "Disposed cache hit must not reconstruct a scene",
  );

  const detail = createDetailLoader({ cache });
  assert.equal(workers.length, count, "Details must start lazily");
  assert.equal(await detail.load("cell"), null);
  assert.equal(await detail.load("cytoplasm"), null);
  assert.equal(
    workers.length,
    count,
    "Base views must not start a detail worker",
  );
  const firstDetail = detail.load("test-detail");
  const worker = workers.at(-1);
  worker.onmessage({
    data: { request: worker.request.request, payload: detailPayload },
  });
  assert.equal((await firstDetail).children.length, 1);
  detail.dispose();
  const warm = createDetailLoader({ cache });
  const warmCount = workers.length;
  assert.equal((await warm.load("test-detail")).children.length, 1);
  assert.equal(warm.sourceFor("test-detail"), "prepared-cache");
  assert.equal(workers.length, warmCount);
  let current = true;
  const obsolete = warm.load("obsolete", () => current);
  current = false;
  const obsoleteWorker = workers.at(-1);
  obsoleteWorker.onmessage({
    data: {
      request: obsoleteWorker.request.request,
      get payload() {
        throw new Error("Obsolete payload must not be read");
      },
    },
  });
  assert.equal(await obsolete, null);
  assert.equal(cache.get("detail:obsolete"), undefined);
  current = true;
  const failed = warm.load("failed", () => current);
  obsoleteWorker.onmessage({
    data: { request: obsoleteWorker.request.request, error: "failed" },
  });
  current = false;
  assert.equal(await failed, null);
  assert.equal(cache.get("detail:failed"), undefined);
  warm.dispose();
} finally {
  if (originalWorker)
    Object.defineProperty(globalThis, "Worker", originalWorker);
  else delete globalThis.Worker;
}
console.log(
  "Prepared model cache: byte bounds, LRU, independent scene state, lazy reuse and cancellation passed",
);
