import { centrosomeDetail } from "./centrosomeDetails";
import { cytoskeletonDetail } from "./cytoskeletonDetails";
import { lysosomeDetail } from "./lysosomeDetails";
import { ribosomeDetail } from "./ribosomeDetails";
import { golgiDetail } from "./golgiDetails";
import { erDetail } from "./erDetails";
import { mitochondriaDetail } from "./mitochondriaDetails";
import { poreComplex, nucleolarBody } from "./nuclearBodies";
import * as THREE from "three";
import { chromatinDetail } from "./chromatinDetails";
import { nuclearDetail } from "./nuclearDetails";
import { membraneDetail } from "./membraneDetails";
import { peroxisomeDetail } from "./peroxisomeDetails";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function detailModel(id, reference = null) {
  const g =
    reference ||
    centrosomeDetail(id) ||
    cytoskeletonDetail(id) ||
    lysosomeDetail(id) ||
    ribosomeDetail(id) ||
    golgiDetail(id) ||
    erDetail(id) ||
    mitochondriaDetail(id) ||
    (id === "nuclearPores"
      ? poreComplex()
      : id === "nucleolus"
        ? nucleolarBody()
        : null) ||
    chromatinDetail(id) ||
    nuclearDetail(id) ||
    membraneDetail(id) ||
    peroxisomeDetail(id) ||
    new THREE.Group();
  g.userData.ownedGeometry = true;
  if (!g.children.length) return null;
  g.updateMatrixWorld(true);
  const bins = new Map();
  // Repeated organelles share immutable source geometry and materials. Compute
  // their rendering signatures once, rather than serializing every copy.
  const materialSignatures = new WeakMap();
  const attributeSignatures = new WeakMap();
  g.traverse((o) => {
    if (!o.isMesh) return;
    let hit = id;
    for (let a = o; a; a = a.parent)
      if (a.userData.hitId) {
        hit = a.userData.hitId;
        break;
      }
    // Material identity must include all rendering properties; matching colors
    // alone can incorrectly merge translucent membranes with opaque structures.
    let appearance = materialSignatures.get(o.material);
    if (!appearance) {
      const { uuid, metadata, ...properties } = o.material.toJSON();
      appearance = JSON.stringify([
        properties,
        Object.entries(o.material)
          .filter(([, v]) => v?.isColor)
          .map(([k, v]) => [k, v.toArray()]),
      ]);
      materialSignatures.set(o.material, appearance);
    }
    let attributes = attributeSignatures.get(o.geometry);
    if (!attributes) {
      attributes = JSON.stringify([
        Object.entries(o.geometry.attributes)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, a]) => [
            name,
            a.itemSize,
            a.normalized,
            a.array.constructor.name,
          ]),
        Boolean(o.geometry.index),
      ]);
      attributeSignatures.set(o.geometry, attributes);
    }
    const key =
      hit +
      appearance +
      attributes +
      Boolean(o.userData.cap) +
      Boolean(o.userData.cutOnly) +
      Boolean(o.userData.assembledOnly) +
      Boolean(o.userData.nonInteractive);
    if (!bins.has(key))
      bins.set(key, {
        hit,
        cap: !!o.userData.cap,
        cutOnly: !!o.userData.cutOnly,
        assembledOnly: !!o.userData.assembledOnly,
        nonInteractive: !!o.userData.nonInteractive,
        material: o.material.clone(),
        geometries: [],
      });
    bins
      .get(key)
      .geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
  });
  const result = new THREE.Group();
  result.userData.ownedGeometry = true;
  result.userData.landmarks = (g.userData.landmarks || []).map((a) => ({
    ...a,
    position: new THREE.Vector3(...a.position)
      .applyMatrix4(g.matrixWorld)
      .toArray(),
  }));
  result.userData.partAnchors = Object.fromEntries(
    Object.entries(g.userData.partAnchors || {}).map(([key, p]) => [
      key,
      new THREE.Vector3(...p).applyMatrix4(g.matrixWorld).toArray(),
    ]),
  );
  for (const {
    hit,
    cap,
    cutOnly,
    assembledOnly,
    nonInteractive,
    material,
    geometries,
  } of bins.values()) {
    const m = new THREE.Mesh(mergeGeometries(geometries), material);
    m.userData.hitId = hit;
    m.userData.cap = cap;
    m.userData.cutOnly = cutOnly;
    m.userData.assembledOnly = assembledOnly;
    m.userData.nonInteractive = nonInteractive;
    m.castShadow = true;
    m.receiveShadow = true;
    result.add(m);
    geometries.forEach((x) => x.dispose());
  }
  const disposedGeometries = new Set(),
    disposedMaterials = new Set();
  g.traverse((o) => {
    if (o.geometry && !disposedGeometries.has(o.geometry)) {
      o.geometry.dispose();
      disposedGeometries.add(o.geometry);
    }
    if (o.material && !disposedMaterials.has(o.material)) {
      o.material.dispose();
      disposedMaterials.add(o.material);
    }
  });
  return result;
}
