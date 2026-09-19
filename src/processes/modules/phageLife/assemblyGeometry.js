import { THREE } from "../../kit.js";
import {
  capsomerSites,
  instances,
  duplex,
  hollowCylinder,
  pocketDomain,
} from "./refinedGeometry.js";
export function cutawayHead(k, parent) {
  const group = new THREE.Group();
  parent.add(group);
  const raw = new THREE.IcosahedronGeometry(1.25, 1),
    pos = raw.attributes.position,
    panels = [];
  const shellMat = k.material("#9bb2bd", {
    side: THREE.DoubleSide,
    roughness: 0.6,
  });
  const rimMat = new THREE.LineBasicMaterial({
    color: "#698693",
    transparent: true,
    opacity: 0.6,
  });
  const clip = (polygon, axis, value, less) => {
    const out = [];
    for (let j = 0; j < polygon.length; j++) {
      const a = polygon[j],
        b = polygon[(j + 1) % polygon.length],
        da = (a[axis] - value) * (less ? 1 : -1),
        db = (b[axis] - value) * (less ? 1 : -1);
      if (da <= 0) out.push(a);
      if (da < 0 !== db < 0) {
        const t = da / (da - db);
        out.push(a.map((v, i) => v + (b[i] - v) * t));
      }
    }
    return out;
  };
  for (let i = 0; i < pos.count; i += 3) {
    let polygon = Array.from({ length: 3 }, (_, j) => [
      pos.getX(i + j),
      pos.getY(i + j) * 1.28,
      pos.getZ(i + j) * 0.91,
    ]);
    polygon = clip(clip(polygon, 2, 0.31, true), 1, -1.42, false);
    if (polygon.length < 3) continue;
    const vertices = [];
    for (let j = 1; j < polygon.length - 1; j++)
      vertices.push(...polygon[0], ...polygon[j], ...polygon[j + 1]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    const panel = k.mesh(geo, shellMat, [0, 0, 0], group);
    panel.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), rimMat));
    for (let j = 1; j < polygon.length - 1; j++)
      capsomerSites(
        k,
        panel,
        [polygon[0], polygon[j], polygon[j + 1]],
        k.material("#bbccd2"),
        { radius: 0.065 },
      );
    const inner = k.mesh(
      geo,
      k.material("#8ba3b0", { side: THREE.DoubleSide }),
      [0, 0, 0],
      panel,
    );
    inner.scale.setScalar(0.957);
    for (let j = 0; j < polygon.length; j++) {
      const a = polygon[j],
        b = polygon[(j + 1) % polygon.length];
      if ((a[2] > 0.309 && b[2] > 0.309) || (a[1] < -1.419 && b[1] < -1.419)) {
        const ai = a.map((v) => v * 0.957),
          bi = b.map((v) => v * 0.957),
          rim = new THREE.BufferGeometry();
        rim.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            [...a, ...b, ...ai, ...b, ...bi, ...ai],
            3,
          ),
        );
        rim.computeVertexNormals();
        k.mesh(
          rim,
          k.material("#758c99", { side: THREE.DoubleSide }),
          [0, 0, 0],
          panel,
        );
      }
    }
    panels.push(panel);
  }
  raw.dispose();
  const portal = new THREE.Group();
  group.add(portal);
  portal.position.y = -1.6;
  hollowCylinder(k, portal, 0.28, 0.13, 0.23, k.material("#a591aa"));
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6,
      g = new THREE.Group();
    portal.add(g);
    g.rotation.y = -a;
    k.ball([0.25, 0.025, 0], [0.095, 0.16, 0.08], k.material("#b19cae"), g);
    k.ball([0.31, 0.14, 0], [0.12, 0.065, 0.08], k.material("#bcaac0"), g);
    k.ball([0.2, -0.14, 0], [0.065, 0.12, 0.06], k.material("#8f7d99"), g);
    k.tube(
      [
        [0.3, 0.2, 0],
        [0.23, 0.06, 0.015],
        [0.19, -0.12, 0],
      ],
      0.022,
      k.material("#c9bace"),
      g,
      18,
    );
  }
  const scaffolding = new THREE.Group();
  group.add(scaffolding);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    k.tube(
      [
        [0.3 * Math.cos(a), -1.1, 0.3 * Math.sin(a)],
        [0.65 * Math.cos(a), -0.45, 0.65 * Math.sin(a)],
        [0.65 * Math.cos(a), 0.5, 0.65 * Math.sin(a)],
        [0.26 * Math.cos(a), 1.13, 0.26 * Math.sin(a)],
      ],
      0.07,
      k.material("#b5ac92"),
      scaffolding,
      28,
    );
  }
  const scaffoldNodes = [];
  for (let row = 0; row < 9; row++)
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + row * 0.17;
      scaffoldNodes.push({
        position: [0.59 * Math.cos(a), -0.9 + row * 0.22, 0.59 * Math.sin(a)],
        scale: [0.12, 0.1, 0.12],
      });
    }
  instances(
    k,
    scaffolding,
    k.sphere,
    k.material("#c1b89f"),
    scaffoldNodes,
    "scaffold-protein-domains",
  );
  const protease = pocketDomain(
    k,
    scaffolding,
    [0, 0.02, 0.48],
    [0.36, 0.34, 0.29],
    ["#9d8aad", "#b7a8be"],
  );
  const packedPoints = Array.from({ length: 161 }, (_, i) => {
    const t = i / 160,
      a = t * Math.PI * 18,
      r = 0.8 * Math.sin(Math.PI * t) ** 0.6;
    return [r * Math.cos(a), -1.35 + 2.62 * t, r * Math.sin(a)];
  });
  const packedDNA = duplex(k, group, packedPoints, {
    radius: 0.022,
    rail: 0.013,
    turns: 80,
    samples: 640,
    pairs: 230,
    name: "packaged-dsDNA-with-basepairs",
  });
  const genome = packedDNA.group;
  const neck = new THREE.Group();
  group.add(neck);
  neck.position.y = -1.78;
  [0, -0.17].forEach((y, j) => {
    const r = k.ring(
      [0, y, 0],
      0.235 - j * 0.035,
      0.065,
      k.material(j ? "#809993" : "#9b8eaa"),
      neck,
    );
    r.rotation.x = Math.PI / 2;
    const poses = [];
    for (let i = 0; i < (j ? 6 : 12); i++) {
      const a = (i * Math.PI * 2) / (j ? 6 : 12);
      poses.push({
        position: [
          (0.235 - j * 0.035) * Math.cos(a),
          y,
          (0.235 - j * 0.035) * Math.sin(a),
        ],
        scale: [0.069, 0.065, 0.064],
      });
    }
    instances(
      k,
      neck,
      k.sphere,
      k.material(j ? "#a8bbb1" : "#beafc6"),
      poses,
      j ? "gp14-seal-subunits" : "gp13-seal-subunits",
    );
  });
  return {
    group,
    panels,
    portal,
    scaffolding,
    protease,
    genome,
    setGenomeFraction: packedDNA.fraction,
    neck,
  };
}
export function assemblyTail(k, parent) {
  const group = new THREE.Group();
  parent.add(group);
  const base = k.mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.16, 6),
    k.material("#78959f"),
    [0, -2.18, 0],
    group,
  );
  const spike = k.mesh(
    new THREE.ConeGeometry(0.12, 0.43, 6),
    k.material("#a4aeb0"),
    [0, -2.48, 0],
    group,
  );
  spike.rotation.z = Math.PI;
  const tube = k.segment(
    [0, -2.12, 0],
    [0, 0, 0],
    0.085,
    k.material("#a7b4b5"),
    group,
  );
  tube.visible = false;
  const lumen = hollowCylinder(
    k,
    group,
    0.099,
    0.063,
    2.14,
    k.material("#b5bfaf"),
    [0, -1.06, 0],
  );
  const sheath = [];
  for (let j = 0; j < 18; j++) {
    const row = new THREE.Group();
    group.add(row);
    row.position.y = -2.06 + j * 0.112;
    const poses = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + j * 0.24;
      poses.push({
        position: [0.18 * Math.cos(a), 0, 0.18 * Math.sin(a)],
        scale: [0.098, 0.052, 0.068],
        rotation: [0, -a, 0],
      });
    }
    instances(
      k,
      row,
      k.sphere,
      k.material(j % 2 ? "#88a6ad" : "#a5bdc0"),
      poses,
      "helical-sheath-subunits",
    );
    sheath.push(row);
  }
  const fibers = new THREE.Group();
  group.add(fibers);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3,
      c = Math.cos(a),
      s = Math.sin(a);
    const wedge = pocketDomain(
      k,
      group,
      [c * 0.4, -2.17, s * 0.4],
      [0.25, 0.18, 0.2],
      ["#7e96a5", "#a0b1bf"],
    );
    wedge.rotation.y = -a;
    k.segment(
      [c * 0.39, -2.22, s * 0.39],
      [c * 0.64, -2.62, s * 0.64],
      0.04,
      k.material("#9aa7b6"),
      group,
    );
    k.ball([c * 0.4, -2.15, s * 0.4], 0.08, k.material("#8c9cad"), fibers);
    k.ball([c * 0.92, -2.35, s * 0.92], 0.065, k.material("#8c9cad"), fibers);
    k.ball(
      [c * 1.18, -3.03, s * 1.18],
      [0.07, 0.11, 0.07],
      k.material("#b2a3bc"),
      fibers,
    );
    k.tube(
      [
        [c * 0.4, -2.15, s * 0.4],
        [c * 0.92, -2.35, s * 0.92],
        [c * 1.18, -3.03, s * 1.18],
      ],
      0.032,
      k.material("#7896a1"),
      fibers,
      24,
    );
  }
  const terminator = k.ring(
    [0, 0.03, 0],
    0.2,
    0.065,
    k.material("#8e9da0"),
    group,
  );
  terminator.rotation.x = Math.PI / 2;
  return { group, base, spike, tube, lumen, sheath, fibers, terminator };
}
