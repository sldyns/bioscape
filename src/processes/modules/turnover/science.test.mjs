import assert from "node:assert/strict";
import * as THREE from "three";
import rna from "./rnaSilencingProcess.js";
import proteasome from "./proteasomeProcess.js";
import crispr from "./crisprProcess.js";
import sos from "./bacterialRepairProcess.js";

const find = (scene, name) => {
  const object = scene.group.getObjectByName(name);
  assert.ok(object, `missing actual rendered object: ${name}`);
  return object;
};
const ends = (mesh) =>
  [-0.5, 0.5].map((y) => mesh.localToWorld(new THREE.Vector3(0, y, 0)));
const instanceEnds = (mesh, i) => {
  const matrix = new THREE.Matrix4();
  mesh.getMatrixAt(i, matrix);
  return [-0.5, 0.5].map((y) =>
    new THREE.Vector3(0, y, 0)
      .applyMatrix4(matrix)
      .applyMatrix4(mesh.matrixWorld),
  );
};
const near = (a, b, reason, tolerance = 2e-6) =>
  assert.ok(a.distanceTo(b) < tolerance, `${reason}: ${a.distanceTo(b)}`);
const seek = (scene, p, params) => {
  scene.update(p, params);
  scene.group.updateMatrixWorld(true);
};

// 01/02: use actual cylinder endpoints and rendered base instances, not state labels.
{
  const scene = rna.create();
  for (const mode of ["seed", "slice", "mismatch"]) {
    for (let step = 0; step <= 100; step++) {
      seek(scene, step / 100, { pairing: mode });
      for (let i = 0; i < 22; i++) {
        const pair = find(scene, `miRNA target pair ${i}`);
        if (!pair.visible) continue;
        const guide = find(scene, `miRNA base ${i}`),
          target = find(scene, `target base ${i + 3}`);
        assert.ok(target.visible);
        near(ends(pair)[0], ends(guide)[1], "pair begins at guide base");
        near(ends(pair)[1], ends(target)[1], "pair ends at mapped target base");
        near(
          new THREE.Vector3(ends(guide)[1].x, 0, 0),
          new THREE.Vector3(ends(target)[1].x, 0, 0),
          "one to one nucleotide register",
        );
      }
    }
  }
  seek(scene, 0.54, { pairing: "slice" });
  assert.equal(
    Array.from(
      { length: 22 },
      (_, i) => find(scene, `miRNA target pair ${i}`).visible,
    ).filter(Boolean).length,
    15,
  );
  const g10 = ends(find(scene, "miRNA base 12"))[0].x;
  const g11 = ends(find(scene, "miRNA base 11"))[0].x;
  const cutBond = ends(find(scene, "target backbone 14"));
  assert.ok(Math.abs(cutBond[0].x - g11) < 1e-6);
  assert.ok(Math.abs(cutBond[1].x - g10) < 1e-6);
  seek(scene, 0.6, { pairing: "slice" });
  assert.equal(find(scene, "target backbone 14").visible, false);
  for (const p of [0.7, 0.9, 1]) {
    seek(scene, p, { pairing: "slice" });
    for (let i = 0; i < 22; i++)
      assert.equal(find(scene, `miRNA target pair ${i}`).visible, false);
  }
}
console.log(
  "turnover-01/02: antiparallel base register, numbered scissile bond and pair lifecycle PASS",
);

// 03/04: mechanical contact, catalysis at the linkage, triangle-tested barrel and product volume.
for (const rootId of ["cell", "plant", "yeast"]) {
  const scene = proteasome.create({ rootId });
  for (const tag of ["ubiquitin", "untagged"]) {
    for (let step = 0; step <= 100; step++) {
      const p = step / 100;
      seek(scene, p, { tag });
      const residues = Array.from({ length: 42 }, (_, i) =>
        find(scene, `substrate residue ${i}`),
      );
      if (tag === "untagged") {
        assert.ok(residues.every((r) => r.visible));
        for (let j = 0; j < 7; j++)
          assert.equal(find(scene, `product peptide ${j}`).visible, false);
        continue;
      }
      // When upper folded residues remain during pulling, a continuous actual chain crosses the pore.
      if (p > 0.3 && residues.some((r) => r.position.y > 1.48)) {
        let crossing = null;
        for (let i = 0; i < 41; i++) {
          const a = residues[i].position,
            b = residues[i + 1].position;
          if (a.y <= 0.68 && b.y >= 0.68)
            crossing = a.clone().lerp(b, (0.68 - a.y) / (b.y - a.y));
        }
        assert.ok(crossing, "unfolding cannot precede motor engagement");
        assert.ok(Math.hypot(crossing.x, crossing.z) < 0.02);
        // Centerline/radius contact for actual TubeGeometry, avoiding nearest-vertex approximations.
        const contacted = Array.from({ length: 6 }, (_, i) =>
          find(scene, `ATPase pore loop ${i}`),
        ).some((loop) => {
          const tip = loop.geometry.parameters.path
            .getPoint(1)
            .applyMatrix4(loop.matrixWorld);
          return (
            Math.hypot(tip.x, tip.z) <=
              loop.geometry.parameters.radius + 0.039 &&
            Math.abs(tip.y - 0.68) < 0.08
          );
        });
        assert.ok(
          contacted,
          "a real pore-loop tube touches the translocating chain",
        );
      }
      for (let j = 0; j < 7; j++) {
        const peptide = find(scene, `product peptide ${j}`);
        if (!peptide.visible) continue;
        const tube = peptide.children[0],
          attr = tube.geometry.attributes.position;
        for (let i = 0; i < attr.count; i++) {
          const vertex = new THREE.Vector3()
            .fromBufferAttribute(attr, i)
            .applyMatrix4(tube.matrixWorld);
          if (vertex.y >= -2.12 && vertex.y <= 0.36)
            assert.ok(
              Math.hypot(vertex.x, vertex.z) < 0.5,
              "entire peptide remains in axial lumen until exit",
            );
        }
      }
    }
  }
  seek(scene, 0.48, { tag: "ubiquitin" });
  const link = find(scene, "substrate ubiquitin linkage");
  assert.ok(link.visible);
  near(
    ends(link)[0],
    find(scene, "substrate residue 12").position,
    "ubiquitin remains covalently attached until cut",
  );
  assert.ok(
    link.position.distanceTo(find(scene, "Rpn11 catalytic domain").position) <
      0.055,
    "link reaches Rpn11 before severing",
  );
  seek(scene, 0.481, { tag: "ubiquitin" });
  assert.equal(link.visible, false);
  const volumes = [];
  scene.group.traverse((o) => {
    if (o.name.startsWith("20S protein volume") && o.visible) volumes.push(o);
  });
  // Ray intersection is with rendered triangle surfaces, including between former layer gaps.
  for (let y = -2.115; y < 0.355; y += 0.037)
    for (let angle = 3.3; angle < 6.1; angle += 0.17) {
      const ray = new THREE.Raycaster(
        new THREE.Vector3(0, y, 0),
        new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
      );
      const hits = ray.intersectObjects(volumes, false);
      assert.ok(
        hits.length > 0,
        `open non-cutaway barrel at y=${y}, angle=${angle}`,
      );
      assert.ok(
        Math.abs(hits[0].distance - 0.5) < 0.012,
        "bounded axial cavity",
      );
    }
}
console.log(
  "turnover-03/04: all roots, pore contact, Rpn11 linkage contact, closed core surfaces and axial peptide exit PASS",
);

// 05: a common 20-nt register and pairing states tied to actual local separation.
{
  const scene = crispr.create();
  seek(scene, 0.7, { target: "matched" });
  const repeat = find(scene, "crRNA repeat scaffold");
  const antiRepeat = find(scene, "tracrRNA anti-repeat scaffold");
  for (let i = 0; i < 7; i++) {
    const contact = find(scene, `repeat anti-repeat contact ${i}`);
    near(
      ends(contact)[0],
      repeat.geometry.parameters.path
        .getPoint((i + 2) / 9)
        .applyMatrix4(repeat.matrixWorld),
      "crRNA repeat contact follows actual backbone",
    );
    near(
      ends(contact)[1],
      antiRepeat.geometry.parameters.path
        .getPoint((7 - i) / 14)
        .applyMatrix4(antiRepeat.matrixWorld),
      "anti-repeat contact follows separate backbone",
    );
  }
  near(
    ends(find(scene, "Cas9 guide backbone 18"))[1],
    repeat.geometry.parameters.path
      .getPoint(0)
      .applyMatrix4(repeat.matrixWorld),
    "guide is covalently continuous with its repeat",
  );
  for (const target of ["matched", "noPam", "mismatch"])
    for (let step = 0; step <= 100; step++) {
      const p = step / 100;
      seek(scene, p, { target });
      const guide = find(scene, "crRNA guide bases"),
        dna = find(scene, "DNA strand 1 exposed bases");
      for (let i = 0; i < 20; i++) {
        const pair = find(scene, `Cas9 RNA DNA pair ${i}`),
          dnaPair = find(scene, `Cas9 DNA pair ${15 + i}`);
        if (pair.visible) {
          near(ends(pair)[0], instanceEnds(guide, i)[1], "RNA pair endpoint");
          near(
            ends(pair)[1],
            instanceEnds(dna, 15 + i)[1],
            "target pair endpoint",
          );
          assert.equal(dnaPair.visible, false, "no double partnership");
        }
        if (dnaPair.visible) {
          const phosphate = find(scene, "DNA strand 0 phosphates"),
            targetPhosphate = find(scene, "DNA strand 1 phosphates");
          const ma = new THREE.Matrix4(),
            mb = new THREE.Matrix4();
          phosphate.getMatrixAt(15 + i, ma);
          targetPhosphate.getMatrixAt(15 + i, mb);
          const a = new THREE.Vector3().setFromMatrixPosition(ma),
            b = new THREE.Vector3().setFromMatrixPosition(mb);
          assert.ok(
            Math.abs(a.distanceTo(b) - 0.52) < 2e-6,
            "DNA pairs only at locally closed bases",
          );
        }
      }
      if (target === "noPam")
        for (let i = 0; i <= 52; i++)
          assert.equal(find(scene, `Cas9 DNA pair ${i}`).visible, true);
    }
  seek(scene, 0.7, { target: "matched" });
  assert.equal(
    Array.from(
      { length: 20 },
      (_, i) => find(scene, `Cas9 RNA DNA pair ${i}`).visible,
    ).filter(Boolean).length,
    20,
  );
  seek(scene, 0.4, { target: "matched" });
  assert.equal(
    find(scene, "Cas9 DNA pair 15").visible,
    true,
    "unreached distal DNA remains paired",
  );
  assert.equal(
    find(scene, "Cas9 DNA pair 34").visible,
    false,
    "PAM proximal DNA opens first",
  );
  seek(scene, 1, { target: "matched" });
  for (let strand = 0; strand < 2; strand++)
    for (let i = 0; i < 52; i++)
      assert.equal(
        find(scene, `Cas9 DNA backbone ${strand} ${i}`).visible,
        i !== 31,
        "cut exactly three protospacer nucleotides upstream of PAM",
      );
}
console.log(
  "turnover-05: 20 mapped RNA-DNA pairs, local opening front and PAM-indexed cleavage PASS",
);

// 06: a moving bubble, native base endpoints and a continuous active RNA 3-prime end.
{
  const scene = sos.create();
  for (const lexA of ["wildtype", "noncleavable"])
    for (let step = 0; step <= 100; step++) {
      const p = step / 100;
      seek(scene, p, { lexA });
      const strands = [
        find(scene, "SOS locus strand 0 phosphates"),
        find(scene, "SOS locus strand 1 phosphates"),
      ];
      const pol = find(scene, "SOS elongating RNAP");
      const rnaBases = find(scene, "response RNA bases"),
        template = find(scene, "SOS locus strand 1 bases");
      const visible = [];
      for (let i = 0; i < 28; i++) {
        const m = find(scene, `SOS transcript backbone ${i}`);
        if (m.visible) visible.push(m);
      }
      if (visible.length) {
        for (let i = 1; i < visible.length; i++)
          near(
            ends(visible[i - 1])[1],
            ends(visible[i])[0],
            "continuous RNA backbone",
          );
        const end = ends(visible.at(-1))[1];
        assert.ok(
          Math.abs(end.x - pol.position.x) < 1e-6,
          "RNA 3-prime end remains at active center",
        );
        assert.ok(Math.abs(end.y + 1.32) < 1e-6);
        const centerIndex = Math.round((pol.position.x + 3.75) / 0.125);
        assert.equal(
          find(scene, `SOS DNA pair ${centerIndex}`).visible,
          false,
          "active template is opened",
        );
        const a = new THREE.Matrix4(),
          b = new THREE.Matrix4();
        strands[0].getMatrixAt(centerIndex, a);
        strands[1].getMatrixAt(centerIndex, b);
        assert.ok(
          new THREE.Vector3()
            .setFromMatrixPosition(a)
            .distanceTo(new THREE.Vector3().setFromMatrixPosition(b)) > 0.6,
          "actual DNA rails separate at RNAP",
        );
      }
      for (let i = 0; i < 29; i++) {
        const pair = find(scene, `SOS RNA template pair ${i}`);
        if (pair.visible) {
          near(
            ends(pair)[0],
            instanceEnds(rnaBases, i)[1],
            "RNA hybrid endpoint",
          );
          near(
            ends(pair)[1],
            instanceEnds(template, 24 + i)[1],
            "template hybrid endpoint",
          );
          assert.equal(find(scene, `SOS DNA pair ${24 + i}`).visible, false);
        }
      }
      if (lexA === "noncleavable") {
        assert.equal(visible.length, 0);
        for (let i = 0; i <= 60; i++)
          assert.equal(find(scene, `SOS DNA pair ${i}`).visible, true);
      }
    }
  seek(scene, 1, { lexA: "wildtype" });
  assert.equal(
    find(scene, "SOS DNA pair 24").visible,
    true,
    "DNA behind polymerase reanneals",
  );
  assert.ok(
    Array.from(
      { length: 29 },
      (_, i) => find(scene, `SOS RNA template pair ${i}`).visible,
    ).some(Boolean),
    "elongating RNA has template hybrid",
  );
}
console.log(
  "turnover-06: moving DNA bubble, RNA-template hybrid, continuous RNA and mutant branch PASS",
);

// Peer bubble-extension regressions: all 1001 sampled times and all conditions.
await import("./bubble.test.mjs");
