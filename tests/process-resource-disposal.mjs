import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { disposeScene } from "../src/processes/disposeScene.js";
test("shared graph and inventory resources dispose once, including inventory-only textures", () => {
  const group = new THREE.Group(),
    geometry = new THREE.BoxGeometry(),
    texture = new THREE.Texture(),
    hiddenTexture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture }),
    inventoryMaterial = new THREE.MeshBasicMaterial({ map: hiddenTexture });
  group.add(
    new THREE.Mesh(geometry, material),
    new THREE.InstancedMesh(geometry, material, 2),
  );
  const counts = new Map();
  for (const resource of [
    geometry,
    texture,
    hiddenTexture,
    material,
    inventoryMaterial,
    group.children[1],
  ]) {
    counts.set(resource, 0);
    resource.addEventListener("dispose", () =>
      counts.set(resource, counts.get(resource) + 1),
    );
  }
  disposeScene(group, [material, inventoryMaterial, inventoryMaterial]);
  for (const count of counts.values()) assert.equal(count, 1);
});
test("partial initialization cleanup accepts missing scene and inventory", () => {
  assert.doesNotThrow(() => disposeScene());
});
