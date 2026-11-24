import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "esbuild";
import * as T from "three";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";

const rootId = "rodPhotoreceptor";
const select = (group, roles) =>
  group.children.filter((mesh) => roles.includes(mesh.userData.anatomyRole));

// Weld by position across material and presentation halves. An edge must be
// used by two oppositely oriented triangles, even when the triangles live in
// different draw calls. Euler characteristic distinguishes a solid from a tube.
function checkClosed(meshes, components, euler, label) {
  assert(meshes.length, label);
  const vertices = new Map(),
    parents = [],
    edges = new Map();
  function find(i) {
    while (parents[i] !== i) {
      parents[i] = parents[parents[i]];
      i = parents[i];
    }
    return i;
  }
  function vertex(p, index) {
    const key = [p.getX(index), p.getY(index), p.getZ(index)]
      .map((n) => Math.round(n * 1e6))
      .join(",");
    if (!vertices.has(key)) {
      vertices.set(key, parents.length);
      parents.push(parents.length);
    }
    return vertices.get(key);
  }
  let faces = 0,
    volume = 0;
  const a = new T.Vector3(),
    b = new T.Vector3(),
    c = new T.Vector3(),
    cross = new T.Vector3();
  for (const mesh of meshes) {
    const p = mesh.geometry.attributes.position,
      index = mesh.geometry.index;
    const ids = Array.from({ length: p.count }, (_, i) => vertex(p, i));
    for (let i = 0; i < index.count; i += 3) {
      const ia = index.getX(i),
        ib = index.getX(i + 1),
        ic = index.getX(i + 2);
      a.fromBufferAttribute(p, ia);
      b.fromBufferAttribute(p, ib);
      c.fromBufferAttribute(p, ic);
      volume += a.dot(cross.crossVectors(b, c)) / 6;
      const triangle = [ids[ia], ids[ib], ids[ic]];
      assert.equal(
        new Set(triangle).size,
        3,
        label + " has a collapsed triangle",
      );
      for (let j = 0; j < 3; j++) {
        const u = triangle[j],
          v = triangle[(j + 1) % 3],
          key = u < v ? u + "," + v : v + "," + u;
        const edge = edges.get(key) || { uses: 0, direction: 0 };
        edge.uses++;
        edge.direction += u < v ? 1 : -1;
        edges.set(key, edge);
        parents[find(u)] = find(v);
      }
      faces++;
    }
  }
  for (const edge of edges.values()) {
    assert.equal(edge.uses, 2, label + " has an open or nonmanifold edge");
    assert.equal(edge.direction, 0, label + " has inconsistent winding");
  }
  assert.equal(
    new Set(parents.map((_, i) => find(i))).size,
    components,
    label + " component count",
  );
  assert.equal(
    vertices.size - edges.size + faces,
    euler,
    label + " Euler characteristic",
  );
  assert(volume > 0, label + " must enclose positive signed volume");
}

// The factories use specimen-local coordinates. Query the actual triangles
// before the display orientation and normalized camera framing are applied.
function rayTargets(meshes) {
  return meshes.map((source) => {
    const mesh = new T.Mesh(source.geometry, source.material);
    mesh.geometry.boundsTree ??= new MeshBVH(mesh.geometry);
    mesh.raycast = acceleratedRaycast;
    return mesh;
  });
}
function positions(meshes, visit) {
  assert(meshes.length);
  const point = new T.Vector3();
  for (const mesh of meshes) {
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) visit(point.fromBufferAttribute(p, i));
  }
}
function checkInside(group, roles, envelopeRole) {
  const shell = rayTargets(select(group, [envelopeRole])),
    ray = new T.Raycaster(),
    direction = new T.Vector3();
  ray.firstHitOnly = true;
  positions(select(group, roles), (point) => {
    // Perturb the transverse direction slightly to avoid exact cut-edge tangencies.
    ray.set(
      point,
      direction.set(0, point.y + 0.000239, point.z + 0.000173).normalize(),
    );
    const hit = ray.intersectObjects(shell, false)[0];
    assert(
      hit && hit.distance > 0.005,
      roles.join("/") + " protrudes from " + envelopeRole,
    );
  });
}
function checkCilium(group) {
  const meshes = rayTargets(select(group, ["axonemalDoublets"])),
    ray = new T.Raycaster();
  function hits(y, z) {
    ray.set(new T.Vector3(2, y, z), new T.Vector3(-1, 0, 0));
    return ray.intersectObjects(meshes, false).length;
  }
  assert.equal(hits(0, 0), 0, "no motile central pair");
  for (let i = 0; i < 9; i++) {
    const a = (2 * Math.PI * i) / 9;
    const transverse = (u) =>
      hits(
        0.79 * (0.61 * Math.cos(a) - u * Math.sin(a)),
        0.79 * (0.61 * Math.sin(a) + u * Math.cos(a)),
      );
    assert.equal(transverse(0), 0, "open A lumen");
    assert.equal(transverse(0.214), 0, "open B lumen");
    assert(
      transverse(0.146) > 0,
      "the lumina are separated by the shared wall",
    );
  }
}
function checkSpherule(group) {
  const membrane = rayTargets(select(group, ["invaginatedTerminalMembrane"])),
    ray = new T.Raycaster();
  ray.firstHitOnly = true;
  const direction = new T.Vector3(1, 0, 0),
    origin = new T.Vector3();
  function firstX(y, z) {
    ray.set(origin.set(-3, y, z), direction);
    const surface = ray.intersectObjects(membrane, false)[0];
    assert(
      surface,
      "ray from extracellular space must hit the terminal membrane",
    );
    return surface.point.x;
  }
  // At the centre, a ray from outside reaches the blind roof behind the lip.
  assert(
    firstX(0, 0) - firstX(0.385 * 2.05, 0) > 0.73,
    "spherule has an open invagination",
  );
  for (const role of ["synapticRibbon", "vesicleTethers", "ribbonVesicles"]) {
    positions(select(group, [role]), (p) => {
      const front = firstX(p.y + 1e-5, p.z + 1.5e-5);
      assert(
        p.x - front > 0.002,
        role + " must remain on the cytoplasmic side of the actual roof",
      );
    });
  }
}
function checkAnchors(api) {
  const detail = api.detailModel(rootId, api.getSpecimenModel(rootId));
  const packet = api.packDetail(detail);
  const restored = api.unpackDetail(
    structuredClone(packet.payload, { transfer: packet.buffers }),
  );
  const { root, parts } = api.makePresentation(null, rootId, restored),
    show = api.createPresentationAppearance(root);
  assert.equal(
    parts.length,
    6,
    "all registered root parts survive the worker transfer",
  );
  const eye = new T.Vector3(0.12, 0.16, 1).normalize().multiplyScalar(7);
  for (const mode of ["whole", "section", "explode"]) {
    show(mode, null, 1);
    for (const p of parts)
      p.position
        .copy(p.userData.home)
        .addScaledVector(p.userData.offset, mode === "explode" ? 0.65 : 0);
    root.updateMatrixWorld(true);
    const visible = [];
    root.traverseVisible((o) => {
      if (o.isMesh) visible.push(o);
    });
    for (const p of parts) {
      if (p.userData.visibleModes && !p.userData.visibleModes.includes(mode))
        continue;
      const anchor = p.localToWorld(p.userData.labelAnchor.clone());
      const first = new T.Raycaster(
        eye,
        anchor.clone().sub(eye).normalize(),
      ).intersectObjects(visible, false)[0];
      assert.equal(
        first?.object.userData.hitId,
        p.userData.hitId,
        mode + " anchor occluded by another part",
      );
      if (mode === "whole")
        assert(
          first.point.distanceTo(anchor) < 1e-4,
          "whole label anchor must lie on the visible front surface",
        );
    }
  }
}

const temporary = await mkdtemp(join(tmpdir(), "bioscape-rod-geometry-"));
try {
  const outfile = join(temporary, "factory.mjs");
  await build({
    stdin: {
      contents: [
        'export { getSpecimenModel } from "./src/compare/specimenModels.js";',
        'export { rodSpecimen } from "./src/compare/models/rodMetadata.js";',
        'export { detailModel } from "./src/scene/detailModels.js";',
        'export { packDetail,unpackDetail } from "./src/scene/detailTransfer.js";',
        'export { makePresentation } from "./src/scene/presentation.js";',
        'export { createPresentationAppearance } from "./src/scene/presentationAppearance.js";',
      ].join("\n"),
      resolveDir: fileURLToPath(new URL("../", import.meta.url)),
    },
    format: "esm",
    bundle: true,
    platform: "node",
    outfile,
    logLevel: "silent",
  });
  const api = await import(pathToFileURL(outfile));
  const root = api.getSpecimenModel(rootId);
  assert.equal(api.rodSpecimen.parts.length, 6);
  for (const { id } of api.rodSpecimen.parts) {
    const leaf = api.getSpecimenModel(id);
    assert(
      leaf?.isGroup && leaf.children.length && leaf.userData.ownedGeometry,
      id + " routed detail",
    );
    assert.equal(leaf.userData.specimenId, rootId);
    leaf.traverse((o) => {
      if (!o.isMesh) return;
      assert.equal(o.userData.hitId, id, id + " local pick ownership");
      for (const a of Object.values(o.geometry.attributes))
        assert(a.array.every(Number.isFinite), id + " finite geometry");
    });
  }
  checkClosed(
    select(root, [
      "outerPlasmalemma",
      "ciliaryPlasmalemma",
      "innerAndSomaMembrane",
      "invaginatedTerminalMembrane",
    ]),
    1,
    2,
    "continuous cell boundary",
  );
  checkClosed(
    select(root, ["closedDisc"]),
    29,
    58,
    "mature outer-segment discs",
  );
  checkClosed(
    select(api.getSpecimenModel("rodDiscs"), ["closedDisc"]),
    3,
    6,
    "enlarged mature discs",
  );
  checkClosed(
    select(root, ["axonemalDoublets"]),
    9,
    -18,
    "nine doublets with two bores each",
  );
  checkInside(root, ["closedDisc"], "outerPlasmalemma");
  checkInside(
    root,
    ["ellipsoidMitochondria", "myoidGolgi", "nuclearEnvelope"],
    "innerAndSomaMembrane",
  );
  checkCilium(api.getSpecimenModel("rodConnectingCilium"));
  checkSpherule(api.getSpecimenModel("rodSpherule"));
  checkAnchors(api);
  console.log(
    "Rod structure passed: six routed details, sealed mature discs, independent plasma membrane, nine shared-wall doublets, organelle containment, presynaptic invagination and worker-visible anchors.",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
