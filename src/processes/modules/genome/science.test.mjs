import assert from "node:assert/strict";
import * as THREE from "three";
import replication from "./replicationProcess.js";
import repair from "./dnaRepairProcess.js";
import transduction from "./transductionProcess.js";
import sporulation from "./bacterialSporulationProcess.js";

const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const near = (a, b, e = 2e-5) =>
  assert.ok(a.distanceTo(b) < e, `disconnected endpoints: ${a.distanceTo(b)}`);
function instances(mesh) {
  const out = [],
    m = new THREE.Matrix4(),
    world = new THREE.Matrix4();
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m);
    if (Math.hypot(m.elements[0], m.elements[1], m.elements[2]) < 1e-7)
      continue;
    world.multiplyMatrices(mesh.matrixWorld, m);
    out.push([
      v(0, -0.5, 0).applyMatrix4(world),
      v(0, 0.5, 0).applyMatrix4(world),
    ]);
  }
  return out;
}
function segment(mesh) {
  return [
    v(0, -0.5, 0).applyMatrix4(mesh.matrixWorld),
    v(0, 0.5, 0).applyMatrix4(mesh.matrixWorld),
  ];
}
function insideCapsule(point, cx, radius, length) {
  return (
    Math.hypot(
      Math.max(0, Math.abs(point.x - cx) - length / 2),
      point.y,
      point.z,
    ) <=
    radius + 1e-5
  );
}
let cases = 0;
for (const rootId of ["cell", "plant", "yeast"])
  for (const ligase of ["active", "absent"]) {
    const c = replication.create({ rootId }),
      g = c.group;
    for (const p of [0.12, 0.28, 0.4, 0.55, 0.7, 0.78]) {
      c.update(p, { ligase });
      g.updateMatrixWorld(true);
      const h = g.getObjectByName("CMG-helicase-schematic-central-channel");
      assert.ok(h);
      const inv = h.matrixWorld.clone().invert(),
        blocks = [];
      h.traverse((o) => {
        if (o.isMesh) blocks.push(o);
      });
      const leading = instances(
        g.getObjectByName("leading-parent-sugar-phosphate-backbone"),
      );
      const lagging = instances(
        g.getObjectByName("lagging-parent-sugar-phosphate-backbone"),
      );
      if (h.position.x < 4 && h.position.x > -4) {
        let through = false;
        for (const [a, b] of leading) {
          const x = a.clone().applyMatrix4(inv),
            y = b.clone().applyMatrix4(inv);
          if (x.x <= 0 && y.x >= 0) {
            assert.ok(
              Math.hypot(x.y, x.z) < 0.005 && Math.hypot(y.y, y.z) < 0.005,
            );
            through = true;
          }
        }
        assert.ok(through, "leading template must thread CMG pore");
      }
      for (const [a, b] of lagging) {
        const x = a.clone().applyMatrix4(inv),
          y = b.clone().applyMatrix4(inv);
        if (x.x <= 0 && y.x >= 0)
          assert.ok(
            Math.hypot(x.y, x.z) > 0.3,
            "lagging template must be excluded from motor pore",
          );
      }
      for (const [a, b] of [...leading, ...lagging])
        for (const block of blocks) {
          const inverse = block.matrixWorld.clone().invert(),
            x = a.clone().applyMatrix4(inverse),
            y = b.clone().applyMatrix4(inverse),
            d = y.sub(x);
          const t = THREE.MathUtils.clamp(-x.dot(d) / d.lengthSq(), 0, 1);
          assert.ok(
            x.clone().addScaledVector(d, t).lengthSq() >= 1,
            `DNA intersects CMG ${rootId} ${p}`,
          );
        }
      cases++;
    }
  }
for (const rootId of ["bacterium", "phage"])
  for (const route of ["p1", "lambda"]) {
    const c = transduction.create({ rootId }),
      g = c.group;
    for (const p of [
      0.34, 0.4, 0.48, 0.6, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.91, 1,
    ]) {
      c.update(p, { route });
      g.updateMatrixWorld(true);
      const phage = g.getObjectByName("packaging-and-delivery-virion");
      const pieces = Array.from({ length: 96 }, (_, i) =>
        g.getObjectByName(`transferred-DNA-segment-${i}`),
      );
      assert.ok(
        pieces.every((o) => o?.visible),
        "every identity has exactly one segment",
      );
      const strands = pieces.map(segment);
      for (let i = 1; i < 96; i++) near(strands[i - 1][1], strands[i][0]);
      const colors = pieces.map((o) => o.material.color.getHex());
      assert.equal(new Set(colors).size, route === "lambda" ? 2 : 1);
      if (route === "lambda")
        assert.equal(colors.filter((c) => c === colors[0]).length, 32);
      if (p <= 0.48) {
        for (const ends of strands)
          for (const point of ends)
            assert.ok(
              insideCapsule(point, -2.65, 0.9, 1.35),
              "DNA packaging must be inside donor",
            );
        phage.traverse((o) => {
          if (!o.isMesh || !o.visible || o.isInstancedMesh) return;
          const attr = o.geometry.getAttribute("position");
          for (let i = 0; i < attr.count; i++)
            assert.ok(
              insideCapsule(
                v().fromBufferAttribute(attr, i).applyMatrix4(o.matrixWorld),
                -2.65,
                0.9,
                1.35,
              ),
              "assembled phage outside intact donor",
            );
        });
      }
      if (p >= 0.91)
        for (const ends of strands)
          for (const point of ends)
            assert.ok(
              insideCapsule(point, 2.65, 0.9 * 0.925, 1.35 * 0.925),
              "final DNA must reach recipient cytoplasm",
            );
      cases++;
    }
  }
const R = 1.12 * 0.925,
  capX = 2.05 * 0.925;
for (const engulfment of ["normal", "blocked"]) {
  const c = sporulation.create(),
    g = c.group;
  let previousHole = R;
  for (const raw of [
    0.14, 0.15, 0.18, 0.2, 0.24, 0.28, 0.31, 0.32, 0.36, 0.4, 0.43, 0.48, 0.52,
    0.55, 0.56, 0.7, 0.9, 1,
  ]) {
    const p = engulfment === "blocked" ? Math.min(raw, 0.43) : raw;
    c.update(raw, { engulfment });
    g.updateMatrixWorld(true);
    const septum = g.getObjectByName("polar-septum-inward-annulus");
    assert.ok(septum);
    if (p < 0.24) {
      const a = septum.geometry.getAttribute("position");
      assert.ok(
        Math.abs(Math.hypot(a.getY(0), a.getZ(0)) - R) < 1e-6,
        "septum outer edge must remain attached",
      );
      const last = 96 * 33;
      const hole = Math.hypot(a.getY(last), a.getZ(last));
      assert.ok(hole <= previousHole);
      previousHole = hole;
      assert.ok(hole > 0, "early septum retains central opening");
    }
    const outer = g.getObjectByName("mother-membrane-continuous-engulfment");
    assert.ok(outer);
    if (p >= 0.32 && p < 0.56) {
      const a = outer.geometry.getAttribute("position");
      for (let j = 0; j <= 32; j++) {
        const i = 96 * 33 + j,
          x = a.getX(i),
          r = Math.hypot(a.getY(i), a.getZ(i));
        assert.ok(
          Math.abs(Math.hypot(Math.max(0, Math.abs(x) - capX), r) - R) < 1e-5,
          "engulfing membrane lip must join mother membrane",
        );
      }
      // The profile is one indexed surface, with no detached arc components.
      const ix = outer.geometry.index.array;
      assert.equal(ix.length, 96 * 32 * 6);
      for (let i = 0; i < ix.length; i += 6) assert.equal(ix[i + 2], ix[i + 3]);
    }
    for (let copy = 0; copy < 2; copy++)
      for (let strand = 0; strand < 2; strand++) {
        const mesh = g.getObjectByName(
          `sporulation-chromosome-${copy}-strand-${strand}-sugar-phosphate-backbone`,
        );
        assert.ok(mesh);
        const chain = instances(mesh);
        assert.equal(
          chain.length,
          192,
          "no DNA copy fragments may appear/disappear",
        );
        for (let i = 1; i < chain.length; i++)
          near(chain[i - 1][1], chain[i][0]);
        near(chain.at(-1)[1], chain[0][0]);
        if (copy === 1 && p >= 0.31 && p < 0.32)
          assert.ok(
            chain.every((ends) => ends.every((x) => x.x < -1.3)),
            "chromosome must finish entering forespore",
          );
        if (copy === 1 && p > 0.13 && p < 0.3) {
          const hits = chain.filter(([a, b]) => (a.x + 1.3) * (b.x + 1.3) < 0);
          if (hits.length) {
            const pores = [
              g.getObjectByName("septal-DNA-translocase-0"),
              g.getObjectByName("septal-DNA-translocase-1"),
            ];
            for (const [a, b] of hits) {
              const q = a.clone().lerp(b, (-1.3 - a.x) / (b.x - a.x));
              assert.ok(
                pores.some(
                  (pore) => pore.visible && q.distanceTo(pore.position) < 0.075,
                ),
                "DNA must cross septum at a drawn translocase aperture",
              );
            }
          }
        }
      }
    if (engulfment === "blocked" && raw > 0.43)
      assert.equal(
        g.getObjectByName("mother-membrane-continuous-engulfment").visible,
        true,
      );
    cases++;
  }
}
console.log(
  `PASS: ${cases} scientific geometry/state cases; 6 audit invariants, every root and control branch.`,
);

// Geometry buffers are dynamic in sporulation, so seek snapshots include
// positions, indices and normal buffers as well as transforms and instances.
for (const model of [replication, repair, transduction, sporulation])
  for (const option of model.controls[0].options) {
    const c = model.create(),
      params = { [model.controls[0].id]: option.value },
      objects = [];
    c.group.traverse((o) => objects.push(o));
    const resources = objects.map((o) => [o, o.geometry, o.material]);
    function snapshot(p) {
      c.update(p, params);
      c.group.updateMatrixWorld(true);
      const current = [];
      c.group.traverse((o) => current.push(o));
      assert.equal(current.length, objects.length);
      return JSON.stringify(
        current.map((o, i) => {
          assert.equal(o, resources[i][0]);
          assert.equal(o.geometry, resources[i][1]);
          const attrs = Object.values(o.geometry?.attributes || {}).map((a) =>
            Array.from(a.array),
          );
          attrs.flat().forEach((x) => assert.ok(Number.isFinite(x)));
          const matrix = o.matrix.toArray();
          matrix.forEach((x) => assert.ok(Number.isFinite(x)));
          return [
            o.visible,
            matrix,
            attrs,
            o.geometry?.index ? Array.from(o.geometry.index.array) : null,
            o.instanceMatrix ? Array.from(o.instanceMatrix.array) : null,
            o.material?.color?.getHex(),
          ];
        }),
      );
    }
    for (const p of [0, 0.15, 0.24, 0.31, 0.4, 0.43, 0.55, 0.56, 0.8, 1]) {
      const saved = snapshot(p);
      snapshot(0.91);
      snapshot(0.14);
      assert.equal(
        snapshot(p),
        saved,
        `${model.id} ${p} deterministic geometry seek`,
      );
    }
  }
console.log(
  "PASS: finite dynamic geometry, stable object/geometry inventory, and deterministic seeks in all 8 model control branches.",
);

// Follow-up class: opposite Cartesian offsets can cancel helical phase at
// a bubble edge. Minimize over independent parameters on ALL nearby segment
// pairs, including unequal indices, and require actual tube-radius clearance.
function lineDistance(a, b, c, d) {
  const u = b.map((x, i) => x - a[i]),
    w = a.map((x, i) => x - c[i]),
    v = d.map((x, i) => x - c[i]);
  const dot = (x, y) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const A = dot(u, u),
    B = dot(u, v),
    C = dot(v, v),
    D = dot(u, w),
    E = dot(v, w),
    den = A * C - B * B;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const candidates = [
    [0, clamp(E / C)],
    [1, clamp((E + B) / C)],
    [clamp(-D / A), 0],
    [clamp((B - D) / A), 1],
  ];
  if (den > 1e-20) {
    const s = (B * E - C * D) / den,
      t = (A * E - B * D) / den;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) candidates.push([s, t]);
  }
  return Math.sqrt(
    Math.min(
      ...candidates.map(([s, t]) =>
        w.reduce((n, x, i) => n + (x + s * u[i] - t * v[i]) ** 2, 0),
      ),
    ),
  );
}
function railSegments(mesh) {
  const matrix = new THREE.Matrix4(),
    result = [];
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, matrix);
    matrix.premultiply(mesh.matrixWorld);
    const radius = Math.hypot(
      matrix.elements[0],
      matrix.elements[1],
      matrix.elements[2],
    );
    if (radius < 1e-8) continue;
    const a = v(0, -0.5, 0).applyMatrix4(matrix).toArray(),
      b = v(0, 0.5, 0).applyMatrix4(matrix).toArray();
    result.push({
      i,
      a,
      b,
      radius,
      minX: Math.min(a[0], b[0]),
      maxX: Math.max(a[0], b[0]),
    });
  }
  return result.sort((a, b) => a.minX - b.minX);
}
let bubbleStates = 0,
  nearbyPairs = 0,
  unequalIndexPairs = 0,
  minClearance = Infinity;
for (const model of [replication, repair])
  for (const rootId of ["cell", "plant", "yeast"])
    for (const option of model.controls[0].options) {
      const c = model.create({ rootId }),
        params = { [model.controls[0].id]: option.value };
      const railNames =
        model === repair
          ? [
              ["damaged-strand", "damaged"],
              ["intact-template", "intact"],
              ["repair-patch", "damaged"],
            ]
          : [
              ["leading-parent", "leading-parent"],
              ["lagging-parent", "lagging-parent"],
              ["leading-daughter", "leading-daughter"],
              ["lagging-daughter", "lagging-daughter"],
              ["RNA-primers", "lagging-daughter"],
            ];
      const rails = railNames.map(([name, chain]) => ({
        mesh: c.group.getObjectByName(`${name}-sugar-phosphate-backbone`),
        chain,
      }));
      assert.ok(rails.every((x) => x.mesh));
      for (let step = 0; step <= 200; step++) {
        const p = step / 200;
        c.update(p, params);
        c.group.updateMatrixWorld(true);
        bubbleStates++;
        const data = rails.map((x) => railSegments(x.mesh));
        for (let i = 0; i < rails.length; i++)
          for (let j = i + 1; j < rails.length; j++) {
            // Parent/patch are joined parts of the same repaired strand; RNA
            // primers and lagging DNA likewise share intended covalent junctions.
            if (rails[i].chain === rails[j].chain) continue;
            const aa = data[i],
              bb = data[j];
            let start = 0;
            for (const a of aa) {
              while (start < bb.length && bb[start].maxX < a.minX - 0.1)
                start++;
              for (
                let n = start;
                n < bb.length && bb[n].minX <= a.maxX + 0.1;
                n++
              ) {
                const b = bb[n],
                  r = a.radius + b.radius;
                if (a.maxX + r < b.minX || b.maxX + r < a.minX) continue;
                const distance = lineDistance(a.a, a.b, b.a, b.b);
                nearbyPairs++;
                if (a.i !== b.i) unequalIndexPairs++;
                minClearance = Math.min(minClearance, distance - r);
                assert.ok(
                  distance >= r,
                  `${model.id} ${rootId} ${option.value} p=${p}: ${rails[i].mesh.name}[${a.i}] crosses ${rails[j].mesh.name}[${b.i}], d=${distance}, r=${r}`,
                );
              }
            }
          }
      }
    }
console.log(
  `PASS: ${bubbleStates} moving-fork/opening/reclosure states, ${nearbyPairs} nearby cross-strand pairs (${unequalIndexPairs} unequal indices), minimum tube clearance ${minClearance}.`,
);
