import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { Box3, Raycaster, Vector3 } from "three";

const source = fileURLToPath(new URL("../src/scene/", import.meta.url));
const dir = await mkdtemp(join(tmpdir(), "bioscape-ciliate-nuclei-"));
const V = (...p) => new Vector3(...p);
try {
  const outfile = join(dir, "fields.mjs");
  await build({
    stdin: {
      contents: `export { parameciumDetail } from "./parameciumDetails";
        export { specimenDirection } from "./specimenViews";
        export { detailModel } from "./detailModels";`,
      resolveDir: source,
    },
    outfile,
    platform: "node",
    bundle: true,
    format: "esm",
    logLevel: "silent",
    plugins: [
      {
        name: "test-three",
        setup(builder) {
          builder.onResolve({ filter: /^three(?:\/.*)?$/ }, ({ path }) => ({
            path: import.meta.resolve(path),
            external: true,
          }));
        },
      },
    ],
  });
  const { parameciumDetail, detailModel, specimenDirection } = await import(
    pathToFileURL(outfile)
  );
  for (const id of [
    "paraMacroChromatin",
    "paraMicroChromatin",
    "paraMacroEnvelope",
    "paraMicroEnvelope",
  ]) {
    const raw = parameciumDetail(id);
    raw.updateMatrixWorld(true);
    const all = raw.children,
      macro = id.includes("Macro"),
      membrane = id.endsWith("Envelope");
    const field = raw.getObjectByName("chromatin-field");
    assert(field?.isMesh, id + " must contain local chromatin");
    assert.equal(
      Boolean(raw.getObjectByName("nucleolar-profile")),
      macro,
      id + " nucleolar context",
    );
    const boundary = raw.getObjectByName("micronuclear-boundary");
    if (!macro && !membrane) {
      assert(
        boundary?.isMesh,
        "The one-pole space needs a nuclear boundary for scale",
      );
      const nucleusBounds = new Box3().setFromObject(boundary);
      const fieldBounds = new Box3().setFromObject(field);
      const span = nucleusBounds.getSize(V());
      assert(
        nucleusBounds.max.x - fieldBounds.max.x > 0.1 * span.x,
        "an achromatic pole is visible",
      );
      assert(
        fieldBounds.min.x - nucleusBounds.min.x < 0.09 * span.x,
        "no matching empty rim at the other pole",
      );
      assert(
        fieldBounds.getSize(V()).y > 0.83 * span.y,
        "chromatin fills the body of the micronucleus",
      );
    }
    if (membrane) {
      const sheet = raw.getObjectByName("continuous-envelope");
      const normal = V(0, 0, 1).applyQuaternion(raw.quaternion);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        for (const radius of [0, 0.16, 0.34]) {
          const start = raw.localToWorld(
            V(radius * Math.cos(a), radius * Math.sin(a), 0.25),
          );
          const hits = new Raycaster(
            start,
            normal.clone().negate(),
            1e-6,
            0.5,
          ).intersectObject(sheet);
          if (radius < 0.2) assert.equal(hits.length, 0, id + " open channel");
          else {
            const depths = [...new Set(hits.map((h) => h.distance.toFixed(4)))];
            assert.equal(
              depths.length,
              4,
              id + " two membranes each have two faces",
            );
          }
        }
      }
    }
    for (const mark of raw.userData.landmarks) {
      assert(mark.zh && mark.en, id + " bilingual target");
      const aim = raw.localToWorld(V(...mark.position));
      const view = V(...specimenDirection(id)).normalize();
      const hit = new Raycaster(
        aim.clone().addScaledVector(view, 8),
        view.negate(),
      ).intersectObjects(all, false)[0];
      assert(
        hit && hit.distance >= 7.99,
        id + " hidden default landmark " + mark.en,
      );
      if (mark.en !== "Perinuclear space")
        assert(
          Math.abs(hit.distance - 8) < 0.012,
          id + " target misses its visible tissue " + mark.en,
        );
    }
    const packed = detailModel(id, raw);
    assert(
      packed.children.every((m) => m.userData.hitId === id),
      id + " selectable identity",
    );
    assert(
      packed.children.length <= 3,
      id + " batches merge across equivalent material",
    );
    packed.children.forEach((m) => {
      m.geometry.dispose();
      m.material.dispose();
    });
  }
  console.log(
    "Four P. caudatum nuclear views passed polarity, nuclear context, pore topology, landmark and picking checks.",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
