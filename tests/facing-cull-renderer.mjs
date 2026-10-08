import assert from "node:assert/strict";
import {
  BackSide,
  FrontSide,
  DoubleSide,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  OrthographicCamera,
  Group,
} from "three";
import { createFacingCull } from "../src/scene/facingCull.js";

function fixture(failAllocation = false) {
  const buffers = new Map(),
    bindings = new Map(),
    calls = [],
    deleted = [];
  let next = 1,
    throwDraw = false;
  const gl = {
    ELEMENT_ARRAY_BUFFER: 1,
    ELEMENT_ARRAY_BUFFER_BINDING: 2,
    COPY_WRITE_BUFFER: 3,
    COPY_WRITE_BUFFER_BINDING: 4,
    UNSIGNED_INT: 5,
    DYNAMIC_DRAW: 6,
    BUFFER_SIZE: 7,
    isContextLost: () => false,
    createBuffer() {
      const buffer = { id: next++ };
      buffers.set(buffer, { kind: null, bytes: 0 });
      return buffer;
    },
    bindBuffer(target, buffer) {
      if (buffer) {
        const data = buffers.get(buffer);
        if (!data.kind) data.kind = target;
        assert.equal(
          data.kind,
          gl.ELEMENT_ARRAY_BUFFER,
          "first binding must establish an element buffer",
        );
      }
      bindings.set(target, buffer);
    },
    getParameter(key) {
      return bindings.get(key === 2 ? 1 : 3) || null;
    },
    bufferData(target, bytes) {
      buffers.get(bindings.get(target)).bytes = failAllocation ? 0 : bytes;
    },
    getBufferParameter(target) {
      return buffers.get(bindings.get(target)).bytes;
    },
    bufferSubData(target, offset, data, start, count) {
      const buffer = buffers.get(bindings.get(target));
      assert.ok(offset + count * 4 <= buffer.bytes);
      assert.ok(count <= 256 * 1024, "upload budget");
      buffer.uploads ||= [];
      buffer.uploads.push(data.slice(start, start + count));
    },
    deleteBuffer(buffer) {
      assert.ok(!deleted.includes(buffer), "no double deletion");
      deleted.push(buffer);
    },
  };
  const renderer = {
    getContext: () => gl,
    renderBufferDirect(camera, scene, geometry, material) {
      assert.equal(this, renderer);
      calls.push({
        index: geometry.index,
        range: { ...geometry.drawRange },
        side: material.side,
      });
      if (throwDraw) throw Error("draw failure");
    },
  };
  const original = renderer.renderBufferDirect;
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3),
  );
  const array = new Uint32Array(120000);
  for (let i = 0; i < array.length; i++) array[i] = i % 3;
  geometry.setIndex(new BufferAttribute(array, 1));
  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({ transparent: true, side: DoubleSide }),
  );
  mesh.userData.hitId = "paraMito";
  const root = new Group();
  root.add(mesh);
  root.updateMatrixWorld(true);
  const camera = new PerspectiveCamera();
  camera.position.set(0, 0, 10);
  camera.updateMatrixWorld(true);
  const manager = createFacingCull(renderer);
  return {
    manager,
    renderer,
    geometry,
    mesh,
    root,
    camera,
    calls,
    deleted,
    gl,
    buffers,
    original,
    setThrow: (v) => {
      throwDraw = v;
    },
  };
}
const f = fixture(),
  originalIndex = f.geometry.index,
  originalRange = f.geometry.drawRange;
f.manager.setRoot(f.root, "animal");
assert.equal(f.manager.stats().records, 0);
f.manager.setRoot(f.root, "paramecium");
const draw = (side, camera = f.camera, material = f.mesh.material) => {
  material.side = side;
  f.renderer.renderBufferDirect(
    camera,
    null,
    f.geometry,
    material,
    f.mesh,
    null,
  );
  assert.equal(f.geometry.index, originalIndex);
  assert.equal(f.geometry.drawRange, originalRange);
  return f.calls.at(-1);
};
assert.equal(draw(BackSide).index, originalIndex, "unprepared uses original");
for (let i = 0; i < 2000; i++) f.manager.step(f.camera);
assert.equal(
  draw(BackSide).range.count,
  0,
  "all front-facing triangles omitted only from back pass",
);
assert.equal(draw(FrontSide).range.count, originalIndex.count);
assert.ok(f.calls.at(-1).index.isGLBufferAttribute);
const uploads = [...f.buffers.values()].flatMap((b) => b.uploads || []);
assert.deepEqual(
  uploads.flatMap((a) => [...a]),
  [...originalIndex.array],
  "kept indices retain exact order and values",
);
assert.equal(f.gl.getParameter(f.gl.COPY_WRITE_BUFFER_BINDING), null);
assert.equal(f.gl.getParameter(f.gl.ELEMENT_ARRAY_BUFFER_BINDING), null);
f.setThrow(true);
assert.throws(() => draw(FrontSide), /draw failure/);
assert.equal(f.geometry.index, originalIndex);
assert.equal(f.geometry.drawRange, originalRange);
f.setThrow(false);
assert.equal(draw(BackSide, new OrthographicCamera()).index, originalIndex);
assert.equal(
  draw(BackSide, f.camera, new MeshBasicMaterial()).index,
  originalIndex,
  "shadow material bypass",
);
f.camera.position.set(0, 0, -10);
f.camera.updateMatrixWorld(true);
assert.equal(
  draw(FrontSide).index,
  originalIndex,
  "sudden camera jump falls back",
);
for (let i = 0; i < 2000; i++) f.manager.step(f.camera);
assert.equal(draw(FrontSide).range.count, 0);
f.mesh.material.side = DoubleSide;
f.manager.setRoot(null, "paraMito");
f.manager.setRoot(f.root, "paramecium");
assert.equal(
  f.manager.stats().records,
  1,
  "cache reentry does not duplicate buffers",
);
f.geometry.attributes.position.needsUpdate = true;
assert.equal(
  draw(BackSide).index,
  originalIndex,
  "changed source positions bypass stale plan",
);
f.geometry.dispose();
assert.equal(f.manager.stats().records, 0);
assert.equal(f.deleted.length, 2);
f.manager.dispose();
f.manager.dispose();
assert.equal(f.renderer.renderBufferDirect, f.original);
const failed = fixture(true);
failed.manager.setRoot(failed.root, "paramecium");
for (let i = 0; i < 2000; i++) failed.manager.step(failed.camera);
assert.equal(failed.manager.stats().records, 0);
assert.equal(failed.deleted.length, 1);
failed.manager.dispose();
console.log(
  "facing-cull renderer: pass order, bounded uploads, original fallback, exception restoration, source changes, cache reentry and cleanup passed",
);
