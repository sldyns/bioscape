import { computeIndexedFloat32VertexNormals } from "../division/indexedFloat32Normals.js";
import { THREE, clamp } from "../../kit.js";

// A cutaway of one connected envelope becomes two closed daughters. Each half
// stays in its own x half-space; no complete cell grows through its sibling.
export function lysogenFissionEnvelope(k, parent) {
  const group = new THREE.Group();
  group.name = "lambda-dividing-envelope";
  parent.add(group);
  const axial = 128,
    angular = 48,
    edgeSteps = 128,
    surfaces = [],
    edges = [],
    leaflets = [],
    walls = [],
    layers = [
      [1, "#b9c9c2", "outer-membrane"],
      [0.986, "#bdc9ba", "outer-inner-leaflet"],
      [0.966, "#c7ba99", "peptidoglycan"],
      [0.925, "#8bab9e", "inner-outer-leaflet"],
      [0.911, "#adc3b1", "inner-membrane"],
    ];
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    mid = new THREE.Vector3(),
    delta = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0),
    pose = new THREE.Object3D();
  const cos = Float64Array.from({ length: angular + 1 }, (_, j) =>
      Math.cos(Math.PI + (j * Math.PI) / angular),
    ),
    sin = Float64Array.from({ length: angular + 1 }, (_, j) =>
      Math.sin(Math.PI + (j * Math.PI) / angular),
    );
  function instanced(side, count, geometry, material, name) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.name = `lambda-fission-${side}-${name}`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(mesh);
    return mesh;
  }
  for (const side of [-1, 1]) {
    for (const [scale, color, name] of layers) {
      const geo = new THREE.BufferGeometry(),
        position = new THREE.BufferAttribute(
          new Float32Array((axial + 1) * (angular + 1) * 3),
          3,
        ),
        indices = [];
      position.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("position", position);
      for (let i = 0; i < axial; i++)
        for (let j = 0; j < angular; j++) {
          const n = i * (angular + 1) + j,
            triangles = [
              n,
              n + 1,
              n + angular + 1,
              n + 1,
              n + angular + 2,
              n + angular + 1,
            ];
          if (side < 0) triangles.reverse();
          indices.push(...triangles);
        }
      geo.setIndex(indices);
      const mesh = k.mesh(
        geo,
        k.material(color, {
          side: THREE.DoubleSide,
          roughness: scale === 0.986 || scale === 0.911 ? 0.55 : 0.72,
        }),
        [0, 0, 0],
        group,
      );
      mesh.name = `lambda-fission-${side}-${name}-surface`;
      mesh.userData.fissionSide = side;
      surfaces.push({ side, scale, geo });
      edges.push({
        side,
        scale,
        radius: scale === 0.966 ? 0.022 : 0.018,
        mesh: instanced(side, edgeSteps, k.cylinder, k.material(color), name),
      });
      if (scale !== 0.966) {
        leaflets.push({
          side,
          scale,
          midpoint: scale > 0.95 ? 0.993 : 0.918,
          heads: instanced(
            side,
            edgeSteps,
            k.sphere,
            k.material(scale > 0.95 ? "#a6beb0" : "#8aaa9b"),
            `${name}-headgroups`,
          ),
          tails: instanced(
            side,
            edgeSteps * 2,
            k.cylinder,
            k.material("#c8b896"),
            `${name}-lipid-tails`,
          ),
        });
      }
    }
    for (const scale of [0.962, 0.97])
      edges.push({
        side,
        scale,
        radius: 0.008,
        mesh: instanced(
          side,
          edgeSteps,
          k.cylinder,
          k.material("#b9ad8c"),
          `wall-edge-${scale}`,
        ),
      });
    walls.push({
      side,
      mesh: instanced(
        side,
        96,
        k.cylinder,
        k.material("#c3b48c"),
        "wall-crosslinks",
      ),
    });
  }
  function profile(u, constriction) {
    const neck = 1 - constriction;
    if (u === 0) return neck;
    return Math.sqrt(
      Math.max(
        0,
        neck * neck * (1 - u * u) +
          ((1 - neck * neck) * 4 * u * u * (1 - u)) / (u + 0.18 * neck),
      ),
    );
  }
  function x(u, side, scale, constriction, separation) {
    return (
      side *
      (scale * (3.2 + 0.064 * constriction) * u +
        separation * (1.7 - 1.632 * scale))
    );
  }
  function outline(t, side, scale, constriction, separation, target) {
    const u = Math.sin(Math.PI * t),
      sign = t <= 0.5 ? 1 : -1;
    return target.set(
      x(u, side, scale, constriction, separation),
      sign * 1.48 * scale * profile(u, constriction),
      0.025,
    );
  }
  function segment(mesh, index, from, to, radius) {
    delta.subVectors(to, from);
    pose.position.copy(from).add(to).multiplyScalar(0.5);
    pose.scale.set(radius, Math.max(1e-8, delta.length()), radius);
    pose.quaternion.setFromUnitVectors(up, delta.normalize());
    pose.updateMatrix();
    mesh.setMatrixAt(index, pose.matrix);
  }
  function dirty(mesh) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }
  let previousConstriction = -1,
    previousSeparation = -1;
  function update(constriction, separation) {
    constriction = clamp(constriction);
    // Separation begins only after the common cytoplasmic waist is closed.
    separation = constriction === 1 ? clamp(separation) : 0;
    if (
      constriction === previousConstriction &&
      separation === previousSeparation
    )
      return;
    for (const { side, scale, geo } of surfaces) {
      const position = geo.attributes.position;
      for (let i = 0; i <= axial; i++) {
        const u = i / axial,
          px = x(u, side, scale, constriction, separation),
          r = scale * profile(u, constriction);
        for (let j = 0; j <= angular; j++)
          position.setXYZ(
            i * (angular + 1) + j,
            px,
            1.48 * r * cos[j],
            1.12 * r * sin[j],
          );
      }
      position.needsUpdate = true;
      computeIndexedFloat32VertexNormals(geo);
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    }
    for (const { side, scale, radius, mesh } of edges) {
      for (let i = 0; i < edgeSteps; i++) {
        outline(i / edgeSteps, side, scale, constriction, separation, a);
        outline((i + 1) / edgeSteps, side, scale, constriction, separation, b);
        a.z = b.z = 0.015;
        segment(mesh, i, a, b, radius);
      }
      dirty(mesh);
    }
    for (const { side, scale, midpoint, heads, tails } of leaflets) {
      for (let i = 0; i < edgeSteps; i++) {
        const t = (i + 0.5) / edgeSteps;
        outline(t, side, scale, constriction, separation, a);
        outline(t, side, midpoint, constriction, separation, mid);
        pose.position.copy(a);
        pose.scale.set(0.036, 0.028, 0.025);
        pose.quaternion.identity();
        pose.updateMatrix();
        heads.setMatrixAt(i, pose.matrix);
        for (let j = 0; j < 2; j++) {
          const dz = j ? 0.009 : -0.009;
          a.z = mid.z = 0.025 + dz;
          segment(tails, i * 2 + j, a, mid, 0.0045);
        }
      }
      dirty(heads);
      dirty(tails);
    }
    for (const { side, mesh } of walls) {
      for (let i = 0; i < 96; i++) {
        const t = (i + 0.5) / 96;
        outline(t, side, 0.962, constriction, separation, a);
        outline(t, side, 0.97, constriction, separation, b);
        a.z = b.z = 0.028;
        segment(mesh, i, a, b, 0.007);
      }
      dirty(mesh);
    }
    previousConstriction = constriction;
    previousSeparation = separation;
  }
  update(0, 0);
  group.visible = false;
  return { group, update };
}
