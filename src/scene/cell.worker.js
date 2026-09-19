import { buildCell } from "./buildCell";
import { packCell } from "./cellTransfer";
self.onmessage = () => {
  try {
    const { payload, buffers } = packCell(buildCell());
    self.postMessage({ payload }, buffers);
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
