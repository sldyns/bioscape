import { THREE } from "../../kit.js";

// Each membrane is one bilayer: two polar surfaces, a bounded hydrophobic
// cut edge, and paired lipid heads/tails along that edge. The front viewing
// sector is removed from both surfaces; it never closes or fills the lumen.
export function membraneSurface(
  parent,
  material,
  rings = 65,
  around = 64,
  axis = "y",
  thickness = 0.062,
) {
  const mesh = new THREE.Group();
  parent.add(mesh);
  mesh.name = "single lipid bilayer — paired leaflets and cut edges";
  const profiles = Array.from({ length: rings }, () => [0, 0]);
  const normals = Array.from({ length: rings }, () => [0, 0]);
  const skinGeo = () => {
    const g = new THREE.BufferGeometry(),
      p = new Float32Array(rings * (around + 1) * 3),
      index = [];
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    for (let i = 0; i < rings - 1; i++)
      for (let j = 0; j < around; j++) {
        const a = i * (around + 1) + j,
          b = a + around + 1;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    g.setIndex(index);
    return g;
  };
  const skins = [skinGeo(), skinGeo()];
  for (const g of skins) {
    const skin = new THREE.Mesh(g, material);
    mesh.add(skin);
  }
  const cutMaterial = material.clone();
  cutMaterial.color.offsetHSL(0, -0.035, -0.055);
  const capGeo = new THREE.BufferGeometry(),
    caps = new Float32Array(rings * 4 * 3),
    indices = [];
  capGeo.setAttribute("position", new THREE.BufferAttribute(caps, 3));
  for (let side = 0; side < 2; side++)
    for (let i = 0; i < rings - 1; i++) {
      const a = side * rings * 2 + i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  capGeo.setIndex(indices);
  mesh.add(new THREE.Mesh(capGeo, cutMaterial));
  const lipidRows = 44,
    lipidCount = lipidRows * 4;
  const headGeometry = new THREE.SphereGeometry(1, 10, 8),
    tailGeometry = new THREE.CylinderGeometry(1, 1, 1, 6);
  const heads = new THREE.InstancedMesh(headGeometry, material, lipidCount),
    tails = new THREE.InstancedMesh(tailGeometry, cutMaterial, lipidCount);
  heads.name = "paired phospholipid heads at cutaway";
  tails.name = "hydrophobic tails within bilayer";
  mesh.add(heads, tails);
  heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const temp = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    direction = new THREE.Vector3();
  const aa = new THREE.Vector3(),
    bb = new THREE.Vector3();
  const point = (u, r, a, out) =>
    axis === "y"
      ? out.set(r * Math.sin(a), u, -r * Math.cos(a))
      : out.set(u, r * Math.sin(a), -r * Math.cos(a));
  const finish = (g) => {
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
    g.computeBoundingBox();
  };
  function set(profile) {
    for (let i = 0; i < rings; i++) {
      const value = profile(i / (rings - 1));
      profiles[i][0] = value[0];
      profiles[i][1] = Math.max(0, value[1]);
    }
    for (let i = 0; i < rings; i++) {
      const a = profiles[Math.max(0, i - 1)],
        b = profiles[Math.min(rings - 1, i + 1)],
        du = b[0] - a[0],
        dr = b[1] - a[1],
        length = Math.hypot(du, dr) || 1;
      normals[i][0] = -dr / length;
      normals[i][1] = du / length;
      for (let layer = 0; layer < 2; layer++) {
        const shift = ((layer ? 1 : -1) * thickness) / 2,
          u = profiles[i][0] + normals[i][0] * shift,
          r = Math.max(0, profiles[i][1] + normals[i][1] * shift),
          positions = skins[layer].attributes.position.array;
        for (let j = 0; j <= around; j++) {
          point(u, r, -2.13 + (4.26 * j) / around, aa);
          aa.toArray(positions, (i * (around + 1) + j) * 3);
        }
        for (let side = 0; side < 2; side++) {
          point(u, r, side ? 2.13 : -2.13, aa);
          aa.toArray(caps, (side * rings * 2 + i * 2 + layer) * 3);
        }
      }
    }
    let index = 0;
    for (let side = 0; side < 2; side++)
      for (let row = 0; row < lipidRows; row++)
        for (let layer = 0; layer < 2; layer++) {
          const i = Math.round(
              (0.025 + (0.95 * row) / (lipidRows - 1)) * (rings - 1),
            ),
            shift = ((layer ? 1 : -1) * thickness) / 2,
            u = profiles[i][0] + normals[i][0] * shift,
            r = Math.max(0, profiles[i][1] + normals[i][1] * shift),
            angle = side ? 2.13 : -2.13;
          point(u, r, angle, aa);
          temp.position.copy(aa);
          temp.quaternion.identity();
          temp.scale.setScalar(0.019);
          temp.updateMatrix();
          heads.setMatrixAt(index, temp.matrix);
          point(profiles[i][0], profiles[i][1], angle, bb);
          direction.subVectors(bb, aa);
          const length = direction.length();
          temp.position.copy(aa).lerp(bb, 0.5);
          temp.quaternion.setFromUnitVectors(up, direction.normalize());
          temp.scale.set(0.0065, Math.max(0.00001, length), 0.0065);
          temp.updateMatrix();
          tails.setMatrixAt(index++, temp.matrix);
        }
    for (const g of skins) finish(g);
    finish(capGeo);
    for (const m of [heads, tails]) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingBox();
      m.computeBoundingSphere();
    }
  }
  return {
    mesh,
    set,
    setOpacity(value) {
      material.opacity = value;
      cutMaterial.opacity = value;
    },
    materials: [material, cutMaterial],
  };
}
export function interpolateProfile(points, t) {
  const n = t * (points.length - 1),
    i = Math.min(points.length - 2, Math.floor(n)),
    f = n - i;
  return [
    points[i][0] + (points[i + 1][0] - points[i][0]) * f,
    points[i][1] + (points[i + 1][1] - points[i][1]) * f,
  ];
}
export function setSegment(object, a, b, r) {
  object.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  object.scale.set(r, Math.max(d.length(), 0.0001), r);
  object.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    d.normalize(),
  );
}
