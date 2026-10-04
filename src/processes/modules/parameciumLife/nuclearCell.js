import { THREE } from "../../kit.js";
import { corticalRows } from "./fineStructure.js";
import { shapeState } from "./shapeState.js";

// Slipper-shaped cortical envelope. Each cell owns its deformable buffers.
export function nuclearCell(
  k,
  parent,
  { length = 3, width = 1.15, color = "#a6b8a2", fissionHalf = 0 } = {},
) {
  const group = new THREE.Group();
  parent.add(group);
  const geometry = new THREE.SphereGeometry(
      1,
      40,
      28,
      Math.PI,
      Math.PI,
      fissionHalf < 0 ? Math.PI / 2 : 0,
      fissionHalf ? Math.PI / 2 : Math.PI,
    ),
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
  const Edge = fissionHalf ? THREE.Line : THREE.LineLoop;
  const edge = new Edge(
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
    const a = fissionHalf
      ? (fissionHalf < 0 ? Math.PI : 0) + (i / 51) * Math.PI
      : (i / 52) * Math.PI * 2;
    const h = k.segment(
      [0, 0, 0],
      [Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0.055],
      0.012,
      k.material("#98ac99"),
      group,
    );
    hairs.push({ h, c: Math.cos(a), s: Math.sin(a) });
  }
  function shape(
    u,
    v,
    w,
    pinch = 0,
    stretch = 1,
    division = 0,
    separation = 0,
  ) {
    const y = v * length * stretch;
    const narrow = 1 - pinch * Math.exp(-Math.pow(v / 0.19, 2));
    const side = 0.88 + 0.12 * v;
    const indentation =
      u > 0 ? 1 - 0.18 * Math.exp(-Math.pow((v - 0.05) / 0.23, 2)) : 1;
    const x = u * width * side * indentation * narrow + 0.09 * v * v,
      z = w * 0.48 * narrow;
    if (!fissionHalf || division === 0) return [x, y, z];
    // Each hemisphere becomes one complete daughter surface. Their equatorial
    // rings coincide until both shrink to a pole, then separate with no mesh swap.
    const daughterV = fissionHalf * (2 * v * v - 1),
      daughterU = u * 2 * Math.abs(v),
      daughterW = w * 2 * Math.abs(v),
      daughterSide = 0.88 + 0.12 * daughterV,
      daughterIndent =
        daughterU > 0
          ? 1 - 0.18 * Math.exp(-Math.pow((daughterV - 0.05) / 0.23, 2))
          : 1,
      dx =
        daughterU * 1.05 * daughterSide * daughterIndent +
        0.09 * daughterV * daughterV,
      dy = daughterV * 1.62 + fissionHalf * (1.62 + 0.43 * separation),
      dz = daughterW * 0.48;
    return [
      x + (dx - x) * division,
      y + (dy - y) * division,
      z + (dz - z) * division,
    ];
  }
  const fineCortex = corticalRows(k, group, shape, {
    rows: 15,
    columns: 19,
    latitudeRange:
      fissionHalf > 0
        ? [0.025, 0.97]
        : fissionHalf < 0
          ? [-0.97, -0.025]
          : [-0.91, 0.91],
  });
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
  const shapeChanged = shapeState();
  const edgePoints = Array.from({ length: 100 }, (_, i) => {
    const a = fissionHalf
      ? (fissionHalf < 0 ? Math.PI : 0) + (i / 99) * Math.PI
      : (i / 100) * Math.PI * 2;
    return [Math.cos(a), Math.sin(a)];
  });
  function deform(pinch = 0, stretch = 1, division = 0, separation = 0) {
    if (!shapeChanged(pinch, stretch, division, separation)) return;
    fineCortex.update(pinch, stretch, division, separation);
    const attr = geometry.attributes.position;
    for (let i = 0; i < attr.count; i++) {
      const q = shape(
        base[i * 3],
        base[i * 3 + 1],
        base[i * 3 + 2],
        pinch,
        stretch,
        division,
        separation,
      );
      attr.setXYZ(i, ...q);
    }
    attr.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    const edgeAttr = edgeGeometry.attributes.position;
    for (let i = 0; i < 100; i++) {
      const q = shape(
        edgePoints[i][0],
        edgePoints[i][1],
        0,
        pinch,
        stretch,
        division,
        separation,
      );
      edgeAttr.setXYZ(i, q[0], q[1], 0.07);
    }
    edgeAttr.needsUpdate = true;
    edgeGeometry.computeBoundingSphere();
    edgeGeometry.computeBoundingBox();
    hairs.forEach(({ h, c, s }) => {
      const q = shape(c, s, 0, pinch, stretch, division, separation);
      h.position.set(q[0] + c * 0.08, q[1] + s * 0.08, 0.08);
    });
  }
  deform();
  return { group, shell, deform };
}
