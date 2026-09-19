import { THREE, clamp, ease } from "../../kit.js";

// Longitudinal open-front membrane. Adjacent components share complete terminal
// rings, not merely overlapping filled primitives. The front half is a viewing cut.
function surface(k, parent, material, name, rows = 40, columns = 32) {
  const geometry = new THREE.BufferGeometry(),
    vertices = new Float32Array((rows + 1) * (columns + 1) * 3),
    indices = [];
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < columns; j++) {
      const a = i * (columns + 1) + j,
        b = a + columns + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  const mesh = k.mesh(geometry, material, [0, 0, 0], parent);
  mesh.name = name;
  function shape(profile) {
    for (let i = 0; i <= rows; i++) {
      const [x, r] = profile(i / rows);
      for (let j = 0; j <= columns; j++) {
        const a = -Math.PI + (j / columns) * Math.PI,
          q = (i * (columns + 1) + j) * 3;
        vertices[q] = x;
        vertices[q + 1] = r * Math.cos(a);
        vertices[q + 2] = r * Math.sin(a);
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  return { mesh, shape, rows, columns };
}

export function fusionVacuole(k, parent) {
  const outerMat = k.material("#c6a572", { side: THREE.DoubleSide }),
    innerMat = k.material("#e6d2aa", { side: THREE.DoubleSide });
  const acidMat = k.material("#cc9367", { side: THREE.DoubleSide }),
    lysoMat = k.material("#ac8896", { side: THREE.DoubleSide });
  const recipient = surface(k, parent, outerMat, "food-vacuole-membrane");
  const inner = surface(k, parent, innerMat, "food-vacuole-inner-leaflet");
  const donor = surface(k, parent, acidMat, "fusing-donor-membrane");
  const donorInner = surface(k, parent, innerMat, "fusing-donor-inner-leaflet");
  const neck = surface(k, parent, outerMat, "food-vacuole-fusion-neck", 12);
  const neckInner = surface(
    k,
    parent,
    innerMat,
    "food-vacuole-fusion-neck-inner",
    12,
  );
  const content = Array.from({ length: 4 }, (_, i) => {
    const m = k.ball([0, 0, 0], 0.055, k.material("#b88486"), parent);
    m.name = `fusion-cargo-${i}`;
    return m;
  });
  function update(p) {
    const isAcid = p >= 0.28 && p < 0.47,
      isLyso = p >= 0.47 && p < 0.62,
      active = isAcid || isLyso;
    const start = isAcid ? 0.34 : 0.51,
      end = isAcid ? 0.47 : 0.62;
    const t = clamp((p - start) / (end - start)),
      approach = ease(p, isAcid ? 0.28 : 0.47, start);
    const radius = 0.26 * (1 - ease(t, 0.72, 1));
    const opening = 0.48 * radius * Math.sin(Math.PI * t);
    const delta = Math.asin(opening),
      alpha = radius > 1e-8 ? Math.asin(opening / radius) : 0;
    const donorCenter = -1 - radius - (0.018 + 0.55 * (1 - approach));
    const recipientEnd = -Math.cos(delta),
      donorEnd = donorCenter + radius * Math.cos(alpha);
    recipient.shape((u) => {
      const a = (Math.PI - delta) * u;
      return [Math.cos(a), Math.sin(a)];
    });
    inner.shape((u) => {
      const a = (Math.PI - delta) * u;
      return [Math.cos(a), Math.sin(a) * 0.94];
    });
    donor.shape((u) => {
      const a = alpha + (Math.PI - alpha) * u;
      return [donorCenter + radius * Math.cos(a), radius * Math.sin(a)];
    });
    donorInner.shape((u) => {
      const a = alpha + (Math.PI - alpha) * u;
      return [donorCenter + radius * Math.cos(a), radius * Math.sin(a) * 0.94];
    });
    neck.shape((u) => [donorEnd + (recipientEnd - donorEnd) * u, opening]);
    neckInner.shape((u) => [
      donorEnd + (recipientEnd - donorEnd) * u,
      opening * 0.94,
    ]);
    for (const m of [donor.mesh, donorInner.mesh])
      m.visible = active && radius > 1e-6;
    donor.mesh.material = isAcid ? acidMat : lysoMat;
    neck.mesh.visible = neckInner.mesh.visible = active && opening > 1e-6;
    for (let i = 0; i < content.length; i++) {
      const transfer = ease(t, 0.2 + i * 0.055, 0.52 + i * 0.055);
      content[i].visible = active && t < 0.8;
      content[i].position.set(
        donorCenter * (1 - transfer) + (-0.45 + i * 0.16) * transfer,
        (i - 1.5) * 0.008,
        -0.015,
      );
      content[i].scale.setScalar(0.025);
    }
  }
  update(0);
  return {
    outer: recipient.mesh,
    inner: inner.mesh,
    update,
    materials: [outerMat, innerMat, acidMat, lysoMat],
  };
}

export function macronuclearBridge(k, parent, material) {
  const g = new THREE.Group();
  parent.add(g);
  g.position.set(0.25, 0, 0.3);
  g.rotation.z = Math.PI / 2;
  const outer = surface(k, g, material, "continuous-macronuclear-envelope", 64);
  const inner = surface(
    k,
    g,
    k.material("#ccb8d2", { side: THREE.DoubleSide }),
    "continuous-macronuclear-inner",
    64,
  );
  g.scale.z = 0.26 / 0.34;
  function update(distance, neckRadius) {
    function profile(t, factor) {
      const x = (2 * t - 1) * (distance + 0.54),
        a = Math.abs(x);
      const radius =
        a >= distance
          ? 0.34 * Math.sqrt(Math.max(0, 1 - ((a - distance) / 0.54) ** 2))
          : Math.sqrt(
              neckRadius ** 2 +
                (0.34 ** 2 - neckRadius ** 2) *
                  Math.sin(((Math.PI / 2) * a) / distance) ** 2,
            );
      return [x, radius * factor];
    }
    outer.shape((t) => profile(t, 1));
    inner.shape((t) => profile(t, 0.93));
  }
  update(0.44, 0.26);
  return { group: g, update };
}

// The back-half viewing cut is retained. Each radial port is an actual notch
// through both membrane layers; the inlet uses exactly the same boundary curve.
const portRows = 12,
  portColumns = 32,
  portAngle = 0.16;
function portPoint(angle, phase, opening, scale = 1) {
  const phi = angle + opening * Math.cos(phase),
    latitude = opening * Math.sin(phase);
  return [
    scale * Math.cos(phi) * Math.cos(latitude),
    scale * Math.sin(phi) * Math.cos(latitude),
    scale * Math.sin(latitude),
  ];
}
function gridGeometry(patches = 1) {
  const geometry = new THREE.BufferGeometry(),
    vertices = new Float32Array(
      patches * (portRows + 1) * (portColumns + 1) * 3,
    ),
    indices = [];
  for (let patch = 0; patch < patches; patch++)
    for (let row = 0; row < portRows; row++)
      for (let col = 0; col < portColumns; col++) {
        const a =
            patch * (portRows + 1) * (portColumns + 1) +
            row * (portColumns + 1) +
            col,
          b = a + portColumns + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  return geometry;
}
function finishGeometry(geometry) {
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}
export function collectingBladder(k, parent, material) {
  const mesh = k.mesh(gridGeometry(6), material, [0, 0, 0.22], parent);
  mesh.name = "central-contractile-bladder";
  const inner = k.mesh(
    gridGeometry(6),
    k.material("#b9d9d4", { side: THREE.DoubleSide }),
    [0, 0, 0],
    mesh,
  );
  inner.name = "central-contractile-bladder-inner";
  function update(connected) {
    const opening = connected ? portAngle : 0;
    for (const [layer, factor] of [
      [mesh, 1],
      [inner, 0.91],
    ]) {
      const attr = layer.geometry.attributes.position;
      for (let patch = 0; patch < 6; patch++)
        for (let row = 0; row <= portRows; row++)
          for (let col = 0; col <= portColumns; col++) {
            const phase = -Math.PI + (col / portColumns) * Math.PI,
              extent = Math.min(
                Math.PI / 6 / Math.max(1e-12, Math.abs(Math.cos(phase))),
                Math.PI / 2 / Math.max(1e-12, Math.abs(Math.sin(phase))),
              ),
              radius = opening + ((extent - opening) * row) / portRows,
              v = portPoint((patch * Math.PI) / 3, phase, radius, factor),
              index =
                patch * (portRows + 1) * (portColumns + 1) +
                row * (portColumns + 1) +
                col;
            attr.setXYZ(index, ...v);
          }
      finishGeometry(layer.geometry);
    }
  }
  update(true);
  return { mesh, update };
}
export function hollowInlet(k, parent, material, name) {
  const g = new THREE.Group();
  g.name = name;
  parent.add(g);
  const outer = k.mesh(gridGeometry(), material, [0, 0, 0], g),
    inner = k.mesh(
      gridGeometry(),
      k.material("#c0d9ca", { side: THREE.DoubleSide }),
      [0, 0, 0],
      g,
    );
  outer.name = `${name}-outer`;
  inner.name = `${name}-inner`;
  function update(radius, depth, angle) {
    for (const [layer, factor, width] of [
      [outer, 1, 0.075],
      [inner, 0.91, 0.057],
    ]) {
      const attr = layer.geometry.attributes.position;
      for (let row = 0; row <= portRows; row++)
        for (let col = 0; col <= portColumns; col++) {
          const t = row / portRows,
            phase = -Math.PI + (col / portColumns) * Math.PI,
            v = portPoint(angle, phase, portAngle, factor),
            across = width * Math.cos(phase),
            end = [
              0.94 * Math.cos(angle) - across * Math.sin(angle),
              0.94 * Math.sin(angle) + across * Math.cos(angle),
              width * Math.sin(phase),
            ];
          attr.setXYZ(
            row * (portColumns + 1) + col,
            radius * v[0] * (1 - t) + end[0] * t,
            radius * v[1] * (1 - t) + end[1] * t,
            (0.22 + depth * v[2]) * (1 - t) + end[2] * t,
          );
        }
      finishGeometry(layer.geometry);
    }
  }
  return { group: g, update };
}
