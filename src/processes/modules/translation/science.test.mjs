import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { entries } from "./entries.js";
const large = JSON.parse(
  await readFile(
    new URL(
      "../../../scene/data/ribosome-4ug0-largeSubunit.json",
      import.meta.url,
    ),
  ),
);
const small = JSON.parse(
  await readFile(
    new URL(
      "../../../scene/data/ribosome-4ug0-smallSubunit.json",
      import.meta.url,
    ),
  ),
);
const source = [...large.chains, ...small.chains];
const v = (a) => new THREE.Vector3(...a);
const close = (a, b, tolerance = 2e-5) =>
  assert(a.distanceTo(b) < tolerance, `${a.toArray()} != ${b.toArray()}`);
function point(o) {
  return o.getWorldPosition(new THREE.Vector3());
}
function endpoints(o) {
  return [-0.5, 0.5].map((y) => o.localToWorld(new THREE.Vector3(0, y, 0)));
}
function attached(bond, a, b) {
  const ends = endpoints(bond),
    match = (x, y) => x.distanceTo(y) < 1e-6;
  assert(
    (match(ends[0], a) && match(ends[1], b)) ||
      (match(ends[0], b) && match(ends[1], a)),
    `${bond.name} misses a molecular endpoint`,
  );
}
function effectivelyVisible(object) {
  assert(object, "required molecular object missing");
  for (let node = object; node; node = node.parent)
    if (!node.visible) return false;
  return true;
}
function verifyTranslationRNA(scene, progress) {
  const get = (name) => scene.group.getObjectByName(name);
  assert(
    effectivelyVisible(get("magnified-reaction-schematic")),
    "reaction parent hidden",
  );
  for (const name of ["P-tRNA", "A-tRNA"]) {
    const expected = progress < (name === "P-tRNA" ? 0.81 : 0.99);
    const body = get(name),
      tip = get(`${name}-3prime-CCA`);
    assert.equal(
      effectivelyVisible(body),
      expected,
      `${name} effective visibility`,
    );
    const end = get(`${name}-backbone-3prime-end`);
    assert(
      point(end).distanceTo(point(tip)) < 1e-6,
      `${name} RNA backbone end detached from CCA`,
    );
    const residue = (i) => (i === 47 ? end : get(`${name}-rna-residue-${i}`));
    for (let i = 0; i < 47; i++) {
      const link = get(`${name}-rna-backbone-${i}`);
      attached(link, point(residue(i)), point(residue(i + 1)));
      assert.equal(
        effectivelyVisible(link),
        expected,
        `${name} backbone segment hidden`,
      );
      assert.equal(
        effectivelyVisible(residue(i)),
        expected,
        `${name} nucleotide hidden`,
      );
    }
    assert.equal(effectivelyVisible(end), expected, `${name} RNA end hidden`);
    assert.equal(effectivelyVisible(tip), expected, `${name} CCA hidden`);
  }
  for (const [name, expected] of [
    ["P-peptidyl-ester", progress < 0.41],
    ["A-aminoacyl-ester", progress < 0.86],
    ["new-peptide-bond", progress >= 0.41],
    ["incoming-residue", true],
  ]) {
    assert.equal(
      effectivelyVisible(get(name)),
      expected,
      `${name} effective visibility`,
    );
  }
}
function verifyReference(group) {
  group.updateMatrixWorld(true);
  const assembly = group.getObjectByName("experimental-4ug0");
  assert(assembly);
  assert(effectivelyVisible(assembly), "experimental reference hidden");
  assert.equal(assembly.scale.x, assembly.scale.y);
  assert.equal(assembly.scale.x, assembly.scale.z);
  let commonMatrix;
  for (const subunit of ["largeSubunit", "smallSubunit"]) {
    const part = assembly.getObjectByName(subunit);
    assert.deepEqual(
      part.matrix.elements,
      new THREE.Matrix4().elements,
      "subunit independently transformed",
    );
    for (const kind of ["rna", "protein"]) {
      const residues = [],
        edges = [];
      for (const c of source.filter(
        (c) => c.subunit === subunit && c.kind === kind,
      )) {
        let prev;
        for (const r of c.residues) {
          const pos = v(r.slice(1));
          residues.push(pos);
          if (
            prev &&
            r[0] === prev.seq + 1 &&
            pos.distanceTo(prev.pos) <= (kind === "rna" ? 12 : 6)
          )
            edges.push([prev.pos, pos]);
          prev = { pos, seq: r[0] };
        }
      }
      const nodes = part.getObjectByName(`${subunit}-${kind}-residues`),
        bonds = part.getObjectByName(`${subunit}-${kind}-backbone`);
      assert(nodes.isInstancedMesh && bonds.isInstancedMesh);
      assert(
        effectivelyVisible(nodes) && effectivelyVisible(bonds),
        "experimental backbone hidden",
      );
      assert.equal(nodes.count, residues.length);
      assert.equal(bonds.count, edges.length);
      if (commonMatrix)
        assert.deepEqual(
          nodes.matrixWorld.elements,
          commonMatrix,
          "RNA/protein or subunits lost shared registration",
        );
      else commonMatrix = [...nodes.matrixWorld.elements];
      const mat = new THREE.Matrix4();
      residues.forEach((p, i) => {
        nodes.getMatrixAt(i, mat);
        close(new THREE.Vector3().setFromMatrixPosition(mat), p, 3e-5);
      });
      edges.forEach(([a, b], i) => {
        bonds.getMatrixAt(i, mat);
        const p = v([0, -0.5, 0]).applyMatrix4(mat),
          q = v([0, 0.5, 0]).applyMatrix4(mat);
        close(p, a, 4e-5);
        close(q, b, 4e-5);
      });
    }
  }
  return assembly;
}
function state(scene) {
  scene.group.updateMatrixWorld(true);
  const values = [];
  scene.group.traverse((o) =>
    values.push(o.visible, ...o.matrix.elements, o.material?.color?.getHex()),
  );
  return JSON.stringify([values, scene.labels, scene.group.userData]);
}
let combinations = 0,
  frames = 0;
for (const entry of entries) {
  const model = (await import(`./${entry.id}Process.js`)).default;
  const conditions = model.controls?.length
    ? model.controls[0].options.map((o) => ({
        [model.controls[0].id]: o.value,
      }))
    : [{}];
  for (const rootId of entry.roots) {
    const s = model.create({ rootId }),
      inventory = [],
      geometrySet = new Set();
    s.group.traverse((o) => {
      inventory.push(o.uuid, o.geometry?.uuid, o.material?.uuid);
      if (o.geometry) geometrySet.add(o.geometry);
    });
    for (const geo of geometrySet)
      for (const a of Object.values(geo.attributes))
        for (const x of a.array) assert(Number.isFinite(x));
    if (["translation", "proteinFolding"].includes(entry.id))
      verifyReference(s.group);
    const branchEnds = [];
    for (const condition of conditions) {
      combinations++;
      for (let i = 0; i <= 200; i++) {
        const p = i / 200;
        s.update(p, condition);
        s.group.updateMatrixWorld(true);
        frames++;
        const now = [];
        s.group.traverse((o) => {
          now.push(o.uuid, o.geometry?.uuid, o.material?.uuid);
          for (const x of o.matrixWorld.elements) assert(Number.isFinite(x));
        });
        assert.deepEqual(now, inventory, "resources allocated while seeking");
        if (entry.id === "translation") {
          verifyTranslationRNA(s, p);
          const get = (n) => s.group.getObjectByName(n),
            parent = get("magnified-reaction-schematic");
          const pE = get("P-peptidyl-ester"),
            aE = get("A-aminoacyl-ester"),
            pb = get("new-peptide-bond"),
            aa = get("incoming-residue"),
            old = get("peptide-residue-0");
          assert(
            aa.visible,
            "incoming residue was erased instead of incorporated",
          );
          assert.equal(pE.visible, p < 0.41);
          assert.equal(pb.visible, p >= 0.41);
          assert.equal(aE.visible, p < 0.86);
          if (pE.visible)
            attached(pE, point(get("P-tRNA-3prime-CCA")), point(old));
          if (aE.visible)
            attached(aE, point(get("A-tRNA-3prime-CCA")), point(aa));
          if (pb.visible) {
            attached(pb, point(old), point(aa));
            assert(
              point(old).distanceTo(point(aa)) < 0.5,
              "transfer stretches between remote tRNAs",
            );
          }
          for (let j = 0; j < 25; j++)
            attached(
              get(`peptide-backbone-${j}`),
              point(get(`peptide-residue-${j}`)),
              point(get(`peptide-residue-${j + 1}`)),
            );
          for (let j = 0; j < 26; j++) {
            const q = parent.worldToLocal(point(get(`peptide-residue-${j}`)));
            if (q.y >= 1.43 && q.y <= 2.63)
              assert(
                Math.hypot(q.x, q.z + 0.08) + 0.065 < 0.25,
                "peptide crosses schematic exit corridor",
              );
          }
          if (p >= 0.28 && p < 0.41)
            assert(
              point(get("P-tRNA-3prime-CCA")).distanceTo(
                point(get("A-tRNA-3prime-CCA")),
              ) < 0.46,
              "acceptor ends do not converge at PTC",
            );
          if (p >= 0.68 && p < 0.81) {
            const q = get("A-tRNA-anticodon").position;
            assert(Math.abs(q.x) < 1e-9);
          }
          if (p === 1) {
            assert(!pE.visible && !aE.visible);
            assert(pb.visible);
            assert(old.position.y > 2.63 && aa.position.y > 2.63);
          }
        }
        if (entry.id === "proteinFolding")
          assert.equal(
            s.group.getObjectByName(
              "nascent-chain-unshown-upstream-continuation",
            ).visible,
            p < 0.41,
          );
        if (entry.id === "nitrogenFixation")
          for (const side of ["left", "right"]) {
            const cofactor = s.group.getObjectByName(`FeMo-alpha-${side}`),
              alpha = s.group.getObjectByName(`alpha-domain-${side}`),
              beta = s.group.getObjectByName(`beta-domain-${side}`);
            const aBox = new THREE.Box3().setFromObject(alpha),
              bBox = new THREE.Box3().setFromObject(beta),
              cp = point(cofactor);
            // Domain projection test is stated as such: not a vertex-to-surface distance proxy.
            assert(cp.y > aBox.min.y && cp.y < aBox.max.y);
            assert(cp.x > aBox.min.x && cp.x < aBox.max.x);
            assert(cp.y > bBox.max.y, "FeMo placed in beta tier");
            const cBox = new THREE.Box3().setFromObject(cofactor);
            assert(cBox.min.y > bBox.max.y, "cofactor crosses into beta tier");
          }
      }
      s.update(0.615, condition);
      const before = state(s);
      s.update(0.13, condition);
      s.update(1, condition);
      s.update(0.615, condition);
      assert.equal(state(s), before, "seek not deterministic");
      s.update(1, condition);
      branchEnds.push(state(s));
    }
    if (branchEnds.length > 1)
      assert.notEqual(
        branchEnds[0],
        branchEnds[1],
        "control branches geometrically identical",
      );
    s.group.traverse((o) => {
      if (o.isInstancedMesh)
        for (const x of o.instanceMatrix.array) assert(Number.isFinite(x));
    });
    console.log(
      `${entry.id}/${rootId}: geometry, continuity, branches and seek PASS`,
    );
  }
}
console.log(
  `PASS: ${combinations} root/control combinations, ${frames} frames; experimental residue/edge coordinates and gaps checked.`,
);

// Fault injection mutates only this in-memory scene, never source files.
// Each fault must be rejected separately after a known-good baseline.
const mutationModel = (await import("./translationProcess.js")).default;
const mutationScene = mutationModel.create({ rootId: "cell" });
mutationScene.update(0.3);
mutationScene.group.updateMatrixWorld(true);
verifyTranslationRNA(mutationScene, 0.3);
const pBody = mutationScene.group.getObjectByName("P-tRNA");
pBody.visible = false;
assert.throws(
  () => verifyTranslationRNA(mutationScene, 0.3),
  /P-tRNA effective visibility/,
);
pBody.visible = true;
verifyTranslationRNA(mutationScene, 0.3);
const pEnd = mutationScene.group.getObjectByName("P-tRNA-backbone-3prime-end");
pEnd.position.x += 0.6;
mutationScene.group.updateMatrixWorld(true);
assert.throws(
  () => verifyTranslationRNA(mutationScene, 0.3),
  /RNA backbone end detached from CCA/,
);
mutationScene.update(0.3);
mutationScene.group.updateMatrixWorld(true);
verifyTranslationRNA(mutationScene, 0.3);
const hiddenParent = mutationScene.group.getObjectByName(
  "magnified-reaction-schematic",
);
hiddenParent.visible = false;
assert.throws(
  () => verifyTranslationRNA(mutationScene, 0.3),
  /reaction parent hidden/,
);
hiddenParent.visible = true;
console.log(
  "PASS: mutation regression rejects hidden tRNA parent, displaced real RNA end and hidden reaction ancestor.",
);
