import assert from "node:assert/strict";
import * as THREE from "three";
import { createHash } from "node:crypto";

const visible = (object) => {
  for (let p = object; p; p = p.parent) if (!p.visible) return false;
  return true;
};
const find = (scene, name) => {
  const object = scene.group.getObjectByName(name);
  assert(object, `Missing reviewed geometry: ${name}`);
  return object;
};
const point = new THREE.Vector3(),
  other = new THREE.Vector3(),
  a = new THREE.Vector3(),
  b = new THREE.Vector3(),
  c = new THREE.Vector3();
function row(mesh, index, columns = 32) {
  return Array.from({ length: columns + 1 }, (_, j) =>
    new THREE.Vector3()
      .fromBufferAttribute(
        mesh.geometry.attributes.position,
        index * (columns + 1) + j,
      )
      .applyMatrix4(mesh.matrixWorld),
  );
}
function shared(a, b) {
  assert.equal(a.length, b.length);
  a.forEach((point, i) =>
    assert(
      point.distanceTo(b[i]) < 3e-6,
      "Actual membrane boundaries must coincide",
    ),
  );
}
function rayHits(mesh, origin, direction, maximum = Infinity) {
  const ray = new THREE.Ray(origin, direction),
    positions = mesh.geometry.attributes.position,
    indices = mesh.geometry.index.array;
  let hits = 0;
  for (let i = 0; i < indices.length; i += 3) {
    a.fromBufferAttribute(positions, indices[i]).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(positions, indices[i + 1]).applyMatrix4(
      mesh.matrixWorld,
    );
    c.fromBufferAttribute(positions, indices[i + 2]).applyMatrix4(
      mesh.matrixWorld,
    );
    if (
      ray.intersectTriangle(a, b, c, false, point) &&
      point.distanceTo(origin) < maximum
    )
      hits++;
  }
  return hits;
}
function near(a, b, tolerance = 3e-6) {
  assert(
    new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b)) < tolerance,
  );
}
function continuity(scene, names, progress, tolerance = 1e-4) {
  scene.update(progress - 1e-7);
  scene.group.updateMatrixWorld(true);
  const before = names.map((name) => {
    const object = find(scene, name);
    return {
      data: object.geometry.attributes.position.array.slice(),
      matrix: object.matrixWorld.clone(),
    };
  });
  scene.update(progress + 1e-7);
  scene.group.updateMatrixWorld(true);
  names.forEach((name, index) => {
    const object = find(scene, name),
      data = object.geometry.attributes.position;
    for (let i = 0; i < data.count; i++) {
      point
        .fromArray(before[index].data, i * 3)
        .applyMatrix4(before[index].matrix);
      other.fromBufferAttribute(data, i).applyMatrix4(object.matrixWorld);
      assert(
        point.distanceTo(other) < tolerance,
        `${name} jumps at ${progress}`,
      );
    }
  });
}

export function runReview20261004({ feeding, cv, division, conjugation }) {
  // 01: a real aperture, attached to both vacuolar leaflets and the local
  // surface membrane. This rejects the old closed sphere + capped segment.
  for (const p of [0.895, 0.904, 0.92, 0.94, 0.965, 0.98]) {
    feeding.update(p);
    feeding.group.updateMatrixWorld(true);
    for (const [recipientName, passageName, surfaceName] of [
      [
        "food-vacuole-membrane",
        "cytoproct-passage-outer",
        "cytoproct-local-surface-outer",
      ],
      [
        "food-vacuole-inner-leaflet",
        "cytoproct-passage-inner",
        "cytoproct-local-surface-inner",
      ],
    ]) {
      const recipient = find(feeding, recipientName),
        passage = find(feeding, passageName),
        surface = find(feeding, surfaceName);
      assert(visible(passage));
      shared(row(recipient, 0), row(passage, 0));
      shared(row(passage, 12), row(surface, 0));
      const rim = row(recipient, 0),
        center = rim[0].clone().add(rim[32]).multiplyScalar(0.5),
        origin = find(feeding, "tracked-food-vacuole").getWorldPosition(
          new THREE.Vector3(),
        );
      center.z -= rim[0].distanceTo(rim[32]) * 0.1;
      const direction = center.clone().sub(origin).normalize();
      assert.equal(
        rayHits(recipient, origin, direction, origin.distanceTo(center) * 1.1),
        0,
        "Egestion lumen must have an unobstructed aperture",
      );
    }
  }
  const food = Array.from({ length: 7 }, (_, i) =>
    find(feeding, `tracked-food-${i}`),
  );
  for (let step = 0; step <= 70; step++) {
    const p = 0.9 + step / 1000;
    feeding.update(p);
    feeding.group.updateMatrixWorld(true);
    const passage = find(feeding, "cytoproct-passage-inner"),
      first = row(passage, 0),
      last = row(passage, 12),
      start = first[0].clone().add(first[32]).multiplyScalar(0.5),
      end = last[0].clone().add(last[32]).multiplyScalar(0.5),
      axis = end.clone().sub(start).normalize();
    food.forEach((o, i) => {
      const t = (p - (0.9 + i * 0.004)) / 0.038;
      if (t >= 0.35 && t < 0.7) {
        const displacement = o.position.clone().sub(start),
          longitudinal = displacement.dot(axis);
        assert(
          longitudinal >= -1e-6 && longitudinal <= start.distanceTo(end) + 1e-6,
        );
        assert(
          displacement.addScaledVector(axis, -longitudinal).length() < 1e-6,
          "Tracked residue must travel through the actual outlet lumen",
        );
      }
    });
  }
  feeding.update(1);
  assert(
    food.every((o) => visible(o) && o.position.x > 1.6),
    "The original seven lumen particles must become external residues",
  );

  // 02: every distal inlet is attached to a genuinely hollow ampulla and
  // collecting canal, in the same frame as the bladder port.
  for (const osmotic of ["freshwater", "mild"]) {
    for (const p of [0.04, 0.18, 0.32, 0.45, 0.68, 0.96]) {
      cv.update(p, { osmotic });
      cv.group.updateMatrixWorld(true);
      for (let arm = 0; arm < 6; arm++) {
        for (const leaflet of ["outer", "inner"]) {
          const inlet = find(cv, `collecting-inlet-${arm}-${leaflet}`),
            ampulla = find(cv, `collecting-ampulla-${arm}-${leaflet}`),
            canal = find(cv, `collecting-canal-${arm}-${leaflet}`);
          shared(row(inlet, 12), row(ampulla, 0));
          const last = row(ampulla, 12),
            center = last[0].clone().add(last[32]).multiplyScalar(0.5),
            canalStart = new THREE.Vector3(
              0,
              -canal.geometry.parameters.height / 2,
              0,
            ).applyMatrix4(canal.matrixWorld);
          assert(
            center.distanceTo(canalStart) < 2e-6,
            "Ampulla must meet the actual collecting canal axis",
          );
          const inverse = canal.matrixWorld.clone().invert();
          last.forEach((v) => {
            point.copy(v).applyMatrix4(inverse);
            assert(
              Math.abs(
                Math.hypot(point.x, point.z) -
                  canal.geometry.parameters.radiusBottom,
              ) < 2e-6,
            );
          });
          assert(
            canal.geometry.parameters.openEnded,
            "Canal/ampulla lumen must not have end caps",
          );
        }
      }
    }
    // 03: all modulo resets and isolation/rerouting boundaries happen while
    // the affected water markers have negligible visible diameter.
    const speed = osmotic === "mild" ? 1.05 : 1.42;
    for (let j = 0; j < 9; j++) {
      const target = 1 - j / 9;
      let low = 0,
        high = 1;
      for (let i = 0; i < 50; i++) {
        const t = (low + high) / 2;
        if (t * t * (3 - 2 * t) < target) low = t;
        else high = t;
      }
      const p = (0.76 + (0.14 * (low + high)) / 2) / speed;
      for (const sample of [p - 1e-7, p + 1e-7]) {
        cv.update(sample, { osmotic });
        const water = find(cv, `discharged-water-${j}`);
        assert(
          !visible(water) || water.scale.x < 1e-6,
          "Discharge particle must vanish before loop reset",
        );
      }
    }
    for (let cycle = 0; cycle < 2; cycle++)
      for (let j = 0; j < 3; j++)
        for (let n = 1; n <= 3; n++) {
          const phase = (n - j / 3) / 2.3,
            p = (cycle + phase) / speed;
          if (phase <= 0 || phase >= 1 || p <= 0 || p >= 1) continue;
          for (const t of [p - 1e-7, p + 1e-7]) {
            cv.update(t, { osmotic });
            const water = find(cv, `radial-water-0-${j}`);
            assert(
              !visible(water) || water.scale.x < 1e-6,
              "Visible radial particle must not teleport on reset",
            );
          }
        }
    const entrySpeed = osmotic === "mild" ? 1.7 : 3.2;
    for (let i = 0; i < 8; i++)
      for (let n = 1; n <= 4; n++) {
        const p = (n - i / 8) / entrySpeed;
        if (p <= 0 || p >= 1) continue;
        for (const t of [p - 1e-7, p + 1e-7]) {
          cv.update(t, { osmotic });
          const water = find(cv, `entry-water-${i}`);
          assert(!visible(water) || water.scale.x < 1e-6);
        }
      }
    for (const phase of [0.7, 0.94])
      for (const t of [(phase - 1e-7) / speed, (phase + 1e-7) / speed]) {
        cv.update(t, { osmotic });
        for (let j = 0; j < 3; j++) {
          const water = find(cv, `radial-water-0-${j}`);
          assert(!visible(water) || water.scale.x < 1e-6);
        }
      }
  }

  // 04: the same two hemisphere buffers form the mother and both daughters.
  const cortexNames = ["fission-cortex--1", "fission-cortex-1"];
  for (const p of [0.74, 0.9, 0.91, 0.95]) continuity(division, cortexNames, p);
  for (const p of [0.72, 0.82, 0.9, 0.91]) {
    division.update(p);
    division.group.updateMatrixWorld(true);
    shared(
      row(find(division, cortexNames[0]), 0, 40),
      row(find(division, cortexNames[1]), 28, 40),
    );
  }
  division.update(1);
  division.group.updateMatrixWorld(true);
  const lower = row(find(division, cortexNames[0]), 0, 40)[0],
    upper = row(find(division, cortexNames[1]), 28, 40)[0];
  assert(
    upper.y - lower.y > 0.85,
    "Closed daughter poles must separate after completed constriction",
  );

  // 05: the entire migrating nuclear envelope fits inside the actual passage.
  for (let step = 0; step <= 16; step++) {
    conjugation.update(0.55 + (step * 0.12) / 16);
    conjugation.group.updateMatrixWorld(true);
    const passage = find(conjugation, "conjugation-passage-inner"),
      left = find(conjugation, "conjugation-cortical-port--1").getWorldPosition(
        new THREE.Vector3(),
      ),
      right = find(conjugation, "conjugation-cortical-port-1").getWorldPosition(
        new THREE.Vector3(),
      );
    assert(passage.geometry.parameters.openEnded);
    for (let i = 0; i < 2; i++) {
      const nucleus = find(conjugation, `migratory-pronucleus-${i}`),
        attr = nucleus.geometry.attributes.position;
      for (let j = 0; j < attr.count; j++) {
        point.fromBufferAttribute(attr, j).applyMatrix4(nucleus.matrixWorld);
        if (point.x >= left.x && point.x <= right.x)
          assert(
            Math.hypot(point.y, point.z - 0.54) < passage.scale.x + 2e-6,
            "Nuclear envelope crosses the passage membrane",
          );
      }
    }
    assert.equal(
      rayHits(passage, left, new THREE.Vector3(1, 0, 0), right.x - left.x),
      0,
    );
    near(left.toArray(), [
      find(conjugation, "conjugating-partner-0").position.x + 0.68,
      0,
      0.54,
    ]);
    near(right.toArray(), [
      find(conjugation, "conjugating-partner-1").position.x - 0.68,
      0,
      0.54,
    ]);
  }

  // 06: real leaf-envelope vertices tile one, two, four, then eight spheres.
  // The same vertices move continuously through every old/new stage boundary.
  const leafNames = Array.from(
    { length: 8 },
    (_, j) => `postzygotic-lineage-0-leaf-${j}-outer`,
  );
  for (const [p, generation, radius] of [
    [0.78, 0, 0.26],
    [0.83, 1, 0.205],
    [0.88, 2, 0.17],
    [0.934, 3, 0.15],
  ]) {
    conjugation.update(p);
    leafNames.forEach((name, j) => {
      const side = j < 4 ? -1 : 1,
        center =
          generation === 0
            ? [0.3, 0, 0.54]
            : generation === 1
              ? [0, side * 0.55, 0.48]
              : generation === 2
                ? [j % 2 ? 0.31 : -0.31, side * 1.115, 0.48]
                : [
                    j % 2 ? 0.31 : -0.31,
                    side * (0.87 + Math.floor((j % 4) / 2) * 0.49),
                    0.48,
                  ];
      const attr = find(conjugation, name).geometry.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        point.fromBufferAttribute(attr, i).sub(new THREE.Vector3(...center));
        assert(
          Math.abs(point.length() - radius) < 2e-6,
          `${name} does not belong to its actual generation-${generation} envelope`,
        );
      }
    });
  }
  for (const p of [
    0.78, 0.805, 0.82, 0.83, 0.835, 0.85, 0.858, 0.88, 0.885, 0.89, 0.911,
    0.934, 0.94, 0.975,
  ])
    continuity(conjugation, leafNames, p);
  conjugation.update(1);
  for (let j = 0; j < 8; j++) {
    const box = new THREE.Box3().setFromBufferAttribute(
        find(conjugation, leafNames[j]).geometry.attributes.position,
      ),
      size = box.getSize(new THREE.Vector3());
    assert(
      j < 5 ? size.length() > 0.25 : size.length() < 1e-6,
      "Final state must retain four anlagen and one micronucleus",
    );
  }

  // Repair discovery: named leaders terminate on the structure/lumen, rather
  // than retaining old text-placement offsets. Compare actual positions.
  for (const p of [0.1, 0.36, 0.55, 0.67, 0.82, 0.96]) {
    feeding.update(p);
    feeding.group.updateMatrixWorld(true);
    near(
      feeding.labels[4].position,
      find(feeding, "tracked-food-vacuole").position.toArray(),
    );
    near(
      feeding.labels[3].position,
      find(feeding, "feeding-macronucleus").position.toArray(),
    );
    if (p >= 0.28 && p < 0.62) {
      const donor = find(feeding, "fusing-donor-membrane"),
        box = new THREE.Box3().setFromBufferAttribute(
          donor.geometry.attributes.position,
        ),
        center = new THREE.Vector3(
          (box.min.x + box.max.x) / 2,
          0,
          0,
        ).applyMatrix4(donor.matrixWorld);
      assert(
        center.distanceTo(
          new THREE.Vector3(...feeding.labels[p < 0.47 ? 5 : 6].position),
        ) < 0.025,
      );
    }
    division.update(p);
    division.group.updateMatrixWorld(true);
    const micro = find(
      division,
      p < 0.54 ? "dividing-micronucleus" : "daughter-micronucleus-1",
    );
    near(
      division.labels[0].position,
      micro.getWorldPosition(new THREE.Vector3()).toArray(),
    );
    if (p < 0.59 || p >= 0.76) {
      const macro = find(
        division,
        p < 0.59 ? "division-mother-macronucleus" : "daughter-macronucleus-1",
      );
      near(
        division.labels[1].position,
        macro.getWorldPosition(new THREE.Vector3()).toArray(),
      );
    }
    conjugation.update(p);
    conjugation.group.updateMatrixWorld(true);
    const target = find(conjugation, conjugation.labels[3].anchorTarget);
    if (p < 0.78)
      near(
        conjugation.labels[3].position,
        target.getWorldPosition(new THREE.Vector3()).toArray(),
      );
    else {
      const nucleus = find(conjugation, "synkaryon-descendant-0-0");
      near(
        conjugation.labels[3].position,
        nucleus.getWorldPosition(new THREE.Vector3()).toArray(),
      );
    }
    cv.update(p);
    cv.group.updateMatrixWorld(true);
    near(
      cv.labels[0].position,
      find(cv, "central-contractile-bladder").position.toArray(),
    );
    near(
      cv.labels[4].position,
      find(cv, "contractile-vacuole-discharge-pore").position.toArray(),
    );
    near(
      cv.labels[1].position,
      find(cv, "collecting-canal-0-inner").position.toArray(),
    );
  }
  // Rendered discovery: the parent micronucleus at p=.155 was prematurely
  // called a haploid product. Keep the ongoing two-division process distinct
  // from its four completed products, including reverse and nonfinite seeks.
  const meioticIdentityCases = [
    [0.14 - 1e-7, "小核 · 二倍体", "Micronucleus · diploid"],
    [0.14, "小核 · 减数分裂中", "Micronucleus · meiosis in progress"],
    [0.14 + 1e-7, "小核 · 减数分裂中", "Micronucleus · meiosis in progress"],
    [0.155, "小核 · 减数分裂中", "Micronucleus · meiosis in progress"],
    [0.22 - 1e-7, "小核 · 减数分裂中", "Micronucleus · meiosis in progress"],
    [0.22, "小核 · 减数分裂中", "Micronucleus · meiosis in progress"],
    [0.22 + 1e-7, "小核 · 减数分裂中", "Micronucleus · meiosis in progress"],
    [0.265, "小核 · 减数分裂中", "Micronucleus · meiosis in progress"],
    [0.3 - 1e-7, "小核 · 减数分裂中", "Micronucleus · meiosis in progress"],
    [0.3, "减数产物 · 单倍体", "Meiotic products · haploid"],
    [0.3 + 1e-7, "减数产物 · 单倍体", "Meiotic products · haploid"],
    [0.335, "减数产物 · 单倍体", "Meiotic products · haploid"],
    [NaN, "小核 · 二倍体", "Micronucleus · diploid"],
  ];
  for (const reset of [1, 0.725, 0, 0.815, NaN]) {
    for (const [p, zh, en] of meioticIdentityCases) {
      conjugation.update(reset);
      conjugation.update(p);
      assert.deepEqual(
        conjugation.labels[3].text,
        { zh, en },
        `Rendered meiotic identity at ${p} after seek ${reset}`,
      );
      conjugation.group.updateMatrixWorld(true);
      const parent = find(conjugation, conjugation.labels[3].anchorTarget);
      near(
        conjugation.labels[3].position,
        parent.getWorldPosition(new THREE.Vector3()).toArray(),
      );
    }
  }
  const snapshot = (scene) => {
    const hash = createHash("sha256");
    scene.group.updateMatrixWorld(true);
    scene.group.traverse((o) => {
      hash.update(
        JSON.stringify([
          o.uuid,
          o.visible,
          ...o.matrix.elements,
          o.material?.uuid,
          o.material?.opacity,
        ]),
      );
      if (o.geometry)
        for (const attr of Object.values(o.geometry.attributes)) {
          assert(attr.array.every(Number.isFinite));
          hash.update(
            new Uint8Array(
              attr.array.buffer,
              attr.array.byteOffset,
              attr.array.byteLength,
            ),
          );
        }
      if (o.instanceMatrix)
        hash.update(new Uint8Array(o.instanceMatrix.array.buffer));
    });
    hash.update(JSON.stringify(scene.labels));
    return hash.digest("hex");
  };
  for (const scene of [feeding, cv, division, conjugation]) {
    for (const parameters of scene === cv
      ? [{ osmotic: "freshwater" }, { osmotic: "mild" }]
      : [{}]) {
      for (const p of [0.795, 0.846, 0.897, 0.94, 0.99]) {
        scene.update(p, parameters);
        const before = snapshot(scene);
        for (const q of [1, 0.13, NaN, 0.54, 0]) scene.update(q, parameters);
        scene.update(p, parameters);
        assert.equal(
          snapshot(scene),
          before,
          "Repaired late transitions must support deterministic arbitrary seeking",
        );
      }
    }
  }
  console.log(
    "parameciumLife 2026-10-04: joined egestion/canals/passage, continuous fission/lineage/flow and actual label anchors PASS",
  );
}
