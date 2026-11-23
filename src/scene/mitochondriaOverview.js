import { InstancedMesh, Matrix4 } from "three";

// The animal-cell overview places three rigid copies of one mitochondrial
// template. Each opaque template surface needs only one draw across the copies.
// The original objects remain available for the enlarged organelle views.
export function instanceMitochondria(source, hitId) {
  const copies = source.children;
  const template = copies[0]?.children;
  if (!template?.length || copies.length < 2) return null;
  const compatible = copies.every(
    (copy) =>
      copy.visible &&
      copy.children.length === template.length &&
      template.every((original, index) => {
        const mesh = copy.children[index];
        return (
          mesh.isMesh &&
          !mesh.isInstancedMesh &&
          !mesh.children.length &&
          mesh.geometry === original.geometry &&
          mesh.material === original.material &&
          !mesh.material.transparent &&
          mesh.visible === original.visible &&
          mesh.castShadow === original.castShadow &&
          mesh.receiveShadow === original.receiveShadow &&
          mesh.userData.cap === original.userData.cap &&
          mesh.userData.cutOnly === original.userData.cutOnly
        );
      }),
  );
  if (!compatible) return null;

  const group = source.clone(false);
  source.matrixWorld.decompose(group.position, group.quaternion, group.scale);
  const local = new Matrix4();
  for (const [index, surface] of template.entries()) {
    const mesh = new InstancedMesh(
      surface.geometry,
      surface.material.clone(),
      copies.length,
    );
    mesh.castShadow = surface.castShadow;
    mesh.receiveShadow = surface.receiveShadow;
    mesh.visible = surface.visible;
    mesh.userData = {
      ...surface.userData,
      hitId,
      sharedGeometry: true,
      indexedCopies: true,
    };
    copies.forEach((copy, i) => {
      local.multiplyMatrices(copy.matrix, copy.children[index].matrix);
      mesh.setMatrixAt(i, local);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }
  return group;
}
