import { createBufferPreparation } from "./bufferPreparation.js";
import { createShaderPreparation as createFirstUsePreparation } from "./legacyShaderPreparation.js";

// Adapter to the existing bounded, cancellable L03 R3 preparation pipeline.
// Source helpers remain byte-identical to their retained qualification lineage.
export function createShaderPreparation(renderer) {
  const preparation = createFirstUsePreparation(renderer);
  const buffers = createBufferPreparation(renderer);
  let generation = 0,
    stopped = false,
    ready = true,
    status = "idle";
  return {
    begin(scene, camera, isCurrent = () => true) {
      const token = ++generation;
      const started = performance.now();
      ready = false;
      status = "pending";
      if (stopped) {
        ready = true;
        status = "disposed";
        return;
      }
      preparation
        .start(scene, camera, {
          isCurrent: () => !stopped && token === generation && isCurrent(),
        })
        .then(async (result) => {
          if (stopped || token !== generation || !isCurrent()) return;
          if (result.status === "ready") {
            const bufferResult = await buffers.start(scene, {
              budgetMs: Math.max(0, 15000 - (performance.now() - started)),
              isCurrent: () => !stopped && token === generation && isCurrent(),
            });
            if (stopped || token !== generation || !isCurrent()) return;
            status =
              bufferResult.status === "ready"
                ? "ready"
                : "buffer-" + bufferResult.status;
          } else status = result.status;
          // Unsupported/failed/timeout retain native render fallback; their
          // status must never be counted as successful preparation.
          ready = true;
        });
    },
    ready() {
      return ready;
    },
    get status() {
      return status;
    },
    cancel() {
      generation++;
      preparation.cancel();
      buffers.cancel();
      ready = true;
      status = "cancelled";
    },
    dispose() {
      if (stopped) return;
      stopped = true;
      generation++;
      preparation.dispose();
      buffers.dispose();
      ready = true;
      status = "disposed";
    },
  };
}
