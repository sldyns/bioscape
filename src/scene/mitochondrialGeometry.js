import * as THREE from "three";
export const TAU = Math.PI * 2,
  V = (x, y, z) => new THREE.Vector3(x, y, z);
export function mesh(g, geo, color, id, flags = {}) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.53,
      clearcoat: 0.15,
      side: THREE.DoubleSide,
    }),
  );
  m.userData = { hitId: id, ...flags };
  g.add(m);
  return m;
}
export function ball(g, p, s, color, id, width = 20, height = 14) {
  const m = mesh(g, new THREE.SphereGeometry(1, width, height), color, id);
  m.position.copy(p);
  m.scale.set(...s);
  return m;
}
export function line(g, points, r, color, id, closed = false) {
  return mesh(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points, closed),
      Math.max(48, points.length * 2),
      r,
      8,
      closed,
    ),
    color,
    id,
  );
}
export function surface(fn, nu = 100, nv = 64) {
  const pos = [],
    uv = [],
    idx = [];
  for (let i = 0; i <= nu; i++)
    for (let j = 0; j <= nv; j++) {
      pos.push(...fn(i / nu, j / nv));
      uv.push(i / nu, j / nv);
    }
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j,
        b = a + nv + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// Opaque faces, cut edges and lipid relief share one vertex-colored material
// signature. The detail loader batches them independently of the protein parts.
export function membranePiece(g, geometry, color, id, flags) {
  if (color) {
    const tint = new THREE.Color(color);
    const shades = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < shades.length; i += 3) tint.toArray(shades, i);
    geometry.setAttribute("color", new THREE.BufferAttribute(shades, 3));
  }
  const piece = mesh(g, geometry, "#ffffff", id, flags);
  piece.material.vertexColors = true;
  return piece;
}
// A cut through one lipid bilayer exposes its hydrophobic interior between two
// polar faces. The edge is shared by the membrane fragment and crista crops.
export function bilayerEdge(g, sample, steps, id, flags) {
  const geometry = surface((u, v) => sample(u, v * 2 - 1), steps, 4);
  const bands = ["#e0b997", "#b3876b", "#886855", "#b08868", "#e9c79a"].map(
    (color) => new THREE.Color(color),
  );
  const shades = [];
  for (let i = 0; i <= steps; i++)
    for (const color of bands) shades.push(color.r, color.g, color.b);
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
  return membranePiece(g, geometry, null, id, flags);
}
