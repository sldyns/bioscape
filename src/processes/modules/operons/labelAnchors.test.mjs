import assert from "node:assert/strict";
import * as THREE from "three";
import lac from "./lacOperonProcess.js";
import trp from "./trpOperonProcess.js";
import gal from "./yeastGalProcess.js";
import hog from "./yeastOsmoregulationProcess.js";

const matrix = new THREE.Matrix4(),
  point = new THREE.Vector3();
let checks = 0;
const scenarios = (m) =>
  m.controls.reduce(
    (rows, c) =>
      rows.flatMap((r) => c.options.map((o) => ({ ...r, [c.id]: o.value }))),
    [{}],
  );
function named(s, name) {
  const o = s.group.getObjectByName(name);
  assert(o, `missing target ${name}`);
  return o;
}
function visible(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}
function surfaceVertex(mesh) {
  const p = mesh.geometry.attributes.position;
  let best = 0;
  for (let i = 1; i < p.count; i++) if (p.getZ(i) > p.getZ(best)) best = i;
  return best;
}
function surface(s, index, target) {
  checks++;
  if (s.labels[index].active === false) return;
  assert(
    visible(target),
    `${s.labels[index].text.en}: hidden target still labeled`,
  );
  point
    .fromBufferAttribute(
      target.geometry.attributes.position,
      surfaceVertex(target),
    )
    .applyMatrix4(target.matrixWorld);
  assert(
    point.distanceTo(new THREE.Vector3().fromArray(s.labels[index].position)) <
      1e-6,
    `${s.labels[index].text.en}: leader misses actual ${target.name} surface`,
  );
}
function dna(s, index, x) {
  checks++;
  const mesh = named(s, "DNA phosphates 0");
  let best = 0,
    gap = Infinity;
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, matrix);
    const d = Math.abs(matrix.elements[12] - x);
    if (d < gap) {
      gap = d;
      best = i;
    }
  }
  mesh.getMatrixAt(best, matrix);
  point
    .fromBufferAttribute(mesh.geometry.attributes.position, surfaceVertex(mesh))
    .applyMatrix4(matrix)
    .applyMatrix4(mesh.matrixWorld);
  assert(
    point.distanceTo(new THREE.Vector3().fromArray(s.labels[index].position)) <
      1e-6,
    `${s.labels[index].text.en}: leader misses its actual DNA site`,
  );
}
function tube(s, index, target, mode = "middle") {
  checks++;
  const g = target.geometry,
    n = Math.min(g.index.count, g.drawRange.count);
  if (s.labels[index].active === false) return;
  assert(
    visible(target) && n > 0,
    `${s.labels[index].text.en}: absent RNA remains labeled`,
  );
  let vertex = g.index.array[Math.floor((n - 1) / 2)];
  if (mode === "start") vertex = g.index.array[0];
  if (mode === "end") {
    vertex = 0;
    for (let j = Math.max(0, n - 48); j < n; j++)
      vertex = Math.max(vertex, g.index.array[j]);
  }
  point
    .fromBufferAttribute(g.attributes.position, vertex)
    .applyMatrix4(target.matrixWorld);
  assert(
    point.distanceTo(new THREE.Vector3().fromArray(s.labels[index].position)) <
      1e-6,
    `${s.labels[index].text.en}: label does not follow the drawn RNA ${mode}`,
  );
}
function galWording(s) {
  const bound =
    named(s, "Gal3-bound galactose").visible &&
    named(s, "Gal3-bound ATP").visible;
  assert.equal(
    /galactose · ATP/.test(s.labels[4].text.en),
    bound,
    "hidden Gal3 ligands are falsely named as a bound complex",
  );
  assert.equal(/半乳糖 · ATP/.test(s.labels[4].text.zh), bound);
}
function trpWording(s) {
  const pol = [];
  s.group.traverse((o) => {
    if (o.name.startsWith("Bacterial RNAP:")) pol.push(o.parent);
  });
  if (s.labels[12].active !== false && /released/.test(s.labels[12].text.en))
    assert(!pol[0].visible, "leader RNA claims release before RNAP departure");
}
function check(s, m, params, p) {
  s.group.updateMatrixWorld(true);
  if (m.id === "lacOperon") {
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) =>
      assert.equal(s.labels[i].active, true),
    );
    assert.equal(s.labels[9].active, params.lactose !== "absent" && p < 0.42);
    assert.equal(s.labels[10].active, params.lactose !== "absent" && p > 0.6);
    [-3.15, -2.05, -1.1, 0.45, 2.1, 3.4].forEach((x, i) => dna(s, i, x));
    surface(s, 6, named(s, "LacI protein surface"));
    surface(s, 7, named(s, "CAP protein surface"));
    surface(s, 8, named(s, "Pre-existing beta-galactosidase"));
    surface(
      s,
      9,
      visible(named(s, "Lactose sugar unit"))
        ? named(s, "Lactose sugar unit")
        : named(s, "LacI bound allolactose 0"),
    );
    tube(s, 10, named(s, "lacZYA transcript 0"));
    assert.equal(
      s.labels[8].active,
      named(s, "Pre-existing beta-galactosidase").visible,
    );
    if (params.lactose === "absent") assert.equal(s.labels[9].active, false);
  } else if (m.id === "trpOperon") {
    [0, 1, 2].forEach((i) => assert.equal(s.labels[i].active, true));
    assert.equal(s.labels[3].active, p > 0.26);
    assert.equal(s.labels[7].active, p >= 0.63);
    assert.equal(s.labels[8].active, p >= 0.3);
    assert.equal(
      s.labels[10].active,
      visible(named(s, "Initiated bacterial RNAP surface")),
    );
    assert.equal(s.labels[12].active, p >= 0.78);
    const stem =
      params.tryptophan === "high" && params.charging === "normal"
        ? "terminator"
        : "antiterminator";
    surface(s, 0, named(s, "TrpR protein surface"));
    dna(s, 1, -3.1);
    dna(s, 2, 3.2);
    surface(s, 3, named(s, "Leader UGG codon 0"));
    for (let i = 1; i < 4; i++)
      tube(s, i + 3, named(s, `trp ${stem} RNA region ${i + 1}`));
    surface(s, 7, named(s, `trp ${stem} base pair 3`));
    surface(s, 8, named(s, "Leader ribosome large subunit"));
    surface(s, 9, named(s, "Leader U-rich tract nucleotide 2"));
    surface(s, 10, named(s, "Initiated bacterial RNAP surface"));
    tube(s, 11, named(s, `trp ${stem} RNA region 1`), "start");
    const extension = named(s, "trp structural gene RNA extension");
    tube(
      s,
      12,
      visible(extension) && extension.geometry.drawRange.count > 0
        ? extension
        : named(s, `trp ${stem} RNA region 4`),
      "end",
    );
    trpWording(s);
  } else if (m.id === "yeastGal") {
    [0, 1, 2, 3, 4].forEach((i) => assert.equal(s.labels[i].active, true));
    const transcript = named(s, "GAL1 transcript");
    assert.equal(
      s.labels[6].active,
      visible(named(s, "Gal4 coactivator ring")),
    );
    assert.equal(
      s.labels[7].active,
      visible(transcript) && transcript.geometry.drawRange.count > 0,
    );
    assert.equal(s.labels[9].active, p > 0.57);
    surface(s, 0, named(s, "Gal4 DNA-binding domain"));
    dna(s, 1, 0.65);
    dna(s, 2, 2.2);
    surface(s, 3, named(s, "Gal80 protein surface"));
    surface(s, 4, named(s, "Gal3 ligand-sensor lobe 0"));
    surface(s, 5, named(s, "Cyc8-Tup1 corepressor surface"));
    surface(s, 6, named(s, "Gal4 coactivator ring"));
    tube(s, 7, named(s, "GAL1 transcript"));
    surface(
      s,
      9,
      named(
        s,
        params.glucose === "high"
          ? "Mig1 repressor surface"
          : params.galactose === "present"
            ? "Gal4 activation domain"
            : "Gal80 protein surface",
      ),
    );
    assert.equal(s.labels[8].annotationKind, "region");
    assert.equal(s.labels[5].active, params.glucose === "high");
    galWording(s);
    if (params.galactose === "absent" || params.glucose === "high")
      assert.equal(s.labels[7].active, false);
  } else {
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11].forEach((i) =>
      assert.equal(s.labels[i].active, true),
    );
    const transcript = named(s, "Nuclear GPD1 response RNA");
    assert.equal(
      s.labels[10].active,
      visible(transcript) && transcript.geometry.drawRange.count > 0,
    );
    const names = [
      "Sln1 extracellular sensor surface",
      "Ypd1 phosphorelay protein",
      "Ssk1 response regulator",
      "Ssk2-Ssk22 kinase N lobe",
      "Pbs2 kinase N lobe",
      "Hog1 kinase N lobe",
    ];
    names.forEach((name, i) => surface(s, i, named(s, name)));
    surface(s, 7, named(s, "Fps1 gate surface 0"));
    surface(s, 8, named(s, "Glycerol 1 first carbon"));
    tube(s, 10, named(s, "Nuclear GPD1 response RNA"));
    [6, 11].forEach((i) => assert.equal(s.labels[i].annotationKind, "region"));
    assert.equal(s.labels[9].annotationKind, "state");
    if (params.osmolarity === "unchanged" || params.hog1 === "inhibited")
      assert.equal(s.labels[10].active, false);
  }
  assert(s.labels.every((l) => l.position.every(Number.isFinite)));
}
for (const m of [lac, trp, gal, hog]) {
  const s = m.create();
  for (const params of scenarios(m)) {
    for (const p of [
      0, 0.15, 0.155, 0.165, 0.175, 0.185, 0.25, 0.26, 0.29, 0.325, 0.335,
      0.375, 0.385, 0.505, 0.545, 0.575, 0.675, 0.695, 0.735, 0.745, 0.78,
      0.885, 0.915, 0.935, 0.96, 0.97, 1,
    ]) {
      s.update(p, params);
      check(s, m, params, p);
    }
    s.update(0.735, params);
    const expected = JSON.stringify(s.labels);
    for (const p of [1, 0.15, 0.91, 0, 0.735]) s.update(p, params);
    assert.equal(
      JSON.stringify(s.labels),
      expected,
      "label targets or active state depend on seek history",
    );
    s.group.position.set(0.17, -0.23, 0.31);
    s.group.rotation.z = 0.07;
    s.update(0.735, params);
    check(s, m, params, 0.735);
    s.group.position.set(0, 0, 0);
    s.group.rotation.z = 0;
  }
}
// Move a real kinase lobe: correct labels follow geometry, not a duplicated pose.
const moved = hog.create();
named(moved, "Pbs2 kinase N lobe").position.x += 0.21;
moved.update(0.695);
surface(moved, 4, named(moved, "Pbs2 kinase N lobe"));
// Negative controls reproduce photographed legacy offsets and temporal claims.
const oldLac = lac.create();
oldLac.update(0.735);
oldLac.labels[6].position = [
  named(oldLac, "LacI repressor").position.x,
  named(oldLac, "LacI repressor").position.y + 0.8,
  0,
];
assert.throws(() => surface(oldLac, 6, named(oldLac, "LacI protein surface")));
const oldHog = hog.create();
oldHog.update(0.695);
oldHog.labels[4].position = [-0.55, -0.93, 0];
assert.throws(() => surface(oldHog, 4, named(oldHog, "Pbs2 kinase N lobe")));
const oldGal = gal.create();
oldGal.update(0);
oldGal.labels[4].text.en = "Gal3 · galactose · ATP";
assert.throws(() => galWording(oldGal));
const oldTrp = trp.create();
oldTrp.update(0.885, { tryptophan: "high", charging: "normal" });
oldTrp.labels[12].text.en = "Leader RNA released";
assert.throws(() => trpWording(oldTrp));
console.log(
  `operons label anchors: ${checks} actual target checks, 16 control combinations, all 28 gallery stage times plus boundary states, transformed geometry and deterministic seeks PASS; four legacy negative controls rejected.`,
);
