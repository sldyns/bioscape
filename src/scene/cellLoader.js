import { unpackCell } from "./cellTransfer.js";
import { preparedModelCache } from "./preparedModelCache.js";
export function createCellLoader({ cache = preparedModelCache } = {}) {
  let worker = null,
    disposed = false,
    finish;
  const cached = cache.get("cell");
  if (cached !== undefined)
    return {
      source: "prepared-cache",
      promise: Promise.resolve().then(() =>
        disposed ? null : unpackCell(cached),
      ),
      dispose() {
        disposed = true;
      },
    };
  const fallback = () =>
    import("./buildCell").then(({ buildCell }) =>
      disposed ? null : buildCell(),
    );
  const promise = new Promise((resolve, reject) => {
    finish = resolve;
    const fail = () => {
      worker?.terminate();
      worker = null;
      if (!disposed) fallback().then(resolve, reject);
    };
    try {
      worker = new Worker(new URL("./cell.worker.js", import.meta.url), {
        type: "module",
      });
      worker.onerror = fail;
      worker.onmessage = ({ data }) => {
        if (disposed) return;
        if (data.error) {
          fail();
          return;
        }
        try {
          const model = unpackCell(data.payload);
          cache.set("cell", data.payload);
          resolve(model);
          worker.terminate();
          worker = null;
        } catch {
          fail();
        }
      };
      worker.postMessage({});
    } catch {
      fail();
    }
  });
  return {
    source: "build",
    promise,
    dispose() {
      disposed = true;
      worker?.terminate();
      worker = null;
      finish(null);
    },
  };
}
