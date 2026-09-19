import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import chromatinAccess from "./chromatinAccessProcess.js";
import tad from "./tadProcess.js";
import plantGenome from "./plantGenomeProcess.js";
import plantRdDM from "./plantRdDMProcess.js";

// Read the rendered tube vertex buffers, not process.userData or duplicate
// trajectory formulas. The mean of a radial ring is its actual centerline.
function centers(mesh, stride = 8) {
  assert(mesh?.geometry, "expected actual rendered mesh");
  const attr = mesh.geometry.getAttribute("position"),
    result = [];
  for (let i = 0; i < attr.count / stride; i++) {
    const p = new THREE.Vector3();
    for (let j = 0; j < 8; j++)
      p.add(new THREE.Vector3().fromBufferAttribute(attr, i * stride + j));
    result.push(p.multiplyScalar(1 / 8).applyMatrix4(mesh.matrixWorld));
  }
  return result;
}
function duplex(scene, prefix) {
  scene.group.updateMatrixWorld(true);
  const a = centers(scene.group.getObjectByName(prefix + "A"));
  const b = centers(scene.group.getObjectByName(prefix + "B"));
  return { a, b, c: a.map((v, i) => v.clone().add(b[i]).multiplyScalar(0.5)) };
}
function checkHandedness(scene, prefix) {
  const { a, b, c } = duplex(scene, prefix);
  for (let i = 1; i < c.length - 1; i++) {
    const incoming = c[i]
      .clone()
      .sub(c[i - 1])
      .normalize();
    const outgoing = c[i + 1].clone().sub(c[i]).normalize();
    // Kinks at the two schematic cohesin/nucleosome contacts have no single
    // differential tangent. Check both sides, excluding only a local kink.
    if (incoming.dot(outgoing) < 0.92) continue;
    if (i > 1 && i < c.length - 2) {
      const before = c[i - 1]
        .clone()
        .sub(c[i - 2])
        .normalize();
      const after = c[i + 2]
        .clone()
        .sub(c[i + 1])
        .normalize();
      if (before.dot(incoming) < 0.92 || after.dot(outgoing) < 0.92) continue;
    }
    const t = outgoing.clone().add(incoming).normalize();
    const r = a[i].clone().sub(b[i]).multiplyScalar(0.5);
    const previous = a[i - 1]
      .clone()
      .sub(b[i - 1])
      .multiplyScalar(0.5);
    const next = a[i + 1]
      .clone()
      .sub(b[i + 1])
      .multiplyScalar(0.5);
    const signedTwist = t.dot(r.clone().cross(next.sub(previous)));
    assert(
      signedTwist > 0,
      `${prefix}: left-handed twist at ring ${i}: ${signedTwist}`,
    );
    assert(
      Math.abs(t.dot(r)) < 0.004,
      `${prefix}: non-transverse duplex at ${i}`,
    );
    assert(
      r.length() > 0.02 && r.length() < 0.14,
      `${prefix}: strand separation`,
    );
  }
}
function length(points) {
  return points.reduce(
    (sum, p, i) => sum + (i ? p.distanceTo(points[i - 1]) : 0),
    0,
  );
}
function inventory(group) {
  const ids = new Set();
  group.traverse((o) => {
    ids.add(o.uuid);
    if (o.geometry) ids.add(o.geometry.uuid);
    for (const m of [o.material].flat().filter(Boolean)) ids.add(m.uuid);
  });
  return [...ids].sort().join("|");
}
function snapshot(group) {
  group.updateMatrixWorld(true);
  const hash = createHash("sha256");
  group.traverse((o) => {
    hash.update(JSON.stringify([o.visible, o.matrix.elements]));
    for (const attr of [
      o.geometry?.attributes.position,
      o.instanceMatrix,
    ].filter(Boolean))
      hash.update(
        Buffer.from(
          attr.array.buffer,
          attr.array.byteOffset,
          attr.array.byteLength,
        ),
      );
    if (o.geometry) hash.update(JSON.stringify(o.geometry.drawRange));
  });
  return hash.digest("hex");
}
function finite(group) {
  const seen = new Set();
  group.traverse((o) => {
    assert(o.matrix.elements.every(Number.isFinite));
    if (o.geometry && !seen.has(o.geometry)) {
      seen.add(o.geometry);
      for (const attr of Object.values(o.geometry.attributes))
        assert(attr.array.every(Number.isFinite), `${o.name}: finite vertices`);
      o.geometry.computeBoundingSphere();
      assert(Number.isFinite(o.geometry.boundingSphere.radius));
    }
    if (o.instanceMatrix)
      assert(
        o.instanceMatrix.array.every(Number.isFinite),
        "finite instance transforms",
      );
  });
}
const cases = [
  [chromatinAccess, ["cell", "plant", "yeast"]],
  [tad, ["cell"]],
  [plantGenome, ["plant"]],
  [plantRdDM, ["plant"]],
];
let combinations = 0,
  stateChecks = 0;
for (const [model, roots] of cases)
  for (const rootId of roots) {
    const control = model.controls[0];
    for (const option of control.options) {
      const scene = model.create({ rootId }),
        parameters = { [control.id]: option.value };
      const resourceInventory = inventory(scene.group);
      const times = [
        ...new Set([
          0,
          1,
          ...model.stages.flatMap((st, i) => [
            st.at,
            (st.at + (model.stages[i + 1]?.at ?? 1)) / 2,
          ]),
        ]),
      ];
      for (const p of times) {
        scene.update(p, parameters);
        scene.group.updateMatrixWorld(true);
        finite(scene.group);
        assert.equal(
          inventory(scene.group),
          resourceInventory,
          "stable resources",
        );
        const expected = snapshot(scene.group);
        scene.update(1 - p, parameters);
        scene.update(0.93, {
          [control.id]: control.options.find(
            (other) => other.value !== option.value,
          ).value,
        });
        scene.update(p, parameters);
        assert.equal(
          snapshot(scene.group),
          expected,
          "deterministic reverse seek",
        );
        const prefixes = [];
        scene.group.traverse((o) => {
          if (o.name.endsWith("DNA-A")) prefixes.push(o.name.slice(0, -1));
        });
        for (const prefix of prefixes) checkHandedness(scene, prefix);
        stateChecks++;
      }
      combinations++;
    }
  }

// chromatin-01: left-handed superhelix, right-handed local duplex, and fixed
// sequence-site arclength through ATP-active/disabled sliding in all roots.
for (const rootId of ["cell", "plant", "yeast"])
  for (const hydrolysis of ["active", "disabled"]) {
    const scene = chromatinAccess.create({ rootId });
    for (const p of [0, 0.22, 0.35, 0.46, 0.6, 0.76, 0.9, 1]) {
      scene.update(p, { hydrolysis });
      const { c } = duplex(scene, "nucleosome-DNA-");
      const core = scene.group.getObjectByName(
        "octamer-eight-histone-folds-and-N-terminal-tails",
      );
      let wrapped = 0;
      for (let i = 1; i < c.length - 1; i++) {
        if (
          Math.abs(c[i - 1].x - core.position.x) >= 0.33 ||
          Math.abs(c[i + 1].x - core.position.x) >= 0.33
        )
          continue;
        const r = c[i].clone();
        r.x = 0;
        const dr = c[i + 1].clone().sub(c[i - 1]);
        dr.x = 0;
        assert(r.clone().cross(dr).x < 0, "left-handed nucleosomal superhelix");
        wrapped++;
      }
      assert(wrapped > 100);
      const site = centers(
        scene.group.getObjectByName("fixed-sequence-site"),
      )[15];
      let best = Infinity,
        material = 0,
        accumulated = 0;
      for (let i = 1; i < c.length; i++) {
        const delta = c[i].clone().sub(c[i - 1]);
        const len = delta.length();
        const f = THREE.MathUtils.clamp(
          site
            .clone()
            .sub(c[i - 1])
            .dot(delta) /
            (len * len),
          0,
          1,
        );
        const distance = c[i - 1]
          .clone()
          .addScaledVector(delta, f)
          .distanceTo(site);
        if (distance < best) {
          best = distance;
          material = accumulated + f * len;
        }
        accumulated += len;
      }
      assert(best < 0.008, "site lies on same DNA centerline");
      assert(
        Math.abs(material - 3.38) < 0.035,
        "sequence site keeps its material coordinate",
      );
    }
  }
// chromatin-02/03: constant rendered contour under all extrusion branches.
for (const condition of ["normal", "boundaryDeleted", "cohesinDepleted"]) {
  const scene = tad.create();
  for (let i = 0; i <= 40; i++) {
    scene.update(i / 40, { condition });
    const { c } = duplex(scene, "TAD-DNA-");
    assert(
      Math.abs(length(c) - 12) < 0.045,
      `TAD contour is conserved: ${condition} ${i / 40} ${length(c)}`,
    );
    const ctcf = [];
    scene.group.traverse((o) => {
      if (o.name === "oriented-CTCF-zinc-finger-chain") ctcf.push(o);
    });
    assert(
      ctcf[0].position.distanceTo(c[115]) < 1e-5,
      "left CTCF stays on genomic .23",
    );
    assert(
      ctcf[1].position.distanceTo(c[385]) < 1e-5,
      "right CTCF stays on genomic .77",
    );
  }
}

// chromatin-05: every actual RNA segment crossing either nuclear-envelope
// boundary is in the NPC corridor. Includes cargo radius and base motif reach.
for (const targeting of ["intact", "removed"]) {
  const scene = plantGenome.create();
  let crossings = 0;
  for (let frame = 0; frame <= 100; frame++) {
    scene.update(0.18 + frame * 0.0018, { targeting });
    scene.group.updateMatrixWorld(true);
    for (let i = 0; i < 2; i++) {
      const points = centers(scene.group.getObjectByName(`exported-mRNA-${i}`));
      const pore = scene.group.getObjectByName(`nuclear-export-pore-${i}`);
      const center = pore.getWorldPosition(new THREE.Vector3());
      const lumen =
        pore.geometry.parameters.radius - pore.geometry.parameters.tube;
      // The ellipsoid envelope has two drawn surfaces; their x intersections
      // with this corridor are computed from their actual scene dimensions.
      for (const shrink of [1, 0.89]) {
        const boundary =
          -3 +
          1.28 *
            shrink *
            Math.sqrt(
              1 -
                (center.y / (1.42 * shrink)) ** 2 -
                (center.z / (0.8 * shrink)) ** 2,
            );
        for (let j = 1; j < points.length; j++) {
          const a = points[j - 1],
            b = points[j];
          if ((a.x - boundary) * (b.x - boundary) > 0) continue;
          const f = (boundary - a.x) / (b.x - a.x);
          const q = a.clone().lerp(b, f);
          assert(
            Math.hypot(q.y - center.y, q.z - center.z) + 0.072 < lumen,
            "RNA crosses inside NPC, including nucleotide motif",
          );
          crossings++;
        }
      }
    }
  }
  assert(crossings > 20, "test actually observes envelope crossing");
}
// chromatin-06: actual channel-edge meshes bracket local mRNA and the actual
// exit rings meet each nascent C terminus until explicit termination.
for (const targeting of ["intact", "removed"]) {
  const scene = plantGenome.create();
  for (const p of [0.4, 0.515, 0.6, 0.77, 0.88, 0.89, 0.93, 0.97, 1]) {
    scene.update(p, { targeting });
    scene.group.updateMatrixWorld(true);
    for (let i = 0; i < 2; i++) {
      const rib = scene.group.getObjectByName(`local-ribosome-${i}`);
      const edges = [];
      rib.traverse((o) => {
        if (o.name === "mRNA-channel-edge") edges.push(centers(o, 9));
      });
      const RNA = centers(scene.group.getObjectByName(`local-mRNA-${i}`));
      const channel = edges[0].map((p, j) =>
        p.clone().add(edges[1][j]).multiplyScalar(0.5),
      );
      for (const point of RNA) {
        let nearest = Infinity;
        for (let j = 1; j < channel.length; j++) {
          const segment = channel[j].clone().sub(channel[j - 1]);
          const f = THREE.MathUtils.clamp(
            point
              .clone()
              .sub(channel[j - 1])
              .dot(segment) / segment.lengthSq(),
            0,
            1,
          );
          nearest = Math.min(
            nearest,
            point.distanceTo(
              channel[j - 1].clone().addScaledVector(segment, f),
            ),
          );
        }
        assert(nearest < 0.018, "mRNA engages its own channel");
      }
      const peptide = centers(
        scene.group.getObjectByName(`local-nascent-peptide-${i}`),
      );
      const exit = rib
        .getObjectByName("nascent-peptide-exit")
        .getWorldPosition(new THREE.Vector3());
      const distance = peptide.at(-1).distanceTo(exit);
      if (p <= 0.89)
        assert(
          distance < 1e-6,
          "nascent C terminus attached before termination",
        );
      if (p >= 0.97) assert(distance > 0.4, "completed product releases");
      for (const point of [...RNA, ...peptide]) {
        const y = i === 0 ? 1.65 : -1.65,
          ry = i === 0 ? 1.22 : 1.06;
        assert(
          ((point.x - 2.75) / (1.7 * 0.89)) ** 2 +
            ((point.y - y) / (ry * 0.89)) ** 2 +
            (point.z / (0.7 * 0.89)) ** 2 <
            1,
          "local expression remains inside organelle",
        );
      }
    }
  }
}
// chromatin-07/08: replace, do not duplicate, the actual target base. The sugar
// attachment and both backbone buffers persist. Methyl bond begins at the
// hexagonal base vertex and moves with that one base in both control branches.
for (const drm2 of ["active", "inactive"]) {
  const scene = plantRdDM.create();
  scene.group.updateMatrixWorld(true);
  const sugar = scene.group.getObjectByName("target-sugars");
  const pivot = scene.group.getObjectByName("target-cytosine-glycosidic-pivot");
  const plate = scene.group.getObjectByName("target-base-A"),
    matrix = new THREE.Matrix4();
  plate.getMatrixAt(36, matrix);
  assert.equal(
    new THREE.Vector3().setFromMatrixScale(matrix).length(),
    0,
    "original plate removed",
  );
  sugar.getMatrixAt(72, matrix);
  const sugarPosition = new THREE.Vector3().setFromMatrixPosition(matrix);
  const originalBackbones = JSON.stringify(duplex(scene, "target-DNA-").a);
  const bases = [];
  scene.group.traverse((o) => {
    if (o.name === "single-target-cytosine-ring") bases.push(o);
  });
  assert.equal(bases.length, 1);
  for (const p of [0, 0.6, 0.77, 0.82, 0.86, 0.89, 0.9, 0.93, 0.96, 1]) {
    scene.update(p, { drm2 });
    scene.group.updateMatrixWorld(true);
    assert(
      pivot.position.distanceTo(sugarPosition) < 1e-7,
      "same glycosidic pivot stays attached to DNA sugar",
    );
    assert.equal(
      JSON.stringify(duplex(scene, "target-DNA-").a),
      originalBackbones,
      "backbone unaffected by base flipping",
    );
    const methyl = scene.group.getObjectByName("cytosine-C5-methyl-group");
    assert.equal(methyl.parent, pivot, "methyl follows the same cytosine");
    assert.equal(methyl.visible, drm2 === "active" && p > 0.89);
    const bond = scene.group.getObjectByName("C5-methyl-bond");
    const start = new THREE.Vector3(0, -0.5, 0).applyMatrix4(bond.matrixWorld);
    const carbon = new THREE.Vector3(0.0433, 0.072, 0).applyMatrix4(
      pivot.matrixWorld,
    );
    assert(
      start.distanceTo(carbon) < 1e-6,
      "methyl bond is at base C5, not backbone",
    );
    if (p === 0.9 && drm2 === "active") {
      const pocket = scene.group
        .getObjectByName("DRM2-cytosine-recognition-pocket")
        .getWorldPosition(new THREE.Vector3());
      const base = bases[0].getWorldPosition(new THREE.Vector3());
      assert(
        pocket.distanceTo(base) < 1e-6,
        "flipped original base meets catalytic pocket",
      );
    }
  }
}
console.log(
  `chromatin scientific regressions passed: 8 issues, ${combinations} root/control combinations, ${stateChecks} stage/seek states; NPC and TAD intermediate sweeps included.`,
);
