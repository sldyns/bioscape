function createQueue() {
  let closed = false,
    next = null,
    timer = null;
  const channel =
    typeof MessageChannel === "function" ? new MessageChannel() : null;
  const dispatch = () => {
    timer = null;
    const callback = next;
    next = null;
    if (!closed) callback?.();
  };
  if (channel) channel.port1.onmessage = dispatch;
  return {
    schedule(callback) {
      if (closed || next) throw Error("Buffer queue unavailable");
      next = callback;
      if (channel) channel.port2.postMessage(0);
      else timer = setTimeout(dispatch, 0);
    },
    dispose() {
      if (closed) return;
      closed = true;
      next = null;
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

export function createBufferPreparation(
  renderer,
  {
    makeQueue = createQueue,
    now = () => performance.now(),
    timeoutMs = 15000,
    onEvent = () => {},
  } = {},
) {
  let active = null,
    disposed = false;
  const cancel = (reason = "cancelled") => active?.finish(reason);
  return {
    start(scene, { isCurrent = () => true, budgetMs = timeoutMs } = {}) {
      cancel("superseded");
      if (disposed || !isCurrent())
        return Promise.resolve({ status: "cancelled", completed: 0 });
      if (typeof renderer.__bioscapePrepareObject !== "function")
        return Promise.resolve({ status: "unsupported", completed: 0 });
      if (!Number.isFinite(budgetMs) || budgetMs <= 0)
        return Promise.resolve({ status: "timeout", completed: 0 });
      const budget = Math.min(timeoutMs, budgetMs);
      return new Promise((resolve) => {
        let objects = [],
          queue = null,
          index = 0,
          done = false;
        const started = now();
        const job = {
          finish(status, error) {
            if (done) return;
            done = true;
            queue?.dispose();
            queue = null;
            objects.length = 0;
            if (active === job) active = null;
            const result = {
              status,
              completed: index,
              elapsedMs: now() - started,
            };
            if (error) result.error = String(error?.message || error);
            onEvent({ event: "buffer-finish", ...result });
            resolve(result);
          },
        };
        active = job;
        const step = () => {
          if (done) return;
          if (disposed || !isCurrent()) return job.finish("cancelled");
          if (now() - started >= budget) return job.finish("timeout");
          try {
            const began = now();
            if (renderer.__bioscapePrepareObject(objects[index]) !== true)
              throw Error("Renderer object preparation unavailable");
            index++;
            onEvent({
              event: "buffer-object-return",
              index,
              total: objects.length,
              elapsedMs: now() - began,
            });
            if (done) return;
            if (disposed || !isCurrent()) return job.finish("cancelled");
            if (now() - started >= budget) return job.finish("timeout");
            if (index === objects.length) return job.finish("ready");
            queue.schedule(step);
          } catch (error) {
            job.finish("failed", error);
          }
        };
        try {
          scene.traverseVisible((o) => {
            if (o.geometry && (o.isMesh || o.isLine || o.isPoints))
              objects.push(o);
          });
          if (objects.some((o) => o.isSkinnedMesh))
            return job.finish("unsupported");
          if (objects.length === 0) return job.finish("ready");
          queue = makeQueue();
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
