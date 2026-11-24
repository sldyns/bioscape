import { plantDefinitions, bacteriaDefinitions } from "../catalog/cellTypes";
import { specializedOwner, prepareSpecimen } from "../compare/specimens.js";
import { microbeIds } from "../catalog/microbes";
const plantIds = new Set(plantDefinitions.map((d) => d[0]));
const bacteriaIds = new Set(bacteriaDefinitions.map((d) => d[0]));
import { detailModel } from "./detailModels";
const specimenBuilders = {
  erythrocyte: () =>
    import("../compare/models/erythrocyte.js").then((m) => m.buildErythrocyte),
  neuron: () =>
    import("../compare/models/neuron.js").then((m) => m.buildNeuron),
  muscleFibre: () =>
    import("../compare/models/muscle.js").then((m) => m.buildMuscleFibre),
  rodPhotoreceptor: () =>
    import("../compare/models/rod.js").then((m) => m.buildRod),
};

export async function loadDetailModel(id) {
  const owner = specializedOwner.get(id);
  if (owner) {
    return detailModel(
      id,
      prepareSpecimen(id, await specimenBuilders[owner]()),
    );
  }
  if (id === "yeastNuclearPores") {
    const { yeastPoreReference } = await import("./yeastPoreReference");
    return detailModel(id, yeastPoreReference());
  }
  if (id === "nucleosome" || id === "histones") {
    const [{ nucleosomeReference }, { default: data }] = await Promise.all([
      import("./nucleosomeReference"),
      import("./data/nucleosome-1kx5.json"),
    ]);
    return detailModel(id, nucleosomeReference(id, data));
  }
  if (id === "dna" || id === "bacterialDNA") {
    const { dnaDuplexReference } = await import("./dnaDuplexReference");
    return detailModel(id, dnaDuplexReference(id));
  }
  if (microbeIds.has(id)) {
    const make =
      id === "yeast" || id.startsWith("yeast")
        ? (await import("./yeastDetails")).yeastDetail
        : id === "paramecium" || id.startsWith("para")
          ? (await import("./parameciumDetails")).parameciumDetail
          : (await import("./phageDetails")).phageDetail;
    return detailModel(id, make(id));
  }
  if (["plant60S", "plant40S", "bacterial50S", "bacterial30S"].includes(id)) {
    const { ribosomeReference } = await import("./ribosomeReference");
    const subunit =
      id.endsWith("60S") || id.endsWith("50S")
        ? "largeSubunit"
        : "smallSubunit";
    const { default: data } =
      id === "plant60S"
        ? await import("./data/ribosome-8jiv-largeSubunit.json")
        : id === "plant40S"
          ? await import("./data/ribosome-8jiw-smallSubunit.json")
          : id === "bacterial50S"
            ? await import("./data/ribosome-7k00-largeSubunit.json")
            : await import("./data/ribosome-7k00-smallSubunit.json");
    return detailModel(id, ribosomeReference(id, data, subunit));
  }
  if (id === "plantRibosome") {
    const [{ plantRibosomeReference }, { default: data }] = await Promise.all([
      import("./plantRibosomeReference"),
      import("./data/ribosome-8b2l-assembly.json"),
    ]);
    return detailModel(id, plantRibosomeReference(data));
  }
  if (id === "bacterialRibosome") {
    const [
      { bacterialRibosomeReference },
      { default: large },
      { default: small },
    ] = await Promise.all([
      import("./ribosomeReference"),
      import("./data/ribosome-7k00-largeSubunit.json"),
      import("./data/ribosome-7k00-smallSubunit.json"),
    ]);
    return detailModel(id, bacterialRibosomeReference(large, small));
  }
  if (id === "plantCytoplasm") {
    const { plantCytosol } = await import("./plantCytosol");
    return detailModel(id, plantCytosol());
  }
  if (plantIds.has(id)) {
    const { plantDetail } = await import("./plantDetails");
    return detailModel(id, plantDetail(id));
  }
  if (bacteriaIds.has(id)) {
    const { bacteriaDetail } = await import("./bacteriaDetails");
    return detailModel(id, bacteriaDetail(id));
  }
  if (id === "largeSubunit" || id === "smallSubunit") {
    const { ribosomeReference } = await import("./ribosomeReference");
    const { default: data } =
      id === "largeSubunit"
        ? await import("./data/ribosome-4ug0-largeSubunit.json")
        : await import("./data/ribosome-4ug0-smallSubunit.json");
    return detailModel(id, ribosomeReference(id, data));
  }
  if (["oxidativeEnzymes", "catalase", "acylCoAOxidase"].includes(id)) {
    const { peroxisomeReference } = await import("./peroxisomeReference");
    return detailModel(id, peroxisomeReference(id));
  }
  if (id === "tubulinDimer") {
    const { tubulinReference } = await import("./tubulinReference");
    return detailModel(id, tubulinReference());
  }
  if (["cytosol", "cytosolicEnzyme", "waterIons"].includes(id)) {
    const { cytosolDetail } = await import("./cytosolDetails");
    return detailModel(id, cytosolDetail(id));
  }
  return detailModel(id);
}
