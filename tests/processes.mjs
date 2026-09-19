import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { extensionEntries } from "../src/processes/extensions.js";
import infection from "../src/processes/phageProcess";
import photosynthesis from "../src/processes/photosynthesisProcess";
import secretion from "../src/processes/secretionProcess";
import transcription from "../src/processes/transcriptionProcess";
import {
  processCatalog,
  processesByRoot,
  relatedStructures,
} from "../src/processes/catalog";
import {
  parsePath,
  pathHash,
  parseExperience,
  parseProcess,
  experienceHash,
} from "../src/navigation";

const bilingual = (value, context) => {
  for (const lang of ["zh", "en"])
    assert.ok(
      typeof value?.[lang] === "string" && value[lang].trim(),
      `${context}: missing ${lang}`,
    );
};
const finite = (values, context) => {
  for (const value of values)
    assert.ok(Number.isFinite(value), `${context}: non-finite value`);
};
const resources = (group) => {
  const objects = new Set(),
    geometries = new Set(),
    materials = new Set();
  group.traverse((object) => {
    objects.add(object);
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [object.material].flat())
      if (material) materials.add(material);
  });
  return { objects, geometries, materials };
};

// Hash rendered state, including deforming buffers and instanced transforms.
// Comparing repeated seeks catches accumulated translations, opacity drift,
// incomplete resets, and stale DNA draw ranges that a final-frame check misses.
function snapshot(group) {
  group.updateMatrixWorld(true);
  const hash = createHash("sha256");
  const add = (value) => hash.update(JSON.stringify(value));
  const buffer = (array) =>
    hash.update(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
  const seenGeometry = new Set(),
    seenMaterial = new Set();
  group.traverse((object) => {
    add([object.visible, object.matrix.elements, object.renderOrder]);
    finite(object.matrix.elements, "object transform");
    if (object.instanceMatrix) {
      finite(object.instanceMatrix.array, "instance transform");
      buffer(object.instanceMatrix.array);
    }
    if (object.instanceColor) buffer(object.instanceColor.array);
    const geometry = object.geometry;
    if (geometry && !seenGeometry.has(geometry)) {
      seenGeometry.add(geometry);
      add([geometry.drawRange.start, String(geometry.drawRange.count)]);
      const available =
        geometry.index?.count ?? geometry.attributes.position.count;
      assert.ok(geometry.drawRange.start >= 0, "negative draw range");
      assert.ok(
        geometry.drawRange.count === Infinity ||
          (geometry.drawRange.count >= 0 &&
            geometry.drawRange.start + geometry.drawRange.count <= available),
        "draw range exceeds geometry",
      );
      for (const [name, attribute] of Object.entries(geometry.attributes)) {
        finite(attribute.array, `geometry ${name}`);
        add(name);
        buffer(attribute.array);
      }
      if (geometry.index) buffer(geometry.index.array);
    }
    for (const material of [object.material].flat()) {
      if (!material || seenMaterial.has(material)) continue;
      seenMaterial.add(material);
      // Ignore version/UUID bookkeeping; include all rendered scalar/color state.
      const state = {};
      for (const key of Object.keys(material).sort()) {
        if (["id", "uuid", "version"].includes(key)) continue;
        const value = material[key];
        if (
          typeof value === "number" &&
          !(key === "attenuationDistance" && value === Infinity)
        )
          finite([value], `material ${key}`);
        if (["number", "boolean", "string"].includes(typeof value))
          state[key] = value;
        else if (value?.isColor) state[key] = value.toArray();
      }
      add(state);
    }
  });
  return hash.digest("hex");
}

// Directory cards must point at non-empty, actual model render assets.
for (const entry of Object.values(processCatalog)) {
  const preview = readFileSync(
    resolve("public", entry.renderedThumbnail.slice(1)),
  );
  assert.equal(
    preview.toString("ascii", 0, 4),
    "RIFF",
    `${entry.id}: invalid preview container`,
  );
  assert.equal(
    preview.toString("ascii", 8, 12),
    "WEBP",
    `${entry.id}: invalid preview format`,
  );
  assert.ok(preview.length > 1000, `${entry.id}: empty preview`);
}

const definitions = [
  infection,
  photosynthesis,
  secretion,
  transcription,
  ...(await Promise.all(
    extensionEntries.map(async (entry) => {
      const file = resolve("src/processes", entry.module);
      assert.ok(existsSync(file), `${entry.id}: missing module`);
      const definition = (await import(pathToFileURL(file).href)).default;
      assert.equal(definition.id, entry.id);
      const svg = readFileSync(
        resolve("public", entry.thumbnail.slice(1)),
        "utf8",
      );
      assert.match(svg, /viewBox=["']0 0 320 320["']/);
      assert.doesNotMatch(
        svg,
        /<script|<foreignObject|(?:href|src)=["']https?:/i,
      );
      return definition;
    }),
  )),
];
assert.equal(new Set(definitions.map((d) => d.id)).size, definitions.length);
let seeks = 0;
for (const definition of definitions) {
  bilingual(definition.title, `${definition.id} title`);
  bilingual(definition.intro, `${definition.id} introduction`);
  assert.ok(definition.duration > 0 && Number.isFinite(definition.duration));
  assert.ok(definition.stages.length >= 3);
  assert.equal(definition.stages[0].at, 0);
  definition.stages.forEach((stage, index) => {
    assert.ok(stage.at >= 0 && stage.at < 1);
    if (index) assert.ok(stage.at > definition.stages[index - 1].at);
    bilingual(stage.title, `${definition.id} stage ${index} title`);
    bilingual(stage.description, `${definition.id} stage ${index} description`);
  });
  assert.ok(definition.sources.length > 0);
  for (const source of definition.sources) {
    assert.ok(source.title?.trim());
    assert.equal(new URL(source.url).protocol, "https:");
  }

  const model = definition.create();
  assert.ok(model.group.isGroup);
  finite(model.camera.position, `${definition.id} camera`);
  finite(model.camera.target, `${definition.id} target`);
  assert.ok(model.labels.length > 0);
  for (const label of model.labels) {
    finite(label.position, `${definition.id} label position`);
    bilingual(label.text, `${definition.id} label`);
  }
  const original = resources(model.group);
  if (definition.id === "transcription") {
    model.update(0);
    assert.equal(model.group.userData.rnaLength, 0);
    assert.equal(model.group.userData.bubbleOpening, 0);
    model.update(0.5);
    assert.ok(model.group.userData.rnaLength > 0);
    assert.equal(model.group.userData.bubbleOpening, 1);
    const earlierX = model.group.userData.polymeraseX;
    const earlierLength = model.group.userData.rnaLength;
    model.update(0.75);
    assert.ok(model.group.userData.polymeraseX > earlierX);
    assert.ok(model.group.userData.rnaLength > earlierLength);
    model.update(0.92);
    assert.equal(model.group.userData.rnaReleased, true);
    assert.equal(model.group.userData.polymeraseTerminated, false);
    model.update(1);
    assert.equal(model.group.userData.polymeraseTerminated, true);
    assert.equal(model.group.userData.bubbleOpening, 0);
    model.update(0);
    assert.equal(model.group.userData.rnaReleased, false);
    assert.equal(model.group.userData.polymeraseTerminated, false);
  }
  const samples = [
    ...new Set([
      0,
      0.1,
      0.4,
      1,
      ...definition.stages.flatMap((stage, index) => [
        stage.at,
        Math.max(0, stage.at - 0.001),
        stage.at + 0.001,
        (stage.at + (definition.stages[index + 1]?.at ?? 1)) / 2,
      ]),
    ]),
  ];
  const reference = new Map();
  const allowedMaterials = new Set([
    ...original.materials,
    ...(model.materials ?? []),
  ]);
  for (const progress of samples) {
    model.update(progress);
    reference.set(progress, snapshot(model.group));
    resources(model.group).materials.forEach((m) => allowedMaterials.add(m));
    const bounds = new THREE.Box3().setFromObject(model.group);
    finite(
      [...bounds.min.toArray(), ...bounds.max.toArray()],
      `${definition.id} bounds`,
    );
    const size = bounds.getSize(new THREE.Vector3());
    assert.ok(
      Math.max(...size.toArray()) > 2,
      `${definition.id}: missing model`,
    );
    assert.ok(
      Math.max(...size.toArray()) < 20,
      `${definition.id}: runaway model bounds`,
    );
  }
  assert.ok(
    new Set(reference.values()).size >= 3,
    `${definition.id}: animation has no distinct stages`,
  );
  for (const progress of [0, 0.4, 1, 0.1, 1, 0, ...samples.toReversed()]) {
    model.update(progress);
    assert.equal(
      snapshot(model.group),
      reference.get(progress),
      `${definition.id}: seek ${progress} does not reset exactly`,
    );
    const current = resources(model.group);
    for (const kind of ["objects", "geometries"])
      assert.deepEqual(
        current[kind],
        original[kind],
        `${definition.id}: update allocates/replaces ${kind}`,
      );
    for (const material of current.materials)
      assert.ok(
        allowedMaterials.has(material),
        `${definition.id}: allocates materials during seek`,
      );
    seeks++;
  }
  for (const [input, expected] of [
    [-1, 0],
    [2, 1],
    [NaN, 0],
  ]) {
    model.update(input);
    assert.equal(
      snapshot(model.group),
      reference.get(expected),
      `${definition.id}: input clamp ${input}`,
    );
  }
  const defaults = Object.fromEntries(
    (definition.controls ?? []).map((c) => [c.id, c.default]),
  );
  let scenarios = [defaults];
  for (const control of definition.controls ?? []) {
    bilingual(control.label, `${definition.id} control`);
    assert.ok(control.options.some((o) => o.value === control.default));
    control.options.forEach((o) =>
      bilingual(o.label, `${definition.id} option`),
    );
    scenarios = scenarios.flatMap((s) =>
      control.options.map((o) => ({ ...s, [control.id]: o.value })),
    );
  }
  for (const parameters of scenarios) {
    model.update(0.7, parameters);
    const expected = snapshot(model.group);
    model.update(0.2, parameters);
    model.update(0.7, parameters);
    assert.equal(
      snapshot(model.group),
      expected,
      `${definition.id}: condition seeking`,
    );
    for (const kind of ["objects", "geometries"])
      assert.deepEqual(
        resources(model.group)[kind],
        original[kind],
        `${definition.id}: condition resources`,
      );
  }
  for (const geometry of original.geometries) geometry.dispose();
  for (const material of allowedMaterials) material.dispose();
}

for (const path of [
  ["plant"],
  ["plant", "chloroplast"],
  ["phage"],
  ["cell", "golgi"],
]) {
  const hash = experienceHash(path, "process");
  assert.equal(hash, pathHash(path) + "?view=process");
  assert.deepEqual(parsePath(hash), path);
  assert.equal(parseExperience(hash), "process");
  assert.equal(experienceHash(path, "structure"), pathHash(path));
  assert.equal(parseExperience(pathHash(path)), "structure");
}
for (const root of ["bacterium", "yeast", "paramecium"]) {
  assert.equal(experienceHash([root], "process"), `#/${root}?view=process`);
  assert.equal(parseExperience(`#/${root}?view=process`), "process");
  assert.equal(parseProcess(`#/${root}?view=process`), null);
}
assert.equal(parseExperience("#/plant?view=unknown"), "structure");
assert.equal(pathHash(["plant", "chloroplast"]), "#/plant/chloroplast");
// Selection survives reload, browser history, and canonicalization. Invalid
// process/root pairs return to the catalog instead of opening unrelated content.
for (const [root, ids] of Object.entries(processesByRoot)) {
  assert.equal(parseProcess(`#/${root}?view=process`), null);
  for (const id of ids) {
    assert.ok(processCatalog[id]);
    bilingual(processCatalog[id].summary, `${id} catalog summary`);
    assert.ok(definitions.some((definition) => definition.id === id));
    const hash = experienceHash([root], "process", id);
    assert.equal(parseProcess(hash), id);
    assert.equal(parseExperience(hash), "process");
    assert.equal(
      experienceHash(
        parsePath(hash),
        parseExperience(hash),
        parseProcess(hash),
      ),
      hash,
    );
  }
  assert.equal(parseProcess(`#/${root}?view=process&process=invalid`), null);
}
assert.equal(parseProcess("#/cell?view=process&process=photosynthesis"), null);
assert.equal(
  parseProcess("#/bacterium?view=process&process=transcription"),
  null,
);
assert.equal(parseProcess("#/cell?process=transcription"), null);
assert.equal(
  experienceHash(["cell"], "process", "secretion"),
  "#/cell?view=process&process=secretion",
);
assert.equal(
  experienceHash(["cell"], "process", "invalid"),
  "#/cell?view=process",
);
for (const roots of Object.values(relatedStructures))
  for (const [root, paths] of Object.entries(roots))
    for (const path of paths)
      assert.deepEqual(parsePath(pathHash([root, ...path])), [root, ...path]);
console.log(
  JSON.stringify({
    processes: definitions.length,
    processSeeks: seeks,
    processErrors: 0,
  }),
);
