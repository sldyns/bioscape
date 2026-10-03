import { specializedSpecimens } from "./specimens.js";
import { buildErythrocyte } from "./models/erythrocyte.js";
import { buildNeuron } from "./models/neuron.js";
import { buildMuscleFibre } from "./models/muscle.js";

export { erythrocyteHalfThickness } from "./models/erythrocyte.js";
export { neuronInternodes, neuronAxonSampling } from "./models/neuron.js";
export { muscleDimensions, muscleMyofibrilCentres } from "./models/muscle.js";

const factories = {
  erythrocyte: buildErythrocyte,
  neuron: buildNeuron,
  muscleFibre: buildMuscleFibre,
};
const partParents = new Map(
  specializedSpecimens.flatMap((specimen) =>
    specimen.parts.map((part) => [part.id, specimen.id]),
  ),
);

// Each leaf has a deliberately magnified anatomical view. Filtering the whole
// model would discard the secondary structures needed at that observation scale.
export function getSpecimenModel(id) {
  const specimenId = factories[id] ? id : partParents.get(id);
  if (!specimenId) return null;
  const group = factories[specimenId](id);
  group.userData.ownedGeometry = true;
  group.userData.specimenId = specimenId;
  return group;
}
