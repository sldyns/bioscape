import { THREE } from "../../kit.js";

// These positions are biological leader endpoints. Shared annotation layout
// owns text placement; a molecular anchor must never include a text offset.
export function labelAnchors(labels) {
  const point = new THREE.Vector3(),
    matrix = new THREE.Matrix4(),
    fronts = new WeakMap();
  function front(geometry) {
    if (!fronts.has(geometry)) {
      const p = geometry.attributes.position;
      let best = 0;
      for (let i = 1; i < p.count; i++) if (p.getZ(i) > p.getZ(best)) best = i;
      fronts.set(geometry, best);
    }
    return fronts.get(geometry);
  }
  function publish(index, object, kind) {
    const label = labels[index];
    label.annotationKind = kind;
    label.anchorTarget = object.name || object.type;
    for (let o = object; o; o = o.parent) if (!o.visible) label.active = false;
    point.toArray(label.position);
  }
  return {
    nearestX(mesh, x) {
      let closest = 0,
        gap = Infinity;
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, matrix);
        const distance = Math.abs(matrix.elements[12] - x);
        if (distance < gap) {
          closest = i;
          gap = distance;
        }
      }
      return closest;
    },
    surface(index, mesh, kind = "structure") {
      point
        .fromBufferAttribute(
          mesh.geometry.attributes.position,
          front(mesh.geometry),
        )
        .applyMatrix4(mesh.matrixWorld);
      publish(index, mesh, kind);
    },
    instance(index, mesh, instance, kind = "structure") {
      mesh.getMatrixAt(instance, matrix);
      point
        .fromBufferAttribute(
          mesh.geometry.attributes.position,
          front(mesh.geometry),
        )
        .applyMatrix4(matrix)
        .applyMatrix4(mesh.matrixWorld);
      labels[index].anchorInstance = instance;
      publish(index, mesh, kind);
    },
    tube(index, mesh, end = false, kind = "structure") {
      const geometry = mesh.geometry,
        count = Math.min(geometry.drawRange.count, geometry.index.count);
      if (count === 0) labels[index].active = false;
      // Choose a vertex referenced by an actually drawn triangle, including
      // moving transcript prefixes; end labels follow the current reveal front.
      let vertex = geometry.index.array[Math.floor(Math.max(0, count - 1) / 2)];
      if (end === "start") vertex = geometry.index.array[0];
      else if (end) {
        vertex = 0;
        for (let i = Math.max(0, count - 48); i < count; i++)
          vertex = Math.max(vertex, geometry.index.array[i]);
      }
      point
        .fromBufferAttribute(geometry.attributes.position, vertex)
        .applyMatrix4(mesh.matrixWorld);
      publish(index, mesh, kind);
    },
    point(index, object, x, y, z, kind = "region") {
      point.set(x, y, z).applyMatrix4(object.matrixWorld);
      publish(index, object, kind);
    },
  };
}
