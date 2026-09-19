import {
  BufferGeometry,
  BufferAttribute,
  Group,
  Mesh,
  MaterialLoader,
} from "three";

// Transfer the original typed buffers, without quantization or mesh simplification.
export function packDetail(group) {
  if (!group) return { payload: null, buffers: [] };
  const buffers = new Set(),
    meshes = [];
  for (const mesh of group.children) {
    const attributes = Object.fromEntries(
      Object.entries(mesh.geometry.attributes).map(([name, attribute]) => {
        buffers.add(attribute.array.buffer);
        return [
          name,
          {
            array: attribute.array,
            itemSize: attribute.itemSize,
            normalized: attribute.normalized,
          },
        ];
      }),
    );
    const index = mesh.geometry.index?.array;
    if (index) buffers.add(index.buffer);
    meshes.push({
      attributes,
      index,
      groups: mesh.geometry.groups,
      drawRange: mesh.geometry.drawRange,
      material: mesh.material.toJSON(),
      linearColors: Object.fromEntries(
        Object.entries(mesh.material)
          .filter(([, v]) => v?.isColor)
          .map(([key, v]) => [key, v.toArray()]),
      ),
      ior: mesh.material.ior,
      userData: mesh.userData,
      castShadow: mesh.castShadow,
      receiveShadow: mesh.receiveShadow,
    });
  }
  return {
    payload: { meshes, userData: group.userData },
    buffers: [...buffers],
  };
}
export function unpackDetail(payload) {
  if (!payload) return null;
  const root = new Group(),
    loader = new MaterialLoader();
  root.userData = payload.userData;
  for (const data of payload.meshes) {
    const geometry = new BufferGeometry();
    for (const [name, a] of Object.entries(data.attributes))
      geometry.setAttribute(
        name,
        new BufferAttribute(a.array, a.itemSize, a.normalized),
      );
    if (data.index) geometry.setIndex(new BufferAttribute(data.index, 1));
    geometry.groups = data.groups;
    geometry.setDrawRange(data.drawRange.start, data.drawRange.count);
    const material = loader.parse(data.material);
    for (const [key, color] of Object.entries(data.linearColors))
      material[key].fromArray(color);
    if (data.ior !== undefined) material.ior = data.ior;
    const mesh = new Mesh(geometry, material);
    mesh.userData = data.userData;
    mesh.castShadow = data.castShadow;
    mesh.receiveShadow = data.receiveShadow;
    root.add(mesh);
  }
  return root;
}
