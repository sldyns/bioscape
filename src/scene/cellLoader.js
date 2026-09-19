import { unpackCell } from "./cellTransfer";
export function createCellLoader() {
  let worker = null,
    disposed = false,
    finish;
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
        if (data.error) {
          fail();
          return;
        }
        try {
          resolve(unpackCell(data.payload));
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
    promise,
    dispose() {
      disposed = true;
      worker?.terminate();
      worker = null;
      finish(null);
    },
  };
}
