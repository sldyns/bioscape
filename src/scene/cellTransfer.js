import {
  BufferGeometry,
  BufferAttribute,
  Group,
  Mesh,
  InstancedMesh,
  InstancedBufferAttribute,
  MaterialLoader,
  DataTexture,
  Vector3,
} from "three";

// Preserve the shared scene graph and typed buffers; no tessellation, texture, or
// numeric precision changes are made when moving construction off the UI thread.
export function packCell(model) {
  const buffers = new Set(),
    objects = [],
    objectIds = new Map(),
    geometries = [],
    geometryIds = new Map(),
    materials = [],
    materialIds = new Map(),
    textures = {};
  const attribute = (a) => {
    if (!a) return null;
    buffers.add(a.array.buffer);
    return {
      array: a.array,
      itemSize: a.itemSize,
      normalized: a.normalized,
      usage: a.usage,
    };
  };
  model.cell.traverse((o) => {
    objectIds.set(o, objects.length);
    objects.push(o);
  });
  function geometry(g) {
    if (geometryIds.has(g)) return geometryIds.get(g);
    const id = geometries.length;
    geometryIds.set(g, id);
    geometries.push({
      attributes: Object.fromEntries(
        Object.entries(g.attributes).map(([k, v]) => [k, attribute(v)]),
      ),
      index: attribute(g.index),
      groups: g.groups,
      drawRange: g.drawRange,
    });
    return id;
  }
  function material(m) {
    if (materialIds.has(m)) return materialIds.get(m);
    const id = materials.length;
    materialIds.set(m, id);
    for (const value of Object.values(m))
      if (value?.isTexture && !textures[value.uuid]) {
        if (!value.isDataTexture) throw new Error("Unsupported cell texture");
        buffers.add(value.image.data.buffer);
        const settings = Object.fromEntries(
          [
            "format",
            "type",
            "mapping",
            "wrapS",
            "wrapT",
            "magFilter",
            "minFilter",
            "anisotropy",
            "generateMipmaps",
            "flipY",
            "unpackAlignment",
            "colorSpace",
            "premultiplyAlpha",
          ].map((k) => [k, value[k]]),
        );
        textures[value.uuid] = { image: value.image, settings };
      }
    materials.push({
      json: m.toJSON({ textures: {}, images: {} }),
      colors: Object.fromEntries(
        Object.entries(m)
          .filter(([, v]) => v?.isColor)
          .map(([k, v]) => [k, v.toArray()]),
      ),
      ior: m.ior,
    });
    return id;
  }
  const nodes = objects.map((o) => ({
    parent: objectIds.get(o.parent) ?? null,
    position: o.position.toArray(),
    quaternion: o.quaternion.toArray(),
    scale: o.scale.toArray(),
    userData: o.userData,
    visible: o.visible,
    renderOrder: o.renderOrder,
    ...(o.isMesh
      ? {
          geometry: geometry(o.geometry),
          material: material(o.material),
          castShadow: o.castShadow,
          receiveShadow: o.receiveShadow,
          frustumCulled: o.frustumCulled,
          ...(o.isInstancedMesh
            ? {
                count: o.count,
                instanceMatrix: attribute(o.instanceMatrix),
                instanceColor: attribute(o.instanceColor),
              }
            : {}),
        }
      : {}),
  }));
  return {
    payload: {
      nodes,
      geometries,
      materials,
      textures,
      groups: Object.fromEntries(
        Object.entries(model.groups).map(([k, v]) => [k, objectIds.get(v)]),
      ),
      parts: Object.fromEntries(
        Object.entries(model.parts).map(([k, v]) => [
          k,
          v.map((o) => objectIds.get(o)),
        ]),
      ),
      full: model.full.map((o) => objectIds.get(o)),
      anchors: Object.fromEntries(
        Object.entries(model.anchors).map(([k, v]) => [k, v.toArray()]),
      ),
    },
    buffers: [...buffers],
  };
}
export function unpackCell(data) {
  const textures = Object.fromEntries(
    Object.entries(data.textures).map(([id, d]) => {
      const t = new DataTexture(d.image.data, d.image.width, d.image.height);
      Object.assign(t, d.settings);
      t.uuid = id;
      t.needsUpdate = true;
      return [id, t];
    }),
  );
  const loader = new MaterialLoader().setTextures(textures);
  const attr = (d, instance = false) => {
    if (!d) return null;
    const a = instance
      ? new InstancedBufferAttribute(d.array, d.itemSize, d.normalized)
      : new BufferAttribute(d.array, d.itemSize, d.normalized);
    a.setUsage(d.usage);
    return a;
  };
  const geometries = data.geometries.map((d) => {
    const g = new BufferGeometry();
    for (const [key, a] of Object.entries(d.attributes))
      g.setAttribute(key, attr(a));
    if (d.index) g.setIndex(attr(d.index));
    g.groups = d.groups;
    g.setDrawRange(d.drawRange.start, d.drawRange.count);
    return g;
  });
  const materials = data.materials.map((d) => {
    const m = loader.parse(d.json);
    for (const [k, v] of Object.entries(d.colors)) m[k].fromArray(v);
    if (d.ior !== undefined) m.ior = d.ior;
    return m;
  });
  const nodes = data.nodes.map((d) => {
    const o =
      d.geometry === undefined
        ? new Group()
        : d.count === undefined
          ? new Mesh(geometries[d.geometry], materials[d.material])
          : new InstancedMesh(
              geometries[d.geometry],
              materials[d.material],
              d.count,
            );
    if (d.count !== undefined) {
      o.instanceMatrix = attr(d.instanceMatrix, true);
      o.instanceColor = attr(d.instanceColor, true);
    }
    o.position.fromArray(d.position);
    o.quaternion.fromArray(d.quaternion);
    o.scale.fromArray(d.scale);
    o.userData = d.userData;
    o.visible = d.visible;
    o.renderOrder = d.renderOrder;
    if (o.isMesh) {
      o.castShadow = d.castShadow;
      o.receiveShadow = d.receiveShadow;
      o.frustumCulled = d.frustumCulled;
    }
    return o;
  });
  data.nodes.forEach((d, i) => {
    if (d.parent !== null) nodes[d.parent].add(nodes[i]);
  });
  return {
    cell: nodes[0],
    groups: Object.fromEntries(
      Object.entries(data.groups).map(([k, i]) => [k, nodes[i]]),
    ),
    parts: Object.fromEntries(
      Object.entries(data.parts).map(([k, ids]) => [
        k,
        ids.map((i) => nodes[i]),
      ]),
    ),
    full: data.full.map((i) => nodes[i]),
    anchors: Object.fromEntries(
      Object.entries(data.anchors).map(([k, v]) => [k, new Vector3(...v)]),
    ),
    resources: Object.values(textures),
  };
}
export function disposeCell(model) {
  if (!model) return;
  const geometries = new Set(),
    materials = new Set();
  model.cell.traverse((o) => {
    if (o.isMesh) {
      if (o.isInstancedMesh) o.dispose();
      geometries.add(o.geometry);
      materials.add(o.material);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  model.resources.forEach((r) => r.dispose());
}
