import * as THREE from "three";
// Residue-level experimental backbone: missing residues are never bridged.
export function ribosomeReference(
  id,
  data,
  subunit = id,
  { assembly = false } = {},
) {
  const g = new THREE.Group(),
    chains = data.chains.filter((c) => c.subunit === subunit),
    bounds = new THREE.Box3();
  for (const chain of assembly ? data.chains : chains)
    for (const r of chain.residues)
      bounds.expandByPoint(new THREE.Vector3(r[1], r[2], r[3]));
  const center = bounds.getCenter(new THREE.Vector3()),
    size = bounds.getSize(new THREE.Vector3()),
    scale = 2.4 / Math.max(size.x, size.y, size.z),
    anchors = {};
  const colors =
    subunit === "largeSubunit"
      ? { rna: "#b59d75", protein: "#d6c9af" }
      : { rna: "#7d9e9c", protein: "#bfcdc2" };
  function segment(points, kind) {
    if (points.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal"),
      geometry = new THREE.TubeGeometry(
        curve,
        (points.length - 1) * 3,
        (kind === "rna" ? 1.45 : 1.25) * scale,
        8,
        false,
      );
    const material = new THREE.MeshPhysicalMaterial({
        color: colors[kind],
        roughness: 0.53,
        clearcoat: 0.1,
        side: THREE.DoubleSide,
      }),
      mesh = new THREE.Mesh(geometry, material);
    mesh.userData.hitId = id;
    g.add(mesh);
  }
  for (const chain of chains) {
    let points = [],
      previous = null;
    for (const r of chain.residues) {
      const raw = new THREE.Vector3(r[1], r[2], r[3]),
        p = raw.clone().sub(center).multiplyScalar(scale);
      if (
        previous &&
        (r[0] !== previous.seq + 1 ||
          raw.distanceTo(previous.raw) > (chain.kind === "rna" ? 12 : 6))
      ) {
        segment(points, chain.kind);
        points = [];
      }
      points.push(p);
      previous = { seq: r[0], raw };
      if (!anchors[chain.kind] || p.z > anchors[chain.kind].z)
        anchors[chain.kind] = p;
    }
    segment(points, chain.kind);
  }
  g.userData.landmarks = [
    { zh: "rRNA 骨架", en: "rRNA backbone", position: anchors.rna.toArray() },
    {
      zh: "核糖体蛋白骨架",
      en: "Ribosomal protein backbone",
      position: anchors.protein.toArray(),
    },
  ];
  g.rotation.set(0.22, -0.26, -0.08);
  return g;
}

export function bacterialRibosomeReference(large, small) {
  const g = new THREE.Group(),
    data = { chains: [...large.chains, ...small.chains] };
  for (const [id, key] of [
    ["bacterial50S", "largeSubunit"],
    ["bacterial30S", "smallSubunit"],
  ]) {
    const part = ribosomeReference(id, data, key, { assembly: true });
    g.add(part);
  }
  g.updateMatrixWorld(true);
  g.userData.partAnchors = {};
  for (let i = 0; i < g.children.length; i++)
    g.userData.partAnchors[i ? "bacterial30S" : "bacterial50S"] =
      new THREE.Box3()
        .setFromObject(g.children[i])
        .getCenter(new THREE.Vector3())
        .toArray();
  return g;
}
