import assert from "node:assert/strict";
import * as THREE from "three";
import hyphae from "./fungalHyphaeProcess.js";
import { disposeScene } from "../../disposeScene.js";

// Independent closed-lumen witnesses: the entire separating shell lies inside
// the parental membrane and outside every other lumen in these two conditions.
for (const spec of [
  { delivery: "normal", progress: (1 + 0.845 - 13 / 20) / 1.5, cohort: 13 },
  {
    delivery: "reduced",
    progress: (0.85 - 12 / 20) / (1.5 * 0.24),
    cohort: 12,
  },
]) {
  const model = hyphae.create();
  try {
    model.update(spec.progress, { delivery: spec.delivery });
    model.group.updateMatrixWorld(true);
    let membrane;
    model.group.traverse((n) => {
      if (
        n.name ===
        "Apical plasma membrane continuous with exocytotic vesicle lumens"
      )
        membrane = n;
    });
    assert(membrane);
    assert(
      membrane.material.opacity < 1 || membrane.material.depthWrite,
      "opaque combined membrane must keep nearer surfaces visible",
    );
    const carriers = model.group.children.filter(
      (n) => n.name === "Cutaway vesicle with lumen and paired membrane rims",
    );
    const center = carriers[spec.cohort].position
      .clone()
      .sub(membrane.position);
    const distance = Math.hypot(center.x, center.y),
      radius = 0.073,
      clearance = 0.69 - distance - radius;
    assert(clearance > 0.007);
    const fraction = spec.delivery === "normal" ? 1 : 0.24;
    carriers.forEach((v, i) => {
      const phase = (spec.progress * 1.5 * fraction + i / 20) % 1;
      if (i !== spec.cohort && v.visible && phase >= 0.84 && phase < 0.98)
        assert(
          v.position.clone().sub(membrane.position).distanceTo(center) >
            2 * radius + clearance,
          "another lumen cannot bridge the independently positive shell",
        );
    });
    const direction = new THREE.Vector3(
      center.x / distance,
      center.y / distance,
      0,
    );
    const lumenPoint = membrane.localToWorld(center.clone());
    lumenPoint.z -= 0.005;
    model.group.traverse((n) => {
      if (
        n.isMesh &&
        n.parent?.name === "Apical membrane wall-synthase subunits"
      ) {
        // These complete sphere meshes are transformed ellipsoids. Being
        // outside their enclosing sphere in local space proves no containment.
        const local = lumenPoint
          .clone()
          .applyMatrix4(n.matrixWorld.clone().invert());
        assert(
          local.length() > n.geometry.parameters.radius + 1e-6,
          "a fixed synthase body cannot occupy the precontact lumen",
        );
      }
    });
    for (const z of [-0.005, -0.02]) {
      const inner = Math.sqrt(radius ** 2 - z ** 2),
        outer = Math.sqrt(0.69 ** 2 - z ** 2) - distance,
        middle = (inner + outer) / 2;
      const origin = new THREE.Vector3(center.x, center.y, z),
        point = origin.clone().addScaledVector(direction, middle);
      assert(
        Math.min(0.69 - point.length(), point.distanceTo(center) - radius) >
          1e-4,
      );
      const hits = new THREE.Raycaster(
        membrane.localToWorld(origin),
        direction,
        0,
        0.3,
      )
        .intersectObject(membrane, false)
        .map((h) => h.distance);
      assert(
        hits.some((d) => d < middle - 1e-6) &&
          hits.some((d) => d > middle + 1e-6),
        "actual membranes must bracket the real precontact gap",
      );
    }
  } finally {
    disposeScene(model.group, model.materials);
  }
}
