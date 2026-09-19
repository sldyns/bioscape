import { THREE } from "../../kit.js";
import { corticalRows } from "./fineStructure.js";

// Slipper-shaped cortical envelope. Each cell owns its deformable buffers.
export function nuclearCell(
  k,
  parent,
  { length = 3, width = 1.15, color = "#a6b8a2" } = {},
) {
  const group = new THREE.Group();
  parent.add(group);
  const geometry = new THREE.SphereGeometry(1, 40, 28, Math.PI, Math.PI),
    base = geometry.attributes.position.array.slice();
  const shell = k.mesh(
    geometry,
    k.material(color, {
      transparent: true,
      opacity: 0.66,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    [0, 0, 0],
    group,
  );
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(100 * 3), 3),
  );
  const edge = new THREE.LineLoop(
    edgeGeometry,
    new THREE.LineBasicMaterial({
      color: "#849c89",
      transparent: true,
      opacity: 0.8,
    }),
  );
  group.add(edge);
  const hairs = [];
  for (let i = 0; i < 52; i++) {
    const a = (i / 52) * Math.PI * 2;
    const h = k.segment(
      [0, 0, 0],
      [Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0.055],
      0.012,
      k.material("#98ac99"),
      group,
    );
    hairs.push({ h, a });
  }
  function shape(u, v, w, pinch = 0, stretch = 1) {
    const y = v * length * stretch;
    const narrow = 1 - pinch * Math.exp(-Math.pow(v / 0.19, 2));
    const side = 0.88 + 0.12 * v;
    const indentation =
      u > 0 ? 1 - 0.18 * Math.exp(-Math.pow((v - 0.05) / 0.23, 2)) : 1;
    return [
      u * width * side * indentation * narrow + 0.09 * v * v,
      y,
      w * 0.48 * narrow,
    ];
  }
  const fineCortex = corticalRows(k, group, shape, { rows: 15, columns: 19 });
  const inner = k.mesh(
    geometry,
    k.material("#d4dfc7", {
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    [0, 0, 0],
    group,
  );
  inner.scale.set(0.969, 0.986, 0.93);
  function deform(pinch = 0, stretch = 1) {
    fineCortex.update(pinch, stretch);
    const attr = geometry.attributes.position;
    for (let i = 0; i < attr.count; i++) {
      const q = shape(
        base[i * 3],
        base[i * 3 + 1],
        base[i * 3 + 2],
        pinch,
        stretch,
      );
      attr.setXYZ(i, ...q);
    }
    attr.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    const edgeAttr = edgeGeometry.attributes.position;
    for (let i = 0; i < 100; i++) {
      const a = (i / 100) * Math.PI * 2,
        q = shape(Math.cos(a), Math.sin(a), 0, pinch, stretch);
      edgeAttr.setXYZ(i, q[0], q[1], 0.07);
    }
    edgeAttr.needsUpdate = true;
    edgeGeometry.computeBoundingSphere();
    edgeGeometry.computeBoundingBox();
    hairs.forEach(({ h, a }) => {
      const q = shape(Math.cos(a), Math.sin(a), 0, pinch, stretch);
      h.position.set(
        q[0] + Math.cos(a) * 0.08,
        q[1] + Math.sin(a) * 0.08,
        0.08,
      );
    });
  }
  deform();
  return { group, shell, deform };
}
