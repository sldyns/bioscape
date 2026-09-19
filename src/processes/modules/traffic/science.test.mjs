import assert from "node:assert/strict";
import * as THREE from "three";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import endocytosis from "./endocytosisProcess.js";
import autophagy from "./autophagyProcess.js";
import secretion from "../../secretionProcess.js";
const point = (mesh, index) =>
  new THREE.Vector3()
    .fromBufferAttribute(mesh.geometry.attributes.position, index)
    .applyMatrix4(mesh.matrixWorld);
function state(s) {
  const result = [],
    seen = new Set();
  s.group.traverse((o) => {
    result.push([
      o.uuid,
      o.visible,
      ...o.position,
      ...o.scale,
      ...o.quaternion,
    ]);
    if (o.instanceMatrix) result.push(Array.from(o.instanceMatrix.array));
    if (o.geometry && !seen.has(o.geometry)) {
      seen.add(o.geometry);
      result.push(Array.from(o.geometry.attributes.position.array));
    }
    if (o.material)
      result.push(
        (Array.isArray(o.material) ? o.material : [o.material]).map((m) => [
          m.uuid,
          m.opacity,
          m.color?.getHex(),
        ]),
      );
  });
  return JSON.stringify(result);
}
function inventory(s) {
  const n = [],
    g = new Set(),
    m = new Set();
  s.group.traverse((o) => {
    n.push(o.uuid);
    if (o.geometry) g.add(o.geometry.uuid);
    if (o.material)
      for (const mat of Array.isArray(o.material) ? o.material : [o.material])
        m.add(mat.uuid);
  });
  return [n, [...g], [...m]];
}
for (const definition of [endocytosis, autophagy, secretion]) {
  const scene = definition.create(),
    resources = inventory(scene);
  for (const p of [
    0,
    0.12,
    0.19,
    0.2,
    0.34,
    0.395,
    0.42,
    0.65,
    0.67,
    0.71,
    0.76,
    0.79,
    0.8,
    0.89,
    0.9,
    0.963,
    0.992,
    1,
    NaN,
  ]) {
    scene.update(p);
    scene.group.updateMatrixWorld(true);
    assert.deepEqual(inventory(scene), resources);
    const bounds = new THREE.Box3()
      .setFromObject(scene.group)
      .getSize(new THREE.Vector3())
      .toArray();
    assert(bounds.every(Number.isFinite));
    assert(Math.max(...bounds) > 2 && Math.max(...bounds) < 20);
    const seen = new Set();
    scene.group.traverse((o) => {
      if (o.geometry && !seen.has(o.geometry)) {
        seen.add(o.geometry);
        for (const a of Object.values(o.geometry.attributes))
          assert(Array.from(a.array).every(Number.isFinite));
      }
      if (o.instanceMatrix)
        assert(Array.from(o.instanceMatrix.array).every(Number.isFinite));
    });
  }
  scene.update(0.76);
  const first = state(scene);
  scene.update(0.3);
  scene.update(0.76);
  assert.equal(state(scene), first);
  await build({
    entryPoints: [
      fileURLToPath(
        new URL(
          definition.id === "secretion"
            ? "../../secretionProcess.js"
            : `./${definition.id}Process.js`,
          import.meta.url,
        ),
      ),
    ],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
  });
  console.log(
    definition.id,
    "finite geometry, resource stability, deterministic seeks, esbuild PASS",
  );
}
// traffic-01: three receptor identities remain physically distinct in the fused membrane.
{
  const s = endocytosis.create(),
    receptors = s.group.children.filter((o) => o.name.startsWith("LDLR"));
  const profile = [
    [-0.61, 0],
    [-0.38, 0.65],
    [0.1, 0.96],
    [0.55, 0.91],
    [0.95, 0.62],
    [1.6, 0.85],
    [2.2, 1.05],
    [2.8, 0.96],
    [3.2, 0.57],
    [3.45, 0.23],
    [4.05, 0.2],
    [4.32, 0],
  ];
  for (let p = 0.67; p <= 1.001; p += 0.005) {
    s.update(p);
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++)
        assert(
          receptors[i].position.distanceTo(receptors[j].position) > 0.11,
          "receptors collapse",
        );
      const pos = receptors[i].position;
      let expected = 0;
      for (let j = 0; j < profile.length - 1; j++) {
        const [x, r] = profile[j],
          [xx, rr] = profile[j + 1];
        if (pos.x >= x && pos.x <= xx)
          expected = r + ((rr - r) * (pos.x - x)) / (xx - x);
      }
      assert(
        Math.abs(Math.hypot(pos.y + 1.25, pos.z) - expected) < 1e-8,
        "anchor leaves membrane profile",
      );
    }
  }
  console.log("traffic-01 separate membrane anchors PASS");
}
// traffic-02: actual opening precedes any cargo degradation; proteases wait outside.
{
  const s = autophagy.create(),
    inner = s.group.getObjectByName("inner-autophagosomal-membrane"),
    cargo = s.group.children.find((o) =>
      o.name.startsWith("damaged cytosolic"),
    ),
    enzymes = s.group.children.filter((o) => o.name.startsWith("cathepsin D")),
    fragments = s.group.children.filter(
      (o) => o.name === "short hydrolysis product peptide",
    );
  const skin = inner.children[0],
    ringCount = 65,
    around = 64;
  s.update(0.7);
  const before = enzymes.map((e) => e.position.clone());
  // Average the two leaflet locations to recover the physical opening midplane.
  const opening = () => {
    const a = point(inner.children[0], (ringCount - 1) * (around + 1) + 32),
      b = point(inner.children[1], (ringCount - 1) * (around + 1) + 32);
    return a.add(b).multiplyScalar(0.5);
  };
  s.group.updateMatrixWorld(true);
  assert(Math.abs(opening().z) < 0.04, "closed sphere expected");
  for (const p of [0.715, 0.74, 0.78, 0.799]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    assert(inner.visible);
    assert(
      Math.abs(opening().z) > 0.001,
      "inner membrane must have a real polar opening",
    );
    assert.equal(cargo.scale.x, 1);
    assert(fragments.every((f) => !f.visible));
    enzymes.forEach((e, i) => assert(e.position.distanceTo(before[i]) < 1e-9));
  }
  s.update(0.8);
  assert(!inner.visible);
  assert.equal(cargo.scale.x, 1);
  s.update(0.89);
  assert(!inner.visible);
  assert.equal(cargo.scale.x, 1);
  s.update(0.95);
  assert(cargo.scale.x < 1);
  assert(fragments.some((f) => f.visible));
  assert(!inner.visible);
  const envelope = s.group.getObjectByName("autolysosome-outer-membrane");
  const vertex = new THREE.Vector3();
  for (let p = 0.65; p <= 1.001; p += 0.01) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    const rings = [];
    for (let r = 0; r < 81; r++) {
      const q = point(envelope.children[0], r * 65 + 32)
        .add(point(envelope.children[1], r * 65 + 32))
        .multiplyScalar(0.5);
      rings.push([q.x, Math.hypot(q.y, q.z)]);
    }
    for (const enzyme of enzymes)
      enzyme.traverse((mesh) => {
        if (!mesh.geometry) return;
        const attr = mesh.geometry.attributes.position;
        for (let i = 0; i < attr.count; i++) {
          vertex.fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld);
          let radius = -1;
          for (let r = 0; r < 80; r++)
            if (vertex.x >= rings[r][0] && vertex.x <= rings[r + 1][0]) {
              const q =
                (vertex.x - rings[r][0]) / (rings[r + 1][0] - rings[r][0]);
              radius = rings[r][1] * (1 - q) + rings[r + 1][1] * q;
              break;
            }
          assert(
            Math.hypot(vertex.y, vertex.z) < radius - 0.025,
            `entire hydrolase must remain inside outer membrane at ${p}`,
          );
        }
      });
  }
  console.log(
    "traffic-02 opening/removal before enzyme access and cleavage PASS",
  );
}
// traffic-03/04/05: model geometry, not metadata.
{
  const s = secretion.create();
  s.update(0);
  s.group.updateMatrixWorld(true);
  const large = [],
    small = [];
  s.group.traverse((o) => {
    if (o.name === "ER-ribosome-large-subunit") large.push(o);
    if (o.name === "ER-ribosome-small-subunit") small.push(o);
  });
  assert.equal(large.length, 39);
  assert.equal(small.length, 39);
  large.forEach((o, i) =>
    assert(
      o.position.y < small[i].position.y,
      "small subunit incorrectly faces ER",
    ),
  );
  const er = s.group.children[0].children.find(
      (o) => o.name === "secretory-cisterna",
    ),
    active = s.group.children.find((o) => o.name === "secretory-cisterna");
  const incoming = s.group.getObjectByName("ER-carrier"),
    outgoing = s.group.getObjectByName("secretory-carrier");
  const erBridge = s.group.getObjectByName("continuous-ER-carrier-neck"),
    golgiBridge = s.group.getObjectByName("continuous-Golgi-carrier-neck");
  const close = (a, b, label) =>
    assert(a.distanceTo(b) < 2e-6, `${label}: seam gap ${a.distanceTo(b)}`);
  function seam(bridge, sac, carrier) {
    const body = sac.getObjectByName("cisterna-body"),
      sphere = carrier.getObjectByName("open-carrier-membrane");
    function edge(mesh, start, u) {
      const lo = Math.floor(u),
        hi = Math.min(Math.ceil(u), mesh === body ? 48 : 36);
      return point(mesh, start + lo).lerp(point(mesh, start + hi), u - lo);
    }
    // Every boundary point follows the actual polygon edge, including between
    // cardinal directions. The donor front half is the declared viewing cut.
    for (let j = 144; j <= 288; j++)
      close(
        point(bridge, j),
        edge(body, 22 * 49, (j - 144) / 3),
        "donor polygon ring",
      );
    for (let j = 0; j <= 288; j++)
      close(
        point(bridge, 12 * 289 + j),
        edge(sphere, 24 * 37, j / 8),
        "carrier polygon ring",
      );
  }

  for (const p of [0.125, 0.15, 0.195]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    assert(erBridge.visible);
    seam(erBridge, er, incoming);
  }
  for (const p of [0.345, 0.375, 0.395, 0.415]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    assert(golgiBridge.visible);
    seam(golgiBridge, active, incoming);
  }
  for (const p of [0.675, 0.71, 0.765]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    assert(golgiBridge.visible);
    seam(golgiBridge, active, outgoing);
  }
  const lipids = s.group.getObjectByName("persistent-carrier-membrane-lipids");
  assert(lipids);
  const ids = lipids.children.map((o) => o.uuid),
    counts = lipids.children.map((o) => o.count);
  for (const p of [0.85, 0.9, 0.95, 0.98, 1]) {
    s.update(p);
    assert(lipids.visible);
    assert.deepEqual(
      lipids.children.map((o) => o.uuid),
      ids,
    );
    assert.deepEqual(
      lipids.children.map((o) => o.count),
      counts,
    );
  }
  const shell = s.group.getObjectByName("continuous-fusion-shell"),
    triangle = new THREE.Triangle(),
    nearest = new THREE.Vector3(),
    ha = new THREE.Vector3(),
    hb = new THREE.Vector3(),
    hm = new THREE.Matrix4();
  for (const p of [0.9, 0.95, 0.965, 0.975, 0.98, 0.987, 0.991]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    const vertices = shell.geometry.attributes.position,
      index = shell.geometry.index,
      heads = lipids.children[0];
    for (let i = 0; i < heads.count; i += 2) {
      heads.getMatrixAt(i, hm);
      ha.setFromMatrixPosition(hm).applyMatrix4(heads.matrixWorld);
      heads.getMatrixAt(i + 1, hm);
      hb.setFromMatrixPosition(hm).applyMatrix4(heads.matrixWorld);
      ha.add(hb).multiplyScalar(0.5);
      let distance = Infinity;
      for (let t = 0; t < index.count; t += 3) {
        triangle.a
          .fromBufferAttribute(vertices, index.getX(t))
          .applyMatrix4(shell.matrixWorld);
        triangle.b
          .fromBufferAttribute(vertices, index.getX(t + 1))
          .applyMatrix4(shell.matrixWorld);
        triangle.c
          .fromBufferAttribute(vertices, index.getX(t + 2))
          .applyMatrix4(shell.matrixWorld);
        triangle.closestPointToPoint(ha, nearest);
        distance = Math.min(distance, nearest.distanceTo(ha));
      }
      assert(
        distance < 2e-6,
        `carrier lipid leaves actual fusion triangle at ${p}: ${distance}`,
      );
    }
  }
  s.update(1);
  s.group.updateMatrixWorld(true);
  const matrix = new THREE.Matrix4(),
    position = new THREE.Vector3();
  for (const child of lipids.children)
    for (let i = 0; i < child.count; i++) {
      child.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix).applyMatrix4(child.matrixWorld);
      assert(
        Math.abs(position.x - 2.98) < 0.02,
        "transferred lipid must remain at surface",
      );
    }
  console.log(
    "traffic-03 ER subunits, traffic-04 exact welded rings, traffic-05 persistent membrane identities PASS",
  );
}
