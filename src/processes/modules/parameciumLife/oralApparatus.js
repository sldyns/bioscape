import { THREE } from "../../kit.js";

// Schematic ventral oral depression, open toward the viewer. This is a
// structural cutaway, not a reconstruction of measured membranelle counts.
export function oralApparatus(k, parent, { observationWindow = false } = {}) {
  const group = new THREE.Group();
  group.name = "concave-oral-apparatus";
  parent.add(group);
  const rows = 24,
    columns = 12;
  const surface = (offset) => {
    const vertices = [],
      indices = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows,
        width = 0.19 * (1 - 0.66 * t);
      for (let j = 0; j <= columns; j++) {
        const u = (2 * j) / columns - 1;
        vertices.push(
          0.72 - 0.22 * t + u * width,
          0.48 - 0.83 * t,
          0.53 + 0.115 * u * u + offset,
        );
        if (
          i < rows &&
          j < columns &&
          !(observationWindow && i >= 6 && i < 21)
        ) {
          const a = i * (columns + 1) + j;
          indices.push(
            a,
            a + 1,
            a + columns + 1,
            a + 1,
            a + columns + 2,
            a + columns + 1,
          );
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  };
  const inner = k.mesh(
    surface(0),
    k.material("#b6a17f", { side: THREE.DoubleSide }),
    [0, 0, 0],
    group,
  );
  inner.name = "oral-lumen-wall";
  const outer = k.mesh(
    surface(-0.018),
    k.material("#8c967d", { side: THREE.DoubleSide }),
    [0, 0, 0],
    group,
  );
  outer.name = "oral-outer-wall";
  const lipMaterial = k.material("#cbb995");
  for (const side of [-1, 1]) {
    for (const [start, end] of observationWindow
      ? [
          [0, 0.25],
          [0.875, 1],
        ]
      : [[0, 1]]) {
      const points = [];
      for (let i = 0; i <= 12; i++) {
        const t = start + ((end - start) * i) / 12;
        points.push([
          0.72 - 0.22 * t + side * 0.19 * (1 - 0.66 * t),
          0.48 - 0.83 * t,
          0.636,
        ]);
      }
      k.tube(points, 0.013, lipMaterial, group).name = "oral-open-rim";
    }
  }
  if (observationWindow) {
    // Actual cut faces join the paired surfaces at each observation boundary.
    const positions = [],
      indices = [];
    for (const t of [0.25, 0.875])
      for (let j = 0; j <= columns; j++) {
        const u = (2 * j) / columns - 1,
          x = 0.72 - 0.22 * t + u * 0.19 * (1 - 0.66 * t),
          y = 0.48 - 0.83 * t,
          z = 0.53 + 0.115 * u * u;
        positions.push(x, y, z, x, y, z - 0.018);
      }
    for (let boundary = 0; boundary < 2; boundary++)
      for (let j = 0; j < columns; j++) {
        const a = boundary * (columns + 1) * 2 + j * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    const cut = new THREE.BufferGeometry();
    cut.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    cut.setIndex(indices);
    cut.computeVertexNormals();
    k.mesh(cut, lipMaterial, [0, 0, 0], group).name =
      "oral-observation-cut-edges";
  }
  const ciliumGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.025, -0.018, 0.07),
      new THREE.Vector3(0.075, -0.045, 0.1),
    ]),
    6,
    0.007,
    5,
    false,
  );
  const cilia = new THREE.InstancedMesh(
    ciliumGeometry,
    k.material("#d0c4a6"),
    observationWindow ? 15 : 36,
  );
  cilia.name = "oral-membranelle-rows";
  const transform = new THREE.Object3D();
  let instance = 0;
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 12; i++) {
      const t = (i + 0.5) / 12,
        u = -0.72 + row * 0.32;
      if (observationWindow && t > 0.25 && t < 0.875) continue;
      transform.position.set(
        0.72 - 0.22 * t + u * 0.19 * (1 - 0.66 * t),
        0.48 - 0.83 * t,
        0.53 + 0.115 * u * u,
      );
      transform.updateMatrix();
      cilia.setMatrixAt(instance++, transform.matrix);
    }
  cilia.instanceMatrix.needsUpdate = true;
  cilia.computeBoundingBox();
  cilia.computeBoundingSphere();
  group.add(cilia);
  return group;
}
