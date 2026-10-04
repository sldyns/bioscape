import { THREE, ease } from "../../kit.js";
import { shapeState } from "./shapeState.js";

// Invert the map from a parent hemisphere to one full daughter sphere. Eight
// patches tessellate the initial synkaryon and remain the same eight patches as
// three successive fissions turn them into eight separate nuclear envelopes.
function parentPoint(point, axis, side, fallback = null) {
  const out = point.slice(),
    daughterAxis = point[axis],
    theta = Math.acos(Math.max(-1, Math.min(1, daughterAxis))),
    parentTheta = theta / 2 + (side < 0 ? Math.PI / 2 : 0),
    parentAxis = Math.cos(parentTheta),
    daughterRadial = Math.hypot(...point.filter((_, i) => i !== axis)),
    parentRadial = Math.sin(parentTheta);
  out[axis] = parentAxis;
  for (let i = 0; i < 3; i++)
    if (i !== axis)
      out[i] =
        fallback && daughterRadial < 1e-9
          ? fallback[i] * parentRadial
          : daughterRadial > 0
            ? (point[i] * parentRadial) / daughterRadial
            : i === (axis + 1) % 3
              ? parentRadial
              : 0;
  return out;
}

export function nuclearLineage(k, parent, colors, name) {
  const group = new THREE.Group();
  group.name = name;
  parent.add(group);
  const base = new THREE.SphereGeometry(1, 40, 28, Math.PI, Math.PI),
    positions = base.attributes.position,
    colorA = new THREE.Color(colors[0]),
    colorB = new THREE.Color(colors[1]),
    leaves = [],
    states = [];
  for (let j = 0; j < 8; j++) {
    const rootSide = j < 4 ? -1 : 1,
      xSide = j % 2 ? 1 : -1,
      lastSide = rootSide * (j % 4 >= 2 ? 1 : -1),
      levels = Array.from(
        { length: 4 },
        () => new Float32Array(positions.count * 3),
      ),
      colorArray = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const phi = Math.PI + ((i % 41) / 40) * Math.PI,
        q3 = [positions.getX(i), positions.getY(i), positions.getZ(i)],
        q2 = parentPoint(q3, 1, lastSide, [-Math.cos(phi), 0, Math.sin(phi)]),
        q1 = parentPoint(q2, 0, xSide),
        q0 = parentPoint(q1, 1, rootSide);
      [q0, q1, q2, q3].forEach((q, level) => levels[level].set(q, i * 3));
      const color = q3[0] < 0 ? colorA : colorB;
      color.toArray(colorArray, i * 3);
    }
    const layers = [1, 0.93].map((factor, index) => {
      const geometry = base.clone();
      geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colorArray.slice(), 3),
      );
      const mesh = k.mesh(
        geometry,
        k.material(index ? "#dbcaab" : "#ffffff", {
          side: THREE.DoubleSide,
          vertexColors: !index,
        }),
        [0, 0, 0],
        group,
      );
      mesh.name = `${name}-leaf-${j}-${index ? "inner" : "outer"}`;
      return { mesh, factor };
    });
    leaves.push({ levels, layers, rootSide, xSide, lastSide });
    states.push({
      center: new THREE.Vector3(),
      radius: new THREE.Vector3(),
      birth: 0,
      retained: 1,
    });
  }
  base.dispose();
  const shapeChanged = shapeState();
  function update(p) {
    const split1 = ease(p, 0.78, 0.805),
      separate1 = ease(p, 0.805, 0.83),
      split2 = ease(p, 0.835, 0.858),
      separate2 = ease(p, 0.858, 0.88),
      split3 = ease(p, 0.885, 0.911),
      separate3 = ease(p, 0.911, 0.934),
      development = ease(p, 0.94, 0.975),
      selection = ease(p, 0.975, 1);
    group.visible = p >= 0.78;
    if (
      !shapeChanged(
        split1,
        separate1,
        split2,
        separate2,
        split3,
        separate3,
        development,
        selection,
      )
    )
      return;
    leaves.forEach(({ levels, layers, rootSide, xSide, lastSide }, j) => {
      const cx1 = 0.3 * (1 - separate1),
        cy1 = rootSide * (0.205 + 0.345 * separate1),
        cz1 = 0.54 - 0.06 * separate1,
        cx2 = xSide * (0.17 + 0.14 * separate2),
        cy2 = rootSide * (0.55 + 0.565 * separate2),
        cx3 = xSide * 0.31,
        cy3 = rootSide * 1.115 + lastSide * (0.15 + 0.095 * separate3),
        rx3 = 0.15 + (j < 4 ? 0.08 * development : 0),
        ry3 = 0.15 + (j < 4 ? 0.16 * development : 0),
        rz3 = 0.15 + (j < 4 ? 0.05 * development : 0),
        retained = j >= 5 ? 1 - selection : 1,
        state = states[j];
      let cx = 0.3 + (cx1 - 0.3) * split1,
        cy = cy1 * split1,
        cz = 0.54 + (cz1 - 0.54) * split1;
      cx += (cx2 - cx) * split2;
      cy += (cy2 - cy) * split2;
      cz += (0.48 - cz) * split2;
      cx += (cx3 - cx) * split3;
      cy += (cy3 - cy) * split3;
      cz += (0.48 - cz) * split3;
      state.center.set(cx, cy, cz);
      const r1 = 0.26 + (0.205 - 0.26) * split1,
        r2 = r1 + (0.17 - r1) * split2;
      state.radius
        .set(
          r2 + (rx3 - r2) * split3,
          r2 + (ry3 - r2) * split3,
          r2 + (rz3 - r2) * split3,
        )
        .multiplyScalar(retained);
      state.birth =
        j === 0 || j === 4 ? split1 : j === 1 || j === 5 ? split2 : split3;
      state.retained = retained;
      layers.forEach(({ mesh, factor }) => {
        // The inner leaflet closes at its own smaller neck before its two
        // already-closed daughter surfaces acquire the outer leaflet centers.
        const s1 = Math.min(1, split1 / factor),
          s2 = Math.min(1, split2 / factor),
          s3 = Math.min(1, split3 / factor),
          gap1 = factor === 1 ? 0 : ease(split1, factor, 1),
          gap2 = factor === 1 ? 0 : ease(split2, factor, 1),
          gap3 = factor === 1 ? 0 : ease(split3, factor, 1),
          layerCy1 =
            rootSide *
            (0.205 * factor + 0.205 * (1 - factor) * gap1 + 0.345 * separate1),
          layerCx2 =
            xSide *
            (0.17 * factor + 0.17 * (1 - factor) * gap2 + 0.14 * separate2),
          layerCy3 =
            rootSide * 1.115 +
            lastSide *
              (0.15 * factor + 0.15 * (1 - factor) * gap3 + 0.095 * separate3);
        const attr = mesh.geometry.attributes.position;
        for (let i = 0; i < attr.count; i++) {
          const q = i * 3;
          let x = 0.3 + 0.26 * factor * levels[0][q],
            y = 0.26 * factor * levels[0][q + 1],
            z = 0.54 + 0.26 * factor * levels[0][q + 2];
          x += (cx1 + 0.205 * factor * levels[1][q] - x) * s1;
          y += (layerCy1 + 0.205 * factor * levels[1][q + 1] - y) * s1;
          z += (cz1 + 0.205 * factor * levels[1][q + 2] - z) * s1;
          x += (layerCx2 + 0.17 * factor * levels[2][q] - x) * s2;
          y += (cy2 + 0.17 * factor * levels[2][q + 1] - y) * s2;
          z += (0.48 + 0.17 * factor * levels[2][q + 2] - z) * s2;
          x += (cx3 + rx3 * factor * levels[3][q] - x) * s3;
          y += (layerCy3 + ry3 * factor * levels[3][q + 1] - y) * s3;
          z += (0.48 + rz3 * factor * levels[3][q + 2] - z) * s3;
          attr.setXYZ(
            i,
            cx + (x - cx) * retained,
            cy + (y - cy) * retained,
            cz + (z - cz) * retained,
          );
        }
        attr.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeBoundingSphere();
        mesh.geometry.computeBoundingBox();
      });
    });
  }
  return { group, update, states };
}
