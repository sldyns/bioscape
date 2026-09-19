import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";

// Build exact triangle acceleration off-thread. Render buffers are never transferred
// or reordered, and standard Three.js picking remains available until a tree is ready.
export function createPickingIndex() {
  let worker = null,
    queue = [],
    pending = null,
    stopped = false;
  const disposed = new WeakSet(),
    tracked = new WeakSet();
  try {
    worker = new Worker(new URL("./picking.worker.js", import.meta.url), {
      type: "module",
    });
  } catch {
    /* Exact built-in picking remains available. */
  }
  function next() {
    if (!worker || pending || stopped) return;
    while (queue.length) {
      const geometry = queue.shift();
      if (disposed.has(geometry) || geometry.boundsTree) continue;
      pending = geometry;
      const position = geometry.attributes.position.array.slice(),
        index = geometry.index?.array.slice();
      const transfers = [position.buffer];
      if (index) transfers.push(index.buffer);
      worker.postMessage(
        {
          position,
          index,
          groups: geometry.groups,
          drawRange: geometry.drawRange,
        },
        transfers,
      );
      break;
    }
  }
  if (worker) {
    worker.onmessage = ({ data }) => {
      const geometry = pending;
      pending = null;
      if (geometry && !disposed.has(geometry) && data.packed)
        geometry.boundsTree = MeshBVH.deserialize(data.packed, geometry, {
          setIndex: false,
        });
      next();
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      queue = [];
      pending = null;
    };
  }
  return {
    prepare(meshes) {
      const geometries = new Set();
      for (const mesh of meshes) {
        if (
          mesh.isInstancedMesh ||
          mesh.geometry.attributes.position.count < 1800
        )
          continue;
        mesh.raycast = acceleratedRaycast;
        const geometry = mesh.geometry;
        geometries.add(geometry);
        if (!tracked.has(geometry)) {
          tracked.add(geometry);
          geometry.addEventListener("dispose", () => {
            disposed.add(geometry);
            geometry.boundsTree = null;
          });
        }
      }
      queue = [...geometries]
        .filter((g) => g !== pending && !g.boundsTree)
        .sort(
          (a, b) => b.attributes.position.count - a.attributes.position.count,
        );
      next();
    },
    dispose() {
      stopped = true;
      worker?.terminate();
      worker = null;
      queue = [];
      pending = null;
    },
  };
}
