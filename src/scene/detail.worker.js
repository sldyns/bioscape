import { loadDetailModel } from "./loadDetailModel";
import { packDetail } from "./detailTransfer";
self.onmessage = async ({ data: { request, id } }) => {
  try {
    const { payload, buffers } = packDetail(await loadDetailModel(id), {
      prepareBounds: true,
      // Framing needs every box. Rendering computes spheres only when a mesh
      // is displayed, so hidden cutaway branches can keep their lazy spheres.
      prepareSpheres: false,
    });
    self.postMessage({ request, payload }, buffers);
  } catch (error) {
    self.postMessage({ request, error: String(error) });
  }
};
