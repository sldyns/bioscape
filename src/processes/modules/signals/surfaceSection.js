import { THREE } from "../../kit.js";

// The existing implicit surface remains the sole topology authority. Rear faces
// share its live buffers; section edges intersect the actual triangulation.
export function surfaceSection(k, surface, color) {
  const rear = new THREE.Mesh(
    surface.geometry,
    k.material(color, { side: THREE.BackSide, roughness: 0.8 }),
  );
  rear.name = "implicit-membrane-rear-surface";
  surface.add(rear);
  const positions = new Float32Array(60000 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);
  geometry.boundingBox = surface.geometry.boundingBox;
  geometry.boundingSphere = surface.geometry.boundingSphere;
  const edge = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
  edge.name = "implicit-membrane-bilayer-section";
  surface.add(edge);
  let lastVersion = -1;
  function update() {
    const version = surface.geometry.attributes.position.version;
    if (version === lastVersion) return;
    lastVersion = version;
    const source = surface.geometry.attributes.position.array;
    let count = 0;
    for (let i = 0; i < surface.geometry.drawRange.count * 3; i += 9) {
      // A triangle has at most two intersections with the equatorial plane.
      let hits = 0,
        ax = 0,
        ay = 0,
        bx = 0,
        by = 0;
      for (let j = 0; j < 3; j++) {
        const a = i + j * 3,
          b = i + ((j + 1) % 3) * 3;
        if (source[a + 2] < 0 === source[b + 2] < 0) continue;
        const t = -source[a + 2] / (source[b + 2] - source[a + 2]);
        const x = source[a] + t * (source[b] - source[a]),
          y = source[a + 1] + t * (source[b + 1] - source[a + 1]);
        if (hits++ === 0) {
          ax = x;
          ay = y;
        } else {
          bx = x;
          by = y;
        }
      }
      if (hits !== 2) continue;
      for (let layer = 0; layer < 2; layer++) {
        const offset = layer === 0 ? -0.018 : 0.018;
        positions[count++] = ax;
        positions[count++] = ay;
        positions[count++] = offset;
        positions[count++] = bx;
        positions[count++] = by;
        positions[count++] = offset;
      }
    }
    // Fixed-capacity buffers are part of absolute-seek state, including the
    // undrawn tail left by a previously larger contour.
    positions.fill(0, count);
    geometry.setDrawRange(0, count / 3);
    geometry.attributes.position.needsUpdate = true;
  }
  return { update, rear, edge };
}
