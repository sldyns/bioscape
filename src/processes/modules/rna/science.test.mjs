import assert from "node:assert/strict";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import rna from "./rnaProcessingProcess.js";
import npc from "./nuclearTransportProcess.js";
import motor from "./motorTransportProcess.js";
import organelle from "./organelleImportProcess.js";
import { entries } from "./entries.js";
import { visibleProcessBounds } from "../../sceneBounds.js";

const near = (a, b, context, tolerance = 2e-6) =>
  assert(a.distanceTo(b) < tolerance, `${context}: gap ${a.distanceTo(b)}`);
// Read endpoints from transformed cylinder geometry, not process metadata.
function end(mesh, upper) {
  const p = mesh.geometry.attributes.position;
  const bound = upper ? Math.max : Math.min;
  let y = upper ? -Infinity : Infinity;
  for (let i = 0; i < p.count; i++) y = bound(y, p.getY(i));
  return new THREE.Vector3(0, y, 0).applyMatrix4(mesh.matrixWorld);
}
function tubeEnd(mesh, last) {
  const { tubularSegments, radialSegments } = mesh.geometry.parameters;
  const p = mesh.geometry.attributes.position;
  const first = last ? tubularSegments * (radialSegments + 1) : 0;
  const center = new THREE.Vector3();
  for (let i = 0; i < radialSegments; i++)
    center.add(new THREE.Vector3().fromBufferAttribute(p, first + i));
  return center.divideScalar(radialSegments).applyMatrix4(mesh.matrixWorld);
}
const seek = (view, p, parameters = {}) => {
  view.update(p, parameters);
  view.group.updateMatrixWorld(true);
};
const times = Array.from({ length: 1001 }, (_, i) => i / 1000);
for (const rootId of ["cell", "plant"]) {
  const view = rna.create({ rootId });
  const left = view.group.getObjectByName("exon-1").children[0];
  const right = view.group.getObjectByName("exon-2").children[0];
  const segments = Array.from({ length: 46 }, (_, i) =>
    view.group.getObjectByName(`intron-backbone-${i}`),
  );
  for (const p of [
    ...times,
    0.55 - 1e-7,
    0.55 + 1e-7,
    0.65 - 1e-7,
    0.65 + 1e-7,
  ]) {
    seek(view, p);
    const exon1 = tubeEnd(left, true),
      exon2 = tubeEnd(right, false);
    const intron5 = end(segments[0], false),
      intron3 = end(segments[45], true);
    for (let i = 0; i < 45; i++)
      near(
        end(segments[i], true),
        end(segments[i + 1], false),
        `RNA backbone ${i}, p=${p}`,
      );
    if (p <= 0.55) near(exon1, intron5, `intact 5′ splice junction p=${p}`);
    if (p <= 0.65)
      near(intron3, exon2, `lariat–exon 2 covalent junction p=${p}`);
    if (p >= 0.55)
      near(intron5, end(segments[37], true), `branch junction p=${p}`);
    if (p >= 0.65) near(exon1, exon2, `ligated exons p=${p}`);
    if (p > 0.67)
      assert(intron3.distanceTo(exon2) > 0.01, "released lariat must depart");
  }
}
console.log(
  "rna-01: actual backbone connectivity at 1005 times in both roots PASS",
);

const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
function intersect(a, b, c, d) {
  const u = sub(b, a),
    v = sub(d, c),
    denom = cross(u, v);
  if (Math.abs(denom) < 1e-12) return false;
  const t = cross(sub(c, a), v) / denom,
    s = cross(sub(c, a), u) / denom;
  return t >= 0 && t <= 1 && s >= 0 && s <= 1;
}
for (const rootId of ["cell", "plant", "yeast"]) {
  const view = npc.create({ rootId });
  const leaflets = [-1, 1].map((face) =>
    view.group.getObjectByName(`pore-rim-leaflet-${face}`),
  );
  // The exact triangulated surfaces share angular stations. Inspect every
  // station: segment intersections would become intersection arcs in 3D.
  for (let ring = 0; ring <= 56; ring++) {
    const curves = leaflets.map((mesh) => {
      const p = mesh.geometry.attributes.position;
      return Array.from({ length: 19 }, (_, j) => {
        const index = ring * 19 + j;
        return [p.getX(index), Math.hypot(p.getY(index), p.getZ(index))];
      });
    });
    for (let i = 0; i < 18; i++) {
      for (let j = 0; j < 18; j++)
        assert(
          !intersect(
            curves[0][i],
            curves[0][i + 1],
            curves[1][j],
            curves[1][j + 1],
          ),
          "pore leaflets intersect",
        );
      for (const curve of curves) {
        assert(
          curve[i + 1][0] < curve[i][0],
          "folded/self-overlapping pore section",
        );
        for (let j = i + 2; j < 18; j++)
          assert(
            !intersect(curve[i], curve[i + 1], curve[j], curve[j + 1]),
            "self intersection",
          );
      }
    }
    for (let i = 0; i <= 18; i++) {
      const thickness = Math.hypot(...sub(curves[1][i], curves[0][i]));
      assert(
        Math.abs(thickness - 0.17) < 5e-7,
        "paired normal offsets changed membrane thickness",
      );
      if (i > 0 && i < 18)
        assert(curves[1][i][1] < curves[0][i][1], "leaflet order inverted");
    }
    for (let face = 0; face < 2; face++) {
      const x = face ? 0.545 : 0.375;
      assert(Math.abs(curves[face][0][0] - x) < 1e-7);
      assert(Math.abs(curves[face][18][0] + x) < 1e-7);
      assert(Math.abs(curves[face][0][1] - 1.21) < 2e-7);
    }
  }
  const cargo = view.group.getObjectByName("nls-cargo");
  for (const nls of ["exposed", "masked"])
    for (const p of times) {
      seek(view, p, { nls });
      if (nls === "masked") assert(cargo.position.x < -2.6);
      cargo.traverse((mesh) => {
        if (!mesh.geometry || !mesh.visible) return;
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const v = new THREE.Vector3()
            .fromBufferAttribute(positions, i)
            .applyMatrix4(mesh.matrixWorld);
          if (Math.abs(v.x) < 0.55)
            assert(
              Math.hypot(v.y, v.z) < 0.9,
              "cargo enters lipid at pore rim",
            );
        }
      });
    }
}
console.log(
  "rna-02: actual leaflet sections/order/thickness/joins and all root/NLS cargo trajectories PASS",
);

const view = motor.create({ rootId: "cell" });
function feet(kind) {
  return [0, 1].map((i) =>
    kind === "dynein"
      ? end(view.group.getObjectByName(`dynein-stalk-${i}`), true)
      : view.group
          .getObjectByName(`kinesin-head-${i}`)
          .getWorldPosition(new THREE.Vector3()),
  );
}
const cargo = view.group.getObjectByName("motor-cargo");
function progressForFraction(t) {
  // Invert the monotone progress ease numerically; positions are still read
  // from rendered meshes, not from an exported trajectory implementation.
  let lo = 0.29,
    hi = 0.88;
  for (let i = 0; i < 55; i++) {
    const p = (lo + hi) / 2,
      q = (p - 0.29) / 0.59;
    if (q * q * (3 - 2 * q) < t) lo = p;
    else hi = p;
  }
  return (lo + hi) / 2;
}
for (const kind of ["kinesin", "dynein"]) {
  const count = kind === "dynein" ? 10 : 6,
    events = [];
  for (let j = 0; j < count; j++) {
    const eventFeet = [];
    for (const fraction of [0.05, 0.25, 0.5, 0.75, 0.95]) {
      seek(view, progressForFraction((j + fraction) / count), { motor: kind });
      eventFeet.push(feet(kind));
    }
    const advances = [0, 1].map(
      (i) => eventFeet.at(-1)[i].x - eventFeet[0][i].x,
    );
    const moving = Math.abs(advances[0]) > Math.abs(advances[1]) ? 0 : 1;
    assert(Math.abs(advances[moving]) > 0.1);
    for (const f of eventFeet)
      near(
        f[1 - moving],
        eventFeet[0][1 - moving],
        "supporting head remains attached",
      );
    assert(
      eventFeet[2][moving].y > eventFeet[0][moving].y + 0.15,
      "moving head lifts",
    );
    events.push({ moving, advance: advances[moving] });
  }
  if (kind === "kinesin") {
    assert(events.every((e, i) => e.moving === i % 2 && e.advance > 0));
    assert(events.every((e) => Math.abs(e.advance - events[0].advance) < 1e-6));
  } else {
    assert(
      events.some((e, i) => i > 0 && e.moving === events[i - 1].moving),
      "dynein must not reuse obligatory head alternation",
    );
    assert(
      events.some((e) => e.advance > 0),
      "illustrative backward dynein step absent",
    );
    assert(
      new Set(events.map((e) => Math.abs(e.advance).toFixed(3))).size >= 4,
      "variable dynein advances absent",
    );
  }
  seek(view, 0, { motor: kind });
  const initialX = cargo.position.x;
  seek(view, 1, { motor: kind });
  assert(
    Math.abs(cargo.position.x - initialX - (kind === "dynein" ? -5.2 : 5.2)) <
      1e-8,
  );
  seek(view, 0, { motor: kind, atp: "depleted" });
  const initialFeet = feet(kind);
  for (const p of times) {
    seek(view, p, { motor: kind, atp: "depleted" });
    feet(kind).forEach((foot, i) =>
      near(foot, initialFeet[i], "ATP-depleted head moved"),
    );
    assert.equal(cargo.position.x, initialX);
  }
}
console.log(
  "rna-03: actual motor contacts, distinct gait, backward event, net direction and ATP branches PASS",
);

// Compare real rendered triangles, not a foot's position or distance to a
// tubulin vertex. A stationary stalk above the track is not a bound motor.
export function assertDyneinSurfaceContact(model) {
  const contactView = model.create({ rootId: "cell" });
  seek(contactView, 0, { motor: "dynein" });
  const trackInstances = [];
  const trees = new Map();
  contactView.group.traverse((mesh) => {
    if (!mesh.isInstancedMesh) return;
    if (!trees.has(mesh.geometry))
      trees.set(mesh.geometry, new MeshBVH(mesh.geometry.clone()));
    for (let i = 0; i < mesh.count; i++) {
      const world = new THREE.Matrix4();
      mesh.getMatrixAt(i, world);
      world.premultiply(mesh.matrixWorld);
      trackInstances.push({
        tree: trees.get(mesh.geometry),
        inverse: world.invert(),
      });
    }
  });
  const transform = new THREE.Matrix4();
  function touchesTrack(mesh) {
    return trackInstances.some(({ tree, inverse }) => {
      transform.multiplyMatrices(inverse, mesh.matrixWorld);
      return tree.intersectsGeometry(mesh.geometry, transform);
    });
  }
  const stalks = [0, 1].map((i) =>
    contactView.group.getObjectByName(`dynein-stalk-${i}`),
  );
  // Falling back to the old bare stalk also lets the same geometric invariant
  // reject a replay of the original scene rather than merely a missing name.
  const surfaces = [0, 1].map(
    (i) =>
      contactView.group.getObjectByName(`dynein-binding-surface-${i}`) ||
      stalks[i],
  );
  let plantedChecks = 0,
    swingChecks = 0;
  const fractions = [0, 0.05, 0.25, 0.5, 0.75, 0.95, 1];
  for (let step = 0; step < 10; step++) {
    for (const fraction of fractions) {
      const p = progressForFraction((step + fraction) / 10);
      seek(contactView, p, { motor: "dynein" });
      for (let i = 0; i < 2; i++) {
        const foot = end(stalks[i], true);
        if (surfaces[i] !== stalks[i])
          near(
            foot,
            surfaces[i].getWorldPosition(new THREE.Vector3()),
            "binding domain remains attached to its stalk",
          );
        if (Math.abs(foot.y + 0.42) < 1e-6) {
          assert(
            touchesTrack(surfaces[i]),
            `planted dynein head ${i} has no tubulin surface contact at ${p}`,
          );
          plantedChecks++;
        } else if (foot.y > -0.17) {
          assert(
            !touchesTrack(surfaces[i]),
            "swinging dynein binding domain must detach from the track",
          );
          swingChecks++;
        }
      }
    }
  }
  for (const p of [0, 0.2, 0.5, 0.8, 1]) {
    seek(contactView, p, { motor: "dynein", atp: "depleted" });
    for (const surface of surfaces)
      assert(touchesTrack(surface), "ATP-depleted supporting domain detached");
  }
  assert(plantedChecks >= 80 && swingChecks === 10);
  return { plantedChecks, swingChecks, depletedChecks: 10 };
}
const contacts = assertDyneinSurfaceContact(motor);
console.log(
  `20261004-rna-01: actual MT-binding-domain/tubulin triangle contact, stalk attachment, swing detachment and ATP branches PASS (${contacts.plantedChecks} planted / ${contacts.swingChecks} swing / ${contacts.depletedChecks} depleted)`,
);

// Measure against transformed rendered triangles, including the selected
// tubulin instance. An object's bounding box or userData cannot pass this test.
export function assertLabelOnSurface(
  view,
  labelIndex,
  mesh,
  instanceIndex = null,
) {
  const label = view.labels[labelIndex];
  assert(mesh?.geometry, `label ${labelIndex}: missing target geometry`);
  for (let object = mesh; object; object = object.parent)
    assert(
      object.visible,
      `active label ${labelIndex} targets a hidden object`,
    );
  const transform = mesh.matrixWorld.clone();
  if (instanceIndex !== null) {
    const instance = new THREE.Matrix4();
    mesh.getMatrixAt(instanceIndex, instance);
    transform.multiply(instance);
  }
  const point = new THREE.Vector3().fromArray(label.position);
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  const closest = new THREE.Vector3(),
    triangle = new THREE.Triangle(a, b, c);
  const positions = mesh.geometry.attributes.position,
    index = mesh.geometry.index;
  const count = index?.count ?? positions.count;
  let distance = Infinity;
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(positions, index ? index.getX(i) : i).applyMatrix4(
      transform,
    );
    b.fromBufferAttribute(
      positions,
      index ? index.getX(i + 1) : i + 1,
    ).applyMatrix4(transform);
    c.fromBufferAttribute(
      positions,
      index ? index.getX(i + 2) : i + 2,
    ).applyMatrix4(transform);
    triangle.closestPointToPoint(point, closest);
    distance = Math.min(distance, point.distanceTo(closest));
  }
  assert(
    distance < 2e-6,
    `label ${labelIndex} misses its actual surface: ${distance}`,
  );
}

const labelModels = {
  rnaProcessing: rna,
  nuclearTransport: npc,
  motorTransport: motor,
  organelleImport: organelle,
};
const labelTimes = [
  0, 0.199999, 0.2, 0.249999, 0.25, 0.3, 0.38, 0.475, 0.6, 0.729999, 0.73, 0.76,
  0.82, 0.87, 0.935, 0.959999, 0.96, 1, 0.475, 0, 1,
];
let labelConfigurations = 0,
  surfaceChecks = 0;
for (const entry of entries) {
  const model = labelModels[entry.id];
  const parameters =
    entry.id === "nuclearTransport"
      ? [{ nls: "exposed" }, { nls: "masked" }]
      : entry.id === "motorTransport"
        ? ["kinesin", "dynein"].flatMap((motor) =>
            ["available", "depleted"].map((atp) => ({ motor, atp })),
          )
        : entry.id === "organelleImport"
          ? [{ transit: "present" }, { transit: "absent" }]
          : [{}];
  for (const rootId of entry.roots) {
    const current = model.create({ rootId });
    const labels = [...current.labels],
      positions = labels.map((label) => label.position);
    const textReferences = labels.map(() => new Map());
    const object = (name) => current.group.getObjectByName(name);
    const mappings =
      entry.id === "rnaProcessing"
        ? [
            [0, object("rna-cap").children[0]],
            [1, object("exon-1").children[0]],
            [2, object("exon-2").children[0]],
            [3, object("spliceosome").children[1]],
            [4, object("intron-backbone-19")],
            [5, object("poly-a-tail").children[6].children[0]],
          ]
        : entry.id === "nuclearTransport"
          ? [
              [3, object("nls-cargo").children[0]],
              [4, object("importin-beta").children[8]],
              [5, object("ran").children[0]],
              [6, object("importin-alpha").children[2]],
            ]
          : entry.id === "motorTransport"
            ? [
                [0, object("microtubule-alpha"), 42],
                [1, object("microtubule-beta"), 55],
                [2, object("motor-cargo").children[0]],
                [3, object("microtubule-alpha"), 48],
              ]
            : [
                [2, object("toc-channel-wall")],
                [3, object("tic-channel-wall")],
                [5, object("transit-peptide-n-terminus")],
                [6, object("stromal-chaperone").children[0]],
                [7, object("import-chain-44")],
              ];
    for (const conditions of parameters) {
      labelConfigurations++;
      for (const p of labelTimes) {
        seek(current, p, conditions);
        assert.equal(current.labels.length, labels.length);
        for (let i = 0; i < labels.length; i++) {
          const label = current.labels[i];
          assert.equal(label, labels[i], "label object replaced during seek");
          assert.equal(
            label.position,
            positions[i],
            "anchor array replaced during seek",
          );
          assert(label.position.every(Number.isFinite));
          assert(
            label.text.zh && label.text.en,
            "both full language strings are required",
          );
          const key = JSON.stringify(label.text);
          if (textReferences[i].has(key))
            assert.equal(
              label.text,
              textReferences[i].get(key),
              "bilingual text reallocated during update",
            );
          else textReferences[i].set(key, label.text);
        }
        for (const [labelIndex, mesh, instanceIndex = null] of mappings) {
          if (labels[labelIndex].active === false) continue;
          assertLabelOnSurface(current, labelIndex, mesh, instanceIndex);
          surfaceChecks++;
        }
        if (entry.id === "rnaProcessing") {
          assert.equal(labels[0].active, p >= 0.2);
          assert.equal(labels[3].active, object("spliceosome").visible);
          assert.equal(labels[5].active, p >= 0.82);
        } else if (entry.id === "nuclearTransport") {
          const enabled = conditions.nls === "exposed",
            retained = enabled && p >= 0.73;
          assert.deepEqual(labels[4].text, {
            zh: "importin β",
            en: "Importin β",
          });
          assert.deepEqual(
            labels[6].text,
            retained
              ? {
                  zh: "importin α · 核内保留",
                  en: "Importin α · retained in nucleus",
                }
              : { zh: "importin α", en: "Importin α" },
          );
          const nucleotide = enabled && p >= 0.96 ? "Ran-GDP" : "Ran-GTP";
          assert.deepEqual(labels[5].text, { zh: nucleotide, en: nucleotide });
          if (retained)
            assert(
              labels[6].position[0] > 0.6,
              "retained alpha label left the nucleus",
            );
          if (!enabled) {
            assert(
              labels[3].position[0] < -0.6 &&
                labels[4].position[0] < -0.6 &&
                labels[6].position[0] < -0.6,
            );
            assert(labels[5].position[0] > 0.6);
          } else if (p >= 0.9) {
            assert(
              labels[4].position[0] < -0.6,
              "recycled beta label failed to follow beta to the cytosol",
            );
          }
        } else if (entry.id === "motorTransport") {
          const dynein = conditions.motor === "dynein";
          assertLabelOnSurface(
            current,
            4,
            object(dynein ? "dynactin-adaptor-helix" : "kinesin-coil-0"),
          );
          surfaceChecks++;
          assert.deepEqual(
            labels[4].text,
            dynein
              ? { zh: "Dynein + dynactin", en: "Dynein + dynactin" }
              : { zh: "Kinesin-1", en: "Kinesin-1" },
          );
          assert(labels[0].position[0] < -3 && labels[1].position[0] > 3);
        } else {
          const targeted = conditions.transit === "present";
          assert.equal(labels[5].active, targeted);
          assert.equal(labels[6].active, object("stromal-chaperone").visible);
          if (!targeted) assert.equal(labels[7].active, false);
        }
      }
    }
  }
}
assert.equal(labelConfigurations, 14);
console.log(
  `20261004-rna-rendered-01/02: ${labelConfigurations} root/condition configurations, ${surfaceChecks} actual label-surface checks; bilingual identity/retention, inactive targets, repeated seeks and stable label/text/array identities PASS`,
);

// Reproduce ProcessScene's default camera rather than using the unfitted
// module camera: native 960 x 640 capture refits the sampled visible bounds.
function defaultNPCCamera(current, parameters) {
  const bounds = new THREE.Box3(),
    sample = new THREE.Box3();
  const sampled = new Set([
    ...Array.from({ length: 9 }, (_, i) => i / 8),
    ...npc.stages.map((stage) => stage.at),
  ]);
  for (const p of sampled) {
    current.update(p, parameters);
    bounds.union(visibleProcessBounds(current.group, sample));
  }
  const camera = new THREE.PerspectiveCamera(36, 960 / 640, 0.1, 150);
  const target = new THREE.Vector3().fromArray(current.camera.target);
  camera.position.fromArray(current.camera.position);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const back = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
  const tanVertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanHorizontal = tanVertical * camera.aspect;
  let distance = 0.5;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new THREE.Vector3(x, y, z).sub(target);
        distance = Math.max(
          distance,
          corner.dot(back) +
            1.12 *
              Math.max(
                Math.abs(corner.dot(right)) / tanHorizontal,
                Math.abs(corner.dot(up)) / tanVertical,
              ),
        );
      }
  camera.position.copy(target).addScaledVector(back, distance);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return camera;
}

function firstVisibleNPCIdentity(current, camera, point) {
  const ray = new THREE.Raycaster(
    camera.position,
    point.clone().sub(camera.position).normalize(),
  );
  const hit = ray.intersectObject(current.group, true).find((hit) => {
    for (let object = hit.object; object; object = object.parent)
      if (!object.visible) return false;
    const material = Array.isArray(hit.object.material)
      ? hit.object.material[hit.face?.materialIndex ?? 0]
      : hit.object.material;
    return (
      material?.visible && !(material.transparent && material.opacity === 0)
    );
  });
  if (!hit) return null;
  for (
    let object = hit.object;
    object && object !== current.group;
    object = object.parent
  )
    if (
      [
        "ran",
        "importin-alpha",
        "importin-beta",
        "nls-cargo",
        "eightfold-nuclear-pore-scaffold",
      ].includes(object.name)
    )
      return object.name;
  return hit.object.name || hit.object.geometry.type;
}

export function assertNPCDefaultLabelVisibility() {
  const checks = [],
    negativeControls = [],
    cameraConfigurations = [];
  // Binding/recycling poses and all gallery poses are tested. Opaque pore
  // structure may naturally occlude receptors during the central traversal;
  // this is not a guarantee of visibility at every time or arbitrary camera.
  const visibilityTimes = [
    0, 0.175, 0.355, 0.575, 0.7, 0.73, 0.765, 0.775, 0.9, 0.925, 0.935, 0.95, 1,
  ];
  for (const rootId of entries.find((entry) => entry.id === "nuclearTransport")
    .roots) {
    const current = npc.create({ rootId });
    const beta = current.group.getObjectByName("importin-beta");
    for (const nls of ["exposed", "masked"]) {
      const camera = defaultNPCCamera(current, { nls });
      cameraConfigurations.push({
        rootId,
        nls,
        position: camera.position.toArray(),
        fov: camera.fov,
        aspect: camera.aspect,
      });
      for (const p of visibilityTimes) {
        seek(current, p, { nls });
        for (const [labelIndex, expected] of [
          [4, "importin-beta"],
          [5, "ran"],
        ]) {
          const point = new THREE.Vector3().fromArray(
            current.labels[labelIndex].position,
          );
          const firstHit = firstVisibleNPCIdentity(current, camera, point);
          assert.equal(
            firstHit,
            expected,
            `${rootId}/${nls} p=${p} label ${labelIndex}: wrong foreground molecular identity`,
          );
          checks.push({ rootId, nls, p, labelIndex, firstHit });
        }
      }
      seek(current, 0, { nls });
      const localAnchor = beta.worldToLocal(
        new THREE.Vector3().fromArray(current.labels[4].position),
      );
      for (const p of [...times, 0.765, 0.935, 0.355, 0]) {
        seek(current, p, { nls });
        const local = beta.worldToLocal(
          new THREE.Vector3().fromArray(current.labels[4].position),
        );
        near(
          local,
          localAnchor,
          "beta uses one continuous stable local surface point",
        );
      }
      if (nls === "exposed") {
        seek(current, 0.765, { nls });
        const original = new THREE.Vector3()
          .fromBufferAttribute(beta.children[5].geometry.attributes.position, 0)
          .applyMatrix4(beta.children[5].matrixWorld);
        const oldFirstHit = firstVisibleNPCIdentity(current, camera, original);
        assert.equal(
          oldFirstHit,
          "ran",
          "negative replay must expose the original beta-to-Ran screen ambiguity",
        );
        negativeControls.push({
          rootId,
          nls,
          p: 0.765,
          originalAnchor: original.toArray(),
          oldFirstHit,
          newFirstHit: firstVisibleNPCIdentity(
            current,
            camera,
            new THREE.Vector3().fromArray(current.labels[4].position),
          ),
        });
      }
    }
  }
  assert.equal(checks.length, 156);
  assert.equal(negativeControls.length, 3);
  return { checks, negativeControls, cameraConfigurations };
}
const npcVisibility = assertNPCDefaultLabelVisibility();
console.log(
  `20261004-rna-rendered-03: ${npcVisibility.checks.length} fitted-default-camera beta/Ran first-hit checks across six root/NLS configurations; stable local point through 1005 seeks each; three original beta-to-Ran negative replays PASS`,
);
