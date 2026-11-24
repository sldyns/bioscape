import assert from "node:assert/strict";
import * as T from "three";
import {
  buildErythrocyte,
  erythrocyteHalfThickness,
} from "../src/compare/models/erythrocyte.js";
const ids = ["erythrocyte", "erythrocyteMembrane", "erythrocyteCytosol"];
const signatures = [];
const at = (buffer, i) => new T.Vector3().fromBufferAttribute(buffer, i);
const ringCentre = (buffer, i) => at(buffer, i).lerp(at(buffer, i + 4), 0.5);
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
    const skeleton = g.children.find(
      (o) => o.material.color.getHexString() === "91afa6",
    ).geometry.attributes.position;
    const foot = g.children.find(
      (o) => o.material.color.getHexString() === "d2b077",
    ).geometry.attributes.position;
    const contact = ringCentre(foot, foot.count - 9);
    let gap = Infinity;
    for (let edge = 0; edge < 18; edge++) {
      const a = edge * 2 * 19 * 9,
        b = a + 19 * 9;
      assert(
        ringCentre(skeleton, a).distanceTo(ringCentre(skeleton, b)) < 1e-6,
      );
      assert(
        ringCentre(skeleton, a + 81).distanceTo(ringCentre(skeleton, b + 81)) >
          0.05,
      );
      for (const strand of [a, b])
        for (let j = 0; j < 18; j++) {
          const start = strand + 9 * j;
          const line = new T.Line3(
            ringCentre(skeleton, start),
            ringCentre(skeleton, start + 9),
          );
          gap = Math.min(
            gap,
            line
              .closestPointToPoint(contact, true, new T.Vector3())
              .distanceTo(contact),
          );
        }
    }
    assert(gap < 0.001, "ankyrin must reach a spectrin strand");
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
    for (const chain of g.children.slice(0, 4)) {
      const p = chain.geometry.attributes.position;
      let ribbon = 0,
        turn = 0;
      for (let i = 0; i < p.count; i += 9) {
        const aspect =
          at(p, i).distanceTo(at(p, i + 4)) /
          at(p, i + 2).distanceTo(at(p, i + 6));
        if (aspect > 4) ribbon++;
        if (aspect < 1.05) turn++;
      }
      assert(
        ribbon > p.count / 18 && turn > p.count / 120,
        "deposited helices and circular turns in every chain",
      );
    }
    const iron = g.children.at(-1).geometry.attributes.position;
    const bonds = g.children.at(-3).geometry.attributes.position;
    const centres = Array.from({ length: 4 }, (_, i) =>
      at(iron, i * 221).lerp(at(iron, i * 221 + 12 * 17), 0.5),
    );
    for (const centre of centres) {
      let ligands = 0;
      // Each eight-sided bond cylinder has a separate vertex at each cap centre.
      for (let i = 0; i < bonds.count; i += 52)
        if (
          Math.min(
            at(bonds, i + 18).distanceTo(centre),
            at(bonds, i + 35).distanceTo(centre),
          ) < 1e-5
        )
          ligands++;
      assert.equal(
        ligands,
        4,
        "four porphyrin nitrogens coordinate every iron",
      );
    }
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
