import * as THREE from "three";
import catalaseData from "./data/enzyme-1dgf.json";
import oxidaseData from "./data/enzyme-7q86.json";
const V = (...p) => new THREE.Vector3(...p);
function mesh(g, geometry, color, id) {
  const m = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.52, clearcoat: 0.12 }),
  );
  m.userData.hitId = id;
  g.add(m);
  return m;
}
function reference(data, id) {
  const g = new THREE.Group(),
    box = new THREE.Box3();
  Object.values(data.chains)
    .flat()
    .forEach((p) => box.expandByPoint(V(...p.slice(2))));
  const center = box.getCenter(V()),
    size = box.getSize(V()),
    scale = 3 / Math.max(size.x, size.y, size.z),
    convert = (p) =>
      V(...p)
        .sub(center)
        .multiplyScalar(scale);
  const palette =
    id === "catalase"
      ? ["#7f9f8b", "#b3c4a6", "#8eacaa", "#c5ba91"]
      : ["#a89e73", "#c8bc91"];
  Object.entries(data.chains).forEach(([chain, rows], i) => {
    let path = [],
      previous = null;
    const flush = () => {
      if (path.length < 2) return;
      mesh(
        g,
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(path),
          4 * (path.length - 1),
          0.025,
          12,
          false,
        ),
        palette[i],
        id,
      );
    };
    for (const row of rows) {
      const raw = V(...row.slice(2));
      if (
        previous &&
        (row[0] !== previous.seq + 1 || raw.distanceTo(previous.raw) > 6)
      ) {
        flush();
        path = [];
      }
      path.push(convert(row.slice(2)));
      previous = { seq: row[0], raw };
    }
    flush();
  });
  const anchors = [];
  for (const atoms of Object.values(data.cofactors)) {
    const positions = new Map(
      atoms.map((row) => [row[0], convert(row.slice(2))]),
    );
    for (const row of atoms) {
      const p = positions.get(row[0]),
        m = mesh(
          g,
          new THREE.SphereGeometry(row[1] === "FE" ? 0.052 : 0.027, 16, 12),
          row[1] === "FE" ? "#b88749" : "#d2ad68",
          id,
        );
      m.position.copy(p);
    }
    for (const [a, b] of data.bonds) {
      if (!positions.has(a) || !positions.has(b)) continue;
      const p = positions.get(a),
        q = positions.get(b),
        d = q.clone().sub(p),
        m = mesh(
          g,
          new THREE.CylinderGeometry(0.014, 0.014, d.length(), 10),
          "#d2ad68",
          id,
        );
      m.position.copy(p).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    }
    anchors.push(
      positions.has("FE")
        ? positions.get("FE")
        : positions.get("N5") || positions.values().next().value,
    );
  }
  // One real cofactor location is annotated; all deposited copies remain visible.
  const anchor = anchors.sort((a, b) => b.z - a.z)[0];
  g.userData.landmarks = [
    {
      zh: id === "catalase" ? "血红素与中心铁" : "FAD 辅因子",
      en: id === "catalase" ? "Heme and central iron" : "FAD cofactor",
      position: anchor.toArray(),
    },
  ];
  return g;
}
export function peroxisomeReference(id) {
  if (id === "catalase" || id === "acylCoAOxidase") {
    const g = reference(id === "catalase" ? catalaseData : oxidaseData, id);
    g.rotation.set(0.18, -0.25, -0.08);
    return g;
  }
  if (id === "oxidativeEnzymes") {
    const g = new THREE.Group(),
      cat = reference(catalaseData, "catalase"),
      oxi = reference(oxidaseData, "acylCoAOxidase");
    cat.position.set(-1.85, 0, 0);
    oxi.position.set(1.85, 0, 0);
    cat.rotation.set(0.18, -0.25, -0.08);
    oxi.rotation.set(0.18, -0.25, -0.08);
    g.add(cat, oxi);
    g.userData.partAnchors = {
      catalase: [-1.85, 0.6, 0.4],
      acylCoAOxidase: [1.85, 0.6, 0.4],
    };
    return g;
  }
  return null;
}
