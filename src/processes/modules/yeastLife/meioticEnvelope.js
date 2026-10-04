import { THREE } from "../../kit.js";

// A height-field boundary of one nuclear lumen. During late meiosis its
// cross-section constricts around four inherited nuclei, retaining thin
// connecting necks until partition. Both sides are real moving surfaces;
// the small front opening is only the same viewing cutaway used by nuclei.
export function meioticEnvelope(k) {
  const cells = 80,
    extent = 1.6,
    stride = cells + 1,
    fields = new Float64Array(stride * stride),
    triangleStarts = new Uint32Array(cells * cells),
    triangleEnds = new Uint32Array(cells * cells),
    capacity = cells * cells * 2 * 4 * 3,
    positions = new Float32Array(capacity * 3),
    normals = new Float32Array(capacity * 3),
    indices = new Uint32Array(capacity),
    innerPositions = new Float32Array(capacity * 3);
  for (let i = 0; i < capacity; i++) indices[i] = i;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  const mesh = k.mesh(
    geometry,
    k.material("#9fa7c0", { side: THREE.DoubleSide }),
  );
  mesh.name = "sporulation-common-nuclear-envelope";
  const innerGeometry = geometry.clone();
  innerGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(innerPositions, 3),
  );
  const inner = k.mesh(
    innerGeometry,
    k.material("#d1d5e3", { side: THREE.DoubleSide }),
  );
  inner.name = `${mesh.name}:inner-envelope`;
  let rx = 0.675,
    ry = 0.64,
    rz = 0.64,
    partition = 0,
    used = 0;
  const cutZ = 0.1088;
  function field(x, y) {
    const common = rz * rz * (1 - (x / rx) ** 2 - (y / ry) ** 2);
    if (partition === 0) return common;
    const cx = x < 0 ? -0.88 : 0.88,
      cy = y < 0 ? -0.82 : 0.82,
      lobes = 0.34 ** 2 * (1 - ((x - cx) / 0.35) ** 2 - ((y - cy) / 0.37) ** 2),
      // A tree of narrow lumen bridges has zero surface area at completion.
      // Unlike flattening z alone, the entire x/y outline also constricts.
      dx = Math.max(0, Math.abs(x) - 0.88),
      dy = Math.max(0, Math.abs(y) - 0.82),
      verticalDistance2 = (Math.abs(x) - 0.88) ** 2 + dy * dy,
      horizontalDistance2 = y * y + dx * dx,
      neck =
        (0.18 * (1 - partition)) ** 2 -
        Math.min(verticalDistance2, horizontalDistance2),
      terminal = partition === 1 ? lobes : Math.max(lobes, neck);
    return common * (1 - partition) + terminal * partition;
  }
  const normal = new THREE.Vector3();
  function surfaceNormal(x, y, z) {
    let gx = (-2 * rz * rz * x) / (rx * rx),
      gy = (-2 * rz * rz * y) / (ry * ry);
    if (partition > 0) {
      const cx = x < 0 ? -0.88 : 0.88,
        cy = y < 0 ? -0.82 : 0.82,
        dx = x - cx,
        dy = y - cy,
        lobe = 0.34 ** 2 * (1 - (dx / 0.35) ** 2 - (dy / 0.37) ** 2),
        endX = Math.max(0, Math.abs(x) - 0.88),
        endY = Math.max(0, Math.abs(y) - 0.82),
        vertical = (Math.abs(x) - 0.88) ** 2 + endY * endY,
        horizontal = y * y + endX * endX,
        neck = (0.18 * (1 - partition)) ** 2 - Math.min(vertical, horizontal);
      let lx, ly;
      if (partition === 1 || lobe >= neck) {
        lx = (-2 * 0.34 ** 2 * dx) / 0.35 ** 2;
        ly = (-2 * 0.34 ** 2 * dy) / 0.37 ** 2;
      } else if (vertical < horizontal) {
        lx = -2 * (Math.abs(x) - 0.88) * Math.sign(x);
        ly = -2 * endY * Math.sign(y);
      } else {
        lx = -2 * endX * Math.sign(x);
        ly = -2 * y;
      }
      gx = gx * (1 - partition) + lx * partition;
      gy = gy * (1 - partition) + ly * partition;
    }
    return normal.set(-gx, -gy, 2 * z).normalize();
  }
  function writeVertex(p, sign) {
    const z = sign * Math.sqrt(Math.max(0, p[2])),
      n = surfaceNormal(p[0], p[1], z),
      j = used++ * 3;
    positions[j] = p[0];
    positions[j + 1] = p[1];
    positions[j + 2] = z;
    normals[j] = n.x;
    normals[j + 1] = n.y;
    normals[j + 2] = n.z;
    // Keep the paired surface inside even when a lumen neck becomes thin.
    const thickness = Math.min(
      0.0204,
      Math.sqrt(Math.max(0, p[2])) * 0.08 + 0.001,
    );
    innerPositions[j] = p[0] - n.x * thickness;
    innerPositions[j + 1] = p[1] - n.y * thickness;
    innerPositions[j + 2] = z - n.z * thickness;
  }
  function clip(poly, threshold, above) {
    const output = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        ina = above ? a[2] >= threshold : a[2] <= threshold,
        inb = above ? b[2] >= threshold : b[2] <= threshold;
      if (ina) output.push(a);
      if (ina !== inb) {
        const t = (threshold - a[2]) / (b[2] - a[2]);
        output.push([
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          threshold,
        ]);
      }
    }
    return output;
  }
  function polygon(poly, sign) {
    for (let i = 1; i + 1 < poly.length; i++) {
      writeVertex(poly[0], sign);
      writeVertex(poly[sign > 0 ? i : i + 1], sign);
      writeVertex(poly[sign > 0 ? i + 1 : i], sign);
    }
  }
  function triangle(a, b, c) {
    const poly = clip([a, b, c], 0, true);
    polygon(poly, -1);
    polygon(clip(poly, cutZ * cutZ, false), 1);
  }
  const poreGeometry = new THREE.TorusGeometry(0.028, 0.0065, 8, 24),
    pores = new THREE.InstancedMesh(poreGeometry, k.material("#7b86a9"), 40),
    beads = new THREE.InstancedMesh(k.sphere, k.material("#7b86a9"), 320),
    temp = new THREE.Object3D(),
    zAxis = new THREE.Vector3(0, 0, 1),
    point = new THREE.Vector3(),
    local = new THREE.Vector3();
  pores.name = "sporulation-common-nuclear-pores";
  beads.name = "sporulation-common-nuclear-pore-subunits";
  pores.frustumCulled = beads.frustumCulled = false;
  k.group.add(pores, beads);
  function updatePores() {
    for (let i = 0; i < 40; i++) {
      const quadrant = Math.floor(i / 10),
        sx = quadrant < 2 ? -1 : 1,
        sy = quadrant % 2 ? 1 : -1,
        cx = 0.88 * sx * Math.sqrt(partition),
        cy = 0.82 * sy * Math.sqrt(partition),
        angle =
          (i / 40) * Math.PI * 2 * (1 - partition) +
          ((i % 10) / 10) * Math.PI * 2 * partition,
        dx = Math.cos(angle),
        dy = Math.sin(angle),
        z = 0.0952;
      let low = 0,
        high = 3;
      // The central point stays in its future lobe throughout partition.
      for (let j = 0; j < 22; j++) {
        const r = (low + high) / 2;
        if (field(cx + r * dx, cy + r * dy) > z * z) low = r;
        else high = r;
      }
      point.set(cx + low * dx, cy + low * dy, z);
      temp.position.copy(point);
      temp.quaternion.setFromUnitVectors(
        zAxis,
        surfaceNormal(point.x, point.y, point.z),
      );
      temp.scale.setScalar(1);
      temp.updateMatrix();
      pores.setMatrixAt(i, temp.matrix);
      for (let j = 0; j < 8; j++) {
        local
          .set(
            0.028 * Math.cos((j * Math.PI) / 4),
            0.028 * Math.sin((j * Math.PI) / 4),
            0.005,
          )
          .applyQuaternion(temp.quaternion)
          .add(point);
        temp.position.copy(local);
        temp.scale.setScalar(0.0077);
        temp.updateMatrix();
        beads.setMatrixAt(i * 8 + j, temp.matrix);
      }
    }
    for (const item of [pores, beads]) {
      item.visible = mesh.visible;
      item.instanceMatrix.needsUpdate = true;
      item.computeBoundingBox();
      item.computeBoundingSphere();
    }
  }
  let lastShape = "";
  return {
    mesh,
    surfaceAt(x, y, point, normal) {
      point.set(x, y, 0);
      normal.set(0, 0, -1);
      const col = Math.min(
          cells - 1,
          Math.floor(((x + extent) * cells) / (2 * extent)),
        ),
        row = Math.min(
          cells - 1,
          Math.floor(((y + extent) * cells) / (2 * extent)),
        );
      if (col < 0 || row < 0 || x > extent || y > extent) return false;
      let best = Infinity;
      // Float32 boundary vertices can straddle an exact grid coordinate.
      // Include adjacent cells, still reading their actual indexed triangles.
      for (
        let yy = Math.max(0, row - 1);
        yy <= Math.min(cells - 1, row + 1);
        yy++
      )
        for (
          let xx = Math.max(0, col - 1);
          xx <= Math.min(cells - 1, col + 1);
          xx++
        ) {
          const cell = yy * cells + xx;
          for (let i = triangleStarts[cell]; i < triangleEnds[cell]; i += 3) {
            const a = i * 3,
              b = a + 3,
              c = a + 6,
              ax = positions[a],
              ay = positions[a + 1],
              az = positions[a + 2],
              bx = positions[b] - ax,
              by = positions[b + 1] - ay,
              bz = positions[b + 2] - az,
              cx = positions[c] - ax,
              cy = positions[c + 1] - ay,
              cz = positions[c + 2] - az,
              determinant = bx * cy - by * cx;
            if (Math.abs(determinant) < 1e-12) continue;
            const u = ((x - ax) * cy - (y - ay) * cx) / determinant,
              v = (bx * (y - ay) - by * (x - ax)) / determinant;
            if (u < -1e-7 || v < -1e-7 || u + v > 1 + 1e-7) continue;
            const z = az + u * bz + v * cz;
            if (z >= best) continue;
            best = z;
            point.set(x, y, z);
            normal.set(by * cz - bz * cy, bz * cx - bx * cz, determinant);
            if (normal.z > 0) normal.negate();
            normal.normalize();
          }
        }
      return Number.isFinite(best);
    },
    shape(extension, pinch, secondDivision = 0) {
      const key = `${extension}/${pinch}/${secondDivision}`;
      inner.visible = pores.visible = beads.visible = mesh.visible;
      if (key === lastShape) return;
      lastShape = key;
      rx = 0.5 * (1.35 + 1.75 * extension);
      ry = 0.64 * (1 + 1.4 * secondDivision);
      rz = 0.64 * (1 - 0.35 * secondDivision);
      partition = pinch;
      used = 0;
      positions.fill(0);
      normals.fill(0);
      innerPositions.fill(0);
      for (let y = 0; y <= cells; y++)
        for (let x = 0; x <= cells; x++)
          fields[y * stride + x] = field(
            -extent + (x * 2 * extent) / cells,
            -extent + (y * 2 * extent) / cells,
          );
      for (let y = 0; y < cells; y++)
        for (let x = 0; x < cells; x++) {
          const cell = y * cells + x;
          triangleStarts[cell] = used;
          const fa = fields[y * stride + x],
            fb = fields[y * stride + x + 1],
            fc = fields[(y + 1) * stride + x],
            fd = fields[(y + 1) * stride + x + 1];
          if (Math.max(fa, fb, fc, fd) >= 0) {
            const xx = -extent + (x * 2 * extent) / cells,
              yy = -extent + (y * 2 * extent) / cells,
              step = (2 * extent) / cells,
              a = [xx, yy, fa],
              b = [xx + step, yy, fb],
              c = [xx, yy + step, fc],
              d = [xx + step, yy + step, fd];
            triangle(a, b, c);
            triangle(b, d, c);
          }
          triangleEnds[cell] = used;
        }
      for (const g of [geometry, innerGeometry]) {
        g.attributes.position.count = used;
        g.attributes.normal.count = used;
        g.index.count = used;
        g.setDrawRange(0, used);
        g.attributes.position.needsUpdate = true;
        g.computeBoundingBox();
        g.computeBoundingSphere();
      }
      geometry.attributes.normal.needsUpdate = true;
      innerGeometry.attributes.normal.array.set(normals);
      innerGeometry.attributes.normal.needsUpdate = true;
      inner.visible = mesh.visible;
      updatePores();
    },
  };
}
