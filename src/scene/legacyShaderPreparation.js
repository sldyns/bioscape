import { createProgramFirstUsePreparation } from "./firstUsePreparation.js";

// QA R3 candidate: original readiness plus cancellable first-use tasks.
// Tied to the installed Three r180 program-readiness/cache contracts.
// Like compileAsync, compile with the final scene lights/environment first.
// Unlike compileAsync, stop polling before route changes or resource disposal.
export function createShaderPreparation(
  renderer,
  {
    schedule = setTimeout,
    unschedule = clearTimeout,
    now = () => performance.now(),
    timeoutMs = 15000,
    onEvent = () => {},
    makeFirstUseTaskQueue,
  } = {},
) {
  let active = null;
  let disposed = false;
  const emit = (event) => onEvent(event);
  function cancel(reason = "cancelled") {
    active?.finish(reason);
  }
  function start(scene, camera, { isCurrent = () => true } = {}) {
    cancel("superseded");
    if (disposed || !isCurrent())
      return Promise.resolve({ status: "cancelled" });
    // Unsupported environments keep the original rendering path. We do not
    // replace this with blocking LINK_STATUS queries or suppress shader errors.
    if (!renderer.extensions.has("KHR_parallel_shader_compile"))
      return Promise.resolve({ status: "unsupported" });
    return new Promise((resolve) => {
      const started = now();
      const programs = new Set();
      const preparedPrograms = [];
      let firstUse = null;
      let timer = null;
      let done = false;
      const job = {
        finish(status, error) {
          if (done) return;
          done = true;
          if (timer !== null) unschedule(timer);
          timer = null;
          programs.clear();
          preparedPrograms.length = 0;
          firstUse?.cancel(status);
          firstUse?.dispose();
          firstUse = null;
          if (active === job) active = null;
          const result = { status, elapsedMs: now() - started };
          if (error) result.error = String(error?.message || error);
          emit({ event: "finish", ...result });
          resolve(result);
        },
      };
      active = job;
      const beginFirstUse = () => {
        if (done) return;
        if (disposed || !isCurrent()) return job.finish("cancelled");
        const remaining = timeoutMs - (now() - started);
        if (remaining <= 0) return job.finish("timeout");
        firstUse = createProgramFirstUsePreparation({
          now,
          timeoutMs: remaining,
          onEvent: emit,
          ...(makeFirstUseTaskQueue
            ? { makeTaskQueue: makeFirstUseTaskQueue }
            : {}),
        });
        firstUse.start(preparedPrograms, { isCurrent }).then((result) => {
          if (done) return;
          if (disposed || !isCurrent()) return job.finish("cancelled");
          job.finish(result.status, result.error);
        });
      };
      const poll = () => {
        timer = null;
        if (done) return;
        // This guard always precedes access to a WebGLProgram. Caller must
        // cancel before disposing the renderer/materials, including context loss.
        if (disposed || !isCurrent()) return job.finish("cancelled");
        if (now() - started >= timeoutMs) return job.finish("timeout");
        try {
          for (const program of programs) {
            if (program.isReady()) programs.delete(program);
            if (done) return;
          }
          if (programs.size === 0) return beginFirstUse();
          timer = schedule(poll, 10);
        } catch (error) {
          job.finish("failed", error);
        }
      };
      try {
        const compileStart = now();
        renderer.compile(scene, camera);
        if (done) return;
        emit({ event: "compile-return", elapsedMs: now() - compileStart });
        if (done) return;
        // r180 renderer.info.programs contains the same WebGLProgram wrappers
        // whose isReady() is used by compileAsync. Snapshot before polling;
        // never traverse material properties after an asynchronous boundary.
        for (const program of renderer.info.programs) {
          if (typeof program?.isReady !== "function")
            throw new Error("Unsupported Three program readiness contract");
          programs.add(program);
          preparedPrograms.push(program);
        }
        poll();
      } catch (error) {
        job.finish("failed", error);
      }
    });
  }
  return {
    start,
    cancel,
    dispose() {
      disposed = true;
      cancel("disposed");
    },
    get pending() {
      return active !== null;
    },
  };
}
