import { THREE } from "../../kit.js";

// The inner and outer faces of the growing cisterna turn into each other at
// its free rim. The cytoplasmic mouth stays open until enclosure.
export function prosporeLeadingEdge(k, outer, rows, sides, innerFactor) {
  const turns = 6,
    cols = sides + 1;
  const g = new THREE.BufferGeometry(),
    index = [];
  const position = new THREE.BufferAttribute(
    new Float32Array((turns + 1) * cols * 3),
    3,
  );
  g.setAttribute("position", position);
  const cosine = [],
    sine = [];
  for (let row = 0; row <= turns; row++) {
    const angle = (row * Math.PI) / turns;
    cosine.push(Math.cos(angle));
    sine.push(row === 0 || row === turns ? 0 : Math.sin(angle));
    if (row < turns)
      for (let j = 0; j < sides; j++) {
        const a = row * cols + j,
          b = a + cols;
        index.push(a, a + 1, b, b, a + 1, b + 1);
      }
  }
  g.setIndex(index);
  const mesh = k.mesh(
    g,
    k.material("#6b998a", { side: THREE.DoubleSide }),
    [0, 0, 0],
    outer,
  );
  const point = new THREE.Vector3(),
    halfGap = new THREE.Vector3(),
    tangent = new THREE.Vector3();
  const previous = new THREE.Vector3(),
    inner = new THREE.Vector3();
  const src = outer.geometry.attributes.position;
  function update(open) {
    mesh.visible = open;
    if (!open) {
      // A canonical empty rim gives the same buffers on forward and reverse seeks.
      if (g.drawRange.count !== 0) {
        position.array.fill(0);
        position.needsUpdate = true;
        g.computeVertexNormals();
        g.computeBoundingBox();
        g.computeBoundingSphere();
        g.setDrawRange(0, 0);
      }
      return;
    }
    g.setDrawRange(0, index.length);
    const rimRadius =
      (src.getX(rows * cols) - src.getX(rows * cols + sides / 2)) / 2;
    for (let j = 0; j <= sides; j++) {
      point.fromBufferAttribute(src, rows * cols + j);
      previous.fromBufferAttribute(src, (rows - 1) * cols + j);
      inner.set(
        Math.fround(point.x * innerFactor),
        Math.fround(point.y * innerFactor),
        Math.fround(point.z * innerFactor),
      );
      halfGap.copy(point).sub(inner).multiplyScalar(0.5);
      const gap2 = halfGap.lengthSq();
      tangent.subVectors(point, previous);
      if (gap2 > 0)
        tangent.addScaledVector(halfGap, -tangent.dot(halfGap) / gap2);
      tangent.normalize();
      // As enclosure finishes, the rounded fold must not overshoot the axis.
      tangent.multiplyScalar(
        Math.min(Math.sqrt(gap2), rimRadius * innerFactor * 0.5),
      );
      for (let row = 0; row <= turns; row++) {
        const offset = row * cols + j,
          c = cosine[row],
          s = sine[row];
        position.setXYZ(
          offset,
          inner.x + halfGap.x * (1 + c) + tangent.x * s,
          inner.y + halfGap.y * (1 + c) + tangent.y * s,
          inner.z + halfGap.z * (1 + c) + tangent.z * s,
        );
      }
    }
    position.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
  }
  return { mesh, update };
}
