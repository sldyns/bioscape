import assert from "node:assert/strict";
import * as T from "three";
import {
  buildErythrocyte,
  erythrocyteHalfThickness,
} from "../src/compare/models/erythrocyte.js";
const ids = ["erythrocyte", "erythrocyteMembrane", "erythrocyteCytosol"];
const signatures = [];
for (const id of ids) {
  const g = buildErythrocyte(id),
    geometry = new Set(),
    materials = new Set(),
    signature = [];
  g.updateMatrixWorld(true);
  g.traverse((o) => {
    assert(
      !o.isInstancedMesh,
      "detail flattening must preserve every structure",
    );
    if (!o.isMesh) return;
    assert(ids.includes(o.userData.hitId));
    assert(
      o.geometry.index.array.every(
        (i) => i < o.geometry.attributes.position.count,
      ),
    );
    for (const attr of Object.values(o.geometry.attributes))
      assert(attr.array.every(Number.isFinite));
    geometry.add(o.geometry);
    materials.add(o.material);
    signature.push([
      o.geometry.attributes.position.count,
      o.geometry.index.count,
      ...o.geometry.attributes.position.array.slice(0, 6),
    ]);
  });
  const size = new T.Box3().setFromObject(g).getSize(new T.Vector3());
  assert(Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 8);
  assert.equal(g.userData.biology.nuclei, 0);
  assert.equal(g.userData.biology.mitochondria, 0);
  assert.equal(g.userData.biology.diameterMicrometres, 7.82);
  assert.equal(g.userData.biology.centralThicknessMicrometres, 0.81);
  const again = buildErythrocyte(id),
    other = [];
  again.traverse((o) => {
    if (o.isMesh)
      other.push([
        o.geometry.attributes.position.count,
        o.geometry.index.count,
        ...o.geometry.attributes.position.array.slice(0, 6),
      ]);
  });
  assert.deepEqual(signature, other, "deterministic geometry");
  if (id === "erythrocyte") {
    assert(g.children.some((o) => o.userData.cap));
    assert(g.children.some((o) => o.userData.cutOnly));
    assert.equal(erythrocyteHalfThickness(0), 0.405);
    assert.equal(erythrocyteHalfThickness(1), 0);
    const section = g.children.find(
      (o) => o.userData.cutOnly && o.userData.hitId === "erythrocyteCytosol",
    );
    // Filled radial section includes the centre; section area must be positive.
    let area = 0;
    const p = section.geometry.attributes.position,
      idx = section.geometry.index;
    for (let i = 0; i < idx.count; i += 3) {
      const a = new T.Vector3().fromBufferAttribute(p, idx.getX(i)),
        b = new T.Vector3().fromBufferAttribute(p, idx.getX(i + 1)),
        c = new T.Vector3().fromBufferAttribute(p, idx.getX(i + 2));
      area += b.sub(a).cross(c.sub(a)).length() / 2;
    }
    assert(area > 0.8);
    assert(area < 3);
  }
  if (id === "erythrocyteMembrane") {
    assert.equal(g.userData.molecularDetail.bilayerLeaflets, 2);
    assert(g.userData.molecularDetail.cytoplasmicSkeleton);
    assert.equal(g.userData.molecularDetail.spectrinConnections, 18);
  }
  if (id === "erythrocyteCytosol") {
    const d = g.userData.molecularDetail;
    assert.equal(d.pdb, "2HHB");
    assert.equal(d.caResidues, 574);
    assert.equal(d.alphaChains, 2);
    assert.equal(d.betaChains, 2);
    assert.equal(d.hemes, 4);
    assert.equal(
      g.children.length,
      7,
      "four distinct chains plus heme bonds, atoms and irons",
    );
    assert.equal(
      g.children.at(-1).geometry.attributes.position.count,
      4 * 17 * 13,
      "exactly four iron marker spheres",
    );
  }
  console.log(
    JSON.stringify({
      id,
      meshes: g.children.length,
      geometries: geometry.size,
      materials: materials.size,
      vertices: [...geometry].reduce(
        (n, x) => n + x.attributes.position.count,
        0,
      ),
      bounds: size.toArray(),
    }),
  );
  geometry.forEach((x) => x.dispose());
  materials.forEach((x) => x.dispose());
  signatures.push(signature);
}
console.log(
  "Erythrocyte anatomical, deterministic and finite geometry checks passed. Rendered review is separate.",
);
