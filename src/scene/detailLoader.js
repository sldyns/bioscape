import { unpackDetail } from "./detailTransfer.js";
import { preparedModelCache } from "./preparedModelCache.js";
export function createDetailLoader({ cache = preparedModelCache } = {}) {
  let worker = null,
    sequence = 0,
    disposed = false,
    workerUnavailable = false;
  const sources = new Map();
  const fallback = (id, isCurrent) => {
    if (disposed || !isCurrent()) return Promise.resolve(null);
    return import("./loadDetailModel").then(({ loadDetailModel }) =>
      disposed || !isCurrent() ? null : loadDetailModel(id),
    );
  };
  const pending = new Map();
  function ensureWorker() {
    if (worker || workerUnavailable) return;
    try {
      worker = new Worker(new URL("./detail.worker.js", import.meta.url), {
        type: "module",
      });
    } catch {
      workerUnavailable = true;
      return;
    }
    worker.onmessage = ({ data }) => {
      const task = pending.get(data.request);
      pending.delete(data.request);
      if (!task) return;
      try {
        // Obsolete replies must be dropped before unpacking or retaining buffers.
        if (disposed || !task.isCurrent()) task.resolve(null);
        else if (data.error) task.reject(new Error(data.error));
        else {
          const model = unpackDetail(data.payload);
          cache.set(`detail:${task.id}`, data.payload);
          task.resolve(model);
        }
      } catch (error) {
        task.reject(error);
      }
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      workerUnavailable = true;
      for (const task of pending.values())
        task.reject(new Error("Detail worker unavailable"));
      pending.clear();
    };
  }
  return {
    sourceFor(id) {
      return sources.get(id) ?? "build";
    },
    load(id, isCurrent = () => true) {
      if (disposed || !isCurrent()) return Promise.resolve(null);
      // These views use the base cell; do not load an entire detail worker just
      // to discover that it has no standalone model for them.
      if (id === "cell" || id === "cytoplasm") return Promise.resolve(null);
      const cached = cache.get(`detail:${id}`);
      if (cached !== undefined) {
        sources.set(id, "prepared-cache");
        return Promise.resolve().then(() =>
          disposed || !isCurrent() ? null : unpackDetail(cached),
        );
      }
      sources.set(id, "build");
      ensureWorker();
      if (!worker) return fallback(id, isCurrent);
      return new Promise((resolve, reject) => {
        const request = ++sequence;
        pending.set(request, { resolve, reject, isCurrent, id });
        try {
          worker.postMessage({ request, id });
        } catch (error) {
          pending.delete(request);
          reject(error);
        }
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
