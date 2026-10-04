import assert from "node:assert/strict";
import * as THREE from "three";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// An alternate module root permits the exact same geometric checks to be run
// against the frozen pre-correction source, without altering that source.
const moduleRoot = process.env.GENOME_MODULE_ROOT
  ? pathToFileURL(resolve(process.env.GENOME_MODULE_ROOT) + "/")
  : new URL("./", import.meta.url);
const transduction = (
  await import(new URL("transductionProcess.js", moduleRoot))
).default;
const sporulation = (
  await import(new URL("bacterialSporulationProcess.js", moduleRoot))
).default;
const selected = process.env.GENOME_CHECK;
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const ends = (mesh) => [
  v(0, -0.5, 0).applyMatrix4(mesh.matrixWorld),
  v(0, 0.5, 0).applyMatrix4(mesh.matrixWorld),
];
const near = (a, b, message, tolerance = 2e-5) =>
  assert.ok(a.distanceTo(b) < tolerance, `${message}: ${a.distanceTo(b)}`);
function visible(mesh) {
  for (let o = mesh; o; o = o.parent) if (!o.visible) return false;
  return true;
}
function instanceEnds(mesh, i) {
  const m = new THREE.Matrix4();
  mesh.getMatrixAt(i, m);
  m.premultiply(mesh.matrixWorld);
  return [v(0, -0.5, 0).applyMatrix4(m), v(0, 0.5, 0).applyMatrix4(m)];
}
const cases = { entry: 0, extraction: 0, layers: 0, duplexClearance: 0 };

function segmentDistance(a, b, c, d) {
  const u = b.clone().sub(a),
    v = d.clone().sub(c),
    w = a.clone().sub(c);
  const A = u.dot(u),
    B = u.dot(v),
    C = v.dot(v),
    D = u.dot(w),
    E = v.dot(w);
  const denominator = A * C - B * B;
  const bound = (n) => Math.max(0, Math.min(1, n));
  const candidates = [
    [0, bound(E / C)],
    [1, bound((E + B) / C)],
    [bound(-D / A), 0],
    [bound((B - D) / A), 1],
  ];
  if (denominator > 1e-20) {
    const s = (B * E - C * D) / denominator,
      t = (A * E - B * D) / denominator;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) candidates.push([s, t]);
  }
  return Math.sqrt(
    Math.min(
      ...candidates.map(([s, t]) =>
        w.clone().addScaledVector(u, s).addScaledVector(v, -t).lengthSq(),
      ),
    ),
  );
}

if (!selected || selected === "entry") {
  for (const rootId of ["bacterium", "phage"])
    for (const route of ["p1", "lambda"]) {
      const c = transduction.create({ rootId });
      const recipient = c.group.children.find(
        (o) =>
          o.isGroup &&
          Math.abs(o.position.x - 2.65) < 1e-6 &&
          o.children.some((m) => m.geometry?.type === "CapsuleGeometry"),
      );
      assert.ok(recipient);
      const membraneMeshes = recipient.children.filter(
        (o) => o.isMesh && !o.isInstancedMesh && o.visible,
      );
      for (const p of [0.73, 0.74, 0.78, 0.8, 0.82, 0.86, 0.9, 0.91]) {
        c.update(p, { route });
        c.group.updateMatrixWorld(true);
        const phage = c.group.getObjectByName("packaging-and-delivery-virion");
        const shaft =
          c.group.getObjectByName("transduction-tail-tube-open-lumen") ||
          phage.children.find(
            (o) =>
              o.geometry?.type === "CylinderGeometry" &&
              Math.abs(o.position.y + 0.71) < 1e-6,
          );
        assert.ok(shaft);
        const tip = ends(shaft).sort((a, b) => a.y - b.y)[0];
        assert.ok(
          tip.y <= 0.90001 && tip.y >= 0.83249,
          `tail tube must engage the envelope before injection; ${route} tip y=${tip.y}`,
        );
        for (const prefix of [
          "transferred-DNA-segment-",
          "transferred-DNA-partner-",
        ]) {
          for (let i = 0; i < 96; i++) {
            const piece = c.group.getObjectByName(prefix + i);
            if (!piece) continue;
            assert.ok(visible(piece));
            const [a, b] = ends(piece),
              direction = b.clone().sub(a),
              length = direction.length();
            const hits = new THREE.Raycaster(
              a,
              direction.normalize(),
              1e-7,
              length - 1e-7,
            ).intersectObjects(membraneMeshes, false);
            assert.equal(
              hits.length,
              0,
              `${route} p=${p}: DNA crosses a membrane triangle outside its aperture`,
            );
            for (const q of [a, b])
              if (q.y >= 0.8 && q.y <= 1.67)
                assert.ok(
                  Math.hypot(q.x - 2.65, q.z) + piece.scale.x <
                    shaft.scale.x + 1e-5,
                  "DNA tube radius must fit within the tail/entry lumen",
                );
          }
        }
        // The surrounding envelope remains drawn; the missing faces are a
        // bounded local port rather than deleting the entire recipient wall.
        const away = new THREE.Raycaster(
          v(2.65 + 0.45, 1.2, -0.02),
          v(0, -1, 0),
          0,
          1,
        ).intersectObjects(membraneMeshes, false);
        assert.ok(
          away.length >= 2,
          "both envelope surfaces remain outside the port",
        );
        cases.entry++;
      }
    }
}

if (!selected || selected === "extraction") {
  for (const rootId of ["bacterium", "phage"])
    for (const route of ["p1", "lambda"]) {
      const c = transduction.create({ rootId });
      const cargo = Array.from({ length: 96 }, (_, i) =>
        c.group.getObjectByName(`transferred-DNA-segment-${i}`),
      );
      const donor = c.group.children.find(
        (o) => o.name === "nucleoid-duplex-backbone-0",
      );
      c.update(0, { route });
      c.group.updateMatrixWorld(true);
      assert.ok(
        cargo.every(visible),
        "the transferred material must already occupy its donor locus, with no visibility handoff",
      );
      const startIndex = (route === "lambda" ? 4 : 16) * 4;
      near(
        ends(cargo[0])[0],
        instanceEnds(donor, 88)[0],
        "source duplex joins the donor at locus end",
      );
      near(
        ends(cargo.at(-1))[1],
        instanceEnds(donor, startIndex - 1)[1],
        "source duplex joins the donor at locus start",
      );
      const matrix = new THREE.Matrix4();
      for (let i = startIndex; i < 88; i++) {
        donor.getMatrixAt(i, matrix);
        assert.ok(
          Math.hypot(
            matrix.elements[0],
            matrix.elements[1],
            matrix.elements[2],
          ) < 1e-8,
          "donor and transferred contour must not duplicate the same locus",
        );
      }
      const snapshot = (p) => {
        c.update(p, { route });
        c.group.updateMatrixWorld(true);
        assert.ok(cargo.every(visible));
        const points = cargo.map(ends);
        for (let i = 1; i < points.length; i++)
          near(
            points[i - 1][1],
            points[i][0],
            "transferred material remains one continuous contour",
          );
        return points.flat();
      };
      for (const boundary of [
        0.16, 0.23, 0.33, 0.34, 0.48, 0.55, 0.7, 0.73, 0.91,
      ]) {
        const before = snapshot(boundary - 1e-7),
          after = snapshot(boundary + 1e-7);
        for (let i = 0; i < before.length; i++)
          near(
            before[i],
            after[i],
            `no material handoff jump at ${boundary}`,
            3e-5,
          );
        cases.extraction++;
      }
      for (const p of [0, 0.19, 0.23, 0.27, 0.33, 0.48, 0.82, 1]) {
        const a = snapshot(p).map((q) => q.toArray());
        snapshot(0.91);
        snapshot(0.12);
        assert.deepEqual(
          snapshot(p).map((q) => q.toArray()),
          a,
          "arbitrary extraction seeks are deterministic",
        );
      }
    }
  // Carrying a duplex through the extraction/packing morph must not collapse
  // the two backbones or fold different contour indices through one another.
  // Root contexts share this geometry, so dense sampling is done once/route.
  for (const route of ["p1", "lambda"]) {
    const c = transduction.create();
    for (let step = 0; step <= 100; step++) {
      c.update(step / 100, { route });
      c.group.updateMatrixWorld(true);
      const strands = [
        "transferred-DNA-segment-",
        "transferred-DNA-partner-",
      ].map((prefix) =>
        Array.from({ length: 96 }, (_, i) => {
          const mesh = c.group.getObjectByName(prefix + i);
          assert.ok(mesh, "extracted DNA retains both backbones");
          return { ends: ends(mesh), radius: mesh.scale.x };
        }),
      );
      for (const a of strands[0])
        for (const b of strands[1])
          assert.ok(
            segmentDistance(...a.ends, ...b.ends) - a.radius - b.radius > 0.004,
            `${route} progress=${step / 100}: transferred duplex backbones intersect`,
          );
      cases.duplexClearance++;
    }
  }
}

function ellipsoid(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  return {
    center: (box.max.x + box.min.x) / 2,
    axial: (box.max.x - box.min.x) / 2,
    y: box.max.y,
    z: -box.min.z,
  };
}
const level = (p, e) =>
  ((p.x - e.center) / e.axial) ** 2 + (p.y / e.y) ** 2 + (p.z / e.z) ** 2;
function surfacePoints(mesh) {
  const result = [],
    attr = mesh.geometry.attributes.position;
  if (mesh.isInstancedMesh) {
    const m = new THREE.Matrix4();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m);
      m.premultiply(mesh.matrixWorld);
      for (let j = 0; j < attr.count; j++)
        result.push(v().fromBufferAttribute(attr, j).applyMatrix4(m));
    }
  } else {
    for (let j = 0; j < attr.count; j++)
      result.push(
        v().fromBufferAttribute(attr, j).applyMatrix4(mesh.matrixWorld),
      );
  }
  return result;
}
if (!selected || selected === "layers") {
  const c = sporulation.create();
  for (const p of [
    0.570001, 0.58, 0.6, 0.630001, 0.65, 0.7, 0.73, 0.86, 0.93, 1,
  ]) {
    c.update(p, { engulfment: "normal" });
    c.group.updateMatrixWorld(true);
    const spore = c.group.children.find(
      (o) => o.isGroup && Math.abs(o.scale.x - 1.12) < 1e-6,
    );
    const inner = c.group.getObjectByName(
        "continuous-forespore-inner-membrane",
      ),
      outer = c.group.getObjectByName("mother-membrane-continuous-engulfment");
    const cortex =
      c.group.getObjectByName("intermembrane-cortex-shell") ||
      spore.children.find(
        (o) =>
          o.geometry?.type === "SphereGeometry" &&
          Math.abs(o.position.z + 0.01) < 1e-6,
      );
    const coat =
      c.group.getObjectByName("external-protein-coat-shell") ||
      spore.children.find(
        (o) =>
          o.geometry?.type === "SphereGeometry" &&
          Math.abs(o.position.z + 0.03) < 1e-6,
      );
    const inside = ellipsoid(inner),
      outside = ellipsoid(outer);
    for (const [mesh, kind] of [
      [cortex, "cortex"],
      [c.group.getObjectByName("intermembrane-cortex-cut-edge"), "cortex"],
      [c.group.getObjectByName("cortex-crosslinked-peptidoglycan"), "cortex"],
      [coat, "coat"],
      [c.group.getObjectByName("external-protein-coat-cut-edge"), "coat"],
      ...(
        c.group.getObjectByName("external-protein-coat-ridges")?.children || []
      ).map((m) => [m, "coat"]),
    ]) {
      if (!mesh || !visible(mesh)) continue;
      for (const q of surfacePoints(mesh)) {
        if (kind === "cortex") {
          assert.ok(
            level(q, inside) > 1.001,
            `cortex enters inner membrane at p=${p}`,
          );
          assert.ok(
            level(q, outside) < 0.999,
            `cortex exits outer membrane at p=${p}`,
          );
        } else
          assert.ok(
            level(q, outside) > 1.001,
            `coat enters outer membrane at p=${p}`,
          );
      }
    }
    if (visible(coat)) {
      for (const direction of [
        v(0, 0, -1),
        v(0.5, 0.4, -1),
        v(-0.7, 0.2, -1),
      ]) {
        const ray = new THREE.Raycaster(
          v(spore.position.x, 0, 0),
          direction.normalize(),
        );
        const distances = [inner, cortex, outer, coat].map((mesh) => {
          const side = mesh.material.side;
          mesh.material.side = THREE.DoubleSide;
          const hit = ray.intersectObject(mesh, false)[0];
          mesh.material.side = side;
          assert.ok(hit, "rear surface must retain the cutaway wall");
          return hit.distance;
        });
        for (let i = 1; i < distances.length; i++)
          assert.ok(
            distances[i] - distances[i - 1] > 0.015,
            `actual rear triangle intersections must preserve inner < cortex < outer < coat, p=${p}`,
          );
      }
    }
    cases.layers++;
  }
  c.update(1, { engulfment: "blocked" });
  assert.ok(
    !visible(c.group.getObjectByName("intermembrane-cortex-shell")),
    "blocked engulfment must not create a mature cortex",
  );
  assert.ok(
    !visible(c.group.getObjectByName("external-protein-coat-shell")),
    "blocked engulfment must not create a mature coat",
  );
}
console.log(
  `PASS: genome 2026-10-04 corrections ${JSON.stringify(cases)}; actual entry aperture, identity-preserving extraction, nested shell and detail geometry.`,
);
