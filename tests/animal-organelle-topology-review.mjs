import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { build } from "esbuild";
import * as THREE from "three";

// The app's scene modules use extensionless imports. Bundle just these two
// assemblies in memory, retaining the same Three runtime as the geometry probe.
const compiled = await build({
  stdin: {
    contents: `
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
const { lysosomeAssembly, peroxisomeAssembly, protonPump, erDetail } =
  await import(
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
