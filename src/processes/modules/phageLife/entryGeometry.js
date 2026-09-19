import { THREE, clamp } from "../../kit.js";

// A single molecular interval, sampled by centerline arclength. The coil,
// tail lumen and cytoplasmic folds are one path, never separate scaled DNA.
export function entryGenome(k, parent, headY) {
  const x = -0.8,
    z = 0.08;
  const coil = Array.from({ length: 97 }, (_, i) => {
    const t = i / 96,
      a = t * Math.PI * 6;
    const r = 0.135 * Math.sin(Math.PI * (0.1 + 0.9 * t));
    return new THREE.Vector3(
      x + r * Math.cos(a),
      headY + 0.49 - t * 0.4,
      z + r * Math.sin(a),
    );
  });
  coil[coil.length - 1].set(x, headY + 0.09, z);
  const path = new THREE.CurvePath();
  const packed = new THREE.CatmullRomCurve3(coil);
  path.add(packed);
  path.add(new THREE.LineCurve3(coil.at(-1), new THREE.Vector3(x, 1.24, z)));
  path.add(
    new THREE.CatmullRomCurve3(
      [
        [x, 1.24, z],
        [x, 1.05, z],
        [-0.65, 0.75, 0.11],
        [0.2, 0.5, 0.18],
        [1.65, 0.5, 0.2],
        [2.05, 0.05, 0.2],
        [1.5, -0.36, 0.2],
        [0.1, -0.4, 0.2],
        [-1.4, -0.3, 0.2],
        [-2.05, 0.05, 0.2],
        [-1.6, 0.45, 0.2],
      ].map((p) => new THREE.Vector3(...p)),
    ),
  );
  // CurvePath.getPoint already distributes t by arclength among its children.
  const length = path.getLength(),
    segments = 1800,
    radial = 7;
  const initialLength = packed.getLength() + 0.09 + 0.76 * 0.8;
  const travel = packed.getLength() + headY + 0.09 - 1.24;
  const group = new THREE.Group();
  group.name = "T4-entry-dsDNA";
  parent.add(group);
  const frames = path.computeFrenetFrames(segments, false);
  const railPoint = (t, sign) => {
    const i = Math.min(segments, Math.round(t * segments));
    const a = (t * length * Math.PI * 2) / 0.09;
    return path
      .getPoint(t)
      .addScaledVector(frames.normals[i], sign * 0.015 * Math.cos(a))
      .addScaledVector(frames.binormals[i], sign * 0.015 * Math.sin(a));
  };
  const rails = [-1, 1].map((sign, i) => {
    const curve = new THREE.Curve();
    // Preserve the common centerline parameter instead of separately
    // reparametrizing each helix by its own backbone length.
    curve.getPoint = (t) => railPoint(t, sign);
    curve.getPointAt = (t) => curve.getPoint(t);
    curve.getTangentAt = (t) => curve.getTangent(t);
    const mesh = k.mesh(
      new THREE.TubeGeometry(curve, segments, 0.008, radial, false),
      k.material(i ? "#d5b98a" : "#bd9b62"),
      [0, 0, 0],
      group,
    );
    mesh.name = `entry-backbone-${i}`;
    return mesh;
  });
  const count = 420,
    matrices = [],
    temp = new THREE.Object3D();
  const bases = new THREE.InstancedMesh(
    k.cylinder,
    k.material("#d7c9a9"),
    count,
  );
  bases.name = "entry-base-pairs";
  bases.frustumCulled = false;
  group.add(bases);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1),
      a = railPoint(t, -1),
      b = railPoint(t, 1),
      d = b.clone().sub(a);
    temp.position.copy(a).add(b).multiplyScalar(0.5);
    temp.scale.set(0.005, d.length(), 0.005);
    temp.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.normalize(),
    );
    temp.updateMatrix();
    matrices.push(temp.matrix.clone());
  }
  const unused = new THREE.Matrix4();
  function update(fraction) {
    const start = (clamp(fraction) * travel) / length;
    const end = start + initialLength / length;
    const first = Math.floor(start * segments),
      last = Math.ceil(end * segments);
    rails.forEach((m) =>
      m.geometry.setDrawRange(first * radial * 6, (last - first) * radial * 6),
    );
    const firstBase = Math.ceil(start * (count - 1));
    const lastBase = Math.floor(end * (count - 1));
    bases.count = lastBase - firstBase + 1;
    for (let i = 0; i < count; i++)
      bases.setMatrixAt(i, i < bases.count ? matrices[firstBase + i] : unused);
    bases.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { group, update };
}
