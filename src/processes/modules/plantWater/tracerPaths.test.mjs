import assert from "node:assert/strict";
import { test } from "node:test";
import { DoubleSide, Ray, Raycaster, Vector3 } from "three";
import { MeshBVH } from "three-mesh-bvh";
import { resolveStageCopy } from "../../stageCopy.js";
import stomata from "./stomataProcess.js";
import plasmolysis from "./plasmolysisProcess.js";
import xylem from "./plantLongDistanceTransportProcess.js";

function tracers(model, color) {
  return model.group.children.filter(
    (n) => n.material?.color?.getHex() === color,
  );
}

function guardTracers(model) {
  return {
    water: tracers(model, 0x659ebc),
    proton: tracers(model, 0xcd9478),
    ion: [...tracers(model, 0xa698b2), ...tracers(model, 0xbaa574)],
  };
}

test("guard-cell tracer cohorts remain distinct and move in the selected direction", () => {
  const model = stomata.create();
  const { water, proton, ion } = guardTracers(model);
  assert.deepEqual([water.length, proton.length, ion.length], [16, 8, 16]);
  const particles = [...water, ...proton, ...ion];
  let minGap = Infinity,
    maxStep = 0;
  for (const signal of ["aba", "light"]) {
    const previous = particles.map(() => new Vector3());
    const previousVisible = particles.map(() => false);
    for (let n = 0; n <= 500; n++) {
      const p = n / 500;
      model.update(p, { signal });
      for (const [i, particle] of particles.entries()) {
        if (particle.visible) {
          for (let j = 0; j < i; j++) {
            const other = particles[j];
            if (!other.visible) continue;
            const gap =
              particle.position.distanceTo(other.position) -
              particle.scale.x -
              other.scale.x;
            minGap = Math.min(minGap, gap);
            assert(
              gap > 0.004,
              `Guard-cell tracers touch: ${signal} ${p} ${i}/${j} gap=${gap}`,
            );
          }
          if (previousVisible[i]) {
            const dx = Math.abs(particle.position.x) - Math.abs(previous[i].x);
            const outward = proton.includes(particle) || p > 0.6;
            assert(
              outward ? dx > 0 : dx < 0,
              `Wrong tracer direction: ${signal} ${p} ${i}`,
            );
            maxStep = Math.max(
              maxStep,
              particle.position.distanceTo(previous[i]),
            );
          }
        }
        previous[i].copy(particle.position);
        previousVisible[i] = particle.visible;
      }
    }
  }
  assert(
    maxStep < 0.08,
    "A visible guard-cell tracer jumps between compartments",
  );
  console.log(
    `Guard-cell tracers: minimum surface gap ${minGap.toFixed(5)}, maximum displacement per 0.002 of playback ${maxStep.toFixed(5)}.`,
  );
});

test("water, ions and protons reach their rendered guard-cell compartments", () => {
  const model = stomata.create();
  const streams = guardTracers(model);
  const names = ["guard cell wall and intact membrane", "guard cell vacuole"];
  const exterior = new Vector3();
  const towardCell = new Vector3();
  const ray = new Ray(exterior, towardCell);
  function inspect(p, signal, kind, compartment) {
    model.update(p, { signal });
    // Use the drawn triangles, including the real body cutaway, on both cells.
    const surfaces = names.map((name) =>
      model.group.children
        .filter((n) => n.name === name)
        .map((mesh) => new MeshBVH(mesh.geometry.clone(), { indirect: true })),
    );
    for (const particle of streams[kind]) {
      assert(particle.visible);
      const { x, y, z } = particle.position;
      const side = Math.sign(x);
      exterior.set(4 * side, y, z);
      towardCell.set(-side, 0, 0);
      const [wall, vacuole] = surfaces.map((pair, index) => {
        const hit = pair[side < 0 ? 0 : 1].raycastFirst(ray, DoubleSide);
        // A cytoplasmic route can pass over the local indentation in the
        // tonoplast. Every route must cross the cell, and water must enter the vacuole.
        if (index === 0 || kind === "water") {
          assert(hit, `The ${kind} route misses ${names[index]} at p=${p}`);
        }
        return hit ? Math.abs(hit.point.x) : -Infinity;
      });
      const radius = particle.scale.x;
      const distance = Math.abs(x);
      if (compartment === "bath") assert(distance - radius > wall);
      if (compartment === "cytoplasm")
        assert(distance < wall && distance > vacuole);
      if (compartment === "vacuole") assert(distance + radius < vacuole);
    }
  }
  const eps = 1e-6;
  for (const signal of ["light", "aba"]) {
    inspect(0.12 + eps, signal, "proton", "cytoplasm");
    inspect(0.29 - eps, signal, "proton", "bath");
    inspect(0.21 + eps, signal, "ion", "bath");
    inspect(0.48 - eps, signal, "ion", "cytoplasm");
    inspect(0.28 + eps, signal, "water", "bath");
    inspect(0.5 - eps, signal, "water", "vacuole");
  }
  inspect(0.66 + eps, "aba", "ion", "cytoplasm");
  inspect(0.93 - eps, "aba", "ion", "bath");
  inspect(0.73 + eps, "aba", "water", "vacuole");
  inspect(0.94 - eps, "aba", "water", "bath");
  model.update(0.935, { signal: "light" });
  assert(streams.water.every((n) => !n.visible));
});

test("plasmolysis tracers cross the vacuolar outline and bypass the nuclear silhouette", () => {
  const model = plasmolysis.create();
  const water = tracers(model, 0x5598c6);
  const [nucleus] = model.group
    .getObjectsByProperty("isMesh", true)
    .filter((m) => m.material.color.getHex() === 0xa992aa);
  const [vacuole] = model.group
    .getObjectsByProperty("isMesh", true)
    .filter((m) => m.material.color.getHex() === 0x82b7c0);
  assert.equal(water.length, 18);
  const raycaster = new Raycaster();
  raycaster.ray.direction.set(0, 0, -1);
  const c = new Vector3(),
    axes = new Vector3();
  let minNuclearBoxGap = Infinity;
  for (const [from, to, leaving] of [
    [0.18, 0.49, true],
    [0.68, 0.93, false],
  ]) {
    const last = water.map(() => new Vector3());
    for (let i = 0; i <= 100; i++) {
      const p = from + 1e-6 + ((to - from - 2e-6) * i) / 100;
      model.update(p, { bath: "recover" });
      model.group.updateMatrixWorld(true);
      nucleus.getWorldPosition(c);
      nucleus.getWorldScale(axes);
      for (const [index, tracer] of water.entries()) {
        assert(tracer.visible);
        const { x, y } = tracer.position;
        const dx = Math.max(0, Math.abs(x - c.x) - axes.x);
        const dy = Math.max(0, Math.abs(y - c.y) - axes.y);
        const gap = Math.hypot(dx, dy) - tracer.scale.x;
        minNuclearBoxGap = Math.min(minNuclearBoxGap, gap);
        assert(gap > 0.02, `Water crosses the nuclear outline at p=${p}`);
        if (i === 0 || i === 100) {
          raycaster.ray.origin.set(x, y, 2);
          const inLumen = raycaster.intersectObject(vacuole, false).length > 0;
          assert.equal(inLumen, leaving ? i === 0 : i === 100);
          if (!inLumen) assert(Math.abs(x) > 2.65 + tracer.scale.x);
        }
        if (i > 0) {
          const motion = Math.abs(x) - Math.abs(last[index].x);
          assert(leaving ? motion > 0 : motion < 0);
          assert(tracer.position.distanceTo(last[index]) < 0.07);
        }
        last[index].copy(tracer.position);
      }
    }
  }
  console.log(
    `Plasmolysis: minimum projected gap from bounding box of nucleus ${minNuclearBoxGap.toFixed(5)}.`,
  );
});

test("the late plasmolysis chapters describe the actual selected bath", () => {
  const model = plasmolysis.create();
  const [membrane] = model.group
    .getObjectsByProperty("isInstancedMesh", true)
    .filter((m) => m.name === "paired phospholipid headgroups");
  const originalSize = membrane.parent.scale.x;
  model.update(0.94, { bath: "hold" });
  assert(membrane.parent.scale.x < 0.8 * originalSize);
  assert(tracers(model, 0x5598c6).every((m) => !m.visible));
  const held = plasmolysis.stages
    .slice(-2)
    .map((s) => resolveStageCopy(s, { bath: "hold" }));
  assert.deepEqual(
    held.map((s) => s.title.zh),
    ["持续高渗", "质壁分离持续"],
  );
  assert.deepEqual(
    held.map((s) => s.title.en),
    ["The bath remains hypertonic", "Plasmolysis persists"],
  );
  model.update(0.94, { bath: "recover" });
  assert.equal(membrane.parent.scale.x, originalSize);
  for (const stage of plasmolysis.stages)
    assert.equal(resolveStageCopy(stage, { bath: "recover" }), stage);
});

test("root uptake crosses a closed hair tip, stays inside the hair and enters the basal vessel opening", () => {
  const model = xylem.create();
  model.group.updateMatrixWorld(true);
  const mesh = (name) => {
    const found = model.group.getObjectByName(name);
    assert(found, `Missing ${name}`);
    return found;
  };
  const surface = (m) =>
    new MeshBVH(m.geometry.clone().applyMatrix4(m.matrixWorld), {
      indirect: true,
    });
  const hair = surface(mesh("root hair wall cutaway"));
  const cap = surface(mesh("closed root hair tip"));
  const route = mesh("soil to xylem uptake route").geometry.parameters.path;
  const marker = mesh("root water uptake tracer");
  const radius = marker.scale.x;
  const tip = route.curves[0].getPoint(1);
  const soil = route.getPoint(0);
  const hit = cap.raycastFirst(
    new Ray(soil, tip.clone().sub(soil).normalize()),
    DoubleSide,
  );
  assert(
    hit && hit.point.distanceTo(tip) > 0.1 && hit.point.distanceTo(tip) < 0.12,
  );
  const axis = route.curves[1];
  const point = new Vector3();
  const front = new Vector3(0, 0, 1);
  let minHairGap = Infinity;
  for (let i = 1; i < 100; i++) {
    axis.getPoint(i / 100, point);
    const wallDistance = hair.closestPointToPoint(point).distance;
    minHairGap = Math.min(minHairGap, wallDistance - radius);
    assert(wallDistance > radius + 0.025 && wallDistance < 0.095);
    assert.equal(
      hair.raycastFirst(new Ray(point, front), DoubleSide),
      null,
      "The hair wall hides its uptake route from the cutaway side",
    );
  }
  const obstacles = [
    "pitted lignified vessel wall, open lumen",
    "open simple perforation plate rim",
    "helical secondary wall thickening",
  ].map((name) => surface(mesh(name)));
  const column = mesh("continuous liquid water column");
  const end = route.getPoint(1);
  const probe = end.clone().applyMatrix4(column.matrixWorld.clone().invert());
  assert(Math.hypot(probe.x, probe.z) < 1 && Math.abs(probe.y) < 0.5);
  let minVesselGap = Infinity;
  for (let i = 0; i <= 500; i++) {
    route.curves[2].getPoint(i / 500, point);
    for (const obstacle of obstacles) {
      const gap = obstacle.closestPointToPoint(point).distance - radius;
      minVesselGap = Math.min(minVesselGap, gap);
      assert(
        gap > 0.01,
        `Uptake tracer crosses the basal vessel wall or rim, gap ${gap}`,
      );
    }
  }
  const uptake = model.group.children.filter(
    (n) => n.name === "root water uptake tracer",
  );
  assert.equal(uptake.length, 6);
  for (const stomata of ["open", "close"]) {
    const previous = uptake.map(() => new Vector3());
    const opacity = uptake.map(() => 0);
    let wraps = 0;
    for (let n = 0; n <= 500; n++) {
      model.update(n / 500, { stomata });
      uptake.forEach((m, i) => {
        if (n > 0 && m.visible && m.position.distanceTo(previous[i]) > 1) {
          wraps++;
          assert(
            Math.max(opacity[i], m.material.opacity) < 0.12,
            "Visible uptake tracer jumps from xylem to soil",
          );
        }
        previous[i].copy(m.position);
        opacity[i] = m.visible ? m.material.opacity : 0;
      });
    }
    assert(wraps > 0);
  }
  console.log(
    `Root uptake: minimum hair-lumen clearance ${minHairGap.toFixed(5)}, basal vessel clearance ${minVesselGap.toFixed(5)}.`,
  );
});
