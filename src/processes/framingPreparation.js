export function createProcessFramingTaskQueue() {
  let closed = false;
  let pending = null;
  let timer = null;
  const channel =
    typeof MessageChannel === "function" ? new MessageChannel() : null;
  const dispatch = () => {
    timer = null;
    const callback = pending;
    pending = null;
    if (!closed) callback?.();
  };
  if (channel) channel.port1.onmessage = dispatch;
  return {
    schedule(callback) {
      if (closed || pending)
        throw new Error("Process framing queue is unavailable");
      pending = callback;
      if (channel) channel.port2.postMessage(0);
      else timer = setTimeout(dispatch, 0);
    },
    dispose() {
      if (closed) return;
      closed = true;
      pending = null;
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

// Keep a complete update/bounds pair atomic. The budget is a yield target,
// rather than a promise that one indivisible pose can finish in that time.
export function createProcessFramingPreparation({
  makeTaskQueue = createProcessFramingTaskQueue,
  now = () => performance.now(),
  budgetMs = 4,
} = {}) {
  let active = null;
  let disposed = false;
  const cancel = (reason = "cancelled") => active?.finish(reason);
  return {
    start(steps, runStep, { isCurrent = () => true } = {}) {
      cancel("superseded");
      if (disposed || !isCurrent())
        return Promise.resolve({ status: "cancelled", completed: 0 });
      return new Promise((resolve) => {
        let pending = [];
        let queue = null;
        let index = 0;
        let done = false;
        const job = {
          finish(status, error) {
            if (done) return;
            done = true;
            const owned = queue;
            queue = null;
            pending.length = 0;
            if (active === job) active = null;
            try {
              owned?.dispose();
            } catch (cause) {
              status = "failed";
              error ??= cause;
            }
            const result = { status, completed: index };
            if (error) result.error = String(error?.message ?? error);
            resolve(result);
          },
        };
        active = job;
        const step = () => {
          if (done) return;
          try {
            const began = now();
            do {
              if (disposed || !isCurrent()) return job.finish("cancelled");
              runStep(pending[index]);
              if (done) return;
              index++;
              if (disposed || !isCurrent()) return job.finish("cancelled");
              if (index === pending.length) return job.finish("ready");
            } while (now() - began < budgetMs);
            queue.schedule(step);
          } catch (error) {
            job.finish("failed", error);
          }
        };
        try {
          if (!Number.isFinite(budgetMs) || budgetMs <= 0)
            throw new Error("Invalid process framing budget");
          if (typeof runStep !== "function")
            throw new Error("Missing process framing step");
          pending = Array.from(steps);
          if (!pending.length) return job.finish("ready");
          queue = makeTaskQueue();
          queue.schedule(step);
        } catch (error) {
          job.finish("failed", error);
        }
      });
    },
    cancel,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancel("disposed");
    },
    get pending() {
      return active !== null;
    },
  };
}
