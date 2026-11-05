import { createCellLoader } from "./cellLoader.js";
import { disposeCell } from "./cellTransfer.js";

// A completed base cell can serve many views. Only its unfinished construction
// is retired when a standalone or already-cached view no longer needs it.
export function createCellModelResource({
  createLoader = createCellLoader,
  disposeModel = disposeCell,
} = {}) {
  let request = null,
    value = null,
    disposed = false;
  return {
    get value() {
      return value;
    },
    get source() {
      return request?.loader?.source ?? "build";
    },
    load() {
      if (disposed) return Promise.resolve(null);
      if (request) return request.promise;
      const owner = { loader: null, promise: null };
      request = owner;
      owner.promise = Promise.resolve()
        .then(() => {
          if (disposed || request !== owner) return null;
          owner.loader = createLoader();
          // A factory can synchronously trigger disposal before returning.
          if (disposed || request !== owner) owner.loader.dispose();
          return owner.loader.promise;
        })
        .then(
          (model) => {
            if (disposed || request !== owner) {
              if (model) disposeModel(model);
              return null;
            }
            value = model;
            return model;
          },
          (error) => {
            if (disposed || request !== owner) return null;
            throw error;
          },
        );
      return owner.promise;
    },
    cancelPending() {
      if (value || !request) return false;
      const previous = request;
      request = null;
      previous.loader?.dispose();
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const previous = request,
        ready = value;
      request = null;
      value = null;
      try {
        previous?.loader?.dispose();
      } finally {
        if (ready) disposeModel(ready);
      }
    },
  };
}
