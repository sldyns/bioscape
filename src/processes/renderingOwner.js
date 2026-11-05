// Keep these callbacks outside ProcessScene's effect scope: an idle pair must
// not retain that scope's disposed model, controls or DOM through a closure.
export function createProcessRenderingResources(renderer, environment) {
  let contextIntact = true;
  let disposed = false;
  const markLost = () => {
    contextIntact = false;
  };
  renderer.domElement.addEventListener("webglcontextlost", markLost);
  return {
    renderer,
    environment,
    isUsable: () =>
      !disposed && contextIntact && !renderer.getContext().isContextLost(),
    dispose() {
      if (disposed) return;
      disposed = true;
      renderer.domElement.removeEventListener("webglcontextlost", markLost);
      try {
        environment.dispose();
      } finally {
        renderer.dispose();
      }
    },
  };
}

// One mounted process workspace can retain one idle renderer/environment pair.
// Active scenes have exclusive leases, including during overlapping cleanups.
export function createProcessRenderingOwner() {
  let idle = null;
  let retired = false;
  let epoch = 0;
  const adopted = new WeakSet();

  const lease = (resources) => {
    const acquiredEpoch = epoch;
    let released = false;
    let valid = true;
    return {
      resources,
      invalidate() {
        valid = false;
      },
      release() {
        if (released) return;
        released = true;
        if (!retired && acquiredEpoch === epoch && valid && idle === null) {
          idle = resources;
        } else resources.dispose();
      },
    };
  };

  return {
    acquire() {
      if (retired) throw new Error("The process rendering owner is retired.");
      const resources = idle;
      idle = null;
      if (!resources) return null;
      let usable = false;
      try {
        usable = resources.isUsable();
      } catch {
        // A lost or failed graphics context must be rebuilt by the caller.
      }
      if (!usable) {
        resources.dispose();
        return null;
      }
      return lease(resources);
    },
    adopt(resources) {
      if (retired) throw new Error("The process rendering owner is retired.");
      if (
        !resources ||
        typeof resources.dispose !== "function" ||
        typeof resources.isUsable !== "function" ||
        adopted.has(resources)
      )
        throw new Error(
          "Expected new, independently owned rendering resources.",
        );
      adopted.add(resources);
      return lease(resources);
    },
    retire() {
      if (retired) return;
      retired = true;
      const resources = idle;
      idle = null;
      resources?.dispose();
      // Active scenes finish their own model/control cleanup before release.
    },
    resume() {
      if (!retired) return;
      retired = false;
      epoch++;
      // React's development effect replay starts a fresh ownership epoch.
    },
  };
}
