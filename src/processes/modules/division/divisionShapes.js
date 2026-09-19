import { THREE, sceneKit } from "../../kit.js";

const TAU = Math.PI * 2;
export function divisionKit() {
  const k = sceneKit();
  const green = k.material("#628c88", { roughness: 0.58 });
  const purple = k.material("#9484ad", { roughness: 0.58 });
  const gold = k.material("#bd9153", { metalness: 0.08 });
  const spindle = k.material("#6c9793", { roughness: 0.46 });
  const membrane = k.material("#b8d0c6", { side: THREE.DoubleSide });
  const outline = k.material("#87a99b");
  const nucleus = k.material("#c0b4cb", { side: THREE.DoubleSide });
  const darkChromatin = k.material("#4f6875");
  const chromatinHighlight = k.material("#d1cec5");
  const innerPlate = k.material("#836e91");
  const materials = new Set([
    green,
    purple,
    gold,
    spindle,
    membrane,
    outline,
    nucleus,
    darkChromatin,
    chromatinHighlight,
    innerPlate,
  ]);
  const unitY = new THREE.Vector3(0, 1, 0),
    delta = new THREE.Vector3(),
    temp = new THREE.Object3D();
  const beadGeometry = new THREE.SphereGeometry(1, 10, 7);
  const narrowCylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
  function mesh(geometry, mat, parent = k.group) {
    materials.add(mat);
    return k.mesh(geometry, mat, [0, 0, 0], parent);
  }
  function instances(geometry, mat, count, parent, name) {
    const object = new THREE.InstancedMesh(geometry, mat, count);
    object.name = name;
    object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    parent.add(object);
    materials.add(mat);
    return object;
  }
  function setSegment(object, ax, ay, az, bx, by, bz, radius = 0.025) {
    delta.set(bx - ax, by - ay, bz - az);
    object.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    object.scale.set(radius, Math.max(delta.length(), 1e-6), radius);
    object.quaternion.setFromUnitVectors(unitY, delta.normalize());
  }
  function setInstance(object, index, ax, ay, az, bx, by, bz, radius) {
    setSegment(temp, ax, ay, az, bx, by, bz, radius);
    temp.updateMatrix();
    object.setMatrixAt(index, temp.matrix);
  }
  function finish(object) {
    object.instanceMatrix.needsUpdate = true;
    object.computeBoundingBox();
    object.computeBoundingSphere();
  }
  function line(mat = spindle, parent = k.group) {
    return mesh(narrowCylinder, mat, parent);
  }
  function bundle(parent = k.group, strands = 5) {
    const m = instances(
      narrowCylinder,
      spindle,
      strands * 12,
      parent,
      "kinetochore-microtubule-bundle",
    );
    m.userData.strands = strands;
    return m;
  }
  function setBundle(m, ax, ay, az, bx, by, bz, radius = 0.012) {
    const count = m.userData.strands;
    for (let s = 0; s < count; s++)
      for (let j = 0; j < 12; j++) {
        const t = j / 12,
          u = (j + 1) / 12,
          a = (s * TAU) / count,
          offset = 0.04;
        const wave = Math.sin(t * Math.PI),
          next = Math.sin(u * Math.PI);
        setInstance(
          m,
          s * 12 + j,
          ax + (bx - ax) * t,
          ay + (by - ay) * t + Math.cos(a) * offset * wave,
          az + (bz - az) * t + (0.14 + Math.sin(a) * offset) * wave,
          ax + (bx - ax) * u,
          ay + (by - ay) * u + Math.cos(a) * offset * next,
          az + (bz - az) * u + (0.14 + Math.sin(a) * offset) * next,
          radius,
        );
      }
    finish(m);
  }
  function chromatid(side, length, mat, parent = k.group, options = {}) {
    const group = new THREE.Group();
    group.name = "condensed-chromatin-chromatid";
    parent.add(group);
    const distal = new THREE.Group();
    group.add(distal);
    const bend = -side * (options.telocentric ? 0.12 : 0.22);
    const exchangeY = length * 0.69;
    const deformableSurfaces = [],
      deformableInstances = [];
    let deflection = 0,
      lastDeflection = NaN;
    function displacement(y) {
      return (
        deflection *
        Math.max(
          0,
          y <= exchangeY
            ? y / exchangeY
            : 1 + (y - exchangeY) / (length - exchangeY),
        )
      );
    }
    function axis(y) {
      const t = Math.abs(y) / length;
      return bend * (0.15 + Math.pow(t, 0.8) * 0.85);
    }
    // Coarse chromosome lobes retain the centromeric waist. Surface strands show
    // schematic folded chromatin domains, not a literal 30-nm fibre or atom map.
    function arm(from, to, target) {
      const rings = 28,
        radial = 12,
        positions = [],
        indices = [];
      for (let j = 0; j <= rings; j++) {
        const t = j / rings,
          y = from + (to - from) * t;
        const centromere =
          0.47 + 0.53 * Math.min(1, Math.abs(y) / (length * 0.3));
        const cap = 0.52 + 0.48 * Math.pow(Math.sin(Math.PI * t), 0.45);
        for (let a = 0; a <= radial; a++) {
          const angle = (a * TAU) / radial;
          const ridge = 1 + 0.055 * Math.sin(angle * 3 + j * 0.53);
          positions.push(
            axis(y) + Math.cos(angle) * 0.124 * centromere * cap * ridge,
            y,
            Math.sin(angle) * 0.116 * centromere * cap * ridge,
          );
        }
      }
      for (let j = 0; j < rings; j++)
        for (let a = 0; a < radial; a++) {
          const n = j * (radial + 1) + a;
          indices.push(
            n,
            n + 1,
            n + radial + 1,
            n + 1,
            n + radial + 2,
            n + radial + 1,
          );
        }
      const capIndex = positions.length / 3;
      positions.push(axis(from), from, 0, axis(to), to, 0);
      for (let a = 0; a < radial; a++) {
        indices.push(capIndex, a + 1, a);
        const n = rings * (radial + 1) + a;
        indices.push(capIndex + 1, n, n + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      g.setIndex(indices);
      g.computeVertexNormals();
      const solid = mesh(g, mat, target);
      solid.name = "continuous-chromatid-arm";
      deformableSurfaces.push({
        geometry: g,
        original: g.attributes.position.array.slice(),
      });
      const loops = 12,
        segments = loops * 14;
      const fibre = instances(
        narrowCylinder,
        mat,
        segments,
        target,
        "folded-chromatin-surface-path",
      );
      const nucleosomes = instances(
        beadGeometry,
        mat,
        loops * 5,
        target,
        "chromatin-packing-domains",
      );
      for (let i = 0; i < segments; i++) {
        const t = i / segments,
          u = (i + 1) / segments,
          angle = t * TAU * loops,
          next = u * TAU * loops;
        const y = from + (to - from) * t,
          yn = from + (to - from) * u;
        const r =
          0.096 * (0.55 + 0.45 * Math.min(1, Math.abs(y) / (length * 0.26)));
        const rn =
          0.096 * (0.55 + 0.45 * Math.min(1, Math.abs(yn) / (length * 0.26)));
        setInstance(
          fibre,
          i,
          axis(y) + Math.cos(angle) * r,
          y + 0.021 * Math.sin(angle * 2),
          Math.sin(angle) * r + 0.025,
          axis(yn) + Math.cos(next) * rn,
          yn + 0.021 * Math.sin(next * 2),
          Math.sin(next) * rn + 0.025,
          0.019,
        );
      }
      for (let i = 0; i < loops * 5; i++) {
        const t = (i + 0.5) / (loops * 5),
          y = from + (to - from) * t,
          a = t * TAU * loops,
          r =
            0.102 * (0.55 + 0.45 * Math.min(1, Math.abs(y) / (length * 0.26)));
        temp.position.set(
          axis(y) + Math.cos(a) * r,
          y + 0.021 * Math.sin(a * 2),
          Math.sin(a) * r + 0.025,
        );
        temp.rotation.set(0, a, 0.2 * Math.sin(i));
        temp.scale.set(0.032, 0.018, 0.024);
        temp.updateMatrix();
        nucleosomes.setMatrixAt(i, temp.matrix);
      }
      finish(fibre);
      finish(nucleosomes);
      for (const object of [fibre, nucleosomes]) {
        deformableInstances.push({
          object,
          original: object.instanceMatrix.array.slice(),
          isPath: object === fibre,
        });
      }
      return solid;
    }
    arm(-length * (options.telocentric ? 0.025 : 0.76), 0, group);
    arm(0, length * 0.69, group);
    const tip = arm(length * 0.69, length, distal);
    const centromere = k.ball(
      [bend * 0.15, 0, 0],
      [0.086, 0.092, 0.115],
      innerPlate,
      group,
    );
    centromere.name = "centromeric-chromatin";
    const kinetochore = new THREE.Group();
    kinetochore.name = "layered-kinetochore";
    group.add(kinetochore);
    const inner = k.ball(
      [0, 0, 0],
      [0.035, 0.118, 0.1],
      innerPlate,
      kinetochore,
    );
    const outer = k.ball(
      [0.042, 0, 0],
      [0.027, 0.145, 0.12],
      gold,
      kinetochore,
    );
    outer.name = "outer-kinetochore-plate";
    const rods = instances(
      narrowCylinder,
      gold,
      9,
      kinetochore,
      "outer-kinetochore-microtubule-interface",
    );
    for (let i = 0; i < 9; i++) {
      const a = (i * TAU) / 9;
      setInstance(
        rods,
        i,
        0.042,
        Math.cos(a) * 0.095,
        Math.sin(a) * 0.075,
        0.108,
        Math.cos(a) * 0.084,
        Math.sin(a) * 0.064,
        0.009,
      );
    }
    finish(rods);
    function orientKinetochore(direction, unattached = false) {
      kinetochore.position.set(direction * 0.09, 0, 0.04);
      kinetochore.rotation.y = direction < 0 ? Math.PI : 0;
      outer.material = unattached ? purple : gold;
    }
    const raycaster = new THREE.Raycaster();
    const rayOrigin = new THREE.Vector3(),
      rayTarget = new THREE.Vector3();
    function attachmentPoint() {
      outer.updateWorldMatrix(true, false);
      rayOrigin.set(2, 0, 0).applyMatrix4(outer.matrixWorld);
      rayTarget.set(0, 0, 0).applyMatrix4(outer.matrixWorld);
      raycaster.set(rayOrigin, rayTarget.sub(rayOrigin).normalize());
      const hit = raycaster.intersectObject(outer, false)[0];
      if (!hit)
        throw new Error("Kinetochore attachment ray missed its outer plate");
      return k.group.worldToLocal(hit.point);
    }
    const matrix = new THREE.Matrix4(),
      a = new THREE.Vector3(),
      z = new THREE.Vector3();
    function setDeflection(value) {
      if (value === lastDeflection) return;
      lastDeflection = value;
      deflection = value;
      for (const { geometry, original } of deformableSurfaces) {
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] = original[i] + displacement(original[i + 1]);
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
      }
      for (const { object, original, isPath } of deformableInstances) {
        for (let i = 0; i < object.count; i++) {
          matrix.fromArray(original, i * 16);
          if (isPath) {
            a.set(0, -0.5, 0).applyMatrix4(matrix);
            z.set(0, 0.5, 0).applyMatrix4(matrix);
            const radius = Math.hypot(
              matrix.elements[0],
              matrix.elements[1],
              matrix.elements[2],
            );
            setInstance(
              object,
              i,
              a.x + displacement(a.y),
              a.y,
              a.z,
              z.x + displacement(z.y),
              z.y,
              z.z,
              radius,
            );
          } else {
            matrix.elements[12] += displacement(matrix.elements[13]);
            object.setMatrixAt(i, matrix);
          }
        }
        finish(object);
      }
    }
    function axisPoint(y) {
      group.updateWorldMatrix(true, false);
      return k.group.worldToLocal(
        group.localToWorld(new THREE.Vector3(axis(y) + displacement(y), y, 0)),
      );
    }
    function setDistalMaterial(material) {
      distal.traverse((o) => {
        if (o.material) o.material = material;
      });
    }
    orientKinetochore(side);
    return {
      group,
      tip,
      tipCap: tip,
      kinetochore,
      orientKinetochore,
      attachmentPoint,
      axisPoint,
      setDeflection,
      exchangeY,
      setDistalMaterial,
      centromere,
      distal,
    };
  }
  function centrosome(parent = k.group) {
    const group = new THREE.Group();
    group.name = "centrosome-with-orthogonal-centriole-triplets";
    parent.add(group);
    for (let p = 0; p < 2; p++) {
      const barrel = new THREE.Group();
      group.add(barrel);
      barrel.position.set(p ? 0.12 : -0.08, p ? -0.1 : 0, 0);
      if (p) barrel.rotation.z = Math.PI / 2;
      const triplets = instances(
        narrowCylinder,
        gold,
        27,
        barrel,
        "nine-centriole-triplets",
      );
      for (let i = 0; i < 9; i++)
        for (let t = 0; t < 3; t++) {
          const a = (i * TAU) / 9;
          const x = Math.cos(a) * (0.105 + t * 0.021),
            z = Math.sin(a) * (0.105 + t * 0.021);
          setInstance(triplets, i * 3 + t, x, -0.2, z, x, 0.2, z, 0.017);
        }
      finish(triplets);
      for (const y of [-0.15, 0.15]) {
        const r = k.ring([0, y, 0], 0.116, 0.012, outline, barrel);
        r.rotation.x = Math.PI / 2;
      }
    }
    const matrix = k.ball(
      [0, 0, -0.035],
      [0.28, 0.31, 0.23],
      k.material("#a9b9a4", {
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
      group,
    );
    materials.add(matrix.material);
    return group;
  }
  function contractileRing(parent = k.group) {
    const g = new THREE.Group();
    g.name = "actomyosin-contractile-belt";
    parent.add(g);
    for (let j = 0; j < 3; j++) {
      const pts = [];
      for (let i = 0; i <= 100; i++) {
        const a = (i * TAU) / 100,
          r = 1 + (j - 1) * 0.024;
        pts.push([Math.cos(a) * r, Math.sin(a) * r, (j - 1) * 0.028]);
      }
      k.tube(pts, 0.013, j === 1 ? gold : outline, g, 100);
    }
    const motors = instances(
      beadGeometry,
      gold,
      28,
      g,
      "myosin-assemblies-in-contractile-ring",
    );
    for (let i = 0; i < 28; i++) {
      const a = (i * TAU) / 28;
      temp.position.set(Math.cos(a), Math.sin(a), 0.017);
      temp.rotation.set(0, 0, a);
      temp.scale.set(0.036, 0.014, 0.018);
      temp.updateMatrix();
      motors.setMatrixAt(i, temp.matrix);
    }
    finish(motors);
    return g;
  }
  function envelope(position, scale, parent = k.group) {
    const group = new THREE.Group();
    group.name = "nuclear-envelope-paired-membranes-cutaway";
    group.position.set(...position);
    group.scale.set(...scale);
    parent.add(group);
    const mats = [
      k
        .material("#b7a8c3", {
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
        .clone(),
      k
        .material("#d1c5d6", {
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
        .clone(),
    ];
    mats.forEach((m) => materials.add(m));
    for (let layer = 0; layer < 2; layer++) {
      const geo = new THREE.SphereGeometry(layer ? 0.95 : 1, 48, 32);
      const a = geo.attributes.position,
        indices = [];
      for (let i = 0; i < geo.index.count; i += 3) {
        const ids = [
          geo.index.array[i],
          geo.index.array[i + 1],
          geo.index.array[i + 2],
        ];
        const x = (a.getX(ids[0]) + a.getX(ids[1]) + a.getX(ids[2])) / 3,
          y = (a.getY(ids[0]) + a.getY(ids[1]) + a.getY(ids[2])) / 3,
          z = (a.getZ(ids[0]) + a.getZ(ids[1]) + a.getZ(ids[2])) / 3;
        let pore = false;
        for (let n = 0; n < 8; n++) {
          const an = (n * TAU) / 8;
          const px = Math.cos(an) * 0.64,
            py = Math.sin(an) * 0.64;
          if ((x - px) ** 2 + (y - py) ** 2 < 0.0065 && z < -0.5) pore = true;
        }
        if (z <= 0.035 && !pore) indices.push(...ids);
      }
      geo.setIndex(indices);
      mesh(geo, mats[layer], group);
      const rim = k.ring(
        [0, 0, 0],
        layer ? 0.95 : 1,
        0.012,
        mats[layer],
        group,
      );
      rim.name = "nuclear-envelope-cut-edge";
    }
    const poreMat = k.material("#8c789d");
    materials.add(poreMat);
    const pores = new THREE.Group();
    group.add(pores);
    for (let n = 0; n < 8; n++) {
      const a = (n * TAU) / 8,
        x = Math.cos(a) * 0.64,
        y = Math.sin(a) * 0.64,
        z = -Math.sqrt(1 - 0.64 * 0.64);
      const pore = k.ring([x, y, z], 0.084, 0.022, poreMat, pores);
      pore.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(x, y, z).normalize(),
      );
    }
    function reveal(t) {
      group.visible = t > 0.002;
      for (let i = 0; i < mats.length; i++)
        mats[i].opacity = (i ? 0.88 : 0.78) * t;
      pores.scale.setScalar(0.96 + 0.04 * t);
      pores.visible = t > 0.18;
      group.userData.assembly = t;
    }
    reveal(1);
    return { group, reveal };
  }
  function cell(rx, ry, rz, parent = k.group) {
    const group = new THREE.Group();
    group.name = "paired-cell-membrane-open-front";
    parent.add(group);
    const mats = [
      membrane.clone(),
      k.material("#dce7dd").clone(),
      outline.clone(),
    ];
    mats.forEach((m) => {
      m.transparent = true;
      m.depthWrite = false;
      materials.add(m);
    });
    const surfaces = [];
    for (let layer = 0; layer < 2; layer++) {
      const geometry = new THREE.SphereGeometry(1, 64, 40);
      const original = geometry.attributes.position.array.slice(),
        idx = [];
      for (let i = 0; i < geometry.index.count; i += 3) {
        const a = geometry.index.array[i],
          b = geometry.index.array[i + 1],
          c = geometry.index.array[i + 2];
        if (
          (original[a * 3 + 2] + original[b * 3 + 2] + original[c * 3 + 2]) /
            3 <=
          0
        )
          idx.push(a, b, c);
      }
      geometry.setIndex(idx);
      const m = mesh(geometry, mats[layer], group);
      m.name = layer ? "membrane-inner-leaflet" : "membrane-outer-leaflet";
      surfaces.push({ geometry, original, offset: layer ? 0.975 : 1 });
    }
    const edge = instances(
      narrowCylinder,
      mats[2],
      128,
      group,
      "cell-membrane-cut-edge",
    );
    function shape(pinch = 0, elongation = 1, axis = "x") {
      for (const { geometry, original, offset } of surfaces) {
        const arr = geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i += 3) {
          const x = original[i],
            y = original[i + 1],
            z = original[i + 2],
            axial = axis === "x" ? x : y,
            waist = 1 - pinch * Math.exp((-axial * axial) / 0.085);
          arr[i] = x * rx * (axis === "x" ? elongation : waist) * offset;
          arr[i + 1] = y * ry * (axis === "y" ? elongation : waist) * offset;
          arr[i + 2] = z * rz * waist * offset;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
      }
      for (let i = 0; i < 128; i++) {
        const a = (i * TAU) / 128,
          b = ((i + 1) * TAU) / 128,
          x = Math.cos(a),
          y = Math.sin(a),
          xx = Math.cos(b),
          yy = Math.sin(b),
          wa = 1 - pinch * Math.exp(-((axis === "x" ? x : y) ** 2) / 0.085),
          wb = 1 - pinch * Math.exp(-((axis === "x" ? xx : yy) ** 2) / 0.085);
        setInstance(
          edge,
          i,
          x * rx * (axis === "x" ? elongation : wa),
          y * ry * (axis === "y" ? elongation : wa),
          0,
          xx * rx * (axis === "x" ? elongation : wb),
          yy * ry * (axis === "y" ? elongation : wb),
          0,
          0.018,
        );
      }
      finish(edge);
    }
    function opacity(t) {
      group.visible = t > 0.001;
      mats[0].opacity = 0.76 * t;
      mats[1].opacity = 0.72 * t;
      mats[2].opacity = 0.9 * t;
    }
    shape();
    opacity(1);
    return { mesh: group, shape, opacity };
  }
  return {
    ...k,
    green,
    purple,
    gold,
    spindle,
    membrane,
    outline,
    nucleus,
    setSegment,
    line,
    bundle,
    setBundle,
    chromatid,
    centrosome,
    contractileRing,
    envelope,
    cell,
    materials,
  };
}
