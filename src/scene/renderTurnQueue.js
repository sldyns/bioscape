// One continuation task per rendering opportunity across all scenes in this
// module. No rendering/quality changes, and no promise of physical presentation.
export function createRenderTurnQueue({
  scheduleTask,
  canRender = () => typeof requestAnimationFrame === "function",
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (frame) => cancelAnimationFrame(frame),
}) {
  const queue = [];
  let frame = null,
    pending = null,
    running = false;
  const pump = () => {
    if (running || pending || frame !== null || queue.length === 0) return;
    frame = requestFrame(() => {
      frame = null;
      const entry = queue.shift();
      if (!entry) return;
      pending = entry;
      const rejected = (error) => {
        if (entry.cancelled) return;
        if (entry.started || entry.failed) throw error;
        entry.failed = true;
        if (pending === entry) pending = null;
        entry.callback = null;
        const reject = entry.onError;
        entry.onError = null;
        try {
          reject?.(error);
        } finally {
          pump();
        }
      };
      try {
        entry.cancelTask = scheduleTask(() => {
          if (pending === entry) pending = null;
          const callback = entry.callback;
          entry.started = true;
          entry.callback = null;
          entry.onError = null;
          running = true;
          try {
            callback?.();
          } finally {
            running = false;
            pump();
          }
        }, rejected);
      } catch (error) {
        rejected(error);
      }
    });
  };
  return {
    schedule(
      callback,
      onError = (error) => {
        throw error;
      },
    ) {
      if (!canRender()) return scheduleTask(callback, onError);
      const entry = {
        callback,
        onError,
        cancelTask: null,
        started: false,
        failed: false,
        cancelled: false,
      };
      queue.push(entry);
      try {
        pump();
      } catch (error) {
        const index = queue.indexOf(entry);
        if (index >= 0) queue.splice(index, 1);
        entry.callback = null;
        throw error;
      }
      return () => {
        entry.cancelled = true;
        entry.callback = null;
        entry.onError = null;
        const index = queue.indexOf(entry);
        if (index >= 0) queue.splice(index, 1);
        if (pending === entry) {
          pending = null;
          entry.cancelTask?.();
        }
        if (queue.length === 0 && frame !== null) {
          cancelFrame(frame);
          frame = null;
        }
        pump();
      };
    },
  };
}
