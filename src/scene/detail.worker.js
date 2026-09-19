import { loadDetailModel } from "./loadDetailModel";
import { packDetail } from "./detailTransfer";
self.onmessage = async ({ data: { request, id } }) => {
  try {
    const { payload, buffers } = packDetail(await loadDetailModel(id));
    self.postMessage({ request, payload }, buffers);
  } catch (error) {
    self.postMessage({ request, error: String(error) });
  }
};
