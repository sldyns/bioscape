function enqueue(callback) {
  if (typeof MessageChannel !== "function") {
    const timer = setTimeout(callback, 0);
    return () => clearTimeout(timer);
  }
  const channel = new MessageChannel();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    channel.port1.onmessage = null;
    channel.port1.close();
    channel.port2.close();
  };
  channel.port1.onmessage = () => {
    close();
    callback();
  };
  channel.port2.postMessage(0);
  return close;
}

// A scene owns its pending task and eventual setup cleanup as one lifetime.
export function deferSceneInitialization(
  setup,
  {
    schedule = enqueue,
    onError = (error) => {
      throw error;
    },
  } = {},
) {
  let retired = false,
    cleanup = null,
    state = "pending";
  let cancelTask = () => {};
  const dispose = () => {
    if (retired) return;
    retired = true;
    state = "disposed";
    cancelTask();
    const release = cleanup;
    cleanup = null;
    release?.();
  };
  const run = () => {
    if (retired) return;
    state = "initializing";
    let release;
    try {
      release = setup();
    } catch (error) {
      if (!retired) state = "failed";
      onError(error);
      return;
    }
    if (retired) {
      if (typeof release === "function") release();
    } else {
      cleanup = typeof release === "function" ? release : null;
      state = "ready";
    }
  };
  try {
    cancelTask = schedule(run);
  } catch (error) {
    state = "failed";
    onError(error);
  }
  return {
    dispose,
    get state() {
      return state;
    },
  };
}
