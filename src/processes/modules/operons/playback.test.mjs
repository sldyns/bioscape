import assert from "node:assert/strict";
import * as THREE from "three";
import lac from "./lacOperonProcess.js";
import trp from "./trpOperonProcess.js";
import gal from "./yeastGalProcess.js";
import hog from "./yeastOsmoregulationProcess.js";

const scenarios = (model) =>
  model.controls.reduce(
    (rows, c) =>
      rows.flatMap((r) => c.options.map((o) => ({ ...r, [c.id]: o.value }))),
    [{}],
  );
const named = (scene, name) => {
  const o = scene.group.getObjectByName(name);
  assert(o, `missing actual geometry: ${name}`);
  return o;
};
const matrix = new THREE.Matrix4();
function instanceCenter(mesh, i, out = new THREE.Vector3()) {
  mesh.getMatrixAt(i, matrix);
  return out.setFromMatrixPosition(matrix).applyMatrix4(mesh.matrixWorld);
}

export function verifyInducerOrder(model = lac) {
  const s = model.create(),
    repressor = named(s, "LacI repressor"),
    ligands = [0, 1].map((i) => named(s, `LacI bound allolactose ${i}`));
  const bound = repressor.position.clone();
  for (const params of scenarios(model)) {
    for (let i = 0; i <= 250; i++) {
      s.update(i / 1000, params);
      if (!ligands.every((o) => o.visible))
        assert(
          repressor.position.distanceTo(bound) < 1e-10,
          "20261004-operons-01: induced LacI movement precedes actual ligand occupancy",
        );
    }
    s.update(0.53, params);
    assert.equal(
      repressor.position.distanceTo(bound) > 1,
      params.lactose !== "absent",
    );
    assert.equal(
      ligands.every((o) => o.visible),
      params.lactose !== "absent",
    );
  }
}

export function verifyDNATransitions(model) {
  const s = model.create(),
    meshes = [0, 1].map((i) => named(s, `DNA phosphates ${i}`));
  const times =
    model.id === "lacOperon"
      ? [0.495, 0.53, 0.565, 0.57, 0.605, 0.645, 0.68, 0.87, 0.91, 0.95, 0.99]
      : model.id === "trpOperon"
        ? [0.17, 0.2, 0.22, 0.81, 0.96]
        : [0.68, 0.71, 0.72, 0.96, 0.97, 1];
  const points = () =>
    meshes.flatMap((mesh) =>
      Array.from({ length: mesh.count }, (_, i) => instanceCenter(mesh, i)),
    );
  let maximumFineStep = 0;
  for (const params of scenarios(model))
    for (const p of times) {
      const jumps = [1e-4, 1e-5].map((eps) => {
        s.update(p - eps, params);
        s.group.updateMatrixWorld(true);
        const a = points();
        s.update(p + eps, params);
        s.group.updateMatrixWorld(true);
        const b = points();
        return Math.max(...a.map((v, i) => v.distanceTo(b[i])));
      });
      maximumFineStep = Math.max(maximumFineStep, jumps[1]);
      assert(
        jumps[1] < 0.003,
        `${model.id}: finite DNA jump at ${p}: ${jumps[1]}`,
      );
      assert(
        jumps[1] <= jumps[0] * 0.14 + 1e-6,
        `${model.id}: DNA boundary displacement does not converge to zero at ${p}`,
      );
    }
  return maximumFineStep;
}

export function verifyRNAHandoff(model) {
  const s = model.create(),
    bridges = [];
  s.group.traverse((o) => {
    if (o.name === "Continuous nascent RNA exit from polymerase")
      bridges.push(o);
  });
  const ends = model.id === "lacOperon" ? [0.87, 0.91, 0.95] : [0.97];
  const rnas =
    model.id === "lacOperon"
      ? [0, 1, 2].map((i) => named(s, `lacZYA transcript ${i}`))
      : [named(s, "GAL1 transcript")];
  for (const params of scenarios(model)) {
    const count =
      model.id === "lacOperon"
        ? params.lactose === "absent"
          ? 0
          : params.glucose === "high"
            ? 1
            : 3
        : params.galactose === "present" && params.glucose === "low"
          ? 1
          : 0;
    for (let i = 0; i < bridges.length; i++) {
      const bridge = bridges[i],
        backbone = bridge.children[0],
        phosphates = bridge.children[1];
      const originalCounts = [backbone.count, phosphates.count];
      const times = [
        ends[i] - 1e-5,
        ends[i],
        ends[i] + 1e-5,
        Math.min(1, ends[i] + 0.025),
        1,
      ];
      let before = null;
      for (const p of times) {
        s.update(p, params);
        s.group.updateMatrixWorld(true);
        assert.equal(
          bridge.visible,
          i < count,
          `${model.id}: RNA exit strand disappears at release ${p}`,
        );
        if (i >= count) continue;
        assert.deepEqual(
          [backbone.count, phosphates.count],
          originalCounts,
          "release discarded covalent RNA elements",
        );
        const centers = Array.from({ length: phosphates.count }, (_, j) =>
          instanceCenter(phosphates, j),
        );
        for (let j = 0; j < backbone.count; j++) {
          backbone.getMatrixAt(j, matrix);
          const a = new THREE.Vector3(0, -0.5, 0)
            .applyMatrix4(matrix)
            .applyMatrix4(backbone.matrixWorld);
          const b = new THREE.Vector3(0, 0.5, 0)
            .applyMatrix4(matrix)
            .applyMatrix4(backbone.matrixWorld);
          assert(
            a.distanceTo(centers[j]) < 1e-5 &&
              b.distanceTo(centers[j + 1]) < 1e-5,
            "RNA bridge is not one connected backbone",
          );
        }
        const rna = rnas[i],
          geom = rna.geometry,
          draw = Math.min(geom.drawRange.count, geom.index.count);
        if (draw) {
          let last = 0;
          for (let j = 0; j < draw; j++)
            last = Math.max(last, geom.index.array[j]);
          const ring = Math.floor(last / (geom.parameters.radialSegments + 1));
          const end = geom.parameters.path
            .getPointAt(ring / geom.parameters.tubularSegments)
            .applyMatrix4(rna.matrixWorld);
          assert(
            end.distanceTo(centers[0]) < geom.parameters.radius + 0.033 + 0.01,
            "visible RNA prefix disconnected from its exit strand",
          );
        }
        if (p === ends[i] - 1e-5) before = centers;
        if (p === ends[i] + 1e-5)
          assert(
            Math.max(...centers.map((v, j) => v.distanceTo(before[j]))) < 0.003,
            "RNA material jumps at polymerase release",
          );
      }
    }
  }
}

export function verifyLeaderContinuity(model = trp) {
  const s = model.create();
  for (const params of scenarios(model))
    for (let i = 215; i <= 640; i++) {
      s.update(i / 1000, params);
      const branch = named(
        s,
        `trp leader RNA ${params.tryptophan === "high" && params.charging === "normal" ? "terminator" : "antiterminator"}`,
      );
      const strands = branch.children.filter(
        (o) => o.geometry?.type === "TubeGeometry",
      );
      for (let j = 1; j < strands.length; j++) {
        const previous = strands[j - 1].geometry,
          next = strands[j].geometry;
        assert(
          previous.parameters.path
            .getPointAt(1)
            .distanceTo(next.parameters.path.getPointAt(0)) < 1e-9,
          "leader regions do not share a real path junction",
        );
        if (next.drawRange.count > 0)
          assert.equal(
            previous.drawRange.count,
            previous.index.count,
            `20261004-operons-03: region ${j + 1} appears before region ${j} reaches the junction at p=${i / 1000}`,
          );
      }
    }
}

export function verifyGlycerolContainment(model = hog) {
  const s = model.create(),
    membrane = named(s, "Osmotic plasma membrane"),
    heads = named(s, "Paired membrane phosphate leaflets");
  const glycerol = Array.from({ length: 15 }, (_, i) =>
    named(s, `Cytoplasmic glycerol ${i}`),
  );
  // Recover the ellipse from actual inner-leaflet instance centers, not from
  // the claimed compartment metadata or a duplicated placement formula.
  let xx = 0,
    xy = 0,
    yy = 0,
    xsum = 0,
    ysum = 0;
  const point = new THREE.Vector3();
  for (let i = 0; i < heads.count; i += 2) {
    heads.getMatrixAt(i, matrix);
    point.setFromMatrixPosition(matrix);
    const x = point.x ** 2,
      y = point.y ** 2;
    xx += x * x;
    xy += x * y;
    yy += y * y;
    xsum += x;
    ysum += y;
  }
  const den = xx * yy - xy * xy,
    ax = (xsum * yy - ysum * xy) / den,
    ay = (ysum * xx - xsum * xy) / den;
  heads.getMatrixAt(0, matrix);
  const headRadius =
    new THREE.Vector3().setFromMatrixScale(matrix).x *
    heads.geometry.parameters.radius;
  const innerEdge = 1 - headRadius * Math.sqrt(Math.max(ax, ay));
  const inverse = new THREE.Matrix4(),
    transform = new THREE.Matrix4();
  let maximumRadius = 0;
  for (const params of scenarios(model))
    for (let frame = 0; frame <= 200; frame++) {
      s.update(frame / 200, params);
      s.group.updateMatrixWorld(true);
      inverse.copy(membrane.matrixWorld).invert();
      for (const g of glycerol) {
        if (!g.visible) continue;
        for (const mesh of g.children) {
          transform.multiplyMatrices(inverse, mesh.matrixWorld);
          const position = mesh.geometry.attributes.position;
          for (let i = 0; i < position.count; i++) {
            point.fromBufferAttribute(position, i).applyMatrix4(transform);
            const r = Math.sqrt(ax * point.x ** 2 + ay * point.y ** 2);
            maximumRadius = Math.max(maximumRadius, r);
            assert(
              r < innerEdge - 0.001,
              `20261004-operons-06: ${g.name} violates actual inner-leaflet clearance at p=${frame / 200}: ${r} >= ${innerEdge - 0.001}`,
            );
          }
        }
      }
    }
  return { maximumRadius, innerEdge };
}

verifyInducerOrder();
const motion = {};
for (const m of [lac, trp, gal]) motion[m.id] = verifyDNATransitions(m);
for (const m of [lac, gal]) verifyRNAHandoff(m);
verifyLeaderContinuity();
const containment = verifyGlycerolContainment();
console.log(
  "operons playback: 6 audited issue invariants PASS; actual ligand order, DNA convergence, retained RNA chain, connected leader reveal, inner-leaflet containment.",
);
console.log(
  JSON.stringify({ maximumFineDNAsteps: motion, glycerol: containment }),
);
