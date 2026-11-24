import { THREE, ease } from "../../kit.js";
import { axialRadius } from "./topology.js";

const neckX = 0.15;

export function buddingNeck(k, mother, daughter, teal) {
  const ringMaterial = k.material("#57988e", {
    transparent: true,
    depthWrite: false,
  });
  const ringGeometry = new THREE.TorusGeometry(1, 0.037, 10, 64);
  const rings = [-1, 1].map((side) => {
    const ring = k.mesh(ringGeometry, ringMaterial);
    ring.rotation.y = Math.PI / 2;
    ring.name =
      side < 0
        ? "budding-maternal-septin-ring"
        : "budding-daughter-septin-ring";
    return ring;
  });

  // Sample the cytoplasmic side of both actual neck profiles. Paired short
  // segments follow the curvature without bridging the wider cortical ends.
  const bands = 12,
    spans = 4;
  const filaments = new THREE.InstancedMesh(
    k.cylinder,
    teal,
    bands * 2 * spans,
  );
  filaments.name = "budding-axial-septin-double-filaments";
  k.group.add(filaments);
  const angles = Array.from({ length: bands * 2 }, (_, i) => {
    const a =
      (Math.floor(i / 2) / bands) * Math.PI * 2 + (i % 2 ? 0.029 : -0.029);
    return [Math.cos(a), Math.sin(a)];
  });
  const xs = new Float64Array(spans + 1),
    radii = new Float64Array(spans + 1);
  const node = new THREE.Object3D(),
    direction = new THREE.Vector3(),
    axis = new THREE.Vector3(0, 1, 0);
  let lastWidth, lastStrength, lastGrowth;

  // Raised chitin-rich annulus supported by the exposed maternal septal face.
  const scarSection = [
    [0.294, 0],
    [0.308, 0.009],
    [0.327, 0.017],
    [0.344, 0.012],
    [0.36, 0.024],
    [0.38, 0.031],
    [0.401, 0.021],
    [0.423, 0],
  ].map(([r, h]) => new THREE.Vector2(r, h));
  const scarMaterial = k.material("#c5a677", {
    side: THREE.DoubleSide,
    transparent: true,
  });
  const scar = k.mesh(new THREE.LatheGeometry(scarSection, 72), scarMaterial, [
    neckX,
    0,
    0,
  ]);
  scar.name = "budding-current-maternal-bud-scar";
  scar.rotation.z = -Math.PI / 2;

  function update(p, growth, separation) {
    const formation = ease(p, 0.065, 0.24),
      split = ease(p, 0.7, 0.76);
    const width = formation * 0.115,
      strength = formation * (1 - split);
    const earlyRing = ease(p, 0.025, 0.07) * (1 - ease(p, 0.08, 0.2));
    const doubleRing = split * (1 - ease(p, 0.87, 0.95));
    ringMaterial.opacity = earlyRing + doubleRing;
    for (let i = 0; i < rings.length; i++) {
      const side = i ? 1 : -1,
        cell = i ? daughter : mother;
      const ring = rings[i];
      ring.visible = i ? doubleRing > 0 : ringMaterial.opacity > 0;
      ring.position.x =
        neckX + side * 0.12 * split + (i ? 0.78 * separation : 0);
      // At the common seam the two closed septal caps have repeated x values.
      // A small inward offset selects the neighboring lateral wall on each side.
      const x = ring.position.x + side * 1e-5;
      ring.scale.setScalar(0.87 * axialRadius(cell, x));
    }
    filaments.visible = strength > 0;
    // Only the growing wall, the axial span and the splitting filaments change.
    const effectiveWidth = strength > 0 ? width : 0;
    const wallVersion = strength > 0 ? growth : 0;
    if (
      lastWidth !== effectiveWidth ||
      lastStrength !== strength ||
      lastGrowth !== wallVersion
    ) {
      for (let j = 0; j <= spans; j++) {
        const offset = ((j / spans) * 2 - 1) * effectiveWidth;
        xs[j] = neckX + offset;
        radii[j] =
          strength === 0
            ? 0
            : 0.87 *
              axialRadius(
                offset <= 0 ? mother : daughter,
                xs[j] + (offset <= 0 ? -1 : 1) * 1e-5,
              );
      }
      let instance = 0;
      for (const [cos, sin] of angles)
        for (let j = 0; j < spans; j++) {
          const r = (radii[j] + radii[j + 1]) / 2;
          const dr = radii[j + 1] - radii[j];
          node.position.set((xs[j] + xs[j + 1]) / 2, r * cos, r * sin);
          direction.set(xs[j + 1] - xs[j], dr * cos, dr * sin);
          const length = direction.length();
          if (length)
            node.quaternion.setFromUnitVectors(
              axis,
              direction.divideScalar(length),
            );
          else node.quaternion.identity();
          node.scale.set(0.009 * strength, length, 0.009 * strength);
          node.updateMatrix();
          filaments.setMatrixAt(instance++, node.matrix);
        }
      filaments.instanceMatrix.needsUpdate = true;
      filaments.computeBoundingBox();
      filaments.computeBoundingSphere();
      lastWidth = effectiveWidth;
      lastStrength = strength;
      lastGrowth = wallVersion;
    }
    scar.visible = separation > 0;
    scarMaterial.opacity = ease(p, 0.88, 0.94);
    scar.scale.y = separation;
  }
  return { update };
}
