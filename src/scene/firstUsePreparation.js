// QA candidate only. Call after the existing KHR readiness gate succeeds.
// Three r180 getUniforms() performs the unchanged native onFirstUse path,
// including shader diagnostics and both uniform/attribute cache creation.
function createOwnedTaskQueue() {
  let closed = false,
    callback = null,
    timer = null;
  const channel =
    typeof MessageChannel === "function" ? new MessageChannel() : null;
  const dispatch = () => {
    timer = null;
    const next = callback;
    callback = null;
    if (!closed) next?.();
  };
  if (channel) channel.port1.onmessage = dispatch;
  return {
    schedule(next) {
      if (closed || callback)
        throw new Error("First-use task queue is unavailable");
      callback = next;
      if (channel) channel.port2.postMessage(0);
      else timer = setTimeout(dispatch, 0);
    },
    dispose() {
      if (closed) return;
      closed = true;
      callback = null;
      if (timer !== null) clearTimeout(timer);
      timer = null;
      if (channel) {
        channel.port1.onmessage = null;
        channel.port1.close();
        channel.port2.close();
      }
    },
  };
}

export function createProgramFirstUsePreparation({
  makeTaskQueue = createOwnedTaskQueue,
  now = () => performance.now(),
  timeoutMs = 15000,
  onEvent = () => {},
} = {}) {
  let active = null,
    disposed = false;
  function cancel(reason = "cancelled") {
    active?.finish(reason);
  }
  function start(programs, { isCurrent = () => true } = {}) {
    cancel("superseded");
    if (disposed || !isCurrent())
      return Promise.resolve({ status: "cancelled", completed: 0 });
    return new Promise((resolve) => {
      const started = now();
      let pending = [],
        queue = null,
        index = 0,
        done = false;
      const job = {
        finish(status, error) {
          if (done) return;
          done = true;
          queue?.dispose();
          queue = null;
          pending.length = 0;
          if (active === job) active = null;
          const result = {
            status,
            completed: index,
            elapsedMs: now() - started,
          };
          if (error) result.error = String(error?.message || error);
          onEvent({ event: "first-use-finish", ...result });
          resolve(result);
        },
      };
      active = job;
      const step = () => {
        if (done) return;
        // No program access after cancellation, navigation, loss or disposal.
        if (disposed || !isCurrent()) return job.finish("cancelled");
        if (now() - started >= timeoutMs) return job.finish("timeout");
        try {
          const program = pending[index],
            began = now();
          // Keep the native diagnostics; do not query readiness again here.
          // Its first call fills both caches in the pinned r180 contract.
          program.getUniforms();
          if (done) return;
          index++;
          onEvent({
            event: "program-first-use-return",
            index,
            total: pending.length,
            elapsedMs: now() - began,
          });
          if (done) return;
          if (disposed || !isCurrent()) return job.finish("cancelled");
          if (now() - started >= timeoutMs) return job.finish("timeout");
          if (index === pending.length) return job.finish("ready");
          queue.schedule(step);
        } catch (error) {
          job.finish("failed", error);
        }
      };
      try {
        pending = [...new Set(programs)];
        // Validate the entire pinned wrapper contract before touching a program.
        if (
          pending.some(
            (program) =>
              typeof program?.getUniforms !== "function" ||
              typeof program?.getAttributes !== "function",
          )
        )
          throw new Error("Unsupported Three first-use contract");
        if (pending.length === 0) return job.finish("ready");
        queue = makeTaskQueue();
        queue.schedule(step);
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
