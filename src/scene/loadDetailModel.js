import { plantDefinitions, bacteriaDefinitions } from "../catalog/cellTypes";
import { microbeIds } from "../catalog/microbes";
const plantIds = new Set(plantDefinitions.map((d) => d[0]));
const bacteriaIds = new Set(bacteriaDefinitions.map((d) => d[0]));
import { detailModel } from "./detailModels";
export async function loadDetailModel(id) {
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
