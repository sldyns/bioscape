import * as THREE from "three";
import {
  helix,
  domain,
  instances,
  instanceWriter,
} from "./modules/plantSignals/structures.js";

const TAU = Math.PI * 2;
const v = (p) => new THREE.Vector3(...p);
const clamp = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const ramp = (p, a, b) => {
  const t = clamp((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function create() {
  const group = new THREE.Group();
  group.name = "photosynthesis-process";
  const membraneMaterials = [];
  const enzymeMaterials = [];
  const sphere = new THREE.SphereGeometry(1, 20, 14);
  const material = (color, options = {}) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.57,
      clearcoat: 0.1,
      clearcoatRoughness: 0.55,
      ...options,
    });
  const mesh = (parent, geometry, mat, position = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(...position);
    parent.add(m);
    return m;
  };
  const ball = (parent, position, scale, mat) => {
    const m = mesh(parent, sphere, mat, position);
    m.scale.set(...scale);
    return m;
  };
  const path = (parent, points, radius, mat) => {
    const curve = new THREE.CatmullRomCurve3(points.map(v));
    mesh(parent, new THREE.TubeGeometry(curve, 64, radius, 8, false), mat);
    return curve;
  };

  const k = {
    mesh: (geometry, mat, position = [0, 0, 0], parent = group) =>
      mesh(parent, geometry, mat, position),
    ball: (position, scale, mat, parent = group) =>
      ball(
        parent,
        position,
        Array.isArray(scale) ? scale : [scale, scale, scale],
        mat,
      ),
    tube: (points, radius, mat, parent = group) =>
      path(parent, points, radius, mat),
  };
  const instanceTool = instanceWriter();
  const lipidHead = material("#aab88d"),
    lipidTail = material("#b8bd95");
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);

  // A genuine open shell: both leaflets and the cut edge enclose a lumen.
  // The opening faces +Z. It is a viewing cut, not a biological aperture.
  const shell = (parent, radii, innerRadii, cut, outer, inner, port = null) => {
    const n = 72,
      m = 28;
    if (port) {
      // A side opening is part of the shell's topology. Clip the separate
      // anterior observation window in common unit coordinates, so both
      // leaflets retain corresponding boundaries and a real bilayer cut edge.
      const direction = v(port.direction),
        vertical = new THREE.Vector3(0, 1, 0),
        lateral = v(port.lateral),
        opening = 0.32,
        cutZ = Math.cos(cut);
      const unit = (theta, phi) =>
        direction
          .clone()
          .multiplyScalar(Math.cos(theta))
          .addScaledVector(vertical, Math.sin(theta) * Math.cos(phi))
          .addScaledVector(lateral, Math.sin(theta) * Math.sin(phi));
      const units = [],
        indices = [],
        lookup = new Map(),
        cutSegments = new Map();
      const key = (p) =>
        p
          .toArray()
          .map((x) => (Math.abs(x) < 1e-10 ? 0 : x).toFixed(11))
          .join(",");
      const indexOf = (p) => {
        const id = key(p);
        if (!lookup.has(id)) {
          lookup.set(id, units.length);
          units.push(p);
        }
        return lookup.get(id);
      };
      const triangle = (points) => {
        const polygon = [];
        for (let i = 0; i < points.length; i++) {
          const a = points[i],
            b = points[(i + 1) % points.length],
            insideA = a.z <= cutZ,
            insideB = b.z <= cutZ;
          if (insideA) polygon.push(a);
          if (insideA !== insideB)
            polygon.push(a.clone().lerp(b, (cutZ - a.z) / (b.z - a.z)));
        }
        if (polygon.length < 3) return;
        const cutPoints = polygon.filter((p) => Math.abs(p.z - cutZ) < 1e-9);
        if (
          cutPoints.length === 2 &&
          cutPoints[0].distanceTo(cutPoints[1]) > 1e-9
        )
          cutSegments.set(cutPoints.map(key).sort().join("/"), cutPoints);
        for (let i = 1; i + 1 < polygon.length; i++) {
          const a = polygon[0],
            b = polygon[i],
            c = polygon[i + 1];
          const outward =
            b
              .clone()
              .sub(a)
              .cross(c.clone().sub(a))
              .dot(a.clone().add(b).add(c)) >= 0;
          indices.push(
            indexOf(a),
            indexOf(outward ? b : c),
            indexOf(outward ? c : b),
          );
        }
      };
      for (let j = 0; j < m; j++)
        for (let i = 0; i < n; i++) {
          const t0 = opening + ((Math.PI - opening) * j) / m,
            t1 = opening + ((Math.PI - opening) * (j + 1)) / m,
            a = unit(t0, (i * TAU) / n),
            b = unit(t1, (i * TAU) / n),
            c = unit(t0, ((i + 1) * TAU) / n),
            d = unit(t1, ((i + 1) * TAU) / n);
          triangle([a, b, c]);
          triangle([b, d, c]);
        }
      const scaled = (p, r) => p.clone().multiply(v(r));
      for (const [r, mat, reverse, suffix] of [
        [radii, outer, false, "outer"],
        [innerRadii, inner, true, "inner"],
      ]) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            units.flatMap((p) => scaled(p, r).toArray()),
            3,
          ),
        );
        const order = indices.slice();
        if (reverse)
          for (let i = 0; i < order.length; i += 3)
            [order[i + 1], order[i + 2]] = [order[i + 2], order[i + 1]];
        geo.setIndex(order);
        geo.computeVertexNormals();
        mesh(parent, geo, mat).name = `${parent.name}-${suffix}-leaflet`;
      }
      const edgePositions = [],
        edgeIndices = [];
      for (const [a, b] of cutSegments.values()) {
        const offset = edgePositions.length / 3;
        edgePositions.push(
          ...scaled(a, radii),
          ...scaled(b, radii),
          ...scaled(a, innerRadii),
          ...scaled(b, innerRadii),
        );
        edgeIndices.push(
          offset,
          offset + 1,
          offset + 2,
          offset + 2,
          offset + 1,
          offset + 3,
        );
      }
      const edge = new THREE.BufferGeometry();
      edge.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(edgePositions, 3),
      );
      edge.setIndex(edgeIndices);
      edge.computeVertexNormals();
      mesh(parent, edge, outer).name = `${parent.name}-viewing-cut-edge`;
      return {
        parent,
        outer: Array.from({ length: n }, (_, i) =>
          scaled(unit(opening, (i * TAU) / n), radii),
        ),
        inner: Array.from({ length: n }, (_, i) =>
          scaled(unit(opening, (i * TAU) / n), innerRadii),
        ),
        tangents: (r) =>
          Array.from({ length: n }, (_, i) =>
            direction
              .clone()
              .multiplyScalar(Math.sin(opening))
              .addScaledVector(
                vertical,
                -Math.cos(opening) * Math.cos((i * TAU) / n),
              )
              .addScaledVector(
                lateral,
                -Math.cos(opening) * Math.sin((i * TAU) / n),
              )
              .multiply(v(r)),
          ),
        radii,
        innerRadii,
      };
    }
    const point = (r, theta, phi) => [
      r[0] * Math.sin(theta) * Math.cos(phi),
      r[1] * Math.sin(theta) * Math.sin(phi),
      r[2] * Math.cos(theta),
    ];
    for (const [r, mat, reverse] of [
      [radii, outer, false],
      [innerRadii, inner, true],
    ]) {
      const positions = [],
        indices = [];
      for (let j = 0; j <= m; j++)
        for (let i = 0; i <= n; i++)
          positions.push(
            ...point(r, cut + ((Math.PI - cut) * j) / m, (i / n) * TAU),
          );
      for (let j = 0; j < m; j++)
        for (let i = 0; i < n; i++) {
          const a = j * (n + 1) + i,
            b = a + n + 1;
          if (reverse) indices.push(a, a + 1, b, b, a + 1, b + 1);
          else indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geo.setIndex(indices);
      geo.computeVertexNormals();
      mesh(parent, geo, mat);
    }
    const positions = [],
      indices = [];
    for (let i = 0; i <= n; i++)
      for (const r of [radii, innerRadii])
        positions.push(...point(r, cut, (i / n) * TAU));
    for (let i = 0; i < n; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const rim = new THREE.BufferGeometry();
    rim.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    rim.setIndex(indices);
    rim.computeVertexNormals();
    mesh(parent, rim, outer);
  };

  const envelope = material("#acc3a0", { side: THREE.DoubleSide });
  const innerEnvelope = material("#d0dcc0", { side: THREE.DoubleSide });
  shell(
    group,
    [3.62, 1.79, 1.38],
    [3.56, 1.73, 1.32],
    1.05,
    envelope,
    innerEnvelope,
  );
  shell(
    group,
    [3.45, 1.62, 1.19],
    [3.4, 1.57, 1.14],
    1.07,
    material("#91ad84", { side: THREE.DoubleSide }),
    material("#e0e8ce", { side: THREE.DoubleSide }),
  );

  const membrane = material("#66875b", {
    side: THREE.DoubleSide,
    emissive: "#72974c",
    emissiveIntensity: 0,
  });
  const lumen = material("#9eb475", { side: THREE.DoubleSide });
  membraneMaterials.push(membrane);
  const thylakoids = new THREE.Group();
  thylakoids.name = "thylakoid-membranes-and-lumina";
  group.add(thylakoids);
  const bridgeDirection = new THREE.Vector3(
    1.09 / 0.83,
    0,
    -0.81 / 0.63,
  ).normalize();
  const bridgeLateral = new THREE.Vector3(
    -bridgeDirection.z,
    0,
    bridgeDirection.x,
  );
  const ports = [[], []];
  for (let stack = 0; stack < 2; stack++) {
    const granum = new THREE.Group();
    granum.position.set(
      stack ? -0.55 : -1.64,
      stack ? -0.05 : 0,
      stack ? -0.68 : 0.13,
    );
    granum.scale.setScalar(stack ? 0.64 : 1);
    thylakoids.add(granum);
    for (let i = 0; i < 5; i++) {
      const disc = new THREE.Group();
      disc.position.y = -0.59 + i * 0.29;
      granum.add(disc);
      const connection = i === 1 ? 0 : i === (stack ? 4 : 3) ? 1 : -1;
      disc.name = `thylakoid-${stack ? "destination" : "source"}-${i}`;
      const port = shell(
        disc,
        [0.83, 0.116, 0.63],
        [0.79, 0.071, 0.584],
        stack ? 0.38 : 0.95,
        membrane,
        lumen,
        connection >= 0
          ? {
              direction: bridgeDirection
                .clone()
                .multiplyScalar(stack ? -1 : 1)
                .toArray(),
              lateral: bridgeLateral.toArray(),
            }
          : null,
      );
      if (port) ports[connection][stack] = port;
      // Two phosphate leaflets and paired acyl tails at the exposed membrane cut.
      const cut = stack ? 0.38 : 0.95,
        n = 68;
      const heads = instances(
          disc,
          sphere,
          lipidHead,
          n * 2,
          "thylakoid-paired-lipid-heads",
        ),
        tails = instances(
          disc,
          cylinder,
          lipidTail,
          n * 4,
          "thylakoid-paired-lipid-tails",
        );
      for (let j = 0; j < n; j++) {
        const phi = (j / n) * TAU;
        const outer = [
          0.83 * Math.sin(cut) * Math.cos(phi),
          0.116 * Math.sin(cut) * Math.sin(phi),
          0.63 * Math.cos(cut),
        ];
        const inner = [
          0.79 * Math.sin(cut) * Math.cos(phi),
          0.071 * Math.sin(cut) * Math.sin(phi),
          0.584 * Math.cos(cut),
        ];
        instanceTool.bead(heads, j * 2, outer, 0.016);
        instanceTool.bead(heads, j * 2 + 1, inner, 0.016);
        for (let chain = 0; chain < 2; chain++) {
          const shift = (chain - 0.5) * 0.014,
            mid = outer.map(
              (v, a) => (v + inner[a]) * 0.5 + (a === 0 ? shift : 0),
            );
          instanceTool.segment(tails, j * 4 + chain * 2, outer, mid, 0.005);
          instanceTool.segment(tails, j * 4 + chain * 2 + 1, inner, mid, 0.005);
        }
      }
      instanceTool.finish(heads);
      instanceTool.finish(tails);
    }
  }
  // Two selected lamellae join actual side ports. The same ring coordinates
  // form the disc and lamella edges; no closed membrane remains across a lumen.
  thylakoids.updateWorldMatrix(true, true);
  for (let connection = 0; connection < ports.length; connection++) {
    const [a, b] = ports[connection],
      around = a.outer.length,
      rings = 24;
    for (const [layer, mat] of [
      ["outer", membrane],
      ["inner", lumen],
    ]) {
      const start = a[layer].map((p) =>
        p.clone().applyMatrix4(a.parent.matrixWorld),
      );
      const end = b[layer].map((p) =>
        p.clone().applyMatrix4(b.parent.matrixWorld),
      );
      const ta = a.tangents(layer === "outer" ? a.radii : a.innerRadii);
      const tb = b.tangents(layer === "outer" ? b.radii : b.innerRadii);
      const positions = [],
        indices = [];
      for (let j = 0; j <= rings; j++) {
        const t = j / rings,
          t2 = t * t,
          t3 = t2 * t;
        for (let i = 0; i < around; i++) {
          const length = start[i].distanceTo(end[i]) * 0.55;
          const p = start[i]
            .clone()
            .multiplyScalar(2 * t3 - 3 * t2 + 1)
            .addScaledVector(end[i], -2 * t3 + 3 * t2)
            .addScaledVector(
              ta[i].clone().normalize(),
              length * (t3 - 2 * t2 + t),
            )
            .addScaledVector(tb[i].clone().normalize(), -length * (t3 - t2));
          positions.push(...p);
          if (j < rings) {
            const x = j * around + i,
              y = j * around + ((i + 1) % around);
            if (layer === "outer")
              indices.push(x, x + around, y, y, x + around, y + around);
            else indices.push(x, y, x + around, y, y + around, x + around);
          }
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geo.setIndex(indices);
      geo.computeVertexNormals();
      mesh(thylakoids, geo, mat).name =
        `intergranal-lamella-${connection}-${layer}`;
    }
  }

  // Protein complexes occupy the unstacked membrane surface; schematic shapes
  // show the reaction sites, rather than an invented atom-by-atom structure.
  const complexMaterial = material("#819754", {
    emissive: "#a8ad4c",
    emissiveIntensity: 0,
  });
  membraneMaterials.push(complexMaterial);
  const antennaMat = material("#9cad71"),
    pigmentMat = material("#c4ba79"),
    coreMat = material("#65845d");
  membraneMaterials.push(antennaMat, coreMat);
  // PSII dimer with flanking light-harvesting antenna and lumen-side OEC cap.
  const psii = new THREE.Group();
  psii.name = "photosystem-II-dimer-with-antenna";
  psii.position.set(-2.03, 0.64, 0.11);
  group.add(psii);
  for (const sign of [-1, 1]) {
    domain(
      k,
      psii,
      [sign * 0.12, 0.06, 0],
      [0.38, 0.28, 0.42],
      complexMaterial,
      antennaMat,
    );
    for (let i = 0; i < 3; i++)
      helix(
        k,
        psii,
        [sign * 0.12 + (i - 1) * 0.04, -0.06, 0.055],
        [sign * 0.12 + (i - 1) * 0.04, 0.14, 0.055],
        0.014,
        coreMat,
        4,
      );
    domain(
      k,
      psii,
      [sign * 0.12, -0.066, 0.025],
      [0.25, 0.08, 0.26],
      lumen,
      antennaMat,
    );
    for (let a = 0; a < 3; a++) {
      const theta = (a / 3) * TAU;
      domain(
        k,
        psii,
        [sign * 0.26 + Math.cos(theta) * 0.04, 0.04, Math.sin(theta) * 0.13],
        [0.18, 0.24, 0.18],
        antennaMat,
        coreMat,
      );
    }
  }
  const pigments = instances(
    psii,
    sphere,
    pigmentMat,
    14,
    "PSII-antenna-pigment-sites",
  );
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    instanceTool.bead(
      pigments,
      i,
      [Math.cos(a) * 0.31, 0.11, Math.sin(a) * 0.15],
      0.019,
    );
  }
  instanceTool.finish(pigments);
  // PSI is placed on an exposed membrane margin, distinct from PSII.
  const psi = new THREE.Group();
  psi.name = "photosystem-I-with-LHCI-crescent";
  psi.position.set(-1.43, 0.64, 0.23);
  group.add(psi);
  domain(k, psi, [0, 0.05, 0], [0.56, 0.3, 0.5], coreMat, antennaMat);
  for (let i = 0; i < 4; i++) {
    const a = -1.3 + i * 0.8;
    domain(
      k,
      psi,
      [Math.cos(a) * 0.24, 0.03, Math.sin(a) * 0.2],
      [0.19, 0.22, 0.19],
      antennaMat,
      complexMaterial,
    );
  }
  domain(
    k,
    psi,
    [-0.02, 0.21, 0],
    [0.23, 0.2, 0.25],
    complexMaterial,
    pigmentMat,
  ); // stromal acceptor face
  const synthase = new THREE.Group();
  synthase.position.set(-1.14, 0.632, -0.13);
  synthase.name = "chloroplast-ATP-synthase";
  group.add(synthase);
  const synthaseMat = material("#a7a075", {
    emissive: "#ab9e4b",
    emissiveIntensity: 0,
  });
  const synthaseAlternate = material("#c6bc8e");
  membraneMaterials.push(synthaseMat);
  const rotor = new THREE.Group();
  synthase.add(rotor);
  // Membrane rotor ring and offset a-subunit; schematic size, not atomic geometry.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    helix(
      k,
      rotor,
      [Math.cos(a) * 0.09, -0.042, Math.sin(a) * 0.09],
      [Math.cos(a) * 0.09, 0.046, Math.sin(a) * 0.09],
      0.009,
      synthaseMat,
      3,
    );
  }
  domain(
    k,
    synthase,
    [0.135, -0.02, 0],
    [0.19, 0.2, 0.21],
    synthaseMat,
    synthaseAlternate,
  );
  mesh(
    rotor,
    new THREE.CylinderGeometry(0.026, 0.034, 0.26, 14),
    synthaseMat,
    [0, 0.15, 0],
  );
  const head = new THREE.Group();
  head.position.y = 0.31;
  synthase.add(head);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    domain(
      k,
      head,
      [Math.cos(a) * 0.105, 0, Math.sin(a) * 0.105],
      [0.23, 0.34, 0.22],
      i % 2 ? synthaseMat : synthaseAlternate,
      synthaseMat,
    );
  }
  path(
    synthase,
    [
      [0.15, -0.04, 0],
      [0.2, 0.16, -0.02],
      [0.17, 0.33, -0.02],
      [0.09, 0.4, 0],
    ],
    0.017,
    synthaseMat,
  ); // peripheral stator

  const cycleCenter = [1.34, -0.03, 0.21];
  const enzymeMat = material("#b99384", {
    emissive: "#c9a280",
    emissiveIntensity: 0,
  });
  enzymeMaterials.push(enzymeMat);
  const cycle = new THREE.Group();
  cycle.name = "stromal-reaction-sites";
  group.add(cycle);
  const enzymeAccent = material("#d0b59b"),
    enzymeShadow = material("#a38077");
  enzymeMaterials.push(enzymeAccent, enzymeShadow);
  // Recognizable Rubisco L8S8 assembly at the carbon-entry site.
  const rubisco = new THREE.Group();
  rubisco.name = "stromal-Rubisco-L8S8";
  rubisco.position.set(cycleCenter[0], cycleCenter[1] + 0.59, 0.16);
  rubisco.rotation.set(0.35, 0.2, 0.1);
  cycle.add(rubisco);
  for (const sign of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      domain(
        k,
        rubisco,
        [Math.cos(a) * 0.19, sign * 0.11, Math.sin(a) * 0.19],
        [0.4, 0.36, 0.35],
        enzymeMat,
        enzymeAccent,
      );
      domain(
        k,
        rubisco,
        [Math.cos(a + 0.12) * 0.17, sign * 0.3, Math.sin(a + 0.12) * 0.17],
        [0.22, 0.15, 0.22],
        enzymeAccent,
        enzymeShadow,
      );
    }
  // Separate multi-domain enzymes summarize reduction and RuBP regeneration;
  // the surrounding cycle arrows are explicitly an explanatory overlay.
  for (let i = 1; i < 3; i++) {
    const a = (i / 3) * TAU + Math.PI / 2,
      x = cycleCenter[0] + Math.cos(a) * 0.62,
      y = cycleCenter[1] + Math.sin(a) * 0.59;
    const site = new THREE.Group();
    site.position.set(x, y, 0.18);
    cycle.add(site);
    if (i === 1) {
      for (let j = 0; j < 4; j++) {
        const angle = (j / 4) * TAU;
        domain(
          k,
          site,
          [Math.cos(angle) * 0.16, Math.sin(angle) * 0.14, 0],
          [0.42, 0.4, 0.4],
          enzymeMat,
          enzymeAccent,
        );
      }
    } else {
      domain(
        k,
        site,
        [-0.12, 0, 0],
        [0.57, 0.51, 0.5],
        enzymeMat,
        enzymeAccent,
      );
      domain(
        k,
        site,
        [0.15, 0.02, 0],
        [0.5, 0.43, 0.47],
        enzymeShadow,
        enzymeAccent,
      );
      path(
        site,
        [
          [-0.05, 0.17, 0.11],
          [0.05, 0.21, 0.15],
          [0.16, 0.17, 0.1],
        ],
        0.025,
        enzymeAccent,
      );
    }
  }

  const flows = [];
  // Fine, directional guide paths are a diagram overlay, not physical tubes.
  const flow = (points, color, start, count = 2, radius = 0.043) => {
    const routeIndex = flows.length;
    const closed = v(points[0]).distanceTo(v(points.at(-1))) < 1e-8;
    const guideMat = material(color, {
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const curve = path(group, points, 0.011, guideMat);
    group.children.at(-1).name = `explanatory-flow-${routeIndex}-guide`;
    const markerMat = material(color, {
      emissive: color,
      emissiveIntensity: 0.2,
    });
    const packets = [];
    for (let i = 0; i < count; i++) {
      const packet = ball(
        group,
        points[0],
        [radius, radius, radius],
        markerMat,
      );
      packet.name = `explanatory-flow-${routeIndex}-packet-${i}`;
      packets.push(packet);
    }
    const arrow = mesh(
      group,
      new THREE.ConeGeometry(0.059, 0.15, 12),
      guideMat,
    );
    curve.getPoint(0.89, arrow.position);
    arrow.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      curve.getTangent(0.89),
    );
    flows.push({
      curve,
      guideMat,
      packets,
      start,
      radius,
      closed,
      scratch: new THREE.Vector3(),
    });
    return flows.at(-1);
  };

  flow(
    [
      [-2.75, 2.15, 0.28],
      [-2.4, 1.59, 0.27],
      [-2.01, 0.83, 0.11],
    ],
    "#c5aa49",
    0.12,
    3,
    0.047,
  );
  flow(
    [
      [-1.86, 2.02, 0.1],
      [-1.73, 1.42, 0.08],
      [-1.43, 0.87, 0.23],
    ],
    "#c5aa49",
    0.12,
    2,
    0.043,
  );
  flow(
    [
      [-3.14, -0.9, 0.6],
      [-2.73, -0.54, 0.57],
      [-2.31, -0.21, 0.39],
      [-1.91, 0.574, 0.135],
    ],
    "#6f9fac",
    0.3,
  );
  flow(
    [
      [-1.91, 0.574, 0.135],
      [-2.28, 0.6, 0.67],
      [-2.81, 0.72, 0.88],
      [-3.2, 1.16, 0.85],
    ],
    "#79a3aa",
    0.3,
  );
  // ATP and NADPH have distinct production sites before entering the same
  // stromal metabolic pool; NADPH is not a product of ATP synthase.
  flow(
    [
      [-1.14, 1.022, -0.13],
      [-0.8, 1.1, 0.1],
      [-0.25, 1.12, 0.3],
    ],
    "#b29152",
    0.48,
    1,
  );
  flow(
    [
      [-1.43, 0.87, 0.23],
      [-1.07, 1.2, 0.03],
      [-0.56, 1.26, 0.14],
      [-0.25, 1.12, 0.3],
    ],
    "#b29152",
    0.48,
    1,
  );
  flow(
    [
      [-0.25, 1.12, 0.3],
      [0.59, 1.01, 0.3],
      [1.31, 0.75, 0.23],
    ],
    "#b29152",
    0.48,
    3,
    0.055,
  );
  flow(
    [
      [2.92, 1.42, 0.48],
      [2.42, 1.03, 0.45],
      [1.93, 0.79, 0.4],
      [1.45, 0.56, 0.25],
    ],
    "#a98276",
    0.64,
  );
  const cyclePath = Array.from({ length: 37 }, (_, i) => {
    const a = Math.PI / 2 - (i / 36) * TAU;
    return [
      cycleCenter[0] + Math.cos(a) * 0.63,
      cycleCenter[1] + Math.sin(a) * 0.59,
      0.37,
    ];
  });
  flow(cyclePath, "#b78f7e", 0.64, 2);
  flow(
    [
      [1.85, -0.36, 0.36],
      [2.33, -0.49, 0.43],
      [2.77, -0.84, 0.58],
      [3.08, -1.1, 0.61],
    ],
    "#b18f5e",
    0.79,
    2,
    0.055,
  );
  flow(
    [
      [0.93, -0.58, 0.33],
      [0.3, -1.06, 0.47],
      [-0.42, -0.91, 0.49],
      [-1.01, -0.25, 0.44],
    ],
    "#9aab87",
    0.87,
    2,
  );

  const labels = [
    { position: [-2.1, 2.14, 0.1], text: { zh: "光", en: "Light" } },
    {
      position: [-2.1, -0.73, 0.49],
      text: {
        zh: "类囊体膜 · 光反应",
        en: "Thylakoid membrane · light reactions",
      },
    },
    {
      position: [-1.56, 0.04, 0.48],
      text: { zh: "类囊体腔", en: "Thylakoid lumen" },
    },
    {
      position: [-3.07, -1.01, 0.59],
      text: { zh: "H₂O → O₂", en: "H₂O → O₂" },
    },
    {
      position: [0.17, 1.22, 0.3],
      text: { zh: "ATP · NADPH", en: "ATP · NADPH" },
    },
    {
      position: [1.34, -0.03, 0.62],
      text: { zh: "基质 · 卡尔文循环", en: "Stroma · Calvin cycle" },
    },
    { position: [2.94, 1.5, 0.49], text: { zh: "CO₂", en: "CO₂" } },
    {
      position: [2.92, -1.17, 0.61],
      text: { zh: "G3P · 糖的前体", en: "G3P · sugar precursor" },
    },
    {
      position: [0.03, -1.25, 0.46],
      text: { zh: "ADP + Pi · NADP⁺", en: "ADP + Pi · NADP⁺" },
    },
  ];

  labels.push(
    {
      position: [-2.15, 1.01, 0.15],
      text: { zh: "光系统 II", en: "Photosystem II" },
      priority: 1,
    },
    {
      position: [-1.45, 0.39, 0.4],
      text: { zh: "光系统 I", en: "Photosystem I" },
      priority: 1,
    },
    {
      position: [-0.87, 0.84, 0.02],
      text: { zh: "ATP 合酶", en: "ATP synthase" },
      priority: 1,
    },
    {
      position: [1.34, 0.99, 0.2],
      text: { zh: "Rubisco", en: "Rubisco" },
      priority: 1,
    },
  );
  const labelPoint = new THREE.Vector3();
  const anchorObject = (index, object) =>
    object.getWorldPosition(labelPoint).toArray(labels[index].position);
  const anchorFlow = (index, route, at) => {
    flows[route].curve.getPoint(at, labelPoint);
    group.localToWorld(labelPoint).toArray(labels[index].position);
  };
  const update = (progress) => {
    const p = clamp(progress);
    const lightActivity = ramp(p, 0.1, 0.2);
    const carbonActivity = ramp(p, 0.62, 0.72);
    for (const mat of membraneMaterials)
      mat.emissiveIntensity = 0.13 * lightActivity;
    for (const mat of enzymeMaterials)
      mat.emissiveIntensity = 0.16 * carbonActivity;
    for (const f of flows) {
      const active = ramp(p, f.start, Math.min(f.start + 0.045, 1));
      f.guideMat.opacity = 0.07 + 0.48 * active;
      for (let i = 0; i < f.packets.length; i++) {
        const packet = f.packets[i];
        const distance = ((p - f.start) * 3.8 + i / f.packets.length + 10) % 1;
        // A finite pulse finishes at an open route's endpoint before a new
        // pulse starts upstream. Closed reaction loops retain constant extent.
        const pulse = f.closed
          ? 1
          : ramp(distance, 0, 0.09) * (1 - ramp(distance, 0.9, 1));
        const extent = active * pulse;
        packet.visible = extent > 0.001;
        f.curve.getPoint(distance, f.scratch);
        packet.position.copy(f.scratch);
        packet.scale.setScalar(extent * f.radius);
      }
    }
    rotor.rotation.y = TAU * 2 * ramp(p, 0.46, 1);
    // Leader endpoints identify the actual structure or explanatory route;
    // the shared annotation layer independently chooses each text position.
    anchorFlow(0, 0, 0.25);
    const labelledMembrane = thylakoids.children[0].children[2].children[0];
    labelPoint.fromBufferAttribute(
      labelledMembrane.geometry.attributes.position,
      20,
    );
    labelledMembrane.localToWorld(labelPoint).toArray(labels[1].position);
    thylakoids.children[0].children[2]
      .localToWorld(labelPoint.set(0, 0, 0.1))
      .toArray(labels[2].position);
    anchorObject(3, psii.children[12].children[0]);
    anchorFlow(4, 6, 0);
    group
      .localToWorld(labelPoint.fromArray(cycleCenter))
      .toArray(labels[5].position);
    anchorFlow(6, 7, 0.15);
    anchorFlow(7, 9, 0.84);
    anchorFlow(8, 10, 0.55);
    anchorObject(9, psii.children[0].children[0]);
    anchorObject(10, psi.children[0].children[0]);
    anchorObject(11, head.children[0].children[0]);
    anchorObject(12, rubisco.children[0].children[0]);
    // The first frame is an anatomical overview. Later flows remain concurrent;
    // seeking changes the explanation, never implies a dark-only Calvin cycle.
    group.userData.progress = p;
    group.userData.structuralDetail =
      "paired thylakoid leaflets and lumina; intergranal lamellae; PSII antenna dimer; PSI acceptor face; membrane rotor and stromal ATP synthase head; stromal Rubisco L8S8";
    group.userData.protonDirection = "thylakoid lumen to stroma";
    group.userData.carbonFixationCompartment = "stroma";
    group.userData.lightReactionsActive = lightActivity > 0;
    group.userData.carbonFixationActive = carbonActivity > 0;
  };
  update(0);
  return {
    group,
    update,
    camera: { position: [0.6, 2.45, 11.8], target: [0, 0.2, 0] },
    labels,
  };
}

export default {
  id: "photosynthesis",
  title: { zh: "光合作用", en: "Photosynthesis" },
  intro: {
    zh: "在类囊体膜与基质之间，追踪光能和碳的去向。时间线按讲解顺序展开；实际反应相互耦联、可同时进行。箭头与移动标记表示物质和能量的关系，不代表真实轨迹或数量。",
    en: "Trace light energy and carbon between thylakoid membranes and the stroma. This is an explanatory sequence: the reactions are coupled and can run concurrently. Arrows and moving markers represent relationships, not actual trajectories or molecular counts.",
  },
  duration: 24,
  stages: [
    {
      at: 0,
      title: { zh: "两个反应场所", en: "Two reaction sites" },
      description: {
        zh: "绿色薄囊是类囊体，内部为类囊体腔；周围是基质。光反应在类囊体膜上进行，卡尔文循环在基质中进行。剖开结构是为了观察内部。",
        en: "Green thylakoid sacs enclose the lumen; the surrounding fluid is the stroma. Light reactions occur at thylakoid membranes, while the Calvin cycle operates in the stroma. The cutaway reveals these spaces.",
      },
    },
    {
      at: 0.14,
      title: { zh: "捕获光能", en: "Capture light energy" },
      description: {
        zh: "类囊体膜上的光系统吸收光。光能驱动电子传递，为形成 NADPH 和合成 ATP 提供条件；图中的金色标记代表光能输入。",
        en: "Photosystems in thylakoid membranes absorb light. This drives electron transfer, enabling NADPH formation and ATP synthesis. Gold markers indicate incoming light energy.",
      },
    },
    {
      at: 0.32,
      title: {
        zh: "水提供电子，释放氧",
        en: "Water supplies electrons; oxygen is released",
      },
      description: {
        zh: "光系统 II 的水氧化反应提供电子，并产生 O₂ 和 H⁺。释放的氧来自水，不是 CO₂；类囊体腔侧积累的 H⁺ 有助于形成质子梯度。",
        en: "Water oxidation at photosystem II supplies electrons and produces O₂ and H⁺. The released oxygen comes from water, not CO₂. Proton accumulation in the lumen helps establish a gradient.",
      },
    },
    {
      at: 0.5,
      title: { zh: "把能量送到基质", en: "Supply the stroma" },
      description: {
        zh: "H⁺ 经 ATP 合酶从类囊体腔流向基质，推动 ATP 合成；NADPH 在膜的基质侧形成。ATP 提供能量，NADPH 提供还原力，供碳同化使用。",
        en: "Protons flow from the lumen to the stroma through ATP synthase, powering ATP production. NADPH forms on the stromal side. ATP supplies energy and NADPH supplies reducing power for carbon assimilation.",
      },
    },
    {
      at: 0.66,
      title: { zh: "在基质中固定碳", en: "Fix carbon in the stroma" },
      description: {
        zh: "卡尔文循环把 CO₂ 中的碳并入有机物，利用 ATP 与 NADPH 形成 G3P。部分 G3P 可用于合成糖；其余参与再生 CO₂ 的受体 RuBP。环形箭头表示反应循环，并非一圈实体结构。",
        en: "The Calvin cycle incorporates carbon from CO₂ into organic compounds and uses ATP and NADPH to form G3P. Some G3P supports sugar synthesis; the rest helps regenerate the CO₂ acceptor RuBP. The ring depicts reactions, not a physical structure.",
      },
    },
    {
      at: 0.88,
      title: { zh: "两组反应持续协作", en: "Keep the reactions coupled" },
      description: {
        zh: "ADP、无机磷酸 Pi 和 NADP⁺ 可再次用于光反应。卡尔文循环不直接吸收光，但依赖光反应供能；“暗反应”不意味着只在黑暗中发生。",
        en: "ADP, inorganic phosphate (Pi), and NADP⁺ can be reused by the light reactions. The Calvin cycle does not absorb light directly but depends on the light reactions: “light-independent” does not mean it occurs only in darkness.",
      },
    },
  ],
  sources: [
    {
      title: "Hahn et al. (2018) — Chloroplast ATP synthase, PDB 6FKF",
      url: "https://www.rcsb.org/structure/6FKF",
    },
    {
      title:
        "Shimoni et al. (2005) — Three-dimensional organization of thylakoid membranes",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1197436/",
    },
    {
      title:
        "OpenStax Biology 2e · 8.2 The Light-Dependent Reactions of Photosynthesis",
      url: "https://openstax.org/books/biology-2e/pages/8-2-the-light-dependent-reactions-of-photosynthesis",
    },
    {
      title:
        "OpenStax Biology 2e · 8.3 Using Light Energy to Make Organic Molecules",
      url: "https://openstax.org/books/biology-2e/pages/8-3-using-light-energy-to-make-organic-molecules",
    },
  ],
  create,
};
