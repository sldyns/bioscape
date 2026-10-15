// Process models own their resources; dispose shared geometry and materials once.
export function disposeScene(scene, extraMaterials = []) {
  const geometries = new Set();
  const materials = new Set(extraMaterials);
  const textures = new Set();
  scene?.traverse((object) => {
    if (object.isInstancedMesh) object.dispose();
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (material) materials.add(material);
    }
  });
  for (const material of materials) {
    if (!material) continue;
    for (const value of Object.values(material)) {
      if (value?.isTexture) textures.add(value);
    }
  }
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material?.dispose());
  textures.forEach((texture) => texture.dispose());
}
