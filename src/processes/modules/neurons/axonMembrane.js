import { THREE, phase, smooth } from "../../kit.js";

const domainAngles = Array.from(
  { length: 4 },
  (_, i) => Math.PI * (0.25 + i * 0.5),
);
const tau = 2 * Math.PI;

function helix(center, turns, winding, thickness, segments, sides) {
  const path = Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments;
    const [x, y, z] = center(t);
    return new THREE.Vector3(
      x + winding * Math.cos(tau * turns * t),
      y,
      z + winding * Math.sin(tau * turns * t),
    );
  });
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(path),
    segments,
    thickness,
    sides,
    false,
  );
}

function bundle(geometry, material, poses, name, parent) {
  const mesh = new THREE.InstancedMesh(geometry, material, poses.length);
  const object = new THREE.Object3D();
  poses.forEach(
    ({ position, rotationY = 0, tilt = 0, scale = [1, 1, 1], shade }, i) => {
      object.position.fromArray(position);
      object.rotation.set(0, rotationY, tilt, "YXZ");
      object.scale.fromArray(scale);
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);
      if (shade) mesh.setColorAt(i, new THREE.Color(shade));
    },
  );
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

// Each of the four repeats contributes five outer spans and one pore-lining S6.
// Geometry is an explanatory cutaway. The lower S6 ends converge to occlude the
// axis or splay to leave a finite radius of water through both collars.
export function axonPores(k) {
  // Keep full resolution in the enlarged specimen. The small repeated sites
  // use the same axial/radial sampling as the original overview helix.
  function shell(segments, sides) {
    const outer = helix(
      (t) => [0, 0.61 * (t - 0.5), 0],
      7,
      0.01,
      0.0145,
      segments,
      sides,
    );
    const lining = (closed) =>
      helix(
        (t) => {
          // A common intracellular terminus keeps the interdomain linker attached.
          // The bundle crossing is just above it.
          const lowerGate =
            Math.exp(-(((t - 0.14) / 0.16) ** 2)) * smooth(phase(t, 0, 0.09));
          return [
            0.126 - (closed ? 0.119 : 0.008) * lowerGate,
            0.62 * (t - 0.5),
            0,
          ];
        },
        7,
        0.007,
        0.022,
        segments,
        sides,
      );
    return { outer, shut: lining(true), dilated: lining(false) };
  }
  const overviewShell = shell(72, 6),
    enlargedShell = shell(96, 8);
  const outerPoses = [],
    capPoses = [],
    innerPoses = [];
  for (const angle of domainAngles) {
    const c = Math.cos(angle),
      s = Math.sin(angle);
    for (const [r, side, tilt] of [
      [0.214, 0, 0.07],
      [0.19, -0.042, -0.045],
      [0.16, -0.035, 0.04],
      [0.185, 0.044, -0.055],
      [0.15, 0.045, 0.045],
    ]) {
      outerPoses.push({
        position: [r * c - side * s, 0, r * s + side * c],
        rotationY: -angle,
        tilt,
        shade: tilt > 0 ? "#ffffff" : "#b8c0c8",
      });
    }
    capPoses.push({
      position: [0.17 * c, 0.304, 0.17 * s],
      rotationY: -angle,
      scale: [0.066, 0.045, 0.08],
    });
    innerPoses.push({ position: [0, 0, 0], rotationY: -angle });
  }
  return (parent, position, type, enlarged = false) => {
    const { outer, shut, dilated } = enlarged ? enlargedShell : overviewShell;
    const sodium = type === "na";
    const group = new THREE.Group(),
      body = new THREE.Group();
    group.name = "four-domain transmembrane pore";
    group.userData.ion = sodium ? "Na+" : "K+";
    group.position.fromArray(position);
    parent.add(group);
    group.add(body);
    const protein = k.material(sodium ? "#637a93" : "#ac865b");
    const liningMaterial = k.material(sodium ? "#3f5874" : "#896031");
    const surrounds = bundle(
      outer,
      protein,
      outerPoses,
      "twenty outer transmembrane helices",
      body,
    );
    bundle(k.sphere, protein, capPoses, "four extracellular domain ends", body);
    const open = bundle(
      dilated,
      liningMaterial,
      innerPoses,
      "splayed S6 pore lining",
      body,
    );
    const gate = bundle(
      shut,
      liningMaterial,
      innerPoses,
      "constricted S6 pore lining",
      group,
    );
    return {
      group,
      surrounds,
      gate,
      setOpen(conducting) {
        open.visible = conducting;
        gate.visible = !conducting;
      },
    };
  };
}

// Both ends of the intracellular III-IV linker stay attached. The motif moves
// to a lateral pocket in the unavailable conformation, outside the ion axis.
export function sodiumInactivation(k, parent, channel) {
  const anchorMatrix = new THREE.Matrix4();
  function terminus(bundle, instance) {
    bundle.getMatrixAt(instance, anchorMatrix);
    return bundle.geometry.parameters.path
      .getPointAt(0)
      .applyMatrix4(anchorMatrix)
      .toArray();
  }
  const a = terminus(channel.gate, 0),
    b = terminus(channel.surrounds, 15);
  const pocket = [0.185, -0.225, 0.039];
  const tether = k.material("#786e85");
  const motif = k.material("#87566d");
  for (const [z, y] of [
    [0.011, -0.247],
    [0.067, -0.204],
  ]) {
    const lip = k.ball(
      [pocket[0] - 0.012, y, z],
      [0.04, 0.023, 0.025],
      k.material("#656a82"),
      parent,
    );
    lip.name = "Na lateral inactivation pocket lip";
  }
  function loop(name, path) {
    const part = new THREE.Group();
    part.name = name;
    parent.add(part);
    const chain = k.tube(path, 0.0145, tether, part, 44);
    chain.name = "Na III-IV linker backbone";
    const lobe = k.ball(path[2], [0.056, 0.031, 0.038], motif, part);
    lobe.name = "Na inactivation motif";
    return part;
  }
  const free = loop("Na undocked III-IV linker", [
    a,
    [0.155, -0.415, 0.134],
    [0.238, -0.492, 0.051],
    [0.228, -0.432, -0.072],
    b,
  ]);
  const docked = loop("Na docked III-IV linker", [
    a,
    [0.153, -0.268, 0.102],
    pocket,
    [0.166, -0.286, -0.054],
    b,
  ]);
  return (inactivated) => {
    free.visible = !inactivated;
    docked.visible = inactivated;
  };
}

export function cationMark(k) {
  const x = 0.5,
    w = 0.12;
  const perimeter = [
    [-w, x],
    [w, x],
    [w, w],
    [x, w],
    [x, -w],
    [w, -w],
    [w, -x],
    [-w, -x],
    [-w, -w],
    [-x, -w],
    [-x, w],
    [-w, w],
  ];
  const shape = new THREE.Shape(perimeter.map((p) => new THREE.Vector2(...p)));
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: "#fff9ed",
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  return (ion) => {
    const plus = k.mesh(geometry, material, [0, 0.25, 0.979], ion);
    plus.rotation.x = -0.25;
    plus.name = "positive ionic charge";
  };
}

export function localMembraneTime(progress, zone, enabled) {
  return enabled ? (progress - (0.14 + zone * 0.105)) / 0.21 : -1;
}

export function sodiumState(t) {
  if (t < 0) return "closed";
  if (t < 0.25) return "open";
  return t < 0.9 ? "inactivated" : "recovered";
}

export const potassiumOpen = (t) => t >= 0.22 && t < 0.69;

// Qualitative potential V_inside − V_outside, shown above the resting level.
// The trace is sampled along the axon at a single instant. Its small leading
// foot begins before the local Na gate opens. No mV or rate fit is implied.
function relativeVoltage(t) {
  if (t <= -0.15 || t >= 0.69) return 0;
  if (t < 0) return 0.16 * smooth(phase(t, -0.15, 0));
  if (t < 0.24) return 0.16 + 0.84 * smooth(phase(t, 0, 0.24));
  return 1 - smooth(phase(t, 0.24, 0.69));
}

export function spatialVoltage(k, zoneX, selected, samples) {
  const steps = 120,
    z = 0.34,
    baseY = -1.78,
    height = 0.8,
    half = 0.025;
  const x = Array.from({ length: steps + 1 }, (_, i) => zoneX((5 * i) / steps));
  const voltages = new Float64Array(steps + 1);
  const positions = new Float32Array((steps + 1) * 9);
  const geometry = new THREE.BufferGeometry();
  const areas = [],
    strokes = [];
  for (let i = 0; i < steps; i++) {
    const j = i * 3;
    areas.push(j, j + 3, j + 1, j + 1, j + 3, j + 4);
    strokes.push(j + 1, j + 4, j + 2, j + 2, j + 4, j + 5);
  }
  geometry.setIndex([...areas, ...strokes]);
  geometry.addGroup(0, areas.length, 0);
  geometry.addGroup(areas.length, strokes.length, 1);
  const vertices = new THREE.BufferAttribute(positions, 3).setUsage(
    THREE.DynamicDrawUsage,
  );
  geometry.setAttribute("position", vertices);
  const fill = new THREE.MeshBasicMaterial({
    color: "#9fa8ba",
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const ink = new THREE.MeshBasicMaterial({
    color: "#455975",
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const trace = k.mesh(geometry, [fill, ink]);
  trace.name = "spatial membrane potential profile";
  const axis = k.material("#8f928d");
  k.segment(
    [x[0] - 0.17, baseY, z - 0.02],
    [x[steps] + 0.17, baseY, z - 0.02],
    0.012,
    axis,
  );
  for (const zone of samples) {
    k.segment(
      [zoneX(zone), baseY - 0.1, z - 0.02],
      [zoneX(zone), baseY, z - 0.02],
      0.011,
      axis,
    );
  }
  const probe = k.ball(
    [zoneX(selected), baseY, z + 0.012],
    0.06,
    k.material("#b59157"),
  );
  probe.name = "fixed voltage sample on spatial trace";
  // Bounded for all teaching poses, including backward seeks and trace reset.
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(x[0] - half, baseY - half, z),
    new THREE.Vector3(x[steps] + half, baseY + height + half, z),
  );
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(
    new THREE.Sphere(),
  );
  let flatLastFrame = false;
  return {
    probe,
    update(p, enabled) {
      const flat =
        !enabled ||
        localMembraneTime(p, 0, true) <= -0.15 ||
        localMembraneTime(p, 5, true) >= 0.69;
      if (flat && flatLastFrame) return;
      flatLastFrame = flat;
      for (let i = 0; i <= steps; i++)
        voltages[i] = relativeVoltage(
          localMembraneTime(p, (5 * i) / steps, enabled),
        );
      for (let i = 0; i <= steps; i++) {
        const prev = Math.max(0, i - 1),
          next = Math.min(steps, i + 1);
        const dx = x[next] - x[prev],
          dy = height * (voltages[next] - voltages[prev]);
        const inv = half / Math.hypot(dx, dy),
          nx = -dy * inv,
          ny = dx * inv;
        const v = 3 * i,
          y = baseY + height * voltages[i];
        vertices.setXYZ(v, x[i], baseY, z);
        vertices.setXYZ(v + 1, x[i] - nx, y - ny, z);
        vertices.setXYZ(v + 2, x[i] + nx, y + ny, z);
      }
      vertices.needsUpdate = true;
      probe.position.y = baseY + height * voltages[(selected * steps) / 5];
    },
  };
}
