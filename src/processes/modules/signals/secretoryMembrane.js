import { THREE } from "../../kit.js";

// Cross-section of ER lumen, a budding carrier and the extracellular space.
// Their smooth union draws the neck itself: it never places an intact membrane
// across either the ER exit or the later plasma-membrane fusion opening.
export function secretoryMembrane(k, parent, erMaterial, plasmaMaterial) {
  const nx = 164,
    ny = 138,
    xmin = -3.9,
    ymin = -2.1,
    dx = 5.95 / nx,
    dy = 4.9 / ny,
    capacity = 90000;
  const vertices = new Float32Array(capacity * 3),
    normals = new Float32Array(capacity * 3),
    colors = new Float32Array(capacity * 3),
    backing = new Float32Array(capacity * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setDrawRange(0, 0);
  const material = k.material("#ffffff", {
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  const mesh = k.mesh(geometry, material, [0, 0, 0], parent);
  mesh.name = "continuous-ER-carrier-plasma-section";
  const backGeometry = new THREE.BufferGeometry();
  backGeometry.setAttribute("position", new THREE.BufferAttribute(backing, 3));
  backGeometry.setDrawRange(0, 0);
  const back = k.mesh(
    backGeometry,
    k.material("#cad4d3", {
      transparent: true,
      opacity: 0.43,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    [0, 0, 0],
    parent,
  );
  back.name = "secretory-lumen-cutaway-backplane";
  const heads = new THREE.InstancedMesh(k.sphere, plasmaMaterial, 4000);
  parent.add(heads);
  heads.name = "secretory-membrane-lipid-headgroups";
  const pose = new THREE.Object3D();
  pose.scale.set(0.022, 0.022, 0.026);
  const bounds = new THREE.Box3(
    new THREE.Vector3(xmin, ymin, -0.24),
    new THREE.Vector3(xmin + nx * dx, ymin + ny * dy, 0.24),
  );
  for (const g of [geometry, backGeometry]) {
    g.boundingBox = bounds.clone();
    g.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
  }
  heads.boundingBox = bounds.clone();
  heads.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
  const points = [],
    values = new Float64Array((nx + 1) * (ny + 1)),
    fillValues = new Float64Array(values.length),
    erValues = new Float64Array(values.length),
    targetValues = new Float64Array(values.length);
  for (let y = 0; y <= ny; y++)
    for (let x = 0; x <= nx; x++) points.push([xmin + x * dx, ymin + y * dy]);
  const triangles = [];
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++) {
      const a = y * (nx + 1) + x,
        b = a + 1,
        d = a + nx + 1,
        c = d + 1;
      triangles.push([a, b, c], [a, c, d]);
    }
  let cx = -1.5,
    cy = 0.8,
    carrierPresent = true,
    plasmaBlend = 0.07,
    previous = "";
  const ellipse = (x, y, ox, oy, rx, ry) =>
    (Math.hypot((x - ox) / rx, (y - oy) / ry) - 1) * Math.min(rx, ry);
  const smoothUnion = (a, b, blend = 0.07) => {
    if (blend === 0) return Math.min(a, b);
    const h = Math.max(0, 1 - Math.abs(a - b) / blend);
    return Math.min(a, b) - 0.25 * blend * h * h;
  };
  function compartments(x, y) {
    const er = ellipse(x, y, -2.1, 0.8, 1.2, 0.51),
      carrier = carrierPresent ? Math.hypot(x - cx, y - cy) - 0.46 : 100,
      target = ellipse(x, y, -1.3, 0.35, 2.5, 2.3),
      lumen = smoothUnion(er, carrier);
    return {
      er,
      target,
      lumen,
      boundary: smoothUnion(lumen, -target, plasmaBlend),
    };
  }
  const field = (x, y) => compartments(x, y).boundary;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    erValues[i] = ellipse(x, y, -2.1, 0.8, 1.2, 0.51);
    targetValues[i] = ellipse(x, y, -1.3, 0.35, 2.5, 2.3);
  }
  const edge = (a, b, samples) => {
    const u = samples[a] / (samples[a] - samples[b]);
    return [
      points[a][0] + (points[b][0] - points[a][0]) * u,
      points[a][1] + (points[b][1] - points[a][1]) * u,
    ];
  };
  function update(carrierX, carrierY, present = true, fusion = 0) {
    const key = `${carrierX},${carrierY},${present},${fusion}`;
    if (key === previous) return;
    previous = key;
    cx = carrierX;
    cy = carrierY;
    carrierPresent = present;
    plasmaBlend = 0.07 * (1 - fusion);
    for (let i = 0; i < points.length; i++) {
      const p = points[i],
        carrier = carrierPresent
          ? Math.hypot(p[0] - cx, p[1] - cy) - 0.46
          : 100,
        lumen = smoothUnion(erValues[i], carrier);
      values[i] = smoothUnion(lumen, -targetValues[i], plasmaBlend);
      fillValues[i] = Math.max(lumen, targetValues[i]);
    }
    let count = 0,
      fillCount = 0,
      headCount = 0,
      segmentCount = 0;
    function vertex(p, n, color) {
      vertices.set(p, count * 3);
      normals.set(n, count * 3);
      colors[count * 3] = color.r;
      colors[count * 3 + 1] = color.g;
      colors[count * 3 + 2] = color.b;
      count++;
    }
    function quad(a, b, c, d, normal, color) {
      for (const p of [a, b, c, a, c, d]) vertex(p, normal, color);
    }
    function segment(a, b) {
      const mx = (a[0] + b[0]) / 2,
        my = (a[1] + b[1]) / 2;
      // TAP is the only intentional ER lipid opening in this section.
      if (mx > -2.08 && mx < -1.64 && my < 0.4 && my > 0.2) return;
      const vx = b[0] - a[0],
        vy = b[1] - a[1],
        length = Math.hypot(vx, vy);
      if (length < 1e-12) return;
      const ux = -vy / length,
        uy = vx / length,
        erSide = compartments(mx, my).er < 0.08,
        half = erSide ? 0.025 : 0.0195,
        color = erSide ? erMaterial.color : plasmaMaterial.color;
      const ap = [a[0] + ux * half, a[1] + uy * half],
        am = [a[0] - ux * half, a[1] - uy * half],
        bp = [b[0] + ux * half, b[1] + uy * half],
        bm = [b[0] - ux * half, b[1] - uy * half];
      quad(
        [...ap, -0.2],
        [...bp, -0.2],
        [...bp, 0.2],
        [...ap, 0.2],
        [ux, uy, 0],
        color,
      );
      quad(
        [...bm, -0.2],
        [...am, -0.2],
        [...am, 0.2],
        [...bm, 0.2],
        [-ux, -uy, 0],
        color,
      );
      quad(
        [...ap, 0.2],
        [...bp, 0.2],
        [...bm, 0.2],
        [...am, 0.2],
        [0, 0, 1],
        color,
      );
      if (segmentCount++ % 2 === 0)
        for (const sign of [-1, 1]) {
          pose.position.set(mx + sign * ux * half, my + sign * uy * half, 0.21);
          pose.updateMatrix();
          heads.setMatrixAt(headCount++, pose.matrix);
        }
    }
    function fill(a, b, c) {
      for (const p of [a, b, c]) {
        backing.set([p[0], p[1], -0.22], fillCount * 3);
        fillCount++;
      }
    }
    for (const t of triangles) {
      const mask =
        (values[t[0]] < 0 ? 1 : 0) |
        (values[t[1]] < 0 ? 2 : 0) |
        (values[t[2]] < 0 ? 4 : 0);
      if (mask !== 0 && mask !== 7) {
        const corner =
          mask === 1 || mask === 6 ? 0 : mask === 2 || mask === 5 ? 1 : 2;
        segment(
          edge(t[corner], t[(corner + 1) % 3], values),
          edge(t[corner], t[(corner + 2) % 3], values),
        );
      }
      const fm =
        (fillValues[t[0]] < 0 ? 1 : 0) |
        (fillValues[t[1]] < 0 ? 2 : 0) |
        (fillValues[t[2]] < 0 ? 4 : 0);
      if (fm === 7) fill(points[t[0]], points[t[1]], points[t[2]]);
      else if (fm === 1 || fm === 2 || fm === 4) {
        const corner = fm === 1 ? 0 : fm === 2 ? 1 : 2;
        fill(
          points[t[corner]],
          edge(t[corner], t[(corner + 1) % 3], fillValues),
          edge(t[corner], t[(corner + 2) % 3], fillValues),
        );
      } else if (fm !== 0) {
        const corner = fm === 6 ? 0 : fm === 5 ? 1 : 2,
          ia = t[(corner + 1) % 3],
          ib = t[(corner + 2) % 3],
          a = points[ia],
          b = points[ib],
          c = edge(ib, t[corner], fillValues),
          d = edge(ia, t[corner], fillValues);
        fill(a, b, c);
        fill(a, c, d);
      }
    }
    if (
      count > capacity ||
      fillCount > capacity ||
      headCount > heads.instanceMatrix.count
    )
      throw new Error("Secretory membrane buffer capacity exceeded");
    vertices.fill(0, count * 3);
    normals.fill(0, count * 3);
    colors.fill(0, count * 3);
    backing.fill(0, fillCount * 3);
    geometry.setDrawRange(0, count);
    backGeometry.setDrawRange(0, fillCount);
    for (const attr of Object.values(geometry.attributes))
      attr.needsUpdate = true;
    backGeometry.attributes.position.needsUpdate = true;
    heads.count = headCount;
    heads.instanceMatrix.array.fill(0, headCount * 16);
    heads.instanceMatrix.needsUpdate = true;
  }
  return { mesh, back, heads, update, field, compartments };
}
