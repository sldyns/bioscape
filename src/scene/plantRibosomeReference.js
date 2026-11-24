import * as T from "three";

const palette = {
  plant60S: { rna: "#879c98", protein: "#bfcbc3" },
  plant40S: { rna: "#ae9783", protein: "#d4c8b5" },
  mrna: { rna: "#457993" },
  trna: { rna: "#93768d" },
};

function centroid(chains, role) {
  const sum = new T.Vector3();
  let count = 0;
  for (const chain of chains) {
    if (chain.role !== role) continue;
    for (const [, x, y, z] of chain.residues) {
      sum.x += x;
      sum.y += y;
      sum.z += z;
      count++;
    }
  }
  return sum.divideScalar(count);
}

// Both subunits and all three ligand chains undergo this single rigid display
// rotation. x runs from LSU to SSU, and mRNA lies below the tRNA centroids.
function assemblyFrame(chains) {
  const large = centroid(chains, "plant60S");
  const small = centroid(chains, "plant40S");
  const origin = large.clone().lerp(small, 0.5);
  const x = small.sub(large).normalize();
  const y = centroid(chains, "trna").sub(centroid(chains, "mrna"));
  y.addScaledVector(x, -x.dot(y)).normalize();
  const z = new T.Vector3().crossVectors(x, y);
  return (row) => {
    const p = new T.Vector3(...row.slice(1)).sub(origin);
    return new T.Vector3(p.dot(x), p.dot(y), p.dot(z));
  };
}

// Smooth each uninterrupted deposited trace. Ring centers at residue markers
// are exact. The six-sided tube is shaded with radial normals.
function appendTrace(points, kind, role, cutDistance, buffer) {
  if (points.length < 2) return;
  const curve = new T.CatmullRomCurve3(points, false, "centripetal");
  const rings = (points.length - 1) * (kind === "rna" ? 2 : 1);
  const radius =
    role === "mrna" || role === "trna" ? 1.8 : kind === "rna" ? 1.5 : 1.2;
  const radial = 6;
  let previous = null;
  let lastBin = null;
  let lastBase;
  let normal = null;
  const tangent = new T.Vector3();
  const second = new T.Vector3();
  function ring(bin, center, n, b) {
    const base = bin.position.length / 3;
    for (let k = 0; k < radial; k++) {
      const a = (Math.PI * 2 * k) / radial;
      const c = Math.cos(a),
        s = Math.sin(a);
      const nx = n.x * c + b.x * s,
        ny = n.y * c + b.y * s,
        nz = n.z * c + b.z * s;
      bin.position.push(
        center.x + nx * radius,
        center.y + ny * radius,
        center.z + nz * radius,
      );
      bin.normal.push(nx, ny, nz);
    }
    return base;
  }
  function connect(a, b, cap) {
    const bin = buffer(role, kind, cap);
    const start = lastBin === bin ? lastBase : ring(bin, a.center, a.n, a.b);
    const end = ring(bin, b.center, b.n, b.b);
    for (let j = 0; j < radial; j++) {
      const k = (j + 1) % radial;
      bin.index.push(
        start + j,
        start + k,
        end + j,
        start + k,
        end + k,
        end + j,
      );
    }
    lastBin = bin;
    lastBase = end;
  }
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const center = curve.getPoint(t);
    // Use neighboring model samples, including around sharp RNA turns.
    const next = curve.getPoint(Math.min(1, t + 0.25 / rings));
    const before = curve.getPoint(Math.max(0, t - 0.25 / rings));
    tangent.subVectors(next, before).normalize();
    if (!normal || Math.abs(tangent.dot(normal)) > 0.98) {
      normal =
        Math.abs(tangent.z) < 0.85
          ? new T.Vector3(0, 0, 1)
          : new T.Vector3(0, 1, 0);
    }
    normal.addScaledVector(tangent, -tangent.dot(normal)).normalize();
    second.crossVectors(tangent, normal).normalize();
    const curr = {
      center,
      n: normal.clone(),
      b: second.clone(),
      d: cutDistance(center),
    };
    if (previous) {
      if (previous.d > 0 !== curr.d > 0) {
        const f = previous.d / (previous.d - curr.d);
        const mid = {
          center: previous.center.clone().lerp(center, f),
          n: previous.n.clone().lerp(curr.n, f).normalize(),
          b: previous.b.clone().lerp(curr.b, f).normalize(),
        };
        connect(previous, mid, previous.d > 0);
        connect(mid, curr, curr.d > 0);
      } else connect(previous, curr, curr.d > 0);
    }
    previous = curr;
  }
}

export function plantRibosomeReference(data) {
  const transform = assemblyFrame(data.chains);
  const chains = data.chains.map((c) => ({
    ...c,
    points: c.residues.map(transform),
  }));
  const bounds = new T.Box3(),
    ligandBounds = new T.Box3();
  for (const c of chains)
    for (const p of c.points) {
      bounds.expandByPoint(p);
      if (c.role === "mrna" || c.role === "trna") ligandBounds.expandByPoint(p);
    }
  const mid = ligandBounds.getCenter(new T.Vector3());
  const span = ligandBounds.getSize(new T.Vector3());
  // Remove the near wall of the intersubunit cleft only in the sectional view.
  // Keep endogenous ligands as coordinates, including both hybrid-site tRNAs.
  const window = (p) =>
    Math.min(
      p.z - (ligandBounds.min.z - 4),
      32 *
        (1 -
          ((p.x - mid.x) / (span.x * 0.67 + 15)) ** 2 -
          ((p.y - mid.y) / (span.y * 0.66 + 14)) ** 2),
    );
  const buffers = new Map(),
    anchors = {};
  function buffer(role, kind, cap) {
    const key = role + kind + cap;
    if (!buffers.has(key))
      buffers.set(key, {
        role,
        kind,
        cap,
        position: [],
        normal: [],
        index: [],
      });
    return buffers.get(key);
  }
  for (const c of chains) {
    const cut =
      c.role === "plant40S" || c.role === "plant60S" ? window : () => -1;
    let start = 0;
    for (let i = 0; i < c.points.length; i++) {
      const p = c.points[i];
      if (
        i &&
        (c.residues[i][0] !== c.residues[i - 1][0] + 1 ||
          p.distanceTo(c.points[i - 1]) > (c.kind === "rna" ? 12 : 6))
      ) {
        appendTrace(c.points.slice(start, i), c.kind, c.role, cut, buffer);
        start = i;
      }
      if (cut(p) < -3 || c.role === "mrna" || c.role === "trna") {
        if (!anchors[c.role] || p.z > anchors[c.role].z) anchors[c.role] = p;
      }
    }
    appendTrace(c.points.slice(start), c.kind, c.role, cut, buffer);
  }
  const g = new T.Group();
  for (const b of buffers.values()) {
    const mesh = new T.Mesh(
      new T.BufferGeometry(),
      new T.MeshPhysicalMaterial({
        color: palette[b.role][b.kind],
        roughness: 0.47,
        clearcoat: 0.17,
        side: T.DoubleSide,
      }),
    );
    mesh.geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(b.position, 3),
    );
    mesh.geometry.setAttribute(
      "normal",
      new T.Float32BufferAttribute(b.normal, 3),
    );
    mesh.geometry.setIndex(b.index);
    mesh.userData.hitId = b.role;
    mesh.userData.cap = b.cap;
    g.add(mesh);
  }
  const size = bounds.getSize(new T.Vector3());
  g.scale.setScalar(2.4 / Math.max(size.x, size.y, size.z));
  g.userData.partAnchors = Object.fromEntries(
    Object.entries(anchors).map(([k, p]) => [k, p.toArray()]),
  );
  return g;
}
