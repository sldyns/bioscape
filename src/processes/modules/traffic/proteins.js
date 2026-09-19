import { THREE } from "../../kit.js";
import { cathepsinD, triosephosphateIsomerase } from "./proteinCoordinates.js";

function normalizedChains(reference, size) {
  const all = Object.values(reference.chains).flat(),
    box = new THREE.Box3();
  for (const r of all) box.expandByPoint(new THREE.Vector3(...r.slice(2)));
  const center = box.getCenter(new THREE.Vector3()),
    extent = box.getSize(new THREE.Vector3()),
    scale = size / Math.max(...extent);
  return Object.entries(reference.chains).map(([chain, rows]) => ({
    chain,
    rows,
    points: rows.map((r) =>
      new THREE.Vector3(...r.slice(2)).sub(center).multiplyScalar(scale),
    ),
  }));
}
function trace(k, parent, points, rows, material, radius) {
  let segment = [];
  const flush = () => {
    if (segment.length > 1)
      k.tube(
        segment,
        radius,
        material,
        parent,
        Math.max(12, segment.length * 3),
      );
    segment = [];
  };
  for (let i = 0; i < points.length; i++) {
    if (i && rows[i][0] !== rows[i - 1][0] + 1) flush();
    segment.push(points[i].toArray());
  }
  flush();
}
export function damagedEnzymeAggregate(k) {
  const group = new THREE.Group();
  group.name = "damaged cytosolic enzyme aggregate — TPI backbone reference";
  k.group.add(group);
  const source = normalizedChains(triosephosphateIsomerase, 0.79)[0];
  const colors = ["#b68a70", "#c59c7a", "#aa806b"];
  for (let copy = 0; copy < 3; copy++) {
    const protein = new THREE.Group();
    group.add(protein);
    protein.position.set(
      (copy - 1) * 0.32,
      copy === 1 ? 0.24 : -0.12,
      (copy - 1) * 0.11,
    );
    protein.rotation.set(0.3 * copy, 0.65 * copy, 0.45 - copy * 0.38);
    const points = source.points.map((v, i) => {
      const damage =
        Math.max(0, Math.sin((i / source.points.length) * Math.PI * 3)) * 0.1;
      return v
        .clone()
        .add(
          new THREE.Vector3(
            damage * Math.sin(i * 0.075),
            damage * Math.cos(i * 0.085),
            damage * 0.5,
          ),
        );
    });
    trace(k, protein, points, source.rows, k.material(colors[copy]), 0.019);
    // Exposed ends and loops make disruption distinguishable from a smooth globule.
    k.tube(
      [
        points[0].toArray(),
        [-0.43, 0.28, 0.13],
        [-0.52, 0.12, 0.19],
        [-0.42, -0.03, 0.22],
      ],
      0.02,
      k.material("#c7a286"),
      protein,
      32,
    );
  }
  group.userData = {
    reference: "1HTI chain A",
    nativeReference: true,
    aggregateConformation:
      "illustrative, not an experimentally determined aggregate",
  };
  return group;
}
export function lysosomalHydrolase(k) {
  const group = new THREE.Group();
  group.name = "cathepsin D — native light/heavy-chain backbone (1LYA)";
  const chains = normalizedChains(cathepsinD, 0.4),
    materials = [k.material("#817294"), k.material("#a296b2")];
  for (let i = 0; i < chains.length; i++)
    trace(k, group, chains[i].points, chains[i].rows, materials[i % 2], 0.011);
  group.userData.reference = "PDB 1LYA chains A/B";
  return group;
}
export function peptideFragment(k, index) {
  const group = new THREE.Group();
  k.group.add(group);
  group.name = "short hydrolysis product peptide";
  const mat = k.material(index % 2 ? "#c29b7b" : "#d3b08c");
  for (let j = 0; j < 4; j++) {
    const a = [(j - 1.5) * 0.035, 0.025 * (j % 2), 0],
      b = [(j - 0.5) * 0.035, 0.025 * ((j + 1) % 2), 0.008];
    k.segment(a, b, 0.014, mat, group);
  }
  return group;
}
