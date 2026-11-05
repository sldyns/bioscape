import { createRenderTurnQueue } from "./renderTurnQueue.js";
import { deferSceneInitialization } from "./sceneInitialization.js";

function enqueue(callback, onError) {
  const task = deferSceneInitialization(callback, { onError });
  return () => task.dispose();
}

const renderTurns = createRenderTurnQueue({ scheduleTask: enqueue });
const afterRender = (callback, onError) =>
  renderTurns.schedule(callback, onError);

// Own the partial resource until setup transfers its lifetime to a full cleanup.
export function deferStagedSceneInitialization(
  create,
  setup,
  releaseResource,
  {
    schedule = enqueue,
    scheduleContinuation = afterRender,
    onError = (error) => {
      throw error;
    },
  } = {},
) {
  let state = "pending",
    retired = false,
    resource = null,
    cleanup = null;
  let pending = null;
  const release = () => {
    const value = resource;
    resource = null;
    if (value !== null && value !== undefined) releaseResource(value);
  };
  const fail = (error) => {
    if (!retired) state = "failed";
    release();
    onError(error);
  };
  const post = (scheduler, callback) => {
    const slot = { cancel: null, ran: false };
    pending = slot;
    try {
      slot.cancel = scheduler(
        () => {
          slot.ran = true;
          if (pending === slot) pending = null;
          if (!retired) callback();
        },
        (error) => {
          if (pending === slot) pending = null;
          if (!retired) fail(error);
        },
      );
      if (retired && !slot.ran) slot.cancel?.();
    } catch (error) {
      if (slot.ran) throw error;
      if (pending === slot) pending = null;
      fail(error);
    }
  };
  const initialize = () => {
    state = "initializing";
    let complete;
    try {
      complete = setup(resource);
    } catch (error) {
      fail(error);
      return;
    }
    if (typeof complete === "function") {
      resource = null;
      if (retired) complete();
      else cleanup = complete;
    } else release();
    if (!retired) state = "ready";
  };
  const createResource = () => {
    state = "creating";
    try {
      resource = create();
    } catch (error) {
      fail(error);
      return;
    }
    if (retired) {
      release();
      return;
    }
    if (resource === null || resource === undefined) {
      state = "ready";
      return;
    }
    state = "waiting";
    post(scheduleContinuation, initialize);
  };
  const dispose = () => {
    if (retired) return;
    retired = true;
    const running = state === "creating" || state === "initializing";
    state = "disposed";
    const slot = pending;
    pending = null;
    slot?.cancel?.();
    if (!running) release();
    const complete = cleanup;
    cleanup = null;
    complete?.();
  };
  post(schedule, createResource);
  return {
    dispose,
    get state() {
      return state;
    },
  };
}
