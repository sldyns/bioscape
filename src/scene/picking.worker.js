import { BufferGeometry, BufferAttribute } from "three";
import { MeshBVH } from "three-mesh-bvh";

self.onmessage = ({ data }) => {
  const geometry = new BufferGeometry();
  try {
    geometry.setAttribute("position", new BufferAttribute(data.position, 3));
    if (data.index) geometry.setIndex(new BufferAttribute(data.index, 1));
    geometry.groups = data.groups;
    geometry.setDrawRange(data.drawRange.start, data.drawRange.count);
    // Indirection preserves the original triangle order and every visible vertex.
    const tree = new MeshBVH(geometry, { indirect: true }),
      packed = MeshBVH.serialize(tree, { cloneBuffers: false });
    const transfers = [...packed.roots];
    if (packed.index) transfers.push(packed.index.buffer);
    if (packed.indirectBuffer) transfers.push(packed.indirectBuffer.buffer);
    self.postMessage({ packed }, [...new Set(transfers)]);
  } catch (error) {
    self.postMessage({ error: String(error) });
  } finally {
    geometry.dispose();
  }
};
