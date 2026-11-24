import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { build } from "esbuild";
import * as THREE from "three";
import { mitochondriaDetail } from "../src/scene/mitochondriaDetails.js";

// Bundle the app's extensionless scene imports in memory and retain the same
// Three runtime as the geometry probes.
const compiled = await build({
  stdin: {
    contents: `
      export { detailModel } from "./src/scene/detailModels.js";
      export { lysosomeAssembly, protonPump } from "./src/scene/lysosomeDetails.js";
      export { peroxisomeAssembly } from "./src/scene/peroxisomeDetails.js";
      export { erDetail } from "./src/scene/erDetails.js";
    `,
    resolveDir: new URL("../", import.meta.url).pathname,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  logLevel: "silent",
  plugins: [
    {
      name: "shared-three-runtime",
      setup(builder) {
        builder.onResolve({ filter: /^three(?:\/.*)?$/ }, ({ path }) => ({
          path: import.meta.resolve(path),
          external: true,
        }));
      },
    },
  ],
});
const {
  detailModel,
  lysosomeAssembly,
  peroxisomeAssembly,
  protonPump,
  erDetail,
} = await import(
  `data:text/javascript,${encodeURIComponent(compiled.outputFiles[0].text)}`
);
const lysosome = lysosomeAssembly();
const peroxisome = peroxisomeAssembly();
lysosome.updateMatrixWorld(true);
peroxisome.updateMatrixWorld(true);

function extrema(mesh, signedDistance) {
  const position = mesh.geometry.attributes.position;
  const point = new THREE.Vector3();
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    const value = signedDistance(point);
    assert(Number.isFinite(value), "membrane distances must remain finite");
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max };
}

function lysosomeRadius(point) {
  const n = point.clone().normalize();
  return 1 + 0.035 * n.x * n.y + 0.022 * Math.sin(n.z * 4) * n.x;
}
function peroxisomeRadiusCoordinate(point) {
  // Undo the displayed ellipsoid, then its direction-dependent radial bulge.
  const p = point.clone();
  p.y /= 1.06;
  p.z /= 0.94;
  const n = p.clone().normalize();
  return p.length() / (1 + 0.025 * Math.sin(n.x * 4) * n.y);
}

function checkSpanning(domains, inside, outside, label) {
  for (const [index, domain] of domains.entries()) {
    assert(
      extrema(domain, inside).min < -0.001,
      `${label} domain ${index}: the membrane domain must cross the lumen-facing membrane surface`,
    );
    assert(
      extrema(domain, outside).max > 0.001,
      `${label} domain ${index}: the membrane domain must cross the cytosolic membrane surface`,
    );
  }
}

test("lysosomal V0 spans both bilayer faces while V1 stays cytosolic", () => {
  const pumps = lysosome.children.filter(
    (o) =>
      o.isGroup && o.children.some((m) => m.geometry?.type === "TorusGeometry"),
  );
  assert.equal(pumps.length, 3, "check every overview pump");
  for (const pump of pumps) {
    const membraneDomains = pump.children.filter(
      (m) =>
        m.geometry?.type === "CylinderGeometry" &&
        m.material.color.getHexString() === "8faab0",
    );
    const heads = pump.children.filter(
      (m) => m.geometry?.type === "SphereGeometry",
    );
    assert.equal(membraneDomains.length, 8);
    assert.equal(heads.length, 6);
    checkSpanning(
      membraneDomains,
      (p) => p.length() - 0.935 * lysosomeRadius(p),
      (p) => p.length() - lysosomeRadius(p),
      "lysosomal V0",
    );
    for (const head of heads)
      assert(
        extrema(head, (p) => p.length() - lysosomeRadius(p)).min > 0.025,
        "ATP-hydrolyzing V1 head must remain outside the lysosomal membrane",
      );
  }
});

test("peroxisomal transport domains cross the bilayer with cytosolic heads outside", () => {
  const transporters = peroxisome.children.filter(
    (o) =>
      o.isGroup &&
      o.children.length === 8 &&
      o.children.filter((m) => m.geometry?.type === "CylinderGeometry")
        .length === 6,
  );
  assert.equal(transporters.length, 2, "check every overview transporter");
  for (const transporter of transporters) {
    const domains = transporter.children.filter(
      (m) => m.geometry.type === "CylinderGeometry",
    );
    checkSpanning(
      domains,
      (p) => peroxisomeRadiusCoordinate(p) - 0.94,
      (p) => peroxisomeRadiusCoordinate(p) - 1,
      "peroxisomal transporter",
    );
    for (const head of transporter.children.filter(
      (m) => m.geometry.type === "SphereGeometry",
    ))
      assert(
        extrema(head, (p) => peroxisomeRadiusCoordinate(p) - 1).min > -0.005,
        "transporter protrusions must stay at the cytosolic surface, not move into the matrix",
      );
  }
});

function geometryDigest(meshes) {
  const hash = createHash("sha256");
  for (const mesh of meshes) {
    hash.update(
      JSON.stringify({
        color: mesh.material.color.getHexString(),
        roughness: mesh.material.roughness,
        clearcoat: mesh.material.clearcoat,
        side: mesh.material.side,
        matrix: mesh.matrix.toArray(),
      }),
    );
    for (const key of Object.keys(mesh.geometry.attributes).sort()) {
      const a = mesh.geometry.attributes[key].array;
      hash.update(key);
      hash.update(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
    }
    const index = mesh.geometry.index?.array;
    if (index)
      hash.update(
        new Uint8Array(index.buffer, index.byteOffset, index.byteLength),
      );
  }
  return hash.digest("hex");
}
const defaultPump = protonPump(new THREE.Group());
defaultPump.updateMatrixWorld(true);
const unchanged = {
  lysosomalMembrane: geometryDigest(lysosome.children.slice(0, 5)),
  peroxisomalMembrane: geometryDigest(peroxisome.children.slice(0, 5)),
  defaultPump: geometryDigest(defaultPump.children),
};
test("smooth membrane surfaces and the default enlarged/shared pump remain unchanged", () => {
  assert.deepEqual(unchanged, {
    lysosomalMembrane:
      "16e3c660088a4aed692fa3bdcd1cfba60455eec1d8d35e31b1aedc7e40e2c9fc",
    peroxisomalMembrane:
      "0d4afecf4d00facb6ca2365035b630659baf3f3e8e46115cf06e1f588bf5a476",
    defaultPump:
      "124e16d401f5e1bbba5048bbd3da99c97653fa7a2e66e6c8943e25a7b56c1e67",
  });
});

test("rough ER labels terminate on visible membranes and ribosomes, not the central empty space", () => {
  const rough = erDetail("roughER");
  rough.updateMatrixWorld(true);
  const meshes = [];
  rough.traverse((o) => {
    if (o.isMesh) meshes.push(o);
  });
  const direction = new THREE.Vector3(
    0.05084271097105143,
    0.06609552426236684,
    0.9965171350326081,
  ).normalize();
  for (const id of ["erCisternae", "boundRibosomes"]) {
    const anchor = rough.userData.partAnchors?.[id];
    assert(
      anchor?.length === 3 && anchor.every(Number.isFinite),
      `${id}: an anatomical surface anchor must replace the empty bounding-box center`,
    );
    const point = rough.localToWorld(new THREE.Vector3(...anchor));
    for (const mode of ["whole", "section"]) {
      const ray = new THREE.Raycaster(
        point.clone().addScaledVector(direction, 10),
        direction.clone().negate(),
      );
      const hit = ray.intersectObjects(
        meshes.filter((m) => mode === "whole" || !m.userData.cap),
        false,
      )[0];
      assert.equal(
        hit?.object.userData.hitId,
        id,
        `${id}/${mode}: foreground anatomy must match its label`,
      );
      assert(
        hit.point.distanceTo(point) < 0.002,
        `${id}/${mode}: anchor must lie on the first visible surface at the default camera`,
      );
    }
  }
});

function localMitochondrialLeaf(id) {
  const group = mitochondriaDetail(id);
  group.rotation.set(0, 0, 0);
  group.updateMatrixWorld(true);
  return group;
}
function intersections(meshes, origin, direction) {
  return new THREE.Raycaster(origin, direction).intersectObjects(meshes, false);
}
function inMode(group, mode) {
  return group.children.filter((o) =>
    mode === "whole" ? !o.userData.cutOnly : !o.userData.cap,
  );
}

test("the ATP synthase cut reveals the embedded rotor and retains both stalks", () => {
  const g = localMitochondrialLeaf("atpSynthase");
  const rotor = g.getObjectByName("membrane-rotor");
  const fixed = g.getObjectByName("stationary-membrane-domain");
  const shaft = g.getObjectByName("central-shaft");
  const stalk = g.getObjectByName("peripheral-stalk");
  const crown = g.getObjectByName("stator-crown");
  const domains = g.children.filter((o) => o.name === "catalytic-domain");
  for (const part of [rotor, shaft, ...domains]) {
    const { position, normal } = part.geometry.attributes;
    const joined = new Map();
    let duplicates = 0;
    for (let i = 0; i < position.count; i++) {
      // Round only for grouping duplicate vertices at periodic seams and poles.
      const key = [position.getX(i), position.getY(i), position.getZ(i)]
        .map((v) => Math.round(v * 1e6))
        .join(",");
      const n = new THREE.Vector3().fromBufferAttribute(normal, i);
      if (joined.has(key)) {
        assert(
          n.distanceTo(joined.get(key)) < 1e-5,
          part.name + " has a hard lighting seam",
        );
        duplicates++;
      } else joined.set(key, n);
    }
    assert(duplicates > 0);
  }
  assert.equal(domains.length, 6);
  assert.equal(new Set(domains.map((o) => o.material.color.getHex())).size, 2);
  const bounds = (o) => new THREE.Box3().setFromObject(o, true);
  const head = new THREE.Box3();
  domains.forEach((domain) => head.union(bounds(domain)));
  const membrane = intersections(
    inMode(g, "whole"),
    new THREE.Vector3(-0.37, 0.02, -1),
    new THREE.Vector3(0, 0, 1),
  );
  assert(membrane.length >= 2);
  for (const domain of [rotor, fixed]) {
    assert(bounds(domain).min.z < membrane[0].point.z);
    assert(bounds(domain).max.z > membrane.at(-1).point.z);
  }
  assert(head.min.z > bounds(rotor).max.z + 0.12);
  assert(
    bounds(shaft).min.z < bounds(rotor).max.z &&
      bounds(shaft).max.z > head.min.z,
  );
  const path = stalk.geometry.parameters.path;
  assert(
    fixed.worldToLocal(path.getPoint(0)).length() < 1,
    "stator must contact its membrane domain",
  );
  assert(
    crown.worldToLocal(path.getPoint(1)).length() < 1,
    "stator must contact its crown",
  );
  const sight = new THREE.Vector3(-1, 0, 0);
  const origin = new THREE.Vector3(0.85, 0, 0);
  const whole = intersections(inMode(g, "whole"), origin, sight)[0];
  const section = intersections(inMode(g, "section"), origin, sight)[0];
  assert(whole.object.userData.cap && whole.distance + 0.2 < section.distance);
  assert.equal(section.object, rotor);
  origin.z = 0.23;
  for (const mode of ["whole", "section"])
    assert.equal(
      intersections(inMode(g, mode), origin, sight)[0].object,
      shaft,
    );
  const view = new THREE.Vector3(0.82, -0.32, 0.47).normalize();
  for (const [i, expected] of [
    [0, "catalytic-domain"],
    [1, "membrane-rotor"],
  ]) {
    const endpoint = new THREE.Vector3(...g.userData.landmarks[i].position);
    const hit = intersections(
      inMode(g, "section"),
      endpoint.addScaledVector(view, 2),
      view.clone().negate(),
    )[0];
    assert.equal(hit.object.name, expected, g.userData.landmarks[i].en);
  }
});

test("both lamellae share one inner boundary, with open lumina and matrix-facing heads", () => {
  const g = localMitochondrialLeaf("cristae");
  const sheets = inMode(g, "section").filter((o) =>
    ["matrix-face", "luminal-face"].includes(o.name),
  );
  for (const name of ["matrix-face", "luminal-face"]) {
    const patches = g.children.filter((o) => o.name === name);
    assert.equal(
      patches.length,
      2,
      "both cropped segments must form each leaflet",
    );
    const [a, b] = patches;
    const edge = (mesh) => {
      const positions = mesh.geometry.attributes.position;
      const keys = new Set();
      for (let i = 0; i < positions.count; i++)
        keys.add(
          new THREE.Vector3()
            .fromBufferAttribute(positions, i)
            .toArray()
            .map((v) => v.toFixed(5))
            .join(","),
        );
      return keys;
    };
    const first = edge(a);
    assert(
      [...edge(b)].filter((key) => first.has(key)).length >= 100,
      "whole must restore the shared crop edge",
    );
  }
  const up = new THREE.Vector3(0, 0, 1);
  for (const x of [-0.73, -0.43, -0.15]) {
    for (const y of [-0.28, 0.35]) {
      const hits = intersections(sheets, new THREE.Vector3(x, y, -0.6), up);
      assert.deepEqual(
        hits.map((h) => h.object.name),
        ["luminal-face", "matrix-face"],
      );
      assert(hits[0].point.z > 0.15, "no basal sheet may seal the lumen");
    }
    const widths = [-0.12, 0.105].map((z) => {
      const hits = intersections(
        sheets.filter((o) => o.name === "luminal-face"),
        new THREE.Vector3(x, -0.85, z),
        new THREE.Vector3(0, 1, 0),
      );
      assert.equal(hits.length, 4);
      return [
        hits[1].point.y - hits[0].point.y,
        hits[3].point.y - hits[2].point.y,
      ];
    });
    for (let i = 0; i < 2; i++)
      assert(
        widths[0][i] > 0.075 && widths[1][i] > widths[0][i] * 1.4,
        "the junction must open into a wider lamella",
      );
  }
  for (const y of [-0.28, 0.035, 0.35]) {
    const hits = intersections(sheets, new THREE.Vector3(0.8, y, -0.6), up);
    assert(
      hits[0].point.z < -0.17,
      "lamellae must return to the uncut boundary at the far end",
    );
  }
  const matrix = new THREE.Vector3(...g.userData.landmarks[0].position);
  assert.equal(
    intersections(sheets, matrix, up.clone().negate())[0].object.name,
    "matrix-face",
  );
  const lumen = new THREE.Vector3(...g.userData.landmarks[1].position);
  lumen.x += 0.11; // just inside the cropped edge at the landmark's height
  assert.equal(intersections(sheets, lumen, up.clone().negate()).length, 0);
  assert.equal(intersections(sheets, lumen, up)[0].object.name, "luminal-face");
  const heads = g.children.filter((o) => o.name === "crest-head");
  const stems = g.children.filter((o) => o.name === "crest-stem");
  assert(heads.length >= 4 && heads.length === stems.length);
  for (const stem of stems) {
    const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(stem.quaternion);
    const half = stem.geometry.parameters.height / 2;
    const hits = intersections(
      sheets,
      stem.position.clone().addScaledVector(normal, -half),
      normal,
    );
    assert.deepEqual(
      hits.slice(0, 2).map((h) => h.object.name),
      ["luminal-face", "matrix-face"],
    );
    assert(hits[1].distance < 2 * half);
    const tip = stem.position.clone().addScaledVector(normal, half);
    assert(
      heads.some((head) => head.worldToLocal(tip.clone()).length() < 1),
      "the stem must meet its matrix head",
    );
  }
});

test("batched mitochondrial leaves own their geometry and stay within the visible mesh budgets", () => {
  for (const [id, limit, triangleLimit] of [
    ["cristae", 5, 22500],
    ["atpSynthase", 9, 18000],
  ]) {
    const group = detailModel(id),
      other = detailModel(id);
    assert(group.userData.ownedGeometry);
    const owned = new Set(
      group.children.flatMap((o) => [o.geometry, o.material]),
    );
    assert(
      other.children.every(
        (o) => !owned.has(o.geometry) && !owned.has(o.material),
      ),
    );
    for (const mode of ["whole", "section"]) {
      const visible = inMode(group, mode);
      assert(visible.length > 0 && visible.length <= limit);
      assert(visible.every((o) => o.userData.hitId === id));
      const triangles = visible.reduce(
        (sum, o) =>
          sum +
          (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3,
        0,
      );
      assert(triangles <= triangleLimit);
    }
    for (const root of [group, other])
      root.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
  }
});
