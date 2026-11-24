import { buildRod } from "./models/rod.js";
import { specializedOwner, prepareSpecimen } from "./specimens.js";
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
  rodPhotoreceptor: buildRod,
};
// Each leaf has a dedicated model at its observation scale.
export function getSpecimenModel(id) {
  return prepareSpecimen(id, factories[specializedOwner.get(id)]);
}
