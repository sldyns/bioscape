import { THREE, ease } from "../../kit.js";
import { molecularKit } from "./molecularDetail.js";

// Revolved membrane profiles share a literal boundary with the mother membrane.
// A cutaway removes the front half, retaining the continuous rear surface.
export function sporulationTopology(group) {
  const k = molecularKit(group),
    R = 1.12 * 0.925,
    capX = 2.05 * 0.925;
  const membrane = k.mat("#799d98", { side: THREE.DoubleSide });
  const innerMat = k.mat("#b0c5b4", { side: THREE.DoubleSide });
  const dnaMat = k.mat("#887b9d");
  const wallRadius = (x) =>
    Math.sqrt(Math.max(0, R * R - Math.max(0, Math.abs(x) - capX) ** 2));
  function surface(name, material) {
    const rows = 96,
      cols = 32,
      arr = new Float32Array((rows + 1) * (cols + 1) * 3),
      indices = [];
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++) {
        const a = i * (cols + 1) + j,
          b = a + cols + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    group.add(mesh);
    const allIndices = indices.slice();
    return {
      mesh,
      update(profile, holes = []) {
        for (let i = 0; i <= rows; i++) {
          const [x, r] = profile(i / rows);
          for (let j = 0; j <= cols; j++) {
            const phi = Math.PI + (j / cols) * Math.PI,
              n = (i * (cols + 1) + j) * 3;
            arr[n] = x;
            arr[n + 1] = r * Math.cos(phi);
            arr[n + 2] = r * Math.sin(phi);
          }
        }
        // Translocase apertures in the septal membranes, not DNA through lipid.
        const ix = geo.index.array;
        ix.set(allIndices);
        if (holes.length)
          for (let i = 0; i < ix.length; i += 3) {
            let blocked = false;
            for (let j = 0; j < 3; j++)
              for (const h of holes) {
                const n = allIndices[i + j] * 3;
                if (Math.hypot(arr[n + 1] - h[1], arr[n + 2] - h[2]) < 0.095)
                  blocked = true;
              }
            if (blocked) ix[i + 1] = ix[i + 2] = ix[i];
          }
        geo.index.needsUpdate = true;
        geo.attributes.position.needsUpdate = true;
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
      },
    };
  }
  const septum = surface("polar-septum-inward-annulus", membrane);
  const engulf = surface("mother-membrane-continuous-engulfment", membrane);
  const inner = surface("continuous-forespore-inner-membrane", innerMat);
  const copies = [0, 1].map((copy) =>
    [0, 1].map((strand) =>
      k.strand(192, dnaMat, `sporulation-chromosome-${copy}-strand-${strand}`),
    ),
  );
  const pores = [0, 1].map((i) => {
    const g = new THREE.Group();
    g.name = `septal-DNA-translocase-${i}`;
    group.add(g);
    for (let j = 0; j < 6; j++) {
      const a = (j * Math.PI) / 3;
      k.blob(
        g,
        k.mat("#bfa776"),
        [0, 0.105 * Math.cos(a), 0.105 * Math.sin(a)],
        [0.05, 0.038, 0.038],
      );
    }
    return g;
  });
  const a = new THREE.Vector3(),
    z = new THREE.Vector3(),
    mate = new THREE.Vector3(),
    mid = new THREE.Vector3();
  function update(p, partition, wrap, release, mature) {
    const cx = -0.4 - 1.45 * partition,
      ax = 1.8 - 1.32 * partition;
    // Two already replicated, closed chromosomes. One continuous copy moves
    // through the septum; no separately drawn transport fragment is added.
    function point(copy, t, strand, out) {
      const th = t * Math.PI * 2,
        tw = th * 16 + strand * Math.PI;
      const radial = 0.027 * Math.cos(tw),
        zz = 0.027 * Math.sin(tw);
      if (copy === 0)
        return out.set(
          0.9 + (0.94 + radial) * Math.cos(th),
          (0.31 + radial) * Math.sin(th),
          -0.17 + zz,
        );
      const compressed = 1 - 0.16 * mature;
      return out.set(
        cx + 1.45 * release + (ax + radial) * Math.cos(th) * compressed,
        (0.23 + radial) * Math.sin(th) * compressed,
        -0.17 + zz,
      );
    }
    for (let copy = 0; copy < 2; copy++)
      for (let strand = 0; strand < 2; strand++) {
        const s = copies[copy][strand];
        s.rail.visible =
          s.phosphates.visible =
          s.bases.visible =
            copy === 1 || p < 0.92;
        for (let i = 0; i < 192; i++) {
          point(copy, i / 192, strand, a);
          point(copy, (i + 1) / 192, strand, z);
          k.segment(s.rail, i, a, z, 0.013);
        }
        for (let i = 0; i < 64; i++) {
          const t = (i + 0.5) / 64;
          point(copy, t, strand, a);
          point(copy, t, 1 - strand, mate);
          k.bead(s.phosphates, i, a, 0.022);
          mid.copy(a).lerp(mate, 0.46);
          k.segment(s.bases, i, a, mid, 0.014, 0.025);
        }
        k.finish(s.rail, s.phosphates, s.bases);
      }
    const crossing = (-1.3 - cx) / ax,
      holes = [];
    if (p > 0.13 && p < 0.32 && Math.abs(crossing) < 1) {
      const yy = 0.23 * Math.sqrt(1 - crossing * crossing);
      holes.push([-1.3, yy, -0.17], [-1.3, -yy, -0.17]);
    }
    pores.forEach((g, i) => {
      g.visible = !!holes[i];
      g.position.set(...(holes[i] || [0, 0, 0]));
    });
    const close = ease(p, 0.13, 0.24),
      hole = R * (1 - close);
    septum.mesh.visible = p > 0.13 && p < 0.32;
    septum.update((t) => [-1.3, R + (hole - R) * t], holes);
    const shape = ease(p, 0.32, 0.43),
      center = -1.85 + 1.45 * release;
    inner.mesh.visible = p >= 0.24;
    inner.update(
      (t) => {
        let x, r;
        if (t < 0.3) {
          x = -1.34;
          r = (R * t) / 0.3;
        } else if (t < 0.55) {
          x = -1.34 + ((-capX + 1.34) * (t - 0.3)) / 0.25;
          r = R;
        } else {
          const th = Math.PI / 2 + (((t - 0.55) / 0.45) * Math.PI) / 2;
          x = -capX + R * Math.cos(th);
          r = R * Math.sin(th);
        }
        const targetX = center + 0.72 * 1.12 * Math.cos(Math.PI * t),
          targetR = 0.72 * Math.sin(Math.PI * t);
        return [x + (targetX - x) * shape, r + (targetR - r) * shape];
      },
      p < 0.32 ? holes : [],
    );
    engulf.mesh.visible = p >= 0.32;
    engulf.update((t) => {
      if (wrap === 1)
        return [
          center + 0.91 * 1.12 * Math.cos(Math.PI * t),
          0.87 * Math.sin(Math.PI * t),
        ];
      // A cup grows from the septum, with its lip continuously joined to
      // the mother membrane. At the last pole the neck radius reaches zero.
      const theta = Math.PI / 2 + (Math.PI / 2) * wrap;
      const bx = -1.3 + (-1.85 + 0.91 * 1.12 * Math.cos(theta) + 1.3) * shape;
      const br = 0.87 * Math.sin(theta);
      if (t < 0.8) {
        const q = t / 0.8,
          th = q * theta;
        const sx = -1.85 + 0.91 * 1.12 * Math.cos(th);
        return [
          -1.3 + (sx + 1.3) * shape,
          0.87 * Math.sin(th) * shape + q * 0.87 * (1 - shape),
        ];
      }
      const q = (t - 0.8) / 0.2;
      const lipR = 0.87 * (1 - shape) + br * shape;
      return [bx, lipR + (wallRadius(bx) - lipR) * q];
    });
  }
  return { update, materials: k.materials };
}
