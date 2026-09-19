import * as THREE from "three";
export const TAU = Math.PI * 2,
  V = (...p) => new THREE.Vector3(...p);
export function mesh(g, geo, color, id) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.56,
      clearcoat: 0.1,
      clearcoatRoughness: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  m.userData.hitId = id;
  g.add(m);
  return m;
}
export function ball(g, p, s, color, id) {
  const m = mesh(g, new THREE.SphereGeometry(1, 24, 16), color, id);
  m.position.set(...p);
  m.scale.set(...s);
  return m;
}
export function tube(g, points, r, color, id, segments = 96) {
  return mesh(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        points.map((p) => (Array.isArray(p) ? V(...p) : p)),
      ),
      segments,
      r,
      10,
      false,
    ),
    color,
    id,
  );
}
export function rod(g, a, b, r, color, id) {
  const d = V(...b).sub(V(...a)),
    m = mesh(g, new THREE.CylinderGeometry(r, r, d.length(), 10), color, id);
  m.position.copy(V(...a)).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  return m;
}
// Annular sector with an open lumen and real wall thickness, axis along Y.
export function wall(g, r, thickness, length, start, end, color, id) {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const a = start + ((end - start) * i) / 64;
    points.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  for (let i = 64; i >= 0; i--) {
    const a = start + ((end - start) * i) / 64;
    points.push(
      new THREE.Vector2(
        Math.cos(a) * (r - thickness),
        Math.sin(a) * (r - thickness),
      ),
    );
  }
  const shape = new THREE.Shape(points),
    geo = new THREE.ExtrudeGeometry(shape, {
      depth: length,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 64,
    });
  geo.setIndex(
    Array.from({ length: geo.attributes.position.count }, (_, i) => i),
  );
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -length / 2, 0);
  return mesh(g, geo, color, id);
}
export function proteinGeometry() {
  const geo = new THREE.SphereGeometry(1, 24, 18),
    p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      r =
        1 +
        0.09 * Math.sin(3 * y + 1) * Math.cos(3 * x) -
        0.12 * Math.exp(-y * y * 30) * Math.max(0, z);
    p.setXYZ(i, x * r, y * r, z * r);
  }
  geo.computeVertexNormals();
  return geo;
}
