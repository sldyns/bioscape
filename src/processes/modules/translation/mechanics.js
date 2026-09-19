import { THREE } from "../../kit.js";

// Fixed-topology chains: only transforms change while seeking.
export function articulatedChain(k, count, radius, material, parent = k.group) {
  const points = Array.from({ length: count }, () => new THREE.Vector3());
  const beads = points.map(() => k.ball([0, 0, 0], radius, material, parent));
  const links = points
    .slice(1)
    .map(() => k.mesh(k.cylinder, material, [0, 0, 0], parent));
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  function commit() {
    for (let i = 0; i < count; i++) {
      beads[i].position.copy(points[i]);
      if (i) {
        const link = links[i - 1];
        direction.subVectors(points[i], points[i - 1]);
        link.position
          .copy(points[i])
          .add(points[i - 1])
          .multiplyScalar(0.5);
        link.scale.set(
          radius * 0.78,
          Math.max(0.00001, direction.length()),
          radius * 0.78,
        );
        link.quaternion.setFromUnitVectors(up, direction.normalize());
      }
    }
  }
  return { points, beads, links, commit };
}
