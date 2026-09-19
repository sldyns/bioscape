import { THREE } from "../../kit.js";

// Reusable local drawing primitives; these are schematic molecular surfaces,
// not atomic coordinates. Instancing keeps nucleotide detail inexpensive.
export function molecularKit(group) {
  const sphere = new THREE.SphereGeometry(1, 12, 8),
    cylinder = new THREE.CylinderGeometry(1, 1, 1, 10),
    base = new THREE.BoxGeometry(1, 1, 1);
  const materials = [];
  const mat = (color, extra = {}) => {
    const m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.48,
      clearcoat: 0.18,
      ...extra,
    });
    materials.push(m);
    return m;
  };
  const dummy = new THREE.Object3D(),
    d = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  const instances = (geometry, material, count, name, parent = group) => {
    const m = new THREE.InstancedMesh(geometry, material, count);
    m.name = name;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    parent.add(m);
    return m;
  };
  const segment = (mesh, i, a, b, r = 0.035, width = r) => {
    d.subVectors(b, a);
    dummy.position.copy(a).add(b).multiplyScalar(0.5);
    dummy.quaternion.setFromUnitVectors(up, d.normalize());
    dummy.scale.set(width, Math.max(a.distanceTo(b), 1e-6), r);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  };
  const bead = (mesh, i, p, r = 0.051) => {
    dummy.position.copy(p);
    dummy.quaternion.identity();
    dummy.scale.setScalar(r);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  };
  const finish = (...items) =>
    items.flat().forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingBox();
      m.computeBoundingSphere();
    });
  const blob = (parent, m, p, s) => {
    const o = new THREE.Mesh(sphere, m);
    o.position.set(...p);
    o.scale.set(...s);
    parent.add(o);
    return o;
  };
  function protein(kind, color, scale = 1, parent = group) {
    const g = new THREE.Group();
    parent.add(g);
    g.name = `${kind}-functional-domains`;
    const m = mat(color),
      light = mat(
        new THREE.Color(color).lerp(new THREE.Color("#e4dfd8"), 0.22),
      ),
      dark = mat(new THREE.Color(color).multiplyScalar(0.78));
    const domains =
      kind === "nuclease"
        ? [
            [-0.25, 0.18, -0.1, 0.28, 0.25, 0.18],
            [0.21, 0.17, -0.1, 0.2, 0.3, 0.19],
            [0, -0.22, -0.15, 0.3, 0.18, 0.22],
          ]
        : [
            [-0.38, 0.03, -0.13, 0.25, 0.43, 0.28],
            [0.33, 0.1, -0.16, 0.24, 0.36, 0.25],
            [0, -0.34, -0.2, 0.38, 0.21, 0.28],
            [-0.32, 0.42, -0.18, 0.2, 0.18, 0.21],
            [0.28, 0.4, -0.19, 0.2, 0.22, 0.21],
          ];
    domains.forEach((v, i) =>
      blob(g, i % 2 ? light : m, v.slice(0, 3), v.slice(3)),
    );
    // Short curved ridges follow a protein domain rather than a random dot cloud.
    for (let side of [-1, 1])
      for (let j = 0; j < 3; j++) {
        const pts = [];
        for (let n = 0; n < 14; n++) {
          const t = n / 13;
          pts.push(
            new THREE.Vector3(
              side * (0.27 + 0.1 * Math.sin(t * Math.PI)),
              -0.17 + j * 0.16 + 0.09 * Math.sin(t * Math.PI * 2),
              0.04 + 0.06 * Math.cos(t * Math.PI),
            ),
          );
        }
        const ridge = new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(pts),
            18,
            0.017,
            6,
            false,
          ),
          dark,
        );
        g.add(ridge);
      }
    g.scale.setScalar(scale);
    return g;
  }
  function strand(count, color, name, parent = group) {
    const m = typeof color === "string" ? mat(color) : color;
    return {
      rail: instances(
        cylinder,
        m,
        count,
        `${name}-sugar-phosphate-backbone`,
        parent,
      ),
      phosphates: instances(
        sphere,
        m,
        Math.ceil(count / 3),
        `${name}-phosphate-groups`,
        parent,
      ),
      bases: instances(
        base,
        mat(new THREE.Color(m.color).lerp(new THREE.Color("#e6e1d6"), 0.36)),
        Math.ceil(count / 3),
        `${name}-attached-bases`,
        parent,
      ),
    };
  }
  return {
    sphere,
    cylinder,
    base,
    mat,
    materials,
    instances,
    segment,
    bead,
    finish,
    blob,
    protein,
    strand,
  };
}
