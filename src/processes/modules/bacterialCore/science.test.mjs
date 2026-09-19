import assert from "node:assert/strict";
import "./bubble.science.test.mjs";
import * as THREE from "three";
import * as esbuild from "esbuild";
import expression from "./bacterialExpressionProcess.js";
import division from "./bacterialDivisionProcess.js";
import conjugation from "./conjugationProcess.js";
import transformation from "./transformationProcess.js";

const tolerance = 2e-5;
const near = (a, b, message, limit = tolerance) =>
  assert(a.distanceTo(b) < limit, `${message}: gap ${a.distanceTo(b)}`);
const world = (mesh) => mesh.getWorldPosition(new THREE.Vector3());
const ends = (mesh) =>
  [-0.5, 0.5].map((y) => mesh.localToWorld(new THREE.Vector3(0, y, 0)));
const visible = (mesh) => {
  for (let p = mesh; p; p = p.parent) if (!p.visible) return false;
  return true;
};
const named = (scene, prefix, n) =>
  Array.from({ length: n }, (_, i) => {
    const object = scene.group.getObjectByName(`${prefix}${i}`);
    assert(object, `${prefix}${i} exists`);
    return object;
  });
const chain = (meshes, message) => {
  for (let i = 1; i < meshes.length; i++)
    near(ends(meshes[i - 1])[1], ends(meshes[i])[0], message);
};
const closed = (meshes, message) => {
  chain(meshes, message);
  near(ends(meshes.at(-1))[1], ends(meshes[0])[0], message);
};
const pointSegment = (point, mesh) =>
  new THREE.Line3(...ends(mesh))
    .closestPointToPoint(point, true, new THREE.Vector3())
    .distanceTo(point);
const snapshot = (scene) => {
  scene.group.updateMatrixWorld(true);
  const out = [];
  scene.group.traverse((n) =>
    out.push([
      n.visible,
      n.matrixWorld.elements,
      n.geometry?.attributes.position?.array
        ? Array.from(n.geometry.attributes.position.array)
        : null,
      n.isInstancedMesh ? Array.from(n.instanceMatrix.array) : null,
    ]),
  );
  return JSON.stringify(out);
};
const inventories = (scene) => {
  const objects = [],
    geometries = new Set(),
    materials = new Set();
  scene.group.traverse((n) => {
    objects.push(n);
    if (n.geometry) geometries.add(n.geometry);
    if (n.material) materials.add(n.material);
  });
  return { objects, geometries, materials };
};

function expressionCheck(scene, p, parameters) {
  const rna = named(scene, "nascent-RNA-", 70),
    beads = named(scene, "nascent-peptide-", 24),
    bonds = named(scene, "peptide-bond-", 23);
  const active = scene.group.getObjectByName("RNAP-active-3prime"),
    exit = scene.group.getObjectByName("50S-peptide-exit");
  if (parameters.sigma === "absent") {
    assert(rna.every((n) => !visible(n)));
    assert(beads.every((n) => !visible(n)));
    return;
  }
  if (visible(rna[0])) {
    chain(rna, "RNA is one continuous chain");
    near(
      ends(rna[0])[0],
      world(active),
      "RNA growing 3′ is at the RNAP active site",
    );
    near(
      new THREE.Vector3(...scene.labels[6].position),
      world(active),
      "3′ label follows the actual active end",
    );
    const hybrid = named(scene, "RNA-template-hybrid-", 8);
    assert(hybrid.every(visible));
    near(
      ends(hybrid[0])[0],
      ends(rna[0])[0],
      "hybrid includes the active RNA 3′",
    );
    const template = named(scene, "DNA-strand-0-", 98);
    for (const pair of hybrid) {
      assert(
        Math.min(...template.map((mesh) => pointSegment(ends(pair)[1], mesh))) <
          0.025,
        "RNA-template hybrid terminates on the rendered template backbone",
      );
    }
    for (const pair of hybrid)
      assert(
        ends(pair)[0].distanceTo(ends(pair)[1]) < 0.13,
        "hybrid pairs are short, not a second distant RNA",
      );
  }
  if (visible(beads[0])) {
    near(
      world(beads[0]),
      world(exit),
      "nascent peptide starts at the actual 50S exit",
    );
    for (let i = 0; i < bonds.length; i++)
      if (visible(bonds[i])) {
        near(
          ends(bonds[i])[0],
          world(beads[i]),
          "peptide bond starts at previous residue",
        );
        near(
          ends(bonds[i])[1],
          world(beads[i + 1]),
          "peptide bond ends at next residue",
        );
      }
  }
}
function divisionCheck(scene, p, parameters) {
  const arms = [
      named(scene, "replicated-arm-0-", 288),
      named(scene, "replicated-arm-1-", 288),
    ],
    unrep = named(scene, "unreplicated-DNA-", 144);
  const forks = named(scene, "replication-fork-", 2);
  if (visible(unrep[0]) && visible(arms[0][0])) {
    for (const arm of arms) {
      chain(arm, "replicated DNA arm stays continuous");
      near(
        ends(arm[0])[0],
        world(forks[0]),
        "nascent arm starts at shared fork",
      );
      near(
        ends(arm.at(-1))[1],
        world(forks[1]),
        "nascent arm ends at shared fork",
      );
    }
    chain(unrep, "unreplicated arc is continuous");
    near(
      ends(unrep[0])[0],
      world(forks[1]),
      "unreplicated arc joins plus fork",
    );
    near(
      ends(unrep.at(-1))[1],
      world(forks[0]),
      "unreplicated arc joins minus fork",
    );
  } else if (visible(unrep[0])) closed(unrep, "initial chromosome is closed");
  else
    for (const arm of arms)
      closed(arm, "completed daughter chromosome is closed");
  const fts = named(scene, "FtsZ-filament-", 40);
  for (const filament of fts.filter(visible))
    assert(
      Math.abs(filament.scale.x - 0.043) < 1e-9,
      "FtsZ thickness does not shrink with the septum",
    );
  if (p === 0.85) {
    const membrane =
      scene.group.getObjectByName("envelope-0-0.9").geometry.attributes
        .position;
    const neckRadius = Math.hypot(membrane.getY(0), membrane.getZ(0));
    assert(neckRadius > 0, "inner membrane neck is still open");
    if (parameters.septalSynthesis === "active") {
      assert(
        fts.every((n) => !visible(n)),
        "FtsZ has left before closure",
      );
      assert(
        named(scene, "FtsWI-", 14).some(visible),
        "septal synthesis remains after FtsZ departure",
      );
    } else
      assert(
        fts.some(visible),
        "blocked synthesis retains early FtsZ scaffold",
      );
  }
}
function conjugationCheck(scene, p, parameters) {
  const strand = named(scene, "T-strand-", 240),
    relaxase = scene.group.getObjectByName("TraI-leading-5prime");
  assert(strand.every(visible), "one material T strand stays represented");
  chain(strand, "T strand is connected from 5′ to 3′");
  const points = strand.map((m) => ends(m)[0]);
  points.push(ends(strand.at(-1))[1]);
  const isClosed = parameters.oriT === "blocked" || p <= 0.36 || p >= 0.8;
  if (isClosed)
    near(
      points[0],
      points.at(-1),
      "T strand closes only before nicking or after complete delivery",
    );
  else
    assert(
      points[0].distanceTo(points.at(-1)) > 1e-5,
      "transferring T strand has two distinct ends",
    );
  if (visible(relaxase))
    near(
      world(relaxase),
      points[0],
      "TraI is covalently attached to leading 5′ endpoint",
    );
  // A single open chain must not contain an extra circular copy at either end.
  for (let i = 0; i < points.length; i++)
    for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1 && isClosed) continue;
      assert(
        points[i].distanceTo(points[j]) > 1e-6,
        "no duplicated T-strand material or loop attached to bridge",
      );
    }
  if (parameters.oriT === "blocked" || p <= 0.36)
    assert(
      points.every((v) => v.x < 0),
      "uncut strand stays in donor",
    );
  if (parameters.oriT !== "blocked" && p >= 0.8)
    assert(
      points.every((v) => v.x > 0),
      "closed recipient strand has no remaining bridge or donor arc",
    );
  if (parameters.oriT !== "blocked" && p === 0.64)
    assert(
      Math.min(
        ...strand.map((m) =>
          pointSegment(new THREE.Vector3(0, -0.55, 0.12), m),
        ),
      ) < 0.025,
      "single T strand traverses actual transfer pore",
    );
}
function transformationCheck(scene, p, parameters, baseline) {
  const incoming = named(scene, "incoming-strand-", 35),
    resident = named(scene, "resident-strand-0-", 110),
    complement = named(scene, "resident-strand-1-", 110);
  closed(complement, "resident complementary chromosome stays connected");
  if (parameters.homology === "absent" || p <= 0.74) {
    assert(
      resident.every(visible),
      "recipient chromosome intact before homology contact",
    );
    for (let i = 0; i < 110; i++)
      for (let e = 0; e < 2; e++)
        near(
          ends(resident[i])[e],
          baseline[i][e],
          "no premature resident-strand displacement",
        );
  } else if (p < 0.9) {
    assert(
      resident.every(visible),
      "displaced resident strand remains attached in D-loop",
    );
    closed(resident, "D-loop does not fragment original chromosome");
    for (let i = 9; i <= 44; i++) {
      const current = ends(resident[i])[0],
        original = baseline[i][0];
      if (current.distanceTo(original) > 1e-6) {
        const index = 44 - i;
        const inputPoint =
          index === 35 ? ends(incoming.at(-1))[1] : ends(incoming[index])[0];
        near(
          inputPoint,
          original,
          "resident displacement only where incoming strand has made contact",
        );
      }
    }
  } else {
    assert(
      resident.slice(9, 44).every((m) => !visible(m)),
      "integrated tract replaces only corresponding resident arc",
    );
    chain(incoming, "integrated input DNA is continuous");
    near(
      ends(incoming[0])[0],
      ends(resident[44])[0],
      "incoming tract joins high-angle chromosome boundary",
    );
    near(
      ends(incoming.at(-1))[1],
      ends(resident[8])[1],
      "incoming tract joins low-angle chromosome boundary",
    );
  }
  const anchor = scene.group.getObjectByName("ComEA-transmembrane-anchor");
  const a = anchor.localToWorld(anchor.geometry.parameters.path.getPoint(0)),
    z = anchor.localToWorld(anchor.geometry.parameters.path.getPoint(1));
  const membraneSurfaces = [];
  scene.group.traverse((n) => {
    if (
      n.isMesh &&
      n.geometry.type === "BufferGeometry" &&
      n.material.color?.getHexString() === "87a596"
    )
      membraneSurfaces.push(n);
  });
  assert.equal(
    membraneSurfaces.length,
    2,
    "one membrane with two rendered leaflets",
  );
  const ray = new THREE.Raycaster(
    a,
    z.clone().sub(a).normalize(),
    0,
    a.distanceTo(z),
  );
  for (const surface of membraneSurfaces)
    assert(
      ray.intersectObject(surface, false).length > 0,
      "ComEA anchor crosses the actual leaflet triangles",
    );
  const domain = world(
    scene.group.getObjectByName("ComEA-extracytoplasmic-domain"),
  );
  assert(
    domain.x < a.x,
    "ComEA binding domain remains outside anchored membrane",
  );
}

for (const model of [expression, division, conjugation, transformation]) {
  const scene = model.create(),
    initial = inventories(scene);
  scene.group.updateMatrixWorld(true);
  const baseline =
    model === transformation
      ? named(scene, "resident-strand-0-", 110).map(ends)
      : null;
  const samples = new Set([
    0, 1, 0.34, 0.37, 0.47, 0.64, 0.68, 0.735, 0.741, 0.785, 0.8, 0.83, 0.85,
    0.89, 0.9, 0.95,
  ]);
  for (let i = 0; i <= 40; i++) samples.add(i / 40);
  model.stages.forEach((stage, i) => {
    samples.add(stage.at);
    samples.add((stage.at + (model.stages[i + 1]?.at ?? 1)) / 2);
  });
  for (const option of model.controls[0].options) {
    const parameters = { [model.controls[0].id]: option.value };
    for (const p of [...samples].sort((a, b) => a - b)) {
      scene.update(p, parameters);
      scene.group.updateMatrixWorld(true);
      scene.group.traverse((n) => {
        assert(
          n.matrixWorld.elements.every(Number.isFinite),
          `${model.id} finite transforms`,
        );
        if (n.isInstancedMesh)
          assert(
            n.instanceMatrix.array.every(Number.isFinite),
            `${model.id} finite instances`,
          );
        if (n.geometry?.attributes.position)
          assert(
            n.geometry.attributes.position.array.every(Number.isFinite),
            `${model.id} finite vertex positions`,
          );
      });
      if (model === expression) expressionCheck(scene, p, parameters);
      if (model === division) divisionCheck(scene, p, parameters);
      if (model === conjugation) conjugationCheck(scene, p, parameters);
      if (model === transformation)
        transformationCheck(scene, p, parameters, baseline);
    }
    scene.update(0.785, parameters);
    const expected = snapshot(scene);
    scene.update(0, parameters);
    scene.update(1, parameters);
    scene.update(0.785, parameters);
    assert.equal(snapshot(scene), expected, `${model.id} deterministic seek`);
  }
  const final = inventories(scene);
  assert.deepEqual(final.objects, initial.objects, "stable object inventory");
  assert.deepEqual(
    final.geometries,
    initial.geometries,
    "stable geometry inventory",
  );
  assert.deepEqual(
    final.materials,
    initial.materials,
    "stable material inventory",
  );
  for (const geometry of final.geometries)
    for (const attribute of Object.values(geometry.attributes))
      assert(
        attribute.array.every(Number.isFinite),
        "finite geometry vertices",
      );
  await esbuild.build({
    entryPoints: [new URL(`./${model.id}Process.js`, import.meta.url).pathname],
    bundle: true,
    platform: "node",
    write: false,
    logLevel: "silent",
  });
  console.log(
    `${model.id}: ${samples.size} times × 2 conditions; actual geometry, deterministic seeks, stable resources, finite vertices, bundle passed`,
  );
}

// Deliberately reintroduce each audited class of defect into actual scene objects.
// Every witness must be rejected by the same geometry checks used above.
function rejectsMutation(model, p, parameters, mutate, checker, issueId) {
  const scene = model.create();
  scene.group.updateMatrixWorld(true);
  const baseline =
    model === transformation
      ? named(scene, "resident-strand-0-", 110).map(ends)
      : null;
  scene.update(p, parameters);
  scene.group.updateMatrixWorld(true);
  mutate(scene);
  scene.group.updateMatrixWorld(true);
  assert.throws(
    () => checker(scene, p, parameters, baseline),
    assert.AssertionError,
    `${issueId}: regression detects restored defect`,
  );
  console.log(`${issueId}: injected original-class geometric defect rejected`);
}
rejectsMutation(
  expression,
  0.9,
  { sigma: "present" },
  (s) => (s.group.getObjectByName("nascent-peptide-0").position.z += 0.35),
  expressionCheck,
  "bacterialCore-01",
);
rejectsMutation(
  expression,
  0.9,
  { sigma: "present" },
  (s) => (s.group.getObjectByName("RNAP-active-3prime").position.x += 0.38),
  expressionCheck,
  "bacterialCore-02",
);
rejectsMutation(
  division,
  0.37,
  { septalSynthesis: "active" },
  (s) =>
    (s.group.getObjectByName("replicated-arm-1-0").parent.position.x += 1.59),
  divisionCheck,
  "bacterialCore-03",
);
rejectsMutation(
  division,
  0.85,
  { septalSynthesis: "active" },
  (s) => {
    s.group.getObjectByName("FtsZ-scaffold").visible = true;
    s.group.getObjectByName("FtsZ-filament-0").visible = true;
  },
  divisionCheck,
  "bacterialCore-04",
);
rejectsMutation(
  conjugation,
  0.64,
  { oriT: "intact" },
  (s) => (s.group.getObjectByName("T-strand-120").position.x += 0.98),
  conjugationCheck,
  "bacterialCore-05",
);
rejectsMutation(
  transformation,
  0.68,
  { homology: "matched" },
  (s) => (s.group.getObjectByName("resident-strand-0-20").visible = false),
  transformationCheck,
  "bacterialCore-06",
);
rejectsMutation(
  transformation,
  0.4,
  { homology: "matched" },
  (s) =>
    (s.group.getObjectByName("ComEA-transmembrane-anchor").position.x -= 0.5),
  transformationCheck,
  "bacterialCore-07",
);
