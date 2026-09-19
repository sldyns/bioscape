import { unpackDetail } from "./detailTransfer";
export function createDetailLoader() {
  let worker = null,
    sequence = 0,
    disposed = false;
  const fallback = (id, isCurrent) => {
    if (disposed || !isCurrent()) return Promise.resolve(null);
    return import("./loadDetailModel").then(({ loadDetailModel }) =>
      disposed || !isCurrent() ? null : loadDetailModel(id),
    );
  };
  const pending = new Map();
  try {
    worker = new Worker(new URL("./detail.worker.js", import.meta.url), {
      type: "module",
    });
  } catch {
    /* Keep an exact synchronous fallback for browsers without workers. */
  }
  if (worker) {
    worker.onmessage = ({ data }) => {
      const task = pending.get(data.request);
      pending.delete(data.request);
      if (!task) return;
      try {
        // Route changes can make a large transferred model obsolete. Drop its
        // buffers before constructing Three.js objects on the main thread.
        if (disposed || !task.isCurrent()) task.resolve(null);
        else if (data.error) task.reject(new Error(data.error));
        else task.resolve(unpackDetail(data.payload));
      } catch (error) {
        task.reject(error);
      }
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      for (const task of pending.values())
        task.reject(new Error("Detail worker unavailable"));
      pending.clear();
    };
  }
  return {
    load(id, isCurrent = () => true) {
      if (disposed || !isCurrent()) return Promise.resolve(null);
      if (!worker) return fallback(id, isCurrent);
      return new Promise((resolve, reject) => {
        const request = ++sequence;
        pending.set(request, { resolve, reject, isCurrent });
        worker.postMessage({ request, id });
      }).catch(() => fallback(id, isCurrent));
    },
    dispose() {
      disposed = true;
      worker?.terminate();
      worker = null;
      for (const task of pending.values()) task.resolve(null);
      pending.clear();
    },
  };
}
