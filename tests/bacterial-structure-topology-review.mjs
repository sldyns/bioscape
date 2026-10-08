import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as T from "three";

const referenceDirectory = new URL(
  "./fixtures/bacterial-appendage-reference-f484615/",
  import.meta.url,
);
const referenceManifest = JSON.parse(
  await readFile(new URL("manifest.json", referenceDirectory), "utf8"),
);
assert.equal(
  referenceManifest.sourceCommit,
  "f484615f06f1e416578023a4a52e291dd75f8972",
);
const frozenPaths = new Set(referenceManifest.files.map((file) => file.path));
assert.equal(frozenPaths.size, 4);
assert.deepEqual(referenceManifest.externalImports, ["three"]);
for (const file of referenceManifest.files) {
  const bytes = await readFile(new URL(file.path, referenceDirectory));
  assert.equal(bytes.length, file.bytes);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    file.sha256,
    `Frozen source: ${file.path}`,
  );
  const imports = [
    ...bytes.toString("utf8").matchAll(/\bfrom\s+["']([^"']+)["']/g),
  ].map((match) => match[1]);
  assert.deepEqual(imports, file.imports);
  for (const specifier of imports) {
    if (specifier.startsWith(".")) {
      const target = new URL(
        specifier + ".js",
        new URL(file.path, referenceDirectory),
      );
      assert.ok(target.href.startsWith(referenceDirectory.href));
      assert.ok(
        frozenPaths.has(target.href.slice(referenceDirectory.href.length)),
      );
    } else assert.ok(referenceManifest.externalImports.includes(specifier));
  }
}

// Scene dependencies use Vite's extensionless imports. Resolve those in a
// temporary bundle while sharing the test's Three runtime and exact geometry.
const temporary = await mkdtemp(join(tmpdir(), "bioscape-bacterial-topology-"));
let scene;
try {
  const outfile = join(temporary, "scene.mjs");
  await build({
    stdin: {
      contents: `
        export { bacteriaDetail } from "./src/scene/bacteriaDetails.js";
        export { motorAssembly, flagellumAssembly } from "./src/scene/bacterialAppendageDetails.js";
        export { motorAssembly as referenceMotorAssembly, flagellumAssembly as referenceFlagellumAssembly } from "./tests/fixtures/bacterial-appendage-reference-f484615/src/scene/bacterialAppendageDetails.js";
        export { detailModel } from "./src/scene/detailModels.js";
        export { packDetail, unpackDetail } from "./src/scene/detailTransfer.js";
        export { makePresentation } from "./src/scene/presentation.js";
      `,
      resolveDir: fileURLToPath(new URL("../", import.meta.url)),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
    plugins: [
      {
        name: "shared-three-runtime",
        setup(builder) {
          builder.onResolve({ filter: /^three(?:\/.*)?$/ }, ({ path }) => ({
            path: import.meta.resolve(path),
            external: true,
          }));
        },
      },
    ],
  });
  scene = await import(pathToFileURL(outfile).href);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
const {
  bacteriaDetail,
  motorAssembly,
  flagellumAssembly,
  referenceMotorAssembly,
  referenceFlagellumAssembly,
  detailModel,
  packDetail,
  unpackDetail,
  makePresentation,
} = scene;

const results = [];
function check(name, run) {
  try {
    run();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, message: error.message });
  }
}
function dispose(group) {
  const geometries = new Set(),
    materials = new Set();
  group.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) materials.add(o.material);
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
function vertices(group, visit) {
  group.updateMatrixWorld(true);
  const point = new T.Vector3();
  group.traverse((mesh) => {
    const positions = mesh.geometry?.attributes.position;
    if (!positions) return;
    for (let i = 0; i < positions.count; i++)
      visit(
        point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld),
        mesh,
      );
  });
}
function capsuleRadius(p) {
  return Math.hypot(p.x, Math.max(Math.abs(p.y) - 1, 0), p.z);
}
function radiusRange(objects) {
  let min = Infinity,
    max = -Infinity;
  for (const object of objects)
    vertices(object, (p) => {
      const r = capsuleRadius(p);
      min = Math.min(min, r);
      max = Math.max(max, r);
    });
  return { min, max };
}
function close(actual, expected, tolerance = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} must be within ${tolerance} of ${expected}`,
  );
}

const cell = bacteriaDetail("bacterium");
cell.rotation.set(0, 0, 0);
cell.updateMatrixWorld(true);
const flagellum = cell.children.find(
    (g) =>
      g.isGroup && g.children[0]?.children[0]?.userData.hitId === "flagellum",
  ),
  motor = flagellum.children[0];
const rings = (depth) =>
  motor.children.filter(
    (m) =>
      m.geometry?.type === "ExtrudeGeometry" &&
      Math.abs(m.geometry.parameters.options.depth - depth) < 1e-9,
  );

check(
  "Whole-cell MS/P/L rings meet the correct capsule envelope layers",
  () => {
    for (const [name, depth, radius] of [
      ["MS", 0.11, 0.79],
      ["P", 0.07, 0.86],
      ["L", 0.075, 0.92],
    ]) {
      const parts = rings(depth);
      assert.equal(
        parts.length,
        2,
        `${name} ring retains both section sectors`,
      );
      const range = radiusRange(parts);
      assert.ok(
        range.min < radius - 0.001 && range.max > radius + 0.001,
        `${name} ring must cross its layer at radius ${radius}; got ${JSON.stringify(range)}`,
      );
      assert.ok(
        range.min > radius - 0.012 && range.max < radius + 0.012,
        `${name} ring must follow the curved layer, not only touch it at one edge`,
      );
    }
    assert.ok(radiusRange(rings(0.22)).max < 0.79, "C ring stays cytoplasmic");
  },
);

check(
  "Overview stators span inner membrane and reach the periplasmic wall",
  () => {
    const membraneUnits = motor.children.filter((m) => {
      const points = m.geometry?.parameters?.path?.points;
      return (
        points?.length === 2 &&
        Math.abs(points[0].y + 0.34) < 1e-8 &&
        Math.abs(points[1].y + 0.11) < 1e-8
      );
    });
    assert.equal(membraneUnits.length, 45);
    for (const unit of membraneUnits) {
      const range = radiusRange([unit]);
      assert.ok(
        range.min < 0.79 && range.max > 0.79,
        "Each stator membrane unit must cross the actual inner membrane",
      );
    }
    const anchors = motor.children.filter(
      (m) => m.isMesh && m.material.color.getHexString() === "9aafa0",
    );
    assert.equal(anchors.length, 9);
    for (const anchor of anchors) {
      const range = radiusRange([anchor]);
      assert.ok(range.min > 0.79, "Wall anchors cannot lie in cytoplasm");
      assert.ok(
        range.min < 0.86 && range.max > 0.86,
        "Each stator anchor must meet the peptidoglycan surface",
      );
    }
  },
);

check("The peptidoglycan sacculus covers the pole and motor attachment", () => {
  const wall = [];
  cell.children[0].traverse((m) => {
    if (
      m.isMesh &&
      !m.userData.cutOnly &&
      m.material.color.getHexString() === "c2b391"
    )
      wall.push(m);
  });
  for (const direction of [
    new T.Vector3(0, 1, 0),
    new T.Vector3(Math.sin(0.25), Math.cos(0.25), 0),
  ]) {
    const ray = new T.Raycaster(new T.Vector3(0, 1, 0), direction),
      hits = ray.intersectObjects(wall, false);
    assert.ok(hits.length, "The wall must exist at the polar attachment");
    // Native capsule tessellation has at most a 0.0033 polar chord error;
    // the P ring and anchors extend across this actual surface as well.
    close(hits[0].distance, 0.86, 0.004);
  }
});

check("All fifteen overview ribosomes remain wholly inside cytoplasm", () => {
  const ribosomes = cell.children.filter((g) =>
    g.children.some((m) => m.userData.hitId === "bacterialRibosome"),
  );
  assert.equal(ribosomes.length, 15, "Containment must not remove ribosomes");
  for (const ribosome of ribosomes) {
    const range = radiusRange([ribosome]);
    assert.ok(
      range.max < 0.79,
      `Ribosome at ${ribosome.position.toArray()} crosses the membrane: ${range.max}`,
    );
  }
});

function sphereAt(unit, coordinates) {
  return unit.children.find(
    (m) =>
      m.geometry?.type === "SphereGeometry" &&
      m.position.distanceTo(new T.Vector3(...coordinates)) < 1e-8,
  );
}
function contains(sphere, worldPoint) {
  return (
    worldPoint
      .clone()
      .applyMatrix4(sphere.matrixWorld.clone().invert())
      .length() < 1
  );
}
function connectedByTube(unit, sugarA, sugarB) {
  assert.ok(sugarA && sugarB, "Both sugar bodies must exist");
  return unit.children.some((m) => {
    const path = m.geometry?.parameters?.path;
    if (!path) return false;
    const a = path.getPoint(0).applyMatrix4(m.matrixWorld),
      b = path.getPoint(1).applyMatrix4(m.matrixWorld);
    return (
      (contains(sugarA, a) && contains(sugarB, b)) ||
      (contains(sugarA, b) && contains(sugarB, a))
    );
  });
}
check(
  "LPS sugar connectivity survives standalone and membrane contexts",
  () => {
    for (const id of ["lps", "bacterialOuter", "bacterialEnvelope"]) {
      const g = bacteriaDetail(id),
        units = [];
      g.updateMatrixWorld(true);
      g.traverse((o) => {
        if (
          o.isGroup &&
          o.userData.landmarks?.some(
            (l) => l.en === "Lipid A · Membrane anchor",
          ) &&
          sphereAt(o, [0, 0.15, 0])
        )
          units.push(o);
      });
      assert.ok(units.length, `${id} must contain molecular LPS`);
      try {
        for (const unit of units) {
          assert.ok(
            connectedByTube(
              unit,
              sphereAt(unit, [0.055, 0.09, 0]),
              sphereAt(unit, [0, 0.15, 0]),
            ),
            `${id}: the lipid-A sugar must connect to the first core sugar`,
          );
          assert.ok(
            connectedByTube(
              unit,
              sphereAt(unit, [0.017, 0.36, 0.008]),
              sphereAt(unit, [0.017, 0.4, 0.023]),
            ),
            `${id}: the existing core-to-O-antigen connection must remain`,
          );
          assert.equal(
            unit.children.filter((m) => {
              const p = m.geometry?.parameters?.path?.points;
              return p && p[0].y === 0.071 && p.at(-1).y === -0.095;
            }).length,
            6,
            "The example retains six lipid-A acyl chains",
          );
        }
      } finally {
        dispose(g);
      }
    }
  },
);

check(
  "Antiparallel DNA labels keep identical bilingual positions through display",
  () => {
    const generic = detailModel("dna"),
      bacterial = detailModel("bacterialDNA", bacteriaDetail("bacterialDNA")),
      expected = generic.userData.landmarks,
      polarity = bacterial.userData.landmarks.filter((a) =>
        /^[35]′$/.test(a.en),
      );
    assert.equal(polarity.length, 4);
    assert.deepEqual(polarity, expected, "Reuse the same strand-end positions");
    for (const language of ["zh", "en"]) {
      assert.equal(polarity.filter((a) => a[language] === "5′").length, 2);
      assert.equal(polarity.filter((a) => a[language] === "3′").length, 2);
    }
    assert.equal(bacterial.userData.landmarks.length, 6);
    assert.ok(
      bacterial.children.every((m) => m.userData.hitId === "bacterialDNA"),
    );
    const restored = unpackDetail(packDetail(bacterial).payload);
    assert.deepEqual(restored.userData.landmarks, bacterial.userData.landmarks);
    const presentation = makePresentation(null, "bacterialDNA", restored);
    assert.equal(presentation.landmarks.length, 6);
    for (const label of presentation.landmarks) {
      assert.ok(label.zh && label.en);
      assert.ok(label.position.toArray().every(Number.isFinite));
    }
    assert.ok(
      presentation.parts.every((p) => p.userData.hitId === "bacterialDNA"),
    );
    dispose(generic);
    dispose(bacterial);
    dispose(presentation.root);
  },
);

function fingerprint(group) {
  group.updateMatrixWorld(true);
  const hash = createHash("sha256");
  group.traverse((o) => {
    if (!o.isMesh) return;
    hash.update(
      JSON.stringify([
        o.matrixWorld.toArray(),
        o.userData,
        o.material.color.toArray(),
      ]),
    );
    for (const [name, a] of Object.entries(o.geometry.attributes)) {
      hash.update(name);
      hash.update(
        new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength),
      );
    }
    if (o.geometry.index) {
      const a = o.geometry.index.array;
      hash.update(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
    }
  });
  hash.update(JSON.stringify(group.userData));
  return hash.digest("hex");
}
check(
  "Enlarged standalone motor and flagellum keep their reviewed geometry",
  () => {
    for (const [make, makeReference] of [
      [motorAssembly, referenceMotorAssembly],
      [flagellumAssembly, referenceFlagellumAssembly],
    ]) {
      const model = make(),
        reference = makeReference();
      try {
        assert.equal(fingerprint(model), fingerprint(reference));
      } finally {
        dispose(model);
        dispose(reference);
      }
    }
  },
);

check(
  "Overview geometry remains finite and preserves selectable cutaway parts",
  () => {
    const ids = new Set(),
      pili = { cap: 0, back: 0 };
    vertices(cell, (p, m) => {
      assert.ok([p.x, p.y, p.z].every(Number.isFinite));
      ids.add(m.userData.hitId);
    });
    cell.traverse((m) => {
      if (m.isMesh && m.userData.hitId === "pili")
        pili[m.userData.cap ? "cap" : "back"]++;
    });
    assert.deepEqual(
      [...ids].sort(),
      [
        "bacterialEnvelope",
        "nucleoid",
        "plasmids",
        "bacterialRibosome",
        "bacterialCytoplasm",
        "pili",
        "flagellum",
      ].sort(),
    );
    assert.equal(pili.cap + pili.back, 16);
    assert.ok(pili.cap > 0 && pili.back > 0);
    assert.ok(cell.userData.partAnchors.flagellum.every(Number.isFinite));
  },
);
dispose(cell);

const failures = results.filter((r) => !r.passed);
for (const failure of failures)
  console.error(`${failure.name}: ${failure.message}`);
assert.equal(failures.length, 0, JSON.stringify(failures));
console.log(
  `Bacterial structure topology review: ${results.length} checks passed.`,
);
