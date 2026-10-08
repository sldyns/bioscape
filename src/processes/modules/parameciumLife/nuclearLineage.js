import { THREE, ease } from "../../kit.js";
import { shapeState } from "./shapeState.js";
import { nuclearDetail } from "./fineStructure.js";

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

// Two persistent material lineages tile the mother nucleus, constrict while
// connected, and close into daughters before their centers move apart. The
// chromatin and pore objects use the same map as their envelope throughout.
export function binaryNuclearFission(
  k,
  parent,
  { name, motherName, bridgeName, daughterName, material, macro = false },
) {
  const group = new THREE.Group();
  group.name = name;
  parent.add(group);
  const daughters = [-1, 1].map((side, i) => {
    const mesh = k.ball([0, 0, 0], 1, material, group);
    nuclearDetail(k, mesh, macro);
    mesh.name = `${daughterName}-${i}`;
    return { mesh, side };
  });
  const template = daughters[0].mesh.geometry,
    source = template.attributes.position,
    count = source.count,
    columns = template.parameters.widthSegments,
    rows = template.parameters.heightSegments,
    indices = [];
  // SphereGeometry omits collapsed pole triangles. Here each daughter pole
  // expands into the mother's equatorial arc, so those faces become real
  // membrane patches and must remain in the persistent parameter grid.
  for (let side = 0; side < 2; side++)
    for (let row = 0; row < rows; row++)
      for (let column = 0; column < columns; column++) {
        const b = side * count + row * (columns + 1) + column,
          a = b + 1,
          c = b + columns + 1,
          d = c + 1;
        indices.push(a, b, d, b, c, d);
      }
  const envelope = () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(count * 6), 3),
    );
    geometry.setIndex(indices);
    return geometry;
  };
  const outerGeometry = envelope(),
    innerGeometry = envelope(),
    mother = k.mesh(
      outerGeometry,
      daughters[0].mesh.material,
      [0, 0, 0],
      group,
    ),
    innerMaterial = daughters[0].mesh.children[0].material;
  mother.name = motherName;
  k.mesh(innerGeometry, innerMaterial, [0, 0, 0], mother);
  const bridge = bridgeName
    ? k.mesh(outerGeometry, mother.material, [0, 0, 0], group)
    : null;
  if (bridge) {
    bridge.name = bridgeName;
    k.mesh(innerGeometry, innerMaterial, [0, 0, 0], bridge);
  }
  const contents = new THREE.Group();
  contents.name = `${name}-inherited-contents`;
  group.add(contents);
  const contentLineages = [-1, 1].map((side) => {
    const holder = new THREE.Group();
    holder.name = `${name}-content-carrier-${side}`;
    contents.add(holder);
    return holder;
  });
  function halfPoint(q, side, out, fallback = null) {
    const r = q.length(),
      radial = Math.hypot(q.x, q.z),
      theta = Math.acos(Math.max(-1, Math.min(1, r ? q.y / r : 0))),
      halfTheta = theta / 2 + (side < 0 ? Math.PI / 2 : 0),
      transverse = r * Math.sin(halfTheta);
    return out.set(
      radial > 1e-9
        ? (q.x / radial) * transverse
        : (fallback?.[0] ?? 1) * transverse,
      r * Math.cos(halfTheta),
      radial > 1e-9
        ? (q.z / radial) * transverse
        : (fallback?.[2] ?? 0) * transverse,
    );
  }
  function halfMatrix(original, side) {
    const out = new THREE.Matrix4(),
      base = new THREE.Vector3().setFromMatrixPosition(original),
      mapped = halfPoint(base, side, new THREE.Vector3()),
      q = new THREE.Vector3(),
      derivative = new THREE.Vector3();
    out.setPosition(mapped);
    for (let axis = 0; axis < 3; axis++) {
      q.setFromMatrixColumn(original, axis).multiplyScalar(1e-4).add(base);
      halfPoint(q, side, derivative).sub(mapped).multiplyScalar(1e4);
      out.elements[axis * 4] = derivative.x;
      out.elements[axis * 4 + 1] = derivative.y;
      out.elements[axis * 4 + 2] = derivative.z;
    }
    return out;
  }
  const deformedMeshes = [],
    deformedInstances = [],
    state = {
      center: [0, 0, 0],
      radius: [1, 1, 1],
      daughterCenters: [
        [0, -0.5, 0],
        [0, 0.5, 0],
      ],
      daughterRadius: [1, 0.5, 1],
      split: 0,
    };
  daughters.forEach(({ mesh, side }, lineage) => {
    mesh.updateMatrixWorld(true);
    // The original inside shell remains attached to each daughter. The cut
    // rims below persist across scission rather than swapping ring objects.
    mesh.children.slice(1, 3).forEach((child) => mesh.remove(child));
    mesh.children.slice(1).forEach((child, detail) => {
      child.name = `${name}-lineage-${lineage}-content-${detail}`;
      if (child.isInstancedMesh) {
        const matrices = [];
        for (let i = 0; i < child.count; i++) {
          const matrix = new THREE.Matrix4();
          child.getMatrixAt(i, matrix);
          matrices.push(matrix);
        }
        deformedInstances.push({
          mesh: child,
          side,
          matrices,
          halves: matrices.map((m) => halfMatrix(m, side)),
        });
      } else if (child.geometry) {
        child.updateMatrix();
        const geometry = child.geometry.clone(),
          attribute = geometry.attributes.position;
        const original = Array.from({ length: attribute.count }, (_, i) =>
          new THREE.Vector3()
            .fromBufferAttribute(attribute, i)
            .applyMatrix4(child.matrix),
        );
        child.geometry = geometry;
        deformedMeshes.push({
          mesh: child,
          side,
          original,
          halves: original.map((p) => halfPoint(p, side, new THREE.Vector3())),
        });
      }
      child.position.set(0, 0, 0);
      child.quaternion.identity();
      child.scale.setScalar(1);
      contentLineages[lineage].add(child);
    });
  });
  const envelopePoints = Array.from({ length: count }, (_, i) => {
    const original = new THREE.Vector3().fromBufferAttribute(source, i),
      phi = Math.PI + ((i % (columns + 1)) / columns) * Math.PI,
      fallback = [-Math.cos(phi), 0, Math.sin(phi)];
    return {
      original,
      halves: [-1, 1].map((side) =>
        halfPoint(original, side, new THREE.Vector3(), fallback),
      ),
    };
  });
  const point = new THREE.Vector3(),
    target = new THREE.Vector3(),
    derivative = new THREE.Vector3(),
    matrix = new THREE.Matrix4();
  function mapPoint(q, side, factor = 1, out = point, fallback = null) {
    const split = Math.min(1, state.split / factor),
      c = state.daughterCenters[side < 0 ? 0 : 1];
    // Inner membranes close first, then align with the already closed outer
    // daughter poles. This keeps the two layers from crossing at the neck.
    const innerOffset =
      side *
      state.daughterRadius[1] *
      (1 - factor) *
      (1 - ease(state.split, factor, 1));
    halfPoint(q, side, out, fallback);
    out.set(
      state.center[0] + state.radius[0] * out.x * factor,
      state.center[1] + state.radius[1] * out.y * factor,
      state.center[2] + state.radius[2] * out.z * factor,
    );
    target.set(
      c[0] + state.daughterRadius[0] * q.x * factor,
      c[1] - innerOffset + state.daughterRadius[1] * q.y * factor,
      c[2] + state.daughterRadius[2] * q.z * factor,
    );
    return out.lerp(target, split);
  }
  const rimRows = 64,
    rimColumns = 8,
    rims = [];
  for (const side of [-1, 1])
    for (const factor of [1, 0.93]) {
      const geometry = new THREE.TubeGeometry(
        new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0, 1, 0)),
        rimRows,
        1,
        rimColumns,
        false,
      );
      const mesh = k.mesh(
        geometry,
        k.material(
          macro
            ? factor === 1
              ? "#8f769e"
              : "#d0bad5"
            : factor === 1
              ? "#b38f62"
              : "#ddc79f",
        ),
        [0, 0, 0],
        group,
      );
      mesh.name = `${name}-cut-rim-${side}-${factor}`;
      rims.push({
        mesh,
        side,
        factor,
        centers: Array.from({ length: rimRows + 1 }, () => new THREE.Vector3()),
      });
    }
  const shapeChanged = shapeState(),
    contentShapeChanged = shapeState(),
    contentScale = [1, 1, 1],
    parentWeight = [1, 1, 1],
    daughterWeight = [0, 0, 0],
    q = new THREE.Vector3(),
    fallback = [0, 0, 0];
  function finish(geometry) {
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  function update(next) {
    Object.assign(state, next);
    mother.position.fromArray(state.center);
    mother.scale.fromArray(state.radius);
    if (bridge) {
      bridge.position.copy(mother.position);
      bridge.scale.copy(mother.scale);
    }
    daughters.forEach(({ mesh }, i) => {
      mesh.position.fromArray(state.daughterCenters[i]);
      mesh.scale.fromArray(state.daughterRadius);
      mesh.visible = state.split === 1;
    });
    mother.visible = state.split < 1;
    if (bridge) bridge.visible = false;
    for (let axis = 0; axis < 3; axis++) {
      const a = state.radius[axis] * (1 - state.split),
        b = state.daughterRadius[axis] * state.split;
      contentScale[axis] = a + b;
      parentWeight[axis] = a / (a + b);
      daughterWeight[axis] = b / (a + b);
    }
    contentLineages.forEach((holder, i) => {
      holder.position.set(
        state.center[0] +
          (state.daughterCenters[i][0] - state.center[0]) * state.split,
        state.center[1] +
          (state.daughterCenters[i][1] - state.center[1]) * state.split,
        state.center[2] +
          (state.daughterCenters[i][2] - state.center[2]) * state.split,
      );
      holder.scale.fromArray(contentScale);
    });
    if (
      !shapeChanged(
        ...state.center,
        ...state.radius,
        ...state.daughterCenters.flat(),
        ...state.daughterRadius,
        state.split,
      )
    )
      return;
    for (const [geometry, factor] of [
      [outerGeometry, 1],
      [innerGeometry, 0.93],
    ]) {
      const attr = geometry.attributes.position;
      daughters.forEach(({ side }, half) => {
        const split = Math.min(1, state.split / factor),
          center = state.daughterCenters[half],
          offset =
            side *
            state.daughterRadius[1] *
            (1 - factor) *
            (1 - ease(state.split, factor, 1)),
          a = factor * (1 - split),
          b = state.daughterRadius.map(
            (r, axis) => (r * factor * split) / state.radius[axis],
          ),
          c = center.map(
            (v, axis) =>
              ((v - state.center[axis] - (axis === 1 ? offset : 0)) * split) /
              state.radius[axis],
          );
        envelopePoints.forEach(({ original: v, halves }, i) => {
          const h = halves[half];
          attr.setXYZ(
            half * count + i,
            h.x * a + v.x * b[0] + c[0],
            h.y * a + v.y * b[1] + c[1],
            h.z * a + v.z * b[2] + c[2],
          );
        });
      });
      finish(geometry);
    }
    // Before and after scission, all movement is affine: carry the unchanged
    // detailed buffers with the nucleus. Rebuild them only during constriction.
    if (contentShapeChanged(...parentWeight, ...daughterWeight)) {
      for (const { mesh, original, halves } of deformedMeshes) {
        const attr = mesh.geometry.attributes.position;
        original.forEach((v, i) => {
          const h = halves[i];
          attr.setXYZ(
            i,
            h.x * parentWeight[0] + v.x * daughterWeight[0],
            h.y * parentWeight[1] + v.y * daughterWeight[1],
            h.z * parentWeight[2] + v.z * daughterWeight[2],
          );
        });
        finish(mesh.geometry);
      }
      for (const { mesh, matrices, halves } of deformedInstances) {
        matrices.forEach((original, i) => {
          matrix.identity();
          for (let col = 0; col < 4; col++)
            for (let axis = 0; axis < 3; axis++)
              matrix.elements[col * 4 + axis] =
                halves[i].elements[col * 4 + axis] * parentWeight[axis] +
                original.elements[col * 4 + axis] * daughterWeight[axis];
          mesh.setMatrixAt(i, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();
      }
    }
    for (const { mesh, side, factor, centers } of rims) {
      centers.forEach((center, i) => {
        const a = (i / rimRows) * Math.PI;
        q.set(Math.sin(2 * a), -side * Math.cos(2 * a), 0);
        fallback[0] = Math.cos(a);
        fallback[2] = 0;
        mapPoint(q, side, factor, center, fallback);
      });
      const attr = mesh.geometry.attributes.position,
        thickness = macro ? 0.007 : 0.005;
      centers.forEach((center, i) => {
        derivative
          .subVectors(
            centers[Math.min(rimRows, i + 1)],
            centers[Math.max(0, i - 1)],
          )
          .normalize();
        if (i === 0 || i === rimRows) {
          q.subVectors(centers[1], centers[rimRows - 1]).normalize();
          derivative.lerp(q, ease(state.split, 0.9, 1)).normalize();
        }
        for (let j = 0; j <= rimColumns; j++) {
          const angle = (j / rimColumns) * Math.PI * 2,
            radial = thickness * Math.cos(angle);
          attr.setXYZ(
            i * (rimColumns + 1) + j,
            center.x - derivative.y * radial,
            center.y + derivative.x * radial,
            center.z + thickness * Math.sin(angle),
          );
        }
      });
      finish(mesh.geometry);
    }
  }
  return {
    group,
    mother,
    bridge,
    daughters: daughters.map(({ mesh }) => mesh),
    contents,
    update,
    mapPoint,
  };
}
