import assert from "node:assert/strict";
import * as THREE from "three";
import { processesByRoot } from "../../catalog.js";

const baseURL =
  process.env.CHROMATIN_LABEL_MODEL_DIR || new URL("./", import.meta.url).href;
const ids = ["chromatinAccess", "tad", "plantGenome", "plantRdDM"].filter(
  (id) =>
    !process.env.CHROMATIN_LABEL_ONLY ||
    process.env.CHROMATIN_LABEL_ONLY === id,
);
let assertions = 0,
  states = 0,
  combinations = 0;
const world = (object) => object.getWorldPosition(new THREE.Vector3());
function anchor(scene, index, point, message) {
  assert(scene.labels[index], message);
  const actual = new THREE.Vector3(...scene.labels[index].position);
  assert(
    actual.distanceTo(point) < 1e-5,
    `${message}: leader misses actual geometry by ${actual.distanceTo(point)}`,
  );
  assertions++;
}
function tubePoint(mesh, fraction = 0.5) {
  const attr = mesh.geometry.attributes.position;
  const ring = Math.round((attr.count / 8 - 1) * fraction),
    p = new THREE.Vector3();
  for (let i = 0; i < 8; i++)
    p.add(new THREE.Vector3().fromBufferAttribute(attr, ring * 8 + i));
  return p.multiplyScalar(1 / 8).applyMatrix4(mesh.matrixWorld);
}
function duplexPoint(scene, prefix) {
  return tubePoint(scene.group.getObjectByName(prefix + "A"))
    .add(tubePoint(scene.group.getObjectByName(prefix + "B")))
    .multiplyScalar(0.5);
}
function check(scene, id, parameters) {
  const groups = scene.group.children.filter((o) => o.type === "Group");
  if (id === "chromatinAccess") {
    const [core, remodeler, factor] = groups;
    anchor(
      scene,
      1,
      world(remodeler.children[0]),
      "chromatinAccess ISWI label names the green remodeler, not the brown factor",
    );
    anchor(
      scene,
      0,
      world(core.children[4]),
      "chromatinAccess histone label stays on the retained octamer",
    );
    anchor(
      scene,
      2,
      tubePoint(scene.group.getObjectByName("fixed-sequence-site")),
      "chromatinAccess sequence label stays on the actual gold site",
    );
    anchor(
      scene,
      3,
      world(factor.children[0]),
      "chromatinAccess factor label follows the factor during binding",
    );
  } else if (id === "tad") {
    const proteins = groups.filter(
      (o) => o.name === "oriented-CTCF-zinc-finger-chain",
    );
    anchor(
      scene,
      2,
      world(proteins[0].children[0]),
      "tad left CTCF label points to the green boundary protein, not a gold locus",
    );
    const deleted = parameters.condition === "boundaryDeleted";
    const deletedSite = scene.group.children.find(
      (o) =>
        o.geometry?.type === "TorusGeometry" &&
        o.geometry.parameters.radius === 0.2,
    );
    anchor(
      scene,
      3,
      world(deleted ? deletedSite : proteins[1].children[0]),
      "tad right label follows the CTCF or the actual deleted-site marker",
    );
    const cohesin = groups.find(
      (o) => o.name === "cohesin-SMC-coiled-coils-hinge-ATPase-heads-kleisin",
    );
    const hinge = cohesin.children.find(
      (o) =>
        o.geometry?.type === "SphereGeometry" &&
        Math.abs(o.position.y + 2.06) < 1e-8,
    );
    anchor(
      scene,
      1,
      world(hinge),
      "tad cohesin label follows its actual hinge/empty depleted locus",
    );
    const loci = scene.group.children.filter(
      (o) => o.geometry?.type === "SphereGeometry" && o.scale.x === 0.14,
    );
    assert.equal(loci.length, 2);
    if (scene.labels[4].active)
      anchor(
        scene,
        4,
        world(loci[0]).add(world(loci[1])).multiplyScalar(0.5),
        "tad contact annotation targets its dashed relationship",
      );
  } else if (id === "plantGenome") {
    const ribs = groups
      .filter((o) => o.position.x === -0.45)
      .sort((a, b) => b.position.y - a.position.y);
    assert.equal(ribs.length, 2);
    anchor(
      scene,
      3,
      world(ribs[0].children[0]),
      "plantGenome upper cytosolic-ribosome label reaches that actual ribosome",
    );
    anchor(
      scene,
      9,
      world(ribs[1].children[0]),
      "plantGenome lower cytosolic-ribosome label reaches that actual ribosome",
    );
    anchor(
      scene,
      0,
      duplexPoint(scene, "nuclear-DNA-"),
      "plantGenome nuclear-genome annotation reaches nuclear DNA",
    );
    anchor(
      scene,
      1,
      duplexPoint(scene, "organelle-0-DNA-"),
      "plantGenome plastid-genome annotation reaches plastid DNA",
    );
    anchor(
      scene,
      2,
      duplexPoint(scene, "organelle-1-DNA-"),
      "plantGenome mitochondrial-genome annotation reaches mitochondrial DNA",
    );
    for (const [i, name] of [
      [4, "TOC-or-TIC-protein-translocation-channel"],
      [5, "TOM-or-TIM-protein-translocation-channel"],
    ])
      anchor(
        scene,
        i,
        world(scene.group.getObjectByName(name)),
        "plantGenome translocase annotation reaches its drawn import channel",
      );
    const chains = scene.group.children.filter(
      (o) =>
        o.geometry?.type === "BufferGeometry" &&
        o.geometry.attributes.position.count === 101 * 8,
    );
    assert.equal(chains.length, 2);
    for (let i = 0; i < 2; i++) {
      assert.equal(
        scene.labels[6 + i].active,
        chains[i].visible,
        "precursor label is shown only when that precursor exists",
      );
      anchor(
        scene,
        6 + i,
        tubePoint(chains[i]),
        "plantGenome conditional import/cytosol label tracks the actual precursor",
      );
    }
  } else {
    const producers = groups.filter((o) =>
      o.children.some(
        (c) => c.name === "enzyme-subunits-and-nucleic-acid-binding-cleft",
      ),
    );
    const [polIV, rdr, polV, ago, drm] = producers;
    const dcl = groups.find(
      (o) => o.position.x === -0.7 && o.position.y === 1.15,
    );
    anchor(
      scene,
      2,
      world(dcl.children[0].children[0]),
      "plantRdDM DCL3 label targets the jaws rather than the source DNA",
    );
    anchor(
      scene,
      1,
      world(rdr.children[0].children[1]),
      "plantRdDM RDR2 label reaches the source-bound producer",
    );
    anchor(
      scene,
      0,
      world(polIV.children[0].children[2]),
      "plantRdDM Pol IV label targets its actual domain",
    );
    anchor(
      scene,
      3,
      world(ago.children[0].children[2]),
      "plantRdDM AGO4 label follows actual guide-carrier motion and scale",
    );
    anchor(
      scene,
      4,
      world(polV.children[0].children[2]),
      "plantRdDM Pol V label targets its actual domain",
    );
    anchor(
      scene,
      8,
      world(drm.children[0].children[2]),
      "plantRdDM DRM2 label follows the recruited methyltransferase",
    );
    anchor(
      scene,
      5,
      world(scene.group.getObjectByName("single-target-cytosine-ring")),
      "plantRdDM target label follows the same flipped cytosine",
    );
    const scaffold = scene.group.children.find(
      (o) =>
        o.geometry?.type === "BufferGeometry" &&
        o.geometry.attributes.position.count === 111 * 8,
    );
    anchor(
      scene,
      6,
      tubePoint(scaffold),
      "plantRdDM scaffold annotation follows the actual transcript midpoint",
    );
  }
}
for (const id of ids) {
  const { default: model } = await import(
    new URL(`${id}Process.js`, baseURL).href
  );
  const roots = Object.entries(processesByRoot)
    .filter(([, ids]) => ids.includes(id))
    .map(([r]) => r);
  for (const rootId of roots)
    for (const option of model.controls[0].options) {
      const scene = model.create({ rootId }),
        parameters = { [model.controls[0].id]: option.value };
      for (const p of [
        0.835, 0.08, 1, 0.175, 0, 0.475, 0.14, 0.965, 0.28, 0.635, 0.31, 0.355,
        0.345, 0.76, 0.6,
      ]) {
        scene.update(p, parameters);
        scene.group.updateMatrixWorld(true);
        check(scene, id, parameters);
        states++;
      }
      combinations++;
    }
}
console.log(
  `Chromatin actual-geometry label anchors passed: ${assertions} target checks, ${states} non-monotonic states, ${combinations} registered root/control combinations.`,
);
