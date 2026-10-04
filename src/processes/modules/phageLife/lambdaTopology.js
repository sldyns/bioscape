import { THREE, clamp, ease } from "../../kit.js";
import { chromosome, lambdaTailPoints } from "./geometry.js";

// Mutable tube buffers retain the same meshes, material inventory and detailed
// duplex/base-pair/phosphate representation during molecular conversions.
function movingDuplex(k, parent, { samples = 360, pairs = 90, colors, name }) {
  const group = new THREE.Group();
  group.name = name;
  parent.add(group);
  const radial = 7,
    radius = 0.018,
    rail = 0.009,
    centers = Array.from({ length: samples + 1 }, () => new THREE.Vector3()),
    tangent = centers.map(() => new THREE.Vector3()),
    normals = centers.map(() => new THREE.Vector3()),
    rails = [
      centers.map(() => new THREE.Vector3()),
      centers.map(() => new THREE.Vector3()),
    ],
    meshes = [];
  for (let s = 0; s < 2; s++) {
    const geometry = new THREE.BufferGeometry(),
      positions = new Float32Array((samples + 1) * (radial + 1) * 3),
      normal = new Float32Array(positions.length),
      index = [];
    for (let i = 0; i < samples; i++)
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j,
          b = a + radial + 1;
        index.push(a, a + 1, b, b, a + 1, b + 1);
      }
    geometry.setIndex(index);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
    const mesh = k.mesh(geometry, k.material(colors[s]), [0, 0, 0], group);
    mesh.name = `${name}-backbone-${s}`;
    meshes.push(mesh);
  }
  const bases = new THREE.InstancedMesh(
      k.cylinder,
      k.material("#d7c9a9"),
      pairs,
    ),
    phosphates = new THREE.InstancedMesh(
      k.sphere,
      k.material(colors[0]),
      pairs * 2,
    );
  bases.name = `${name}-base-pairs`;
  phosphates.name = `${name}-phosphates`;
  group.add(bases, phosphates);
  const axis = new THREE.Vector3(),
    binormal = new THREE.Vector3(),
    n = new THREE.Vector3(),
    t = new THREE.Vector3(),
    radialNormal = new THREE.Vector3(),
    temporary = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    delta = new THREE.Vector3(),
    bounds = new THREE.Box3();
  function update(pointAt, { turns = 18, closed = false, endpoints } = {}) {
    for (let i = 0; i <= samples; i++) pointAt(i / samples, centers[i]);
    for (let i = 0; i <= samples; i++)
      tangent[i]
        .copy(centers[Math.min(samples, i + 1)])
        .sub(centers[Math.max(0, i - 1)])
        .normalize();
    normals[0].set(0, 0, 1).addScaledVector(tangent[0], -tangent[0].z);
    if (normals[0].lengthSq() < 0.001)
      normals[0].set(1, 0, 0).addScaledVector(tangent[0], -tangent[0].x);
    normals[0].normalize();
    for (let i = 1; i <= samples; i++) {
      normals[i].copy(normals[i - 1]);
      axis.crossVectors(tangent[i - 1], tangent[i]);
      const sine = axis.length();
      if (sine > 1e-8)
        normals[i].applyAxisAngle(
          axis.multiplyScalar(1 / sine),
          Math.atan2(sine, tangent[i - 1].dot(tangent[i])),
        );
    }
    for (let i = 0; i <= samples; i++) {
      const phase = (i / samples) * turns * Math.PI * 2;
      binormal.crossVectors(tangent[i], normals[i]);
      for (let s = 0; s < 2; s++) {
        const sign = s ? -1 : 1;
        rails[s][i]
          .copy(centers[i])
          .addScaledVector(normals[i], sign * radius * Math.cos(phase))
          .addScaledVector(binormal, sign * radius * Math.sin(phase));
      }
    }
    if (closed) for (let s = 0; s < 2; s++) rails[s][samples].copy(rails[s][0]);
    // The two DNA arms use exactly the same strand endpoints as the unchanged
    // host chromosome; the viral junctions use a common +/-Z contact frame.
    if (endpoints)
      for (let s = 0; s < 2; s++) {
        if (endpoints.start) rails[s][0].copy(endpoints.start[s]);
        if (endpoints.end) rails[s][samples].copy(endpoints.end[s]);
      }
    bounds.makeEmpty();
    for (let s = 0; s < 2; s++) {
      const position = meshes[s].geometry.attributes.position,
        normal = meshes[s].geometry.attributes.normal;
      for (let i = 0; i <= samples; i++) {
        t.copy(rails[s][Math.min(samples, i + 1)])
          .sub(rails[s][Math.max(0, i - 1)])
          .normalize();
        n.copy(normals[i]).addScaledVector(t, -normals[i].dot(t)).normalize();
        binormal.crossVectors(t, n).normalize();
        for (let j = 0; j <= radial; j++) {
          const a = (j * Math.PI * 2) / radial,
            index = i * (radial + 1) + j;
          radialNormal
            .copy(n)
            .multiplyScalar(Math.cos(a))
            .addScaledVector(binormal, Math.sin(a));
          position.setXYZ(
            index,
            rails[s][i].x + rail * radialNormal.x,
            rails[s][i].y + rail * radialNormal.y,
            rails[s][i].z + rail * radialNormal.z,
          );
          normal.setXYZ(index, radialNormal.x, radialNormal.y, radialNormal.z);
        }
        bounds.expandByPoint(rails[s][i]);
      }
      position.needsUpdate = normal.needsUpdate = true;
      meshes[s].geometry.computeBoundingBox();
      meshes[s].geometry.computeBoundingSphere();
    }
    for (let i = 0; i < pairs; i++) {
      const j = Math.round((i * samples) / (pairs - 1)),
        a = rails[0][j],
        b = rails[1][j];
      delta.copy(b).sub(a);
      temporary.position.copy(a).add(b).multiplyScalar(0.5);
      temporary.scale.set(rail * 0.64, delta.length(), rail * 0.64);
      temporary.quaternion.setFromUnitVectors(up, delta.normalize());
      temporary.updateMatrix();
      bases.setMatrixAt(i, temporary.matrix);
      for (let s = 0; s < 2; s++) {
        temporary.position.copy(rails[s][j]);
        temporary.scale.setScalar(rail * 1.45);
        temporary.quaternion.identity();
        temporary.updateMatrix();
        phosphates.setMatrixAt(i * 2 + s, temporary.matrix);
      }
    }
    for (const object of [bases, phosphates]) {
      object.instanceMatrix.needsUpdate = true;
      object.boundingBox ??= new THREE.Box3();
      object.boundingSphere ??= new THREE.Sphere();
      object.boundingBox.copy(bounds).expandByScalar(rail * 1.45);
      object.boundingBox.getBoundingSphere(object.boundingSphere);
    }
  }
  return { group, update, centers, rails, meshes };
}

function endpoint(mesh, index) {
  const p = mesh.geometry.attributes.position,
    result = new THREE.Vector3();
  for (let j = 0; j < 7; j++)
    result.add(new THREE.Vector3().fromBufferAttribute(p, index * 8 + j));
  return result.multiplyScalar(1 / 7);
}

// attB is represented by the common end of two host-DNA arms. Integration
// opens their shared junction while the same viral circle opens at attP.
export function lambdaChromosome(k, parent) {
  const chromosomeParts = chromosome(k, parent, k.material("#899e9b"), {
      openJunction: true,
    }),
    { group, mainDNA } = chromosomeParts,
    colors = ["#899e9b", "#b4c1b6"],
    left = movingDuplex(k, group, {
      samples: 72,
      pairs: 26,
      colors,
      name: "lambda-attB-left-arm",
    }),
    right = movingDuplex(k, group, {
      samples: 72,
      pairs: 26,
      colors,
      name: "lambda-attB-right-arm",
    }),
    hostLeft = mainDNA.meshes.map((mesh) => endpoint(mesh, 360)),
    hostRight = mainDNA.meshes.map((mesh) => endpoint(mesh, 0)),
    viralLeft = [new THREE.Vector3(), new THREE.Vector3()],
    viralRight = [new THREE.Vector3(), new THREE.Vector3()];
  function update(width) {
    for (let s = 0; s < 2; s++) {
      viralLeft[s].set(-width, 0.61, 0.08 + (s ? -0.018 : 0.018));
      viralRight[s].set(width, 0.61, 0.08 + (s ? -0.018 : 0.018));
    }
    left.update(
      (t, out) => {
        const a = -0.34 + 0.34 * t;
        out.set(
          1.78 * Math.sin(a) - width * ease(t, 0, 1),
          0.61 * Math.cos(a),
          0.08 + Math.sin(9 * a) * 0.095,
        );
      },
      { turns: 5, endpoints: { start: hostLeft, end: viralLeft } },
    );
    right.update(
      (t, out) => {
        const a = 0.34 * t;
        out.set(
          1.78 * Math.sin(a) + width * (1 - ease(t, 0, 1)),
          0.61 * Math.cos(a),
          0.08 + Math.sin(9 * a) * 0.095,
        );
      },
      { turns: 5, endpoints: { start: viralRight, end: hostRight } },
    );
  }
  return { group, update, left, right, viralLeft, viralRight };
}

export function lambdaGenome(
  k,
  parent,
  { headY = 2.292, headX = -0.35, headZ = 0.08, scale = 0.76 } = {},
) {
  const molecule = movingDuplex(k, parent, {
      colors: ["#ad82a9", "#c4a8c4"],
      name: "lambda-continuous-genome",
    }),
    coilPoints = Array.from({ length: 121 }, (_, i) => {
      const t = i / 120,
        a = t * Math.PI * 10,
        r = 0.125 * Math.sin(Math.PI * (0.06 + 0.94 * t));
      return new THREE.Vector3(
        headX + scale * r * Math.cos(a),
        headY + scale * (0.6 - 0.47 * t),
        headZ + scale * r * Math.sin(a),
      );
    }),
    coil = new THREE.CatmullRomCurve3(coilPoints),
    genomeLength = coil.getLength(),
    circleRadius = genomeLength / (Math.PI * 2),
    ringY = 0.61 + circleRadius,
    openSweep = Math.PI * 2 - 0.16,
    openRadius = genomeLength / openSweep,
    openStart = new THREE.Vector3(0, ringY - openRadius, 0.08),
    route = new THREE.CurvePath(),
    tailPoints = lambdaTailPoints.map(
      ([x, y, z]) =>
        new THREE.Vector3(
          headX + scale * x,
          headY + scale * y,
          headZ + scale * z,
        ),
    );
  route.add(coil);
  route.add(new THREE.LineCurve3(coilPoints.at(-1), tailPoints[0]));
  route.add(new THREE.CatmullRomCurve3(tailPoints));
  route.add(
    new THREE.CatmullRomCurve3([
      tailPoints.at(-1),
      new THREE.Vector3(headX + scale * 0.13, headY - scale * 1.08, headZ),
      new THREE.Vector3(headX + scale * 0.13, 1.24, headZ),
      new THREE.Vector3(-0.18, 0.78, 0.08),
      openStart,
    ]),
  );
  const beforeRing = route.getLength(),
    openRing = new THREE.Curve();
  openRing.getPoint = (t, out = new THREE.Vector3()) => {
    const a = -Math.PI / 2 - t * openSweep;
    return out.set(
      openRadius * Math.cos(a),
      ringY + openRadius * Math.sin(a),
      0.08,
    );
  };
  route.add(openRing);
  const routeLength = route.getLength(),
    routeSamples = 3000,
    routePoints = Array.from({ length: routeSamples + 1 }, (_, i) =>
      route.getPoint(i / routeSamples),
    ),
    last = new THREE.Vector3(),
    first = new THREE.Vector3(),
    startRails = [new THREE.Vector3(), new THREE.Vector3()],
    endRails = [new THREE.Vector3(), new THREE.Vector3()];
  // Preserves the circular DNA contour as the recombination junction separates.
  function radiusAt(width) {
    let low = circleRadius,
      high = circleRadius + width;
    for (let i = 0; i < 24; i++) {
      const r = (low + high) / 2,
        length = r * (Math.PI * 2 - 2 * Math.asin(width / r));
      if (length < genomeLength) low = r;
      else high = r;
    }
    return (low + high) / 2;
  }
  function update({
    entry = 1,
    circularize = 1,
    junction = 0,
    excised = 0,
  } = {}) {
    const width = 0.16 * clamp(junction),
      r = radiusAt(width),
      theta = Math.asin(width / r),
      cy = 0.61 + Math.sqrt(r * r - width * width) - 0.28 * excised;
    const pointAt = (t, out) => {
      if (entry < 1) {
        const u =
            ((beforeRing * entry + genomeLength * t) / routeLength) *
            routeSamples,
          i = Math.min(routeSamples - 1, Math.floor(u));
        return out.copy(routePoints[i]).lerp(routePoints[i + 1], u - i);
      }
      if (circularize < 1) {
        const angle = -Math.PI / 2 - t * openSweep,
          closedAngle = -Math.PI / 2 - t * Math.PI * 2;
        first.set(
          openRadius * Math.cos(angle),
          ringY + openRadius * Math.sin(angle),
          0.08,
        );
        last.set(
          circleRadius * Math.cos(closedAngle),
          ringY + circleRadius * Math.sin(closedAngle),
          0.08,
        );
        return out.copy(first).lerp(last, circularize);
      }
      const angle = -Math.PI / 2 - theta - t * (Math.PI * 2 - 2 * theta);
      return out.set(r * Math.cos(angle), cy + r * Math.sin(angle), 0.08);
    };
    const planar = entry === 1 && circularize === 1;
    if (planar) {
      pointAt(0, first);
      pointAt(1, last);
      for (let s = 0; s < 2; s++) {
        startRails[s].copy(first).z += s ? -0.018 : 0.018;
        endRails[s].copy(last).z += s ? -0.018 : 0.018;
      }
    }
    molecule.update(pointAt, {
      turns: 18,
      closed: planar && width === 0,
      endpoints: planar ? { start: startRails, end: endRails } : undefined,
    });
    return width;
  }
  return { ...molecule, update, genomeLength, circleRadius };
}
