import { THREE } from "../../kit.js";
import largeData from "../../../scene/data/ribosome-4ug0-largeSubunit.json" with { type: "json" };
import smallData from "../../../scene/data/ribosome-4ug0-smallSubunit.json" with { type: "json" };

// Both files retain the deposited 4UG0 coordinate system. One transform only.
const chains = [...largeData.chains, ...smallData.chains];
const bounds = new THREE.Box3();
for (const c of chains)
  for (const r of c.residues)
    bounds.expandByPoint(new THREE.Vector3(r[1], r[2], r[3]));
const center = bounds.getCenter(new THREE.Vector3());
const extent = Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
export function ribosomeAssembly(k, parent, width = 3.3) {
  const assembly = new THREE.Group();
  assembly.name = "experimental-4ug0";
  parent.add(assembly);
  assembly.scale.setScalar(width / extent);
  const registered = new THREE.Group();
  registered.position.copy(center).negate();
  assembly.add(registered);
  const sphere = new THREE.SphereGeometry(1, 7, 5);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 7);
  const pose = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0);
  for (const subunit of ["largeSubunit", "smallSubunit"]) {
    const part = new THREE.Group();
    part.name = subunit;
    registered.add(part);
    for (const kind of ["rna", "protein"]) {
      const residues = [],
        edges = [],
        chainSpans = [];
      for (const c of chains.filter(
        (c) => c.subunit === subunit && c.kind === kind,
      )) {
        const span = {
          chain: c.chain,
          entity: c.entity,
          name: c.name,
          residueStart: residues.length,
          edgeStart: edges.length,
        };
        let previous;
        for (const r of c.residues) {
          const p = new THREE.Vector3(r[1], r[2], r[3]);
          residues.push(p);
          // Never invent a backbone across absent residues or a large discontinuity.
          if (
            previous &&
            r[0] === previous.seq + 1 &&
            p.distanceTo(previous.p) <= (kind === "rna" ? 12 : 6)
          )
            edges.push([previous.p, p]);
          previous = { seq: r[0], p };
        }
        chainSpans.push({
          ...span,
          residueCount: residues.length - span.residueStart,
          edgeCount: edges.length - span.edgeStart,
        });
      }
      const material = k.material(kind === "rna" ? "#708f9a" : "#c3a881");
      const nodes = new THREE.InstancedMesh(sphere, material, residues.length);
      const bonds = new THREE.InstancedMesh(cylinder, material, edges.length);
      nodes.name = `${subunit}-${kind}-residues`;
      bonds.name = `${subunit}-${kind}-backbone`;
      nodes.userData.chainSpans = chainSpans;
      bonds.userData.chainSpans = chainSpans;
      nodes.userData.coordinateAtom = kind === "rna" ? "C4′" : "Cα";
      part.add(nodes, bonds);
      const radius = kind === "rna" ? 1.45 : 1.0;
      residues.forEach((p, i) => {
        pose.position.copy(p);
        pose.quaternion.identity();
        pose.scale.setScalar(radius);
        pose.updateMatrix();
        nodes.setMatrixAt(i, pose.matrix);
      });
      edges.forEach(([a, b], i) => {
        const d = b.clone().sub(a);
        pose.position.copy(a).add(b).multiplyScalar(0.5);
        pose.quaternion.setFromUnitVectors(up, d.clone().normalize());
        pose.scale.set(radius * 0.79, d.length(), radius * 0.79);
        pose.updateMatrix();
        bonds.setMatrixAt(i, pose.matrix);
      });
      for (const mesh of [nodes, bonds]) {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();
      }
    }
  }
  return assembly;
}
