import assert from "node:assert/strict";
import { test } from "node:test";
import { disposeScene } from "../src/processes/disposeScene.js";
import organelleImport from "../src/processes/modules/rna/organelleImportProcess.js";
import rnaSilencing from "../src/processes/modules/turnover/rnaSilencingProcess.js";
import { processCacheSnapshot } from "./helpers/process-cache-snapshot.mjs";

// Observe the actual resources reachable through the public model contract.
// Cleanup always uses the product disposer; no substitute disposer is tested.
function resources(model) {
  const geometries = new Set();
  const graphMaterials = new Set();
  const materials = new Set(model.materials ?? []);
  const instances = new Set();
  const textures = new Set();
  model.group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.isInstancedMesh) instances.add(object);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (material) {
        graphMaterials.add(material);
        materials.add(material);
      }
    }
  });
  for (const material of materials)
    for (const value of Object.values(material))
      if (value?.isTexture) textures.add(value);
  return {
    geometries,
    graphMaterials,
    materials,
    instances,
    textures,
    all: new Set([...geometries, ...materials, ...instances, ...textures]),
  };
}

function watch(model, name) {
  const owned = resources(model);
  const events = new Map();
  const listeners = new Map();
  for (const resource of owned.all) {
    events.set(resource, 0);
    const listener = () => events.set(resource, events.get(resource) + 1);
    resource.addEventListener("dispose", listener);
    listeners.set(resource, listener);
  }
  return { model, name, owned, events, listeners, disposed: false };
}

function expectEvents(record, expected) {
  for (const [resource, count] of record.events)
    assert.equal(
      count,
      expected,
      `${record.name}: ${resource.type}/${resource.uuid} dispose events`,
    );
}

function expectSameResources(record) {
  const current = resources(record.model);
  for (const key of ["geometries", "materials", "instances", "textures"]) {
    assert.equal(
      current[key].size,
      record.owned[key].size,
      `${record.name}: ${key}`,
    );
    for (const resource of record.owned[key])
      assert.ok(
        current[key].has(resource),
        `${record.name}: retained ${key} object identity`,
      );
  }
}

function expectDisjoint(left, right) {
  for (const resource of left.owned.all)
    assert.ok(
      !right.owned.all.has(resource),
      `${left.name}/${right.name}: independent disposable resource identity`,
    );
}

function dispose(record) {
  assert.equal(record.disposed, false, `${record.name}: one model cleanup`);
  record.disposed = true;
  disposeScene(record.model.group, record.model.materials ?? []);
}

const scenarios = [
  {
    definition: organelleImport,
    rootId: "plant",
    states: [
      [0.91, { transit: "present" }],
      [1, { transit: "present" }],
      [1, { transit: "absent" }],
      [0, { transit: "present" }],
      [0.55, { transit: "present" }],
    ],
    sharedWitness(model) {
      const chaperone = model.group.getObjectByName("stromal-chaperone");
      const domain = chaperone.children[0];
      assert.ok(
        domain.isMesh && domain.geometry?.isBufferGeometry,
        "shared domain witness is an actual surface mesh",
      );
      let references = 0;
      model.group.traverse((object) => {
        if (object.geometry === domain.geometry) references++;
      });
      assert.ok(
        references > 1,
        "real proteinDomain cache shares domain geometry",
      );
    },
  },
  {
    definition: rnaSilencing,
    rootId: "cell",
    states: [
      [0.72, { pairing: "seed" }],
      [1, { pairing: "seed" }],
      [0.72, { pairing: "slice" }],
      [0.72, { pairing: "mismatch" }],
      [0, { pairing: "seed" }],
      [0.42, { pairing: "seed" }],
    ],
    sharedWitness(model) {
      const guide = model.group.getObjectByName("guide phosphate backbone");
      const target = model.group.getObjectByName("mRNA phosphates");
      assert.ok(
        guide?.isInstancedMesh && target?.isInstancedMesh,
        "guide/target witnesses are actual instance meshes",
      );
      assert.equal(
        guide.geometry,
        target.geometry,
        "real guide/target geometry sharing",
      );
      const owned = resources(model);
      assert.ok(
        [...owned.materials].some(
          (material) => !owned.graphMaterials.has(material),
        ),
        "fade retains replaced materials in the public disposal inventory",
      );
    },
  },
];

for (const scenario of scenarios) {
  const { definition, rootId, states, sharedWitness } = scenario;
  test(`${definition.id}: disposal and recreation isolate siblings`, () => {
    const records = [];
    const create = (name) => {
      const record = watch(
        definition.create({ rootId }),
        `${definition.id}/${name}`,
      );
      records.push(record);
      sharedWitness(record.model);
      return record;
    };
    const seek = (record, state) => {
      record.model.update(...state);
      expectSameResources(record);
      expectEvents(record, 0);
      return processCacheSnapshot(record.model);
    };
    try {
      const a = create("A");
      const b = create("B");
      expectDisjoint(a, b);
      // Establish a small set of actual sibling states before any disposal.
      // This reuses the repository byte/material/label snapshot helper, not
      // another implementation of either model's scientific update formulas.
      const expected = states.map((state) => seek(b, state));
      seek(a, states[0]);
      assert.deepEqual(
        processCacheSnapshot(b.model),
        expected.at(-1),
        "updating A leaves live B unchanged",
      );
      dispose(a);
      expectEvents(a, 1);
      expectEvents(b, 0);
      assert.deepEqual(
        processCacheSnapshot(b.model),
        expected.at(-1),
        "disposing A leaves live B unchanged",
      );
      for (let index = states.length - 1; index >= 0; index--)
        assert.deepEqual(
          seek(b, states[index]),
          expected[index],
          `B state ${index} survives A disposal and reverse seeking`,
        );
      const c = create("C");
      expectDisjoint(a, c);
      expectDisjoint(b, c);
      assert.deepEqual(
        seek(c, states.at(-1)),
        expected.at(-1),
        "C recreates the real state",
      );
      assert.deepEqual(
        processCacheSnapshot(b.model),
        expected[0],
        "creating and updating C leaves live B unchanged",
      );
      expectEvents(a, 1);
      expectEvents(b, 0);
      dispose(b);
      expectEvents(b, 1);
      expectEvents(c, 0);
      assert.deepEqual(
        processCacheSnapshot(c.model),
        expected.at(-1),
        "disposing B leaves live C unchanged",
      );
      assert.deepEqual(
        seek(c, states[0]),
        expected[0],
        "C still seeks after both earlier instances were disposed",
      );
      dispose(c);
      for (const record of records) expectEvents(record, 1);
    } finally {
      for (const record of records) {
        if (!record.disposed) dispose(record);
        for (const [resource, listener] of record.listeners)
          resource.removeEventListener("dispose", listener);
      }
    }
  });
}
