import { THREE } from "../../kit.js";

const cache = new WeakMap();
function resources(k) {
  if (!cache.has(k))
    cache.set(k, {
      rear: new THREE.SphereGeometry(1, 32, 22, Math.PI, Math.PI),
      rim: new THREE.TorusGeometry(1, 0.018, 8, 64),
      pore: new THREE.TorusGeometry(0.065, 0.016, 6, 12),
      basal: new THREE.CylinderGeometry(0.025, 0.025, 0.075, 9, 1, true),
      cilium: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.015, 0.05, 0.08),
          new THREE.Vector3(0.045, 0.08, 0.19),
          new THREE.Vector3(0.09, 0.06, 0.26),
        ]),
        10,
        0.008,
        5,
        false,
      ),
    });
  return cache.get(k);
}

// Cut surfaces expose chromatin; pore architecture and nucleosome density are schematic.
export function nuclearDetail(k, mesh, macro = false) {
  const r = resources(k),
    originalColor = mesh.material.color.getHex();
  mesh.geometry = r.rear;
  mesh.material = k.material(macro ? "#aa95b5" : originalColor, {
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const inside = k.mesh(
    r.rear,
    k.material(macro ? "#c9b7d1" : "#dbcaab", { side: THREE.DoubleSide }),
    [0, 0, 0],
    mesh,
  );
  inside.scale.setScalar(0.93);
  k.mesh(r.rim, k.material(macro ? "#8f769e" : originalColor), [0, 0, 0], mesh);
  const innerRim = k.mesh(
    r.rim,
    k.material(macro ? "#d0bad5" : "#ddc79f"),
    [0, 0, 0],
    mesh,
  );
  innerRim.scale.setScalar(0.93);
  const fiberMat = k.material(macro ? "#8d709c" : "#98754f");
  const histones = new THREE.InstancedMesh(
    k.sphere,
    k.material(macro ? "#b39dc0" : "#c4a379"),
    macro ? 72 : 36,
  );
  mesh.add(histones);
  const temp = new THREE.Object3D();
  let n = 0;
  for (let row = 0; row < (macro ? 6 : 3); row++) {
    const pts = [];
    for (let j = 0; j < 36; j++) {
      const t = j / 35,
        a = t * Math.PI * 5.2 + row * 0.83;
      const x = (row - (macro ? 2.5 : 1)) * 0.2 + 0.16 * Math.cos(a),
        y = -0.61 + t * 1.2,
        z = 0.16 * Math.sin(a) + 0.04;
      pts.push([x, y, z]);
      if (j % 3 === 0) {
        temp.position.set(x, y, z);
        temp.scale.set(0.067, 0.043, 0.055);
        temp.rotation.set(0, a, row);
        temp.updateMatrix();
        histones.setMatrixAt(n++, temp.matrix);
      }
    }
    k.tube(pts, 0.018, fiberMat, mesh, 50);
  }
  histones.instanceMatrix.needsUpdate = true;
  histones.computeBoundingSphere();
  histones.computeBoundingBox();
  const pores = new THREE.InstancedMesh(r.pore, k.material("#baa990"), 10);
  mesh.add(pores);
  const zAxis = new THREE.Vector3(0, 0, 1),
    normal = new THREE.Vector3();
  for (let j = 0; j < 10; j++) {
    const a = (j / 10) * Math.PI * 2;
    temp.position.set(0.83 * Math.cos(a), 0.83 * Math.sin(a), -0.54);
    normal.copy(temp.position).normalize();
    temp.quaternion.setFromUnitVectors(zAxis, normal);
    temp.scale.setScalar(1);
    temp.updateMatrix();
    pores.setMatrixAt(j, temp.matrix);
  }
  pores.instanceMatrix.needsUpdate = true;
  pores.computeBoundingSphere();
  pores.computeBoundingBox();
  if (macro)
    for (let l = 0; l < 3; l++) {
      const center = [-0.4 + l * 0.36, -0.18 + (l % 2) * 0.42, 0.1];
      k.ball(center, [0.15, 0.16, 0.11], k.material("#826889"), mesh);
      for (let strand = 0; strand < 2; strand++)
        k.tube(
          Array.from({ length: 22 }, (_, j) => {
            const a = (j / 21) * 9;
            return [
              center[0] + 0.11 * Math.cos(a + strand),
              center[1] + 0.12 * Math.sin(a),
              center[2] + 0.06 * Math.sin(a * 2),
            ];
          }),
          0.016,
          k.material("#bca4c7"),
          mesh,
          30,
        );
    }
  mesh.userData.structure = macro
    ? "paired nuclear envelope / pores / chromatin fibers / nucleoli"
    : "paired nuclear envelope / pores / chromatin fibers";
  return mesh;
}

// Repeated basal bodies and bent cilia, positioned by the same map as the cortex.
export function corticalRows(
  k,
  parent,
  point,
  { rows = 13, columns = 17, frontLimit = 0.7 } = {},
) {
  const r = resources(k),
    count = rows * columns,
    temp = new THREE.Object3D();
  const bases = new THREE.InstancedMesh(r.basal, k.material("#8a9b83"), count),
    cilia = new THREE.InstancedMesh(r.cilium, k.material("#a0b8a1"), count);
  parent.add(bases, cilia);
  bases.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cilia.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const lineGeo = new THREE.BufferGeometry(),
    pos = new Float32Array(rows * (columns - 1) * 6);
  lineGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const ridges = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({
      color: "#a1b69e",
      transparent: true,
      opacity: 0.72,
    }),
  );
  parent.add(ridges);
  const params = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      const y = -0.91 + (col / (columns - 1)) * 1.82,
        a = Math.PI - 0.12 + (row / (rows - 1)) * (Math.PI + 0.24);
      params.push({ row, col, y, a });
    }
  const normal = new THREE.Vector3(),
    axis = new THREE.Vector3(0, 0, 1),
    previous = new THREE.Vector3();
  function update(pinch = 0, stretch = 1) {
    let segment = 0;
    params.forEach(({ row, col, y, a }, i) => {
      const rad = Math.sqrt(1 - y * y),
        p = point(rad * Math.cos(a), y, rad * Math.sin(a), pinch, stretch);
      temp.position.set(...p);
      normal.set(Math.cos(a), y * 0.25, Math.sin(a)).normalize();
      temp.quaternion.setFromUnitVectors(axis, normal);
      temp.scale.setScalar(1);
      temp.updateMatrix();
      cilia.setMatrixAt(i, temp.matrix);
      temp.rotateX(Math.PI / 2);
      temp.updateMatrix();
      bases.setMatrixAt(i, temp.matrix);
      if (col) {
        pos[segment++] = previous.x;
        pos[segment++] = previous.y;
        pos[segment++] = previous.z;
        pos[segment++] = p[0];
        pos[segment++] = p[1];
        pos[segment++] = p[2];
      }
      previous.set(...p);
    });
    for (const m of [bases, cilia]) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      m.computeBoundingBox();
    }
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.computeBoundingSphere();
    lineGeo.computeBoundingBox();
  }
  update();
  return { update, bases, cilia, ridges };
}

export function vesicleMembrane(k, parent, color = "#c8a56f") {
  const r = resources(k);
  const outer = k.mesh(
    r.rear,
    k.material(color, { side: THREE.DoubleSide }),
    [0, 0, 0],
    parent,
  );
  const inner = k.mesh(
    r.rear,
    k.material("#e6d2aa", { side: THREE.DoubleSide }),
    [0, 0, 0],
    parent,
  );
  inner.scale.setScalar(0.92);
  for (const scale of [1, 0.92]) {
    const rim = k.mesh(
      r.rim,
      k.material(scale === 1 ? "#a58a63" : "#e4d0a8"),
      [0, 0, 0],
      parent,
    );
    rim.scale.setScalar(scale);
  }
  return { outer, inner };
}

export function membraneDetail(k, mesh, color = "#84aeb5") {
  const r = resources(k);
  mesh.geometry = r.rear;
  mesh.material = k.material(color, { side: THREE.DoubleSide });
  const inner = k.mesh(
    r.rear,
    k.material("#b9d9d4", { side: THREE.DoubleSide }),
    [0, 0, 0],
    mesh,
  );
  inner.scale.setScalar(0.91);
  for (const scale of [1, 0.91]) {
    const edge = k.mesh(
      r.rim,
      k.material(scale === 1 ? "#709c9e" : "#c5e0d6"),
      [0, 0, 0],
      mesh,
    );
    edge.scale.setScalar(scale);
  }
  return mesh;
}
