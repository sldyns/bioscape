import { THREE } from "../../kit.js";
import coordinates from "./2p1q-pocket.json" with { type: "json" };

// A selected experimental binding site, not a fabricated protein surface.
// All three partners retain ONE deposited-coordinate transform. No bonds are
// inserted across absent residues; receptor and degron atoms remain separate.
export function tir1Pocket(
  k,
  parent,
  { part = "tir1", material, name = part } = {},
) {
  const atoms = coordinates[part],
    pose = new THREE.Object3D(),
    sphere = new THREE.SphereGeometry(1, 16, 12),
    radii = { C: 1.7, N: 1.55, O: 1.52, S: 1.8 };
  const mesh = new THREE.InstancedMesh(sphere, material, atoms.length);
  mesh.name = name;
  parent.add(mesh);
  const local = (xyz) =>
    coordinates.basis.map(
      (axis) =>
        axis.reduce((n, v, i) => n + v * (xyz[i] - coordinates.center[i]), 0) *
        coordinates.scale,
    );
  for (let i = 0; i < atoms.length; i++) {
    pose.position.set(...local(atoms[i].xyz));
    pose.quaternion.identity();
    pose.scale.setScalar((radii[atoms[i].element] ?? 1.7) * coordinates.scale);
    pose.updateMatrix();
    mesh.setMatrixAt(i, pose.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  mesh.userData = {
    pdbId: "2P1Q",
    part,
    atomSerials: atoms.map((a) => a.serial),
    chains: [...new Set(atoms.map((a) => a.chain))],
    units: "deposited Angstrom coordinates under common rigid transform",
    coordinateScale: coordinates.scale,
  };
  return mesh;
}
