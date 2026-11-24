import { THREE, clamp, ease } from "../../kit.js";
import {
  CALCIUM_SITE,
  TRPM_SITE,
  RELEASE,
  ROD_Y,
  TIP_Y,
  HALF_MEMBRANE,
  FUSION_PATCH,
  GATE_PATCH,
  VESICLE_RADIUS as R,
  RECEPTOR_X,
  RECEPTOR_Z,
  POCKETS,
  ribbonPoint,
} from "./rodRibbonAnatomy.js";

const TAU = Math.PI * 2,
  MOUTH = 0.112;
export const TOKENS_PER_VESICLE = 5;
// Two representative release lanes. All eight marked vesicles already exist at time zero.
export const EVENTS = [
  { at: 0.095, lane: 0, a: -0.47, h: 0.19, when: "any" },
  { at: 0.128, lane: 1, a: 0.46, h: 0.19, when: "any" },
  { at: 0.379, lane: 0, a: -0.62, h: 0.5, when: "dark" },
  { at: 0.475, lane: 1, a: 0.63, h: 0.5, when: "dark" },
  { at: 0.609, lane: 1, a: 0.32, h: 0.77, when: "any" },
  { at: 0.684, lane: 0, a: -0.28, h: 0.79, when: "dark" },
  { at: 0.841, lane: 0, a: -0.61, h: 1.065, when: "recovery" },
  { at: 0.875, lane: 1, a: 0.62, h: 1.065, when: "recovery" },
];
export const normalizeLight = (value) =>
  ["step", "dark", "light"].includes(value) ? value : "step";
function step(p, condition, onA, onB, offA, offB) {
  if (condition === "dark") return 0;
  return (
    ease(p, onA, onB) * (condition === "step" ? 1 - ease(p, offA, offB) : 1)
  );
}
export function signalAt(p, condition) {
  const hyper = step(p, condition, 0.29, 0.407, 0.745, 0.849);
  const ca = 0.87 - 0.76 * step(p, condition, 0.306, 0.427, 0.755, 0.845);
  const cleft = 0.91 - 0.73 * step(p, condition, 0.35, 0.505, 0.826, 0.94);
  const receptor = 0.92 - 0.82 * step(p, condition, 0.396, 0.535, 0.865, 0.955);
  const go = 0.89 - 0.77 * step(p, condition, 0.42, 0.568, 0.878, 0.972);
  const trpm = 0.13 + 0.75 * step(p, condition, 0.454, 0.61, 0.9, 0.985);
  const bipolar = 0.1 + 0.74 * step(p, condition, 0.49, 0.645, 0.916, 1);
  return {
    rodHyperpolarization: hyper,
    calciumDrive: ca,
    cleftGlutamate: cleft,
    mGluR6: receptor,
    go,
    trpm,
    bipolarDepolarization: bipolar,
  };
}
function driveAt(p, condition, rod) {
  if (!rod) return 0.13 + 0.75 * step(p, condition, 0.454, 0.61, 0.9, 0.985);
  const base = 0.87 - 0.76 * step(p, condition, 0.306, 0.427, 0.755, 0.845);
  // A residual opening shortly before the shared late release in maintained light.
  return Math.max(
    base,
    0.72 * ease(p, 0.568, 0.582) * (1 - ease(p, 0.603, 0.618)),
  );
}
function latheGeometry(rows, start = 0, span = TAU) {
  return new THREE.LatheGeometry(
    rows.map(([r, y]) => new THREE.Vector2(r, y)),
    48,
    start,
    span,
  );
}
function morphLathe(k, name, closed, open, mat, pos, start = 0, span = TAU) {
  const g = latheGeometry(closed, start, span),
    target = latheGeometry(open, start, span);
  g.morphAttributes.position = [target.attributes.position];
  const mesh = k.mesh(g, mat, pos);
  // Mesh() initializes morph influences from morph attributes present at construction.
  mesh.name = name;
  g.morphAttributes.normal = [target.attributes.normal];
  return mesh;
}
function collar(k, lane, mats) {
  const [x, z] = RELEASE[lane],
    t = HALF_MEMBRANE;
  const rows = (r) => [
    [FUSION_PATCH, t],
    [FUSION_PATCH * 0.81, t],
    [r, t],
    [r * 0.99, 0],
    [r, -t],
    [FUSION_PATCH * 0.81, -t],
    [FUSION_PATCH, -t],
  ];
  return morphLathe(
    k,
    "active-zone-fusion-collar-" + lane,
    rows(0),
    rows(MOUTH),
    mats.roof,
    [x, ROD_Y, z],
  );
}
function shellRows(open) {
  const low = open ? Math.asin(MOUTH / R) : 0;
  return Array.from({ length: 25 }, (_, i) => {
    const theta = low + ((Math.PI - low) * i) / 24;
    return [Math.sin(theta) * R, R * (Math.cos(low) - Math.cos(theta))];
  });
}
function controlledEvent(e, condition) {
  return (
    e.when === "any" ||
    (e.when === "dark" && condition === "dark") ||
    (e.when === "recovery" && condition !== "light")
  );
}
function fusionAt(delta) {
  return ease(delta, 0, 0.012) * (1 - ease(delta, 0.083, 0.098));
}
function buildGatedChannel(k, name, site, base, mats, kind) {
  const [x, z] = site,
    rod = kind === "rod";
  const frame = new THREE.Group();
  frame.name = name;
  frame.position.set(x, base, z);
  k.group.add(frame);
  const body = rod ? mats.calcium : mats.trpm,
    trim = rod ? mats.calciumRim : mats.trpmRim;
  const opening = 0.098;
  const profile = (r) => [
    [GATE_PATCH, 0.044],
    [0.137, 0.108],
    [r + 0.017, 0.105],
    [r, 0.036],
    [r, -0.043],
    [r + 0.012, -0.098],
    [0.138, -0.107],
    [GATE_PATCH, -0.036],
  ];
  const gate = morphLathe(
    k,
    name + "-pore",
    profile(0),
    profile(opening),
    body,
    [x, base, z],
  );
  // The extracellular vestibule stays patent. The barrier at y=0 narrows to zero.
  const barrier = (r) => [
    [0.132, 0.017],
    [r, 0.017],
    [r, -0.017],
    [0.132, -0.017],
  ];
  const iris = morphLathe(
    k,
    name + "-gate",
    barrier(0),
    barrier(opening),
    trim,
    [x, base, z],
  );
  const lobes = [];
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4 + 0.12;
    const lobe = k.ball(
      [0, 0, 0],
      [0.066 + 0.006 * (i % 2), 0.138, 0.068],
      trim,
      frame,
    );
    lobe.rotation.z = 0.17 * Math.cos(a);
    lobes.push({ lobe, a });
  }
  if (rod) k.ball([-0.156, 0.09, -0.045], [0.073, 0.091, 0.06], body, frame);
  function setOpen(amount) {
    gate.morphTargetInfluences[0] = amount;
    iris.morphTargetInfluences[0] = amount;
    for (const { lobe, a } of lobes)
      lobe.position.set(
        (0.108 + 0.049 * amount) * Math.cos(a),
        0,
        (0.108 + 0.049 * amount) * Math.sin(a),
      );
    iris.userData.radius = opening * amount;
  }
  return { gate, iris, frame, setOpen };
}
function receptorAndGo(k, mats) {
  const frame = new THREE.Group();
  frame.position.set(RECEPTOR_X, TIP_Y, RECEPTOR_Z);
  frame.name = "dendritic-mGluR6-dimer";
  k.group.add(frame);
  const lobes = [];
  for (const side of [-1, 1]) {
    // Two extracellular ligand-binding domains above two membrane-spanning bundles.
    const x = side * 0.1;
    for (let j = 0; j < 7; j++) {
      const a = (TAU * j) / 7;
      const helix = k.ball(
        [x + 0.038 * Math.cos(a), 0.015, 0.036 * Math.sin(a)],
        [0.02, 0.089, 0.023],
        mats.receptor,
        frame,
      );
      helix.rotation.z = 0.17 * Math.sin(a);
    }
    const stalk = k.ball(
      [x, 0.123, -0.009],
      [0.045, 0.081, 0.042],
      mats.receptor,
      frame,
    );
    stalk.rotation.z = -side * 0.12;
    const binding = k.ball(
      [x, 0.229, -0.04],
      [0.074, 0.096, 0.069],
      mats.receptor,
      frame,
    );
    binding.name = "mGluR6-binding-domain-" + side;
    const lobe = k.ball(
      [x, 0.219, 0.1],
      [0.068, 0.071, 0.046],
      mats.receptorLight,
      frame,
    );
    lobes.push({ lobe, side, binding });
  }
  const go = new THREE.Group();
  go.name = "membrane-associated-Go";
  go.position.set(-0.22, TIP_Y - 0.19, 0.19);
  k.group.add(go);
  const alpha = k.ball([0, 0, 0], [0.121, 0.096, 0.078], mats.go, go);
  alpha.name = "Go-alpha-domain";
  alpha.rotation.z = 0.23;
  const beta = k.ball(
    [0.12, -0.068, 0.012],
    [0.075, 0.067, 0.058],
    mats.goLight,
    go,
  );
  k.ball([0.164, -0.036, 0.022], [0.046, 0.035, 0.04], mats.go, go);
  k.segment([-0.03, 0.038, -0.015], [-0.06, 0.143, -0.012], 0.012, mats.go, go);
  function update(s) {
    for (const { lobe, side } of lobes) {
      lobe.position.z = 0.146 - 0.052 * s.mGluR6;
      lobe.rotation.x = 0.36 * (1 - s.mGluR6);
      lobe.rotation.z = side * 0.15 * (1 - s.mGluR6);
    }
    alpha.position.x = 0.025 - 0.055 * s.go;
    alpha.rotation.z = 0.07 + 0.31 * s.go;
    beta.position.x = 0.112 + 0.036 * s.go;
  }
  return { frame, alpha, binding: lobes[0].binding, update };
}
const seeds = [
  [-0.04, 0.06, 0.055],
  [0.052, 0.11, 0.045],
  [-0.063, 0.169, 0.012],
  [0.005, 0.214, 0.054],
  [0.07, 0.177, -0.025],
];
function tokenGeometry() {
  // An asymmetric, compact ligand glyph. Ions use single spherical glyphs.
  const g = new THREE.IcosahedronGeometry(1, 1),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    p.setXYZ(i, 0.034 * x, 0.023 * (y + 0.52 * x * x), 0.025 * z);
  }
  g.computeVertexNormals();
  return g;
}
const lerp = THREE.MathUtils.lerp;
function movingVesicles(k, mats) {
  const collars = RELEASE.map((_, i) => collar(k, i, mats));
  const poreLips = RELEASE.map(([x, z], i) => {
    const profile = (r) => [
      [r * 1.1, HALF_MEMBRANE + 0.002],
      [r, HALF_MEMBRANE + 0.002],
      [r, -HALF_MEMBRANE + 0.001],
    ];
    return morphLathe(
      k,
      "fusion-pore-inner-lip-" + i,
      profile(0),
      profile(MOUTH),
      mats.pore,
      [x, ROD_Y, z],
    );
  });
  const closed = shellRows(false),
    open = shellRows(true);
  const loaded = EVENTS.map((e, i) => {
    const home = ribbonPoint(e.a, e.h, 0.265),
      [x, z] = RELEASE[e.lane];
    home[1] -= R;
    const shell = morphLathe(
      k,
      "loaded-vesicle-" + i,
      closed,
      open,
      mats.shellVesicle,
      home,
      0.7,
      TAU - 1.36,
    );
    const tether = k.mesh(k.cylinder, mats.tether);
    tether.name = "tracked-vesicle-tether-" + i;
    return {
      e,
      i,
      shell,
      tether,
      home,
      base: [x, ROD_Y + HALF_MEMBRANE, z],
      released: false,
    };
  });
  const count = 1 + loaded.length * TOKENS_PER_VESICLE;
  const tokens = new THREE.InstancedMesh(tokenGeometry(), mats.gold, count);
  tokens.name = "glutamate-markers";
  k.group.add(tokens);
  tokens.frustumCulled = false;
  tokens.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const compartments = Array(count).fill("vesicle");
  tokens.userData.compartments = compartments;
  const ledger = { vesicle: 0, pore: 0, cleft: 0, receptor: 0, outside: 0 };
  const pose = new THREE.Object3D(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  function place(id, x, y, z, scale, compartment) {
    pose.position.set(x, y, z);
    pose.scale.setScalar(scale);
    pose.rotation.set(0, id * 1.7, 0.26 * Math.sin(id));
    pose.updateMatrix();
    tokens.setMatrixAt(id, pose.matrix);
    compartments[id] = compartment;
    ledger[compartment]++;
  }
  function leave(id, x, y, z, t, endX) {
    const u = ease(t, 0, 0.071),
      fade = 1 - ease(t, 0.054, 0.075);
    place(
      id,
      lerp(x, endX, u),
      lerp(y, -0.42, u) + 0.045 * Math.sin(Math.PI * u),
      lerp(z, 0.77, u),
      fade,
      fade > 0 ? "cleft" : "outside",
    );
  }
  function trajectory(item, j, p, condition, delta) {
    const { e, i, shell } = item,
      id = 1 + i * TOKENS_PER_VESICLE + j;
    const [x, z] = RELEASE[e.lane],
      seed = seeds[j],
      s = shell.position;
    const d = delta - 0.016 - j * 0.004;
    if (d < 0) {
      const u = ease(d, -0.015, 0);
      place(
        id,
        lerp(s.x + seed[0], x + 0.008 * (j - 2), u),
        lerp(s.y + seed[1], ROD_Y + 0.095, u),
        lerp(s.z + seed[2], z, u),
        1,
        "vesicle",
      );
      return;
    }
    if (d < 0.018) {
      const u = d / 0.018,
        y = lerp(ROD_Y + 0.095, ROD_Y - 0.125, u);
      const comp =
        y > ROD_Y + HALF_MEMBRANE
          ? "vesicle"
          : y >= ROD_Y - HALF_MEMBRANE
            ? "pore"
            : "cleft";
      place(id, x + 0.008 * (j - 2), y, z, 1, comp);
      return;
    }
    const pocket =
      j === 0 && i === 0
        ? 1
        : j === 0 && i >= 6 && condition === "step"
          ? i - 6
          : -1;
    if (pocket >= 0) {
      const [px, py, pz] = POCKETS[pocket];
      if (i === 0 && condition !== "dark" && p >= 0.425) {
        leave(id, px, py, pz, p - 0.425, 0.06);
        return;
      }
      const u = ease(d, 0.018, 0.085);
      place(
        id,
        lerp(x, px, u) + 0.027 * Math.sin(u * Math.PI),
        lerp(ROD_Y - 0.125, py, u),
        lerp(z, pz, u),
        1,
        u === 1 ? "receptor" : "cleft",
      );
      return;
    }
    const u = ease(d, 0.018, 0.098);
    const fade = 1 - ease(d, 0.08, 0.102);
    place(
      id,
      lerp(x, x + 0.21 * Math.sin(i + 2 * j), u),
      lerp(ROD_Y - 0.125, -0.35 - 0.047 * j, u),
      lerp(z, 0.72 + 0.07 * Math.cos(i + j), u),
      fade,
      fade > 0 ? "cleft" : "outside",
    );
  }
  function update(p, condition) {
    for (const key of Object.keys(ledger)) ledger[key] = 0;
    for (const c of collars) c.morphTargetInfluences[0] = 0;
    const [px, py, pz] = POCKETS[0];
    if (condition === "dark" || p < 0.397) place(0, px, py, pz, 1, "receptor");
    else leave(0, px, py, pz, p - 0.397, -0.61);
    let committed = 0;
    for (const item of loaded) {
      const { e, i, home, base, shell, tether } = item;
      const d = controlledEvent(e, condition) ? p - e.at : -2;
      const advance = ease(d, -0.082, -0.015),
        mouth = fusionAt(d),
        collapse = ease(d, 0.064, 0.098);
      const endSize = 1 - ease(d, 0.098, 0.102);
      shell.position.set(
        lerp(home[0], base[0], advance),
        lerp(home[1], base[1], advance),
        lerp(home[2], base[2], advance),
      );
      shell.morphTargetInfluences[0] = mouth;
      shell.scale.set(endSize, (1 - collapse) * endSize, endSize);
      shell.userData.phase =
        d >= 0.098
          ? "incorporated"
          : d > 0
            ? "fusing"
            : d >= -0.015
              ? "docked"
              : advance > 0
                ? "approaching"
                : "tethered";
      if (d > 0) {
        collars[e.lane].morphTargetInfluences[0] = Math.max(
          mouth,
          collars[e.lane].morphTargetInfluences[0],
        );
        committed++;
      }
      const attachment = ribbonPoint(e.a, lerp(e.h, 0.07, advance), 0.04);
      a.fromArray(attachment);
      b.copy(shell.position);
      b.y += R;
      b.sub(a);
      const length = Math.max(0, b.length() - R);
      b.normalize();
      tether.position.copy(a).addScaledVector(b, length * 0.5);
      const r = 0.014 * (1 - ease(d, -0.027, -0.012));
      tether.scale.set(r, length, r);
      tether.quaternion.setFromUnitVectors(up, b);
      for (let j = 0; j < TOKENS_PER_VESICLE; j++)
        trajectory(item, j, p, condition, d);
      item.released = d > 0;
    }
    for (let i = 0; i < collars.length; i++)
      poreLips[i].morphTargetInfluences[0] =
        collars[i].morphTargetInfluences[0];
    tokens.instanceMatrix.needsUpdate = true;
    return committed;
  }
  return { collars, loaded, tokens, ledger, update };
}
function ions(k, name, site, y, rod, mat) {
  const times = [];
  for (let i = -2; i <= 29; i++)
    times.push({ t: 0.035 * i + 0.003, value: (((i + 41) * 17) % 29) / 29 });
  if (rod) times.push({ t: 0.593, value: 0 });
  const m = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 15, 11),
    mat,
    times.length,
  );
  m.name = name;
  m.frustumCulled = false;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  k.group.add(m);
  const transform = new THREE.Object3D();
  m.userData.crossingTimes = times.map(({ t }) => t);
  function update(p, condition) {
    let passing = 0;
    for (let i = 0; i < times.length; i++) {
      const { t, value } = times[i],
        d = (p - t) / 0.037,
        drive = driveAt(t, condition, rod);
      const permitted = drive > 0.44 && value < drive;
      const u = clamp((d + 1) * 0.5),
        flank = Math.abs(d);
      const size =
        permitted && flank < 1 ? 0.036 * ease(1 - flank, 0, 0.22) : 0;
      const lateral = clamp((flank - 0.28) / 0.72) ** 2;
      transform.position.set(
        site[0] + 0.115 * Math.cos(2 * i) * lateral,
        y + (rod ? 1 : -1) * (u - 0.5) * 0.65,
        site[1] + 0.086 * Math.sin(3 * i) * lateral,
      );
      transform.scale.setScalar(size);
      transform.updateMatrix();
      m.setMatrixAt(i, transform.matrix);
      if (size > 0) passing++;
    }
    m.instanceMatrix.needsUpdate = true;
    return passing;
  }
  return { mesh: m, update };
}
function voltageMarks(k, mats) {
  const sets = [
    [[1.85, 0.47, 0.29], mats.charge],
    [[-0.3, -1.39, 0.32], mats.charge],
  ].map(([base, material], index) => {
    return Array.from({ length: 3 }, (_, i) => {
      const box = k.mesh(
        new THREE.CapsuleGeometry(0.015, 0.11, 4, 10),
        material,
        [base[0] + i * 0.065, base[1] - 0.114 * i, base[2]],
      );
      box.rotation.z = Math.PI * 0.5;
      box.name = (index ? "bipolar" : "rod") + "-relative-negativity-" + i;
      return box;
    });
  });
  function update(pre, post) {
    const variables = [0.2 + 0.76 * pre, 0.96 - 0.76 * post];
    sets.forEach((set, j) =>
      set.forEach((o, i) => {
        const size =
          i === 0
            ? 1
            : ease(variables[j], 0.18 + (i - 1) * 0.29, 0.53 + (i - 1) * 0.29);
        o.scale.set(size, size, size);
      }),
    );
  }
  return { sets, update };
}
export function signals(k, mats) {
  const cav = buildGatedChannel(k, "CaV1.4", CALCIUM_SITE, ROD_Y, mats, "rod");
  const trpm = buildGatedChannel(k, "TRPM1", TRPM_SITE, TIP_Y, mats, "bipolar");
  const receptor = receptorAndGo(k, mats),
    release = movingVesicles(k, mats);
  const calcium = ions(
    k,
    "presynaptic-calcium-markers",
    CALCIUM_SITE,
    ROD_Y,
    true,
    mats.calciumIon,
  );
  const cations = ions(
    k,
    "postsynaptic-cation-markers",
    TRPM_SITE,
    TIP_Y,
    false,
    mats.sodium,
  );
  const voltage = voltageMarks(k, mats);
  function update(p, condition) {
    const s = signalAt(p, condition);
    cav.setOpen(driveAt(p, condition, true));
    trpm.setOpen(s.trpm);
    receptor.update(s);
    voltage.update(s.rodHyperpolarization, s.bipolarDepolarization);
    s.committedVesicles = release.update(p, condition);
    s.calciumMarkers = calcium.update(p, condition);
    s.postsynapticMarkers = cations.update(p, condition);
    return s;
  }
  return { cav, trpm, receptor, release, calcium, cations, voltage, update };
}
