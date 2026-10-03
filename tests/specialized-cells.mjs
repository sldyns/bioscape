import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as T from "three";
import {
  getSpecimenModel,
  erythrocyteHalfThickness,
  neuronInternodes,
  neuronAxonSampling,
  muscleDimensions,
  muscleMyofibrilCentres,
} from "../src/compare/specimenModels.js";
import {
  specializedSpecimens,
  specializedPartIds,
} from "../src/compare/specimens.js";
import { createPresentationAppearance } from "../src/scene/presentationAppearance.js";
import { packDetail, unpackDetail } from "../src/scene/detailTransfer.js";
import { isStructureLabelVisible } from "../src/scene/structureLabelModes.js";

function dispose(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
}

function meshes(group, id) {
  const result = [];
  group.traverse((object) => {
    if (object.isMesh && (!id || object.userData.hitId === id))
      result.push(object);
  });
  return result;
}

function validateGeometry(group, id) {
  group.updateMatrixWorld(true);
  let triangles = 0;
  for (const object of meshes(group)) {
    const geometry = object.geometry;
    assert.ok(
      geometry.attributes.position.count > 2,
      `${id}: missing geometry`,
    );
    for (const attribute of Object.values(geometry.attributes)) {
      assert.ok(
        attribute.array.every(Number.isFinite),
        `${id}: nonfinite geometry`,
      );
      assert.equal(attribute.count, geometry.attributes.position.count);
    }
    if (geometry.index) {
      assert.ok(
        geometry.index.array.every(
          (i) => i >= 0 && i < geometry.attributes.position.count,
        ),
      );
      triangles += geometry.index.count / 3;
    } else triangles += geometry.attributes.position.count / 3;
    assert.ok(object.userData.hitId, `${id}: missing anatomical hit ID`);
  }
  const bounds = new T.Box3().setFromObject(group);
  const size = bounds.getSize(new T.Vector3());
  assert.ok(
    size.toArray().every((value) => value > 0 && value < 12),
    `${id}: invalid bounds`,
  );
  assert.ok(triangles < 450_000, `${id}: unexpectedly expensive geometry`);
}

const groups = new Map();
for (const specimen of specializedSpecimens) {
  const group = getSpecimenModel(specimen.id);
  groups.set(specimen.id, group);
  validateGeometry(group, specimen.id);
  assert.deepEqual(
    new Set(meshes(group).map((object) => object.userData.hitId)),
    new Set(specimen.parts.map((part) => part.id)),
  );
  for (const lang of ["zh", "en"]) {
    assert.ok(specimen[lang] && specimen.summary[lang] && specimen.scope[lang]);
    for (const field of ["boundary", "genome", "organization", "function"])
      assert.ok(specimen.facts[field][lang]);
  }
  assert.ok(specimen.sources.length >= 2);
  for (const source of specimen.sources)
    assert.ok(new URL(source.url).protocol === "https:");
  const apply = createPresentationAppearance(group);
  apply("whole", null, 1);
  for (const object of meshes(group)) {
    if (object.userData.cap) assert.equal(object.visible, true);
    if (object.userData.cutOnly) assert.equal(object.visible, false);
  }
  apply("section", null, 1);
  for (const object of meshes(group)) {
    if (object.userData.cap) assert.equal(object.visible, false);
    if (object.userData.cutOnly) assert.equal(object.visible, true);
  }
}

const erythrocyte = groups.get("erythrocyte");
erythrocyte.rotation.set(0, 0, 0);
erythrocyte.updateMatrixWorld(true);
assert.equal(erythrocyte.userData.biology.nuclei, 0);
assert.equal(erythrocyte.userData.biology.mitochondria, 0);
assert.equal(erythrocyteHalfThickness(0), 0.405);
assert.equal(erythrocyteHalfThickness(1), 0);
assert.ok(erythrocyteHalfThickness(0.7) > 1.2);
const membrane = meshes(erythrocyte, "erythrocyteMembrane");
const frontAt = (x, y) => {
  const hits = new T.Raycaster(
    new T.Vector3(x, y, 3),
    new T.Vector3(0, 0, -1),
  ).intersectObjects(membrane);
  assert.ok(hits.length > 0, "Biconcave disc must have material at the centre");
  return hits[0].point.z;
};
assert.ok(frontAt(0.013, 0.017) > 0.19 && frontAt(0.013, 0.017) < 0.21);
assert.ok(frontAt(1.33, 0.03) > 0.58, "Rim must be thicker than centre");
assert.ok(
  !meshes(erythrocyte).some(
    ({ geometry }) => geometry.type === "TorusGeometry",
  ),
);

const neuron = groups.get("neuron");
const axon = meshes(neuron, "neuronAxon")[0].geometry.attributes.position;
const { longitudinalSegments: axonSteps, radialSegments: axonRadial } =
  neuronAxonSampling;
const centreline = new T.CatmullRomCurve3(
  neuron.userData.biology.continuousAxon.map(
    (point) => new T.Vector3(...point),
  ),
);
// Ring centres must follow one uninterrupted axon, including every nodal gap.
for (let i = 0; i <= axonSteps; i++) {
  const mean = new T.Vector3();
  for (let j = 0; j < axonRadial; j++)
    mean.add(
      new T.Vector3().fromBufferAttribute(axon, i * (axonRadial + 1) + j),
    );
  mean.divideScalar(axonRadial);
  assert.ok(mean.distanceTo(centreline.getPointAt(i / axonSteps)) < 0.000001);
}
for (let i = 1; i < neuronInternodes.length; i++)
  assert.ok(neuronInternodes[i].start > neuronInternodes[i - 1].end);
assert.equal(neuron.userData.biology.nodes, neuronInternodes.length - 1);
assert.ok(meshes(neuron, "neuronNodes").length > 0);
const soma = meshes(neuron, "neuronSoma");
assert.ok(
  soma.some((object) => object.userData.cap),
  "The soma must reveal its nucleus through a removable surface",
);
const nuclearBounds = new T.Box3().setFromObject(
  meshes(neuron, "neuronNucleus")[0],
);
const somaBounds = new T.Box3();
for (const object of soma) somaBounds.union(new T.Box3().setFromObject(object));
assert.ok(somaBounds.containsBox(nuclearBounds), "Nucleus must be inside soma");

const muscle = groups.get("muscleFibre");
muscle.rotation.set(0, 0, 0);
muscle.updateMatrixWorld(true);
const { radius, myofibrilRadius, length, sarcomereLength, sarcomeres } =
  muscleDimensions;
assert.ok(Math.abs(sarcomeres * sarcomereLength - length) < 1e-12);
const centres = muscleMyofibrilCentres();
assert.equal(centres.length, 91);
for (let i = 0; i < centres.length; i++) {
  const [y, z] = centres[i];
  assert.ok(Math.hypot(y, z) + myofibrilRadius < radius);
  for (let j = i + 1; j < centres.length; j++)
    assert.ok(
      Math.hypot(y - centres[j][0], z - centres[j][1]) > myofibrilRadius * 2,
    );
}
const nuclei = meshes(muscle, "muscleFibreNuclei")[0].geometry.attributes
  .position;
for (let i = 0; i < nuclei.count; i++) {
  const radial = Math.hypot(nuclei.getY(i), nuclei.getZ(i));
  assert.ok(
    radial > radius * 0.85 && radial < radius,
    "Myonuclei must sit beneath the sarcolemma at the periphery",
  );
}
const exemplar = meshes(muscle, "muscleFibreSarcomere")[0];
const exampleBounds = new T.Box3()
  .setFromObject(exemplar)
  .getSize(new T.Vector3());
assert.ok(
  Math.abs(exampleBounds.x - sarcomereLength) < 0.000001,
  "Highlighted repeat must span exactly one sarcomere",
);

// Exercise every nested route as well as the existing flattening contract.
for (const id of specializedPartIds) {
  const group = getSpecimenModel(id);
  assert.ok(meshes(group).length);
  assert.ok(meshes(group).every((object) => object.userData.hitId === id));
  dispose(group);
}
assert.equal(getSpecimenModel("not-a-specimen"), null);
const temporary = await mkdtemp(join(tmpdir(), "bioscape-specialized-test-"));
try {
  const outfile = join(temporary, "normalizer.mjs");
  await build({
    stdin: {
      contents:
        'export { detailModel } from "./src/scene/detailModels.js"; export { makePresentation } from "./src/scene/presentation.js"; export { explodedFitDistance } from "./src/scene/viewFraming.js";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const { detailModel, makePresentation, explodedFitDistance } = await import(
    pathToFileURL(outfile)
  );
  for (const specimen of specializedSpecimens) {
    const normalized = detailModel(specimen.id, getSpecimenModel(specimen.id));
    validateGeometry(normalized, `${specimen.id} normalized`);
    assert.deepEqual(
      new Set(meshes(normalized).map((object) => object.userData.hitId)),
      new Set(specimen.parts.map((part) => part.id)),
    );
    assert.equal(
      Object.keys(normalized.userData.partAnchors).length,
      specimen.parts.length,
    );
    const transferred = unpackDetail(
      structuredClone(packDetail(normalized).payload),
    );
    const presentation = makePresentation(null, specimen.id, transferred);
    dispose(normalized);
    const hiddenInside = {
      erythrocyte: ["erythrocyteCytosol"],
      neuron: ["neuronNucleus"],
      muscleFibre: [
        "muscleFibreNuclei",
        "muscleFibreSarcomere",
        "muscleFibreSR",
        "muscleFibreTriads",
        "muscleFibreMitochondria",
      ],
    }[specimen.id];
    for (const id of hiddenInside) {
      const label = presentation.parts.find(
        (part) => part.userData.hitId === id,
      ).userData;
      assert.equal(
        isStructureLabelVisible(label, "whole"),
        false,
        `${id}: labels must not point through the opaque whole surface after normalization/worker transfer`,
      );
      assert.equal(isStructureLabelVisible(label, "section"), true);
      assert.equal(isStructureLabelVisible(label, "explode"), true);
    }
    const offsets = Object.fromEntries(
      presentation.parts.map((part) => [
        part.userData.hitId,
        part.userData.offset,
      ]),
    );
    if (specimen.id === "erythrocyte")
      assert.ok(
        offsets.erythrocyteMembrane.distanceTo(offsets.erythrocyteCytosol) > 2,
      );
    if (specimen.id === "neuron") {
      assert.deepEqual(
        offsets.neuronAxon.toArray(),
        offsets.neuronTerminals.toArray(),
        "Terminal branches must stay connected to axon during separation",
      );
      assert.deepEqual(
        offsets.neuronAxon.toArray(),
        offsets.neuronNodes.toArray(),
        "Nodes are regions of the axon, not detachable organelles",
      );
      assert.deepEqual(
        offsets.neuronSoma.toArray(),
        offsets.neuronDendrites.toArray(),
        "Dendrites stay attached to soma during separation",
      );
      assert.ok(
        offsets.neuronMyelin.distanceTo(offsets.neuronAxon) > 1,
        "Myelin must visibly separate from axon",
      );
      assert.ok(
        offsets.neuronNucleus.distanceTo(offsets.neuronSoma) > 1,
        "Nucleus must visibly separate from soma",
      );
    }
    if (specimen.id === "muscleFibre")
      assert.ok(
        offsets.muscleFibreSarcolemma.distanceTo(
          offsets.muscleFibreMyofibrils,
        ) > 1,
      );
    for (const aspect of [0.5, 1, 2.5])
      for (const amount of [0, 0.6, 1]) {
        const distance = explodedFitDistance(
          presentation.parts,
          amount,
          aspect,
          36,
        );
        assert.ok(Number.isFinite(distance) && distance > 0);
        const tangent = Math.tan((Math.PI * 36) / 360);
        for (const part of presentation.parts) {
          const { frameBounds, offset } = part.userData;
          for (const x of [frameBounds.min.x, frameBounds.max.x])
            for (const y of [frameBounds.min.y, frameBounds.max.y])
              for (const z of [frameBounds.min.z, frameBounds.max.z]) {
                const depth = distance - z - offset.z * amount;
                assert.ok(
                  Math.abs(x + offset.x * amount) < depth * tangent * aspect,
                  "Exploded geometry must fit narrow and wide framing horizontally",
                );
                assert.ok(
                  Math.abs(y + offset.y * amount) < depth * tangent,
                  "Exploded geometry must fit vertically",
                );
              }
        }
      }
    dispose(presentation.root);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
  groups.forEach(dispose);
}
console.log(
  "Specialized cells: finite geometry, biconcavity, continuous axon, myelin gaps, peripheral nuclei, sarcomere packing, cutaway and detail-model checks passed.",
);
