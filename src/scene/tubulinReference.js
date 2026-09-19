import * as THREE from "three";
import data from "./data/tubulin-1jff.json";
import { V, mesh } from "./structuralGeometry";
export function tubulinReference() {
  const g = new THREE.Group(),
    bounds = new THREE.Box3();
  Object.values(data.chains)
    .flat()
    .forEach((row) => bounds.expandByPoint(V(...row.slice(2))));
  const center = bounds.getCenter(V()),
    size = bounds.getSize(V()),
    scale = 3 / Math.max(size.x, size.y, size.z),
    centroids = {};
  for (const [chain, rows] of Object.entries(data.chains)) {
    let points = [],
      previous = null;
    const centroid = V();
    const flush = () => {
      if (points.length > 1)
        mesh(
          g,
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            4 * (points.length - 1),
            0.026,
            12,
            false,
          ),
          chain === "A" ? "#bdccc0" : "#759e9c",
          "tubulinDimer",
        );
    };
    for (const row of rows) {
      const raw = V(...row.slice(2)),
        p = raw.clone().sub(center).multiplyScalar(scale);
      centroid.add(p);
      if (
        previous &&
        (row[0] !== previous.seq + 1 || raw.distanceTo(previous.raw) > 6)
      ) {
        flush();
        points = [];
      }
      points.push(p);
      previous = { seq: row[0], raw };
    }
    flush();
    centroids[chain] = centroid.divideScalar(rows.length);
  }
  g.quaternion.setFromUnitVectors(
    centroids.B.clone().sub(centroids.A).normalize(),
    V(0, 1, 0),
  );
  g.rotateZ(-0.18);
  g.userData.landmarks = [
    { zh: "α-微管蛋白", en: "α-tubulin", position: centroids.A.toArray() },
    { zh: "β-微管蛋白", en: "β-tubulin", position: centroids.B.toArray() },
  ];
  return g;
}
