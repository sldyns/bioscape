import * as THREE from "three";
export { THREE };
export const clamp = (v) =>
  Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
export const phase = (p, a, b) => clamp((p - a) / (b - a));
export const smooth = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
export const ease = (p, a, b) => smooth(phase(p, a, b));
export const bilingual = (zh, en) => ({ zh, en });

// Optional primitives. Each process still owns its scientific geometry and
// deterministic update function; these helpers do not prescribe an animation.
export function sceneKit() {
  const group = new THREE.Group();
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
  const materials = new Map();
  const material = (color, options = {}) => {
    const key = JSON.stringify([color, options]);
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...options }),
      );
    return materials.get(key);
  };
  const mesh = (geometry, mat, position = [0, 0, 0], parent = group) => {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position);
    parent.add(object);
    return object;
  };
  const ball = (position, scale, mat, parent = group) => {
    const object = mesh(sphere, mat, position, parent);
    Array.isArray(scale)
      ? object.scale.set(...scale)
      : object.scale.setScalar(scale);
    return object;
  };
  const segment = (from, to, radius, mat, parent = group) => {
    const object = mesh(cylinder, mat, [0, 0, 0], parent);
    const a = new THREE.Vector3(...from),
      b = new THREE.Vector3(...to);
    object.position.copy(a).add(b).multiplyScalar(0.5);
    const d = b.sub(a);
    object.scale.set(radius, Math.max(d.length(), 1e-6), radius);
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.normalize(),
    );
    return object;
  };
  const tube = (points, radius, mat, parent = group, segments = 64) =>
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        segments,
        radius,
        8,
        false,
      ),
      mat,
      [0, 0, 0],
      parent,
    );
  const ring = (position, radius, thickness, mat, parent = group) =>
    mesh(
      new THREE.TorusGeometry(radius, thickness, 10, 56),
      mat,
      position,
      parent,
    );
  const label = (position, zh, en, priority = 0) => ({
    position,
    text: { zh, en },
    priority,
  });
  return {
    group,
    material,
    mesh,
    ball,
    segment,
    tube,
    ring,
    label,
    sphere,
    cylinder,
  };
}
