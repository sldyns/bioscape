import assert from "node:assert/strict";
import * as THREE from "three";
import rna from "./rnaProcessingProcess.js";
import npc from "./nuclearTransportProcess.js";
import motor from "./motorTransportProcess.js";

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
