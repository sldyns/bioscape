// Keep the process module API while both scene types use the same owner.
export {
  createRenderingOwner as createProcessRenderingOwner,
  createRenderingResources as createProcessRenderingResources,
} from "../scene/renderingOwner.js";
