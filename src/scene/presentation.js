import * as THREE from "three";
import { children } from "../hierarchy";

export function makePresentation(model, id, special = null) {
  const root = new THREE.Group(),
    parts = [];
  model?.cell.updateMatrixWorld(true);
  function register(source, hitId) {
    const copy = source.clone(true);
    source.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale);
    copy.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.userData.hitId = hitId;
        o.userData.sharedGeometry = true;
      }
    });
    return copy;
  }
  const childIds = children[id] || [];
  if (special) {
    root.add(special);
    for (const child of childIds) {
      const p = new THREE.Group();
      p.userData.hitId = child;
      special.children
        .filter((o) => o.userData.hitId === child)
        .forEach((o) => p.add(o));
      if (p.children.length) {
        root.add(p);
        parts.push(p);
      }
    }
    if (special.children.length) {
      special.userData.hitId = id;
      parts.push(special);
    }
  } else if (id === "cell" || id === "cytoplasm") {
    for (const [sourceKey, source] of Object.entries(model.groups)) {
      const key =
        id === "cytoplasm" && sourceKey === "cytoplasm" ? "cytosol" : sourceKey;
      if (id === "cytoplasm" && !childIds.includes(key)) continue;
      const copy = register(source, key);
      // Context layers remain legible without obscuring the structures being studied.
      if (["membrane", "cytoplasm", "cytosol", "cytoskeleton"].includes(key))
        copy.traverse((o) => {
          if (o.isMesh && o.material.transparent) {
            o.material.opacity *= ["cytoplasm", "cytosol"].includes(key)
              ? 0.38
              : key === "membrane"
                ? 0.72
                : 0.8;
          }
        });
      copy.userData.hitId = key;
      root.add(copy);
      parts.push(copy);
    }
  } else {
    const sources =
      id === "mitochondria"
        ? [model.groups[id].children[0]]
        : model.groups[id]
          ? [model.groups[id]]
          : model.parts[id];
    if (!sources?.length) throw new Error(`No anatomical model for ${id}`);
    const assignment = new Map();
    for (const child of childIds)
      for (const o of model.parts[child] || [])
        o.traverse((x) => assignment.set(x.uuid, child));
    const buckets = new Map();
    for (const source of sources)
      source.traverse((o) => {
        if (!o.isMesh) return;
        const key = assignment.get(o.uuid) || id;
        if (!buckets.has(key)) {
          const p = new THREE.Group();
          p.userData.hitId = key;
          buckets.set(key, p);
          root.add(p);
          parts.push(p);
        }
        buckets.get(key).add(register(o, key));
      });
  }
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root),
    center = bounds.getCenter(new THREE.Vector3()),
    size = bounds.getSize(new THREE.Vector3());
  const factor = 5.4 / Math.max(size.x, size.y, size.z, 0.01);
  for (const p of root.children) {
    p.position.sub(center).multiplyScalar(factor);
    p.scale.multiplyScalar(factor);
  }
  root.updateMatrixWorld(true);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const frameBounds = new THREE.Box3().setFromObject(p);
    p.userData.frameBounds = frameBounds;
    const center = frameBounds.getCenter(new THREE.Vector3());
    let direction = center.clone();
    if (direction.length() < 0.2)
      direction.set(Math.cos(i * 2.4), Math.sin(i * 2.4), 0.35);
    direction.normalize().multiplyScalar(0.95);
    if (["yeast", "paramecium", "phage"].includes(id)) {
      const offsets = {
        yeastWall: [-4.6, 0, 0],
        yeastMembrane: [-2.6, 0, 0],
        yeastNucleus: [0, 1.5, 0.6],
        yeastVacuole: [2, -0.5, 0.4],
        yeastMito: [0, -2, 0],
        yeastER: [-0.5, 0, 1.8],
        yeastBud: [2, 1, 0],
        paraSurface: [-3.8, 0, 0],
        paraCilia: [3.8, 0, 0],
        paraOral: [2.2, 0.4, 0.6],
        paraFood: [1.8, -1.2, 0.7],
        paraContractile: [-1, 0.7, 0.9],
        paraMacro: [-1.4, 0, 0.8],
        paraMicro: [0.5, 0.7, 1.5],
        paraTrichocysts: [-1.6, -1, -0.8],
        paraMito: [0.2, -1.2, -1],
        phageHead: [-2.6, 1, 0],
        phageGenome: [2.6, 1, 0],
        phageTail: [0, -0.3, 0],
        phageBaseplate: [0, -1.4, 0],
        phageFibers: [0, -2, 0],
      };
      direction.set(...(offsets[p.userData.hitId] || [0, 0, 0]));
    }
    if (id === "phageTail")
      direction.set(p.userData.hitId === "phageSheath" ? -1.5 : 1.5, 0, 0);
    if (id === "yeastWall")
      direction.set(0, p.userData.hitId === "yeastMannan" ? 1.5 : -1.5, 0);
    if (id === "cell" || id === "cytoplasm") {
      const offsets = {
        membrane: [0, 0, -1.3],
        cytoplasm: [0, 0, -0.3],
        cytosol: [0, 0, -0.3],
        cytoskeleton: [0, 0, -0.5],
        nucleus: [0.1, 0.55, 1.4],
        roughER: [-1.1, 0.1, -0.1],
        smoothER: [-0.7, 0.75, 0.5],
        mitochondria: [0.6, -0.3, 0.65],
        golgi: [1.2, 0.2, 0.5],
        ribosomes: [0, -1.1, 1],
        lysosome: [-0.8, -0.6, 0.7],
        peroxisome: [0.9, 0.65, 0.6],
        centrosome: [0.4, -0.45, 1.5],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "membrane") {
      const offsets = {
        bilayer: [0, -0.2, 0],
        membraneProteins: [0, 1.65, 0.4],
        glycans: [0, 2.45, 0.2],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "envelope")
      direction.set(0, p.userData.hitId === "outerNuclear" ? 0.65 : -0.65, 0);
    if (id === "nucleus" || id === "plantNucleus") {
      const offsets = {
        envelope: [-1.8, 0.3, -0.8],
        nuclearPores: [1.5, 1.5, 0],
        chromatin: [1.7, -0.3, 0.8],
        nucleolus: [0.4, -2, 1.2],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "paraMacro" || id === "paraMicro") {
      const suffix = p.userData.hitId.slice(id.length);
      const offsets = {
        Envelope: [-1.8, 0.3, -0.8],
        Pores: [1.5, 1.5, 0],
        Chromatin: [1.7, -0.3, 0.8],
        Nucleoli: [0.4, -2, 1.2],
      };
      direction.set(...(offsets[suffix] || [0, 0, 0]));
    }
    if (id === "yeastNucleus") {
      const offsets = {
        yeastNuclearEnvelope: [-1.8, 0.3, -0.8],
        yeastNuclearPores: [1.5, 1.5, 0],
        yeastChromatin: [1.7, -0.3, 0.8],
        yeastNucleolus: [0.4, -2, 1.2],
      };
      direction.set(...(offsets[p.userData.hitId] || [0, 0, 0]));
    }
    if (id === "plant") {
      const offsets = {
        cellWall: [0, 0, -1.5],
        plantMembrane: [0, 0, -0.5],
        vacuole: [1.9, 0, 0.6],
        plantNucleus: [-1.5, 0.8, 1],
        plantMitochondria: [0.1, 1.3, 0.8],
        plantER: [-1.1, 0.2, 0],
        plantGolgi: [-1.2, -0.3, 0.7],
        chloroplast: [0.7, -0.6, 1.1],
        plantRibosome: [0.9, 0.2, 1.6],
        plantCytoplasm: [0, -1, -0.4],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "bacterium") {
      const offsets = {
        bacterialEnvelope: [-1.8, 0, -0.5],
        nucleoid: [1.6, 0.2, 0.5],
        plasmids: [1.8, -1.5, 0.7],
        bacterialRibosome: [-1.3, -1.4, 1.2],
        bacterialCytoplasm: [0, -2, -0.2],
        pili: [-2, 1.2, 0],
        flagellum: [1.4, 1.3, 0],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "bacterialEnvelope")
      direction.set(
        0,
        {
          bacterialOuter: 1.5,
          peptidoglycan: 0,
          bacterialMembrane: -1.5,
          bacterialEnvelope: 0,
        }[p.userData.hitId],
        0,
      );
    if (id === "flagellarMotor")
      direction.set(
        ...{
          motorRotor: [-1.4, -0.8, 0.2],
          motorBushing: [0, 1.1, 0.3],
          motorStator: [1.6, -0.1, 0.2],
          flagellarMotor: [0, 0, -1.4],
        }[p.userData.hitId],
      );
    if (id === "pili")
      direction.set(
        p.userData.hitId === "pilusTip" ? 0.9 : -0.9,
        p.userData.hitId === "pilusTip" ? 0.5 : -0.3,
        0,
      );
    if (id === "bacterialOuter")
      direction.set(
        ...{
          bacterialOuter: [0, -0.6, 0],
          lps: [-0.5, 0.8, 0],
          porin: [1.1, 0.6, 0.2],
        }[p.userData.hitId],
      );
    if (id === "bacterialMembrane")
      direction.set(0, p.userData.hitId === "bacterialATPase" ? -1.2 : 0.3, 0);
    if (id === "chloroplast")
      direction.set(
        ...{
          chloroplastEnvelope: [-4.4, 0.4, 0],
          thylakoids: [4.2, 0.4, 0],
          stroma: [0, -3.5, 0.3],
        }[p.userData.hitId],
      );
    if (id === "thylakoids")
      direction.set(
        0,
        p.userData.hitId === "granum" ? 1.3 : -2,
        p.userData.hitId === "granum" ? 0 : 1,
      );
    if (id === "cellWall") {
      const offsets = {
        wallMatrix: [-7, 0, 0],
        cellulose: [2.6, 0, 0.7],
        plasmodesmata: [9, 0, 0.3],
      };
      direction.set(...(offsets[p.userData.hitId] || [0, 0, -1]));
    }
    if (id === "plasmodesmata") {
      const offsets = {
        pdMembrane: [-1.8, 0, 0.3],
        pdDesmotubule: [1.8, 0, 0.5],
        plasmodesmata: [0, 0, -1.8],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (["plantMembrane", "tonoplast"].includes(id))
      direction.set(
        p.userData.hitId === id
          ? 0
          : p.userData.hitId === "plantAquaporin"
            ? 3.6
            : -3.6,
        p.userData.hitId === id ? -0.4 : 0.6,
        0,
      );
    if (id === "vacuole")
      direction.set(p.userData.hitId === "tonoplast" ? -4.8 : 4.8, 0, 0);
    if (id === "plantER")
      direction.set(p.userData.hitId === "plantRibosome" ? -3.2 : 1.4, 0, 0);
    if (id === "cytosol")
      direction.set(p.userData.hitId === "cytosolicEnzyme" ? -2.1 : 2.1, 0, 0);
    if (id === "centrosome")
      direction.set(p.userData.hitId === "centrioles" ? -2.2 : 2.4, 0, 0);
    if (id === "cytoskeleton") {
      const offsets = {
        microtubules: [0, 0, 0.6],
        actin: [-5.7, 0, 0],
        intermediate: [5.7, 0, 0],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "peroxisome")
      direction.set(
        p.userData.hitId === "peroxisomalMembrane" ? -2.8 : 2.4,
        0,
        0,
      );
    if (id === "oxidativeEnzymes")
      direction.set(p.userData.hitId === "catalase" ? -1.5 : 1.5, 0, 0);
    if (id === "lysosome") {
      const offsets = {
        lysosomalMembrane: [-3.0, 0, 0],
        hydrolases: [2.6, 0.65, 0],
        recycling: [2.6, -0.65, 0],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "lysosomalMembrane")
      direction.set(p.userData.hitId === "lysosomalPump" ? 1.8 : -1.8, 0, 0);
    if (id === "golgi" || id === "plantGolgi")
      direction.set(p.userData.hitId === "vesicles" ? 3.2 : -3.2, 0, 0);
    if (id === "vesicles")
      direction.set(p.userData.hitId === "cargo" ? 2.2 : -2.2, 0, 0);
    if (id === "roughER")
      direction.set(p.userData.hitId === "boundRibosomes" ? 2.6 : -2.6, 0, 0);
    if (["ribosomes", "boundRibosomes", "plantRibosome"].includes(id)) {
      const offsets = {
        largeSubunit: [-1.8, -0.3, 0],
        smallSubunit: [1.5, 0.65, 0],
        plant60S: [-1.8, -0.3, 0],
        plant40S: [1.5, 0.65, 0],
        mrna: [0, -3.5, 1.1],
        trna: [0, 0.4, 1.9],
        boundRibosomes: [0, -0.8, -0.8],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "bacterialRibosome")
      direction.set(p.userData.hitId === "bacterial50S" ? -4.5 : 4.5, 0, 0);
    if (id === "mitochondria" || id === "plantMitochondria") {
      const offsets = {
        mitoOuter: [-2.8, 0, -0.4],
        mitoInner: [0, 0.15, 0],
        matrix: [2.8, -0.15, 0.5],
        plantMatrix: [2.8, -0.15, 0.5],
      };
      direction.set(...offsets[p.userData.hitId]);
    }
    if (id === "mitoInner")
      direction.set(
        p.userData.hitId === "atpSynthase" ? 1.5 : -0.6,
        0,
        p.userData.hitId === "atpSynthase" ? 1 : 0,
      );
    if (id === "matrix")
      direction.set(p.userData.hitId === "mitoDNA" ? 1.2 : -0.6, 0, 0);
    if (id === "nucleosome")
      direction.set(p.userData.hitId === "histones" ? -2.5 : 2.5, 0, 0);
    if (id === "chromatin")
      direction.set(0, p.userData.hitId === "dna" ? 1.3 : -1.3, 0);
    const contextAnchor = ["cell", "cytoplasm"].includes(id)
      ? model.anchors[
          p.userData.hitId === "cytosol" ? "cytoplasm" : p.userData.hitId
        ]
      : null;
    p.userData.labelAnchor = contextAnchor
      ? contextAnchor.clone()
      : p.worldToLocal(center.clone());
    const anchor = special?.userData.partAnchors?.[p.userData.hitId];
    if (anchor)
      p.userData.labelAnchor = p.worldToLocal(
        new THREE.Vector3(...anchor)
          .sub(bounds.getCenter(new THREE.Vector3()))
          .multiplyScalar(factor),
      );
    p.userData.home = p.position.clone();
    p.userData.restScale = p.scale.clone();
    p.userData.offset = direction;
  }
  const landmarks = (special?.userData.landmarks || []).map((a) => ({
    ...a,
    position: new THREE.Vector3(...a.position)
      .sub(center)
      .multiplyScalar(factor),
  }));
  root.userData.id = id;
  return { root, parts, landmarks, special: !!special };
}
